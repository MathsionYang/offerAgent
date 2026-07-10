const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/localization-mappers.js");
assert.ok(fs.existsSync(modulePath), "localization-mappers.js should exist");

require(modulePath);

const {
  createLocalizationMappers,
} = globalThis.OfferAgentLocalizationMappers || {};

assert.equal(typeof createLocalizationMappers, "function");

let language = "zh";
const mappers = createLocalizationMappers({
  getLanguage: () => language,
  i18n: {
    zh: {
      skillCards: {
        hr: ["虚拟 HR 面试官", "深挖动机、岗位偏好、到岗约束和风险边界"],
      },
    },
    en: {
      stageOptions: {
        phone_screen: "Phone screen",
      },
      skillCards: {
        hr: ["Virtual HR Interviewer", "Probe motivation, role preference, start-date constraints, and risk boundaries"],
      },
    },
  },
});

assert.equal(typeof mappers.translateGeneratedText, "function");
assert.equal(mappers.localizeOfferScenarioName("Optimistic"), "乐观");
assert.equal(mappers.localizeFeedbackActionType("promote_question"), "升级问题");
assert.equal(mappers.localizeSkillId("decision"), "决策层压力官");
assert.equal(mappers.translateInterviewerRecommendation("有条件推荐"), "Conditional recommend");

language = "en";
assert.equal(mappers.translateStage("phone_screen"), "Phone screen");
assert.equal(mappers.translateCapability("技术架构与研发协同"), "Technical architecture and engineering collaboration");
assert.equal(mappers.localizeOfferScenarioName("Conservative"), "Conservative");
assert.equal(mappers.localizeFeedbackStatus("pending_review"), "Pending review");
assert.equal(mappers.translateGateResult("条件性进入"), "Conditional proceed (transferable fit)");
assert.equal(mappers.translateOfferRating("中"), "Medium leverage");
assert.equal(
  mappers.translateMatchStatus({ isMissing: false, evidenceLevel: 2 }),
  "Partially matched / follow-up required",
);
assert.equal(
  mappers.summarizeEvidenceCounts([
    { evidenceLevel: 1 },
    { evidenceLevel: 2 },
    { evidenceLevel: 3 },
  ]),
  "Level 1: 1, Level 2: 1, Level 3 / missing: 1",
);
assert.equal(
  mappers.translateGeneratedText(
    "虚拟 HR 面试官 reads 行业场景理解 as pending validation",
  ),
  "Virtual HR Interviewer reads Industry scenario understanding as pending validation",
);
assert.equal(
  mappers.translateGeneratedText("技术选型与创新探索 风险"),
  "Technology selection and innovation exploration risk",
);
assert.equal(
  mappers.translateGeneratedText("按当前证据等级、风险验证状态和 Offer 约束推进"),
  "Proceed based on current evidence levels, risk-validation status, and Offer constraints.",
);
assert.equal(
  mappers.translateGeneratedText("虚拟业务负责人"),
  "Virtual Business Owner",
);
assert.equal(
  mappers.translateGeneratedText("业务理解、需求判断、指标意识、结果归因"),
  "Business understanding, requirement judgment, metric awareness, and result attribution",
);
assert.equal(
  mappers.translateGeneratedText("技术选型与创新探索 缺证"),
  "Technology selection and innovation exploration evidence gap",
);
assert.equal(
  mappers.translateGeneratedText("技术选型与创新探索 验证问题"),
  "Technology selection and innovation exploration validation question",
);
assert.equal(
  mappers.translateGeneratedText("技术选型与创新探索 风险"),
  "Technology selection and innovation exploration risk",
);
assert.equal(
  mappers.translateGeneratedText("补齐岗位核心能力项目证据"),
  "Add project evidence for the role's core capability",
);
assert.equal(
  mappers.translateGeneratedText("复核指标口径、周期和个人贡献"),
  "Verify metric definition, measurement period, and personal contribution",
);
assert.equal(
  mappers.translateGeneratedText("可复核高可信证据"),
  "Verifiable high-confidence evidence",
);
assert.equal(
  mappers.translateGeneratedText("待追问中低可信证据"),
  "Medium- or low-confidence evidence requiring follow-up",
);
assert.equal(
  mappers.translateGeneratedText("简历评估"),
  "Resume evaluation",
);
assert.equal(
  mappers.translateGeneratedText("面试问题"),
  "Interview questions",
);
assert.equal(
  mappers.translateGeneratedText("反馈修正"),
  "Feedback revision",
);
assert.equal(
  mappers.translateGeneratedText("Offer 概率"),
  "Offer probability",
);
assert.equal(
  mappers.translateGeneratedText("谈判策略"),
  "Negotiation strategy",
);
assert.equal(
  mappers.translateGeneratedText("关键追问验证通过，低可信证据升级，候选人接受条件清晰"),
  "Key follow-ups are validated, low-confidence evidence is upgraded, and acceptance conditions are clear.",
);
assert.equal(
  mappers.translateGeneratedText("优先复核一级证据和谈薪约束，准备推进话术"),
  "Prioritize Level 1 evidence and negotiation constraints, then prepare the progression narrative.",
);
assert.equal(
  mappers.translateGeneratedText("风险被证实或候选人约束后置暴露，面试问题未能补证"),
  "Risks are confirmed or candidate constraints surface late, and interview questions fail to close evidence gaps.",
);
assert.equal(
  mappers.translateGeneratedText("先补证据缺口，再决定是否进入 Offer 沙盘"),
  "Close evidence gaps before deciding whether to enter the Offer sandbox.",
);
assert.equal(
  mappers.translateGeneratedText("存在 0-1、上线交付或量化结果"),
  "0-to-1 delivery, launch execution, or quantified outcomes are present",
);
assert.equal(
  mappers.translateGeneratedText(
    "存在 0-1、上线交付或量化结果。谈判时应转化为可量化贡献、稀缺经验和到岗确定性。",
  ),
  "0-to-1 delivery, launch execution, or quantified outcomes are present. Convert this into quantified contribution, scarce experience, and start-date certainty during negotiation.",
);
assert.equal(
  mappers.translateGeneratedText("简历未体现明确证据"),
  "No explicit resume evidence",
);
assert.equal(
  mappers.translateGeneratedText("Virtual HR Interviewer links 弱杠杆 offer leverage to 匹配进入"),
  "Virtual HR Interviewer links Weak leverage offer leverage to Matched: proceed",
);
assert.equal(
  mappers.translateGeneratedText("路线图取舍、版本节奏、从 0 到 1 的闭环和复盘。"),
  "roadmap trade-offs, release cadence, the 0-to-1 loop, and retrospectives.",
);
assert.equal(
  mappers.translateGeneratedText("需求真伪判断、方案边界、客户沟通和落地结果。"),
  "requirement validation, solution boundaries, customer communication, and delivery outcomes.",
);
assert.equal(
  mappers.translateGeneratedText("技术约束理解、研发协同、方案取舍和风险控制。"),
  "technical-constraint understanding, engineering collaboration, solution trade-offs, and risk control.",
);
assert.equal(
  mappers.translateGeneratedText("技术趋势判断、创新来源、验证方式和商业化路径。"),
  "technology-trend judgment, innovation sources, validation methods, and commercialization paths.",
);
assert.equal(
  mappers.translateGeneratedText("里程碑、资源约束、质量标准、延期处理和复盘机制。"),
  "milestones, resource constraints, quality standards, delay handling, and retrospective mechanisms.",
);
assert.equal(
  mappers.translateGeneratedText("Virtual Business Owner 贡献 3 个基础问题，并针对 技术选型与创新探索 生成追问视角"),
  "Virtual Business Owner contributed 3 base questions and generated a follow-up lens for Technology selection and innovation exploration",
);
assert.equal(mappers.translateGeneratedText("产品经理"), "Product Manager");
assert.equal(mappers.translateGeneratedText("未反馈"), "No feedback");
assert.equal(mappers.translateGeneratedText("二级证据（中可信）"), "Level 2 evidence (medium confidence)");
assert.equal(
  mappers.translateGeneratedText("岗位可能存在客户临场需求、紧急版本、跨团队冲突或高频交付压力"),
  "The role may involve urgent customer requests, emergency releases, cross-team conflict, or high-frequency delivery pressure.",
);
assert.equal(
  mappers.translateGeneratedText("准备一次高压推进、线上事故或客户冲突的复盘案例"),
  "Prepare a retrospective example involving high-pressure execution, a production incident, or customer conflict.",
);
assert.equal(
  mappers.translateGeneratedText("简历评估"),
  "Resume evaluation",
);
assert.equal(
  mappers.translateGeneratedText(
    "你提到“候选人：张三，5 年 B 端 SaaS 产品经验”，请拆解真实角色、关键决策、协作对象和结果归因。重点验证：目标行业、客户角色、业务约束和可迁移经验。",
  ),
  "You mentioned “候选人：张三，5 年 B 端 SaaS 产品经验”. Break down your real role, key decisions, collaborators, and result attribution. Focus validation on: target industry, customer roles, business constraints, and transferable experience.",
);
assert.equal(
  mappers.translateGeneratedText("候选人：张三，5 年 B 端 SaaS 产品经验。"),
  "候选人：张三，5 年 B 端 SaaS 产品经验。",
);

console.log("localization-mappers tests passed");
