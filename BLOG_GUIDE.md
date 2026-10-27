# Blog 操作说明

日常写作入口：**[Nerawo/portfolio-2026 → Discussions → Blog](https://github.com/Nerawo/portfolio-2026/discussions/categories/blog)**。

只有 **Nerawo** 创建、且位于 **Blog** 分类的 Discussion 会同步。标题、正文和图片直接在 GitHub 编辑，不需要修改网页代码。

**公开提醒：此仓库及 Discussion 原文都是公开的。私密草稿、未公开作品和秘密不要放进帖子，即使后来删除也不能保证消除已经公开的副本。** 未完成的私密草稿先保存在自己的本地文档中。

## 一次性启用（审阅本地实现后再做）

本地已完成代码，尚未提交、Push、修改远端设置或部署。实际核实到：

- 仓库所有者为 Nerawo，数字 ID 为 139722312；你已确认使用该账户发文。
- 公开仓库目前 `has_discussions=false`、`has_pages=true`，默认分支 main。
- 近期部署是 main 的内置 `pages-build-deployment`。当前连接账户只有读取权限，无法读取或调整 Pages 管理设置。

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

大视频请使用 YouTube、Vimeo 或独立媒体资源的正常链接，例如 `[观看视频](https://...)`。不会把所有 GitHub 附件都强行当作可播放视频，也不要把视频写成 `![](...)` 图片。构建失败时旧网站继续保留，可更正后重试。

## 3. 发布、修改和删除

- **发布**：在 Blog 分类点击 **Start discussion**，自动触发同步。
- **修改**：在自己的 Discussion 中 Edit 标题或正文并保存。地址始终按编号，例如 `/blog/42.html`；改标题不会改变链接。
- **从网站移除**：删除 Discussion，或将它移出 Blog 分类。下一次成功部署会移除相应文章、列表项和不再使用的博客图片，不残留旧 HTML。
- **重新显示**：将本人创建的帖子移回 Blog 分类。
- 网站没有访客上传、编辑或发布入口；Discussion 回复不进入博客。

## 4. 如何确认同步与失败重试

1. 打开 [Actions](https://github.com/Nerawo/portfolio-2026/actions)，进入最近一次 **Sync Blog and deploy Pages**。
2. **build** 的 Summary 显示文章数、验证图片数和分类 ID；**只有 deploy 也成功**才代表线上已更新。事件名称可能是 discussion、push、workflow_dispatch 或 schedule。
3. 失败时看红色步骤和 Summary：缺少分类、权限不足、分页不完整、图片不能公开访问等都会给出原因。失败不会部署空白站点，也不会覆盖上一版线上网站。
4. 修好 GitHub 帖子或设置后，到该工作流点击 **Run workflow → main**，重新获取完整快照。不要只重跑旧 deploy 任务，它可能拿到旧 artifact。也可以对失败运行选择 **Re-run all jobs**。
5. 正常新增、编辑、删除、换分类会立即触发任务，通常需等待几分钟；另有每 6 小时的校准任务应对漏掉的事件。该时间不是保证的上线 SLA，GitHub 队列或审批可能延迟；可随时手动 Run workflow。

## 本地审阅与验证范围

- 正式空状态：在仓库运行 `node tools/preview.cjs`，访问 `http://127.0.0.1:4173/blog.html`。
- 构建依赖只用于 `tools/blog/`，网页仍为 HTML/CSS/JS，没有浏览器端认证 API 或令牌。
- 开发检查：`npm ci --prefix tools/blog`；`npm test --prefix tools/blog`。
- 生成本地真实空状态：`node tools/blog/cli.mjs --empty-preview`。它不会请求 GitHub、不会生成虚构文章或部署。
- 构建整站：`node tools/blog/cli.mjs`，由 Actions 注入令牌，将完整站点生成到忽略的 `dist/`；失败保留旧产物。不要手工把令牌填进命令或代码。
- 本地临时渲染测试位于忽略目录 `tmp/blog-render-test/`，示例不在正式 `blog/`，不会被发布产物打包。

已完成离线权限/快照/删除清理/稳定链接/失败回滚/安全 Markdown 测试，四种尺寸、中英文、深浅主题的博客与现有导航浏览器检查；对一个现有公开 GitHub 上传图片进行了真实无认证下载验证。

**尚未完成的是启用设置后的真实 GraphQL 分类读取、首次真实文章和 GitHub Actions → Pages 上线验收。** 当前 Discussions 关闭，且你尚未授权发布，所以没有创建测试帖、修改现有 Discussion 或执行部署。最终应由上述一次性步骤完成首轮真实验收。

## 资料依据

- [GitHub 分类与 Announcement 发帖权限](https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-categories-for-discussions)
- [Discussion 工作流事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#discussion)
- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [公开仓库附件的无需认证访问](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
