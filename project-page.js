const projectVideoSizes = {"wired-wings":[1080,1920],"procedural-building":[1920,1080],"kelp-forest":[1080,1620],"steam-clock-integration":[1280,720],"newtons-cradle":[1280,720],"woven-motion":[4320,4320],"yellowstone":[1920,1080],"empty-frames":[1920,1080]};
const order = projectOrder;
const slug = document.body.dataset.project;
const project = projectData[slug];
const root = document.querySelector("#project-root");
const imageSizeAttrs = src => { const d=portfolioImageSizes[src.replace("../", "")]; return d ? `width="${d[0]}" height="${d[1]}"` : ""; };

const sectionMedia = {
  "wired-wings": [
    [["../file/breakdown-assets/wired-wings/reference.webp", "Reference and procedural reconstruction"]],
    [["../file/breakdown-assets/wired-wings/controller.webp", "Cam-follower controller setup"]],
    [["../file/breakdown-assets/wired-wings/linkage.webp", "Analytical linkage construction"]],
    [["../file/breakdown-assets/wired-wings/system.webp", "Endpoint and suspension system"]]
  ],
  "procedural-building": [
    [["../file/breakdown-assets/procedural-building/parameters.webp", "Exposed building parameters"]],
    [["../file/breakdown-assets/procedural-building/floor-types.webp", "Procedural floor-type assembly"]],
    [["../file/breakdown-assets/procedural-building/combined-body.webp", "Combined building body"]],
    [["../file/breakdown-assets/procedural-building/network.webp", "Houdini network organization"]]
  ],
  "ember-field": [
    [["../file/breakdown-assets/ember-field/scatter-result.webp", "Procedural scattering result"]],
    [],
    [["../file/breakdown-assets/ember-field/aim-code.webp", "Custom orientation function"]],
    [["../file/breakdown-assets/ember-field/gui.webp", "Camp Fire Scatter interface"], ["../file/breakdown-assets/ember-field/debugging.webp", "GUI callback debugging"]]
  ],
  "kelp-forest": [
    [["../file/breakdown-assets/kelp-forest/leaf-network.webp", "Procedural kelp leaf network"]],
    [],
    [["../file/breakdown-assets/kelp-forest/fish-system.webp", "POP fish-school system"]],
    [["../file/breakdown-assets/kelp-forest/environment-network.webp", "Environment and volume network"]]
  ],
  "steam-clock-integration": [
    [["../file/breakdown-assets/steam-clock-integration/tracking.webp", "Nuke camera tracking"]],
    [["../file/breakdown-assets/steam-clock-integration/pyro.webp", "Localized Houdini Pyro setup"], ["../file/breakdown-assets/steam-clock-integration/atmosphere.webp", "Procedural atmospheric fog"]],
    [["../file/breakdown-assets/steam-clock-integration/render-layers.webp", "Arnold layered rendering"]],
    []
  ],
  "newtons-cradle": [
    [["../file/breakdown-assets/newtons-cradle/character.webp", "Procedural character construction"], ["../file/breakdown-assets/newtons-cradle/code.webp", "Python system structure"]],
    [],
    [],
    [["../file/breakdown-assets/newtons-cradle/shaders.webp", "Generated shader library"]]
  ],
  "woven-motion": [
    [["../file/breakdown-assets/woven-motion/frame-01.webp", "Source animation frame"]],
    [],
    [["../file/breakdown-assets/woven-motion/layout.webp", "Procedural tile layout"]],
    [["../file/breakdown-assets/woven-motion/debugging.webp", "Animation build debugging"]]
  ]
};

if (!project) {
  root.innerHTML = `<section class="case-header"><h1>Project not found.</h1><p><a href="../work.html">Return to Work</a></p></section>`;
} else {
  document.title = `${project.title} — Lu Zhang`;
  const hero = project.video
    ? `<video ${projectVideoSizes[slug] ? `width="${projectVideoSizes[slug][0]}" height="${projectVideoSizes[slug][1]}"` : ""} controls playsinline preload="none" poster="${project.poster || ""}"><source src="${project.hero}" type="video/mp4"></video>`
    : `<img ${imageSizeAttrs(project.hero)} ${project.heroSrcset ? `srcset="${project.heroSrcset}" sizes="(max-width: 720px) 100vw, 90vw"` : ""} src="${project.hero}" alt="${project.title}">`;
  // Existing intrinsic-size records reserve the layout; the browser confirms
  // using naturalWidth/naturalHeight or videoWidth/videoHeight after load.
  const heroDimensions = project.video ? projectVideoSizes[slug] : portfolioImageSizes[project.hero.replace('../', '')];
  const portraitHint = heroDimensions && heroDimensions[1] > heroDimensions[0];
  const heroRatio = heroDimensions ? heroDimensions.join(' / ') : 'auto';
  const heroAspect = heroDimensions ? heroDimensions[0] / heroDimensions[1] : 1;
  const heroNaturalWidth = heroDimensions ? heroDimensions[0] + 'px' : '100%';
  const mediaForSections = sectionMedia[slug] || [];
  const sectionLayouts = {"wired-wings":["wide","diagram","diagram","split"],"procedural-building":["split","wide","split","diagram"],"ember-field":["split","text","diagram","wide"],"kelp-forest":["diagram","text","diagram","diagram"],"steam-clock-integration":["split","wide","diagram","text"],"newtons-cradle":["wide","text","text","diagram"],"woven-motion":["split","text","diagram","diagram"]};
  const sections = project.sections.map(([label, title, paragraphs], sectionIndex) => {
    const inlineItems = mediaForSections[sectionIndex] || [];
    const inlineMarkup = inlineItems.length ? `<div class="case-inline-media ${inlineItems.length > 1 ? "two-up" : ""}">${inlineItems.map(([src, caption]) => `<figure><img ${imageSizeAttrs(src)} src="${src}" alt="${caption}" loading="lazy" decoding="async"><figcaption>${caption}</figcaption></figure>`).join("")}</div>` : "";
    const layout = (sectionLayouts[slug] || [])[sectionIndex] || (inlineItems.length ? "split" : "text");
    return `<section class="case-section case-section--${layout}"><div class="case-section-text"><div class="case-section-label">${label}</div><div class="case-section-copy"><h2>${title}</h2>${paragraphs.map(p => `<p>${p}</p>`).join("")}</div></div>${inlineMarkup}</section>`;
  }).join("");
  const nextSlug = order[(order.indexOf(slug) + 1) % order.length];
  const next = projectData[nextSlug];
  const previousSlug = order[(order.indexOf(slug) + order.length - 1) % order.length];
  const zh = document.documentElement.dataset.lang === "zh";
  root.innerHTML = `
    <div class="case-hero${portraitHint ? " case-hero--portrait" : ""}" data-media-orientation="${portraitHint ? "portrait" : "landscape"}" data-ratio-source="dimensions" style="--hero-media-ratio: ${heroRatio}; --hero-media-aspect: ${heroAspect}; --hero-media-natural-width: ${heroNaturalWidth}">
    <section class="case-header">
      <p class="eyebrow">Case Study · ${project.date}</p><h1>${project.title}</h1>
      <div class="case-lede"><p>${project.intro}</p><div class="case-facts"><p><span>Role</span><span>${project.role}</span></p><p><span>Tools</span><span>${project.tools}</span></p><p><span>Date</span><span>${project.date}</span></p>${project.external ? `<p><span>Film</span><a href="${project.external}" target="_blank" rel="noopener noreferrer">Watch ↗</a></p>` : ""}</div></div>
    </section>
    <div class="case-hero-media">${hero}</div>
    </div>
    <div class="case-body">${sections}</div>
    <nav class="case-project-nav" aria-label="Project navigation"><a href="${previousSlug}.html">← ${zh ? '上一项目' : 'Previous project'}<strong>${projectData[previousSlug].title}</strong></a><a href="../work.html">${zh ? '全部作品' : 'All work'}</a><a href="${nextSlug}.html">${zh ? '下一项目' : 'Next project'} →<strong>${next.title}</strong></a></nav>
    <a class="case-next" href="${nextSlug}.html"><div><span>Next Project</span><strong>${next.title}</strong></div><span class="arrow">↗</span></a>`;
}

const resumeMenu = document.querySelector(".resume-menu");
document.addEventListener("pointerdown", event => { if (resumeMenu.open && !resumeMenu.contains(event.target)) resumeMenu.open = false; });
document.addEventListener("keydown", event => { if (event.key === "Escape") resumeMenu.open = false; });

const projectFooterIsZh = document.documentElement.dataset.lang === "zh";
document.body.insertAdjacentHTML("beforeend", `
  <a class="back-to-work" href="../work.html">
    <span>${projectFooterIsZh ? "返回全部作品" : "Back to all work"}</span><span aria-hidden="true">←</span>
  </a>
  <footer class="contact-footer" id="contact">
    <p class="eyebrow">${projectFooterIsZh ? "联系方式" : "Contact"}</p>
    <div class="contact-grid">
      <div class="contact-item"><span>${projectFooterIsZh ? "姓名" : "Name"}</span><p>${projectFooterIsZh ? "张璐" : "Lu Zhang"}</p></div>
      <div class="contact-item"><span>${projectFooterIsZh ? "邮箱" : "Email"}</span><a href="mailto:17302195162@163.com">17302195162@163.com</a></div>
      <div class="contact-item"><span>${projectFooterIsZh ? "电话" : "Phone"}</span><a href="${projectFooterIsZh ? "tel:+8617302195162" : "tel:+19126569462"}">${projectFooterIsZh ? "（+86）17302195162" : "+1 912 656 9462"}</a></div>
    </div>
    <div class="footer-bottom"><p>${projectFooterIsZh ? "技术美术" : "Technical Artist"}</p><p>© 2026 Lu Zhang</p></div>
  </footer>`);


const themeToggle = document.querySelector(".theme-toggle");
let themeIcons = `
  <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path></svg>
  <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.6 8.6 0 0 1 8.8 3.8 8.6 8.6 0 1 0 20.2 15.2Z"></path></svg>`;

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
  themeToggle?.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

if (themeToggle) {
  themeToggle.innerHTML = themeIcons;
  const savedTheme = localStorage.getItem("portfolio-theme");
  applyTheme(savedTheme || "dark");
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("portfolio-theme", nextTheme);
    applyTheme(nextTheme);
  });
}
