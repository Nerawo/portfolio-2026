const http=require('http'),fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.gif':'image/gif','.avif':'image/avif','.webp':'image/webp','.mp4':'video/mp4','.pdf':'application/pdf','.otf':'font/otf','.ttf':'font/ttf'};
function blogRoot(){
 try{
  const info=JSON.parse(fs.readFileSync(path.join(base,'tmp/blog-preview.json'),'utf8'));
  const directory=fs.realpathSync(path.resolve(base,info.directory));
  const tmp=fs.realpathSync(path.join(base,'tmp'));
  if(path.dirname(directory)!==tmp||!path.basename(directory).startsWith('blog-preview-'))return null;
  const marker=JSON.parse(fs.readFileSync(path.join(directory,'.blog-preview.json'),'utf8'));
  if(marker.createdAt!==info.createdAt)return null;
  return{directory,info};
 }catch{
  try{const marker=JSON.parse(fs.readFileSync(path.join(base,'dist/.portfolio-blog-build.json'),'utf8'));if(marker.generator==='portfolio-discussions-blog')return{directory:path.join(base,'dist'),info:{posts:marker.posts,source:'local dist build'}};}catch{}
  return null;
 }
}
const initial=blogRoot();
console.log(initial?`Blog: ${initial.info.posts} post(s), ${initial.info.source}.`:'Blog data is not generated locally. The root blog.html is an empty-state template. Run node tools/blog/preview.mjs --published for already-published posts, or use an authenticated local sync.');
http.createServer((req,res)=>{
 let url;try{url=decodeURIComponent(req.url.split('?')[0]);}catch{res.writeHead(400).end();return;}
 const blog=url==='/blog.html'||url.startsWith('/blog/');
 const generated=blog?blogRoot():null;
 const directory=generated?generated.directory:base;
 const file=path.resolve(directory,'.'+(url==='/'?'/index.html':url));
 if(!file.startsWith(directory+path.sep)){res.writeHead(403).end();return;}
 fs.stat(file,(error,stat)=>{
  if(error||!stat.isFile()){res.writeHead(404).end();return;}
  let start=0,end=stat.size-1;
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){start=Number(range[1]);if(range[2])end=Math.min(end,Number(range[2]));if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}}
  res.writeHead(range?206:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':Math.max(0,end-start+1),'Accept-Ranges':'bytes',...(range?{'Content-Range':`bytes ${start}-${end}/${stat.size}`}:{})});
  if(req.method==='HEAD'||stat.size===0){res.end();return;}
  fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
 });
}).listen(4173,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:4173/blog.html (local styles and scripts; generated Blog data)'));
