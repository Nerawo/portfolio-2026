const languageDefaultVersion = "browser-language-v1";
if (localStorage.getItem("portfolio-language-version") !== languageDefaultVersion) {
  const browserLanguage = navigator.languages?.[0] || navigator.language || "en";
  const detectedLanguage = /^zh(?:-|$)/i.test(browserLanguage) ? "zh" : "en";
  localStorage.setItem("portfolio-language", detectedLanguage);
  localStorage.setItem("portfolio-language-version", languageDefaultVersion);
}
const portfolioLang = localStorage.getItem("portfolio-language") || "en";
document.documentElement.lang = portfolioLang === "zh" ? "zh-CN" : "en";
document.documentElement.dataset.lang = portfolioLang;

const themeDefaultVersion = "dark-default-v1";
if (localStorage.getItem("portfolio-theme-version") !== themeDefaultVersion) {
  localStorage.setItem("portfolio-theme", "dark");
  localStorage.setItem("portfolio-theme-version", themeDefaultVersion);
}
document.documentElement.dataset.theme = localStorage.getItem("portfolio-theme") || "dark";

const staticTranslations = {
  zh: {
    "nav a[href$='work.html']": "作品",
    "nav a[href$='index.html']": "首页",
    ".resume-menu summary": "简历",
    ".resume-options a:first-child": "英文简历",
    ".resume-options a:last-child": "中文简历",
    ".hero .eyebrow": "Lu Zhang · 技术美术",
    "#hero-title": "构建程序化系统，\n创造视觉表现。",
    ".hero .intro": "专注 Houdini FX、艺术家工具与实时制作流程。",
    ".hero .text-link": "查看全部作品 →",
    "#reel-title": "作品集锦 · 2026",
    ".reel-meta p:first-child": "技术美术 · 程序化特效 · 工具开发",
    "#work-title": "精选项目",
    ".all-work-link .text-link": "查看全部作品 →",
    ".contact-footer > .eyebrow": "联系方式",
    ".contact-item:nth-child(1) span": "姓名",
    ".contact-item:nth-child(1) p": "张璐",
    ".contact-item:nth-child(2) span": "邮箱",
    ".contact-item:nth-child(3) span": "电话",
    ".contact-item:nth-child(3) a": "（+86）17302195162",
    ".footer-bottom p:first-child": "技术美术",
    ".archive-hero > .eyebrow": "作品归档 · 2025–2026",
    ".archive-hero h1": "全部作品",
    ".archive-intro p:first-child": "涵盖程序化系统、视觉特效、艺术家工具、环境制作与动态影像。",
    ".archive-filters button[data-filter='all']": "全部",
    ".archive-filters button[data-filter='procedural']": "程序化",
    ".archive-filters button[data-filter='tools']": "工具",
    ".archive-filters button[data-filter='vfx']": "视觉特效",
    ".archive-filters button[data-filter='film']": "影像"
  }
};

if (portfolioLang === "zh") {
  Object.entries(staticTranslations.zh).forEach(([selector, value]) => {
    const node = document.querySelector(selector);
    if (!node) return;
    if (selector === "#hero-title") node.innerHTML = value.replace("\n", "<br>");
    else node.textContent = value;
  });
  const zhPhone = document.querySelector(".contact-item:nth-child(3) a");
  if (zhPhone) zhPhone.href = "tel:+8617302195162";
  const count = document.querySelector(".archive-intro p:last-child");
  if (count) count.innerHTML = `<span id="project-count">12</span> 个项目`;
}

document.querySelectorAll("nav").forEach(nav => {
  if (nav.querySelector(".language-toggle")) return;
  const button = document.createElement("button");
  button.className = "language-toggle";
  button.type = "button";
  button.textContent = portfolioLang === "zh" ? "EN" : "中文";
  button.setAttribute("aria-label", portfolioLang === "zh" ? "Switch to English" : "切换为中文");
  const theme = nav.querySelector(".theme-toggle");
  nav.insertBefore(button, theme || nav.querySelector(".resume-menu"));
  button.addEventListener("click", () => {
    localStorage.setItem("portfolio-language", portfolioLang === "zh" ? "en" : "zh");
    location.reload();
  });
});
