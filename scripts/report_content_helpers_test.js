const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/report-content-helpers.js");
assert.ok(fs.existsSync(modulePath), "report-content-helpers.js should exist");

require(modulePath);

const {
  createReportContentHelpers,
} = globalThis.OfferAgentReportContentHelpers || {};

assert.equal(typeof createReportContentHelpers, "function");

let language = "zh";
const rows = [
  {
    capability: "技术架构与研发协同",
    jdEvidence: "负责系统设计和研发协同",
    resumeEvidence: "主导平台架构升级",
    evidenceLevel: 1,
    evidenceLevelLabel: "一级证据",
    evidenceReason: "有项目和结果",
    matchStatus: "匹配",
    verificationQuestion: "请解释架构升级中的个人贡献。",
    isMissing: false,
  },
  {
    capability: "成本、进度、质量控制",
    jdEvidence: "负责进度和质量",
    resumeEvidence: "简历未提供明确证据",
    evidenceLevel: 3,
    evidenceLevelLabel: "三级证据",
    evidenceReason: "缺少项目证据",
    matchStatus: "待验证",
    verificationQuestion: "请补充进度和质量控制案例。",
    isMissing: true,
  },
];

const helpers = createReportContentHelpers({
  getLanguage: () => language,
  clip: (value, length = 80) => String(value ?? "").slice(0, length),
  buildRequirementEvidenceRows: () => rows,
  buildGateAssessment: () => ({
    result: "条件性进入",
    summary: "存在可迁移能力，但仍需验证。",
    matchedCount: 1,
    bestEvidence: "平台架构升级",
    enterSandbox: true,
  }),
  buildOfferLeverage: () => ({
    rating: "中",
    summary: "具备部分谈判杠杆",
    detail: "补齐约束后再定价",
  }),
  normalizeSnapshot: (snapshot) => ({
    resume: snapshot.resume || "",
    job_description: snapshot.job_description || "",
    company_context: snapshot.company_context || "",
    candidate_stage: snapshot.candidate_stage || "",
    target_level: snapshot.target_level || "",
    offer_constraints: snapshot.offer_constraints || "",
  }),
  findEvidence: () => "主导平台架构升级",
  translateCapability: (value) => `EN:${value}`,
  translateOfferRating: (value) => `EN:${value}`,
  translateInterviewerRecommendation: (value) => `EN:${value}`,
  translateInterviewerAction: (value) => `EN:${value}`,
  translateDirectConclusionPoints: (value) => `EN:${value}`,
  translateVerificationQuestionText: (value) => `EN:${value}`,
});

const snapshot = {
  resume: "主导平台架构升级并推动上线。",
  job_description: "需要技术架构、研发协同、成本、进度和质量控制。",
  company_context: "跨团队高节奏交付。",
  candidate_stage: "业务一面",
  target_level: "高级工程师",
  offer_constraints: "两周到岗。",
};

assert.equal(helpers.interviewerLens(0), "业务负责人");
assert.equal(helpers.buildInterviewerRecommendation({ result: "条件性进入" }).level, "有条件推荐");
assert.ok(helpers.buildConcreteCandidateQuestions(snapshot).includes("回答路线图"));
assert.ok(helpers.buildInterviewerScorecard(snapshot).includes("评分维度"));
assert.ok(helpers.buildJdHiddenPainRows(snapshot).some((row) => row.phrase === "成本、进度和质量控制"));

language = "en";
assert.ok(helpers.buildInterviewerThreeSecondSummary(snapshot).includes("Recommendation"));
const candidateSummary = helpers.buildCandidateThreeSecondSummary(snapshot);
assert.ok(candidateSummary.includes("| Review item | Conclusion | Candidate action |"));
assert.ok(candidateSummary.includes("Core fit"));
assert.ok(candidateSummary.includes("Differentiated advantage"));
assert.ok(candidateSummary.includes("主导平台架构升级"));
assert.equal(candidateSummary.includes("核心匹配度"), false);
assert.equal(candidateSummary.includes("今晚优先动作"), false);

const candidateAdvantages = helpers.buildCandidateAdvantageCards(snapshot);
assert.ok(candidateAdvantages.includes("| Advantage | Evidence | How to guide the interview | Risk reminder |"));
assert.ok(candidateAdvantages.includes("EN:技术架构与研发协同"));
assert.ok(candidateAdvantages.includes("主导平台架构升级"));
assert.equal(candidateAdvantages.includes("优势项"), false);

console.log("report-content-helpers tests passed");
