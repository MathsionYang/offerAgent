const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/skill-registry.js");
assert.ok(fs.existsSync(modulePath), "skill-registry.js should exist");

require(modulePath);

const {
  createSkillRegistry,
} = globalThis.OfferAgentSkillRegistry || {};

assert.equal(typeof createSkillRegistry, "function");

let language = "zh";
const registry = createSkillRegistry({
  defaultRoleId: "developer",
  getRoleLabel: (roleId, lang) => `${lang}:${roleId}`,
  getLanguage: () => language,
  getText: () => ({
    skillCards: {
      hr: ["HR interviewer", "Motivation and stability"],
      business: ["Business lead", "Business impact"],
      project: ["Project lead", "Delivery risks"],
      decision: ["Decision officer", "Pressure test"],
    },
  }),
  clip: (value, length = 160) => {
    const clean = String(value ?? "").replace(/\s+/g, " ").trim();
    return clean.length > length ? `${clean.slice(0, length)}...` : clean;
  },
});

assert.ok(registry.skillLibrary.hr);
assert.equal(registry.skillLibrary.decision.name, "决策层压力官");

const rows = [
  { capability: "Architecture", isMissing: false, evidenceLevel: 1 },
  { capability: "Incident response", isMissing: false, evidenceLevel: 3 },
  { capability: "Customer support", isMissing: true, evidenceLevel: 3 },
  { capability: "Delivery", isMissing: false, evidenceLevel: 2 },
];

const autoRegistry = registry.buildSkillRegistry({ target_role: "developer" }, rows);
assert.deepEqual(autoRegistry.map((item) => item.id), ["hr", "business", "project", "decision"]);
assert.equal(autoRegistry[0].adoption_status, "auto_selected");
assert.equal(autoRegistry[1].priority, 5);
assert.deepEqual(autoRegistry[0].audit.evidence_edges, ["ev_req_2", "ev_req_3"]);
assert.deepEqual(autoRegistry[0].audit.question_edges, ["q_1", "q_2"]);

const selectedRegistry = registry.buildSkillRegistry(
  { target_role: "developer", selected_skills: ["negotiation", "unknown", "decision"] },
  rows,
);
assert.deepEqual(selectedRegistry.map((item) => item.id), ["negotiation", "decision"]);
assert.ok(selectedRegistry.every((item) => item.adoption_status === "selected"));

const zhSelected = registry.formatSelectedSkills(["hr", "business"]);
assert.ok(zhSelected.includes("虚拟 HR 面试官"));
assert.ok(zhSelected.includes("虚拟业务负责人"));

language = "en";
const enSelected = registry.formatSelectedSkills(["hr", "business"]);
assert.ok(enSelected.includes("HR interviewer: Motivation and stability"));
assert.ok(enSelected.includes("Business lead: Business impact"));

const input = {
  resume: "主导 CRM 平台项目，上线后客户响应提升 20%",
  jobDescription: "负责客户支持、指标推进和跨团队交付",
  companyContext: "业务需要研发、设计、运营协作",
  offerConstraints: "已有 offer，期望两周内到岗",
};
const evidence = registry.buildSkillEvidence(input);
assert.ok(evidence.project.includes("CRM"));
assert.ok(evidence.jd.includes("负责"));
assert.equal(evidence.metric, "材料中出现指标或结果线索");
assert.equal(evidence.collab, "材料中出现跨团队推进线索");
assert.equal(evidence.offer, "材料中出现 Offer / 到岗 / 期望约束线索");

const questions = registry.buildDeepQuestions("business", registry.skillLibrary.business, evidence);
assert.ok(questions.length >= 3);
assert.ok(questions[0].includes(evidence.project));

const markdown = registry.buildSkillQuestionMarkdown(["business", "decision"], input);
assert.ok(markdown.includes("### 虚拟业务负责人"));
assert.ok(markdown.includes("### 决策层压力官"));
assert.ok(markdown.includes("关联证据"));

console.log("skill-registry tests passed");
