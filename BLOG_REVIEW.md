# Blog 本地实现与验收记录

## 实际改动

保留纯 HTML/CSS/JavaScript 与 GitHub Pages。新增 Blog 列表、按 Discussion 编号生成的详情页、可选封面与摘要、安全 Markdown、公共图片本地化、图片放大、代码块和中英文界面。文章正文不翻译。不新增评论、回复同步、访客写入或浏览器端认证 API。

发布作者按你确认的 Nerawo 配置，匹配登录名及不可变数字 ID 139722312；分类核对 Blog 的名称、slug 和 GraphQL ID。Announcement 格式需要你在 GitHub UI 中设置，API 无法完全反射这一格式。

同步采用完整分页快照；每次在全新的 staging 中复制完整作品集，再生成当前文章集合。成功后替换有工具标记的构建目录；删除或移出分类的文章不残留。构建/API/图片失败时不上传新 Pages artifact；上线部署依赖成功 build。改标题保持 blog/编号.html 不变。

原始代码备份：tmp/before-blog/。此前作品集和 Hero 的其他未提交修改均保留。

### 修改文件

- index.html：仅新增 Blog 导航链接。
- work.html：仅新增 Blog 导航链接。
- projects/cactus-still-life.html：仅新增 Blog 导航链接。
- projects/crimson-still-life.html：仅新增 Blog 导航链接。
- projects/ember-field.html：仅新增 Blog 导航链接。
- projects/empty-frames.html：仅新增 Blog 导航链接。
- projects/kelp-forest.html：仅新增 Blog 导航链接。
- projects/newtons-cradle.html：仅新增 Blog 导航链接。
- projects/procedural-building.html：仅新增 Blog 导航链接。
- projects/steam-clock-integration.html：仅新增 Blog 导航链接。
- projects/when-the-rain-speaks.html：仅新增 Blog 导航链接。
- projects/wired-wings.html：仅新增 Blog 导航链接。
- projects/woven-motion.html：仅新增 Blog 导航链接。
- projects/yellowstone.html：仅新增 Blog 导航链接。
- i18n.js：Blog 中文导航文字；语言按钮仅注入站点主导航。
- styles.css：只为相邻 Blog 导航增加 4px 分隔，手机无重叠。
- .gitignore：排除构建目录及博客依赖。

### 新增文件

- blog.html：真实无文章空状态；线上构建自动重新生成。
- blog.css、blog.js：阅读样式和界面交互。
- tools/blog/config.json：固定仓库与 Nerawo 作者身份。
- tools/blog/lib.mjs：GraphQL 完整获取、过滤、Markdown 安全处理、图片验证和静态页面生成。
- tools/blog/publication.mjs：整站 staging、受保护的构建目录替换及失败回滚。
- tools/blog/cli.mjs：构建入口、失败阶段日志和 GitHub Step Summary。
- tools/blog/package.json、package-lock.json：仅构建期依赖与版本锁。
- tools/blog/test/sync.test.mjs、test/publication.test.mjs：离线回归和真实磁盘重建测试。
- .github/workflows/pages-blog.yml：Discussion 创建/修改/删除/分类变化/转移、main push、手动触发及每 6 小时校准；build → artifact → deploy 串联。官方 Action 采用已核实的固定 SHA。
- BLOG_GUIDE.md：一次性设置、可复制编辑模板、日常操作及失败重试。
- 本记录 BLOG_REVIEW.md。

## 已验证

- 12 项自动化测试通过，包括作者/分类、完整分页、不读取回复、新增/编辑/删除/移入/移出、稳定 URL、过期页面清理、失败回滚、原页面字节保留、安全 Markdown 和图片匿名下载/重定向边界。
- 博客 4 页面状态 × 4 尺寸 × 中英文 × 深浅主题：64 组浏览器检查；包含空状态、有封面列表、正文及无封面文章。
- 原网站 4 个代表入口 × 同样 16 个设备/语言/主题组合：64 组导航检查。没有溢出、重叠、坏图或脚本错误。
- 文章代码块、图片放大、Escape 返回焦点、主题切换；中文正文在英文界面下保持中文，没有自动翻译。
- 一个现有公开 GitHub 上传 PNG 的真实匿名访问通过：1202×660，199569 bytes。不携带 Token 或 Cookie，下载后按内容散列保存；没有上传、修改或发布任何测试文章。
- 原有全部 14 个页面与备份逐字节比较，去掉新增 Blog 导航后完全一致。JavaScript 语法、工作流 YAML、固定官方版本、read-only Discussions 权限及 deploy needs:build 校验通过。前端文件无令牌或认证信息。
- 本地渲染示例只在忽略的 tmp/blog-render-test/ 中，整站打包不会包含 tmp、tools、node_modules、工作流或源视频 *.source.mp4。

## 当前限制与启用步骤

远端 Discussions 尚未开启，连接账户没有管理权限。未创建 Blog 分类或测试帖子，未改远端仓库设置，未提交、Push 或部署。因此真实 GraphQL → GitHub Actions → Pages 仍须启用后进行一次验收；不把本地测试当成线上成功。

登录 Nerawo → 开启 Discussions → 新建 Blog，格式 Announcement → 确认启用后将 Pages Source 选择 GitHub Actions → GitHub Desktop 检查并提交/Push → 工作流 build 与 deploy 都成功。

详细步骤和操作说明见 BLOG_GUIDE.md。当前工作区还包含此前作品集的未提交修改，提交时确保所引用的 JS/CSS 和网页优化素材一并提交，不提交 tmp、node_modules 或私密源文件。

截图与 JSON：C:/Users/Blackawoawo/.codex/visualizations/2026/10/26/01a179d7-c175-7a23-b8eb-f7a83f2134e0/blog-*.png、blog-browser-qa.json。文件名含 test-only 的截图仅展示本地渲染样例；正式页面是 empty 截图。预览命令仍为 node tools/preview.cjs，访问 /blog.html。
