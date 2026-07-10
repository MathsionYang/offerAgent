const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/virtual-panel.js");
assert.ok(fs.existsSync(modulePath), "virtual-panel.js should exist");

require(modulePath);

const {
  createVirtualPanelModel,
} = globalThis.OfferAgentVirtualPanel || {};

assert.equal(typeof createVirtualPanelModel, "function");

const model = createVirtualPanelModel({
  defaultRoleId: "product_manager",
  workflowMapping: ["seed_extraction", "panel_simulation", "moderator_report"],
  getRoleLabel: (roleId) => (roleId === "developer" ? "开发人员" : "产品经理"),
  skillLibrary: {
    hr: { name: "虚拟 HR 面试官", focus: "动机与稳定性" },
    business: { name: "虚拟业务负责人", focus: "业务判断" },
    project: { name: "虚拟项目推进面试官", focus: "项目推进" },
    negotiation: { name: "虚拟谈薪顾问", focus: "谈薪策略" },
    decision: { name: "决策层压力官", focus: "压力决策" },
  },
});

const rows = [
  { capability: "系统设计", isMissing: false, evidenceLevel: 1 },
  { capability: "线上故障处理", isMissing: true, evidenceLevel: 3 },
  { capability: "跨团队协作", isMissing: false, evidenceLevel: 2 },
];
const gate = { enterSandbox: true, result: "部分匹配" };
const offerLeverage = { rating: "中等" };
const feedback = { agreement: "部分同意" };

const panel = model.buildVirtualInterviewPanel(
  {
    target_role: "developer",
    selected_skills: ["business", "decision"],
  },
  rows,
  gate,
);

assert.deepEqual(panel.map((agent) => agent.id), ["agent_business", "agent_decision"]);
assert.equal(panel[0].role_label, "开发人员");
assert.equal(panel[0].stance, "opposing");
assert.equal(panel[1].influence_weight, 3);
assert.deepEqual(panel[0].memory_scope.graph_memory_nodes, ["req_2", "ev_req_2"]);

const rounds = model.buildPanelDiscussionRounds(panel, rows, gate, offerLeverage, feedback);
assert.equal(rounds.length, 3);
assert.deepEqual(rounds.map((round) => round.id), [
  "round_seed_reading",
  "round_risk_challenge",
  "round_offer_alignment",
]);
assert.equal(rounds[0].turns[0].impact, "raise_follow_up_priority");
assert.deepEqual(rounds[0].turns[0].evidence_ids, ["ev_req_2"]);
assert.deepEqual(rounds[0].turns[0].question_ids, ["q_2"]);
assert.equal(rounds[2].turns[0].impact, "recalibrate_with_human_feedback");
const challengePriority = model.buildChallengeQuestionPriority(rounds);
const supportOnlyPriority = model.buildChallengeQuestionPriority([
  { turns: [{ question_ids: ["q_1"], impact: "keep_as_supporting_evidence" }] },
]);
assert.ok(challengePriority.q_2 > supportOnlyPriority.q_1);
assert.ok(challengePriority.q_3 > 0);

const summary = model.buildModeratorSummary(panel, rounds, gate, offerLeverage, feedback);
assert.equal(summary.lead_agent_id, "agent_decision");
assert.equal(summary.consensus, "conditional_progress");
assert.equal(summary.offer_impact, "中等");
assert.equal(summary.feedback_impact, "human_feedback_applied_to_panel_summary");
assert.ok(summary.disagreement_count >= 1);

const directTurn = model.buildPanelTurn(panel[0], rows[0], rows, "seed_reading");
assert.equal(directTurn.impact, "keep_as_supporting_evidence");
assert.deepEqual(directTurn.evidence_ids, ["ev_req_1"]);

const defaultPanel = model.buildVirtualInterviewPanel(
  { target_role: "product_manager" },
  rows,
  { enterSandbox: false, result: "待验证" },
);
assert.deepEqual(defaultPanel.map((agent) => agent.skill_id), [
  "hr",
  "business",
  "project",
  "decision",
]);

const roundsWithoutFeedback = model.buildPanelDiscussionRounds(
  defaultPanel,
  rows,
  { enterSandbox: false, result: "待验证" },
  offerLeverage,
  null,
);
assert.equal(roundsWithoutFeedback[2].turns[0].impact, "feed_offer_simulation");

const summaryWithoutFeedback = model.buildModeratorSummary(
  defaultPanel,
  roundsWithoutFeedback,
  { enterSandbox: false, result: "待验证" },
  offerLeverage,
  null,
);
assert.equal(summaryWithoutFeedback.consensus, "evidence_first");
assert.equal(summaryWithoutFeedback.feedback_impact, "waiting_for_human_feedback");

console.log("virtual-panel model tests passed");
