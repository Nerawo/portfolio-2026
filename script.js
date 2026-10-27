const projects = projectOrder.slice(0,6).map(slug => ({...projectData[slug], description: projectData[slug].intro, video: projectData[slug].previewVideo}));
const selectedProjectRoutes = projectOrder.slice(0,6);

const list = document.querySelector("#project-list");
const hero = document.querySelector(".hero");
const heroFrameImage = document.querySelector("#hero-scroll-frame");
const currentFrame = document.querySelector("#current-frame");

const HERO_FRAME_COUNT = Number(hero.dataset.frameCount);
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const mobileFrames = matchMedia('(max-width: 720px)').matches;
const frameURL = i => 'file/home_page/building-frames-web/' + (mobileFrames ? 'mobile' : 'desktop') + '/frame-' + String(i+1).padStart(2,'0') + '.webp';
const readyFrames = new Map();
let frameRequest = null, displayedFrame = 0, targetFrame = 0;
function updateHeroFrame() {
  frameRequest = null;
  const rect = hero.getBoundingClientRect();
  // Finish while the lower part of the building is still visible, independent of viewport height.
  const distance = Math.max(1, hero.offsetHeight - 200);
  targetFrame = motionPreference.matches ? 0 : Math.round(Math.min(1,Math.max(0,-rect.top/distance)) * (HERO_FRAME_COUNT-1));
  const candidates = [...readyFrames.keys()].sort((a,b)=>Math.abs(a-targetFrame)-Math.abs(b-targetFrame));
  const frame = readyFrames.has(targetFrame) ? targetFrame : candidates[0];
  if(frame !== undefined && frame !== displayedFrame) { heroFrameImage.removeAttribute("srcset"); heroFrameImage.src=readyFrames.get(frame).src; displayedFrame=frame; }
  currentFrame.textContent=String(displayedFrame+1).padStart(2,'0');
}
function requestHeroFrame(){if(!frameRequest) frameRequest=requestAnimationFrame(updateHeroFrame);}
async function loadFrame(i){const img=new Image();img.src=frameURL(i);try{await img.decode();readyFrames.set(i,img);if(i===0){heroFrameImage.removeAttribute("srcset");heroFrameImage.src=img.src;}requestHeroFrame();}catch{/* Keep the last decoded frame on screen. */}}
async function loadRemaining(){if(motionPreference.matches)return;for(let i=1;i<HERO_FRAME_COUNT;i+=3){await Promise.all([i,i+1,i+2].filter(n=>n<HERO_FRAME_COUNT).map(loadFrame));}}
loadFrame(0).then(()=>{if('requestIdleCallback' in window)requestIdleCallback(loadRemaining,{timeout:1200});else setTimeout(loadRemaining,200);});
motionPreference.addEventListener('change',()=>{requestHeroFrame();if(!motionPreference.matches)loadRemaining();});
window.addEventListener('scroll',requestHeroFrame,{passive:true});window.addEventListener('resize',requestHeroFrame);

const mediaMarkup = (project, autoplay = false) => project.video
  ? `<video ${autoplay ? "autoplay muted loop playsinline" : "muted loop playsinline"} poster="${project.image}"><source src="${project.video}" type="video/mp4"></video>`
  : `<img src="${project.image}" alt="${project.title}" loading="lazy">`;

list.innerHTML = "";
projects.forEach((project, index) => {
  const article = document.createElement("a");
  article.className = "project";
  article.href = `projects/${selectedProjectRoutes[index]}.html`;
  article.innerHTML = `
    <div class="project-row">
      <img class="project-thumbnail" src="${project.image}" alt="" loading="lazy" width="320" height="240"><span class="project-index">0${index + 1}</span>
      <h3>${project.title}</h3>
      <p class="project-summary">${project.summary}</p>
      <time datetime="2026">${project.date}</time>
      <span class="project-arrow">↗</span>
    </div>
    <div class="project-preview" aria-hidden="true"><img src="${project.image}" alt="" loading="lazy"></div>`;
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
  applyTheme(savedTheme || "dark");
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
