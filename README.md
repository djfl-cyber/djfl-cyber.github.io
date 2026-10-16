# djfl 的 Astro 博客

文章、图片和日期网址已从旁边的 Hexo 工程迁移。这个目录可以作为独立项目使用；旧 Hexo 原始文件仍保留在父目录。主要页面为首页、文章、归档、友链、导航、关于与 404，另有随文章生成的标签和分类页。

本地管理使用 Blog Studio 桌面程序，支持页面设计、文章与素材、设置、组件和发布。见 [使用说明](docs/blog-studio-guide.md) 与 [实施验收记录](docs/blog-studio-progress.md)。

## 启动

使用 Node.js 24.12.0（或与依赖兼容的后续偶数稳定版本）。在这个目录打开终端：

```powershell
npm ci
npm run dev
```

终端打印本地预览地址。`npm run build` 生成 dist；`npm run preview` 预览生产产物。

依赖缓存放在 `.cache/npm`，Astro 临时目录和开发缓存也位于本项目内。全部辅助脚本、浏览器行为脚本、迁移清单、测试与检查产物集中在 `scripts/`。备份和临时验收产物在 `scripts/artifacts/`，不提交到发布源码仓库。

## 新建文章和粘贴图片

```powershell
npm run new -- "文章标题" --slug my-new-post
```

脚本创建 `src/content/posts/my-new-post/index.md` 和 `img/`，默认 `draft: true`。本地开发预览显示草稿，生产构建排除草稿。完成写作后把 `draft` 改为 `false`。文章日期按 Asia/Shanghai 生成，`permalink` 创建后固定；修改标题无需改变网址。

在 VS Code 中打开本目录，或打开 `blog.code-workspace`。这样 `.vscode` 的图片粘贴设置才会应用。粘贴剪贴板截图时，目标路径为当前文章下的 `img/`，正文保留 `![说明](./img/图片.png)`。文件名里的空格可能编码成 `%20`，不需要手动修改。

已有工作区文件的拖入可能只插入链接。需要归档到本篇文章时，先复制到本篇 `img` 中再插入。新增脚本拒绝覆盖重名目录；文章空图片目录通过 `.gitkeep` 保留。也可通过 VS Code“运行任务 → 新建文章”操作。

VS Code 的 Markdown 预览检查正文和图片，浏览器检查最终网站排版。

## 调整外观与栏目

### 在本地管理程序中修改

双击根目录的 `Blog Studio.cmd`，或运行 `npm run edit`。VS Code 的“运行任务 → 打开博客管理程序”也会启动同一程序。

在“设置”选择站点、首页、菜单、页面介绍或组件文字，通过中文表单修改。支持查找本组文字、撤销本组未保存修改、Ctrl / ⌘ + S 保存，以及同屏博客效果预览与浏览器完整预览。保存记录和备份在管理端恢复，外部修改有冲突检查。外观、友链和导航也可在设置中管理。

管理程序只在本机运行，博客页脚不提供管理入口。旧浏览器文字工作台与写入接口已移除。文章与图片在“文章”“素材”中管理；完整操作见 [Blog Studio 使用说明](docs/blog-studio-guide.md)。

### 直接修改配置文件

| 文件 | 作用 |
| --- | --- |
| `src/config/site.json` | 名称、作者简介、域名、页脚、关于页文字 |
| `src/config/appearance.json` | 背景、遮罩、深浅色、配色、字体、正文/侧栏宽度、间距、圆角、装饰开关 |
| `src/config/home.json` | 首页介绍、按钮文案、模块顺序和开关、文章数量、侧栏内容 |
| `src/config/menu.json` | 菜单名称、链接、顺序、启用状态 |
| `src/config/pages.json` | 其他页面标题、说明和空状态文案 |
| `src/config/text.json` | 页眉标识、装饰文字、卡片、侧栏标签、文章按钮及其他公共文案 |
| `src/data/friends.json` | 友链列表 |
| `src/data/navigation.json` | 网站导航列表 |

背景图放在 `public/backgrounds/` 后，把 `backgroundImage` 设为 `/backgrounds/文件名.webp`。`backgroundOverlay` 为遮罩强度，0 表示清晰显示图片，1 表示完全遮住图片；`decorations` 控制首页纸张装饰。可替换 `public/favicon.svg`。颜色使用六位十六进制值；尺寸有范围校验，防止破坏小屏布局。

首页 `modules` 数组的顺序就是显示顺序，`enabled` 可隐藏模块。`sidebar.enabled` 控制整体侧栏；其余开关控制侧栏各部分。新增完全不同的页面结构时，在 `src/components` 与 `src/pages` 开发组件，再接入配置。

友链和导航初始为空，不包含虚构条目。两者条目结构相同，例如：

```json
{
  "name": "网站名称",
  "url": "https://example.com",
  "description": "这是什么网站",
  "category": "常用工具",
  "order": 1,
  "enabled": true
}
```

可选 `image` 是头像/图标地址。导航有分类和关键词过滤。外部链接会在新标签页打开。

## 迁移与检查

首次迁移已经执行。以下命令保留用于复核，默认迁移命令只预演：

```powershell
npm run migrate
npm run migrate -- --apply
npm run check:content
npm run check
npm run test
npm run build
npm run check:links
```

迁移脚本需要父目录中的原始 `source`、`db.json`、`.deploy_git`；普通写作和构建不依赖 Hexo。迁移拒绝覆盖已有的不同内容，日后编辑过新站文章后，不要反复执行迁移覆盖它们。

`scripts/data/migration-report.json` 记录文章清单和原路径。`legacy-assets.json` 映射全部旧 `/img/` 网址，构建时生成 `public/img`。维护源图片时，如果有意替换旧图，需要同步更新映射哈希；不能只改生成目录。`legacy-anchors.json` 用于保留旧文章章节链接。

`node scripts/verify-migration.mjs` 用于此次迁移的原文、代码块和图片哈希验收，依赖旁边的 Hexo 工程；它不属于日常构建检查，因为以后正常编辑文章会改变基线。初始源码备份在 `scripts/artifacts/hexo-baseline`。

## 发布

首次替换旧站、日常更新和恢复旧站的完整操作见 [GitHub Pages 发布指南](docs/github-pages-release.md)。建议保留原 `main` 作为旧站发布分支，将本目录源码上传为 `source` 分支；首次手动发布前，将默认分支设为 `source`，并把 Pages 来源切换为 GitHub Actions。

博客使用原域名 `https://djfl-cyber.github.io`，保留 7 篇文章及已有归档的路径。

将这个目录的源码作为仓库源码分支根目录后，`.github/workflows/build.yml` 可用于 GitHub Actions。首次启用前核对远端分支、仓库 Pages 设置和 action 版本可用性。默认推送只检查和构建；部署仅在手动运行且勾选 `deploy` 时执行。正式切换 Pages 来源之前保留原 Hexo 部署历史。

本地的 Linux CI 尚未运行；第一次仓库构建也用于验证大小写、运行平台和 action 环境。发布产物是 dist，不需要上传 node_modules、缓存、备份或旧 Hexo 工程。

`npm run build` 最后会自动执行发布隔离检查（也可单独运行 `npm run check:release`）：检查 `dist` 中的本地目录、私有管理文件、入口、接口标记和令牌；还会拒绝已被 Git 跟踪的私有管理源码。检查失败时构建返回失败，GitHub Actions 不会进入产物上传步骤。Pages 的上传路径固定为 `dist`，不要把整个工程目录作为网站发布。

## 后续扩展

访客组件通过沙箱和 SDK 接入，已有音乐播放器示例；桌宠和抽卡可按 [组件规范](docs/blog-components.md) 继续制作。本地管理程序与公开博客分别运行。


## 本地桌面管理

双击博客根目录的 `Blog Studio.cmd`。完整操作见 [Blog Studio 使用说明](docs/blog-studio-guide.md)。管理程序、登录、草稿和历史仅存本机；博客构建与 GitHub Pages 部署可独立运行。
