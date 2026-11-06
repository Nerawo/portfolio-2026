import test from'node:test';import assert from'node:assert/strict';import{preparePosts,renderBlog}from'../lib.mjs';import config from'../config.json'with{type:'json'};
const category={id:'BLOG',name:'Blog',slug:'blog',isAnswerable:false};
const post=(number,project)=>({number,title:'Original title '+number,body:project?'Project: '+project+'\n\nOriginal prose.':'Original prose.',createdAt:`2026-10-0${number}T00:00:00Z`,updatedAt:`2026-10-0${number}T00:00:00Z`,url:`https://github.com/${config.repository}/discussions/${number}`,category,author:config.authors[0]});
const build=async posts=>renderBlog(await preparePosts({repository:config.repository,complete:true,category,discussions:posts},config),config,'<header class="site-header"></header>');
test('Recent Articles labels reuse parsed metadata with real project links; article detail has no labels',async()=>{
 const pages=await build([post(1,'Tear Gas Canister'),post(2)]),html=pages.get('blog.html');
 assert.equal((html.match(/class="blog-entry-project"/g)||[]).length,2);assert(html.includes('data-blog-project-link="tear gas canister"'));assert(html.includes('href="blog.html?project=tear%20gas%20canister"'));
 assert(html.includes('data-blog-project-link="uncategorized"'));assert(html.includes('data-blog-ui="uncategorized">Uncategorized</span>'));assert(html.includes('width="14" height="12"'));assert(html.includes('datetime="2026-10-01T00:00:00Z"'));
 assert(html.indexOf('Original title 2')<html.indexOf('Original title 1'));assert(html.includes('<p class="blog-entry-excerpt">Original prose.</p>'));
 assert(!pages.get('blog/1.html').includes('blog-entry-project'));assert(pages.get('blog/1.html').includes('<p>Original prose.</p>'));
});
test('moving an article to another project updates its label and destination automatically',async()=>{
 const original=(await build([post(1,'Before')])).get('blog.html'),moved=(await build([post(1,'After')])).get('blog.html');
 assert(original.includes('data-blog-project-link="before"'));assert(moved.includes('data-blog-project-link="after"'));assert(!moved.includes('data-blog-project-link="before"'));assert(moved.includes('href="blog/1.html"'));
 const escaped=(await build([post(1,'A "quoted" & long name')])).get('blog.html');assert(escaped.includes('A &quot;quoted&quot; &amp; long name'));
});
