// CI setup only. Reuse compatible tools; never fetch third-party binaries.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function ensureVideoTools({ run = execFileSync, platform = process.platform, ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg', ffprobe = process.env.FFPROBE_PATH || 'ffprobe', log = console.log } = {}) {
  const execute = (command, args, timeout = 10_000) => String(run(command, args, { encoding: 'utf8', timeout, maxBuffer: 2 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], shell: false, windowsHide: true }));
  function check() {
    try {
      const version = tool => {
        const output = execute(tool, ['-version']);
        const match = output.match(/version\s+(?:n)?(\d+)\.(\d+)/);
        if (!match || Number(match[1]) < 5 || Number(match[1]) === 5 && Number(match[2]) < 1) throw new Error('FFmpeg/FFprobe 5.1 or newer is required.');
        return output.split(/\r?\n/)[0];
      };
      const versions = [version(ffmpeg), version(ffprobe)];
      const encoders = execute(ffmpeg, ['-hide_banner', '-encoders']);
      const decoders = execute(ffmpeg, ['-hide_banner', '-decoders']);
      // libx265 is needed by the existing real HEVC regression fixtures.
      for (const codec of ['libx264', 'libx265', 'aac']) if (!new RegExp('^\\s*[VA]\\S*\\s+' + codec + '\\s', 'm').test(encoders)) throw new Error('Missing encoder: ' + codec);
      for (const codec of ['h264', 'hevc', 'aac']) if (!new RegExp('^\\s*[VA]\\S*\\s+' + codec + '\\s', 'm').test(decoders)) throw new Error('Missing decoder: ' + codec);
      return { ok: true, versions };
    } catch (error) { return { ok: false, reason: error.message }; }
  }
  const initial = check();
  if (initial.ok) { log('Using existing compatible video tools; APT skipped.\n' + initial.versions.join('\n')); return { installed: false }; }
  log('Video tools missing or incompatible: ' + initial.reason);
  if (platform !== 'linux') throw new Error('Install compatible FFmpeg/FFprobe locally or configure FFMPEG_PATH and FFPROBE_PATH. Automatic installation is restricted to the Ubuntu CI runner.');
  const aptOptions = ['-o', 'Acquire::Retries=1', '-o', 'Acquire::http::Timeout=20', '-o', 'Acquire::https::Timeout=20', '-o', 'DPkg::Lock::Timeout=30'];
  function apt(args, seconds) {
    log('Ubuntu APT fallback: apt-get ' + args.join(' ') + ' (deadline ' + seconds + 's).');
    try {
      // GNU timeout bounds the process group, including apt/dpkg descendants.
      const output = execute('/usr/bin/sudo', ['-n', '/usr/bin/timeout', '--signal=TERM', '--kill-after=10s', seconds + 's', '/usr/bin/apt-get', ...aptOptions, ...args], (seconds + 20) * 1000);
      log(output);
    } catch (error) {
      const diagnostic = String(error.stderr || error.stdout || error.message).slice(-3000);
      throw new Error('Ubuntu APT fallback failed or exceeded its deadline during "apt-get ' + args.join(' ') + '". Video validation remains required; no Pages build will be published.\n' + diagnostic);
    }
  }
  apt(['update'], 120);
  apt(['install', '--no-install-recommends', '-y', 'ffmpeg'], 300);
  const verified = check();
  if (!verified.ok) throw new Error('APT completed but video capability verification failed: ' + verified.reason);
  log('Ubuntu video tools installed and verified.\n' + verified.versions.join('\n'));
  return { installed: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { ensureVideoTools(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
