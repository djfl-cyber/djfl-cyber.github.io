# 用 Astro 替换旧 Hexo 博客

适用项目：`C:\Users\jie\myblog\astro-site`。

原网址：<https://djfl-cyber.github.io/>。

原发布仓库：<https://github.com/djfl-cyber/djfl-cyber.github.io>。

这两个地址来自现有 Hexo 与 Astro 的本地配置。2026-10-15 的远端分支查询因连接 GitHub 失败，未能核实远端现状。本说明尚未实际执行上传或修改 Pages 设置。

## 分支安排

- `main`：按原 Hexo 配置，这是旧站生成文件的发布分支。首次切换保留此分支，便于恢复。
- `source`：新建的 Astro 源码分支，根目录应直接有 `package.json`、`src/`、`.github/`，而不是再套一层 `astro-site/`。
- 发布来源：GitHub Actions，仅上传本分支构建出的 `dist`。

现有 `.github/workflows/build.yml` 推送时只检查和构建；只有手动运行并勾选 `deploy` 才发布。仓库名符合 `<用户名>.github.io`，无需添加 `base` 子路径或改变原网址。

## 第一次上传

在 VS Code 中打开 Astro 项目，保存全部文件。确认想公开的文章设置为 `draft: false`。`draft: true` 不生成生产页面，但文章源文件仍会随源码提交。

打开 PowerShell，进入正确目录：

```powershell
Set-Location 'C:\Users\jie\myblog\astro-site'
npm run build
npm run check:links
```

2026-10-15 本地复核通过：21 个 HTML 页面、662 个本地链接或资源，旧文章网址、归档和章节锚点均通过检查；发布隔离检查通过。后续修改后需重新检查。

目前这个目录尚未初始化 Git。首次执行：

```powershell
git init -b source
git remote add origin git@github.com:djfl-cyber/djfl-cyber.github.io.git
git ls-remote --heads origin
```

先查看最后一条输出：确认原发布分支是否确为 `main`，并确认远端尚不存在 `refs/heads/source`。如果远端已有 `source`，先核对其内容再整合，不要强制推送。如果连接失败，先解决 GitHub 网络或 SSH 登录，再继续上传。

确认没有分支冲突后：

```powershell
git add .
git status --short
git ls-files -- scripts/studio "Blog Studio.cmd" scripts/artifacts .cache .env
npm run check:release
```

`git ls-files` 这条命令应没有输出。本地管理程序、备份、令牌、缓存均在忽略范围内；`check:release` 还会拒绝已被跟踪的私有管理文件。

确认后提交并上传：

```powershell
git commit -m "Migrate blog from Hexo to Astro"
git push -u origin source
```

若 Git 提示没有作者信息，可仅为本项目配置 `git config user.name` 和 `git config user.email`，使用自己的 GitHub 身份信息后重新提交。

此次推送只创建/更新 `source`，不会覆盖原 `main`。不要将整个父目录 `myblog` 或 `dist` 当作源码提交目录。

## 首次切换 GitHub Pages

1. 打开仓库，切换到 `source`，确认根目录有 `package.json`、`src/` 和 `.github/workflows/build.yml`。
2. 在 **Actions** 查看 **Check and build blog**，等待 `build` 成功。推送触发的运行中，`deploy` 被跳过是正常现象。
3. 打开 **Settings → General → Default branch**，将默认分支改成 `source`。手动 `workflow_dispatch` 必须先存在于默认分支，才能正常显示和触发。
4. 打开 **Settings → Pages**，先记下旧的发布来源、分支和目录。按现有 Hexo 配置，预期为 `main` 的 `/(root)`，但以实际设置为准。
5. 在 **Build and deployment → Source** 选择 **GitHub Actions**。项目已有工作流，不必另建模板。
6. 打开 **Actions → Check and build blog → Run workflow**，分支选 `source`，勾选 **Deploy this build to GitHub Pages**，点击 **Run workflow**。
7. 等待 `build` 和 `deploy` 均成功，再访问原网址。若部署因 `github-pages` 环境的允许分支限制被拒绝，在 **Settings → Environments → github-pages** 中允许 `source`；保留其他已有保护规则。

## 上线验收

- 打开首页及一篇原日期网址的旧文章，确认图片和目录可用。
- 测试文章旧的章节锚点、归档、友链、导航和手机宽度。
- 直接访问一个不存在的网址，确认显示新站 404。
- 确认页脚不显示本地编辑入口，`/__editor/` 显示 404。
- 若仍看到旧页面，使用 Ctrl+F5 或无痕窗口复核。

切换后停止使用旧 Hexo 的 `hexo deploy`。今后的正文和外观都在 Astro 项目修改。

## 以后每次更新

```powershell
Set-Location 'C:\Users\jie\myblog\astro-site'
git status
git pull --ff-only
```

开始编辑前拉取；如果已经有未提交的修改，先保存并提交或妥善保留，再拉取。

编辑文章、图片或配置后：

```powershell
npm run build
npm run check:links
git add .
git status --short
npm run check:release
git commit -m "Update blog"
git push
```

推送成功后仍需在 Actions 手动运行工作流并勾选 `deploy`，网络上的博客才更新。推送检查通过但没有手动发布时，线上继续保留上一次发布。

本地工作台只修改本地的 `src/config/*.json`；这些博客配置文件会提交。工作台程序、令牌和备份不会随普通 `git add .` 上传。`dist` 是构建产物，由 Actions 生成和发布，不需要提交。

## 如需恢复旧站

只要旧发布分支未被覆盖，就可到 **Settings → Pages** 把 Source 改回 **Deploy from a branch**，选择之前记录的旧发布分支和目录，保存并等待其 Pages 部署完成。此时停止触发 Astro 的手动部署，避免两套发布互相替换。

## 官方依据

- [Astro 部署到 GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub Pages 发布来源设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub 手动运行工作流与默认分支要求](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [GitHub 更改默认分支](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/changing-the-default-branch)
