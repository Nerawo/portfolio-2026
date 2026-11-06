import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs/promises';import os from'node:os';import path from'node:path';import crypto from'node:crypto';
import{parseProject}from'../projects.mjs';import{preparePosts,renderBlog,parseEditorial}from'../lib.mjs';import{buildSite}from'../publication.mjs';import config from'../config.json'with{type:'json'};
const body=await fs.readFile(new URL('./fixtures/post-01-project-metadata.md',import.meta.url),'utf8');
test('actual Post 01 single-newline Project metadata is excluded from article, description and excerpt',async()=>{
 for(const text of [body,body.replaceAll('\r\n','\n')]){
 const parsed=parseProject(text);assert.equal(parsed.project,'Tear Gas Canister');assert(!parsed.markdown.includes('Project:'));assert(parsed.markdown.startsWith('This reference footage'));
 // Use the exact opening block; media validation has separate integration tests.
 const opening=text.split(/\r?\n\r?\n/)[0],category={id:'BLOG',name:'Blog',slug:'blog',isAnswerable:false},snapshot={repository:config.repository,complete:true,category,discussions:[{number:1,title:'Post 01',body:opening,category,author:config.authors[0],url:'https://github.com/'+config.repository+'/discussions/1',createdAt:'2026-10-27T00:00:00Z',updatedAt:'2026-10-27T00:00:00Z'}]};
 // Opening block contains the Getty source URL: denied metadata must safely fall back.
 const prepared=await preparePosts(snapshot,config,{fetcher:async()=>new Response(null,{status:403})}),pages=renderBlog(prepared,config,'<header class="site-header"></header>');
 assert.equal(prepared.posts[0].project,'Tear Gas Canister');assert(!prepared.posts[0].summary.includes('Project:'));for(const html of pages.values())assert(!html.includes('Project:'));
 assert(pages.get('blog.html').includes('This reference footage'));assert(pages.get('blog.html').includes('data-blog-project="tear gas canister"'));
 }
 assert.equal(parseEditorial('Project: Name\nNormal **prose**.').markdown,'Normal **prose**.');
});
test('production artifact versions CSS/JS by their bytes and changes URLs when assets change',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'blog-artifact-assets-'));
 try{
  await fs.mkdir(path.join(root,'projects'));await fs.mkdir(path.join(root,'file'));await fs.writeFile(path.join(root,'index.html'),'<header class="site-header"></header>');
  for(const file of ['styles.css','blog.css','blog.js','i18n.js','site.js'])await fs.writeFile(path.join(root,file),'/* '+file+' */');
  const output=path.join(root,'dist');await buildSite(root,output,{posts:[],assets:new Map()},config);
  let html=await fs.readFile(path.join(output,'blog.html'),'utf8');
  for(const file of ['styles.css','blog.css','blog.js','i18n.js','site.js']){const hash=crypto.createHash('sha256').update(await fs.readFile(path.join(output,file))).digest('hex').slice(0,16);assert(html.includes(file+'?v='+hash));}
  const old=html.match(/blog.css\?v=([a-f0-9]+)/)[1];await fs.writeFile(path.join(root,'blog.css'),'/* Changed stylesheet */');await buildSite(root,output,{posts:[],assets:new Map()},config);html=await fs.readFile(path.join(output,'blog.html'),'utf8');assert(!html.includes('blog.css?v='+old));
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
