# Blog 操作说明

日常写作入口：**[Nerawo/portfolio-2026 → Discussions → Blog](https://github.com/Nerawo/portfolio-2026/discussions/categories/blog)**。

只有 **Nerawo** 创建、且位于 **Blog** 分类的 Discussion 会同步。标题、正文和图片直接在 GitHub 编辑，不需要修改网页代码。

**公开提醒：此仓库及 Discussion 原文都是公开的。私密草稿、未公开作品和秘密不要放进帖子，即使后来删除也不能保证消除已经公开的副本。** 未完成的私密草稿先保存在自己的本地文档中。

## 一次性启用（仅尚未配置时需要）

当前已核实：远端已有公开文章 #1，Sync Blog and deploy Pages 在 Discussion 事件后成功部署。以下一次性步骤保留作参考，已完成的设置无需重复操作。本地预览与正式发布独立，正式部署以对应 Actions 运行结果为准。

- 仓库所有者为 Nerawo，数字 ID 为 139722312；你已确认使用该账户发文。
- 公开仓库已经启用 Discussions 和 GitHub Pages，默认分支 main；[文章 #1](https://nerawo.github.io/portfolio-2026/blog/1.html) 已在线。
- 最新核实到的部署为 [Actions 运行 40487201905](https://github.com/Nerawo/portfolio-2026/actions/runs/40487201905)，结果成功；连接账户只有读取权限，本次未调整任何设置。

1. **登录 Nerawo**，打开仓库 **Settings → General → Features**，开启 **Discussions**。不需要发布欢迎帖或测试文章。
2. 到 **Discussions → 分类管理（分类旁的编辑图标）→ New category**，名称填写 **Blog**，格式选择 **Announcement**，保存。确保地址 slug 是 `blog`。
   - Announcement 只允许 maintain/admin 权限创建新帖，但仍可能允许其他用户在 GitHub 原帖中评论。博客没有评论功能，也不读取回复。
   - 原帖若需要限制回复，请独立使用 GitHub 的锁定/讨论管理功能；不要把“网站只允许本人发文”误当作“原帖不允许评论”。本工具不会替你修改或锁定已有 Discussion。
   - GitHub GraphQL 公开分类字段不能区分 Announcement 与普通开放讨论，只能检查名称、slug、ID 和非问答状态。因此 **Announcement 格式必须在 GitHub 分类设置中确认**；构建时另外强制核对 Nerawo 的账户 ID，其他人即便能发帖也不会成为网站文章。
3. **确认准备启用上线后**，在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
   - 仍使用原来的 GitHub Pages 与 `https://nerawo.github.io/portfolio-2026/`，原有页面和路由保留，不迁移平台。
   - 这是从内置分支发布改为“Actions 构建并将完整网站交给 Pages”的一次性调整，避免只生成文件而未部署。配置完成前不要让旧的分支发布和新的构建发布混用。
4. 在 GitHub Desktop 选择正式仓库，检查本次文件，Commit 后 Push 到 **main**。如果 Actions 被仓库设置禁止，需要在 **Settings → Actions → General** 允许 GitHub 官方 Actions。
5. 打开 **Actions → Sync Blog and deploy Pages**。首次也可以点击 **Run workflow → main → Run workflow**。确认 **build** 和 **deploy** 两个任务都成功，再查看网站 `/blog.html`。没有文章时应显示完整空状态。
   - 使用 GitHub 自动提供的短期 `GITHUB_TOKEN`，只在构建步骤读取 Discussions；部署任务独立使用 Pages/OIDC 权限。**无需创建 PAT，也不要把令牌写进文件。**
   - 若现有 `github-pages` 环境要求人工审批，按 GitHub 提示批准该次部署，不会自动绕过保护规则。
   - 可选：首次成功的 Actions Summary 会显示分类 GraphQL ID；可将它设为仓库 Actions Variable `BLOG_CATEGORY_ID`，进一步固定分类身份。日常无需设置或修改它。

## 1. 去哪里写文章

登录 **Nerawo** → 仓库 **Discussions → Blog → New discussion**。标题就是文章标题，正文按普通 GitHub Markdown 编写。不要选其他分类；别的作者创建的帖子，即使位于 Blog，也不会同步。

## 2. 插图、封面与摘要

- **正文图片**：在 GitHub 的正文编辑框拖入、粘贴或上传图片，等待上传完成再发布。支持 GitHub 自动生成的 Markdown 图片，以及正常上传 UI 生成的安全 `<img>`。
- 同步器会**不带登录信息**下载并验证图片，把它们存入当次静态网站的 `blog/media/`，页面不依赖临时签名链接或访客登录。支持 PNG、JPEG、WebP、GIF、AVIF；单张上限 20 MB，不执行 SVG、脚本或任意 HTML。
- 使用 GitHub 编辑器留下的公共附件地址（通常为 `https://github.com/user-attachments/assets/...`），不要从登录后的预览页复制临时签名地址或 private-user-images 地址。
- **摘要可省略**：自动从正文提取，代码块不作为摘要。
- **封面可省略**：没有封面的列表仍完整，不强制填图。
- 需要手动指定时，在正文最前面放下面这段可复制格式。两行都可删掉，只保留需要的字段；摘要放一行。

```markdown
<!-- blog
summary: 用一句话概括这篇文章。
cover: 把 GitHub 上传完成后生成的公共图片地址粘贴到这里
-->

## 小标题

从这里开始写正文。支持列表、引用、普通链接、图片和代码块。
```

上面的 cover 说明文字是写作说明，**发布前请替换为真实地址或删除整行 cover**。最简单的操作是先把封面上传进正文，再将 GitHub 返回的图片 URL 复制到 cover 行；正文里的图片可以保留或移除。

博客界面随中英文切换；**文章不会自动翻译**，标题和正文始终保留你写入的语言。

### 图片与视频的写法

- **图片**：使用上传后生成的 `![图片说明](公共图片地址)`。说明会作为图注，留空则不显示图注；保留图片原比例，支持点击放大、Escape 关闭。
- **GitHub MP4**：将视频拖入 Discussion，等待上传完成，保留 GitHub 返回的附件 URL，**单独放一段，前后各空一行**。不用写 HTML，也不要写成图片语法。同步时匿名检查 MIME、MP4 文件结构、H.264 编码标记及尺寸，再把原字节保存为静态站内视频，不重新剪辑或压缩。播放器有控制条，使用 metadata 预加载，不自动播放，横竖比例保持完整。
- **YouTube / Vimeo**：将分享链接单独放一段。支持 YouTube watch / youtu.be / shorts 和 Vimeo 数字视频地址；Vimeo 非公开分享链接所带的有效 hash 会保留。使用 YouTube 隐私增强域名和 Vimeo DNT 参数，仍会连接服务商，不保证零 Cookie。普通行内链接或 `[观看视频](地址)` 保持链接。
- 每个播放器下方都有**打开视频原链接**入口；网站不接受文章自带的 iframe / video / script HTML。链接必须通过固定服务商域名和视频 ID 检查。
- 视频上限 **100 MiB / 文件**；网页播放器目前支持的是 **H.264 MP4**，建议音轨用 AAC。WebM、MOV、HEVC、非视频附件、无法匿名读取、无效或过大的视频保持普通链接，并在 Actions build 日志写明原因，不会凭附件 URL 猜文件类型。失败链接可以修正后重新同步。GitHub 本身的上传上限依账户方案决定，见下方官方资料。
- 大视频建议用允许外站嵌入的 Vimeo / YouTube。视频被删除、设为私密、限制域名、年龄或地区时可能不能嵌入，可用原链接入口；Vimeo 应允许 nerawo.github.io。任意其他网站的视频地址保持普通链接，不做不受限制的嵌入。
- 图片沿用现有 GitHub 公共上传主机白名单、字节验证和 20 MB 上限；其他主机、SVG 或私有图片会使构建失败，旧网站保留。请把外部图片先上传至公开 Discussion，不要粘贴登录态或临时签名 URL。

公开 GitHub 附件的重定向可能带短期签名，因此构建保存原始公共地址、下载真实媒体并从 Pages 同源提供，访客不需要登录 GitHub。媒体文件只进入生成产物的 blog/media/，不会改写 Discussion。删除文章或移除附件后，下一次完整构建会清理不再使用的媒体。

本次用一个真实公开 MP4（1,668,718 字节）和 PNG（199,569 字节）验证匿名下载；MP4 已在本地模拟 /portfolio-2026/ 子路径中实际播放。YouTube / Vimeo 的真实播放器页面均返回 HTTP 200，但这不代表任意指定视频都允许播放。这是本地媒体兼容性验证记录，正式部署和线上验收以对应 Actions 运行及网站检查为准。

本地测试示例仅保存在忽略的 tmp/blog-media-review/，不进入发布产物；正式 Blog 没有添加测试文章。

## 3. 发布、修改和删除

- **发布**：在 Blog 分类点击 **Start discussion**，自动触发同步。
- **修改**：在自己的 Discussion 中 Edit 标题或正文并保存。地址始终按编号，例如 `/blog/42.html`；改标题不会改变链接。
- **从网站移除**：删除 Discussion，或将它移出 Blog 分类。下一次成功部署会移除相应文章、列表项和不再使用的博客图片，不残留旧 HTML。
- **重新显示**：将本人创建的帖子移回 Blog 分类。
- 网站没有访客上传、编辑或发布入口；Discussion 回复不进入博客。

## 4. 如何确认同步与失败重试

1. 打开 [Actions](https://github.com/Nerawo/portfolio-2026/actions)，进入最近一次 **Sync Blog and deploy Pages**。
2. **build** 的 Summary 显示文章数、验证媒体文件数和分类 ID；**只有 deploy 也成功**才代表线上已更新。事件名称可能是 discussion、push、workflow_dispatch 或 schedule。
3. 失败时看红色步骤和 Summary：缺少分类、权限不足、分页不完整、图片不能公开访问等都会给出原因。失败不会部署空白站点，也不会覆盖上一版线上网站。
4. 修好 GitHub 帖子或设置后，到该工作流点击 **Run workflow → main**，重新获取完整快照。不要只重跑旧 deploy 任务，它可能拿到旧 artifact。也可以对失败运行选择 **Re-run all jobs**。
5. 正常新增、编辑、删除、换分类会立即触发任务，通常需等待几分钟；另有每 6 小时的校准任务应对漏掉的事件。该时间不是保证的上线 SLA，GitHub 队列或审批可能延迟；可随时手动 Run workflow。

## 本地预览：查看真实已发布文章

在正式仓库中依次运行：

```text
node tools/blog/preview.mjs --published
node tools/preview.cjs
```

打开 http://127.0.0.1:4173/blog.html 。第一条命令只读取已发布网站的真实文章，使用本地最新样式、安全媒体检查和渲染；第二条命令将博客请求指向生成缓存，首页、Work、项目页和其他样式脚本仍来自正式仓库。无需令牌，不会修改 Discussion、提交或部署。

- **此前本地缺文的原因**：根目录 blog.html 是 `--empty-preview` 生成的空状态模板；旧预览服务器直接提供根目录文件，而真实文章只存在 Actions 生成并上传的 Pages 产物中。本地当时没有 Discussions 快照、blog/ 文章目录或 dist/ 构建，所以显示空状态，不是文章被删了。
- 缓存只放在忽略目录 tmp/blog-preview-*/；tmp/blog-preview.json 记录来源、文章数、生成时间和缓存位置。来源明确标为 **published-site mirror (not a fresh Discussions snapshot)**。没有伪造 complete Discussions 快照，也不会从这里发布文章。再次运行第一条命令可以刷新已发布内容，不必重启本地服务器。
- 生成成功后才切换预览指针；网络、认证或内容校验失败时保留上次缓存。旧生成目录也保留，不删除原文件。若没有预览缓存但存在有效 dist 构建，预览服务器可使用它的博客文件；两者都不存在时，启动日志会明确提示尚未生成真实数据。
- **与 GitHub 原帖最新状态的区别**：公开镜像反映上一次成功上线的内容。尚未成功部署的修改不会出现在镜像里。要读取最新完整 Discussions 快照，在可信终端的当前进程环境中提供具有仓库及 Discussions 读取权限的 GITHUB_TOKEN，然后运行 `node tools/blog/preview.mjs`（不加 --published）。当前本地进程没有此令牌；不要把令牌写进文件、网页或 Git 仓库。镜像命令不需要、也不会请求你提供令牌。
- 根目录 blog.html 继续作为受版本控制的空状态模板。`node tools/blog/cli.mjs --empty-preview` 只检查空状态设计，不是同步文章的命令；不要将直接打开该模板误认为真实文章数据。
- 正式发布流程不变：Actions 的 `node tools/blog/cli.mjs` 仍用完整 GraphQL 快照核对 Nerawo 账户 ID 和 Blog 分类，生成整个 dist，再由依赖它的部署任务发布。这个本地镜像工具不被工作流调用；tmp/、tools/ 和本地预览数据不进入发布产物。
- 开发检查：`npm test --prefix tools/blog`。图片、视频、iframe 继续使用原有白名单和验证逻辑；本地镜像会重新清洗已发布 HTML，再生成受支持播放器，绝不直接信任远程 iframe 或脚本。

已用真实文章 #1 验证列表、详情、回退链接和 GitHub MP4 实际播放；同时检查 1440、1366、390、320px，中英文、深浅主题。没有新建测试 Discussion，也没有修改任何原帖。

## 资料依据

- [GitHub 分类与 Announcement 发帖权限](https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-categories-for-discussions)
- [Discussion 工作流事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#discussion)
- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [公开仓库附件的无需认证访问](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)

- [YouTube 隐私增强模式与嵌入限制](https://support.google.com/youtube/answer/171780?hl=en)
- [Vimeo 播放器参数与 DNT](https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters)
