import test from 'node:test';
import assert from 'node:assert/strict';
import { providerVideo, inspectMp4 } from '../media.mjs';
import { cleanMarkdown, preparePosts } from '../lib.mjs';
import config from '../config.json' with { type: 'json' };

const attachment = 'https://github.com/user-attachments/assets/11111111-1111-1111-1111-111111111111';
const category = { id: 'BLOG', name: 'Blog', slug: 'blog', isAnswerable: false };
const snapshot = body => ({ repository: config.repository, complete: true, category, discussions: [{ number: 123, title: 'Media test', body, category, author: config.authors[0], createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', url: `https://github.com/${config.repository}/discussions/123` }] });
const box = (name, ...parts) => { const data = Buffer.concat(parts), header = Buffer.alloc(8); header.writeUInt32BE(data.length + 8); header.write(name, 4); return Buffer.concat([header, data]); };
function mp4({ rotated = false, codec = 'avc1' } = {}) {
  const tkhd = Buffer.alloc(84); tkhd.writeUInt32BE(1920 * 65536, 76); tkhd.writeUInt32BE(1080 * 65536, 80);
  if (rotated) { tkhd.writeInt32BE(65536, 44); tkhd.writeInt32BE(-65536, 52); }
  const handler = Buffer.alloc(12); handler.write('vide', 8);
  const count = Buffer.alloc(8); count.writeUInt32BE(1, 4);
  return Buffer.concat([box('ftyp', Buffer.from('isom\0\0\0\0isomavc1')), box('moov', box('trak', box('tkhd', tkhd), box('mdia', box('hdlr', handler), box('minf', box('stbl', box('stsd', count, box(codec))))))), box('mdat')]);
}
const videoResponse = bytes => new Response(bytes, { headers: { 'content-type': 'video/mp4' } });

test('known YouTube and Vimeo URLs produce fixed privacy-conscious embed origins', () => {
  for (const url of ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://m.youtube.com/shorts/dQw4w9WgXcQ']) assert.equal(providerVideo(url).src, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  assert.equal(providerVideo('https://vimeo.com/76979871').src, 'https://player.vimeo.com/video/76979871?dnt=1');
  assert.equal(providerVideo('https://vimeo.com/76979871/abcdef1234').src, 'https://player.vimeo.com/video/76979871?dnt=1&h=abcdef1234');
});

test('provider hosts, credentials, protocols, paths, IDs and private hashes are validated', () => {
  for (const url of ['https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ', 'https://youtube.com@evil.example/watch?v=dQw4w9WgXcQ', 'http://youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com:444/watch?v=dQw4w9WgXcQ', 'https://youtube.com/watch?v=bad', 'https://vimeo.com/0', 'https://vimeo.com/76979871?h=bad%22%3E', 'https://example.com/movie.mp4', 'javascript:alert(1)']) assert.equal(providerVideo(url), null, url);
});

test('MP4 bytes, codec, dimensions and rotated phone tracks are inspected', () => {
  assert.deepEqual(inspectMp4(mp4()), { width: 1920, height: 1080 });
  assert.deepEqual(inspectMp4(mp4({ rotated: true })), { width: 1080, height: 1920 });
  assert.throws(() => inspectMp4(mp4({ codec: 'hvc1' })), /H.264/);
  assert.throws(() => inspectMp4(mp4().subarray(0, 100)));
  assert.throws(() => inspectMp4(Buffer.from('<html>Not a video</html>')));
});

test('public MP4 is localized once, reserves dimensions and has a permanent source fallback', async () => {
  let calls = 0;
  const result = await preparePosts(snapshot(`${attachment}\n\n${attachment}`), config, { fetcher: async (url, options) => {
    calls++; assert.equal(String(url), attachment); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'manual'); assert(!options.headers.Authorization); return videoResponse(mp4());
  } });
  assert.equal(calls, 1); assert.equal(result.assets.size, 1);
  const html = result.posts[0].html;
  assert.equal((html.match(/<video /g) || []).length, 2); assert(html.includes('controls preload="metadata" playsinline width="1920" height="1080"')); assert(html.includes('src="media/')); assert(html.includes('Open original video')); assert(!html.includes('autoplay')); assert(!html.includes('<p><figure'));
});

test('non-video attachments, private failures, MIME spoofing and oversized uploads stay safe links', async () => {
  const warn = console.warn, warnings = []; console.warn = message => warnings.push(message);
  try {
    for (const response of [new Response('PNG', { headers: { 'content-type': 'image/png' } }), new Response(null, { status: 403 }), videoResponse(Buffer.from('<script>alert(1)</script>')), new Response(null, { headers: { 'content-type': 'video/mp4', 'content-length': 101 * 1024 * 1024 } })]) {
      const { posts, assets } = await preparePosts(snapshot(attachment), config, { fetcher: async () => response });
      assert(!posts[0].html.includes('<video')); assert(posts[0].html.includes(`href="${attachment}"`)); assert.equal(assets.size, 0);
    }
    assert.equal(warnings.length, 4);
  } finally { console.warn = warn; }
});

test('every redirect must remain on an existing trusted GitHub media host', async () => {
  let calls = 0; const warn = console.warn; console.warn = () => {};
  try {
    const result = await preparePosts(snapshot(attachment), config, { fetcher: async () => { calls++; return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } }); } });
    assert.equal(calls, 1); assert(!result.posts[0].html.includes('<video'));
  } finally { console.warn = warn; }
});

test('only standalone provider URLs embed; prose, code, ordinary and named links remain intact', async () => {
  const body = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5\n\nhttps://vimeo.com/76979871\n\nhttps://example.com/article\n\n[Watch](https://youtu.be/dQw4w9WgXcQ)\n\nHere is https://youtu.be/dQw4w9WgXcQ in a sentence.\n\n```\nhttps://youtu.be/dQw4w9WgXcQ\n```\n\n<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>\n\n<video src="https://evil.example/video.mp4" autoplay></video>';
  const { posts } = await preparePosts(snapshot(body), config, { fetcher: () => { throw new Error('Provider embeds must not make build-time requests.'); } });
  const html = posts[0].html;
  assert.equal((html.match(/<iframe /g) || []).length, 2); assert(html.includes('youtube-nocookie.com/embed/')); assert(html.includes('dnt=1')); assert(html.includes('loading="lazy"')); assert(html.includes('href="https://example.com/article"')); assert(html.includes('>Watch</a>')); assert(html.includes('in a sentence.')); assert(html.includes('<pre><code>https://')); assert(!html.includes('<video')); assert(!html.includes('evil.example'));
  assert(!cleanMarkdown(body, 'https://github.com/').includes('<iframe'));
});

test('standard Markdown and GitHub HTML images keep localization, captions and dimensions', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=', 'base64');
  const { posts, assets } = await preparePosts(snapshot(`![Optional caption](${attachment})\n\n<img alt="GitHub image" src="${attachment}">`), config, { fetcher: async () => new Response(png, { headers: { 'content-type': 'image/png' } }) });
  assert.equal(assets.size, 1); assert(posts[0].html.includes('<figcaption>Optional caption</figcaption>')); assert(posts[0].html.includes('width="1" height="1" loading="lazy"')); assert.equal((posts[0].html.match(/<figure /g) || []).length, 2);
});
