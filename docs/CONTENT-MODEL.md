# 数据模型：卷、篇、条目、句段、释义

## 当前电子底本范围

| 卷 | 条目编号 | 条目数 | 主要内容 |
| --- | --- | ---: | --- |
| 上 | CXL-0001—CXL-0129 | 129 | 徐爱录、陆澄录、薛侃录 |
| 中 | CXL-0130—CXL-0200 | 71 | 答顾东桥等论学书信、教约 |
| 下 | CXL-0201—CXL-0343 | 143 | 陈九川录、黄直录、黄修易录、黄省曾录、钱德洪录、黄以方录 |
| 附属资料 | CXL-卷名-Pn | 5 | 徐爱引言与跋、钱德洪序、陆原静书后按语、钱德洪跋 |

343 是选用数字转录底本的条目划分，不是所有传世版本共享的天然编号。附属序跋与343条分开记录，不能重复计入。

## JSON 主体

每个 data/volume-N.json 包含 schemaVersion、volume、source、prefaces[]、entries[]。

entries[] 每个对象包含：
- id：如 CXL-0005，项目唯一稳定编号，不冒称原书页码。
- number：数字条目顺序，1—343连续。
- volume：上/中/下。
- section：电子转录所载篇名，可能与其他版本细分不同。
- text：带现代标点的原典转录全文。
- sourceFile：固定源提交对应的 data/bNN.json 文件。
- verification：pending，表示尚未独立完成刊本级校勘。

## 句段与现代释义

data/index.js 的 splitSentences 以句末标点切分并保证拼接后逐字恢复原始 text。此「句段」是**供阅读的标点切分**，不是已由学者核定的句法单元或原书自然段。

data/annotations.js 记录 entry.id 对应的 quote、gloss、topic。quote 需直接存在于该条 text，且落在一个切分后的句段内；npm test 将检查这个不变量。现代解释默认为 hidden，每则独立展开，不能放进原典 text。

## 版本演进（尚未实现）

- sourceEdition、sourceRevision、variant_readings、审核人/日期/证据。
- speaker_roles、question_answer_turns：明确问答双方及上下文。
- sentence_id：保留标点版本、每句稳定锚点与异文偏移。
- concepts、claims、counterarguments：心学概念的可靠出处关系。
- 多底本的非破坏式对齐与译注多作者多许可。
