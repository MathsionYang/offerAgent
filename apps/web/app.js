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
const statusEl = $("status");
const modelModeEl = $("modelMode");
const runBadgeEl = $("runBadge");
const generateBtn = $("generateBtn");
const downloadMdBtn = $("downloadMdBtn");
const downloadJsonBtn = $("downloadJsonBtn");
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
    "招聘中级产品经理，负责企业服务产品的需求分析、产品规划、跨团队推进和指标复盘。要求具备 B 端 SaaS 经验、数据意识、复杂项目推进能力和良好的沟通表达。加分项：有客户成功、工单、CRM 或数据产品经验。",
  context:
    "公司为成长期 B 端 SaaS 团队，希望候选人能独立负责客户成功相关产品模块。面试重点：需求判断、指标意识、跨团队推动、复盘能力。",
  offerConstraints:
    "目标职级：中级产品经理。预算较紧，希望候选人 4 周内到岗。候选人可能同时接触另一家 CRM 公司，需要验证动机和岗位偏好。",
};

const systemPrompt = `你是面试准备助手。

请基于用户提供的简历、JD、Offer 沙盘上下文和已选择的虚拟面试官视角，生成中文 Markdown 面试准备报告。报告的核心用途是帮助候选人更好准备面试，同时生成可供面试官挑选使用的候选人追问题库。

必须遵守：
- 不输出自动录用或淘汰结论。
- 不使用年龄、性别、婚育、照片、籍贯等敏感信息作为判断依据。
- 缺少证据时只能标注为待验证。
- 每个关键判断必须引用简历或 JD 的具体证据。
- 潜力只能表达为行为证据和待验证假设。
- 报告优先服务于候选人的面试准备，帮助候选人补齐项目证据、表达结构和风险预案。
- 报告同时服务于面试官提问，输出可挑选的岗位要求、项目经历、项目推进和 Offer 动机问题。

请使用以下标题：
## 一页摘要
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

其中“候选人准备重点”必须包含：
- 候选人应准备的项目故事：背景、目标、约束、动作、结果、复盘。
- 候选人应补齐的证据：指标口径、个人贡献、关键决策、协作对象、失败或反思案例。
- 候选人应提前演练的表达：自我介绍、项目讲述、岗位匹配、动机与期望。

其中“面试官候选问题库（供挑选）”必须包含：
- 岗位要求验证问题：针对 JD 核心职责、必备能力、加分项提出若干问题。
- 项目经历追问：围绕简历中的项目追问真实角色、个人贡献、决策过程、结果归因。
- 项目经理 / 推进视角问题：追问目标拆解、里程碑、资源协调、风险控制、跨团队沟通和复盘机制。
- 候选人准备提示：帮助候选人准备项目证据、指标口径、个人贡献和复盘案例。

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
};

const reportStages = [
  { title: "证据解析", marker: "## 一页摘要", detail: "读取简历、JD 与上下文" },
  { title: "岗位匹配", marker: "## 岗位匹配", detail: "校准硬性要求与差距" },
  { title: "风险校准", marker: "## 风险与待验证", detail: "区分事实、推断和待验证项" },
  { title: "沙盘推演", marker: "## Offer 沙盘推演", detail: "评估推进路径与 Offer 风险" },
  { title: "问题库生成", marker: "## 面试官候选问题库", detail: "生成候选人准备与面试官提问题库" },
  { title: "证据链收束", marker: "## 证据链", detail: "整理可追溯判断依据" },
];

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

$("mockBtn").addEventListener("click", () => {
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

$("clearBtn").addEventListener("click", () => {
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
  runBadgeEl.textContent = "尚未生成";
  downloadMdBtn.disabled = true;
  downloadJsonBtn.disabled = true;
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
  downloadJsonBtn.disabled = true;
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

    renderStreamingReport(cleanedReport, input.useRealModel ? "真实模型生成完成" : "Mock 分块生成完成", true);
    runBadgeEl.textContent = currentRun.id;
    downloadMdBtn.disabled = false;
    downloadJsonBtn.disabled = false;
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
  downloadFile(
    `offeragent-${currentRun.id}.html`,
    reportToStaticHtmlDocument(currentRun),
    "text/html;charset=utf-8",
  );
});

downloadJsonBtn.addEventListener("click", () => {
  if (!currentRun) return;
  currentRun.human_feedback = collectFeedback();
  downloadFile(
    `offeragent-${currentRun.id}.json`,
    JSON.stringify(currentRun, null, 2),
    "application/json;charset=utf-8",
  );
});

appendFeedbackBtn.addEventListener("click", () => {
  if (!currentRun) {
    setStatus("请先生成报告，再写入人工反馈。", true);
    return;
  }

  const feedback = collectFeedback();
  currentRun.human_feedback = feedback;
  currentRun.report = appendFeedbackToReport(currentRun.report, feedback);
  renderReport(currentRun.report);
  downloadMdBtn.disabled = false;
  downloadJsonBtn.disabled = false;
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
  const hasB2B = /B\s*端|SaaS|企业|客户|工单|CRM/i.test(input.resume + input.jobDescription);
  const hasMetrics = /指标|数据|提升|下降|转化|留存|响应|成本|营收|%|\d+/.test(input.resume);
  const hasCollab = /推动|协作|研发|设计|运营|销售|客户/.test(input.resume);
  const hasOfferRisk = /薪|预算|竞品|offer|Offer|到岗|期望|涨幅|入职|稳定/i.test(
    `${input.resume} ${input.companyContext} ${input.offerConstraints}`,
  );
  const skillQuestions = buildSkillQuestionMarkdown(input.selectedSkills, input);

  const match = hasB2B && hasMetrics && hasCollab ? "基本匹配，建议进入业务面试前重点验证" : "部分匹配，需要补充关键证据";
  const offerReadiness = hasB2B && hasMetrics && hasCollab && !hasOfferRisk ? "可继续推进面试验证" : "需要先补齐关键证据与动机信息";

  return `# 面试准备报告

## 一页摘要

- 岗位匹配倾向：${match}。
- 最大亮点：候选人简历中出现与 B 端产品、跨团队推进或指标结果相关的经历。
- 最大风险：简历中的“负责 / 主导 / 推动”仍需要还原真实角色、决策过程和结果归因。
- Offer 沙盘结论：候选人当前处于“${input.candidateStage}”阶段，${offerReadiness}。
- 必问重点：需求判断、指标口径、优先级取舍、跨团队推进、项目复盘和入职动机。

## 分析结果

- 当前阶段建议把该候选人作为“面试前重点验证对象”，而不是直接给录用或淘汰结论。
- 系统判断依据来自简历、JD 和上下文中的岗位相关证据。
- 关键不确定性集中在个人贡献、指标口径和项目复盘深度。

## 岗位匹配

- B 端 / SaaS 经验：${hasB2B ? "有相关证据" : "证据不足，需追问"}。
- 数据意识：${hasMetrics ? "有初步证据，但需确认指标口径" : "证据不足，需追问"}。
- 跨团队推动：${hasCollab ? "有初步证据，但需确认候选人真实贡献" : "证据不足，需追问"}。

## 项目亮点

- 简历中包含与目标岗位相关的项目描述，可作为业务面试的核心切入点。
- 若候选人确实主导需求判断、方案设计和跨团队落地，具备较高岗位相关性。

## 风险与待验证

- 项目成果可能是团队成果，需要确认候选人的个人贡献。
- 指标改善需要确认统计口径、前后对比周期和候选人的具体动作。
- “主导 / 负责”需要拆解为需求判断、优先级取舍、推动过程和复盘结果。
- Offer 侧风险：${hasOfferRisk ? "存在预算、期望、竞争机会或到岗时间相关信息，需在面试后段进一步确认。" : "暂未发现明确 Offer 侧约束，但仍需验证候选人动机和到岗意愿。"}

## Offer 沙盘推演

- 当前阶段：${input.candidateStage}。
- 目标职级：${input.targetLevel || "未提供，建议面试前明确职级锚点。"}
- 推进建议：先完成岗位硬性匹配验证，再进入动机、薪资和到岗可行性确认。
- 录用前关键门槛：个人贡献证据、指标口径、跨团队推动案例、岗位动机和期望匹配。
- 谈薪 / Offer 约束：${input.offerConstraints || "未提供，建议补充预算范围、候选人期望、竞争 Offer 和到岗时间。"}
- 沙盘下一步：根据面试回答更新“岗位匹配、项目可信度、入职概率、谈薪风险”四个状态。

## 必问追问

1. 这个项目最初要解决的真实用户问题是什么？你如何判断它不是伪需求？
2. 你提到的结果指标具体口径是什么？上线前后的对比周期如何定义？
3. 如果研发资源不足，你当时砍掉或延后的需求是什么？依据是什么？
4. 项目推进中最大的跨团队阻力是什么？你具体做了哪些推动动作？
5. 复盘这个项目，如果重新做一次，你会改变哪个关键决策？

## 候选人准备重点

- 项目讲述：准备每个核心项目的“背景、目标、约束、动作、结果、复盘”，避免只讲职责名称。
- 证据补齐：对简历中的数字结果，准备指标口径、统计周期、对照组和个人动作。
- 表达演练：围绕 JD 中的核心职责，准备 2 到 3 个最能证明匹配度的项目故事。
- 风险预案：对个人贡献、项目失败、跨团队冲突、Offer 动机等高频追问提前准备真实回答。

## 面试官候选问题库（供挑选）

### A. 岗位要求验证问题

1. JD 要求你具备的核心能力中，哪一项你认为自己证据最强？请用一个项目说明。
2. 这个岗位强调 ${hasB2B ? "B 端 / SaaS 场景" : "目标业务场景"}，你过去最相似的项目是什么？相似点和差异点分别是什么？
3. 如果入职后第一个月只能完成一件最关键的事，你会如何判断优先级？
4. 请举例说明你如何把岗位目标拆成可衡量指标，并推动团队围绕指标行动。

### B. 项目经历追问

1. 你在项目中的真实角色是什么：负责人、核心参与者还是协作支持？哪些决策由你做出？
2. 项目开始时的业务目标、用户问题和约束条件分别是什么？
3. 项目过程中最大的风险是什么？你是提前识别的，还是问题发生后处理的？
4. 项目结果中哪些是你个人动作直接带来的，哪些更依赖团队或外部条件？

### C. 项目经理 / 推进视角问题

1. 你如何拆解项目里程碑？哪些节点最容易延期，为什么？
2. 当研发、设计、运营或客户方目标不一致时，你如何推进共识？
3. 如果关键资源被临时抽走，你会如何调整范围、节奏和沟通预期？
4. 项目上线后你如何组织复盘？哪些结论进入了后续机制或产品迭代？

### D. 候选人使用方式

- 候选人可用这些问题做模拟面试，检查项目讲述是否完整。
- 面试官可从问题库中挑选最贴近 JD 的问题，避免泛泛提问。
- 每个问题都应回到候选人的项目证据、岗位职责和个人贡献。

## 面试官视角库

${skillQuestions}

## 证据链

- 简历证据：${clip(input.resume)}
- JD 证据：${clip(input.jobDescription)}
- 上下文证据：${input.companyContext ? clip(input.companyContext) : "未提供额外上下文。"}
- Offer 沙盘证据：${input.offerConstraints ? clip(input.offerConstraints) : "未提供 Offer / 谈薪约束。"}

## 人工反馈建议

- 面试官是否同意岗位匹配倾向：同意 / 部分同意 / 不同意。
- 系统生成问题是否被采用：采用 / 改写采用 / 未采用。
- 风险点是否在面试中被验证：已验证 / 部分验证 / 未验证。
- 需要补充的岗位标准或公司偏好：请人工填写。
`;
}

function cleanReportMarkdown(markdown) {
  return markdown
    .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "$1")
    .replace(/\*\*/g, "");
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
  return selected.length ? selected : ["hr", "business", "project"];
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
}

function renderStreamingReport(markdown, label = "分块生成中", isDone = false) {
  reportEl.className = "report streaming";
  const content = markdown.trim()
    ? markdownToHtml(markdown)
    : '<p class="stream-placeholder">正在建立候选人、岗位、沙盘与面试官视角证据索引...</p>';
  const cursor = isDone ? "" : '<span class="stream-cursor" aria-hidden="true"></span>';

  reportEl.innerHTML = `${buildStreamProgress(markdown, label, isDone)}<div class="stream-content">${content}${cursor}</div>`;
  reportEl.scrollTop = reportEl.scrollHeight;
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

  return `<div class="stream-progress">
    <div class="stream-title">
      <span>${escapeHtml(label)}</span>
      <small>${isDone ? "已完成" : "分块输出中"}</small>
    </div>
    <div class="stream-steps">${steps}</div>
  </div>`;
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

  for (const line of lines) {
    if (/^# /.test(line)) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(`<h2>${line.replace(/^# /, "")}</h2>`);
    } else if (/^## /.test(line)) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(`<h3>${line.replace(/^## /, "")}</h3>`);
    } else if (/^### /.test(line)) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(`<h4>${line.replace(/^### /, "")}</h4>`);
    } else if (/^- /.test(line)) {
      if (!inList) html.push("<ul>");
      inList = true;
      html.push(`<li>${line.replace(/^- /, "")}</li>`);
    } else if (/^\d+\. /.test(line)) {
      if (!inList) html.push("<ul>");
      inList = true;
      html.push(`<li>${line.replace(/^\d+\. /, "")}</li>`);
    } else if (line.trim() === "") {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    } else {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<p>${line}</p>`);
    }
  }

  if (inList) html.push("</ul>");
  return html.join("");
}

function reportToStaticHtmlDocument(run) {
  const markdown = run.report;
  const createdAt = new Date(run.created_at).toLocaleString("zh-CN");
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>面试准备报告</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #111827;
        --muted: #64748b;
        --line: #d8e0ea;
        --panel: #ffffff;
        --bg: #f4f7fb;
        --brand: #126782;
        --accent: #b45309;
      }

      * {
        box-sizing: border-box;
      }

      body {
        background: var(--bg);
        color: var(--ink);
        font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
        line-height: 1.7;
        margin: 0;
      }

      .page {
        max-width: 980px;
        margin: 0 auto;
        padding: 36px 24px 56px;
      }

      .cover {
        border: 1px solid var(--line);
        border-radius: 14px;
        background: linear-gradient(135deg, #ffffff, #eef7fb);
        margin-bottom: 20px;
        padding: 28px;
      }

      .eyebrow {
        color: var(--accent);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0;
        margin: 0 0 8px;
      }

      h1 {
        font-size: 30px;
        line-height: 1.22;
        margin: 0;
      }

      .meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 20px;
      }

      .meta div {
        border: 1px solid var(--line);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.72);
        padding: 10px 12px;
      }

      .meta span {
        display: block;
        color: var(--muted);
        font-size: 12px;
      }

      .meta strong {
        display: block;
        margin-top: 3px;
        font-size: 13px;
      }

      .report-body {
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--panel);
        padding: 28px;
      }

      h2 {
        border-bottom: 2px solid var(--ink);
        font-size: 24px;
        margin: 0 0 22px;
        padding-bottom: 10px;
      }

      h3 {
        border-top: 1px solid var(--line);
        color: #0f172a;
        font-size: 18px;
        margin: 28px 0 10px;
        padding-top: 18px;
      }

      h4 {
        color: var(--brand);
        font-size: 15px;
        margin: 18px 0 8px;
      }

      p,
      li {
        font-size: 12pt;
      }

      ul {
        margin: 8px 0 14px 20px;
        padding: 0;
      }

      @media print {
        body {
          background: #ffffff;
        }

        .page {
          max-width: none;
          padding: 0;
        }

        .cover,
        .report-body {
          border: 0;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="cover">
        <p class="eyebrow">Offer 沙盘 + 面试官视角库</p>
        <h1>面试准备报告</h1>
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
