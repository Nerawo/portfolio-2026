import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { preparePosts, renderBlog, cleanMarkdown } from '../lib.mjs';
import { testVideo } from './video-fixtures.mjs';
import config from '../config.json' with { type: 'json' };

const markdown = await fs.readFile(new URL('./fixtures/post-04-video.md', import.meta.url), 'utf8');
const source = 'https://github.com/user-attachments/assets/626698e6-0301-4cc5-bd5f-9551096e0ff4';
const redirected = 'https://github-production-user-asset-6210df.s3.amazonaws.com/139722312/695556232-626698e6-0301-4cc5-bd5f-9551096e0ff4.mp4';
const category = { id: 'BLOG', name: 'Blog', slug: 'blog', isAnswerable: false };
const snapshot = body => ({ repository: config.repository, complete: true, category, discussions: [{ number: 4, title: 'Oct. 30th, 2026 - Post 04', body, category, author: config.authors[0], createdAt: '2026-11-04T00:00:00Z', updatedAt: '2026-11-05T00:39:24Z', url: `https://github.com/${config.repository}/discussions/4` }] });

test('actual Post 04 Markdown and GitHub redirect render HEVC as a localized H.264 player', async () => {
  const upload = await testVideo({ codec: 'hevc', audio: 'aac', width: 1280, height: 720 });
  for (const body of [markdown, markdown.replaceAll('\n', '\r\n')]) {
    const calls = [];
    const prepared = await preparePosts(snapshot(body), config, { fetcher: async (url, options) => {
      assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'manual'); assert(!options.headers.Authorization);
      calls.push(String(url));
      if (String(url) === source) return new Response(null, { status: 302, headers: { location: redirected } });
      assert.equal(String(url), redirected);
      return new Response(upload, { headers: { 'content-type': 'video/mp4' } });
    } });
    assert.deepEqual(calls, [source, redirected]); assert.equal(prepared.assets.size, 1);
    const html = prepared.posts[0].html;
    assert(html.includes('controls preload="metadata" playsinline width="1280" height="720"'));
    assert(html.includes(`href="${source}"`)); assert(!html.includes(`>${source}</a>`));
    const quote = cleanMarkdown(body, prepared.posts[0].url).match(/<blockquote>[\s\S]*?<\/blockquote>/)[0];
    assert(html.includes(quote)); assert.equal(prepared.posts[0].body, body);
    const article = renderBlog(prepared, config, '<header class="site-header"></header>').get('blog/4.html');
    const src = article.match(/<video[^>]+src="([^"]+)"/)[1];
    assert.match(src, /^media\/[a-f0-9]{64}\.mp4$/);
    assert.equal(new URL(src, config.siteUrl+'blog/4.html').pathname, '/portfolio-2026/blog/'+src);
  }
});

test('the same Post 04 Markdown keeps compatible H.264 bytes unchanged', async () => {
  const upload = await testVideo({ width: 1280, height: 720 });
  const prepared = await preparePosts(snapshot(markdown), config, { fetcher: async () => new Response(upload, { headers: { 'content-type': 'video/mp4' } }) });
  assert.equal(prepared.assets.size, 1); assert.deepEqual([...prepared.assets.values()][0], upload);
  assert(prepared.posts[0].html.includes('controls preload="metadata" playsinline width="1280" height="720"'));
  assert(prepared.posts[0].html.includes('Open original video ↗')); assert(!prepared.posts[0].html.includes('autoplay'));
});
