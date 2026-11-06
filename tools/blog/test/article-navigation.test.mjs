import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePosts, renderBlog } from '../lib.mjs';
import { publishedPreview } from '../preview.mjs';
import config from '../config.json' with { type: 'json' };

const category = { id: 'BLOG', name: 'Blog', slug: 'blog', isAnswerable: false };
const header = '<header class="site-header"><a href="index.html">Lu Zhang</a></header>';
const post = (number, day) => ({ number, title: `Article ${number}`, body: 'Original prose.', createdAt: `2026-10-${day}T12:00:00Z`, updatedAt: `2026-11-05T12:00:00Z`, author: config.authors[0], category, url: `https://github.com/${config.repository}/discussions/${number}` });
const prepare = discussions => preparePosts({ repository: config.repository, complete: true, category, discussions }, config);

test('Previous is older and Next is newer, regardless of input/ID order; archive stays newest first', async () => {
 const prepared=await prepare([post(18,'01'),post(2,'03'),post(47,'02')]);
 const before=JSON.stringify(prepared),pages=renderBlog(prepared,config,header);
 assert.equal(JSON.stringify(prepared),before);
 assert.deepEqual([...pages.get('blog.html').matchAll(/<h2><a href="blog\/([^" ]+)"/g)].map(m=>m[1]),['2.html','47.html','18.html']);
 for(const [number,previous,next] of [[18,null,47],[47,18,2],[2,47,null]]){
  const html=pages.get('blog/'+number+'.html'),footer=html.split('<div class="blog-article-bottom">')[1];
  for(const [rel,destination] of [['prev',previous],['next',next]])if(destination)assert(footer.includes('href="'+destination+'.html" rel="'+rel+'"'));else assert(!footer.includes('rel="'+rel+'"'));
  assert(footer.includes('class="blog-all-articles" href="../blog.html"'));assert(html.includes('class="blog-back" href="../blog.html"'));assert(!footer.includes('Read on GitHub'));
  assert(html.includes('data-discussion-url="https://github.com/'+config.repository+'/discussions/'+number+'"'));
 }
});
test('equal publication timestamps use title then content, not IDs or input order; removal skips unpublished posts', async () => {
 const a={...post(99,'03'),title:'Alpha'},b={...post(1,'03'),title:'Beta'};
 for(const input of [[a,b],[b,a]]){const pages=renderBlog(await prepare(input),config,header);assert(pages.get('blog/99.html').includes('href="1.html" rel="next"'));assert(pages.get('blog/1.html').includes('href="99.html" rel="prev"'));}
 const x={...a,title:'Same',body:'First text'},y={...b,title:'Same',body:'Other text'};
 const forward=renderBlog(await prepare([x,y]),config,header),reverse=renderBlog(await prepare([y,x]),config,header);assert.equal(forward.get('blog/99.html'),reverse.get('blog/99.html'));
 const pages=renderBlog(await prepare([a,{...b,category:{id:'OTHER',slug:'other'}}]),config,header);assert(!pages.has('blog/1.html'));assert(!pages.get('blog/99.html').includes('rel="next"'));assert(!pages.get('blog/99.html').includes('rel="prev"'));
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
