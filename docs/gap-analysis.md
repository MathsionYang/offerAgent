# OfferAgent 功能差距评估报告

更新时间：2026-07-10 11:58

## 一、评估方法

本报告对照 `开发路线.md` 中定义的 P0-P5 优先级清单，逐项验证以下文件的实现状态：

- `apps/web/app.js`（1893 行 — 主入口、状态流转与页面编排）
- `apps/web/src/` 18 个模块（共 7405 行）
- `apps/web/styles.css`（2202 行）、`apps/web/index.html`（320 行）
- `scripts/smoke_test.py`（1320 行）+ 15 个 JS 单元测试文件（共 1772 行）
- `schemas/` 5 个 JSON Schema

验证手段：源码 Grep、模块单测、smoke test、结构检查和真实浏览器 Mock 运行验证。

---

## 二、代码量变化

| 文件/目录 | 上次 (Jul 9 20:00) | 本次 (Jul 10 11:58) | 变化 |
|-----------|-------------------|---------------------|------|
| `app.js` | 8151 行 | 1893 行 | **−6258 行 (−77%)** |
| `src/` 模块 | 0 文件 | 18 文件 / 7405 行 | **全新** |
| `styles.css` | 2202 行 | 2202 行 | 无变化 |
| JS 单元测试 | 0 文件 | 15 文件 / 1772 行 | **全新** |
| `smoke_test.py` | 1305 行 | 1320 行 | +15 行（纳入新增模块测试门禁） |
| 测试通过率 | — | **15/15 + smoke 全通过** | ✅ |

---

## 三、逐项评估

### P0：稳定当前产品体验（1.5/4 — 38%）

| # | 路线要求 | 状态 | 证据 |
|---|---------|------|------|
| 1 | 清理剩余历史文案和编码问题 | ✅ | 模块化拆分过程中已清理 |
| 2 | 用 Playwright 做截图回归 | ❌ | 未见 Playwright 依赖或脚本 |
| 3 | 把 smoke test 拆成 UI/schema/report/cache 四类 | ⚠️ | smoke_test.py 仍为单文件 1320 行；但新增 15 个 JS 单元测试覆盖各模块逻辑层 |
| 4 | 增加缓存命中/未命中浏览器级回归测试 | ❌ | smoke_test.py 有静态一致性/隐私检查，但无浏览器级运行时回归 |

**新增能力（未在路线中但已实现）**：
- 15 个 JS 单元测试文件，新增覆盖 localization-mappers、report-content-helpers、report-export-template，并继续覆盖 assessment-rules、evaluation-engine、evidence-graph、feedback-engine、graph-view、model-client、panel-view、pdf-export、report-builders、reports-view、skill-registry、virtual-panel
- 全部测试通过

**差距**：Playwright 浏览器级 E2E 回归 + 缓存运行时回归测试是当前最大空白。虽然 JS 单元测试已覆盖模块逻辑层，但缺少"真实浏览器中跑一遍完整流程"的保障。

---

### P1：让虚拟面试委员会更可审计（3.5/4 — 88%）

| # | 路线要求 | 状态 | 证据 |
|---|---------|------|------|
| 1 | 展示 stance、influence_weight、focus | ✅ | `virtual-panel.js` 中 stance/influence_weight 已赋值并按 influence_weight 排序 |
| 2 | 展示每轮讨论的证据、质疑和建议 | ✅ | PanelDiscussionRound 结构完整 |
| 3 | 主持人总结可追溯到委员发言、证据节点和追问问题 | ✅ | `buildModeratorBasisTrace()` + `renderModeratorBasisTrace()` + `scrollIntoView()` 实现反向跳转 |
| 4 | 支持按虚拟角色、讨论轮次、证据节点筛选聊天记录 | ⚠️ | **轮次筛选**已完成（`panel-round-filter` + `data-panel-round`）；**角色筛选**和**证据节点筛选**未找到 |

**差距**：聊天记录筛选只做了轮次维度，缺角色（按面试官类型过滤）和证据节点（只看与某条证据相关的发言）两个筛选维度。

---

### P2：让图谱成为决策工具（1/4 — 25%）

| # | 路线要求 | 状态 | 证据 |
|---|---------|------|------|
| 1 | 增加图谱节点搜索 | ❌ | graph-view.js 中无 searchInput/nodeSearch/graphSearch |
| 2 | 增加按风险等级、证据等级、Skill 来源、虚拟角色来源过滤 | ❌ | 仅有基础节点类型筛选（`data-filter-type` = All/Requirements/Evidence/Validation） |
| 3 | 展示反馈对节点和边的影响 diff | ✅ | `buildFeedbackImpactDiff()` + reports-view.js 渲染 diff 列表 |
| 4 | 让虚拟角色的 challenges 直接提升问题优先级 | ❌ | assessment-rules.js 中无 challengePriority/raisePriority 逻辑 |

**差距**：这是完成度最低的优先级。图谱目前只能按节点类型过滤（4 个 tab），没有搜索框、没有按风险/证据等级过滤、没有按来源过滤。challenges 也只统计数量但不影响问题排序。

---

### P3：把反馈闭环做实（3/5 — 60%）

| # | 路线要求 | 状态 | 证据 |
|---|---------|------|------|
| 1 | 让人工反馈更结构化 | ✅ | FeedbackDistillation 含 rules/actions/impact_diff/skill_update_suggestions 四维结构 |
| 2 | 保存反馈历史 | ❌ | feedback-engine.js 中无 localStorage/sessionStorage/persist 逻辑，刷新即丢失 |
| 3 | 将反馈变成 SkillDefinition 更新候选建议 | ✅ | `buildSkillUpdateSuggestions()` 已实现 |
| 4 | 支持规则冲突裁决 | ✅ | 5 条 conflict_policy 规则（人工优先、证据不足降级、风险覆盖 Offer 等） |
| 5 | 让反馈影响虚拟角色权重 | ❌ | feedback-engine.js 中无 influence/weight adjust 逻辑 |

**差距**：反馈闭环"算得出"但"存不住"。结构化、冲突裁决、Skill 更新建议都有了，但反馈不能跨会话保存，也不能动态调整虚拟面试官的影响力权重。这是从"工具"升级为"系统"的关键卡点。

---

### P4：模块化工程结构（10/10 — 100%）

| # | 路线建议 | 状态 | 实际文件 | 行数 |
|---|---------|------|---------|------|
| 1 | `i18n.js` | ✅ | `src/i18n.js` + `src/localization-mappers.js` | 361 + 244 |
| 2 | `roles.js` | ✅ | `src/domain-data.js`（含 RoleProfile） | 264 |
| 3 | `skills.js` | ✅ | `src/skill-registry.js` | 215 |
| 4 | `graph.js` | ✅ | `src/evidence-graph.js` + `src/graph-view.js` | 326 + 735 |
| 5 | `reports.js` | ✅ | `src/report-builders.js` + `src/reports-view.js` + `src/report-content-helpers.js` | 587 + 596 + 721 |
| 6 | `pdf.js` | ✅ | `src/pdf-export.js` + `src/report-export-template.js` | 317 + 1328 |
| 7 | `feedback.js` | ✅ | `src/feedback-engine.js` | 185 |
| 8 | `offer.js` | ✅ | `src/evaluation-engine.js`（含 buildOfferSimulationRun） | 307 |
| 9 | `consistency.js` | ✅ | `src/run-cache.js` | 127 |
| 10 | `virtual-panel.js` | ✅ | `src/virtual-panel.js` + `src/panel-view.js` | 181 + 525 |

**额外模块**（路线未建议但已拆出）：
- `src/assessment-rules.js`（204 行）— 评估规则引擎
- `src/model-client.js`（182 行）— LLM API 客户端封装

**结论**：P4 完全达标。app.js 从 8151 行瘦身到 1893 行，报告内容、静态导出模板和本地化映射也已形成独立模块；18 个模块均可单独检查和测试。

---

### P5：真实验证（暂缓）

路线文档明确标注"当前暂不做真实样本评测"，保持暂缓状态。

---

## 四、完成度总览

| 优先级 | 完成/总数 | 百分比 | 趋势 |
|--------|----------|--------|------|
| P0 稳定性 | 1.5/4 | 38% | ↑（新增 15 个 JS 测试） |
| P1 可审计 | 3.5/4 | 88% | → |
| P2 图谱决策 | 1/4 | 25% | → |
| P3 反馈闭环 | 3/5 | 60% | ↑（+冲突裁决 +Skill 更新） |
| P4 模块化 | 10/10 | 100% | ↑↑（从 0 到全部完成） |
| **总计** | **19/27** | **70%** | **↑10%** |

---

## 五、本轮重大进展

### 1. P4 模块化彻底完成

这是本轮最大的结构性变化。app.js 从 8151 行单文件拆分为 1893 行主入口 + 18 个模块（7405 行），总计 9298 行代码。新增的 `report-content-helpers.js`、`report-export-template.js` 和 `localization-mappers.js` 分别承载报告内容、静态导出模板和本地化映射，页面入口主要保留状态流转、事件绑定、模型提示词和 Mock 报告编排。

### 2. P0 测试覆盖从零到十五

15 个 JS 单元测试文件覆盖了所有核心模块的逻辑层：
- assessment_rules_test.js（92 行）
- evaluation_engine_test.js（163 行）
- evidence_graph_test.js（156 行）
- feedback_engine_test.js（91 行）
- graph_view_test.js（68 行）
- localization_mappers_test.js（53 行）
- model_client_test.js（163 行）
- panel_view_test.js（145 行）
- pdf_export_test.js（158 行）
- report_builders_test.js（180 行）
- report_content_helpers_test.js（93 行）
- report_export_template_test.js（82 行）
- reports_view_test.js（131 行）
- skill_registry_test.js（90 行）
- virtual_panel_test.js（107 行）

全部 16 个模块测试 + smoke_test.py 纳入回归；新增 `input_readiness_test.js`，并将输入就绪度和图谱关键词搜索加入 smoke 最终通过条件。

### 3. P3 反馈引擎能力增强

新增了 `conflict_policy`（5 条冲突裁决规则）和 `buildSkillUpdateSuggestions()`（反馈 → Skill 更新建议），以及 `buildFeedbackImpactDiff()`（反馈对节点和边的影响 diff）。

---

## 六、仍待加强的短板

### 短板 1：P0 浏览器级回归测试（缺口最大）

JS 单元测试覆盖了模块逻辑层，但缺少"真实浏览器中跑完整流程"的 E2E 保障。具体缺：
- **Playwright** 截图回归（中/英、候选人/面试官、工作台/图谱）
- **缓存命中/未命中**的浏览器级运行时回归
- smoke_test.py 仍是 1320 行单文件，未拆分为 UI/schema/report/cache 四类

**影响**：改代码后有单元测试保护模块逻辑，但 UI 交互链路和缓存行为无自动化保障。

### 短板 2：P2 图谱高级决策能力

图谱已支持节点类型筛选、关键词搜索、组合过滤、匹配计数和无结果提示。仍缺：
- 按风险等级/证据等级/Skill 来源/虚拟角色来源过滤
- challenges 统计了但不提升问题优先级

**影响**：用户已经可以快速定位文本节点，但还不能按风险和证据维度完成更精细的决策筛选。

### 短板 3：P3 反馈历史持久化

反馈引擎能算出结构化结果，但不能跨会话保存：
- 无 localStorage/sessionStorage 持久化
- 刷新页面后反馈丢失
- 反馈不能影响虚拟角色权重（动态调整影响力）

**影响**：面试官每次使用都是"从零开始"，无法积累和复用反馈经验。

### 短板 4：P1 聊天记录筛选不完整

轮次筛选已完成，但缺：
- 按虚拟角色筛选（只看某个面试官的发言）
- 按证据节点筛选（只看与某条证据相关的讨论）

**影响**：多轮讨论后信息量大，用户无法快速定位某个角色或某条证据的相关讨论。

---

## 七、下一步建议（按 ROI 排序）

### 第一梯队（高 ROI、低风险）

| 优先级 | 任务 | 预估工作量 | 理由 |
|--------|------|-----------|------|
| P1-4 | 聊天记录按角色筛选 | 半天 | panel-view.js 已有轮次筛选模式，复制扩展即可 |
| P2-4 | challenges 提升问题优先级 | 1 天 | assessment-rules.js 加排序权重，数据已有 |
| P3-2 | 反馈历史 localStorage 持久化 | 1 天 | feedback-engine.js + run-cache.js 加 save/load 逻辑 |

### 第二梯队（中 ROI、中风险）

| 优先级 | 任务 | 预估工作量 | 理由 |
|--------|------|-----------|------|
| P2-2 | 图谱高级过滤（风险/证据/Skill/角色） | 1-2 天 | graph-view.js 扩展 filter 面板 |
| P0-2 | Playwright 截图回归 | 2-3 天 | 需安装 Playwright、写 6-8 个场景脚本 |
| P0-4 | 缓存浏览器级回归测试 | 1 天 | 依赖 Playwright 框架 |
| P3-5 | 反馈影响虚拟角色权重 | 1-2 天 | virtual-panel.js + feedback-engine.js 联动 |

### 第三梯队（低 ROI 或高复杂度）

| 优先级 | 任务 | 预估工作量 | 理由 |
|--------|------|-----------|------|
| P0-3 | smoke_test.py 拆分四类 | 1 天 | 机械拆分，但需保证不破坏现有通过率 |
| P1-4 | 聊天记录按证据节点筛选 | 1 天 | 需关联图谱节点 ID 与聊天消息 |

---

## 八、验证命令

```bash
# 语法检查
node --check apps/web/app.js

# JS 单元测试（15 个）
for f in scripts/*_test.js; do node "$f"; done

# Python 烟测
python scripts/smoke_test.py

# Git 检查
git diff --check
```

---

## 九、结论

OfferAgent 在本轮评估中完成了 **P4 模块化的全面落地**（10/10）和 **P0 测试覆盖从零到十五**的突破性进展。app.js 从 8151 行单文件瘦身到 1893 行 + 18 个模块的现代化结构，所有测试通过。

当前完成度 **19/27（70%）**，相比上次评估（18/30 = 60%）提升 10 个百分点。

三个最大短板明确且可操作：
1. **P0 浏览器级回归** — 单元测试有了，差 E2E
2. **P2 图谱决策** — 完成度最低（25%），搜索和过滤是最高 ROI 的改进
3. **P3 反馈持久化** — 能算不能存，加 localStorage 即可闭环

建议按"图谱搜索 → 角色筛选 → challenge 优先级 → 反馈持久化"的顺序推进，每个任务半天到一天，累计一周可将完成度推到 80%+。
