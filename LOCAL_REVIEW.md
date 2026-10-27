# 本地审阅记录 · 2026-10-26

正式仓库：C:\Users\Blackawoawo\Documents\Codex\pofolio_2026\portfolio-2026

只修改此仓库。未提交、Push 或部署。所有旧代码备份在忽略目录 `tmp/before-2026-10-26/`；原始图片、视频与 PDF 均保留，未改名。

## 已实施

- 首页 hero 与 stage 均为 80svh，手机最小高度 520px；桌面首屏露出 Reel 标题与播放器上缘。保留原 48 帧滚动建筑，按实际 hero 高度校准进度，结尾在建筑仍可见时到达。新增 Play Reel · 31s 与 Explore Work，中英文对应；定位预留导航距离。
- 动画首帧优先加载，后续每批 3 帧渐进解码；只切到已成功解码的帧，未就绪保持已显示画面。手机 960px、桌面 1920px WebP；减少动态效果时停在首帧且不加载其余帧。
- 修复全部详情页中文简历乱码、菜单文字和标题编码。静态 HTML 保留可直接访问的 PDF 地址，`site.js` 统一运行时地址；验证读取实际 PDF 文件头与 Content-Type。
- 详情主媒体按完整比例展示并限制最大视口高度，保留控制条。Wired Wings 1080×1920、Kelp Forest 1080×1620，不再沿用横向 cover。Crimson 完整展示，无主体裁切。
- 首页精选常驻缩略图与真实链接；取消遮挡文字的浮动大预览，键盘可见聚焦。所有 Work 封面、标题和项目入口为真实链接。
- 筛选分类始终明确显示；窄屏换行，无 LZ 收缩控件，无隐藏分类；aria-pressed、保留焦点、匹配数与总数分开。筛选栏位于导航下方。
- 详情页提供上一项目、下一项目、全部作品，顺序取自同一项目配置。
- 代码、节点与 GUI 图片延迟加载并预留固有尺寸；支持原图放大、手机平移、关闭按钮与 Escape，关闭后恢复触发位置和焦点。
- 放宽控件点击区域，增大日期、技术说明、图注和导航文字；修复 320px 中文长标题溢出。
- 复用现成参数、连杆、组合建筑体量与 GUI 截图，加强 Wired Wings、Procedural Building、Ember Field 的拆解。没有新增技术事实或生成替代作品。
- 三处项目身份和媒体数据归入 `project-data.js`；`image-sizes.js` 记录实际图片尺寸。项目 HTML 包含静态正文、媒体及项目导航，首页与 Work 也有静态项目列表。修改项目内容后运行 `node tools/build-static.cjs` 同步静态 HTML，避免编辑生成内容。
- 所有项目有准确 title、description 与 Open Graph 分享封面和 URL，原路由保持有效。
- Reel 和主视频不提前下载、无强制自动播放；离开视区或切到后台暂停。Work 桌面悬停预览尊重减少动态效果。

## 可比资源体积（十进制 MB）

| 资源 | 原始 | 网页版本 | 说明 |
|---|---:|---:|---|
| 48 张建筑帧 | 15.20 | 桌面 11.04 / 手机 3.09 | WebP，保留全部帧 |
| 12 个列表图片 | 7.29 | 0.735 | 640px 合计；另有 1280px 版本，无裁切 |
| Building cut.mp4 | 86.05 | 10.92 | 1920×1080 H.264，CRF19，faststart |
| Yellowstone | 78.47 | 14.66 | 1920×1080 H.264，CRF19，faststart |
| Wired Wings | 45.16 | 仍为 45.16 | 试编码 46.25 MB 无收益，未接入并已忽略 |
| Reel | 29.72 | 29.72 | 完全保留原剪辑、时长与文件 |

以上是资源文件体积，不是网页总请求量或性能评分。源文件保留，因此仓库磁盘占用会增加。压缩视频在 2 秒位置抽取对应静帧对照，建筑参数字、建筑细节和山水植被可读；另实际验证视频播放和控制条。原始文件可供你进一步比较，不宣称无损。

## 验证范围

- Chrome：1440×900、1366×768、390×844、320×844；中文/英文 × 深色/浅色 × 全部 14 页，共 224 个页面组合。
- 每个组合检查横向溢出、加载失败图片、页面错误、HTTP 失败；首页 Reel 定位，Work 全部 5 分类与焦点，Wired Wings 放大与 Escape 返回焦点。
- 全部 14 页 × 两种简历入口实际 HTTP 获取，确认 application/pdf 和 %PDF- 文件头；不是只看菜单。
- 独立检查 330 处本地资源引用；禁用 JavaScript 后全部 14 页核心内容与项目入口可用。
- 浏览器首选语言识别、手动选择跨刷新记忆、默认深色、减少动态效果停首帧；真实 currentSrc 到达 frame-48.webp。
- Reel 与 8 个详情视频实际播放、控制条和离开视区暂停，共 9 个播放器。
- 全部根目录 JavaScript 通过 node --check。浏览器解析和渲染 HTML/CSS；未运行外部 W3C 验证服务。
- 这是本机 Chrome 验证，不包含真实 iPhone Safari、Android 设备或网络限速跑分。线上网站未变更，不将本地验证说成线上发布验证。

截图和机器记录位于：`C:/Users/Blackawoawo/.codex/visualizations/2026/10/26/01a179d7-c175-7a23-b8eb-f7a83f2134e0/`。
包括首页、Work、Wired Wings、Kelp Forest、Crimson 的桌面/手机截图，以及 390px 中文浅色截图。

## 需你确认的内容（未改动 PDF 或经历）

1. 首页为 Technical Artist，Reel 旁说明为 Technical Art · Procedural FX · Tool Development；英文简历抬头为 Virtual Production | Motion Capture | Technical Art and VFX，简介也以动捕为主。Reel 片内定位需你结合原剪辑确认，未改剪。
2. 英文简历项目 Echoes of Steam 的软件与制作内容与网站 Steam Clock Integration 相近，但仅凭描述不能确认同一项目。请确认对应关系与最终展示名称，现阶段两处名称均保持原样。
3. 中文简历“参与《项目名称》的动作捕捉制作流程”仍含占位。仓库只找到 PDF，未找到对应可编辑简历源文件；请提供真实名称或允许使用的匿名表述及可编辑源文件。
4. 英文简历为 2 页，Echoes of Steam 的项目要点跨页；建议将整个项目块移到下一页或调整真实内容的排版。中文简历为 1 页，工作经历先 2024 后 2026；建议核实后按倒序统一。英文为 2026 后 2024。未经确认未改任何事实。
5. 中英文纪录片职责表述、动捕项目职责和项目选择不同；请确认是否有意按求职方向分别定制，暂不统一重写。

## 待补素材与接入位置（不创建空链接）

| 素材 | 用途 | 建议格式/比例 | 建议原文件位置 |
|---|---|---|---|
| Wired Wings 控制器/连杆操作录屏 | 将参数输入与翼面运动对应，现有节点图保留 | UI 16:9、1920×1080 以上；最终作品仍保留原竖版 | file/wired-wings/controller-demo.source.mp4 |
| Building 参数变化与前后对比补充 | 现有 cut 已含参数，补更清楚的操作与对照 | 16:9、1920×1080 以上，UI 字体可读 | file/procedural-building/parameter-demo.source.mp4 |
| Ember Field GUI 录屏 | 展示选择输入、调整密度、生成输出 | 16:9、1920×1080 以上，保留鼠标操作 | file/ember-field/tool-demo.source.mp4 |
| 你选择的项目封面 | 减少列表封面裁切，主体完整构图 | 推荐 1600×1000、16:10；原竖图可另留 | file/<原项目目录>/cover.source.png |
| 更新后的 Reel（如你决定） | 职位定位和项目排序由你确定 | 16:9、1920×1080 以上，保留原版 | file/home_page/reel-next.source.mp4 |
| 简历可编辑源文件与真实项目名称 | 消除占位、修正分页和排序 | DOCX 或你原用的源格式 | file/resume/ 下新增源文件 |

建议路径仅为接收约定，页面没有指向这些尚不存在的文件。新素材接入后保留 source 文件，另生成 -web.mp4 或 WebP 网页版；不覆盖原文件。现有 .gitignore 忽略 *.source.mp4，应先在本地保存原片，再提交网页版本。

## 本地预览与后续提交

在正式仓库打开终端：`node tools/preview.cjs`，访问 http://127.0.0.1:4173/ 。Ctrl+C 停止服务器。

审阅满意后，在 GitHub Desktop 选择本仓库，检查 Changes、填写提交说明、Commit to 当前分支，再手动 Push origin。仓库的 Pages 配置可能在 Push 后触发上线，因此本次没有替你执行这些操作。

## 文件清单

修改：.gitignore；index.html、work.html；styles.css、work.css、project.css；script.js、work.js、project-page.js、project-zh.js、i18n.js；projects/ 下全部 12 个原有 HTML。

新增：project-data.js、image-sizes.js、site.js；tools/build-static.cjs、tools/preview.cjs；本审阅记录；file/home_page/building-frames-web/ 下 96 张帧；file/web-images/ 下 24 张图；file/procedural-building/cut-web.mp4；file/yellow-stone/landscape-web.mp4。


### 项目 HTML 逐文件清单

- projects/cactus-still-life.html
- projects/crimson-still-life.html
- projects/ember-field.html
- projects/empty-frames.html
- projects/kelp-forest.html
- projects/newtons-cradle.html
- projects/procedural-building.html
- projects/steam-clock-integration.html
- projects/when-the-rain-speaks.html
- projects/wired-wings.html
- projects/woven-motion.html
- projects/yellowstone.html

### 最终验证结果

224 个页面组合加动画终帧记录共 225 条记录；无实际 HTTP、脚本、图片加载或横向溢出错误。未打开的放大查看器内无 src 的 img 被单独排除，不视为损坏资源。额外完整诊断矩阵无 pageerror。9 个播放器验证通过。

AVIF 抽样：第 1/24/48 帧在 quality 65 下分别约 215/160/117 KB；对应 WebP quality 88 为 317/234/173 KB。AVIF 样本更小，但这两个质量参数并不等价，未将三帧体积比较当作全序列视觉质量认证；本次采用已检查的 WebP，未接入未经完整检查的 AVIF。
