# 对 Codex / OpenCode 的项目工程要求

本仓库是「三卷原文 + 文献溯源 + 静态阅读网站 + chuanxilu-wisdom AI Skill」。执行代码任务前，应阅读 docs/README.md、docs/ARCHITECTURE.md、docs/CONTENT-MODEL.md、docs/TEXTUAL-SOURCES.md、docs/QA.md。

## 不得违反的规则

1. 绝不把原文数据改写成现代释义；古文 data/volume-*.json 与释义 data/annotations.js 必须分层。
2. 条目 CXL-0001..CXL-0343 为电子整理编号，不是明代书籍原有编号；保留原卷、篇章与转录源提交。
3. 原文从上到下逐句呈现；每个**已有**释义默认折叠且独立展示；无释义时不可展示伪翻译。
4. 内容异文修改须记录具体底本、原样、改文、修订理由和校审状态；禁止捏造审校结果。
5. 禁止抄袭或去署名使用第三方现代译注；区分公版古籍、现代整理和软件授权。
6. 防止 XSS：用 textContent 输出古籍文本与用户检索字段，避免拼接 innerHTML。
7. 修改后执行 npm test 和 npm run build；核对 343 条编号、三卷边界和固定引文。
8. 改动应更新 docs/ROADMAP.md 及必要的来源说明；不宣称未验证的 CI/Pages 上线成功。
