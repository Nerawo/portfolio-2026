import test from 'node:test';import assert from 'node:assert/strict';
import {parseProject,projectKey} from '../projects.mjs';
import {parseEditorial,preparePosts,renderBlog} from '../lib.mjs';
import config from '../config.json' with {type:'json'};
const category={id:'BLOG',name:'Blog',slug:'blog',isAnswerable:false};
const post=(number,body)=>({number,title:'Post '+number,body,category,author:config.authors[0],url:`https://github.com/${config.repository}/discussions/${number}`,createdAt:`2026-10-${String(number).padStart(2,'0')}T00:00:00Z`,updatedAt:`2026-10-${String(number).padStart(2,'0')}T00:00:00Z`});
const snapshot=discussions=>({repository:config.repository,complete:true,category,discussions});
const header='<header class="site-header"><nav><a href="blog.html">Blog</a></nav></header>';
test('opening Project line is removed; whitespace, Unicode and case keys normalize consistently',()=>{
 for(const newline of ['\n','\r\n']){
  const input=['# Study','','Project:  Tear   Gas Canister  ','','**Original** prose.'].join(newline),p=parseProject(input);
  assert.equal(p.project,'Tear Gas Canister');assert(!p.markdown.includes('Project:'));assert(p.markdown.includes('**Original** prose.'));
 }
 assert.equal(projectKey(' Ｔｅａｒ  GAS '),'tear gas');assert.equal(projectKey('Tear Gas'),projectKey('tear gas'));
 const result=parseEditorial('<!-- blog\nsummary: Kept summary\n-->\n\nProject: Tear Gas\n\nBody.');
 assert.equal(result.project,'Tear Gas');assert.equal(result.summary,'Kept summary');assert.equal(result.markdown,'Body.');
});
test('absent fields, code, quoted/list content, later paragraphs and multiline prose are not metadata',()=>{
 for(const body of ['Ordinary prose.','Intro\n\nProject: Mentioned later','```text\nProject: In code\n```','> Project: Quoted','- Project: Listed','    Project: Indented code','Project: A paragraph begins\nthen continues here.']){
  const parsed=parseProject(body);assert.equal(parsed.project,'Uncategorized');assert.equal(parsed.markdown,body);
 }
});
test('duplicate fields use first valid value and warn; malformed names are preserved and reported',()=>{
 const warnings=[];const p=parseProject('Project: Alpha\nProject: Beta\n\nBody.',{warn:x=>warnings.push(x)});
 assert.equal(p.project,'Alpha');assert.equal(p.markdown,'Body.');assert.equal(warnings.length,1);
 for(const name of ['', 'x'.repeat(81),'<script>bad</script>']){
  const warnings=[],body='Project: '+name+'\n\nBody.',p=parseProject(body,{warn:x=>warnings.push(x)});
  assert.equal(p.project,'Uncategorized');assert.equal(p.markdown,body);assert.equal(warnings.length,1);
 }
 const repeated=parseProject('Project: \nProject: Valid\n\nBody.',{warn:()=>{}});assert.equal(repeated.project,'Valid');
});
test('automatic folders group exactly once without changing chronological entries, article URLs, content or navigation',async()=>{
 const source=[post(1,'Project: Tear Gas\n\nFirst prose.'),post(2,'Project: tear gas\n\nSecond prose.'),post(3,'Project: Artist Tools\n\nThird prose.'),post(4,'Uncategorized prose.')],before=JSON.stringify(source);
 const prepared=await preparePosts(snapshot(source),config),pages=renderBlog(prepared,config,header),listing=pages.get('blog.html');
 assert.equal(JSON.stringify(source),before);assert.equal((listing.match(/class="blog-project-folder"/g)||[]).length,3);
 assert(listing.includes('data-blog-project="tear gas"'));assert(listing.includes('data-project-count="2"'));
 assert.equal((listing.match(/class="blog-entry(?: has-cover)?"/g)||[]).length,4);
 assert(listing.indexOf('>Projects</h2>')<listing.indexOf('>Recent Articles</h2>'));
 assert(!listing.includes('Project:'));assert(listing.indexOf('href="blog/4.html"')<listing.indexOf('href="blog/1.html"'));
 assert(listing.includes('href="blog.html?project=artist%20tools"'));
 const detail=pages.get('blog/2.html');assert(detail.includes('<p>Second prose.</p>'));assert(!detail.includes('Project:'));
 assert(detail.includes('href="1.html" rel="prev"'));assert(detail.includes('href="3.html" rel="next"'));
 assert(detail.includes('data-blog-project-name="tear gas"'));assert.equal(prepared.posts.find(p=>p.number===2).body,source[1].body);
 assert.equal(new URL('blog.html?project=tear%20gas',config.siteUrl).pathname,'/portfolio-2026/blog.html');
});
test('empty archive creates no invented folders; project labels and query links are escaped',async()=>{
 const empty=renderBlog({posts:[],assets:new Map()},config,header).get('blog.html');assert(!empty.includes('class="blog-project-folder"'));assert(empty.includes('No posts yet.'));assert(empty.includes('Project folders appear'));
 const prepared=await preparePosts(snapshot([post(1,'Project: Quotes " & links ?\n\nReadable prose.')]),config),html=renderBlog(prepared,config,header).get('blog.html');
 assert(html.includes('Quotes &quot; &amp; links ?'));assert(!html.includes('data-project-name="Quotes "'));
 assert(!prepared.posts[0].html.includes('Project:'));
});

test('published preview retains project identity and rebuilds the same folder without reading Discussions',async()=>{
 const {publishedPreview}=await import('../preview.mjs');
 const prepared=await preparePosts(snapshot([post(1,'Project: Tear Gas\n\nOriginal readable prose.')]),config),pages=renderBlog(prepared,config,header);
 const mirrored=await publishedPreview({fetcher:async url=>new Response(pages.get(url.pathname.replace('/portfolio-2026/','')))});
 assert.equal(mirrored.posts[0].project,'Tear Gas');assert(!mirrored.posts[0].html.includes('Project:'));
 assert(renderBlog(mirrored,config,header).get('blog.html').includes('data-blog-project="tear gas"'));
});
