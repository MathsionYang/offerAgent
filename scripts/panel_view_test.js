const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/panel-view.js");
assert.ok(fs.existsSync(modulePath), "panel-view.js should exist");

require(modulePath);

const {
  createPanelView,
} = globalThis.OfferAgentPanelView || {};

assert.equal(typeof createPanelView, "function");

let language = "zh";
const calls = [];
const node = { id: "ev_req_1", label: "Resume evidence" };
const messageElement = { dataset: { messageId: "turn_1" } };
const graphNodeElement = {
  classList: {
    add(value) {
      calls.push(["activate-node", value]);
    },
  },
};

const panelView = createPanelView({
  getLanguage: () => language,
  getText: () => ({
    panelChatModerator: language === "en" ? "Moderator" : "主持人",
  }),
  escapeHtml: (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;"),
  cssEscape: (value) => String(value ?? ""),
  reportAnchorForNodeType: (type) => `anchor:${type}`,
  detectEvidenceGraphGaps: () => [{ id: "gap_1" }],
  setWorkspaceView: (view) => calls.push(["workspace", view]),
  openPanelMessageDetail: (element) => calls.push(["message", element.dataset.messageId]),
  openGraphNodeDetail: (value) => calls.push(["node", value.id]),
  openReportAnchorDetail: (anchor) => calls.push(["report", anchor]),
  findGraphNodeById: (id) => (id === node.id ? node : null),
  schedule: (callback) => {
    callback();
    return 1;
  },
  cancelSchedule: () => {},
  virtualPanelChatEl: {
    querySelector(selector) {
      if (selector.includes("data-message-id")) return messageElement;
      return null;
    },
  },
  evidenceGraphEl: {
    querySelector(selector) {
      return selector.includes(node.id) ? graphNodeElement : null;
    },
  },
});

const run = {
  evidence_graph: { nodes: [], edges: [] },
  virtual_panel: [
    {
      id: "agent_business",
      name: "Business Lead",
      focus: "Business judgment",
      stance: "opposing",
    },
  ],
  panel_discussion_rounds: [
    {
      id: "round_seed_reading",
      stage: "seed_extraction",
      topic: "JD / resume seed reading",
      turns: [
        {
          agent_id: "agent_business",
          claim: "Business Lead reads the project as pending validation",
          impact: "raise_follow_up_priority",
          evidence_ids: ["ev_req_1"],
          question_ids: ["q_1"],
        },
      ],
    },
  ],
  moderator_summary: {
    id: "moderator_summary",
    consensus: "conditional_progress",
    offer_impact: "medium",
    final_recommendation: "Enter the next interview or offer sandbox only after validating the highest-risk evidence nodes.",
    disagreement_count: 1,
    support_count: 0,
  },
};

const messages = panelView.buildVirtualPanelChatMessages(run);
assert.equal(messages.length, 3);
assert.equal(messages[0].type, "system");
assert.equal(messages[1].type, "agent");
assert.deepEqual(messages[1].evidenceIds, ["ev_req_1"]);
assert.equal(messages[1].reportAnchor, "anchor:interview_question");
assert.equal(messages[2].type, "moderator");
assert.deepEqual(messages[2].turnTraceItems.evidenceIds, ["ev_req_1"]);

const tabs = panelView.renderVirtualPanelRoundTabs(run);
assert.ok(tabs.includes('data-panel-round="all"'));
assert.ok(tabs.includes('data-panel-round="round_seed_reading"'));
assert.ok(tabs.includes('data-panel-round="moderator"'));
assert.ok(tabs.includes('data-panel-filter="agent"'));
assert.ok(tabs.includes('data-panel-filter="evidence"'));
assert.ok(tabs.includes("Business Lead"));
assert.ok(tabs.includes("ev_req_1"));

const messageHtml = panelView.renderVirtualPanelChatMessage(messages[1]);
assert.ok(messageHtml.includes('data-panel-agent="agent_business"'));
assert.ok(messageHtml.includes('data-panel-evidence-ids="ev_req_1"'));
assert.ok(messageHtml.includes('data-trace-node-id="ev_req_1"'));
assert.ok(messageHtml.includes('data-trace-report-anchor="anchor:interview_question"'));

panelView.navigatePanelTraceTarget({
  dataset: { traceMessageId: "turn_1" },
});
panelView.navigatePanelTraceTarget({
  dataset: { traceNodeId: "ev_req_1" },
});
panelView.navigatePanelTraceTarget({
  dataset: { traceReportAnchor: "anchor:agent_persona" },
});

assert.deepEqual(calls, [
  ["message", "turn_1"],
  ["workspace", "graph"],
  ["activate-node", "active"],
  ["node", "ev_req_1"],
  ["workspace", "graph"],
  ["report", "anchor:agent_persona"],
]);

assert.equal(panelView.localizePanelStage("seed_extraction"), "种子材料读取");
assert.equal(panelView.localizePanelStance("opposing"), "质疑");
assert.equal(panelView.localizePanelImpact("raise_follow_up_priority"), "提高追问优先级");

language = "en";
assert.equal(panelView.localizePanelStage("seed_extraction"), "Seed extraction");
assert.equal(panelView.localizePanelStance("opposing"), "opposing");
assert.equal(panelView.localizePanelImpact("raise_follow_up_priority"), "raise_follow_up_priority");

console.log("panel-view tests passed");
