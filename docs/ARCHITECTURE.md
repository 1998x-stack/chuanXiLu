# 架构与数据流

~~~text
GitHub 主仓库
  ├── data/volume-1.json  (129条 + 序跋)
  ├── data/volume-2.json  (71条 + 序跋)
  ├── data/volume-3.json  (143条 + 跋)
  ├── data/annotations.js (23则独立编写的草稿释读)
  ├── data/index.js       (文献载入 / 类型筛选 / 临时句段锚点)
  ├── data/topics.js      (8专题关键词、原文例证、误读提醒)
  ├── index.html + styles.css + app.js
  │     └── 用户浏览器（无外部 API，无账户）
  │           ├── URL #entry-0005
  │           └── localStorage 最近阅读、书签、字号、主题
  ├── SKILL.md + .agents/skills/chuanxilu-wisdom/SKILL.md
  ├── npm test → 343条、来源、引文、HTML 安全检查
  └── npm run build → dist/ → GitHub Pages
~~~

## 浏览器交互边界

数据加载必须通过 HTTP，三卷 JSON 用 fetch 并发读取。条目列表按检索和卷筛选更新；阅读区一次渲染一个条目。原文经 textContent 注入 DOM，避免将不可信字符解释为 HTML。释义元素初始设置 hidden 并由 aria-expanded/aria-controls 关联切换。

全文检索目前是客户端线性查找，数据量只有343条，可离线静态缓存；后续如数据增大再考虑索引。应用不含登录、广告追踪、远程大模型调用。

## 代理 Skill 路径

根目录 SKILL.md 是完整行为指令；.agents/skills/chuanxilu-wisdom/SKILL.md 负责自动发现入口；AGENTS.md 提供工程约束。代理需显式读真实卷文本后引用，不能仅凭模型记忆拼接名句。

## 发布权限

GitHub Actions 在 main 分支上执行 test/build。GitHub Pages 工作流采用 pages:write / id-token:write 和 dist artifact。网页的静态相对路径适应 GitHub Pages 子路径 /chuanXiLu/。是否已部署要以 Actions 结果和公开 URL 验证为准。


## Stage 1 阅读器扩展

343条正篇及5篇序跋合并成348个可导航的 documents；附录仍单独保持 kind=paratext，避免被计入正篇。兼容旧 URL，同时支持句段锚点和序跋链接。pushState/popstate 处理浏览器返回。

八个专题的关键词索引提供原文例证；不能从命中直接推论作者支持该观点。现代释读由 data/annotations.js 逐条精确匹配 quote，显示状态和作者；仍用 textContent，拒绝把外部来源作为 HTML 执行。

新增 scripts/coverage.mjs 生成结构化编辑统计，不能把注释数量冒充译完的句子数量。
