import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { selectPosts, parseEditorial, cleanMarkdown, preparePosts, renderBlog, fetchSnapshot, downloadImage, copyPublicSite, writeBlog } from '../lib.mjs';
import config from '../config.json' with { type: 'json' };

const category = { id: 'BLOG_CATEGORY', name: 'Blog', slug: 'blog', isAnswerable: false };
const article = (number, overrides = {}) => ({ id: `D_${number}`, number, title: `Article ${number}`, body: 'A technical note.\n\n## System\n\nUseful details.', createdAt: '2026-10-01T12:00:00Z', updatedAt: '2026-10-01T12:00:00Z', url: `https://github.com/${config.repository}/discussions/${number}`, author: { login: 'Nerawo', databaseId: 139722312 }, category, ...overrides });
const snapshot = discussions => ({ repository: config.repository, complete: true, category, discussions });
const imageUrl = 'https://github.com/user-attachments/assets/11111111-1111-1111-1111-111111111111';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=', 'base64');
const imageFetch = async (url, options) => { assert.equal(options.credentials, 'omit'); assert.equal(options.headers.Authorization, undefined); return new Response(png, { headers: { 'content-type': 'image/png' } }); };
const index = '<header class="site-header"><a class="wordmark" href="#top">Lu Zhang</a><nav aria-label="Primary navigation"><a href="work.html">Work</a><a href="blog.html">Blog</a><button class="theme-toggle"></button><details class="resume-menu"><summary>Resume</summary><div class="resume-options"><a data-resume="en" href="file/resume/Lu_Zhang_Resume_02.pdf">English</a></div></details></nav></header>';

test('only configured immutable author identity and exact category are published; replies ignored', () => {
  const nodes = [article(1), article(2, { author: { login: 'other', databaseId: 2 } }), article(3, { category: { id: 'OTHER', slug: 'blog' } }), article(4, { author: { login: 'Nerawo', databaseId: 2 } }), article(5, { author: null }), article(6, { comments: [{ author: { login: 'other' }, body: 'Never publish this reply' }] })];
  assert.deepEqual(selectPosts(snapshot(nodes), config).map(p => p.number), [6, 1]);
});

test('create, edit, delete, move in/out and rename all use a fresh stable-number snapshot', async () => {
  const output = async nodes => renderBlog(await preparePosts(snapshot(nodes), config), config, index);
  const first = await output([article(10)]); assert(first.has('blog/10.html'));
  const added = await output([article(10), article(11, { createdAt: '2026-10-02T12:00:00Z' })]); assert(added.get('blog.html').indexOf('Article 11') < added.get('blog.html').indexOf('Article 10'));
  const edited = await output([article(10, { title: 'New title', body: 'New body', updatedAt: '2026-10-03T12:00:00Z' })]); assert(edited.has('blog/10.html')); assert(edited.get('blog/10.html').includes('New body')); assert(edited.get('blog/10.html').includes('Updated')); assert(!edited.has('blog/11.html'));
  const movedOut = await output([article(10, { category: { id: 'OTHER', slug: 'other' } })]); assert(!movedOut.has('blog/10.html')); assert(movedOut.get('blog.html').includes('No posts yet.'));
  const movedIn = await output([article(10)]); assert(movedIn.has('blog/10.html'));
  assert(!(await output([])).has('blog/10.html'));
});

test('incomplete snapshots and category or repository mismatches fail closed', () => {
  assert.throws(() => selectPosts({ ...snapshot([]), complete: false }, config));
  assert.throws(() => selectPosts({ ...snapshot([]), repository: 'other/repo' }, config));
  assert.throws(() => selectPosts({ ...snapshot([]), category: { ...category, isAnswerable: true } }, config));
  assert.throws(() => selectPosts(snapshot([article(1), article(1)]), config));
  assert.throws(() => selectPosts(snapshot([article('../escape')]), config));
});

test('optional plain summary and cover need no front matter or code editing', () => {
  const parsed = parseEditorial(`<!-- blog\nsummary: Brief note\ncover: ${imageUrl}\n-->\n\n# Heading`);
  assert.equal(parsed.summary, 'Brief note'); assert.equal(parsed.cover, imageUrl); assert.equal(parsed.markdown, '# Heading');
  assert.equal(parseEditorial('Ordinary Markdown').markdown, 'Ordinary Markdown');
});

test('Markdown keeps structure, links and escaped code; scripts, handlers and arbitrary HTML cannot execute', () => {
  const html = cleanMarkdown('# Heading\n\n- Item\n\n> Quote\n\n[normal](https://example.com) [anchor](#heading) [bad](javascript:alert%281%29)\n\n```js\n<script>alert("literal code")</script>\n```\n\n<script>alert("execute")</script>\n\n<iframe src="https://evil.example"></iframe>\n\n<img src="https://github.com/user-attachments/assets/11111111-1111-1111-1111-111111111111" onerror="alert(1)">', article(1).url);
  assert(html.includes('<h2 id="heading">')); assert(html.includes('<ul>')); assert(html.includes('<blockquote>')); assert(html.includes('href="https://example.com/"')); assert(html.includes('href="#heading"'));
  assert(html.includes('&lt;script&gt;')); assert(!html.includes('<script')); assert(!html.includes('<iframe')); assert(!html.includes('onerror')); assert(!html.includes('href="javascript:'));
});

test('anonymous GitHub uploads are localized, measured and deduplicated, including normal GitHub HTML img', async () => {
  let calls = 0;
  const p = article(1, { body: `<!-- blog\ncover: ${imageUrl}\n-->\n\nAn example.\n\n![Technical image](${imageUrl})\n\n<img src="${imageUrl}" width="1" alt="Screenshot">` });
  const result = await preparePosts(snapshot([p]), config, { fetcher: async (...args) => { calls++; return imageFetch(...args); } });
  assert.equal(calls, 1); assert.equal(result.assets.size, 1); assert.equal(result.posts[0].cover.width, 1); assert(result.posts[0].html.includes('src="media/')); assert(!result.posts[0].html.includes('user-attachments')); assert(!/<p>\s*<figure/.test(result.posts[0].html));
});

test('private, HTML, untrusted-host and unsafe-redirect image responses stop the build', async () => {
  await assert.rejects(downloadImage('https://private-user-images.githubusercontent.com/image?token=secret'));
  await assert.rejects(downloadImage('http://127.0.0.1/a.png'));
  await assert.rejects(downloadImage(imageUrl, { fetcher: async () => new Response('<html>Login</html>') }));
  await assert.rejects(downloadImage(imageUrl, { fetcher: async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } }) }));
});

test('pagination reads the complete category and only backend calls receive token', async () => {
  let pages = 0;
  const fetcher = async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer ONLY-IN-BUILD');
    if (String(url).endsWith('/portfolio-2026')) return Response.json({ id: config.repositoryId, full_name: config.repository, private: false, has_discussions: true });
    const payload = JSON.parse(options.body);
    assert(!payload.query.includes('comments'));
    if (payload.query.includes('discussionCategories')) return Response.json({ data: { repository: { discussionCategories: { nodes: [category], pageInfo: { hasNextPage: false } } } } });
    pages++; return Response.json({ data: { repository: { discussions: { nodes: [article(pages)], pageInfo: { hasNextPage: pages === 1, endCursor: pages === 1 ? 'next' : null } } } } });
  };
  const result = await fetchSnapshot(config, 'ONLY-IN-BUILD', { fetcher, categoryId: undefined });
  assert.equal(result.discussions.length, 2); assert.equal(pages, 2);
  const pagesHtml = renderBlog(await preparePosts(result, config), config, index);
  assert(![...pagesHtml.values()].join('').includes('ONLY-IN-BUILD'));
});

test('disabled Discussions and partial API errors fail rather than deploy an empty blog', async () => {
  await assert.rejects(fetchSnapshot(config, 'test', { fetcher: async () => Response.json({ id: config.repositoryId, full_name: config.repository, private: false, has_discussions: false }) }), /disabled/);
  await assert.rejects(fetchSnapshot(config, ''), /GITHUB_TOKEN/);
});

test('site staging preserves portfolio bytes, excludes tools and secrets, produces an empty state', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-blog-test-'));
  try {
    const source = path.join(temp, 'source'), output = path.join(temp, 'dist');
    for (const dir of ['projects', 'file', 'tools']) await fs.mkdir(path.join(source, dir), { recursive: true });
    await fs.writeFile(path.join(source, 'index.html'), index); await fs.writeFile(path.join(source, 'work.html'), 'UNCHANGED WORK'); await fs.writeFile(path.join(source, 'projects/one.html'), 'UNCHANGED DETAIL'); await fs.writeFile(path.join(source, 'tools/private.json'), 'NOT PUBLIC'); await fs.writeFile(path.join(source, '.env'), 'SECRET'); await fs.writeFile(path.join(source, 'file/original.source.mp4'), 'SOURCE');
    await copyPublicSite(source, output); await writeBlog(output, { posts: [], assets: new Map() }, config, index);
    assert.equal(await fs.readFile(path.join(output, 'work.html'), 'utf8'), 'UNCHANGED WORK'); assert.equal(await fs.readFile(path.join(output, 'projects/one.html'), 'utf8'), 'UNCHANGED DETAIL'); assert((await fs.readFile(path.join(output, 'blog.html'), 'utf8')).includes('No posts yet.'));
    for (const name of ['.env', 'tools', 'file/original.source.mp4']) await assert.rejects(fs.stat(path.join(output, name)));
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
