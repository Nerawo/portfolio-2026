import crypto from 'node:crypto';
import sanitize from 'sanitize-html';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const githubAsset = url => url.hostname === 'github.com' && /^\/user-attachments\/assets\/[a-f0-9-]+\/?$/i.test(url.pathname);

function secureUrl(source) {
  try {
    const url = new URL(source);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port ? url : null;
  } catch { return null; }
}

// Construct embeds from parsed IDs, never from author-supplied HTML or iframe URLs.
export function providerVideo(source) {
  const url = secureUrl(source);
  if (!url) return null;
  const host = url.hostname;
  let id;
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = url.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
  } else if (host === 'youtu.be') id = url.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
  if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { name: 'YouTube', id, src: `https://www.youtube-nocookie.com/embed/${id}` };
  if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const match = url.pathname.match(host === 'player.vimeo.com' ? /^\/video\/(\d{1,12})\/?$/ : /^\/(\d{1,12})(?:\/([a-f0-9]{6,64}))?\/?$/i);
    if (!match || /^0+$/.test(match[1])) return null;
    const hash = match[2] || url.searchParams.get('h');
    if (hash && !/^[a-f0-9]{6,64}$/i.test(hash)) return null;
    return { name: 'Vimeo', src: `https://player.vimeo.com/video/${match[1]}?dnt=1${hash ? `&h=${hash}` : ''}` };
  }
  return null;
}

// Bounded ISO-BMFF inspection: MIME alone is insufficient for extensionless uploads.
function boxes(bytes, start = 0, end = bytes.length) {
  const result = [];
  while (start < end) {
    if (end - start < 8) throw new Error('Truncated MP4 box.');
    let size = bytes.readUInt32BE(start), header = 8;
    if (size === 1) { if (end - start < 16) throw new Error('Truncated MP4 size.'); size = Number(bytes.readBigUInt64BE(start + 8)); header = 16; }
    if (size === 0) size = end - start;
    if (!Number.isSafeInteger(size) || size < header || size > end - start) throw new Error('Invalid MP4 box.');
    if (result.length >= 10000) throw new Error('Too many MP4 boxes.');
    result.push({ type: bytes.toString('ascii', start + 4, start + 8), start: start + header, end: start + size });
    start += size;
  }
  return result;
}

export function inspectMp4(bytes) {
  const top = boxes(bytes), ftyp = top.find(b => b.type === 'ftyp'), moov = top.find(b => b.type === 'moov');
  if (!ftyp || ftyp.end - ftyp.start < 8 || !moov || !top.some(b => b.type === 'mdat')) throw new Error('Not a complete MP4.');
  const brands = [bytes.toString('ascii', ftyp.start, ftyp.start + 4)];
  for (let p = ftyp.start + 8; p + 4 <= ftyp.end; p += 4) brands.push(bytes.toString('ascii', p, p + 4));
  if (!brands.some(b => /^(?:isom|iso[2-9]|mp4[12]|avc1|M4V )$/.test(b))) throw new Error('Unsupported MP4 brand.');
  const children = box => boxes(bytes, box.start, box.end);
  for (const track of children(moov).filter(b => b.type === 'trak')) {
    const nodes = children(track), tkhd = nodes.find(b => b.type === 'tkhd'), mdia = nodes.find(b => b.type === 'mdia');
    if (!tkhd || !mdia) continue;
    const media = children(mdia), hdlr = media.find(b => b.type === 'hdlr'), minf = media.find(b => b.type === 'minf');
    if (!hdlr || hdlr.end - hdlr.start < 12 || bytes.toString('ascii', hdlr.start + 8, hdlr.start + 12) !== 'vide' || !minf) continue;
    const stbl = children(minf).find(b => b.type === 'stbl');
    const stsd = stbl && children(stbl).find(b => b.type === 'stsd');
    if (!stsd || stsd.end - stsd.start < 8 || bytes.readUInt32BE(stsd.start + 4) !== 1) throw new Error('Unsupported video sample descriptions.');
    const samples = boxes(bytes, stsd.start + 8, stsd.end);
    // H.264 is the conservative browser-compatible MP4 option. Other codecs retain a link.
    if (samples.length !== 1 || !['avc1', 'avc3'].includes(samples[0].type)) throw new Error('Use an H.264 MP4 for web playback.');
    const version = bytes[tkhd.start];
    if (![0, 1].includes(version) || tkhd.end - tkhd.start !== (version ? 96 : 84)) throw new Error('Invalid video dimensions.');
    let width = bytes.readUInt32BE(tkhd.end - 8) / 65536, height = bytes.readUInt32BE(tkhd.end - 4) / 65536;
    // tkhd's transformation matrix can rotate a phone recording by 90 degrees.
    const matrix = tkhd.end - 44;
    if (bytes.readInt32BE(matrix) === 0 && Math.abs(bytes.readInt32BE(matrix + 4)) === 65536 && Math.abs(bytes.readInt32BE(matrix + 12)) === 65536 && bytes.readInt32BE(matrix + 16) === 0) [width, height] = [height, width];
    if (!(width > 0 && height > 0 && width <= 16384 && height <= 16384 && width * height <= 100_000_000)) throw new Error('Invalid video dimensions.');
    return { width, height };
  }
  throw new Error('No supported video track.');
}

async function downloadVideo(source, { fetcher, permittedUrl }) {
  let url = secureUrl(source);
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (!url || !permittedUrl(url)) throw new Error('Untrusted attachment destination.');
    const response = await fetcher(url, { redirect: 'manual', credentials: 'omit', signal: AbortSignal.timeout(30_000), headers: { Accept: 'video/mp4', 'User-Agent': 'portfolio-public-video-check' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location'); await response.body?.cancel();
      if (!location) throw new Error('Missing attachment redirect.');
      url = secureUrl(new URL(location, url).href); continue;
    }
    const max = 100 * 1024 * 1024;
    if (!response.ok || response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'video/mp4' || Number(response.headers.get('content-length')) > max) {
      await response.body?.cancel(); throw new Error('Attachment is unavailable, too large, or not an MP4.');
    }
    const chunks = []; let length = 0;
    for await (const chunk of response.body) { length += chunk.length; if (length > max) throw new Error('MP4 exceeds 100 MB.'); chunks.push(chunk); }
    const buffer = Buffer.concat(chunks), dimensions = inspectMp4(buffer);
    return { buffer, ...dimensions, filename: `${crypto.createHash('sha256').update(buffer).digest('hex')}.mp4` };
  }
  throw new Error('Too many attachment redirects.');
}

function standaloneMediaLink(link) {
  let source, label = '';
  sanitize(link, { allowedTags: ['a'], allowedAttributes: { a: ['href'] }, transformTags: { a: (tagName, attribs) => { source = attribs.href; return { tagName, attribs }; } }, textFilter: text => { label += text; return text; } });
  const url = secureUrl(source);
  if (!url || !label || secureUrl(label.replaceAll('&amp;', '&'))?.href !== url.href) return null;
  const provider = providerVideo(source);
  return provider || githubAsset(url) ? { source, url, provider } : null;
}

// A Markdown soft break keeps a URL in the preceding paragraph. Split only
// complete media-link lines, outside inline formatting; never split prose links.
function separateMediaLines(html) {
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (paragraph, inside) => {
    const output = [], pending = []; let depth = 0, changed = false;
    const flush = () => { if (pending.join('\n').trim()) output.push('<p>' + pending.join('\n') + '</p>'); pending.length = 0; };
    for (const line of inside.split(/\r?\n/)) {
      if (depth === 0 && /^<a\b[^>]*>[^<]*<\/a>$/.test(line.trim()) && standaloneMediaLink(line.trim())) {
        flush(); output.push('<p>' + line.trim() + '</p>'); changed = true;
      } else {
        pending.push(line);
        for (const [tag] of line.matchAll(/<\/?(?:a|strong|em|del|code)\b[^>]*>/g)) depth += tag.startsWith('</') ? -1 : 1;
      }
    }
    flush(); return changed ? output.join('\n') : paragraph;
  });
}

export async function renderMediaLinks(html, { fetcher, permittedUrl, assets, cache, warn = console.warn }) {
  html = separateMediaLines(html);
  for (const [paragraph, link] of [...html.matchAll(/<p>\s*(<a\b[^>]*>[^<]*<\/a>)\s*<\/p>/g)]) {
    const candidate = standaloneMediaLink(link);
    if (!candidate) continue;
    const { source, url, provider } = candidate;
    const fallback = `<figcaption><a href="${escape(source)}" rel="noopener noreferrer" data-blog-ui="videoSource">Open original video ↗</a></figcaption>`;
    if (provider?.name === 'YouTube') {
      html = html.replace(paragraph, `<figure class="blog-figure blog-video"><div class="blog-embed blog-youtube" data-youtube-id="${provider.id}"><button class="blog-youtube-play" type="button" aria-label="Play YouTube video"><img src="https://i.ytimg.com/vi/${provider.id}/hq720.jpg" alt="" width="1280" height="720" loading="lazy" referrerpolicy="no-referrer"><span class="blog-youtube-play-icon" aria-hidden="true"></span></button></div>${fallback}</figure>`);
    } else if (provider) {
      html = html.replace(paragraph, `<figure class="blog-figure blog-video"><div class="blog-embed"><iframe src="${escape(provider.src)}" title="${provider.name} video player" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></div>${fallback}</figure>`);
    } else if (githubAsset(url)) {
      if (!cache.has(source)) cache.set(source, downloadVideo(source, { fetcher, permittedUrl }).catch(error => { warn(`Blog attachment kept as a link (${url.pathname}): ${error.message}`); return null; }));
      const video = await cache.get(source);
      if (!video) continue;
      assets.set(video.filename, video.buffer);
      html = html.replace(paragraph, `<figure class="blog-figure blog-video"><video controls preload="metadata" playsinline width="${video.width}" height="${video.height}" src="media/${video.filename}"></video>${fallback}</figure>`);
    }
  }
  return html;
}
