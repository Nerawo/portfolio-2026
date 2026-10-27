import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { renderBlog } from '../lib.mjs';
import config from '../config.json' with { type: 'json' };
const header='<header class="site-header"><a href="index.html">Lu Zhang</a><nav aria-label="Primary navigation"><a href="work.html">Work</a><a href="blog.html">Blog</a></nav></header>';
const post=(number,cover=null)=>({number,path:`${number}.html`,title:`Local test ${number}`,summary:'A short excerpt.',html:'<p>Unchanged article body.</p>',createdAt:'2026-10-01T12:00:00Z',updatedAt:'2026-10-01T12:00:00Z',url:`https://github.com/Nerawo/portfolio-2026/discussions/${number}`,cover});
test('empty listing restores the narrow editorial layout without topics or numbering',()=>{
 const html=renderBlog({posts:[],assets:new Map()},config,header).get('blog.html');
 assert(!html.includes('work.css'));assert(html.includes('<main class="blog-main"><header class="blog-heading">'));assert(html.includes('>Blog.</h1>'));assert(html.includes('No posts yet.'));assert(!html.includes('class="blog-entry'));
 assert(!html.includes('archive-filters'));assert(!html.includes('topicsPending'));assert(!html.includes('blog-entry-number'));assert(!html.includes('data-blog-count'));
});
test('editorial rows preserve existing data, stable links and coverless layout',()=>{
 const result=renderBlog({posts:[post(1,{filename:'test.png',width:1200,height:800}),post(2)],assets:new Map()},config,header);
 const html=result.get('blog.html');assert(!html.includes('data-blog-count'));assert.equal((html.match(/class="blog-date"/g)||[]).length,2);assert.equal((html.match(/class="blog-entry-copy"/g)||[]).length,2);assert.equal((html.match(/class="blog-cover"/g)||[]).length,1);assert(html.includes('href="blog/1.html"'));assert(html.includes('href="blog/2.html"'));
 const detail=result.get('blog/1.html');assert(!detail.includes('work.css'));assert(!detail.includes('blog-listing-main'));assert(detail.includes('<div class="blog-prose"><p>Unchanged article body.</p></div>'));
});

test('listing extracts readable prose without URLs, image syntax or media, leaving article data intact', () => {
 const body='https://github.com/user-attachments/assets/11111111-1111-1111-1111-111111111111\n\n![Screenshot](https://raw.githubusercontent.com/example/image.png)\n\nhttps://youtu.be/M7lc1UVf-VE\n\nReadable **process notes** with [a useful reference](https://example.com/destination). Next sentence.\n\n```js\nconst hidden = "code";\n```';
 const item={...post(7),body,category:{name:'Blog'},summary:'https://example.com/should-not-leak'};
 const before=JSON.stringify(item), result=renderBlog({posts:[item],assets:new Map()},config,header), html=result.get('blog.html');
 assert(html.includes('<p class="blog-entry-excerpt">Readable process notes with a useful reference. Next sentence.</p>'));
 assert(!html.includes('destination'));assert(!html.includes('should-not-leak'));assert(!html.includes('user-attachments'));assert(!html.includes('Screenshot'));assert(!html.includes('blog-entry-category'));
 assert.equal(JSON.stringify(item),before);assert(result.get('blog/7.html').includes('<p>Unchanged article body.</p>'));
});

test('media-only posts omit excerpts and absent categories are not invented', () => {
 const items=[{...post(2),body:'https://vimeo.com/76979871\n\n![Image](https://example.com/image.jpg)\n\n[Attachment](https://github.com/user-attachments/assets/abc-def)\n\n<iframe src="https://evil.example"></iframe>'},{...post(1),body:'https://example.com/only-a-url'}];
 const html=renderBlog({posts:items,assets:new Map()},config,header).get('blog.html');
 assert(!html.includes('blog-entry-excerpt'));assert(!html.includes('blog-entry-category'));assert(!html.includes('evil.example'));
 assert(!html.includes('blog-entry-number'));assert(html.indexOf('href="blog/2.html"')<html.indexOf('href="blog/1.html"'));
});

test('explicit summaries are cleaned for listing only; metadata and detail output stay unchanged', () => {
 const item={...post(8),body:'<!-- blog\nsummary: A clear [summary](https://example.com/target). https://example.com/raw\n-->\n\nBody is not the explicit summary.',summary:'Existing detail description'};
 const result=renderBlog({posts:[item],assets:new Map()},config,header);
 assert(result.get('blog.html').includes('<p class="blog-entry-excerpt">A clear summary.</p>'));
 assert(result.get('blog/8.html').includes('content="Existing detail description"'));assert.equal(item.summary,'Existing detail description');
});
