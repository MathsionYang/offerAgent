const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/input-readiness.js");
assert.ok(fs.existsSync(modulePath), "input-readiness.js should exist");

require(modulePath);

const {
  evaluateInputReadiness,
  evaluateInputQuality,
  getInputReadinessLabels,
} = globalThis.OfferAgentInputReadiness || {};

assert.equal(typeof evaluateInputReadiness, "function");
assert.equal(typeof evaluateInputQuality, "function");
assert.equal(typeof getInputReadinessLabels, "function");

const missing = evaluateInputReadiness({
  resume: "",
  jobDescription: "",
  selectedSkills: [],
  language: "zh",
});

assert.equal(missing.ready, false);
assert.equal(missing.items.resume.status, "missing");
assert.equal(missing.items.jobDescription.status, "missing");
assert.equal(missing.items.selectedSkills.status, "missing");
assert.equal(missing.items.resume.count, 0);
assert.equal(missing.quality.status, "missing");
assert.equal(missing.quality.score, 0);
assert.equal(getInputReadinessLabels("zh").rolesMissing, "未选择，将使用默认角色");
assert.equal(getInputReadinessLabels("en").rolesMissing, "None selected; defaults will be used");

const limited = evaluateInputReadiness({
  resume: "负责产品规划",
  jobDescription: "负责产品规划",
  selectedSkills: ["business"],
  language: "zh",
});

assert.equal(limited.ready, false);
assert.equal(limited.items.resume.status, "limited");
assert.equal(limited.items.jobDescription.status, "limited");
assert.equal(limited.items.selectedSkills.status, "ready");
assert.equal(limited.items.selectedSkills.count, 1);
assert.ok(limited.quality.score > 0);

const ready = evaluateInputReadiness({
  resume: "我主导订单系统改造项目，负责架构设计和核心接口实现，P95 延迟从 480ms 降到 210ms。一次线上故障后完成复盘、根因分析和回滚机制建设。".repeat(2),
  jobDescription: "负责核心交易链路设计；要求具备高并发系统经验；负责线上故障排查；具备跨团队协作能力；要求关注代码质量。".repeat(2),
  companyContext: "业务终面，重点看稳定性治理。",
  offerConstraints: "希望 6 周内到岗。",
  selectedSkills: ["hr", "business"],
  language: "en",
});

assert.equal(ready.ready, true);
assert.equal(ready.items.resume.status, "ready");
assert.equal(ready.items.jobDescription.status, "ready");
assert.equal(ready.items.selectedSkills.status, "ready");
assert.ok(ready.items.resume.count > 80);
assert.ok(ready.items.jobDescription.count > 100);
assert.equal(ready.quality.status, "ready");
assert.ok(ready.quality.score >= 80);
assert.equal(getInputReadinessLabels("en").title, "Input readiness");
assert.equal(getInputReadinessLabels("zh").title, "输入就绪度");
assert.equal(getInputReadinessLabels("zh").qualityTitle, "输入质量预检");

console.log("input-readiness tests passed");
