const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/feedback-engine.js");
assert.ok(fs.existsSync(modulePath), "feedback-engine.js should exist");

require(modulePath);

const {
  createFeedbackEngine,
} = globalThis.OfferAgentFeedbackEngine || {};

assert.equal(typeof createFeedbackEngine, "function");

const engine = createFeedbackEngine();
const rows = [
  {
    capability: "System design",
    isMissing: true,
    evidenceLevel: 3,
    evidenceReason: "No resume evidence",
  },
  {
    capability: "Incident response",
    isMissing: false,
    evidenceLevel: 2,
    evidenceReason: "Needs role verification",
  },
  {
    capability: "Delivery ownership",
    isMissing: false,
    evidenceLevel: 1,
    evidenceReason: "Quantified owner evidence",
  },
];
const snapshot = {
  selected_skills: ["hr", "decision"],
};

const waiting = engine.buildFeedbackDistillation(null, rows, snapshot);
assert.equal(waiting.rules.length, 5);
assert.deepEqual(waiting.actions, []);
assert.deepEqual(
  waiting.skill_update_suggestions.map((item) => item.skill_id),
  ["hr", "decision"],
);
assert.ok(waiting.skill_update_suggestions.every((item) => item.status === "waiting_feedback"));

const confirmed = engine.buildFeedbackDistillation(
  {
    agreement: "部分同意",
    question_use: "采用",
    disagreement_reason: "证据不足",
    evidence_sufficiency: "不充分",
    risk_validation: "已证实",
  },
  rows,
  snapshot,
);

const confirmedTypes = confirmed.actions.map((item) => item.type);
assert.ok(confirmedTypes.includes("promote_question"));
assert.ok(confirmedTypes.includes("raise_risk_weight"));
assert.equal(confirmedTypes.filter((type) => type === "downgrade_claim").length, 2);
assert.ok(confirmedTypes.includes("add_regression_case"));
assert.deepEqual(confirmed.impact_diff[0].affected_ids, ["q_1", "q_2"]);
assert.deepEqual(confirmed.impact_diff[1].affected_ids, ["offer_risk_1", "offer_risk_2"]);
assert.deepEqual(confirmed.impact_diff[2].affected_ids, ["ev_req_1", "ev_req_2"]);
assert.ok(confirmed.skill_update_suggestions.every((item) => item.status === "pending_review"));

const rejected = engine.buildFeedbackDistillation(
  {
    question_use: "未采用",
    disagreement_reason: "系统误判",
    evidence_sufficiency: "充分",
    risk_validation: "已推翻",
  },
  rows,
  snapshot,
);
const rejectedTypes = rejected.actions.map((item) => item.type);
assert.ok(rejectedTypes.includes("demote_question"));
assert.ok(rejectedTypes.includes("lower_risk_weight"));
assert.ok(rejectedTypes.includes("add_regression_case"));
assert.ok(rejected.skill_update_suggestions.every((item) => item.suggestion === "重写该视角的问题模板"));

assert.equal(typeof engine.buildFeedbackImpactDiff, "function");
assert.equal(typeof engine.buildSkillUpdateSuggestions, "function");

console.log("feedback-engine tests passed");
