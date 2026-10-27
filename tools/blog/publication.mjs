import fs from 'node:fs/promises';
import path from 'node:path';
import { copyPublicSite, writeBlog } from './lib.mjs';

// Replace only a marked build artifact. Source files and prior live deployments
// are never used as the output directory.
export async function buildSite(root, output, prepared, config) {
  root = path.resolve(root); output = path.resolve(output);
  const relative = path.relative(root, output);
  if (relative !== 'dist' && !(relative.startsWith('tmp' + path.sep) && !relative.split(path.sep).includes('..'))) throw new Error('Build output must be this repository’s dist or a subdirectory of tmp.');
  await fs.mkdir(path.dirname(output), { recursive: true });
  const realRoot = await fs.realpath(root), parent = await fs.realpath(path.dirname(output));
  const parentRelative = path.relative(realRoot, parent);
  if (parentRelative.startsWith('..') || path.isAbsolute(parentRelative)) throw new Error('Output parent resolves outside the repository.');
  let existing = false;
  try {
    const stat = await fs.lstat(output);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Output must be a normal build directory.');
    const marker = JSON.parse(await fs.readFile(path.join(output, '.portfolio-blog-build.json'), 'utf8'));
    if (marker.generator !== 'portfolio-discussions-blog') throw new Error('Output is not a previous blog build.');
    existing = true;
  } catch (error) { if (error.code !== 'ENOENT') throw error; if (await fs.stat(output).catch(() => null)) throw new Error('Existing output has no build marker; refusing to replace it.'); }
  const stage = await fs.mkdtemp(path.join(parent, '.blog-stage-'));
  const previous = stage + '.previous';
  let moved = false, complete = false;
  try {
    await copyPublicSite(root, stage);
    await writeBlog(stage, prepared, config, await fs.readFile(path.join(root, 'index.html'), 'utf8'));
    const report = { generator: 'portfolio-discussions-blog', posts: prepared.posts.length, images: prepared.assets.size, syncedAt: new Date().toISOString() };
    await fs.writeFile(path.join(stage, '.portfolio-blog-build.json'), JSON.stringify(report, null, 2));
    if (existing) { await fs.rename(output, previous); moved = true; }
    await fs.rename(stage, output); complete = true;
    if (moved) await fs.rm(previous, { recursive: true, force: true });
    return report;
  } catch (error) {
    if (!complete) { await fs.rm(stage, { recursive: true, force: true }); if (moved) await fs.rename(previous, output); }
    throw error;
  }
}
