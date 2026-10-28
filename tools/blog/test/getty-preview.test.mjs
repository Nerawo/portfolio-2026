import test from 'node:test';import assert from 'node:assert/strict';
import {gettyVideo,gettyThumbnail} from '../getty.mjs';import {renderMediaLinks} from '../media.mjs';import {cleanMarkdown} from '../lib.mjs';
const source='https://www.gettyimages.com/detail/video/brick-chimney-being-pushed-down-the-roof-of-the-house-stock-footage/992937078?adppopup=true';
const image='https://media.gettyimages.com/id/992937078/video/actual-thumbnail.jpg?s=170x170&k=20&c=public';
const htmlResponse=html=>new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}});
const metadata=`<meta property="og:image" content="${image.replaceAll('&','&amp;')}">`;
const render=(body,fetcher)=>renderMediaLinks(cleanMarkdown(body,'https://github.com/'),{fetcher,assets:new Map(),cache:new Map(),permittedUrl:()=>false,warn:()=>{}});
test('recognizes only trusted HTTPS Getty video detail pages',()=>{
 assert.equal(gettyVideo(source).id,'992937078');assert.equal(gettyVideo('https://www.gettyimages.com/detail/video/reference-stock-video-footage/877-10').id,'877-10');
 for(const u of ['http://www.gettyimages.com/detail/video/title/992937078','https://gettyimages.com.evil.test/detail/video/title/992937078','https://u:p@www.gettyimages.com/detail/video/title/992937078','https://www.gettyimages.com/detail/photo/title/992937078','https://www.gettyimages.com/detail/video/title/invalid','https://www.gettyimages.com:8443/detail/video/title/992937078'])assert.equal(gettyVideo(u),null);
});
test('uses the actual public OG thumbnail only after an anonymous image HEAD check; never downloads video or thumbnail bytes',async()=>{
 const calls=[];const thumbnail=await gettyThumbnail(source,{fetcher:async(u,o)=>{calls.push([String(u),o.method||'GET']);assert.equal(o.redirect,'manual');assert.equal(o.credentials,'omit');assert(!o.headers.Authorization);assert(!o.headers.Cookie);if(String(u)===source)return htmlResponse(metadata);assert.equal(String(u),image);assert.equal(o.method,'HEAD');return new Response(null,{headers:{'content-type':'image/jpeg'}});}});
 assert.equal(thumbnail,image);assert.deepEqual(calls,[[source,'GET'],[image,'HEAD']]);
 assert.equal(await gettyThumbnail(source,{fetcher:async(u,o)=>o.method==='HEAD'?new Response(null):htmlResponse(metadata)}),image);
});
test('denied pages and redirects outside the same Getty video fall back without bypass or retries',async()=>{
 for(const response of [new Response(null,{status:403}),new Response(null,{status:429}),new Response(null,{status:302,headers:{location:'https://evil.test/private'}}),new Response(null,{status:302,headers:{location:'https://www.gettyimages.com/detail/video/other/123'}})]){
  let calls=0;assert.equal(await gettyThumbnail(source,{fetcher:async()=>{calls++;return response}}),null);assert.equal(calls,1);
 }
});
test('rejects mismatched assets, unsafe thumbnail hosts, video URLs, oversized pages and spoofed image responses',async()=>{
 for(const content of ['https://evil.test/poster.jpg','https://media.gettyimages.com/id/123/video/wrong.jpg','https://media.gettyimages.com/id/992937078/video/movie.mp4']){let calls=0;assert.equal(await gettyThumbnail(source,{fetcher:async()=>{calls++;return htmlResponse(`<meta property="og:image" content="${content}">`);}}),null);assert.equal(calls,1);}
 assert.equal(await gettyThumbnail(source,{fetcher:async()=>new Response(null,{headers:{'content-type':'text/html','content-length':3*1024*1024}})}),null);
 assert.equal(await gettyThumbnail(source,{fetcher:async(u,o)=>o.method==='HEAD'?htmlResponse('Login required'):htmlResponse(metadata)}),null);
});
test('standalone Getty URLs including the October 27 example become responsive external cards; single newline prose stays intact',async()=>{
 let calls=0;const html=await render(`Here is the Reference.\n${source}\n\n${source}`,async(u,o)=>{calls++;return o.method==='HEAD'?new Response(null,{headers:{'content-type':'image/jpeg'}}):htmlResponse(metadata)});
 assert.equal(calls,2);assert.equal((html.match(/class="blog-embed blog-getty"/g)||[]).length,2);assert(html.includes('View on Getty Images'));assert(html.includes(`href="${source}" target="_blank" rel="noopener noreferrer"`));assert(html.includes('actual-thumbnail.jpg?s=170x170&amp;k=20'));assert(html.includes('<p>Here is the Reference.</p>'));assert(!html.includes('<iframe'));assert(!html.includes('<video'));assert(!/<p>\s*<figure/.test(html));
});
test('unavailable metadata or network failures produce a clean link card without a broken image',async()=>{
 for(const fetcher of [async()=>new Response(null,{status:403}),async()=>{throw Error('Network unavailable')}]){const html=await render(source,fetcher);assert(html.includes('blog-getty-link'));assert(html.includes('View on Getty Images'));assert(!html.includes('<img'));assert(!html.includes('<iframe'));assert(!html.includes('<video'));}
});
test('inline links, custom Markdown links, prefixed credits and code retain their existing behavior without metadata requests',async()=>{
 for(const body of [`Watch ${source} here.`,`[My reference](${source})`,`From ${source}`,`\`${source}\``,`\`\`\`\n${source}\n\`\`\``]){const html=await render(body,()=>{throw Error('No metadata request expected')});assert(!html.includes('blog-getty'));}
});
