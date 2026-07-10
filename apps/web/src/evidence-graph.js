// Pure EvidenceGraph builders with injected application dependencies.
(function initOfferAgentEvidenceGraph(global) {
  "use strict";

  function createEvidenceGraphModel({
    buildSkillRegistry,
    interviewerLens,
    getLanguage,
  }) {
    const resolveSkillRegistry = typeof buildSkillRegistry === "function"
      ? buildSkillRegistry
      : () => [];
    const resolveInterviewerLens = typeof interviewerLens === "function"
      ? interviewerLens
      : () => "";
    const resolveLanguage = typeof getLanguage === "function"
      ? getLanguage
      : () => "zh";

    function reportAnchorForNodeType(type) {
      const zh = {
        job_requirement: "岗位匹配",
        resume_evidence: "证据链",
        interview_question: "面试官候选问题库（供挑选）",
        risk: "风险与待验证",
        offer_signal: "Offer 沙盘推演",
        feedback: "人工反馈校准",
        skill: "面试官视角库",
        agent_persona: "虚拟面试委员会",
      };
      const en = {
        job_requirement: "Role Match",
        resume_evidence: "Evidence Chain",
        interview_question: "Interviewer Question Bank",
        risk: "Risks and Validation Needed",
        offer_signal: "Offer Simulation",
        feedback: "Human Feedback Calibration",
        skill: "Interviewer Lens Library",
        agent_persona: "Virtual Interview Panel",
      };
      return resolveLanguage() === "en" ? en[type] : zh[type];
    }

    function buildEvidenceGraph(
      snapshot,
      rows,
      feedback,
      virtualPanel = [],
      panelDiscussionRounds = [],
    ) {
      const nodes = [];
      const edges = [];
      const skillRegistry = resolveSkillRegistry(snapshot, rows);

      rows.forEach((row, index) => {
        const requirementId = `req_${index + 1}`;
        const evidenceId = `ev_req_${index + 1}`;
        const questionId = `q_${index + 1}`;
        const riskId = `risk_${index + 1}`;

        nodes.push({
          id: requirementId,
          type: "job_requirement",
          label: row.capability,
          summary: row.jdEvidence,
          metadata: {
            match_status: row.matchStatus,
            report_anchor: reportAnchorForNodeType("job_requirement"),
            source: "job_description",
          },
        });
        nodes.push({
          id: evidenceId,
          type: "resume_evidence",
          label: row.isMissing ? `${row.capability} 缺证` : row.capability,
          summary: row.resumeEvidence,
          metadata: {
            evidence_level: row.evidenceLevel,
            evidence_level_label: row.evidenceLevelLabel,
            evidence_reason: row.evidenceReason,
            report_anchor: reportAnchorForNodeType("resume_evidence"),
            source: row.isMissing ? "missing_resume_evidence" : "resume_requirement_match",
          },
        });
        nodes.push({
          id: questionId,
          type: "interview_question",
          label: `${row.capability} 验证问题`,
          summary: row.verificationQuestion,
          metadata: {
            lens: resolveInterviewerLens(index),
            adoption_status: feedback?.question_use || "未反馈",
            report_anchor: reportAnchorForNodeType("interview_question"),
            source: "generated_question_bank",
          },
        });

        edges.push({
          from: evidenceId,
          to: requirementId,
          type: row.isMissing ? "contradicts" : "supports",
          weight: row.evidenceLevel === 1 ? 0.85 : row.evidenceLevel === 2 ? 0.55 : 0.25,
          confidence: row.evidenceLevel === 1 ? 0.85 : row.evidenceLevel === 2 ? 0.55 : 0.25,
          source: row.isMissing ? "missing_resume_evidence" : "resume_requirement_match",
          note: row.evidenceReason,
        });
        edges.push({
          from: questionId,
          to: evidenceId,
          type: "questions",
          weight: 0.7,
          confidence: 0.7,
          source: "generated_interview_question",
          note: "面试问题用于验证该证据的真实角色、指标口径和结果归因",
        });

        if (row.isMissing || row.evidenceLevel >= 3) {
          nodes.push({
            id: riskId,
            type: "risk",
            label: `${row.capability} 风险`,
            summary: row.evidenceReason,
            metadata: {
              severity: "high",
              report_anchor: reportAnchorForNodeType("risk"),
              source: "evidence_gap_detection",
            },
          });
          edges.push({
            from: evidenceId,
            to: riskId,
            type: "supports",
            weight: 0.8,
            confidence: 0.8,
            source: "risk_rule",
            note: "低可信或缺失证据支撑风险提示",
          });
          edges.push({
            from: riskId,
            to: "offer_signal_1",
            type: "impacts_offer",
            weight: 0.65,
            confidence: 0.65,
            source: "offer_simulation_rule",
            note: "该风险会影响是否进入下一轮、定级或谈薪",
          });
        }
      });

      skillRegistry.forEach((skill) => {
        nodes.push({
          id: `skill_${skill.id}`,
          type: "skill",
          label: skill.name,
          summary: `${skill.focus}；${skill.audit.contribution}`,
          metadata: {
            version: skill.version,
            adoption_status: skill.adoption_status,
            report_anchor: reportAnchorForNodeType("skill"),
            source: "skill_registry",
          },
        });
        const targetQuestion = `q_${(skill.priority % rows.length) + 1}`;
        edges.push({
          from: `skill_${skill.id}`,
          to: targetQuestion,
          type: "generates",
          weight: skill.priority >= 4 ? 0.8 : 0.6,
          confidence: skill.priority >= 4 ? 0.8 : 0.6,
          source: "skill_registry",
          note: skill.audit.contribution,
        });
      });

      virtualPanel.forEach((agent) => {
        nodes.push({
          id: agent.id,
          type: "agent_persona",
          label: agent.name,
          summary: `${agent.persona} / ${agent.focus}`,
          metadata: {
            stance: agent.stance,
            activity_level: agent.activity_level,
            influence_weight: agent.influence_weight,
            report_anchor: reportAnchorForNodeType("agent_persona"),
            source: "mirofish_persona_generation",
          },
        });
        (agent.memory_scope?.graph_memory_nodes || []).forEach((nodeId) => {
          edges.push({
            from: agent.id,
            to: nodeId,
            type: "reads_memory",
            weight: Math.min(0.9, 0.45 + agent.influence_weight / 10),
            confidence: Math.min(0.9, 0.45 + agent.influence_weight / 10),
            source: "virtual_panel_memory",
            note: "MiroFish-style persona reads seed-derived graph memory",
          });
        });
      });

      panelDiscussionRounds.forEach((round) => {
        (round.turns || []).forEach((turn) => {
          (turn.question_ids || []).forEach((questionId) => {
            edges.push({
              from: turn.agent_id,
              to: questionId,
              type: "discusses",
              weight: turn.impact === "raise_follow_up_priority" ? 0.82 : 0.55,
              confidence: turn.impact === "raise_follow_up_priority" ? 0.78 : 0.58,
              source: round.stage || "panel_simulation",
              note: turn.claim,
            });
          });
          (turn.evidence_ids || []).forEach((evidenceId) => {
            edges.push({
              from: turn.agent_id,
              to: evidenceId,
              type: turn.impact === "raise_follow_up_priority" ? "challenges" : "validates",
              weight: turn.impact === "raise_follow_up_priority" ? 0.78 : 0.62,
              confidence: turn.impact === "raise_follow_up_priority" ? 0.72 : 0.64,
              source: round.stage || "panel_simulation",
              note: turn.claim,
            });
          });
        });
      });

      nodes.push({
        id: "offer_signal_1",
        type: "offer_signal",
        label: "Offer 推进信号",
        summary: snapshot.offer_constraints || "未提供 Offer / 谈薪约束",
        metadata: {
          target_level: snapshot.target_level,
          stage: snapshot.candidate_stage,
          report_anchor: reportAnchorForNodeType("offer_signal"),
          source: "offer_constraints",
        },
      });

      if (feedback) {
        nodes.push({
          id: "feedback_1",
          type: "feedback",
          label: "人工反馈",
          summary: feedback.notes || "未填写人工补充意见",
          metadata: {
            ...feedback,
            report_anchor: reportAnchorForNodeType("feedback"),
          },
        });
        rows.forEach((_, index) => {
          edges.push({
            from: "feedback_1",
            to: `q_${index + 1}`,
            type: "updates",
            weight: feedback.question_use === "采用" || feedback.question_use === "改写采用"
              ? 0.8
              : 0.35,
            confidence: feedback.question_use === "采用" || feedback.question_use === "改写采用"
              ? 0.8
              : 0.35,
            source: "human_feedback",
            note: `追问采用状态：${feedback.question_use}`,
          });
          edges.push({
            from: "feedback_1",
            to: `ev_req_${index + 1}`,
            type: feedback.risk_validation === "已推翻" ? "contradicts" : "validates",
            weight: feedback.risk_validation === "已证实"
              ? 0.8
              : feedback.risk_validation === "已推翻"
                ? 0.7
                : 0.4,
            confidence: feedback.risk_validation === "已证实"
              ? 0.8
              : feedback.risk_validation === "已推翻"
                ? 0.7
                : 0.4,
            source: "human_feedback",
            note: `风险验证状态：${feedback.risk_validation}`,
          });
        });
      }

      return { nodes, edges };
    }

    function detectEvidenceGraphGaps(graph) {
      const edges = graph.edges || [];
      return (graph.nodes || [])
        .filter((node) => {
          const meta = node.metadata || {};
          const linkedEdges = edges.filter(
            (edge) => edge.from === node.id || edge.to === node.id,
          );
          const hasSupport = edges.some(
            (edge) => edge.to === node.id && ["supports", "validates"].includes(edge.type),
          );
          const hasQuestion = linkedEdges.some((edge) => edge.type === "questions");

          if (node.type === "job_requirement") return !hasSupport;
          if (node.type === "resume_evidence") {
            return meta.evidence_level >= 3
              || /缺证|低|不足|missing|weak/i.test(
                String(meta.evidence_level_label || node.label),
              );
          }
          if (node.type === "risk") return meta.severity === "high" && !hasQuestion;
          return false;
        })
        .slice(0, 6);
    }

    return {
      buildEvidenceGraph,
      reportAnchorForNodeType,
      detectEvidenceGraphGaps,
    };
  }

  global.OfferAgentEvidenceGraph = {
    createEvidenceGraphModel,
  };
})(typeof window !== "undefined" ? window : globalThis);
