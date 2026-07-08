const $ = (id) => document.getElementById(id);

const providerEl = $("provider");
const modelEl = $("model");
const apiKeyEl = $("apiKey");
const baseUrlEl = $("baseUrl");
const resumeEl = $("resume");
const jobEl = $("jobDescription");
const contextEl = $("companyContext");
const candidateStageEl = $("candidateStage");
const targetLevelEl = $("targetLevel");
const offerConstraintsEl = $("offerConstraints");
const reportEl = $("report");
const reportProgressEl = $("reportProgress");
const evidenceGraphEl = $("evidenceGraph");
const statusEl = $("status");
const modelModeEl = $("modelMode");
const runBadgeEl = $("runBadge");
const generateBtn = $("generateBtn");
const downloadMdBtn = $("downloadMdBtn");
const downloadInterviewerBtn = $("downloadInterviewerBtn");
const downloadOfferBtn = $("downloadOfferBtn");
const downloadJsonBtn = $("downloadJsonBtn");
const feedbackAgreementEl = $("feedbackAgreement");
const feedbackQuestionUseEl = $("feedbackQuestionUse");
const feedbackDisagreementReasonEl = $("feedbackDisagreementReason");
const feedbackEvidenceSufficiencyEl = $("feedbackEvidenceSufficiency");
const feedbackRiskValidationEl = $("feedbackRiskValidation");
const feedbackNotesEl = $("feedbackNotes");
const appendFeedbackBtn = $("appendFeedbackBtn");
const languageEl = $("language");
const skillToggleEls = Array.from(document.querySelectorAll(".skill-toggle"));

let currentRun = null;
let currentLanguage = languageEl?.value || "zh";

const providerDefaults = {
  mock: { model: "mock-product-manager-v1", baseUrl: "" },
  openai: { model: "gpt-4.1-mini", baseUrl: "https://api.openai.com/v1" },
  deepseek: { model: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1" },
  qwen: { model: "qwen-plus", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  kimi: { model: "moonshot-v1-8k", baseUrl: "https://api.moonshot.cn/v1" },
  custom: { model: "", baseUrl: "" },
};

const samples = {
  zh: {
    resume:
      "候选人：张三，5 年 B 端 SaaS 产品经验。曾负责客户成功平台、工单系统和数据看板。主导过从 0 到 1 的功能规划，推动研发、设计、运营协作，上线后工单平均响应时长下降 28%。在另一个项目中负责数据看板需求梳理，但简历未说明指标口径和业务复盘方式。候选人期望负责更完整的产品模块，并希望团队业务增长确定性更强。",
    job:
      `1、负责智慧矿山行业产品规划、设计和产品生命周期管理，包括不限于行业市场与竞争分析；
2、负责智慧矿山业务咨询，智慧矿山行业调研、产品调研以及项目调研等，包括客户需求分析、技术交流引导和项目方案设计，指导项目技术架构设计与技术风险控制；
3、负责前瞻性技术探索，对核心技术选型、新功能研发、新专利布局负责；
4、对技术转化负责，深入用户场景研究需求，并推动方案实施；
5、能够深入研发一线，参与和指导研发工作。

任职要求：
1、计算机相关专业，统招本科及以上学历，5年以上产品研发经验，有系统设计与开发经验优先；
2、精通Axure、Figma等产品设计软件，熟悉C++、Java、Java script等编程语言及常用的前后端框架，熟悉常用的数据库和操作系统；
3、优秀的解决问题能力，良好的沟通协调能力和团队精神，较强学习能力和抗压能力；
4、5年以上智慧矿山产品研发工作经验，负责过完整矿山或GIS平台产品的0-1开发工作，以及丰富的客户交流及内部协调经验；
5、有产品意识，熟悉产品生命周期管理，具有敏锐的产品嗅觉和较强的创新能力，思路清晰，良好的产品开发成本、进度和质量控制能力；
6、有3年以上软件研发经验者优先。`,
    context:
      "公司为成长期 B 端 SaaS 团队，希望候选人能独立负责客户成功相关产品模块。面试重点：需求判断、指标意识、跨团队推动、复盘能力。",
    offerConstraints:
      "目标职级：中级产品经理。预算较紧，希望候选人 4 周内到岗。候选人可能同时接触另一家 CRM 公司，需要验证动机和岗位偏好。",
    candidateStage: "业务一面",
    targetLevel: "中级产品经理",
  },
  en: {
    resume:
      "Candidate: Alex Chen, 5 years of B2B SaaS product experience. Owned a customer success platform, ticketing workflow, and analytics dashboard. Led 0-to-1 feature planning, coordinated engineering, design, and operations, and reduced average ticket response time by 28% after launch. Also handled analytics dashboard requirement discovery, but the resume does not clarify metric definitions, personal contribution boundaries, or post-launch review methods. The candidate wants to own a more complete product module and prefers a team with clearer business growth visibility.",
    job:
      `1. Own product planning, design, and lifecycle management for smart mining products, including industry market research and competitive analysis.
2. Lead smart mining consulting, industry research, product research, and project discovery, including customer requirement analysis, technical communication, solution design, and guidance on technical architecture and risk control.
3. Explore forward-looking technologies and take ownership of core technology selection, new feature R&D, and patent planning.
4. Own technology commercialization by deeply studying user scenarios and driving implementation.
5. Work closely with frontline engineering teams and participate in or guide R&D work.

Requirements:
1. Bachelor's degree or above in computer science or a related field; 5+ years of product/R&D experience; system design or software development experience preferred.
2. Proficient with Axure, Figma, and similar product design tools; familiar with C++, Java, JavaScript, common frontend/backend frameworks, databases, and operating systems.
3. Strong problem-solving, communication, collaboration, learning ability, and pressure tolerance.
4. 5+ years of smart mining product R&D experience, ownership of complete 0-to-1 mining or GIS platform products, and rich customer communication plus internal coordination experience.
5. Strong product sense, lifecycle management capability, innovation ability, clear thinking, and product development cost, schedule, and quality control.
6. 3+ years of software engineering experience preferred.`,
    context:
      "The company is a growth-stage B2B SaaS team and expects the candidate to independently own customer-success-related product modules. Interview focus: requirement judgment, metric thinking, cross-functional execution, and retrospective capability.",
    offerConstraints:
      "Target level: Mid-level Product Manager. Budget is tight and the team hopes the candidate can join within 4 weeks. The candidate may also be speaking with another CRM company, so motivation and role preference need validation.",
    candidateStage: "业务一面",
    targetLevel: "Mid-level Product Manager",
  },
};

const sample = samples.zh;

const i18n = {
  zh: {
    title: "面试助手",
    metaDescription: "面试助手开源 Web MVP：辅助候选人准备面试，并生成面试官可选问题库。",
    navSubtitle: "Offer 沙盘 + 面试官视角库",
    languageLabel: "语言 / Language",
    heroSubtitle: "辅助候选人更好准备面试，并生成可供面试官挑选的候选人追问题库。",
    caps: [
      ["岗位匹配", "先判断项目经历是否匹配 JD 职责，再决定是否进入沙盘。"],
      ["证据链优先", "把项目讲述、指标口径和个人贡献绑定到证据。"],
      ["视角库", "生成面试官可挑选的问题，也帮助候选人提前演练。"],
    ],
    workflow: [
      ["配置模型", "选择模型服务商和本次使用的模型。"],
      ["粘贴材料", "输入简历、JD 和可选面试上下文。"],
      ["准备报告", "通过项目匹配闸口后，输出候选人准备重点、Offer 风险与追问策略。"],
      ["反馈校准", "把人工判断写回报告并下载保存。"],
    ],
    labels: {
      configTitle: "临时配置模型",
      mockBtn: "填充脱敏样例",
      provider: "模型服务商",
      model: "模型名称",
      apiKey: "临时 API Key",
      baseUrl: "代理 / 自定义 Base URL（可选）",
      inputTitle: "输入简历与 JD",
      clearBtn: "清空当前页面",
      resume: "候选人简历",
      job: "岗位 JD",
      context: "公司 / 面试上下文（可选）",
      sandbox: "Offer 沙盘",
      sandboxHint: "用于模拟面试推进、录用风险和谈薪约束",
      candidateStage: "候选人阶段",
      targetLevel: "目标职级",
      offerConstraints: "Offer / 谈薪约束（可选）",
      skillTitle: "面试官视角库",
      skillHint: "不同面试角色的问题视角，供候选人准备和面试官挑选",
      generateBtn: "生成面试准备报告",
      feedbackTitle: "人工反馈",
      runScope: "仅当前页面有效",
      agreement: "是否同意系统判断",
      questionUse: "追问是否可采用",
      disagreementReason: "不同意原因",
      evidenceSufficiency: "证据是否充分",
      riskValidation: "面试后是否验证风险",
      feedbackNotes: "人工补充意见",
      appendFeedback: "把反馈写入报告",
      reportTitle: "报告预览",
      downloadCandidate: "导出候选人 PDF",
      downloadInterviewer: "导出面试官 PDF",
      downloadOffer: "导出 Offer 推演 PDF",
      downloadJson: "导出评测 JSON",
      footer: "面试准备助手第一版只做面试准备辅助，不输出自动录用或淘汰结论。",
    },
    placeholders: {
      apiKeyMock: "Mock 模式不需要 Key",
      apiKeyReal: "仅保存在当前页面内存，刷新后丢失",
      baseUrl: "例如 https://your-worker.workers.dev",
      resume: "粘贴候选人简历文本。不建议在公共设备输入真实敏感信息。",
      job: "粘贴产品经理岗位 JD。",
      context: "例如公司阶段、业务方向、目标职级、面试重点、薪资约束等。",
      targetLevel: "例如 P6 / 中级产品经理",
      offerConstraints: "例如预算范围、候选人期望、竞品 Offer、到岗时间、团队紧急程度。",
      feedbackNotes: "例如：哪些结论不准确、哪些问题更适合、还需要验证什么。",
    },
    providerOptions: {
      mock: "Mock Demo（不调用模型）",
      qwen: "通义千问 / DashScope",
      custom: "OpenAI-Compatible 代理 / 自定义接口",
    },
    stageOptions: {
      "初筛": "初筛",
      "业务一面": "业务一面",
      "业务终面": "业务终面",
      "Offer 前": "Offer 前",
    },
    feedbackOptions: {
      "未反馈": "未反馈",
      "同意": "同意",
      "部分同意": "部分同意",
      "不同意": "不同意",
      "采用": "采用",
      "改写采用": "改写采用",
      "未采用": "未采用",
      "证据不足": "证据不足",
      "权重不同": "权重不同",
      "岗位理解不同": "岗位理解不同",
      "系统误判": "系统误判",
      "充分": "充分",
      "部分充分": "部分充分",
      "不充分": "不充分",
      "已证实": "已证实",
      "已推翻": "已推翻",
      "仍待验证": "仍待验证",
    },
    skillCards: {
      hr: ["虚拟 HR 面试官", "深挖动机、岗位偏好、到岗约束和风险边界。"],
      business: ["虚拟业务负责人", "结合 JD 职责深挖业务判断、指标口径和结果归因。"],
      project: ["虚拟项目推进面试官", "结合项目经历深挖里程碑、资源协调和复盘机制。"],
      negotiation: ["虚拟谈薪顾问", "深挖机会选择标准、竞争 Offer、入职概率和谈薪策略。"],
      decision: ["决策层压力官", "用预算削减、战略取舍和 ROI 压力测试候选人的判断依据。"],
    },
    emptyTitle: "等待生成报告",
    emptyText: "报告会覆盖候选人准备重点、岗位匹配、Offer 沙盘推演、面试官候选问题库、证据链和人工反馈建议。",
    progressWaiting: "等待生成报告",
    reportUpdated: "报告已更新",
    streamPlaceholder: "正在建立候选人、岗位、沙盘与面试官视角证据索引...",
    streamDone: "已完成",
    streaming: "分块输出中",
    modeMock: "当前模式：Mock Demo",
    modeReal: "当前模式：真实模型调用",
    runPending: "尚未生成",
    runGenerating: "生成中...",
    mockStreaming: "Mock 分块生成中",
    llmStreaming: "真实模型流式生成中",
    mockDone: "Mock 分块生成完成",
    llmDone: "真实模型生成完成",
    statusReady: "准备就绪。未配置 Key 时会使用 Mock Demo。",
    statusSample: "已填充脱敏样例。可以直接生成 Mock 报告。",
    statusCleared: "已清空当前页面内存中的 Key、输入和报告。",
    statusMissingInput: "请先填写简历和 JD。",
    statusGeneratingMock: "正在分块生成 Mock 沙盘报告...",
    statusGeneratingLlm: "正在流式生成报告...",
    statusMockDone: "Mock 沙盘报告已生成。请下载到本地保存。",
    statusLlmDone: "真实模型报告已生成。请下载到本地保存。",
    statusNeedReport: "请先生成报告，再写入人工反馈。",
    statusFeedback: "人工反馈已写入当前报告。请下载保存，刷新页面后不会保留。",
    statusPdf: "正在生成 PDF，请稍候...",
    statusJson: "结构化评测 JSON 已导出。",
    statusDownloaded: (filename) => `已下载 ${filename}。`,
    statusPdfFallback: "直接下载 PDF 失败，已打开打印窗口作为降级方案。",
    statusPopupBlocked: "PDF 窗口被浏览器拦截，请允许弹窗后重试。",
    statusPrintWindow: "已打开 PDF 打印窗口，请在打印对话框中选择“保存为 PDF”。",
    errorCors: "生成失败：浏览器直连被模型服务商跨域策略拦截。请先用 Mock Demo，或填写你自己的代理 / Serverless 兼容地址。",
    errorGeneric: (message) => `生成失败：${message}`,
    pdfTitles: {
      candidate: ["候选人面试准备报告", "候选人模块"],
      interviewer: ["面试官提问辅助报告", "面试官模块"],
      offer: ["Offer 沙盘推演报告", "Offer 推演模块"],
      full: ["面试准备报告", "Offer 沙盘 + 面试官视角库"],
    },
    fileNames: {
      candidate: "candidate-report",
      interviewer: "interviewer-report",
      offer: "offer-sandbox",
    },
  },
  en: {
    title: "Interview Assistant",
    metaDescription: "Open-source Web MVP for interview preparation, evidence-based screening, interviewer question banks, and PDF reports.",
    navSubtitle: "Offer Sandbox + Interviewer Lens Library",
    languageLabel: "Language",
    heroSubtitle: "Turn resumes and job descriptions into candidate prep reports, interviewer question guides, and offer simulation PDFs.",
    caps: [
      ["Role Match", "Run the project-match gate before moving into offer simulation."],
      ["Evidence First", "Tie project stories, metric definitions, and personal contribution to verifiable evidence."],
      ["Interviewer Lenses", "Generate role-specific questions for interviewers and practice prompts for candidates."],
    ],
    workflow: [
      ["Configure Model", "Choose the model provider and model for this run."],
      ["Paste Materials", "Enter the resume, JD, and optional interview context."],
      ["Generate Reports", "Produce candidate prep, offer risks, and interviewer follow-up strategy."],
      ["Calibrate Feedback", "Append human feedback and export the final report."],
    ],
    labels: {
      configTitle: "Temporary Model Config",
      mockBtn: "Fill Anonymized Sample",
      provider: "Model Provider",
      model: "Model Name",
      apiKey: "Temporary API Key",
      baseUrl: "Proxy / Custom Base URL (optional)",
      inputTitle: "Resume and JD Input",
      clearBtn: "Clear Page",
      resume: "Candidate Resume",
      job: "Job Description",
      context: "Company / Interview Context (optional)",
      sandbox: "Offer Sandbox",
      sandboxHint: "Used to simulate interview progress, hiring risk, and negotiation constraints",
      candidateStage: "Candidate Stage",
      targetLevel: "Target Level",
      offerConstraints: "Offer / Negotiation Constraints (optional)",
      skillTitle: "Interviewer Lens Library",
      skillHint: "Question perspectives for different interviewer roles",
      generateBtn: "Generate Interview Prep Report",
      feedbackTitle: "Human Feedback",
      runScope: "Current page only",
      agreement: "Do you agree with the system judgment?",
      questionUse: "Can the follow-up questions be used?",
      disagreementReason: "Reason for disagreement",
      evidenceSufficiency: "Is the evidence sufficient?",
      riskValidation: "Was the risk validated after interview?",
      feedbackNotes: "Additional human notes",
      appendFeedback: "Append Feedback to Report",
      reportTitle: "Report Preview",
      downloadCandidate: "Export Candidate PDF",
      downloadInterviewer: "Export Interviewer PDF",
      downloadOffer: "Export Offer Simulation PDF",
      downloadJson: "Export Evaluation JSON",
      footer: "The first version is an interview-prep assistant only and does not issue automatic hiring or rejection decisions.",
    },
    placeholders: {
      apiKeyMock: "No key required in Mock mode",
      apiKeyReal: "Stored only in current page memory and lost after refresh",
      baseUrl: "Example: https://your-worker.workers.dev",
      resume: "Paste candidate resume text. Avoid entering sensitive real data on public devices.",
      job: "Paste the product manager job description.",
      context: "Example: company stage, business direction, target level, interview focus, salary constraints.",
      targetLevel: "Example: P6 / Mid-level Product Manager",
      offerConstraints: "Example: budget range, candidate expectation, competing offer, start date, team urgency.",
      feedbackNotes: "Example: inaccurate conclusions, better questions, or remaining validation needs.",
    },
    providerOptions: {
      mock: "Mock Demo (no model call)",
      qwen: "Qwen / DashScope",
      custom: "OpenAI-Compatible Proxy / Custom Endpoint",
    },
    stageOptions: {
      "初筛": "Screening",
      "业务一面": "First business interview",
      "业务终面": "Final business interview",
      "Offer 前": "Pre-offer",
    },
    feedbackOptions: {
      "未反馈": "No feedback",
      "同意": "Agree",
      "部分同意": "Partially agree",
      "不同意": "Disagree",
      "采用": "Use",
      "改写采用": "Use after rewriting",
      "未采用": "Do not use",
      "证据不足": "Insufficient evidence",
      "权重不同": "Different weighting",
      "岗位理解不同": "Different role interpretation",
      "系统误判": "System misjudgment",
      "充分": "Sufficient",
      "部分充分": "Partially sufficient",
      "不充分": "Insufficient",
      "已证实": "Confirmed",
      "已推翻": "Disproved",
      "仍待验证": "Still pending",
    },
    skillCards: {
      hr: ["Virtual HR Interviewer", "Probes motivation, role preference, start-date constraints, and risk boundaries."],
      business: ["Virtual Business Owner", "Validates business judgment, metric definitions, and result attribution against the JD."],
      project: ["Virtual Project / PMO Interviewer", "Probes milestones, resource coordination, and retrospective mechanisms."],
      negotiation: ["Virtual Negotiation Advisor", "Validates opportunity selection, competing offers, acceptance probability, and negotiation strategy."],
      decision: ["Executive Pressure Officer", "Uses budget cuts, strategic trade-offs, and ROI pressure to test judgment quality."],
    },
    emptyTitle: "Waiting for Report",
    emptyText: "The report will cover candidate prep priorities, role matching, offer simulation, interviewer question bank, evidence chain, and feedback suggestions.",
    progressWaiting: "Waiting for report",
    reportUpdated: "Report updated",
    streamPlaceholder: "Building the evidence index across candidate, role, offer sandbox, and interviewer lenses...",
    streamDone: "Completed",
    streaming: "Streaming blocks",
    modeMock: "Current mode: Mock Demo",
    modeReal: "Current mode: Live model call",
    runPending: "Not generated",
    runGenerating: "Generating...",
    mockStreaming: "Mock block generation",
    llmStreaming: "Live model streaming",
    mockDone: "Mock block generation completed",
    llmDone: "Live model generation completed",
    statusReady: "Ready. Mock Demo will be used when no key is configured.",
    statusSample: "Anonymized sample filled. You can generate a Mock report now.",
    statusCleared: "Cleared the key, inputs, and report from current page memory.",
    statusMissingInput: "Please fill in both resume and JD first.",
    statusGeneratingMock: "Generating the Mock sandbox report in blocks...",
    statusGeneratingLlm: "Streaming the report from the model...",
    statusMockDone: "Mock sandbox report generated. Download it locally to save.",
    statusLlmDone: "Live model report generated. Download it locally to save.",
    statusNeedReport: "Please generate a report before appending human feedback.",
    statusFeedback: "Human feedback appended to the current report. Download it before refreshing.",
    statusPdf: "Generating PDF, please wait...",
    statusJson: "Structured evaluation JSON exported.",
    statusDownloaded: (filename) => `Downloaded ${filename}.`,
    statusPdfFallback: "Direct PDF download failed. Opened a print window as fallback.",
    statusPopupBlocked: "PDF window was blocked by the browser. Please allow pop-ups and retry.",
    statusPrintWindow: "PDF print window opened. Choose Save as PDF in the print dialog.",
    errorCors: "Generation failed: browser direct access was blocked by the model provider's CORS policy. Use Mock Demo or provide your own proxy / serverless compatible endpoint.",
    errorGeneric: (message) => `Generation failed: ${message}`,
    pdfTitles: {
      candidate: ["Candidate Interview Preparation Report", "Candidate Module"],
      interviewer: ["Interviewer Question Guide", "Interviewer Module"],
      offer: ["Offer Simulation Report", "Offer Simulation Module"],
      full: ["Interview Preparation Report", "Offer Sandbox + Interviewer Lens Library"],
    },
    fileNames: {
      candidate: "candidate-report",
      interviewer: "interviewer-report",
      offer: "offer-simulation",
    },
  },
};

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

const skillLibrary = {
  hr: {
    name: "虚拟 HR 面试官",
    focus: "稳定性、动机、表达清晰度、风险边界",
    evidence: "从候选人阶段、Offer 约束、岗位动机和简历表达中生成。",
    proof: "候选人能清楚解释求职动机、岗位偏好、到岗约束和长期稳定性。",
    risk: "动机泛化、期望不清、对岗位真实挑战理解不足。",
    questions: [
      "你为什么考虑这个岗位和公司？最看重的三个因素是什么？",
      "如果业务节奏比预期更快，你通常如何管理压力和沟通预期？",
      "你过往离职或转岗的主要原因是什么？这次希望避免什么问题？",
    ],
  },
  business: {
    name: "虚拟业务负责人",
    focus: "业务理解、需求判断、指标意识、结果归因",
    evidence: "从 JD 核心职责、候选人业务项目和结果指标中生成。",
    proof: "候选人能把项目目标、用户问题、业务指标和取舍逻辑讲清楚。",
    risk: "只描述功能交付，无法还原业务判断和结果归因。",
    questions: [
      "请选一个最能代表你产品判断力的项目，说明你如何识别真实需求。",
      "你如何定义项目成功指标？哪些指标是你亲自推动改善的？",
      "如果业务方、客户和研发对优先级判断不同，你如何做取舍？",
    ],
  },
  project: {
    name: "虚拟项目推进面试官",
    focus: "目标拆解、里程碑、资源协调、风险控制、复盘机制",
    evidence: "从 JD 的跨团队推进要求和候选人项目协作经历中生成。",
    proof: "候选人能说明如何拆目标、控风险、协调资源并形成复盘机制。",
    risk: "只说“推动协作”，缺少具体阻力、决策、里程碑和责任边界。",
    questions: [
      "项目中最关键的里程碑是什么？你如何提前发现延期风险？",
      "跨团队协作中最大阻力是什么？你做过哪些具体推动动作？",
      "上线后你如何组织复盘？哪些结论沉淀成后续机制？",
    ],
  },
  negotiation: {
    name: "虚拟谈薪顾问",
    focus: "期望差距、竞争 Offer、入职概率、谈薪策略",
    evidence: "从目标职级、预算、到岗时间、竞争机会和候选人偏好中生成。",
    proof: "候选人能说明机会选择标准、薪资结构偏好和可接受条件。",
    risk: "关键条件后置暴露，导致 Offer 推进节奏和成功率不可控。",
    questions: [
      "你当前最看重薪资、成长、团队还是业务确定性？优先级如何排序？",
      "如果有多个机会，你会基于哪些标准做最终选择？",
      "在入职时间、薪资结构或职责范围上，哪些条件最影响你的决定？",
    ],
  },
  decision: {
    name: "决策层压力官",
    focus: "战略取舍、预算削减、资源约束、投入产出、极端压力判断",
    evidence: "从 JD 的战略职责、资源约束、项目复杂度和 Offer 上下文中生成，固定用于压力测试。",
    proof: "候选人能用业务指标、用户价值、风险等级和投入产出解释取舍，而不是只表达主观偏好。",
    risk: "无法解释判断依据，遇到预算缩减或方向冲突时只做被动执行。",
    questions: [
      "如果上级要求砍掉你负责模块一半预算，你如何重新排定需求优先级？请用具体指标说服我。",
      "如果你判断一个战略方向值得做，但短期 ROI 不好看，你会如何争取资源？",
      "如果项目投入三个月后效果不达预期，你会继续、收缩还是停止？依据是什么？",
    ],
  },
};

const reportStagesByLanguage = {
  zh: [
  { title: "证据解析", marker: "## 一页摘要", detail: "读取简历、JD 与上下文" },
  { title: "匹配闸口", marker: "## 项目匹配闸口", detail: "判断是否进入下一轮沙盘" },
  { title: "岗位匹配", marker: "## 岗位匹配", detail: "校准职责要求与项目证据" },
  { title: "风险校准", marker: "## 风险与待验证", detail: "区分事实、推断和待验证项" },
  { title: "沙盘推演", marker: "## Offer 沙盘推演", detail: "评估推进路径与 Offer 风险" },
  { title: "问题库生成", marker: "## 面试官候选问题库", detail: "生成候选人准备与面试官提问题库" },
  { title: "证据链收束", marker: "## 证据链", detail: "整理可追溯判断依据" },
  ],
  en: [
    { title: "Evidence Scan", marker: "## One-Page Summary", detail: "Read resume, JD, and context" },
    { title: "Match Gate", marker: "## Project Match Gate", detail: "Decide whether to enter offer simulation" },
    { title: "Role Match", marker: "## Role Match", detail: "Map requirements to project evidence" },
    { title: "Risk Check", marker: "## Risks and Validation Needed", detail: "Separate facts, assumptions, and gaps" },
    { title: "Offer Simulation", marker: "## Offer Simulation", detail: "Assess next steps and offer risk" },
    { title: "Question Bank", marker: "## Interviewer Question Bank", detail: "Generate candidate practice and interviewer questions" },
    { title: "Evidence Chain", marker: "## Evidence Chain", detail: "Summarize traceable decision evidence" },
  ],
};

const getText = () => i18n[currentLanguage] || i18n.zh;
const getReportStages = () => reportStagesByLanguage[currentLanguage] || reportStagesByLanguage.zh;

renderStreamProgress("", getText().progressWaiting, false);

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

bindClick("mockBtn", () => {
  const localizedSample = samples[currentLanguage] || samples.zh;
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
  resumeEl.value = "";
  jobEl.value = "";
  contextEl.value = "";
  candidateStageEl.value = "初筛";
  targetLevelEl.value = "";
  offerConstraintsEl.value = "";
  currentRun = null;
  reportEl.className = "report empty";
  renderEmptyReport();
  renderStreamProgress("", getText().progressWaiting, false);
  runBadgeEl.textContent = getText().runPending;
  downloadMdBtn.disabled = true;
  setInterviewerDownloadDisabled(true);
  setOfferDownloadDisabled(true);
  setJsonDownloadDisabled(true);
  appendFeedbackBtn.disabled = true;
  feedbackAgreementEl.value = "未反馈";
  feedbackQuestionUseEl.value = "未反馈";
  feedbackDisagreementReasonEl.value = "未反馈";
  feedbackEvidenceSufficiencyEl.value = "未反馈";
  feedbackRiskValidationEl.value = "未反馈";
  feedbackNotesEl.value = "";
  setStatus(getText().statusCleared);
});

generateBtn.addEventListener("click", async () => {
  const input = collectInput();
  if (!input.resume.trim() || !input.jobDescription.trim()) {
    setStatus(getText().statusMissingInput, true);
    return;
  }

  generateBtn.disabled = true;
  downloadMdBtn.disabled = true;
  setInterviewerDownloadDisabled(true);
  setOfferDownloadDisabled(true);
  setJsonDownloadDisabled(true);
  appendFeedbackBtn.disabled = true;
  runBadgeEl.textContent = getText().runGenerating;
  renderStreamingReport("", input.useRealModel ? getText().llmStreaming : getText().mockStreaming);
  setStatus(input.useRealModel ? getText().statusGeneratingLlm : getText().statusGeneratingMock);

  try {
    const report = input.useRealModel
      ? await generateWithLLM(input, (partial) => {
          renderStreamingReport(cleanReportMarkdown(partial), getText().llmStreaming);
        })
      : await streamMockReport(input);
    const cleanedReport = cleanReportMarkdown(report);

    currentRun = {
      id: `run_${Date.now()}`,
      created_at: new Date().toISOString(),
      provider: input.provider,
      model: input.model,
      mode: input.useRealModel ? "llm" : "mock",
      input_snapshot: {
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

    renderStreamingReport(buildPreviewMarkdown(currentRun), input.useRealModel ? getText().llmDone : getText().mockDone, true);
    runBadgeEl.textContent = currentRun.id;
    downloadMdBtn.disabled = false;
    setInterviewerDownloadDisabled(false);
    setOfferDownloadDisabled(false);
    setJsonDownloadDisabled(false);
    appendFeedbackBtn.disabled = false;
    setStatus(input.useRealModel ? getText().statusLlmDone : getText().statusMockDone);
  } catch (error) {
    setStatus(formatGenerationError(error), true);
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

if (downloadJsonBtn) {
  downloadJsonBtn.addEventListener("click", () => {
    if (!currentRun) return;
    currentRun.human_feedback = collectFeedback();
    currentRun = enrichEvaluationRun(currentRun);
    const filename = `evaluation-run-${currentRun.id}.json`;
    downloadFile(filename, JSON.stringify(currentRun, null, 2), "application/json;charset=utf-8");
    setStatus(getText().statusJson);
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
  downloadMdBtn.disabled = false;
  setInterviewerDownloadDisabled(false);
  setOfferDownloadDisabled(false);
  setJsonDownloadDisabled(false);
  setStatus(getText().statusFeedback);
});

function collectInput() {
  return {
    provider: providerEl.value,
    model: modelEl.value.trim(),
    apiKey: apiKeyEl.value.trim(),
    baseUrl: baseUrlEl.value.trim(),
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

function setJsonDownloadDisabled(disabled) {
  if (downloadJsonBtn) downloadJsonBtn.disabled = disabled;
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
  setText("#downloadMdBtn", text.labels.downloadCandidate);
  setText("#downloadInterviewerBtn", text.labels.downloadInterviewer);
  setText("#downloadOfferBtn", text.labels.downloadOffer);
  setText("#downloadJsonBtn", text.labels.downloadJson);
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
    runBadgeEl.textContent = text.runPending;
    setStatus(text.statusReady);
  } else {
    renderReport(buildPreviewMarkdown(currentRun));
  }
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
  reportEl.className = "report empty";
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

function appendFeedbackToReport(report, feedback) {
  const marker = "## 人工反馈记录";
  const feedbackMarkdown = `${marker}

- 是否同意系统判断：${feedback.agreement}
- 追问是否可采用：${feedback.question_use}
- 不同意原因：${feedback.disagreement_reason}
- 证据是否充分：${feedback.evidence_sufficiency}
- 面试后是否验证风险：${feedback.risk_validation}
- 人工补充意见：${feedback.notes || "未填写"}
- 记录时间：${feedback.updated_at}

### 建议回填到题库

- 将实际被问到但报告遗漏的问题，回填到“面试官候选问题库”。
- 将被证实或被推翻的证据，更新到证据可信度等级。
- 将新暴露的失败复盘、冲突处理、指标口径问题，更新到“风险与待验证”。
`;

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

  return {
    ...run,
    input_snapshot: {
      ...snapshot,
      selected_skills: snapshot.selected_skills || [],
    },
    evaluation_summary: buildEvaluationSummary(gate, requirementRows, offerLeverage, feedback),
    requirement_matches: buildRequirementMatches(requirementRows),
    interview_questions: buildStructuredInterviewQuestions(snapshot, requirementRows, feedback),
    offer_sandbox: buildStructuredOfferSandbox(snapshot, gate, offerLeverage, requirementRows),
    evidence: buildStructuredEvidence(snapshot, requirementRows),
    offer_simulation_run: buildOfferSimulationRun(run, snapshot, gate, offerLeverage, requirementRows, feedback),
    evidence_graph: buildEvidenceGraph(snapshot, requirementRows, feedback),
    feedback_distillation: buildFeedbackDistillation(feedback, requirementRows),
  };
}

function buildEvaluationSummary(gate, rows, offerLeverage, feedback) {
  const strongCount = rows.filter((row) => row.evidenceLevel === 1).length;
  const mediumCount = rows.filter((row) => row.evidenceLevel === 2).length;
  const weakCount = rows.filter((row) => row.evidenceLevel === 3 || row.isMissing).length;
  const weakestRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 2);
  const nextFocus = weakestRows.slice(0, 3).map((row) => row.capability);

  return {
    gate_result: gate.result,
    enter_sandbox: gate.enterSandbox,
    matched_count: gate.matchedCount,
    total_requirements: rows.length,
    evidence_summary: buildEvidenceSummary(rows),
    strong_evidence_count: strongCount,
    medium_evidence_count: mediumCount,
    weak_or_missing_evidence_count: weakCount,
    next_validation_focus: nextFocus,
    offer_leverage_rating: offerLeverage.rating,
    offer_leverage_summary: offerLeverage.summary,
    feedback_status: feedback
      ? {
          agreement: feedback.agreement,
          question_use: feedback.question_use,
          disagreement_reason: feedback.disagreement_reason,
          evidence_sufficiency: feedback.evidence_sufficiency,
          risk_validation: feedback.risk_validation,
        }
      : null,
  };
}

function buildRequirementMatches(rows) {
  return rows.map((row, index) => ({
    id: `req_${index + 1}`,
    capability: row.capability,
    jd_evidence: row.jdEvidence,
    resume_evidence: row.resumeEvidence,
    evidence_level: row.evidenceLevel,
    evidence_level_label: row.evidenceLevelLabel,
    evidence_reason: row.evidenceReason,
    match_status: row.matchStatus,
    is_missing: row.isMissing,
    verification_question: row.verificationQuestion,
  }));
}

function buildStructuredInterviewQuestions(snapshot, rows, feedback) {
  return rows.map((row, index) => ({
    id: `q_${index + 1}`,
    lens: interviewerLens(index),
    capability: row.capability,
    question: row.verificationQuestion,
    evidence_anchor: row.resumeEvidence,
    jd_anchor: row.jdEvidence,
    evaluation_goal: row.isMissing
      ? "补齐岗位核心能力项目证据"
      : row.evidenceLevel === 1
        ? "复核指标口径、周期和个人贡献"
        : "验证真实角色、决策链和结果归因",
    expected_signal: row.evidenceLevel === 1 ? "可复核高可信证据" : "待追问中低可信证据",
    adoption_status: feedback?.question_use || "未反馈",
  }));
}

function buildStructuredOfferSandbox(snapshot, gate, offerLeverage, rows) {
  const missingRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 3);
  const mediumRows = rows.filter((row) => row.evidenceLevel === 2);
  return {
    stage: snapshot.candidate_stage || "",
    target_level: snapshot.target_level || "",
    readiness: gate.result,
    enter_sandbox: gate.enterSandbox,
    negotiation_leverage: offerLeverage.rating,
    leverage_detail: offerLeverage.detail,
    risks: [
      ...missingRows.slice(0, 3).map((row) => `${row.capability}：${row.evidenceReason}`),
      ...mediumRows.slice(0, 2).map((row) => `${row.capability}：需追问验证真实贡献`),
    ],
    next_actions: [
      gate.nextStep,
      "面试后回填实际问题、候选人回答、证据等级变化和 Offer 约束变化",
      "仅将一级证据或已验证证据转化为职级、薪资和推进建议",
    ],
  };
}

function buildStructuredEvidence(snapshot, rows) {
  const baseEvidence = [
    {
      id: "ev_resume_snapshot",
      source_type: "resume",
      claim: snapshot.resume ? clip(snapshot.resume) : "未提供简历快照",
      confidence: snapshot.resume ? 0.6 : 0,
      source_excerpt: snapshot.resume ? clip(snapshot.resume) : "",
    },
    {
      id: "ev_jd_snapshot",
      source_type: "job_description",
      claim: snapshot.job_description ? clip(snapshot.job_description) : "未提供 JD 快照",
      confidence: snapshot.job_description ? 0.8 : 0,
      source_excerpt: snapshot.job_description ? clip(snapshot.job_description) : "",
    },
    {
      id: "ev_offer_constraints",
      source_type: "offer_constraints",
      claim: snapshot.offer_constraints ? clip(snapshot.offer_constraints) : "未提供 Offer / 谈薪约束",
      confidence: snapshot.offer_constraints ? 0.5 : 0,
      source_excerpt: snapshot.offer_constraints ? clip(snapshot.offer_constraints) : "",
    },
  ];

  const requirementEvidence = rows.map((row, index) => ({
    id: `ev_req_${index + 1}`,
    source_type: row.isMissing ? "missing_resume_evidence" : "resume_requirement_match",
    capability: row.capability,
    claim: row.isMissing ? `${row.capability} 缺少简历证据` : row.resumeEvidence,
    confidence: row.evidenceLevel === 1 ? 0.85 : row.evidenceLevel === 2 ? 0.55 : 0.25,
    evidence_level: row.evidenceLevel,
    evidence_level_label: row.evidenceLevelLabel,
    source_excerpt: row.resumeEvidence,
    jd_excerpt: row.jdEvidence,
    verification_question: row.verificationQuestion,
  }));

  return [...baseEvidence, ...requirementEvidence];
}

function buildOfferSimulationRun(run, snapshot, gate, offerLeverage, rows, feedback) {
  const missingRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 3);
  const mediumRows = rows.filter((row) => row.evidenceLevel === 2);
  const riskRows = [...missingRows, ...mediumRows].slice(0, 5);
  const supportingEvidenceIds = rows
    .map((row, index) => ({ row, id: `ev_req_${index + 1}` }))
    .filter(({ row }) => !row.isMissing && row.evidenceLevel <= 2)
    .map(({ id }) => id);

  return {
    id: `offer_${run.id}`,
    evaluation_run_id: run.id,
    created_at: run.created_at,
    stage: snapshot.candidate_stage || "",
    target_level: snapshot.target_level || "",
    readiness: gate.result,
    enter_sandbox: gate.enterSandbox,
    offer_leverage: {
      rating: offerLeverage.rating,
      summary: offerLeverage.summary,
      detail: offerLeverage.detail,
      supporting_evidence_ids: supportingEvidenceIds,
    },
    risks: riskRows.map((row, index) => ({
      id: `offer_risk_${index + 1}`,
      risk: `${row.capability}：${row.evidenceReason}`,
      severity: row.isMissing || row.evidenceLevel >= 3 ? "high" : "medium",
      evidence_ids: [`ev_req_${rows.indexOf(row) + 1}`],
      question_ids: [`q_${rows.indexOf(row) + 1}`],
      status: feedback?.risk_validation || "待验证",
    })),
    next_actions: [
      gate.nextStep,
      "面试后回填实际追问、候选人回答、证据等级变化和 Offer 约束变化",
      "仅将一级证据或面试后已证实证据转化为职级、薪资和推进建议",
    ],
    feedback_updates: feedback
      ? [
          { field: "agreement", value: feedback.agreement, action: "更新闸口判断置信度" },
          { field: "question_use", value: feedback.question_use, action: "更新追问采用状态" },
          { field: "risk_validation", value: feedback.risk_validation, action: "更新 Offer 风险状态" },
        ]
      : [],
    final_decision_hint: gate.enterSandbox
      ? "可作为下一轮面试准备和谈薪前验证输入，不代表自动录用结论"
      : "建议先补项目闭环、个人贡献和岗位匹配证据，再进入 Offer 沙盘",
  };
}

function buildEvidenceGraph(snapshot, rows, feedback) {
  const nodes = [];
  const edges = [];

  rows.forEach((row, index) => {
    const requirementId = `req_${index + 1}`;
    const evidenceId = `ev_req_${index + 1}`;
    const questionId = `q_${index + 1}`;
    const riskId = `risk_${index + 1}`;

    nodes.push({
      id: requirementId,
      type: "job_requirement",
      label: row.capability,
      summary: row.jdEvidence,
      metadata: { match_status: row.matchStatus },
    });
    nodes.push({
      id: evidenceId,
      type: "resume_evidence",
      label: row.isMissing ? `${row.capability} 缺证` : row.capability,
      summary: row.resumeEvidence,
      metadata: {
        evidence_level: row.evidenceLevel,
        evidence_level_label: row.evidenceLevelLabel,
        evidence_reason: row.evidenceReason,
      },
    });
    nodes.push({
      id: questionId,
      type: "interview_question",
      label: `${row.capability} 验证问题`,
      summary: row.verificationQuestion,
      metadata: { lens: interviewerLens(index), adoption_status: feedback?.question_use || "未反馈" },
    });

    edges.push({
      from: evidenceId,
      to: requirementId,
      type: row.isMissing ? "contradicts" : "supports",
      weight: row.evidenceLevel === 1 ? 0.85 : row.evidenceLevel === 2 ? 0.55 : 0.25,
      note: row.evidenceReason,
    });
    edges.push({
      from: questionId,
      to: evidenceId,
      type: "questions",
      weight: 0.7,
      note: "面试问题用于验证该证据的真实角色、指标口径和结果归因",
    });

    if (row.isMissing || row.evidenceLevel >= 3) {
      nodes.push({
        id: riskId,
        type: "risk",
        label: `${row.capability} 风险`,
        summary: row.evidenceReason,
        metadata: { severity: "high" },
      });
      edges.push({
        from: evidenceId,
        to: riskId,
        type: "supports",
        weight: 0.8,
        note: "低可信或缺失证据支撑风险提示",
      });
      edges.push({
        from: riskId,
        to: "offer_signal_1",
        type: "impacts_offer",
        weight: 0.65,
        note: "该风险会影响是否进入下一轮、定级或谈薪",
      });
    }
  });

  nodes.push({
    id: "offer_signal_1",
    type: "offer_signal",
    label: "Offer 推进信号",
    summary: snapshot.offer_constraints || "未提供 Offer / 谈薪约束",
    metadata: { target_level: snapshot.target_level, stage: snapshot.candidate_stage },
  });

  if (feedback) {
    nodes.push({
      id: "feedback_1",
      type: "feedback",
      label: "人工反馈",
      summary: feedback.notes || "未填写人工补充意见",
      metadata: feedback,
    });
    rows.forEach((_, index) => {
      edges.push({
        from: "feedback_1",
        to: `q_${index + 1}`,
        type: "updates",
        weight: feedback.question_use === "采用" || feedback.question_use === "改写采用" ? 0.8 : 0.35,
        note: `追问采用状态：${feedback.question_use}`,
      });
      edges.push({
        from: "feedback_1",
        to: `ev_req_${index + 1}`,
        type: feedback.risk_validation === "已推翻" ? "contradicts" : "validates",
        weight: feedback.risk_validation === "已证实" ? 0.8 : feedback.risk_validation === "已推翻" ? 0.7 : 0.4,
        note: `风险验证状态：${feedback.risk_validation}`,
      });
    });
  }

  return { nodes, edges };
}

function buildFeedbackDistillation(feedback, rows) {
  const rules = [
    {
      id: "rule_promote_adopted_question",
      when: "question_use = 采用 或 改写采用",
      then: "将相关问题升级为高价值候选追问",
      target: "interview_questions",
    },
    {
      id: "rule_demote_rejected_question",
      when: "question_use = 未采用",
      then: "将相关问题标记为低价值并进入重写池",
      target: "interview_questions",
    },
    {
      id: "rule_raise_confirmed_risk",
      when: "risk_validation = 已证实",
      then: "提高相关风险规则权重并保留为回归样本",
      target: "risk",
    },
    {
      id: "rule_lower_disproved_risk",
      when: "risk_validation = 已推翻",
      then: "降低相关风险规则权重并补充反例",
      target: "risk",
    },
    {
      id: "rule_downgrade_insufficient_evidence",
      when: "evidence_sufficiency = 不充分",
      then: "将相关结论降级为待验证",
      target: "evidence",
    },
  ];

  const actions = [];
  if (!feedback) return { rules, actions };

  if (feedback.question_use === "采用" || feedback.question_use === "改写采用") {
    actions.push({
      id: "action_promote_questions",
      type: "promote_question",
      target_id: "interview_questions",
      reason: `问题采用状态为：${feedback.question_use}`,
      status: "pending_review",
    });
  }

  if (feedback.question_use === "未采用") {
    actions.push({
      id: "action_demote_questions",
      type: "demote_question",
      target_id: "interview_questions",
      reason: "面试官明确未采用该批问题",
      status: "pending_rewrite",
    });
  }

  if (feedback.risk_validation === "已证实") {
    actions.push({
      id: "action_raise_risk_weight",
      type: "raise_risk_weight",
      target_id: "offer_simulation_run.risks",
      reason: "面试后证实系统风险提示",
      status: "pending_review",
    });
  }

  if (feedback.risk_validation === "已推翻") {
    actions.push({
      id: "action_lower_risk_weight",
      type: "lower_risk_weight",
      target_id: "offer_simulation_run.risks",
      reason: "面试后推翻系统风险提示",
      status: "pending_review",
    });
  }

  if (feedback.evidence_sufficiency === "不充分") {
    rows
      .filter((row) => row.isMissing || row.evidenceLevel >= 2)
      .slice(0, 3)
      .forEach((row, index) => {
        actions.push({
          id: `action_downgrade_claim_${index + 1}`,
          type: "downgrade_claim",
          target_id: `req_${rows.indexOf(row) + 1}`,
          reason: `${row.capability} 证据不充分：${row.evidenceReason}`,
          status: "pending_fix",
        });
      });
  }

  if (feedback.disagreement_reason && feedback.disagreement_reason !== "未反馈") {
    actions.push({
      id: "action_add_regression_case",
      type: "add_regression_case",
      target_id: "evaluation_run",
      reason: `人工判断不一致原因：${feedback.disagreement_reason}`,
      status: "pending_regression",
    });
  }

  return { rules, actions };
}

async function generateWithLLM(input, onDelta = () => {}) {
  const endpoint = `${resolveBaseUrl(input).replace(/\/$/, "")}/chat/completions`;
  const body = {
    model: input.model,
    messages: [
      { role: "system", content: buildSystemPrompt(input.language) },
      {
        role: "user",
        content: buildLlmUserPrompt(input),
      },
    ],
    temperature: 0.2,
    stream: true,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`模型接口返回 ${response.status}。${text.slice(0, 220)}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (response.body && !contentType.includes("application/json")) {
    const streamed = await readStreamResponse(response, onDelta);
    if (streamed.trim()) return streamed;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型返回为空或格式不兼容。");
  }
  await streamMarkdownByBlocks(content, onDelta, 120);
  return cleanReportMarkdown(content);
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
  if (input.language === "en") {
    return `# Output Language
English

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

  return `# 简历
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

async function readStreamResponse(response, onDelta) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let content = "";
  let lastRenderAt = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;

      if (!trimmed.startsWith("data:")) {
        content += trimmed;
        continue;
      }

      const payload = trimmed.replace(/^data:\s*/, "");
      if (payload === "[DONE]") continue;

      const delta = extractDeltaFromStreamPayload(payload);
      if (!delta) continue;

      content += delta;
      const now = performance.now();
      if (now - lastRenderAt > 70) {
        onDelta(content);
        lastRenderAt = now;
      }
    }
  }

  if (buffer.trim()) {
    const payload = buffer.trim().replace(/^data:\s*/, "");
    const delta = extractDeltaFromStreamPayload(payload);
    if (delta) content += delta;
  }

  onDelta(content);
  return content;
}

function extractDeltaFromStreamPayload(payload) {
  try {
    const data = JSON.parse(payload);
    return data?.choices?.[0]?.delta?.content || data?.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
}

function resolveBaseUrl(input) {
  if (input.baseUrl) return input.baseUrl;
  return providerDefaults[input.provider]?.baseUrl || providerDefaults.openai.baseUrl;
}

function generateMockReport(input) {
  const snapshot = normalizeSnapshot(input);
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
| 企业需要候选人具备行业/业务场景理解 | JD 证据：${clip(input.jobDescription)} | 候选人需要证明自己理解目标行业、客户场景和业务约束 | 准备最接近 JD 场景的项目 |
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

function cleanReportMarkdown(markdown) {
  return markdown
    .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[a-zA-Z]*\n?|```/g, ""))
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/\*\*/g, "")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/~~([^~\n]+)~~/g, "$1");
}

function generateMockReportEn(input) {
  const snapshot = normalizeSnapshot({ ...input, language: "en" });
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

function formatSelectedSkills(selectedSkills) {
  return selectedSkills
    .map((id) => {
      const skill = skillLibrary[id];
      if (!skill) return "";
      if (currentLanguage === "en") {
        const skillText = getText().skillCards[id];
        return skillText ? `- ${skillText[0]}: ${skillText[1]}` : "";
      }
      return `- ${skill.name}：${skill.focus}。${skill.evidence}`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildSkillQuestionMarkdown(selectedSkills, input) {
  const evidence = buildSkillEvidence(input);
  return selectedSkills
    .map((id) => {
      const skill = skillLibrary[id];
      if (!skill) return "";
      const questions = buildDeepQuestions(id, skill, evidence).map((question, index) => `${index + 1}. ${question}`).join("\n");
      return `### ${skill.name}

- 生成依据：${skill.evidence}
- 关联证据：${evidence.summary}
- 关注能力：${skill.focus}
- 好回答应证明：${skill.proof}
- 风险信号：${skill.risk}

${questions}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function buildSkillEvidence(input) {
  const text = `${input.resume} ${input.jobDescription} ${input.companyContext} ${input.offerConstraints}`;
  const projectMatch = input.resume.match(/[^。；;]*(项目|平台|系统|看板|CRM|工单|客户成功|产品|模块)[^。；;]*/);
  const jdMatch = input.jobDescription.match(/[^。；;]*(负责|要求|能力|经验|推进|指标|职责)[^。；;]*/);
  const hasMetrics = /指标|数据|提升|下降|转化|留存|响应|成本|营收|%|\d+/.test(text);
  const hasCollab = /推动|协作|研发|设计|运营|销售|客户|跨团队/.test(text);
  const hasOffer = /薪|预算|竞品|offer|Offer|到岗|期望|涨幅|入职|稳定/i.test(text);
  return {
    project: projectMatch ? projectMatch[0].trim() : "候选人简历中的核心项目经历",
    jd: jdMatch ? jdMatch[0].trim() : "JD 中的核心职责与能力要求",
    metric: hasMetrics ? "材料中出现指标或结果线索" : "指标口径和结果归因证据不足",
    collab: hasCollab ? "材料中出现跨团队推进线索" : "跨团队推进细节证据不足",
    offer: hasOffer ? "材料中出现 Offer / 到岗 / 期望约束线索" : "Offer 侧约束暂未充分提供",
    summary: `${clip(input.resume)}；${clip(input.jobDescription)}`,
  };
}

function buildDeepQuestions(id, skill, evidence) {
  const common = {
    hr: [
      `你在选择这个岗位时，如何理解 JD 中“${evidence.jd}”对应的真实工作压力？`,
      `围绕“${evidence.project}”，你希望下一份工作延续什么、避开什么？`,
      `如果团队要求你在入职后快速接手类似职责，你最担心的适应成本是什么？`,
      `你的机会选择标准如何排序？请结合岗位职责、成长空间、薪资和到岗时间说明。`,
    ],
    business: [
      `请围绕“${evidence.project}”说明：最初的业务问题是什么，你如何判断它值得做？`,
      `JD 强调“${evidence.jd}”，你过去哪个项目最能证明这项能力？证据是什么？`,
      `你提到的项目结果如何定义指标口径？哪些改善来自你的判断和动作？`,
      `如果业务方、客户和研发对优先级有冲突，你在该项目中如何做取舍？`,
      `复盘这个项目，如果重新做一次，你会改变哪个关键产品决策？`,
    ],
    project: [
      `请把“${evidence.project}”拆成目标、里程碑、依赖方和风险点。哪个节点最难推进？`,
      `JD 要求跨团队推进时，你如何建立节奏、同步机制和升级机制？`,
      `项目中资源不足或需求变化时，你砍掉了什么、保留了什么，依据是什么？`,
      `上线后你如何组织复盘？哪些结论沉淀成后续机制或产品规范？`,
      `如果面试官扮演项目经理视角，你会如何证明自己不是只参与执行，而是能推进闭环？`,
    ],
    negotiation: [
      `结合“${evidence.offer}”，哪些条件会显著影响你接受 Offer 的概率？`,
      `如果岗位职责与预期存在差异，你更看重职责完整度、薪资结构还是团队确定性？`,
      `你如何比较这个机会和其他机会？请给出可排序的决策标准。`,
      `到岗时间、薪资结构、职级定位中，哪一项最需要提前确认？为什么？`,
    ],
    decision: [
      `如果上级要求砍掉“${evidence.project}”一半预算，你如何重排优先级？请用指标说明保留和放弃的依据。`,
      `JD 强调“${evidence.jd}”，如果短期 ROI 不好看但你认为战略上必须做，你会如何争取资源？`,
      `如果项目投入三个月后效果不达预期，你会继续、收缩还是停止？请说明判断阈值和止损机制。`,
      `请讲一次你做过的高风险取舍：当时放弃了什么、保护了什么、最终结果如何复盘？`,
    ],
  };
  return common[id] || skill.questions;
}

function updateModelMode() {
  const useRealModel = providerEl.value !== "mock" && Boolean(apiKeyEl.value.trim());
  modelModeEl.textContent = useRealModel ? getText().modeReal : getText().modeMock;
  modelModeEl.classList.toggle("active", useRealModel);
}

function renderReport(markdown) {
  reportEl.className = "report";
  reportEl.innerHTML = markdownToHtml(markdown);
  renderStreamProgress(markdown, getText().reportUpdated, true);
  renderEvidenceGraph(currentRun);
}

function renderStreamingReport(markdown, label = getText().mockStreaming, isDone = false) {
  reportEl.className = "report streaming";
  const content = markdown.trim()
    ? markdownToHtml(markdown)
    : `<p class="stream-placeholder">${escapeHtml(getText().streamPlaceholder)}</p>`;
  const cursor = isDone ? "" : '<span class="stream-cursor" aria-hidden="true"></span>';

  renderStreamProgress(markdown, label, isDone);
  reportEl.innerHTML = `<div class="stream-content">${content}${cursor}</div>`;
  reportEl.scrollTop = reportEl.scrollHeight;
  renderEvidenceGraph(isDone ? currentRun : null);
}

function renderStreamProgress(markdown, label, isDone) {
  if (!reportProgressEl) return;
  reportProgressEl.innerHTML = buildStreamProgress(markdown, label, isDone);
}

function buildStreamProgress(markdown, label, isDone) {
  const activeIndex = inferStageIndex(markdown, isDone);
  const stages = getReportStages();
  const steps = stages
    .map((stage, index) => {
      const state = isDone || index < activeIndex ? "done" : index === activeIndex ? "active" : "";
      return `<div class="stream-step ${state}">
        <span>${index + 1}</span>
        <strong>${stage.title}</strong>
        <small>${stage.detail}</small>
      </div>`;
    })
    .join("");

  return `<div class="stream-title">
      <span>${escapeHtml(label)}</span>
      <small>${isDone ? getText().streamDone : getText().streaming}</small>
    </div>
    <div class="stream-steps">${steps}</div>`;
}

function inferStageIndex(markdown, isDone) {
  const stages = getReportStages();
  if (isDone) return stages.length;

  let activeIndex = 0;
  stages.forEach((stage, index) => {
    if (markdown.includes(stage.marker)) activeIndex = index;
  });
  return activeIndex;
}

function renderEvidenceGraph(run) {
  if (!evidenceGraphEl) return;
  const graph = run?.evidence_graph;
  if (!graph?.nodes?.length) {
    const emptyTitle = currentLanguage === "en" ? "Evidence Graph" : "证据关系图谱";
    const emptyText = currentLanguage === "en"
      ? "Generate a report to visualize how JD requirements, resume evidence, questions, risks, feedback, and offer signals connect."
      : "生成报告后，这里会展示 JD 要求、简历证据、追问问题、风险、反馈和 Offer 信号之间的关系。";
    evidenceGraphEl.className = "evidence-graph empty";
    evidenceGraphEl.innerHTML = `<div class="evidence-graph-empty">
      <strong>${escapeHtml(emptyTitle)}</strong>
      <span>${escapeHtml(emptyText)}</span>
    </div>`;
    return;
  }

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const grouped = groupEvidenceGraphNodes(graph.nodes);
  const labels = getEvidenceGraphLabels();
  evidenceGraphEl.className = "evidence-graph";
  evidenceGraphEl.innerHTML = `<div class="evidence-graph-head">
      <div>
        <p class="eyebrow">${escapeHtml(labels.eyebrow)}</p>
        <h3>${escapeHtml(labels.title)}</h3>
      </div>
      <span>${escapeHtml(labels.count(graph.nodes.length, graph.edges.length))}</span>
    </div>
    <div class="evidence-graph-canvas">
      <svg class="evidence-graph-lines" aria-hidden="true"></svg>
      <div class="evidence-graph-columns">
        ${renderEvidenceGraphColumn(labels.columns.requirements, grouped.requirements)}
        ${renderEvidenceGraphColumn(labels.columns.evidence, grouped.evidence)}
        ${renderEvidenceGraphColumn(labels.columns.validation, grouped.validation)}
      </div>
    </div>
    <div class="evidence-graph-detail" id="evidenceGraphDetail">
      <strong>${escapeHtml(labels.detailTitle)}</strong>
      <p>${escapeHtml(labels.detailPlaceholder)}</p>
    </div>`;

  evidenceGraphEl.querySelectorAll(".graph-node").forEach((nodeEl) => {
    nodeEl.addEventListener("click", () => {
      const node = nodesById.get(nodeEl.dataset.nodeId);
      if (!node) return;
      evidenceGraphEl.querySelectorAll(".graph-node").forEach((item) => item.classList.remove("active"));
      nodeEl.classList.add("active");
      renderEvidenceGraphDetail(node, graph.edges, nodesById);
    });
  });

  window.setTimeout(() => drawEvidenceGraphEdges(graph.edges), 0);
}

function groupEvidenceGraphNodes(nodes) {
  return {
    requirements: nodes.filter((node) => node.type === "job_requirement"),
    evidence: nodes.filter((node) => node.type === "resume_evidence"),
    validation: nodes.filter((node) => !["job_requirement", "resume_evidence"].includes(node.type)),
  };
}

function getEvidenceGraphLabels() {
  if (currentLanguage === "en") {
    return {
      eyebrow: "Traceability",
      title: "Evidence Graph",
      count: (nodes, edges) => `${nodes} nodes / ${edges} links`,
      columns: {
        requirements: "JD Requirements",
        evidence: "Resume Evidence",
        validation: "Questions / Risks / Offer",
      },
      detailTitle: "Node details",
      detailPlaceholder: "Click a node to inspect evidence, questions, and linked risks.",
    };
  }
  return {
    eyebrow: "可追溯关系",
    title: "证据关系图谱",
    count: (nodes, edges) => `${nodes} 个节点 / ${edges} 条关系`,
    columns: {
      requirements: "JD 要求",
      evidence: "简历证据",
      validation: "追问 / 风险 / Offer",
    },
    detailTitle: "节点详情",
    detailPlaceholder: "点击节点查看摘要、证据等级、验证问题和关联关系。",
  };
}

function renderEvidenceGraphColumn(title, nodes) {
  return `<div class="evidence-graph-column">
    <strong>${escapeHtml(title)}</strong>
    <div class="graph-node-list">
      ${nodes.map(renderEvidenceGraphNode).join("") || `<p class="graph-node-empty">${currentLanguage === "en" ? "No nodes" : "暂无节点"}</p>`}
    </div>
  </div>`;
}

function renderEvidenceGraphNode(node) {
  const meta = node.metadata || {};
  const badge = meta.evidence_level_label || meta.severity || meta.adoption_status || node.type;
  return `<button class="graph-node type-${escapeHtml(node.type)}" type="button" data-node-id="${escapeHtml(node.id)}">
    <span>${escapeHtml(typeLabel(node.type))}</span>
    <strong>${escapeHtml(node.label)}</strong>
    <small>${escapeHtml(clip(node.summary || ""))}</small>
    <em>${escapeHtml(String(badge || ""))}</em>
  </button>`;
}

function typeLabel(type) {
  const zh = {
    job_requirement: "JD",
    resume_evidence: "证据",
    interview_question: "追问",
    risk: "风险",
    feedback: "反馈",
    offer_signal: "Offer",
  };
  const en = {
    job_requirement: "JD",
    resume_evidence: "Evidence",
    interview_question: "Question",
    risk: "Risk",
    feedback: "Feedback",
    offer_signal: "Offer",
  };
  return (currentLanguage === "en" ? en : zh)[type] || type;
}

function renderEvidenceGraphDetail(node, edges, nodesById) {
  const detailEl = evidenceGraphEl?.querySelector("#evidenceGraphDetail");
  if (!detailEl) return;
  const related = edges
    .filter((edge) => edge.from === node.id || edge.to === node.id)
    .slice(0, 8)
    .map((edge) => {
      const otherId = edge.from === node.id ? edge.to : edge.from;
      const other = nodesById.get(otherId);
      return `<li><strong>${escapeHtml(edge.type)}</strong> ${escapeHtml(other?.label || otherId)}<br><span>${escapeHtml(edge.note || "")}</span></li>`;
    })
    .join("");
  const metadata = node.metadata ? Object.entries(node.metadata).slice(0, 6) : [];
  detailEl.innerHTML = `<strong>${escapeHtml(node.label)}</strong>
    <p>${escapeHtml(node.summary || "")}</p>
    ${metadata.length ? `<dl>${metadata.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(String(value))}</dd>`).join("")}</dl>` : ""}
    ${related ? `<ul>${related}</ul>` : `<p>${currentLanguage === "en" ? "No linked edges." : "暂无关联关系。"}</p>`}`;
}

function drawEvidenceGraphEdges(edges) {
  if (!evidenceGraphEl) return;
  const svg = evidenceGraphEl.querySelector(".evidence-graph-lines");
  const canvas = evidenceGraphEl.querySelector(".evidence-graph-canvas");
  if (!svg || !canvas) return;
  const canvasRect = canvas.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${canvasRect.width} ${canvasRect.height}`);
  svg.innerHTML = edges
    .map((edge) => {
      const fromEl = evidenceGraphEl.querySelector(`[data-node-id="${cssEscape(edge.from)}"]`);
      const toEl = evidenceGraphEl.querySelector(`[data-node-id="${cssEscape(edge.to)}"]`);
      if (!fromEl || !toEl) return "";
      const from = fromEl.getBoundingClientRect();
      const to = toEl.getBoundingClientRect();
      const x1 = from.right - canvasRect.left;
      const y1 = from.top + from.height / 2 - canvasRect.top;
      const x2 = to.left - canvasRect.left;
      const y2 = to.top + to.height / 2 - canvasRect.top;
      const mid = Math.max(30, Math.abs(x2 - x1) / 2);
      return `<path class="edge-${escapeHtml(edge.type)}" d="M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}" />`;
    })
    .join("");
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

function markdownToHtml(markdown) {
  const escaped = escapeHtml(cleanReportMarkdown(markdown));
  const lines = escaped.split("\n");
  const html = [];
  let inList = false;
  let listType = "";
  let inTable = false;
  let tableRowIndex = 0;

  const closeList = () => {
    if (inList) {
      html.push(`</${listType}>`);
      inList = false;
      listType = "";
    }
  };

  const closeTable = () => {
    if (inTable) {
      html.push("</tbody></table></div>");
      inTable = false;
      tableRowIndex = 0;
    }
  };

  for (const line of lines) {
    if (/^# /.test(line)) {
      closeList();
      closeTable();
      html.push(`<h2>${line.replace(/^# /, "")}</h2>`);
    } else if (/^## /.test(line)) {
      closeList();
      closeTable();
      html.push(`<h3>${line.replace(/^## /, "")}</h3>`);
    } else if (/^### /.test(line)) {
      closeList();
      closeTable();
      html.push(`<h4>${line.replace(/^### /, "")}</h4>`);
    } else if (isMarkdownTableLine(line)) {
      closeList();
      if (isMarkdownTableDivider(line)) continue;
      const cells = parseMarkdownTableCells(line);
      if (!inTable) {
        html.push('<div class="table-wrap"><table>');
        inTable = true;
        tableRowIndex = 0;
      }
      if (tableRowIndex === 0) {
        html.push(`<thead><tr>${cells.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>`);
      } else {
        html.push(`<tr>${cells.map((cell) => `<td class="${cellToneClass(cell)}">${cell}</td>`).join("")}</tr>`);
      }
      tableRowIndex += 1;
    } else if (/^- /.test(line)) {
      closeTable();
      if (!inList || listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      inList = true;
      html.push(`<li>${line.replace(/^- /, "")}</li>`);
    } else if (/^\d+\. /.test(line)) {
      closeTable();
      if (!inList || listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      inList = true;
      html.push(`<li>${line.replace(/^\d+\. /, "")}</li>`);
    } else if (line.trim() === "") {
      closeList();
      closeTable();
    } else {
      closeList();
      closeTable();
      html.push(`<p>${line}</p>`);
    }
  }

  closeList();
  closeTable();
  return html.join("");
}

function isMarkdownTableLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.split("|").length > 2;
}

function isMarkdownTableDivider(line) {
  return /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function parseMarkdownTableCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function cellToneClass(value) {
  if (/不匹配|低匹配|明显缺口|缺少|未体现|淘汰|不推进|风险/.test(value)) return "tone-risk";
  if (/部分匹配|中等匹配|待验证|待补|证据不足|不确定/.test(value)) return "tone-warn";
  if (/高匹配|匹配|进入下一轮|有项目证据|有相关证据|已匹配/.test(value)) return "tone-good";
  return "";
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

function buildPreviewMarkdown(run) {
  return `${buildAudienceMarkdown(run, "candidate")}

${buildAudienceMarkdown(run, "interviewer")}

${buildAudienceMarkdown(run, "offer")}`;
}

function buildAudienceMarkdown(run, audience) {
  if (getRunLanguage(run) === "en") return buildAudienceMarkdownEn(run, audience);

  const report = run.report;
  const snapshot = run.input_snapshot || {};
  const resumeEvidence = snapshot.resume ? clip(snapshot.resume) : "未提供简历快照";
  const jdEvidence = snapshot.job_description ? clip(snapshot.job_description) : "未提供 JD 快照";
  const directConclusion = buildDirectConclusion(snapshot);
  const gate = buildGateAssessment(snapshot);
  const offerLeverage = buildOfferLeverage(snapshot);
  if (audience === "candidate") {
    const body = [
      extractSection(report, "项目匹配闸口"),
      extractSection(report, "JD 隐性痛点解码"),
      extractSection(report, "岗位匹配"),
      extractSection(report, "风险与待验证"),
      extractSection(report, "候选人准备重点"),
      extractSection(report, "候选人策略建议"),
      extractSection(report, "必问追问"),
      extractSection(report, "动态校准指令"),
      extractSection(report, "证据链"),
    ]
      .filter(hasSubstantiveSection)
      .join("\n\n");
    return `# 候选人面试准备报告

## 三秒结论

${buildCandidateThreeSecondSummary(snapshot)}

## 差异化优势

${buildCandidateAdvantageCards(snapshot)}

## 招聘岗位分析

${buildConcreteJobAnalysis(snapshot)}

## 能力迁移分析

${buildAbilityTransferAnalysis(snapshot)}

## 简历与 JD 不匹配点

${buildConcreteGapTable(snapshot)}

## 今晚行动清单（简历修改意见与重点准备）

${buildCandidateRevisionAdvice(snapshot)}

## 候选人策略建议

${buildCandidateStrategyAdvice(snapshot)}

## 模拟面试路线图

${buildConcreteCandidateQuestions(snapshot)}

## 压力面试应对指南

${buildPressureInterviewGuide(snapshot)}

${body}`;
  }

  if (audience === "interviewer") {
    const generatedDecision = extractSection(report, "面试官决策辅助");
    const generatedQuestions = extractSection(report, "面试官候选问题库（供挑选）");
    const generatedLens = extractSection(report, "面试官视角库");
    const generatedEvidence = extractSection(report, "证据链");
    const recommendation = buildInterviewerRecommendation(gate);
    const body = [
      generatedDecision,
      generatedQuestions,
      generatedLens,
      generatedEvidence,
    ]
      .filter(hasSubstantiveSection)
      .join("\n\n");
    return `# 面试官提问辅助报告

## 一分钟决策结论

| 决策问题 | 当前判断 | 证据 | 面试动作 |
| --- | --- | --- | --- |
| 推荐等级 | ${recommendation.level} | ${gate.summary} | ${recommendation.action} |
| 能不能干活 | ${gate.matchedCount >= 4 ? "有较强可能，但需复核真实贡献" : gate.matchedCount >= 2 ? "可能能做相邻场景，需要验证迁移边界" : "当前证据不足"} | JD 证据：${jdEvidence}；简历证据：${resumeEvidence} | 追问最强项目的需求判断、方案取舍、研发协同、上线复盘 |
| 水分有多少 | ${directConclusion.hasMissing ? "存在缺证或包装风险" : "表面完整但仍需反包装验证"} | ${directConclusion.points} | 要求现场还原指标口径、个人动作、失败细节和决策链 |
| 是否适配团队 | 待验证 | 公司 / 面试上下文：${snapshot.company_context ? clip(snapshot.company_context) : "未提供"} | 追问冲突处理、资源协调、节奏适应和升级机制 |
| Offer 接受概率 | ${offerLeverage.rating} / 待验证 | ${offerLeverage.detail} | 面试后更新薪资期望、竞对 Offer、到岗时间和职级偏好 |

## 面试官一分钟速览

${buildInterviewerQuickBrief(snapshot)}

## 简历初评

${buildInterviewerResumeBrief(snapshot)}

## 候选人画像

${buildCandidateProfile(snapshot)}

## 结构化评分卡

${buildInterviewerScorecard(snapshot)}

## 红灯 / 绿灯信号

${buildInterviewerSignalTable(snapshot)}

## 追问路径图

${buildInterviewerFollowupPaths(snapshot)}

## 录用条件与补充验证

${buildInterviewerDecisionAdvice(snapshot)}

## 角色分化面试官模块

${buildRoleAwareInterviewerModules(snapshot)}

## 面试轮次信息传递卡

${buildInterviewHandoffCard(snapshot)}

## 面试后评估

${buildPostInterviewEvaluationTemplate(snapshot)}

${directConclusion.blockQuestions ? `## 面试官处理建议

| 结论 | 原因 | 建议 |
| --- | --- | --- |
| 当前不列举追问问题 | 全部核心能力均为待验证 / 缺证，没有足够项目锚点支撑有效追问 | 建议先要求候选人补充能证明缺口能力的项目材料；补齐后再进入追问或沙盘 |
| 暂不进入下一轮沙盘 | 简历缺少支撑 JD 核心职责的有效项目证据 | 只保留不匹配点和证据缺口，作为筛选记录 |
` : `## 面试官可选追问

${buildConcreteInterviewerQuestions(snapshot)}
`}

${body}`;
  }

  if (audience === "offer") {
    return buildOfferSandboxMarkdown(run);
  }

  return report;
}

function buildAudienceMarkdownEn(run, audience) {
  const report = run.report || "";
  const snapshot = run.input_snapshot || {};
  const gate = buildGateAssessment(snapshot);
  const offerLeverage = buildOfferLeverage(snapshot);

  if (audience === "candidate") {
    const body = [
      extractSection(report, "Project Match Gate"),
      extractSection(report, "JD Hidden Pain Point Decoding"),
      extractSection(report, "Role Match"),
      extractSection(report, "Risks and Validation Needed"),
      extractSection(report, "Candidate Preparation Priorities"),
      extractSection(report, "Must-Ask Follow-Up Questions"),
      extractSection(report, "Evidence Chain"),
    ].filter(hasSubstantiveSection).join("\n\n");

    return `# Candidate Interview Preparation Report

## Three-Second Conclusion

| Item | Conclusion | Evidence | Next Step |
| --- | --- | --- | --- |
| Gate | ${translateGateResult(gate.result)} | ${gate.matchedCount} core evidence items found | ${gate.enterSandbox ? "Proceed with validation questions." : "Request stronger project-loop evidence first."} |
| Main risk | Contribution boundary and metric definitions need validation | Resume: ${snapshot.resume ? clip(snapshot.resume) : "Not provided"} | Prepare denominator, period, before/after comparison, personal action, and retrospective. |
| Offer leverage | ${translateOfferRating(offerLeverage.rating)} | ${offerLeverage.summary} | Convert only verified impact into negotiation leverage. |

${body || report}`;
  }

  if (audience === "interviewer") {
    const body = [
      extractSection(report, "Interviewer Decision Support"),
      extractSection(report, "Interviewer Question Bank"),
      extractSection(report, "Interviewer Lens Library"),
      extractSection(report, "Evidence Chain"),
    ].filter(hasSubstantiveSection).join("\n\n");

    return `# Interviewer Question Guide

## One-Minute Decision Brief

| Decision Item | Current Judgment | Evidence | Interview Action |
| --- | --- | --- | --- |
| Recommendation | ${gate.enterSandbox ? "Conditional proceed" : "Pause / do not proceed"} | ${gate.matchedCount} matched requirement evidence items | Validate personal contribution, metric definitions, failure detail, and decision ownership. |
| Can this person do the job? | ${gate.matchedCount >= 4 ? "Likely, but verify true ownership" : gate.matchedCount >= 2 ? "Possible adjacent fit, verify transfer boundary" : "Evidence is insufficient"} | Resume: ${snapshot.resume ? clip(snapshot.resume) : "Not provided"} | Ask for a complete project loop and anti-packaging details. |
| Offer risk | ${translateOfferRating(offerLeverage.rating)} | ${offerLeverage.summary} | Update competing offers, start date, level expectation, and compensation constraints after interview. |

${body || report}`;
  }

  if (audience === "offer") return buildOfferSandboxMarkdownEn(run);

  return report;
}

function buildOfferSandboxMarkdownEn(run) {
  const report = run.report || "";
  const snapshot = run.input_snapshot || {};
  const gate = buildGateAssessment(snapshot);
  const offerLeverage = buildOfferLeverage(snapshot);
  const rows = buildRequirementEvidenceRows(snapshot);

  return `# Offer Simulation Report

## Simulation Conclusion

| Module | Current Judgment | Next Step |
| --- | --- | --- |
| Project gate | ${translateGateResult(gate.result)} | ${gate.enterSandbox ? "Continue to offer-risk validation." : "Pause progression and request stronger project evidence."} |
| Candidate stage | ${translateStage(snapshot.candidate_stage)} | Align interview-round purpose before negotiation. |
| Target level | ${snapshot.target_level || "Not provided"} | Clarify scope, level anchor, and evaluation standard. |
| Negotiation leverage | ${translateOfferRating(offerLeverage.rating)} | ${offerLeverage.detail} |
| Offer constraints | ${snapshot.offer_constraints ? clip(snapshot.offer_constraints) : "Not provided"} | Add budget, expected compensation, competing offers, start date, and team urgency. |
| Evidence credibility | ${summarizeEvidenceCounts(rows)} | First-level evidence may support pricing; pending evidence should trigger more validation. |

## Decision Matrix

| Scenario | Recommended Action | Risk Signal |
| --- | --- | --- |
| ${gate.enterSandbox ? "Can enter next validation round" : "Do not push forward yet"} | ${gate.enterSandbox ? "Validate project evidence, incident review, metric definition, and motivation constraints." : "Ask the candidate to supplement project loop, personal contribution, and role-fit evidence first."} | Candidate cannot explain ownership, denominator, trade-off, failure, or mechanism change. |
| Before negotiation | Clarify level, compensation structure, start date, competing offers, and decision criteria. | Key constraints are revealed too late. |
| After interview | Update role match, evidence credibility, acceptance probability, and negotiation risk. | Feedback is not captured and the question library cannot improve. |

## Extracted Report Context

${[
  extractSection(report, "Offer Simulation"),
  extractSection(report, "Interviewer Question Bank"),
  extractSection(report, "Interviewer Lens Library"),
  extractSection(report, "Dynamic Calibration Instruction"),
  extractSection(report, "Evidence Chain"),
].filter(hasSubstantiveSection).join("\n\n") || "No extracted offer, question bank, lens library, calibration, or evidence-chain content is available yet."}`;
}

function buildOfferSandboxMarkdown(run) {
  const report = run.report;
  const snapshot = run.input_snapshot || {};
  const gate = buildGateAssessment(snapshot);
  const offerLeverage = buildOfferLeverage(snapshot);
  const normalized = normalizeSnapshot(snapshot);
  const directConclusion = buildDirectConclusion(snapshot);
  const offerSection = extractSection(report, "Offer 沙盘推演");
  const summarySection = extractSection(report, "一页摘要");
  const gateSection = extractSection(report, "项目匹配闸口");
  const hiddenPainSection = extractSection(report, "JD 隐性痛点解码");
  const matchSection = extractSection(report, "岗位匹配");
  const riskSection = extractSection(report, "风险与待验证");
  const questionSection = extractSection(report, "面试官候选问题库（供挑选）");
  const interviewerSection = extractSection(report, "面试官视角库");
  const dynamicSection = extractSection(report, "动态校准指令");
  const evidenceSection = extractSection(report, "证据链");
  const requirementRows = buildRequirementEvidenceRows(snapshot);
  const evidenceSummary = buildEvidenceSummary(requirementRows);
  const matchedRows = requirementRows.filter((row) => !row.isMissing);
  const missingRows = requirementRows.filter((row) => row.isMissing);
  const hiddenPainRows = buildJdHiddenPainRows(snapshot);
  const sevenStepReasoning = buildOfferSevenStepReasoning({
    report,
    snapshot,
    normalized,
    gate,
    directConclusion,
    offerLeverage,
    requirementRows,
    matchedRows,
    missingRows,
    hiddenPainRows,
    sections: {
      summarySection,
      gateSection,
      hiddenPainSection,
      matchSection,
      riskSection,
      offerSection,
      questionSection,
      interviewerSection,
      dynamicSection,
      evidenceSection,
    },
  });
  const extractedAppendix = [
    offerSection,
    questionSection,
    interviewerSection,
    dynamicSection,
    evidenceSection,
  ].filter(hasSubstantiveSection).join("\n\n");

  return `# Offer 沙盘推演报告

## 沙盘结论

| 模块 | 当前判断 | 推进动作 |
| --- | --- | --- |
| 项目闸口 | ${gate.result}：${gate.summary} | ${gate.nextStep} |
| 候选人阶段 | ${normalized.candidate_stage || "未提供"} | 根据面试轮次决定是补证、深挖还是进入谈薪验证 |
| 目标职级 | ${normalized.target_level || "未提供"} | 面试前明确职级锚点、职责边界和评估标准 |
| 谈判杠杆 | ${offerLeverage.rating}：${offerLeverage.summary} | ${offerLeverage.detail} |
| Offer 约束 | ${normalized.offer_constraints ? clip(normalized.offer_constraints) : "未提供 Offer / 谈薪约束"} | 补充预算范围、候选人期望、竞对 Offer、到岗时间和团队紧急程度 |
| 证据可信度 | ${evidenceSummary} | 一级证据可用于定价，二级证据需追问，三级证据不得直接转化为 Offer 溢价 |

## 七个步骤推理总览

${sevenStepReasoning.overview}

## 七个步骤详细推演

${sevenStepReasoning.detail}

## Offer 决策矩阵

${sevenStepReasoning.decisionMatrix}

## 推进建议

| 场景 | 建议动作 | 风险信号 |
| --- | --- | --- |
| ${gate.enterSandbox ? "可进入下一轮沙盘" : "暂不建议推进"} | ${gate.enterSandbox ? "围绕项目证据、失败复盘、指标口径和动机约束继续验证" : "先要求候选人补齐项目闭环、个人贡献和岗位匹配证据"} | 候选人无法解释真实角色、指标分母、资源取舍或失败复盘 |
| 谈薪前 | 明确职级、薪资结构、到岗时间、竞对机会和候选人选择标准 | 关键约束后置暴露，导致 Offer 成功率下降 |
| 面试后 | 根据实际回答更新岗位匹配、证据可信度、入职概率和谈薪风险 | 面试反馈未回填，题库和判断无法迭代 |

## 原始报告摘录

${extractedAppendix || "原始报告中暂无可摘录的 Offer、问题库、视角库、动态校准或证据链内容。"}`
}

function buildOfferSevenStepReasoning(context) {
  const {
    normalized,
    gate,
    directConclusion,
    offerLeverage,
    requirementRows,
    matchedRows,
    missingRows,
    hiddenPainRows,
    sections,
  } = context;
  const strongestRows = [...requirementRows]
    .filter((row) => !row.isMissing)
    .sort((a, b) => a.evidenceLevel - b.evidenceLevel)
    .slice(0, 3);
  const weakestRows = (missingRows.length ? missingRows : requirementRows.filter((row) => row.evidenceLevel >= 2))
    .slice(0, 3);
  const extractedOfferSummary = summarizeSection(sections.offerSection, "原始报告未生成明确 Offer 沙盘推演正文，需要以闸口、证据和约束补推。");
  const extractedRiskSummary = summarizeSection(sections.riskSection, "原始报告未生成明确风险段落，按缺证项、约束后置和动机不清处理。");
  const extractedQuestionSummary = summarizeSection(
    [sections.questionSection, sections.interviewerSection].filter(Boolean).join("\n"),
    "原始报告未生成明确问题库，面试中应围绕项目真实性、失败复盘、指标口径和谈薪动机追问。",
  );
  const hiddenPainSummary = hiddenPainRows
    .map((row) => `${row.phrase}：${row.pressure}；准备 ${row.prep}`)
    .join("；");

  const stepRows = [
    {
      step: "1. 证据解析",
      reasoning: `先读取简历、JD、公司上下文和 Offer 约束。当前证据可信度为 ${buildEvidenceSummary(requirementRows)}。`,
      evidence: `简历：${normalized.resume ? clip(normalized.resume) : "未提供"}；JD：${normalized.job_description ? clip(normalized.job_description) : "未提供"}`,
      offerImpact: strongestRows.length
        ? `可暂作谈判锚点的证据：${strongestRows.map((row) => `${row.capability}（${row.evidenceLevelLabel}）`).join("、")}`
        : "暂未发现可直接支撑 Offer 溢价的高可信证据。",
      action: "面试前把每个关键证据补齐分母、周期、个人贡献和可复核结果。",
    },
    {
      step: "2. 匹配闸口",
      reasoning: `${gate.result}。${gate.summary}`,
      evidence: gate.bestEvidence,
      offerImpact: gate.enterSandbox
        ? "可进入下一轮，但 Offer 强度取决于后续追问能否把二级/三级证据提升为可信项目证据。"
        : "暂不建议进入谈薪或强推进，否则容易在业务面或谈薪阶段暴露核心不匹配。",
      action: gate.nextStep,
    },
    {
      step: "3. 岗位匹配",
      reasoning: `${directConclusion.label}。已匹配 ${matchedRows.length}/${requirementRows.length} 项，缺证 ${missingRows.length} 项。`,
      evidence: matchedRows.length
        ? matchedRows.map((row) => `${row.capability}：${row.resumeEvidence}`).join("；")
        : "简历未体现明确岗位匹配证据。",
      offerImpact: missingRows.length
        ? `缺证项会压低职级或薪资空间：${missingRows.slice(0, 3).map((row) => row.capability).join("、")}`
        : "岗位匹配表面完整，但仍需用反包装追问验证真实角色和指标归因。",
      action: "把岗位要求转成面试评分项，逐项记录回答质量、证据等级和是否影响 Offer 定级。",
    },
    {
      step: "4. 风险校准",
      reasoning: extractedRiskSummary,
      evidence: weakestRows.map((row) => `${row.capability}：${row.resumeEvidence}`).join("；") || "暂无明确风险证据。",
      offerImpact: "风险项决定是否降级、延后 Offer、加面或要求补材料。",
      action: "至少追问一次项目延期或线上故障，要求按时间线说明发现、止血、根因、整改和后续机制变化。",
    },
    {
      step: "5. 沙盘推演",
      reasoning: extractedOfferSummary,
      evidence: `阶段：${normalized.candidate_stage || "未提供"}；目标职级：${normalized.target_level || "未提供"}；约束：${normalized.offer_constraints ? clip(normalized.offer_constraints) : "未提供"}`,
      offerImpact: `${offerLeverage.rating}。${offerLeverage.detail}`,
      action: "在业务面后更新入职概率、竞对机会、薪资底线、到岗时间、职级锚点和团队紧急程度。",
    },
    {
      step: "6. 问题库生成",
      reasoning: extractedQuestionSummary,
      evidence: hiddenPainSummary || "JD 暂未识别出明确隐性压力源。",
      offerImpact: "问题库回答质量会决定是否推进终面、是否追加技术/业务交叉面、是否进入谈薪。",
      action: "使用业务负责人、项目推进、技术架构、谈薪顾问和决策层压力官视角交叉验证同一项目。",
    },
    {
      step: "7. 证据链收束",
      reasoning: "将简历证据、JD 证据、公司上下文、Offer 约束和面试反馈收束为可复核决策链。",
      evidence: buildEvidenceChainPlain(normalized),
      offerImpact: "只有能被证据链支撑的能力、稀缺性和到岗确定性，才应进入最终 Offer 定价。",
      action: "面试后把实际追问、候选人回答、证据等级变化和谈薪约束回填到该报告，形成最终推进建议。",
    },
  ];

  const overview = `| 步骤 | 推理结论 | Offer 影响 | 下一步 |
| --- | --- | --- | --- |
${stepRows.map((row) => `| ${row.step} | ${row.reasoning} | ${row.offerImpact} | ${row.action} |`).join("\n")}`;

  const detail = stepRows
    .map(
      (row) => `### ${row.step}

| 维度 | 内容 |
| --- | --- |
| 推理内容 | ${row.reasoning} |
| 证据来源 | ${row.evidence} |
| 对 Offer 的影响 | ${row.offerImpact} |
| 必须补充 / 验证 | ${row.action} |`,
    )
    .join("\n\n");

  const decisionMatrix = `| 决策项 | 当前判断 | 触发条件 | 建议动作 |
| --- | --- | --- | --- |
| 是否继续推进 | ${gate.enterSandbox ? "继续推进，但必须带条件验证" : "暂缓推进"} | ${gate.result}；${gate.summary} | ${gate.nextStep} |
| 职级定位 | ${normalized.target_level || "未提供"} | 岗位匹配、项目复杂度、真实决策权、研发协同深度 | 面试后根据证据等级决定维持、下调或加面 |
| 薪资 / 溢价 | ${offerLeverage.rating} | ${offerLeverage.summary} | ${offerLeverage.detail} |
| 入职概率 | 待验证 | 动机清晰、约束前置、竞对机会透明、到岗时间明确 | HR 面或谈薪前补齐选择标准和关键约束 |
| 风险处置 | ${missingRows.length ? "存在缺证风险" : "表面完整但需反包装"} | 无法解释失败、指标口径、个人贡献或技术取舍 | 追加项目复盘题和现场推演题 |`;

  return { overview, detail, decisionMatrix };
}

function summarizeSection(section, fallback) {
  if (!hasSubstantiveSection(section || "")) return fallback;
  return clip(
    section
      .replace(/^## .+$/m, "")
      .replace(/\|/g, " ")
      .replace(/---/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function buildEvidenceChainPlain(snapshot) {
  return [
    `简历：${snapshot.resume ? clip(snapshot.resume) : "未提供"}`,
    `JD：${snapshot.job_description ? clip(snapshot.job_description) : "未提供"}`,
    `上下文：${snapshot.company_context ? clip(snapshot.company_context) : "未提供"}`,
    `Offer 约束：${snapshot.offer_constraints ? clip(snapshot.offer_constraints) : "未提供"}`,
  ].join("；");
}

function extractSection(markdown, heading) {
  const pattern = new RegExp(`(^## ${escapeRegExp(heading)}\\n[\\s\\S]*?)(?=\\n## |$)`, "m");
  const match = markdown.match(pattern);
  return match ? match[1].trim() : "";
}

function hasSubstantiveSection(section) {
  const body = section.replace(/^## .+$/m, "").replace(/\s+/g, "");
  return body.length > 30;
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

function buildRequirementEvidenceRows(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  const jd = normalized.job_description || "";
  const resume = normalized.resume || "";
  const requirements = [
    { capability: "行业场景理解", keywords: ["智慧矿山", "smart mining", "GIS", "矿山", "mining", "冶金", "矿产", "行业", "industry", "B 端", "B端", "B2B", "SaaS", "企业", "enterprise"] },
    { capability: "产品规划与生命周期管理", keywords: ["产品规划", "product planning", "lifecycle", "生命周期", "0-1", "0-to-1", "0 到 1", "从零", "产品设计", "product design", "规划", "roadmap"] },
    { capability: "客户需求分析与方案设计", keywords: ["客户", "customer", "requirement", "需求分析", "技术交流", "technical communication", "方案设计", "solution", "consulting", "咨询", "调研", "research", "需求梳理"] },
    { capability: "技术架构与研发协同", keywords: ["架构", "architecture", "研发", "R&D", "engineering", "C++", "Java", "JavaScript", "database", "数据库", "operating system", "操作系统", "前后端", "backend", "frontend", "技术"] },
    { capability: "技术选型与创新探索", keywords: ["前瞻", "forward-looking", "技术选型", "technology selection", "新功能", "new feature", "专利", "patent", "技术探索", "innovation", "创新", "开源", "open source"] },
    { capability: "成本、进度、质量控制", keywords: ["成本", "cost", "进度", "schedule", "quality", "质量", "风险控制", "risk control", "协调", "coordination", "推进", "delivery", "延期", "delay", "milestone", "里程碑", "retrospective", "复盘"] },
  ];
  return requirements.map((requirement) => {
    const resumeEvidence = findEvidence(resume, requirement.keywords) || "简历未体现明确证据";
    const evidenceLevel = classifyEvidenceLevel(resumeEvidence);
    const isMissing = resumeEvidence === "简历未体现明确证据";
    return {
      capability: requirement.capability,
      jdEvidence: findEvidence(jd, requirement.keywords) || "JD 未提供明确原文",
      resumeEvidence,
      isMissing,
      evidenceLevel,
      evidenceLevelLabel: evidenceLevelLabel(evidenceLevel),
      evidenceReason: evidenceLevelReason(evidenceLevel, resumeEvidence),
      matchStatus: isMissing ? "不匹配 / 待补证" : evidenceLevel === 1 ? "匹配但仍需复核口径" : "部分匹配 / 需追问验证",
      verificationQuestion: buildVerificationQuestion(requirement.capability, resumeEvidence, evidenceLevel),
    };
  });
}

function normalizeSnapshot(input) {
  return {
    resume: input.resume || "",
    job_description: input.job_description || input.jobDescription || "",
    company_context: input.company_context || input.companyContext || "",
    candidate_stage: input.candidate_stage || input.candidateStage || "",
    target_level: input.target_level || input.targetLevel || "",
    offer_constraints: input.offer_constraints || input.offerConstraints || "",
    selected_skills: input.selected_skills || input.selectedSkills || [],
    language: input.language || "zh",
  };
}

function classifyEvidenceLevel(evidenceText) {
  if (!evidenceText || evidenceText === "简历未体现明确证据") return 3;
  const hasQuant = /(\d+(\.\d+)?\s*%|\d+\s*(万|千|个|人|家|天|周|月|年|次|单|小时|分钟|ms|元|万元|亿)|上线|版本|v\d|ROI|DAU|MAU|GMV|SLA)/i.test(evidenceText);
  const hasSpecificRole = /主导|负责|Owner|owned|led|牵头|独立|设计|designed|launched|上线|落地|delivered|交付|专利|开源/i.test(evidenceText);
  const hasVagueTeam = /我们|参与|participated|协助|supported|支持|熟悉|了解|学习|接触|团队|team/i.test(evidenceText);
  if (hasQuant && hasSpecificRole) return 1;
  if (hasSpecificRole || hasQuant) return 2;
  if (hasVagueTeam) return 3;
  return 2;
}

function evidenceLevelLabel(level) {
  if (level === 1) return "一级证据（高可信）";
  if (level === 2) return "二级证据（中可信）";
  return "三级证据（低可信 / 待验证）";
}

function evidenceLevelReason(level, evidenceText) {
  if (level === 1) return "包含量化结果、上线/版本或明确个人动作，可优先复核口径";
  if (level === 2) return "包含负责、主导、上线或定性职责描述，需要面试追问验证";
  if (!evidenceText || evidenceText === "简历未体现明确证据") return "没有可引用的简历证据";
  return "表达较模糊或偏团队成果，个人贡献边界不清";
}

function buildVerificationQuestion(capability, evidenceText, level) {
  if (!evidenceText || evidenceText === "简历未体现明确证据") {
    return `请补充一个能证明“${capability}”的项目，说明背景、目标、个人动作、结果和复盘。`;
  }
  if (level === 1) {
    return `围绕“${capability}”说明指标分母、统计周期、上线前后对比和你的直接贡献。`;
  }
  if (level === 2) {
    return `你提到“${clip(evidenceText)}”，请拆解真实角色、关键决策、协作对象和结果归因。`;
  }
  return `这段经历更像模糊团队成果，请说明你个人做了什么、为什么由你负责、失败点是什么。`;
}

function buildEvidenceSummary(rows) {
  const counts = rows.reduce(
    (acc, row) => {
      acc[row.evidenceLevel] += 1;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0 },
  );
  return `一级 ${counts[1]} 项，二级 ${counts[2]} 项，三级/缺证 ${counts[3]} 项`;
}

function buildGateAssessment(snapshot, rows = buildRequirementEvidenceRows(snapshot)) {
  const normalized = normalizeSnapshot(snapshot);
  const matchedRows = rows.filter((row) => !row.isMissing);
  const strongRows = rows.filter((row) => row.evidenceLevel === 1);
  const resume = normalized.resume || "";
  const jd = normalized.job_description || "";
  const hasTargetIndustry = /智慧矿山|矿山|GIS|冶金|矿产/i.test(resume);
  const jdNeedsTargetIndustry = /智慧矿山|矿山|GIS|冶金|矿产/i.test(jd);
  const hasTransferableSignals = /B\s*端|B端|SaaS|企业|客户|方案|架构|研发|平台|系统|0-1|0 到 1|上线|交付|推进|数据|指标|项目/i.test(resume);
  const bestEvidence = matchedRows[0]?.resumeEvidence || "简历尚未提供可直接支撑 JD 的项目证据";

  if (matchedRows.length >= 4 && (!jdNeedsTargetIndustry || hasTargetIndustry || strongRows.length >= 2)) {
    return {
      result: "匹配进入",
      enterSandbox: true,
      matchedCount: matchedRows.length,
      bestEvidence,
      summary: `已看到 ${matchedRows.length}/${rows.length} 项 JD 能力证据，具备进入下一轮沙盘的基础。`,
      nextStep: "进入下一轮沙盘，重点验证一级证据口径、失败复盘和真实决策权",
      transferPitch: "",
    };
  }

  if (matchedRows.length >= 2 || (hasTransferableSignals && matchedRows.length >= 1)) {
    return {
      result: "条件性进入（转岗适配）",
      enterSandbox: true,
      matchedCount: matchedRows.length,
      bestEvidence,
      summary: `行业或目标场景证据不足，但有 ${matchedRows.length}/${rows.length} 项可迁移能力线索，可进入条件性沙盘验证。`,
      nextStep: "使用能力迁移话术进入验证，但必须补齐行业场景、客户需求和技术方案证据",
      transferPitch: buildTransferPitch(normalized, matchedRows),
    };
  }

  return {
    result: "不匹配不推进",
    enterSandbox: false,
    matchedCount: matchedRows.length,
    bestEvidence,
    summary: `仅看到 ${matchedRows.length}/${rows.length} 项 JD 能力线索，核心项目证据不足。`,
    nextStep: "暂不进入下一轮沙盘，先补充完整项目闭环、指标口径和个人贡献证据",
    transferPitch: "",
  };
}

function buildTransferPitch(snapshot, matchedRows) {
  const anchor = matchedRows[0]?.resumeEvidence || clip(snapshot.resume) || "过往复杂项目经历";
  return `虽然我过往项目未必完全处于 JD 指定行业，但我处理过“${anchor}”这类复杂业务 / 系统问题。其核心能力包括需求拆解、客户沟通、技术方案取舍、研发协同和结果复盘，可迁移到贵司岗位。面试中我会用具体项目说明相似点、差异点和补齐行业认知的计划。`;
}

function buildOfferLeverage(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  const text = `${normalized.resume} ${normalized.company_context} ${normalized.offer_constraints}`;
  const levers = [];
  if (/竞对|竞争|其他 offer|其它 offer|Offer|offer/i.test(text)) levers.push("存在竞争机会 / Offer 线索");
  if (/S\s*级|A\s*级|绩效|晋升|核心员工|负责人/i.test(text)) levers.push("存在绩效、晋升或核心角色线索");
  if (/专利|论文|开源|著作权|标准|奖项/i.test(text)) levers.push("存在专利、论文、开源或外部成果");
  if (/智慧矿山|GIS|矿山|垂直领域|行业资源|客户资源|人脉/i.test(text)) levers.push("存在垂直领域资源或行业经验");
  if (/0-1|0 到 1|从零|上线|交付|提升|下降|%|\d+/.test(text)) levers.push("存在 0-1、上线交付或量化结果");
  const rating = levers.length >= 4 ? "强杠杆" : levers.length >= 2 ? "中杠杆" : levers.length >= 1 ? "弱杠杆" : "暂无明确杠杆";
  const summary = levers.length ? levers.slice(0, 2).join("；") : "材料中未发现竞对 Offer、绩效、专利、开源、垂直资源或明确量化成果";
  return {
    rating,
    summary,
    detail: levers.length ? `${levers.join("；")}。谈判时应转化为可量化贡献、稀缺经验和到岗确定性。` : "当前缺少可支撑溢价的明确证据，建议先补充竞对机会、绩效结果、垂直行业资源或可复核项目成果。",
  };
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

function findEvidence(text, keywords) {
  if (!text) return "";
  const parts = text
    .split(/[。；;\n]/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const hit = parts.find((part) => keywords.some((keyword) => part.toLowerCase().includes(keyword.toLowerCase())));
  return hit ? clip(hit) : "";
}

function interviewerLens(index) {
  return ["业务负责人", "产品负责人", "项目推进", "技术架构", "客户方案", "反包装验证", "决策层压力官"][index % 7];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function downloadPdfReport(run, audience, filename) {
  setStatus(getText().statusPdf);
  try {
    const html = reportToStaticHtmlDocument(run, audience);
    const pdfBlob = await renderHtmlDocumentToPdfBlob(html);
    downloadBlob(filename, pdfBlob);
    setStatus(getText().statusDownloaded(filename));
  } catch (error) {
    console.error(error);
    setStatus(getText().statusPdfFallback, true);
    openPdfPrintWindow(reportToStaticHtmlDocument(run, audience), filename);
  }
}

async function renderHtmlDocumentToPdfBlob(html) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "920px";
  iframe.style.height = "1200px";
  iframe.style.border = "0";
  iframe.srcdoc = html;
  document.body.appendChild(iframe);

  try {
    await waitForIframeLoad(iframe);
    const doc = iframe.contentDocument;
    const page = doc?.querySelector(".page");
    const styleText = Array.from(doc?.querySelectorAll("style") || []).map((style) => style.textContent || "").join("\n");
    if (!doc || !page) throw new Error("PDF render source is unavailable.");

    await waitForLayout();
    const widthPx = Math.ceil(page.getBoundingClientRect().width || 920);
    const pageHeightPx = Math.round(widthPx * 297 / 210);
    const totalHeightPx = Math.ceil(page.scrollHeight);
    const pageCount = Math.max(1, Math.ceil(totalHeightPx / pageHeightPx));
    const serializedPage = new XMLSerializer().serializeToString(page.cloneNode(true));
    const images = [];

    for (let index = 0; index < pageCount; index += 1) {
      const offset = index * pageHeightPx;
      const height = Math.min(pageHeightPx, totalHeightPx - offset);
      images.push(await renderSvgPageToJpeg({
        serializedPage,
        styleText,
        widthPx,
        pageHeightPx,
        contentHeightPx: Math.max(height, 1),
        offset,
      }));
    }

    return createPdfBlobFromJpegs(images);
  } finally {
    iframe.remove();
  }
}

function waitForIframeLoad(iframe) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("PDF render iframe timed out.")), 8000);
    iframe.addEventListener("load", () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

function waitForLayout() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function renderSvgPageToJpeg({ serializedPage, styleText, widthPx, pageHeightPx, contentHeightPx, offset }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${pageHeightPx}" viewBox="0 0 ${widthPx} ${pageHeightPx}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:${widthPx}px;height:${pageHeightPx}px;overflow:hidden;background:#ffffff;">
        <style>${escapeXml(styleText)}
          html, body { margin: 0 !important; background: #ffffff !important; }
          .page { width: ${widthPx}px !important; max-width: ${widthPx}px !important; margin: 0 !important; }
        </style>
        <div style="width:${widthPx}px;min-height:${contentHeightPx}px;transform:translateY(-${offset}px);transform-origin:top left;">
          ${serializedPage}
        </div>
      </div>
    </foreignObject>
  </svg>`;
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const image = new Image();
  image.decoding = "async";
  image.src = svgUrl;

  try {
    if (image.decode) {
      await image.decode();
    } else {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
    }

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = pageHeightPx;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    return {
      bytes: dataUrlToBytes(dataUrl),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function createPdfBlobFromJpegs(images) {
  const encoder = new TextEncoder();
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const objects = [];
  objects[1] = { text: "<< /Type /Catalog /Pages 2 0 R >>" };
  objects[2] = { text: "" };
  const pageObjectNumbers = [];
  let nextObjectNumber = 3;

  images.forEach((image, index) => {
    const imageObjectNumber = nextObjectNumber;
    objects[nextObjectNumber] = {
      dict: `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>`,
      stream: image.bytes,
    };
    nextObjectNumber += 1;

    const content = encoder.encode(`q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im${index + 1} Do Q`);
    const contentObjectNumber = nextObjectNumber;
    objects[nextObjectNumber] = {
      dict: `<< /Length ${content.length} >>`,
      stream: content,
    };
    nextObjectNumber += 1;

    const pageObjectNumber = nextObjectNumber;
    pageObjectNumbers.push(pageObjectNumber);
    objects[nextObjectNumber] = {
      text: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    };
    nextObjectNumber += 1;
  });

  objects[2] = {
    text: `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`,
  };

  const chunks = [];
  const offsets = [0];
  let byteLength = 0;
  const pushAscii = (text) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    byteLength += bytes.length;
  };
  const pushBytes = (bytes) => {
    chunks.push(bytes);
    byteLength += bytes.length;
  };

  pushAscii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    const object = objects[objectNumber];
    offsets[objectNumber] = byteLength;
    pushAscii(`${objectNumber} 0 obj\n`);
    if (object.stream) {
      pushAscii(`${object.dict}\nstream\n`);
      pushBytes(object.stream);
      pushAscii("\nendstream\nendobj\n");
    } else {
      pushAscii(`${object.text}\nendobj\n`);
    }
  }

  const xrefOffset = byteLength;
  pushAscii(`xref\n0 ${objects.length}\n`);
  pushAscii("0000000000 65535 f \n");
  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    pushAscii(`${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`);
  }
  pushAscii(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: "application/pdf" });
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openPdfPrintWindow(html, filename) {
  const pdfHtml = html.replace("</head>", `<script>window.__offerAgentPdfName = ${JSON.stringify(filename)};</script></head>`);
  const printWindow = window.open("", "_blank", "width=1180,height=900");
  if (!printWindow) {
    setStatus(getText().statusPopupBlocked, true);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(
    pdfHtml.replace(
      "</body>",
      `<script>
        window.addEventListener("load", () => {
          document.title = (window.__offerAgentPdfName || ${JSON.stringify(filename)}).replace(/\\.pdf$/i, "");
          setTimeout(() => window.print(), 400);
        });
      </script></body>`,
    ),
  );
  printWindow.document.close();
  setStatus(getText().statusPrintWindow);
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b42318" : "#687386";
}

function formatGenerationError(error) {
  const message = error?.message || String(error);
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
  if (row.isMissing) return "Not matched / evidence missing";
  if (row.evidenceLevel === 1) return "Matched, verify metric definition";
  if (row.evidenceLevel === 2) return "Partially matched / follow-up required";
  return "Pending validation";
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
