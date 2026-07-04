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
const statusEl = $("status");
const modelModeEl = $("modelMode");
const runBadgeEl = $("runBadge");
const generateBtn = $("generateBtn");
const downloadMdBtn = $("downloadMdBtn");
const downloadInterviewerBtn = $("downloadInterviewerBtn");
const downloadOfferBtn = $("downloadOfferBtn");
const feedbackAgreementEl = $("feedbackAgreement");
const feedbackQuestionUseEl = $("feedbackQuestionUse");
const feedbackNotesEl = $("feedbackNotes");
const appendFeedbackBtn = $("appendFeedbackBtn");
const skillToggleEls = Array.from(document.querySelectorAll(".skill-toggle"));

let currentRun = null;

const providerDefaults = {
  mock: { model: "mock-product-manager-v1", baseUrl: "" },
  openai: { model: "gpt-4.1-mini", baseUrl: "https://api.openai.com/v1" },
  deepseek: { model: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1" },
  qwen: { model: "qwen-plus", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  kimi: { model: "moonshot-v1-8k", baseUrl: "https://api.moonshot.cn/v1" },
  custom: { model: "", baseUrl: "" },
};

const sample = {
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
};

const systemPrompt = `你是面试准备助手。

请基于用户提供的简历、JD、Offer 沙盘上下文和已选择的虚拟面试官视角，生成中文 Markdown 面试准备报告。报告的核心用途是帮助候选人更好准备面试，同时生成可供面试官挑选使用的候选人追问题库。

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
## 项目匹配闸口
## 岗位匹配
## 项目亮点
## 风险与待验证
## Offer 沙盘推演
## 必问追问
## 候选人准备重点
## 面试官候选问题库（供挑选）
## 面试官视角库
## 证据链
## 人工反馈建议

排版要求：
- 不要输出大段纯文本。优先使用 Markdown 表格、分层列表和短句。
- “一页摘要”“项目匹配闸口”“岗位匹配”“候选人准备重点”“面试官候选问题库”“面试官视角库”建议使用 Markdown 表格呈现。
- 表格控制在 3 到 4 列，列名必须清晰，单元格内容保持短句。
- 生成内容允许使用 Markdown 结构，但最终报告不能出现多余 Markdown 装饰符，例如加粗星号、分隔线、代码围栏、引用符号、裸露表格分隔线。
- 所有报告必须先下结论，再列详细分析。
- 每一个结论都必须给出证据，表格中优先使用“结论 / 证据 / 详细说明 / 下一步”结构。
- 面向候选人的报告必须增加招聘岗位分析：企业需要候选人具备什么能力、当前简历与岗位职责的匹配程度、不匹配点和重点准备建议。
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

其中“面试官候选问题库（供挑选）”必须包含：
- 该模块服务面试官，下载版应包含简历与 JD 不匹配的点、不同面试官视角、验证简历过度包装的问题。
- 所有提问必须兼顾岗位职责与项目经历：每个问题都要说明它对应的 JD 职责，以及它要验证的候选人具体项目证据。
- 岗位要求验证问题：针对 JD 核心职责、必备能力、加分项提出若干问题。
- 项目经历追问：围绕简历中的项目追问真实角色、个人贡献、决策过程、结果归因。
- 项目经理 / 推进视角问题：追问目标拆解、里程碑、资源协调、风险控制、跨团队沟通和复盘机制。
- 候选人准备提示：帮助候选人准备项目证据、指标口径、个人贡献和复盘案例。
- 高匹配反包装追问：当简历与 JD 看起来高度匹配时，不要降低验证强度，要进一步追问候选人的真实角色、关键决策、指标口径、失败细节、技术/业务取舍和无法提前背诵的现场推演问题，用于识别简历过度包装。

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

const reportStages = [
  { title: "证据解析", marker: "## 一页摘要", detail: "读取简历、JD 与上下文" },
  { title: "匹配闸口", marker: "## 项目匹配闸口", detail: "判断是否进入下一轮沙盘" },
  { title: "岗位匹配", marker: "## 岗位匹配", detail: "校准职责要求与项目证据" },
  { title: "风险校准", marker: "## 风险与待验证", detail: "区分事实、推断和待验证项" },
  { title: "沙盘推演", marker: "## Offer 沙盘推演", detail: "评估推进路径与 Offer 风险" },
  { title: "问题库生成", marker: "## 面试官候选问题库", detail: "生成候选人准备与面试官提问题库" },
  { title: "证据链收束", marker: "## 证据链", detail: "整理可追溯判断依据" },
];

renderStreamProgress("", "等待生成报告", false);

providerEl.addEventListener("change", () => {
  const defaults = providerDefaults[providerEl.value] || providerDefaults.mock;
  modelEl.value = defaults.model;
  baseUrlEl.value = defaults.baseUrl;
  apiKeyEl.disabled = providerEl.value === "mock";
  apiKeyEl.placeholder =
    providerEl.value === "mock" ? "Mock 模式不需要 Key" : "仅保存在当前页面内存，刷新后丢失";
  updateModelMode();
});

apiKeyEl.addEventListener("input", updateModelMode);

bindClick("mockBtn", () => {
  resumeEl.value = sample.resume;
  jobEl.value = sample.job;
  contextEl.value = sample.context;
  candidateStageEl.value = "业务一面";
  targetLevelEl.value = "中级产品经理";
  offerConstraintsEl.value = sample.offerConstraints;
  providerEl.value = "mock";
  providerEl.dispatchEvent(new Event("change"));
  setStatus("已填充脱敏样例。可以直接生成 Mock 报告。");
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
  reportEl.innerHTML = '<div class="empty-state"><span class="empty-mark">OA</span><h3>等待生成报告</h3><p>报告会覆盖候选人准备重点、岗位匹配、Offer 沙盘推演、面试官候选问题库、证据链和人工反馈建议。</p></div>';
  renderStreamProgress("", "等待生成报告", false);
  runBadgeEl.textContent = "尚未生成";
  downloadMdBtn.disabled = true;
  setInterviewerDownloadDisabled(true);
  setOfferDownloadDisabled(true);
  appendFeedbackBtn.disabled = true;
  feedbackAgreementEl.value = "未反馈";
  feedbackQuestionUseEl.value = "未反馈";
  feedbackNotesEl.value = "";
  setStatus("已清空当前页面内存中的 Key、输入和报告。");
});

generateBtn.addEventListener("click", async () => {
  const input = collectInput();
  if (!input.resume.trim() || !input.jobDescription.trim()) {
    setStatus("请先填写简历和 JD。", true);
    return;
  }

  generateBtn.disabled = true;
  downloadMdBtn.disabled = true;
  setInterviewerDownloadDisabled(true);
  setOfferDownloadDisabled(true);
  appendFeedbackBtn.disabled = true;
  runBadgeEl.textContent = "生成中...";
  renderStreamingReport("", input.useRealModel ? "真实模型流式生成中" : "Mock 分块生成中");
  setStatus(input.useRealModel ? "正在流式生成报告..." : "正在分块生成 Mock 沙盘报告...");

  try {
    const report = input.useRealModel
      ? await generateWithLLM(input, (partial) => {
          renderStreamingReport(cleanReportMarkdown(partial), "真实模型流式生成中");
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
      },
      report: cleanedReport,
    };

    renderStreamingReport(buildPreviewMarkdown(currentRun), input.useRealModel ? "真实模型生成完成" : "Mock 分块生成完成", true);
    runBadgeEl.textContent = currentRun.id;
    downloadMdBtn.disabled = false;
    setInterviewerDownloadDisabled(false);
    setOfferDownloadDisabled(false);
    appendFeedbackBtn.disabled = false;
    setStatus(input.useRealModel ? "真实模型报告已生成。请下载到本地保存。" : "Mock 沙盘报告已生成。请下载到本地保存。");
  } catch (error) {
    setStatus(formatGenerationError(error), true);
  } finally {
    generateBtn.disabled = false;
  }
});

downloadMdBtn.addEventListener("click", () => {
  if (!currentRun) return;
  currentRun.human_feedback = collectFeedback();
  downloadPdfReport(currentRun, "candidate", `candidate-report-${currentRun.id}.pdf`);
});

if (downloadInterviewerBtn) {
  downloadInterviewerBtn.addEventListener("click", () => {
    if (!currentRun) return;
    currentRun.human_feedback = collectFeedback();
    downloadPdfReport(currentRun, "interviewer", `interviewer-report-${currentRun.id}.pdf`);
  });
}

if (downloadOfferBtn) {
  downloadOfferBtn.addEventListener("click", () => {
    if (!currentRun) return;
    currentRun.human_feedback = collectFeedback();
    downloadPdfReport(currentRun, "offer", `offer-sandbox-${currentRun.id}.pdf`);
  });
}

appendFeedbackBtn.addEventListener("click", () => {
  if (!currentRun) {
    setStatus("请先生成报告，再写入人工反馈。", true);
    return;
  }

  const feedback = collectFeedback();
  currentRun.human_feedback = feedback;
  currentRun.report = appendFeedbackToReport(currentRun.report, feedback);
  renderReport(buildPreviewMarkdown(currentRun));
  downloadMdBtn.disabled = false;
  setInterviewerDownloadDisabled(false);
  setOfferDownloadDisabled(false);
  setStatus("人工反馈已写入当前报告。请下载保存，刷新页面后不会保留。");
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

function collectFeedback() {
  return {
    agreement: feedbackAgreementEl.value,
    question_use: feedbackQuestionUseEl.value,
    notes: feedbackNotesEl.value.trim(),
    updated_at: new Date().toISOString(),
  };
}

function appendFeedbackToReport(report, feedback) {
  const marker = "## 人工反馈记录";
  const feedbackMarkdown = `${marker}

- 是否同意系统判断：${feedback.agreement}
- 追问是否可采用：${feedback.question_use}
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

async function generateWithLLM(input, onDelta = () => {}) {
  const endpoint = `${resolveBaseUrl(input).replace(/\/$/, "")}/chat/completions`;
  const body = {
    model: input.model,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `# 简历\n${input.resume}\n\n# JD\n${input.jobDescription}\n\n# 公司 / 面试上下文\n${input.companyContext || "无"}\n\n# Offer 沙盘上下文\n候选人阶段：${input.candidateStage}\n目标职级：${input.targetLevel || "未提供"}\nOffer / 谈薪约束：${input.offerConstraints || "未提供"}\n\n# 已选择面试官视角\n${formatSelectedSkills(input.selectedSkills)}`,
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

async function streamMockReport(input) {
  const report = generateMockReport(input);
  await streamMarkdownByBlocks(report, (partial) => {
    renderStreamingReport(partial, "Mock 分块生成中");
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
      return skill ? `- ${skill.name}：${skill.focus}。${skill.evidence}` : "";
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
  modelModeEl.textContent = useRealModel ? "当前模式：真实模型调用" : "当前模式：Mock Demo";
  modelModeEl.classList.toggle("active", useRealModel);
}

function renderReport(markdown) {
  reportEl.className = "report";
  reportEl.innerHTML = markdownToHtml(markdown);
  renderStreamProgress(markdown, "报告已更新", true);
}

function renderStreamingReport(markdown, label = "分块生成中", isDone = false) {
  reportEl.className = "report streaming";
  const content = markdown.trim()
    ? markdownToHtml(markdown)
    : '<p class="stream-placeholder">正在建立候选人、岗位、沙盘与面试官视角证据索引...</p>';
  const cursor = isDone ? "" : '<span class="stream-cursor" aria-hidden="true"></span>';

  renderStreamProgress(markdown, label, isDone);
  reportEl.innerHTML = `<div class="stream-content">${content}${cursor}</div>`;
  reportEl.scrollTop = reportEl.scrollHeight;
}

function renderStreamProgress(markdown, label, isDone) {
  if (!reportProgressEl) return;
  reportProgressEl.innerHTML = buildStreamProgress(markdown, label, isDone);
}

function buildStreamProgress(markdown, label, isDone) {
  const activeIndex = inferStageIndex(markdown, isDone);
  const steps = reportStages
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
      <small>${isDone ? "已完成" : "分块输出中"}</small>
    </div>
    <div class="stream-steps">${steps}</div>`;
}

function inferStageIndex(markdown, isDone) {
  if (isDone) return reportStages.length;

  let activeIndex = 0;
  reportStages.forEach((stage, index) => {
    if (markdown.includes(stage.marker)) activeIndex = index;
  });
  return activeIndex;
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
  const createdAt = new Date(run.created_at).toLocaleString("zh-CN");
  const reportTitle =
    audience === "candidate"
      ? "候选人面试准备报告"
      : audience === "interviewer"
        ? "面试官提问辅助报告"
        : audience === "offer"
          ? "Offer 沙盘推演报告"
          : "面试准备报告";
  const reportEyebrow =
    audience === "candidate"
      ? "候选人模块"
      : audience === "interviewer"
        ? "面试官模块"
        : audience === "offer"
          ? "Offer 推演模块"
          : "Offer 沙盘 + 面试官视角库";
  const printFilename = options.printFilename || `${reportTitle}.pdf`;
  const autoPrintScript = options.autoPrint
    ? `<script>
      window.addEventListener("load", () => {
        document.title = ${JSON.stringify(printFilename.replace(/\.pdf$/i, ""))};
        window.setTimeout(() => window.print(), 400);
      });
    </script>`
    : "";
  return `<!doctype html>
<html lang="zh-CN">
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
          background: none;
          padding: 20px 0;
        }

        .cover {
          break-after: avoid;
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
        <p class="eyebrow">${reportEyebrow}</p>
        <h1>${reportTitle}</h1>
        <div class="meta">
          <div>
            <span>生成时间</span>
            <strong>${escapeHtml(createdAt)}</strong>
          </div>
          <div>
            <span>模型模式</span>
            <strong>${escapeHtml(run.mode === "llm" ? "真实模型" : "Mock Demo")}</strong>
          </div>
          <div>
            <span>模型名称</span>
            <strong>${escapeHtml(run.model || "未填写")}</strong>
          </div>
        </div>
      </section>
      <section class="report-body">
        ${markdownToHtml(markdown)}
      </section>
    </main>
  </body>
</html>`;
}

function buildPreviewMarkdown(run) {
  return `${buildAudienceMarkdown(run, "candidate")}

${buildAudienceMarkdown(run, "interviewer")}

${buildAudienceMarkdown(run, "offer")}`;
}

function buildAudienceMarkdown(run, audience) {
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
      extractSection(report, "必问追问"),
      extractSection(report, "动态校准指令"),
      extractSection(report, "证据链"),
    ]
      .filter(hasSubstantiveSection)
      .join("\n\n");
    return `# 候选人面试准备报告

## 先看结论

| 结论 | 证据 | 不匹配 / 待验证点 | 下一步 |
| --- | --- | --- | --- |
| ${directConclusion.label} | JD 证据：${jdEvidence}；简历证据：${resumeEvidence} | ${directConclusion.points} | ${directConclusion.nextStep} |
| 项目匹配闸口 | ${gate.summary} | ${gate.result} | ${gate.nextStep} |
| 谈判杠杆 | ${offerLeverage.detail} | ${offerLeverage.rating} | 准备可量化溢价依据和约束说明 |

## 招聘岗位分析

${buildConcreteJobAnalysis(snapshot)}

## 简历与 JD 不匹配点

${buildConcreteGapTable(snapshot)}

## 简历修改意见与重点准备

${buildCandidateRevisionAdvice(snapshot)}

## 建议重点准备的问题

${buildConcreteCandidateQuestions(snapshot)}

${body}`;
  }

  if (audience === "interviewer") {
    const body = directConclusion.blockQuestions
      ? [
          extractSection(report, "项目匹配闸口"),
          extractSection(report, "岗位匹配"),
          extractSection(report, "证据链"),
        ]
          .filter(hasSubstantiveSection)
          .join("\n\n")
      : [
          extractSection(report, "项目匹配闸口"),
          extractSection(report, "JD 隐性痛点解码"),
          extractSection(report, "岗位匹配"),
          extractSection(report, "风险与待验证"),
          extractSection(report, "面试官候选问题库（供挑选）"),
          extractSection(report, "面试官视角库"),
          extractSection(report, "动态校准指令"),
          extractSection(report, "证据链"),
        ]
          .filter(hasSubstantiveSection)
          .join("\n\n");
    return `# 面试官提问辅助报告

## 先看结论

| 结论 | 证据 | 不匹配 / 待验证点 | 下一步 |
| --- | --- | --- | --- |
| ${directConclusion.label} | JD 证据：${jdEvidence}；简历证据：${resumeEvidence} | ${directConclusion.points} | ${directConclusion.interviewerNextStep} |
| 项目匹配闸口 | ${gate.summary} | ${gate.result} | ${gate.nextStep} |
| 谈判杠杆 | ${offerLeverage.detail} | ${offerLeverage.rating} | 面试后更新薪资期望、竞对 Offer、到岗时间和职级偏好 |

## 简历初评

${buildInterviewerResumeBrief(snapshot)}

## 简历与 JD 不匹配点

${buildConcreteGapTable(snapshot)}

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
  return `| 准备问题 | 对应岗位职责 | 当前项目锚点 | 回答要点 |
| --- | --- | --- | --- |
${rows.map((row) => `| 请用一个项目证明你具备“${row.capability}”，你当时的真实角色和关键决策是什么？ | ${row.jdEvidence} | ${row.resumeEvidence} | 讲清背景、目标、约束、个人动作、结果指标和复盘；当前证据等级：${row.evidenceLevelLabel} |`).join("\n")}
| 请复盘一次项目延期或线上故障，你如何发现、止血、定位根因并做长期整改？ | 成本、进度、质量控制 | 失败、延期、事故或冲突项目 | 必须讲出时间线、影响范围、根因、整改机制和后续项目中的机制变化 |`;
}

function buildCandidateRevisionAdvice(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot);
  const missingRows = rows.filter((row) => row.isMissing);
  const targetRows = missingRows.length ? missingRows : rows.slice(0, 4);
  return `| 需要修改 / 准备的点 | 当前问题 | 修改建议 | 面试准备材料 |
| --- | --- | --- | --- |
${targetRows.map((row) => {
  const problem = row.isMissing ? `简历没有体现“${row.capability}”的项目证据` : `简历已有“${row.capability}”线索，但当前仅为${row.evidenceLevelLabel}`;
  return `| ${row.capability} | ${problem} | 在简历中补充一个对应项目，写清你的真实角色、关键动作、结果指标和复盘 | 准备项目背景、目标、约束、个人贡献、指标口径、失败或取舍案例 |`;
}).join("\n")}`;
}

function buildConcreteInterviewerQuestions(snapshot) {
  const rows = buildRequirementEvidenceRows(snapshot).slice(0, 6);
  return `| 面试官视角 | 对应 JD 职责 | 候选人项目锚点 | 可选追问 |
| --- | --- | --- | --- |
${rows.map((row, index) => `| ${interviewerLens(index)} | ${row.jdEvidence} | ${row.resumeEvidence} | ${row.verificationQuestion} |`).join("\n")}
| 反包装验证 | 成本、进度、质量控制 | 项目延期、线上故障或失败复盘 | 请按时间线还原一次真实线上故障或延期，说明发现、止血、根因、整改和后续机制变化。 |
| 决策层压力官 | 战略取舍、预算削减、资源约束 | 最核心项目或模块 | 如果上级砍掉一半预算，你如何用指标重排优先级并说服我？ |`;
}

function buildRequirementEvidenceRows(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  const jd = normalized.job_description || "";
  const resume = normalized.resume || "";
  const requirements = [
    { capability: "行业场景理解", keywords: ["智慧矿山", "GIS", "矿山", "冶金", "矿产", "行业", "B 端", "B端", "SaaS", "企业"] },
    { capability: "产品规划与生命周期管理", keywords: ["产品规划", "生命周期", "0-1", "0 到 1", "从零", "产品设计", "规划"] },
    { capability: "客户需求分析与方案设计", keywords: ["客户", "需求分析", "技术交流", "方案设计", "咨询", "调研", "需求梳理"] },
    { capability: "技术架构与研发协同", keywords: ["架构", "研发", "C++", "Java", "JavaScript", "数据库", "操作系统", "前后端", "技术"] },
    { capability: "技术选型与创新探索", keywords: ["前瞻", "技术选型", "新功能", "专利", "技术探索", "创新", "开源"] },
    { capability: "成本、进度、质量控制", keywords: ["成本", "进度", "质量", "风险控制", "协调", "推进", "延期", "里程碑", "复盘"] },
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
  };
}

function classifyEvidenceLevel(evidenceText) {
  if (!evidenceText || evidenceText === "简历未体现明确证据") return 3;
  const hasQuant = /(\d+(\.\d+)?\s*%|\d+\s*(万|千|个|人|家|天|周|月|年|次|单|小时|分钟|ms|元|万元|亿)|上线|版本|v\d|ROI|DAU|MAU|GMV|SLA)/i.test(evidenceText);
  const hasSpecificRole = /主导|负责|Owner|牵头|独立|设计|上线|落地|交付|专利|开源/i.test(evidenceText);
  const hasVagueTeam = /我们|参与|协助|支持|熟悉|了解|学习|接触|团队/i.test(evidenceText);
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
  setStatus("正在生成 PDF，请稍候...");
  try {
    const html = reportToStaticHtmlDocument(run, audience);
    const pdfBlob = await renderHtmlDocumentToPdfBlob(html);
    downloadBlob(filename, pdfBlob);
    setStatus(`已下载 ${filename}。`);
  } catch (error) {
    console.error(error);
    setStatus("直接下载 PDF 失败，已打开打印窗口作为降级方案。", true);
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
    setStatus("PDF 窗口被浏览器拦截，请允许弹窗后重试。", true);
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
  setStatus("已打开 PDF 打印窗口，请在打印对话框中选择“保存为 PDF”。");
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b42318" : "#687386";
}

function formatGenerationError(error) {
  const message = error?.message || String(error);
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return "生成失败：浏览器直连被模型服务商跨域策略拦截。请先用 Mock Demo，或填写你自己的代理 / Serverless 兼容地址。";
  }
  return `生成失败：${message}`;
}

providerEl.dispatchEvent(new Event("change"));
