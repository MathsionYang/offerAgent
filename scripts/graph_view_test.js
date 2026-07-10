const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/graph-view.js");
assert.ok(fs.existsSync(modulePath), "graph-view.js should exist");

require(modulePath);

const {
  createGraphView,
} = globalThis.OfferAgentGraphView || {};

assert.equal(typeof createGraphView, "function");

let language = "en";
const graphView = createGraphView({
  getCurrentRun: () => null,
  getLanguage: () => language,
  detectEvidenceGraphGaps: () => [],
  reportAnchorForNodeType: (type) => ({
    risk: "Risks and Validation Needed",
    resume_evidence: "Evidence Chain",
  })[type] || "",
  escapeHtml: (value) => String(value ?? ""),
  clip: (value) => String(value ?? ""),
  riskToneClass: () => "",
  offerScenarioToneClass: () => "",
  localizeOfferScenarioName: (value) => value,
  localizeFeedbackActionType: (value) => value,
  localizeFeedbackTarget: (value) => value,
  localizeSkillId: (value) => value,
  localizeFeedbackStatus: (value) => value,
  localizePanelStance: (value) => value,
});

assert.equal(typeof graphView.matchesEvidenceGraphNode, "function");

const searchableRisk = {
  id: "risk_1",
  type: "risk",
  label: "Metrics ownership is unclear",
  summary: "Validate denominator and personal contribution",
  metadata: {
    severity: "high",
    source: "evidence_gap_detection",
  },
};

assert.equal(
  graphView.matchesEvidenceGraphNode(searchableRisk, { type: "all", query: "ownership" }),
  true,
);
assert.equal(
  graphView.matchesEvidenceGraphNode(searchableRisk, { type: "risk", query: "" }),
  true,
);
assert.equal(
  graphView.matchesEvidenceGraphNode(searchableRisk, { type: "resume_evidence", query: "ownership" }),
  false,
);
assert.equal(
  graphView.matchesEvidenceGraphNode(searchableRisk, { type: "risk", query: "denominator" }),
  true,
);
assert.equal(
  graphView.matchesEvidenceGraphNode(searchableRisk, { type: "risk", query: "salary" }),
  false,
);
assert.equal(
  graphView.matchesEvidenceGraphNode(searchableRisk, { type: "risk", riskSeverity: "high" }),
  true,
);
assert.equal(
  graphView.matchesEvidenceGraphNode(searchableRisk, { type: "risk", riskSeverity: "medium" }),
  false,
);
assert.equal(
  graphView.matchesEvidenceGraphNode(searchableRisk, { type: "risk", source: "generated" }),
  true,
);

const weakEvidence = {
  id: "ev_req_1",
  type: "resume_evidence",
  label: "Ownership evidence is missing",
  summary: "No explicit resume evidence",
  metadata: {
    evidence_level: 3,
    evidence_level_label: "Level 3 / missing",
    source: "missing_resume_evidence",
  },
};
assert.equal(
  graphView.matchesEvidenceGraphNode(weakEvidence, { type: "resume_evidence", evidenceLevel: "3" }),
  true,
);
assert.equal(
  graphView.matchesEvidenceGraphNode(weakEvidence, { type: "resume_evidence", evidenceLevel: "1" }),
  false,
);

const skillQuestion = {
  id: "q_1",
  type: "interview_question",
  label: "Metric question",
  summary: "Ask for denominator",
  metadata: { source: "generated_question_bank" },
};
assert.equal(
  graphView.matchesSourceFilter(skillQuestion, "skill_registry", [
    { from: "skill_business", to: "q_1", source: "skill_registry" },
  ]),
  true,
);

const highRiskIds = graphView.buildHighRiskDecisionNodeIds({
  nodes: [
    weakEvidence,
    searchableRisk,
    skillQuestion,
    { id: "offer_signal_1", type: "offer_signal", label: "Offer", summary: "" },
    { id: "agent_business", type: "agent_persona", label: "Business agent", summary: "" },
  ],
  edges: [
    { from: "q_1", to: "ev_req_1", type: "questions" },
    { from: "ev_req_1", to: "risk_1", type: "supports" },
    { from: "risk_1", to: "offer_signal_1", type: "impacts_offer" },
    { from: "agent_business", to: "ev_req_1", type: "challenges" },
  ],
});
assert.equal(highRiskIds.has("ev_req_1"), true);
assert.equal(highRiskIds.has("risk_1"), true);
assert.equal(highRiskIds.has("q_1"), true);
assert.equal(highRiskIds.has("offer_signal_1"), true);
assert.equal(highRiskIds.has("agent_business"), true);
assert.equal(
  graphView.matchesEvidenceGraphNode(skillQuestion, {
    type: "all",
    decisionView: "high_risk",
    highRiskNodeIds: highRiskIds,
  }),
  true,
);

assert.deepEqual(
  graphView.groupEvidenceGraphNodes([
    { id: "req_1", type: "job_requirement" },
    { id: "ev_1", type: "resume_evidence" },
    { id: "risk_1", type: "risk" },
    { id: "q_1", type: "interview_question" },
  ]),
  {
    requirements: [{ id: "req_1", type: "job_requirement" }],
    evidence: [{ id: "ev_1", type: "resume_evidence" }],
    validation: [
      { id: "risk_1", type: "risk" },
      { id: "q_1", type: "interview_question" },
    ],
  },
);

assert.equal(graphView.getEvidenceGraphLabels().title, "Evidence Graph");
assert.equal(graphView.typeLabel("interview_question"), "Question");
assert.equal(graphView.normalizeSearchText(" Risks & Validation - Needed "), "risks&validationneeded");
assert.ok(
  graphView.resolveReportAnchorAliases("Risks and Validation Needed").includes("Risk"),
);

language = "zh";
assert.equal(graphView.getEvidenceGraphLabels().title, "证据关系图谱");
assert.equal(graphView.typeLabel("resume_evidence"), "证据");
assert.ok(
  graphView.resolveReportAnchorAliases("证据链").includes("证据"),
);

console.log("graph-view tests passed");
