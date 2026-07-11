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
assert.ok(helpers.buildCandidateMatchSnapshot(snapshot).includes("表面匹配度"));
assert.ok(helpers.buildCandidateMatchSnapshot(snapshot).includes("修改顺序"));
assert.ok(helpers.buildCandidateResumeRevisionWorkbench(snapshot).includes("没写清楚的地方"));
assert.ok(helpers.buildCandidateResumeRevisionWorkbench(snapshot).includes("建议改成"));
assert.ok(helpers.buildCandidateFinalResumeChecklist(snapshot).includes("是否可以直接投递"));
assert.ok(helpers.buildCandidateJdGapActionTable(snapshot).includes("具体差距"));
assert.ok(helpers.buildCandidateJdGapActionTable(snapshot).includes("事实状态"));
assert.ok(helpers.buildCandidateTruthfulnessGate(snapshot).includes("能否进入可投递简历"));
assert.ok(helpers.buildCandidateScorecard(snapshot).includes("JD 匹配度"));
assert.ok(helpers.buildCandidateScorecard(snapshot).includes("可信度"));
assert.ok(helpers.buildCandidateMaterialQuestions(snapshot).includes("真实项目"));
assert.ok(helpers.buildCandidateContributionVerbAudit(snapshot).includes("建议动词"));
assert.ok(helpers.buildCandidateOptimizedResumeDraft(snapshot).includes("工作 / 项目经历"));
assert.ok(helpers.buildCandidateOptimizedResumeDraft(snapshot).includes("个人摘要"));
assert.ok(helpers.buildCandidateAtsPlainTextResume(snapshot).includes("ATS 投递版"));
assert.ok(helpers.buildCandidateHrPitch(snapshot).includes("Boss 直聘开场白"));
assert.ok(helpers.buildCandidateMetricPromptTable(snapshot).includes("推荐追问指标"));
const candidateRewriteTable = helpers.buildCandidateResumeRewriteTable(snapshot);
assert.ok(candidateRewriteTable.includes("推荐改法模板"));
assert.ok(candidateRewriteTable.includes("技术风险"));
assert.ok(candidateRewriteTable.includes("里程碑"));
const rewrittenResumeReference = helpers.buildCandidateRewrittenResumeReference(snapshot);
assert.ok(rewrittenResumeReference.includes("改写后长什么样"));
assert.ok(rewrittenResumeReference.includes("个人摘要参考"));
assert.ok(rewrittenResumeReference.includes("项目经历参考写法"));
assert.ok(rewrittenResumeReference.includes("可直接使用的原句"));
assert.ok(rewrittenResumeReference.includes("需确认后才能使用的原句"));
const candidatePatchCards = helpers.buildCandidateEvidencePatchCards(snapshot);
assert.ok(candidatePatchCards.includes("补证 1"));
assert.ok(candidatePatchCards.includes("里程碑") || candidatePatchCards.includes("技术问题背景"));
assert.ok(helpers.buildInterviewerAuthenticityRiskTable(snapshot).includes("可疑点"));
assert.ok(helpers.buildInterviewerMatchSnapshot(snapshot).includes("表面匹配度"));
assert.ok(helpers.buildInterviewerMatchSnapshot(snapshot).includes("最大验真风险"));
assert.ok(helpers.buildInterviewerMandatoryVerificationQuestions(snapshot).includes("为什么必须问"));
assert.ok(helpers.buildInterviewerMandatoryVerificationQuestions(snapshot).includes("绿灯表现说明"));
assert.ok(helpers.buildInterviewerMandatoryVerificationQuestions(snapshot).includes("红灯 / 造假风险信号"));
assert.ok(helpers.buildInterviewerJdDepthProbeTable(snapshot).includes("需要验证的理解深度"));
assert.ok(helpers.buildInterviewerPotentialSignalsTable(snapshot).includes("潜力维度"));
assert.ok(helpers.buildConcreteCandidateQuestions(snapshot).includes("怎么回答"));
assert.ok(helpers.buildConcreteCandidateQuestions(snapshot).includes("为什么会问"));
assert.ok(helpers.buildInterviewerScorecard(snapshot).includes("评分维度"));
assert.ok(helpers.buildJdHiddenPainRows(snapshot).some((row) => row.phrase === "成本、进度和质量控制"));

function createRoleSpecificHelpers(roleRows) {
  return createReportContentHelpers({
    getLanguage: () => "zh",
    clip: (value, length = 80) => String(value ?? "").slice(0, length),
    buildRequirementEvidenceRows: () => roleRows,
    buildGateAssessment: () => ({
      result: "条件性进入",
      summary: "存在可迁移能力，但仍需验证。",
      matchedCount: 1,
      bestEvidence: "项目证据",
      enterSandbox: true,
    }),
    buildOfferLeverage: () => ({
      rating: "中",
      summary: "具备部分谈判杠杆",
      detail: "补齐约束后再定价",
    }),
    normalizeSnapshot: (value) => value || {},
    findEvidence: () => "",
  });
}

const productSpecific = createRoleSpecificHelpers([
  {
    capability: "产品规划与生命周期管理",
    jdEvidence: "负责智慧矿山行业产品生命周期管理和路线图",
    resumeEvidence: "负责产品规划",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
]).buildCandidateResumeRewriteTable({ target_role: "product_manager" });
assert.ok(productSpecific.includes("MVP"));
assert.ok(productSpecific.includes("版本节奏"));
assert.equal(productSpecific.includes("竞品拆解"), false);
const productReference = createRoleSpecificHelpers([
  {
    capability: "客户需求分析与方案设计",
    jdEvidence: "负责客户需求分析、方案设计和研发协同",
    resumeEvidence: "负责客户需求对接",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
]).buildCandidateRewrittenResumeReference({ target_role: "product_manager" });
assert.ok(productReference.includes("客户问题"));
assert.ok(productReference.includes("需求判断"));
assert.equal(productReference.includes("单测"), false);

const productMixedRows = [
  {
    capability: "行业场景理解",
    jdEvidence: "负责智慧矿山行业产品规划，包括行业市场与竞争分析",
    resumeEvidence: "候选人：张三，5 年 B 端 SaaS 产品经验",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
  {
    capability: "客户需求分析与方案设计",
    jdEvidence: "负责智慧矿山业务咨询，包括客户需求分析、技术交流引导和项目方案设计",
    resumeEvidence: "候选人：张三，5 年 B 端 SaaS 产品经验",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
  {
    capability: "技术架构与研发协同",
    jdEvidence: "指导智慧矿山项目技术架构设计与技术风险控制",
    resumeEvidence: "主导过从 0 到 1 的功能规划，推动研发、设计、运营协作",
    evidenceLevel: 1,
    evidenceLevelLabel: "一级证据",
    isMissing: false,
  },
  {
    capability: "成本、进度、质量控制",
    jdEvidence: "负责智慧矿山产品开发成本、进度和质量控制",
    resumeEvidence: "主导过从 0 到 1 的功能规划，推动研发、设计、运营协作",
    evidenceLevel: 1,
    evidenceLevelLabel: "一级证据",
    isMissing: false,
  },
];
const productMixedReport = createRoleSpecificHelpers(productMixedRows)
  .buildCandidateResumeRewriteTable({ target_role: "product_manager" });
assert.ok(productMixedReport.includes("客户原话"));
assert.ok(productMixedReport.includes("技术风险"));
assert.ok(productMixedReport.includes("里程碑"));
assert.ok(productMixedReport.includes("同一段简历证据被复用"));

const developerSpecific = createRoleSpecificHelpers([
  {
    capability: "编程语言与工程实现",
    jdEvidence: "负责核心接口和后端开发",
    resumeEvidence: "熟悉 Java 和 MySQL",
    evidenceLevel: 3,
    evidenceLevelLabel: "三级证据",
    isMissing: false,
  },
]).buildCandidateResumeRewriteTable({ target_role: "developer" });
assert.ok(developerSpecific.includes("接口"));
assert.ok(developerSpecific.includes("单测"));
assert.equal(developerSpecific.includes("客户访谈"), false);
const developerReference = createRoleSpecificHelpers([
  {
    capability: "系统设计与架构理解",
    jdEvidence: "负责接口边界、高并发治理和系统设计",
    resumeEvidence: "负责订单系统开发",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
]).buildCandidateRewrittenResumeReference({ target_role: "developer" });
assert.ok(developerReference.includes("接口 / 数据模型"));
assert.ok(developerReference.includes("P95"));
assert.equal(developerReference.includes("客户原话"), false);
const developerAts = createRoleSpecificHelpers([
  {
    capability: "系统设计与架构理解",
    jdEvidence: "负责接口边界、高并发治理和系统设计",
    resumeEvidence: "负责订单系统开发",
    evidenceLevel: 1,
    evidenceLevelLabel: "一级证据",
    isMissing: false,
  },
]).buildCandidateAtsPlainTextResume({ target_role: "developer" });
assert.ok(developerAts.includes("接口"));
assert.ok(developerAts.includes("P95") || developerAts.includes("工程指标"));

const developerMixed = createRoleSpecificHelpers([
  {
    capability: "系统设计与架构理解",
    jdEvidence: "负责核心交易链路开发、系统设计、接口边界和高并发治理",
    resumeEvidence: "负责订单系统开发",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
  {
    capability: "代码质量与测试习惯",
    jdEvidence: "负责核心交易链路开发、单元测试、Code Review 和持续交付",
    resumeEvidence: "负责订单系统开发",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
  {
    capability: "交付协作与需求理解",
    jdEvidence: "负责核心交易链路开发，并与产品、测试、运维协同复杂项目",
    resumeEvidence: "负责订单系统开发",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
]).buildCandidateResumeRewriteTable({ target_role: "developer" });
assert.ok(developerMixed.includes("架构取舍"));
assert.ok(developerMixed.includes("Code Review"));
assert.ok(developerMixed.includes("需求边界"));
assert.ok(developerMixed.includes("同一段简历证据被复用"));

const supportSpecific = createRoleSpecificHelpers([
  {
    capability: "问题分诊与优先级判断",
    jdEvidence: "负责工单分诊和 P0/P1 优先级判断",
    resumeEvidence: "处理客户问题",
    evidenceLevel: 3,
    evidenceLevelLabel: "三级证据",
    isMissing: false,
  },
]).buildCandidateResumeRewriteTable({ target_role: "technical_support" });
assert.ok(supportSpecific.includes("工单"));
assert.ok(supportSpecific.includes("SLA"));
assert.equal(supportSpecific.includes("路线图"), false);
const supportReference = createRoleSpecificHelpers([
  {
    capability: "技术排查与复现能力",
    jdEvidence: "负责客户问题排查、复现、日志分析和升级协作",
    resumeEvidence: "处理客户问题",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
]).buildCandidateRewrittenResumeReference({ target_role: "technical_support" });
assert.ok(supportReference.includes("复现"));
assert.ok(supportReference.includes("日志"));
assert.ok(supportReference.includes("SLA"));
assert.equal(supportReference.includes("签约额"), false);
const supportMetrics = createRoleSpecificHelpers([
  {
    capability: "问题分诊与优先级判断",
    jdEvidence: "负责工单分诊和 SLA",
    resumeEvidence: "处理客户工单并完成升级",
    evidenceLevel: 1,
    evidenceLevelLabel: "一级证据",
    isMissing: false,
  },
]).buildCandidateMetricPromptTable({ target_role: "technical_support" });
assert.ok(supportMetrics.includes("SLA"));
assert.ok(supportMetrics.includes("响应"));

const supportMixed = createRoleSpecificHelpers([
  {
    capability: "技术排查与复现能力",
    jdEvidence: "负责客户问题排查、复现、日志分析和升级协作",
    resumeEvidence: "处理客户问题",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
  {
    capability: "升级协作与跨团队推进",
    jdEvidence: "负责客户问题排查、复现、日志分析和升级协作",
    resumeEvidence: "处理客户问题",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
  {
    capability: "知识库与流程沉淀",
    jdEvidence: "负责客户问题排查、SOP、FAQ 和流程沉淀",
    resumeEvidence: "处理客户问题",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
]).buildCandidateResumeRewriteTable({ target_role: "technical_support" });
assert.ok(supportMixed.includes("复现步骤"));
assert.ok(supportMixed.includes("升级标准"));
assert.ok(supportMixed.includes("高频问题"));
assert.ok(supportMixed.includes("同一段简历证据被复用"));

const salesSpecific = createRoleSpecificHelpers([
  {
    capability: "线索发现与客户画像",
    jdEvidence: "负责线索发现、ICP 和获客渠道",
    resumeEvidence: "负责客户开发",
    evidenceLevel: 3,
    evidenceLevelLabel: "三级证据",
    isMissing: false,
  },
]).buildCandidateResumeRewriteTable({ target_role: "sales" });
assert.ok(salesSpecific.includes("ICP"));
assert.ok(salesSpecific.includes("线索数"));
assert.ok(salesSpecific.includes("转化率"));
assert.equal(salesSpecific.includes("单测"), false);
const salesReference = createRoleSpecificHelpers([
  {
    capability: "商机推进与方案呈现",
    jdEvidence: "负责客户开发、商机推进、POC、谈判和 CRM 复盘",
    resumeEvidence: "负责大客户拓展",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
]).buildCandidateRewrittenResumeReference({ target_role: "sales" });
assert.ok(salesReference.includes("决策链"));
assert.ok(salesReference.includes("签约额"));
assert.ok(salesReference.includes("Forecast"));
assert.equal(salesReference.includes("测试覆盖率"), false);
const salesPitch = createRoleSpecificHelpers([
  {
    capability: "商机推进与方案呈现",
    jdEvidence: "负责客户开发、商机推进、POC、谈判和 CRM 复盘",
    resumeEvidence: "负责大客户拓展并推进商机",
    evidenceLevel: 1,
    evidenceLevelLabel: "一级证据",
    isMissing: false,
  },
]).buildCandidateHrPitch({ target_role: "sales" });
assert.ok(salesPitch.includes("猎头转发简介"));
assert.ok(salesPitch.includes("销售人员"));

const salesMixed = createRoleSpecificHelpers([
  {
    capability: "客户开发与需求挖掘",
    jdEvidence: "负责客户开发、商机推进、决策链、POC、谈判和 CRM 复盘",
    resumeEvidence: "负责大客户拓展",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
  {
    capability: "商机推进与方案呈现",
    jdEvidence: "负责客户开发、商机推进、决策链、POC、谈判和 CRM 复盘",
    resumeEvidence: "负责大客户拓展",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
  {
    capability: "CRM 管理与销售纪律",
    jdEvidence: "负责客户开发、商机推进、决策链、POC、谈判和 CRM 复盘",
    resumeEvidence: "负责大客户拓展",
    evidenceLevel: 2,
    evidenceLevelLabel: "二级证据",
    isMissing: false,
  },
]).buildCandidateResumeRewriteTable({ target_role: "sales" });
assert.ok(salesMixed.includes("决策链"));
assert.ok(salesMixed.includes("预算"));
assert.ok(salesMixed.includes("商机阶段"));
assert.ok(salesMixed.includes("Forecast"));
assert.ok(salesMixed.includes("同一段简历证据被复用"));

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
