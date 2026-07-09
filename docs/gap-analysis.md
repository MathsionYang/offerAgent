# OfferAgent 功能差距评估报告

更新时间：2026-07-09

## 一、评估方法

本报告对照 `开发路线.md` 中定义的 P0-P5 优先级清单，逐项验证 `apps/web2/app.js`、`apps/web2/styles.css`、`scripts/smoke_test.py`、`schemas/` 目录 5 个 JSON Schema 与 GitHub Pages workflow 的实际实现状态。

验证手段：代码关键词检索 + 函数签名确认 + Schema 字段比对 + 线路文档交叉比对。

---

## 二、已实现且验证通过的能力

### 核心闭环（路线第 2 节，全部已落地）

| 能力域 | 验证结果 | 代码证据 |
|--------|----------|----------|
| Web 工作台 | ✅ 完整 | `apps/web2/index.html` + `apps/web2/app.js` 顶部 DOM 绑定 |
| 候选人/面试官双模式 | ✅ 完整 | `setAudienceMode()` / `applyInterviewerMode()` |
| 4 类 RoleProfile | ✅ 完整 | `roleProfiles` 对象含 product_manager / developer / technical_support / sales |
| 13 项报告能力 | ✅ 完整 | `reportStagesByLanguage` 含全部阶段定义 |
| EvidenceGraph 基础 | ✅ 完整 | `buildEvidenceGraph()` + 9 种节点 + 7 种边 + `report_anchor` 跳转 |
| OfferSimulationRun | ✅ 完整 | 三场景 + 状态机 + 历史 + 回填提示 |
| FeedbackDistillation | ✅ 完整 | 升级/降权/删除/保留规则 + Skill 更新建议展示 |
| 5 个 SkillDefinition | ✅ 完整 | `skillLibrary` 含 HR/业务/项目/谈薪/决策层 |
| 虚拟面试委员会 | ✅ 完整 | `VirtualPanel` + `PanelDiscussionRound` + `ModeratorSummary` + 气泡流 |
| 一致性模式 | ✅ 完整 | `input_fingerprint` + `structured_evaluation` + `temperature: 0` + `seed: 20260709` |
| 双模式 PDF 导出 | ✅ 完整 | `downloadPdfReport` + `createPdfBlobFromJpegs` |
| GitHub Pages 部署 | ✅ 完整 | 在线 Demo 可访问 |
| smoke test 静态验收 | ✅ 完整 | `static_checks()` 覆盖 20+ 项检查 |
| 中英文 i18n | ✅ 完整 | `i18n` 对象 + `applyLanguage()` |

**结论：MVP 核心闭环完整，"输入 → 报告 → 图谱 → 委员会 → Offer → 反馈"全链路可用。**

---

## 三、差距分析：按优先级逐项拆解

### P0：稳定当前产品体验 — 0/3 完成

| 路线要求 | 当前状态 | 差距说明 |
|----------|----------|----------|
| Playwright 截图回归（中/英/候选人/面试官/工作台/图谱） | ❌ 未开始 | 项目中无 Playwright 依赖、无测试脚本、无截图目录 |
| smoke test 拆成 UI / schema / report / cache 四类 | ❌ 未开始 | 当前 `smoke_test.py` 是单文件 `static_checks()`，未按四类拆分 |
| 缓存命中/未命中浏览器级回归测试 | ❌ 未开始 | 无浏览器自动化测试，缓存逻辑仅靠 smoke test 静态检查覆盖 |

**影响**：当前所有验证都是静态文本匹配（正则 / 关键词），无法覆盖运行时行为。任何 UI 交互回归、缓存命中路径、报告渲染逻辑变更都没有自动化防护网。

**建议加强**：
1. 引入 Playwright，写 6 组截图回归（中英 × 候选人面试官 × 工作台图谱）
2. smoke test 拆分为 `test_ui.py` / `test_schema.py` / `test_report.py` / `test_cache.py`
3. 增加 `test_cache_hit.py`：用相同输入跑两次，验证第二次命中缓存且报告一致

---

### P1：让虚拟面试委员会更可审计 — 2/4 完成

| 路线要求 | 当前状态 | 代码证据 |
|----------|----------|----------|
| 展示每个虚拟面试官的 stance / influence_weight / focus | ✅ 已完成 | `agent.stance` / `agent.influence_weight` / `agent.focus` 在面板和图谱中均有展示 |
| 展示每轮讨论提出的证据、质疑和建议 | ✅ 已完成 | `PanelDiscussionRound` 结构含 `impact: "raise_follow_up_priority"` 等字段 |
| 主持人总结可以反向跳转到图谱节点和报告段落 | ✅ 已完成 | 主持人总结展示委员发言、证据节点、追问问题依据，并复用追溯弹窗 |
| 支持按虚拟角色、讨论轮次、证据节点筛选聊天记录 | ❌ 未开始 | 虚拟委员会气泡流仍以线性展示为主，缺少筛选控件 |

**影响**：虚拟委员会现在已经可追溯，但还不能按角色、轮次、证据节点快速过滤，长讨论场景下定位效率仍需加强。

**建议加强**：
1. 保持主持人总结的依据追溯能力，并继续补充键盘导航与可访问性文案
2. 在气泡流区域增加筛选栏：按角色（下拉）/ 轮次（数字）/ 证据节点（搜索框）过滤

---

### P2：让图谱成为决策工具 — 0.5/4 完成

| 路线要求 | 当前状态 | 代码证据 |
|----------|----------|----------|
| 增加图谱节点搜索 | ❌ 未开始 | 无 `searchGraph` / `nodeSearch` 相关函数 |
| 按风险等级、证据等级、Skill 来源、虚拟角色来源过滤 | ⚠️ 部分完成 | 有 `graph-filter` 基础筛选（按节点类型），但无按风险/证据/Skill/角色维度的过滤 |
| 展示反馈对节点和边的影响 diff | ❌ 未开始 | 无 `feedbackDiff` 相关逻辑 |
| 虚拟角色的 challenges 直接提升问题优先级 | ⚠️ 部分完成 | 有 `challengeCount` 统计（`turn.impact === "raise_follow_up_priority"`），但没有实际修改问题优先级的逻辑 |

**影响**：图谱当前是"展示工具"而非"决策工具"。用户无法快速搜索定位关键节点，无法按风险等级聚焦高风险项，无法看到反馈前后图谱变化，虚拟角色的质疑也没有实际影响问题排序。

**建议加强**：
1. 图谱区域增加搜索框，支持按节点 ID / 标签 / 内容模糊匹配
2. 筛选栏扩展：增加风险等级（高/中/低）、证据等级（1-3）、来源（JD/简历/反馈/Skill/虚拟角色）下拉
3. `challengeCount > 0` 时，在问题库对应问题上标记"虚拟委员会关注"并提升排序权重

---

### P3：把反馈闭环做实 — 0.5/5 完成

| 路线要求 | 当前状态 | 代码证据 |
|----------|----------|----------|
| 人工反馈更结构化 | ⚠️ 部分完成 | 有表单字段（agreement / questionUse / disagreementReason / evidenceSufficiency / riskValidation / notes），但反馈数据未规则化存储 |
| 保存反馈历史 | ❌ 未开始 | 无 `saveFeedbackHistory` / `loadFeedbackHistory`，反馈仅存在于当前 run |
| 反馈变成 SkillDefinition 更新候选建议 | ❌ 未开始 | 只有展示逻辑（`Skill 更新建议` 文本），没有实际生成 SkillDefinition diff |
| 支持规则冲突裁决 | ❌ 未开始 | 无 `ruleConflict` / `conflictResolve` 逻辑 |
| 反馈影响虚拟角色权重 | ❌ 未开始 | `influence_weight` 是静态计算，不受反馈影响 |

**影响**：反馈闭环当前是"一次性写入"模式。面试官写了反馈，报告里展示了，但反馈无法沉淀、无法跨会话复用、无法自动影响后续评估。这是整个产品从"工具"向"系统"升级的关键缺口。

**建议加强**：
1. 反馈数据结构化存储到 `localStorage`，按 `input_fingerprint` 索引
2. 生成 SkillDefinition 更新建议时，输出可执行的 diff（新增/修改/删除哪些字段）
3. `buildVirtualPanel` 时读取历史反馈，调整 `influence_weight`

---

### P4：模块化工程结构 — 0/10 完成

路线建议拆分 10 个模块，当前全部集中在 `app.js`（6826 行）。

| 建议模块 | 当前状态 | 当前行数估算 |
|----------|----------|-------------|
| i18n.js | ❌ 未拆分 | ~400 行（`i18n` 对象 + `applyLanguage`） |
| roles.js | ❌ 未拆分 | ~300 行（`roleProfiles` + 4 类岗位逻辑） |
| skills.js | ❌ 未拆分 | ~250 行（`skillLibrary` + 5 个 SkillDefinition） |
| graph.js | ❌ 未拆分 | ~500 行（`buildEvidenceGraph` + 渲染 + 筛选） |
| reports.js | ❌ 未拆分 | ~800 行（报告拼装 + 流式输出） |
| pdf.js | ❌ 未拆分 | ~300 行（PDF 导出 + 截图） |
| feedback.js | ❌ 未拆分 | ~200 行（FeedbackDistillation） |
| offer.js | ❌ 未拆分 | ~400 行（OfferSimulationRun + 七步推理） |
| consistency.js | ❌ 未拆分 | ~300 行（指纹 + 缓存 + 结构化中间层） |
| virtual-panel.js | ❌ 未拆分 | 虚拟委员会、讨论、主持人总结仍集中在 `apps/web2/app.js` |

**影响**：6826 行单文件是当前最大的工程债。任何修改都需要在全文中搜索定位，代码复用困难，新成员上手成本高，且无法做模块级单元测试。

**建议加强**：
1. 先拆 `i18n.js` 和 `roles.js`（依赖最少、最独立）
2. 再拆 `graph.js` 和 `virtual-panel.js`（逻辑最重、最容易独立测试）
3. 使用 ES Module `<script type="module">` 方式，不需要打包工具即可在浏览器中运行

---

### P5：真实验证 — 暂缓（路线明确）

路线文档明确标注"当前暂不做真实样本评测"，5 项验证项待条件成熟后启动。此项目无需加强，等待产品稳定后自然推进。

---

## 四、路线文档未覆盖但需关注的额外缺口

### 1. 错误处理与用户提示

当前代码中模型请求超时设置为 90 秒（`MODEL_REQUEST_TIMEOUT_MS = 90000`），但超时后的用户提示和恢复机制不够完善。如果 LLM 返回异常或流式中断，用户可能看到半截报告无法操作。

**建议**：增加"重试"按钮和"部分报告续传"能力。

### 2. 移动端适配

`styles.css` 3363 行，但未检测到响应式断点（`@media`）。当前工作台布局是桌面端 grid 布局，在手机上可能不可用。

**建议**：至少适配平板宽度（768px），让候选人能在手机上查看报告。

### 3. 无障碍访问

未检测到 ARIA 标签、键盘导航支持、屏幕阅读器适配。对于面试场景（可能涉及视障用户），这会成为使用门槛。

**建议**：图谱节点和报告段落增加 `aria-label`，气泡流支持键盘上下导航。

### 4. API Key 安全提示

虽然路线文档和 README 都强调了隐私安全，但 UI 上没有明显的安全提示。用户在输入 API Key 时可能不清楚 Key 不会上传到服务器。

**建议**：API Key 输入框旁增加 tooltip："Key 仅在当前浏览器中使用，不会上传或缓存。"

---

## 五、优先级建议：下一步做什么

基于"投入产出比 × 用户感知度"排序：

### 第一梯队（立即做，1-2 周）

1. **P0 全部 3 项** — 没有测试网，任何改动都是裸奔
2. **P1 虚拟委员会筛选** — 在已有追溯能力上补充角色、轮次、证据节点过滤
3. **P2 图谱节点搜索** — 前端搜索框 + 模糊匹配，半天可完成

### 第二梯队（近期做，2-4 周）

4. **P4 先拆 3 个模块**（i18n / roles / graph） — 为后续开发降本
5. **P2 challenge 优先级提升** — 把已有的 `challengeCount` 接入问题排序
6. **P3 反馈历史保存** — `localStorage` 存储 + 按 `input_fingerprint` 索引

### 第三梯队（中期做，1-2 月）

7. **P3 SkillDefinition 更新建议** — 输出可执行 diff
8. **P3 反馈影响虚拟角色权重** — 闭环打通
9. **P2 反馈 diff 可视化** — 图谱节点前后对比
10. **移动端适配 + 无障碍基础** — 扩大用户面

---

## 六、总结

OfferAgent 的 MVP 核心闭环已经完整跑通，"输入 → 项目匹配闸口 → 报告生成 → 证据图谱 → 虚拟委员会 → Offer 沙盘 → 人工反馈"全链路可用，且一致性模式和隐私设计考虑周到。

当前最大的三个短板：
1. **测试覆盖为零**（P0 全空）— 跑得动但不敢改
2. **6826 行单文件**（P4 全空）— 改得动但维护成本高
3. **反馈闭环未闭合**（P3 完成 10%）— 反馈写了但不能沉淀复用

建议从 P0 测试网和 P4 模块化拆分同步推进，用测试保障重构安全，用重构降低后续开发成本。
