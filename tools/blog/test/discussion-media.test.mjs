import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {preparePosts,renderBlog}from'../lib.mjs';
import config from '../config.json' with {type:'json'};
const actual=await fs.readFile(new URL('./fixtures/discussion-1-media.md',import.meta.url),'utf8');
const videoUrl='https://github.com/user-attachments/assets/97e1bd41-53ed-442e-a01b-d2f122bdc7df';
const imageUrl='https://github.com/user-attachments/assets/60a56f15-2084-4f12-8c65-6f38e4b5fae2';
const alt='980f0244e89687ddcc1d790d5d01cbf5';
const category={id:'BLOG',name:'Blog',slug:'blog',isAnswerable:false};
const snapshot=body=>({repository:config.repository,complete:true,category,discussions:[{number:1,title:'Discussion #1 regression',body,createdAt:'2026-10-27T10:13:52Z',updatedAt:'2026-10-27T12:31:27Z',url:'https://github.com/Nerawo/portfolio-2026/discussions/1',category,author:config.authors[0]}]});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=','base64');
const box=(name,...parts)=>{const bytes=Buffer.concat(parts),head=Buffer.alloc(8);head.writeUInt32BE(bytes.length+8);head.write(name,4);return Buffer.concat([head,bytes]);};
const track=Buffer.alloc(84);track.writeUInt32BE(768*65536,76);track.writeUInt32BE(432*65536,80);
const handler=Buffer.alloc(12);handler.write('vide',8);const count=Buffer.alloc(8);count.writeUInt32BE(1,4);
const mp4=Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isomavc1')),box('moov',box('trak',box('tkhd',track),box('mdia',box('hdlr',handler),box('minf',box('stbl',box('stsd',count,box('avc1'))))))),box('mdat')]);
const fetcher=async(url,options)=>{assert.equal(options.credentials,'omit');assert(!options.headers.Authorization);if(String(url)===videoUrl)return new Response(mp4,{headers:{'content-type':'video/mp4'}});if(String(url)===imageUrl)return new Response(png,{headers:{'content-type':'image/png'}});throw Error('Unexpected URL '+url);};

test('actual Discussion #1 soft-break Markdown produces the validated video and preserves surrounding prose',async()=>{
 for(const body of [actual,actual.replaceAll('\n','\r\n')]){
  const result=await preparePosts(snapshot(body),config,{fetcher}),html=result.posts[0].html;
  assert(html.includes('<p>Here is the Reference.</p>'));assert.equal((html.match(/<video /g)||[]).length,1);assert(html.includes('controls preload="metadata" playsinline width="768" height="432"'));
  assert(html.includes(`href="${videoUrl}"`));assert(html.includes('Open original video'));assert(!html.includes(`>${videoUrl}</a>`));assert(html.includes('Rough Analyze:'));assert(html.includes('gettyimages.com/detail/video/'));assert.equal(result.assets.size,2);assert.equal(result.posts[0].body,body);
 }
});

test('the observed hash is kept in alt metadata but is not promoted to a visible caption',async()=>{
 const body=actual+`\n\nLegitimate checksum: ${alt}\n\n\`${alt}\`\n\n![MD5: ${alt}](${imageUrl})`;
 const {posts}=await preparePosts(snapshot(body),config,{fetcher}),html=posts[0].html;
 assert(html.includes(`alt="${alt}"`));assert(!html.includes(`<figcaption>${alt}</figcaption>`));assert(html.includes(`Legitimate checksum: ${alt}`));assert(html.includes(`<code>${alt}</code>`));assert(html.includes(`<figcaption>MD5: ${alt}</figcaption>`));
});

test('inline prose links, custom link labels, code blocks and nested inline formatting are preserved',async()=>{
 const body=`Here is ${videoUrl} in a sentence.\n\n[Watch this clip](${videoUrl})\n\n\`\`\`text\n${videoUrl}\n\`\`\`\n\n*Emphasis across lines\n${videoUrl}\nand more emphasis.*`;
 const {posts}=await preparePosts(snapshot(body),config,{fetcher:()=>{throw Error('Non-standalone links must not be fetched.');}});
 assert(!posts[0].html.includes('<video'));assert(posts[0].html.includes('in a sentence.'));assert(posts[0].html.includes('>Watch this clip</a>'));assert(posts[0].html.includes('<pre><code'));assert(posts[0].html.includes('<em>Emphasis across lines'));
});

test('multiple isolated media lines split safely, cache validated bytes and leave named or unsupported links alone',async()=>{
 let calls=0;
 const body=`**Introduction**\n${videoUrl}\nA following paragraph.\n${videoUrl}\n\nhttps://youtu.be/M7lc1UVf-VE\n\n[My video](${videoUrl})\n\nhttps://example.com/ordinary`;
 const {posts}=await preparePosts(snapshot(body),config,{fetcher:async(...args)=>{calls++;return fetcher(...args);}});
 assert.equal(calls,1);assert.equal((posts[0].html.match(/<video /g)||[]).length,2);assert(posts[0].html.includes('<p><strong>Introduction</strong></p>'));assert(posts[0].html.includes('<p>A following paragraph.</p>'));assert(posts[0].html.includes('youtube-nocookie.com/embed/M7lc1UVf-VE'));assert(posts[0].html.includes('>My video</a>'));assert(posts[0].html.includes('href="https://example.com/ordinary"'));assert(!/<p>\s*<figure/.test(posts[0].html));
});

test('the actual rendered article retains its original fallback URL, source credit, image dimensions and stable route',async()=>{
 const prepared=await preparePosts(snapshot(actual),config,{fetcher});
 const pages=renderBlog(prepared,config,'<header class="site-header"><a href="index.html">Lu Zhang</a></header>');
 const html=pages.get('blog/1.html');assert(html.includes(`href="${videoUrl}"`));assert(html.includes('Source: Getty Images'));assert(html.includes('width="1" height="1" loading="lazy"'));assert(!html.includes(`<figcaption>${alt}</figcaption>`));assert(pages.get('blog.html').includes('href="blog/1.html"'));
});
