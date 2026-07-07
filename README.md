# 面试准备助手

面试准备助手是一个早期 Web MVP，目标形态是“Offer 沙盘 + 面试官视角库”。当前版本聚焦一个最小闭环：

用户输入候选人简历、岗位 JD 和可选上下文后，系统先判断候选人的项目经历是否支撑岗位核心职责，再生成候选人准备报告、面试官追问报告、证据链、风险点和可导出 PDF 报告。

Demo 地址：

```text
https://mathsionyang.github.io/offerAgent/
```

当前 Web 版已支持中文 / English 双语切换。页面 UI、脱敏样例、Mock Demo 报告、真实模型输出提示、报告预览、候选人 PDF、面试官 PDF 和 Offer 推演 PDF 会跟随页面右上角语言选择器切换。

当前项目不是商业化招聘系统，也不替代人工招聘判断。它更像一个面试准备和面试追问的辅助工具，用来辅助候选人和面试官更快对齐“岗位要求、项目证据、风险缺口和下一轮验证问题”。

## English Version

Interview Assistant is an early Web MVP designed as an “Offer Sandbox + Interviewer Lens Library”. It turns a candidate resume, job description, company context, interview stage, target level, offer constraints, and selected interviewer perspectives into evidence-based interview preparation outputs.

Demo:

```text
https://mathsionyang.github.io/offerAgent/
```

### Positioning

Convert “resume + JD” into structured, evidence-based reports that help candidates prepare better interview stories and help interviewers choose sharper follow-up questions.

### What It Solves

1. Prevents shallow keyword matching by forcing a project-match gate before any offer simulation.
2. Converts vague resume claims into evidence levels, validation gaps, and follow-up questions.
3. Produces separate candidate-facing and interviewer-facing PDF reports instead of one generic analysis.
4. Simulates offer progression, negotiation constraints, and candidate leverage.
5. Provides virtual interviewer roles such as HR, business owner, project / PMO, negotiation advisor, and executive pressure officer.

### Main Features

1. Chinese / English language switch for UI, samples, mock reports, model prompts, previews, and PDF exports.
2. Mock Demo mode for local offline demonstrations without calling a real model.
3. OpenAI-compatible model mode using a temporary API Key and Base URL.
4. Project match gate: Matched / Conditional proceed / Not matched.
5. Evidence credibility grading: Level 1 / Level 2 / Level 3 or pending validation.
6. Candidate preparation report, interviewer question guide, and offer simulation report.
7. Browser-side PDF export for Candidate, Interviewer, and Offer Simulation reports.
8. Human feedback fields for post-interview calibration.

### Typical Use Cases

1. Candidate interview preparation for product manager or AI application roles.
2. Interviewer question design before business, product, technical, or HR interviews.
3. Offer-stage sandboxing for level, salary, start date, competing offer, and motivation risks.
4. Resume evidence audit before applying to technical product or AI large-model application roles.

### Tech Stack

1. Static Web MVP: HTML, CSS, and vanilla JavaScript.
2. OpenAI-compatible chat completion API integration with streaming support.
3. Client-side Markdown rendering and report splitting.
4. Browser-side PDF generation without requiring a print dialog.
5. GitHub Pages deployment workflow.
6. Optional local proxy and Cloudflare Worker proxy examples for model calls.

## 一句话定位

把“简历 + JD”转成一份可追问、可复盘、可下载的面试准备报告，并生成候选人追问题库。

## 当前核心链路

### 1. 输入材料

入口文件：

```text
apps/web/index.html
apps/web/app.js
apps/web/styles.css
```

用户在页面中输入：

1. 候选人简历。
2. 岗位 JD。
3. 公司 / 面试上下文。
4. 候选人阶段，例如初筛、业务一面、业务终面、Offer 前。
5. 目标职级。
6. Offer / 谈薪约束。
7. 面试官视角，例如 HR、业务负责人、项目推进、谈薪顾问、决策层压力官。

当前页面支持两种模式：

1. Mock Demo：不调用真实模型，直接生成本地模拟报告。
2. 真实模型：用户临时填写 API Key 和 Base URL，调用 OpenAI-Compatible 接口。

当前页面支持两种语言：

1. 中文：默认语言，保留原有中文 UI、样例、Mock 报告和 PDF 输出。
2. English：切换后 UI、样例、Mock 报告、真实模型输出要求和 PDF 标题 / 内容均使用英文。

### 2. 项目匹配闸口

系统不会一上来直接生成“录用 / 淘汰”结论，而是先做项目匹配判断。

当前判断逻辑包括：

1. 从 JD 中拆出核心职责和能力要求。
2. 从简历中寻找对应项目证据。
3. 为每条证据标注一级 / 二级 / 三级可信度。
4. 对齐岗位职责与项目经历，判断候选人项目经历是否支撑 JD。
5. 输出“匹配进入 / 条件性进入（转岗适配） / 不匹配不推进”三类闸口结果。
6. 如果缺少项目证据，输出待验证或不匹配点。
7. 如果简历与 JD 表面匹配，继续生成反包装追问。

当前实现中，匹配判断仍以规则 + 关键词 + 模型生成为主，不是严格的结构化评分系统，但已经完成结论证据化、证据可信度分级、条件性进入和能力迁移话术的前端展示。

### 3. 候选人报告

候选人报告面向求职者，重点帮助候选人准备面试。

当前包含：

1. 先看结论。
2. 招聘岗位分析。
3. 简历与 JD 不匹配点。
4. 简历修改意见与重点准备。
5. 建议重点准备的问题。
6. 项目匹配闸口。
7. 岗位匹配。
8. JD 隐性痛点解码。
9. 风险与待验证。
10. Offer 沙盘推演。
11. 必问追问。
12. 动态校准指令。
13. 证据链。

候选人报告的目标不是“美化简历”，而是提醒候选人补齐项目故事、指标口径、个人贡献、失败复盘和岗位匹配表达。

### 4. 面试官报告

面试官报告面向 HR、业务面试官和技术面试官，重点帮助面试官设计追问。

当前包含：

1. 先看结论。
2. 简历初评。
3. 简历与 JD 不匹配点。
4. 面试官处理建议。
5. 面试官可选追问。
6. 项目匹配闸口。
7. 岗位匹配。
8. 风险与待验证。
9. 面试官候选问题库。
10. 面试官视角库。
11. 证据链。
12. Offer 沙盘推演。
13. 动态校准指令。

其中“简历初评”会先给一个短判断，例如：

如果候选人只是罗列 MATLAB、GIS、Java 等技术点，但没有完整工程化项目闭环，系统会提示这更像单点学习，不能直接证明 JD 中的系统设计、产品规划或项目落地能力。

### 5. 面试官视角库

当前内置的面试官视角包括：

1. 虚拟 HR 面试官：关注动机、稳定性、表达清晰度、Offer 风险。
2. 虚拟业务负责人：关注业务理解、需求判断、指标意识和结果归因。
3. 虚拟项目推进面试官：关注目标拆解、里程碑、资源协调、风险控制和复盘机制。
4. 虚拟谈薪顾问：关注薪资预期、竞对 Offer、入职概率和谈薪策略。
5. 决策层压力官：关注战略取舍、预算削减、资源约束、投入产出和极端压力判断。

Web Mock 逻辑已固定展示“决策层压力官”，用于追问预算削减、资源重排、ROI 取舍和战略判断。

### 6. 报告下载

当前支持下载：

1. 候选人 PDF 报告。
2. 面试官 PDF 报告。
3. Offer 沙盘推演 PDF 报告。
4. 分模块 PDF 导出：候选人报告、面试官报告和 Offer 推演分别导出。

PDF 报告会在浏览器端直接生成并下载，不再依赖打印对话框。报告样式参考 `interview-report.html`，已经重新排版为浅色咨询报告风格：

1. 浅色背景。
2. 白底报告卡片。
3. 清晰章节标题。
4. 浅色表格。
5. 风险 / 待验证 / 匹配状态色。

当前 Web 页面整体也已改为浅色调，包括输入表单、配置面板、Offer 沙盘、面试官视角库、报告预览和 PDF 导出窗口。报告预览会按“候选人报告 / 面试官报告 / Offer 沙盘推演报告”三段组织。

### 7. 人工反馈

当前页面支持在报告生成后写入人工反馈，包括：

1. 面试官是否同意判断。
2. 问题是否有效。
3. 备注说明。

人工反馈会被追加进当前报告，但还没有形成持久化数据库或长期迭代题库。

## 已完成

### Web MVP

1. 完成纯静态 Web 页面。
2. 支持本地 Mock Demo。
3. 支持简历、JD、公司上下文、候选人阶段、目标职级、Offer 约束输入。
4. 支持面试官视角选择。
5. 支持分块生成报告。
6. 支持候选人报告和面试官报告拆分。
7. 支持 PDF 报告导出。
8. 支持候选人、面试官、Offer 推演三类 PDF 导出。
9. 支持人工反馈写入当前报告。
10. 支持中文 / English 双语切换。
11. 支持 GitHub Pages 部署。

其中报告分块流式输出用于模拟真实模型逐段生成体验，双模块 PDF 导出用于分别交付候选人版和面试官版报告。

### 报告能力

1. 项目匹配闸口。
2. 岗位匹配分析。
3. 简历与 JD 不匹配点。
4. 候选人准备重点。
5. 面试官候选问题库。
6. 面试官视角库。
7. 高匹配反包装追问。
8. 简历初评。
9. 失败案例和风险点提示。
10. 证据链输出。
11. 结论证据化输出。
12. 证据可信度分级展示。
13. 条件性进入（转岗适配）与能力迁移话术。
14. 候选人谈判杠杆识别。
15. JD 隐性痛点解码。
16. 动态校准指令。
17. 决策层压力官固定压力测试。

### Prompt 增强

`prompts/product-manager-interview-prep.md` 已经增强以下要求：

1. 输出格式统一为结构化纯文本，减少 Markdown 渲染冲突。
2. 新增证据可信度分级：一级 / 二级 / 三级证据。
3. 新增“条件性进入（转岗适配）”。
4. 新增能力迁移论证话术。
5. 强化项目延期 / 线上故障 / 失败复盘追问。
6. 新增候选人谈判杠杆识别。
7. 新增决策层压力官。
8. 新增动态校准指令。
9. 新增 JD 隐性痛点解码。

### 部署与代理

1. 已提供 GitHub Pages workflow。
2. 已提供 Cloudflare Worker 代理示例。
3. 已提供本地代理脚本使用说明。
4. 已提供 smoke test 脚本。


## 未完成

### 产品功能

1. 还没有用户登录和账号体系。
2. 还没有团队协作、项目空间或历史记录。
3. 还没有报告云端保存。
4. 还没有岗位模板库。
5. 还没有公司模板库。
6. 还没有候选人多轮面试记录串联。
7. 还没有真正的面试后反馈学习闭环。
8. 还没有批量简历评估。
9. 还没有结构化评分看板。
10. 还没有权限管理。

### 模型与算法

1. 当前 Mock 逻辑仍偏规则和模板，不等同于真实模型效果。
2. 真实模型输出依赖 Prompt 稳定性，尚未做系统化评测。
3. 证据可信度分级、条件性进入、谈判杠杆、JD 隐性痛点等能力已在 Web Mock 报告中产品化展示，但仍需要真实模型评测验证稳定性。
4. 缺少标准化 Evidence Schema 的持久化与可编辑展示。
5. 缺少岗位能力矩阵的配置化能力。

### 工程实现

1. 当前 Web 版是纯静态实现，代码集中在 `apps/web/app.js`，后续需要拆分模块。
2. 还没有前端构建系统。
3. 还没有单元测试。
4. 还没有端到端 UI 测试。
5. 还没有错误日志和可观测性。
6. 还没有统一的配置中心。
7. 还没有正式的后端服务。



## 需要增强的点

### 1. 结构化数据层

需要把当前报告中的关键信息沉淀为结构化对象：

1. JobProfile：岗位结构化信息。
2. CandidateProfile：候选人结构化信息。
3. EvidenceItem：证据项。
4. RequirementMatch：岗位要求匹配结果。
5. InterviewQuestion：面试问题。
6. InterviewerLens：面试官视角。
7. FeedbackItem：人工反馈。

这样后续才能支持排序、筛选、评分、复盘和多轮迭代。

### 2. 证据可信度真正产品化

当前已完成基础展示，后续需要增强为可编辑、可追踪的证据系统：

1. 每条证据显示等级。
2. 每个结论显示证据来源。
3. 低可信证据自动进入待验证列表。
4. 面试官可以手动调整证据等级。
5. 面试后可以标记证据被证实或被推翻。

### 3. 项目匹配闸口增强

当前已完成三类闸口结果的前端展示，后续需要继续增强：

1. 匹配进入。
2. 条件性进入（转岗适配）。
3. 不匹配不推进。
4. 明确触发原因。
5. 明确下一轮验证问题。
6. 输出候选人面试开场的能力迁移话术。

### 4. 面试官视角库增强

当前已固定包含决策层压力官，后续需要把面试官视角从固定选项升级为动态生成：

1. 根据岗位自动选择面试官组合。
2. 固定包含决策层压力官。
3. 支持技术架构负责人、客户方案负责人、数据负责人等扩展角色。
4. 每个视角输出关注能力、证据锚点、深挖问题、好回答标准和风险信号。

### 5. 失败复盘与反包装追问增强

当前已强制覆盖项目延期 / 线上故障类必问问题，后续需要扩展更多事故类型：

1. 项目延期。
2. 线上故障。
3. 客户投诉。
4. 资源冲突。
5. 指标未达成。
6. 需求优先级冲突。

每类问题都应要求候选人按时间线还原：发现、止血、根因、影响、整改和机制变化。

### 6. Offer 沙盘增强

当前已新增候选人谈判杠杆识别，后续需要继续增强：

1. 候选人谈判杠杆识别。
2. 竞对 Offer 风险。
3. 入职概率判断。
4. 薪资预算约束。
5. 团队紧急程度。
6. 替代候选人情况。
7. 下一轮推进策略。

### 7. 面试后动态校准

当前报告已输出动态校准指令，后续需要建立真实闭环：

1. 记录实际被问到的问题。
2. 标记哪些问题有效。
3. 标记哪些判断被证实或推翻。
4. 将有效问题沉淀回岗位题库。
5. 将失败判断沉淀回 Prompt 或岗位模板。

### 8. 部署与安全增强

暂不做。

这一部分先不纳入当前增强范围，后续进入线上化、多人使用或小程序真实模型调用阶段时再单独规划。


## 本地运行

### Mock Demo

```powershell
cd D:\OfferAgent\apps\web
python -m http.server 5173
```

访问：

```text
http://127.0.0.1:5173/
```

### 本地真实模型代理

先准备本地 Key 文件：

```text
1.md
```

格式：

```text
KEY:你的模型 Key
URL:模型服务商 OpenAI-Compatible Base URL
```

启动代理：

```powershell
cd D:\OfferAgent
python scripts\local_proxy.py --key-file 1.md
```

页面配置：

```text
模型服务商：OpenAI-Compatible 代理 / 自定义接口
模型名称：qwen-plus 或其他兼容模型
Base URL：http://127.0.0.1:8787
```

## 测试

静态功能检查：

```powershell
python scripts\smoke_test.py
```

真实模型接口测试：

```powershell
python scripts\smoke_test.py --with-llm 1.md --model qwen-plus
```

## 目录结构

```text
apps/web                 Web MVP
apps/douyin-miniapp      抖音小程序预留目录，当前未完成
docs                     部署和使用说明
douyin-assets            抖音发布素材和文案
examples                 脱敏样例
prompts                  Prompt 草稿和生成约束
schemas                  结构化 Schema
scripts                  本地代理与自测脚本
serverless               Cloudflare Worker 代理示例
.github/workflows        GitHub Pages 部署 workflow
```

## 隐私与安全

当前第一版原则：

1. 不需要登录。
2. 不默认保存简历。
3. 不默认保存 JD。
4. 不默认保存 API Key。
5. 不默认保存报告。
6. 刷新或关闭页面后，页面内存中的输入会丢失。

重要提醒：

1. `1.md` 是本地模型 Key 配置文件，已经加入 `.gitignore`。
2. 不要把真实 Key 提交到 GitHub。
3. 不要在录屏、截图或直播中展示 `1.md`。
4. 如果 Key 已经出现在公开画面或文件中，请立即轮换。
5. 小程序或线上生产环境必须通过后端代理调用模型，不能把 Key 放在前端。
