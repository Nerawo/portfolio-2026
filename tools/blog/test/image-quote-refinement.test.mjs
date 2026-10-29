import fs from 'node:fs/promises';
import test from 'node:test';import assert from 'node:assert/strict';
import {imageCaption,preparePosts,cleanMarkdown} from '../lib.mjs';import config from '../config.json' with {type:'json'};
const uuid='71e1f712-a85b-4511-93d1-bbb88f35f371',hash='a'.repeat(64);
test('automatic captions omit only opaque UUID/hash attachment identifiers, keeping human captions intact',()=>{
 for(const value of [uuid,uuid.toUpperCase(),hash,'a'.repeat(32),'a'.repeat(40),uuid+'.png','attachment-'+uuid,'upload ID: '+hash+'.webp'])assert.equal(imageCaption(value),'',value);
 for(const value of ['Smoke reference with annotations','Reference 877-10','SHA-256: '+hash,'Compare '+uuid,'2026','smoke-breakdown.png','  Human-written caption  '])assert.equal(imageCaption(value),value);
});
test('caption cleanup keeps image alt text, original prose, meaningful captions and asset dimensions',async()=>{
 const category={id:'BLOG',slug:'blog',name:'Blog',isAnswerable:false},source='https://github.com/user-attachments/assets/11111111-1111-1111-1111-111111111111';
 const body=`Legitimate identifier in prose: ${uuid}\n\n![${uuid}](${source})\n\n![Reference with particle trails](${source})\n\n![SHA-256: ${hash}](${source})`;
 const snapshot={repository:config.repository,complete:true,category,discussions:[{number:1,title:'Caption regression',body,category,author:config.authors[0],createdAt:'2026-10-29T00:00:00Z',updatedAt:'2026-10-29T00:00:00Z',url:'https://github.com/'+config.repository+'/discussions/1'}]};
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=','base64');
 const {posts,assets}=await preparePosts(snapshot,config,{fetcher:async()=>new Response(png,{headers:{'content-type':'image/png'}})}),html=posts[0].html;
 assert(html.includes(`alt="${uuid}"`));assert(!html.includes(`<figcaption>${uuid}</figcaption>`));assert(html.includes('Legitimate identifier in prose: '+uuid));assert(html.includes('<figcaption>Reference with particle trails</figcaption>'));assert(html.includes('<figcaption>SHA-256: '+hash+'</figcaption>'));assert.equal(assets.size,1);assert.equal((html.match(/width="1" height="1"/g)||[]).length,3);
});
test('blockquote Markdown retains paragraph breaks, inline links, line breaks, emphasis, code and lists',()=>{
 const html=cleanMarkdown('> *Reference note*\n> [Source](https://example.com/reference)\n>\n> Next paragraph with `pscale`.\n>\n> - First item\n> - Second item','https://github.com/');
 assert(html.includes('<blockquote>'));assert(html.includes('<em>Reference note</em><br />'));assert(html.includes('href="https://example.com/reference"'));assert(html.includes('<code>pscale</code>'));assert(html.includes('<ul>'));assert.equal((html.match(/<p>/g)||[]).length,2);assert(html.includes('<li>Second item</li>'));
});

test('actual Post 03 HTML image and adjacent human-written blockquote never promote its UUID into visible text', async () => {
 const body = await fs.readFile(new URL('./fixtures/post-03-image-caption.md', import.meta.url), 'utf8');
 assert(body.includes('alt="'+uuid+'"')); assert(!new RegExp('^\\s*'+uuid+'\\s*$', 'm').test(body));
 const category={id:'BLOG',slug:'blog',name:'Blog',isAnswerable:false};
 const snapshot={repository:config.repository,complete:true,category,discussions:[{number:3,title:'Post 03 actual Markdown regression',body,category,author:config.authors[0],createdAt:'2026-10-28T00:00:00Z',updatedAt:'2026-10-28T00:00:00Z',url:'https://github.com/'+config.repository+'/discussions/3'}]};
 const parsed=cleanMarkdown(body,snapshot.discussions[0].url),quote=parsed.match(/<blockquote>[\s\S]*?<\/blockquote>/)?.[0];
 assert(quote?.includes('Fig. 2. Wispy smoke reference frame.')); assert(quote.includes('<a '));
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=','base64');
 const {posts}=await preparePosts(snapshot,config,{fetcher:async()=>new Response(png,{headers:{'content-type':'image/png'}})}),html=posts[0].html;
 assert(html.includes('alt="'+uuid+'"')); assert(!html.includes('<figcaption>'+uuid+'</figcaption>')); assert(!html.includes('<p>'+uuid+'</p>')); assert(!html.includes('blog-image-enlarge'));
 assert(html.includes(quote)); assert(html.includes('<figure class="blog-figure"><div class="case-inline-media"><img'));
});
