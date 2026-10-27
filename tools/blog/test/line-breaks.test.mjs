import test from 'node:test';import assert from 'node:assert/strict';
import {cleanMarkdown,preparePosts} from '../lib.mjs';import {renderMediaLinks} from '../media.mjs';import config from '../config.json' with {type:'json'};
test('single newlines are visible breaks; blank lines remain separate paragraphs',()=>{
 const html=cleanMarkdown('First line\n**Bold** and *italic* with [named link](https://example.com)\nLast line\n\nNext paragraph.','https://github.com/');
 assert(html.includes('First line<br />\n<strong>Bold</strong> and <em>italic</em>'));assert(html.includes('</a><br />\nLast line</p>'));assert.equal((html.match(/<p>/g)||[]).length,2);assert.equal((html.match(/<br \/>/g)||[]).length,2);
 const code=cleanMarkdown('```js\nfirst();\nsecond();\n```','https://github.com/');assert(code.includes('first();\nsecond();'));assert(!code.includes('<br'));
});
test('Discussion-style tutorial lines retain breaks next to single-newline YouTube and MP4 URLs',async()=>{
 const url='https://github.com/user-attachments/assets/11111111-1111-1111-1111-111111111111';
 const html=await renderMediaLinks(cleanMarkdown(`Here is the tutorial I found:\nPyro and debris:\nhttps://youtu.be/M7lc1UVf-VE\nAfter video.\n\nAnother paragraph.\n${url}\nFinal line.`,'https://github.com/'),{assets:new Map(),cache:new Map([[url,Promise.resolve({filename:'validated.mp4',buffer:Buffer.from('cached validated asset'),width:768,height:432})]]),fetcher:()=>{throw Error('Unexpected fetch')},permittedUrl:()=>true});
 assert(html.includes('<p>Here is the tutorial I found:<br />\nPyro and debris:</p>'));assert(html.includes('data-youtube-id="M7lc1UVf-VE"'));assert(html.includes('<video controls'));assert(html.includes('<p>After video.</p>'));assert(html.includes('<p>Final line.</p>'));assert(!/<p>\s*<figure|<br\s*\/?>\s*<\/p>|<p>\s*<br/.test(html));
});
test('single-newline images remain block figures without stray breaks or extra empty paragraphs',async()=>{
 const category={id:'BLOG',slug:'blog',name:'Blog',isAnswerable:false},body='Intro line\n**Image note**\n![Caption](https://github.com/user-attachments/assets/11111111-1111-1111-1111-111111111111)\nFollowing image.\n\nFinal paragraph.';
 const snapshot={repository:config.repository,complete:true,category,discussions:[{number:1,title:'Line breaks',body,category,author:config.authors[0],createdAt:'2026-10-27T00:00:00Z',updatedAt:'2026-10-27T00:00:00Z',url:'https://github.com/'+config.repository+'/discussions/1'}]};
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=','base64');
 const {posts}=await preparePosts(snapshot,config,{fetcher:async()=>new Response(png,{headers:{'content-type':'image/png'}})}),html=posts[0].html;
 assert(html.includes('Intro line<br />\n<strong>Image note</strong></p>'));assert(html.includes('<figcaption>Caption</figcaption>'));assert(html.includes('<p>Following image.</p>'));assert(!/<p>\s*<figure|<br\s*\/?>\s*<\/p>|<p>\s*<br/.test(html));
});
