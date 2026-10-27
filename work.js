const archiveProjects = projectOrder.map(slug => ({...projectData[slug], description: projectData[slug].summary, video: projectData[slug].previewVideo}));
const projectRoutes = projectOrder;

const grid = document.querySelector("#archive-grid");
const filters = document.querySelectorAll(".archive-filters button");
const resumeMenu = document.querySelector(".resume-menu");

grid.innerHTML = "";
archiveProjects.forEach((project, index) => {
  const card = document.createElement("article");
  card.className = "archive-card";
  card.dataset.category = project.category;
  const projectUrl = `projects/${projectRoutes[index]}.html`;
  const media = project.video
    ? `<video muted loop playsinline preload="none" poster="${project.image}"><source src="${project.video}" type="video/mp4"></video>`
    : `<img src="${project.image}" alt="${project.title}" loading="lazy" width="640" height="400">`;
  card.innerHTML = `
    <a class="archive-media" href="${projectUrl}" aria-label="${project.title}">${media}<span class="archive-number">${String(index + 1).padStart(2, "0")}</span></a>
    <div class="archive-info">
      <h2><a href="${projectUrl}">${project.title}</a></h2><time>${project.date}</time>
      <p><a href="${projectUrl}">${project.description}</a></p>
      <div class="archive-meta"><span>${project.tools}</span><a href="projects/${projectRoutes[index]}.html">View Project ↗</a></div>
    </div>`;
  const video = card.querySelector("video");
  card.addEventListener("mouseenter", () => { if (!matchMedia("(prefers-reduced-motion: reduce)").matches && matchMedia("(hover: hover)").matches) video?.play().catch(()=>{}); });
  card.addEventListener("mouseleave", () => { if (video) { video.pause(); video.currentTime = 0; } });
  grid.appendChild(card);
});

const filterBar = document.querySelector('.archive-filters');
const result = document.createElement('p'); result.className='filter-results'; result.setAttribute('role','status'); filterBar.after(result);
function applyFilter(button){
  filters.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
  let count=0;grid.querySelectorAll('.archive-card').forEach(card=>{const hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;card.classList.toggle('is-hidden',hidden);card.hidden=hidden;if(!hidden)count++;else card.querySelector('video')?.pause();});
  result.textContent=document.documentElement.dataset.lang==='zh' ? '匹配 '+count+' 个项目 / 共 '+archiveProjects.length+' 个项目' : count+' matching projects / '+archiveProjects.length+' total';
}
filters.forEach(button=>button.addEventListener('click',()=>applyFilter(button)));applyFilter(filters[0]);

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
  applyTheme(savedTheme || "dark");
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("portfolio-theme", nextTheme);
    applyTheme(nextTheme);
  });
}

if (document.documentElement.dataset.lang === "zh") {
  const descriptions = ["以解析凸轮、从动件和连杆系统驱动的程序化动力雕塑。","具备楼层、立面构件与材质自动化能力的参数化建筑生成器。","用于生成模块化篝火环境的 Maya 程序化散布工具。","结合 L-system 海带、POP 鱼群与体积纵深的程序化水下环境。","结合摄影机跟踪、CG 渲染、Pyro、雾效与合成的实拍 VFX 镜头。","具备自动对齐、程序化材质与无缝摆动的模块化场景系统。","将外部像素数据重构为可扩展三维动画织毯的数据流程。","受黄石国家公园启发的实时电影化环境练习。","聚焦 VEX 材质、灯光与色彩收尾的风格化视觉开发练习。","围绕风格化仙人掌构图展开的程序化建模与材质练习。","以建筑框景为核心的灯光、渲染与合成练习。","关于记忆、雨与 Squamish 社群的短纪录片。"];
  document.querySelectorAll(".archive-card").forEach((card, i) => {
    const p=card.querySelector(".archive-info > p"); if(p) p.querySelector("a").textContent=descriptions[i];
    const link=card.querySelector(".archive-meta a"); if(link) link.textContent="查看项目 →";
    const time=card.querySelector("time"); if(time) time.textContent=time.textContent.replace(/May 2026/,"2026年5月").replace(/April 2026/,"2026年4月").replace(/March 2026/,"2026年3月").replace(/February 2026/,"2026年2月").replace(/November 2025/,"2025年11月");
  });
}
