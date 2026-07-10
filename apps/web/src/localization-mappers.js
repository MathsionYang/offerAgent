// Report and structured-result localization helpers.
(function initOfferAgentLocalizationMappers(global) {
  "use strict";

  function createLocalizationMappers(dependencies = {}) {
    const {
      getLanguage = () => "zh",
      i18n = { en: { stageOptions: {} } },
    } = dependencies;

    function translateInterviewerRecommendation(value) {
      if (value === "推荐") return "Recommend";
      if (value === "有条件推荐") return "Conditional recommend";
      if (value === "不推荐") return "Do not recommend";
      return value || "Pending";
    }

    function translateInterviewerAction(value) {
      return String(value || "")
        .replace("进入下一轮，但必须验证真实贡献、指标口径、失败复盘和团队适配", "Proceed to the next round, but verify real contribution, metric definition, incident review, and team fit.")
        .replace("只围绕可迁移能力推进，重点验证行业理解速度、场景抽象和项目复杂度", "Proceed only around transferable capability; validate industry learning speed, scenario abstraction, and project complexity.")
        .replace("暂不进入下一轮，先要求补充能支撑 JD 核心职责的完整项目证据", "Do not proceed yet; request complete project evidence that supports the JD's core responsibilities.");
    }

    function translateDirectConclusionPoints(value) {
      return String(value || "")
        .replaceAll("：", ": ")
        .replaceAll("；", "; ")
        .replaceAll("简历未提供可支撑证据", "No supporting resume evidence")
        .replaceAll("一级证据，需验证真实贡献", "Level 1 evidence; verify real contribution")
        .replaceAll("二级证据，需验证真实贡献", "Level 2 evidence; verify real contribution")
        .replaceAll("三级证据，需验证真实贡献", "Level 3 evidence; verify real contribution");
    }

    function translateVerificationQuestionText(value) {
      return String(value || "")
        .replaceAll("请补充一个能证明", "Provide one project proving ")
        .replaceAll("的项目，说明背景、目标、动作、结果和复盘。", ", covering background, goal, action, result, and retrospective.")
        .replaceAll("请说明", "Explain ")
        .replaceAll("中的指标分母、统计周期、上线前后对比和你的直接贡献。", ": metric denominator, measurement period, before/after comparison, and your direct contribution.")
        .replaceAll("请拆解这段证据中的真实角色、关键决策、协作对象和结果归因。", "Break down your real role, key decisions, collaborators, and result attribution for this evidence.");
    }

    function translateStage(value) {
      return i18n.en?.stageOptions?.[value] || value || "Not provided";
    }

    function translateCapability(value) {
      const map = {
        "行业场景理解": "Industry scenario understanding",
        "产品规划与生命周期管理": "Product planning and lifecycle management",
        "客户需求分析与方案设计": "Customer requirement analysis and solution design",
        "技术架构与研发协同": "Technical architecture and engineering collaboration",
        "技术选型与创新探索": "Technology selection and innovation exploration",
        "成本、进度、质量控制": "Cost, schedule, and quality control",
        "验证真实贡献": "Verify real contribution",
        "证据待补齐": "Evidence gap",
      };
      return map[value] || value || "Pending validation";
    }

    function translateEvidenceLevel(level) {
      if (level === 1) return "Level 1 evidence (high credibility)";
      if (level === 2) return "Level 2 evidence (medium credibility)";
      return "Level 3 evidence (low credibility / pending validation)";
    }

    function translateMatchStatus(row) {
      const isMissing = row.isMissing ?? row.is_missing;
      const evidenceLevel = row.evidenceLevel ?? row.evidence_level;
      if (isMissing) return "Not matched / evidence missing";
      if (evidenceLevel === 1) return "Matched, verify metric definition";
      if (evidenceLevel === 2) return "Partially matched / follow-up required";
      return "Pending validation";
    }

    function localizeOfferLifecycleState(value) {
      return localizeEnumValue(value, {
        zh: {
          feedback_distilled: "反馈已沉淀",
          offer_probability: "Offer 概率",
          evidence_validation: "证据验证",
        },
        en: {
          feedback_distilled: "Feedback distilled",
          offer_probability: "Offer probability",
          evidence_validation: "Evidence validation",
        },
      });
    }

    function localizeOfferScenarioName(value) {
      return localizeEnumValue(value, {
        zh: {
          Base: "基准",
          Optimistic: "乐观",
          Conservative: "保守",
        },
        en: {
          Base: "Base",
          Optimistic: "Optimistic",
          Conservative: "Conservative",
        },
      });
    }

    function localizeFeedbackActionType(value) {
      return localizeEnumValue(value, {
        zh: {
          promote_question: "升级问题",
          demote_question: "降权问题",
          raise_risk_weight: "提高风险权重",
          lower_risk_weight: "降低风险权重",
          downgrade_claim: "降级结论",
          add_regression_case: "加入回归样本",
        },
        en: {
          promote_question: "Promote question",
          demote_question: "Demote question",
          raise_risk_weight: "Raise risk weight",
          lower_risk_weight: "Lower risk weight",
          downgrade_claim: "Downgrade claim",
          add_regression_case: "Add regression case",
        },
      });
    }

    function localizeFeedbackTarget(value) {
      return localizeEnumValue(value, {
        zh: {
          interview_questions: "面试问题",
          "offer_simulation_run.risks": "Offer 风险",
          evaluation_run: "评估运行",
          evidence_graph: "证据图谱",
        },
        en: {
          interview_questions: "Interview questions",
          "offer_simulation_run.risks": "Offer risks",
          evaluation_run: "Evaluation run",
          evidence_graph: "Evidence graph",
        },
      });
    }

    function localizeSkillId(value) {
      return localizeEnumValue(value, {
        zh: {
          hr: "HR 面试官",
          business: "业务负责人",
          project: "项目推进面试官",
          negotiation: "谈薪顾问",
          decision: "决策层压力官",
        },
        en: {
          hr: "HR Interviewer",
          business: "Business Owner",
          project: "Project Interviewer",
          negotiation: "Negotiation Advisor",
          decision: "Executive Pressure Officer",
        },
      });
    }

    function localizeFeedbackStatus(value) {
      return localizeEnumValue(value, {
        zh: {
          waiting_feedback: "等待人工反馈",
          pending_review: "待复核",
          pending_fix: "待修正",
          pending_rewrite: "待重写",
          pending_regression: "待加入回归",
        },
        en: {
          waiting_feedback: "Waiting for feedback",
          pending_review: "Pending review",
          pending_fix: "Pending fix",
          pending_rewrite: "Pending rewrite",
          pending_regression: "Pending regression",
        },
      });
    }

    function localizeEnumValue(value, dictionaries) {
      const text = value || "";
      const dictionary = getLanguage() === "en" ? dictionaries.en : dictionaries.zh;
      return dictionary[text] || text;
    }

    function translateGateResult(value) {
      if (/匹配进入/.test(value)) return "Matched: proceed";
      if (/条件性进入/.test(value)) return "Conditional proceed (transferable fit)";
      if (/不匹配/.test(value)) return "Not matched: do not proceed";
      return value || "Pending validation";
    }

    function translateOfferRating(value) {
      if (/强/.test(value)) return "Strong leverage";
      if (/中/.test(value)) return "Medium leverage";
      if (/弱/.test(value)) return "Weak leverage";
      if (/暂无/.test(value)) return "No clear leverage";
      return value || "Pending validation";
    }

    function translateVerificationQuestion(row) {
      if (row.isMissing) return `Add one project proving ${translateCapability(row.capability)}, covering background, goal, action, result, and retrospective.`;
      if (row.evidenceLevel === 1) return `Explain denominator, period, before/after comparison, and your direct contribution for ${translateCapability(row.capability)}.`;
      return "Break down your real role, key decisions, collaborators, and result attribution for this evidence.";
    }

    function summarizeEvidenceCounts(rows) {
      const counts = rows.reduce((acc, row) => {
        acc[row.evidenceLevel] += 1;
        return acc;
      }, { 1: 0, 2: 0, 3: 0 });
      return `Level 1: ${counts[1]}, Level 2: ${counts[2]}, Level 3 / missing: ${counts[3]}`;
    }

    return {
      translateInterviewerRecommendation,
      translateInterviewerAction,
      translateDirectConclusionPoints,
      translateVerificationQuestionText,
      translateStage,
      translateCapability,
      translateEvidenceLevel,
      translateMatchStatus,
      localizeOfferLifecycleState,
      localizeOfferScenarioName,
      localizeFeedbackActionType,
      localizeFeedbackTarget,
      localizeSkillId,
      localizeFeedbackStatus,
      localizeEnumValue,
      translateGateResult,
      translateOfferRating,
      translateVerificationQuestion,
      summarizeEvidenceCounts,
    };
  }

  global.OfferAgentLocalizationMappers = {
    createLocalizationMappers,
  };
})(typeof window !== "undefined" ? window : globalThis);
