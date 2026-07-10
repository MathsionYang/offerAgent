const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/assessment-rules.js");
assert.ok(fs.existsSync(modulePath), "assessment-rules.js should exist");

require(modulePath);

const {
  createAssessmentRules,
} = globalThis.OfferAgentAssessmentRules || {};

assert.equal(typeof createAssessmentRules, "function");

const requirements = [
  { capability: "Architecture", keywords: ["架构", "系统", "architecture"], verificationFocus: "系统边界" },
  { capability: "Delivery", keywords: ["上线", "交付", "delivery"], verificationFocus: "交付结果" },
  { capability: "Incident", keywords: ["故障", "SLA", "incident"], verificationFocus: "故障复盘" },
  { capability: "Customer", keywords: ["客户", "支持", "support"], verificationFocus: "客户反馈" },
];
const rules = createAssessmentRules({
  defaultRoleId: "developer",
  getRoleProfile: () => ({ requirements }),
  clip: (value, length = 80) => String(value ?? "").slice(0, length),
});

const snapshot = rules.normalizeSnapshot({
  targetRole: "developer",
  jobDescription: "需要负责架构、上线交付、SLA 故障和客户支持",
  resume: "主导架构设计并上线支付系统，SLA 提升 99.9%，客户满意度提升 20%",
  companyContext: "有竞对 offer",
  candidateStage: "技术一面",
  targetLevel: "P6",
  offerConstraints: "已有其他 offer，期望本月到岗",
  selectedSkills: ["technical"],
});

assert.equal(snapshot.target_role, "developer");
assert.equal(snapshot.candidate_stage, "技术一面");
assert.deepEqual(snapshot.selected_skills, ["technical"]);

assert.equal(rules.classifyEvidenceLevel("主导上线系统，转化率提升 20%"), 1);
assert.equal(rules.classifyEvidenceLevel("负责系统设计"), 2);
assert.equal(rules.classifyEvidenceLevel("参与团队项目"), 3);
assert.equal(rules.classifyEvidenceLevel("简历未体现明确证据"), 3);
assert.equal(rules.evidenceLevelLabel(1), "一级证据（高可信）");
assert.ok(rules.evidenceLevelReason(3, "").includes("没有可引用"));

const found = rules.findEvidence("第一段无关。主导架构设计并上线支付系统，SLA 提升 99.9%。客户支持跟进。", ["SLA"]);
assert.ok(found.includes("SLA"));

const rows = rules.buildRequirementEvidenceRows(snapshot);
assert.equal(rows.length, 4);
assert.equal(rows[0].capability, "Architecture");
assert.equal(rows[0].evidenceLevel, 1);
assert.equal(rows[0].matchStatus, "匹配但仍需复核口径");
assert.ok(rows[0].verificationQuestion.includes("系统边界"));

const evidenceSummary = rules.buildEvidenceSummary(rows);
assert.ok(evidenceSummary.includes("一级"));

const matchedGate = rules.buildGateAssessment(snapshot, rows);
assert.equal(matchedGate.result, "匹配进入");
assert.equal(matchedGate.enterSandbox, true);

const weakRows = rows.map((row, index) => ({
  ...row,
  isMissing: index > 0,
  evidenceLevel: index === 0 ? 2 : 3,
  resumeEvidence: index === 0 ? "负责系统设计" : "简历未体现明确证据",
}));
const conditionalGate = rules.buildGateAssessment(
  { ...snapshot, resume: "负责 B 端 SaaS 系统设计" },
  weakRows,
);
assert.equal(conditionalGate.result, "条件性进入（转岗适配）");
assert.equal(conditionalGate.enterSandbox, true);
assert.ok(conditionalGate.transferPitch.includes("负责系统设计"));

const blockedGate = rules.buildGateAssessment(
  { ...snapshot, resume: "仅有校园活动经历" },
  weakRows.map((row) => ({ ...row, isMissing: true })),
);
assert.equal(blockedGate.result, "不匹配不推进");
assert.equal(blockedGate.enterSandbox, false);

const leverage = rules.buildOfferLeverage(snapshot);
assert.notEqual(leverage.rating, "暂无明确杠杆");
assert.ok(leverage.summary.includes("Offer"));

console.log("assessment-rules tests passed");
