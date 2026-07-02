const $ = (id) => document.getElementById(id);

const providerEl = $("provider");
const modelEl = $("model");
const apiKeyEl = $("apiKey");
const baseUrlEl = $("baseUrl");
const resumeEl = $("resume");
const jobEl = $("jobDescription");
const contextEl = $("companyContext");
const reportEl = $("report");
const statusEl = $("status");
const runBadgeEl = $("runBadge");
const generateBtn = $("generateBtn");
const downloadMdBtn = $("downloadMdBtn");
const downloadJsonBtn = $("downloadJsonBtn");
const feedbackAgreementEl = $("feedbackAgreement");
const feedbackQuestionUseEl = $("feedbackQuestionUse");
const feedbackNotesEl = $("feedbackNotes");
const appendFeedbackBtn = $("appendFeedbackBtn");

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
    "候选人：张三，5 年 B 端 SaaS 产品经验。曾负责客户成功平台、工单系统和数据看板。主导过从 0 到 1 的功能规划，推动研发、设计、运营协作，上线后工单平均响应时长下降 28%。在另一个项目中负责数据看板需求梳理，但简历未说明指标口径和业务复盘方式。",
  job:
    "招聘中级产品经理，负责企业服务产品的需求分析、产品规划、跨团队推进和指标复盘。要求具备 B 端 SaaS 经验、数据意识、复杂项目推进能力和良好的沟通表达。加分项：有客户成功、工单、CRM 或数据产品经验。",
  context:
    "公司为成长期 B 端 SaaS 团队，希望候选人能独立负责客户成功相关产品模块。面试重点：需求判断、指标意识、跨团队推动、复盘能力。",
};

const systemPrompt = `你是 OfferAgent 的产品经理面试准备助手。

请基于用户提供的简历、JD 和可选上下文，生成中文 Markdown 面试准备报告。

必须遵守：
- 不输出自动录用或淘汰结论。
- 不使用年龄、性别、婚育、照片、籍贯等敏感信息作为判断依据。
- 缺少证据时只能标注为待验证。
- 每个关键判断必须引用简历或 JD 的具体证据。
- 潜力只能表达为行为证据和待验证假设。
- 报告服务于 HR 和业务面试官的面试前准备。

请使用以下标题：
## 一页摘要
## 岗位匹配
## 项目亮点
## 风险与待验证
## 必问追问
## 面试问题库（供挑选）
## 证据链
## 人工反馈建议

其中“面试问题库（供挑选）”必须包含：
- 岗位要求验证问题：针对 JD 核心职责、必备能力、加分项提出若干问题。
- 项目经历追问：围绕简历中的项目追问真实角色、个人贡献、决策过程、结果归因。
- 项目经理 / 推进视角问题：追问目标拆解、里程碑、资源协调、风险控制、跨团队沟通和复盘机制。
- 候选人准备提示：帮助候选人准备项目证据、指标口径、个人贡献和复盘案例。`;

providerEl.addEventListener("change", () => {
  const defaults = providerDefaults[providerEl.value] || providerDefaults.mock;
  modelEl.value = defaults.model;
  baseUrlEl.value = defaults.baseUrl;
  apiKeyEl.disabled = providerEl.value === "mock";
  apiKeyEl.placeholder =
    providerEl.value === "mock" ? "Mock 模式不需要 Key" : "仅保存在当前页面内存，刷新后丢失";
});

$("mockBtn").addEventListener("click", () => {
  resumeEl.value = sample.resume;
  jobEl.value = sample.job;
  contextEl.value = sample.context;
  providerEl.value = "mock";
  providerEl.dispatchEvent(new Event("change"));
  setStatus("已填充脱敏样例。可以直接生成 Mock 报告。");
});

$("clearBtn").addEventListener("click", () => {
  apiKeyEl.value = "";
  resumeEl.value = "";
  jobEl.value = "";
  contextEl.value = "";
  currentRun = null;
  reportEl.className = "report empty";
  reportEl.innerHTML = "<h3>等待生成报告</h3><p>报告会覆盖岗位匹配、项目亮点、风险与待验证、必问追问、面试问题库、证据链和人工反馈建议。</p>";
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
  setStatus("正在生成报告...");

  try {
    const report =
      input.provider === "mock" || !input.apiKey.trim()
        ? generateMockReport(input)
        : await generateWithLLM(input);

    currentRun = {
      id: `run_${Date.now()}`,
      created_at: new Date().toISOString(),
      provider: input.provider,
      model: input.model,
      input_snapshot: {
        resume: input.resume,
        job_description: input.jobDescription,
        company_context: input.companyContext,
      },
      report,
    };

    renderReport(report);
    runBadgeEl.textContent = currentRun.id;
    downloadMdBtn.disabled = false;
    downloadJsonBtn.disabled = false;
    appendFeedbackBtn.disabled = false;
    setStatus("报告已生成。请下载到本地保存，刷新页面后不会保留。");
  } catch (error) {
    setStatus(`生成失败：${error.message}`, true);
  } finally {
    generateBtn.disabled = false;
  }
});

downloadMdBtn.addEventListener("click", () => {
  if (!currentRun) return;
  downloadFile(`offeragent-${currentRun.id}.md`, currentRun.report, "text/markdown;charset=utf-8");
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

async function generateWithLLM(input) {
  const endpoint = `${resolveBaseUrl(input).replace(/\/$/, "")}/chat/completions`;
  const body = {
    model: input.model,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `# 简历\n${input.resume}\n\n# JD\n${input.jobDescription}\n\n# 公司 / 面试上下文\n${input.companyContext || "无"}`,
      },
    ],
    temperature: 0.2,
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

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型返回为空或格式不兼容。");
  }
  return content;
}

function resolveBaseUrl(input) {
  if (input.baseUrl) return input.baseUrl;
  return providerDefaults[input.provider]?.baseUrl || providerDefaults.openai.baseUrl;
}

function generateMockReport(input) {
  const hasB2B = /B\s*端|SaaS|企业|客户|工单|CRM/i.test(input.resume + input.jobDescription);
  const hasMetrics = /指标|数据|提升|下降|转化|留存|响应|成本|营收|%|\d+/.test(input.resume);
  const hasCollab = /推动|协作|研发|设计|运营|销售|客户/.test(input.resume);

  const match = hasB2B && hasMetrics && hasCollab ? "基本匹配，建议进入业务面试前重点验证" : "部分匹配，需要补充关键证据";

  return `# OfferAgent 面试准备报告

## 一页摘要

- 岗位匹配倾向：${match}。
- 最大亮点：候选人简历中出现与 B 端产品、跨团队推进或指标结果相关的经历。
- 最大风险：简历中的“负责 / 主导 / 推动”仍需要还原真实角色、决策过程和结果归因。
- 必问重点：需求判断、指标口径、优先级取舍、跨团队推进和项目复盘。

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

## 必问追问

1. 这个项目最初要解决的真实用户问题是什么？你如何判断它不是伪需求？
2. 你提到的结果指标具体口径是什么？上线前后的对比周期如何定义？
3. 如果研发资源不足，你当时砍掉或延后的需求是什么？依据是什么？
4. 项目推进中最大的跨团队阻力是什么？你具体做了哪些推动动作？
5. 复盘这个项目，如果重新做一次，你会改变哪个关键决策？

## 面试问题库（供挑选）

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

### D. 候选人准备提示

- 准备每个核心项目的“背景、目标、约束、动作、结果、复盘”。
- 对简历中的每个数字结果，准备指标口径、统计周期和归因说明。
- 对“负责、主导、推动”等表述，准备可以证明个人贡献的具体事件。
- 对 JD 中的每条核心要求，至少准备一个项目证据和一个反思案例。

## 证据链

- 简历证据：${clip(input.resume)}
- JD 证据：${clip(input.jobDescription)}
- 上下文证据：${input.companyContext ? clip(input.companyContext) : "未提供额外上下文。"}

## 人工反馈建议

- 面试官是否同意岗位匹配倾向：同意 / 部分同意 / 不同意。
- 系统生成问题是否被采用：采用 / 改写采用 / 未采用。
- 风险点是否在面试中被验证：已验证 / 部分验证 / 未验证。
- 需要补充的岗位标准或公司偏好：请人工填写。
`;
}

function clip(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 160 ? `${clean.slice(0, 160)}...` : clean;
}

function renderReport(markdown) {
  reportEl.className = "report";
  reportEl.innerHTML = markdownToHtml(markdown);
}

function markdownToHtml(markdown) {
  const escaped = escapeHtml(markdown);
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

providerEl.dispatchEvent(new Event("change"));
