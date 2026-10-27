# 自动测试、人工验收与已知边界

## 本地

~~~bash
node --version     # >=20
npm test
npm run coverage
npm run build
npm run serve
~~~

npm test 执行 Node.js 语法检查及 scripts/validate.mjs 的实体校验：
- 三卷、343条连续编号、129/71/143卷边界。
- 文本完整、固定来源提交、校审 pending、无第三方现代翻译混入。
- 标点句段切分后拼回原文须逐字相同。
- 每个示范引用必须位于其所属原文同一句段。
- 文本检索、卷筛选、引用索引、必需目录与静态 UI 合约。
- 禁止用 innerHTML 插入古文，确保白话初始隐藏并具备 ARIA 状态。

## 浏览器尚需手工核验

- 375px、768px、1440px：无横向滚动与内容遮挡。
- 键盘及读屏：搜索、目录、翻译展开、上一篇/下一篇、收藏。
- 访问 #entry-0005、刷新、收藏恢复、切换主题与字号。
- 全文搜索含特殊字符、无结果、极长古文、书签大量数据、private browsing。
- 浏览器真正加载3个 JSON，无错误；至少人工抽检每卷3条与源文本对应。
- 安全测试：引文以 textContent 输出，不执行用户输入代码。
- Actions 在 GitHub 真正成功，以及 Pages 公网地址可访问。

## 数据风险

测试证明文件结构与固定短引文存在，并不证明所有古籍字符、篇名和原版一致。必须通过文献核验提升 verification 标记。


## Stage 1 数据与交互契约验收

- 343条正篇 + 5份序跋 = 348个可阅读文献单位。
- 五份序跋必须具备真实的源文件、稳定 ID 与 pending 校勘状态。
- 23则 modern gloss 逐字匹配条目原句段；每则注明 draft 与 author。
- 八大专题均具可验证的关键词命中和至少两条示范原文摘句。
- 文献类型、卷、关键词、收藏和专题筛选能组合运行，中文序跋深链接可解码。
- 后退历史与临时句段锚点有显式处理，旧式 #entry-0005 URL 仍可用。
- 阅读器用 textContent 渲染古文；必须保证隐藏注释的 CSS 生效。
- npm run coverage 可生成统计报告，且未经校勘的条目不冒充 verified。

注意：这些属于自动结构测试，不代表浏览器真实点击、可访问性或史料校勘的独立验收。


## GitHub Pages HTTP 验收（2026-10-27）

run 40473680574 中的 Verify public Pages content 实际从 https://1998x-stack.github.io/chuanXiLu/ 获取 HTML、JS、CSS、主题脚本和三个卷本 JSON，并断言3卷343条正篇、5份附录正确。该 HTTP smoke 检查与 js 纯函数测试均通过；尚未包含真实浏览器 DOM 行为或读屏人工验收。
