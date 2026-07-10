const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/localized-run-view.js");
assert.ok(fs.existsSync(modulePath), "localized-run-view.js should exist");

require(modulePath);

const {
  ARTIFACT_SCHEMA_VERSION,
  SOURCE_FIELDS,
  collectTranslatableArtifacts,
  isLocalizedArtifactCurrent,
  isSourceExcerptField,
  resolveLocalizedText,
  mergeLocalizedArtifacts,
  projectRunForLanguage,
} = globalThis.OfferAgentLocalizedRunView || {};

assert.equal(ARTIFACT_SCHEMA_VERSION, "language-artifact.v3");
assert.equal(typeof collectTranslatableArtifacts, "function");
assert.equal(typeof isLocalizedArtifactCurrent, "function");
assert.equal(typeof isSourceExcerptField, "function");
assert.equal(typeof resolveLocalizedText, "function");
assert.equal(typeof mergeLocalizedArtifacts, "function");
assert.equal(typeof projectRunForLanguage, "function");

const expectedSourceFields = [
  "resume",
  "job_description",
  "company_context",
  "target_level",
  "offer_constraints",
  "resume_evidence",
  "resumeEvidence",
  "jd_evidence",
  "jdEvidence",
  "source_excerpt",
];

expectedSourceFields.forEach((fieldName) => {
  assert.ok(SOURCE_FIELDS.has(fieldName), `${fieldName} should be protected source text`);
  assert.equal(isSourceExcerptField(fieldName), true);
});
assert.equal(isSourceExcerptField("question"), false);

const sourceRun = {
  id: "run_projection_test",
  input_snapshot: {
    resume: "Resume line 1\r\nResume line 2  ",
    job_description: "JD line 1\nJD line 2\t",
    company_context: "Company context: keep punctuation, spacing, and CASE.",
    target_level: "P6 / Senior Product Manager",
    offer_constraints: "Budget: 40K; start date: 2026-08-01.",
  },
  interview_questions: [
    {
      id: "q_1",
      question: "Explain the canonical metric definition.",
      capability: "Canonical capability",
      evaluation_goal: "Canonical evaluation goal",
      expected_signal: "Canonical expected signal",
      adoption_status: "Canonical adoption status",
      resumeEvidence: "Resume evidence must remain unchanged.",
      jdEvidence: "JD evidence must remain unchanged.",
    },
  ],
  requirement_matches: [
    {
      id: "req_1",
      capability: "Canonical requirement capability",
      verification_question: "Canonical requirement question",
      evidence_reason: "Canonical evidence reason",
      match_status: "Canonical match status",
      evidence_level_label: "Canonical evidence level label",
      resume_evidence: "Requirement resume evidence must remain unchanged.",
      jd_evidence: "Requirement JD evidence must remain unchanged.",
    },
  ],
  evidence_graph: {
    nodes: [
      {
        id: "risk_1",
        type: "risk",
        label: "Canonical metric risk",
        summary: "Canonical real-contribution risk summary",
        metadata: {
          source_excerpt: "JD source excerpt\r\nwith exact whitespace.  ",
          evidence_level_label: "Canonical graph evidence level",
          adoption_status: "Canonical graph adoption status",
        },
      },
      {
        id: "req_1",
        type: "job_requirement",
        label: "Canonical requirement node",
        summary: "Raw JD excerpt must remain unchanged.",
      },
      {
        id: "ev_req_1",
        type: "resume_evidence",
        label: "Canonical evidence node",
        summary: "Raw resume excerpt must remain unchanged.",
      },
      {
        id: "ev_missing",
        type: "resume_evidence",
        label: "Canonical missing evidence node",
        summary: "简历未体现明确证据",
      },
      {
        id: "offer_signal_1",
        type: "offer_signal",
        label: "Canonical offer signal",
        summary: "目标职级：中级产品经理。预算较紧，希望候选人 4 周内到岗。",
      },
    ],
    edges: [],
  },
  virtual_panel: [
    {
      id: "agent_hr",
      name: "Canonical HR partner",
      focus: "Canonical people focus",
      stance: "Canonical cautious stance",
    },
  ],
  panel_discussion_rounds: [
    {
      id: "round_seed_reading",
      topic: "Canonical seed reading",
      turns: [
        {
          agent_id: "agent_hr",
          claim: "Canonical panel claim",
        },
      ],
    },
  ],
  moderator_summary: {
    final_recommendation: "Canonical moderator recommendation",
  },
  offer_simulation_run: {
    lifecycle_steps: [
      {
        id: "resume_evaluation",
        label: "Canonical lifecycle label",
      },
    ],
    current_output: {
      recommendation: "Canonical current recommendation",
      summary: "Canonical current summary",
      next_action: "Canonical current next action",
    },
    risks: [
      {
        id: "offer_risk_1",
        risk: "Canonical offer risk",
      },
    ],
    scenario_comparison: [
      {
        name: "Base",
        assumption: "Canonical base assumption",
        next_action: "Canonical base next action",
      },
    ],
    next_actions: ["Canonical offer next action"],
    final_decision_hint: "Canonical final decision hint",
  },
  feedback_distillation: {
    actions: [
      {
        id: "action_promote_questions",
        reason: "Canonical feedback action reason",
      },
    ],
    impact_diff: [
      {
        before: "Canonical feedback before",
        after: "Canonical feedback after",
      },
    ],
  },
  evaluation_summary: {
    offer_leverage_summary: "Canonical leverage summary",
    next_validation_focus: ["Canonical validation focus"],
  },
};

const sourceRunBeforeMerge = JSON.parse(JSON.stringify(sourceRun));
const artifact = {
  schema_version: ARTIFACT_SCHEMA_VERSION,
  source: "translated",
  report_markdown: "# Candidate Report",
  text_by_id: {
    "question:q_1": "Explain the metric definition",
    "question:q_1:capability": "Localized capability",
    "question:q_1:evaluation_goal": "Localized evaluation goal",
    "question:q_1:expected_signal": "Localized expected signal",
    "question:q_1:adoption_status": "Localized adoption status",
    "requirement:req_1:capability": "Localized requirement capability",
    "requirement:req_1:verification_question": "Localized requirement question",
    "requirement:req_1:evidence_reason": "Localized evidence reason",
    "requirement:req_1:match_status": "Localized match status",
    "requirement:req_1:evidence_level_label": "Localized evidence level label",
    "graph:risk_1:label": "Metric risk",
    "graph:risk_1:summary": "Validate real contribution",
    "graph:risk_1:metadata:evidence_level_label": "Localized graph evidence level",
    "graph:risk_1:metadata:adoption_status": "Localized graph adoption status",
    "graph:req_1:label": "Localized requirement node",
    "graph:ev_req_1:label": "Localized evidence node",
    "graph:ev_missing:label": "Localized missing evidence node",
    "graph:ev_missing:summary": "No explicit resume evidence",
    "graph:offer_signal_1:label": "Localized offer signal",
    "panel-agent:agent_hr:name": "Localized HR partner",
    "panel-agent:agent_hr:focus": "Localized people focus",
    "panel-agent:agent_hr:stance": "Localized cautious stance",
    "panel-round:round_seed_reading:topic": "Localized seed reading",
    "panel:round_seed_reading:agent_hr:0": "Localized panel claim",
    "moderator:final_recommendation": "Localized moderator recommendation",
    "offer-risk:offer_risk_1:risk": "Localized offer risk",
    "offer-lifecycle:resume_evaluation:label": "Localized lifecycle label",
    "offer-scenario:0:assumption": "Localized base assumption",
    "offer-scenario:0:next_action": "Localized base next action",
    "offer-next-action:0": "Localized offer next action",
    "offer-current-output:recommendation": "Localized current recommendation",
    "offer-current-output:summary": "Localized current summary",
    "offer-current-output:next_action": "Localized current next action",
    "offer:final_decision_hint": "Localized final decision hint",
    "feedback:action_promote_questions:reason": "Localized feedback action reason",
    "feedback-impact:0:before": "Localized feedback before",
    "feedback-impact:0:after": "Localized feedback after",
    "evaluation:offer_leverage_summary": "Localized leverage summary",
    "evaluation:next_validation_focus:0": "Localized validation focus",
  },
};

const merged = mergeLocalizedArtifacts(sourceRun, "en", artifact);

assert.notEqual(merged, sourceRun);
assert.deepEqual(sourceRun, sourceRunBeforeMerge);
assert.deepEqual(merged.localized_artifacts.en, artifact);
assert.notEqual(merged.localized_artifacts.en, artifact);
assert.equal(isLocalizedArtifactCurrent(merged, "en"), true);

const incompleteArtifactRun = mergeLocalizedArtifacts(sourceRun, "en", artifact);
delete incompleteArtifactRun.localized_artifacts.en.text_by_id["panel-agent:agent_hr:name"];
assert.equal(
  isLocalizedArtifactCurrent(incompleteArtifactRun, "en"),
  false,
  "artifacts missing newly translatable fields must be rebuilt",
);

const staleArtifactRun = {
  ...sourceRun,
  localized_artifacts: {
    en: {
      ...artifact,
      schema_version: "language-artifact.v2",
    },
  },
};
assert.equal(
  isLocalizedArtifactCurrent(staleArtifactRun, "en"),
  false,
  "older artifact schemas must not be reused",
);

const mergedBeforeProjection = JSON.parse(JSON.stringify(merged));
const projected = projectRunForLanguage(merged, "en");

assert.notEqual(projected, merged);
assert.equal(projected.display_language, "en");
assert.equal(projected.display_report, "# Candidate Report");
assert.equal(projected.interview_questions[0].question, "Explain the metric definition");
assert.equal(projected.interview_questions[0].capability, "Localized capability");
assert.equal(projected.interview_questions[0].evaluation_goal, "Localized evaluation goal");
assert.equal(projected.interview_questions[0].expected_signal, "Localized expected signal");
assert.equal(projected.interview_questions[0].adoption_status, "Localized adoption status");
assert.equal(projected.requirement_matches[0].capability, "Localized requirement capability");
assert.equal(
  projected.requirement_matches[0].verification_question,
  "Localized requirement question",
);
assert.equal(projected.requirement_matches[0].evidence_reason, "Localized evidence reason");
assert.equal(projected.requirement_matches[0].match_status, "Localized match status");
assert.equal(
  projected.requirement_matches[0].evidence_level_label,
  "Localized evidence level label",
);
assert.equal(projected.evidence_graph.nodes[0].label, "Metric risk");
assert.equal(projected.evidence_graph.nodes[0].summary, "Validate real contribution");
assert.equal(
  projected.evidence_graph.nodes[0].metadata.evidence_level_label,
  "Localized graph evidence level",
);
assert.equal(
  projected.evidence_graph.nodes[0].metadata.adoption_status,
  "Localized graph adoption status",
);
assert.equal(projected.evidence_graph.nodes[1].label, "Localized requirement node");
assert.equal(
  projected.evidence_graph.nodes[1].summary,
  "Raw JD excerpt must remain unchanged.",
);
assert.equal(projected.evidence_graph.nodes[2].label, "Localized evidence node");
assert.equal(
  projected.evidence_graph.nodes[2].summary,
  "Raw resume excerpt must remain unchanged.",
);
assert.equal(projected.evidence_graph.nodes[3].label, "Localized missing evidence node");
assert.equal(projected.evidence_graph.nodes[3].summary, "No explicit resume evidence");
assert.equal(projected.evidence_graph.nodes[4].label, "Localized offer signal");
assert.equal(
  projected.evidence_graph.nodes[4].summary,
  sourceRun.evidence_graph.nodes[4].summary,
  "Offer constraints shown in the graph must remain byte-for-byte unchanged",
);
assert.equal(projected.virtual_panel[0].name, "Localized HR partner");
assert.equal(projected.virtual_panel[0].focus, "Localized people focus");
assert.equal(projected.virtual_panel[0].stance, "Localized cautious stance");
assert.equal(projected.panel_discussion_rounds[0].topic, "Localized seed reading");
assert.equal(projected.panel_discussion_rounds[0].turns[0].claim, "Localized panel claim");
assert.equal(
  projected.moderator_summary.final_recommendation,
  "Localized moderator recommendation",
);
assert.equal(projected.offer_simulation_run.risks[0].risk, "Localized offer risk");
assert.equal(
  projected.offer_simulation_run.lifecycle_steps[0].label,
  "Localized lifecycle label",
);
assert.equal(
  projected.offer_simulation_run.scenario_comparison[0].assumption,
  "Localized base assumption",
);
assert.equal(
  projected.offer_simulation_run.scenario_comparison[0].next_action,
  "Localized base next action",
);
assert.equal(
  projected.offer_simulation_run.next_actions[0],
  "Localized offer next action",
);
assert.equal(
  projected.offer_simulation_run.current_output.recommendation,
  "Localized current recommendation",
);
assert.equal(
  projected.offer_simulation_run.current_output.summary,
  "Localized current summary",
);
assert.equal(
  projected.offer_simulation_run.current_output.next_action,
  "Localized current next action",
);
assert.equal(
  projected.offer_simulation_run.final_decision_hint,
  "Localized final decision hint",
);
assert.equal(
  projected.feedback_distillation.actions[0].reason,
  "Localized feedback action reason",
);
assert.equal(
  projected.feedback_distillation.impact_diff[0].before,
  "Localized feedback before",
);
assert.equal(
  projected.feedback_distillation.impact_diff[0].after,
  "Localized feedback after",
);
assert.equal(
  projected.evaluation_summary.offer_leverage_summary,
  "Localized leverage summary",
);
assert.equal(
  projected.evaluation_summary.next_validation_focus[0],
  "Localized validation focus",
);

const staleProjection = projectRunForLanguage(staleArtifactRun, "en");
assert.equal(
  staleProjection.display_report,
  sourceRun.report || "",
  "stale report artifacts must not be projected",
);
assert.equal(
  staleProjection.virtual_panel[0].name,
  sourceRun.virtual_panel[0].name,
  "stale text artifacts must not be projected",
);

[
  "resume",
  "job_description",
  "company_context",
  "target_level",
  "offer_constraints",
].forEach((fieldName) => {
  assert.equal(
    projected.input_snapshot[fieldName],
    sourceRun.input_snapshot[fieldName],
    `${fieldName} should remain byte-for-byte unchanged`,
  );
});

assert.equal(
  projected.interview_questions[0].resumeEvidence,
  sourceRun.interview_questions[0].resumeEvidence,
);
assert.equal(
  projected.interview_questions[0].jdEvidence,
  sourceRun.interview_questions[0].jdEvidence,
);
assert.equal(
  projected.requirement_matches[0].resume_evidence,
  sourceRun.requirement_matches[0].resume_evidence,
);
assert.equal(
  projected.requirement_matches[0].jd_evidence,
  sourceRun.requirement_matches[0].jd_evidence,
);
assert.equal(
  projected.evidence_graph.nodes[0].metadata.source_excerpt,
  sourceRun.evidence_graph.nodes[0].metadata.source_excerpt,
);
assert.deepEqual(merged, mergedBeforeProjection);
assert.deepEqual(sourceRun, sourceRunBeforeMerge);

assert.equal(
  resolveLocalizedText(merged, "en", "question:q_1", "Canonical question"),
  "Explain the metric definition",
);
assert.equal(
  resolveLocalizedText(merged, "zh", "question:q_1", "Canonical question"),
  "Canonical question",
);

const collected = collectTranslatableArtifacts(sourceRun);
assert.equal(collected["question:q_1"], "Explain the canonical metric definition.");
assert.equal(collected["graph:risk_1:label"], "Canonical metric risk");
assert.equal(
  collected["graph:risk_1:summary"],
  "Canonical real-contribution risk summary",
);
assert.equal(collected["graph:req_1:label"], "Canonical requirement node");
assert.equal(collected["graph:req_1:summary"], undefined);
assert.equal(collected["graph:ev_req_1:label"], "Canonical evidence node");
assert.equal(collected["graph:ev_req_1:summary"], undefined);
assert.equal(collected["graph:offer_signal_1:label"], "Canonical offer signal");
assert.equal(
  collected["graph:offer_signal_1:summary"],
  undefined,
  "Offer constraint source text must not enter the translation payload",
);
assert.equal(
  collected["panel-round:round_seed_reading:topic"],
  "Canonical seed reading",
);
assert.equal(
  collected["panel:round_seed_reading:agent_hr:0"],
  "Canonical panel claim",
);
assert.equal(
  collected["moderator:final_recommendation"],
  "Canonical moderator recommendation",
);
assert.equal(collected["offer-risk:offer_risk_1:risk"], "Canonical offer risk");
assert.equal(
  collected["offer-lifecycle:resume_evaluation:label"],
  "Canonical lifecycle label",
);
assert.equal(
  collected["offer-scenario:0:assumption"],
  "Canonical base assumption",
);
assert.equal(
  collected["offer-scenario:0:next_action"],
  "Canonical base next action",
);
assert.equal(
  collected["feedback:action_promote_questions:reason"],
  "Canonical feedback action reason",
);

const collectedValues = Object.values(collected);
[
  sourceRun.input_snapshot.resume,
  sourceRun.input_snapshot.job_description,
  sourceRun.input_snapshot.company_context,
  sourceRun.input_snapshot.target_level,
  sourceRun.input_snapshot.offer_constraints,
  sourceRun.interview_questions[0].resumeEvidence,
  sourceRun.interview_questions[0].jdEvidence,
  sourceRun.evidence_graph.nodes[0].metadata.source_excerpt,
].forEach((sourceText) => {
  assert.equal(
    collectedValues.includes(sourceText),
    false,
    "source text must not enter the translation payload",
  );
});

assert.throws(
  () => mergeLocalizedArtifacts(sourceRun, "en", {
    schema_version: "language-artifact.v0",
    source: "translated",
    text_by_id: {},
  }),
  /Invalid language artifact/,
);
assert.throws(
  () => mergeLocalizedArtifacts(sourceRun, "en", {
    schema_version: ARTIFACT_SCHEMA_VERSION,
    source: "translated",
    text_by_id: [],
  }),
  /Invalid language artifact/,
);

console.log("localized-run-view tests passed");
