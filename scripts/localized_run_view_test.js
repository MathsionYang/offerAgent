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
  isSourceExcerptField,
  resolveLocalizedText,
  mergeLocalizedArtifacts,
  projectRunForLanguage,
} = globalThis.OfferAgentLocalizedRunView || {};

assert.equal(ARTIFACT_SCHEMA_VERSION, "language-artifact.v1");
assert.equal(typeof collectTranslatableArtifacts, "function");
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
      resumeEvidence: "Resume evidence must remain unchanged.",
      jdEvidence: "JD evidence must remain unchanged.",
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
        },
      },
    ],
    edges: [],
  },
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
  },
  feedback_distillation: {
    actions: [
      {
        id: "action_promote_questions",
        reason: "Canonical feedback action reason",
      },
    ],
  },
};

const sourceRunBeforeMerge = JSON.parse(JSON.stringify(sourceRun));
const artifact = {
  schema_version: ARTIFACT_SCHEMA_VERSION,
  source: "translated",
  report_markdown: "# Candidate Report",
  text_by_id: {
    "question:q_1": "Explain the metric definition",
    "graph:risk_1:label": "Metric risk",
    "graph:risk_1:summary": "Validate real contribution",
  },
};

const merged = mergeLocalizedArtifacts(sourceRun, "en", artifact);

assert.notEqual(merged, sourceRun);
assert.deepEqual(sourceRun, sourceRunBeforeMerge);
assert.deepEqual(merged.localized_artifacts.en, artifact);
assert.notEqual(merged.localized_artifacts.en, artifact);

const mergedBeforeProjection = JSON.parse(JSON.stringify(merged));
const projected = projectRunForLanguage(merged, "en");

assert.notEqual(projected, merged);
assert.equal(projected.display_language, "en");
assert.equal(projected.display_report, "# Candidate Report");
assert.equal(projected.interview_questions[0].question, "Explain the metric definition");
assert.equal(projected.evidence_graph.nodes[0].label, "Metric risk");
assert.equal(projected.evidence_graph.nodes[0].summary, "Validate real contribution");

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
