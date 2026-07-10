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
    en: {
      stageOptions: {
        phone_screen: "Phone screen",
      },
    },
  },
});

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

console.log("localization-mappers tests passed");
