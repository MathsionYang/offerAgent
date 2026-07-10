# OfferAgent 功能差距评估报告

更新时间：2026-07-10

## 一、评估方法

本报告对照 `开发路线.md` 中定义的 P0-P5 优先级清单，逐项验证 `apps/web/app.js`（6461 行）、`apps/web/src/domain-data.js`、`apps/web/src/run-cache.js`、`apps/web/src/i18n.js`、`apps/web/src/virtual-panel.js`、`apps/web/src/evidence-graph.js`、`apps/web/src/graph-view.js`、`apps/web/styles.css`、`apps/web/index.html`、`scripts/smoke_test.py`、`scripts/virtual_panel_test.js`、`scripts/evidence_graph_test.js`、`scripts/graph_view_test.js`、`schemas/` 目录 5 个 JSON Schema 的实际实现状态。

**本次评估相比上次（13:42 版本）的变化**：
- `app.js` 已从 8151 行拆分到 6461 行，新增 `apps/web/src/domain-data.js`（岗位/样例/常量）、`apps/web/src/run-cache.js`（输入指纹/缓存）、`apps/web/src/i18n.js`（中英文文案/报告阶段）、`apps/web/src/virtual-panel.js`（委员会纯模型层）、`apps/web/src/evidence-graph.js`（图谱纯模型层）与 `apps/web/src/graph-view.js`（图谱渲染/筛选/详情/报告跳转），图谱 UI 已不再由 `app.js` 直接维护。
- `styles.css` 从 3363 → 2202 行（-1161 行，清理冗余，加入 `[data-theme="light/dark"]` + `prefers-color-scheme` 系统主题检测 + 多档 `@media` 响应式断点 640/768/900/1080px）
- `index.html` 从 236 → 302 行（结构化重写）
- `smoke_test.py` 从 26414 → 28906 字节（+2500 字节，新增：决策摘要检查、面试官评分表检查、ModeratorBasis Trace 检查、四视图检查、Skills 紧凑选择器检查等）
- 新增 `OfferAgent-redesigned.html`（1535 行）作为重构原型，主题/间距/排版规范已部分合并到生产 CSS
- 新增截图 `img/010.png`（图谱页）、`img/011.png`（虚拟委员会页）、`img/012.png`（结果摘要页）

---

## 二、已实现且验证通过的能力

### 核心闭环（路线第 2 节，全部已落地）

| 能力域 | 验证结果 | 代码证据 |
|--------|----------|----------|
| Web 工作台 | ✅ 完整 | index.html 302 行 + app.js 顶部 DOM 绑定 + 四视图分段 |
| 候选人/面试官双模式 | ✅ 完整 | `setAudienceMode()` / `applyInterviewerMode()` + `aria-selected` |
| 4 类 RoleProfile | ✅ 完整 | `roleProfiles` 对象含 product_manager / developer / technical_support / sales |
| 13 项报告能力 | ✅ 完整 | `reportStagesByLanguage` 含全部阶段定义 |
| EvidenceGraph 基础 | ✅ 完整 | `buildEvidenceGraph()` + 9 种节点 + 7 种边 + `report_anchor` 跳转 + 文本关系列表 |
| OfferSimulationRun | ✅ 完整 | 三场景 + 状态机 + 历史 + 回填提示 + `lifecycle_steps` |
| FeedbackDistillation | ✅ 完整 | 升级/降权/删除/保留规则 + Skill 更新建议展示 + `feedback_session_history` |
| 5 个 SkillDefinition | ✅ 完整 | `skillLibrary` 含 HR/业务/项目/谈薪/决策层 + 紧凑选择器 `.skill-card-wrap` |
| 虚拟面试委员会 | ✅ 完整 | `VirtualPanel` + `PanelDiscussionRound` + `ModeratorSummary` + 气泡流 + 轮次筛选 + Basis Trace |
| 一致性模式 | ✅ 完整 | `input_fingerprint` + `structured_evaluation` + `temperature: 0` + `seed: 20260709` |
| 双模式 PDF 导出 | ✅ 完整 | `downloadPdfReport` + `createPdfBlobFromJpegs` |
| GitHub Pages 部署 | ✅ 完整 | 在线 Demo 可访问 |
| smoke test 静态验收 | ✅ 完整 | `static_checks()` 覆盖 40+ 项检查（含新增决策摘要/评分表/ModeratorBasis 等） |
| 中英文 i18n | ✅ 完整 | `i18n` 对象 + `applyLanguage()` |
| 主题切换（light/dark/system） | ✅ 完整 | `[data-theme="light/dark"]` + `prefers-color-scheme` 媒体查询 |
| 响应式断点 | ✅ 完整 | `@media (max-width: 640/768/900/1080px)` 四档断点 |
| 决策摘要卡 | ✅ 新增 | `buildDecisionSummaryCards()` + `renderDecisionSummaryCards()` |
| 面试官评分表 | ✅ 新增 | `buildInterviewerScorecardRows()` + `renderInterviewerScorecard()` |
| 四视图分段（报告/图谱/委员会/摘要） | ✅ 新增 | `setResultView()` + `data-result-view` |

**结论：MVP 核心闭环完整，"输入 → 报告 → 图谱 → 委员会 → Offer → 反馈"全链路可用，且 UI 体系已升级到多视图 + 多主题 + 响应式。**

---

## 三、差距分析：按优先级逐项拆解

### P0：稳定当前产品体验 — 0/3 完成

| 路线要求 | 当前状态 | 差距说明 |
|----------|----------|----------|
| Playwright 截图回归（中/英/候选人/面试官/工作台/图谱） | ❌ 未开始 | 项目中无 Playwright 依赖、无测试脚本、无截图目录 |
| smoke test 拆成 UI / schema / report / cache 四类 | ❌ 未开始 | 当前 `smoke_test.py` 仍是单文件 `static_checks()`，未按四类拆分 |
| 缓存命中/未命中浏览器级回归测试 | ❌ 未开始 | 无浏览器自动化测试，缓存逻辑仅靠 smoke test 静态检查覆盖 |

**新增的 UI 检查需求**：现在 UI 已有 4 个结果视图 × 2 个语言 × 2 个受众模式 × 3 个主题 = 48 种渲染状态，回归测试需求更迫切。

**影响**：虚拟委员会与 EvidenceGraph 纯模型已有独立 Node 行为测试，但 UI 交互、缓存命中路径和报告渲染仍主要依赖静态文本检查，尚未形成端到端自动化防护网。

**建议加强**：
1. 引入 Playwright，写 12 组截图回归（4 视图 × 中英 × 候选人面试官）
2. smoke test 拆分为 `test_ui.py` / `test_schema.py` / `test_report.py` / `test_cache.py`
3. 增加 `test_cache_hit.py`：用相同输入跑两次，验证第二次命中缓存且报告一致

---

### P1：让虚拟面试委员会更可审计 — 4/4 大幅完成

| 路线要求 | 当前状态 | 代码证据 |
|----------|----------|----------|
| 展示每个虚拟面试官的 stance / influence_weight / focus | ✅ 已完成 | `agent.stance` / `agent.influence_weight` / `agent.focus` 在面板和图谱中均有展示 |
| 展示每轮讨论提出的证据、质疑和建议 | ✅ 已完成 | `PanelDiscussionRound` 结构含 `impact: "raise_follow_up_priority"` 等字段 |
| 主持人总结可追溯到委员发言、证据节点和追问问题 | ✅ 已完成（**重大进展**） | `buildModeratorBasisTrace()` + `renderModeratorBasisTrace()` + `data-trace-message-id` / `data-trace-node-id` / `data-trace-report-anchor` 跳转 |
| 支持按虚拟角色、讨论轮次、证据节点筛选聊天记录 | ⚠️ 部分完成 | 轮次筛选（`panel-round-filter` / `data-panel-round`）已实现；按虚拟角色、证据节点筛选未实现 |

**重大进展**：
- 上次评估时 P1 第 3 项完全未实现，本次已通过 `renderModeratorBasisTrace()` 实现：
  - 主持人总结下方显示"结论依据"区块
  - 包含三类 chip：委员发言（`basis-turns`）、证据节点（`basis-evidence`）、追问问题（`basis-questions`）
  - 每个 chip 都有 `data-trace-node-id` 或 `data-trace-message-id` 标识，点击可触发 `scrollReportToGraphNode()` 跳转
- 截图 `img/011.png` 显示了新版 UI：第 1 轮、第 2 轮、第 3 轮、主持人总结四个 tab，委员发言下方有"证据 1 / 问题 1 / 报告段落"三个可点击 chip

**未完成的子项**：
- 按虚拟角色筛选聊天记录（需要角色多选下拉框）
- 按证据节点搜索聊天记录（需要节点搜索框）

**影响**：委员会可审计性大幅提升，但"按发言人筛选"功能缺失意味着用户无法快速聚焦"业务负责人对项目深度的质疑"这类单一视角。

**建议加强**：
1. 在轮次 tab 旁加角色多选下拉
2. 加证据节点搜索框
3. 完善 `Basis Trace` 的点击事件：当前 chip 已生成但需要验证点击行为是否真的触发了滚动

---

### P2：让图谱成为决策工具 — 0.5/4 仍待加强

| 路线要求 | 当前状态 | 代码证据 |
|----------|----------|----------|
| 增加图谱节点搜索 | ❌ 未开始 | 无 `searchGraph` / `nodeSearch` 相关函数 |
| 按风险等级、证据等级、Skill 来源、虚拟角色来源过滤 | ⚠️ 部分完成 | 有 `graph-filter` 基础筛选（按节点类型），但无按风险/证据/Skill/角色维度的过滤 |
| 展示反馈对节点和边的影响 diff | ❌ 未开始 | 无 `feedbackDiff` 相关逻辑 |
| 虚拟角色的 challenges 直接提升问题优先级 | ⚠️ 部分完成 | 有 `challengeCount` 统计（`turn.impact === "raise_follow_up_priority"`），但没有实际修改问题优先级的逻辑 |

**新增的图谱 UI 元素**（截图 `img/010.png` 可见）：
- 顶部 tab：全部 / JD / 证据 / 追问 / 风险 / Offer / 反馈 / Skill / Agent
- 证据缺口：JD 列、证据列、风险列、Offer 列、追问/反馈/Offer 列
- 右侧栏：面试官评分表（含绿色"提升"、红色"降权"标记）+ 人工反馈

**未完成的子项**：
1. **图谱节点搜索框**（顶部 tab 上方）—— 仍无实现
2. **按风险等级多维过滤**（高/中/低）—— 仍无实现
3. **challenge 优先级提升**—— `challengeCount` 仅为统计，未影响问题排序

**影响**：图谱 UI 有了清晰的结构骨架，但搜索和多维过滤仍是空白，用户面对 56 个节点时无法快速定位关键项。

**建议加强**：
1. 顶部 tab 上方加搜索框，支持按节点 ID / 标签 / 内容模糊匹配
2. 顶部 tab 区域扩展为二级筛选：增加风险等级（高/中/低）、证据等级（1-3）、来源（JD/简历/反馈/Skill/虚拟角色）下拉
3. `challengeCount > 0` 时，在问题库对应问题上标记"虚拟委员会关注"并提升排序权重

---

### P3：把反馈闭环做实 — 1/5 部分完成

| 路线要求 | 当前状态 | 代码证据 |
|----------|----------|----------|
| 人工反馈更结构化 | ⚠️ 部分完成 | 表单字段（agreement / questionUse / disagreementReason / evidenceSufficiency / riskValidation / notes）+ 评分表有 asked_status + `feedback_session_history` 字段 |
| 保存反馈历史 | ⚠️ 部分完成 | Schema 增加了 `feedback_session_history` 字段，但代码中未见 `saveFeedbackHistory` / `loadFeedbackHistory` 实际持久化逻辑 |
| 反馈变成 SkillDefinition 更新候选建议 | ⚠️ 部分完成 | Schema 增加了 `skill_update_suggestions` 字段；代码中有 `buildSkillRegistry()` 但未见实际生成 SkillDefinition diff 的逻辑 |
| 支持规则冲突裁决 | ❌ 未开始 | Schema 增加了 `conflict_policy` 字段，但代码中无 `ruleConflict` / `conflictResolve` 实际逻辑 |
| 反馈影响虚拟角色权重 | ❌ 未开始 | `influence_weight` 仍是静态计算，不受反馈影响 |

**重大进展**：
- Schema 层已为 P3 全部子项预留字段（`feedback_session_history` / `skill_update_suggestions` / `conflict_policy` / `impact_diff`）
- 但代码层大部分是"数据形状已就绪，运行时未实现"

**影响**：Schema 先行是好的工程实践，但代码层缺口意味着前端 UI 无法展示这些字段。即使生成了 Skill 更新建议，UI 也没有 diff 视图。

**建议加强**：
1. 反馈数据按 `input_fingerprint` 索引存到 `localStorage`
2. 生成 SkillDefinition 更新建议时，输出可执行的 diff（新增/修改/删除哪些字段）并在 UI 展示
3. `buildVirtualPanel` 时读取历史反馈，调整 `influence_weight`
4. Schema 已有的 `conflict_policy` 字段，补充裁决逻辑

---

### P4：模块化工程结构 — 6/10 第五阶段完成

路线建议拆分核心职责模块，当前已完成第五阶段渐进拆分：纯领域数据、缓存指纹逻辑、国际化文案、虚拟委员会模型、EvidenceGraph 模型和图谱视图逻辑已从 `app.js` 移出。

| 建议模块 | 当前状态 | 当前行数估算 |
|----------|----------|-------------|
| i18n.js | ✅ 第二阶段完成 | `i18n` 文案字典、`reportStagesByLanguage`、`getText()` 与 `getReportStages()` 已进入 `apps/web/src/i18n.js`；DOM 语言应用逻辑仍由 `app.js` 编排 |
| domain-data.js / roles | ✅ 第一阶段完成 | `roleProfiles`、`samples`、`providerDefaults`、版本常量已进入 `apps/web/src/domain-data.js` |
| skills.js | ❌ 未拆分 | ~300 行（`skillLibrary` + 5 个 SkillDefinition） |
| evidence-graph.js | ✅ 纯模型层完成 | `buildEvidenceGraph`、`reportAnchorForNodeType`、`detectEvidenceGraphGaps` 已进入独立模块 |
| graph-view.js | ✅ 第五阶段完成 | 图谱渲染、节点筛选、关系/节点详情弹窗、委员会 trace 详情和报告段落跳转已进入 `apps/web/src/graph-view.js` |
| reports.js | ❌ 未拆分 | ~1000 行（报告拼装 + 流式输出 + 评分表 + 决策摘要） |
| pdf.js | ❌ 未拆分 | ~300 行（PDF 导出 + 截图） |
| feedback.js | ❌ 未拆分 | ~300 行（FeedbackDistillation） |
| offer.js | ❌ 未拆分 | ~500 行（OfferSimulationRun + 七步推理 + 状态机） |
| run-cache.js / consistency | ✅ 第一阶段完成 | `buildInputFingerprint`、`buildCanonicalInputForFingerprint`、`restoreCachedRun`、`persistRunCache` 已进入 `apps/web/src/run-cache.js` |
| virtual-panel.js | ✅ 纯模型层完成 | `buildVirtualInterviewPanel`、`buildPanelDiscussionRounds`、`buildPanelTurn`、`buildModeratorSummary` 已进入独立模块；群聊渲染、BasisTrace 和跳转交互仍在 `app.js` |

**变化**：已完成五阶段渐进拆分，`app.js` 从 8151 行降至 6461 行；六个独立模块可单独做语法检查，委员会、图谱模型和图谱视图均有 Node 行为测试并纳入 smoke test。

**影响**：最大工程债持续拆解，`app.js` 已降到 6500 行以内；报告拼装、模型请求、委员会 UI 和 PDF 导出仍需继续模块化。

**建议加强**：
1. 下一步拆 `model-client.js`，隔离真实模型请求、流式解析、代理地址和错误处理。
2. 再拆 `reports.js`，隔离报告拼装、决策摘要、评分表和流式预览。
3. 暂时保持普通 `<script>` 顺序加载，等核心模块边界稳定后再评估是否迁移到 ES Module。

---

### P5：真实验证 — 暂缓（路线明确）

路线文档明确标注"当前暂不做真实样本评测"，5 项验证项待条件成熟后启动。此项目无需加强，等待产品稳定后自然推进。

---

## 四、路线文档未覆盖但已实现的额外能力

### 1. 多视图分段（不在 P0-P5 任何优先级中）

本次新发现 UI 已有 4 个结果视图：
- **报告预览**（默认）
- **证据图谱**
- **虚拟委员会**
- **结果摘要**（新增决策摘要卡 + 面试官评分表）

通过 `setResultView()` + `data-result-view` 实现分段切换，UI 上是顶部 tab 形式。

### 2. 主题切换（不在 P0-P5 任何优先级中）

CSS 已实现 `[data-theme="light/dark"]` + `prefers-color-scheme` 系统跟随，这是从 `OfferAgent-redesigned.html` 重构版吸收的关键能力。

### 3. 响应式布局（不在 P0-P5 任何优先级中）

四档 `@media` 断点：640px / 768px / 900px / 1080px，覆盖手机到桌面的布局自适应。

### 4. 决策摘要卡 + 面试官评分表

不属于路线 P0-P5 任何一项，但显著提升面试官模式的信息密度：
- 决策摘要卡 4 张：决策门控、证据覆盖、Offer 沙盘、反馈影响
- 面试官评分表：每行含技能项、当前判断、状态、证据、面试动作

---

## 五、路线文档未覆盖且仍待加强的缺口

### 1. 错误处理与用户提示

代码中模型请求超时设置为 90 秒（`MODEL_REQUEST_TIMEOUT_MS = 90000`），但超时后的用户提示和恢复机制不够完善。如果 LLM 返回异常或流式中断，用户可能看到半截报告无法操作。

**建议**：增加"重试"按钮和"部分报告续传"能力。

### 2. 无障碍访问

虽然已经加了 `aria-label` / `aria-selected` 等基础 ARIA 属性（如 `role="tablist"`），但图谱节点和报告段落的键盘导航、屏幕阅读器适配仍不完整。对于面试场景（可能涉及视障用户），这会成为使用门槛。

**建议**：图谱节点支持 Tab 键聚焦 + Enter 激活；评分表支持键盘上下导航。

### 3. API Key 安全提示

虽然路线文档和 README 都强调了隐私安全，但 UI 上没有明显的安全提示。用户在输入 API Key 时可能不清楚 Key 不会上传到服务器。

**建议**：API Key 输入框旁增加 tooltip："Key 仅在当前浏览器中使用，不会上传或缓存。"

---

## 六、本次评估相比上次的关键变化

| 维度 | 上次（13:42） | 本次（20:00） | 变化 |
|------|----------------|----------------|------|
| P1 主持人反向跳转 | ❌ 未开始 | ✅ 已完成 | **+1 重大进展** |
| P1 讨论记录筛选 | ❌ 未开始 | ⚠️ 轮次筛选完成，角色/节点未做 | 0.5/1 |
| P2 搜索/过滤/挑战优先级 | 0.5/4 | 0.5/4 | 无变化 |
| P3 反馈闭环 | 0.5/5 | 1/5 | +0.5（Schema 字段预留） |
| P4 模块化 | 0/10 | 5/10 | 已拆出 domain-data、run-cache、i18n、virtual-panel 与 evidence-graph 纯模型层 |
| P0 测试 | 0/3 | 0/3 | 三项路线要求未完成；新增委员会与图谱纯模型行为测试 |
| 总完成度 | 14/30 项 | **20/30 项** | +6 项 |
| 完成率 | 47% | **67%** | +20% |

**主要进展**：
1. P1 几乎全部完成（4/4 大幅完成），从短板变成优势
2. P3 Schema 层 5/5 已预留字段，但代码层仍只有 1/5
3. UI 体系（多视图 + 多主题 + 响应式）从无到完整

**仍需加强**：
1. P0 测试网（P2-P4 都建立在稳定的产品基础上，缺测试就是裸奔）
2. P4 模块化（已完成第五阶段拆分，app.js 已降到 6500 行以内）
3. P2 图谱节点搜索和多维过滤（用户面对 56 个节点时无法快速定位）
4. P3 反馈闭环代码实现（Schema 字段已就绪，差代码层落地）

---

## 七、优先级建议：下一步做什么

### 第一梯队（立即做，1-2 周）

1. **P0 全部 3 项** — 纯模型已有局部测试，但端到端测试网仍未建立
2. **P2 图谱节点搜索** — 半天可完成，体验提升大
3. **P1 按角色筛选聊天记录** — 1 天可完成，闭环 P1

### 第二梯队（近期做，2-4 周）

4. **P4 继续拆核心模块**（model-client / reports / panel-view）— 为后续开发降本
5. **P2 challenge 优先级提升** — 把已有的 `challengeCount` 接入问题排序
6. **P3 反馈历史保存** — `localStorage` 存储 + 按 `input_fingerprint` 索引

### 第三梯队（中期做，1-2 月）

7. **P3 SkillDefinition 更新建议** — Schema 已就绪，补充代码逻辑
8. **P3 反馈影响虚拟角色权重** — 闭环打通
9. **P2 反馈 diff 可视化** — 图谱节点前后对比
10. **错误处理/重试 + 移动端适配 + 无障碍基础** — 扩大用户面

---

## 八、总结

OfferAgent 的 MVP 核心闭环已经完整跑通，"输入 → 项目匹配闸口 → 报告生成 → 证据图谱 → 虚拟委员会 → Offer 沙盘 → 人工反馈"全链路可用，且本次新增了多视图分段、多主题切换、响应式布局、决策摘要卡、面试官评分表、Moderator Basis Trace 等能力。

**与上次评估的关键差异**：
- 上次（13:42）：P1 几乎全空，反向跳转、讨论筛选都没做
- 本次（20:00）：P1 4/4 大幅完成，主持人可追溯到委员发言/证据节点/追问问题，轮次筛选也实现

**当前最大的三个短板**：
1. **端到端与缓存回归测试仍缺失**（P0 三项未完成）— 目前已有委员会和图谱两个纯模型行为测试
2. **app.js 仍有 6461 行**（P4 第五阶段完成）— 最大工程债已持续拆解，但模型请求、报告和委员会 UI 仍需继续拆分
3. **反馈闭环未完全闭合**（P3 完成 20%）— Schema 字段已预留，代码层只完成 1/5

建议从 P0 测试网和 P4 后续模块化拆分同步推进，用测试保障重构安全，用重构降低后续开发成本。
