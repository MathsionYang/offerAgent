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

  function addTranslatableText(target, stableId, value, fieldName = "") {
    if (fieldName && isSourceExcerptField(fieldName)) return;
    if (typeof value !== "string" || !value.trim()) return;
    target[stableId] = value;
  }

  function collectTranslatableArtifacts(run) {
    const textById = {};

    (run?.interview_questions || []).forEach((question, index) => {
      const id = question.id || `question_${index + 1}`;
      addTranslatableText(textById, `question:${id}`, question.question, "question");
      addTranslatableText(textById, `question:${id}:capability`, question.capability, "capability");
      addTranslatableText(
        textById,
        `question:${id}:evaluation_goal`,
        question.evaluation_goal,
        "evaluation_goal",
      );
      addTranslatableText(
        textById,
        `question:${id}:expected_signal`,
        question.expected_signal,
        "expected_signal",
      );
    });

    (run?.requirement_matches || []).forEach((requirement, index) => {
      const id = requirement.id || `requirement_${index + 1}`;
      addTranslatableText(
        textById,
        `requirement:${id}:capability`,
        requirement.capability,
        "capability",
      );
      addTranslatableText(
        textById,
        `requirement:${id}:verification_question`,
        requirement.verification_question,
        "verification_question",
      );
      addTranslatableText(
        textById,
        `requirement:${id}:evidence_reason`,
        requirement.evidence_reason,
        "evidence_reason",
      );
      addTranslatableText(
        textById,
        `requirement:${id}:match_status`,
        requirement.match_status,
        "match_status",
      );
    });

    (run?.evidence_graph?.nodes || []).forEach((node, index) => {
      const id = node.id || `node_${index + 1}`;
      addTranslatableText(textById, `graph:${id}:label`, node.label, "label");
      addTranslatableText(textById, `graph:${id}:summary`, node.summary, "summary");
    });

    (run?.virtual_panel || []).forEach((agent, index) => {
      const id = agent.id || `agent_${index + 1}`;
      addTranslatableText(textById, `panel-agent:${id}:name`, agent.name, "name");
      addTranslatableText(textById, `panel-agent:${id}:focus`, agent.focus, "focus");
      addTranslatableText(textById, `panel-agent:${id}:stance`, agent.stance, "stance");
    });

    (run?.panel_discussion_rounds || []).forEach((round, roundIndex) => {
      const roundId = round.id || `round_${roundIndex + 1}`;
      addTranslatableText(
        textById,
        `panel-round:${roundId}:topic`,
        round.topic,
        "topic",
      );
      (round.turns || []).forEach((turn, turnIndex) => {
        const agentId = turn.agent_id || `agent_${turnIndex + 1}`;
        addTranslatableText(
          textById,
          `panel:${roundId}:${agentId}:${turnIndex}`,
          turn.claim,
          "claim",
        );
      });
    });

    addTranslatableText(
      textById,
      "moderator:final_recommendation",
      run?.moderator_summary?.final_recommendation,
      "final_recommendation",
    );

    (run?.offer_simulation_run?.risks || []).forEach((risk, index) => {
      const id = risk.id || `risk_${index + 1}`;
      addTranslatableText(textById, `offer-risk:${id}:risk`, risk.risk, "risk");
    });
    (run?.offer_simulation_run?.scenario_comparison || []).forEach((scenario, index) => {
      addTranslatableText(
        textById,
        `offer-scenario:${index}:assumption`,
        scenario.assumption,
        "assumption",
      );
      addTranslatableText(
        textById,
        `offer-scenario:${index}:next_action`,
        scenario.next_action,
        "next_action",
      );
    });
    (run?.offer_simulation_run?.next_actions || []).forEach((action, index) => {
      addTranslatableText(
        textById,
        `offer-next-action:${index}`,
        action,
        "next_action",
      );
    });
    ["recommendation", "summary", "next_action"].forEach((fieldName) => {
      addTranslatableText(
        textById,
        `offer-current-output:${fieldName}`,
        run?.offer_simulation_run?.current_output?.[fieldName],
        fieldName,
      );
    });
    addTranslatableText(
      textById,
      "offer:final_decision_hint",
      run?.offer_simulation_run?.final_decision_hint,
      "final_decision_hint",
    );

    (run?.feedback_distillation?.actions || []).forEach((action, index) => {
      const id = action.id || `action_${index + 1}`;
      addTranslatableText(textById, `feedback:${id}:reason`, action.reason, "reason");
      addTranslatableText(textById, `feedback:${id}:summary`, action.summary, "summary");
    });
    (run?.feedback_distillation?.impact_diff || []).forEach((item, index) => {
      addTranslatableText(textById, `feedback-impact:${index}:before`, item.before, "before");
      addTranslatableText(textById, `feedback-impact:${index}:after`, item.after, "after");
    });

    addTranslatableText(
      textById,
      "evaluation:offer_leverage_summary",
      run?.evaluation_summary?.offer_leverage_summary,
      "offer_leverage_summary",
    );
    (run?.evaluation_summary?.next_validation_focus || []).forEach((focus, index) => {
      addTranslatableText(
        textById,
        `evaluation:next_validation_focus:${index}`,
        focus,
        "next_validation_focus",
      );
    });

    return textById;
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
    collectTranslatableArtifacts,
    isSourceExcerptField,
    resolveLocalizedText,
    mergeLocalizedArtifacts,
    projectRunForLanguage,
  };
})(typeof window !== "undefined" ? window : globalThis);
