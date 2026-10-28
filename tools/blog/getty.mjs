import sanitize from 'sanitize-html';

export function gettyVideo(source) {
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !['gettyimages.com', 'www.gettyimages.com'].includes(url.hostname)) return null;
    const id = url.pathname.match(/^\/detail\/video\/[^/]+\/([1-9]\d{0,19}(?:-\d{1,10})?)\/?$/)?.[1];
    return id ? { id, url } : null;
  } catch { return null; }
}

function thumbnailUrl(source, id) {
  try {
    const url = new URL(source);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && url.hostname === 'media.gettyimages.com' && url.pathname.startsWith(`/id/${id}/video/`) && /\.(?:jpe?g|png|webp|avif)$/i.test(url.pathname) ? url.href : null;
  } catch { return null; }
}

// Read public Open Graph metadata only. No private endpoints, video URLs,
// cookies, challenge retries, guessed CDN URLs, or downloaded media assets.
export async function gettyThumbnail(source, { fetcher = fetch } = {}) {
  const video = gettyVideo(source);
  if (!video) return null;
  let url = video.url;
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetcher(url, { redirect: 'manual', credentials: 'omit', signal: AbortSignal.timeout(8000), headers: { Accept: 'text/html', 'User-Agent': 'portfolio-blog-public-preview-check' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location'); await response.body?.cancel();
      const next = location && gettyVideo(new URL(location, url).href);
      if (!next || next.id !== video.id) return null;
      url = next.url; continue;
    }
    const limit = 2 * 1024 * 1024;
    if (!response.ok || !response.headers.get('content-type')?.toLowerCase().startsWith('text/html') || Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); return null; }
    const chunks = []; let size = 0;
    for await (const chunk of response.body) { size += chunk.length; if (size > limit) { await response.body?.cancel().catch(() => {}); return null; } chunks.push(chunk); }
    const candidates = [];
    sanitize(Buffer.concat(chunks).toString('utf8'), { allowedTags: ['meta'], allowedAttributes: { meta: ['property', 'name', 'content'] }, transformTags: { meta: (tagName, attrs) => {
      if (['og:image', 'og:image:secure_url', 'twitter:image'].includes(attrs.property || attrs.name)) {
        const image = thumbnailUrl(attrs.content, video.id); if (image) candidates.push(image);
      }
      return { tagName, attribs: attrs };
    } } });
    for (const candidate of [...new Set(candidates)]) {
      const image = await fetcher(candidate, { method: 'HEAD', redirect: 'manual', credentials: 'omit', signal: AbortSignal.timeout(8000), headers: { Accept: 'image/*' } });
      const type = image.headers.get('content-type');
      // Some public Getty CDN HEAD responses omit MIME; normal browser image decoding still validates display.
      const valid = image.ok && (!type || /^image\/(?:jpeg|png|webp|avif)(?:;|$)/i.test(type));
      await image.body?.cancel();
      if (valid) return candidate;
    }
    return null;
  }
  return null;
}
