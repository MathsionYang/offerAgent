const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/evaluation-engine.js");
assert.ok(fs.existsSync(modulePath), "evaluation-engine.js should exist");

require(modulePath);

const {
  createEvaluationEngine,
} = globalThis.OfferAgentEvaluationEngine || {};

assert.equal(typeof createEvaluationEngine, "function");

let language = "zh";
const engine = createEvaluationEngine({
  schemaVersion: "evaluation_run.v1",
  defaultRoleId: "developer",
  getLanguage: () => language,
  clip: (value, length = 80) => String(value ?? "").slice(0, length),
  interviewerLens: (index) => `lens_${index}`,
  buildEvidenceSummary: (rows) => `summary:${rows.length}`,
});

const rows = [
  {
    capability: "Architecture",
    jdEvidence: "Build scalable systems",
    resumeEvidence: "主导上线支付系统，GMV 提升 25%",
    evidenceLevel: 1,
    evidenceLevelLabel: "一级证据（高可信）",
    evidenceReason: "包含量化结果",
    matchStatus: "匹配但仍需复核口径",
    isMissing: false,
    verificationQuestion: "请说明指标口径",
  },
  {
    capability: "Incident response",
    jdEvidence: "Own incidents",
    resumeEvidence: "参与线上问题处理",
    evidenceLevel: 3,
    evidenceLevelLabel: "三级证据（低可信 / 待验证）",
    evidenceReason: "个人贡献边界不清",
    matchStatus: "部分匹配 / 需追问验证",
    isMissing: false,
    verificationQuestion: "请说明个人动作",
  },
  {
    capability: "Customer support",
    jdEvidence: "Support enterprise customers",
    resumeEvidence: "简历未体现明确证据",
    evidenceLevel: 3,
    evidenceLevelLabel: "三级证据（低可信 / 待验证）",
    evidenceReason: "没有可引用的简历证据",
    matchStatus: "不匹配 / 待补证",
    isMissing: true,
    verificationQuestion: "请补充客户支持项目",
  },
];

const snapshot = {
  target_role: "developer",
  resume: "候选人主导上线支付系统，GMV 提升 25%",
  job_description: "Build scalable systems and own incidents",
  candidate_stage: "技术一面",
  target_level: "P6",
  offer_constraints: "有其他 offer",
  language: "zh",
};
const gate = {
  result: "条件性进入（转岗适配）",
  enterSandbox: true,
  matchedCount: 2,
  summary: "可进入条件性沙盘验证",
  nextStep: "进入下一轮验证",
};
const offerLeverage = {
  rating: "中杠杆",
  summary: "存在竞争机会 / Offer 线索",
  detail: "谈判时应转化为到岗确定性",
};
const feedback = {
  agreement: "部分同意",
  question_use: "采用",
  disagreement_reason: "证据不足",
  evidence_sufficiency: "不充分",
  risk_validation: "已证实",
  updated_at: "2026-07-10T10:00:00.000Z",
};
const run = {
  id: "run_1",
  created_at: "2026-07-10T09:00:00.000Z",
};

const summary = engine.buildEvaluationSummary(gate, rows, offerLeverage, feedback);
assert.equal(summary.strong_evidence_count, 1);
assert.equal(summary.weak_or_missing_evidence_count, 2);
assert.deepEqual(summary.next_validation_focus, ["Incident response", "Customer support"]);
assert.equal(summary.feedback_status.risk_validation, "已证实");

const matches = engine.buildRequirementMatches(rows);
assert.deepEqual(matches.map((item) => item.id), ["req_1", "req_2", "req_3"]);
assert.equal(matches[0].evidence_level_label, "一级证据（高可信）");

const questions = engine.buildStructuredInterviewQuestions(snapshot, rows, feedback);
assert.deepEqual(questions.map((item) => item.id), ["q_1", "q_2", "q_3"]);
assert.equal(questions[0].lens, "lens_0");
assert.equal(questions[0].evaluation_goal, "复核指标口径、周期和个人贡献");
assert.equal(questions[2].evaluation_goal, "补齐岗位核心能力项目证据");
assert.equal(questions[0].asked_status, "reviewed");

const evidence = engine.buildStructuredEvidence(snapshot, rows);
assert.equal(evidence.length, 6);
assert.equal(evidence[0].id, "ev_resume_snapshot");
assert.equal(evidence[3].id, "ev_req_1");
assert.equal(evidence[3].confidence, 0.85);
assert.equal(evidence[5].source_type, "missing_resume_evidence");

const structured = engine.buildStructuredEvaluation(snapshot, rows, gate, offerLeverage, feedback);
assert.equal(structured.schema_version, "evaluation_run.v1");
assert.equal(structured.target_role, "developer");
assert.equal(structured.language, "zh");
assert.equal(structured.offer_sandbox.enter_sandbox, true);
assert.equal(structured.decision_basis.offer_leverage_rating, "中杠杆");

const offerRun = engine.buildOfferSimulationRun(run, snapshot, gate, offerLeverage, rows, feedback);
assert.equal(offerRun.id, "offer_run_1");
assert.equal(offerRun.lifecycle_state, "feedback_distilled");
assert.deepEqual(
  offerRun.lifecycle_steps.map((step) => step.status),
  ["done", "done", "done", "active", "active"],
);
assert.equal(offerRun.risks.length, 2);
assert.equal(offerRun.risks[0].severity, "high");
assert.equal(offerRun.risks[0].status, "已证实");
assert.deepEqual(offerRun.state_backfill.next_question_focus, ["Incident response", "Customer support"]);
assert.equal(offerRun.scenario_comparison.length, 3);
assert.ok(offerRun.scenario_comparison[0].probability >= 5);

const blockedOfferRun = engine.buildOfferSimulationRun(
  run,
  snapshot,
  { ...gate, enterSandbox: false },
  { ...offerLeverage, rating: "暂无明确杠杆" },
  rows,
  null,
);
assert.equal(blockedOfferRun.lifecycle_state, "evidence_validation");
assert.equal(blockedOfferRun.lifecycle_steps[3].status, "blocked");
assert.equal(blockedOfferRun.final_decision_hint.includes("先补项目闭环"), true);

language = "en";
const englishStructured = engine.buildStructuredEvaluation(
  { ...snapshot, language: "" },
  rows,
  gate,
  offerLeverage,
  null,
);
assert.equal(englishStructured.language, "en");

console.log("evaluation-engine tests passed");
