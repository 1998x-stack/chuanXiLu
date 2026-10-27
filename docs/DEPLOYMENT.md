# 本地与 GitHub Pages 部署

## 本地

~~~bash
git clone https://github.com/1998x-stack/chuanXiLu.git
cd chuanXiLu
npm test
npm run build
npm run serve
~~~

打开 http://localhost:4173。dist 目录包含可直接发布的静态文件，浏览器必须经 HTTP 访问，因为数据用 fetch 加载。

## 自动化

- .github/workflows/ci.yml：push/PR 上测试与构建。
- .github/workflows/pages.yml：main 推送后校验、构建并发布 dist 至 GitHub Pages。

在仓库 Settings → Pages 中选择 GitHub Actions 作为源（若尚未配置）。仓库需要允许相应的 Pages 发布权限。预期路径为 https://1998x-stack.github.io/chuanXiLu/，但是否可访问必须在部署后验证。

## 发布验收

1. GitHub Actions 的 Test & Build 任务通过。
2. Deploy GitHub Pages 任务通过，提供部署 URL。
3. 实际访问并检查 3 个 volume JSON 返回 200。
4. 检查 Unicode 汉字字体、URL 深链接、搜索/逐句展开、移动端与 dark mode。
5. 在 README 标记实际访问日期与来源，不要将构建配置存在等同于网站上线成功。

发布不包含服务器数据库、用户个人信息或第三方模型 API 凭据。


## 第一次启用 Pages 的注意事项

新仓库首次执行 actions/configure-pages 可能得到 404，表明 GitHub Pages Site 未启用。工作流已设置 enablement: true 以尝试自动启用；若组织策略或动作令牌不允许，需仓库管理员在 Settings → Pages 将 Source 设为 GitHub Actions，然后重跑 Deploy GitHub Pages。不能将 npm build 成功误称网页已上线。


## 2026-10-27 线上验证（已完成）

GitHub Actions run 40473680574 完成 configure-pages、upload-pages-artifact、deploy-pages，并通过 Verify public Pages content 步骤。GitHub Runner 使用公开地址 https://1998x-stack.github.io/chuanXiLu/ 下载 index.html、app.js、styles.css、data/topics.js 和三卷 volume JSON，检查正篇129+71+143条及5份序跋按语，均成功。公开部署可用，但不能据此声称全站键盘、读屏、手机浏览器端到端测试已完成。
