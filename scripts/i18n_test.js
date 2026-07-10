const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

globalThis.window = globalThis;

const modulePath = path.resolve(__dirname, "../apps/web/src/i18n.js");
assert.ok(fs.existsSync(modulePath), "i18n.js should exist");

require(modulePath);

const { getText } = globalThis.OfferAgentI18n || {};
assert.equal(typeof getText, "function");

const zh = getText("zh").labels;
const en = getText("en").labels;

assert.equal(zh.workspaceLabel, "工作台");
assert.equal(en.workspaceLabel, "Workbench");
assert.equal(zh.resultsLabel, "图谱与报告");
assert.equal(en.resultsLabel, "Graph and Reports");
assert.equal(zh.audienceLabel, "受众");
assert.equal(en.audienceLabel, "Audience");
assert.equal(zh.workspaceViewLabel, "工作区视图");
assert.equal(en.workspaceViewLabel, "Workspace view");
assert.equal(zh.languageSelectorLabel, "语言");
assert.equal(en.languageSelectorLabel, "Language");
assert.equal(zh.resultViewLabel, "结果视图");
assert.equal(en.resultViewLabel, "Result views");
assert.equal(zh.reportProgressLabel, "报告生成进度");
assert.equal(en.reportProgressLabel, "Report generation progress");
assert.equal(zh.exportReportLabel, "导出报告");
assert.equal(en.exportReportLabel, "Export reports");
assert.equal(zh.offerSandboxLabel, "Offer 沙盘");
assert.equal(en.offerSandboxLabel, "Offer Sandbox");
assert.equal(zh.sidebarLabel, "侧边栏");
assert.equal(en.sidebarLabel, "Sidebar");
assert.equal(zh.configCardTitle, "配置模型与 Offer 沙盘");
assert.equal(en.configCardTitle, "Model Configuration and Offer Sandbox");
assert.equal(zh.configCardSubtitle, "选择模型服务，设置岗位目标、阶段和谈薪约束");
assert.equal(
  en.configCardSubtitle,
  "Choose a model service, role target, interview stage, and negotiation constraints",
);
assert.equal(zh.modelPanelTitle, "临时配置模型");
assert.equal(en.modelPanelTitle, "Temporary Model Config");
assert.equal(zh.modelPanelHint, "支持 Mock Demo 与 OpenAI-compatible 代理");
assert.equal(en.modelPanelHint, "Supports Mock Demo and OpenAI-compatible endpoints");
assert.equal(zh.inputCardSubtitle, "候选人简历与岗位 JD 左右布局，便于对照补充");
assert.equal(
  en.inputCardSubtitle,
  "Compare the candidate resume and job description side by side",
);
assert.equal(zh.skillCardTitle, "选择面试官角色");
assert.equal(en.skillCardTitle, "Choose Interviewer Roles");

console.log("i18n tests passed");
