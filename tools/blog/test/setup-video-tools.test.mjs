import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureVideoTools } from '../setup-video-tools.mjs';
const encoders = ' V....D libx264 H264\n V....D libx265 HEVC\n A..... aac AAC\n';
const decoders = ' V....D h264 H264\n V....D hevc HEVC\n A....D aac AAC\n';
const response = args => args[0] === '-version' ? 'ffmpeg version 8.0.1-3ubuntu2\n' : args.includes('-encoders') ? encoders : decoders;
test('compatible installed tools skip all package/network operations', () => {
  const calls=[];
  assert.deepEqual(ensureVideoTools({ platform:'linux', ffmpeg:'ffmpeg',ffprobe:'ffprobe',log:()=>{},run:(exe,args,options)=>{calls.push({exe,args});assert.equal(options.shell,false);assert(options.timeout<=10000);return response(args);} }),{installed:false});
  assert.equal(calls.length,4);assert(calls.every(c=>c.exe==='ffmpeg'||c.exe==='ffprobe'));
});
test('missing tools use only bounded signed-system-APT setup and must pass verification afterwards', () => {
  let installed=false;const calls=[];
  const result=ensureVideoTools({ platform:'linux',ffmpeg:'ffmpeg',ffprobe:'ffprobe',log:()=>{},run:(exe,args,options)=>{
    calls.push({exe,args,options});
    if(exe==='/usr/bin/sudo'){assert.equal(args[1],'/usr/bin/timeout');assert(args.includes('/usr/bin/apt-get'));assert(args.includes('Acquire::Retries=1'));assert(!args.includes('--allow-unauthenticated'));if(args.includes('install'))installed=true;return 'APT success';}
    if(!installed)throw Error('ENOENT');return response(args);
  }});
  assert.deepEqual(result,{installed:true});const apt=calls.filter(c=>c.exe==='/usr/bin/sudo');assert.equal(apt.length,2);assert(apt[0].args.includes('120s'));assert(apt[1].args.includes('300s'));assert(apt[1].options.timeout<20*60*1000);
});
test('incompatible versions or missing required codecs trigger fallback; no silent acceptance', () => {
  for(const bad of ['version','libx264','libx265','aac','hevc']){
    let installed=false;
    assert.deepEqual(ensureVideoTools({platform:'linux',ffmpeg:'ffmpeg',ffprobe:'ffprobe',log:()=>{},run:(exe,args)=>{
      if(exe==='/usr/bin/sudo'){if(args.includes('install'))installed=true;return '';}
      const good=response(args);if(installed)return good;
      return bad==='version'&&args[0]==='-version'?'ffmpeg version 4.4.2\n':good.replaceAll(bad,'missing');
    }}),{installed:true});
  }
});
test('APT failure/timeout stops setup and does not fall through to media validation or deployment', () => {
  for(const failing of ['update','install']){
    const calls=[];assert.throws(()=>ensureVideoTools({platform:'linux',ffmpeg:'ffmpeg',ffprobe:'ffprobe',log:()=>{},run:(exe,args)=>{calls.push({exe,args});if(exe!=='/usr/bin/sudo')throw Error('Missing');if(args.includes(failing))throw Object.assign(Error('timeout'),{status:124,stderr:'Mirror unavailable'});return '';} }),/APT fallback failed.*deadline/);
    assert.equal(calls.filter(c=>c.exe!=='/usr/bin/sudo').length,1);
  }
});
test('unsuccessful post-install checks fail closed; non-Linux never invokes automatic package installation', () => {
  assert.throws(()=>ensureVideoTools({platform:'linux',ffmpeg:'ffmpeg',ffprobe:'ffprobe',log:()=>{},run:(exe)=>{if(exe==='/usr/bin/sudo')return '';throw Error('Still missing');}}),/capability verification failed/);
  assert.throws(()=>ensureVideoTools({platform:'win32',ffmpeg:'ffmpeg',ffprobe:'ffprobe',log:()=>{},run:()=>{throw Error('Missing');}}),/restricted to the Ubuntu/);
});
