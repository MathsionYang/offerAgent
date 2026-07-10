// Report and structured-result localization helpers.
(function initOfferAgentLocalizationMappers(global) {
  "use strict";

  function createLocalizationMappers(dependencies = {}) {
    const {
      getLanguage = () => "zh",
      i18n = { en: { stageOptions: {} } },
    } = dependencies;

    const capabilityTranslations = {
      "行业场景理解": "Industry scenario understanding",
      "产品规划与生命周期管理": "Product planning and lifecycle management",
      "客户需求分析与方案设计": "Customer requirement analysis and solution design",
      "技术架构与研发协同": "Technical architecture and engineering collaboration",
      "技术选型与创新探索": "Technology selection and innovation exploration",
      "成本、进度、质量控制": "Cost, schedule, and quality control",
      "编程语言与工程实现": "Programming languages and engineering implementation",
      "系统设计与架构理解": "System design and architecture understanding",
      "代码质量与测试习惯": "Code quality and testing practices",
      "问题排查与线上稳定性": "Troubleshooting and production stability",
      "性能、安全与可维护性": "Performance, security, and maintainability",
      "交付协作与需求理解": "Delivery collaboration and requirement understanding",
      "问题分诊与优先级判断": "Issue triage and prioritization",
      "技术排查与复现能力": "Technical troubleshooting and reproduction",
      "客户沟通与预期管理": "Customer communication and expectation management",
      "SLA 响应与服务质量": "SLA response and service quality",
      "升级协作与跨团队推进": "Escalation collaboration and cross-team execution",
      "知识库与流程沉淀": "Knowledge base and process institutionalization",
      "线索发现与客户画像": "Lead discovery and customer profiling",
      "客户开发与需求挖掘": "Customer development and needs discovery",
      "商机推进与方案呈现": "Opportunity progression and solution presentation",
      "谈判与异议处理": "Negotiation and objection handling",
      "业绩达成与收入贡献": "Quota attainment and revenue contribution",
      "CRM 管理与销售纪律": "CRM management and sales discipline",
      "验证真实贡献": "Verify real contribution",
      "证据待补齐": "Evidence gap",
    };

    const generatedPhraseTranslations = {
      "虚拟 HR 面试官": "Virtual HR Interviewer",
      "虚拟业务负责人": "Virtual Business Owner",
      "虚拟项目推进面试官": "Virtual Project / PMO Interviewer",
      "虚拟谈薪顾问": "Virtual Negotiation Advisor",
      "决策层压力官": "Executive Pressure Officer",
      "稳定性、动机、表达清晰度、风险边界": "Stability, motivation, communication clarity, and risk boundaries",
      "业务理解、需求判断、指标意识、结果归因": "Business understanding, requirement judgment, metric awareness, and result attribution",
      "目标拆解、里程碑、资源协调、风险控制、复盘机制": "Goal decomposition, milestones, resource coordination, risk control, and retrospectives",
      "期望差距、竞争 Offer、入职概率、谈薪策略": "Expectation gaps, competing offers, acceptance probability, and negotiation strategy",
      "战略取舍、预算削减、资源约束、投入产出、极端压力判断": "Strategic trade-offs, budget cuts, resource constraints, ROI, and judgment under extreme pressure",
      "目标行业、客户角色、业务约束和可迁移经验。": "target industry, customer roles, business constraints, and transferable experience.",
      "路线图取舍、版本节奏、从 0 到 1 的闭环和复盘。": "roadmap trade-offs, release cadence, the 0-to-1 loop, and retrospectives.",
      "需求真伪判断、方案边界、客户沟通和落地结果。": "requirement validation, solution boundaries, customer communication, and delivery outcomes.",
      "技术约束理解、研发协同、方案取舍和风险控制。": "technical-constraint understanding, engineering collaboration, solution trade-offs, and risk control.",
      "技术趋势判断、创新来源、验证方式和商业化路径。": "technology-trend judgment, innovation sources, validation methods, and commercialization paths.",
      "里程碑、资源约束、质量标准、延期处理和复盘机制。": "milestones, resource constraints, quality standards, delay handling, and retrospective mechanisms.",
      "核心语言熟练度、关键模块实现、代码边界和个人贡献": "core-language proficiency, key-module implementation, code boundaries, and personal contribution",
      "架构取舍、容量预估、数据流、接口边界和演进成本": "architecture trade-offs, capacity estimation, data flow, interface boundaries, and evolution cost",
      "测试策略、代码评审、缺陷预防和质量度量": "testing strategy, code review, defect prevention, and quality metrics",
      "事故时间线、定位方法、止血动作、根因和长期修复": "incident timeline, diagnosis method, mitigation actions, root cause, and long-term remediation",
      "性能瓶颈、安全边界、可观测性和维护成本": "performance bottlenecks, security boundaries, observability, and maintenance cost",
      "需求澄清、排期承诺、跨角色协作和交付风险": "requirement clarification, schedule commitments, cross-role collaboration, and delivery risk",
      "影响范围、严重级别、客户紧急度和处理顺序": "impact scope, severity, customer urgency, and handling order",
      "复现路径、日志证据、排查假设和根因确认": "reproduction path, log evidence, diagnostic hypotheses, and root-cause confirmation",
      "客户语言转换、进展同步、风险解释和满意度维护": "customer-language translation, progress updates, risk explanation, and satisfaction maintenance",
      "响应节奏、超时处理、服务指标和质量复盘": "response cadence, timeout handling, service metrics, and quality retrospectives",
      "升级标准、协作对象、推动方式和闭环结果": "escalation criteria, collaborators, execution approach, and closed-loop outcomes",
      "文档沉淀、流程改进、复用效果和培训覆盖": "documentation, process improvement, reuse impact, and training coverage",
      "线索来源、客户筛选标准、触达策略和转化数据": "lead sources, customer qualification criteria, outreach strategy, and conversion data",
      "客户角色、痛点验证、决策链和真实预算": "customer roles, pain-point validation, decision chain, and real budget",
      "阶段推进、方案匹配、关键动作和赢单障碍": "stage progression, solution fit, key actions, and win barriers",
      "价格边界、竞品对比、异议拆解和成交策略": "pricing boundaries, competitor comparison, objection handling, and closing strategy",
      "目标口径、个人贡献、签约金额、回款和可复现打法": "target definitions, personal contribution, contract value, collections, and repeatable playbooks",
      "管道更新、预测准确性、跟进节奏和复盘机制": "pipeline updates, forecast accuracy, follow-up cadence, and retrospective mechanisms",
      "补齐岗位核心能力项目证据": "Add project evidence for the role's core capability",
      "复核指标口径、周期和个人贡献": "Verify metric definition, measurement period, and personal contribution",
      "验证真实角色、决策链和结果归因": "Verify the real role, decision chain, and result attribution",
      "可复核高可信证据": "Verifiable high-confidence evidence",
      "待追问中低可信证据": "Medium- or low-confidence evidence requiring follow-up",
      "简历评估": "Resume evaluation",
      "面试问题": "Interview questions",
      "反馈修正": "Feedback revision",
      "Offer 概率": "Offer probability",
      "谈判策略": "Negotiation strategy",
      "按当前证据等级、风险验证状态和 Offer 约束推进": "Proceed based on current evidence levels, risk-validation status, and Offer constraints.",
      "关键追问验证通过，低可信证据升级，候选人接受条件清晰": "Key follow-ups are validated, low-confidence evidence is upgraded, and acceptance conditions are clear.",
      "优先复核一级证据和谈薪约束，准备推进话术": "Prioritize Level 1 evidence and negotiation constraints, then prepare the progression narrative.",
      "风险被证实或候选人约束后置暴露，面试问题未能补证": "Risks are confirmed or candidate constraints surface late, and interview questions fail to close evidence gaps.",
      "先补证据缺口，再决定是否进入 Offer 沙盘": "Close evidence gaps before deciding whether to enter the Offer sandbox.",
      "面试后回填实际追问、候选人回答、证据等级变化和 Offer 约束变化": "Backfill actual follow-ups, candidate answers, evidence-level changes, and Offer constraint changes after the interview.",
      "仅将一级证据或面试后已证实证据转化为职级、薪资和推进建议": "Convert only Level 1 or interview-validated evidence into level, compensation, and progression recommendations.",
      "可作为下一轮面试准备和谈薪前验证输入，不代表自动录用结论": "Use this as input for next-round preparation and pre-negotiation validation; it is not an automatic hiring decision.",
      "建议先补项目闭环、个人贡献和岗位匹配证据，再进入 Offer 沙盘": "Add project-loop, personal-contribution, and role-fit evidence before entering the Offer sandbox.",
      "匹配进入": "Matched: proceed",
      "条件性进入（转岗适配）": "Conditional proceed (transferable fit)",
      "不匹配不推进": "Not matched: do not proceed",
      "强杠杆": "Strong leverage",
      "中杠杆": "Medium leverage",
      "弱杠杆": "Weak leverage",
      "暂无明确杠杆": "No clear leverage",
      "产品经理": "Product Manager",
      "开发人员": "Developer",
      "技术支持人员": "Technical Support Specialist",
      "销售人员": "Sales Professional",
      "未反馈": "No feedback",
      "采用": "Adopted",
      "改写采用": "Adopted after revision",
      "未采用": "Not adopted",
      "待验证": "Pending validation",
      "已证实": "Confirmed",
      "已推翻": "Disproved",
      "贡献 ": "contributed ",
      " 个基础问题，并针对 ": " base questions and generated a follow-up lens for ",
      " 生成追问视角": "",
      "；": "; ",
      "存在竞争机会 / Offer 线索": "Competing opportunity or Offer signals are present",
      "存在绩效、晋升或核心角色线索": "Performance, promotion, or core-role signals are present",
      "存在专利、论文、开源或外部成果": "Patent, publication, open-source, or external achievement signals are present",
      "存在垂直领域资源或行业经验": "Vertical-domain resources or industry experience are present",
      "存在 0-1、上线交付或量化结果。谈判时应转化为可量化贡献、稀缺经验和到岗确定性。": "0-to-1 delivery, launch execution, or quantified outcomes are present. Convert this into quantified contribution, scarce experience, and start-date certainty during negotiation.",
      "存在 0-1、上线交付或量化结果": "0-to-1 delivery, launch execution, or quantified outcomes are present",
      "材料中未发现竞对 Offer、绩效、专利、开源、垂直资源或明确量化成果": "No competing Offer, performance, patent, open-source, vertical-resource, or clearly quantified outcome signals were found.",
      "当前缺少可支撑溢价的明确证据，建议先补充竞对机会、绩效结果、垂直行业资源或可复核项目成果。": "There is not yet clear evidence supporting a premium; add competing opportunities, performance results, vertical-domain resources, or verifiable project outcomes first.",
      "谈判时应转化为可量化贡献、稀缺经验和到岗确定性。": "Convert these into quantified contribution, scarce experience, and start-date certainty during negotiation.",
      "没有可引用的简历证据": "No citable resume evidence",
      "包含量化结果、上线/版本或明确个人动作，可优先复核口径": "Includes quantified results, a launch/version, or explicit personal actions; prioritize definition verification",
      "包含负责、主导、上线或定性职责描述，需要面试追问验证": "Includes ownership, leadership, launch, or qualitative responsibility claims that require interview validation",
      "表达较模糊或偏团队成果，个人贡献边界不清": "The statement is vague or team-oriented, with unclear personal-contribution boundaries",
      "简历未体现明确证据": "No explicit resume evidence",
      "不匹配 / 待补证": "Not matched / evidence missing",
      "匹配但仍需复核口径": "Matched, but metric definitions still require verification",
      "部分匹配 / 需追问验证": "Partially matched / follow-up required",
      "一级证据（高可信）": "Level 1 evidence (high confidence)",
      "二级证据（中可信）": "Level 2 evidence (medium confidence)",
      "三级证据（低可信 / 待验证）": "Level 3 evidence (low confidence / pending validation)",
      "一级证据": "Level 1 evidence",
      "二级证据": "Level 2 evidence",
      "三级证据": "Level 3 evidence",
      "Offer 推进信号": "Offer progression signal",
      "人工反馈": "Human feedback",
      "未提供 Offer / 谈薪约束": "Offer / negotiation constraints not provided",
      "未填写人工补充意见": "No additional human feedback provided",
      "岗位可能存在客户临场需求、紧急版本、跨团队冲突或高频交付压力": "The role may involve urgent customer requests, emergency releases, cross-team conflict, or high-frequency delivery pressure.",
      "准备一次高压推进、线上事故或客户冲突的复盘案例": "Prepare a retrospective example involving high-pressure execution, a production incident, or customer conflict.",
      "业务方希望候选人不只执行需求，还能主动判断机会和技术方向": "The business expects the candidate to judge opportunities and technology direction, not only execute requirements.",
      "准备一次从趋势、客户痛点或数据洞察中提出产品方向的案例": "Prepare an example where trends, customer pain points, or data insights led to a product direction.",
      "项目可能周期长、依赖多，失败成本高，需要强项目治理能力": "Projects may be long, dependency-heavy, and costly to fail, requiring strong project governance.",
      "准备里程碑、风险清单、降级方案和复盘机制案例": "Prepare an example covering milestones, a risk register, fallback plans, and retrospective mechanisms.",
      "产品经理需要与研发共同做方案取舍，而不是只写需求文档": "The product manager must make solution trade-offs with engineering rather than only write requirements.",
      "准备一次技术方案取舍、架构约束或技术债治理案例": "Prepare an example involving technical trade-offs, architecture constraints, or technical-debt governance.",
      "缺证": "evidence gap",
      "验证问题": "validation question",
      "风险": "risk",
      "你提到": "You mentioned ",
      "，请拆解真实角色、关键决策、协作对象和结果归因。": ". Break down your real role, key decisions, collaborators, and result attribution.",
      "重点验证：": " Focus validation on: ",
      "目标行业、客户角色、业务约束和可迁移经验": "target industry, customer roles, business constraints, and transferable experience",
      "请补充一个能证明": "Provide one project proving ",
      "的项目，说明背景、目标、个人动作、结果和复盘。": ", covering background, goal, personal actions, result, and retrospective.",
      "围绕": "For ",
      "说明指标分母、统计周期、上线前后对比和你的直接贡献。": ", explain the metric denominator, measurement period, before/after comparison, and your direct contribution.",
      "这段经历更像模糊团队成果，请说明你个人做了什么、为什么由你负责、失败点是什么。": "This experience reads like a vague team result. Explain what you personally did, why you owned it, and what failed.",
    };

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
      return capabilityTranslations[value] || value || "Pending validation";
    }

    function translateGeneratedText(value, targetLanguage = getLanguage()) {
      const text = String(value || "");
      if ((targetLanguage === "en" ? "en" : "zh") !== "en" || !text) return text;

      const dynamicSkillTranslations = Object.keys(i18n.zh?.skillCards || {}).reduce(
        (translations, skillId) => {
          const source = i18n.zh?.skillCards?.[skillId] || [];
          const target = i18n.en?.skillCards?.[skillId] || [];
          if (source[0] && target[0]) translations[source[0]] = target[0];
          if (source[1] && target[1]) translations[source[1]] = target[1];
          return translations;
        },
        {},
      );
      const translations = {
        ...capabilityTranslations,
        ...generatedPhraseTranslations,
        ...dynamicSkillTranslations,
      };
      const orderedEntries = Object.entries(translations)
        .sort(([left], [right]) => right.length - left.length);

      function translateSegment(segment) {
        return orderedEntries.reduce(
          (result, [source, target]) => result.replaceAll(source, target),
          segment,
        );
      }

      function translateQuotedSegment(segment) {
        const opening = segment[0];
        const closing = segment[segment.length - 1];
        const inner = segment.slice(1, -1);
        const exactTranslation = translations[inner];
        return exactTranslation ? `${opening}${exactTranslation}${closing}` : segment;
      }

      return text
        .split(/([“"][^”"]*[”"])/g)
        .map((segment) => {
          if (!segment) return segment;
          if (/^[“"].*[”"]$/.test(segment)) return translateQuotedSegment(segment);
          return translateSegment(segment);
        })
        .join("");
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
      translateGeneratedText,
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
