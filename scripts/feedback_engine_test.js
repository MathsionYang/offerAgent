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
assert.equal(typeof engine.persistFeedbackHistory, "function");
assert.equal(typeof engine.attachFeedbackHistory, "function");

const storageState = new Map();
const historyEngine = createFeedbackEngine({
  now: () => "2026-07-10T12:00:00.000Z",
  storage: {
    getItem: (key) => storageState.get(key) || null,
    setItem: (key, value) => storageState.set(key, value),
  },
});
const run = {
  id: "run_feedback",
  input_fingerprint: "fingerprint_feedback",
};
const firstHistory = historyEngine.persistFeedbackHistory(run, {
  agreement: "同意",
  question_use: "采用",
  disagreement_reason: "未反馈",
  evidence_sufficiency: "充分",
  risk_validation: "仍待验证",
  notes: "first note",
});
assert.equal(firstHistory.length, 1);
assert.equal(firstHistory[0].evaluation_run_id, "run_feedback");
assert.equal(firstHistory[0].input_fingerprint, "fingerprint_feedback");
assert.equal(firstHistory[0].updated_at, "2026-07-10T12:00:00.000Z");

const secondHistory = historyEngine.persistFeedbackHistory(run, {
  agreement: "部分同意",
  question_use: "改写采用",
  disagreement_reason: "证据不足",
  evidence_sufficiency: "部分充分",
  risk_validation: "已证实",
  notes: "second note",
  updated_at: "2026-07-10T12:05:00.000Z",
});
assert.equal(secondHistory.length, 2);
assert.equal(historyEngine.loadFeedbackHistory("fingerprint_feedback")[0].notes, "second note");
const attachedRun = historyEngine.attachFeedbackHistory(run);
assert.equal(attachedRun.human_feedback.notes, "second note");
assert.equal(attachedRun.feedback_session_history.length, 2);

for (let index = 0; index < 15; index += 1) {
  historyEngine.persistFeedbackHistory(run, {
    updated_at: `2026-07-10T12:${String(10 + index).padStart(2, "0")}:00.000Z`,
  });
}
assert.equal(historyEngine.loadFeedbackHistory("fingerprint_feedback").length, 12);

console.log("feedback-engine tests passed");
