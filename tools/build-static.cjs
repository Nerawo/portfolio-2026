/* Run `node tools/build-static.cjs` after editing shared project content.
   Uses only Node built-ins; keeps original routes and works without client JS. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const base=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(base,f),'utf8');
const write=(f,s)=>fs.writeFileSync(path.join(base,f),s,'utf8');
const data=vm.runInNewContext(read('project-data.js')+';projectData');
const esc=s=>String(s||'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
function replaceContent(file,selector,tag,content){let h=read(file);const start=h.indexOf('>',h.indexOf('id="'+selector+'"'))+1;let depth=1,index=start;const pattern=new RegExp('<(/?)'+tag+'(?:\\s[^>]*|)>','g');pattern.lastIndex=start;let m;while((m=pattern.exec(h))){depth+=m[1]?-1:1;if(!depth){index=m.index;break;}}write(file,h.slice(0,start)+content+h.slice(index));}
for(const [slug,d] of Object.entries(data)){
 const root={innerHTML:''};const document={body:{dataset:{project:slug},insertAdjacentHTML(){}},documentElement:{dataset:{lang:'en'}},querySelector:q=>q==='#project-root'?root:q==='.resume-menu'?{open:false}:null,addEventListener(){}};
 vm.runInNewContext(read('project-data.js')+'\n'+read('image-sizes.js')+'\n'+read('project-page.js'),{document,localStorage:{getItem:()=>null},matchMedia:()=>({matches:false})});
 replaceContent('projects/'+slug+'.html','project-root','main',root.innerHTML);
 const file='projects/'+slug+'.html';let h=read(file);h=h.replace(/<title>.*?<\/title>/,`<title>${esc(d.title)} — Lu Zhang</title>`).replace(/(<meta name="description" content=")[^"]*/,(_,a)=>a+esc(d.intro)).replace(/(<meta property="og:description" content=")[^"]*/,(_,a)=>a+esc(d.intro));write(file,h);
}
if (!process.argv.includes("--projects-only")) {
const projects=Object.entries(data);
replaceContent('index.html','project-list','div',projects.slice(0,6).map(([slug,d],i)=>`<a class="project" href="projects/${slug}.html"><div class="project-row"><img class="project-thumbnail" src="${d.image}" alt="" loading="lazy" width="320" height="240"><span class="project-index">0${i+1}</span><h3>${esc(d.title)}</h3><p class="project-summary">${esc(d.summary)}</p><time>${esc(d.date)}</time><span class="project-arrow">↗</span></div></a>`).join('\n'));
replaceContent('work.html','archive-grid','div',projects.map(([slug,d],i)=>`<article class="archive-card" data-category="${d.category}"><a class="archive-media" href="projects/${slug}.html" aria-label="${esc(d.title)}"><img src="${d.image}" alt="${esc(d.title)}" loading="lazy" width="640" height="400"><span class="archive-number">${String(i+1).padStart(2,'0')}</span></a><div class="archive-info"><h2><a href="projects/${slug}.html">${esc(d.title)}</a></h2><time>${d.date}</time><p><a href="projects/${slug}.html">${esc(d.summary)}</a></p><div class="archive-meta"><span>${esc(d.tools)}</span><a href="projects/${slug}.html">View Project ↗</a></div></div></article>`).join('\n'));
}
console.log('Rebuilt existing HTML from shared content.');
