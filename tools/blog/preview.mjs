// Local-only preview. Never used by the publishing workflow or included in Pages.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sanitize from 'sanitize-html';
import { imageSize } from 'image-size';
import { fetchSnapshot, preparePosts, writeBlog, cleanArticleHtml, downloadImage, permittedImage, escape, safeLink } from './lib.mjs';
import { renderMediaLinks } from './media.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const config=JSON.parse(await fs.readFile(new URL('./config.json',import.meta.url),'utf8'));
const decode=text=>String(text).replace(/&(?:amp|lt|gt|quot|#39);/g,s=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[s]));
const text=html=>decode(sanitize(html,{allowedTags:[],allowedAttributes:{}})).trim();

// This fallback is an explicit mirror of already-published pages, not a fabricated
// complete Discussions snapshot. Author/category filtering still occurs only in
// the existing authenticated publishing pipeline.
export async function publishedPreview({fetcher=fetch}={}) {
  const site=new URL(config.siteUrl), assets=new Map(), cache=new Map();
  async function read(file,binary=false) {
    const url=new URL(file,site);
    if(url.origin!==site.origin||!url.pathname.startsWith(site.pathname)||!/^blog(?:\.html|\/[1-9]\d*\.html|\/media\/[a-f0-9]{64}\.(?:jpg|png|gif|webp|avif))$/.test(file))throw new Error('Invalid published preview path.');
    const response=await fetcher(url,{redirect:'error',credentials:'omit',signal:AbortSignal.timeout(30_000)});
    if(!response.ok)throw new Error(`Published preview ${file}: HTTP ${response.status}. Existing preview retained.`);
    const max=binary?20*1024*1024:2*1024*1024;
    if(Number(response.headers.get('content-length'))>max){await response.body?.cancel();throw new Error('Published preview resource too large.');}
    const chunks=[];let length=0;
    for await(const chunk of response.body){length+=chunk.length;if(length>max)throw new Error('Published preview resource too large.');chunks.push(chunk);}
    const bytes=Buffer.concat(chunks);
    return binary?bytes:bytes.toString('utf8');
  }
  const listing=await read('blog.html');
  if(!listing.includes('class="blog-list"'))throw new Error('Published Blog listing was not recognized; refusing to replace local preview.');
  const paths=[...new Set([...listing.matchAll(/href="(blog\/[1-9]\d*\.html)"/g)].map(m=>m[1]))];
  if(!paths.length&&!listing.includes('class="blog-empty"'))throw new Error('Published Blog has neither articles nor a verified empty state.');
  const posts=[];
  for(const file of paths){
    const page=await read(file), number=Number(path.basename(file,'.html'));
    const header=page.match(/<header class="blog-article-header">([\s\S]*?)<\/header>/)?.[1];
    let html=page.match(/<div class="blog-prose">([\s\S]*?)<\/div><div class="blog-article-bottom">/)?.[1];
    const dates=[...(header||'').matchAll(/<time datetime="([^"]+)"/g)].map(m=>m[1]);
    const title=header?.match(/<h1>([\s\S]*?)<\/h1>/)?.[1];
    const url=`https://github.com/${config.repository}/discussions/${number}`;
    if(!Number.isSafeInteger(number)||!title||html===undefined||!dates.length||dates.some(d=>!Number.isFinite(Date.parse(d)))||!page.includes(`href="${url}"`))throw new Error(`Published article ${number} is incomplete.`);
    // Rebuild generated players from their canonical fallback URLs, never trust
    // an iframe/video copied from remote HTML.
    html=html.replace(/<figure class="blog-figure blog-video">[\s\S]*?<\/figure>/g,figure=>{
      const source=safeLink(decode(figure.match(/<figcaption><a href="([^"]+)"/)?.[1]||''));
      return source?`<p><a href="${escape(source)}">${escape(source)}</a></p>`:'';
    });
    html=html.replace(/<figure class="blog-figure">[\s\S]*?<\/figure>/g,figure=>figure.match(/<img\b[^>]*>/)?.[0]||'');
    html=cleanArticleHtml(html,new URL(file,site).href);
    // Only used to derive the listing excerpt; the article HTML remains separate.
    const body=text(html.replace(/<pre>[\s\S]*?<\/pre>/g,'').replace(/<img\b[^>]*>/g,'').replace(/<\/p>/g,'\n\n'));
    async function image(source){
      const url=new URL(source), prefix=new URL('blog/media/',site);
      let saved;
      if(url.origin===prefix.origin&&url.pathname.startsWith(prefix.pathname)){
        const filename=url.pathname.slice(prefix.pathname.length),buffer=await read('blog/media/'+filename,true);
        if(crypto.createHash('sha256').update(buffer).digest('hex')!==filename.split('.')[0])throw new Error('Published image hash mismatch.');
        const size=imageSize(buffer);
        if(!['jpg','jpeg','png','gif','webp','avif'].includes(size.type)||!size.width||!size.height||size.width*size.height>100_000_000)throw new Error('Unsupported published image.');
        saved={filename,buffer,width:size.width,height:size.height};
      }else saved=await downloadImage(source,{fetcher});
      assets.set(saved.filename,saved.buffer);return saved;
    }
    for(const [tag]of [...html.matchAll(/<img\b[^>]*>/g)]){
      let attrs;
      sanitize(tag,{allowedTags:['img'],allowedAttributes:{img:['src','alt']},transformTags:{img:(tagName,attribs)=>{attrs=attribs;return{tagName,attribs};}}});
      if(!attrs?.src){html=html.replace(tag,'');continue;}
      const saved=await image(attrs.src),caption=attrs.alt||'';
      html=html.replace(tag,`<figure class="blog-figure"><div class="case-inline-media"><img src="media/${saved.filename}" alt="${escape(caption)}" width="${saved.width}" height="${saved.height}" loading="lazy" decoding="async"></div>${caption?`<figcaption>${escape(caption)}</figcaption>`:''}</figure>`);
    }
    html=html.replace(/<p>\s*(<figure[\s\S]*?<\/figure>)\s*<\/p>/g,'$1');
    // The normal attachment validator (including every redirect) remains in use.
    html=await renderMediaLinks(html,{fetcher,permittedUrl:permittedImage,assets,cache});
    let cover=null;
    const entry=[...listing.matchAll(/<article class="blog-entry[^\"]*">([\s\S]*?)<\/article>/g)].find(m=>m[1].includes(`href="${file}"`))?.[1];
    const coverSrc=entry?.match(/<img\b[^>]*src="([^"]+)"/)?.[1];
    if(coverSrc)cover=await image(new URL(decode(coverSrc),site).href);
    posts.push({number,path:`${number}.html`,title:text(title),createdAt:dates[0],updatedAt:dates[1]||dates[0],url,html,body,summary:decode(page.match(/<meta name="description" content="([^"]*)"/)?.[1]||''),cover});
  }
  return{posts,assets};
}

async function main(){
  if(process.argv.slice(2).some(arg=>arg!=='--published'))throw new Error('Usage: node tools/blog/preview.mjs [--published]');
  const published=process.argv.includes('--published');
  if(!published&&!process.env.GITHUB_TOKEN)throw new Error('Fresh Discussions sync needs GITHUB_TOKEN in this process environment (read access to this repository and Discussions). Never store it in a file. For a credential-free mirror of already-published posts, run: node tools/blog/preview.mjs --published');
  const prepared=published?await publishedPreview():await preparePosts(await fetchSnapshot(config,process.env.GITHUB_TOKEN),config);
  const tmp=path.join(root,'tmp');await fs.mkdir(tmp,{recursive:true});
  const output=await fs.mkdtemp(path.join(tmp,'blog-preview-'));
  await writeBlog(output,prepared,config,await fs.readFile(path.join(root,'index.html'),'utf8'));
  const report={directory:path.relative(root,output),source:published?'published-site mirror (not a fresh Discussions snapshot)':'authenticated Discussions snapshot',posts:prepared.posts.length,createdAt:new Date().toISOString()};
  await fs.writeFile(path.join(output,'.blog-preview.json'),JSON.stringify(report,null,2));
  const pointer=path.join(tmp,'blog-preview.json');
  try{await fs.copyFile(pointer,path.join(tmp,'blog-preview.previous.json'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const next=path.join(tmp,'blog-preview.next.json');
  await fs.writeFile(next,JSON.stringify(report,null,2));
  await fs.rename(next,pointer);
  console.log(`Local Blog ready: ${report.posts} post(s), source: ${report.source}.\nNo source articles or remote data changed. Start node tools/preview.cjs and open http://127.0.0.1:4173/blog.html`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
