import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { normalizeVideo, runMediaTool, validateProbe, VIDEO_LIMITS } from '../transcode.mjs';
import { renderMediaLinks } from '../media.mjs';
import { permittedImage } from '../lib.mjs';
import { testVideo } from './video-fixtures.mjs';

const metadata = (codec = 'hevc', overrides = {}) => ({ format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2', duration: '0.2' }, streams: [{ index: 0, codec_type: 'video', codec_name: codec, width: 64, height: 36, avg_frame_rate: '10/1', r_frame_rate: '10/1', nb_frames: '2', pix_fmt: 'yuv420p', sample_aspect_ratio: '1:1', ...overrides }] });

test('real silent HEVC converts to H.264/yuv420p without changing resolution, frames or adding audio', async () => {
  const bytes = await testVideo({ codec: 'hevc', width: 64, height: 36 });
  const result = await normalizeVideo(bytes, { log: () => {} });
  assert(result.converted); assert.equal(result.width, 64); assert.equal(result.height, 36);
  const verified = await normalizeVideo(result.buffer);
  assert.equal(verified.converted, false); assert.deepEqual(verified.buffer, result.buffer);
  const repeated = await normalizeVideo(bytes, { log: () => {} });
  assert.deepEqual(repeated.buffer, result.buffer, 'same source/settings produce deterministic bytes on the same toolchain');
});

test('compatible H.264 does not invoke FFmpeg or re-encode its original bytes', async () => {
  const bytes = await testVideo({ width: 64, height: 36 }), calls = [];
  const result = await normalizeVideo(bytes, { run: (...args) => { calls.push(args); return runMediaTool(...args); } });
  assert.equal(result.converted, false); assert.equal(calls.length, 1); assert.deepEqual(result.buffer, bytes);
  assert(calls[0][1].includes('-show_entries'));
});

test('HEVC copies compatible AAC packet payloads; other supported audio becomes AAC-LC', async () => {
  for (const codec of ['aac', 'mp3']) {
    const bytes = await testVideo({ codec: 'hevc', width: 64, height: 36, audio: codec }), calls = [];
    await normalizeVideo(bytes, { log: () => {}, run: async (exe, args, options) => {
      const result = await runMediaTool(exe, args, options); calls.push(args);
      if (args.includes('libx264') && codec === 'aac') {
        const input = args[args.indexOf('-i') + 1], output = args.at(-1);
        const packets = async file => JSON.parse(await runMediaTool(process.env.FFPROBE_PATH || 'ffprobe', ['-v','error','-select_streams','a','-show_packets','-show_data_hash','sha256','-show_entries','packet=data_hash','-of','json',file], { timeoutMs: 15000 })).packets.map(p => p.data_hash);
        assert.deepEqual(await packets(output), await packets(input));
      }
      return result;
    } });
    const args = calls.find(a => a.includes('libx264'));
    assert.equal(args[args.indexOf('-c:a') + 1], codec === 'aac' ? 'copy' : 'aac');
  }
});

test('unsupported codecs and duration/resolution/frame-rate/stream limits fail closed', async () => {
  for (const info of [metadata('av1'), metadata('hevc', { width: 7680 }), metadata('hevc', { height: 35 }), metadata('hevc', { avg_frame_rate: '120/1' }), metadata('hevc', { avg_frame_rate: '0/0' }), metadata('hevc', { sample_aspect_ratio: '2:1' }), { ...metadata(), format: { format_name: 'mp4', duration: '121' } }, { ...metadata(), streams: [...metadata().streams, ...metadata().streams] }]) assert.throws(() => validateProbe(info));
  await assert.rejects(normalizeVideo(await testVideo({ codec: 'mpeg4', width: 64, height: 36 })), /H.264 or HEVC/);
  await assert.rejects(normalizeVideo(Buffer.from('not an MP4')));
  await assert.rejects(normalizeVideo(Buffer.alloc(VIDEO_LIMITS.bytes + 1)), /100 MiB/);
});

test('failed conversions, timeouts, oversized or inconsistent outputs always clean temporary files', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-conversion-cleanup-'));
  try {
    for (const mode of ['failure', 'timeout', 'oversized', 'wrong-codec', 'wrong-timing', 'wrong-size']) {
      await assert.rejects(normalizeVideo(Buffer.from('local test bytes'), { tempRoot, log: () => {}, run: async (exe, args) => {
        if (args.includes('-show_entries')) {
          if (args.at(-1).endsWith('input.mp4')) return JSON.stringify(metadata());
          return JSON.stringify(mode === 'wrong-codec' ? metadata() : mode === 'wrong-size' ? metadata('h264', { width: 128 }) : { ...metadata('h264'), format: { format_name: 'mp4', duration: '4' } });
        }
        assert(args.includes('-protocol_whitelist')); assert.equal(args[args.indexOf('-protocol_whitelist')+1], 'file');
        assert(args.includes('-enable_drefs')); assert(args.includes('libx264')); assert(args.includes('+faststart'));
        if (mode === 'failure' || mode === 'timeout') throw Error(mode === 'timeout' ? 'Media processing timed out.' : 'Encoder failed.');
        if (mode === 'oversized') { const handle = await fs.open(args.at(-1), 'w'); await handle.truncate(VIDEO_LIMITS.bytes + 1); await handle.close(); }
        else await fs.writeFile(args.at(-1), 'output test bytes');
        return '';
      } }));
      assert.deepEqual(await fs.readdir(tempRoot), []);
    }
  } finally { await fs.rm(tempRoot, { recursive: true, force: true }); }
});

test('child timeout kills the process; no shell or credentials reach media tools', async () => {
  let killed = false;
  await assert.rejects(runMediaTool('ffmpeg', ['-i', 'local-input.mp4'], { timeoutMs: 20, spawnProcess: (exe, args, options) => {
    assert.equal(options.shell, false); assert(!('GITHUB_TOKEN' in options.env)); assert(!('AWS_SECRET_ACCESS_KEY' in options.env));
    assert(!args.some(a => a.startsWith('https://')));
    const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.kill = () => { killed = true; setImmediate(() => child.emit('close', null)); };
    return child;
  } }), /timed out/);
  assert(killed);
});

test('streamed oversized attachments and encoder-invalid MP4s retain a source link, never a broken player', async () => {
  const source = 'https://github.com/user-attachments/assets/626698e6-0301-4cc5-bd5f-9551096e0ff4';
  for (const streamed of [true, false]) {
    const warnings = [], assets = new Map(); let sent = 0;
    const response = streamed ? new Response(new ReadableStream({ pull(controller) { if (sent++ < 6) controller.enqueue(new Uint8Array(20 * 1024 * 1024)); else controller.close(); } }), { headers: { 'content-type': 'video/mp4' } }) : new Response('invalid', { headers: { 'content-type': 'video/mp4' } });
    const html = await renderMediaLinks(`<p><a href="${source}">${source}</a></p>`, { fetcher: async () => response, permittedUrl: permittedImage, assets, cache: new Map(), warn: text => warnings.push(text) });
    assert(!html.includes('<video')); assert(html.includes(`href="${source}"`)); assert.equal(assets.size, 0); assert.equal(warnings.length, 1);
  }
});
