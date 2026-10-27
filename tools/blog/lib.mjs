import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { Marked } from 'marked';
import sanitize from 'sanitize-html';
import { imageSize } from 'image-size';

export const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const plain = value => sanitize(value, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const deadline = () => AbortSignal.timeout(30_000);

export function safeLink(value, base) {
  if (!value) return '';
  if (value.startsWith('#')) return value;
  try {
    const url = new URL(value, base);
    if (!['https:', 'http:', 'mailto:'].includes(url.protocol) || url.username || url.password) return '';
    return url.href;
  } catch { return ''; }
}

export function parseEditorial(body) {
  // Both directives are optional. Normal titles and Markdown remain the source.
  const match = body.match(/^\s*<!--\s*blog\s*\n([\s\S]*?)\n-->\s*/i);
  let summary = '', cover = '';
  if (match) {
    for (const line of match[1].split('\n')) {
      const field = line.match(/^\s*(summary|cover):\s*(.*?)\s*$/i);
      if (!field) { if (line.trim()) throw new Error('Invalid blog metadata: use only summary: or cover: on one line.'); continue; }
      if (field[1].toLowerCase() === 'summary') summary = plain(field[2]).slice(0, 320);
      else cover = field[2];
    }
  }
  return { markdown: match ? body.slice(match[0].length) : body, summary, cover };
}

function markdownParser() {
  const headings = new Map();
  const parser = new Marked({ gfm: true, breaks: false });
  parser.use({ renderer: {
    html({ text }) {
      // GitHub's normal upload UI can emit an HTML img. Only that inert form survives.
      return sanitize(text, { allowedTags: ['img'], allowedAttributes: { img: ['src', 'alt', 'width', 'height'] }, allowedSchemes: ['https'], allowProtocolRelative: false });
    },
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const slug = plain(text).toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-') || 'section';
      const n = headings.get(slug) || 0; headings.set(slug, n + 1);
      const id = n ? `${slug}-${n}` : slug;
      const level = Math.min(6, depth + 1);
      return `<h${level} id="${escape(id)}">${text}</h${level}>\n`;
    }
  } });
  return parser;
}

export function cleanMarkdown(markdown, discussionUrl) {
  const html = markdownParser().parse(markdown);
  return sanitize(html, {
    allowedTags: ['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'del', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: { a: ['href', 'title', 'rel'], img: ['src', 'alt', 'width', 'height'], code: ['class'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'], ol: ['start'] },
    allowedClasses: { code: [/^language-[a-zA-Z0-9_-]+$/] },
    allowedSchemes: ['https', 'http', 'mailto'], allowedSchemesByTag: { img: ['https'] }, allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attrs) => ({ tagName, attribs: { ...attrs, href: safeLink(attrs.href, discussionUrl), rel: 'noopener noreferrer' } }),
      img: (tagName, attrs) => ({ tagName, attribs: { ...attrs, src: safeLink(attrs.src, discussionUrl) } })
    }
  });
}

export function selectPosts(snapshot, config) {
  if (!snapshot || snapshot.repository !== config.repository || snapshot.complete !== true) throw new Error('Incomplete or wrong-repository snapshot; refusing to build.');
  const category = snapshot.category;
  if (!category?.id || category.name !== config.category.name || category.slug !== config.category.slug || category.isAnswerable !== false) throw new Error('The dedicated Blog category is missing or misconfigured.');
  const seen = new Set();
  return snapshot.discussions.filter(post => {
    // Category ID plus slug and immutable numeric author ID, not event sender or replies.
    return post.category?.id === category.id && post.category?.slug === category.slug && config.authors.some(author => post.author?.login?.toLowerCase() === author.login.toLowerCase() && post.author?.databaseId === author.databaseId);
  }).map(post => {
    if (!Number.isSafeInteger(post.number) || post.number <= 0 || seen.has(post.number)) throw new Error('Invalid or duplicated discussion number.');
    seen.add(post.number);
    for (const field of ['createdAt', 'updatedAt']) if (!/^\d{4}-\d\d-\d\dT/.test(post[field]) || !Number.isFinite(Date.parse(post[field]))) throw new Error('Invalid post date.');
    if (typeof post.title !== 'string' || typeof post.body !== 'string' || post.body.length > 1_000_000) throw new Error('Invalid post content.');
    const expectedUrl = `https://github.com/${config.repository}/discussions/${post.number}`;
    if (post.url !== expectedUrl) throw new Error('Discussion URL does not belong to the configured repository.');
    return { ...post, path: `${post.number}.html` };
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.number - a.number);
}

export async function fetchSnapshot(config, token, { fetcher = fetch, categoryId = process.env.BLOG_CATEGORY_ID } = {}) {
  if (!token) throw new Error('GITHUB_TOKEN is required for live sync. No public API fallback is used.');
  const [owner, name] = config.repository.split('/');
  const repoResponse = await fetcher(`https://api.github.com/repos/${config.repository}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-blog-build' }, signal: deadline() });
  if (!repoResponse.ok) throw new Error(`Repository check failed (HTTP ${repoResponse.status}).`);
  const repo = await repoResponse.json();
  if (repo.id !== config.repositoryId || repo.private || repo.full_name?.toLowerCase() !== config.repository.toLowerCase()) throw new Error('Blog sync is restricted to the configured public repository.');
  if (!repo.has_discussions) throw new Error('Discussions is disabled. Enable it and create Blog with Announcement format; see BLOG_GUIDE.md.');
  async function graphql(query, variables) {
    const response = await fetcher('https://api.github.com/graphql', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'portfolio-blog-build' }, body: JSON.stringify({ query, variables }), signal: deadline() });
    if (!response.ok) throw new Error(`GitHub GraphQL failed (HTTP ${response.status}); verify discussions: read permission.`);
    const result = await response.json();
    if (result.errors?.length || !result.data?.repository) throw new Error('GitHub returned an incomplete GraphQL result; previous deployment is retained.');
    return result.data.repository;
  }
  const categoryResult = await graphql(`query($owner:String!,$name:String!){repository(owner:$owner,name:$name){discussionCategories(first:100){nodes{id name slug isAnswerable} pageInfo{hasNextPage}}}}`, { owner, name });
  if (categoryResult.discussionCategories.pageInfo.hasNextPage) throw new Error('Category list is incomplete.');
  const categories = categoryResult.discussionCategories.nodes.filter(c => c.name === config.category.name && c.slug === config.category.slug && (!categoryId || c.id === categoryId));
  if (categories.length !== 1 || categories[0].isAnswerable) throw new Error('Create exactly one Blog category with Announcement format. Optional BLOG_CATEGORY_ID must match.');
  const category = categories[0];
  const discussions = []; let cursor = null; const cursors = new Set();
  do {
    const result = await graphql(`query($owner:String!,$name:String!,$category:ID!,$after:String){repository(owner:$owner,name:$name){discussions(first:100,after:$after,categoryId:$category,orderBy:{field:CREATED_AT,direction:DESC}){nodes{id number title body createdAt updatedAt url author{login ... on User{databaseId}} category{id slug}} pageInfo{hasNextPage endCursor}}}}`, { owner, name, category: category.id, after: cursor });
    const connection = result.discussions;
    if (!Array.isArray(connection?.nodes) || !connection.pageInfo) throw new Error('Incomplete discussions page.');
    discussions.push(...connection.nodes);
    const next = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
    if (connection.pageInfo.hasNextPage && (!next || cursors.has(next))) throw new Error('Invalid pagination; refusing partial sync.');
    cursor = next; if (cursor) cursors.add(cursor);
  } while (cursor);
  return { repository: config.repository, complete: true, category, discussions };
}

function permittedImage(url) {
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  if (host === 'github.com') return /^\/user-attachments\/assets\/[a-f0-9-]+\/?$/i.test(url.pathname);
  return ['user-images.githubusercontent.com', 'raw.githubusercontent.com', 'objects.githubusercontent.com'].includes(host) || /^github-production-user-asset-[a-z0-9-]+\.s3\.amazonaws\.com$/.test(host) || /^github-production-user-asset-[a-z0-9-]+\.s3[.-][a-z0-9-]+\.amazonaws\.com$/.test(host);
}

export async function downloadImage(source, { fetcher = fetch } = {}) {
  let url;
  try { url = new URL(source); } catch { throw new Error('Invalid image URL. Upload the image in the public Discussion.'); }
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (!permittedImage(url)) throw new Error('Image host is not a supported public GitHub upload host. Use the public Discussion upload UI.');
    // Deliberately never send GitHub credentials or cookies to image hosts.
    const response = await fetcher(url, { redirect: 'manual', credentials: 'omit', signal: deadline(), headers: { Accept: 'image/*', 'User-Agent': 'portfolio-public-image-check' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = response.headers.get('location'); await response.body?.cancel();
      if (!next) throw new Error('Image redirect has no destination.');
      url = new URL(next, url); continue;
    }
    if (!response.ok) throw new Error(`Image is not anonymously accessible (HTTP ${response.status}).`);
    const max = 20 * 1024 * 1024;
    if (Number(response.headers.get('content-length')) > max) { await response.body?.cancel(); throw new Error('Image exceeds 20 MB; export a web-sized image.'); }
    const chunks = []; let length = 0;
    for await (const chunk of response.body) { length += chunk.length; if (length > max) throw new Error('Image exceeds 20 MB.'); chunks.push(chunk); }
    const buffer = Buffer.concat(chunks);
    let dimensions; try { dimensions = imageSize(buffer); } catch { throw new Error('Image response is not a supported image. Login pages and expired private URLs are rejected.'); }
    const ext = { jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif', webp: 'webp', avif: 'avif' }[dimensions.type];
    if (!ext || !dimensions.width || !dimensions.height || dimensions.width * dimensions.height > 100_000_000) throw new Error('Unsupported image type or dimensions. Use PNG, JPEG, WebP, GIF or AVIF.');
    return { buffer, width: dimensions.width, height: dimensions.height, filename: `${digest(buffer)}.${ext}` };
  }
  throw new Error('Too many image redirects.');
}

export async function preparePosts(snapshot, config, { fetcher = fetch } = {}) {
  const selected = selectPosts(snapshot, config), assets = new Map(), cache = new Map();
  async function image(source) {
    if (!cache.has(source)) cache.set(source, downloadImage(source, { fetcher }).then(result => { assets.set(result.filename, result.buffer); return result; }));
    return cache.get(source);
  }
  const posts = [];
  for (const post of selected) {
    const editorial = parseEditorial(post.body);
    let html = cleanMarkdown(editorial.markdown, post.url);
    const imageTags = [...html.matchAll(/<img\b[^>]*>/g)];
    for (const [tag] of imageTags) {
      let attrs;
      sanitize(tag, { allowedTags: ['img'], allowedAttributes: { img: ['src', 'alt'] }, transformTags: { img: (tagName, attribs) => { attrs = attribs; return { tagName, attribs }; } } });
      if (!attrs?.src) { html = html.replace(tag, ''); continue; }
      const saved = await image(attrs.src);
      const caption = attrs.alt || '';
      html = html.replace(tag, `<figure class="blog-figure"><div class="case-inline-media"><img src="media/${saved.filename}" alt="${escape(caption)}" width="${saved.width}" height="${saved.height}" loading="lazy" decoding="async"></div>${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>`);
    }
    // Block figures must not live inside a Markdown paragraph; split mixed text/image paragraphs safely.
    html = html.replace(/<p>([\s\S]*?)<\/p>/g, (whole, inside) => inside.includes('<figure') ? inside.split(/(<figure[\s\S]*?<\/figure>)/g).map(part => part.startsWith('<figure') ? part : part.trim() ? `<p>${part}</p>` : '').join('') : whole);
    const summary = editorial.summary || plain(cleanMarkdown(editorial.markdown, post.url).replace(/<pre>[\s\S]*?<\/pre>/g, '')).slice(0, 180);
    const cover = editorial.cover ? await image(editorial.cover) : null;
    posts.push({ ...post, html, summary, cover });
  }
  return { posts, assets };
}

function headerFromIndex(indexHtml, prefix) {
  const header = indexHtml.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
  if (!header) throw new Error('Existing site header was not found.');
  return header.replace(/href="([^"]*)"/g, (all, href) => {
    if (href === '#top') return `href="${prefix}index.html"`;
    if (/^(?:https?:|mailto:|tel:|#)/.test(href)) return all;
    return `href="${prefix}${href}"`;
  });
}

function shell({ title, description, content, indexHtml, prefix, canonical }) {
  return `<!doctype html>\n<html lang="en" data-lang="en" data-theme="dark"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} — Lu Zhang</title><meta name="description" content="${escape(description)}">
<meta property="og:title" content="${escape(title)} — Lu Zhang"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="${prefix ? 'article' : 'website'}"><link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="${prefix}styles.css"><link rel="stylesheet" href="${prefix}blog.css">
</head><body class="blog-page">${headerFromIndex(indexHtml, prefix)}<main class="blog-main">${content}</main>${indexHtml.match(/<footer class="contact-footer"[\s\S]*?<\/footer>/)?.[0] || ""}
<script src="${prefix}i18n.js"></script><script src="${prefix}blog.js"></script><script src="${prefix}site.js"></script></body></html>\n`;
}

const date = iso => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso));
const time = iso => `<time datetime="${escape(iso)}" data-blog-date>${date(iso)}</time>`;

export function renderBlog(prepared, config, indexHtml) {
  const pages = new Map();
  const cards = prepared.posts.map(post => `<article class="blog-entry${post.cover ? ' has-cover' : ''}"><div><p class="blog-date">${time(post.createdAt)}</p><h2><a href="blog/${post.path}">${escape(post.title)}</a></h2><p>${escape(post.summary)}</p><a class="text-link" href="blog/${post.path}" data-blog-ui="read">Read article ↗</a></div>${post.cover ? `<a class="blog-cover" href="blog/${post.path}" tabindex="-1" aria-hidden="true"><img src="blog/media/${post.cover.filename}" alt="" width="${post.cover.width}" height="${post.cover.height}" loading="lazy"></a>` : ''}</article>`).join('\n');
  const empty = `<section class="blog-empty"><h2 data-blog-ui="emptyTitle">No posts yet.</h2><p data-blog-ui="emptyText">Articles will appear here when they are published. In the meantime, explore my work.</p><a class="text-link" href="work.html" data-blog-ui="explore">Explore Work ↗</a></section>`;
  pages.set('blog.html', shell({ title: 'Blog', description: 'Notes on technical art, tools and creative practice by Lu Zhang.', indexHtml, prefix: '', canonical: new URL('blog.html', config.siteUrl).href, content: `<header class="blog-heading"><p class="eyebrow" data-blog-ui="notes">Notes & experiments</p><h1 data-blog-ui="title">Blog</h1></header><div class="blog-list">${cards || empty}</div>` }));
  for (const post of prepared.posts) {
    const content = `<article class="blog-article"><header class="blog-article-header"><a class="blog-back" href="../blog.html" data-blog-ui="back">← All articles</a><p class="blog-date"><span data-blog-ui="published">Published</span> ${time(post.createdAt)}${post.updatedAt !== post.createdAt ? ` <span class="blog-updated"><span data-blog-ui="updated">Updated</span> ${time(post.updatedAt)}</span>` : ''}</p><h1>${escape(post.title)}</h1></header><div class="blog-prose">${post.html}</div><div class="blog-article-bottom"><a href="../blog.html" data-blog-ui="back">← All articles</a><a href="${escape(post.url)}" rel="noopener noreferrer" data-blog-ui="original">Read on GitHub ↗</a></div></article>`;
    pages.set(`blog/${post.path}`, shell({ title: post.title, description: post.summary, content, indexHtml, prefix: '../', canonical: new URL(`blog/${post.path}`, config.siteUrl).href }));
  }
  return pages;
}

export async function writeBlog(output, prepared, config, indexHtml) {
  await fs.mkdir(path.join(output, 'blog', 'media'), { recursive: true });
  // Full snapshot output is freshly staged by the CLI; no stale deleted pages survive.
  for (const [name, html] of renderBlog(prepared, config, indexHtml)) await fs.writeFile(path.join(output, name), html);
  for (const [name, bytes] of prepared.assets) await fs.writeFile(path.join(output, 'blog', 'media', name), bytes);
}

export async function copyPublicSite(source, output) {
  await fs.mkdir(output, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (entry.isFile() && (/\.(html|css|js|ico|webmanifest)$/.test(entry.name) || ['.nojekyll', 'CNAME'].includes(entry.name))) {
      if (entry.name === 'blog.html' || entry.name === 'robots.txt') continue;
      await fs.copyFile(path.join(source, entry.name), path.join(output, entry.name));
    }
  }
  async function copyTree(relative) {
    const input = path.join(source, relative); const dest = path.join(output, relative);
    await fs.mkdir(dest, { recursive: true });
    for (const entry of await fs.readdir(input, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name.endsWith('.source.mp4')) continue;
      if (entry.isSymbolicLink()) throw new Error('Public source contains a symlink; refusing to package.');
      if (entry.isDirectory()) await copyTree(path.join(relative, entry.name));
      else if (entry.isFile()) await fs.copyFile(path.join(input, entry.name), path.join(dest, entry.name));
    }
  }
  for (const dir of ['projects', 'file']) await copyTree(dir);
  try { await fs.copyFile(path.join(source, 'robots.txt'), path.join(output, 'robots.txt')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
}
