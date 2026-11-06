// Build-only project metadata; no repository-specific project list.
export const normalizeProject = value => String(value || '').normalize('NFKC').replace(/\s+/gu, ' ').trim();
export const projectKey = value => normalizeProject(value).toLowerCase();

export function parseProject(markdown, { warn = console.warn } = {}) {
  const lines = markdown.split(/\r?\n/), removed = new Set();
  let project = '', fields = 0;
  // Only the opening metadata block (optionally after a Markdown heading).
  // An opening standalone Project line is reserved even with a single newline. Code, quotes, lists and
  // later paragraphs are never scanned for fields.
  for (let index = 0; index < Math.min(lines.length, 20); index++) {
    const line = lines[index];
    if (!line.trim() || /^ {0,3}#{1,6}\s+/.test(line)) continue;
    const field = line.match(/^[ \t]{0,3}Project[ \t]*:[ \t]*(.*?)[ \t]*$/i);
    if (!field) break;
    fields++;
    const name = normalizeProject(field[1]);
    if (!name || [...name].length > 80 || /[<>\u0000-\u001f\u007f]/.test(name)) {
      warn('Blog Project metadata is invalid; use a plain name of 1–80 characters.');
      continue; // Invalid text remains visible rather than deleting author prose.
    }
    if (!project) project = name;
    removed.add(index);
  }
  if (fields > 1) warn('Multiple Blog Project fields: the first valid project is used.');
  return { project: project || 'Uncategorized', markdown: removed.size ? lines.filter((_, i) => !removed.has(i)).join('\n').replace(/^\s*\n/, '') : markdown };
}

export function groupProjects(posts, resolve) {
  const groups = new Map();
  for (const post of posts) {
    const name = normalizeProject(resolve(post)) || 'Uncategorized', key = projectKey(name);
    if (!groups.has(key)) groups.set(key, { key, name, count: 0 });
    groups.get(key).count++;
  }
  return [...groups.values()];
}
