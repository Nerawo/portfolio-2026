(() => {
  const zh = document.documentElement.dataset.lang === 'zh';
  const labels = { notes: '笔记与实验', title: '博客', emptyTitle: '暂时还没有文章。', emptyText: '文章发布后会显示在这里。你也可以先浏览我的作品。', explore: '查看作品 ↗', read: '阅读全文 ↗', back: '← 返回博客列表', published: '发布于', updated: '更新于', original: '在 GitHub 查看原文 ↗' };
  if (zh) document.querySelectorAll('[data-blog-ui]').forEach(node => { node.textContent = labels[node.dataset.blogUi] || node.textContent; });
  document.querySelectorAll('[data-blog-date]').forEach(node => { node.textContent = new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(node.dateTime)); });
  const toggle = document.querySelector('.theme-toggle');
  const icons = '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path></svg><svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.6 8.6 0 0 1 8.8 3.8 8.6 8.6 0 1 0 20.2 15.2Z"></path></svg>';
  const apply = () => { const dark = document.documentElement.dataset.theme === 'dark'; toggle?.setAttribute('aria-pressed', String(dark)); toggle?.setAttribute('aria-label', zh ? dark ? '切换浅色模式' : '切换深色模式' : dark ? 'Switch to light mode' : 'Switch to dark mode'); };
  if (toggle) { toggle.innerHTML = icons; apply(); toggle.addEventListener('click', () => { const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; localStorage.setItem('portfolio-theme', theme); apply(); }); }
  const menu = document.querySelector('.resume-menu');
  document.addEventListener('pointerdown', event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  // Code blocks and wide tables can be scrolled without trapping keyboard users.
  document.querySelectorAll('.blog-prose pre, .blog-prose table').forEach(node => { node.tabIndex = 0; });
})();
