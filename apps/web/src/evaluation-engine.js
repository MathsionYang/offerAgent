// Structured EvaluationRun and OfferSimulationRun builders.
(function initOfferAgentEvaluationEngine(global) {
  "use strict";

  function createEvaluationEngine(dependencies = {}) {
    const {
      schemaVersion = "evaluation_run.v1",
      defaultRoleId = "product_manager",
      getLanguage = () => "zh",
      clip = (value, length = 80) => String(value ?? "").slice(0, length),
      interviewerLens = (index) => `lens_${index}`,
      buildEvidenceSummary = (rows) => `一级 ${rows.filter((row) => row.evidenceLevel === 1).length} 项，二级 ${rows.filter((row) => row.evidenceLevel === 2).length} 项，三级/缺证 ${rows.filter((row) => row.evidenceLevel === 3).length} 项`,
    } = dependencies;

    function buildEvaluationSummary(gate, rows, offerLeverage, feedback) {
      const strongCount = rows.filter((row) => row.evidenceLevel === 1).length;
      const mediumCount = rows.filter((row) => row.evidenceLevel === 2).length;
      const weakCount = rows.filter((row) => row.evidenceLevel === 3 || row.isMissing).length;
      const weakestRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 2);
      const nextFocus = weakestRows.slice(0, 3).map((row) => row.capability);

      return {
        gate_result: gate.result,
        enter_sandbox: gate.enterSandbox,
        matched_count: gate.matchedCount,
        total_requirements: rows.length,
        evidence_summary: buildEvidenceSummary(rows),
        strong_evidence_count: strongCount,
        medium_evidence_count: mediumCount,
        weak_or_missing_evidence_count: weakCount,
        next_validation_focus: nextFocus,
        offer_leverage_rating: offerLeverage.rating,
        offer_leverage_summary: offerLeverage.summary,
        feedback_status: feedback
          ? {
              agreement: feedback.agreement,
              question_use: feedback.question_use,
              disagreement_reason: feedback.disagreement_reason,
              evidence_sufficiency: feedback.evidence_sufficiency,
              risk_validation: feedback.risk_validation,
            }
          : null,
      };
    }

    function buildRequirementMatches(rows) {
      return rows.map((row, index) => ({
        id: `req_${index + 1}`,
        capability: row.capability,
        jd_evidence: row.jdEvidence,
        resume_evidence: row.resumeEvidence,
        evidence_level: row.evidenceLevel,
        evidence_level_label: row.evidenceLevelLabel,
        evidence_reason: row.evidenceReason,
        match_status: row.matchStatus,
        is_missing: row.isMissing,
        verification_question: row.verificationQuestion,
      }));
    }

    // Keep question ids stable so feedback, graph nodes, and reports can cross-reference them.
    function buildStructuredInterviewQuestions(snapshot, rows, feedback) {
      return rows.map((row, index) => ({
        id: `q_${index + 1}`,
        lens: interviewerLens(index),
        capability: row.capability,
        question: row.verificationQuestion,
        evidence_anchor: row.resumeEvidence,
        jd_anchor: row.jdEvidence,
        evaluation_goal: row.isMissing
          ? "补齐岗位核心能力项目证据"
          : row.evidenceLevel === 1
            ? "复核指标口径、周期和个人贡献"
            : "验证真实角色、决策链和结果归因",
        expected_signal: row.evidenceLevel === 1 ? "可复核高可信证据" : "待追问中低可信证据",
        adoption_status: feedback?.question_use || "未反馈",
        asked_status: feedback?.question_use && feedback.question_use !== "未反馈" ? "reviewed" : "pending",
      }));
    }

    function buildStructuredOfferSandbox(snapshot, gate, offerLeverage, rows) {
      const missingRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 3);
      const mediumRows = rows.filter((row) => row.evidenceLevel === 2);
      return {
        stage: snapshot.candidate_stage || "",
        target_level: snapshot.target_level || "",
        readiness: gate.result,
        enter_sandbox: gate.enterSandbox,
        negotiation_leverage: offerLeverage.rating,
        leverage_detail: offerLeverage.detail,
        risks: [
          ...missingRows.slice(0, 3).map((row) => `${row.capability}：${row.evidenceReason}`),
          ...mediumRows.slice(0, 2).map((row) => `${row.capability}：需追问验证真实贡献`),
        ],
        next_actions: [
          gate.nextStep,
          "面试后回填实际问题、候选人回答、证据等级变化和 Offer 约束变化",
          "仅将一级证据或已验证证据转化为职级、薪资和推进建议",
        ],
      };
    }

    // Evidence ids align with EvidenceGraph and Offer risk references.
    function buildStructuredEvidence(snapshot, rows) {
      const baseEvidence = [
        {
          id: "ev_resume_snapshot",
          source_type: "resume",
          claim: snapshot.resume ? clip(snapshot.resume) : "未提供简历快照",
          confidence: snapshot.resume ? 0.6 : 0,
          source_excerpt: snapshot.resume ? clip(snapshot.resume) : "",
        },
        {
          id: "ev_jd_snapshot",
          source_type: "job_description",
          claim: snapshot.job_description ? clip(snapshot.job_description) : "未提供 JD 快照",
          confidence: snapshot.job_description ? 0.8 : 0,
          source_excerpt: snapshot.job_description ? clip(snapshot.job_description) : "",
        },
        {
          id: "ev_offer_constraints",
          source_type: "offer_constraints",
          claim: snapshot.offer_constraints ? clip(snapshot.offer_constraints) : "未提供 Offer / 谈薪约束",
          confidence: snapshot.offer_constraints ? 0.5 : 0,
          source_excerpt: snapshot.offer_constraints ? clip(snapshot.offer_constraints) : "",
        },
      ];

      const requirementEvidence = rows.map((row, index) => ({
        id: `ev_req_${index + 1}`,
        source_type: row.isMissing ? "missing_resume_evidence" : "resume_requirement_match",
        capability: row.capability,
        claim: row.isMissing ? `${row.capability} 缺少简历证据` : row.resumeEvidence,
        confidence: row.evidenceLevel === 1 ? 0.85 : row.evidenceLevel === 2 ? 0.55 : 0.25,
        evidence_level: row.evidenceLevel,
        evidence_level_label: row.evidenceLevelLabel,
        source_excerpt: row.resumeEvidence,
        jd_excerpt: row.jdEvidence,
        verification_question: row.verificationQuestion,
      }));

      return [...baseEvidence, ...requirementEvidence];
    }

    function buildStructuredEvaluation(snapshot, rows, gate, offerLeverage, feedback) {
      return {
        schema_version: schemaVersion,
        target_role: snapshot.target_role || defaultRoleId,
        language: snapshot.language || getLanguage(),
        summary: buildEvaluationSummary(gate, rows, offerLeverage, feedback),
        requirement_matches: buildRequirementMatches(rows),
        interview_questions: buildStructuredInterviewQuestions(snapshot, rows, feedback),
        offer_sandbox: buildStructuredOfferSandbox(snapshot, gate, offerLeverage, rows),
        evidence: buildStructuredEvidence(snapshot, rows),
        decision_basis: {
          gate_result: gate.result,
          gate_summary: gate.summary,
          next_step: gate.nextStep,
          offer_leverage_rating: offerLeverage.rating,
          offer_leverage_detail: offerLeverage.detail,
        },
        feedback_status: feedback
          ? {
              agreement: feedback.agreement,
              question_use: feedback.question_use,
              evidence_sufficiency: feedback.evidence_sufficiency,
              risk_validation: feedback.risk_validation,
            }
          : null,
      };
    }

    function buildOfferSimulationRun(run, snapshot, gate, offerLeverage, rows, feedback) {
      const missingRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 3);
      const mediumRows = rows.filter((row) => row.evidenceLevel === 2);
      const riskRows = [...missingRows, ...mediumRows].slice(0, 5);
      const supportingEvidenceIds = rows
        .map((row, index) => ({ row, id: `ev_req_${index + 1}` }))
        .filter(({ row }) => !row.isMissing && row.evidenceLevel <= 2)
        .map(({ id }) => id);

      return {
        id: `offer_${run.id}`,
        evaluation_run_id: run.id,
        created_at: run.created_at,
        version: "offer_simulation_run.v2",
        lifecycle_state: feedback ? "feedback_distilled" : gate.enterSandbox ? "offer_probability" : "evidence_validation",
        lifecycle_steps: buildOfferLifecycleSteps(gate, feedback),
        history: [
          {
            at: run.created_at,
            event: "run_created",
            summary: "生成评估报告、证据图谱和 Offer 推演初始状态",
          },
          ...(feedback
            ? [
                {
                  at: feedback.updated_at,
                  event: "feedback_applied",
                  summary: `人工反馈已回填：${feedback.agreement} / ${feedback.question_use} / ${feedback.risk_validation}`,
                },
              ]
            : []),
        ],
        stage: snapshot.candidate_stage || "",
        target_level: snapshot.target_level || "",
        readiness: gate.result,
        enter_sandbox: gate.enterSandbox,
        offer_leverage: {
          rating: offerLeverage.rating,
          summary: offerLeverage.summary,
          detail: offerLeverage.detail,
          supporting_evidence_ids: supportingEvidenceIds,
        },
        risks: riskRows.map((row, index) => ({
          id: `offer_risk_${index + 1}`,
          risk: `${row.capability}：${row.evidenceReason}`,
          severity: row.isMissing || row.evidenceLevel >= 3 ? "high" : "medium",
          evidence_ids: [`ev_req_${rows.indexOf(row) + 1}`],
          question_ids: [`q_${rows.indexOf(row) + 1}`],
          status: feedback?.risk_validation || "待验证",
        })),
        next_actions: [
          gate.nextStep,
          "面试后回填实际追问、候选人回答、证据等级变化和 Offer 约束变化",
          "仅将一级证据或面试后已证实证据转化为职级、薪资和推进建议",
        ],
        feedback_updates: feedback
          ? [
              { field: "agreement", value: feedback.agreement, action: "更新闸口判断置信度" },
              { field: "question_use", value: feedback.question_use, action: "更新追问采用状态" },
              { field: "risk_validation", value: feedback.risk_validation, action: "更新 Offer 风险状态" },
            ]
          : [],
        scenario_comparison: buildOfferScenarios(gate, offerLeverage, riskRows, feedback),
        state_backfill: {
          next_question_focus: riskRows.slice(0, 3).map((row) => row.capability),
          risk_inputs: riskRows.map((row, index) => `offer_risk_${index + 1}`),
          negotiation_inputs: [
            offerLeverage.rating,
            snapshot.offer_constraints || "Offer / 谈薪约束未充分提供",
            feedback?.risk_validation || "风险仍待验证",
          ],
        },
        final_decision_hint: gate.enterSandbox
          ? "可作为下一轮面试准备和谈薪前验证输入，不代表自动录用结论"
          : "建议先补项目闭环、个人贡献和岗位匹配证据，再进入 Offer 沙盘",
      };
    }

    // Lifecycle states are intentionally compact for report and graph reuse.
    function buildOfferLifecycleSteps(gate, feedback) {
      return [
        { id: "resume_evaluation", label: "简历评估", status: "done" },
        { id: "question_generation", label: "面试问题", status: "done" },
        { id: "feedback_distillation", label: "反馈修正", status: feedback ? "done" : "pending" },
        { id: "offer_probability", label: "Offer 概率", status: gate.enterSandbox ? "active" : "blocked" },
        { id: "negotiation_strategy", label: "谈判策略", status: feedback && gate.enterSandbox ? "active" : "pending" },
      ];
    }

    function buildOfferScenarios(gate, offerLeverage, riskRows, feedback) {
      const highRiskCount = riskRows.filter((row) => row.isMissing || row.evidenceLevel >= 3).length;
      const baseProbability = gate.enterSandbox ? 58 : 32;
      const leverageBump = offerLeverage.rating === "high" ? 10 : offerLeverage.rating === "medium" ? 4 : -4;
      const feedbackBump = feedback?.risk_validation === "已证实" ? -10 : feedback?.risk_validation === "已推翻" ? 8 : 0;
      const riskPenalty = Math.min(22, highRiskCount * 6);
      const base = Math.max(5, Math.min(90, baseProbability + leverageBump + feedbackBump - riskPenalty));
      return [
        {
          name: "Base",
          probability: base,
          assumption: "按当前证据等级、风险验证状态和 Offer 约束推进",
          next_action: gate.nextStep,
        },
        {
          name: "Optimistic",
          probability: Math.min(95, base + 18),
          assumption: "关键追问验证通过，低可信证据升级，候选人接受条件清晰",
          next_action: "优先复核一级证据和谈薪约束，准备推进话术",
        },
        {
          name: "Conservative",
          probability: Math.max(3, base - 20),
          assumption: "风险被证实或候选人约束后置暴露，面试问题未能补证",
          next_action: "先补证据缺口，再决定是否进入 Offer 沙盘",
        },
      ];
    }

    return {
      buildEvaluationSummary,
      buildRequirementMatches,
      buildStructuredInterviewQuestions,
      buildStructuredOfferSandbox,
      buildStructuredEvidence,
      buildStructuredEvaluation,
      buildOfferSimulationRun,
      buildOfferLifecycleSteps,
      buildOfferScenarios,
    };
  }

  global.OfferAgentEvaluationEngine = {
    createEvaluationEngine,
  };
})(typeof window !== "undefined" ? window : globalThis);
