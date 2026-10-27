import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { publishedPreview } from '../preview.mjs';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=','base64');
const file=crypto.createHash('sha256').update(png).digest('hex')+'.png';
const listing=`<div class="blog-list"><article class="blog-entry"><a href="blog/1.html">Real published title</a><img src="blog/media/${file}"></article></div>`;
const article=body=>`<meta name="description" content="Original description"><header class="blog-article-header"><time datetime="2026-10-27T10:13:52Z"></time><h1>Original &amp; published title</h1></header><div class="blog-prose">${body}</div><div class="blog-article-bottom"><a href="https://github.com/Nerawo/portfolio-2026/discussions/1">Original</a></div>`;

test('published preview reads only existing public pages, validates cached images and reuses safe embeds',async()=>{
 const urls=[];
 const result=await publishedPreview({fetcher:async(url,options)=>{
  assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert(!options.headers?.Authorization);urls.push(String(url));
  if(url.pathname.endsWith('/blog.html'))return new Response(listing);
  if(url.pathname.endsWith('/blog/1.html'))return new Response(article(`<p>Unchanged prose.</p><img src="media/${file}" alt="Caption"><p><a href="https://vimeo.com/76979871">https://vimeo.com/76979871</a></p><script>alert('no')</script><iframe src="https://evil.example"></iframe>`));
  if(url.pathname.endsWith(file))return new Response(png);
  throw new Error('Unexpected request '+url);
 }});
 assert.equal(result.posts.length,1);assert.equal(result.posts[0].path,'1.html');assert.equal(result.posts[0].title,'Original & published title');assert(result.posts[0].html.includes('<p>Unchanged prose.</p>'));assert(result.posts[0].html.includes('player.vimeo.com/video/76979871?dnt=1'));assert(!result.posts[0].html.includes('<script'));assert(!result.posts[0].html.includes('evil.example'));assert(result.posts[0].html.includes('<figcaption>Caption</figcaption>'));assert.equal(result.assets.size,1);assert.equal(result.posts[0].cover.width,1);assert(urls.every(url=>url.startsWith('https://nerawo.github.io/portfolio-2026/')));
});

test('published preview fails on partial data and corrupted assets rather than fabricating an empty snapshot',async()=>{
 await assert.rejects(publishedPreview({fetcher:async()=>new Response('<h1>Unavailable</h1>')}),/not recognized/);
 await assert.rejects(publishedPreview({fetcher:async url=>url.pathname.endsWith('blog.html')?new Response(listing):new Response('Missing',{status:404})}),/HTTP 404/);
 await assert.rejects(publishedPreview({fetcher:async url=>url.pathname.endsWith('blog.html')?new Response(listing):url.pathname.endsWith('/1.html')?new Response(article('Original content')):new Response('corrupt')}),/hash mismatch/);
});
