import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanMarkdown} from '../lib.mjs';
import {providerVideo,renderMediaLinks} from '../media.mjs';
const id='M7lc1UVf-VE';
const render=body=>renderMediaLinks(cleanMarkdown(body,'https://github.com/Nerawo/portfolio-2026/discussions/1'),{fetcher:()=>{throw Error('Unexpected media fetch');},permittedUrl:()=>false,assets:new Map(),cache:new Map()});
test('watch, short and Shorts URLs use validated IDs and actual thumbnail URLs without an iframe',async()=>{
 for(const url of [`https://www.youtube.com/watch?v=${id}&feature=share`,`https://youtu.be/${id}?si=abc`,`https://www.youtube.com/shorts/${id}`]){
  assert.equal(providerVideo(url).id,id);
  const html=await render(`Introductory prose.\n${url}\nFollowing prose.`);
  assert(html.includes(`data-youtube-id="${id}"`));assert(html.includes(`https://i.ytimg.com/vi/${id}/hq720.jpg`));assert(html.includes('type="button" aria-label="Play YouTube video"'));assert(!html.includes('<iframe'));assert(html.includes('Following prose.'));assert(html.includes('href="'+url.replaceAll('&','&amp;')+'"'));
 }
});
test('inline, custom Markdown, code and untrusted URLs remain links or text',async()=>{
 for(const body of [`Watch https://youtu.be/${id} here.`,`[Watch this](https://youtu.be/${id})`,`\`https://youtu.be/${id}\``,`https://youtu.be/invalid`,`https://youtube.com.evil.example/watch?v=${id}`]){
  assert(!(await render(body)).includes('blog-youtube'));
 }
});
test('several single-newline URLs get separate previews; Vimeo retains its existing embed',async()=>{
 const html=await render(`https://youtu.be/${id}\nhttps://youtube.com/shorts/${id}\nhttps://vimeo.com/76979871`);
 assert.equal((html.match(/class="blog-embed blog-youtube"/g)||[]).length,2);assert.equal((html.match(/<iframe/g)||[]).length,1);assert(html.includes('https://player.vimeo.com/video/76979871?dnt=1'));
});
