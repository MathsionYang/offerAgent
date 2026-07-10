// Pure virtual interview panel model builders with injected domain dependencies.
(function initOfferAgentVirtualPanel(global) {
  "use strict";

  function createVirtualPanelModel({
    skillLibrary,
    defaultRoleId,
    getRoleLabel,
    workflowMapping,
  }) {
    const skills = skillLibrary || {};
    const resolveRoleLabel = typeof getRoleLabel === "function"
      ? getRoleLabel
      : (roleId) => roleId || defaultRoleId || "";
    const workflow = workflowMapping || [];

    function buildVirtualInterviewPanel(snapshot, rows, gate) {
      const selected = snapshot.selected_skills?.length
        ? snapshot.selected_skills
        : ["hr", "business", "project", "decision"];
      const roleLabel = resolveRoleLabel(snapshot.target_role || defaultRoleId, "zh");
      const weakRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 2);

      return selected
        .map((id, index) => {
          const skill = skills[id];
          if (!skill) return null;

          const focusRow = weakRows[index % Math.max(weakRows.length, 1)]
            || rows[index % Math.max(rows.length, 1)];
          const stance = focusRow?.isMissing || focusRow?.evidenceLevel >= 3
            ? "opposing"
            : id === "negotiation"
              ? "observer"
              : gate.enterSandbox
                ? "supportive"
                : "neutral";
          const influenceWeight = id === "decision"
            ? 3
            : id === "business"
              ? 2.5
              : id === "project"
                ? 2
                : 1.5;
          const activityLevel = Math.min(1, 0.45 + influenceWeight / 8);
          const focusIndex = rows.indexOf(focusRow);

          return {
            id: `agent_${id}`,
            skill_id: id,
            name: skill.name,
            role_label: roleLabel,
            persona: `${skill.name} / ${roleLabel}`,
            focus: skill.focus,
            stance,
            activity_level: activityLevel,
            influence_weight: influenceWeight,
            memory_scope: {
              seed_sources: ["resume", "job_description", "company_context", "offer_constraints"],
              graph_memory_nodes: focusRow
                ? [`req_${focusIndex + 1}`, `ev_req_${focusIndex + 1}`]
                : [],
              workflow_mapping: workflow,
            },
            audit: {
              source: "persona_generation",
              agent_configuration: {
                stance,
                influence_weight: influenceWeight,
                activity_level: activityLevel,
              },
            },
          };
        })
        .filter(Boolean);
    }

    function buildPanelDiscussionRounds(panel, rows, gate, offerLeverage, feedback) {
      const weakRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 2);
      const focusRows = weakRows.length ? weakRows : rows;

      return [
        {
          id: "round_seed_reading",
          stage: "seed_extraction",
          topic: "JD / resume seed reading",
          turns: panel.map((agent, index) => buildPanelTurn(
            agent,
            focusRows[index % Math.max(focusRows.length, 1)],
            rows,
            "seed_reading",
          )),
        },
        {
          id: "round_risk_challenge",
          stage: "panel_simulation",
          topic: "risk challenge and counter-evidence",
          turns: panel.map((agent, index) => buildPanelTurn(
            agent,
            focusRows[(index + 1) % Math.max(focusRows.length, 1)],
            rows,
            "risk_challenge",
          )),
        },
        {
          id: "round_offer_alignment",
          stage: "moderator_report",
          topic: "offer readiness alignment",
          turns: panel.map((agent, index) => ({
            agent_id: agent.id,
            stance: agent.stance,
            claim: `${agent.name} links ${offerLeverage.rating} offer leverage to ${gate.result}`,
            evidence_ids: focusRows
              .slice(index, index + 2)
              .map((row) => `ev_req_${rows.indexOf(row) + 1}`),
            question_ids: focusRows
              .slice(index, index + 2)
              .map((row) => `q_${rows.indexOf(row) + 1}`),
            impact: feedback ? "recalibrate_with_human_feedback" : "feed_offer_simulation",
          })),
        },
      ];
    }

    function buildPanelTurn(agent, row, rows, mode) {
      const rowIndex = Math.max(0, rows.indexOf(row));
      const weakClaim = row?.isMissing || row?.evidenceLevel >= 2;

      return {
        agent_id: agent.id,
        stance: agent.stance,
        claim: mode === "seed_reading"
          ? `${agent.name} reads ${row?.capability || "core role evidence"} as ${weakClaim ? "pending validation" : "usable evidence"}`
          : `${agent.name} challenges whether ${row?.capability || "the candidate story"} has first-hand evidence`,
        evidence_ids: row ? [`ev_req_${rowIndex + 1}`] : [],
        question_ids: row ? [`q_${rowIndex + 1}`] : [],
        impact: weakClaim ? "raise_follow_up_priority" : "keep_as_supporting_evidence",
      };
    }

    function buildModeratorSummary(panel, rounds, gate, offerLeverage, feedback) {
      const turns = rounds.flatMap((round) => round.turns || []);
      const challengeCount = turns.filter(
        (turn) => turn.impact === "raise_follow_up_priority",
      ).length;
      const supportCount = turns.filter(
        (turn) => turn.impact === "keep_as_supporting_evidence",
      ).length;
      const highestInfluence = [...panel].sort(
        (a, b) => b.influence_weight - a.influence_weight,
      )[0];

      return {
        id: "moderator_summary_1",
        type: "ModeratorSummary",
        consensus: gate.enterSandbox ? "conditional_progress" : "evidence_first",
        disagreement_count: challengeCount,
        support_count: supportCount,
        lead_agent_id: highestInfluence?.id || "",
        final_recommendation: gate.enterSandbox
          ? "Enter the next interview or offer sandbox only after validating the highest-risk evidence nodes."
          : "Pause offer progression and request stronger project-loop evidence before deep interview questions.",
        offer_impact: offerLeverage.rating,
        feedback_impact: feedback
          ? "human_feedback_applied_to_panel_summary"
          : "waiting_for_human_feedback",
      };
    }

    return {
      buildVirtualInterviewPanel,
      buildPanelDiscussionRounds,
      buildPanelTurn,
      buildModeratorSummary,
    };
  }

  global.OfferAgentVirtualPanel = {
    createVirtualPanelModel,
  };
})(typeof window !== "undefined" ? window : globalThis);
