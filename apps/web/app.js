const $ = (id) => document.getElementById(id);

const providerEl = $("provider");
const modelEl = $("model");
const apiKeyEl = $("apiKey");
const baseUrlEl = $("baseUrl");
const targetRoleEl = $("targetRole");
const resumeEl = $("resume");
const jobEl = $("jobDescription");
const contextEl = $("companyContext");
const candidateStageEl = $("candidateStage");
const targetLevelEl = $("targetLevel");
const offerConstraintsEl = $("offerConstraints");
const reportEl = $("report");
const reportProgressEl = $("reportProgress");
const decisionSummaryEl = $("decisionSummary");
const interviewerScorecardEl = $("interviewerScorecard");
const interviewerScorecardStatusEl = $("interviewerScorecardStatus");
const evidenceGraphEl = $("evidenceGraph");
const virtualPanelChatEl = $("virtualPanelChat");
const virtualPanelChatStatusEl = $("virtualPanelChatStatus");
const statusEl = $("status");
const modelModeEl = $("modelMode");
const runBadgeEl = $("runBadge");
const generateBtn = $("generateBtn");
const downloadMdBtn = $("downloadMdBtn");
const downloadInterviewerBtn = $("downloadInterviewerBtn");
const downloadOfferBtn = $("downloadOfferBtn");
const feedbackAgreementEl = $("feedbackAgreement");
const feedbackQuestionUseEl = $("feedbackQuestionUse");
const feedbackDisagreementReasonEl = $("feedbackDisagreementReason");
const feedbackEvidenceSufficiencyEl = $("feedbackEvidenceSufficiency");
const feedbackRiskValidationEl = $("feedbackRiskValidation");
const feedbackNotesEl = $("feedbackNotes");
const appendFeedbackBtn = $("appendFeedbackBtn");
const languageEl = $("language");
const inputReadinessEl = $("inputReadiness");
const skillToggleEls = Array.from(document.querySelectorAll(".skill-toggle"));
const audienceModeEls = Array.from(document.querySelectorAll("[data-audience-mode]"));
const workspaceViewEls = Array.from(document.querySelectorAll("[data-workspace-view]"));
const resultViewEls = Array.from(document.querySelectorAll("[data-result-view]"));
const appShellEl = document.querySelector(".page");

let currentRun = null;
let currentLanguage = languageEl?.value || "zh";
let languageSwitchToken = 0;
let activeAudienceMode = document.body?.dataset.pageMode === "interviewer" ? "interviewer" : "candidate";
let activeWorkspaceView = "workbench";
let activeResultView = "report";
let panelViewApi = null;
const { i18n, reportStagesByLanguage } = window.OfferAgentI18n;

const {
  CONSISTENCY_SCHEMA_VERSION,
  MIROFISH_REFERENCE_WORKFLOW,
  providerDefaults,
  samples,
  sample,
  roleProfiles,
  defaultRoleId,
  getRoleProfile,
  getRoleLabel,
} = window.OfferAgentData;
const {
  buildCanonicalInputForFingerprint,
  buildInputFingerprint,
  stableStringify,
  normalizeFingerprintText,
  normalizeBaseUrlForFingerprint,
  restoreCachedRun,
  persistRunCache,
} = window.OfferAgentCache;
const {
  ARTIFACT_SCHEMA_VERSION,
  collectTranslatableArtifacts,
  isGeneratedSourcePlaceholder,
  isLocalizedArtifactCurrent,
  mergeLocalizedArtifacts,
  projectRunForLanguage,
} = window.OfferAgentLocalizedRunView;
const {
  evaluateInputReadiness,
  renderInputReadiness,
} = window.OfferAgentInputReadiness;

const {
  buildFeedbackDistillation,
  buildFeedbackImpactDiff,
  buildSkillUpdateSuggestions,
} = window.OfferAgentFeedbackEngine.createFeedbackEngine();
const {
  buildRequirementEvidenceRows,
  normalizeSnapshot,
  classifyEvidenceLevel,
  evidenceLevelLabel,
  evidenceLevelReason,
  buildVerificationQuestion,
  buildEvidenceSummary,
  buildGateAssessment,
  buildTransferPitch,
  buildOfferLeverage,
  findEvidence,
} = window.OfferAgentAssessmentRules.createAssessmentRules({
  defaultRoleId,
  getRoleProfile,
  clip,
});

const {
  translateInterviewerRecommendation,
  translateInterviewerAction,
  translateDirectConclusionPoints,
  translateVerificationQuestionText,
  translateStage,
  translateCapability,
  translateGeneratedText,
  translateEvidenceLevel,
  translateMatchStatus,
  localizeOfferLifecycleState,
  localizeOfferScenarioName,
  localizeFeedbackActionType,
  localizeFeedbackTarget,
  localizeSkillId,
  localizeFeedbackStatus,
  translateGateResult,
  translateOfferRating,
  translateVerificationQuestion,
  summarizeEvidenceCounts,
} = window.OfferAgentLocalizationMappers.createLocalizationMappers({
  getLanguage: () => currentLanguage,
  i18n,
});

const {
  buildInterviewerResumeBrief,
  buildDirectConclusion,
  buildConcreteJobAnalysis,
  buildCandidateThreeSecondSummary,
  buildInterviewerThreeSecondSummary,
  buildInterviewerOneMinuteDecisionBrief,
  buildCandidateAdvantageCards,
  buildInterviewerAdvantageCards,
  buildAbilityTransferAnalysis,
  buildConcreteGapTable,
  buildConcreteCandidateQuestions,
  buildCandidateRevisionAdvice,
  buildCandidateStrategyAdvice,
  buildPressureInterviewGuide,
  buildConcreteInterviewerQuestions,
  buildInterviewerRecommendation,
  buildInterviewerScorecard,
  buildInterviewerSignalTable,
  buildInterviewerFollowupPaths,
  buildInterviewerDecisionAdvice,
  buildInterviewerQuickBrief,
  buildCandidateProfile,
  buildRoleAwareInterviewerModules,
  buildInterviewHandoffCard,
  buildPostInterviewEvaluationTemplate,
  buildJdHiddenPainRows,
  buildEvidenceChainTable,
  interviewerLens,
} = window.OfferAgentReportContentHelpers.createReportContentHelpers({
  getLanguage: () => currentLanguage,
  clip,
  buildRequirementEvidenceRows,
  buildGateAssessment,
  buildOfferLeverage,
  buildEvidenceSummary,
  normalizeSnapshot,
  findEvidence,
  translateCapability,
  translateOfferRating,
  translateGateResult,
  translateGeneratedText,
  translateInterviewerRecommendation,
  translateInterviewerAction,
  translateDirectConclusionPoints,
  translateVerificationQuestionText,
});
const {
  buildEvaluationSummary,
  buildRequirementMatches,
  buildStructuredInterviewQuestions,
  buildStructuredOfferSandbox,
  buildStructuredEvidence,
  buildStructuredEvaluation,
  buildOfferSimulationRun,
  buildOfferLifecycleSteps,
  buildOfferScenarios,
} = window.OfferAgentEvaluationEngine.createEvaluationEngine({
  schemaVersion: CONSISTENCY_SCHEMA_VERSION,
  defaultRoleId,
  getLanguage: () => currentLanguage,
  clip,
  interviewerLens,
  buildEvidenceSummary,
});


guardAppShell();



const systemPrompt = `你是面试准备助手。

请基于用户提供的简历、JD、Offer 沙盘上下文和已选择的虚拟面试官视角，生成中文 Markdown 面试准备报告。报告的核心用途是帮助候选人更好准备面试，同时生成可供面试官挑选使用的候选人追问题库。

报告必须区分两个完全不同的使用场景：
- 候选人报告：从“诊断清单”升级为“面试打法”，帮助候选人知道优势如何放大、缺证如何诚实表达、今晚先补什么、面试中如何引导项目故事、如何准备动机和谈薪。
- 面试官报告：从“JD 匹配分析”升级为“多角色决策辅助系统”，帮助面试官快速判断推荐强度、候选人画像、核心风险、追问链、红绿灯信号、评分卡和下一轮接力信息。
- 不得把同一套结论简单换标题分别给候选人和面试官。候选人要看到行动策略，面试官要看到决策工具。

必须遵守：
- 可以输出“项目匹配闸口”的推进建议：项目经历明显不匹配 JD 职责时，建议不进入下一轮沙盘；匹配或待验证时，建议进入下一轮沙盘验证。
- 不输出无证据的自动录用或淘汰结论，所有“淘汰 / 不推进”建议必须基于 JD 职责和候选人项目经历证据。
- 不使用年龄、性别、婚育、照片、籍贯等敏感信息作为判断依据。
- 缺少证据时只能标注为待验证。
- 每个关键判断必须引用简历或 JD 的具体证据。
- 潜力只能表达为行为证据和待验证假设。
- 报告优先服务于候选人的面试准备，帮助候选人补齐项目证据、表达结构和风险预案。
- 报告同时服务于面试官提问，输出可挑选的岗位要求、项目经历、项目推进和 Offer 动机问题。

请使用以下标题：
## 一页摘要
## JD 隐性痛点解码
## 项目匹配闸口
## 条件性进入与能力迁移论证
## 岗位匹配
## 项目亮点
## 风险与待验证
## Offer 沙盘推演
## 必问追问
## 候选人准备重点
## 候选人策略建议
## 面试官候选问题库（供挑选）
## 面试官决策辅助
## 面试官一分钟速览
## 候选人画像
## 角色分化面试官模块
## 面试轮次信息传递卡
## 面试后评估
## 面试官视角库
## 证据链
## 人工反馈建议
## 动态校准指令

排版要求：
- 不要输出大段纯文本。优先使用 Markdown 表格、分层列表和短句。
- “一页摘要”“项目匹配闸口”“岗位匹配”“候选人准备重点”“候选人策略建议”“面试官候选问题库”“面试官决策辅助”“面试官视角库”建议使用 Markdown 表格呈现。
- 表格控制在 3 到 4 列，列名必须清晰，单元格内容保持短句。
- 生成内容允许使用 Markdown 结构，但最终报告不能出现多余 Markdown 装饰符，例如加粗星号、分隔线、代码围栏、引用符号、裸露表格分隔线。
- 所有报告必须先下结论，再列详细分析。
- 每一个结论都必须给出证据，表格中优先使用“结论 / 证据 / 详细说明 / 下一步”结构。
- 面向候选人的报告必须增加招聘岗位分析：企业需要候选人具备什么能力、当前简历与岗位职责的匹配程度、不匹配点和重点准备建议。
- 面向候选人的报告必须给出策略指导：三秒结论、优势放大、能力迁移、今晚行动清单、模拟面试路线图、压力问题预案、薪资 / 动机准备，不只输出检查清单。
- 面向面试官的报告必须与候选人报告明显区分，不得复制候选人版结论页。面试官版要回答：这个人能不能干活、是否融入团队、水分有多少、值不值得给 Offer。
- 面向面试官的报告必须按角色分化输出，至少覆盖 HR、技术架构 / 技术负责人、产品负责人、项目推进 / PMO、业务负责人 / 决策层五类视角。每类角色只输出该角色最需要的候选人画像、验证重点、必问问题、深挖问题、快速验证问题、红绿灯信号、评分卡和给下一轮面试官的信息。
- 面试官报告必须提供“一分钟速览”，用于面试官在面试前 5 分钟快速决策阅读：推荐等级、核心亮点、核心风险、必问 3 题、面试策略、下一轮传递重点。
- 每个核心追问必须包含追问链：回答好继续深挖什么，回答差如何止损或快速验证，以及面试后记录什么结论。
- 禁止输出空章节。每个章节至少包含一个有证据的表格或 3 条以上具体问题。

其中“项目匹配闸口”是第一步，必须先输出：
- 根据 JD 岗位职责拆出核心项目证据要求。
- 对照候选人项目经历，判断“匹配 / 部分匹配 / 不匹配 / 待验证”。
- 如果核心项目经历不匹配，明确建议“不进入下一轮沙盘”，并说明候选人需要补充哪些项目证据。
- 如果匹配或部分匹配，明确建议“进入下一轮沙盘”，再展开 Offer 沙盘推演。

其中“候选人准备重点”必须包含：
- 该模块服务候选人，下载版只应包含简历与 JD 不匹配的点、待补齐证据、建议重点准备的问题。
- 候选人应准备的项目故事：背景、目标、约束、动作、结果、复盘。
- 候选人应补齐的证据：指标口径、个人贡献、关键决策、协作对象、失败或反思案例。
- 候选人应提前演练的表达：自我介绍、项目讲述、岗位匹配、动机与期望。
- 候选人准备重点必须输出“优先级排序”和“今晚行动清单”：先补 JD 核心必达项、再补能提升证据等级的指标口径和个人贡献、最后补加分项。
- 候选人策略建议必须包含：差异化优势放大、缺证项不造假表达、主动引导面试官关注的项目、STAR 升级框架、压力问题应对和谈薪 / 到岗约束准备。
- 如果短期无法补齐真实证据，必须提供诚实替代表达：说明相似经验、方法迁移和入职后补齐计划，不得引导候选人编造。

其中“面试官候选问题库（供挑选）”必须包含：
- 该模块服务面试官，下载版应包含简历与 JD 不匹配的点、不同面试官视角、验证简历过度包装的问题。
- 所有提问必须兼顾岗位职责与项目经历：每个问题都要说明它对应的 JD 职责，以及它要验证的候选人具体项目证据。
- 岗位要求验证问题：针对 JD 核心职责、必备能力、加分项提出若干问题。
- 项目经历追问：围绕简历中的项目追问真实角色、个人贡献、决策过程、结果归因。
- 项目经理 / 推进视角问题：追问目标拆解、里程碑、资源协调、风险控制、跨团队沟通和复盘机制。
- 候选人准备提示：帮助候选人准备项目证据、指标口径、个人贡献和复盘案例。
- 高匹配反包装追问：当简历与 JD 看起来高度匹配时，不要降低验证强度，要进一步追问候选人的真实角色、关键决策、指标口径、失败细节、技术/业务取舍和无法提前背诵的现场推演问题，用于识别简历过度包装。
- 每个核心问题必须提供追问路径：回答好时继续深挖什么，回答差时如何快速验证或停止深挖。
- 每个问题必须说明它决定什么推进动作：继续推进、加面、补材料、暂缓或不推荐。

其中“面试官决策辅助”必须包含：
- 推荐等级：强烈推荐 / 推荐 / 有条件推荐 / 不推荐，只能基于 JD 和项目证据，不得使用敏感信息。
- 结构化评分卡：专业能力、项目闭环、沟通协作、业务理解、技术协同、文化 / 团队适配、Offer 风险，每项给 1 到 5 分、证据、行为锚点和扣分信号。
- 红灯 / 绿灯信号：列出候选人怎么回答代表可信，怎么回答代表包装或风险。
- 追问链：每个核心问题都要写起手问题、回答好继续深挖、回答差快速验证和记录结论。
- 录用条件与补充验证：如果推荐推进，必须说明下一轮必须验证什么；如果不推荐，说明缺少哪些项目证据。
- 薪资 / Offer 接受概率：只基于上下文证据判断强 / 中 / 弱或待验证，缺证时不得编造薪资区间。

其中“候选人画像”必须包含：
- 职业路径画像：只基于简历中可见经历、项目类型、职责跨度和候选人阶段，不推断年龄、婚育、籍贯等敏感信息。
- 稳定性 / 动机画像：只基于工作经历连续性、求职动机、Offer 约束和上下文证据，缺证时标注待验证。
- 薪资 / 到岗画像：只基于用户提供的 Offer 约束、预算、竞对机会和到岗时间，缺证时标注待验证，不编造薪资范围。
- 团队适配画像：结合公司 / 团队上下文，判断候选人的协作风格、节奏适应和潜在磨合点。

其中“角色分化面试官模块”必须包含：
- HR 面试官模块：动机、稳定性、薪资期望、到岗时间、竞业 / 合规风险、文化适配。
- 技术架构 / 技术负责人模块：系统设计、技术边界、技术选型、研发协同、复杂问题排查。
- 产品负责人模块：需求洞察、产品规划、MVP / 迭代意识、用户价值、业务指标。
- 项目推进 / PMO 模块：里程碑、资源协调、延期预警、风险升级、复盘机制。
- 业务负责人 / 决策层模块：战略取舍、商业洞察、投入产出、领导力潜力、资源约束下的判断质量。
- 每个角色模块必须包含：角色目标、候选人画像、必问问题、深挖问题、快速验证问题、追问链、评分卡、绿灯信号、红灯信号、本角色不需要看的内容、给下一位面试官的话。
- 每个角色至少输出 3 个问题：1 个必问、1 个深挖、1 个快速验证；不同角色的问题不得大量重复。

其中“面试轮次信息传递卡”必须包含：
- 本轮面试官角色。
- 已验证通过。
- 需要下一轮验证。
- 新增发现。
- 本轮评分。
- 是否建议进入下一轮。

其中“面试后评估”必须包含：
- 面试官现场评分区：专业能力、项目经验、沟通协作、团队适配、成长潜力、Offer 风险。
- 综合判断：推荐录用 / 有条件推荐 / 不推荐。
- 需要补充验证的问题。
- 面试官备注。

其中“面试官视角库”必须体现为虚拟生成的面试官团队。它不是单独的 Skill，也不是固定模板题库，而是一组不同面试角色的评估视角：
- 先根据 JD 职责、候选人项目经历和公司 / Offer 上下文，生成 3 到 6 个虚拟面试官角色。
- 每个虚拟面试官必须包含：角色名称、生成依据、关注能力、关联证据、深挖问题、好回答应证明什么、风险信号。
- 问题必须围绕候选人的具体项目经历与 JD 具体职责展开，不要只输出通用模板问题。
- 如果证据不足，问题要明确用于验证哪些缺口。`;

const {
  skillLibrary,
  buildSkillRegistry,
  formatSelectedSkills,
  buildSkillQuestionMarkdown,
  buildSkillEvidence,
  buildDeepQuestions,
} = window.OfferAgentSkillRegistry.createSkillRegistry({
  defaultRoleId,
  getRoleLabel,
  getLanguage: () => currentLanguage,
  getText: () => getText(),
  clip,
});

const {
  buildVirtualInterviewPanel,
  buildPanelDiscussionRounds,
  buildModeratorSummary,
} = window.OfferAgentVirtualPanel.createVirtualPanelModel({
  skillLibrary,
  defaultRoleId,
  getRoleLabel,
  workflowMapping: MIROFISH_REFERENCE_WORKFLOW,
});

const {
  buildEvidenceGraph,
  reportAnchorForNodeType,
  detectEvidenceGraphGaps,
} = window.OfferAgentEvidenceGraph.createEvidenceGraphModel({
  buildSkillRegistry,
  interviewerLens,
  getLanguage: () => currentLanguage,
});

const {
  renderEvidenceGraph,
  getEvidenceGraphLabels,
  openPanelMessageDetail,
  openGraphNodeDetail,
  openReportAnchorDetail,
  openTraceDetailPanel,
  renderTraceDetailRows,
  focusReportAnchor,
  findGraphNodeById,
  cssEscape,
} = window.OfferAgentGraphView.createGraphView({
  evidenceGraphEl,
  reportEl,
  getCurrentRun: () => getDisplayRun(),
  getLanguage: () => currentLanguage,
  detectEvidenceGraphGaps,
  reportAnchorForNodeType,
  escapeHtml,
  clip,
  riskToneClass,
  localizeSkillId,
  localizePanelStance: (value) => panelViewApi?.localizePanelStance(value) || value || "",
});

panelViewApi = window.OfferAgentPanelView.createPanelView({
  virtualPanelChatEl,
  virtualPanelChatStatusEl,
  evidenceGraphEl,
  getLanguage: () => currentLanguage,
  getText: () => window.OfferAgentI18n.getText(currentLanguage),
  detectEvidenceGraphGaps,
  reportAnchorForNodeType,
  escapeHtml,
  cssEscape,
  setWorkspaceView,
  openPanelMessageDetail,
  openGraphNodeDetail,
  openReportAnchorDetail,
  findGraphNodeById,
});

const {
  renderVirtualPanelChat,
  playVirtualPanelChat,
  localizePanelClaim,
  localizePanelStage,
  localizePanelStance,
  localizePanelImpact,
  localizeModeratorConsensus,
  localizeFeedbackImpact,
} = panelViewApi;

const {
  cleanReportMarkdown,
  markdownToHtml,
  renderReport,
  renderStreamingReport,
  renderGenerationError,
  renderStreamProgress,
  renderDecisionSummaryCard,
  buildDecisionSummaryCards,
  renderInterviewerScorecard,
  buildInterviewerScorecardRows,
} = window.OfferAgentReportsView.createReportsView({
  reportEl,
  reportProgressEl,
  decisionSummaryEl,
  interviewerScorecardEl,
  interviewerScorecardStatusEl,
  getCurrentRun: () => getDisplayRun(),
  getLanguage: () => currentLanguage,
  getText: () => window.OfferAgentI18n.getText(currentLanguage),
  getReportStages: () => window.OfferAgentI18n.getReportStages(currentLanguage),
  getPageMode,
  renderEvidenceGraph,
  escapeHtml,
  clip,
  riskToneClass,
  offerScenarioToneClass,
  getEvidenceGraphLabels,
  localizeOfferScenarioName,
  localizeFeedbackActionType,
  localizeFeedbackTarget,
  localizeSkillId,
  localizeFeedbackStatus,
  buildCandidateThreeSecondSummary,
  buildCandidateAdvantageCards,
  buildInterviewerOneMinuteDecisionBrief,
  buildInterviewerQuickBrief,
  translateGateResult,
  translateOfferRating,
  translateCapability,
  translateEvidenceLevel,
  translateMatchStatus,
  openTraceDetailPanel,
  renderTraceDetailRows,
});

const {
  buildPreviewMarkdown,
  buildAudienceMarkdown,
  extractSection,
} = window.OfferAgentReportBuilders.createReportBuilders({
  getLanguage: () => currentLanguage,
  getRunLanguage,
  clip,
  buildDirectConclusion,
  buildGateAssessment,
  buildOfferLeverage,
  buildConcreteJobAnalysis,
  buildAbilityTransferAnalysis,
  buildConcreteGapTable,
  buildCandidateRevisionAdvice,
  buildCandidateStrategyAdvice,
  buildConcreteCandidateQuestions,
  buildPressureInterviewGuide,
  buildHumanFeedbackMarkdown,
  buildInterviewerResumeBrief,
  buildCandidateProfile,
  buildInterviewerScorecard,
  buildInterviewerSignalTable,
  buildInterviewerFollowupPaths,
  buildInterviewerDecisionAdvice,
  buildRoleAwareInterviewerModules,
  buildInterviewHandoffCard,
  buildPostInterviewEvaluationTemplate,
  buildConcreteInterviewerQuestions,
  localizePanelStance,
  localizePanelStage,
  localizePanelImpact,
  localizePanelClaim,
  localizeModeratorConsensus,
  localizeFeedbackImpact,
  buildRequirementEvidenceRows,
  translateGateResult,
  translateStage,
  translateOfferRating,
  translateGeneratedText,
  summarizeEvidenceCounts,
  normalizeSnapshot,
  buildEvidenceSummary,
  buildJdHiddenPainRows,
});

const {
  reportToStaticHtmlDocument,
  buildPdfSummaryCards,
} = window.OfferAgentReportExportTemplate.createReportExportTemplate({
  i18n,
  getLanguage: () => currentLanguage,
  getRunLanguage,
  buildAudienceMarkdown,
  markdownToHtml,
  escapeHtml,
  clip,
  buildRequirementEvidenceRows,
  buildGateAssessment,
  buildInterviewerRecommendation,
  buildOfferLeverage,
  extractSection,
  translateGateResult,
  translateCapability,
});

const {
  createPdfExport,
} = window.OfferAgentPdfExport;
const {
  downloadFile,
  downloadPdfReport,
} = createPdfExport({
  document,
  window,
  URL,
  Blob,
  Image,
  XMLSerializer,
  TextEncoder,
  requestAnimationFrame,
  setStatus,
  getText: () => getText(),
  reportToStaticHtmlDocument,
});

const {
  generateWithLLM,
  translateGeneratedArtifacts,
} = window.OfferAgentModelClient.createModelClient({
  providerDefaults,
  buildSystemPrompt,
  buildLlmUserPrompt,
  streamMarkdownByBlocks,
  cleanReportMarkdown,
});


const getText = () => window.OfferAgentI18n.getText(currentLanguage);
const getReportStages = () => window.OfferAgentI18n.getReportStages(currentLanguage);

function getDisplayRun(run = currentRun) {
  return run ? projectRunForLanguage(run, currentLanguage) : null;
}

function ensureCanonicalLanguageArtifact(run) {
  if (!run) return run;
  const sourceLanguage = getRunLanguage(run);
  const sourceArtifact = run.localized_artifacts?.[sourceLanguage];
  if (
    isLocalizedArtifactCurrent(run, sourceLanguage)
    && sourceArtifact?.report_markdown === (run.report || "")
  ) {
    return run;
  }
  return mergeLocalizedArtifacts(run, sourceLanguage, {
    schema_version: ARTIFACT_SCHEMA_VERSION,
    source: "generated",
    report_markdown: run.report || "",
    text_by_id: collectTranslatableArtifacts(run),
  });
}

function collectModelRuntimeConfig(run) {
  return {
    provider: run?.provider || providerEl.value,
    model: run?.model || modelEl.value.trim(),
    apiKey: apiKeyEl.value.trim(),
    baseUrl: baseUrlEl.value.trim(),
  };
}

function buildMockLanguageArtifact(run, targetLanguage) {
  const snapshot = run?.input_snapshot || {};
  const mockInput = {
    provider: "mock",
    model: providerDefaults.mock?.model || "Mock Demo",
    apiKey: "",
    baseUrl: "",
    targetRole: snapshot.target_role || defaultRoleId,
    resume: snapshot.resume || "",
    jobDescription: snapshot.job_description || "",
    companyContext: snapshot.company_context || "",
    candidateStage: snapshot.candidate_stage || "",
    targetLevel: snapshot.target_level || "",
    offerConstraints: snapshot.offer_constraints || "",
    selectedSkills: snapshot.selected_skills || [],
    language: targetLanguage,
    useRealModel: false,
  };
  const reportMarkdown = targetLanguage === "en"
    ? generateMockReportEn(mockInput)
    : generateMockReport(mockInput);
  const projectedMockRun = enrichEvaluationRun({
    ...run,
    localized_artifacts: undefined,
    report: reportMarkdown,
    input_snapshot: {
      ...snapshot,
      language: targetLanguage,
    },
  });
  const textById = collectTranslatableArtifacts(projectedMockRun);
  return {
    schema_version: ARTIFACT_SCHEMA_VERSION,
    source: "projected",
    report_markdown: cleanReportMarkdown(reportMarkdown),
    text_by_id: targetLanguage === "en"
      ? Object.fromEntries(
          Object.entries(textById).map(([stableId, value]) => [
            stableId,
            translateGeneratedText(value, targetLanguage),
          ]),
        )
      : textById,
  };
}

async function ensureLocalizedArtifact(run, targetLanguage) {
  const target = targetLanguage === "en" ? "en" : "zh";
  const canonicalRun = ensureCanonicalLanguageArtifact(run);
  if (isLocalizedArtifactCurrent(canonicalRun, target)) return canonicalRun;

  if (canonicalRun.mode === "mock") {
    return mergeLocalizedArtifacts(
      canonicalRun,
      target,
      buildMockLanguageArtifact(canonicalRun, target),
    );
  }

  const runtimeConfig = collectModelRuntimeConfig(canonicalRun);
  if (!runtimeConfig.apiKey) {
    throw new Error(
      target === "en"
        ? "API key is required to translate this live-model run."
        : "切换真实模型报告语言需要当前页面中的 API Key。",
    );
  }

  const artifact = await translateGeneratedArtifacts({
    ...runtimeConfig,
    sourceLanguage: getRunLanguage(canonicalRun),
    targetLanguage: target,
    reportMarkdown: canonicalRun.report || "",
    textById: collectTranslatableArtifacts(canonicalRun),
  });
  return mergeLocalizedArtifacts(canonicalRun, target, artifact);
}

async function ensureDisplayLanguageArtifact(run) {
  const canonicalRun = ensureCanonicalLanguageArtifact(run);
  if (isLocalizedArtifactCurrent(canonicalRun, currentLanguage)) {
    return canonicalRun;
  }
  return ensureLocalizedArtifact(canonicalRun, currentLanguage);
}

function renderAllOutputSurfaces(run, options = {}) {
  if (!run) return;
  const markdown = buildPreviewMarkdown(run);
  if (options.streaming) {
    renderStreamingReport(markdown, options.status || getText().reportUpdated, true);
  } else {
    renderReport(markdown);
  }
  renderEvidenceGraph(run);
  renderDecisionSummaryCard(run);
  renderInterviewerScorecard(run);
  if (options.playPanel) {
    playVirtualPanelChat(run);
  } else {
    renderVirtualPanelChat(run);
  }
}

renderStreamProgress("", getText().progressWaiting, false);
setAudienceMode(activeAudienceMode);
setWorkspaceView("workbench");
setReportDownloadsAvailable(false);
refreshInputReadiness();

providerEl.addEventListener("change", () => {
  const defaults = providerDefaults[providerEl.value] || providerDefaults.mock;
  modelEl.value = defaults.model;
  baseUrlEl.value = defaults.baseUrl;
  apiKeyEl.disabled = providerEl.value === "mock";
  apiKeyEl.placeholder =
    providerEl.value === "mock" ? getText().placeholders.apiKeyMock : getText().placeholders.apiKeyReal;
  updateModelMode();
});

apiKeyEl.addEventListener("input", updateModelMode);

if (languageEl) {
  languageEl.addEventListener("change", () => applyLanguage(languageEl.value));
}

[resumeEl, jobEl].forEach((element) => {
  element?.addEventListener("input", refreshInputReadiness);
});

skillToggleEls.forEach((toggle) => {
  toggle.addEventListener("change", () => {
    toggle.closest(".skill-card-item")?.classList.toggle("selected", toggle.checked);
    refreshInputReadiness();
  });
});

workspaceViewEls.forEach((button) => {
  button.addEventListener("click", () => setWorkspaceView(button.dataset.workspaceView));
});

resultViewEls.forEach((button) => {
  button.addEventListener("click", () => setResultView(button.dataset.resultView));
});

audienceModeEls.forEach((button) => {
  button.addEventListener("click", () => setAudienceMode(button.dataset.audienceMode));
});

bindClick("mockBtn", () => {
  const localizedSample = samples[currentLanguage] || samples.zh;
  if (targetRoleEl) targetRoleEl.value = localizedSample.targetRole || defaultRoleId;
  resumeEl.value = localizedSample.resume;
  jobEl.value = localizedSample.job;
  contextEl.value = localizedSample.context;
  candidateStageEl.value = localizedSample.candidateStage;
  targetLevelEl.value = localizedSample.targetLevel;
  offerConstraintsEl.value = localizedSample.offerConstraints;
  providerEl.value = "mock";
  providerEl.dispatchEvent(new Event("change"));
  refreshInputReadiness();
  setStatus(getText().statusSample);
});

bindClick("clearBtn", () => {
  apiKeyEl.value = "";
  if (targetRoleEl) targetRoleEl.value = defaultRoleId;
  resumeEl.value = "";
  jobEl.value = "";
  contextEl.value = "";
  candidateStageEl.value = "初筛";
  targetLevelEl.value = "";
  offerConstraintsEl.value = "";
  currentRun = null;
  reportEl.className = "report report-content empty";
  renderEmptyReport();
  renderStreamProgress("", getText().progressWaiting, false);
  renderDecisionSummaryCard(null);
  renderInterviewerScorecard(null);
  renderVirtualPanelChat(null);
  runBadgeEl.textContent = getText().runPending;
  downloadMdBtn.disabled = true;
  setInterviewerDownloadDisabled(true);
  setOfferDownloadDisabled(true);
  setReportDownloadsAvailable(false);
  appendFeedbackBtn.disabled = true;
  feedbackAgreementEl.value = "未反馈";
  feedbackQuestionUseEl.value = "未反馈";
  feedbackDisagreementReasonEl.value = "未反馈";
  feedbackEvidenceSufficiencyEl.value = "未反馈";
  feedbackRiskValidationEl.value = "未反馈";
  feedbackNotesEl.value = "";
  refreshInputReadiness();
  setWorkspaceView("workbench");
  setStatus(getText().statusCleared);
});

generateBtn.addEventListener("click", async () => {
  const input = collectInput();
  if (!input.resume.trim() || !input.jobDescription.trim()) {
    setStatus(getText().statusMissingInput, true);
    return;
  }
  const inputFingerprint = await buildInputFingerprint(input);

  generateBtn.disabled = true;
  downloadMdBtn.disabled = true;
  setInterviewerDownloadDisabled(true);
  setOfferDownloadDisabled(true);
  setReportDownloadsAvailable(false);
  appendFeedbackBtn.disabled = true;
  runBadgeEl.textContent = getText().runGenerating;
  setResultView("report");
  setWorkspaceView("graph");
  renderVirtualPanelChat(null, { pending: true });
  renderStreamingReport("", input.useRealModel ? getText().llmStreaming : getText().mockStreaming);
  setStatus(input.useRealModel ? getText().statusGeneratingLlm : getText().statusGeneratingMock);

  try {
    const cachedRun = restoreCachedRun(inputFingerprint);
    if (cachedRun) {
      currentRun = await ensureDisplayLanguageArtifact(enrichEvaluationRun({
        ...cachedRun,
        cache_status: "hit",
        restored_at: new Date().toISOString(),
      }));
      persistRunCache(currentRun);
      const displayRun = getDisplayRun();
      renderAllOutputSurfaces(displayRun, {
        streaming: true,
        status: getText().reportUpdated,
        playPanel: true,
      });
      runBadgeEl.textContent = currentRun.id;
      downloadMdBtn.disabled = false;
      setInterviewerDownloadDisabled(false);
      setOfferDownloadDisabled(false);
      setReportDownloadsAvailable(true);
      appendFeedbackBtn.disabled = false;
      setResultView("report");
      setWorkspaceView("graph");
      setStatus(getText().statusCacheHit);
      return;
    }

    const report = input.useRealModel
      ? await generateWithLLM(input, (partial) => {
          renderStreamingReport(cleanReportMarkdown(partial), getText().llmStreaming);
        })
      : await streamMockReport(input);
    const cleanedReport = cleanReportMarkdown(report);

    currentRun = {
      id: `run_${Date.now()}`,
      created_at: new Date().toISOString(),
      schema_version: CONSISTENCY_SCHEMA_VERSION,
      input_fingerprint: inputFingerprint,
      cache_status: "miss",
      provider: input.provider,
      model: input.model,
      mode: input.useRealModel ? "llm" : "mock",
      input_snapshot: {
        target_role: input.targetRole,
        resume: input.resume,
        job_description: input.jobDescription,
        company_context: input.companyContext,
        candidate_stage: input.candidateStage,
        target_level: input.targetLevel,
        offer_constraints: input.offerConstraints,
        selected_skills: input.selectedSkills,
        language: input.language,
      },
      report: cleanedReport,
    };
    currentRun = await ensureDisplayLanguageArtifact(enrichEvaluationRun(currentRun));
    persistRunCache(currentRun);

    renderAllOutputSurfaces(getDisplayRun(), {
      streaming: true,
      status: input.useRealModel ? getText().llmDone : getText().mockDone,
      playPanel: true,
    });
    runBadgeEl.textContent = currentRun.id;
    downloadMdBtn.disabled = false;
    setInterviewerDownloadDisabled(false);
    setOfferDownloadDisabled(false);
    setReportDownloadsAvailable(true);
    appendFeedbackBtn.disabled = false;
    setResultView("report");
    setWorkspaceView("graph");
    setStatus(input.useRealModel ? getText().statusLlmDone : getText().statusMockDone);
  } catch (error) {
    const errorMessage = formatGenerationError(error);
    renderGenerationError(errorMessage);
    setStatus(errorMessage, true);
  } finally {
    generateBtn.disabled = false;
  }
});

downloadMdBtn.addEventListener("click", () => {
  if (!currentRun) return;
  currentRun.human_feedback = collectFeedback();
  downloadPdfReport(getDisplayRun(), "candidate", buildPdfFilename(currentRun, "candidate"));
});

if (downloadInterviewerBtn) {
  downloadInterviewerBtn.addEventListener("click", () => {
    if (!currentRun) return;
    currentRun.human_feedback = collectFeedback();
    downloadPdfReport(getDisplayRun(), "interviewer", buildPdfFilename(currentRun, "interviewer"));
  });
}

if (downloadOfferBtn) {
  downloadOfferBtn.addEventListener("click", () => {
    if (!currentRun) return;
    currentRun.human_feedback = collectFeedback();
    downloadPdfReport(getDisplayRun(), "offer", buildPdfFilename(currentRun, "offer"));
  });
}

appendFeedbackBtn.addEventListener("click", async () => {
  if (!currentRun) {
    setStatus(getText().statusNeedReport, true);
    return;
  }

  const feedback = collectFeedback();
  const sourceLanguage = getRunLanguage(currentRun);
  currentRun.human_feedback = feedback;
  currentRun.report = appendFeedbackToReport(currentRun.report, feedback);
  currentRun = enrichEvaluationRun(currentRun);
  currentRun.localized_artifacts = {};
  currentRun = ensureCanonicalLanguageArtifact(currentRun);
  let localizationError = null;
  if (currentLanguage !== sourceLanguage) {
    try {
      currentRun = await ensureLocalizedArtifact(currentRun, currentLanguage);
    } catch (error) {
      localizationError = error;
    }
  }
  persistRunCache(currentRun);
  renderAllOutputSurfaces(getDisplayRun(), { playPanel: true });
  downloadMdBtn.disabled = false;
  setInterviewerDownloadDisabled(false);
  setOfferDownloadDisabled(false);
  setReportDownloadsAvailable(true);
  appendFeedbackBtn.disabled = false;
  setWorkspaceView("graph");
  setStatus(
    localizationError
      ? getText().statusLocalizationFailed(localizationError.message || String(localizationError))
      : getText().statusFeedback,
    Boolean(localizationError),
  );
});

function collectInput() {
  return {
    provider: providerEl.value,
    model: modelEl.value.trim(),
    apiKey: apiKeyEl.value.trim(),
    baseUrl: baseUrlEl.value.trim(),
    targetRole: targetRoleEl?.value || defaultRoleId,
    resume: resumeEl.value.trim(),
    jobDescription: jobEl.value.trim(),
    companyContext: contextEl.value.trim(),
    candidateStage: candidateStageEl.value,
    targetLevel: targetLevelEl.value.trim(),
    offerConstraints: offerConstraintsEl.value.trim(),
    selectedSkills: collectSelectedSkills(),
    language: currentLanguage,
    useRealModel: providerEl.value !== "mock" && Boolean(apiKeyEl.value.trim()),
  };
}

function refreshInputReadiness() {
  if (!inputReadinessEl) return;
  const state = evaluateInputReadiness({
    resume: resumeEl?.value || "",
    jobDescription: jobEl?.value || "",
    selectedSkills: skillToggleEls.filter((item) => item.checked).map((item) => item.value),
    language: currentLanguage,
  });
  renderInputReadiness(inputReadinessEl, state, escapeHtml);
}


function bindClick(id, handler) {
  const element = $(id);
  if (element) element.addEventListener("click", handler);
}

function setInterviewerDownloadDisabled(disabled) {
  if (downloadInterviewerBtn) downloadInterviewerBtn.disabled = disabled;
}

function setOfferDownloadDisabled(disabled) {
  if (downloadOfferBtn) downloadOfferBtn.disabled = disabled;
}

function getPageMode() {
  return activeAudienceMode;
}

function setAudienceMode(mode) {
  activeAudienceMode = mode === "interviewer" ? "interviewer" : "candidate";
  if (document.body?.dataset) {
    document.body.dataset.pageMode = activeAudienceMode;
  }
  applyInterviewerMode();
  const displayRun = getDisplayRun();
  renderDecisionSummaryCard(displayRun);
  renderInterviewerScorecard(displayRun);
  setReportDownloadsAvailable(Boolean(currentRun));
}

function applyInterviewerMode() {
  const isInterviewer = getPageMode() === "interviewer";
  document.body.classList.toggle("interviewer-mode", isInterviewer);
  document.body.classList.toggle("candidate-mode", !isInterviewer);
  audienceModeEls.forEach((button) => {
    const isActive = button.dataset.audienceMode === getPageMode();
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function setReportDownloadsAvailable(available) {
  const pageMode = getPageMode();
  document.body.classList.toggle("report-export-bar-ready", Boolean(available));
  if (downloadMdBtn) {
    downloadMdBtn.hidden = !available || pageMode !== "candidate";
    downloadMdBtn.disabled = !available || pageMode !== "candidate";
  }
  if (downloadInterviewerBtn) {
    downloadInterviewerBtn.hidden = !available || pageMode !== "interviewer";
    downloadInterviewerBtn.disabled = !available || pageMode !== "interviewer";
  }
  if (downloadOfferBtn) {
    downloadOfferBtn.hidden = true;
    downloadOfferBtn.disabled = true;
  }
  applyInterviewerMode();
}

function setWorkspaceView(view) {
  activeWorkspaceView = view === "graph" ? "graph" : "workbench";
  applyWorkspaceView();
  if (activeWorkspaceView === "graph") {
    const displayRun = getDisplayRun();
    renderEvidenceGraph(displayRun);
    renderDecisionSummaryCard(displayRun);
    renderInterviewerScorecard(displayRun);
  }
}

function applyWorkspaceView() {
  const isGraphView = activeWorkspaceView === "graph";
  document.body.classList.toggle("view-workbench", !isGraphView);
  document.body.classList.toggle("view-graph", isGraphView);
  applyResultView();
  workspaceViewEls.forEach((button) => {
    const isActive = button.dataset.workspaceView === activeWorkspaceView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function guardAppShell() {
  if (!document.body || !appShellEl) return;

  const restoreShell = () => {
    const extensionNode = document.getElementById("csdn_article/extension");
    if (extensionNode) {
      extensionNode.style.setProperty("display", "none", "important");
      extensionNode.style.setProperty("pointer-events", "none", "important");
    }

    if (!document.body.contains(appShellEl)) {
      document.body.prepend(appShellEl);
    }

    Array.from(document.body.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        node.remove();
      }
    });
  };

  restoreShell();
  new MutationObserver(restoreShell).observe(document.body, { childList: true });
}

function setResultView(view) {
  const allowedViews = new Set(["summary", "graph", "panel", "report"]);
  activeResultView = allowedViews.has(view) ? view : "report";
  applyResultView();
  if (activeWorkspaceView !== "graph") {
    setWorkspaceView("graph");
  }
}

function applyResultView() {
  if (!document.body) return;
  document.body.dataset.resultView = activeResultView;
  document.body.classList.remove("result-summary", "result-graph", "result-panel", "result-report");
  ["summary", "graph", "panel", "report"].forEach((view) => {
    document.body.classList.toggle(`result-view-${view}`, activeWorkspaceView === "graph" && activeResultView === view);
  });
  resultViewEls.forEach((button) => {
    const isActive = button.dataset.resultView === activeResultView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

async function applyLanguage(language) {
  const token = ++languageSwitchToken;
  currentLanguage = language === "en" ? "en" : "zh";
  if (languageEl) languageEl.value = currentLanguage;

  const text = getText();
  document.documentElement.lang = currentLanguage === "en" ? "en" : "zh-CN";
  document.title = text.title;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.content = text.metaDescription;

  setText(".brand strong", text.title);
  setText(".brand span:not(.brand-mark)", text.navSubtitle);
  setText(".language-switch span", text.languageLabel);
  setText(".hero-copy h1", text.title);
  setText(".hero-subtitle", text.heroSubtitle);
  document.querySelector(".audience-switch")?.setAttribute(
    "aria-label",
    text.labels.audienceLabel,
  );
  document.querySelector(".view-switch")?.setAttribute(
    "aria-label",
    text.labels.workspaceViewLabel,
  );
  document.querySelector(".language-switch")?.setAttribute(
    "aria-label",
    text.labels.languageSelectorLabel,
  );
  languageEl?.setAttribute("aria-label", text.labels.languageSelectorLabel);
  document.querySelector("#configView")?.setAttribute(
    "aria-label",
    text.labels.workspaceLabel,
  );
  document.querySelector("#resultsView")?.setAttribute(
    "aria-label",
    text.labels.resultsLabel,
  );
  document.querySelector(".config-panel")?.setAttribute(
    "aria-label",
    text.labels.modelPanelTitle,
  );
  document.querySelector(".sandbox-panel")?.setAttribute(
    "aria-label",
    text.labels.offerSandboxLabel,
  );
  document.querySelector("#resultTabs")?.setAttribute(
    "aria-label",
    text.labels.resultViewLabel,
  );
  reportProgressEl?.setAttribute(
    "aria-label",
    text.labels.reportProgressLabel,
  );
  document.querySelector(".summary-export-actions")?.setAttribute(
    "aria-label",
    text.labels.exportReportLabel,
  );
  document.querySelector("#sidebar")?.setAttribute(
    "aria-label",
    text.labels.sidebarLabel,
  );

  document.querySelectorAll(".cap-card").forEach((card, index) => {
    const item = text.caps[index];
    if (!item) return;
    const title = card.querySelector("strong");
    const body = card.querySelector("p");
    if (title) title.textContent = item[0];
    if (body) body.textContent = item[1];
  });

  document.querySelectorAll(".workflow .step-card").forEach((card, index) => {
    const item = text.workflow[index];
    if (!item) return;
    const title = card.querySelector("strong");
    const body = card.querySelector("p");
    if (title) title.textContent = item[0];
    if (body) body.textContent = item[1];
  });

  setText("#config-card-title", text.labels.configCardTitle);
  setText("#config-card-subtitle", text.labels.configCardSubtitle);
  setText("#config-title", text.labels.modelPanelTitle);
  setText("#config-panel-hint", text.labels.modelPanelHint);
  setText("#mockBtn", text.labels.mockBtn);
  setFieldLabel(providerEl, text.labels.provider);
  setFieldLabel(modelEl, text.labels.model);
  setFieldLabel(apiKeyEl, text.labels.apiKey);
  setFieldLabel(baseUrlEl, text.labels.baseUrl);
  setText("#input-title", text.labels.inputTitle);
  setText("#input-card-subtitle", text.labels.inputCardSubtitle);
  setText("#clearBtn", text.labels.clearBtn);
  setFieldLabel(targetRoleEl, text.labels.targetRole);
  setFieldLabel(resumeEl, text.labels.resume);
  setFieldLabel(jobEl, text.labels.job);
  setFieldLabel(contextEl, text.labels.context);
  setFieldLabel(candidateStageEl, text.labels.candidateStage);
  setFieldLabel(targetLevelEl, text.labels.targetLevel);
  setFieldLabel(offerConstraintsEl, text.labels.offerConstraints);
  setText("#generateBtn", text.labels.generateBtn);
  setText("#skill-card-title", text.labels.skillCardTitle);
  setText("#skill-card-subtitle", text.labels.skillHint);
  setText("#feedback-title", text.labels.feedbackTitle);
  setText(".feedback-panel .run-badge", text.labels.runScope);
  setFieldLabel(feedbackAgreementEl, text.labels.agreement);
  setFieldLabel(feedbackQuestionUseEl, text.labels.questionUse);
  setFieldLabel(feedbackDisagreementReasonEl, text.labels.disagreementReason);
  setFieldLabel(feedbackEvidenceSufficiencyEl, text.labels.evidenceSufficiency);
  setFieldLabel(feedbackRiskValidationEl, text.labels.riskValidation);
  setFieldLabel(feedbackNotesEl, text.labels.feedbackNotes);
  setText("#appendFeedbackBtn", text.labels.appendFeedback);
  setText("#report-title", text.labels.reportTitle);
  setText("#decision-summary-title", text.labels.decisionSummaryTitle || (currentLanguage === "en" ? "Decision Summary" : "结果摘要"));
  setText("#interviewer-scorecard-title", text.labels.scorecardTitle || (currentLanguage === "en" ? "Interviewer Scorecard" : "面试官评分表"));
  setText("#graph-title", currentLanguage === "en" ? "Evidence Graph" : "证据关系图谱");
  setText(
    ".graph-head .card-subtitle",
    currentLanguage === "en"
      ? "Click a node to inspect details while preserving report traceability."
      : "节点点击使用弹窗查看详情，并保留报告追溯能力",
  );
  evidenceGraphEl?.setAttribute(
    "aria-label",
    currentLanguage === "en" ? "Evidence Graph" : "证据关系图谱",
  );
  setText("#virtual-panel-title", text.labels.panelChatTitle);
  setText("#downloadMdBtn", text.labels.downloadCandidate);
  setText("#downloadInterviewerBtn", text.labels.downloadInterviewer);
  setText("#downloadOfferBtn", text.labels.downloadOffer);
  setText('[data-audience-mode="candidate"]', currentLanguage === "en" ? "Candidate" : "候选人");
  setText('[data-audience-mode="interviewer"]', currentLanguage === "en" ? "Interviewer" : "面试官");
  setText('[data-workspace-view="workbench"]', currentLanguage === "en" ? "Workbench" : "工作台");
  setText('[data-workspace-view="graph"]', currentLanguage === "en" ? "Graph" : "图谱");
  setText('[data-result-view="report"] .tab-label', currentLanguage === "en" ? "Report Preview" : "报告预览");
  setText('[data-result-view="graph"] .tab-label', currentLanguage === "en" ? "Evidence Graph" : "证据图谱");
  setText('[data-result-view="panel"] .tab-label', currentLanguage === "en" ? "Panel" : "虚拟委员会");
  setText('[data-result-view="summary"] .tab-label', currentLanguage === "en" ? "Summary" : "结果摘要");
  setText(".footer p", text.labels.footer);

  const subPanelHeads = document.querySelectorAll(".sub-panel-head");
  if (subPanelHeads[0]) {
    subPanelHeads[0].querySelector("span").textContent = text.labels.sandbox;
    subPanelHeads[0].querySelector("small").textContent = text.labels.sandboxHint;
  }
  if (subPanelHeads[1]) {
    subPanelHeads[1].querySelector("span").textContent = text.labels.skillTitle;
    subPanelHeads[1].querySelector("small").textContent = text.labels.skillHint;
  }

  setPlaceholder(apiKeyEl, providerEl.value === "mock" ? text.placeholders.apiKeyMock : text.placeholders.apiKeyReal);
  setPlaceholder(baseUrlEl, text.placeholders.baseUrl);
  setPlaceholder(resumeEl, text.placeholders.resume);
  setPlaceholder(jobEl, text.placeholders.job);
  setPlaceholder(contextEl, text.placeholders.context);
  setPlaceholder(targetLevelEl, text.placeholders.targetLevel);
  setPlaceholder(offerConstraintsEl, text.placeholders.offerConstraints);
  setPlaceholder(feedbackNotesEl, text.placeholders.feedbackNotes);

  setOptionText(providerEl, "mock", text.providerOptions.mock);
  setOptionText(providerEl, "openai", text.providerOptions.openai);
  setOptionText(providerEl, "deepseek", text.providerOptions.deepseek);
  setOptionText(providerEl, "qwen", text.providerOptions.qwen);
  setOptionText(providerEl, "kimi", text.providerOptions.kimi);
  setOptionText(providerEl, "custom", text.providerOptions.custom);
  Object.entries(text.roleOptions).forEach(([value, label]) => setOptionText(targetRoleEl, value, label));
  Object.entries(text.stageOptions).forEach(([value, label]) => setOptionText(candidateStageEl, value, label));
  Object.entries(text.feedbackOptions).forEach(([value, label]) => {
    setOptionText(feedbackAgreementEl, value, label);
    setOptionText(feedbackQuestionUseEl, value, label);
    setOptionText(feedbackDisagreementReasonEl, value, label);
    setOptionText(feedbackEvidenceSufficiencyEl, value, label);
    setOptionText(feedbackRiskValidationEl, value, label);
  });

  document.querySelectorAll(".skill-card").forEach((card) => {
    const id = card.querySelector(".skill-toggle")?.value;
    const item = text.skillCards[id];
    if (!item) return;
    const title = card.querySelector("strong");
    const body = card.querySelector("small");
    if (title) title.textContent = item[0];
    if (body) body.textContent = item[1];
  });

  updateModelMode();
  applyCleanChineseCopy();
  refreshInputReadiness();

  if (!currentRun) {
    renderEmptyReport();
    renderStreamProgress("", text.progressWaiting, false);
    renderDecisionSummaryCard(null);
    renderInterviewerScorecard(null);
    renderVirtualPanelChat(null);
    runBadgeEl.textContent = text.runPending;
    setStatus(text.statusReady);
    return;
  }

  currentRun = ensureCanonicalLanguageArtifact(currentRun);
  renderAllOutputSurfaces(getDisplayRun());
  if (isLocalizedArtifactCurrent(currentRun, currentLanguage)) {
    setStatus(text.statusLocalized);
    return;
  }

  if (languageEl) languageEl.disabled = true;
  setStatus(text.statusLocalizing);
  try {
    const localizedRun = await ensureLocalizedArtifact(currentRun, currentLanguage);
    if (token !== languageSwitchToken) return;
    currentRun = localizedRun;
    persistRunCache(currentRun);
    renderAllOutputSurfaces(getDisplayRun());
    setStatus(getText().statusLocalized);
  } catch (error) {
    if (token !== languageSwitchToken) return;
    renderAllOutputSurfaces(getDisplayRun());
    setStatus(
      getText().statusLocalizationFailed(error?.message || String(error)),
      true,
    );
  } finally {
    if (token === languageSwitchToken && languageEl) {
      languageEl.disabled = false;
    }
  }
}

function applyCleanChineseCopy() {
  if (currentLanguage === "en") return;

  document.title = "OfferAgent 面试评估";
  setText(".brand strong", "OfferAgent 面试评估");
  setText(".brand span:not(.brand-mark)", "Offer 沙盘 + 面试官视角库");
  setText('[data-workspace-view="workbench"]', "工作台");
  setText('[data-workspace-view="graph"]', "图谱");
  setText('[data-result-view="report"] .tab-label', "报告预览");
  setText('[data-result-view="graph"] .tab-label', "证据图谱");
  setText('[data-result-view="panel"] .tab-label', "虚拟委员会");
  setText('[data-result-view="summary"] .tab-label', "结果摘要");
  setText("#config-title", "临时配置模型");
  setText("#mockBtn", "填充脱敏样例");
  setText("#input-title", "输入简历与 JD");
  setText("#clearBtn", "清空当前页面");
  setText("#generateBtn", "生成评估报告");
  setText("#feedback-title", "人工反馈");
  setText(".feedback-panel .run-badge", "仅当前页面有效");
  setText("#report-title", "评估报告");
  setText("#decision-summary-title", "结果摘要");
  setText("#interviewer-scorecard-title", "面试官评分表");
  setText("#graph-title", "证据关系图谱");
  setText("#virtual-panel-title", "虚拟面试委员会");
  setText("#downloadMdBtn", "导出 PDF");
  setText("#downloadInterviewerBtn", "导出 PDF");
  setText("#downloadOfferBtn", "导出 Offer 推演 PDF");
  setText('[data-audience-mode="candidate"]', "候选人");
  setText('[data-audience-mode="interviewer"]', "面试官");
  setText("#appendFeedbackBtn", "把反馈写入报告");

  setFieldLabel(providerEl, "模型服务商");
  setFieldLabel(modelEl, "模型名称");
  setFieldLabel(apiKeyEl, "临时 API Key");
  setFieldLabel(baseUrlEl, "代理 / 自定义 Base URL（可选）");
  setFieldLabel(targetRoleEl, "目标岗位");
  setFieldLabel(resumeEl, "候选人简历");
  setFieldLabel(jobEl, "岗位 JD");
  setFieldLabel(contextEl, "公司 / 面试上下文（可选）");
  setFieldLabel(candidateStageEl, "候选人阶段");
  setFieldLabel(targetLevelEl, "目标职级");
  setFieldLabel(offerConstraintsEl, "Offer / 谈薪约束（可选）");
  setFieldLabel(feedbackAgreementEl, "是否同意系统判断");
  setFieldLabel(feedbackQuestionUseEl, "追问是否可采用");
  setFieldLabel(feedbackDisagreementReasonEl, "不同意原因");
  setFieldLabel(feedbackEvidenceSufficiencyEl, "证据是否充分");
  setFieldLabel(feedbackRiskValidationEl, "面试后是否验证风险");
  setFieldLabel(feedbackNotesEl, "人工补充意见");

  setPlaceholder(apiKeyEl, providerEl.value === "mock" ? "Mock Demo 不需要填写 API Key" : "这里只做当前页面调用");
  setPlaceholder(baseUrlEl, "例如 https://your-worker.workers.dev");
  setPlaceholder(resumeEl, "粘贴候选人简历文本。不建议在公共设备输入真实敏感信息。");
  setPlaceholder(jobEl, "粘贴目标岗位 JD。");
  setPlaceholder(contextEl, "例如公司阶段、团队大小、面试关注点、业务背景。");
  setPlaceholder(targetLevelEl, "例如中级产品经理 / 高级开发工程师");
  setPlaceholder(offerConstraintsEl, "例如预算范围、候选人期望、竞品 Offer、到岗时间、团队紧急程度。");
  setPlaceholder(feedbackNotesEl, "记录面试官的人工判断、新风险、被问到但报告遗漏的问题。");

  setOptionText(providerEl, "mock", "Mock Demo");
  setOptionText(providerEl, "openai", "OpenAI 官方接口");
  setOptionText(providerEl, "deepseek", "DeepSeek 官方接口");
  setOptionText(providerEl, "qwen", "通义千问 OpenAI-Compatible");
  setOptionText(providerEl, "kimi", "Kimi 官方接口");
  setOptionText(providerEl, "custom", "代理 / 自定义接口");

  setOptionText(targetRoleEl, "product_manager", "产品经理");
  setOptionText(targetRoleEl, "developer", "开发人员");
  setOptionText(targetRoleEl, "technical_support", "技术支持人员");
  setOptionText(targetRoleEl, "sales", "销售人员");

  setOptionText(candidateStageEl, "简历筛选", "简历筛选");
  setOptionText(candidateStageEl, "一面前", "一面前");
  setOptionText(candidateStageEl, "业务一面", "业务一面");
  setOptionText(candidateStageEl, "二面 / 终面", "二面 / 终面");
  setOptionText(candidateStageEl, "Offer 前", "Offer 前");

  const subPanelHeads = document.querySelectorAll(".sub-panel-head");
  if (subPanelHeads[0]) {
    subPanelHeads[0].querySelector("span").textContent = "Offer 沙盘";
    subPanelHeads[0].querySelector("small").textContent = "用于模拟面试推进、录用风险和谈薪约束";
  }
  if (subPanelHeads[1]) {
    subPanelHeads[1].querySelector("span").textContent = "选择面试官角色";
    subPanelHeads[1].querySelector("small").textContent = "勾选需要参与评估的虚拟面试官，不同角色提供不同视角的追问";
  }

  const skillCopy = {
    hr: ["虚拟 HR 面试官", "深挖动机、岗位偏好、到岗约束和风险边界。"],
    business: ["虚拟业务负责人", "结合 JD 思索业务判断、指标口径和结果归因。"],
    project: ["虚拟项目推进面试官", "结合项目经历深挖里程碑、资源协调和复盘机制。"],
    negotiation: ["虚拟谈薪顾问", "深挖机会选择标准、竞争 Offer、入职概率和谈薪策略。"],
    decision: ["决策层压力官", "用预算削减、战略取舍和 ROI 压力测试判断依据。"],
  };
  document.querySelectorAll(".skill-card").forEach((card) => {
    const id = card.querySelector(".skill-toggle")?.value;
    const copy = skillCopy[id];
    if (!copy) return;
    const title = card.querySelector("strong");
    const body = card.querySelector("small");
    if (title) title.textContent = copy[0];
    if (body) body.textContent = copy[1];
  });

  if (!currentRun && reportEl?.classList.contains("empty")) {
    reportEl.innerHTML = '<div class="empty-state"><span class="empty-mark">OA</span><h3>等待生成评估报告</h3><p>报告会覆盖岗位匹配、Offer 沙盘推演、面试官候选问题库、证据链、图谱和人工反馈建议，并支持导出 PDF。</p></div>';
    runBadgeEl.textContent = "尚未生成";
    setStatus("准备就绪。未配置 Key 时会使用 Mock Demo。");
  }
  updateModelMode();
}
function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setFieldLabel(control, value) {
  const label = control?.closest("label");
  const span = Array.from(label?.children || []).find((child) => child.tagName === "SPAN");
  if (span) span.textContent = value;
}

function setPlaceholder(control, value) {
  if (control) control.placeholder = value;
}

function setOptionText(select, value, label) {
  const option = Array.from(select?.options || []).find((item) => item.value === value);
  if (option) option.textContent = label;
}

function renderEmptyReport() {
  reportEl.className = "report report-content empty";
  reportEl.innerHTML = `<div class="empty-state">
    <span class="empty-mark">OA</span>
    <h3>${escapeHtml(getText().emptyTitle)}</h3>
    <p>${escapeHtml(getText().emptyText)}</p>
  </div>`;
  renderEvidenceGraph(null);
}

function buildPdfFilename(run, audience) {
  const language = currentLanguage === "en" ? "en" : "zh";
  const labels = (i18n[language] || i18n.zh).fileNames;
  return `${labels[audience] || labels.candidate}-${run.id}.pdf`;
}

function collectFeedback() {
  return {
    agreement: feedbackAgreementEl.value,
    question_use: feedbackQuestionUseEl.value,
    disagreement_reason: feedbackDisagreementReasonEl.value,
    evidence_sufficiency: feedbackEvidenceSufficiencyEl.value,
    risk_validation: feedbackRiskValidationEl.value,
    notes: feedbackNotesEl.value.trim(),
    updated_at: new Date().toISOString(),
  };
}

function buildHumanFeedbackMarkdown(run) {
  const feedback = run?.human_feedback;
  if (!feedback) return "";

  if (currentLanguage === "en") {
    return `## Human Feedback

| Item | Feedback |
| --- | --- |
| Agreement with system judgment | ${feedback.agreement || "Not provided"} |
| Question usability | ${feedback.question_use || "Not provided"} |
| Disagreement reason | ${feedback.disagreement_reason || "Not provided"} |
| Evidence sufficiency | ${feedback.evidence_sufficiency || "Not provided"} |
| Risk validation after interview | ${feedback.risk_validation || "Not provided"} |
| Notes | ${feedback.notes || "Not provided"} |
| Updated at | ${feedback.updated_at || "Not provided"} |`;
  }

  return `## 人工反馈记录

| 项目 | 反馈 |
| --- | --- |
| 是否同意系统判断 | ${feedback.agreement || "未提供"} |
| 追问是否可采用 | ${feedback.question_use || "未提供"} |
| 不同意原因 | ${feedback.disagreement_reason || "未提供"} |
| 证据是否充分 | ${feedback.evidence_sufficiency || "未提供"} |
| 面试后是否验证风险 | ${feedback.risk_validation || "未提供"} |
| 人工补充意见 | ${feedback.notes || "未填写"} |
| 记录时间 | ${feedback.updated_at || "未提供"} |`;
}
function appendFeedbackToReport(report, feedback) {
  const marker = "## 人工反馈记录";
  const feedbackMarkdown = `${marker}

- 是否同意系统判断：${feedback.agreement || "未提供"}
- 追问是否可采用：${feedback.question_use || "未提供"}
- 不同意原因：${feedback.disagreement_reason || "未提供"}
- 证据是否充分：${feedback.evidence_sufficiency || "未提供"}
- 面试后是否验证风险：${feedback.risk_validation || "未提供"}
- 人工补充意见：${feedback.notes || "未填写"}
- 记录时间：${feedback.updated_at || "未提供"}

### 建议回填到题库
- 将实际被问到但报告遗漏的问题，回填到“面试官候选问题库”。
- 将被证实或被推翻的证据，更新到证据可信度等级。
- 将新暴露的失败复盘、冲突处理、指标口径问题，更新到“风险与待验证”。`;

  if (report.includes(marker)) {
    return report.replace(new RegExp(`${marker}[\\s\\S]*$`), feedbackMarkdown);
  }

  return `${report.trim()}\n\n${feedbackMarkdown}`;
}
function enrichEvaluationRun(run) {
  const snapshot = normalizeSnapshot(run.input_snapshot || {});
  const requirementRows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, requirementRows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const feedback = run.human_feedback || null;
  const offerSimulationRun = buildOfferSimulationRun(run, snapshot, gate, offerLeverage, requirementRows, feedback);
  const feedbackDistillation = buildFeedbackDistillation(feedback, requirementRows, snapshot);
  const virtualPanel = buildVirtualInterviewPanel(snapshot, requirementRows, gate);
  const panelDiscussionRounds = buildPanelDiscussionRounds(virtualPanel, requirementRows, gate, offerLeverage, feedback);
  const moderatorSummary = buildModeratorSummary(virtualPanel, panelDiscussionRounds, gate, offerLeverage, feedback);
  const interviewQuestions = buildStructuredInterviewQuestions(snapshot, requirementRows, feedback);
  const decisionSummary = buildDecisionSummaryCards({
    evaluation_summary: buildEvaluationSummary(gate, requirementRows, offerLeverage, feedback),
    requirement_matches: buildRequirementMatches(requirementRows),
    interview_questions: interviewQuestions,
    offer_simulation_run: offerSimulationRun,
    feedback_distillation: feedbackDistillation,
  });
  const interviewerScorecard = buildInterviewerScorecardRows({
    requirement_matches: buildRequirementMatches(requirementRows),
    interview_questions: interviewQuestions,
    feedback_distillation: feedbackDistillation,
  });

  return {
    ...run,
    input_snapshot: {
      ...snapshot,
      selected_skills: snapshot.selected_skills || [],
    },
    evaluation_summary: buildEvaluationSummary(gate, requirementRows, offerLeverage, feedback),
    requirement_matches: buildRequirementMatches(requirementRows),
    interview_questions: interviewQuestions,
    decision_summary_cards: decisionSummary,
    interviewer_scorecard_rows: interviewerScorecard,
    top_follow_up_questions: interviewQuestions
      .filter((question) => /待|补齐|验证|pending|missing|weak/i.test(`${question.evaluation_goal} ${question.expected_signal}`))
      .slice(0, 3),
    offer_sandbox: buildStructuredOfferSandbox(snapshot, gate, offerLeverage, requirementRows),
    evidence: buildStructuredEvidence(snapshot, requirementRows),
    structured_evaluation: buildStructuredEvaluation(snapshot, requirementRows, gate, offerLeverage, feedback),
    skill_registry: buildSkillRegistry(snapshot, requirementRows),
    virtual_panel: virtualPanel,
    panel_discussion_rounds: panelDiscussionRounds,
    moderator_summary: moderatorSummary,
    offer_simulation_run: offerSimulationRun,
    evidence_graph: buildEvidenceGraph(snapshot, requirementRows, feedback, virtualPanel, panelDiscussionRounds),
    feedback_distillation: feedbackDistillation,
  };
}

function buildSystemPrompt(language = "zh") {
  if (language !== "en") return systemPrompt;
  return `${systemPrompt}

Additional output-language requirement:
- Generate the entire report in English.
- Translate all headings, table headers, labels, statuses, evidence levels, recommendations, interviewer roles, and follow-up questions into English.
- Keep the same decision logic and evidence constraints as the Chinese prompt.
- Do not mix Chinese section titles into the English report unless quoting source material from the user.`;
}

function buildLlmUserPrompt(input) {
  const roleLabel = getRoleLabel(input.targetRole, input.language);
  const roleProfile = getRoleProfile(input.targetRole);
  if (input.language === "en") {
    return `# Output Language
English

# Target Role
${roleLabel}

# Role Evaluation Focus
${roleProfile.summaryEn}

# Resume
${input.resume}

# Job Description
${input.jobDescription}

# Company / Interview Context
${input.companyContext || "None"}

# Offer Sandbox Context
Candidate stage: ${input.language === "en" ? translateStage(input.candidateStage) : input.candidateStage}
Target level: ${input.targetLevel || "Not provided"}
Offer / negotiation constraints: ${input.offerConstraints || "Not provided"}

# Selected Interviewer Lenses
${formatSelectedSkills(input.selectedSkills)}`;
  }

  return `# 目标岗位
${roleLabel}

# 岗位评估重点
${roleProfile.summary}

# 简历
${input.resume}

# JD
${input.jobDescription}

# 公司 / 面试上下文
${input.companyContext || "无"}

# Offer 沙盘上下文
候选人阶段：${input.candidateStage}
目标职级：${input.targetLevel || "未提供"}
Offer / 谈薪约束：${input.offerConstraints || "未提供"}

# 已选择面试官视角
${formatSelectedSkills(input.selectedSkills)}`;
}

function generateMockReport(input) {
  const snapshot = normalizeSnapshot(input);
  const roleProfile = getRoleProfile(snapshot.target_role);
  const roleLabel = getRoleLabel(snapshot.target_role, "zh");
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const hiddenPains = buildJdHiddenPainRows(snapshot);
  const hasOfferRisk = /薪|预算|竞品|offer|Offer|到岗|期望|涨幅|入职|稳定/i.test(
    `${snapshot.resume} ${snapshot.company_context} ${snapshot.offer_constraints}`,
  );
  const skillQuestions = buildSkillQuestionMarkdown(input.selectedSkills, input);
  const matchLevel = gate.matchedCount >= 5 ? "高匹配" : gate.matchedCount >= 3 ? "中等匹配" : gate.matchedCount >= 1 ? "低匹配但可转岗验证" : "低匹配";
  const hasB2B = /B\s*端|SaaS|企业|客户|工单|CRM|行业|平台|系统/i.test(`${snapshot.resume} ${snapshot.job_description}`);
  const match = `${gate.result}：${gate.summary}`;
  const canEnterSandbox = gate.enterSandbox;
  const offerReadiness = canEnterSandbox && !hasOfferRisk ? "可继续推进面试验证" : "需要先补齐关键证据与动机信息";
  const packagingRisk = gate.matchedCount >= 4
    ? "简历与 JD 表面匹配度较高，需要提高反包装追问强度，验证真实角色、失败细节和指标口径。"
    : "当前材料尚未形成高匹配闭环，优先补齐项目证据和能力迁移证据。";

  return `# 面试准备报告

## 一页摘要

| 模块 | 结论 | 候选人准备动作 |
| --- | --- | --- |
| 目标岗位 | ${roleLabel} | ${roleProfile.summary} |
| 岗位匹配倾向 | ${match} | 用 2 个项目证明 JD 核心职责 |
| 项目匹配闸口 | ${gate.result} | ${gate.nextStep} |
| 证据可信度 | ${buildEvidenceSummary(rows)} | 面试中优先补一级证据和可复核口径 |
| 最大亮点 | ${gate.bestEvidence} | 准备项目背景、目标、动作、结果 |
| 最大风险 | “负责 / 主导 / 推动”仍需还原真实角色、决策过程和结果归因 | 准备个人贡献证据和关键决策过程 |
| Offer 沙盘 | 候选人当前处于“${input.candidateStage}”阶段，${offerReadiness} | 提前梳理动机、期望和到岗约束 |
| 谈判杠杆 | ${offerLeverage.rating}：${offerLeverage.summary} | 准备可量化溢价依据 |
| 过度包装风险 | ${packagingRisk} | 准备可被追溯的细节证据、失败案例和现场推演回答 |
| 必问重点 | 需求判断、指标口径、优先级取舍、跨团队推进、项目复盘和入职动机 | 按问题库做模拟面试 |

## 招聘岗位分析

| 结论 | 证据 | 详细说明 | 下一步 |
| --- | --- | --- | --- |
| 企业正在招聘 ${roleLabel} | JD 证据：${clip(input.jobDescription)} | ${roleProfile.summary} | 按该岗位能力项准备最接近 JD 的项目 |
| 企业需要候选人具备项目闭环能力 | JD 中出现产品规划、推进、复盘或生命周期相关要求 | 仅说“参与/负责”不够，需要讲清从需求到上线复盘的闭环 | 准备完整项目链路 |
| 当前简历与岗位职责匹配程度：${matchLevel} | 简历证据：${clip(input.resume)} | 当前匹配度来自行业线索、指标线索和跨团队推进线索三类证据 | 补齐缺失证据并准备追问 |

## JD 隐性痛点解码

| JD 软性表达 | 可能对应的业务压力源 | 候选人应准备的证明 |
| --- | --- | --- |
${hiddenPains.map((row) => `| ${row.phrase} | ${row.pressure} | ${row.prep} |`).join("\n")}

## 分析结果

| 结论 | 证据 | 详细说明 |
| --- | --- | --- |
| 当前阶段建议先完成项目匹配闸口 | JD 与简历均提供了岗位相关材料 | 不直接给最终录用结论，先验证项目证据 |
| 关键不确定性集中在个人贡献、指标口径和复盘深度 | 简历中存在负责、主导、推动等表述 | 需要通过追问还原真实角色和结果归因 |

## 项目匹配闸口

| JD 职责证据要求 | 候选人项目证据 | 证据等级 | 闸口判断 |
| --- | --- | --- | --- |
${rows.map((row) => `| ${row.capability} | ${row.resumeEvidence} | ${row.evidenceLevelLabel}：${row.evidenceReason} | ${row.matchStatus} |`).join("\n")}

| 闸口结论 | 说明 | 下一步 |
| --- | --- | --- |
| ${gate.result} | ${gate.summary} | ${gate.nextStep} |

${gate.result.includes("条件性进入") ? `### 条件性进入与能力迁移论证

| 使用场景 | 能力迁移话术 | 面试验证重点 |
| --- | --- | --- |
| 转岗适配开场 | ${gate.transferPitch} | 要求候选人用一个真实项目证明复杂场景、项目推进和技术/业务取舍可以迁移到 JD 场景 |` : ""}

## 岗位匹配

| JD 能力要求 | 当前证据 | 证据可信度 | 面试官追问方向 |
| --- | --- | --- | --- |
${rows.map((row) => `| ${row.capability} | ${row.jdEvidence} | ${row.evidenceLevelLabel} | ${row.verificationQuestion} |`).join("\n")}

## 项目亮点

- ${gate.bestEvidence}
- 若候选人确实主导需求判断、方案设计和跨团队落地，需要用一级证据补齐指标口径和个人贡献。
- 对于跨行业候选人，重点包装“复杂场景需求分析、技术方案取舍、研发协同、客户沟通”这些可迁移能力。

## 风险与待验证

- 项目成果可能是团队成果，需要确认候选人的个人贡献。
- 指标改善需要确认统计口径、前后对比周期和候选人的具体动作。
- “主导 / 负责”需要拆解为需求判断、优先级取舍、推动过程和复盘结果。
- 高匹配反包装风险：${packagingRisk}
- Offer 侧风险：${hasOfferRisk ? "存在预算、期望、竞争机会或到岗时间相关信息，需在面试后段进一步确认。" : "暂未发现明确 Offer 侧约束，但仍需验证候选人动机和到岗意愿。"}

## Offer 沙盘推演

- 当前阶段：${input.candidateStage}。
- 目标职级：${input.targetLevel || "未提供，建议面试前明确职级锚点。"}
- 沙盘进入条件：${gate.result}，${canEnterSandbox ? "可进入下一轮沙盘验证细节。" : "沙盘仅作为候选人补证准备，不建议直接推进。"}
- 推进建议：先完成项目匹配闸口，再进入动机、薪资和到岗可行性确认。
- 录用前关键门槛：个人贡献证据、指标口径、跨团队推动案例、岗位动机和期望匹配。
- 谈薪 / Offer 约束：${input.offerConstraints || "未提供，建议补充预算范围、候选人期望、竞争 Offer 和到岗时间。"}
- 候选人谈判杠杆识别：${offerLeverage.rating}。${offerLeverage.detail}
- 沙盘下一步：根据面试回答更新“岗位匹配、项目可信度、入职概率、谈薪风险”四个状态。

## 必问追问

1. 这个项目最初要解决的真实用户问题是什么？你如何判断它不是伪需求？
2. 你提到的结果指标具体口径是什么？上线前后的对比周期如何定义？
3. 如果研发资源不足，你当时砍掉或延后的需求是什么？依据是什么？
4. 项目推进中最大的跨团队阻力是什么？你具体做了哪些推动动作？
5. 请复盘一次项目延期或线上故障，按时间线说明故障发现、止血决策、根因分析、影响范围、长线整改，以及后续项目中具体改变了什么机制。
6. 复盘这个项目，如果重新做一次，你会改变哪个关键决策？

## 候选人准备重点

| 准备模块 | 候选人要准备什么 | 输出形式 |
| --- | --- | --- |
| 项目讲述 | 每个核心项目的背景、目标、约束、动作、结果、复盘 | 2 分钟 STAR 版本 + 5 分钟展开版本 |
| 证据补齐 | 数字结果的指标口径、统计周期、对照组和个人动作 | 指标说明卡 |
| 表达演练 | 围绕 JD 核心职责准备 2 到 3 个证明匹配度的项目故事 | 模拟问答稿 |
| 风险预案 | 个人贡献、项目失败、跨团队冲突、Offer 动机等高频追问 | 真实回答要点 |

## 候选人策略建议

| 策略模块 | 当前判断 | 候选人打法 |
| --- | --- | --- |
| 优势放大 | ${gate.bestEvidence} | 主动把最强项目讲成“问题判断、方案取舍、推进落地、指标复盘”的闭环，不只复述职责 |
| 缺证表达 | ${gate.result.includes("不匹配") ? "核心项目证据不足" : "部分能力仍缺少一级证据"} | 不造假补经历，改为说明相似项目、已掌握方法和入职后补齐行业认知的计划 |
| 主动引导 | 面试官最可能追问个人贡献、指标口径和失败复盘 | 自我介绍后主动抛出一个最贴近 JD 的项目，引导进入可证明能力的细节 |
| 回答框架 | STAR 不够，需要补充指标口径和取舍逻辑 | 每个项目按背景、目标、约束、个人动作、结果、复盘、下次会改什么组织 |
| 谈薪 / 动机 | ${offerLeverage.rating}：${offerLeverage.summary} | 把期望和动机绑定到职责完整度、成长空间、到岗确定性和可量化贡献 |

## 面试官候选问题库（供挑选）

### A. 岗位要求验证问题

| JD 职责 | 项目经历锚点 | 问题 | 验证目的 |
| --- | --- | --- | --- |
| 核心能力匹配 | 最贴近 JD 的项目 | JD 要求你具备的核心能力中，哪一项证据最强？请用一个项目说明。 | 验证岗位职责与项目证据是否一致 |
| ${hasB2B ? "B 端 / SaaS 场景" : "目标业务场景"} | 相似业务项目 | 你过去最相似的项目是什么？相似点和差异点分别是什么？ | 验证场景迁移能力 |
| 入职后优先级判断 | 过往项目取舍案例 | 如果入职后第一个月只能完成一件最关键的事，你会如何判断优先级？ | 验证职责落地能力 |
| 指标拆解与推进 | 指标项目或复盘案例 | 请举例说明你如何把岗位目标拆成可衡量指标。 | 验证指标意识和推动动作 |
| 失败复盘与机制沉淀 | 延期、线上故障或冲突项目 | 请按时间线还原一次真实事故或延期，并说明后续机制如何改变。 | 验证真实性、抗压能力和复盘深度 |

### B. 项目经历追问

1. 你在项目中的真实角色是什么：负责人、核心参与者还是协作支持？哪些决策由你做出？
2. 项目开始时的业务目标、用户问题和约束条件分别是什么？
3. 项目过程中最大的风险是什么？你是提前识别的，还是问题发生后处理的？
4. 项目结果中哪些是你个人动作直接带来的，哪些更依赖团队或外部条件？
5. 请选择一次项目延期或线上故障，按发现、止血、根因、整改、机制变化五步复盘。

### C. 项目经理 / 推进视角问题

1. 你如何拆解项目里程碑？哪些节点最容易延期，为什么？
2. 当研发、设计、运营或客户方目标不一致时，你如何推进共识？
3. 如果关键资源被临时抽走，你会如何调整范围、节奏和沟通预期？
4. 项目上线后你如何组织复盘？哪些结论进入了后续机制或产品迭代？

### D. 候选人使用方式

- 候选人可用这些问题做模拟面试，检查项目讲述是否完整。
- 面试官可从问题库中挑选最贴近 JD 的问题，避免泛泛提问。
- 每个问题都应回到候选人的项目证据、岗位职责和个人贡献。

### E. 高匹配反包装追问

| JD 职责 | 项目经历锚点 | 反包装问题 | 观察信号 |
| --- | --- | --- | --- |
| 负责产品规划与生命周期 | 候选人声称主导的项目 | 请画出从需求发现到上线复盘的关键决策链。 | 能否说清每个决策的输入、取舍和责任人 |
| 指标复盘与质量控制 | 有数字结果的项目 | 项目里哪一个指标最容易被误读？你当时如何定义口径？ | 是否能解释统计周期、样本范围和归因边界 |
| 成本、进度、资源控制 | 跨团队推进项目 | 如果现在把研发资源砍掉 40%，你会保留和放弃哪些能力？ | 是否能基于目标、风险和用户价值做取舍 |
| 复杂问题解决 | 失败或延期项目 | 请讲一个该项目中你判断错误或推进失败的细节。 | 是否只有完美叙事，缺少真实反思 |
| 方案设计与现场应变 | 最匹配 JD 的项目 | 面试官现场给一个新约束，你如何调整原方案？ | 是否能临场拆解问题并形成可执行方案 |

## 面试官决策辅助

| 决策项 | 结论 | 证据 | 面试动作 |
| --- | --- | --- | --- |
| 推荐等级 | ${buildInterviewerRecommendation(gate).level} | ${gate.summary} | ${buildInterviewerRecommendation(gate).action} |
| 能不能干活 | ${gate.matchedCount >= 4 ? "有较强可能，但需复核真实贡献" : gate.matchedCount >= 2 ? "可能能做相邻场景，需要验证迁移边界" : "当前证据不足"} | ${buildEvidenceSummary(rows)} | 用最强项目追问需求、方案、研发协同、上线和复盘 |
| 水分风险 | ${packagingRisk} | 简历中“负责 / 主导 / 推动”等表述需要还原 | 要求候选人现场画流程、拆指标、复盘失败 |
| 团队适配 | 待验证 | 公司上下文：${input.companyContext ? clip(input.companyContext) : "未提供"} | 追问协作风格、冲突处理、节奏适应和升级机制 |
| Offer 接受概率 | ${hasOfferRisk ? "中 / 待验证" : "待验证"} | ${input.offerConstraints || "未提供 Offer / 谈薪约束"} | 面试后更新薪资期望、竞对机会、到岗时间和岗位偏好 |

### 结构化评分卡

${buildInterviewerScorecard(snapshot)}

### 红灯 / 绿灯信号

${buildInterviewerSignalTable(snapshot)}

### 追问路径图

${buildInterviewerFollowupPaths(snapshot)}

## 面试官一分钟速览

${buildInterviewerQuickBrief(snapshot)}

## 候选人画像

${buildCandidateProfile(snapshot)}

## 角色分化面试官模块

${buildRoleAwareInterviewerModules(snapshot)}

## 面试轮次信息传递卡

${buildInterviewHandoffCard(snapshot)}

## 面试后评估

${buildPostInterviewEvaluationTemplate(snapshot)}

## 面试官视角库

${skillQuestions}

## 证据链

${buildEvidenceChainTable(snapshot)}

## 人工反馈建议

- 面试官是否同意岗位匹配倾向：同意 / 部分同意 / 不同意。
- 系统生成问题是否被采用：采用 / 改写采用 / 未采用。
- 风险点是否在面试中被验证：已验证 / 部分验证 / 未验证。
- 需要补充的岗位标准或公司偏好：请人工填写。

## 动态校准指令

| 回填字段 | 记录内容 | 迭代动作 |
| --- | --- | --- |
| 实际被问问题 | 记录面试中出现但报告遗漏的高频问题 | 回填到面试官候选问题库，形成该岗位专属题库 |
| 证据验证结果 | 标记哪些简历证据被证实、被推翻或仍待验证 | 更新证据等级和闸口判断 |
| 新暴露风险 | 记录候选人在故障复盘、冲突处理、指标口径上的卡点 | 加入风险与待验证、候选人准备重点 |
| Offer 变化 | 记录薪资期望、竞对 Offer、到岗时间、职级偏好变化 | 更新谈判杠杆评级和沙盘推进建议 |
`;
}

function generateMockReportEn(input) {
  const snapshot = normalizeSnapshot({ ...input, language: "en" });
  const roleProfile = getRoleProfile(snapshot.target_role);
  const roleLabel = getRoleLabel(snapshot.target_role, "en");
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const hiddenPains = buildJdHiddenPainRows(snapshot);
  const evidenceSummary = summarizeEvidenceCounts(rows);
  const localizeResumeEvidence = (value) => (
    isGeneratedSourcePlaceholder(value)
      ? translateGeneratedText(value, "en")
      : value
  );
  const requirementRows = rows
    .map((row) => `| ${translateCapability(row.capability)} | ${row.jdEvidence} | ${localizeResumeEvidence(row.resumeEvidence)} | ${translateEvidenceLevel(row.evidenceLevel)} | ${translateMatchStatus(row)} |`)
    .join("\n");
  const gapRows = rows
    .filter((row) => row.isMissing || row.evidenceLevel > 1)
    .slice(0, 5)
    .map((row) => `| ${translateCapability(row.capability)} | ${localizeResumeEvidence(row.resumeEvidence)} | ${translateEvidenceLevel(row.evidenceLevel)} | Ask for metric definition, decision chain, personal contribution, and retrospective evidence. |`)
    .join("\n");
  const painRows = (hiddenPains.length ? hiddenPains : [
    { phrase: "strong pressure tolerance", pressure: "urgent releases, resource constraints, customer escalations, or shifting priorities", prep: "Prepare one incident or delay retrospective with timeline and corrective actions" },
    { phrase: "business sense", pressure: "ambiguous requirements, prioritization, ROI trade-offs, and opportunity judgment", prep: "Prepare one project where you rejected or reshaped a requirement" },
    { phrase: "communication and coordination", pressure: "cross-functional conflict, engineering capacity competition, customer requirement changes", prep: "Prepare stakeholder map, escalation path, and final decision logic" },
  ])
    .map((row) => `| ${row.phrase} | ${translateGeneratedText(row.pressure, "en")} | ${translateGeneratedText(row.prep, "en")} |`)
    .join("\n");
  const gateSummary = `${gate.matchedCount}/${rows.length} core requirement evidence items found. ${gate.enterSandbox ? "The candidate can enter the next validation round with explicit evidence checks." : "Do not move into the next sandbox round before stronger project evidence is provided."}`;

  return `# Interview Preparation Report

## One-Page Summary

| Module | Conclusion | Evidence | Next Step |
| --- | --- | --- | --- |
| Target role | ${roleLabel} | ${roleProfile.summaryEn} | Prepare evidence against this role profile. |
| Project match gate | ${translateGateResult(gate.result)} | ${gateSummary} | ${gate.enterSandbox ? "Proceed to evidence validation, anti-packaging questions, and offer constraints." : "Request complete project-loop evidence before further interview simulation."} |
| Evidence credibility | ${evidenceSummary} | Resume snapshot: ${clip(input.resume)} | Prioritize first-level evidence: denominator, period, before/after comparison, and direct contribution. |
| Key strength | ${gate.bestEvidence} | Resume evidence | Convert the strongest project into a problem, target, constraint, action, result, and retrospective story. |
| Key risk | Personal contribution and metric definitions are not fully proven. | JD snapshot: ${clip(input.jobDescription)} | Ask follow-up questions on role boundary, metric ownership, failure details, and decision chain. |
| Offer leverage | ${translateOfferRating(offerLeverage.rating)} | ${translateGeneratedText(offerLeverage.summary, "en")} | Use only verifiable impact, scarce domain knowledge, competing offers, or start-date certainty as leverage. |

## JD Hidden Pain Point Decoding

| JD Phrase | Hidden Pressure Source | Candidate Preparation |
| --- | --- | --- |
${painRows}

## Project Match Gate

| JD Evidence Requirement | JD Evidence | Candidate Project Evidence | Evidence Level | Gate Judgment |
| --- | --- | --- | --- | --- |
${requirementRows}

| Gate Result | Detail | Next Step |
| --- | --- | --- |
| ${translateGateResult(gate.result)} | ${gateSummary} | ${gate.enterSandbox ? "Enter the next sandbox round with explicit validation questions." : "Pause progression and request stronger project evidence."} |

## Conditional Entry and Capability Transfer

| Scenario | Transfer Pitch | Validation Focus |
| --- | --- | --- |
| Cross-domain adaptation | Although my previous projects may not fully match the target industry, I have handled complex B2B systems involving requirement discovery, stakeholder coordination, technical trade-offs, delivery, and retrospective learning. I would use one complete project to show how these capabilities transfer to this role. | Validate industry learning plan, customer requirement analysis, technical solution guidance, and engineering collaboration depth. |

## Role Match

| Capability | Current Evidence | Credibility | Follow-Up Question |
| --- | --- | --- | --- |
${rows.map((row) => `| ${translateCapability(row.capability)} | ${localizeResumeEvidence(row.resumeEvidence)} | ${translateEvidenceLevel(row.evidenceLevel)} | ${translateVerificationQuestion(row)} |`).join("\n")}

## Project Highlights

- Strongest available evidence: ${gate.bestEvidence}
- If the candidate truly owned requirement judgment, solution design, and cross-functional delivery, the interview should force metric definitions and personal contribution boundaries.
- For cross-domain candidates, focus on transferable capabilities: complex scenario analysis, technical trade-offs, customer communication, engineering collaboration, delivery risk control, and retrospective mechanisms.

## Risks and Validation Needed

| Risk | Evidence | Why It Matters | Next Step |
| --- | --- | --- | --- |
${gapRows || "| Evidence gap | No major missing row detected, but anti-packaging verification is still required. | High surface match can still hide team-only contribution. | Ask for metric denominator, failure detail, and decision ownership. |"}

## Offer Simulation

| Item | Current Judgment | Next Step |
| --- | --- | --- |
| Candidate stage | ${translateStage(input.candidateStage)} | Decide whether this is screening, business validation, final validation, or negotiation. |
| Target level | ${input.targetLevel || "Not provided"} | Align level expectations before offer discussion. |
| Offer constraints | ${input.offerConstraints || "Not provided"} | Add budget range, competing offers, start date, and role preference before negotiation. |
| Negotiation leverage | ${translateOfferRating(offerLeverage.rating)} | ${translateGeneratedText(offerLeverage.detail, "en")} |
| Gate status | ${translateGateResult(gate.result)} | ${gate.enterSandbox ? "Continue validation." : "Do not push to offer before evidence is strengthened."} |

## Must-Ask Follow-Up Questions

1. What was the real user or business problem behind your strongest project, and how did you prove it was not a fake requirement?
2. How exactly was the result metric defined? Please explain denominator, period, before/after comparison, and your direct contribution.
3. When engineering capacity was limited, what did you cut, delay, or protect, and why?
4. What was the biggest cross-functional blocker, and what concrete actions did you personally take?
5. Reconstruct one project delay or production incident by timeline: discovery, containment, ownership split, root cause, customer or business impact, long-term fix, and mechanism changes such as longer gray release, monitoring dashboard, approval flow, or rollback plan.

## Candidate Preparation Priorities

| Priority | What To Prepare | Output |
| --- | --- | --- |
| Project story | Background, goal, constraints, action, result, retrospective | 2-minute STAR version and 5-minute deep-dive version |
| Evidence upgrade | Metric definition, denominator, period, comparison group, personal decision | Evidence card for each core project |
| Expression rehearsal | Self-introduction, role match, project narrative, motivation, and offer constraints | Mock interview script |
| Risk plan | Failure case, conflict case, incident review, motivation, salary and start-date questions | Honest answer bullets without fabrication |

## Interviewer Question Bank

| Question | JD Responsibility | Project Anchor | Validation Purpose | Risk Signal |
| --- | --- | --- | --- | --- |
| Which project best proves your fit for this JD, and why? | Core role match | ${clip(input.resume)} | Verify semantic fit, not keyword overlap. | Generic answer or no specific project. |
| Explain one requirement you rejected or reshaped. | Requirement analysis and prioritization | Candidate's strongest project | Validate product judgment and trade-off logic. | Only describes execution, not decision. |
| Draw the project milestone and risk map. | Project delivery and coordination | Delivery project | Validate PM / PMO capability. | Cannot name dependencies or escalation path. |
| Reconstruct a delay or incident by timeline. | Risk control and retrospective | Failure or conflict case | Detect over-packaging and real ownership. | Claims no failure or conflict ever occurred. |
| If budget is cut by half, how do you reorder priorities? | Strategic trade-off and ROI | Target role scenario | Test executive pressure judgment. | Uses preference instead of metrics. |

## Interviewer Lens Library

| Role | Focus | Deep Question | Good Answer Should Prove | Risk Signal |
| --- | --- | --- | --- | --- |
| HR Interviewer | Motivation, stability, start date, salary risk | Why this role now, and what trade-off would make you decline it? | Clear motivation and explicit constraints. | Motivation is vague or purely salary-driven. |
| Business Owner | Business understanding and result attribution | How did you connect customer pain to business metric? | Business logic and metric ownership. | Only describes features shipped. |
| Product Lead | Planning, lifecycle, product quality | What did you prioritize for MVP and what did you intentionally not build? | Product sense and lifecycle judgment. | Cannot explain trade-off criteria. |
| Project / PMO Interviewer | Milestones, resources, risks | Where did the project almost slip, and how did you intervene? | Risk detection and coordination behavior. | No concrete blockers or actions. |
| Executive Pressure Officer | Strategic trade-off and ROI | If your module loses half its budget, what do you keep, cut, and defend with metrics? | Decision quality under resource pressure. | Avoids trade-off or lacks metrics. |

## Evidence Chain

| Evidence Source | Evidence Level | Supports Which Judgment | Still Needs Validation |
| --- | --- | --- | --- |
| Resume | Medium to pending unless metrics are verified | Project match, role match, candidate strengths | Metric definitions, contribution boundary, failure detail |
| JD | High for role requirements | Capability matrix and gate criteria | Which requirements are must-have versus nice-to-have |
| Company / interview context | Medium | Offer risk and team fit | Team urgency, budget range, interviewer preference |
| Offer constraints | Medium to pending | Negotiation leverage and acceptance probability | Competing offers, start date, compensation expectation |

## Human Feedback Suggestions

- Does the interviewer agree with the project match gate?
- Which evidence was confirmed, disproved, or still pending?
- Which follow-up questions exposed the key risk?
- Should the candidate enter the next round?
- What is the single most important issue for the next interviewer?

## Dynamic Calibration Instruction

| Feedback Field | What To Capture | Iteration Action |
| --- | --- | --- |
| Missing real interview questions | Questions asked in the interview but absent from this report | Add to the role-specific question bank |
| Newly exposed risk | Weak answers, missing evidence, or new contradictions | Update risk list and evidence level |
| Effective ad-hoc questions | Interviewer follow-ups that worked well | Promote to high-frequency follow-up library |
| Inaccurate match judgment | Where the report over- or under-estimated fit | Calibrate the prompt and gate logic |
| Low-value questions | Questions proven ineffective | Lower weight or remove from the library |`;
}

async function streamMockReport(input) {
  const report = input.language === "en" ? generateMockReportEn(input) : generateMockReport(input);
  await streamMarkdownByBlocks(report, (partial) => {
    renderStreamingReport(partial, getText().mockStreaming);
  }, 320);
  return report;
}

async function streamMarkdownByBlocks(markdown, onDelta, delayMs = 220) {
  const blocks = splitReportBlocks(markdown);
  let partial = "";

  for (const block of blocks) {
    partial = partial ? `${partial}\n\n${block}` : block;
    onDelta(partial);
    await delay(delayMs);
  }
}

function splitReportBlocks(markdown) {
  return markdown.trim().split(/\n(?=## )/).filter(Boolean);
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function clip(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 160 ? `${clean.slice(0, 160)}...` : clean;
}

function collectSelectedSkills() {
  const selected = skillToggleEls.filter((item) => item.checked).map((item) => item.value);
  const defaults = selected.length ? selected : ["hr", "business", "project"];
  return Array.from(new Set([...defaults, "decision"]));
}

function updateModelMode() {
  const useRealModel = providerEl.value !== "mock" && Boolean(apiKeyEl.value.trim());
  modelModeEl.textContent = useRealModel ? getText().modeReal : getText().modeMock;
  modelModeEl.classList.toggle("active", useRealModel);
}

function riskToneClass(value) {
  const text = String(value ?? "");
  if (!text.trim()) return "";
  if (/已推翻|风险被推翻|无风险|低风险|低可信风险已排除|推荐录用|推荐$|强匹配|高匹配|进入下一轮|可进入|可继续|已匹配|有项目证据|有相关证据|一级证据|高可信|Level 1|low risk|risk disproved|recommend|strong match|high credibility|proceed/i.test(text)) return "tone-good";
  if (/不推荐|不匹配|低匹配|明显缺口|缺少|未体现|淘汰|不推进|暂不进入|暂停|阻断|高风险|风险被证实|已证实|缺证|低可信|三级证据|Level 3|do not recommend|not matched|high risk|confirmed risk|evidence gap|low credibility|pause/i.test(text)) return "tone-risk";
  if (/有条件|部分匹配|中等匹配|中风险|待验证|仍待验证|待补|证据不足|不确定|部分验证|未反馈|中可信|二级证据|Level 2|conditional|partial|medium risk|pending|uncertain|medium credibility/i.test(text)) return "tone-warn";
  if (/风险|risk/i.test(text)) return "tone-warn";
  if (/匹配|通过|验证通过|支持|valid|support/i.test(text)) return "tone-good";
  return "";
}

function offerScenarioToneClass(scenario) {
  const probability = Number(scenario?.probability ?? 0);
  const name = String(scenario?.name || "");
  const assumption = String(scenario?.assumption || "");
  if (/conservative|保守|风险被证实|未能补证|后置暴露/i.test(`${name} ${assumption}`) || probability < 40) return "tone-risk-card";
  if (/optimistic|乐观|验证通过|升级/i.test(`${name} ${assumption}`) || probability >= 70) return "tone-good-card";
  return "tone-warn-card";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b42318" : "#687386";
}

function formatGenerationError(error) {
  const message = error?.message || String(error);
  const isEnglish = currentLanguage === "en";
  if (error?.name === "AbortError" || /aborted|timeout|timed out/i.test(message)) {
    return isEnglish
      ? "Generation failed: the live model request timed out after 90 seconds. Check the proxy or switch to Mock Demo."
      : "生成失败：真实模型请求超过 90 秒未返回。请检查代理 / 模型服务，或先切回 Mock Demo。";
  }
  if (/HTTP 502|Bad Gateway/i.test(message)) {
    return isEnglish
      ? "Generation failed: the model proxy returned 502 Bad Gateway. This is not a frontend hang; the upstream model service or proxy is unavailable. Check Base URL/provider, then retry or switch to Mock Demo."
      : "生成失败：模型代理返回 502 Bad Gateway。这不是前端卡住，而是上游模型服务或代理不可用。请检查 Base URL / 服务商后重试，或先切回 Mock Demo。";
  }
  if (/HTTP 401|Unauthorized/i.test(message)) {
    return isEnglish
      ? "Generation failed: API key authorization failed. Check the key and provider."
      : "生成失败：API Key 鉴权失败，请检查 Key 与模型服务商是否匹配。";
  }
  if (/HTTP 429|Too Many Requests|rate limit/i.test(message)) {
    return isEnglish
      ? "Generation failed: the model service is rate limited. Wait and retry, or switch to Mock Demo."
      : "生成失败：模型服务限流。请稍后重试，或先切回 Mock Demo。";
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return getText().errorCors;
  }
  return getText().errorGeneric(message);
}

function getRunLanguage(run) {
  return run?.input_snapshot?.language || currentLanguage || "zh";
}
