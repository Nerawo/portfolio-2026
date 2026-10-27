# 项目详情统一布局审阅

已将 Steam Clock 确认版的布局原则应用到全部 12 个项目详情页。未修改首页、Work 列表、项目名称、文字、翻译或素材。原文件备份在 tmp/before-unified-project-layout/。

页头与主媒体共享最大 1080px 外边界，拆解区最大 1000px 居中；紧凑页头、章节上方标签、主作品与拆解间距和图片下方图注/放大入口保持统一。完整说明与图片并排，复杂节点图、代码及多图独占整行。手机自然单列。

主媒体按自身宽高比展示，竖版和方形播放器的控制条随实际画面宽度，不横跨空容器。不强制套用 Steam Clock 的 16:9 比例。图片、视频和原始素材没有重新编码或裁切。

## 修改文件

- project.css：统一布局与响应式样式。
- project-page.js：按每个项目的实际素材选择 split / wide / diagram / text 章节；完整说明归入左侧文字区，避免多段说明叠到同一个网格位置。
- tools/build-static.cjs：新增 --projects-only，可仅同步项目页，不重写首页或 Work。
- projects/cactus-still-life.html：同步静态布局结构。
- projects/crimson-still-life.html：同步静态布局结构。
- projects/ember-field.html：同步静态布局结构。
- projects/empty-frames.html：同步静态布局结构。
- projects/kelp-forest.html：同步静态布局结构。
- projects/newtons-cradle.html：同步静态布局结构。
- projects/procedural-building.html：同步静态布局结构。
- projects/steam-clock-integration.html：同步静态布局结构。
- projects/when-the-rain-speaks.html：同步静态布局结构。
- projects/wired-wings.html：同步静态布局结构。
- projects/woven-motion.html：同步静态布局结构。
- projects/yellowstone.html：同步静态布局结构。
- 本说明 LAYOUT_REVIEW.md。

Steam Clock 原独立样式 steam-layout.css 保留，但页面已停止引入，所有项目统一使用 project.css，避免后续样式分叉。

## 验证

12 页 × 1440×900 / 1366×768 / 390×844 / 320×844 × 中英文 × 深浅主题，共 192 个组合通过。无横向溢出、加载失败或脚本错误；媒体比例、页头与媒体边界、图片放大和 Escape 返回焦点均通过。逐页比较修改前后 HTML 文字，内容一致；首页、Work 及共享内容文件 SHA-256 保持一致。

机器记录和关键页面桌面/手机截图：C:/Users/Blackawoawo/.codex/visualizations/2026/10/26/01a179d7-c175-7a23-b8eb-f7a83f2134e0/，文件以 unified- 开头。仅本机 Chrome 验证，未部署。

后续仅同步详情页：node tools/build-static.cjs --projects-only。
本地预览：node tools/preview.cjs，然后访问 http://127.0.0.1:4173/ 。审阅后由你在 GitHub Desktop 提交与 Push。
