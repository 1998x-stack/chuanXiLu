# 传习录 · 知行合一

> **知而不行，只是未知。** ——《传习录·卷上·徐爱录》（本项目 CXL-0005）

一座以明代书院、宣纸、墨色与朱印为视觉线索的《传习录》**数字研读馆**，同时提供给 Codex / OpenCode 使用的 **chuanxilu-wisdom AI Skill**。目标是把王阳明心学用于理解现实问题：辨明本心与事实、将认知转化为行动、通过实践反馈修正判断。

[阅读网站（待 Pages 成功发布后启用）](https://1998x-stack.github.io/chuanXiLu/) · [SKILL 指令](./SKILL.md) · [文档索引](./docs/README.md) · [版本及溯源](./CONTENT-ATTRIBUTION.md)

## 当前版本交付

| 领域 | 目前实现 |
| --- | --- |
| 三卷文本 | 卷上129、卷中71、卷下143，共343条电子转录分段；另收5份序跋/按语数据 |
| 篇章定位 | 徐爱、陆澄、薛侃、陈九川、黄直、黄省曾等语录，以及卷中论学书信 |
| 阅读方式 | 原文按句呈现；原文在上，存在示范释义时逐句独立点击展开，默认隐藏 |
| 内容状态 | 已建立完整条目索引；仅7则原创编辑性释读示范；大部分句子尚未译注及校勘 |
| 阅读器 | 全文检索、按卷筛选、上/下条、条目深链接、收藏、字号、明暗主题 |
| AI Skill | 依据有出处的真实语录提炼问题、引用、现代适用限制与可执行动作 |
| 工程交付 | Node.js 无第三方运行依赖、内容完整性校验、静态构建、GitHub Actions 和 Pages 发布工作流 |

**重要声明：** 这里的343条是所采用电子转录/现代编号体系的数量，不是明代书籍各版本固定不变的章数。录入不等于校勘通过；原文 verification=pending。本站没有搬运其他网站的现代白话译注，未完成的译解不应伪称已实现。

## 直接复制到 Codex / OpenCode

在本项目目录打开代理后，复制以下指令：

~~~text
请加载本仓库的 chuanxilu-wisdom Skill。完整阅读 SKILL.md、references/decision-framework.md、references/quotation-guide.md；需要引用时，严格以 data/volume-1.json、data/volume-2.json、data/volume-3.json 中确实存在的原文为准。

用王阳明《传习录》的心学思想分析我的现实问题：
1. 先区分客观事实、我的判断和我的动机；明确参与者、现实限制与可以检验的行动。
2. 根据问题选择「知行合一」「心即理」「致良知」「格物」「事上磨炼」等相关思想，不能为了引用而牵强附会。
3. 用清雅、简洁、易懂的中文回答，准确引用1—2句原文，注明《传习录·卷上/中/下·篇章》和项目稳定条目编号。不得编造文字、人物、版本或卷次。
4. 每句古文后给现代白话释义，并解释它在原对话/书信中的语境、今天可借鉴与不可直接照搬的边界。
5. 提出1—3条可落实、可核查、尊重他人权利的行动和反馈方法；判断医疗、法律、财务、技术问题时，首先依据现代专业事实。
6. 语气应有心学风格，但不要摆出道德优越感，也不要把「心即理」理解成主观意愿可以替代外部证据。
7. 未能核实古文时说明无法核实，不能用编造的引文补足。

我的具体问题：________
~~~

### 代理自动发现

~~~bash
git clone https://github.com/1998x-stack/chuanXiLu.git
cd chuanXiLu
codex
# 或者
opencode
~~~

本项目同时包含根目录 SKILL.md、.agents/skills/chuanxilu-wisdom/SKILL.md 与 AGENTS.md。是否自动发现由具体代理配置决定；未发现时请明确读取文件。

**Codex 使用示例**

~~~text
$chuanxilu-wisdom 我已经反复学习项目管理方法，却迟迟不愿意做一个可验证的小试点。请用《传习录》的知行合一分析我该如何行动，并引用原文。
~~~

**OpenCode 使用示例**

~~~text
请读取 .agents/skills/chuanxilu-wisdom/SKILL.md 及根目录 SKILL.md，使用王阳明心学、精确原文和可执行动作分析：________
~~~

更多示例见 [prompts/codex-opencode.md](./prompts/codex-opencode.md)。

### 全局安装

~~~bash
git clone https://github.com/1998x-stack/chuanXiLu.git "$HOME/chuanxilu-skill-source"
mkdir -p "$HOME/.agents/skills"
# 安装前确认目标目录不存在，避免覆盖已有 Skill
ln -s "$HOME/chuanxilu-skill-source/.agents/skills/chuanxilu-wisdom" "$HOME/.agents/skills/chuanxilu-wisdom"
~~~

## 本地开发

~~~bash
git clone https://github.com/1998x-stack/chuanXiLu.git
cd chuanXiLu
npm test
npm run build
npm run serve
# 浏览器访问 http://localhost:4173
~~~

要求 Node.js 20+、Python 3。网站通过 HTTP 读取 JSON；不要直接通过 file:// 打开 HTML。部署构建产物位于 dist/。

## 目录

| 路径 | 说明 |
| --- | --- |
| data/volume-1.json 至 volume-3.json | 原典全文、原篇章、稳定 ID、转录来源、审核状态 |
| data/annotations.js | 仅包含已撰写的7条选句解释，不应当作全卷译注 |
| data/index.js | 数据载入、保序句段切分、精确检索、引用源链接 |
| index.html、styles.css、app.js | 响应式阅读界面、逐句展开、书签与阅读设置 |
| SKILL.md、.agents/skills/、references/ | AI Skill 及准确引文、现实决策方法 |
| docs/ | 架构、文献、数据模型、设计、验证、路线与部署 |
| scripts/、.github/workflows/ | 内容验证、构建与自动发布 |

## 学术与现实边界

《传习录》既有师生问答也有论学书信，不能把断句摘录视作脱离语境的万能结论。本文以电子转录文本作为可用的起步资料，不是经过刊本校勘的定本；卷/篇章/条目编号可能随底本和整理体系变化。

「知行合一」并非鼓励冲动行事；「致良知」不等同于无需外部证据；「心即理」不能否定客观规律或现代知识。在健康、法律、工程、金融和公共事务中，使用经过核验的专业依据，古典思想作为反思辅助。

[文本来源及版权](./CONTENT-ATTRIBUTION.md) · [文本模型](./docs/CONTENT-MODEL.md) · [校勘规范](./docs/TEXTUAL-SOURCES.md) · [路线图](./docs/ROADMAP.md)

---

**事上磨炼，方为学问。**（概括性提示语，不冒充《传习录》逐字引文）
