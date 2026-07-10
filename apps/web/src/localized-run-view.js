// Pure language projection helpers for canonical evaluation runs.
(function initOfferAgentLocalizedRunView(global) {
  "use strict";

  const ARTIFACT_SCHEMA_VERSION = "language-artifact.v3";
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
  const GENERATED_SOURCE_PLACEHOLDERS = new Set([
    "简历未体现明确证据",
    "JD 未提供明确原文",
    "未提供简历快照",
    "未提供 JD 快照",
    "未提供 Offer / 谈薪约束",
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

  function isGeneratedSourcePlaceholder(value) {
    return GENERATED_SOURCE_PLACEHOLDERS.has(String(value || "").trim());
  }

  function addTranslatableText(target, stableId, value, fieldName = "") {
    if (fieldName && isSourceExcerptField(fieldName)) return;
    if (typeof value !== "string" || !value.trim()) return;
    target[stableId] = value;
  }

  function isSourceGraphSummary(node) {
    return ["job_requirement", "resume_evidence", "feedback", "offer_signal"].includes(node?.type);
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
      addTranslatableText(
        textById,
        `question:${id}:adoption_status`,
        question.adoption_status,
        "adoption_status",
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
      addTranslatableText(
        textById,
        `requirement:${id}:evidence_level_label`,
        requirement.evidence_level_label,
        "evidence_level_label",
      );
      if (isGeneratedSourcePlaceholder(requirement.resume_evidence)) {
        addTranslatableText(
          textById,
          `requirement:${id}:resume_evidence`,
          requirement.resume_evidence,
          "generated_placeholder",
        );
      }
    });

    (run?.evidence_graph?.nodes || []).forEach((node, index) => {
      const id = node.id || `node_${index + 1}`;
      addTranslatableText(textById, `graph:${id}:label`, node.label, "label");
      if (!isSourceGraphSummary(node) || isGeneratedSourcePlaceholder(node.summary)) {
        addTranslatableText(textById, `graph:${id}:summary`, node.summary, "summary");
      }
      ["evidence_level_label", "adoption_status"].forEach((fieldName) => {
        addTranslatableText(
          textById,
          `graph:${id}:metadata:${fieldName}`,
          node.metadata?.[fieldName],
          fieldName,
        );
      });
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
    (run?.offer_simulation_run?.lifecycle_steps || []).forEach((step, index) => {
      const id = step.id || `step_${index + 1}`;
      addTranslatableText(
        textById,
        `offer-lifecycle:${id}:label`,
        step.label,
        "label",
      );
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

  function isLocalizedArtifactCurrent(run, language) {
    const targetLanguage = normalizeLanguage(language);
    const artifact = run?.localized_artifacts?.[targetLanguage];
    if (!validateArtifact(artifact)) return false;

    const expectedIds = Object.keys(collectTranslatableArtifacts(run));
    return expectedIds.every((stableId) => (
      Object.prototype.hasOwnProperty.call(artifact.text_by_id, stableId)
    ));
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
    const artifact = isLocalizedArtifactCurrent(run, targetLanguage)
      ? run?.localized_artifacts?.[targetLanguage]
      : null;
    const localizedText = (stableId, fallback) => (
      artifact?.text_by_id
      && Object.prototype.hasOwnProperty.call(artifact.text_by_id, stableId)
        ? artifact.text_by_id[stableId]
        : fallback
    );

    next.display_language = targetLanguage;
    next.display_report = artifact?.report_markdown ?? run?.report ?? "";

    const projectQuestion = (question, index) => {
      const id = question.id || `question_${index + 1}`;
      return {
        ...question,
        question: localizedText(`question:${id}`, question.question),
        capability: localizedText(`question:${id}:capability`, question.capability),
        evaluation_goal: localizedText(
          `question:${id}:evaluation_goal`,
          question.evaluation_goal,
        ),
        expected_signal: localizedText(
          `question:${id}:expected_signal`,
          question.expected_signal,
        ),
        adoption_status: localizedText(
          `question:${id}:adoption_status`,
          question.adoption_status,
        ),
      };
    };

    if (Array.isArray(next.interview_questions)) {
      next.interview_questions = next.interview_questions.map(projectQuestion);
    }
    if (Array.isArray(next.top_follow_up_questions)) {
      next.top_follow_up_questions = next.top_follow_up_questions.map(projectQuestion);
    }

    if (Array.isArray(next.requirement_matches)) {
      next.requirement_matches = next.requirement_matches.map((requirement, index) => {
        const id = requirement.id || `requirement_${index + 1}`;
        return {
          ...requirement,
          capability: localizedText(
            `requirement:${id}:capability`,
            requirement.capability,
          ),
          verification_question: localizedText(
            `requirement:${id}:verification_question`,
            requirement.verification_question,
          ),
          evidence_reason: localizedText(
            `requirement:${id}:evidence_reason`,
            requirement.evidence_reason,
          ),
          match_status: localizedText(
            `requirement:${id}:match_status`,
            requirement.match_status,
          ),
          evidence_level_label: localizedText(
            `requirement:${id}:evidence_level_label`,
            requirement.evidence_level_label,
          ),
          resume_evidence: isGeneratedSourcePlaceholder(requirement.resume_evidence)
            ? localizedText(
                `requirement:${id}:resume_evidence`,
                requirement.resume_evidence,
              )
            : requirement.resume_evidence,
        };
      });
    }

    if (next.evidence_graph) {
      next.evidence_graph = {
        ...next.evidence_graph,
        nodes: Array.isArray(next.evidence_graph.nodes)
          ? next.evidence_graph.nodes.map((node) => ({
              ...node,
              label: localizedText(`graph:${node.id}:label`, node.label),
              summary: isSourceGraphSummary(node) && !isGeneratedSourcePlaceholder(node.summary)
                ? node.summary
                : localizedText(`graph:${node.id}:summary`, node.summary),
              metadata: node.metadata
                ? {
                    ...node.metadata,
                    evidence_level_label: localizedText(
                      `graph:${node.id}:metadata:evidence_level_label`,
                      node.metadata.evidence_level_label,
                    ),
                    adoption_status: localizedText(
                      `graph:${node.id}:metadata:adoption_status`,
                      node.metadata.adoption_status,
                    ),
                  }
                : node.metadata,
            }))
          : next.evidence_graph.nodes,
      };
    }

    if (Array.isArray(next.virtual_panel)) {
      next.virtual_panel = next.virtual_panel.map((agent, index) => {
        const id = agent.id || `agent_${index + 1}`;
        return {
          ...agent,
          name: localizedText(`panel-agent:${id}:name`, agent.name),
          focus: localizedText(`panel-agent:${id}:focus`, agent.focus),
          stance: localizedText(`panel-agent:${id}:stance`, agent.stance),
        };
      });
    }

    if (Array.isArray(next.panel_discussion_rounds)) {
      next.panel_discussion_rounds = next.panel_discussion_rounds.map((round, roundIndex) => {
        const roundId = round.id || `round_${roundIndex + 1}`;
        return {
          ...round,
          topic: localizedText(`panel-round:${roundId}:topic`, round.topic),
          turns: Array.isArray(round.turns)
            ? round.turns.map((turn, turnIndex) => {
                const agentId = turn.agent_id || `agent_${turnIndex + 1}`;
                return {
                  ...turn,
                  claim: localizedText(
                    `panel:${roundId}:${agentId}:${turnIndex}`,
                    turn.claim,
                  ),
                };
              })
            : round.turns,
        };
      });
    }

    if (next.moderator_summary) {
      next.moderator_summary = {
        ...next.moderator_summary,
        final_recommendation: localizedText(
          "moderator:final_recommendation",
          next.moderator_summary.final_recommendation,
        ),
      };
    }

    if (next.offer_simulation_run) {
      next.offer_simulation_run = {
        ...next.offer_simulation_run,
        current_output: next.offer_simulation_run.current_output
          ? {
              ...next.offer_simulation_run.current_output,
              recommendation: localizedText(
                "offer-current-output:recommendation",
                next.offer_simulation_run.current_output.recommendation,
              ),
              summary: localizedText(
                "offer-current-output:summary",
                next.offer_simulation_run.current_output.summary,
              ),
              next_action: localizedText(
                "offer-current-output:next_action",
                next.offer_simulation_run.current_output.next_action,
              ),
            }
          : next.offer_simulation_run.current_output,
        risks: Array.isArray(next.offer_simulation_run.risks)
          ? next.offer_simulation_run.risks.map((risk, index) => {
              const id = risk.id || `risk_${index + 1}`;
              return {
                ...risk,
                risk: localizedText(`offer-risk:${id}:risk`, risk.risk),
              };
            })
          : next.offer_simulation_run.risks,
        lifecycle_steps: Array.isArray(next.offer_simulation_run.lifecycle_steps)
          ? next.offer_simulation_run.lifecycle_steps.map((step, index) => {
              const id = step.id || `step_${index + 1}`;
              return {
                ...step,
                label: localizedText(
                  `offer-lifecycle:${id}:label`,
                  step.label,
                ),
              };
            })
          : next.offer_simulation_run.lifecycle_steps,
        scenario_comparison: Array.isArray(next.offer_simulation_run.scenario_comparison)
          ? next.offer_simulation_run.scenario_comparison.map((scenario, index) => ({
              ...scenario,
              assumption: localizedText(
                `offer-scenario:${index}:assumption`,
                scenario.assumption,
              ),
              next_action: localizedText(
                `offer-scenario:${index}:next_action`,
                scenario.next_action,
              ),
            }))
          : next.offer_simulation_run.scenario_comparison,
        next_actions: Array.isArray(next.offer_simulation_run.next_actions)
          ? next.offer_simulation_run.next_actions.map((action, index) => (
              localizedText(`offer-next-action:${index}`, action)
            ))
          : next.offer_simulation_run.next_actions,
        final_decision_hint: localizedText(
          "offer:final_decision_hint",
          next.offer_simulation_run.final_decision_hint,
        ),
      };
    }

    if (next.feedback_distillation) {
      next.feedback_distillation = {
        ...next.feedback_distillation,
        actions: Array.isArray(next.feedback_distillation.actions)
          ? next.feedback_distillation.actions.map((action, index) => {
              const id = action.id || `action_${index + 1}`;
              return {
                ...action,
                reason: localizedText(`feedback:${id}:reason`, action.reason),
                summary: localizedText(`feedback:${id}:summary`, action.summary),
              };
            })
          : next.feedback_distillation.actions,
        impact_diff: Array.isArray(next.feedback_distillation.impact_diff)
          ? next.feedback_distillation.impact_diff.map((item, index) => ({
              ...item,
              before: localizedText(`feedback-impact:${index}:before`, item.before),
              after: localizedText(`feedback-impact:${index}:after`, item.after),
            }))
          : next.feedback_distillation.impact_diff,
      };
    }

    if (next.evaluation_summary) {
      next.evaluation_summary = {
        ...next.evaluation_summary,
        offer_leverage_summary: localizedText(
          "evaluation:offer_leverage_summary",
          next.evaluation_summary.offer_leverage_summary,
        ),
        next_validation_focus: Array.isArray(next.evaluation_summary.next_validation_focus)
          ? next.evaluation_summary.next_validation_focus.map((focus, index) => (
              localizedText(`evaluation:next_validation_focus:${index}`, focus)
            ))
          : next.evaluation_summary.next_validation_focus,
      };
    }

    return next;
  }

  global.OfferAgentLocalizedRunView = {
    ARTIFACT_SCHEMA_VERSION,
    SOURCE_FIELDS,
    GENERATED_SOURCE_PLACEHOLDERS,
    collectTranslatableArtifacts,
    isLocalizedArtifactCurrent,
    isSourceExcerptField,
    isGeneratedSourcePlaceholder,
    resolveLocalizedText,
    mergeLocalizedArtifacts,
    projectRunForLanguage,
  };
})(typeof window !== "undefined" ? window : globalThis);
