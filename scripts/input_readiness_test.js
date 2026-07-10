const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/input-readiness.js");
assert.ok(fs.existsSync(modulePath), "input-readiness.js should exist");

require(modulePath);

const {
  evaluateInputReadiness,
  getInputReadinessLabels,
} = globalThis.OfferAgentInputReadiness || {};

assert.equal(typeof evaluateInputReadiness, "function");
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
assert.equal(getInputReadinessLabels("zh").rolesMissing, "未选择，将使用默认角色");
assert.equal(getInputReadinessLabels("en").rolesMissing, "None selected; defaults will be used");

const limited = evaluateInputReadiness({
  resume: "有产品经验",
  jobDescription: "负责产品规划",
  selectedSkills: ["business"],
  language: "zh",
});

assert.equal(limited.ready, false);
assert.equal(limited.items.resume.status, "limited");
assert.equal(limited.items.jobDescription.status, "limited");
assert.equal(limited.items.selectedSkills.status, "ready");
assert.equal(limited.items.selectedSkills.count, 1);

const ready = evaluateInputReadiness({
  resume: "候".repeat(80),
  jobDescription: "岗".repeat(100),
  selectedSkills: ["hr", "business"],
  language: "en",
});

assert.equal(ready.ready, true);
assert.equal(ready.items.resume.status, "ready");
assert.equal(ready.items.jobDescription.status, "ready");
assert.equal(ready.items.selectedSkills.status, "ready");
assert.equal(ready.items.resume.count, 80);
assert.equal(ready.items.jobDescription.count, 100);
assert.equal(getInputReadinessLabels("en").title, "Input readiness");
assert.equal(getInputReadinessLabels("zh").title, "输入就绪度");

console.log("input-readiness tests passed");
