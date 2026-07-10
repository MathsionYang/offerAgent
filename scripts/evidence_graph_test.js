const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/evidence-graph.js");
assert.ok(fs.existsSync(modulePath), "evidence-graph.js should exist");

require(modulePath);

const {
  createEvidenceGraphModel,
} = globalThis.OfferAgentEvidenceGraph || {};

assert.equal(typeof createEvidenceGraphModel, "function");

let language = "en";
const model = createEvidenceGraphModel({
  getLanguage: () => language,
  interviewerLens: (index) => `lens-${index + 1}`,
  buildSkillRegistry: () => [
    {
      id: "business",
      name: "虚拟业务负责人",
      focus: "业务判断",
      version: "skill.business.v1",
      adoption_status: "active",
      priority: 4,
      audit: {
        contribution: "生成业务追问",
      },
    },
  ],
});

const rows = [
  {
    capability: "系统设计",
    jdEvidence: "负责核心系统架构",
    resumeEvidence: "主导服务拆分",
    matchStatus: "匹配",
    isMissing: false,
    evidenceLevel: 1,
    evidenceLevelLabel: "一级可信",
    evidenceReason: "职责、动作和结果完整",
    verificationQuestion: "请说明服务拆分的关键决策。",
  },
  {
    capability: "线上故障处理",
    jdEvidence: "负责重大故障复盘",
    resumeEvidence: "未提供",
    matchStatus: "待验证",
    isMissing: true,
    evidenceLevel: 3,
    evidenceLevelLabel: "三级可信 / 缺证",
    evidenceReason: "缺少一线故障证据",
    verificationQuestion: "请提供一次重大故障处理案例。",
  },
];
const snapshot = {
  target_level: "高级开发工程师",
  candidate_stage: "业务终面",
  offer_constraints: "两周内确认 Offer",
};
const feedback = {
  question_use: "采用",
  risk_validation: "已推翻",
  notes: "候选人在面试中补充了故障案例",
};
const virtualPanel = [
  {
    id: "agent_business",
    name: "虚拟业务负责人",
    persona: "虚拟业务负责人 / 开发人员",
    focus: "业务判断",
    stance: "opposing",
    activity_level: 0.8,
    influence_weight: 2.5,
    memory_scope: {
      graph_memory_nodes: ["req_2", "ev_req_2"],
    },
  },
];
const panelDiscussionRounds = [
  {
    stage: "panel_simulation",
    turns: [
      {
        agent_id: "agent_business",
        claim: "需要验证故障处理的一手证据",
        impact: "raise_follow_up_priority",
        question_ids: ["q_2"],
        evidence_ids: ["ev_req_2"],
      },
    ],
  },
];

const graph = model.buildEvidenceGraph(
  snapshot,
  rows,
  feedback,
  virtualPanel,
  panelDiscussionRounds,
);

assert.equal(graph.nodes.length, 11);
assert.equal(graph.edges.length, 15);
assert.ok(graph.nodes.some((node) => node.id === "risk_2" && node.type === "risk"));
assert.ok(graph.nodes.some((node) => node.id === "skill_business" && node.type === "skill"));
assert.ok(graph.nodes.some((node) => node.id === "agent_business" && node.type === "agent_persona"));
assert.ok(graph.nodes.some((node) => node.id === "feedback_1" && node.type === "feedback"));

const strongSupport = graph.edges.find(
  (edge) => edge.from === "ev_req_1" && edge.to === "req_1",
);
assert.equal(strongSupport.type, "supports");
assert.equal(strongSupport.confidence, 0.85);

const missingEvidence = graph.edges.find(
  (edge) => edge.from === "ev_req_2" && edge.to === "req_2",
);
assert.equal(missingEvidence.type, "contradicts");
assert.equal(missingEvidence.weight, 0.25);

assert.ok(graph.edges.some(
  (edge) => edge.from === "agent_business"
    && edge.to === "q_2"
    && edge.type === "discusses"
    && edge.weight === 0.82,
));
assert.ok(graph.edges.some(
  (edge) => edge.from === "agent_business"
    && edge.to === "ev_req_2"
    && edge.type === "challenges",
));
assert.ok(graph.edges.some(
  (edge) => edge.from === "feedback_1"
    && edge.to === "ev_req_2"
    && edge.type === "contradicts",
));

assert.equal(model.reportAnchorForNodeType("risk"), "Risks and Validation Needed");
assert.equal(
  graph.nodes.find((node) => node.id === "q_1").metadata.report_anchor,
  "Interviewer Question Bank",
);

assert.deepEqual(
  model.detectEvidenceGraphGaps(graph).map((node) => node.id),
  ["req_2", "ev_req_2", "risk_2"],
);

language = "zh";
assert.equal(model.reportAnchorForNodeType("resume_evidence"), "证据链");

console.log("evidence-graph model tests passed");
