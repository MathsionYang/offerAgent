const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/report-builders.js");
assert.ok(fs.existsSync(modulePath), "report-builders.js should exist");

require(modulePath);

const {
  createReportBuilders,
} = globalThis.OfferAgentReportBuilders || {};

assert.equal(typeof createReportBuilders, "function");

let language = "zh";
const builders = createReportBuilders({
  getLanguage: () => language,
  getRunLanguage: (run) => run.language || language,
  clip: (value, length = 80) => String(value ?? "").slice(0, length),
  buildDirectConclusion: () => ({ blockQuestions: false, label: "条件推进" }),
  buildGateAssessment: () => ({
    result: "部分匹配",
    summary: "核心项目证据需要继续验证",
    nextStep: "进入下一轮并验证证据",
    bestEvidence: "项目闭环证据",
    enterSandbox: true,
  }),
  buildOfferLeverage: () => ({
    rating: "中",
    summary: "存在部分谈判杠杆",
    detail: "补齐约束后再定价",
  }),
  buildConcreteJobAnalysis: () => "JOB_ANALYSIS",
  buildAbilityTransferAnalysis: () => "ABILITY_TRANSFER",
  buildConcreteGapTable: () => "GAP_TABLE",
  buildCandidateJdGapActionTable: () => "CANDIDATE_GAP_ACTIONS",
  buildCandidateMatchSnapshot: () => "MATCH_SNAPSHOT",
  buildCandidateResumeRevisionWorkbench: () => "REVISION_WORKBENCH",
  buildCandidateFinalResumeChecklist: () => "FINAL_CHECKLIST",
  buildCandidateTruthfulnessGate: () => "TRUTHFULNESS_GATE",
  buildCandidateScorecard: () => "CANDIDATE_SCORECARD",
  buildCandidateMaterialQuestions: () => "MATERIAL_QUESTIONS",
  buildCandidateContributionVerbAudit: () => "VERB_AUDIT",
  buildCandidateOptimizedResumeDraft: () => "OPTIMIZED_RESUME_DRAFT",
  buildCandidateAtsPlainTextResume: () => "ATS_PLAIN_TEXT",
  buildCandidateHrPitch: () => "HR_PITCH",
  buildCandidateMetricPromptTable: () => "METRIC_PROMPTS",
  buildCandidateResumeRewriteTable: () => "RESUME_REWRITE_TABLE",
  buildCandidateRewrittenResumeReference: () => "REWRITTEN_RESUME_REFERENCE",
  buildCandidateEvidencePatchCards: () => "EVIDENCE_PATCH_CARDS",
  buildCandidateRevisionAdvice: () => "REVISION_ADVICE",
  buildCandidateStrategyAdvice: () => "STRATEGY_ADVICE",
  buildConcreteCandidateQuestions: () => "CANDIDATE_QUESTIONS",
  buildPressureInterviewGuide: () => "PRESSURE_GUIDE",
  buildHumanFeedbackMarkdown: () => "HUMAN_FEEDBACK",
  buildInterviewerResumeBrief: () => "RESUME_BRIEF",
  buildInterviewerMatchSnapshot: () => "INTERVIEWER_MATCH_SNAPSHOT",
  buildInterviewerMandatoryVerificationQuestions: () => "MANDATORY_VERIFICATION_QUESTIONS",
  buildInterviewerAuthenticityRiskTable: () => "AUTHENTICITY_RISK_TABLE",
  buildInterviewerJdDepthProbeTable: () => "JD_DEPTH_PROBE_TABLE",
  buildInterviewerPotentialSignalsTable: () => "POTENTIAL_SIGNALS_TABLE",
  buildCandidateProfile: () => "CANDIDATE_PROFILE",
  buildInterviewerScorecard: () => "SCORECARD",
  buildInterviewerSignalTable: () => "SIGNALS",
  buildInterviewerFollowupPaths: () => "FOLLOWUPS",
  buildInterviewerDecisionAdvice: () => "DECISION_ADVICE",
  buildRoleAwareInterviewerModules: () => "ROLE_MODULES",
  buildInterviewHandoffCard: () => "HANDOFF",
  buildPostInterviewEvaluationTemplate: () => "POST_INTERVIEW",
  buildConcreteInterviewerQuestions: () => "INTERVIEWER_QUESTIONS",
  buildInterviewerRecommendation: () => "RECOMMENDATION",
  localizePanelStance: (value) => `stance:${value}`,
  localizePanelStage: (value) => `stage:${value}`,
  localizePanelImpact: (value) => `impact:${value}`,
  localizePanelClaim: (value) => `claim:${value}`,
  localizeModeratorConsensus: (value) => `consensus:${value}`,
  localizeFeedbackImpact: (value) => `feedback:${value}`,
  buildRequirementEvidenceRows: () => [
    {
      capability: "System design",
      isMissing: false,
      evidenceLevel: 1,
      evidenceLevelLabel: "Level 1",
      resumeEvidence: "Built a system",
    },
    {
      capability: "Incident response",
      isMissing: true,
      evidenceLevel: 3,
      evidenceLevelLabel: "Level 3",
      resumeEvidence: "Missing",
    },
  ],
  translateGateResult: (value) => `gate:${value}`,
  translateStage: (value) => `stage:${value}`,
  translateOfferRating: (value) => `offer:${value}`,
  translateGeneratedText: (value) => `translated:${value}`,
  summarizeEvidenceCounts: () => "1 strong / 1 missing",
  normalizeSnapshot: (value) => value,
  buildEvidenceSummary: () => "一级 1 项，三级 1 项",
  buildJdHiddenPainRows: () => [
    { phrase: "ownership", pressure: "own outcomes", prep: "prepare metrics" },
  ],
});

const report = [
  "## 项目匹配闸口",
  "这是一个足够长的项目匹配闸口内容，用于验证报告章节抽取不会丢失。",
  "## 岗位匹配",
  "这是一个足够长的岗位匹配内容，用于验证候选人报告的章节拼装逻辑。",
  "## 面试官决策辅助",
  "这是一个足够长的面试官决策内容，用于验证面试官报告的章节拼装逻辑。",
  "## 面试官候选问题库（供挑选）",
  "这是一个足够长的问题库内容，用于验证面试官追问模块不会在拆分后丢失。",
  "## Offer 沙盘推演",
  "这是一个足够长的 Offer 沙盘内容，用于验证 Offer 报告和七步推演逻辑。",
  "## 风险与待验证",
  "这是一个足够长的风险内容，用于验证风险校准步骤能够提取报告上下文。",
].join("\n");

const run = {
  language: "zh",
  report,
  input_snapshot: {
    resume: "Candidate resume evidence",
    job_description: "Job description evidence",
    company_context: "Company context",
    candidate_stage: "业务一面",
    target_level: "高级工程师",
    offer_constraints: "Budget and start date",
  },
  virtual_panel: [
    {
      id: "agent_business",
      name: "业务负责人",
      stance: "opposing",
      influence_weight: 3,
      focus: "业务判断",
    },
  ],
  panel_discussion_rounds: [
    {
      stage: "panel_simulation",
      turns: [
        {
          agent_id: "agent_business",
          impact: "raise_follow_up_priority",
          claim: "Needs validation",
        },
      ],
    },
  ],
  moderator_summary: {
    consensus: "conditional_progress",
    lead_agent_id: "agent_business",
    final_recommendation: "Proceed with conditions",
    offer_impact: "medium",
    feedback_impact: "waiting_for_human_feedback",
  },
};

const candidate = builders.buildAudienceMarkdown(run, "candidate");
assert.ok(candidate.includes("# 候选人简历润色与面试问题准备报告"));
assert.ok(candidate.includes("## 第一部分：简历润色"));
assert.ok(candidate.includes("## 第二部分：面试预测问题准备"));
assert.ok(candidate.includes("MATCH_SNAPSHOT"));
assert.ok(candidate.includes("REVISION_WORKBENCH"));
assert.ok(candidate.includes("CANDIDATE_GAP_ACTIONS"));
assert.ok(candidate.includes("TRUTHFULNESS_GATE"));
assert.ok(candidate.includes("CANDIDATE_SCORECARD"));
assert.ok(candidate.includes("MATERIAL_QUESTIONS"));
assert.ok(candidate.includes("OPTIMIZED_RESUME_DRAFT"));
assert.ok(candidate.includes("ATS_PLAIN_TEXT"));
assert.ok(candidate.includes("FINAL_CHECKLIST"));
assert.ok(candidate.includes("HR_PITCH"));
assert.ok(candidate.includes("METRIC_PROMPTS"));
assert.ok(candidate.includes("## 改写后简历参考稿"));
assert.ok(candidate.includes("REWRITTEN_RESUME_REFERENCE"));
assert.ok(candidate.includes("VERB_AUDIT"));
assert.ok(candidate.includes("RESUME_REWRITE_TABLE"));
assert.ok(candidate.includes("EVIDENCE_PATCH_CARDS"));
assert.ok(candidate.includes("HUMAN_FEEDBACK"));

const interviewer = builders.buildAudienceMarkdown(run, "interviewer");
assert.ok(interviewer.includes("# 面试官 JD 匹配与简历验真手册"));
assert.ok(interviewer.includes("INTERVIEWER_MATCH_SNAPSHOT"));
assert.ok(interviewer.includes("MANDATORY_VERIFICATION_QUESTIONS"));
assert.ok(interviewer.includes("AUTHENTICITY_RISK_TABLE"));
assert.ok(interviewer.includes("JD_DEPTH_PROBE_TABLE"));
assert.ok(interviewer.includes("POTENTIAL_SIGNALS_TABLE"));
assert.ok(interviewer.includes("SCORECARD"));
assert.ok(interviewer.includes("## 虚拟面试委员会"));

const offer = builders.buildAudienceMarkdown(run, "offer");
assert.ok(offer.includes("# Offer 沙盘推演报告"));
assert.ok(offer.includes("## 七个步骤推理总览"));
assert.ok(offer.includes("1. 证据解析"));

const preview = builders.buildPreviewMarkdown(run);
assert.ok(preview.includes("# 候选人简历润色与面试问题准备报告"));
assert.ok(preview.includes("# 面试官 JD 匹配与简历验真手册"));
assert.ok(preview.includes("# Offer 沙盘推演报告"));

assert.ok(builders.extractSection(report, "项目匹配闸口").includes("项目匹配闸口"));
assert.equal(builders.hasSubstantiveSection("## Empty\nshort"), false);

language = "en";
const englishRun = {
  ...run,
  language: "en",
  report: [
    "## Project Match Gate",
    "This is a sufficiently long project gate section for the English report builder test.",
    "## Interviewer Decision Support",
    "This is a sufficiently long decision section for the English interviewer report.",
  ].join("\n"),
};
assert.ok(builders.buildAudienceMarkdown(englishRun, "candidate").includes("# Candidate Interview Preparation Report"));
assert.ok(builders.buildAudienceMarkdown(englishRun, "interviewer").includes("# Interviewer Question Guide"));
const englishOffer = builders.buildAudienceMarkdown(englishRun, "offer");
assert.ok(englishOffer.includes("# Offer Simulation Report"));
assert.ok(englishOffer.includes("translated:补齐约束后再定价"));
assert.equal(englishOffer.includes("| offer:中 | 补齐约束后再定价 |"), false);

const projectedEnglishRun = {
  ...run,
  language: "zh",
  display_language: "en",
  display_report: [
    "## Project Match Gate",
    "Localized gate analysis from the current display artifact.",
    "## Role Match",
    "Localized role analysis from the current display artifact.",
    "## Interviewer Decision Support",
    "Localized interviewer decision analysis from the current display artifact.",
  ].join("\n"),
};
const projectedCandidate = builders.buildAudienceMarkdown(projectedEnglishRun, "candidate");
assert.ok(projectedCandidate.includes("# Candidate Interview Preparation Report"));
assert.ok(projectedCandidate.includes("Localized role analysis from the current display artifact."));
assert.equal(projectedCandidate.includes("# 候选人面试准备报告"), false);

console.log("report-builders tests passed");
