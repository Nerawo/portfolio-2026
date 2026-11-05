// Build-only processing of already-downloaded, structurally validated MP4 bytes.
// FFmpeg never receives Discussion text, remote URLs, credentials or shell code.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

export const VIDEO_LIMITS = Object.freeze({ bytes: 100 * 1024 * 1024, seconds: 120, longSide: 3840, shortSide: 2160, fps: 60, probeMs: 15_000, encodeMs: 180_000 });
const localInput = ['-protocol_whitelist', 'file', '-format_whitelist', 'mov', '-enable_drefs', '0', '-use_absolute_path', '0', '-f', 'mov'];
const rate = value => { const [n, d = '1'] = String(value).split('/').map(Number); return d && Number.isFinite(n / d) ? n / d : NaN; };
const audioCompatible = audio => !audio || (audio.codec_name === 'aac' && audio.profile === 'LC' && audio.channels <= 2 && Number(audio.sample_rate) <= 48000);

export function validateProbe(info) {
  const streams = info?.streams;
  if (!Array.isArray(streams) || streams.length > 2 || !info.format?.format_name?.split(',').includes('mp4')) throw new Error('Unsupported MP4 streams or container.');
  const videos = streams.filter(s => s.codec_type === 'video'), audios = streams.filter(s => s.codec_type === 'audio');
  if (videos.length !== 1 || audios.length > 1 || videos.length + audios.length !== streams.length) throw new Error('Use one video track and at most one audio track.');
  const video = videos[0], audio = audios[0], duration = Number(info.format.duration), fps = rate(video.avg_frame_rate);
  if (!['h264', 'hevc'].includes(video.codec_name)) throw new Error('Only H.264 or HEVC MP4 video is supported.');
  const { width, height } = video;
  if (![width, height].every(n => Number.isInteger(n) && n >= 2 && n % 2 === 0) || Math.max(width, height) > VIDEO_LIMITS.longSide || Math.min(width, height) > VIDEO_LIMITS.shortSide) throw new Error('Video exceeds 3840x2160 (or portrait equivalent), or has odd dimensions.');
  if (!(duration > 0 && duration <= VIDEO_LIMITS.seconds) || !(fps > 0 && fps <= VIDEO_LIMITS.fps) || rate(video.r_frame_rate) > VIDEO_LIMITS.fps || Number(video.nb_frames) > VIDEO_LIMITS.seconds * VIDEO_LIMITS.fps) throw new Error('Video exceeds 120 seconds or 60 fps, or has invalid timing.');
  if (video.sample_aspect_ratio && !['1:1', 'N/A'].includes(video.sample_aspect_ratio)) throw new Error('Use square-pixel video.');
  const rotation = Number(video.side_data_list?.find(s => s.rotation !== undefined)?.rotation || 0);
  if (!Number.isFinite(rotation) || rotation % 90 !== 0) throw new Error('Unsupported video rotation.');
  if (video.codec_name === 'h264' && video.pix_fmt !== 'yuv420p') throw new Error('Use 8-bit yuv420p H.264 for portable playback.');
  if (audio && (!['aac', 'mp3', 'alac', 'ac3', 'eac3', 'opus', 'pcm_s16le', 'pcm_s24le'].includes(audio.codec_name) || !(audio.channels > 0 && audio.channels <= 8) || !(Number(audio.sample_rate) > 0 && Number(audio.sample_rate) <= 192000))) throw new Error('Unsupported audio track.');
  if (video.codec_name === 'h264' && !audioCompatible(audio)) throw new Error('Use AAC-LC or silent H.264 MP4.');
  return { video, audio, duration, fps, width: Math.abs(rotation % 180) === 90 ? height : width, height: Math.abs(rotation % 180) === 90 ? width : height };
}

// One bounded child, no shell. Linux adds OS-level address-space and CPU limits.
export function runMediaTool(executable, args, { timeoutMs, outputFile, spawnProcess = spawn } = {}) {
  return new Promise((resolve, reject) => {
    const env = Object.fromEntries(['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'TMPDIR', 'LANG'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
    env.OMP_NUM_THREADS = '2'; env.OPENBLAS_NUM_THREADS = '1';
    const linux = process.platform === 'linux';
    const child = spawnProcess(linux ? '/usr/bin/prlimit' : executable, linux ? ['--as=3221225472', '--cpu=' + Math.ceil(timeoutMs / 1000), '--', executable, ...args] : args, { shell: false, windowsHide: true, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', failure, outputBytes = 0;
    const fail = message => { failure ||= new Error(message); child.kill('SIGKILL'); };
    const timer = setTimeout(() => fail('Media processing timed out.'), timeoutMs);
    const watcher = outputFile ? setInterval(async () => { try { if ((await fs.stat(outputFile)).size > VIDEO_LIMITS.bytes) fail('Converted MP4 exceeds 100 MiB.'); } catch (error) { if (error.code !== 'ENOENT') fail('Cannot monitor converted video.'); } }, 250) : null;
    for (const [stream, name] of [[child.stdout, 'stdout'], [child.stderr, 'stderr']]) stream.on('data', bytes => { outputBytes += bytes.length; if (outputBytes > 1024 * 1024) { fail('Media diagnostic output exceeded its limit.'); return; } if (name === 'stdout') stdout += bytes; else stderr += bytes; });
    child.on('error', () => { failure ||= new Error('FFmpeg/FFprobe is unavailable; install both build tools.'); });
    child.on('close', code => { clearTimeout(timer); if (watcher) clearInterval(watcher); if (failure) reject(failure); else if (code !== 0) reject(new Error('Media tool rejected the file (exit ' + code + '): ' + stderr.replace(/[\r\n]+/g, ' ').trim().slice(-1200))); else resolve(stdout); });
  });
}

async function probe(file, run, probePath) {
  const json = await run(probePath, ['-v', 'error', '-max_alloc', '67108864', '-threads', '2', ...localInput, '-show_entries', 'format=format_name,duration:stream=index,codec_type,codec_name,codec_tag_string,profile,pix_fmt,width,height,avg_frame_rate,r_frame_rate,nb_frames,sample_aspect_ratio,channels,sample_rate:stream_side_data=rotation', '-of', 'json', file], { timeoutMs: VIDEO_LIMITS.probeMs });
  try { return validateProbe(JSON.parse(json)); } catch (error) { throw new Error('MP4 probe validation failed: ' + error.message); }
}

export async function normalizeVideo(bytes, { run = runMediaTool, ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg', ffprobe = process.env.FFPROBE_PATH || 'ffprobe', tempRoot = os.tmpdir(), log = console.log } = {}) {
  if (!bytes.length || bytes.length > VIDEO_LIMITS.bytes) throw new Error('MP4 exceeds 100 MiB or is empty.');
  const directory = await fs.mkdtemp(path.join(tempRoot, 'portfolio-video-'));
  const input = path.join(directory, 'input.mp4'), output = path.join(directory, 'output.mp4');
  try {
    await fs.writeFile(input, bytes, { mode: 0o600 });
    const original = await probe(input, run, ffprobe);
    if (original.video.codec_name === 'h264') return { buffer: bytes, width: original.width, height: original.height, converted: false };
    const started = performance.now();
    const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-max_alloc', '67108864', '-threads', '2', '-filter_threads', '1', '-xerror', '-err_detect', 'explode', ...localInput, '-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-map_metadata', '-1', '-map_chapters', '-1', '-c:v', 'libx264', '-crf', '22', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-threads', '2', '-fps_mode', 'passthrough'];
    if (original.audio) args.push(...(audioCompatible(original.audio) ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-profile:a', 'aac_low', '-b:a', '160k', '-ac', '2', '-ar', '48000']));
    else args.push('-an');
    args.push('-t', String(VIDEO_LIMITS.seconds), '-fs', String(VIDEO_LIMITS.bytes), '-movflags', '+faststart', '-f', 'mp4', output);
    await run(ffmpeg, args, { timeoutMs: VIDEO_LIMITS.encodeMs, outputFile: output });
    const stat = await fs.stat(output);
    if (!stat.size || stat.size > VIDEO_LIMITS.bytes) throw new Error('Converted MP4 is empty or exceeds 100 MiB.');
    const result = await probe(output, run, ffprobe);
    const knownFrames = Number.isFinite(Number(original.video.nb_frames)) && Number(original.video.nb_frames) > 0;
    if (result.video.codec_name !== 'h264' || result.video.pix_fmt !== 'yuv420p' || result.width !== original.width || result.height !== original.height || Math.abs(result.duration - original.duration) > Math.max(.15, 2 / original.fps) || Math.abs(result.fps - original.fps) > .1 || Boolean(result.audio) !== Boolean(original.audio) || !audioCompatible(result.audio) || (knownFrames && Number(original.video.nb_frames) !== Number(result.video.nb_frames))) throw new Error('Converted MP4 failed codec, dimensions, timing or audio verification.');
    const buffer = await fs.readFile(output), elapsedMs = Math.round(performance.now() - started);
    log(`Blog HEVC converted: ${bytes.length} -> ${buffer.length} bytes; ${original.width}x${original.height}; ${original.fps} fps; ${elapsedMs} ms; audio ${original.audio ? audioCompatible(original.audio) ? 'AAC copied' : 'AAC-LC encoded' : 'none'}.`);
    return { buffer, width: result.width, height: result.height, converted: true, elapsedMs };
  } finally {
    // directory is exclusively owned by this mkdtemp call; input is never the source asset.
    await fs.rm(directory, { recursive: true, force: true });
  }
}
