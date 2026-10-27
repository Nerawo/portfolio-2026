import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import config from '../config.json' with { type: 'json' };
import { preparePosts } from '../lib.mjs';
import { buildSite } from '../publication.mjs';

const category = { id: 'BLOG', name: 'Blog', slug: 'blog', isAnswerable: false };
const post = (title = 'Original title') => ({ number: 1, title, body: 'First body', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', url: 'https://github.com/Nerawo/portfolio-2026/discussions/1', author: { login: 'Nerawo', databaseId: 139722312 }, category });
const snapshot = discussions => ({ repository: config.repository, complete: true, category, discussions });

test('actual disk rebuild handles edit, title change, removal, move out/in and failure without stale pages', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-blog-publish-'));
  try {
    await fs.mkdir(path.join(root, 'projects')); await fs.mkdir(path.join(root, 'file'));
    await fs.writeFile(path.join(root, 'index.html'), '<header class="site-header"><a href="blog.html">Blog</a></header>');
    await fs.writeFile(path.join(root, 'projects/one.html'), 'Original project');
    const output = path.join(root, 'dist');
    const build = async discussions => buildSite(root, output, await preparePosts(snapshot(discussions), config), config);
    await build([post()]); assert((await fs.readFile(path.join(output, 'blog/1.html'), 'utf8')).includes('Original title'));
    await build([{ ...post('Changed title'), body: 'Changed body' }]); assert((await fs.readFile(path.join(output, 'blog/1.html'), 'utf8')).includes('Changed body'));
    await build([{ ...post(), category: { id: 'OTHER', slug: 'other' } }]); await assert.rejects(fs.stat(path.join(output, 'blog/1.html')));
    await build([post()]); assert((await fs.stat(path.join(output, 'blog/1.html'))).isFile());
    await build([]); await assert.rejects(fs.stat(path.join(output, 'blog/1.html'))); assert((await fs.readFile(path.join(output, 'blog.html'), 'utf8')).includes('No posts yet.'));
    await build([post('Keep online')]); const before = await fs.readFile(path.join(output, 'blog/1.html'), 'utf8');
    await assert.rejects(buildSite(root, output, { posts: [], assets: new Map([['nonexistent-parent/bad.png', Buffer.from('bad')]]) }, config));
    assert.equal(await fs.readFile(path.join(output, 'blog/1.html'), 'utf8'), before);
    assert.equal(await fs.readFile(path.join(root, 'projects/one.html'), 'utf8'), 'Original project');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('source directories and unmarked directories cannot be replaced', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-blog-guard-'));
  try {
    await fs.mkdir(path.join(root, 'dist')); await fs.writeFile(path.join(root, 'dist/keep.txt'), 'Keep');
    const empty = { posts: [], assets: new Map() };
    await assert.rejects(buildSite(root, root, empty, config));
    await assert.rejects(buildSite(root, path.join(root, 'projects'), empty, config));
    await assert.rejects(buildSite(root, path.join(root, 'dist'), empty, config));
    assert.equal(await fs.readFile(path.join(root, 'dist/keep.txt'), 'utf8'), 'Keep');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
