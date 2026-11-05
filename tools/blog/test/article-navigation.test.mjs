import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePosts, renderBlog } from '../lib.mjs';
import { publishedPreview } from '../preview.mjs';
import config from '../config.json' with { type: 'json' };

const category = { id: 'BLOG', name: 'Blog', slug: 'blog', isAnswerable: false };
const header = '<header class="site-header"><a href="index.html">Lu Zhang</a></header>';
const post = (number, day) => ({ number, title: `Article ${number}`, body: 'Original prose.', createdAt: `2026-10-${day}T12:00:00Z`, updatedAt: `2026-11-05T12:00:00Z`, author: config.authors[0], category, url: `https://github.com/${config.repository}/discussions/${number}` });
const prepare = discussions => preparePosts({ repository: config.repository, complete: true, category, discussions }, config);

test('Next follows newest-to-oldest listing order, not IDs, modification times or title changes', async () => {
  const prepared = await prepare([post(18, '01'), post(2, '03'), post(47, '02')]);
  assert.deepEqual(prepared.posts.map(p => p.number), [2, 47, 18]);
  const before = JSON.stringify(prepared.posts), pages = renderBlog(prepared, config, header);
  assert.equal(JSON.stringify(prepared.posts), before);
  const listed = [...pages.get('blog.html').matchAll(/<h2><a href="blog\/([^" ]+)"/g)].map(m => m[1]);
  assert.deepEqual(listed, ['2.html', '47.html', '18.html']);
  for (let i = 0; i < listed.length; i++) {
    const html = pages.get('blog/' + listed[i]), footer = html.match(/<div class="blog-article-bottom">([\s\S]*?)<\/div>/)[1];
    assert(footer.startsWith('<a href="../blog.html" data-blog-ui="back">← All articles</a>'));
    assert(!footer.includes('github.com')); assert(!html.includes('Read on GitHub'));
    assert(html.includes(`data-discussion-url="${prepared.posts[i].url}"`));
    assert(html.includes(`rel="canonical" href="${config.siteUrl}blog/${listed[i]}"`));
    if (listed[i + 1]) assert(footer.includes(`href="${listed[i + 1]}" rel="next" data-blog-ui="next">Next Article →</a>`));
    else assert.equal((footer.match(/<a /g) || []).length, 1);
  }
  prepared.posts[0].title = 'Renamed title';
  assert(renderBlog(prepared, config, header).get('blog/2.html').includes('href="47.html" rel="next"'));
});

test('ties, deletion and category removal update the navigation without broken or placeholder links', async () => {
  const first = post(12, '03'), second = post(6, '03'), oldest = post(39, '01');
  const prepared = await prepare([oldest, second, first]);
  assert.deepEqual(prepared.posts.map(p => p.number), [12, 6, 39]);
  const pages = renderBlog(await prepare([oldest, first, { ...second, category: { id: 'OTHER', slug: 'other' } }]), config, header);
  assert(pages.get('blog/12.html').includes('href="39.html" rel="next"')); assert(!pages.has('blog/6.html'));
  const single = renderBlog(await prepare([oldest]), config, header).get('blog/39.html');
  assert(!single.includes('rel="next"')); assert(!single.includes('Next Article')); assert(!single.includes('Read on GitHub'));
});

test('published local preview accepts the new nonvisible Discussion metadata and rejects missing or wrong sources', async () => {
  const pages = renderBlog(await prepare([post(2, '03'), post(47, '02')]), config, header);
  const fetcher = async url => new Response(pages.get(url.pathname.replace('/portfolio-2026/', '')));
  const mirrored = await publishedPreview({ fetcher });
  assert.deepEqual(mirrored.posts.map(p => p.number), [2, 47]);
  assert.equal(mirrored.posts[0].url, `https://github.com/${config.repository}/discussions/2`);
  for (const replacement of ['', 'https://github.com/other/repo/discussions/2']) {
    await assert.rejects(publishedPreview({ fetcher: async url => new Response(pages.get(url.pathname.replace('/portfolio-2026/', '')).replace(/data-discussion-url="[^"]+"/, `data-discussion-url="${replacement}"`)) }), /incomplete/);
  }
});
