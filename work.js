const archiveProjects = [
  { title: "Wired Wings", date: "May 2026", tools: "Houdini · Karma XPU", category: "procedural", description: "A procedural kinetic sculpture driven by analytical cam, follower, and linkage systems.", image: "file/wired-wings/ProceduralMotion.jpg", video: "file/wired-wings/ProceduralMotion.mp4", pdf: "file/wired-wings/ProceduralMotion.pdf" },
  { title: "Procedural Building", date: "April 2026", tools: "Houdini · Karma", category: "procedural", description: "A parameter-driven building generator with automated floors, facade elements, and materials.", image: "file/procedural-building/render_1.jpg", video: "file/procedural-building/building_before.mp4", pdf: "file/procedural-building/ProcedurallyModelingaBuilding.pdf" },
  { title: "Ember Field", date: "March 2026", tools: "Python · Maya", category: "tools", description: "An artist-facing procedural scattering tool for generating modular campfire environments.", image: "file/ember-field/r_1.jpg", pdf: "file/ember-field/WI26_VFX705_02_Lu_Zhang_P04_TreeScatter_FINAL_v01.pdf" },
  { title: "Kelp Forest", date: "April 2026", tools: "Houdini · Karma", category: "procedural", description: "A procedural underwater environment with L-system kelp, POP fish, and volumetric depth.", image: "file/kelp-forest/kelp.jpg", video: "file/kelp-forest/kelp-web.mp4", pdf: "file/kelp-forest/Kelp.pdf" },
  { title: "Steam Clock Integration", date: "March 2026", tools: "Maya · Houdini · Nuke", category: "vfx", description: "A live-action VFX integration using tracked cameras, CG rendering, Pyro, fog, and compositing.", image: "file/steam-clock-integration/clock.png", video: "file/steam-clock-integration/clock.mp4", pdf: "file/steam-clock-integration/clock.pdf" },
  { title: "Newton’s Cradle", date: "February 2026", tools: "Python · Maya", category: "tools", description: "A modular procedural scene with automatic alignment, shaders, and seamless oscillating motion.", image: "file/newtons-cradle/NewtonsCradle.jpg", video: "file/newtons-cradle/NewtonsCradle-web.mp4", pdf: "file/newtons-cradle/NewtonsCradle.pdf" },
  { title: "Woven Motion", date: "February 2026", tools: "Python · Maya", category: "tools", description: "External pixel data parsed and reconstructed as a scalable animated three-dimensional quilt.", image: "file/woven-motion/AnimatedQuilt.gif", video: "file/woven-motion/AnimatedQuilt.mp4", pdf: "file/woven-motion/AnimatedQuilt.pdf" },
  { title: "Yellowstone", date: "May 2026", tools: "Unreal Engine 5", category: "procedural", description: "A real-time cinematic environment study inspired by Yellowstone National Park.", image: "file/yellow-stone/ss.jpg", video: "file/yellow-stone/Zhang_LandscapeAnimation.mp4" },
  { title: "Crimson Still Life", date: "March 2026", tools: "Houdini · Nuke · Maya", category: "vfx", description: "A stylized look-development study focused on VEX materials, lighting, and color finishing.", image: "file/crimson/cc.jpg" },
  { title: "Cactus Still Life", date: "2026", tools: "Houdini", category: "procedural", description: "A procedural modeling and shading study built around a stylized cactus composition.", image: "file/cactus/myCactus_11.png", video: "file/cactus/cactus.mp4" },
  { title: "Empty Frames", date: "November 2025", tools: "Maya · Nuke", category: "vfx", description: "A lighting, rendering, and compositing study exploring quiet architectural framing.", image: "file/empty-frame/render_brackdown/frame.jpg", video: "file/empty-frame/render_brackdown/frame.mp4" },
  { title: "When the Rain Speaks", date: "April 2025", tools: "Film · Editing · VFX", category: "film", description: "A documentary about memory, emotion, rain, and the Squamish community.", image: "file/when-the-rain-speaks/22828ed37bc309d681e969576a145ed5.png", link: "https://www.youtube.com/watch?v=JIIpxTXTt58" }
];

const projectRoutes = [
  "wired-wings", "procedural-building", "ember-field", "kelp-forest",
  "steam-clock-integration", "newtons-cradle", "woven-motion", "yellowstone",
  "crimson-still-life", "cactus-still-life", "empty-frames", "when-the-rain-speaks"
];

const grid = document.querySelector("#archive-grid");
const filters = document.querySelectorAll(".archive-filters button");
const resumeMenu = document.querySelector(".resume-menu");

archiveProjects.forEach((project, index) => {
  const card = document.createElement("article");
  card.className = "archive-card";
  card.dataset.category = project.category;
  const projectUrl = `projects/${projectRoutes[index]}.html`;
  const media = project.video
    ? `<video muted loop playsinline preload="none" poster="${project.image}"><source src="${project.video}" type="video/mp4"></video>`
    : `<img src="${project.image}" alt="${project.title}">`;
  card.innerHTML = `
    <div class="archive-media">${media}<span class="archive-number">${String(index + 1).padStart(2, "0")}</span></div>
    <div class="archive-info">
      <h2><a href="${projectUrl}">${project.title}</a></h2><time>${project.date}</time>
      <p><a href="${projectUrl}">${project.description}</a></p>
      <div class="archive-meta"><span>${project.tools}</span><a href="projects/${projectRoutes[index]}.html">View Project ↗</a></div>
    </div>`;
  const video = card.querySelector("video");
  card.querySelector(".archive-media").addEventListener("click", () => { window.location.href = projectUrl; });
  card.addEventListener("mouseenter", () => video?.play());
  card.addEventListener("mouseleave", () => { if (video) { video.pause(); video.currentTime = 0; } });
  grid.appendChild(card);
});

const filterBar = document.querySelector(".archive-filters");
const filterStickTop = parseFloat(getComputedStyle(filterBar).top);
const filterFlowHeight = filterBar.offsetHeight + parseFloat(getComputedStyle(filterBar).marginBottom);
const filterExpandedWidth = filterBar.offsetWidth + 44;
filterBar.style.setProperty("--expanded-filter-width", `${filterExpandedWidth}px`);
const filterBrand = document.createElement("span");
filterBrand.className = "filter-brand";
filterBrand.innerHTML = `<span class="filter-brand-mark">LZ</span>`;
filterBar.prepend(filterBrand);
const filterSentinel = document.createElement("div");
filterSentinel.className = "filter-sticky-sentinel";
filterBar.before(filterSentinel);
const filterIndicator = document.createElement("span");
filterIndicator.className = "filter-indicator";
filterIndicator.setAttribute("aria-hidden", "true");
filterBar.prepend(filterIndicator);

function moveFilterIndicator(button, immediate = false) {
  const barRect = filterBar.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  if (immediate) filterIndicator.style.transition = "none";
  filterBar.style.setProperty("--indicator-x", `${buttonRect.left - barRect.left}px`);
  filterBar.style.setProperty("--indicator-y", `${buttonRect.top - barRect.top}px`);
  filterBar.style.setProperty("--indicator-w", `${buttonRect.width}px`);
  filterBar.style.setProperty("--indicator-h", `${buttonRect.height}px`);
  if (immediate) requestAnimationFrame(() => { filterIndicator.style.transition = ""; });
}

function refreshExpandedIndicator() {
  if (filterBar.classList.contains("is-stuck")) return;
  requestAnimationFrame(() => moveFilterIndicator(document.querySelector(".archive-filters button.active"), true));
}

filterBar.addEventListener("mouseenter", refreshExpandedIndicator);
filterBar.addEventListener("focusin", refreshExpandedIndicator);

let filterTimer;
filters.forEach(button => button.addEventListener("click", () => {
  if (button.classList.contains("active")) return;
  clearTimeout(filterTimer);
  filters.forEach(item => item.classList.toggle("active", item === button));
  button.blur();
  filterBar.classList.remove("is-open");
  if (!filterBar.classList.contains("is-stuck")) moveFilterIndicator(button);
  grid.classList.add("is-filtering");
  filterTimer = setTimeout(() => {
    const filter = button.dataset.filter;
    const visibleCards = [];
    document.querySelectorAll(".archive-card").forEach(card => {
      card.classList.remove("is-revealing");
      const hidden = filter !== "all" && card.dataset.category !== filter;
      card.classList.toggle("is-hidden", hidden);
      if (!hidden) visibleCards.push(card);
    });
    grid.classList.remove("is-filtering");
    visibleCards.forEach((card, index) => {
      card.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 42}ms`);
      card.classList.add("is-revealing");
    });
  }, 170);
}));

requestAnimationFrame(() => moveFilterIndicator(document.querySelector(".archive-filters button.active"), true));
window.addEventListener("resize", () => moveFilterIndicator(document.querySelector(".archive-filters button.active"), true));

function updateStickyFilterState() {
  const isStuck = filterSentinel.getBoundingClientRect().top <= filterStickTop;
  filterBar.classList.toggle("is-stuck", isStuck);
  document.body.classList.toggle("compact-filter-active", isStuck);
  filterSentinel.style.height = isStuck ? `${filterFlowHeight}px` : "0px";
  if (!isStuck) filterBar.classList.remove("is-open");
  if (!isStuck) requestAnimationFrame(() => moveFilterIndicator(document.querySelector(".archive-filters button.active"), true));
}

let stickyFrame;
window.addEventListener("scroll", () => {
  if (stickyFrame) return;
  stickyFrame = requestAnimationFrame(() => {
    updateStickyFilterState();
    stickyFrame = null;
  });
}, { passive: true });
updateStickyFilterState();

filterBrand.addEventListener("click", () => {
  if (filterBar.classList.contains("is-stuck")) {
    filterBar.classList.toggle("is-open");
    refreshExpandedIndicator();
  }
});
document.addEventListener("pointerdown", event => {
  if (filterBar.classList.contains("is-open") && !filterBar.contains(event.target)) filterBar.classList.remove("is-open");
});

document.addEventListener("pointerdown", event => {
  if (resumeMenu.open && !resumeMenu.contains(event.target)) resumeMenu.open = false;
});
document.addEventListener("keydown", event => { if (event.key === "Escape") resumeMenu.open = false; });
resumeMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => { resumeMenu.open = false; }));


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
  applyTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("portfolio-theme", nextTheme);
    applyTheme(nextTheme);
  });
}

if (document.documentElement.dataset.lang === "zh") {
  const descriptions = ["以解析凸轮、从动件和连杆系统驱动的程序化动力雕塑。","具备楼层、立面构件与材质自动化能力的参数化建筑生成器。","用于生成模块化篝火环境的 Maya 程序化散布工具。","结合 L-system 海带、POP 鱼群与体积纵深的程序化水下环境。","结合摄影机跟踪、CG 渲染、Pyro、雾效与合成的实拍 VFX 镜头。","具备自动对齐、程序化材质与无缝摆动的模块化场景系统。","将外部像素数据重构为可扩展三维动画织毯的数据流程。","受黄石国家公园启发的实时电影化环境练习。","聚焦 VEX 材质、灯光与色彩收尾的风格化视觉开发练习。","围绕风格化仙人掌构图展开的程序化建模与材质练习。","以建筑框景为核心的灯光、渲染与合成练习。","关于记忆、雨与 Squamish 社群的短纪录片。"];
  document.querySelectorAll(".archive-card").forEach((card, i) => {
    const p=card.querySelector(".archive-info > p"); if(p) p.textContent=descriptions[i];
    const link=card.querySelector(".archive-meta a"); if(link) link.textContent="查看项目 →";
    const time=card.querySelector("time"); if(time) time.textContent=time.textContent.replace(/May 2026/,"2026年5月").replace(/April 2026/,"2026年4月").replace(/March 2026/,"2026年3月").replace(/February 2026/,"2026年2月").replace(/November 2025/,"2025年11月");
  });
}
