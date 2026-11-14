// Build-only directives. User HTML still passes exclusively through the existing renderer.
export function parseMediaGrids(markdown, { warn = console.warn } = {}) {
  const lines = markdown.split(/\r?\n/), chunks = []; let pending = [], fence = null;
  const fenceAt = line => line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  const advanceFence = (line, current) => {
    const match = fenceAt(line); if (!match) return current;
    if (!current) return { char:match[1][0], length:match[1].length };
    return match[1][0] === current.char && match[1].length >= current.length && !match[2].trim() ? null : current;
  };
  const flush = () => { if (pending.length) chunks.push({kind:'text',markdown:pending.join('\n')}); pending = []; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence || fenceAt(line)) { fence = advanceFence(line,fence); pending.push(line); continue; }
    if (!/^:::media-grid\b/.test(line) || (i && lines[i-1].trim())) { pending.push(line); continue; }
    const dimensions = line.match(/^:::media-grid\s+([1-3])\s*[xX]\s*([1-6])\s*$/);
    const stack = ['grid'], raw = [line], items = []; let body = null, localFence = null, invalid = !dimensions, end = i;
    for (let j = i + 1; j < lines.length; j++) {
      const text = lines[j]; raw.push(text); end = j;
      if (localFence || fenceAt(text)) { localFence = advanceFence(text,localFence); if (body) body.push(text); else invalid = true; continue; }
      if (/^:::media-grid\b/.test(text)) { invalid = true; stack.push('grid'); continue; }
      if (/^:::item\s*$/.test(text)) { if (stack.length !== 1 || body) invalid = true; stack.push('item'); body = []; continue; }
      if (/^:::\s*$/.test(text)) {
        const closing = stack.pop();
        if (closing === 'item') { if (body) items.push(body.join('\n')); body = null; }
        if (!stack.length) break;
        continue;
      }
      if (body) body.push(text); else if (text.trim()) invalid = true;
    }
    if (stack.length || !items.length) invalid = true;
    flush(); i = end;
    if (invalid) { warn('Malformed media-grid, unsupported dimensions or nesting: showing safe original Markdown.'); chunks.push({kind:'text',markdown:raw.join('\n')}); continue; }
    const columns = Number(dimensions[1]), rows = Number(dimensions[2]);
    const overflow = items.length > columns * rows;
    if (overflow) warn(`media-grid capacity ${columns}x${rows} exceeded by ${items.length} items: using one column, retaining all content.`);
    const parsed = items.map(value => {
      let text = value.trim(), title = ''; const heading = text.match(/^Title:[ \t]*(.*)(?:\n|$)/i);
      if (heading) { title = heading[1].trim(); text = text.slice(heading[0].length).trim(); }
      const newline = text.indexOf('\n');
      return {title,media:newline < 0 ? text : text.slice(0,newline).trim(),description:newline < 0 ? '' : text.slice(newline+1).trim()};
    });
    chunks.push({kind:'grid',columns,rows,overflow,items:parsed});
  }
  flush(); return chunks;
}

// Only pipeline-generated figures enter here; original safe destinations remain in HTML.
function gridMediaPresentation(html, mediaSlot = false) {
  if (mediaSlot && !/<figure\b/.test(html)) {
    const original = html.match(/^<p>\s*<a\b[^>]*href="(https?:[^"]+)"[^>]*>[^<]*<\/a>\s*<\/p>\s*$/);
    if (original) return '<div class="blog-grid-unavailable" data-grid-video-source="' + original[1] + '"><a href="' + original[1] + '" rel="noopener noreferrer" data-blog-ui="gridVideoUnavailable">Video unavailable — open original ↗</a></div>';
  }
  return html.replace(/<figure class="blog-figure blog-video">([\s\S]*?)<\/figure>/g, (figure, body) => {
    const source = body.match(/<figcaption><a href="([^"]+)"[^>]*data-blog-ui="videoSource"[^>]*>[\s\S]*?<\/a><\/figcaption>/);
    if (!source) return figure; // Getty's existing external preview remains unchanged.
    body = body.replace(source[0], '');
    const link = '<a href="' + source[1] + '" rel="noopener noreferrer" data-blog-ui="gridVideoUnavailable">Video unavailable — open original ↗</a>';
    if (/<video\b/.test(body)) body = '<div class="blog-grid-player">' + body + '<div class="blog-grid-playback-fallback" role="status" hidden>' + link + '</div></div>';
    else body += '<details class="blog-grid-video-help"><summary aria-label="Video playback options" title="Video playback options">↗</summary><div>' + link.replace('data-blog-ui="gridVideoUnavailable"', 'data-blog-ui="videoSource"').replace('Video unavailable — open original', 'Open original video') + '</div></details>';
    return '<figure class="blog-figure blog-video blog-grid-video" data-grid-video-source="' + source[1] + '">' + body + '</figure>';
  });
}

export async function renderMediaGrids(markdown, { render, escape, warn = console.warn }) {
  const output = [];
  for (const block of parseMediaGrids(markdown,{warn})) {
    if (block.kind === 'text') { output.push(await render(block.markdown)); continue; }
    let fallback = block.overflow; const cells = [];
    for (const item of block.items) {
      const media = await render(item.media), description = item.description ? await render(item.description) : '';
      if (!/<figure\b/.test(media)) { warn('media-grid item is not a validated supported media preview: preserving its safe link/text in one-column fallback.'); fallback = true; }
      if (/<figure\b/.test(description)) { warn('media-grid item contains extra media in its description: preserving everything in one-column fallback.'); fallback = true; }
      cells.push('<div class="blog-media-grid-item">' + gridMediaPresentation(media,true) + (item.title ? '<h3 class="blog-media-grid-title">' + escape(item.title) + '</h3>' : '') + (description ? '<div class="blog-media-grid-description">' + gridMediaPresentation(description) + '</div>' : '') + '</div>');
    }
    output.push('<div class="blog-media-grid' + (fallback ? ' blog-media-grid-fallback' : '') + '" style="--media-grid-columns:' + (fallback ? 1 : block.columns) + '">' + cells.join('') + '</div>');
  }
  return output.join('\n');
}

export function mediaGridProse(markdown) {
  return parseMediaGrids(markdown,{warn:()=>{}}).map(block => block.kind === 'text' ? block.markdown : block.items.map(item => [item.title,item.description].filter(Boolean).join('\n\n')).join('\n\n')).join('\n\n');
}
