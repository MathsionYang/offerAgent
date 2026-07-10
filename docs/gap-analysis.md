# OfferAgent 功能差距评估报告

更新时间：2026-07-11

## 一、评估方法

本报告对照 `开发路线.md` 中的 P0-P5 清单，并以当前源码和测试结果为准重新评估。重点核对：

- `apps/web/app.js`：主入口、状态流转、提示词、Mock 编排和页面协调。
- `apps/web/src/`：21 个前端模块。
- `scripts/`：19 个 JS 测试脚本（包含浏览器 E2E）和 `smoke_test.py`。
- `README.md`、`部署说明.md`、`开发路线.md`：对外说明是否和实现一致。

验证手段：源码 grep、模块测试、浏览器 E2E、smoke test、语法检查和 `git diff --check`。

---

## 二、当前验证状态

本地已通过：

- `node --check apps/web/src/*.js`
- `node --check apps/web/app.js`
- `node scripts/*_test.js`
- `node scripts/visual_regression_test.js`
- `python scripts/smoke_test.py`
- `git diff --check`

当前测试覆盖已经包含：

- 逻辑层：assessment、evaluation、evidence graph、feedback、i18n、localization、model client、panel、PDF、report、skill registry、virtual panel。
- 浏览器层：身份选择、Mock 生成、图谱搜索、高级过滤、虚拟委员会筛选、候选人/面试官模式、反馈历史写入、截图非空。
- 视觉层：onboarding、候选人工作台、图谱、虚拟委员会、结果摘要和移动端图谱截图；存在 baseline 时进行哈希比较。
- 静态门禁：DOM 引用、模块加载、schema、缓存隐私、语言投影、提示词约束和文档功能同步检查。

---

## 三、逐项评估

### P0：稳定当前产品体验（3.5/4）

| # | 路线要求 | 状态 | 当前证据 |
|---|---|---|---|
| 1 | 清理剩余历史文案和编码问题 | ✅ | README、部署说明和核心源码均可按 UTF-8 正常读取 |
| 2 | 做浏览器级截图/视觉回归 | ✅ | `visual_regression_test.js` 已捕获 6 个关键场景，并在存在 baseline 时比较哈希 |
| 3 | 把 smoke test 拆成 UI/schema/report/cache 四类 | ⚠️ | 仍是单文件 smoke，但已补 19 个 JS 测试脚本分担模块覆盖 |
| 4 | 增加缓存命中/未命中浏览器级回归测试 | ✅ | browser E2E 已覆盖本机缓存状态、反馈历史、缓存清理；smoke 覆盖缓存隐私和 schema 门禁 |

**仍需加强**：视觉回归脚本已经可比较 baseline，后续需要建立 baseline 更新流程和截图评审习惯；smoke test 仍可继续拆分。

### P1：让虚拟面试委员会更可审计（4/4）

| # | 路线要求 | 状态 | 当前证据 |
|---|---|---|---|
| 1 | 展示 stance、influence_weight、focus | ✅ | `virtual-panel.js` 和图谱节点详情均保留这些字段 |
| 2 | 展示每轮讨论的证据、质疑和建议 | ✅ | panel turn 含 evidence_ids、question_ids、impact |
| 3 | 主持人总结可追溯到委员发言、证据节点和追问问题 | ✅ | `buildModeratorBasisTrace()`、trace chips 和详情抽屉已实现 |
| 4 | 支持按虚拟角色、讨论轮次、证据节点筛选聊天记录 | ✅ | `panel-view.js` 支持轮次、`data-panel-filter="agent"` 和 `data-panel-filter="evidence"` |

**仍需加强**：筛选能力已经具备，后续重点应转向视觉可读性和信息密度，而不是再补基础功能。

### P2：让图谱成为决策工具（4/4）

| # | 路线要求 | 状态 | 当前证据 |
|---|---|---|---|
| 1 | 增加图谱节点搜索 | ✅ | `graph-view.js` 提供 `.graph-search-input` 和组合过滤 |
| 2 | 增加按风险等级、证据等级、Skill 来源、虚拟角色来源过滤 | ✅ | `data-graph-advanced-filter` 覆盖 riskSeverity、evidenceLevel、source |
| 3 | 展示反馈对节点和边的影响 diff | ✅ | `buildFeedbackImpactDiff()` 和 reports-view 渲染已实现 |
| 4 | 让虚拟角色的 challenges 直接提升问题优先级 | ✅ | `buildChallengeQuestionPriority()` 与 `raise_follow_up_priority` 已进入排序权重 |

**仍需加强**：高风险视图解释已补齐，下一步可增强为逐节点解释，例如显示具体关联了哪些 risk / challenge / evidence gap。

### P3：把反馈闭环做实（4/5）

| # | 路线要求 | 状态 | 当前证据 |
|---|---|---|---|
| 1 | 让人工反馈更结构化 | ✅ | FeedbackDistillation 包含 rules/actions/impact_diff/skill_update_suggestions |
| 2 | 保存反馈历史 | ✅ | `persistFeedbackHistory()` / `attachFeedbackHistory()` 使用本机 localStorage，单指纹最多 12 条 |
| 3 | 将反馈变成 SkillDefinition 更新候选建议 | ✅ | `buildSkillUpdateSuggestions()` 已实现 |
| 4 | 支持规则冲突裁决 | ✅ | 规则含 conflict_policy |
| 5 | 让反馈影响虚拟角色权重 | ✅ | `buildFeedbackInfluenceAdjustment()` 已根据已证实风险、证据不充分、追问采用 / 未采用调整 `influence_weight`、stance 和 `feedback_influence` 审计字段 |

**仍需加强**：反馈已经“能算、能存、能恢复、能影响虚拟角色权重”，下一步是进一步影响问题生成策略和风险权重。

### P4：模块化工程结构（10/10）

模块化已经完成，并且比原路线更细：

- `domain-data.js`
- `skill-registry.js`
- `run-cache.js`
- `input-readiness.js`
- `persona-illustrations.js`
- `i18n.js`
- `localization-mappers.js`
- `virtual-panel.js`
- `evidence-graph.js`
- `localized-run-view.js`
- `graph-view.js`
- `panel-view.js`
- `report-builders.js`
- `reports-view.js`
- `model-client.js`
- `report-export-template.js`
- `pdf-export.js`
- `feedback-engine.js`
- `assessment-rules.js`
- `report-content-helpers.js`
- `evaluation-engine.js`

**仍需加强**：`app.js` 仍承担提示词、Mock 报告编排和页面状态机，后续可以继续拆出 `prompt-builder.js`、`mock-runner.js`、`app-state.js`。

### P5：真实验证（暂缓）

路线文档仍标注“当前暂不做真实样本评测”。若恢复，优先验证：

- 面试官是否采纳问题。
- 报告是否减少准备时间。
- 图谱是否帮助定位风险。
- 反馈历史是否能沉淀为复用规则。
- 真实模型输出是否稳定遵守结构化运行契约。

---

## 四、完成度总览

| 优先级 | 完成/总数 | 百分比 | 说明 |
|---|---:|---:|---|
| P0 稳定性 | 3.5/4 | 88% | 已有视觉回归脚本，缺 baseline 更新流程；smoke 仍待拆分 |
| P1 可审计 | 4/4 | 100% | 轮次、角色、证据筛选均已落地 |
| P2 图谱决策 | 4/4 | 100% | 搜索、高级过滤、diff、challenge priority 均已落地 |
| P3 反馈闭环 | 5/5 | 100% | 反馈结构化、历史保存、Skill 建议、冲突裁决和角色权重影响均已落地 |
| P4 模块化 | 10/10 | 100% | 已拆成 21 个模块 |
| P5 真实验证 | 暂缓 | - | 仍按路线暂缓 |

---

## 五、当前最该加强的地方

### 1. 文档与隐私说明统一

`README.md` 已说明基础报告缓存和反馈历史会保存在本机 localStorage；`部署说明.md` 仍有“页面不保存简历、JD 或报告”的旧表述。应统一为：

- 不创建账号。
- 不上传到项目自有云端。
- 不保存 API Key。
- 会在本机浏览器 localStorage 中缓存基础报告 artifact 和反馈历史。
- 公共设备使用后应清空浏览器站点数据。

### 2. CI 门禁

Pages workflow 已新增部署前测试门禁：

- JS 语法检查。
- 所有 JS 测试。
- Python smoke test。
- 视觉回归脚本。
- `git diff --check`。
- 上传 `artifacts/visual-regression/current` 作为 workflow artifact。

### 3. 独立视觉回归

`browser_e2e_test.js` 做流程断言和截图非空；`visual_regression_test.js` 已补关键页面截图：

- 捕获 onboarding、workbench、graph、panel、summary、mobile graph。
- 输出当前截图到 `artifacts/visual-regression/current`。
- 如果存在 baseline，则比较截图哈希，发现差异即失败。
- CI 上传 current 截图，方便人工确认并更新 baseline。

### 4. 反馈影响虚拟角色权重

已完成。`risk_validation = 已证实`、`evidence_sufficiency = 不充分`、`question_use = 采用 / 改写采用 / 未采用` 会影响虚拟面试官 `influence_weight`、stance 和审计字段。下一步可继续让这些反馈影响问题生成策略和风险权重。

### 5. app.js 继续瘦身

下一步建议优先拆：

- `prompt-builder.js`
- `mock-report-runner.js`
- `app-state.js`
- `ui-bindings.js`

---

## 六、建议推进顺序

1. 建立视觉 baseline 更新流程。
2. 让反馈历史影响虚拟角色权重。
3. 继续拆分 `app.js`。
4. 将 smoke test 机械拆分为 UI/schema/report/cache 四类。
5. 恢复小批脱敏真实样本评测。

---

## 七、验证命令

```bash
node --check apps/web/app.js
for f in apps/web/src/*.js; do node --check "$f"; done
for f in scripts/*_test.js; do
  if [ "$(basename "$f")" != "visual_regression_test.js" ]; then
    node "$f"
  fi
done
node scripts/visual_regression_test.js
python scripts/smoke_test.py
git diff --check
```
