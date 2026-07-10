const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/report-export-template.js");
assert.ok(fs.existsSync(modulePath), "report-export-template.js should exist");

require(modulePath);

const {
  createReportExportTemplate,
} = globalThis.OfferAgentReportExportTemplate || {};

assert.equal(typeof createReportExportTemplate, "function");

const template = createReportExportTemplate({
  i18n: {
    zh: {
      pdfTitles: {
        candidate: ["候选人面试准备报告", "候选人模块"],
        full: ["面试准备报告", "完整报告"],
      },
    },
  },
  getRunLanguage: () => "zh",
  buildAudienceMarkdown: () => "# 报告正文\n\n内容",
  markdownToHtml: (markdown) => `<article>${markdown}</article>`,
  escapeHtml: (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;"),
  clip: (value, length = 80) => String(value ?? "").slice(0, length),
  buildRequirementEvidenceRows: () => [
    {
      capability: "技术架构与研发协同",
      isMissing: false,
    },
    {
      capability: "成本、进度、质量控制",
      isMissing: true,
    },
  ],
  buildGateAssessment: () => ({
    result: "条件性进入",
    enterSandbox: true,
  }),
  buildInterviewerRecommendation: () => ({
    level: "有条件推荐",
  }),
  buildOfferLeverage: () => ({
    rating: "中",
  }),
  extractSection: () => "",
  translateGateResult: (value) => value,
  translateCapability: (value) => value,
});

const run = {
  created_at: "2026-07-10T08:00:00.000Z",
  mode: "mock",
  model: "Mock Demo",
  report: "## 项目匹配闸口\n内容",
  input_snapshot: {},
};

const cards = template.buildPdfSummaryCards(run, "candidate");
assert.equal(cards.length, 4);
assert.equal(cards[0].label, "闸口结论");

const html = template.reportToStaticHtmlDocument(run, "candidate", {
  autoPrint: true,
  printFilename: "candidate.pdf",
});
assert.ok(html.startsWith("<!doctype html>"));
assert.ok(html.includes("<title>候选人面试准备报告</title>"));
assert.ok(html.includes("<article># 报告正文"));
assert.ok(html.includes("candidate"));
assert.ok(html.includes("window.print()"));

console.log("report-export-template tests passed");
