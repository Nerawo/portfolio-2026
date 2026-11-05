// Small real encoded fixtures, generated locally; never published as articles.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after } from 'node:test';
import { runMediaTool } from '../transcode.mjs';
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-video-fixtures-'));
after(() => fs.rm(directory, { recursive: true, force: true }));
const cache = new Map();
export async function testVideo({ width = 1920, height = 1080, codec = 'h264', audio } = {}) {
  const key = `${width}-${height}-${codec}-${audio || 'silent'}`;
  if (!cache.has(key)) cache.set(key, (async () => {
    const file = path.join(directory, key + '.mp4');
    const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-f', 'lavfi', '-i', `color=c=gray:s=${width}x${height}:r=10:d=0.2`];
    if (audio) args.push('-f', 'lavfi', '-i', 'sine=frequency=400:sample_rate=44100:duration=0.2');
    args.push('-c:v', codec === 'hevc' ? 'libx265' : codec === 'mpeg4' ? 'mpeg4' : 'libx264', '-threads', '2', '-pix_fmt', 'yuv420p');
    if (codec === 'hevc') args.push('-tag:v', 'hvc1', '-x265-params', 'log-level=error:pools=1:frame-threads=1');
    if (audio) args.push('-c:a', audio); else args.push('-an');
    args.push('-t', '0.2', '-movflags', '+faststart', file);
    await runMediaTool(process.env.FFMPEG_PATH || 'ffmpeg', args, { timeoutMs: 15000 });
    return fs.readFile(file);
  })());
  return cache.get(key);
}
