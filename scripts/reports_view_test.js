const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/reports-view.js");
assert.ok(fs.existsSync(modulePath), "reports-view.js should exist");

require(modulePath);

const {
  createReportsView,
} = globalThis.OfferAgentReportsView || {};

assert.equal(typeof createReportsView, "function");

let language = "zh";
const reportStages = [
  { title: "读取", detail: "读取材料", marker: "## 一页摘要" },
  { title: "验证", detail: "证据验证", marker: "## 证据链" },
];
const reports = createReportsView({
  getLanguage: () => language,
  getText: () => ({
    streamDone: language === "en" ? "Done" : "完成",
    streaming: language === "en" ? "Streaming" : "生成中",
    streamPlaceholder: language === "en" ? "Waiting" : "等待生成",
    reportUpdated: language === "en" ? "Report updated" : "报告已更新",
    mockStreaming: language === "en" ? "Mock streaming" : "Mock 生成中",
  }),
  getReportStages: () => reportStages,
  getPageMode: () => "candidate",
  escapeHtml: (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;"),
  clip: (value, length = 80) => String(value ?? "").slice(0, length),
  riskToneClass: (value) => (String(value).includes("高风险") ? "tone-risk" : ""),
  offerScenarioToneClass: () => "tone-warn-card",
  getEvidenceGraphLabels: () => ({
    offerRunTitle: "Offer 推演状态",
    feedbackTitle: "反馈蒸馏",
    noFeedbackActions: "暂无反馈动作。",
  }),
  localizeOfferScenarioName: (value) => value,
  localizeFeedbackActionType: (value) => value,
  localizeFeedbackTarget: (value) => value,
  localizeSkillId: (value) => value,
  localizeFeedbackStatus: (value) => value,
  translateGateResult: (value) => `EN:${value}`,
  translateOfferRating: (value) => `EN:${value}`,
  translateCapability: (value) => `EN:${value}`,
  translateEvidenceLevel: (value) => `EN-L${value}`,
  translateMatchStatus: (row) => `EN:${row.match_status}`,
  buildCandidateThreeSecondSummary: () => "| A | B |\n| --- | --- |\n| 结论 | 高风险 |",
  buildCandidateAdvantageCards: () => "| A | B |\n| --- | --- |\n| 优势 | 证据 |",
  buildInterviewerOneMinuteDecisionBrief: () => "| A | B |\n| --- | --- |\n| 决策 | 推进 |",
  buildInterviewerQuickBrief: () => "| A | B |\n| --- | --- |\n| 速览 | 内容 |",
  openTraceDetailPanel: () => {},
  renderTraceDetailRows: (rows) => rows.map(([key, value]) => `${key}:${value}`).join(";"),
});

assert.equal(
  reports.cleanReportMarkdown("**重点** `代码` > 引用\n---\n~~删除~~"),
  "重点 代码 > 引用\n\n删除",
);

const html = reports.markdownToHtml([
  "# 标题",
  "| 结论 | 风险 |",
  "| --- | --- |",
  "| A | 高风险 |",
  "- 第一项",
].join("\n"));
assert.ok(html.includes("<h2>标题</h2>"));
assert.ok(html.includes("<table>"));
assert.ok(html.includes('class="tone-risk"'));
assert.ok(html.includes("<ul>"));

assert.equal(reports.inferStageIndex("## 一页摘要\n内容", false), 0);
assert.equal(reports.inferStageIndex("## 证据链\n内容", false), 1);
assert.equal(reports.inferStageIndex("", true), 2);
assert.ok(reports.buildStreamProgress("## 证据链", "生成中", false).includes("stream-step active"));

const cards = reports.buildDecisionSummaryCards({
  evaluation_summary: {
    gate_result: "条件性进入",
    enter_sandbox: true,
    matched_count: 2,
    total_requirements: 3,
    strong_evidence_count: 1,
    offer_leverage_rating: "中",
    offer_leverage_summary: "有部分证据",
  },
  requirement_matches: [
    { evidence_level: 1 },
    { evidence_level: 3, is_missing: true },
  ],
  interview_questions: [{ question: "请说明指标口径" }],
  feedback_distillation: { actions: [{ type: "promote_question" }] },
});
assert.equal(cards.length, 5);
assert.equal(cards[0].value, "条件性进入");
assert.equal(cards[4].value, "1 动作");

const scoreRows = reports.buildInterviewerScorecardRows({
  requirement_matches: [
    {
      id: "req_1",
      capability: "系统设计",
      match_status: "待验证",
      evidence_level: 3,
      evidence_level_label: "三级证据",
      is_missing: true,
      verification_question: "追问问题",
    },
  ],
  interview_questions: [{ capability: "系统设计", question: "请解释架构取舍" }],
});
assert.equal(scoreRows[0].row_tone, "risk");
assert.equal(reports.scorecardEvidenceTone(2, false), "tone-warn");

language = "en";
assert.equal(
  reports.buildDecisionSummaryCards({
    evaluation_summary: { gate_result: "条件性进入", enter_sandbox: false },
    requirement_matches: [],
  })[0].value,
  "EN:条件性进入",
);

console.log("reports-view tests passed");
