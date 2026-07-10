// FeedbackDistillation rules for turning human review into traceable state updates.
(function initOfferAgentFeedbackEngine(global) {
  "use strict";

  const FEEDBACK_HISTORY_PREFIX = "offeragent_feedback_history_v1:";
  const FEEDBACK_HISTORY_LIMIT = 12;

  function createFeedbackEngine(dependencies = {}) {
    const storage = dependencies.storage || global.localStorage;
    const now = dependencies.now || (() => new Date().toISOString());

    function buildFeedbackDistillation(feedback, rows, snapshot = {}) {
      const rules = [
        {
          id: "rule_promote_adopted_question",
          when: "question_use = 采用 或 改写采用",
          then: "将相关问题升级为高价值候选追问",
          target: "interview_questions",
          priority: 80,
          conflict_policy: "人工采用优先，但若 evidence_sufficiency = 不充分，则仅升级问题，不升级结论",
        },
        {
          id: "rule_demote_rejected_question",
          when: "question_use = 未采用",
          then: "将相关问题标记为低价值并进入重写池",
          target: "interview_questions",
          priority: 75,
          conflict_policy: "未采用优先于自动生成题库权重",
        },
        {
          id: "rule_raise_confirmed_risk",
          when: "risk_validation = 已证实",
          then: "提高相关风险规则权重并保留为回归样本",
          target: "risk",
          priority: 90,
          conflict_policy: "风险已证实时覆盖乐观 Offer 场景",
        },
        {
          id: "rule_lower_disproved_risk",
          when: "risk_validation = 已推翻",
          then: "降低相关风险规则权重并补充反例",
          target: "risk",
          priority: 70,
          conflict_policy: "风险被推翻时保留原始证据，但降低风险权重",
        },
        {
          id: "rule_downgrade_insufficient_evidence",
          when: "evidence_sufficiency = 不充分",
          then: "将相关结论降级为待验证",
          target: "evidence",
          priority: 85,
          conflict_policy: "证据不足优先于系统匹配结论",
        },
      ];

      const actions = [];
      const skill_update_suggestions = buildSkillUpdateSuggestions(feedback, rows, snapshot);
      if (!feedback) return { rules, actions, impact_diff: [], skill_update_suggestions };

      // Question adoption creates explicit promotion or rewrite work items.
      if (feedback.question_use === "采用" || feedback.question_use === "改写采用") {
        actions.push({
          id: "action_promote_questions",
          type: "promote_question",
          target_id: "interview_questions",
          reason: `问题采用状态为：${feedback.question_use}`,
          status: "pending_review",
        });
      }

      if (feedback.question_use === "未采用") {
        actions.push({
          id: "action_demote_questions",
          type: "demote_question",
          target_id: "interview_questions",
          reason: "面试官明确未采用该批问题",
          status: "pending_rewrite",
        });
      }

      // Risk validation changes Offer simulation weights but keeps evidence auditable.
      if (feedback.risk_validation === "已证实") {
        actions.push({
          id: "action_raise_risk_weight",
          type: "raise_risk_weight",
          target_id: "offer_simulation_run.risks",
          reason: "面试后证实系统风险提示",
          status: "pending_review",
        });
      }

      if (feedback.risk_validation === "已推翻") {
        actions.push({
          id: "action_lower_risk_weight",
          type: "lower_risk_weight",
          target_id: "offer_simulation_run.risks",
          reason: "面试后推翻系统风险提示",
          status: "pending_review",
        });
      }

      // Insufficient evidence downgrades concrete requirement claims, not the entire report.
      if (feedback.evidence_sufficiency === "不充分") {
        rows
          .filter((row) => row.isMissing || row.evidenceLevel >= 2)
          .slice(0, 3)
          .forEach((row, index) => {
            actions.push({
              id: `action_downgrade_claim_${index + 1}`,
              type: "downgrade_claim",
              target_id: `req_${rows.indexOf(row) + 1}`,
              reason: `${row.capability} 证据不充分：${row.evidenceReason}`,
              status: "pending_fix",
            });
          });
      }

      if (feedback.disagreement_reason && feedback.disagreement_reason !== "未反馈") {
        actions.push({
          id: "action_add_regression_case",
          type: "add_regression_case",
          target_id: "evaluation_run",
          reason: `人工判断不一致原因：${feedback.disagreement_reason}`,
          status: "pending_regression",
        });
      }

      return {
        rules,
        actions,
        impact_diff: buildFeedbackImpactDiff(feedback, rows),
        skill_update_suggestions,
      };
    }

    function buildFeedbackImpactDiff(feedback, rows) {
      const weakRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 2).slice(0, 4);
      return [
        {
          target: "interview_questions",
          before: "系统生成问题默认为待验证",
          after: `追问采用状态回填为：${feedback.question_use}`,
          affected_ids: weakRows.map((row) => `q_${rows.indexOf(row) + 1}`),
        },
        {
          target: "offer_simulation_run.risks",
          before: "Offer 风险默认为待验证",
          after: `风险验证状态回填为：${feedback.risk_validation}`,
          affected_ids: weakRows.map((row) => `offer_risk_${rows.indexOf(row) + 1}`),
        },
        {
          target: "evidence_graph",
          before: "证据边由系统置信度计算",
          after: `人工证据充分性回填为：${feedback.evidence_sufficiency}`,
          affected_ids: weakRows.map((row) => `ev_req_${rows.indexOf(row) + 1}`),
        },
      ];
    }

    function buildSkillUpdateSuggestions(feedback, rows, snapshot = {}) {
      const selected = snapshot.selected_skills?.length ? snapshot.selected_skills : ["hr", "business", "project", "decision"];
      const weakRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 2);
      if (!feedback) {
        return selected.map((id) => ({
          skill_id: id,
          version: `skill.${id}.v1`,
          suggestion: "等待人工反馈后再沉淀题库权重",
          reason: "当前仅有系统生成结果，尚无面试后校准信号",
          status: "waiting_feedback",
        }));
      }
      return selected.map((id) => ({
        skill_id: id,
        version: `skill.${id}.v1`,
        suggestion: feedback.question_use === "未采用" ? "重写该视角的问题模板" : "保留高价值追问并补充反例",
        reason: `${feedback.disagreement_reason}；受影响能力：${weakRows.slice(0, 2).map((row) => row.capability).join("、") || "暂无明显缺口"}`,
        status: "pending_review",
      }));
    }

    function loadFeedbackHistory(inputFingerprint) {
      if (!inputFingerprint || !storage) return [];
      try {
        const raw = storage.getItem(`${FEEDBACK_HISTORY_PREFIX}${inputFingerprint}`);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed.filter(isFeedbackHistoryEntry) : [];
      } catch {
        return [];
      }
    }

    function persistFeedbackHistory(run, feedback) {
      const inputFingerprint = run?.input_fingerprint || feedback?.input_fingerprint || "";
      if (!inputFingerprint || !feedback || !storage) return [];
      const entry = normalizeFeedbackHistoryEntry(run, feedback);
      const history = [
        entry,
        ...loadFeedbackHistory(inputFingerprint).filter((item) => item.id !== entry.id),
      ].slice(0, FEEDBACK_HISTORY_LIMIT);
      try {
        storage.setItem(`${FEEDBACK_HISTORY_PREFIX}${inputFingerprint}`, JSON.stringify(history));
      } catch {
        return history;
      }
      return history;
    }

    function attachFeedbackHistory(run) {
      if (!run?.input_fingerprint) return run;
      const feedback_session_history = loadFeedbackHistory(run.input_fingerprint);
      if (!feedback_session_history.length) return run;
      return {
        ...run,
        human_feedback: run.human_feedback || feedback_session_history[0],
        feedback_session_history,
      };
    }

    function normalizeFeedbackHistoryEntry(run, feedback) {
      const updatedAt = feedback.updated_at || now();
      return {
        id: `${run?.id || "run"}:${updatedAt}`,
        evaluation_run_id: run?.id || "",
        input_fingerprint: run?.input_fingerprint || feedback.input_fingerprint || "",
        agreement: feedback.agreement || "未反馈",
        question_use: feedback.question_use || "未反馈",
        disagreement_reason: feedback.disagreement_reason || "未反馈",
        evidence_sufficiency: feedback.evidence_sufficiency || "未反馈",
        risk_validation: feedback.risk_validation || "未反馈",
        notes: feedback.notes || "",
        updated_at: updatedAt,
      };
    }

    function isFeedbackHistoryEntry(value) {
      return Boolean(
        value
        && typeof value === "object"
        && !Array.isArray(value)
        && typeof value.updated_at === "string"
        && typeof value.input_fingerprint === "string",
      );
    }

    return {
      buildFeedbackDistillation,
      buildFeedbackImpactDiff,
      buildSkillUpdateSuggestions,
      loadFeedbackHistory,
      persistFeedbackHistory,
      attachFeedbackHistory,
      normalizeFeedbackHistoryEntry,
    };
  }

  global.OfferAgentFeedbackEngine = {
    createFeedbackEngine,
  };
})(typeof window !== "undefined" ? window : globalThis);
