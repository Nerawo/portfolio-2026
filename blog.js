(() => {
  const zh = document.documentElement.dataset.lang === 'zh';
  const labels = { projects: '项目归档', recent: '最近文章', allArticles: '← 全部文章', uncategorized: '未分类', emptyProjects: '发布文章后会自动生成项目文件夹。', noProjectArticles: '该项目下暂无文章。', notes: '笔记与实验', title: '博客。', emptyTitle: '暂时还没有文章。', emptyText: '文章发布后会显示在这里。你也可以先浏览我的作品。', explore: '查看作品 ↗', read: '阅读全文 ↗', back: '← 返回博客列表', published: '发布于', updated: '更新于', previous: '← 上一篇文章', next: '下一篇文章 →', videoSource: '打开视频原链接 ↗', gettyView: '前往 Getty Images 查看 ↗' };
  if (zh) document.querySelectorAll('[data-blog-ui]').forEach(node => { node.textContent = labels[node.dataset.blogUi] || node.textContent; });
  document.querySelectorAll('.blog-prose [data-blog-source]').forEach(node => {
    const name = node.dataset.blogSource;
    node.textContent = zh ? name ? '来源：' + name + ' ↗' : '查看来源 ↗' : name ? 'Source: ' + name + ' ↗' : 'View source ↗';
  });
  document.querySelector('.blog-article-navigation')?.setAttribute('aria-label', zh ? '文章导航' : 'Article navigation');
  // Progressive enhancement: the complete chronological list remains in HTML.
  const projectList = document.querySelector('[data-blog-project-list]');
  if (projectList) {
    const entries = [...projectList.querySelectorAll('[data-article-project]')];
    const projectLinks = [...projectList.querySelectorAll('[data-blog-project-link]')];
    const folders = [...document.querySelectorAll('[data-blog-project]')];
    const heading = document.querySelector('#blog-recent-heading');
    const intro = document.querySelector('.blog-heading');
    const title = intro.querySelector('h1');
    const eyebrow = intro.querySelector('.eyebrow');
    const breadcrumb = intro.querySelector('.blog-project-breadcrumb');
    const projectSection = document.querySelector('.blog-projects');
    const homeLinks = [...document.querySelectorAll('[data-blog-home]')];
    const clear = document.querySelector('.blog-project-clear');
    const status = document.querySelector('.blog-project-results');
    const empty = document.querySelector('.blog-project-no-results');
    homeLinks.forEach(link => { link.textContent = zh ? '博客' : 'Blog'; });
    const key = text => String(text).normalize('NFKC').replace(/\s+/gu, ' ').trim().toLowerCase();
    const name = folder => folder.dataset.blogProject === 'uncategorized' && zh ? '未分类' : folder.dataset.projectName;
    document.querySelectorAll('[data-project-count]').forEach(node => {
      const count = Number(node.dataset.projectCount);
      node.textContent = zh ? count + ' 篇文章' : count + (count === 1 ? ' article' : ' articles');
    });
    const update = () => {
      const requested = new URL(location.href).searchParams.get('project');
      const selected = requested === null ? null : folders.find(folder => folder.dataset.blogProject === key(requested));
      let visible = 0;
      entries.forEach(entry => { entry.hidden = requested !== null && (!selected || entry.dataset.articleProject !== selected.dataset.blogProject); if (!entry.hidden) visible++; });
      folders.forEach(folder => { if (folder === selected) folder.setAttribute('aria-current', 'true'); else folder.removeAttribute('aria-current'); });
      heading.textContent = requested === null ? zh ? '最近文章' : 'Recent Articles' : selected ? name(selected) : zh ? '未找到项目' : 'Project not found';
      const projectView = requested !== null;
      projectLinks.forEach(link => { link.closest('.blog-entry-project').hidden = projectView; });
      intro.toggleAttribute('data-project-view', projectView);
      projectSection.hidden = projectView;
      heading.hidden = projectView;
      eyebrow.hidden = projectView;
      breadcrumb.hidden = !projectView;
      title.textContent = projectView ? heading.textContent : zh ? labels.title : 'Blog.';
      clear.hidden = !projectView;
      status.hidden = requested === null;
      status.textContent = zh ? visible + ' 篇文章' : visible + (visible === 1 ? ' article' : ' articles');
      empty.hidden = requested === null || visible > 0;
    };
    for (const link of [...folders, ...projectLinks, clear, ...homeLinks]) link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); history.pushState(null, '', link.href); update(); title.focus();
    });
    addEventListener('popstate', update);
    update();
  }

  // Align the fallback with the rendered player, including narrower portrait media.
  document.querySelectorAll('.blog-video > video').forEach(video => {
    const caption = video.parentElement.querySelector('figcaption');
    if (!caption) return;
    const align = () => {
      const width = video.getBoundingClientRect().width;
      caption.style.maxWidth = width + 'px';
    };
    align();
    new ResizeObserver(align).observe(video);
  });
  // No YouTube iframe or playback request exists until the reader activates Play.
  document.querySelectorAll('.blog-prose .blog-youtube[data-youtube-id]').forEach(container => {
    const id = container.dataset.youtubeId, button = container.querySelector('.blog-youtube-play'), thumbnail = button?.querySelector('img');
    if (!/^[A-Za-z0-9_-]{11}$/.test(id || '') || !button || !thumbnail) return;
    button.setAttribute('aria-label', zh ? '播放 YouTube 视频' : 'Play YouTube video');
    let retried = false;
    const retry = () => {
      if (!retried) { retried = true; thumbnail.src = 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg'; }
      else thumbnail.hidden = true;
    };
    thumbnail.addEventListener('error', retry);
    thumbnail.addEventListener('load', () => { if (thumbnail.naturalWidth <= 120) retry(); });
    if (thumbnail.complete && (!thumbnail.naturalWidth || thumbnail.naturalWidth <= 120)) retry();
    button.addEventListener('click', () => {
      const player = document.createElement('iframe');
      player.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      player.title = zh ? 'YouTube 视频播放器' : 'YouTube video player';
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      player.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      player.allowFullscreen = true;
      container.replaceChildren(player);
      player.focus({ preventScroll: true });
    }, { once: true });
  });
  document.querySelectorAll('.blog-prose .blog-getty-link').forEach(link => {
    link.setAttribute('aria-label', zh ? '在新标签页前往 Getty Images 查看视频' : 'View video on Getty Images (opens in a new tab)');
    const image = link.querySelector('img');
    if (image) {
      const fallback = () => { image.hidden = true; };
      image.addEventListener('error', fallback);
      if (image.complete && !image.naturalWidth) fallback();
    }
  });
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
