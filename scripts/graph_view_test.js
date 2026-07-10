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
