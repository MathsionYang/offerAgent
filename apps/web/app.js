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
const skillToggleEls = Array.from(document.querySelectorAll(".skill-toggle"));
const audienceModeEls = Array.from(document.querySelectorAll("[data-audience-mode]"));
const workspaceViewEls = Array.from(document.querySelectorAll("[data-workspace-view]"));
const resultViewEls = Array.from(document.querySelectorAll("[data-result-view]"));
const appShellEl = document.querySelector(".page");

let currentRun = null;
let currentLanguage = languageEl?.value || "zh";
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
  reportToStaticHtmlDocument: (...args) => reportToStaticHtmlDocument(...args),
});
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
  getCurrentRun: () => currentRun,
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
  getCurrentRun: () => currentRun,
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
  summarizeEvidenceCounts,
  normalizeSnapshot,
  buildEvidenceSummary,
  buildJdHiddenPainRows,
});

const {
  generateWithLLM,
} = window.OfferAgentModelClient.createModelClient({
  providerDefaults,
  buildSystemPrompt,
  buildLlmUserPrompt,
  streamMarkdownByBlocks,
  cleanReportMarkdown,
});


const getText = () => window.OfferAgentI18n.getText(currentLanguage);
const getReportStages = () => window.OfferAgentI18n.getReportStages(currentLanguage);

renderStreamProgress("", getText().progressWaiting, false);
setAudienceMode(activeAudienceMode);
setWorkspaceView("workbench");
setReportDownloadsAvailable(false);

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
      currentRun = enrichEvaluationRun({
        ...cachedRun,
        cache_status: "hit",
        restored_at: new Date().toISOString(),
      });
      renderStreamingReport(buildPreviewMarkdown(currentRun), getText().reportUpdated, true);
      renderDecisionSummaryCard(currentRun);
      renderInterviewerScorecard(currentRun);
      playVirtualPanelChat(currentRun);
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
    currentRun = enrichEvaluationRun(currentRun);
    persistRunCache(currentRun);

    renderStreamingReport(buildPreviewMarkdown(currentRun), input.useRealModel ? getText().llmDone : getText().mockDone, true);
    renderDecisionSummaryCard(currentRun);
    renderInterviewerScorecard(currentRun);
    playVirtualPanelChat(currentRun);
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
  downloadPdfReport(currentRun, "candidate", buildPdfFilename(currentRun, "candidate"));
});

if (downloadInterviewerBtn) {
  downloadInterviewerBtn.addEventListener("click", () => {
    if (!currentRun) return;
    currentRun.human_feedback = collectFeedback();
    downloadPdfReport(currentRun, "interviewer", buildPdfFilename(currentRun, "interviewer"));
  });
}

if (downloadOfferBtn) {
  downloadOfferBtn.addEventListener("click", () => {
    if (!currentRun) return;
    currentRun.human_feedback = collectFeedback();
    downloadPdfReport(currentRun, "offer", buildPdfFilename(currentRun, "offer"));
  });
}

appendFeedbackBtn.addEventListener("click", () => {
  if (!currentRun) {
    setStatus(getText().statusNeedReport, true);
    return;
  }

  const feedback = collectFeedback();
  currentRun.human_feedback = feedback;
  currentRun.report = appendFeedbackToReport(currentRun.report, feedback);
  currentRun = enrichEvaluationRun(currentRun);
  renderReport(buildPreviewMarkdown(currentRun));
  renderDecisionSummaryCard(currentRun);
  renderInterviewerScorecard(currentRun);
  playVirtualPanelChat(currentRun);
  downloadMdBtn.disabled = false;
  setInterviewerDownloadDisabled(false);
  setOfferDownloadDisabled(false);
  setReportDownloadsAvailable(true);
  appendFeedbackBtn.disabled = false;
  setWorkspaceView("graph");
  setStatus(getText().statusFeedback);
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
  renderDecisionSummaryCard(currentRun);
  renderInterviewerScorecard(currentRun);
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
    renderEvidenceGraph(currentRun);
    renderDecisionSummaryCard(currentRun);
    renderInterviewerScorecard(currentRun);
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

function applyLanguage(language) {
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

  setText("#config-title", text.labels.configTitle);
  setText("#mockBtn", text.labels.mockBtn);
  setFieldLabel(providerEl, text.labels.provider);
  setFieldLabel(modelEl, text.labels.model);
  setFieldLabel(apiKeyEl, text.labels.apiKey);
  setFieldLabel(baseUrlEl, text.labels.baseUrl);
  setText("#input-title", text.labels.inputTitle);
  setText("#clearBtn", text.labels.clearBtn);
  setFieldLabel(targetRoleEl, text.labels.targetRole);
  setFieldLabel(resumeEl, text.labels.resume);
  setFieldLabel(jobEl, text.labels.job);
  setFieldLabel(contextEl, text.labels.context);
  setFieldLabel(candidateStageEl, text.labels.candidateStage);
  setFieldLabel(targetLevelEl, text.labels.targetLevel);
  setFieldLabel(offerConstraintsEl, text.labels.offerConstraints);
  setText("#generateBtn", text.labels.generateBtn);
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
  setOptionText(providerEl, "qwen", text.providerOptions.qwen);
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
  if (!currentRun) {
    renderEmptyReport();
    renderStreamProgress("", text.progressWaiting, false);
    renderDecisionSummaryCard(null);
    renderInterviewerScorecard(null);
    renderVirtualPanelChat(null);
    runBadgeEl.textContent = text.runPending;
    setStatus(text.statusReady);
  } else {
    renderReport(buildPreviewMarkdown(currentRun));
    renderDecisionSummaryCard(currentRun);
    renderInterviewerScorecard(currentRun);
    renderVirtualPanelChat(currentRun);
  }
  applyCleanChineseCopy();
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
  const language = getRunLanguage(run);
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

  if (getRunLanguage(run) === "en") {
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
  const requirementRows = rows
    .map((row) => `| ${translateCapability(row.capability)} | ${row.jdEvidence} | ${row.resumeEvidence} | ${translateEvidenceLevel(row.evidenceLevel)} | ${translateMatchStatus(row)} |`)
    .join("\n");
  const gapRows = rows
    .filter((row) => row.isMissing || row.evidenceLevel > 1)
    .slice(0, 5)
    .map((row) => `| ${translateCapability(row.capability)} | ${row.resumeEvidence} | ${translateEvidenceLevel(row.evidenceLevel)} | Ask for metric definition, decision chain, personal contribution, and retrospective evidence. |`)
    .join("\n");
  const painRows = (hiddenPains.length ? hiddenPains : [
    { phrase: "strong pressure tolerance", pressure: "urgent releases, resource constraints, customer escalations, or shifting priorities", prep: "Prepare one incident or delay retrospective with timeline and corrective actions" },
    { phrase: "business sense", pressure: "ambiguous requirements, prioritization, ROI trade-offs, and opportunity judgment", prep: "Prepare one project where you rejected or reshaped a requirement" },
    { phrase: "communication and coordination", pressure: "cross-functional conflict, engineering capacity competition, customer requirement changes", prep: "Prepare stakeholder map, escalation path, and final decision logic" },
  ])
    .map((row) => `| ${row.phrase} | ${row.pressure} | ${row.prep} |`)
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
| Offer leverage | ${translateOfferRating(offerLeverage.rating)} | ${offerLeverage.summary} | Use only verifiable impact, scarce domain knowledge, competing offers, or start-date certainty as leverage. |

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
${rows.map((row) => `| ${translateCapability(row.capability)} | ${row.resumeEvidence} | ${translateEvidenceLevel(row.evidenceLevel)} | ${translateVerificationQuestion(row)} |`).join("\n")}

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
| Negotiation leverage | ${translateOfferRating(offerLeverage.rating)} | ${offerLeverage.detail} |
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

function reportToStaticHtmlDocument(run, audience = "full", options = {}) {
  const markdown = buildAudienceMarkdown(run, audience);
  const language = getRunLanguage(run);
  const text = i18n[language] || i18n.zh;
  const createdAt = new Date(run.created_at).toLocaleString(language === "en" ? "en-US" : "zh-CN");
  const [reportTitle, reportEyebrow] = text.pdfTitles[audience] || text.pdfTitles.full;
  const printFilename = options.printFilename || `${reportTitle}.pdf`;
  const autoPrintScript = options.autoPrint
    ? `<script>
      window.addEventListener("load", () => {
        document.title = ${JSON.stringify(printFilename.replace(/\.pdf$/i, ""))};
        window.setTimeout(() => window.print(), 400);
      });
    </script>`
    : "";
  const pdfSummaryCards = buildPdfSummaryCards(run, audience);
  return `<!doctype html>
<html lang="${language === "en" ? "en" : "zh-CN"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${reportTitle}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b0f19;
        --panel: rgba(23, 32, 53, 0.65);
        --panel-border: rgba(255, 255, 255, 0.08);
        --ink: #e2e8f0;
        --muted: #94a3b8;
        --brand: #00f2fe;
        --brand-glow: rgba(0, 242, 254, 0.15);
        --brand-grad: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
        --accent: #ff9f43;
        --accent-soft: rgba(255, 159, 67, 0.1);
        --good-bg: rgba(16, 185, 129, 0.15);
        --good-color: #10b981;
        --warn-bg: rgba(245, 158, 11, 0.15);
        --warn-color: #f59e0b;
        --risk-bg: rgba(239, 68, 68, 0.15);
        --risk-color: #ef4444;
      }

      * {
        box-sizing: border-box;
      }

      body {
        background-color: var(--bg);
        background-image:
          radial-gradient(circle at 80% 20%, rgba(79, 172, 254, 0.15), transparent 40rem),
          radial-gradient(circle at 10% 80%, rgba(255, 159, 67, 0.08), transparent 35rem),
          linear-gradient(rgba(255, 255, 255, 0.005) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.005) 1px, transparent 1px);
        background-size: 100% 100%, 100% 100%, 30px 30px, 30px 30px;
        color: var(--ink);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
        line-height: 1.8;
        margin: 0;
      }

      .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 24px 60px;
      }

      .cover {
        position: relative;
        border: 1px solid var(--panel-border);
        border-radius: 24px;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        margin-bottom: 24px;
        padding: 40px;
        overflow: hidden;
      }

      .cover::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: var(--brand-grad);
      }

      .eyebrow {
        color: var(--brand);
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin: 0 0 12px;
        display: inline-block;
        background: rgba(0, 242, 254, 0.1);
        padding: 4px 12px;
        border-radius: 30px;
        border: 1px solid rgba(0, 242, 254, 0.2);
      }

      h1 {
        color: #ffffff;
        font-size: 38px;
        font-weight: 800;
        line-height: 1.22;
        margin: 0;
        letter-spacing: 1px;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      }

      .meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 30px;
      }

      .meta div {
        border: 1px solid var(--panel-border);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.02);
        padding: 16px 20px;
        transition: all 0.3s ease;
      }

      .meta div:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(0, 242, 254, 0.3);
        transform: translateY(-2px);
      }

      .meta span {
        display: block;
        color: var(--muted);
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .meta strong {
        display: block;
        color: #ffffff;
        font-size: 15px;
        font-weight: 600;
      }

      .report-body {
        border: 1px solid var(--panel-border);
        border-radius: 24px;
        background: var(--panel);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
        padding: 40px;
      }

      h2 {
        display: none;
      }

      h3 {
        color: #ffffff;
        font-size: 22px;
        font-weight: 700;
        margin: 45px 0 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
      }

      h3::before {
        content: "";
        display: inline-block;
        width: 6px;
        height: 22px;
        background: var(--brand-grad);
        margin-right: 12px;
        border-radius: 4px;
        box-shadow: 0 0 10px var(--brand);
      }

      h4 {
        border-left: 0;
        background: linear-gradient(90deg, rgba(79, 172, 254, 0.15), transparent);
        border-radius: 8px;
        color: var(--brand);
        font-size: 15px;
        font-weight: 600;
        margin: 20px 0 12px;
        padding: 10px 16px;
        border: 1px solid rgba(79, 172, 254, 0.2);
      }

      p,
      li {
        color: #cbd5e1;
        font-size: 14px;
      }

      p {
        margin: 10px 0 16px;
      }

      ul {
        margin: 10px 0 16px 20px;
        padding: 0;
      }

      li {
        margin-bottom: 6px;
      }

      .table-wrap {
        overflow-x: auto;
        border: 1px solid var(--panel-border);
        border-radius: 16px;
        margin: 18px 0 30px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        background: rgba(15, 23, 42, 0.4);
      }

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 14px;
        text-align: left;
      }

      thead {
        background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
        color: #ffffff;
      }

      th,
      td {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding: 16px 20px;
        text-align: left;
        vertical-align: top;
      }

      th {
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      tbody tr:nth-child(even) {
        background: rgba(255, 255, 255, 0.01);
      }

      tbody tr:hover {
        background: rgba(0, 242, 254, 0.04) !important;
      }

      td:first-child {
        color: #ffffff;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.01);
      }

      .tone-good,
      .tone-warn,
      .tone-risk {
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        display: inline-block;
        line-height: 1.4;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      td.tone-good,
      td.tone-warn,
      td.tone-risk {
        display: table-cell;
        border-radius: 0;
        box-shadow: none;
      }

      .tone-good {
        background-color: var(--good-bg) !important;
        color: var(--good-color) !important;
        border-left: 4px solid var(--good-color);
      }

      .tone-warn {
        background-color: var(--warn-bg) !important;
        color: var(--warn-color) !important;
        border-left: 4px solid var(--warn-color);
      }

      .tone-risk {
        background-color: var(--risk-bg) !important;
        color: var(--risk-color) !important;
        border-left: 4px solid var(--risk-color);
      }

      .table-wrap::-webkit-scrollbar {
        height: 8px;
      }

      .table-wrap::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
      }

      .table-wrap::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      .table-wrap::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 242, 254, 0.3);
      }

      :root {
        color-scheme: light;
        --bg: #f3f6fa;
        --panel: #ffffff;
        --panel-border: #d8e0ea;
        --ink: #1e293b;
        --muted: #64748b;
        --brand: #2a8fb1;
        --brand-glow: rgba(42, 143, 177, 0.12);
        --brand-grad: linear-gradient(135deg, #2a8fb1 0%, #0f6f8f 100%);
        --accent: #b7791f;
        --accent-soft: #fff7e6;
        --good-bg: #eaf8f0;
        --good-color: #166534;
        --warn-bg: #fff7e6;
        --warn-color: #92400e;
        --risk-bg: #fff1f2;
        --risk-color: #b42318;
      }

      body {
        background: #f3f6fa;
        color: var(--ink);
      }

      .page {
        max-width: 1100px;
        padding: 28px 20px 44px;
      }

      .cover {
        border-color: var(--panel-border);
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
        padding: 28px 30px;
      }

      .cover::before {
        height: 5px;
      }

      .eyebrow {
        border-color: #d7edf5;
        border-radius: 999px;
        background: #eef9fc;
        color: var(--brand);
      }

      h1 {
        color: #0f172a;
        font-size: 31px;
        letter-spacing: 0;
        text-shadow: none;
      }

      .meta {
        gap: 12px;
        margin-top: 22px;
      }

      .meta div {
        border-color: #d8e0ea;
        border-radius: 8px;
        background: #f8fafc;
        padding: 12px 14px;
      }

      .meta div:hover {
        background: #f8fafc;
        border-color: #d8e0ea;
        transform: none;
      }

      .meta strong {
        color: #0f172a;
      }

      .report-body {
        border-color: var(--panel-border);
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
        padding: 30px;
      }

      h3 {
        border-bottom-color: #dbe4ef;
        color: #0f172a;
        font-size: 19px;
        margin: 30px 0 14px;
        padding-bottom: 9px;
      }

      h3::before {
        width: 4px;
        height: 18px;
        background: var(--brand-grad);
        box-shadow: none;
      }

      h4 {
        border-color: #d7edf5;
        background: #eef9fc;
        color: #0f6f8f;
      }

      p,
      li {
        color: #334155;
      }

      .table-wrap {
        border-color: #d8e0ea;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
      }

      table {
        border-collapse: collapse;
        background: #ffffff;
        color: #1e293b;
      }

      thead {
        background: #eaf2f7;
        color: #0f172a;
      }

      th,
      td {
        border-bottom-color: #e5edf5;
        padding: 11px 13px;
      }

      th {
        color: #0f172a;
        letter-spacing: 0;
        text-transform: none;
      }

      tbody tr:nth-child(even) {
        background: #f8fafc;
      }

      tbody tr:hover {
        background: #eef8fb !important;
      }

      td:first-child {
        background: transparent;
        color: #0f172a;
      }

      .tone-good,
      .tone-warn,
      .tone-risk {
        box-shadow: none;
      }

      :root {
        --report-brand-h: 255;
        --report-brand: oklch(48% 0.14 var(--report-brand-h));
        --report-brand-strong: oklch(36% 0.16 var(--report-brand-h));
        --report-brand-subtle: oklch(93% 0.025 var(--report-brand-h));
        --report-accent: oklch(65% 0.18 75);
        --report-surface: #ffffff;
        --report-bg: oklch(95.5% 0.01 var(--report-brand-h));
        --report-border: oklch(87% 0.015 var(--report-brand-h));
        --report-text: oklch(16% 0.012 var(--report-brand-h));
        --report-secondary: oklch(38% 0.018 var(--report-brand-h));
        --report-muted: oklch(55% 0.015 var(--report-brand-h));
        --report-good: oklch(52% 0.15 160);
        --report-warn: oklch(55% 0.17 80);
        --report-risk: oklch(48% 0.18 28);
      }

      body {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        background:
          radial-gradient(ellipse 80% 50% at 85% 10%, oklch(48% 0.14 var(--report-brand-h) / 0.035), transparent 50rem),
          radial-gradient(ellipse 60% 40% at 15% 90%, oklch(65% 0.18 75 / 0.025), transparent 45rem),
          var(--report-bg);
        color: var(--report-text);
        font-size: 15px;
        line-height: 1.7;
        min-height: 100vh;
        padding: 32px 20px;
      }

      .page {
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 1280px;
        width: 100%;
        padding: 0;
      }

      .cover {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--report-border);
        border-radius: 20px;
        background: var(--report-surface);
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04);
        padding: 40px 40px 32px;
      }

      .cover::before {
        content: "";
        position: absolute;
        inset: 0 0 auto;
        height: 4px;
        background: linear-gradient(90deg, var(--report-brand), oklch(52% 0.16 calc(var(--report-brand-h) + 20)), var(--report-accent));
        border-radius: 20px 20px 0 0;
      }

      .cover::after {
        content: "";
        position: absolute;
        top: -80px;
        right: -80px;
        width: 200px;
        height: 200px;
        border-radius: 999px;
        background: radial-gradient(circle, oklch(48% 0.14 var(--report-brand-h) / 0.12), transparent 70%);
        pointer-events: none;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid oklch(48% 0.14 var(--report-brand-h) / 0.12);
        border-radius: 999px;
        background: var(--report-brand-subtle);
        color: var(--report-brand);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        margin: 0 0 16px;
        padding: 4px 12px;
        text-transform: uppercase;
      }

      .eyebrow::before {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: var(--report-brand);
        box-shadow: 0 0 8px oklch(48% 0.14 var(--report-brand-h) / 0.12);
      }

      h1 {
        color: var(--report-text);
        font-size: clamp(28px, 3.5vw, 36px);
        font-weight: 760;
        letter-spacing: -0.02em;
        line-height: 1.15;
        margin: 0;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 24px;
        border-top: 1px solid var(--report-border);
        margin-top: 20px;
        padding-top: 20px;
      }

      .meta div {
        border: 0;
        border-radius: 0;
        background: transparent;
        padding: 0;
      }

      .meta span {
        display: inline;
        color: var(--report-muted);
        font-size: 13px;
        margin-right: 8px;
      }

      .meta strong {
        display: inline;
        color: var(--report-text);
        font-size: 13px;
        font-weight: 700;
      }

      .report-body {
        counter-reset: report-section;
        border: 1px solid var(--report-border);
        border-radius: 20px;
        background: var(--report-surface);
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03);
        padding: 40px 40px 48px;
      }

      h3 {
        counter-increment: report-section;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 0;
        color: var(--report-text);
        font-size: 22px;
        font-weight: 720;
        letter-spacing: -0.01em;
        line-height: 1.3;
        margin: 32px 0 12px;
        padding: 0;
      }

      h3::before {
        content: counter(report-section);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: var(--report-brand);
        color: #ffffff;
        font-size: 13px;
        font-weight: 800;
      }

      h4 {
        display: inline-flex;
        border: 1px solid var(--report-border);
        border-radius: 999px;
        background: var(--report-brand-subtle);
        color: var(--report-brand-strong);
        font-size: 13px;
        font-weight: 650;
        margin: 18px 0 10px;
        padding: 5px 12px;
      }

      p,
      li {
        color: var(--report-secondary);
        font-size: 14px;
        line-height: 1.72;
      }

      .table-wrap {
        overflow-x: auto;
        border: 1px solid var(--report-border);
        border-radius: 14px;
        background: var(--report-surface);
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03);
        margin: 10px 0 22px;
      }

      table {
        min-width: 640px;
        border-collapse: separate;
        border-spacing: 0;
        background: var(--report-surface);
        color: var(--report-text);
        font-size: 13px;
      }

      thead {
        background: transparent;
      }

      th {
        border-bottom: 1.5px solid var(--report-border);
        background: oklch(97% 0.012 var(--report-brand-h));
        color: var(--report-secondary);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      th,
      td {
        border-bottom: 1px solid var(--report-border);
        padding: 12px 16px;
      }

      td {
        color: var(--report-text);
        line-height: 1.65;
      }

      tbody tr:last-child td {
        border-bottom: 0;
      }

      tbody tr:nth-child(even) {
        background: oklch(48% 0.14 var(--report-brand-h) / 0.015);
      }

      td:first-child {
        background: oklch(97% 0.012 var(--report-brand-h));
        color: var(--report-text);
        font-weight: 650;
      }

      .tone-good {
        background-color: oklch(52% 0.15 160 / 0.09) !important;
        color: var(--report-good) !important;
        border-left: 3px solid var(--report-good);
      }

      .tone-warn {
        background-color: oklch(55% 0.17 80 / 0.09) !important;
        color: var(--report-warn) !important;
        border-left: 3px solid var(--report-warn);
      }

      .tone-risk {
        background-color: oklch(48% 0.18 28 / 0.09) !important;
        color: var(--report-risk) !important;
        border-left: 3px solid var(--report-risk);
      }

      /* Reference-style PDF skin, inspired by 1.html multi-role report. */
      :root {
        --pdf-bg: #f0f2f5;
        --pdf-surface: #ffffff;
        --pdf-surface-hover: #f7f8fa;
        --pdf-border: #e4e6ed;
        --pdf-border-light: #f0f1f4;
        --pdf-text: #1a1d26;
        --pdf-secondary: #5a6170;
        --pdf-tertiary: #9198a6;
        --pdf-accent: #4f6ef7;
        --pdf-accent-light: #eef1fe;
        --pdf-accent-dark: #3b56d6;
        --pdf-green: #22c55e;
        --pdf-green-light: #ecfdf5;
        --pdf-green-dark: #16a34a;
        --pdf-amber: #f59e0b;
        --pdf-amber-light: #fffbeb;
        --pdf-amber-dark: #d97706;
        --pdf-red: #ef4444;
        --pdf-red-light: #fef2f2;
        --pdf-red-dark: #dc2626;
        --pdf-purple: #8b5cf6;
        --pdf-purple-light: #f5f3ff;
        --pdf-teal: #14b8a6;
        --pdf-teal-light: #f0fdfa;
        --pdf-radius-sm: 8px;
        --pdf-radius-md: 12px;
        --pdf-radius-lg: 16px;
        --pdf-shadow-sm: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06);
        --pdf-shadow-md: 0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04);
        color-scheme: light;
      }

      body {
        align-items: flex-start;
        background: var(--pdf-bg) !important;
        color: var(--pdf-text);
        font-family: Inter, "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        font-size: 15px;
        line-height: 1.6;
        padding: 32px 24px 80px;
      }

      .page {
        display: block;
        max-width: 1100px;
        padding: 0;
      }

      .cover {
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        margin-bottom: 18px;
        padding: 0;
      }

      .cover::before,
      .cover::after {
        display: none;
      }

      .cover-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      .cover-title-group {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .report-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--pdf-radius-sm);
        background: linear-gradient(135deg, var(--pdf-accent), var(--pdf-purple));
        color: #ffffff;
        font-size: 18px;
        font-weight: 800;
      }

      .eyebrow {
        border: 0;
        background: var(--pdf-accent-light);
        color: var(--pdf-accent);
        font-size: 11px;
        letter-spacing: 0.04em;
        margin: 0 0 4px;
        padding: 3px 10px;
      }

      .eyebrow::before {
        display: none;
      }

      h1 {
        color: var(--pdf-text);
        font-size: 24px;
        font-weight: 760;
        letter-spacing: -0.02em;
        line-height: 1.18;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px 16px;
        border: 0;
        margin: 0;
        padding: 0;
      }

      .meta div {
        border: 0;
        border-radius: 0;
        background: transparent;
        padding: 0;
      }

      .meta span {
        color: var(--pdf-tertiary);
        font-size: 12px;
        margin-right: 5px;
      }

      .meta strong {
        color: var(--pdf-secondary);
        font-size: 12px;
        font-weight: 600;
      }

      .quick-stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin: 0 0 20px;
      }

      .quick-stat-card {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        border: 1px solid var(--pdf-border-light);
        border-radius: var(--pdf-radius-sm);
        background: var(--pdf-surface);
        box-shadow: var(--pdf-shadow-sm);
        min-height: 76px;
        padding: 13px 14px;
      }

      .quick-stat-card.tone-good-card {
        border-color: rgba(34, 197, 94, 0.24);
        background: linear-gradient(180deg, #ffffff 0%, var(--pdf-green-light) 100%);
      }

      .quick-stat-card.tone-warn-card {
        border-color: rgba(245, 158, 11, 0.28);
        background: linear-gradient(180deg, #ffffff 0%, var(--pdf-amber-light) 100%);
      }

      .quick-stat-card.tone-risk-card {
        border-color: rgba(239, 68, 68, 0.24);
        background: linear-gradient(180deg, #ffffff 0%, var(--pdf-red-light) 100%);
      }

      .quick-stat-card.tone-info-card {
        border-color: rgba(79, 110, 247, 0.22);
        background: linear-gradient(180deg, #ffffff 0%, var(--pdf-accent-light) 100%);
      }

      .quick-stat-card .qs-icon {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 8px;
        background: var(--pdf-accent-light);
        color: var(--pdf-accent-dark);
        font-size: 12px;
        font-weight: 780;
        line-height: 1;
        margin-top: 2px;
      }

      .quick-stat-card .qs-num {
        color: var(--pdf-text);
        font-size: 13px;
        font-weight: 740;
        line-height: 1.35;
        margin-bottom: 3px;
      }

      .quick-stat-card .qs-label {
        color: var(--pdf-tertiary);
        font-size: 10px;
        font-weight: 650;
        letter-spacing: 0.02em;
      }

      .report-body {
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        padding: 0;
      }

      .report-body > h3,
      .report-body > h4,
      .report-body > p,
      .report-body > ul,
      .report-body > ol,
      .report-body > .table-wrap {
        border: 1px solid var(--pdf-border-light);
        border-radius: var(--pdf-radius-md);
        background: var(--pdf-surface);
        box-shadow: var(--pdf-shadow-sm);
      }

      h3 {
        break-after: avoid;
        margin: 20px 0 0;
        padding: 18px 24px 14px;
        border-bottom: 1px solid var(--pdf-border-light) !important;
        border-radius: var(--pdf-radius-md) var(--pdf-radius-md) 0 0 !important;
        color: var(--pdf-text);
        font-size: 15px;
        font-weight: 700;
        gap: 10px;
      }

      h3::before {
        content: "";
        width: 32px;
        height: 32px;
        border-radius: var(--pdf-radius-sm);
        background: var(--pdf-accent-light);
        color: var(--pdf-accent);
        box-shadow: none;
      }

      h3:nth-of-type(5n+1)::before { background: var(--pdf-amber-light); }
      h3:nth-of-type(5n+2)::before { background: var(--pdf-accent-light); }
      h3:nth-of-type(5n+3)::before { background: var(--pdf-purple-light); }
      h3:nth-of-type(5n+4)::before { background: var(--pdf-teal-light); }
      h3:nth-of-type(5n)::before { background: var(--pdf-red-light); }

      h4 {
        display: block;
        margin: 12px 0 0;
        padding: 14px 20px;
        border-color: var(--pdf-border-light);
        border-radius: var(--pdf-radius-md) var(--pdf-radius-md) 0 0;
        background: var(--pdf-surface);
        color: var(--pdf-secondary);
        font-size: 13px;
        font-weight: 700;
      }

      p,
      li {
        color: var(--pdf-secondary);
        font-size: 13px;
      }

      .report-body > p,
      .report-body > ul,
      .report-body > ol {
        margin: 0 0 12px;
        padding: 14px 20px 16px;
      }

      .report-body > h3 + .table-wrap,
      .report-body > h3 + p,
      .report-body > h3 + ul,
      .report-body > h3 + ol,
      .report-body > h4 + .table-wrap {
        border-top: 0;
        border-radius: 0 0 var(--pdf-radius-md) var(--pdf-radius-md);
        margin-top: 0;
      }

      .table-wrap {
        border-color: var(--pdf-border-light);
        border-radius: var(--pdf-radius-md);
        background: var(--pdf-surface);
        box-shadow: var(--pdf-shadow-sm);
        margin: 0 0 14px;
      }

      table {
        min-width: 0;
        width: 100%;
        border-collapse: collapse;
        color: var(--pdf-text);
        font-size: 12px;
      }

      th,
      td {
        border-bottom: 1px solid var(--pdf-border-light);
        padding: 10px 12px;
        vertical-align: top;
      }

      th {
        background: #fafbfc;
        color: var(--pdf-tertiary);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: none;
      }

      td {
        color: var(--pdf-secondary);
      }

      td:first-child {
        background: var(--pdf-surface-hover);
        color: var(--pdf-text);
        font-weight: 650;
      }

      tbody tr:nth-child(even) {
        background: transparent;
      }

      .tone-good {
        background: var(--pdf-green-light) !important;
        color: var(--pdf-green-dark) !important;
        border-left: 3px solid var(--pdf-green);
      }

      .tone-warn {
        background: var(--pdf-amber-light) !important;
        color: var(--pdf-amber-dark) !important;
        border-left: 3px solid var(--pdf-amber);
      }

      .tone-risk {
        background: var(--pdf-red-light) !important;
        color: var(--pdf-red-dark) !important;
        border-left: 3px solid var(--pdf-red);
      }

      @media print {
        @page {
          size: A4;
          margin: 12mm;
        }

        body {
          background: #ffffff;
          color: #000000;
        }

        :root {
          color-scheme: light;
        }

        .page {
          max-width: none;
          padding: 0;
        }

        .cover,
        .report-body {
          border: 0;
          border-radius: 0;
          box-shadow: none;
          background: transparent;
          padding: 0;
        }

        .cover {
          break-after: avoid;
        }

        .quick-stat-card,
        .report-body > h3,
        .report-body > h4,
        .report-body > p,
        .report-body > ul,
        .report-body > ol,
        .report-body > .table-wrap {
          box-shadow: none;
        }

        h3,
        h4,
        tr {
          break-inside: avoid;
        }

        th {
          background: #f1f5f9 !important;
          color: #000000 !important;
        }

        .table-wrap {
          break-inside: avoid;
          border: 1px solid #cbd5e1;
          overflow: visible;
        }
      }
    </style>
    ${autoPrintScript}
  </head>
  <body>
    <main class="page">
      <section class="cover">
        <div class="cover-inner">
          <div>
            <div class="cover-title-group">
              <div class="report-logo">OA</div>
              <div>
                <p class="eyebrow">${reportEyebrow}</p>
                <h1>${reportTitle}</h1>
              </div>
            </div>
          </div>
          <div class="meta">
            <div>
              <span>${language === "en" ? "Generated At" : "生成时间"}</span>
              <strong>${escapeHtml(createdAt)}</strong>
            </div>
            <div>
              <span>${language === "en" ? "Model Mode" : "模型模式"}</span>
              <strong>${escapeHtml(run.mode === "llm" ? (language === "en" ? "Live Model" : "真实模型") : "Mock Demo")}</strong>
            </div>
            <div>
              <span>${language === "en" ? "Model Name" : "模型名称"}</span>
              <strong>${escapeHtml(run.model || (language === "en" ? "Not provided" : "未填写"))}</strong>
            </div>
          </div>
        </div>
        <div class="quick-stats">
          ${pdfSummaryCards.map((card) => `<div class="quick-stat-card ${escapeHtml(card.tone || "")}">
            <div class="qs-icon">${escapeHtml(card.icon)}</div>
            <div><div class="qs-num">${escapeHtml(card.value)}</div><div class="qs-label">${escapeHtml(card.label)}</div></div>
          </div>`).join("")}
        </div>
      </section>
      <section class="report-body">
        ${markdownToHtml(markdown)}
      </section>
    </main>
  </body>
</html>`;
}

function buildPdfSummaryCards(run, audience = "full") {
  const snapshot = run.input_snapshot || {};
  const language = getRunLanguage(run);
  const report = run.report || "";
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const recommendation = buildInterviewerRecommendation(gate);
  const offerLeverage = buildOfferLeverage(snapshot);
  const missingRows = rows.filter((row) => row.isMissing);
  const matchedRows = rows.filter((row) => !row.isMissing);
  const topRisk = missingRows[0]?.capability || (language === "en" ? "Verify real contribution" : "验证真实贡献");
  const topStrength = matchedRows[0]?.capability || (language === "en" ? "Evidence gap" : "证据待补齐");
  const mustAsk = audience === "interviewer"
    ? (language === "en" ? "Project loop / failure review / trade-off" : "项目闭环 / 失败复盘 / 资源取舍")
    : audience === "offer"
      ? (language === "en" ? "Level / compensation / start date" : "职级 / 薪资 / 到岗")
      : (language === "en" ? "Project story / metric definition / pressure question" : "项目故事 / 指标口径 / 压力题");
  const nextFocus = audience === "interviewer"
    ? (gate.enterSandbox ? (language === "en" ? "Pass confirmed and pending items" : "传递已验证与待验证项") : (language === "en" ? "Request project evidence first" : "先补项目证据"))
    : audience === "offer"
      ? offerLeverage.rating
      : (language === "en" ? "Upgrade the highest-risk evidence tonight" : "今晚补强最高风险证据");
  const extractedRecommendation = extractSection(report, "面试官一分钟速览") || extractSection(report, "项目匹配闸口");
  const recommendationText = audience === "candidate"
    ? (language === "en" ? translateGateResult(gate.result) : gate.result)
    : audience === "offer"
      ? (gate.enterSandbox ? (language === "en" ? "Ready for simulation" : "可沙盘验证") : (language === "en" ? "Pause progression" : "暂缓推进"))
      : recommendation.level;
  const labels = language === "en"
    ? {
        gate: "Gate Result",
        sandbox: "Simulation Status",
        recommendation: "Recommendation",
        risk: "Core Risk",
        question: "Must-Ask",
        next: "Next Focus",
        icons: { gate: "G", sandbox: "S", recommendation: "R", risk: "!", question: "Q", next: "N" },
      }
    : {
        gate: "闸口结论",
        sandbox: "沙盘状态",
        recommendation: "推荐等级",
        risk: "核心风险",
        question: "必问问题",
        next: "下一轮重点",
        icons: { gate: "闸", sandbox: "盘", recommendation: "荐", risk: "险", question: "问", next: audience === "candidate" ? "行" : "传" },
      };

  return [
    {
      icon: audience === "candidate" ? labels.icons.gate : audience === "offer" ? labels.icons.sandbox : labels.icons.recommendation,
      label: audience === "candidate" ? labels.gate : audience === "offer" ? labels.sandbox : labels.recommendation,
      value: clip(recommendationText || extractedRecommendation || (language === "en" ? "Pending validation" : "待验证")),
      tone: gate.enterSandbox ? "tone-good-card" : "tone-risk-card",
    },
    {
      icon: labels.icons.risk,
      label: labels.risk,
      value: clip(language === "en" ? translateCapability(topRisk) : topRisk),
      tone: "tone-risk-card",
    },
    {
      icon: labels.icons.question,
      label: labels.question,
      value: clip(mustAsk),
      tone: "tone-warn-card",
    },
    {
      icon: labels.icons.next,
      label: labels.next,
      value: clip(nextFocus || topStrength),
      tone: "tone-info-card",
    },
  ];
}

function buildInterviewerResumeBrief(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const missingRows = rows.filter((row) => row.isMissing);
  const matchedRows = rows.filter((row) => !row.isMissing);
  const resume = snapshot.resume || "";
  const hasProjectSignal = /项目|平台|系统|上线|交付|落地|架构|研发|主导|负责/.test(resume);
  const hasEngineeringSignal = /工程化|架构|系统设计|前后端|数据库|部署|测试|上线|交付|性能|稳定性/.test(resume);
  const hasScatteredTechSignal = /学习|了解|熟悉|掌握|C\+\+|Java|JavaScript|数据库|操作系统|算法|框架/.test(resume) && !hasProjectSignal;
  const missingText = missingRows
    .slice(0, 3)
    .map((row) => `“${row.capability}”`)
    .join("、");
  const matchedText = matchedRows
    .slice(0, 2)
    .map((row) => `“${row.capability}”`)
    .join("、");

  let brief = "";
  if (matchedRows.length === 0) {
    brief = hasScatteredTechSignal
      ? `仅从简历看，候选人提到的技术更像单点学习或技能罗列，尚未看到一个完整的工程化项目闭环，因此无法体现 JD 中 ${missingText || "核心职责"} 的要求。`
      : `仅从简历看，候选人暂未提供能支撑 JD 核心职责的明确项目证据，无法判断其是否具备 ${missingText || "岗位要求能力"}。`;
  } else if (!hasEngineeringSignal && missingRows.length) {
    brief = `仅从简历看，候选人已有 ${matchedText || "部分能力"} 线索，但项目描述仍偏结果或职责陈述，未充分体现完整工程化交付过程，因此对 JD 中 ${missingText || "关键能力"} 仍需重点验证。`;
  } else if (missingRows.length) {
    brief = `仅从简历看，候选人与 JD 有部分交集，但仍有 ${missingText || "若干关键能力"} 未见明确证据，面试中应要求候选人补充具体项目、个人贡献、技术取舍和交付结果。`;
  } else {
    brief = "仅从简历看，候选人与 JD 表面匹配度较高，但仍需通过追问验证真实角色、项目复杂度、关键决策、技术取舍和结果归因，避免只停留在职责描述层面。";
  }

  return `| 初评维度 | 简短评价 |
| --- | --- |
| 简历初评 | ${brief} |
| 面试验证重点 | 优先追问是否有完整项目闭环、本人真实角色、工程化交付细节、技术方案取舍和风险控制过程。 |`;
}

function buildDirectConclusion(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const missingRows = rows.filter((row) => row.isMissing);
  const matchedRows = rows.filter((row) => !row.isMissing);
  const points = (missingRows.length ? missingRows : rows)
    .slice(0, 4)
    .map((row) => `${row.capability}：${row.isMissing ? "简历未提供可支撑证据" : `${row.evidenceLevelLabel}，需验证真实贡献`}`)
    .join("；");

  if (matchedRows.length === 0) {
    return {
      label: "当前简历与 JD 全部为待验证 / 缺证，视同不匹配",
      points,
      nextStep: "优先补齐这些能力对应的项目案例，再准备面试回答",
      interviewerNextStep: "不列追问问题，先要求补充项目证据",
      hasMissing: true,
      blockQuestions: true,
    };
  }

  if (gate.result.includes("条件性进入")) {
    return {
      label: "当前简历与 JD 存在可迁移能力，但行业 / 场景仍需验证",
      points,
      nextStep: "用能力迁移话术建立连接，并补齐目标行业、客户场景和方案设计证据",
      interviewerNextStep: "围绕相似复杂度项目追问迁移边界、真实角色和场景理解",
      hasMissing: true,
      blockQuestions: false,
    };
  }

  if (missingRows.length) {
    return {
      label: `当前简历与 JD 部分匹配，仍有 ${missingRows.length} 项待验证 / 缺证`,
      points,
      nextStep: "补齐缺证项，同时准备已匹配项目的深挖问题",
      interviewerNextStep: "围绕已匹配项目继续追问，验证缺证项和过度包装风险",
      hasMissing: true,
      blockQuestions: false,
    };
  }

  return {
    label: "当前简历与 JD 表面匹配，但仍需验证",
    points,
    nextStep: "准备关键决策、指标口径、失败细节和现场推演回答",
    interviewerNextStep: "使用反包装问题验证真实角色、指标口径和临场判断",
    hasMissing: false,
    blockQuestions: false,
  };
}

function buildConcreteJobAnalysis(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const matchCount = rows.filter((row) => !row.isMissing).length;
  const matchLevel = matchCount >= 4 ? "高匹配" : matchCount >= 2 ? "中等匹配" : "低匹配";
  return `| 企业需要的能力 | JD 证据 | 当前简历证据 | 证据等级 / 匹配判断 |
| --- | --- | --- | --- |
${rows.map((row) => `| ${row.capability} | ${row.jdEvidence} | ${row.resumeEvidence} | ${row.evidenceLevelLabel}；${row.matchStatus} |`).join("\n")}
| 综合匹配程度 | 基于 JD 职责与简历项目证据逐项对照 | 已匹配 ${matchCount}/${rows.length} 项能力证据 | ${matchLevel} |`;
}

function buildCandidateThreeSecondSummary(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const matchedRows = rows.filter((row) => !row.isMissing);
  const missingRows = rows.filter((row) => row.isMissing);
  const matchRate = Math.round((matchedRows.length / Math.max(rows.length, 1)) * 100);
  const topStrength = matchedRows[0] || rows[0];
  const topRisk = missingRows[0] || rows.find((row) => row.evidenceLevel >= 2) || rows[0];
  return `| 速览项 | 结论 | 候选人动作 |
| --- | --- | --- |
| 核心匹配度 | ${matchRate}%；${gate.result} | 不要泛泛说匹配，优先讲最贴近 JD 的项目闭环 |
| 差异化优势 | ${topStrength ? `${topStrength.capability}：${topStrength.resumeEvidence}` : "暂未识别明确优势"} | 自我介绍后主动引导到该项目，讲问题、取舍、推进和结果 |
| 最大风险 | ${topRisk ? `${topRisk.capability}：${topRisk.isMissing ? "缺证" : topRisk.evidenceLevelLabel}` : "待验证"} | 准备指标口径、个人贡献、失败复盘或诚实迁移表达 |
| 今晚优先动作 | 补齐最高风险证据，不追求面面俱到 | 画 1 张项目流程图，列 3 个关键决策，补 1 组可复核指标 |
| 谈薪 / 动机 | ${offerLeverage.rating}：${offerLeverage.summary} | 把期望绑定到职责完整度、可量化贡献、到岗确定性 |`;
}

function buildInterviewerThreeSecondSummary(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const directConclusion = buildDirectConclusion(snapshot);
  const recommendation = buildInterviewerRecommendation(gate);
  const matchedRows = rows.filter((row) => !row.isMissing);
  const missingRows = rows.filter((row) => row.isMissing);
  const topQuestion = (missingRows[0] || rows.find((row) => row.evidenceLevel >= 2) || rows[0])?.verificationQuestion || "请先围绕最强项目还原个人贡献、指标口径和失败复盘。";
  if (currentLanguage === "en") {
    return `| Review item | Interviewer judgment | Action |
| --- | --- | --- |
| Recommendation | ${translateInterviewerRecommendation(recommendation.level)} | ${translateInterviewerAction(recommendation.action)} |
| Role evidence | ${matchedRows.length}/${rows.length} requirements have resume anchors | Start from the strongest project, then verify missing or weak evidence. |
| Key risk | ${directConclusion.hasMissing ? "Evidence gaps or packaging risk remain." : "Surface fit still needs anti-packaging validation."} | Ask for ownership boundary, metric definition, failure detail, and decision chain. |
| Priority question | ${translateVerificationQuestionText(topQuestion)} | Use it as the first deep-dive question before moving to offer discussion. |
| Offer impact | ${translateOfferRating(offerLeverage.rating)}: ${offerLeverage.summary} | Do not price or push the offer before evidence credibility is updated. |`;
  }
  return `| 速览项 | 面试官判断 | 面试动作 |
| --- | --- | --- |
| 推荐结论 | ${recommendation.level} | ${recommendation.action} |
| 岗位证据 | 已匹配 ${matchedRows.length}/${rows.length} 项 JD 要求 | 先从最强项目深挖，再验证缺证或弱证据 |
| 主要风险 | ${directConclusion.hasMissing ? "存在缺证或包装风险" : "表面匹配，但仍需反包装验证"} | 追问个人边界、指标口径、失败细节和决策链 |
| 优先追问 | ${topQuestion} | 作为第一轮深挖问题，回答不清则暂缓进入 Offer 判断 |
| Offer 影响 | ${offerLeverage.rating}：${offerLeverage.summary} | 证据可信度未更新前，不建议提前定价或强推进 |`;
}

function buildInterviewerOneMinuteDecisionBrief(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const directConclusion = buildDirectConclusion(snapshot);
  const recommendation = buildInterviewerRecommendation(gate);
  const resumeEvidence = snapshot.resume ? clip(snapshot.resume) : "未提供简历快照";
  const jdEvidence = snapshot.job_description ? clip(snapshot.job_description) : "未提供 JD 快照";

  if (currentLanguage === "en") {
    return `| Decision Item | Current Judgment | Evidence | Interview Action |
| --- | --- | --- | --- |
| Recommendation | ${translateInterviewerRecommendation(recommendation.level)} | ${gate.matchedCount} matched requirement evidence items | ${translateInterviewerAction(recommendation.action)} |
| Can this person do the job? | ${gate.matchedCount >= 4 ? "Likely, but verify true ownership" : gate.matchedCount >= 2 ? "Possible adjacent fit; verify transfer boundary" : "Evidence is insufficient"} | Resume: ${snapshot.resume ? clip(snapshot.resume) : "Not provided"} | Ask for a complete project loop, trade-offs, engineering collaboration, launch result, and anti-packaging details. |
| Packaging risk | ${directConclusion.hasMissing ? "Evidence gaps or packaging risk remain" : "Surface fit still needs anti-packaging validation"} | ${translateDirectConclusionPoints(directConclusion.points)} | Ask for metric definitions, personal actions, failure details, and decision chain. |
| Team fit | Pending validation | Context: ${snapshot.company_context ? clip(snapshot.company_context) : "Not provided"} | Validate conflict handling, resource coordination, operating cadence, and escalation style. |
| Offer acceptance | ${translateOfferRating(offerLeverage.rating)} / pending | ${offerLeverage.detail} | Update compensation expectation, competing offers, start date, and level preference after interview. |`;
  }

  return `| 决策问题 | 当前判断 | 证据 | 面试动作 |
| --- | --- | --- | --- |
| 推荐等级 | ${recommendation.level} | ${gate.summary} | ${recommendation.action} |
| 能不能干活 | ${gate.matchedCount >= 4 ? "有较强可能，但需复核真实贡献" : gate.matchedCount >= 2 ? "可能能做相邻场景，需要验证迁移边界" : "当前证据不足"} | JD 证据：${jdEvidence}；简历证据：${resumeEvidence} | 追问最强项目的需求判断、方案取舍、研发协同、上线复盘 |
| 水分有多少 | ${directConclusion.hasMissing ? "存在缺证或包装风险" : "表面完整但仍需反包装验证"} | ${directConclusion.points} | 要求现场还原指标口径、个人动作、失败细节和决策链 |
| 是否适配团队 | 待验证 | 公司 / 面试上下文：${snapshot.company_context ? clip(snapshot.company_context) : "未提供"} | 追问冲突处理、资源协调、节奏适应和升级机制 |
| Offer 接受概率 | ${offerLeverage.rating} / 待验证 | ${offerLeverage.detail} | 面试后更新薪资期望、竞对 Offer、到岗时间和职级偏好 |`;
}

function buildCandidateAdvantageCards(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const matchedRows = rows.filter((row) => !row.isMissing).slice(0, 3);
  const sourceRows = matchedRows.length ? matchedRows : rows.slice(0, 3);
  return `| 优势项 | 证据 | 面试中怎么主动引导 | 风险提醒 |
| --- | --- | --- | --- |
${sourceRows.map((row, index) => {
  const intro = index === 0
    ? "开场 30 秒主动抛出该项目，争取让面试官围绕你最强证据追问"
    : "在回答相邻问题时作为补充案例，证明能力不是孤立技能";
  const risk = row.isMissing
    ? "当前只是潜在优势，不能说成已经主导，需要先补真实项目证据"
    : "避免只讲团队成果，必须说清本人动作、决策权和结果归因";
  return `| ${row.capability} | ${row.resumeEvidence} | ${intro} | ${risk} |`;
}).join("\n")}`;
}

function buildInterviewerAdvantageCards(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const matchedRows = rows.filter((row) => !row.isMissing).slice(0, 3);
  const sourceRows = matchedRows.length ? matchedRows : rows.slice(0, 3);
  if (currentLanguage === "en") {
    return `| Decision signal | Evidence anchor | How to verify | Hiring implication |
| --- | --- | --- | --- |
${sourceRows.map((row, index) => {
  const capability = translateCapability(row.capability);
  const evidence = row.resumeEvidence || "No explicit resume evidence yet";
  const verify = row.isMissing
    ? "Ask the candidate to provide a concrete project before treating it as a strength."
    : "Force timeline, personal deliverable, metric definition, and attribution boundary.";
  const implication = index === 0
    ? "Use this as the first deep-dive path and decide whether the candidate deserves the next round."
    : "Use it as supporting evidence only after the main project passes verification.";
  return `| ${capability} | ${evidence} | ${verify} | ${implication} |`;
}).join("\n")}`;
  }
  return `| 决策信号 | 证据锚点 | 面试官如何验证 | 录用判断影响 |
| --- | --- | --- | --- |
${sourceRows.map((row, index) => {
  const verify = row.isMissing
    ? "先要求候选人补一个具体项目，不能直接当作优势"
    : "现场还原时间线、个人交付物、指标口径和归因边界";
  const implication = index === 0
    ? "作为第一条深挖路径，决定是否值得进入下一轮"
    : "作为辅助证据，必须等主项目验证通过后再加权";
  return `| ${row.capability} | ${row.resumeEvidence} | ${verify} | ${implication} |`;
}).join("\n")}`;
}

function translateInterviewerRecommendation(value) {
  if (value === "推荐") return "Recommend";
  if (value === "有条件推荐") return "Conditional recommend";
  if (value === "不推荐") return "Do not recommend";
  return value || "Pending";
}

function translateInterviewerAction(value) {
  return String(value || "")
    .replace("进入下一轮，但必须验证真实贡献、指标口径、失败复盘和团队适配", "Proceed to the next round, but verify real contribution, metric definition, incident review, and team fit.")
    .replace("只围绕可迁移能力推进，重点验证行业理解速度、场景抽象和项目复杂度", "Proceed only around transferable capability; validate industry learning speed, scenario abstraction, and project complexity.")
    .replace("暂不进入下一轮，先要求补充能支撑 JD 核心职责的完整项目证据", "Do not proceed yet; request complete project evidence that supports the JD's core responsibilities.");
}

function translateDirectConclusionPoints(value) {
  return String(value || "")
    .replaceAll("：", ": ")
    .replaceAll("；", "; ")
    .replaceAll("简历未提供可支撑证据", "resume does not provide supporting evidence")
    .replaceAll("一级证据（高可信）", "Level 1 evidence (high credibility)")
    .replaceAll("二级证据（中可信）", "Level 2 evidence (medium credibility)")
    .replaceAll("三级证据（低可信 / 待验证）", "Level 3 evidence (low credibility / pending validation)")
    .replaceAll("需验证真实贡献", "true contribution needs validation");
}

function translateVerificationQuestionText(value) {
  return String(value || "")
    .replace("请", "Please ")
    .replace("围绕", "focus on ")
    .replace("最强项目", "the strongest project")
    .replace("还原", " and reconstruct ")
    .replace("个人贡献", "personal contribution")
    .replace("指标口径", "metric definition")
    .replace("失败复盘", "failure retrospective");
}

function buildAbilityTransferAnalysis(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const matchedRows = rows.filter((row) => !row.isMissing);
  const missingRows = rows.filter((row) => row.isMissing);
  const anchor = matchedRows[0] || rows[0];
  const transferRows = (missingRows.length ? missingRows : rows.filter((row) => row.evidenceLevel >= 2)).slice(0, 3);
  return `| 目标缺口 | 可迁移锚点 | 迁移路径 | 面试验证问题 |
| --- | --- | --- | --- |
${transferRows.map((row) => {
  const anchorText = anchor ? anchor.resumeEvidence : "过往复杂项目经历";
  return `| ${row.capability} | ${anchorText} | 从相邻项目中的需求拆解、方案取舍、研发协同、客户沟通或交付治理迁移到该职责 | 请说明原场景和目标 JD 的相似点、差异点、你如何快速补行业认知，以及哪些能力需要入职后继续补齐 |`;
}).join("\n") || "| 暂无明显缺口 | 当前证据仍需复核 | 用一级证据确认真实贡献，而不是额外包装迁移 | 请拆解指标口径、个人动作和失败复盘 |"}`;
}

function buildConcreteGapTable(snapshot) {
  const allRows = buildRequirementEvidenceRows(snapshot);
  const rows = allRows.filter((row) => row.isMissing);
  const gapRows = rows.length ? rows : allRows.slice(0, 3);
  return `| 不匹配 / 待验证点 | JD 证据 | 简历当前证据 | 证据等级与建议补充 |
| --- | --- | --- | --- |
${gapRows.map((row) => {
  const status = row.isMissing ? "不匹配 / 缺证" : "待验证";
  return `| ${status}：${row.capability} | ${row.jdEvidence} | ${row.resumeEvidence} | ${row.evidenceLevelLabel}；准备一个能证明“${row.capability}”的具体项目，说明背景、个人动作、结果和复盘 |`;
}).join("\n")}`;
}

function buildConcreteCandidateQuestions(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot).slice(0, 6);
  return `| 模拟问题 | 回答路线图 | 常见陷阱 | 绝对不要说 |
| --- | --- | --- | --- |
${rows.map((row) => `| 请用一个项目证明你具备“${row.capability}” | S：项目背景和约束；T：目标和成功口径；A：你的个人动作、关键取舍、协作对象；R：结果、复盘和下次会改变什么；证据等级：${row.evidenceLevelLabel} | 只复述“负责 / 参与 / 推动”，没有指标口径、个人动作或失败细节 | “这个主要是团队做的，我负责配合” |
`).join("")}| 请复盘一次项目延期或线上故障 | 按时间线讲发现、止血、分工、根因、影响、整改和后续机制变化 | 把问题全推给研发、客户或外部环境 | “我没有遇到过失败或延期” |`;
}

function buildCandidateRevisionAdvice(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const missingRows = rows.filter((row) => row.isMissing);
  const targetRows = missingRows.length ? missingRows : rows.slice(0, 4);
  return `| 优先级 | 今晚要完成的动作 | 产出物 | 为什么优先 |
| --- | --- | --- | --- |
${targetRows.map((row, index) => {
  const problem = row.isMissing ? `简历没有体现“${row.capability}”的项目证据` : `简历已有“${row.capability}”线索，但当前仅为${row.evidenceLevelLabel}`;
  const priority = index === 0 ? "P0" : index === 1 ? "P1" : "P2";
  return `| ${priority}：${row.capability} | 针对“${problem}”，补 1 个真实项目，写清背景、目标、约束、个人动作、结果和复盘 | 项目流程图、指标口径卡、关键决策清单、失败或取舍案例 | ${row.isMissing ? "这是 JD 缺证项，可能直接影响推进" : "可把现有证据从低可信提升为高可信"} |`;
}).join("\n")}`;
}

function buildCandidateStrategyAdvice(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const matchedRows = rows.filter((row) => !row.isMissing);
  const missingRows = rows.filter((row) => row.isMissing);
  const bestRow = matchedRows[0] || rows[0];
  const missingText = missingRows.slice(0, 2).map((row) => row.capability).join("、") || "一级证据口径";
  return `| 策略模块 | 当前判断 | 候选人打法 |
| --- | --- | --- |
| 优势放大 | ${bestRow ? bestRow.resumeEvidence : gate.bestEvidence} | 主动把这个项目讲成问题判断、方案取舍、推进落地、指标复盘的闭环，不只复述职责 |
| 缺证项表达 | ${missingText}仍需补强 | 不编造行业或项目经历，改为说明相似场景、已验证方法和入职后补齐行业认知的计划 |
| 主动引导 | 面试官会优先追问${bestRow ? bestRow.capability : "项目闭环"} | 自我介绍后主动抛出最贴近 JD 的项目，引导对方追问你准备最充分的证据链 |
| STAR 升级 | 普通 STAR 不足以证明产品判断 | 在背景、目标、动作、结果外补充约束条件、指标口径、关键取舍和复盘机制 |
| 谈薪 / 动机 | ${offerLeverage.rating}：${offerLeverage.summary} | 把期望与职责完整度、成长空间、到岗确定性和可量化贡献绑定，避免只谈薪资数字 |`;
}

function buildPressureInterviewGuide(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const topRisk = rows.find((row) => row.isMissing) || rows.find((row) => row.evidenceLevel >= 2) || rows[0];
  return `| 压力问题 | 面试官最想听到 | 最不想听到 | 候选人应对 |
| --- | --- | --- | --- |
| 项目延期 / 线上故障复盘 | 发现机制、止血动作、根因定位、影响范围、长期整改和后续机制变化 | 没有失败、都是别人问题、只讲结果不讲过程 | 如无线上故障，诚实换成真实延期、需求冲突、客户投诉或资源冲突案例 |
| 你在项目里到底做了什么 | 明确个人交付物、关键决策、协作对象和结果归因 | “我们团队一起做的”，说不清自己的边界 | 用“我负责 / 我推动 / 我决策 / 我复盘”的句式拆清楚 |
| 为什么缺少 ${topRisk?.capability || "关键能力"} 证据 | 承认简历表达不足，用相邻经历说明迁移路径和补齐计划 | 直接声称做过但无法还原细节 | 说清原场景、相似点、差异点、入职后 30 天补齐动作 |
| 如果资源砍半怎么排优先级 | 用客户价值、风险等级、成本、收益和止损阈值排序 | “我会和大家沟通协调” | 现场列保留 / 延后 / 放弃清单，并说明指标依据 |
| 为什么还值得推进 | ${gate.result} 下的最强证据和最关键补证计划 | 只表达意愿或学习能力 | 绑定 JD 核心职责、已有项目证据和可验证承诺 |`;
}

function buildConcreteInterviewerQuestions(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot).slice(0, 6);
  return `| 问题类型 | 核心追问 | 回答好继续深挖 | 回答差快速验证 | 推进动作 |
| --- | --- | --- | --- | --- |
${rows.map((row, index) => `| ${interviewerLens(index)}：${row.capability} | 对应 JD：${row.jdEvidence}；项目锚点：${row.resumeEvidence}；${row.verificationQuestion} | 继续追问指标口径、个人决策、协作对象、失败细节和结果归因 | 要求给出具体时间线、个人交付物和可复核材料；仍答不上标记缺证 | ${row.isMissing ? "补材料或暂缓" : "可继续深挖"} |`).join("\n")}
| 反包装验证 | 请按时间线还原一次真实线上故障或延期，说明发现、止血、根因、整改和后续机制变化。 | 继续追问谁拍板、谁执行、影响范围、整改是否进入后续发布机制 | 候选人声称没有失败或只能讲完美项目，标记过度包装风险 | 失败复盘不过关则不建议强推进 |
| 决策层压力官 | 如果上级砍掉一半预算，你如何用指标重排优先级并说服我？ | 继续追问保留/放弃清单、ROI 口径、客户影响和止损阈值 | 只说“沟通协调”或无法量化取舍依据 | 取舍能力不足时建议加业务负责人面 |`;
}

function buildInterviewerRecommendation(gate) {
  if (gate.result.includes("匹配进入")) {
    return {
      level: "推荐",
      action: "进入下一轮，但必须验证真实贡献、指标口径、失败复盘和团队适配",
    };
  }
  if (gate.result.includes("条件性进入")) {
    return {
      level: "有条件推荐",
      action: "只围绕可迁移能力推进，重点验证行业理解速度、场景抽象和项目复杂度",
    };
  }
  return {
    level: "不推荐",
    action: "暂不进入下一轮，先要求补充能支撑 JD 核心职责的完整项目证据",
  };
}

function buildInterviewerScorecard(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const matchedCount = rows.filter((row) => !row.isMissing).length;
  const strongCount = rows.filter((row) => row.evidenceLevel === 1).length;
  const missingCount = rows.length - matchedCount;
  const scoreRows = [
    {
      dimension: "专业能力",
      score: Math.min(5, Math.max(1, 2 + strongCount + Math.floor(matchedCount / 3))),
      evidence: buildEvidenceSummary(rows),
      anchor: "能拆解 JD 核心职责，并用真实项目说明产品判断和结果口径",
      risk: missingCount >= 4 ? "多数核心职责缺证" : "只讲职责，不讲方法和取舍",
    },
    {
      dimension: "项目闭环",
      score: gate.enterSandbox ? (strongCount ? 4 : 3) : 1,
      evidence: gate.bestEvidence,
      anchor: "能讲清需求发现、方案设计、研发协同、上线、复盘",
      risk: "缺少上线结果、失败复盘或个人贡献边界",
    },
    {
      dimension: "沟通协作",
      score: /推动|协作|客户|研发|设计|运营|跨团队|协调/.test(`${snapshot.resume || ""} ${snapshot.company_context || ""}`) ? 3 : 2,
      evidence: findEvidence(`${snapshot.resume || ""} ${snapshot.company_context || ""}`, ["推动", "协作", "客户", "研发", "设计", "运营", "跨团队", "协调"]) || "材料中协作证据不足",
      anchor: "能说明冲突方、沟通机制、升级路径和最终结果",
      risk: "只说沟通顺畅，无法复盘冲突和资源争抢",
    },
    {
      dimension: "业务理解",
      score: /智慧矿山|矿山|GIS|B\s*端|B端|SaaS|企业|客户|行业/.test(`${snapshot.resume || ""} ${snapshot.job_description || ""}`) ? 3 : 2,
      evidence: findEvidence(`${snapshot.resume || ""} ${snapshot.job_description || ""}`, ["智慧矿山", "矿山", "GIS", "B端", "B 端", "SaaS", "企业", "客户", "行业"]) || "目标行业或客户场景证据不足",
      anchor: "能把用户、客户、业务指标和产品方案连起来",
      risk: "只懂功能，不懂业务场景和客户价值",
    },
    {
      dimension: "技术协同",
      score: /架构|研发|技术|数据库|前后端|C\+\+|Java|JavaScript|系统设计/.test(`${snapshot.resume || ""} ${snapshot.job_description || ""}`) ? 3 : 2,
      evidence: findEvidence(`${snapshot.resume || ""} ${snapshot.job_description || ""}`, ["架构", "研发", "技术", "数据库", "前后端", "C++", "Java", "JavaScript", "系统设计"]) || "技术协同证据不足",
      anchor: "能说明技术边界、方案取舍、风险控制和研发协同方式",
      risk: "堆技术名词，无法解释系统边界或技术风险",
    },
    {
      dimension: "团队适配",
      score: snapshot.company_context ? 3 : 2,
      evidence: snapshot.company_context ? clip(snapshot.company_context) : "未提供团队文化或协作上下文",
      anchor: "能适应团队节奏、沟通方式和岗位真实压力",
      risk: "动机泛化，对岗位挑战或团队节奏理解不足",
    },
    {
      dimension: "Offer 风险",
      score: offerLeverage.rating.includes("暂无") ? 2 : 3,
      evidence: offerLeverage.detail,
      anchor: "能清楚说明期望、约束、竞对机会、到岗时间和取舍标准",
      risk: "薪资、职级、到岗或竞对机会后置暴露",
    },
  ];
  return `| 评分维度 | 分数 | 证据 | 行为锚点 / 扣分信号 |
| --- | --- | --- | --- |
${scoreRows.map((row) => `| ${row.dimension} | ${row.score}/5 | ${row.evidence} | 行为锚点：${row.anchor}；扣分信号：${row.risk} |`).join("\n")}`;
}

function buildInterviewerSignalTable(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const missingRows = rows.filter((row) => row.isMissing);
  const matchedRows = rows.filter((row) => !row.isMissing);
  return `| 信号类型 | 现场表现 | 代表含义 | 面试官动作 |
| --- | --- | --- | --- |
| 绿灯：项目真实 | 能按时间线讲清${matchedRows[0]?.capability || "核心项目"}的背景、目标、约束、个人动作和结果 | 项目闭环可信度较高 | 继续深挖关键决策和失败复盘 |
| 绿灯：指标可信 | 能说明指标分母、统计周期、上线前后对比和归因边界 | 结果不是简单包装 | 追问是否有同期变量、对照组或客户反馈 |
| 绿灯：协作成熟 | 能讲清冲突方、资源约束、升级机制和最终取舍 | 具备跨团队推进能力 | 追问如果资源减半会如何重排优先级 |
| 红灯：职责复述 | 只重复“负责 / 参与 / 推动”，没有个人动作 | 可能只是边缘参与 | 要求候选人明确自己做过的交付物和决策 |
| 红灯：缺证回避 | 对${missingRows[0]?.capability || "关键能力"}只讲学习意愿，没有项目证据 | 不足以支撑 JD 核心职责 | 标记缺证，必要时停止该方向深挖 |
| 红灯：完美叙事 | 无法提供延期、冲突、事故或判断错误案例 | 可能存在过度包装 | 必须追问失败案例；仍无法回答则记录风险 |`;
}

function buildInterviewerFollowupPaths(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const targetRows = rows.slice(0, 4);
  return `| 起手问题 | 回答好时继续追问 | 回答差时快速验证 | 记录结论 |
| --- | --- | --- | --- |
${targetRows.map((row) => `| ${row.verificationQuestion} | 请继续说明关键决策是谁做的、指标如何定义、失败点是什么 | 要求候选人给出具体时间、协作人、产出物和复盘材料；仍答不上则标记缺证 | ${row.capability}：${row.matchStatus} |`).join("\n")}
| 请复盘一次项目延期或线上故障 | 继续追问发现、止血、根因、影响范围、整改机制和后续机制变化 | 如果没有真实失败案例，追问需求冲突、客户投诉或资源冲突；仍没有则标记包装风险 | 失败复盘能力 |
| 如果预算或研发资源砍掉一半，你怎么重排优先级 | 继续追问 ROI、客户影响、风险阈值和说服路径 | 如果只说沟通协调，要求现场列出保留/放弃清单 | 战略取舍能力 |`;
}

function buildInterviewerDecisionAdvice(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const recommendation = buildInterviewerRecommendation(gate);
  const missingRows = rows.filter((row) => row.isMissing).slice(0, 3);
  const mustVerify = (missingRows.length ? missingRows : rows.slice(0, 3))
    .map((row) => row.capability)
    .join("、");
  return `| 决策项 | 建议 |
| --- | --- |
| 推荐等级 | ${recommendation.level} |
| 录用前置条件 | 候选人必须能用真实项目证明：${mustVerify} |
| 下一轮最应验证 | 个人贡献边界、指标口径、失败复盘、技术 / 业务取舍和团队适配 |
| 加面建议 | 若候选人通过业务面，建议追加项目推进 / 技术协同视角验证，避免只看产品表达 |
| Offer 风险处理 | 谈薪前必须确认薪资期望、竞对机会、到岗时间、职级偏好和接受概率 |
| 不推荐触发条件 | 无法提供完整项目闭环、拒绝复盘失败、无法解释指标口径或只讲团队成果 |`;
}

function buildInterviewerQuickBrief(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const recommendation = buildInterviewerRecommendation(gate);
  const offerLeverage = buildOfferLeverage(snapshot);
  const matchedRows = rows.filter((row) => !row.isMissing);
  const missingRows = rows.filter((row) => row.isMissing);
  const topStrength = matchedRows[0]?.capability || "暂无明确强证据";
  const topRisk = missingRows[0]?.capability || "表面匹配但需反包装验证";
  return `| 速览项 | 内容 |
| --- | --- |
| 推荐等级 | ${recommendation.level} |
| 核心亮点 | ${topStrength}：${matchedRows[0]?.resumeEvidence || gate.bestEvidence} |
| 核心风险 | ${topRisk}：${missingRows[0]?.evidenceReason || "需要验证真实角色、指标口径和失败复盘"} |
| 必问 3 题 | 1. 还原最贴近 JD 的完整项目闭环；2. 按时间线复盘一次延期 / 故障；3. 解释一次资源砍半时的优先级取舍 |
| 面试策略 | 先问项目闭环，再问失败复盘，最后用决策层压力题验证临场判断 |
| Offer 提醒 | ${offerLeverage.rating}：${offerLeverage.summary} |
| 下一轮传递重点 | ${gate.enterSandbox ? "传递已验证证据、仍待验证缺口和新增风险" : "先补项目证据，不建议直接推进到深轮面试"} |`;
}

function buildCandidateProfile(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const projectTypes = rows
    .filter((row) => !row.isMissing)
    .slice(0, 3)
    .map((row) => row.capability)
    .join("、") || "简历未提供足够项目类型证据";
  const motivationEvidence = findEvidence(
    `${normalized.resume} ${normalized.company_context} ${normalized.offer_constraints}`,
    ["希望", "期望", "考虑", "目标", "到岗", "预算", "竞对", "Offer", "offer", "成长", "稳定"],
  ) || "动机、薪资和到岗约束缺少明确证据";
  return `| 画像维度 | 当前判断 | 证据 | 需要验证 |
| --- | --- | --- | --- |
| 职业路径画像 | ${projectTypes} | ${clip(normalized.resume) || "未提供简历"} | 是否具备从单点执行到模块负责人 / 行业产品负责人的跨度 |
| 项目角色画像 | ${gate.result} | ${gate.summary} | 本人真实角色、决策权、产出物和指标归因 |
| 稳定性 / 动机画像 | 待验证 | ${motivationEvidence} | 离职动机、岗位偏好、长期稳定性和业务节奏接受度 |
| 薪资 / 到岗画像 | ${offerLeverage.rating} / 待验证 | ${normalized.offer_constraints || "未提供 Offer / 谈薪约束"} | 薪资期望、竞对机会、可接受底线和最快到岗时间 |
| 团队适配画像 | 待验证 | ${normalized.company_context || "未提供团队上下文"} | 沟通风格、冲突处理、资源争抢和升级机制成熟度 |`;
}

function buildRoleAwareInterviewerModules(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const offerLeverage = buildOfferLeverage(snapshot);
  const profile = buildCandidateProfile(snapshot).replace(/\n/g, " ");
  const roleModules = [
    {
      title: "HR 面试官模块",
      goal: "验证动机、稳定性、薪资期望、到岗时间和合规风险",
      portrait: `候选人阶段与 Offer 约束：${normalizeSnapshot(snapshot).candidate_stage || "未提供"}；${offerLeverage.summary}`,
      mustAsk: "为什么选择该岗位？是否有竞对 Offer？最快到岗时间和薪资底线是什么？是否存在竞业或合规限制？",
      deepAsk: "如果该岗位职责、薪资或到岗时间只能满足两项，你如何排序？为什么？",
      quickCheck: "请用 30 秒说明你接受或拒绝 Offer 的前三个触发条件。",
      chain: "动机清晰 -> 追问机会排序和长期规划；动机泛化 -> 追问离职原因、真实不满和接受 / 拒绝 Offer 的触发条件",
      scorecard: "动机清晰度 /5；稳定性 /5；薪资匹配 /5；到岗确定性 /5",
      green: "能明确说出岗位吸引点、机会排序、薪资弹性和到岗计划",
      red: "关键条件后置暴露、只谈薪资、动机空泛或回避竞业限制",
      skip: "不需要追问系统架构、技术选型细节或产品路线图深度。",
      handoff: "把薪资底线、竞对阶段、到岗时间和动机强弱传给业务负责人",
    },
    {
      title: "技术架构 / 技术负责人模块",
      goal: "验证系统设计、技术边界、技术选型、研发协同和复杂问题排查",
      portrait: `技术协同证据：${rows.find((row) => row.capability === "技术架构与研发协同")?.resumeEvidence || "缺少明确证据"}`,
      mustAsk: "请画出最复杂项目的系统边界；为什么采用当时的技术方案？最大技术风险如何识别和控制？",
      deepAsk: "如果核心模块要支撑 10 倍数据量或客户量，你会先改哪三个技术点？",
      quickCheck: "请列出该项目中你本人直接参与的技术评审、接口设计或风险决策。",
      chain: "能画清架构 -> 追问瓶颈、容灾、扩展和技术债；画不清 -> 追问本人负责模块和代码 / 文档贡献",
      scorecard: "系统设计 /5；技术选型 /5；问题排查 /5；研发协同 /5",
      green: "能解释技术方案取舍、边界、风险和研发协作机制",
      red: "堆技术名词但无法解释为什么、谁决策、风险如何闭环",
      skip: "不需要深问薪资底线、离职动机或 HR 合规细节。",
      handoff: "把技术深度、系统边界和研发协同风险传给产品 / 项目推进面",
    },
    {
      title: "产品负责人模块",
      goal: "验证需求洞察、产品规划、MVP / 迭代意识、用户价值和业务指标",
      portrait: `产品证据：${rows.find((row) => row.capability === "产品规划与生命周期管理")?.resumeEvidence || "缺少明确证据"}`,
      mustAsk: "一个 0-1 项目最初的用户问题是什么？你如何定义 MVP？上线后如何迭代？",
      deepAsk: "如果客户、销售和研发对版本优先级意见相反，你用什么标准裁剪需求？",
      quickCheck: "请用一句话说清这个产品的目标用户、核心场景和成功指标。",
      chain: "回答有用户和指标 -> 追问取舍、竞品和迭代路线；回答只有功能 -> 追问业务目标和用户价值",
      scorecard: "需求洞察 /5；规划能力 /5；指标意识 /5；产品质量 /5",
      green: "能把用户、客户、业务指标和产品方案连起来",
      red: "只讲功能列表，无法解释为什么做、先做什么、怎么判断成功",
      skip: "不需要深入问薪资谈判、竞业限制或代码实现细节。",
      handoff: "把产品判断、MVP 意识和业务指标缺口传给业务负责人",
    },
    {
      title: "项目推进 / PMO 模块",
      goal: "验证里程碑、资源协调、延期预警、风险升级和复盘机制",
      portrait: `交付证据：${rows.find((row) => row.capability === "成本、进度、质量控制")?.resumeEvidence || "缺少明确证据"}`,
      mustAsk: "最复杂项目如何排期？需求增加 20% 怎么处理？一次差点延期如何预警和扭转？",
      deepAsk: "如果关键研发资源被抽走，你如何重新拆里程碑、同步风险并争取业务接受？",
      quickCheck: "请列一个真实项目的里程碑、风险清单、责任人和升级节点。",
      chain: "能讲出排期和风险 -> 追问升级机制和复盘沉淀；只说协调 -> 追问具体冲突方和取舍记录",
      scorecard: "目标拆解 /5；资源协调 /5；风险控制 /5；复盘沉淀 /5",
      green: "能给出里程碑、风险清单、责任人、升级路径和后续机制变化",
      red: "没有真实延期 / 冲突案例，或只把问题归因给外部团队",
      skip: "不需要深问薪资期望或宏观战略取舍。",
      handoff: "把交付风险、资源协调能力和复盘成熟度传给终面",
    },
    {
      title: "业务负责人 / 决策层模块",
      goal: "验证战略取舍、商业洞察、投入产出、领导力潜力和资源约束下的判断质量",
      portrait: `闸口判断：${gate.result}；${gate.summary}`,
      mustAsk: "如果预算砍半，你保留什么、放弃什么？如果短期 ROI 不好但战略上重要，如何争取资源？",
      deepAsk: "如果你负责的方向连续两个季度没有指标起色，你会继续、收缩还是停掉？阈值是什么？",
      quickCheck: "请用客户价值、收入影响、风险成本三个维度给当前项目排优先级。",
      chain: "能量化取舍 -> 追问一年内优先改变什么；无法量化 -> 追问客户价值、成本和止损阈值",
      scorecard: "战略思维 /5；商业洞察 /5；资源取舍 /5；领导力潜力 /5",
      green: "能用客户价值、业务指标、风险等级和投入产出解释选择",
      red: "只表达主观偏好，遇到预算和方向冲突时只做被动执行",
      skip: "不需要追问基础工具使用或简历细枝末节。",
      handoff: "输出是否建议 Offer、建议职级、需补充验证和入职后使用建议",
    },
  ];

  return roleModules
    .map((role) => `### ${role.title}

| 模块 | 内容 |
| --- | --- |
| 角色目标 | ${role.goal} |
| 候选人画像 | ${role.portrait} |
| 必问问题 | ${role.mustAsk} |
| 深挖问题 | ${role.deepAsk} |
| 快速验证问题 | ${role.quickCheck} |
| 追问链 | ${role.chain} |
| 评分卡 | ${role.scorecard} |
| 绿灯信号 | ${role.green} |
| 红灯信号 | ${role.red} |
| 本角色不需要看的内容 | ${role.skip} |
| 给下一位面试官的话 | ${role.handoff} |`)
    .join("\n\n");
}

function buildInterviewHandoffCard(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const gate = buildGateAssessment(snapshot, rows);
  const recommendation = buildInterviewerRecommendation(gate);
  const matchedRows = rows.filter((row) => !row.isMissing).slice(0, 3);
  const missingRows = rows.filter((row) => row.isMissing).slice(0, 3);
  return `| 传递字段 | 填写内容 |
| --- | --- |
| 本轮面试官角色 | HR / 技术架构 / 产品负责人 / 项目推进 / 业务负责人 / 决策层 |
| 已验证通过 | ${matchedRows.map((row) => row.capability).join("、") || "待面试后填写"} |
| 需要下一轮验证 | ${missingRows.map((row) => row.capability).join("、") || "失败复盘、指标口径、真实角色"} |
| 新增发现 | 面试中发现的新亮点、新风险、动机变化或 Offer 约束 |
| 本轮评分 | /5；评分理由必须写明关键证据 |
| 是否建议进入下一轮 | ${recommendation.level}；${recommendation.action} |
| 给下一位面试官的话 | 请重点验证上一轮未证实的项目证据，不要重复已经通过的问题 |`;
}

function buildPostInterviewEvaluationTemplate(snapshot) {
  const gate = buildGateAssessment(snapshot);
  const recommendation = buildInterviewerRecommendation(gate);
  return `| 评估项 | 面试官填写 |
| --- | --- |
| 专业能力 | /5；关键观察： |
| 项目经验 | /5；关键观察： |
| 沟通协作 | /5；关键观察： |
| 团队适配 | /5；关键观察： |
| 成长潜力 | /5；关键观察： |
| Offer 风险 | /5；关键观察： |
| 综合判断 | 推荐录用 / 有条件推荐 / 不推荐；系统初始建议：${recommendation.level} |
| 需要补充验证 | 项目闭环、指标口径、失败复盘、动机、薪资和到岗约束 |
| 面试官备注 | 记录候选人原话、关键证据、风险信号和建议下一轮追问 |`;
}

function buildJdHiddenPainRows(snapshot) {
  const jd = normalizeSnapshot(snapshot).job_description || "";
  const candidates = [
    {
      phrase: "较强学习能力和抗压能力",
      pattern: /学习能力|抗压能力|压力|快速/i,
      pressure: "岗位可能存在客户临场需求、紧急版本、跨团队冲突或高频交付压力",
      prep: "准备一次高压推进、线上事故或客户冲突的复盘案例",
    },
    {
      phrase: "敏锐的产品嗅觉和创新能力",
      pattern: /产品嗅觉|创新|前瞻|探索|新功能|专利/i,
      pressure: "业务方希望候选人不只执行需求，还能主动判断机会和技术方向",
      prep: "准备一次从趋势、客户痛点或数据洞察中提出产品方向的案例",
    },
    {
      phrase: "成本、进度和质量控制",
      pattern: /成本|进度|质量|风险控制/i,
      pressure: "项目可能周期长、依赖多，失败成本高，需要强项目治理能力",
      prep: "准备里程碑、风险清单、降级方案和复盘机制案例",
    },
    {
      phrase: "深入研发一线",
      pattern: /研发一线|技术架构|技术风险|技术选型|架构/i,
      pressure: "产品经理需要与研发共同做方案取舍，而不是只写需求文档",
      prep: "准备一次技术方案取舍、架构约束或技术债治理案例",
    },
  ];
  const matched = candidates.filter((item) => item.pattern.test(jd));
  return matched.length ? matched : candidates.slice(0, 3);
}

function buildEvidenceChainTable(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  const rows = [
    ["简历证据", normalized.resume ? clip(normalized.resume) : "未提供简历快照", "候选人自述，需按证据等级追问"],
    ["JD 证据", normalized.job_description ? clip(normalized.job_description) : "未提供 JD 快照", "岗位要求来源"],
    ["上下文证据", normalized.company_context ? clip(normalized.company_context) : "未提供额外上下文", "公司 / 面试偏好来源"],
    ["Offer 沙盘证据", normalized.offer_constraints ? clip(normalized.offer_constraints) : "未提供 Offer / 谈薪约束", "谈判杠杆与推进风险来源"],
  ];
  return `| 证据来源 | 摘要 | 使用方式 |
| --- | --- | --- |
${rows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`).join("\n")}`;
}

function interviewerLens(index) {
  return ["业务负责人", "产品负责人", "项目推进", "技术架构", "客户方案", "反包装验证", "决策层压力官"][index % 7];
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

function translateStage(value) {
  return i18n.en.stageOptions[value] || value || "Not provided";
}

function translateCapability(value) {
  const map = {
    "行业场景理解": "Industry scenario understanding",
    "产品规划与生命周期管理": "Product planning and lifecycle management",
    "客户需求分析与方案设计": "Customer requirement analysis and solution design",
    "技术架构与研发协同": "Technical architecture and engineering collaboration",
    "技术选型与创新探索": "Technology selection and innovation exploration",
    "成本、进度、质量控制": "Cost, schedule, and quality control",
    "验证真实贡献": "Verify real contribution",
    "证据待补齐": "Evidence gap",
  };
  return map[value] || value || "Pending validation";
}

function translateEvidenceLevel(level) {
  if (level === 1) return "Level 1 evidence (high credibility)";
  if (level === 2) return "Level 2 evidence (medium credibility)";
  return "Level 3 evidence (low credibility / pending validation)";
}

function translateMatchStatus(row) {
  const isMissing = row.isMissing ?? row.is_missing;
  const evidenceLevel = row.evidenceLevel ?? row.evidence_level;
  if (isMissing) return "Not matched / evidence missing";
  if (evidenceLevel === 1) return "Matched, verify metric definition";
  if (evidenceLevel === 2) return "Partially matched / follow-up required";
  return "Pending validation";
}

function localizeOfferLifecycleState(value) {
  return localizeEnumValue(value, {
    zh: {
      feedback_distilled: "反馈已沉淀",
      offer_probability: "Offer 概率",
      evidence_validation: "证据验证",
    },
    en: {
      feedback_distilled: "Feedback distilled",
      offer_probability: "Offer probability",
      evidence_validation: "Evidence validation",
    },
  });
}

function localizeOfferScenarioName(value) {
  return localizeEnumValue(value, {
    zh: {
      Base: "基准",
      Optimistic: "乐观",
      Conservative: "保守",
    },
    en: {
      Base: "Base",
      Optimistic: "Optimistic",
      Conservative: "Conservative",
    },
  });
}

function localizeFeedbackActionType(value) {
  return localizeEnumValue(value, {
    zh: {
      promote_question: "升级问题",
      demote_question: "降权问题",
      raise_risk_weight: "提高风险权重",
      lower_risk_weight: "降低风险权重",
      downgrade_claim: "降级结论",
      add_regression_case: "加入回归样本",
    },
    en: {
      promote_question: "Promote question",
      demote_question: "Demote question",
      raise_risk_weight: "Raise risk weight",
      lower_risk_weight: "Lower risk weight",
      downgrade_claim: "Downgrade claim",
      add_regression_case: "Add regression case",
    },
  });
}

function localizeFeedbackTarget(value) {
  return localizeEnumValue(value, {
    zh: {
      interview_questions: "面试问题",
      "offer_simulation_run.risks": "Offer 风险",
      evaluation_run: "评估运行",
      evidence_graph: "证据图谱",
    },
    en: {
      interview_questions: "Interview questions",
      "offer_simulation_run.risks": "Offer risks",
      evaluation_run: "Evaluation run",
      evidence_graph: "Evidence graph",
    },
  });
}

function localizeSkillId(value) {
  return localizeEnumValue(value, {
    zh: {
      hr: "HR 面试官",
      business: "业务负责人",
      project: "项目推进面试官",
      negotiation: "谈薪顾问",
      decision: "决策层压力官",
    },
    en: {
      hr: "HR Interviewer",
      business: "Business Owner",
      project: "Project Interviewer",
      negotiation: "Negotiation Advisor",
      decision: "Executive Pressure Officer",
    },
  });
}

function localizeFeedbackStatus(value) {
  return localizeEnumValue(value, {
    zh: {
      waiting_feedback: "等待人工反馈",
      pending_review: "待复核",
      pending_fix: "待修正",
      pending_rewrite: "待重写",
      pending_regression: "待加入回归",
    },
    en: {
      waiting_feedback: "Waiting for feedback",
      pending_review: "Pending review",
      pending_fix: "Pending fix",
      pending_rewrite: "Pending rewrite",
      pending_regression: "Pending regression",
    },
  });
}

function localizeEnumValue(value, dictionaries) {
  const text = value || "";
  const dictionary = currentLanguage === "en" ? dictionaries.en : dictionaries.zh;
  return dictionary[text] || text;
}

function translateGateResult(value) {
  if (/匹配进入/.test(value)) return "Matched: proceed";
  if (/条件性进入/.test(value)) return "Conditional proceed (transferable fit)";
  if (/不匹配/.test(value)) return "Not matched: do not proceed";
  return value || "Pending validation";
}

function translateOfferRating(value) {
  if (/强/.test(value)) return "Strong leverage";
  if (/中/.test(value)) return "Medium leverage";
  if (/弱/.test(value)) return "Weak leverage";
  if (/暂无/.test(value)) return "No clear leverage";
  return value || "Pending validation";
}

function translateVerificationQuestion(row) {
  if (row.isMissing) return `Add one project proving ${translateCapability(row.capability)}, covering background, goal, action, result, and retrospective.`;
  if (row.evidenceLevel === 1) return `Explain denominator, period, before/after comparison, and your direct contribution for ${translateCapability(row.capability)}.`;
  return "Break down your real role, key decisions, collaborators, and result attribution for this evidence.";
}

function summarizeEvidenceCounts(rows) {
  const counts = rows.reduce((acc, row) => {
    acc[row.evidenceLevel] += 1;
    return acc;
  }, { 1: 0, 2: 0, 3: 0 });
  return `Level 1: ${counts[1]}, Level 2: ${counts[2]}, Level 3 / missing: ${counts[3]}`;
}

applyLanguage(currentLanguage);
providerEl.dispatchEvent(new Event("change"));
