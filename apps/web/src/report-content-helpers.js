// Candidate and interviewer report content helpers.
(function initOfferAgentReportContentHelpers(global) {
  "use strict";

  function createReportContentHelpers(dependencies = {}) {
    const {
      getLanguage = () => "zh",
      clip = (value, length = 80) => String(value ?? "").slice(0, length),
      buildRequirementEvidenceRows = () => [],
      buildGateAssessment = () => ({
        result: "",
        summary: "",
        matchedCount: 0,
        bestEvidence: "",
        enterSandbox: false,
      }),
      buildOfferLeverage = () => ({
        rating: "",
        summary: "",
        detail: "",
      }),
      buildEvidenceSummary = () => "",
      normalizeSnapshot = (value) => value || {},
      findEvidence = () => "",
      translateCapability = (value) => value || "",
      translateOfferRating = (value) => value || "",
      translateInterviewerRecommendation = (value) => value || "",
      translateInterviewerAction = (value) => value || "",
      translateDirectConclusionPoints = (value) => value || "",
      translateVerificationQuestionText = (value) => value || "",
    } = dependencies;

    function buildInterviewerResumeBrief(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const missingRows = rows.filter((row) => row.isMissing);
      const matchedRows = rows.filter((row) => !row.isMissing);
      const resume = snapshot.resume || "";
      const hasProjectSignal = /项目|平台|系统|上线|交付|落地|架构|研发|主导|负责/.test(resume);
      const hasEngineeringSignal = /工程化|架构|系统设计|前后端|数据库|部署|测试|上线|交付|性能|稳定性/.test(resume);
      const hasScatteredTechSignal = /学习|了解|熟悉|掌握|C\+\+|Java|JavaScript|数据库|操作系统|算法|框架/.test(resume) && !hasProjectSignal;
      const missingText = missingRows
        .slice(0, 3)
        .map((row) => `“${row.capability}”`)
        .join("、");
      const matchedText = matchedRows
        .slice(0, 2)
        .map((row) => `“${row.capability}”`)
        .join("、");

      let brief = "";
      if (matchedRows.length === 0) {
        brief = hasScatteredTechSignal
          ? `仅从简历看，候选人提到的技术更像单点学习或技能罗列，尚未看到一个完整的工程化项目闭环，因此无法体现 JD 中 ${missingText || "核心职责"} 的要求。`
          : `仅从简历看，候选人暂未提供能支撑 JD 核心职责的明确项目证据，无法判断其是否具备 ${missingText || "岗位要求能力"}。`;
      } else if (!hasEngineeringSignal && missingRows.length) {
        brief = `仅从简历看，候选人已有 ${matchedText || "部分能力"} 线索，但项目描述仍偏结果或职责陈述，未充分体现完整工程化交付过程，因此对 JD 中 ${missingText || "关键能力"} 仍需重点验证。`;
      } else if (missingRows.length) {
        brief = `仅从简历看，候选人与 JD 有部分交集，但仍有 ${missingText || "若干关键能力"} 未见明确证据，面试中应要求候选人补充具体项目、个人贡献、技术取舍和交付结果。`;
      } else {
        brief = "仅从简历看，候选人与 JD 表面匹配度较高，但仍需通过追问验证真实角色、项目复杂度、关键决策、技术取舍和结果归因，避免只停留在职责描述层面。";
      }

      return `| 初评维度 | 简短评价 |
    | --- | --- |
    | 简历初评 | ${brief} |
    | 面试验证重点 | 优先追问是否有完整项目闭环、本人真实角色、工程化交付细节、技术方案取舍和风险控制过程。 |`;
    }

    function buildDirectConclusion(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const missingRows = rows.filter((row) => row.isMissing);
      const matchedRows = rows.filter((row) => !row.isMissing);
      const points = (missingRows.length ? missingRows : rows)
        .slice(0, 4)
        .map((row) => `${row.capability}：${row.isMissing ? "简历未提供可支撑证据" : `${row.evidenceLevelLabel}，需验证真实贡献`}`)
        .join("；");

      if (matchedRows.length === 0) {
        return {
          label: "当前简历与 JD 全部为待验证 / 缺证，视同不匹配",
          points,
          nextStep: "优先补齐这些能力对应的项目案例，再准备面试回答",
          interviewerNextStep: "不列追问问题，先要求补充项目证据",
          hasMissing: true,
          blockQuestions: true,
        };
      }

      if (gate.result.includes("条件性进入")) {
        return {
          label: "当前简历与 JD 存在可迁移能力，但行业 / 场景仍需验证",
          points,
          nextStep: "用能力迁移话术建立连接，并补齐目标行业、客户场景和方案设计证据",
          interviewerNextStep: "围绕相似复杂度项目追问迁移边界、真实角色和场景理解",
          hasMissing: true,
          blockQuestions: false,
        };
      }

      if (missingRows.length) {
        return {
          label: `当前简历与 JD 部分匹配，仍有 ${missingRows.length} 项待验证 / 缺证`,
          points,
          nextStep: "补齐缺证项，同时准备已匹配项目的深挖问题",
          interviewerNextStep: "围绕已匹配项目继续追问，验证缺证项和过度包装风险",
          hasMissing: true,
          blockQuestions: false,
        };
      }

      return {
        label: "当前简历与 JD 表面匹配，但仍需验证",
        points,
        nextStep: "准备关键决策、指标口径、失败细节和现场推演回答",
        interviewerNextStep: "使用反包装问题验证真实角色、指标口径和临场判断",
        hasMissing: false,
        blockQuestions: false,
      };
    }

    function buildConcreteJobAnalysis(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const matchCount = rows.filter((row) => !row.isMissing).length;
      const matchLevel = matchCount >= 4 ? "高匹配" : matchCount >= 2 ? "中等匹配" : "低匹配";
      return `| 企业需要的能力 | JD 证据 | 当前简历证据 | 证据等级 / 匹配判断 |
    | --- | --- | --- | --- |
    ${rows.map((row) => `| ${row.capability} | ${row.jdEvidence} | ${row.resumeEvidence} | ${row.evidenceLevelLabel}；${row.matchStatus} |`).join("\n")}
    | 综合匹配程度 | 基于 JD 职责与简历项目证据逐项对照 | 已匹配 ${matchCount}/${rows.length} 项能力证据 | ${matchLevel} |`;
    }

    function buildCandidateThreeSecondSummary(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const offerLeverage = buildOfferLeverage(snapshot);
      const matchedRows = rows.filter((row) => !row.isMissing);
      const missingRows = rows.filter((row) => row.isMissing);
      const matchRate = Math.round((matchedRows.length / Math.max(rows.length, 1)) * 100);
      const topStrength = matchedRows[0] || rows[0];
      const topRisk = missingRows[0] || rows.find((row) => row.evidenceLevel >= 2) || rows[0];
      return `| 速览项 | 结论 | 候选人动作 |
    | --- | --- | --- |
    | 核心匹配度 | ${matchRate}%；${gate.result} | 不要泛泛说匹配，优先讲最贴近 JD 的项目闭环 |
    | 差异化优势 | ${topStrength ? `${topStrength.capability}：${topStrength.resumeEvidence}` : "暂未识别明确优势"} | 自我介绍后主动引导到该项目，讲问题、取舍、推进和结果 |
    | 最大风险 | ${topRisk ? `${topRisk.capability}：${topRisk.isMissing ? "缺证" : topRisk.evidenceLevelLabel}` : "待验证"} | 准备指标口径、个人贡献、失败复盘或诚实迁移表达 |
    | 今晚优先动作 | 补齐最高风险证据，不追求面面俱到 | 画 1 张项目流程图，列 3 个关键决策，补 1 组可复核指标 |
    | 谈薪 / 动机 | ${offerLeverage.rating}：${offerLeverage.summary} | 把期望绑定到职责完整度、可量化贡献、到岗确定性 |`;
    }

    function buildInterviewerThreeSecondSummary(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const offerLeverage = buildOfferLeverage(snapshot);
      const directConclusion = buildDirectConclusion(snapshot);
      const recommendation = buildInterviewerRecommendation(gate);
      const matchedRows = rows.filter((row) => !row.isMissing);
      const missingRows = rows.filter((row) => row.isMissing);
      const topQuestion = (missingRows[0] || rows.find((row) => row.evidenceLevel >= 2) || rows[0])?.verificationQuestion || "请先围绕最强项目还原个人贡献、指标口径和失败复盘。";
      if (getLanguage() === "en") {
        return `| Review item | Interviewer judgment | Action |
    | --- | --- | --- |
    | Recommendation | ${translateInterviewerRecommendation(recommendation.level)} | ${translateInterviewerAction(recommendation.action)} |
    | Role evidence | ${matchedRows.length}/${rows.length} requirements have resume anchors | Start from the strongest project, then verify missing or weak evidence. |
    | Key risk | ${directConclusion.hasMissing ? "Evidence gaps or packaging risk remain." : "Surface fit still needs anti-packaging validation."} | Ask for ownership boundary, metric definition, failure detail, and decision chain. |
    | Priority question | ${translateVerificationQuestionText(topQuestion)} | Use it as the first deep-dive question before moving to offer discussion. |
    | Offer impact | ${translateOfferRating(offerLeverage.rating)}: ${offerLeverage.summary} | Do not price or push the offer before evidence credibility is updated. |`;
      }
      return `| 速览项 | 面试官判断 | 面试动作 |
    | --- | --- | --- |
    | 推荐结论 | ${recommendation.level} | ${recommendation.action} |
    | 岗位证据 | 已匹配 ${matchedRows.length}/${rows.length} 项 JD 要求 | 先从最强项目深挖，再验证缺证或弱证据 |
    | 主要风险 | ${directConclusion.hasMissing ? "存在缺证或包装风险" : "表面匹配，但仍需反包装验证"} | 追问个人边界、指标口径、失败细节和决策链 |
    | 优先追问 | ${topQuestion} | 作为第一轮深挖问题，回答不清则暂缓进入 Offer 判断 |
    | Offer 影响 | ${offerLeverage.rating}：${offerLeverage.summary} | 证据可信度未更新前，不建议提前定价或强推进 |`;
    }

    function buildInterviewerOneMinuteDecisionBrief(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const offerLeverage = buildOfferLeverage(snapshot);
      const directConclusion = buildDirectConclusion(snapshot);
      const recommendation = buildInterviewerRecommendation(gate);
      const resumeEvidence = snapshot.resume ? clip(snapshot.resume) : "未提供简历快照";
      const jdEvidence = snapshot.job_description ? clip(snapshot.job_description) : "未提供 JD 快照";

      if (getLanguage() === "en") {
        return `| Decision Item | Current Judgment | Evidence | Interview Action |
    | --- | --- | --- | --- |
    | Recommendation | ${translateInterviewerRecommendation(recommendation.level)} | ${gate.matchedCount} matched requirement evidence items | ${translateInterviewerAction(recommendation.action)} |
    | Can this person do the job? | ${gate.matchedCount >= 4 ? "Likely, but verify true ownership" : gate.matchedCount >= 2 ? "Possible adjacent fit; verify transfer boundary" : "Evidence is insufficient"} | Resume: ${snapshot.resume ? clip(snapshot.resume) : "Not provided"} | Ask for a complete project loop, trade-offs, engineering collaboration, launch result, and anti-packaging details. |
    | Packaging risk | ${directConclusion.hasMissing ? "Evidence gaps or packaging risk remain" : "Surface fit still needs anti-packaging validation"} | ${translateDirectConclusionPoints(directConclusion.points)} | Ask for metric definitions, personal actions, failure details, and decision chain. |
    | Team fit | Pending validation | Context: ${snapshot.company_context ? clip(snapshot.company_context) : "Not provided"} | Validate conflict handling, resource coordination, operating cadence, and escalation style. |
    | Offer acceptance | ${translateOfferRating(offerLeverage.rating)} / pending | ${offerLeverage.detail} | Update compensation expectation, competing offers, start date, and level preference after interview. |`;
      }

      return `| 决策问题 | 当前判断 | 证据 | 面试动作 |
    | --- | --- | --- | --- |
    | 推荐等级 | ${recommendation.level} | ${gate.summary} | ${recommendation.action} |
    | 能不能干活 | ${gate.matchedCount >= 4 ? "有较强可能，但需复核真实贡献" : gate.matchedCount >= 2 ? "可能能做相邻场景，需要验证迁移边界" : "当前证据不足"} | JD 证据：${jdEvidence}；简历证据：${resumeEvidence} | 追问最强项目的需求判断、方案取舍、研发协同、上线复盘 |
    | 水分有多少 | ${directConclusion.hasMissing ? "存在缺证或包装风险" : "表面完整但仍需反包装验证"} | ${directConclusion.points} | 要求现场还原指标口径、个人动作、失败细节和决策链 |
    | 是否适配团队 | 待验证 | 公司 / 面试上下文：${snapshot.company_context ? clip(snapshot.company_context) : "未提供"} | 追问冲突处理、资源协调、节奏适应和升级机制 |
    | Offer 接受概率 | ${offerLeverage.rating} / 待验证 | ${offerLeverage.detail} | 面试后更新薪资期望、竞对 Offer、到岗时间和职级偏好 |`;
    }

    function buildCandidateAdvantageCards(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const matchedRows = rows.filter((row) => !row.isMissing).slice(0, 3);
      const sourceRows = matchedRows.length ? matchedRows : rows.slice(0, 3);
      return `| 优势项 | 证据 | 面试中怎么主动引导 | 风险提醒 |
    | --- | --- | --- | --- |
    ${sourceRows.map((row, index) => {
      const intro = index === 0
        ? "开场 30 秒主动抛出该项目，争取让面试官围绕你最强证据追问"
        : "在回答相邻问题时作为补充案例，证明能力不是孤立技能";
      const risk = row.isMissing
        ? "当前只是潜在优势，不能说成已经主导，需要先补真实项目证据"
        : "避免只讲团队成果，必须说清本人动作、决策权和结果归因";
      return `| ${row.capability} | ${row.resumeEvidence} | ${intro} | ${risk} |`;
    }).join("\n")}`;
    }

    function buildInterviewerAdvantageCards(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const matchedRows = rows.filter((row) => !row.isMissing).slice(0, 3);
      const sourceRows = matchedRows.length ? matchedRows : rows.slice(0, 3);
      if (getLanguage() === "en") {
        return `| Decision signal | Evidence anchor | How to verify | Hiring implication |
    | --- | --- | --- | --- |
    ${sourceRows.map((row, index) => {
      const capability = translateCapability(row.capability);
      const evidence = row.resumeEvidence || "No explicit resume evidence yet";
      const verify = row.isMissing
        ? "Ask the candidate to provide a concrete project before treating it as a strength."
        : "Force timeline, personal deliverable, metric definition, and attribution boundary.";
      const implication = index === 0
        ? "Use this as the first deep-dive path and decide whether the candidate deserves the next round."
        : "Use it as supporting evidence only after the main project passes verification.";
      return `| ${capability} | ${evidence} | ${verify} | ${implication} |`;
    }).join("\n")}`;
      }
      return `| 决策信号 | 证据锚点 | 面试官如何验证 | 录用判断影响 |
    | --- | --- | --- | --- |
    ${sourceRows.map((row, index) => {
      const verify = row.isMissing
        ? "先要求候选人补一个具体项目，不能直接当作优势"
        : "现场还原时间线、个人交付物、指标口径和归因边界";
      const implication = index === 0
        ? "作为第一条深挖路径，决定是否值得进入下一轮"
        : "作为辅助证据，必须等主项目验证通过后再加权";
      return `| ${row.capability} | ${row.resumeEvidence} | ${verify} | ${implication} |`;
    }).join("\n")}`;
    }

    function buildAbilityTransferAnalysis(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const matchedRows = rows.filter((row) => !row.isMissing);
      const missingRows = rows.filter((row) => row.isMissing);
      const anchor = matchedRows[0] || rows[0];
      const transferRows = (missingRows.length ? missingRows : rows.filter((row) => row.evidenceLevel >= 2)).slice(0, 3);
      return `| 目标缺口 | 可迁移锚点 | 迁移路径 | 面试验证问题 |
    | --- | --- | --- | --- |
    ${transferRows.map((row) => {
      const anchorText = anchor ? anchor.resumeEvidence : "过往复杂项目经历";
      return `| ${row.capability} | ${anchorText} | 从相邻项目中的需求拆解、方案取舍、研发协同、客户沟通或交付治理迁移到该职责 | 请说明原场景和目标 JD 的相似点、差异点、你如何快速补行业认知，以及哪些能力需要入职后继续补齐 |`;
    }).join("\n") || "| 暂无明显缺口 | 当前证据仍需复核 | 用一级证据确认真实贡献，而不是额外包装迁移 | 请拆解指标口径、个人动作和失败复盘 |"}`;
    }

    function buildConcreteGapTable(snapshot) {
      const allRows = buildRequirementEvidenceRows(snapshot);
      const rows = allRows.filter((row) => row.isMissing);
      const gapRows = rows.length ? rows : allRows.slice(0, 3);
      return `| 不匹配 / 待验证点 | JD 证据 | 简历当前证据 | 证据等级与建议补充 |
    | --- | --- | --- | --- |
    ${gapRows.map((row) => {
      const status = row.isMissing ? "不匹配 / 缺证" : "待验证";
      return `| ${status}：${row.capability} | ${row.jdEvidence} | ${row.resumeEvidence} | ${row.evidenceLevelLabel}；准备一个能证明“${row.capability}”的具体项目，说明背景、个人动作、结果和复盘 |`;
    }).join("\n")}`;
    }

    function buildConcreteCandidateQuestions(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot).slice(0, 6);
      return `| 模拟问题 | 回答路线图 | 常见陷阱 | 绝对不要说 |
    | --- | --- | --- | --- |
    ${rows.map((row) => `| 请用一个项目证明你具备“${row.capability}” | S：项目背景和约束；T：目标和成功口径；A：你的个人动作、关键取舍、协作对象；R：结果、复盘和下次会改变什么；证据等级：${row.evidenceLevelLabel} | 只复述“负责 / 参与 / 推动”，没有指标口径、个人动作或失败细节 | “这个主要是团队做的，我负责配合” |
    `).join("")}| 请复盘一次项目延期或线上故障 | 按时间线讲发现、止血、分工、根因、影响、整改和后续机制变化 | 把问题全推给研发、客户或外部环境 | “我没有遇到过失败或延期” |`;
    }

    function buildCandidateRevisionAdvice(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const missingRows = rows.filter((row) => row.isMissing);
      const targetRows = missingRows.length ? missingRows : rows.slice(0, 4);
      return `| 优先级 | 今晚要完成的动作 | 产出物 | 为什么优先 |
    | --- | --- | --- | --- |
    ${targetRows.map((row, index) => {
      const problem = row.isMissing ? `简历没有体现“${row.capability}”的项目证据` : `简历已有“${row.capability}”线索，但当前仅为${row.evidenceLevelLabel}`;
      const priority = index === 0 ? "P0" : index === 1 ? "P1" : "P2";
      return `| ${priority}：${row.capability} | 针对“${problem}”，补 1 个真实项目，写清背景、目标、约束、个人动作、结果和复盘 | 项目流程图、指标口径卡、关键决策清单、失败或取舍案例 | ${row.isMissing ? "这是 JD 缺证项，可能直接影响推进" : "可把现有证据从低可信提升为高可信"} |`;
    }).join("\n")}`;
    }

    function buildCandidateStrategyAdvice(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const offerLeverage = buildOfferLeverage(snapshot);
      const matchedRows = rows.filter((row) => !row.isMissing);
      const missingRows = rows.filter((row) => row.isMissing);
      const bestRow = matchedRows[0] || rows[0];
      const missingText = missingRows.slice(0, 2).map((row) => row.capability).join("、") || "一级证据口径";
      return `| 策略模块 | 当前判断 | 候选人打法 |
    | --- | --- | --- |
    | 优势放大 | ${bestRow ? bestRow.resumeEvidence : gate.bestEvidence} | 主动把这个项目讲成问题判断、方案取舍、推进落地、指标复盘的闭环，不只复述职责 |
    | 缺证项表达 | ${missingText}仍需补强 | 不编造行业或项目经历，改为说明相似场景、已验证方法和入职后补齐行业认知的计划 |
    | 主动引导 | 面试官会优先追问${bestRow ? bestRow.capability : "项目闭环"} | 自我介绍后主动抛出最贴近 JD 的项目，引导对方追问你准备最充分的证据链 |
    | STAR 升级 | 普通 STAR 不足以证明产品判断 | 在背景、目标、动作、结果外补充约束条件、指标口径、关键取舍和复盘机制 |
    | 谈薪 / 动机 | ${offerLeverage.rating}：${offerLeverage.summary} | 把期望与职责完整度、成长空间、到岗确定性和可量化贡献绑定，避免只谈薪资数字 |`;
    }

    function buildPressureInterviewGuide(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const topRisk = rows.find((row) => row.isMissing) || rows.find((row) => row.evidenceLevel >= 2) || rows[0];
      return `| 压力问题 | 面试官最想听到 | 最不想听到 | 候选人应对 |
    | --- | --- | --- | --- |
    | 项目延期 / 线上故障复盘 | 发现机制、止血动作、根因定位、影响范围、长期整改和后续机制变化 | 没有失败、都是别人问题、只讲结果不讲过程 | 如无线上故障，诚实换成真实延期、需求冲突、客户投诉或资源冲突案例 |
    | 你在项目里到底做了什么 | 明确个人交付物、关键决策、协作对象和结果归因 | “我们团队一起做的”，说不清自己的边界 | 用“我负责 / 我推动 / 我决策 / 我复盘”的句式拆清楚 |
    | 为什么缺少 ${topRisk?.capability || "关键能力"} 证据 | 承认简历表达不足，用相邻经历说明迁移路径和补齐计划 | 直接声称做过但无法还原细节 | 说清原场景、相似点、差异点、入职后 30 天补齐动作 |
    | 如果资源砍半怎么排优先级 | 用客户价值、风险等级、成本、收益和止损阈值排序 | “我会和大家沟通协调” | 现场列保留 / 延后 / 放弃清单，并说明指标依据 |
    | 为什么还值得推进 | ${gate.result} 下的最强证据和最关键补证计划 | 只表达意愿或学习能力 | 绑定 JD 核心职责、已有项目证据和可验证承诺 |`;
    }

    function buildConcreteInterviewerQuestions(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot).slice(0, 6);
      return `| 问题类型 | 核心追问 | 回答好继续深挖 | 回答差快速验证 | 推进动作 |
    | --- | --- | --- | --- | --- |
    ${rows.map((row, index) => `| ${interviewerLens(index)}：${row.capability} | 对应 JD：${row.jdEvidence}；项目锚点：${row.resumeEvidence}；${row.verificationQuestion} | 继续追问指标口径、个人决策、协作对象、失败细节和结果归因 | 要求给出具体时间线、个人交付物和可复核材料；仍答不上标记缺证 | ${row.isMissing ? "补材料或暂缓" : "可继续深挖"} |`).join("\n")}
    | 反包装验证 | 请按时间线还原一次真实线上故障或延期，说明发现、止血、根因、整改和后续机制变化。 | 继续追问谁拍板、谁执行、影响范围、整改是否进入后续发布机制 | 候选人声称没有失败或只能讲完美项目，标记过度包装风险 | 失败复盘不过关则不建议强推进 |
    | 决策层压力官 | 如果上级砍掉一半预算，你如何用指标重排优先级并说服我？ | 继续追问保留/放弃清单、ROI 口径、客户影响和止损阈值 | 只说“沟通协调”或无法量化取舍依据 | 取舍能力不足时建议加业务负责人面 |`;
    }

    function buildInterviewerRecommendation(gate) {
      if (gate.result.includes("匹配进入")) {
        return {
          level: "推荐",
          action: "进入下一轮，但必须验证真实贡献、指标口径、失败复盘和团队适配",
        };
      }
      if (gate.result.includes("条件性进入")) {
        return {
          level: "有条件推荐",
          action: "只围绕可迁移能力推进，重点验证行业理解速度、场景抽象和项目复杂度",
        };
      }
      return {
        level: "不推荐",
        action: "暂不进入下一轮，先要求补充能支撑 JD 核心职责的完整项目证据",
      };
    }

    function buildInterviewerScorecard(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const offerLeverage = buildOfferLeverage(snapshot);
      const matchedCount = rows.filter((row) => !row.isMissing).length;
      const strongCount = rows.filter((row) => row.evidenceLevel === 1).length;
      const missingCount = rows.length - matchedCount;
      const scoreRows = [
        {
          dimension: "专业能力",
          score: Math.min(5, Math.max(1, 2 + strongCount + Math.floor(matchedCount / 3))),
          evidence: buildEvidenceSummary(rows),
          anchor: "能拆解 JD 核心职责，并用真实项目说明产品判断和结果口径",
          risk: missingCount >= 4 ? "多数核心职责缺证" : "只讲职责，不讲方法和取舍",
        },
        {
          dimension: "项目闭环",
          score: gate.enterSandbox ? (strongCount ? 4 : 3) : 1,
          evidence: gate.bestEvidence,
          anchor: "能讲清需求发现、方案设计、研发协同、上线、复盘",
          risk: "缺少上线结果、失败复盘或个人贡献边界",
        },
        {
          dimension: "沟通协作",
          score: /推动|协作|客户|研发|设计|运营|跨团队|协调/.test(`${snapshot.resume || ""} ${snapshot.company_context || ""}`) ? 3 : 2,
          evidence: findEvidence(`${snapshot.resume || ""} ${snapshot.company_context || ""}`, ["推动", "协作", "客户", "研发", "设计", "运营", "跨团队", "协调"]) || "材料中协作证据不足",
          anchor: "能说明冲突方、沟通机制、升级路径和最终结果",
          risk: "只说沟通顺畅，无法复盘冲突和资源争抢",
        },
        {
          dimension: "业务理解",
          score: /智慧矿山|矿山|GIS|B\s*端|B端|SaaS|企业|客户|行业/.test(`${snapshot.resume || ""} ${snapshot.job_description || ""}`) ? 3 : 2,
          evidence: findEvidence(`${snapshot.resume || ""} ${snapshot.job_description || ""}`, ["智慧矿山", "矿山", "GIS", "B端", "B 端", "SaaS", "企业", "客户", "行业"]) || "目标行业或客户场景证据不足",
          anchor: "能把用户、客户、业务指标和产品方案连起来",
          risk: "只懂功能，不懂业务场景和客户价值",
        },
        {
          dimension: "技术协同",
          score: /架构|研发|技术|数据库|前后端|C\+\+|Java|JavaScript|系统设计/.test(`${snapshot.resume || ""} ${snapshot.job_description || ""}`) ? 3 : 2,
          evidence: findEvidence(`${snapshot.resume || ""} ${snapshot.job_description || ""}`, ["架构", "研发", "技术", "数据库", "前后端", "C++", "Java", "JavaScript", "系统设计"]) || "技术协同证据不足",
          anchor: "能说明技术边界、方案取舍、风险控制和研发协同方式",
          risk: "堆技术名词，无法解释系统边界或技术风险",
        },
        {
          dimension: "团队适配",
          score: snapshot.company_context ? 3 : 2,
          evidence: snapshot.company_context ? clip(snapshot.company_context) : "未提供团队文化或协作上下文",
          anchor: "能适应团队节奏、沟通方式和岗位真实压力",
          risk: "动机泛化，对岗位挑战或团队节奏理解不足",
        },
        {
          dimension: "Offer 风险",
          score: offerLeverage.rating.includes("暂无") ? 2 : 3,
          evidence: offerLeverage.detail,
          anchor: "能清楚说明期望、约束、竞对机会、到岗时间和取舍标准",
          risk: "薪资、职级、到岗或竞对机会后置暴露",
        },
      ];
      return `| 评分维度 | 分数 | 证据 | 行为锚点 / 扣分信号 |
    | --- | --- | --- | --- |
    ${scoreRows.map((row) => `| ${row.dimension} | ${row.score}/5 | ${row.evidence} | 行为锚点：${row.anchor}；扣分信号：${row.risk} |`).join("\n")}`;
    }

    function buildInterviewerSignalTable(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const missingRows = rows.filter((row) => row.isMissing);
      const matchedRows = rows.filter((row) => !row.isMissing);
      return `| 信号类型 | 现场表现 | 代表含义 | 面试官动作 |
    | --- | --- | --- | --- |
    | 绿灯：项目真实 | 能按时间线讲清${matchedRows[0]?.capability || "核心项目"}的背景、目标、约束、个人动作和结果 | 项目闭环可信度较高 | 继续深挖关键决策和失败复盘 |
    | 绿灯：指标可信 | 能说明指标分母、统计周期、上线前后对比和归因边界 | 结果不是简单包装 | 追问是否有同期变量、对照组或客户反馈 |
    | 绿灯：协作成熟 | 能讲清冲突方、资源约束、升级机制和最终取舍 | 具备跨团队推进能力 | 追问如果资源减半会如何重排优先级 |
    | 红灯：职责复述 | 只重复“负责 / 参与 / 推动”，没有个人动作 | 可能只是边缘参与 | 要求候选人明确自己做过的交付物和决策 |
    | 红灯：缺证回避 | 对${missingRows[0]?.capability || "关键能力"}只讲学习意愿，没有项目证据 | 不足以支撑 JD 核心职责 | 标记缺证，必要时停止该方向深挖 |
    | 红灯：完美叙事 | 无法提供延期、冲突、事故或判断错误案例 | 可能存在过度包装 | 必须追问失败案例；仍无法回答则记录风险 |`;
    }

    function buildInterviewerFollowupPaths(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const targetRows = rows.slice(0, 4);
      return `| 起手问题 | 回答好时继续追问 | 回答差时快速验证 | 记录结论 |
    | --- | --- | --- | --- |
    ${targetRows.map((row) => `| ${row.verificationQuestion} | 请继续说明关键决策是谁做的、指标如何定义、失败点是什么 | 要求候选人给出具体时间、协作人、产出物和复盘材料；仍答不上则标记缺证 | ${row.capability}：${row.matchStatus} |`).join("\n")}
    | 请复盘一次项目延期或线上故障 | 继续追问发现、止血、根因、影响范围、整改机制和后续机制变化 | 如果没有真实失败案例，追问需求冲突、客户投诉或资源冲突；仍没有则标记包装风险 | 失败复盘能力 |
    | 如果预算或研发资源砍掉一半，你怎么重排优先级 | 继续追问 ROI、客户影响、风险阈值和说服路径 | 如果只说沟通协调，要求现场列出保留/放弃清单 | 战略取舍能力 |`;
    }

    function buildInterviewerDecisionAdvice(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const recommendation = buildInterviewerRecommendation(gate);
      const missingRows = rows.filter((row) => row.isMissing).slice(0, 3);
      const mustVerify = (missingRows.length ? missingRows : rows.slice(0, 3))
        .map((row) => row.capability)
        .join("、");
      return `| 决策项 | 建议 |
    | --- | --- |
    | 推荐等级 | ${recommendation.level} |
    | 录用前置条件 | 候选人必须能用真实项目证明：${mustVerify} |
    | 下一轮最应验证 | 个人贡献边界、指标口径、失败复盘、技术 / 业务取舍和团队适配 |
    | 加面建议 | 若候选人通过业务面，建议追加项目推进 / 技术协同视角验证，避免只看产品表达 |
    | Offer 风险处理 | 谈薪前必须确认薪资期望、竞对机会、到岗时间、职级偏好和接受概率 |
    | 不推荐触发条件 | 无法提供完整项目闭环、拒绝复盘失败、无法解释指标口径或只讲团队成果 |`;
    }

    function buildInterviewerQuickBrief(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const recommendation = buildInterviewerRecommendation(gate);
      const offerLeverage = buildOfferLeverage(snapshot);
      const matchedRows = rows.filter((row) => !row.isMissing);
      const missingRows = rows.filter((row) => row.isMissing);
      const topStrength = matchedRows[0]?.capability || "暂无明确强证据";
      const topRisk = missingRows[0]?.capability || "表面匹配但需反包装验证";
      return `| 速览项 | 内容 |
    | --- | --- |
    | 推荐等级 | ${recommendation.level} |
    | 核心亮点 | ${topStrength}：${matchedRows[0]?.resumeEvidence || gate.bestEvidence} |
    | 核心风险 | ${topRisk}：${missingRows[0]?.evidenceReason || "需要验证真实角色、指标口径和失败复盘"} |
    | 必问 3 题 | 1. 还原最贴近 JD 的完整项目闭环；2. 按时间线复盘一次延期 / 故障；3. 解释一次资源砍半时的优先级取舍 |
    | 面试策略 | 先问项目闭环，再问失败复盘，最后用决策层压力题验证临场判断 |
    | Offer 提醒 | ${offerLeverage.rating}：${offerLeverage.summary} |
    | 下一轮传递重点 | ${gate.enterSandbox ? "传递已验证证据、仍待验证缺口和新增风险" : "先补项目证据，不建议直接推进到深轮面试"} |`;
    }

    function buildCandidateProfile(snapshot) {
      const normalized = normalizeSnapshot(snapshot);
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const offerLeverage = buildOfferLeverage(snapshot);
      const projectTypes = rows
        .filter((row) => !row.isMissing)
        .slice(0, 3)
        .map((row) => row.capability)
        .join("、") || "简历未提供足够项目类型证据";
      const motivationEvidence = findEvidence(
        `${normalized.resume} ${normalized.company_context} ${normalized.offer_constraints}`,
        ["希望", "期望", "考虑", "目标", "到岗", "预算", "竞对", "Offer", "offer", "成长", "稳定"],
      ) || "动机、薪资和到岗约束缺少明确证据";
      return `| 画像维度 | 当前判断 | 证据 | 需要验证 |
    | --- | --- | --- | --- |
    | 职业路径画像 | ${projectTypes} | ${clip(normalized.resume) || "未提供简历"} | 是否具备从单点执行到模块负责人 / 行业产品负责人的跨度 |
    | 项目角色画像 | ${gate.result} | ${gate.summary} | 本人真实角色、决策权、产出物和指标归因 |
    | 稳定性 / 动机画像 | 待验证 | ${motivationEvidence} | 离职动机、岗位偏好、长期稳定性和业务节奏接受度 |
    | 薪资 / 到岗画像 | ${offerLeverage.rating} / 待验证 | ${normalized.offer_constraints || "未提供 Offer / 谈薪约束"} | 薪资期望、竞对机会、可接受底线和最快到岗时间 |
    | 团队适配画像 | 待验证 | ${normalized.company_context || "未提供团队上下文"} | 沟通风格、冲突处理、资源争抢和升级机制成熟度 |`;
    }

    function buildRoleAwareInterviewerModules(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const offerLeverage = buildOfferLeverage(snapshot);
      const profile = buildCandidateProfile(snapshot).replace(/\n/g, " ");
      const roleModules = [
        {
          title: "HR 面试官模块",
          goal: "验证动机、稳定性、薪资期望、到岗时间和合规风险",
          portrait: `候选人阶段与 Offer 约束：${normalizeSnapshot(snapshot).candidate_stage || "未提供"}；${offerLeverage.summary}`,
          mustAsk: "为什么选择该岗位？是否有竞对 Offer？最快到岗时间和薪资底线是什么？是否存在竞业或合规限制？",
          deepAsk: "如果该岗位职责、薪资或到岗时间只能满足两项，你如何排序？为什么？",
          quickCheck: "请用 30 秒说明你接受或拒绝 Offer 的前三个触发条件。",
          chain: "动机清晰 -> 追问机会排序和长期规划；动机泛化 -> 追问离职原因、真实不满和接受 / 拒绝 Offer 的触发条件",
          scorecard: "动机清晰度 /5；稳定性 /5；薪资匹配 /5；到岗确定性 /5",
          green: "能明确说出岗位吸引点、机会排序、薪资弹性和到岗计划",
          red: "关键条件后置暴露、只谈薪资、动机空泛或回避竞业限制",
          skip: "不需要追问系统架构、技术选型细节或产品路线图深度。",
          handoff: "把薪资底线、竞对阶段、到岗时间和动机强弱传给业务负责人",
        },
        {
          title: "技术架构 / 技术负责人模块",
          goal: "验证系统设计、技术边界、技术选型、研发协同和复杂问题排查",
          portrait: `技术协同证据：${rows.find((row) => row.capability === "技术架构与研发协同")?.resumeEvidence || "缺少明确证据"}`,
          mustAsk: "请画出最复杂项目的系统边界；为什么采用当时的技术方案？最大技术风险如何识别和控制？",
          deepAsk: "如果核心模块要支撑 10 倍数据量或客户量，你会先改哪三个技术点？",
          quickCheck: "请列出该项目中你本人直接参与的技术评审、接口设计或风险决策。",
          chain: "能画清架构 -> 追问瓶颈、容灾、扩展和技术债；画不清 -> 追问本人负责模块和代码 / 文档贡献",
          scorecard: "系统设计 /5；技术选型 /5；问题排查 /5；研发协同 /5",
          green: "能解释技术方案取舍、边界、风险和研发协作机制",
          red: "堆技术名词但无法解释为什么、谁决策、风险如何闭环",
          skip: "不需要深问薪资底线、离职动机或 HR 合规细节。",
          handoff: "把技术深度、系统边界和研发协同风险传给产品 / 项目推进面",
        },
        {
          title: "产品负责人模块",
          goal: "验证需求洞察、产品规划、MVP / 迭代意识、用户价值和业务指标",
          portrait: `产品证据：${rows.find((row) => row.capability === "产品规划与生命周期管理")?.resumeEvidence || "缺少明确证据"}`,
          mustAsk: "一个 0-1 项目最初的用户问题是什么？你如何定义 MVP？上线后如何迭代？",
          deepAsk: "如果客户、销售和研发对版本优先级意见相反，你用什么标准裁剪需求？",
          quickCheck: "请用一句话说清这个产品的目标用户、核心场景和成功指标。",
          chain: "回答有用户和指标 -> 追问取舍、竞品和迭代路线；回答只有功能 -> 追问业务目标和用户价值",
          scorecard: "需求洞察 /5；规划能力 /5；指标意识 /5；产品质量 /5",
          green: "能把用户、客户、业务指标和产品方案连起来",
          red: "只讲功能列表，无法解释为什么做、先做什么、怎么判断成功",
          skip: "不需要深入问薪资谈判、竞业限制或代码实现细节。",
          handoff: "把产品判断、MVP 意识和业务指标缺口传给业务负责人",
        },
        {
          title: "项目推进 / PMO 模块",
          goal: "验证里程碑、资源协调、延期预警、风险升级和复盘机制",
          portrait: `交付证据：${rows.find((row) => row.capability === "成本、进度、质量控制")?.resumeEvidence || "缺少明确证据"}`,
          mustAsk: "最复杂项目如何排期？需求增加 20% 怎么处理？一次差点延期如何预警和扭转？",
          deepAsk: "如果关键研发资源被抽走，你如何重新拆里程碑、同步风险并争取业务接受？",
          quickCheck: "请列一个真实项目的里程碑、风险清单、责任人和升级节点。",
          chain: "能讲出排期和风险 -> 追问升级机制和复盘沉淀；只说协调 -> 追问具体冲突方和取舍记录",
          scorecard: "目标拆解 /5；资源协调 /5；风险控制 /5；复盘沉淀 /5",
          green: "能给出里程碑、风险清单、责任人、升级路径和后续机制变化",
          red: "没有真实延期 / 冲突案例，或只把问题归因给外部团队",
          skip: "不需要深问薪资期望或宏观战略取舍。",
          handoff: "把交付风险、资源协调能力和复盘成熟度传给终面",
        },
        {
          title: "业务负责人 / 决策层模块",
          goal: "验证战略取舍、商业洞察、投入产出、领导力潜力和资源约束下的判断质量",
          portrait: `闸口判断：${gate.result}；${gate.summary}`,
          mustAsk: "如果预算砍半，你保留什么、放弃什么？如果短期 ROI 不好但战略上重要，如何争取资源？",
          deepAsk: "如果你负责的方向连续两个季度没有指标起色，你会继续、收缩还是停掉？阈值是什么？",
          quickCheck: "请用客户价值、收入影响、风险成本三个维度给当前项目排优先级。",
          chain: "能量化取舍 -> 追问一年内优先改变什么；无法量化 -> 追问客户价值、成本和止损阈值",
          scorecard: "战略思维 /5；商业洞察 /5；资源取舍 /5；领导力潜力 /5",
          green: "能用客户价值、业务指标、风险等级和投入产出解释选择",
          red: "只表达主观偏好，遇到预算和方向冲突时只做被动执行",
          skip: "不需要追问基础工具使用或简历细枝末节。",
          handoff: "输出是否建议 Offer、建议职级、需补充验证和入职后使用建议",
        },
      ];

      return roleModules
        .map((role) => `### ${role.title}

    | 模块 | 内容 |
    | --- | --- |
    | 角色目标 | ${role.goal} |
    | 候选人画像 | ${role.portrait} |
    | 必问问题 | ${role.mustAsk} |
    | 深挖问题 | ${role.deepAsk} |
    | 快速验证问题 | ${role.quickCheck} |
    | 追问链 | ${role.chain} |
    | 评分卡 | ${role.scorecard} |
    | 绿灯信号 | ${role.green} |
    | 红灯信号 | ${role.red} |
    | 本角色不需要看的内容 | ${role.skip} |
    | 给下一位面试官的话 | ${role.handoff} |`)
        .join("\n\n");
    }

    function buildInterviewHandoffCard(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const recommendation = buildInterviewerRecommendation(gate);
      const matchedRows = rows.filter((row) => !row.isMissing).slice(0, 3);
      const missingRows = rows.filter((row) => row.isMissing).slice(0, 3);
      return `| 传递字段 | 填写内容 |
    | --- | --- |
    | 本轮面试官角色 | HR / 技术架构 / 产品负责人 / 项目推进 / 业务负责人 / 决策层 |
    | 已验证通过 | ${matchedRows.map((row) => row.capability).join("、") || "待面试后填写"} |
    | 需要下一轮验证 | ${missingRows.map((row) => row.capability).join("、") || "失败复盘、指标口径、真实角色"} |
    | 新增发现 | 面试中发现的新亮点、新风险、动机变化或 Offer 约束 |
    | 本轮评分 | /5；评分理由必须写明关键证据 |
    | 是否建议进入下一轮 | ${recommendation.level}；${recommendation.action} |
    | 给下一位面试官的话 | 请重点验证上一轮未证实的项目证据，不要重复已经通过的问题 |`;
    }

    function buildPostInterviewEvaluationTemplate(snapshot) {
      const gate = buildGateAssessment(snapshot);
      const recommendation = buildInterviewerRecommendation(gate);
      return `| 评估项 | 面试官填写 |
    | --- | --- |
    | 专业能力 | /5；关键观察： |
    | 项目经验 | /5；关键观察： |
    | 沟通协作 | /5；关键观察： |
    | 团队适配 | /5；关键观察： |
    | 成长潜力 | /5；关键观察： |
    | Offer 风险 | /5；关键观察： |
    | 综合判断 | 推荐录用 / 有条件推荐 / 不推荐；系统初始建议：${recommendation.level} |
    | 需要补充验证 | 项目闭环、指标口径、失败复盘、动机、薪资和到岗约束 |
    | 面试官备注 | 记录候选人原话、关键证据、风险信号和建议下一轮追问 |`;
    }

    function buildJdHiddenPainRows(snapshot) {
      const jd = normalizeSnapshot(snapshot).job_description || "";
      const candidates = [
        {
          phrase: "较强学习能力和抗压能力",
          pattern: /学习能力|抗压能力|压力|快速/i,
          pressure: "岗位可能存在客户临场需求、紧急版本、跨团队冲突或高频交付压力",
          prep: "准备一次高压推进、线上事故或客户冲突的复盘案例",
        },
        {
          phrase: "敏锐的产品嗅觉和创新能力",
          pattern: /产品嗅觉|创新|前瞻|探索|新功能|专利/i,
          pressure: "业务方希望候选人不只执行需求，还能主动判断机会和技术方向",
          prep: "准备一次从趋势、客户痛点或数据洞察中提出产品方向的案例",
        },
        {
          phrase: "成本、进度和质量控制",
          pattern: /成本|进度|质量|风险控制/i,
          pressure: "项目可能周期长、依赖多，失败成本高，需要强项目治理能力",
          prep: "准备里程碑、风险清单、降级方案和复盘机制案例",
        },
        {
          phrase: "深入研发一线",
          pattern: /研发一线|技术架构|技术风险|技术选型|架构/i,
          pressure: "产品经理需要与研发共同做方案取舍，而不是只写需求文档",
          prep: "准备一次技术方案取舍、架构约束或技术债治理案例",
        },
      ];
      const matched = candidates.filter((item) => item.pattern.test(jd));
      return matched.length ? matched : candidates.slice(0, 3);
    }

    function buildEvidenceChainTable(snapshot) {
      const normalized = normalizeSnapshot(snapshot);
      const rows = [
        ["简历证据", normalized.resume ? clip(normalized.resume) : "未提供简历快照", "候选人自述，需按证据等级追问"],
        ["JD 证据", normalized.job_description ? clip(normalized.job_description) : "未提供 JD 快照", "岗位要求来源"],
        ["上下文证据", normalized.company_context ? clip(normalized.company_context) : "未提供额外上下文", "公司 / 面试偏好来源"],
        ["Offer 沙盘证据", normalized.offer_constraints ? clip(normalized.offer_constraints) : "未提供 Offer / 谈薪约束", "谈判杠杆与推进风险来源"],
      ];
      return `| 证据来源 | 摘要 | 使用方式 |
    | --- | --- | --- |
    ${rows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`).join("\n")}`;
    }

    function interviewerLens(index) {
      return ["业务负责人", "产品负责人", "项目推进", "技术架构", "客户方案", "反包装验证", "决策层压力官"][index % 7];
    }

    return {
      buildInterviewerResumeBrief,
      buildDirectConclusion,
      buildConcreteJobAnalysis,
      buildCandidateThreeSecondSummary,
      buildInterviewerThreeSecondSummary,
      buildInterviewerOneMinuteDecisionBrief,
      buildCandidateAdvantageCards,
      buildInterviewerAdvantageCards,
      buildAbilityTransferAnalysis,
      buildConcreteGapTable,
      buildConcreteCandidateQuestions,
      buildCandidateRevisionAdvice,
      buildCandidateStrategyAdvice,
      buildPressureInterviewGuide,
      buildConcreteInterviewerQuestions,
      buildInterviewerRecommendation,
      buildInterviewerScorecard,
      buildInterviewerSignalTable,
      buildInterviewerFollowupPaths,
      buildInterviewerDecisionAdvice,
      buildInterviewerQuickBrief,
      buildCandidateProfile,
      buildRoleAwareInterviewerModules,
      buildInterviewHandoffCard,
      buildPostInterviewEvaluationTemplate,
      buildJdHiddenPainRows,
      buildEvidenceChainTable,
      interviewerLens,
    };
  }

  global.OfferAgentReportContentHelpers = {
    createReportContentHelpers,
  };
})(typeof window !== "undefined" ? window : globalThis);
