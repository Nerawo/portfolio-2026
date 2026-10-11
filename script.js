const projects = [
  {
    title: "Wired Wings",
    tools: "Houdini · Karma XPU",
    year: "2026",
    date: "May 2026",
    summary: "Procedural kinetic system driven by analytical linkages.",
    image: "file/wired-wings/ProceduralMotion.jpg",
    video: "file/wired-wings/ProceduralMotion.mp4",
    pdf: "file/wired-wings/ProceduralMotion.pdf",
    description: "A procedural animation system that reconstructs a kinetic wing sculpture through analytical motion, mechanical linkages, and fully procedural geometry.",
    facts: [["Focus", "Procedural animation"], ["Geometry", "~322K polygons"], ["Render", "1.8 min / frame"]]
  },
  {
    title: "Procedural Building",
    tools: "Houdini · Karma CPU",
    year: "2026",
    date: "April 2026",
    summary: "Parameter-driven architecture and automated facade assembly.",
    image: "file/procedural-building/render_1.jpg",
    video: "file/procedural-building/building_before.mp4",
    pdf: "file/procedural-building/ProcedurallyModelingaBuilding.pdf",
    description: "A customizable apartment-building generator with parameterized dimensions, iterative floor construction, rule-based facade placement, and automatic material assignment.",
    facts: [["Focus", "Procedural modeling"], ["Complexity", "~47K primitives"], ["Render", "~5.5 min / frame"]]
  },
  {
    title: "Ember Field",
    tools: "Python · Maya",
    year: "2026",
    date: "March 2026",
    summary: "Artist-facing Maya scattering tool built with Python.",
    image: "file/ember-field/r_1.jpg",
    video: null,
    pdf: "file/ember-field/WI26_VFX705_02_Lu_Zhang_P04_TreeScatter_FINAL_v01.pdf",
    description: "An artist-facing procedural scattering tool that samples mesh vertices and generates modular campfires, sparks, and stars with controlled randomness and custom orientation logic.",
    facts: [["Focus", "Tool development"], ["Interface", "Custom Maya GUI"], ["System", "Vertex-based scattering"]]
  },
  {
    title: "Kelp Forest",
    tools: "Houdini · Karma",
    year: "2026",
    date: "April 2026",
    summary: "Procedural underwater ecosystem and simulated fish school.",
    image: "file/kelp-forest/kelp.jpg",
    video: "file/kelp-forest/kelp-web.mp4",
    pdf: "file/kelp-forest/Kelp.pdf",
    description: "A dense procedural underwater ecosystem combining ramp-shaped kelp, L-system growth, POP-driven fish schools, height fields, and volumetric atmosphere.",
    facts: [["Focus", "Procedural environment"], ["Geometry", "39.1M polygons"], ["Simulation", "POP fish school"]]
  },
  {
    title: "Steam Clock Integration",
    tools: "Maya · Houdini · Nuke",
    year: "2026",
    date: "March 2026",
    summary: "End-to-end live-action VFX integration pipeline.",
    image: "file/steam-clock-integration/clock.png",
    video: "file/steam-clock-integration/clock.mp4",
    pdf: "file/steam-clock-integration/clock.pdf",
    description: "A live-action VFX integration covering camera tracking, CG asset development, Arnold rendering, Houdini Pyro and atmosphere, multi-pass rendering, and Nuke compositing.",
    facts: [["Focus", "VFX pipeline"], ["FX", "Pyro · VDB fog"], ["Composite", "Multi-layer Nuke"]]
  },
  {
    title: "Newton’s Cradle",
    tools: "Python · Maya",
    year: "2026",
    date: "February 2026",
    summary: "Procedural scene generation and seamless oscillating motion.",
    image: "file/newtons-cradle/NewtonsCradle.jpg",
    video: "file/newtons-cradle/NewtonsCradle-web.mp4",
    pdf: "file/newtons-cradle/NewtonsCradle.pdf",
    description: "A fully procedural Maya scene built with Python, combining modular character construction, automatic alignment, procedural shaders, and sine-driven motion designed to loop seamlessly.",
    facts: [["Focus", "Procedural animation"], ["System", "Modular Python build"], ["Motion", "Expression-driven loop"]]
  }
];

const selectedProjectRoutes = [
  "wired-wings", "procedural-building", "ember-field", "kelp-forest",
  "steam-clock-integration", "newtons-cradle"
];

const list = document.querySelector("#project-list");
const hero = document.querySelector(".hero");
const heroFrameImage = document.querySelector("#hero-scroll-frame");
const currentFrame = document.querySelector("#current-frame");

const HERO_FRAME_COUNT = Number(hero.dataset.frameCount);
let frameRequest = null;
let displayedFrame = 0;

const heroFrames = Array.from({ length: HERO_FRAME_COUNT }, (_, index) =>
  `file/home_page/building-frames/frame-${String(index + 1).padStart(2, "0")}.jpg`
);

heroFrames.slice(1).forEach(src => {
  const image = new Image();
  image.src = src;
});

function updateHeroFrame() {
  frameRequest = null;
  const rect = hero.getBoundingClientRect();
  const scrollDistance = hero.offsetHeight * 0.45;
  const progress = Math.min(1, Math.max(0, -rect.top / scrollDistance));
  const frame = Math.round(progress * (HERO_FRAME_COUNT - 1));

  if (frame !== displayedFrame) {
    heroFrameImage.src = heroFrames[frame];
    displayedFrame = frame;
  }
  currentFrame.textContent = String(frame + 1).padStart(2, "0");
}

function requestHeroFrame() {
  if (!frameRequest) frameRequest = requestAnimationFrame(updateHeroFrame);
}

updateHeroFrame();
window.addEventListener("scroll", requestHeroFrame, { passive: true });
window.addEventListener("resize", requestHeroFrame);

const mediaMarkup = (project, autoplay = false) => project.video
  ? `<video ${autoplay ? "autoplay muted loop playsinline" : "muted loop playsinline"} poster="${project.image}"><source src="${project.video}" type="video/mp4"></video>`
  : `<img src="${project.image}" alt="${project.title}" loading="lazy">`;

projects.forEach((project, index) => {
  const article = document.createElement("article");
  article.className = "project";
  article.tabIndex = 0;
  article.innerHTML = `
    <div class="project-row">
      <span class="project-index">0${index + 1}</span>
      <h3>${project.title}</h3>
      <p class="project-summary">${project.summary}</p>
      <time datetime="2026">${project.date}</time>
      <span class="project-arrow">↗</span>
    </div>
    <div class="project-preview" aria-hidden="true">${mediaMarkup(project)}</div>`;
  const preview = article.querySelector("video");
  article.addEventListener("mouseenter", () => preview?.play());
  article.addEventListener("mouseleave", () => { if (preview) { preview.pause(); preview.currentTime = 0; } });
  article.addEventListener("click", () => { window.location.href = `projects/${selectedProjectRoutes[index]}.html`; });
  article.addEventListener("keydown", event => { if (event.key === "Enter") window.location.href = `projects/${selectedProjectRoutes[index]}.html`; });
  list.appendChild(article);
});

const resumeMenu = document.querySelector(".resume-menu");

document.addEventListener("pointerdown", event => {
  if (resumeMenu.open && !resumeMenu.contains(event.target)) resumeMenu.open = false;
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") resumeMenu.open = false;
});

resumeMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => { resumeMenu.open = false; });
});


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
  const zhSummaries = ["由解析连杆系统驱动的程序化动力装置。","参数驱动的建筑生成与立面自动装配。","使用 Python 开发的 Maya 艺术家散布工具。","程序化水下生态环境与鱼群模拟。","覆盖完整流程的实拍视觉特效整合。","程序化场景生成与无缝往复动画。"];
  document.querySelectorAll(".project").forEach((card, i) => {
    const summary = card.querySelector(".project-summary"); if (summary) summary.textContent = zhSummaries[i];
    const time = card.querySelector("time"); if (time) time.textContent = time.textContent.replace(/May 2026/,"2026年5月").replace(/April 2026/,"2026年4月").replace(/March 2026/,"2026年3月").replace(/February 2026/,"2026年2月");
  });
}
