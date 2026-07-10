# OfferAgent 面试评估助手

语言：中文 | [English](README.en.md)

项目地址：[https://github.com/MathsionYang/offerAgent](https://github.com/MathsionYang/offerAgent)

在线 Demo：[https://mathsionyang.github.io/offerAgent/](https://mathsionyang.github.io/offerAgent/)

## 页面截图

<img src="img/06.png" alt="OfferAgent 页面截图 06" width="900" />

<img src="img/07.png" alt="OfferAgent 页面截图 07" width="900" />

<img src="img/08.png" alt="OfferAgent 页面截图 08" width="900" />

<img src="img/09.png" alt="OfferAgent 页面截图 09" width="900" />

<img src="img/010.png" alt="OfferAgent 页面截图 010" width="900" />

<img src="img/011.png" alt="OfferAgent 页面截图 011" width="900" />

<img src="img/012.png" alt="OfferAgent 页面截图 012" width="900" />

OfferAgent 是一个面向候选人与面试官的静态 Web MVP。它不替代人工招聘决策，而是把“目标岗位 + 候选人简历 + 岗位 JD + 面试上下文”转成可追问、可复盘、可导出的候选人报告、面试官报告、Offer 沙盘和证据关系图谱。

当前版本支持四类目标岗位：产品经理、开发人员、技术支持人员、销售人员。

## 一句话定位

帮助候选人与面试官围绕岗位职责和项目经历建立证据链，识别风险缺口，生成追问清单、Offer 推演、虚拟面试委员会讨论摘要和 PDF 报告。

## 当前体验

1. 每次打开页面先通过两张内联 SVG 卡通角色卡选择“我是候选人”或“我是面试官”；首页只展示身份选择，选中后才进入对应工作台。
2. 顶部固定标题栏保留候选人 / 面试官和工作台 / 图谱切换，方便随时改变使用视角。
3. 工作台优先展示岗位、阶段、简历、JD、Offer 约束和面试官视角；模型服务与代理配置收进默认折叠的高级设置。
4. 点击生成报告后立即进入图谱页，报告生成完成后展示报告预览和证据关系图谱。
5. 候选人模式隐藏人工反馈，只显示候选人报告导出。
6. 面试官模式显示人工反馈，只显示面试官报告导出。
7. 图谱节点可以跳转到报告对应段落，帮助从结论反向定位证据来源。
8. 图谱页会以微信群聊式气泡流展示虚拟面试委员会讨论过程，并在最后保留主持人总结。
9. 相同输入会复用缓存报告，减少同一 JD 和简历重复生成造成的报告漂移；页面会显示本机缓存数量，并提供一键清理入口。
10. 脱敏样例分为候选人准备、面试官评估和 Offer 谈判三条路线，便于按真实使用场景体验。
11. 结果摘要提供“复制结论、复制追问、复制准备清单”动作，方便粘贴到面试记录、候选人准备文档或团队沟通中。

## 核心能力

### 1. 项目匹配闸口

系统先判断简历项目是否能支撑 JD 核心职责，再生成报告，而不是直接给出录用或淘汰结论。

当前逻辑包括：

1. 从 JD 中抽取岗位职责与能力要求。
2. 从简历中寻找项目经历锚点。
3. 标注一级 / 二级 / 三级证据可信度。
4. 输出匹配进入、条件进入、缺证或不匹配等判断。
5. 对缺少证据的结论要求补充项目材料。
6. 对表面高匹配内容生成反包装追问。

### 2. 候选人报告

候选人报告面向求职者，重点不是美化简历，而是帮助候选人准备项目故事、指标口径、个人贡献、失败复盘和岗位匹配表达。

主要包含：

1. 候选人准备重点。
2. 简历与 JD 不匹配点。
3. 候选人追问题库。
4. JD 隐性痛点解码。
5. 风险与待验证项。
6. Offer 沙盘推演。
7. 证据链与证据缺口。

### 3. 面试官报告

面试官报告面向 HR、业务面试官、技术面试官和招聘负责人，重点是提升追问质量和判断可解释性。

主要包含：

1. 招聘岗位分析。
2. 简历初评。
3. 面试官候选问题库。
4. 面试官处理建议。
5. 面试官视角库。
6. 虚拟面试委员会讨论摘要。
7. 风险与待验证项。
8. 人工反馈记录。
9. FeedbackDistillation 结果。

### 4. 虚拟面试委员会

项目参考 MiroFish 的“种子材料 -> 图谱记忆 -> Persona 生成 -> 多轮模拟 -> 汇总报告”思路，在前端实现了轻量版虚拟面试委员会。

当前结构包括：

1. `VirtualPanel`：根据岗位、JD、简历和 Skill 生成虚拟面试官角色。
2. `PanelDiscussionRound`：让不同虚拟角色围绕证据、风险和 Offer 推进进行讨论。
3. `ModeratorSummary`：汇总共识、分歧、主导角色和最终建议。
4. 图谱中的 `agent_persona` 节点：展示虚拟角色贡献。
5. 图谱边 `reads_memory / discusses / challenges`：记录角色读取了哪些证据、讨论了哪些问题、挑战了哪些结论。
6. 图谱页下方的“虚拟面试委员会”面板：按气泡流式展示多角色讨论，生成完成后保留完整讨论记录。

这不是完整的大规模多 Agent 沙盘，而是适合当前静态 Web MVP 的轻量实现。

### 5. 一致性模式

为了让相同 JD、相同简历、相同配置下的报告更稳定，当前版本加入了一致性模式：

1. 生成输入指纹 `input_fingerprint`。
2. 结构化 JSON 中间层 `structured_evaluation`。
3. 相同输入命中本地缓存时直接复用基础报告。
4. 真实模型请求使用 `temperature: 0` 并携带 `seed`。
5. 基础报告缓存保存在本机浏览器 localStorage，用于复用相同输入的运行结果；缓存不保存 API Key，也不把人工反馈写入基础报告缓存。
6. 页面提供显式本机缓存状态和清理入口，可清除运行缓存与反馈历史。

### 6. 面试官视角库

当前内置 5 个 SkillDefinition 示例：

1. 虚拟 HR 面试官。
2. 虚拟业务负责人。
3. 虚拟项目推进面试官。
4. 虚拟谈薪顾问。
5. 决策层压力官。

这些视角会影响追问角度、风险判断、虚拟面试委员会角色和证据图谱中的 Skill 贡献记录。后续会继续演进为可选择、可组合、可版本化的 Skill Registry。

### 7. EvidenceGraph 证据关系图谱

EvidenceGraph 把 JD、简历、证据、问题、风险、反馈、Offer 信号、Skill 和虚拟面试官连接成最小关系图谱。

当前支持：

1. 节点详情查看。
2. 图谱类型筛选、关键词搜索、风险等级 / 证据等级 / 来源过滤和高风险决策视图。
3. 证据缺口提示。
4. 边的 confidence / weight / source 信息。
5. 点击节点跳转报告对应段落。
6. Skill 输出审计。
7. 虚拟面试委员会角色审计。
8. 高风险决策视图解释：说明节点为何因风险、三级 / 缺失证据、challenge 追问或 Offer 影响进入视图。

### 8. OfferSimulationRun

OfferSimulationRun 已从报告段落升级为可回填的结构化状态。

当前支持：

1. Base / Optimistic / Conservative 三场景对比。
2. 运行阶段状态机。
3. 推演历史与版本信息。
4. 状态回填提示：把 Offer 结果回填到下一轮问题生成、风险判断和谈判策略中。

### 9. 人工反馈闭环

面试官模式下可以把人工反馈写入报告。反馈会进入 FeedbackDistillation 规则，标记：

1. 哪些问题升级。
2. 哪些问题降权。
3. 哪些问题删除。
4. 哪些问题保留。
5. 哪些反馈会影响风险判断、Offer 判断和 Skill 更新建议。
6. 同一输入指纹下的反馈历史会独立保存在本机浏览器 localStorage，用于刷新或复用缓存后恢复最近反馈。
7. “风险已证实”“证据不充分”“追问采用 / 未采用”等反馈会影响虚拟面试官 `influence_weight`、立场和审计字段。

## 已实现

1. 静态 Web MVP。
2. Mock Demo 与 OpenAI-Compatible 临时模型配置。
3. 产品经理、开发人员、技术支持人员、销售人员四类 RoleProfile。
4. 候选人 / 面试官双模式。
5. 工作台 / 图谱双视图。
6. 中文 / English UI、样例、报告和 PDF 输出。
7. 报告分块流式输出。
8. 候选人报告与面试官报告拆分。
9. 双模式 PDF 导出。
10. EvidenceGraph 图谱显示、类型筛选、关键词搜索、高级决策过滤、匹配计数、缺口检测和报告段落跳转。
11. VirtualPanel、PanelDiscussionRound、ModeratorSummary 与虚拟委员会群聊式流式展示，支持按轮次、角色和证据节点过滤。
12. 一致性模式：输入指纹、结构化中间层、本地缓存复用。
13. Offer 沙盘结构化状态。
14. FeedbackDistillation 可视化和本机反馈历史。
15. GitHub Pages 部署。
16. Cloudflare Worker 代理示例。
17. smoke test、浏览器 E2E 和视觉回归脚本。
18. 输入就绪度提示：简历 / JD 字数、内容不足提示和面试官角色选择状态。
19. 统一语言投影层：用户输入始终保持原文，界面、报告、图谱、虚拟委员会、评分表和导出内容按当前语言展示；Mock 运行在本地构建语言 artifact，真实模型运行按需翻译并缓存。
20. 每次进入的身份选择与角色化工作台：首页仅展示候选人 / 面试官两张角色插画卡，选中后才加载对应流程；身份不做本地持久化，模型配置默认收进高级设置。
21. GitHub Actions 部署前测试门禁：语法检查、JS 测试、smoke test、视觉回归和 whitespace 检查。
22. 首次使用三步引导、三条脱敏样例路线、本机缓存状态和清理入口。
23. 结果摘要行动看板：结论优先展示下一步动作、最高风险、必问追问和最弱证据，并支持复制结论 / 追问 / 准备清单。
24. 真实模型错误诊断：覆盖超时、CORS、401、402/额度、403、404/模型不存在、400/请求过长、限流和非 OpenAI-compatible 响应。

## 当前边界

1. 还没有用户账号、团队协作和云端报告保存。
2. 真实样本评测数据集暂时不做。
3. 还没有 ATS / HRIS 集成。
4. Skill Registry 仍是示例和前端运行结构，不是完整市场或插件系统。
5. EvidenceGraph 是最小可用结构，不是持久化知识图谱数据库。
6. 虚拟面试委员会是轻量规则驱动，不是完整多 Agent 仿真引擎。
7. 已完成第十五阶段前端模块化：`apps/web/src/report-content-helpers.js` 承载候选人 / 面试官报告内容辅助函数，`apps/web/src/report-export-template.js` 承载静态报告 HTML 与 PDF 摘要卡模板，`apps/web/src/localization-mappers.js` 承载报告翻译和枚举本地化；当前 `apps/web/app.js` 为 2501 行，`apps/web/src` 包含 21 个 JS 模块，主入口主要保留页面编排、事件绑定、状态流转、模型提示词和 Mock 报告生成。

## 语言投影

1. 所有用户输入保持原文，包括简历、JD、公司上下文、目标职级、Offer 约束及报告中的引用摘录。
2. 界面文案、系统生成的报告内容、EvidenceGraph 节点、虚拟委员会、评分表、Summary 和 PDF 导出统一按当前语言投影。
3. Mock 模式直接在浏览器内构建中英文 artifact；真实模型模式只在首次切换到目标语言时调用模型翻译，并将结果写入当前运行缓存复用。
4. 语言 artifact 使用 `language-artifact.v3`。旧 schema 或缺失新字段的缓存会自动失效并重建，避免新增字段回退为中文。
5. 生成过程中切换语言时使用切换 token 防止旧请求覆盖当前语言，生成结束后会按当前显示语言补齐 artifact 再渲染。

## 本地运行

Windows 用户可以直接双击仓库根目录的：

```text
start_offeragent.bat
```

脚本会执行 `python scripts\local_proxy.py --key-file 1.md`，等待本地服务启动后自动使用 Google Chrome 打开页面。命令窗口需要保持开启，按 `Ctrl+C` 停止服务。

静态页面可以直接打开：

```text
apps/web/index.html
```

也可以启动任意静态服务器：

```bash
python -m http.server 5173 -d apps/web
```

然后访问：

```text
http://localhost:5173
```

## 验证

```bash
node --check apps/web/src/domain-data.js
node --check apps/web/src/run-cache.js
node --check apps/web/src/i18n.js
node --check apps/web/src/localization-mappers.js
node --check apps/web/src/virtual-panel.js
node --check apps/web/src/evidence-graph.js
node --check apps/web/src/graph-view.js
node --check apps/web/src/skill-registry.js
node --check apps/web/src/panel-view.js
node --check apps/web/src/report-builders.js
node --check apps/web/src/report-content-helpers.js
node --check apps/web/src/report-export-template.js
node --check apps/web/src/reports-view.js
node --check apps/web/src/model-client.js
node --check apps/web/src/pdf-export.js
node --check apps/web/src/feedback-engine.js
node --check apps/web/src/assessment-rules.js
node --check apps/web/src/evaluation-engine.js
node --check apps/web/app.js
node scripts/virtual_panel_test.js
node scripts/panel_view_test.js
node scripts/report_builders_test.js
node scripts/report_content_helpers_test.js
node scripts/report_export_template_test.js
node scripts/localization_mappers_test.js
node scripts/i18n_test.js
node scripts/localized_run_view_test.js
node scripts/evidence_graph_test.js
node scripts/graph_view_test.js
node scripts/input_readiness_test.js
node scripts/skill_registry_test.js
node scripts/reports_view_test.js
node scripts/model_client_test.js
node scripts/pdf_export_test.js
node scripts/feedback_engine_test.js
node scripts/assessment_rules_test.js
node scripts/evaluation_engine_test.js
node scripts/browser_e2e_test.js
node scripts/visual_regression_test.js
python scripts/smoke_test.py
git diff --check
```

## 隐私说明

Mock Demo 不会调用外部模型。真实模型模式下，API Key 只在当前浏览器页面内临时使用，不会写入仓库，也不会写入 localStorage。OfferAgent 没有用户账号、团队云端空间或项目自有服务端报告库；但浏览器会在本机 localStorage 中保存两类数据：一是按输入指纹缓存的基础报告和语言 artifact，二是面试官写入的反馈历史。基础报告缓存不包含 API Key 和人工反馈；反馈历史按输入指纹独立保存，用于同一浏览器内恢复最近反馈。请不要在公共设备或不可信环境中输入真实敏感简历信息；如已输入，请清理该浏览器的站点数据。
