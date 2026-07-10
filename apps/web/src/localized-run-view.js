// Pure language projection helpers for canonical evaluation runs.
(function initOfferAgentLocalizedRunView(global) {
  "use strict";

  const ARTIFACT_SCHEMA_VERSION = "language-artifact.v1";
  const SOURCE_FIELDS = new Set([
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
  ]);

  function normalizeLanguage(language) {
    return language === "en" ? "en" : "zh";
  }

  function cloneValue(value) {
    if (typeof global.structuredClone === "function") {
      return global.structuredClone(value);
    }
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function isSourceExcerptField(fieldName) {
    return SOURCE_FIELDS.has(fieldName);
  }

  function resolveLocalizedText(run, language, stableId, fallback = "") {
    const textById = run?.localized_artifacts?.[normalizeLanguage(language)]?.text_by_id;
    if (!textById || !Object.prototype.hasOwnProperty.call(textById, stableId)) {
      return fallback;
    }
    return textById[stableId];
  }

  function validateArtifact(artifact) {
    return Boolean(
      artifact
      && typeof artifact === "object"
      && !Array.isArray(artifact)
      && artifact.schema_version === ARTIFACT_SCHEMA_VERSION
      && artifact.text_by_id
      && typeof artifact.text_by_id === "object"
      && !Array.isArray(artifact.text_by_id),
    );
  }

  function mergeLocalizedArtifacts(run, language, artifact) {
    if (!validateArtifact(artifact)) {
      throw new Error("Invalid language artifact.");
    }

    const targetLanguage = normalizeLanguage(language);
    const next = cloneValue(run || {});
    next.localized_artifacts = {
      ...(next.localized_artifacts || {}),
      [targetLanguage]: cloneValue(artifact),
    };
    return next;
  }

  function projectRunForLanguage(run, language) {
    const targetLanguage = normalizeLanguage(language);
    const next = cloneValue(run || {});
    const artifact = run?.localized_artifacts?.[targetLanguage];
    const localizedText = (stableId, fallback) => (
      resolveLocalizedText(run, targetLanguage, stableId, fallback)
    );

    next.display_language = targetLanguage;
    next.display_report = artifact?.report_markdown ?? run?.report ?? "";

    if (Array.isArray(next.interview_questions)) {
      next.interview_questions = next.interview_questions.map((question) => ({
        ...question,
        question: localizedText(`question:${question.id}`, question.question),
      }));
    }

    if (next.evidence_graph) {
      next.evidence_graph = {
        ...next.evidence_graph,
        nodes: Array.isArray(next.evidence_graph.nodes)
          ? next.evidence_graph.nodes.map((node) => ({
              ...node,
              label: localizedText(`graph:${node.id}:label`, node.label),
              summary: localizedText(`graph:${node.id}:summary`, node.summary),
            }))
          : next.evidence_graph.nodes,
      };
    }

    return next;
  }

  global.OfferAgentLocalizedRunView = {
    ARTIFACT_SCHEMA_VERSION,
    SOURCE_FIELDS,
    isSourceExcerptField,
    resolveLocalizedText,
    mergeLocalizedArtifacts,
    projectRunForLanguage,
  };
})(typeof window !== "undefined" ? window : globalThis);
