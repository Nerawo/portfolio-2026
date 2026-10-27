import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBlog } from '../lib.mjs';
import config from '../config.json' with { type: 'json' };

const header='<header class="site-header"><a href="index.html">Lu Zhang</a></header>';
const post=overrides=>({number:1,path:'1.html',title:'Existing article',summary:'Existing excerpt.',html:'<p>Existing prose.</p>',createdAt:'2026-10-27T10:13:52Z',updatedAt:'2026-10-27T10:16:35Z',url:'https://github.com/Nerawo/portfolio-2026/discussions/1',...overrides});
const render=item=>renderBlog({posts:[item],assets:new Map()},config,header);

test('publication date always remains; updates on the same displayed UTC calendar date are omitted',()=>{
 for(const updatedAt of ['2026-10-27T10:13:52Z','2026-10-27T23:59:59Z']){
  const html=render(post({updatedAt})).get('blog/1.html');
  assert(html.includes('data-blog-ui="published"'));assert(!html.includes('class="blog-updated"'));assert.equal((html.match(/data-blog-date/g)||[]).length,1);
  assert(html.includes('datetime="2026-10-27T10:13:52Z"'));
 }
});

test('updates appear across calendar boundaries and timezone offsets follow existing UTC formatting',()=>{
 const changed=render(post({createdAt:'2026-10-27T23:59:59Z',updatedAt:'2026-10-28T00:00:01Z'})).get('blog/1.html');
 assert(changed.includes('class="blog-updated"'));assert.equal((changed.match(/data-blog-date/g)||[]).length,2);
 const sameDay=render(post({createdAt:'2026-10-28T00:30:00+02:00',updatedAt:'2026-10-27T23:30:00Z'})).get('blog/1.html');
 assert(!sameDay.includes('class="blog-updated"'));assert(sameDay.includes('Oct 27, 2026'));
});

test('standalone URL credits use a concise source label while keeping the original destination and attributes',()=>{
 const destination='https://www.gettyimages.com/detail/video/example/123?first=1&amp;second=2';
 const html=render(post({html:`<p>From <a href="${destination}" title="Original source" rel="noopener noreferrer">${destination}</a></p>`})).get('blog/1.html');
 assert(html.includes('data-blog-source="Getty Images"'));assert(html.includes('>Source: Getty Images ↗</a>'));assert(html.includes(`href="${destination}" title="Original source" rel="noopener noreferrer"`));assert(!html.includes('>From '));
 const ordinary=render(post({html:'<p><a href="https://example.com/a/very/long/path">https://example.com/a/very/long/path</a></p>'})).get('blog/1.html');
 assert(ordinary.includes('>Source: example.com ↗</a>'));
 const longHost='a'.repeat(50)+'.example.com';
 const generic=render(post({html:`<p><a href="https://${longHost}/path">https://${longHost}/path</a></p>`})).get('blog/1.html');
 assert(generic.includes('>View source ↗</a>'));assert(generic.includes(`href="https://${longHost}/path"`));
});

test('intentional custom Markdown labels, inline links, and code are not relabeled',()=>{
 const content='<p><a href="https://example.com/original">My chosen reference label</a></p><p>See <a href="https://example.com/path">https://example.com/path</a> in this sentence.</p><pre><code>&lt;a href="https://example.com"&gt;Literal code&lt;/a&gt;</code></pre>';
 const html=render(post({html:content})).get('blog/1.html');assert(html.includes(`<div class="blog-prose">${content}</div>`));assert(!html.includes('data-blog-source'));
});

test('HTML5 players, iframe embeds, image captions and zoom markup remain byte-for-byte intact',()=>{
 const media='<figure class="blog-figure blog-video"><video controls preload="metadata" playsinline width="1280" height="720" src="media/original.mp4"></video><figcaption><a href="https://github.com/user-attachments/assets/abc-def" rel="noopener noreferrer" data-blog-ui="videoSource">Open original video ↗</a></figcaption></figure><figure class="blog-figure blog-video"><div class="blog-embed"><iframe src="https://player.vimeo.com/video/76979871?dnt=1" loading="lazy"></iframe></div><figcaption><a href="https://vimeo.com/76979871" data-blog-ui="videoSource">Open original video ↗</a></figcaption></figure><figure class="blog-figure"><div class="case-inline-media"><img src="media/original.png" alt="Image caption" width="1200" height="800" loading="lazy"></div><figcaption>Image caption</figcaption></figure>';
 assert(render(post({html:media})).get('blog/1.html').includes(`<div class="blog-prose">${media}</div>`));
});

test('presentation changes do not mutate original article data or alter the Blog index',()=>{
 const item=post({html:'<p><a href="https://example.com/long">https://example.com/long</a></p>'}),before=JSON.stringify(item),pages=render(item);
 assert.equal(JSON.stringify(item),before);assert(!pages.get('blog.html').includes('data-blog-source'));assert(pages.get('blog.html').includes('<p class="blog-entry-excerpt">Existing excerpt.</p>'));assert(pages.get('blog.html').includes('href="blog/1.html"'));
});
