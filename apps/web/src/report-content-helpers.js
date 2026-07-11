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
      translateGateResult = (value) => value || "",
      translateGeneratedText = (value) => value || "",
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

    function buildInterviewerMatchSnapshot(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      if (!rows.length) return "暂无足够 JD 与简历证据判断匹配度。";
      const matchedRows = rows.filter((row) => !row.isMissing);
      const strongRows = rows.filter((row) => !row.isMissing && row.evidenceLevel <= 1);
      const weakRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 2);
      const matchPercent = Math.round((matchedRows.length / Math.max(rows.length, 1)) * 100);
      const strongPercent = Math.round((strongRows.length / Math.max(rows.length, 1)) * 100);
      const topRisk = prioritizeEvidenceRows(rows)[0] || rows[0];
      const recommendation = buildInterviewerRecommendation(buildGateAssessment(snapshot, rows));
      return `| 面试官要先判断的问题 | 当前结论 | 面试动作 |
| --- | --- | --- |
| 候选人与 JD 表面匹配度 | ${matchPercent}%（${matchedRows.length}/${rows.length} 项 JD 要求能在简历中找到线索） | 不要直接按表面匹配推进，必须用下方必问题验证真实贡献 |
| 高可信项目证据占比 | ${strongPercent}%（${strongRows.length}/${rows.length} 项为较强证据） | 高可信项继续反包装追问；弱证据项先问事实，不急着问方案深度 |
| 最大验真风险 | ${topRisk.capability || "未识别"}：${authenticityRiskReason(topRisk)} | 第一轮优先问这个点，若答不清，整体匹配度要下调 |
| 当前推进建议 | ${recommendation.level} | ${recommendation.action} |
| 本轮面试目标 | 证明候选人简历是否真实支撑 JD，而不是只听项目故事 | 每个核心问题都记录绿灯、黄灯、红灯表现和证据等级变化 |`;
    }

    function buildInterviewerMandatoryVerificationQuestions(snapshot) {
      const rows = prioritizeEvidenceRows(buildRequirementEvidenceRows(snapshot)).slice(0, 8);
      if (!rows.length) return "暂无足够 JD 与简历证据生成必问题。";
      const questionRows = rows.map((row) => {
        const question = row.verificationQuestion || `请用一个真实项目证明你具备“${row.capability}”，并按时间线还原你的个人贡献。`;
        return {
          capability: row.capability,
          evidence: row.resumeEvidence || "简历缺少明确项目证据",
          jd: row.jdEvidence || "未识别到 JD 原文",
          question,
          reason: interviewerQuestionReason(row),
          green: interviewerGreenSignal(row),
          yellow: interviewerYellowSignal(row),
          red: interviewerRedSignal(row),
          action: interviewerActionByAnswer(row),
        };
      });
      questionRows.push({
        capability: "反包装总问",
        evidence: "所有写了负责 / 主导 / 推动 / 结果数据的经历",
        jd: "用于验证所有 JD 核心职责的真实性",
        question: "请任选简历里最能证明匹配 JD 的一个项目，现场画出时间线、你的交付物、关键决策、指标口径、失败点和复盘改动。",
        reason: "高匹配简历也可能过度包装；现场还原能验证候选人是否真的参与过核心过程。",
        green: "能自然说出顺序、角色边界、协作对象、口径来源和失败细节，前后逻辑一致。",
        yellow: "能讲大概过程，但关键数据、决策人或个人交付物需要反复提示。",
        red: "只能复述简历词语，讲不清时间线、指标来源、失败细节或谁拍板。",
        action: "红灯则下调证据等级；必要时要求候选人补充项目材料或安排更懂该领域的面试官复核。",
      });
      return `| 必问题 | 对应 JD / 简历证据 | 为什么必须问 | 绿灯表现说明 | 黄灯表现说明 | 红灯 / 造假风险信号 | 面试官下一步 |
| --- | --- | --- | --- | --- | --- | --- |
${questionRows.map((item) => `| ${item.question} | JD：${item.jd}<br>简历：${item.evidence} | ${item.reason} | ${item.green} | ${item.yellow} | ${item.red} | ${item.action} |`).join("\n")}`;
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
      if (getLanguage() === "en") {
        const strengthConclusion = topStrength
          ? `${translateCapability(topStrength.capability)}: ${topStrength.resumeEvidence}`
          : "No clear differentiated advantage identified yet";
        const riskConclusion = topRisk
          ? `${translateCapability(topRisk.capability)}: ${topRisk.isMissing ? "Evidence gap" : translateGeneratedText(topRisk.evidenceLevelLabel, "en")}`
          : "Pending validation";
        return `| Review item | Conclusion | Candidate action |
    | --- | --- | --- |
    | Core fit | ${matchRate}%; ${translateGateResult(gate.result)} | Avoid generic fit claims; lead with the project loop closest to the JD. |
    | Differentiated advantage | ${strengthConclusion} | Guide the interview toward this project and explain the problem, trade-offs, execution, and result. |
    | Largest risk | ${riskConclusion} | Prepare metric definitions, personal contribution, failure retrospectives, or an honest transfer narrative. |
    | Tonight's priority | Close the highest-risk evidence gap instead of covering everything. | Draw one project flow, list three key decisions, and add one set of verifiable metrics. |
    | Negotiation / motivation | ${translateOfferRating(offerLeverage.rating)}: ${translateGeneratedText(offerLeverage.summary, "en")} | Tie expectations to responsibility scope, quantified contribution, and start-date certainty. |`;
      }
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
      if (getLanguage() === "en") {
        return `| Advantage | Evidence | How to guide the interview | Risk reminder |
    | --- | --- | --- | --- |
    ${sourceRows.map((row, index) => {
      const intro = index === 0
        ? "Lead with this project in the first 30 seconds and invite a deep dive into your strongest evidence."
        : "Use it as a supporting example to show the capability is not an isolated skill.";
      const risk = row.isMissing
        ? "This is only a potential advantage; do not claim ownership before adding real project evidence."
        : "Do not rely on team outcomes. State your actions, decision authority, and result attribution.";
      return `| ${translateCapability(row.capability)} | ${row.resumeEvidence} | ${intro} | ${risk} |`;
    }).join("\n")}`;
      }
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
      return `| 面试官可能会问 | 为什么会问 | 怎么回答 | 可直接套用的开头 | 不要这样答 |
    | --- | --- | --- | --- | --- |
    ${rows.map((row) => {
      const unclear = candidateUnclearPoint(row);
      return `| 请用一个项目证明你具备“${row.capability}” | JD 明确需要该能力；当前简历问题是：${unclear} | 按“背景和约束 -> 我的职责边界 -> 关键动作 / 取舍 -> 结果口径 -> 复盘”回答；证据等级：${row.evidenceLevelLabel} | “我用【项目名】说明。当时的问题是【背景】，我负责【边界】，核心动作有三步：【动作1/2/3】，结果用【指标或验收】验证。” | 只说负责 / 参与 / 推动；讲不清个人动作、指标来源或失败细节 |
    `;
    }).join("")}| 你在项目里到底做了什么，不是团队做了什么？ | 面试官要判断简历是否过度包装、是否把团队成果写成个人成果 | 拆成“我决策 / 我推进 / 我交付 / 我协作 / 团队贡献”五类，主动说明边界 | “这个结果是团队共同完成的，我个人主要负责【模块】，我的可验证交付物是【交付物】。” | “大家一起做的，我主要配合”；或者把所有结果都说成自己主导 |
    | 这个结果的数据从哪里来，怎么证明不是偶然？ | 面试官要验证指标口径和结果归因 | 说清统计周期、基线、样本、数据来源、你动作与结果之间的关系，不能证明因果时要承认边界 | “这个数字来自【系统/复盘/客户反馈】，统计周期是【时间】，我能确认的是【相对变化/采用/验收】，不能完全归因的部分是【边界】。” | 编一个精确数字；把交付完成直接说成业务增长 |
    | 请复盘一次项目延期、失败、线上故障或客户异议 | 面试官要看风险处理、复盘能力和诚实度 | 按时间线讲发现、止血、分工、根因、影响、整改和后续机制变化 | “这次不算成功，问题出在【原因】。我当时先做【止血】，再推动【根因分析】，最后改了【机制】。” | “我没有失败案例”；把问题全推给研发、客户或外部环境 |
    | 如果入职后遇到 JD 中你没做过的“${rows.find((row) => row.isMissing)?.capability || rows[0]?.capability || "关键能力"}”，你怎么补齐？ | 当前简历存在缺口，面试官会验证学习和迁移能力 | 诚实承认没直接做过，讲相邻经验、差异、30 天补齐计划和可交付结果 | “这点我没有直接把它做完整，但我有相邻经验【经历】。差异在【差异】，入职前 30 天我会用【方法】补齐，并产出【交付物】。” | 直接声称做过但无法还原细节 |`;
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
      const plan = candidateRewritePlan(row, snapshot);
      return `| ${priority}：${row.capability} | 针对“${problem}”，${plan.nightAction} | ${plan.artifact} | ${row.isMissing ? "这是 JD 缺证项，可能直接影响推进" : "可把现有证据从低可信提升为高可信"} |`;
    }).join("\n")}`;
    }

    function buildCandidateJdGapActionTable(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const focusRows = prioritizeEvidenceRows(rows).slice(0, 8);
      const context = buildCandidateRewriteContext(rows);
      return `| JD 要求 | 当前简历证据 | 事实状态 | 具体差距 | 严重程度 | 修改动作 |
    | --- | --- | --- | --- | --- | --- |
    ${focusRows.map((row) => {
      const plan = candidateRewritePlan(row, snapshot, context);
      return `| ${row.capability} | ${row.resumeEvidence || "简历未提供明确证据"} | ${candidateFactStatusLabel(row)} | ${plan.gap} | ${candidateGapSeverity(row)} | ${plan.action} |`;
    }).join("\n")}`;
    }

    function buildCandidateTruthfulnessGate(snapshot) {
      const rows = prioritizeEvidenceRows(buildRequirementEvidenceRows(snapshot)).slice(0, 8);
      if (!rows.length) return "暂无足够证据生成事实状态表。";
      return `| 内容 | 事实状态 | 能否进入可投递简历 | 候选人下一步 |
    | --- | --- | --- | --- |
    ${rows.map((row) => {
      const status = candidateFactStatus(row);
      const canUse = status === "confirmed" ? "可以，但建议补强口径" : "暂不建议直接写进最终版";
      return `| ${row.resumeEvidence || row.capability || "未识别内容"} | ${candidateFactStatusLabel(row)} | ${canUse} | ${candidateFactNextStep(row)} |`;
    }).join("\n")}`;
    }

    function buildCandidateScorecard(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const scores = buildCandidateScores(rows, snapshot);
      return `| 评分项 | 得分 | 主要依据 | 补分动作 |
    | --- | ---: | --- | --- |
    ${scores.map((item) => `| ${item.name} | ${item.score}/100 | ${item.reason} | ${item.action} |`).join("\n")}

> 分数只诊断当前材料质量，不代表 ATS 通过率、面试概率或录用概率。`;
    }

    function buildCandidateMatchSnapshot(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      if (!rows.length) return "暂无足够 JD 与简历证据计算匹配度。";
      const matchedRows = rows.filter((row) => !row.isMissing);
      const confirmedRows = rows.filter((row) => candidateFactStatus(row) === "confirmed");
      const unclearRows = prioritizeEvidenceRows(rows).filter((row) => row.isMissing || row.evidenceLevel >= 2 || candidateFactStatus(row) !== "confirmed");
      const matchPercent = Math.round((matchedRows.length / Math.max(rows.length, 1)) * 100);
      const evidencePercent = Math.round((confirmedRows.length / Math.max(rows.length, 1)) * 100);
      const strongest = confirmedRows[0] || matchedRows[0] || rows[0];
      const topGap = unclearRows[0] || rows[0];

      return `| 候选人最关心的问题 | 当前结论 | 该怎么改 |
| --- | --- | --- |
| 与当前 JD 的表面匹配度 | ${matchPercent}%（${matchedRows.length}/${rows.length} 项 JD 要求在简历中找到线索） | 不要只看表面匹配，优先把低可信线索补成可复核项目证据 |
| 可直接写进简历的证据占比 | ${evidencePercent}%（${confirmedRows.length}/${rows.length} 项为较可信事实） | 只有已确认事实可以进入最终投递版；待确认内容先回答追问 |
| 最强可前置经历 | ${strongest?.resumeEvidence || strongest?.capability || "暂无明确强证据"} | 放到个人摘要和第一段项目经历前两行，补结果口径和个人边界 |
| 最影响匹配的缺口 | ${topGap?.capability || "暂无明确缺口"}：${candidateUnclearPoint(topGap)} | 先按下方“逐项改简历工作单”补事实，再改写简历 |
| 修改顺序 | 先补 ${unclearRows.slice(0, 3).map((row) => row.capability).join("、") || "指标口径、个人贡献、复盘"} | P0 补 JD 必达项，P1 补指标和个人动作，P2 补面试复盘与沟通话术 |`;
    }

    function buildCandidateResumeRevisionWorkbench(snapshot) {
      const rows = prioritizeEvidenceRows(buildRequirementEvidenceRows(snapshot)).slice(0, 8);
      if (!rows.length) return "暂无可生成的逐项改简历工作单。";
      const normalized = normalizeSnapshot(snapshot);
      const roleId = normalized.target_role || snapshot.target_role || snapshot.targetRole || "product_manager";
      const context = buildCandidateRewriteContext(rows);
      return `| JD 要求 | 匹配度 | 没写清楚的地方 | 当前简历原句 | 建议改成 | 还要补什么才能定稿 |
| --- | --- | --- | --- | --- | --- |
${rows.map((row) => {
  const plan = candidateRewritePlan(row, snapshot, context);
  return `| ${row.capability} | ${candidateRequirementMatchLabel(row)} | ${candidateUnclearPoint(row)} | ${row.resumeEvidence || "当前简历没有对应表述"} | ${buildCandidateReplacementSentence(row, plan, roleId)} | ${candidateRequiredFactsForFinal(row, plan)} |`;
}).join("\n")}`;
    }

    function buildCandidateFinalResumeChecklist(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const unclearRows = prioritizeEvidenceRows(rows).filter((row) => row.isMissing || row.evidenceLevel >= 2 || candidateFactStatus(row) !== "confirmed").slice(0, 5);
      const confirmedRows = rows.filter((row) => candidateFactStatus(row) === "confirmed");
      return `| 定稿检查项 | 是否达标 | 候选人操作 |
| --- | --- | --- |
| 第一屏是否对齐 JD | ${confirmedRows.length ? "部分达标" : "未达标"} | 个人摘要第一句写目标岗位，第二句写最贴近 JD 的项目证据 |
| 每个 JD 核心要求是否有证据 | ${unclearRows.length ? "仍有缺口" : "基本达标"} | 缺口：${unclearRows.map((row) => row.capability).join("、") || "暂无明显缺口"} |
| 是否写清个人贡献 | ${rows.some((row) => !hasContributionSignal(row.resumeEvidence)) ? "需补强" : "基本达标"} | 每条经历补“我负责什么、我做了什么、谁协作、结果归谁” |
| 是否有结果口径 | ${rows.some((row) => !hasMetricSignal(row.resumeEvidence)) ? "需补强" : "基本达标"} | 没有数字时写验收、采用、交付、客户反馈或区间估算，不能编数字 |
| 是否能应对面试追问 | ${rows.some((row) => !hasReviewSignal(row.resumeEvidence)) ? "需补强" : "基本达标"} | 每个核心项目准备一次失败、取舍、延期、异议或复盘 |
| 是否可以直接投递 | ${unclearRows.length ? "暂不建议直接投递" : "可以进入最终润色"} | 待确认内容回答完再生成最终版；不要把【】占位留在简历里 |`;
    }

    function buildCandidateMaterialQuestions(snapshot) {
      const rows = prioritizeEvidenceRows(buildRequirementEvidenceRows(snapshot)).slice(0, 8);
      if (!rows.length) return "暂无可追问的材料缺口。";
      const questions = rows.flatMap((row) => candidateMaterialQuestionsForRow(row)).slice(0, 8);
      return questions.length
        ? questions.map((question, index) => `${index + 1}. ${question}`).join("\n")
        : "当前材料暂未识别到必须补充的问题。";
    }

    function buildCandidateContributionVerbAudit(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const audited = rows
        .map((row) => ({ row, audit: contributionVerbAudit(row) }))
        .filter((item) => item.audit.verb || item.audit.risk !== "低")
        .slice(0, 6);
      if (!audited.length) return "当前简历没有识别到明显贡献动词风险，但仍建议逐条补清个人边界。";
      return `| 简历表述 | 当前动词 | 风险 | 建议动词 / 写法 | 需要补的证据 |
    | --- | --- | --- | --- | --- |
    ${audited.map(({ row, audit }) => `| ${row.resumeEvidence || "未提供明确表述"} | ${audit.verb || "未识别"} | ${audit.risk} | ${audit.recommendation} | ${audit.requiredEvidence} |`).join("\n")}`;
    }

    function buildCandidateOptimizedResumeDraft(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const confirmedRows = prioritizeEvidenceRows(rows).filter((row) => candidateFactStatus(row) === "confirmed").slice(0, 5);
      const fallbackRows = prioritizeEvidenceRows(rows).slice(0, 3);
      const sourceRows = confirmedRows.length ? confirmedRows : fallbackRows;
      if (!sourceRows.length) return "暂无足够事实生成 JD 定制简历草稿。请先补充简历和 JD。";
      const normalized = normalizeSnapshot(snapshot);
      const roleId = normalized.target_role || snapshot.target_role || snapshot.targetRole || "product_manager";
      const roleName = candidateRoleLabel(roleId);
      const context = buildCandidateRewriteContext(rows);
      const summary = buildCandidateFinalSummary(roleId, roleName, sourceRows, normalized);
      const projectRows = sourceRows
        .map((row, index) => candidateFinalResumeBullet(row, candidateRewritePlan(row, snapshot, context), roleId, index))
        .join("\n");
      const skillLine = buildCandidateSkillLine(roleId, rows);
      const pendingNotice = rows.some((row) => candidateFactStatus(row) !== "confirmed")
        ? "\n> 注意：以下草稿只把较可信证据写成确定表达；待确认内容请先回答上方追问，再进入最终投递版。"
        : "";

      return `${pendingNotice}

### 个人摘要

${summary}

### 工作 / 项目经历

${projectRows}

### 技能与关键词

- ${skillLine}

### 修改说明

| 简历模块 | 本次调整 | 对应 JD 价值 |
| --- | --- | --- |
| 个人摘要 | 前置 ${roleName} 相关能力和最强证据，删除无证据自评 | 让 HR 10 秒内判断方向是否匹配 |
| 经历排序 | 优先呈现 ${sourceRows.slice(0, 3).map((row) => row.capability).join("、")} | 把 JD 高相关能力放到第一屏 |
| 事实边界 | 待确认事实不写成确定成果，强动词按证据降级 | 降低面试追问和背调风险 |`;
    }

    function buildCandidateAtsPlainTextResume(snapshot) {
      const rows = prioritizeEvidenceRows(buildRequirementEvidenceRows(snapshot));
      const confirmedRows = rows.filter((row) => candidateFactStatus(row) === "confirmed").slice(0, 5);
      const sourceRows = confirmedRows.length ? confirmedRows : rows.slice(0, 4);
      if (!sourceRows.length) return "暂无足够事实生成 ATS 纯文本版。";
      const normalized = normalizeSnapshot(snapshot);
      const roleId = normalized.target_role || snapshot.target_role || snapshot.targetRole || "product_manager";
      const roleName = candidateRoleLabel(roleId);
      const skills = buildCandidateSkillLine(roleId, rows);
      const bullets = sourceRows
        .map((row) => `- ${plainTextResumeBullet(row, roleId)}`)
        .join("\n");

      return `目标岗位：${roleName}

个人摘要
${stripMarkdown(buildCandidateFinalSummary(roleId, roleName, sourceRows, normalized))}

工作经历 / 项目经历
${bullets}

技能
${skills}

补充说明
- 所有【】占位均需替换为候选人确认的真实事实。
- 待确认、模型推断和无证据内容不应进入 ATS 投递版。
- 建议使用纯文本或单栏文档，不依赖图片、复杂表格、图标或文本框。`;
    }

    function buildCandidateHrPitch(snapshot) {
      const rows = prioritizeEvidenceRows(buildRequirementEvidenceRows(snapshot));
      const confirmedRows = rows.filter((row) => candidateFactStatus(row) === "confirmed");
      const sourceRows = (confirmedRows.length ? confirmedRows : rows).slice(0, 3);
      if (!sourceRows.length) return "暂无足够材料生成 HR 摘要。";
      const normalized = normalizeSnapshot(snapshot);
      const roleId = normalized.target_role || snapshot.target_role || snapshot.targetRole || "product_manager";
      const roleName = candidateRoleLabel(roleId);
      const strongest = sourceRows[0];
      const gap = rows.find((row) => row.isMissing || candidateFactStatus(row) !== "confirmed");
      return `| 场景 | 可复制内容 |
| --- | --- |
| HR 10 秒摘要 | 候选人目标方向为${roleName}，当前最贴近 JD 的证据是“${strongest.resumeEvidence || strongest.capability}”。建议第一屏突出${sourceRows.map((row) => row.capability).join("、")}，并补清指标来源和个人边界。 |
| Boss 直聘开场白 | 你好，我关注到岗位重点是${sourceRows.map((row) => row.capability).slice(0, 2).join("、")}。我过往有“${strongest.resumeEvidence || "相关项目经历"}”经验，已整理可复盘项目细节，也愿意补充${gap ? gap.capability : "指标口径和协作边界"}相关材料，想进一步了解岗位负责范围。 |
| 猎头转发简介 | 候选人定位：${roleName}；核心匹配点：${sourceRows.map((row) => row.capability).join("、")}；代表证据：${strongest.resumeEvidence || "待补充项目证据"}；当前风险：${gap ? `${gap.capability} 仍需确认事实或补证` : "主要风险为指标口径和贡献边界需面试复核"}。 |
| 内推摘要 | 推荐关注候选人与 JD 的交集：${sourceRows.map((row) => row.capability).join("、")}。面试前建议让候选人补充结果口径、个人贡献和复盘案例，避免只看职责描述。 |`;
    }

    function buildCandidateMetricPromptTable(snapshot) {
      const rows = prioritizeEvidenceRows(buildRequirementEvidenceRows(snapshot)).slice(0, 6);
      if (!rows.length) return "暂无可生成的指标追问。";
      const normalized = normalizeSnapshot(snapshot);
      const roleId = normalized.target_role || snapshot.target_role || snapshot.targetRole || "product_manager";
      const metrics = candidateMetricDictionary(roleId);
      return `| JD 能力 | 推荐追问指标 | 不能直接写入简历的原因 | 候选人应确认 |
| --- | --- | --- | --- |
${rows.map((row, index) => {
  const metric = metrics[index % metrics.length];
  return `| ${row.capability} | ${metric.name} | 指标只是追问方向，不能自动生成数字 | ${metric.probe}；同时确认周期、基线、来源、个人贡献和是否可公开 |`;
}).join("\n")}`;
    }

    function buildCandidateResumeRewriteTable(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const focusRows = prioritizeEvidenceRows(rows).slice(0, 6);
      const context = buildCandidateRewriteContext(rows);
      return `| 当前简历写法 | 问题 | 推荐改法模板 | 需要补充的真实信息 | 不要这样写 |
    | --- | --- | --- | --- | --- |
    ${focusRows.map((row) => {
      const current = row.resumeEvidence || "暂无对应简历表述";
      const plan = candidateRewritePlan(row, snapshot, context);
      return `| ${current} | ${plan.gap} | ${plan.template} | ${plan.facts} | ${plan.avoid} |`;
    }).join("\n")}`;
    }

    function buildCandidateRewrittenResumeReference(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot);
      const focusRows = prioritizeEvidenceRows(rows).slice(0, 4);
      if (!focusRows.length) return "暂无足够 JD 与简历证据生成改写参考稿。";
      const normalized = normalizeSnapshot(snapshot);
      const roleId = normalized.target_role || snapshot.target_role || snapshot.targetRole || "product_manager";
      const roleName = candidateRoleLabel(roleId);
      const context = buildCandidateRewriteContext(rows);
      const summary = buildCandidateSummaryReference(roleId, roleName, focusRows, normalized);
      const projectBullets = focusRows
        .map((row, index) => buildCandidateProjectReference(row, candidateRewritePlan(row, snapshot, context), roleId, index))
        .join("\n\n");
      const confirmedRows = focusRows.filter((row) => candidateFactStatus(row) === "confirmed");
      const pendingRows = focusRows.filter((row) => candidateFactStatus(row) !== "confirmed");
      const confirmedReplacementRows = (confirmedRows.length ? confirmedRows : focusRows.slice(0, 1))
        .map((row) => {
          const plan = candidateRewritePlan(row, snapshot, context);
          return `| ${row.resumeEvidence || "简历未提供对应表述"} | ${buildCandidateReplacementSentence(row, plan, roleId)} | ${plan.facts} |`;
        })
        .join("\n");
      const pendingReplacementRows = pendingRows
        .map((row) => {
          const plan = candidateRewritePlan(row, snapshot, context);
          return `| ${row.resumeEvidence || row.capability || "简历未提供对应表述"} | ${candidateFactStatusLabel(row)} | ${buildCandidateReplacementSentence(row, plan, roleId)} | ${plan.facts} |`;
        })
        .join("\n");

      return `> 以下是“改写后长什么样”的参考稿，不是让候选人编造经历。请把【】里的内容替换成真实项目、真实数据、真实协作对象；没有经历的地方按“相邻经验 + 补齐计划”诚实表达。

### 个人摘要参考

${summary}

### 项目经历参考写法

${projectBullets}

### 可直接使用的原句（仍需替换【】占位）

| 原简历表述 | 建议替换成 | 候选人必须补的真实信息 |
| --- | --- | --- |
${confirmedReplacementRows}

### 需确认后才能使用的原句

| 原简历表述 / 缺口 | 当前事实状态 | 可选改写方向 | 必须先确认 |
| --- | --- | --- | --- |
${pendingReplacementRows || "| 暂无 | 已确认事实较多 | 可继续补强指标口径 | 指标来源、个人贡献、复盘细节 |"}`;
    }

    function buildCandidateEvidencePatchCards(snapshot) {
      const allRows = buildRequirementEvidenceRows(snapshot);
      const rows = prioritizeEvidenceRows(allRows).slice(0, 3);
      const context = buildCandidateRewriteContext(allRows);
      if (!rows.length) return "暂无可生成的补证项。";
      return rows.map((row, index) => {
        const plan = candidateRewritePlan(row, snapshot, context);
        return `### 补证 ${index + 1}：${row.capability}

| 项目 | 内容 |
| --- | --- |
| 对应 JD | ${row.jdEvidence || "未识别到明确 JD 证据"} |
| 你现在缺什么 | ${plan.gap} |
| 要补的事实 | ${plan.facts} |
| 简历修改方向 | ${plan.action} |
| 面试中怎么讲 | ${plan.interview} |
| 如果没有真实经历 | ${plan.noExperience} |`;
      }).join("\n\n");
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

    function buildInterviewerAuthenticityRiskTable(snapshot) {
      const rows = prioritizeEvidenceRows(buildRequirementEvidenceRows(snapshot)).slice(0, 7);
      return `| 简历项目 / 能力 | 可疑点 | 为什么可疑 | 验真问题 | 好回答信号 | 风险回答信号 |
    | --- | --- | --- | --- | --- | --- |
    ${rows.map((row) => `| ${row.capability} | ${authenticityRiskType(row)} | ${authenticityRiskReason(row)} | ${row.verificationQuestion || `请按时间线还原“${row.capability}”相关项目中的个人贡献。`} | 能说清时间线、本人交付物、指标口径、协作对象、失败复盘和归因边界 | 只说负责 / 参与 / 推动，讲不清个人动作、指标分母、失败细节或谁做决策 |`).join("\n")}`;
    }

    function buildInterviewerJdDepthProbeTable(snapshot) {
      const rows = buildRequirementEvidenceRows(snapshot).slice(0, 7);
      return `| JD 要求 | 简历证据 | 需要验证的理解深度 | 起手问题 | 深挖问题 | 不合格信号 |
    | --- | --- | --- | --- | --- | --- |
    ${rows.map((row) => `| ${row.capability} | ${row.resumeEvidence || "缺少明确简历证据"} | ${jdDepthFocus(row)} | ${row.verificationQuestion || `请用一个项目证明你理解“${row.capability}”。`} | ${jdDepthFollowup(row)} | ${jdDepthFailSignal(row)} |`).join("\n")}`;
    }

    function buildInterviewerPotentialSignalsTable(snapshot) {
      const normalized = normalizeSnapshot(snapshot);
      const rows = buildRequirementEvidenceRows(snapshot);
      const weakest = prioritizeEvidenceRows(rows)[0] || rows[0] || {};
      const resumeText = `${normalized.resume || ""} ${normalized.company_context || ""}`;
      const potentialRows = [
        {
          dimension: "学习速度",
          clue: findEvidence(resumeText, ["学习", "自学", "快速", "新领域", "从 0", "0-1"]) || "简历未提供明确学习速度证据",
          question: `请讲一次你在短时间内补齐${weakest.capability || "关键能力"}并交付结果的经历。`,
          high: "能说明学习路径、验证方式、产出物和复盘迭代",
          low: "只说学习能力强，无法说明如何验证学习效果",
        },
        {
          dimension: "抽象能力",
          clue: findEvidence(resumeText, ["框架", "方法论", "机制", "体系", "模型", "标准"]) || "方法沉淀证据不足",
          question: "请把你最复杂项目抽象成 3 个可复用方法，并说明适用边界。",
          high: "能从具体项目提炼原则，并说清不适用场景",
          low: "只能复述项目过程，无法抽象方法或边界",
        },
        {
          dimension: "复盘能力",
          clue: findEvidence(resumeText, ["复盘", "失败", "延期", "故障", "整改", "优化"]) || "失败复盘证据不足",
          question: "请复盘一次失败、延期或判断错误，并说明后续机制变化。",
          high: "能承认问题、定位根因、给出机制性改进",
          low: "没有失败案例，或把问题完全归因给外部",
        },
        {
          dimension: "复杂问题拆解",
          clue: findEvidence(resumeText, ["拆解", "优先级", "取舍", "资源", "成本", "质量"]) || "复杂取舍证据不足",
          question: "如果资源砍半，你会如何重排优先级？请给出保留 / 延后 / 放弃清单。",
          high: "能用客户价值、风险、成本和收益排序",
          low: "只说沟通协调，无法给出取舍标准",
        },
        {
          dimension: "主动性",
          clue: findEvidence(resumeText, ["主导", "推动", "发起", "负责", "牵头", "落地"]) || "主动发起证据不足",
          question: "请讲一次不是别人明确分配、但你主动推动的问题。",
          high: "能说明发现问题、争取资源、推动落地和结果",
          low: "所有经历都来自被动执行或上级安排",
        },
      ];
      return `| 潜力维度 | 简历线索 | 面试验证问题 | 高潜信号 | 低潜信号 |
    | --- | --- | --- | --- | --- |
    ${potentialRows.map((row) => `| ${row.dimension} | ${row.clue} | ${row.question} | ${row.high} | ${row.low} |`).join("\n")}`;
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

    function prioritizeEvidenceRows(rows) {
      return [...(rows || [])].sort((a, b) => {
        const missingDelta = Number(Boolean(b.isMissing)) - Number(Boolean(a.isMissing));
        if (missingDelta) return missingDelta;
        return Number(b.evidenceLevel || 0) - Number(a.evidenceLevel || 0);
      });
    }

    function buildCandidateRewriteContext(rows) {
      const evidenceCounts = new Map();
      (rows || []).forEach((row) => {
        const key = normalizeEvidenceKey(row.resumeEvidence);
        if (!key) return;
        evidenceCounts.set(key, (evidenceCounts.get(key) || 0) + 1);
      });
      return { evidenceCounts };
    }

    function normalizeEvidenceKey(value) {
      const key = String(value || "").replace(/\s+/g, " ").trim();
      if (!key || /未提供|未体现|缺少|暂无|Missing/i.test(key)) return "";
      return key;
    }

    function applyEvidenceReuseWarning(plan, row, context = {}) {
      const key = normalizeEvidenceKey(row.resumeEvidence);
      const reuseCount = key ? context.evidenceCounts?.get(key) || 0 : 0;
      if (reuseCount <= 1) return plan;
      return {
        ...plan,
        gap: `${plan.gap}；同一段简历证据被复用到 ${reuseCount} 条 JD 要求，说明当前经历写得太笼统，需要拆成不同能力证据`,
        action: `${plan.action}；不要继续用同一句经历覆盖多条 JD，要为这一条单独补“场景-动作-结果”`,
        facts: `${plan.facts}；同时说明这条经历和其他 JD 能力的区别，避免一段话包打天下`,
      };
    }

    function developerCandidateRewritePlan(row) {
      const capability = `${row.capability || ""}`;
      const text = `${row.capability || ""} ${row.jdEvidence || ""} ${row.resumeEvidence || ""}`;
      const baseGap = candidateGapType(row);
      if (/编程语言与工程实现/.test(capability) || (!capability && /编程|工程实现|语言|接口|API|开发|编码|Java|Go|Python|前端|后端/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少具体模块、代码边界、接口职责和你亲自实现的关键逻辑`,
          action: "把开发经历写成一个可复核模块：你写了哪个模块、解决什么边界问题、改动了哪些接口或数据结构、结果如何验证",
          template: "原：负责后端开发。改：在【系统 / 模块】中，我实现【接口 / 服务 / 数据结构】，处理【并发 / 一致性 / 边界校验】问题，通过【单测 / 压测 / 线上指标】验证【结果】。",
          facts: "补充模块名、核心接口、技术栈、代码边界、异常场景、测试方式、上线指标",
          avoid: "不要只列 Java / Go / MySQL 技能；没有亲自写的模块，不要写成独立负责",
          nightAction: "补一张模块实现卡：模块职责、接口输入输出、关键逻辑、异常处理和测试结果",
          artifact: "接口说明、核心流程图、单测 / 压测记录、上线指标截图或日志摘要",
          interview: "按模块边界讲：为什么这么拆、你写了哪段、如何处理异常、怎么证明它稳定",
          noExperience: "如果没有完整模块 Owner 经历，写清你负责的子模块、PR、Bug 修复或接口改造边界",
        });
      }
      if (/系统设计与架构理解/.test(capability) || (!capability && /系统设计|架构|微服务|分布式|缓存|消息队列|数据库|高并发/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少架构取舍、容量估算、数据流和演进成本说明`,
          action: "把架构经历写成一次设计取舍：原问题、备选方案、为什么选这个、代价是什么、如何灰度和回滚",
          template: "原：参与系统架构设计。改：针对【高并发 / 数据一致性 / 服务拆分】问题，我比较【方案 A/B】，选择【方案】并承担【模块 / 接口】实现，解决【瓶颈】，代价是【技术债 / 复杂度】，通过【指标】验证。",
          facts: "补充 QPS / 数据量 / 延迟目标、方案对比、接口边界、容量估算、灰度回滚和技术债",
          avoid: "不要只写“微服务架构”“分布式系统”；说不出取舍和代价就不要写成架构能力",
          nightAction: "补一张架构取舍卡：现状瓶颈、方案对比、选型理由、风险和验证指标",
          artifact: "架构图、容量估算表、接口边界、灰度计划、性能指标",
          interview: "先画数据流和依赖，再讲方案取舍、扩展瓶颈、失败预案和你负责的部分",
          noExperience: "如果只是参与架构评审，就写“参与评审并负责某模块落地”，不要写成主导架构",
        });
      }
      if (/代码质量与测试习惯/.test(capability) || (!capability && /测试|代码质量|Code Review|单元测试|CI|重构|覆盖率/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少测试策略、缺陷预防和代码质量度量`,
          action: "把质量经历写成一次缺陷预防：发现什么质量问题，补了什么测试或 Review 规则，缺陷率如何变化",
          template: "原：重视代码质量。改：在【模块】中，我补充【单测 / 集成测试 / Code Review checklist】，覆盖【关键分支】，将【缺陷 / 回归 / 发布阻塞】从【前】降到【后】。",
          facts: "补充测试类型、覆盖范围、Review 规则、缺陷数据、CI 阻断或回归案例",
          avoid: "不要只写“有良好编码习惯”；需要拿出测试、Review 或质量指标",
          nightAction: "补一条质量改进案例：问题、规则、测试覆盖、缺陷变化",
          artifact: "测试用例清单、Review checklist、CI 记录、缺陷趋势",
          interview: "讲清哪些风险以前会漏掉，你如何用测试或流程把它挡住",
          noExperience: "如果没有体系化质量建设，写具体一次 Bug 修复后补测试和防回归动作",
        });
      }
      if (/问题排查与线上稳定性/.test(capability) || (!capability && /排查|故障|线上|监控|日志|告警|回滚|稳定性|incident/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少事故时间线、定位路径、止血动作和长期修复`,
          action: "把排障经历写成一条事故复盘：告警是什么、怎么定位、如何止血、根因是什么、后续怎么防再发",
          template: "原：负责线上问题排查。改：在【故障】中，我通过【日志 / 监控 / 链路追踪】定位【根因】，先用【止血动作】恢复，再通过【长期修复】将【指标】从【前】优化到【后】。",
          facts: "补充告警时间线、影响范围、定位命令或日志线索、回滚 / 降级动作、根因和复盘改进",
          avoid: "不要只写“处理线上故障”；没有根因和后续机制，可信度很低",
          nightAction: "补一份事故复盘：发现、定位、止血、根因、修复、防再发",
          artifact: "事故时间线、日志片段、监控图、复盘文档、修复 PR",
          interview: "按分钟级时间线讲，重点说明你如何排除假设和推动长期修复",
          noExperience: "如果没有生产事故，写一次复杂 Bug 定位或压测问题排查，但说明它不是线上事故",
        });
      }
      if (/性能、安全与可维护性/.test(capability) || (!capability && /性能|安全|可维护|延迟|吞吐|QPS|权限|观测/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少性能瓶颈、安全边界或可维护性改进的量化证据`,
          action: "把优化经历写成一次瓶颈定位：瓶颈在哪、改了什么、指标怎么变、有什么副作用",
          template: "原：负责性能优化。改：针对【接口 / SQL / 缓存 / 权限】瓶颈，我用【profiling / explain / 压测】定位【原因】，改造【方案】，使【延迟 / 吞吐 / 错误率】从【前】变为【后】。",
          facts: "补充优化前后指标、定位工具、代码或配置改动、副作用和回滚方案",
          avoid: "不要只写“性能提升明显”；必须有前后指标和定位方法",
          nightAction: "补一张优化证据卡：瓶颈、定位工具、改动、前后指标和风险",
          artifact: "压测报告、SQL explain、profiling 结果、监控对比",
          interview: "讲清瓶颈定位链路和改动副作用，别只讲最终数字",
          noExperience: "如果没有性能优化，写一次可维护性或安全边界改造，并给出验证方式",
        });
      }
      if (/交付协作与需求理解/.test(capability) || (!capability && /需求|PRD|协作|交付|敏捷|scrum|迭代|排期|跨团队/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少需求澄清、排期承诺、跨角色协作和交付风险证据`,
          action: "把交付协作写成一次工程交付闭环：需求怎么澄清、排期怎么拆、风险怎么同步、最终如何上线",
          template: "原：参与需求沟通和项目交付。改：在【项目】中，我与【产品 / 测试 / 运维】澄清【需求边界】，拆分【开发任务 / 排期】，提前暴露【风险】，最终按【版本 / 时间】交付【结果】。",
          facts: "补充需求边界、排期拆分、协作对象、风险同步、延期或变更处理、上线结果",
          avoid: "不要只写“配合产品完成开发”；要说明你如何澄清边界和控制交付风险",
          nightAction: "补一个交付协作案例：需求边界、排期、风险、协作对象和上线结果",
          artifact: "需求澄清记录、任务拆分、排期表、风险同步记录、上线记录",
          interview: "讲清你如何把模糊需求变成可开发任务，以及风险如何提前暴露",
          noExperience: "如果没有跨团队 Owner 经历，写清你在模块内如何和产品/测试对齐边界",
        });
      }
      return makeRewritePlan({
        gap: `${baseGap}；开发岗位需要证明真实编码、系统理解、测试质量或线上稳定性，而不是泛泛项目参与`,
        action: `围绕“${row.capability}”补一个工程案例，写清代码边界、技术取舍、验证方式和线上结果`,
        template: `原：负责${row.capability}。改：在【系统 / 模块】中，我承担【代码 / 接口 / 排障 / 测试】任务，解决【技术问题】，通过【测试 / 监控 / 指标】证明结果。`,
        facts: "补充技术栈、模块边界、PR / 接口 / 日志证据、测试方式、上线指标",
        avoid: "不要写成产品项目经历；开发岗位必须看到代码、系统、测试或线上证据",
        nightAction: "补一个工程闭环案例：技术问题、你的代码动作、验证方式和结果",
        artifact: "模块图、接口说明、PR 摘要、测试记录、监控指标",
        interview: "讲清你亲手做了什么、为什么这样设计、怎么验证稳定",
        noExperience: "如果没有直接 Owner 经历，就写清参与边界和可证明的子任务，不要冒充主导",
      });
    }

    function technicalSupportCandidateRewritePlan(row) {
      const capability = `${row.capability || ""}`;
      const text = `${row.capability || ""} ${row.jdEvidence || ""} ${row.resumeEvidence || ""}`;
      const baseGap = candidateGapType(row);
      if (/问题分诊与优先级判断/.test(capability) || (!capability && /分诊|优先级|工单|影响范围|严重级别|P0|P1/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少工单分级、影响范围判断和处理顺序依据`,
          action: "把支持经历写成一次工单分诊：客户影响是什么、怎么定级、先处理谁、为什么",
          template: "原：处理客户工单。改：面对【客户 / 系统】的【问题】，我根据【影响范围 / SLA / 客户等级】定为【P级】，优先执行【动作】，在【时间】内推进到【结果】。",
          facts: "补充工单类型、影响范围、SLA、客户等级、优先级判断依据和处理结果",
          avoid: "不要只写“处理工单”；没有分级标准就体现不出技术支持判断力",
          nightAction: "补一张工单分诊卡：问题、影响范围、优先级、动作和结果",
          artifact: "工单截图脱敏摘要、SLA 记录、分级规则、处理时长",
          interview: "先讲客户影响，再讲分级依据、处理顺序和升级边界",
          noExperience: "如果没有 P0/P1 工单，写普通问题如何分类和避免升级",
        });
      }
      if (/技术排查与复现能力/.test(capability) || (!capability && /排查|复现|日志|抓包|诊断|配置|环境|root cause|debug/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少复现路径、日志证据、排查假设和根因确认`,
          action: "把排查经历写成一条诊断链：如何复现、看了哪些日志、排除了哪些假设、根因是什么",
          template: "原：负责技术问题排查。改：针对【客户问题】，我通过【复现步骤 / 日志 / 抓包 / 配置比对】定位【根因】，给出【临时方案】并推动【永久修复】。",
          facts: "补充复现步骤、环境信息、日志或抓包线索、排查假设、根因、临时和永久方案",
          avoid: "不要只写“协助研发定位”；要说明你提供了什么证据",
          nightAction: "补一条问题诊断链：复现、日志、假设、根因、解决",
          artifact: "复现步骤、日志摘要、抓包结论、配置对比、根因记录",
          interview: "按排查假设讲，重点说明你如何缩小范围，而不是只说交给研发",
          noExperience: "如果没有深度技术排查，写清你如何收集证据并提升研发定位效率",
        });
      }
      if (/客户沟通与预期管理/.test(capability) || (!capability && /客户沟通|预期管理|解释|安抚|汇报|同步|满意度|CSAT/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少客户沟通节奏、风险解释和满意度维护证据`,
          action: "把沟通经历写成一次客户预期管理：怎么解释问题、多久同步一次、如何避免升级",
          template: "原：负责客户沟通。改：在【客户问题】处理中，我用【非技术语言】解释【影响和方案】，按【节奏】同步进展，最终将【投诉 / 升级 / 满意度】控制在【结果】。",
          facts: "补充客户角色、沟通频率、话术转译、升级风险、满意度或投诉变化",
          avoid: "不要只写“沟通能力强”；要体现复杂问题下如何稳住客户预期",
          nightAction: "补一个客户沟通案例：客户情绪、解释口径、同步节奏和结果",
          artifact: "沟通纪要、状态同步模板、客户反馈、满意度记录",
          interview: "讲清你如何把技术问题翻译成客户能理解的风险和计划",
          noExperience: "如果没有外部客户，写内部业务方沟通和预期管理案例",
        });
      }
      if (/SLA 响应与服务质量/.test(capability) || (!capability && /SLA|响应时间|解决时长|MTTR|服务质量|on-call|值班|升级/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少响应时效、MTTR、超时处理和服务质量复盘`,
          action: "把 SLA 经历写成指标闭环：响应/解决时长是多少，哪里超时，如何改进流程",
          template: "原：保障 SLA。改：我负责【服务范围】的 SLA 响应，将【响应 / 解决时长】从【前】优化到【后】，通过【分诊规则 / 值班机制 / 升级路径】降低超时。",
          facts: "补充 SLA 指标、响应时长、解决时长、超时原因、值班机制、复盘动作",
          avoid: "不要只写“及时响应客户”；没有时效指标就无法证明服务质量",
          nightAction: "补一个 SLA 指标案例：响应、解决、超时原因和流程改进",
          artifact: "SLA 看板、MTTR 记录、值班表、超时复盘",
          interview: "围绕时效和质量讲，不要只讲态度好",
          noExperience: "如果没有正式 SLA，写团队内部服务承诺和你如何跟踪时效",
        });
      }
      if (/升级协作与跨团队推进/.test(capability) || (!capability && /升级|escalation|研发|产品|运维|跨团队|hotfix|补丁|缺陷|bug/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少升级标准、协作对象、推动方式和闭环结果`,
          action: "把升级协作写成一次跨团队闭环：什么条件升级，找谁，提供什么证据，如何跟进到修复",
          template: "原：协调研发解决客户问题。改：针对【客户问题】，我依据【升级标准】整理【日志 / 复现 / 影响范围】给【研发 / 产品 / 运维】，推动【hotfix / 配置 / 版本计划】，最终在【时间】闭环。",
          facts: "补充升级触发条件、协作团队、证据包、跟进节奏、修复方式和客户侧结果",
          avoid: "不要只写“推动研发处理”；要说明你提供了什么证据、如何追踪闭环",
          nightAction: "补一个升级闭环案例：升级标准、证据包、协作对象、修复和客户确认",
          artifact: "升级记录、证据包、缺陷单、hotfix 记录、客户确认",
          interview: "讲清你如何让研发愿意接、能定位、能修复，而不是简单转派",
          noExperience: "如果没有跨团队升级权限，写你如何准备证据并协助一线升级",
        });
      }
      if (/知识库与流程沉淀/.test(capability) || (!capability && /知识库|FAQ|文档|SOP|流程|沉淀|培训|自助/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少知识沉淀、复用效果和自助解决率证据`,
          action: "把文档经历写成一次规模化改进：沉淀了什么 SOP，减少了哪些重复问题",
          template: "原：维护知识库。改：针对【高频问题】，我沉淀【FAQ / SOP / 排查脚本】，覆盖【场景】，使【重复工单 / 新人处理时长 / 自助解决率】改善【结果】。",
          facts: "补充高频问题来源、文档类型、覆盖场景、培训对象、复用效果指标",
          avoid: "不要只写“编写文档”；要说明文档被谁用、减少了什么成本",
          nightAction: "补一条知识库案例：高频问题、SOP、使用对象和复用效果",
          artifact: "FAQ、SOP、培训材料、工单下降或处理时长数据",
          interview: "讲清你如何把一次问题变成团队可复用流程",
          noExperience: "如果没有知识库权限，写你整理的排查清单或交接文档",
        });
      }
      return makeRewritePlan({
        gap: `${baseGap}；技术支持岗位需要看到工单、排查、客户沟通、SLA 或知识库证据`,
        action: `围绕“${row.capability}”补一个支持案例，写清客户问题、技术排查、沟通节奏、升级和闭环结果`,
        template: `原：负责${row.capability}。改：在【客户 / 工单】中，我通过【分诊 / 复现 / 沟通 / 升级】解决【问题】，最终达成【SLA / 满意度 / 复用】结果。`,
        facts: "补充工单类型、客户影响、排查证据、沟通节奏、升级对象、结果指标",
        avoid: "不要写成泛泛客服经历；技术支持必须体现技术证据和服务质量",
        nightAction: "补一个支持闭环案例：问题、分诊、排查、沟通、升级、结果",
        artifact: "工单摘要、日志证据、SLA 记录、沟通纪要、知识库链接",
        interview: "按客户影响和排查链路讲，最后说明如何沉淀避免重复发生",
        noExperience: "如果没有客户现场经历，写内部支持、测试支持或运维协作案例",
      });
    }

    function salesCandidateRewritePlan(row) {
      const capability = `${row.capability || ""}`;
      const text = `${row.capability || ""} ${row.jdEvidence || ""} ${row.resumeEvidence || ""}`;
      const baseGap = candidateGapType(row);
      if (/线索发现与客户画像/.test(capability) || (!capability && /线索|客户画像|ICP|获客|名单|渠道|拓客/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少线索来源、ICP 标准、触达策略和转化数据`,
          action: "把销售经历写成一条获客漏斗：从哪里找线索、如何筛选、触达多少、转化多少",
          template: "原：负责客户开发。改：面向【行业 / 客户类型】，我基于【ICP 标准】从【渠道】获取【线索数】，通过【触达方式】转化【商机数】，最终贡献【金额 / 转化率】。",
          facts: "补充线索渠道、客户画像、触达量、转化率、有效商机数和个人负责区域",
          avoid: "不要只写“开发客户”；没有漏斗数据就无法证明打法可复制",
          nightAction: "补一张获客漏斗：渠道、ICP、触达、转化、商机金额",
          artifact: "客户画像、线索表、触达话术、转化漏斗",
          interview: "先讲 ICP 和筛选标准，再讲触达策略和转化数据",
          noExperience: "如果不是你负责获客，写清你承接的线索阶段和后续推进贡献",
        });
      }
      if (/客户开发与需求挖掘/.test(capability) || (!capability && /需求挖掘|痛点|客户关系|决策链|stakeholder|拜访|discovery/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少客户角色、痛点验证、决策链和预算真实性`,
          action: "把客户开发写成一次 discovery：见了谁、问出什么痛点、谁拍板、预算和时间线是什么",
          template: "原：维护客户关系。改：在【客户】项目中，我识别【业务痛点】，梳理【决策链：使用者 / 影响者 / 决策人】，确认【预算 / 时间线】，推动进入【下一阶段】。",
          facts: "补充客户角色、关键人关系、痛点证据、预算来源、决策流程、下一步承诺",
          avoid: "不要只写“客户关系好”；销售岗位要证明你能拆决策链和真实需求",
          nightAction: "补一张客户地图：关键人、痛点、预算、阻力、下一步",
          artifact: "客户地图、拜访纪要、痛点清单、决策链图",
          interview: "讲清谁有痛点、谁有预算、谁反对、你怎么推进共识",
          noExperience: "如果没有直接见决策人，写清你如何通过教练或使用者影响决策链",
        });
      }
      if (/商机推进与方案呈现/.test(capability) || (!capability && /商机|pipeline|demo|方案|POC|招投标|proposal|推进/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少商机阶段推进、关键动作、赢单障碍和方案匹配证据`,
          action: "把商机推进写成阶段打法：从初访到 POC / 投标 / 合同，每个阶段你做了什么推进动作",
          template: "原：推进商机转化。改：我负责【客户】商机，从【阶段 A】推进到【阶段 B】，通过【Demo / POC / 方案 / 投标】解决【障碍】，最终形成【合同 / 回款 / 下一步承诺】。",
          facts: "补充商机阶段、金额、周期、关键动作、竞争对手、阻塞点和推进结果",
          avoid: "不要只写“跟进项目”；要说清阶段变化和你推动的关键动作",
          nightAction: "补一个商机推进案例：阶段、障碍、动作、结果和复盘",
          artifact: "商机阶段图、Demo 方案、POC 计划、投标节点、合同进度",
          interview: "按销售阶段讲，重点说明每次推进的客户承诺是什么",
          noExperience: "如果只是参与方案呈现，就写清你负责的环节和对推进的影响",
        });
      }
      if (/谈判与异议处理/.test(capability) || (!capability && /谈判|异议|价格|报价|折扣|采购|合同|竞品|竞争/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少价格异议、竞品对比、谈判边界和成交策略`,
          action: "把谈判经历写成一次异议处理：客户反对什么、你如何拆解、底线是什么、如何换取承诺",
          template: "原：负责商务谈判。改：面对【价格 / 竞品 / 合同】异议，我用【价值证明 / 案例 / ROI / 条款交换】处理，将【折扣 / 周期 / 风险】控制在【边界】，换取【签约 / 回款 / POC】承诺。",
          facts: "补充异议类型、竞品、报价边界、让步条件、交换条件、最终结果",
          avoid: "不要只写“谈判能力强”；没有边界和交换条件就看不出真实销售能力",
          nightAction: "补一条异议处理：异议、策略、让步边界、客户承诺和结果",
          artifact: "竞品对比、ROI 表、报价策略、合同条款变化",
          interview: "讲清客户为什么反对、你怎么换取对等承诺，而不是只降价",
          noExperience: "如果没有价格权限，写你如何收集异议并支持上级谈判",
        });
      }
      if (/业绩达成与收入贡献/.test(capability) || (!capability && /业绩|quota|ARR|MRR|收入|回款|签约|成单|赢单|目标达成|%/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少业绩口径、个人贡献、回款和可复制打法`,
          action: "把业绩写成可核验口径：目标是多少、完成多少、你贡献哪部分、是否回款、打法能否复制",
          template: "原：完成千万级销售额。改：在【周期】内，我负责【区域 / 行业 / 客户】，目标【金额】，实际签约【金额】，回款【金额】，其中由我从【线索 / 商机阶段】推进的占【比例】，复用打法是【方法】。",
          facts: "补充目标口径、签约金额、回款金额、个人贡献比例、销售周期、可复制打法",
          avoid: "不要把团队业绩写成个人业绩；没有回款或个人贡献比例时要注明口径",
          nightAction: "补一张业绩口径卡：目标、签约、回款、个人贡献、打法",
          artifact: "业绩拆分表、回款记录、客户列表脱敏、销售复盘",
          interview: "先澄清口径，再讲你从哪个阶段开始负责，以及打法如何复用",
          noExperience: "如果业绩是团队口径，写清团队规模和你负责的客户 / 阶段 / 金额",
        });
      }
      if (/CRM 管理与销售纪律/.test(capability) || (!capability && /CRM|forecast|预测|销售漏斗|跟进|next step|复盘/i.test(text))) {
        return makeRewritePlan({
          gap: `${baseGap}；缺少 CRM 更新纪律、预测准确性、下一步动作和复盘机制`,
          action: "把 CRM 管理写成管道纪律：如何更新阶段、预测依据是什么、偏差如何复盘",
          template: "原：熟练使用 CRM。改：我维护【区域 / 客户】管道，每周更新【阶段 / 金额 / next step】，Forecast 准确率约【数值】，对【丢单 / 延期】做【复盘动作】。",
          facts: "补充 CRM 工具、更新频率、阶段定义、预测准确率、丢单原因和复盘机制",
          avoid: "不要只写“熟悉 CRM”；销售管理看的是预测纪律和复盘质量",
          nightAction: "补一个 CRM 管道案例：阶段、金额、next step、预测偏差和复盘",
          artifact: "CRM 阶段截图脱敏、Forecast 表、丢单复盘、next step 清单",
          interview: "讲清你如何判断商机概率，而不是只说系统里有记录",
          noExperience: "如果没有 CRM 管理权限，写你如何维护个人客户跟进表和预测",
        });
      }
      return makeRewritePlan({
        gap: `${baseGap}；销售岗位需要看到线索、决策链、推进动作、谈判、业绩或 CRM 纪律`,
        action: `围绕“${row.capability}”补一个销售案例，写清客户、阶段、金额、动作、阻力和结果`,
        template: `原：负责${row.capability}。改：在【客户 / 行业】商机中，我通过【获客 / discovery / demo / 谈判 / CRM 管理】推进【阶段】，最终形成【签约 / 回款 / 下一步承诺】。`,
        facts: "补充客户类型、商机金额、阶段、决策链、关键动作、竞品或异议、结果",
        avoid: "不要写成泛泛客户沟通；销售岗位必须体现商业结果和个人贡献口径",
        nightAction: "补一个销售闭环案例：线索、痛点、方案、谈判、签约 / 丢单复盘",
        artifact: "客户地图、商机阶段图、报价策略、业绩拆分、CRM 记录",
        interview: "按销售漏斗讲，说明每个阶段客户给出的真实承诺",
        noExperience: "如果没有完整闭环，写清你参与的销售阶段和可证明贡献",
      });
    }

    function makeRewritePlan(plan) {
      return plan;
    }

    function candidateRoleLabel(roleId) {
      if (roleId === "developer") return "开发人员";
      if (roleId === "technical_support") return "技术支持人员";
      if (roleId === "sales") return "销售人员";
      return "产品经理";
    }

    function buildCandidateSummaryReference(roleId, roleName, rows, normalized) {
      const capabilities = rows.slice(0, 3).map((row) => row.capability).filter(Boolean).join("、") || "岗位核心能力";
      const targetLevel = normalized.target_level ? `${normalized.target_level} ` : "";
      const strongest = rows.find((row) => !row.isMissing) || rows[0];
      const currentEvidence = strongest?.resumeEvidence && !strongest.isMissing
        ? `当前可用证据是“${strongest.resumeEvidence}”，但需要补齐个人边界和结果口径。`
        : "当前简历缺少能直接支撑 JD 的项目证据，需要新增真实项目锚点。";
      if (roleId === "developer") {
        return `- ${targetLevel}${roleName}候选人，摘要建议围绕“可交付的工程结果”写：熟悉【技术栈】，在【系统 / 模块】中负责【接口 / 架构 / 性能 / 稳定性】相关工作，能用【指标口径】说明交付结果。${currentEvidence}摘要中优先呈现 ${capabilities}，不要只罗列语言和框架。`;
      }
      if (roleId === "technical_support") {
        return `- ${targetLevel}${roleName}候选人，摘要建议围绕“问题闭环和客户影响”写：处理过【客户类型 / 系统场景】问题，能完成【分诊 / 复现 / 日志分析 / 升级协作 / 知识沉淀】，并用【SLA / 响应时长 / 一次解决率】说明效果。${currentEvidence}摘要中优先呈现 ${capabilities}。`;
      }
      if (roleId === "sales") {
        return `- ${targetLevel}${roleName}候选人，摘要建议围绕“客户开发到成交的商业闭环”写：覆盖【行业 / 客户类型】，负责【线索 / 商机 / POC / 谈判 / 回款】阶段，用【金额 / 转化率 / 周期 / Forecast 准确率】说明贡献。${currentEvidence}摘要中优先呈现 ${capabilities}。`;
      }
      return `- ${targetLevel}${roleName}候选人，摘要建议围绕“从客户问题到产品交付的闭环”写：面向【行业 / 客户 / 产品模块】，负责【需求判断 / 方案设计 / 研发协同 / 上线复盘】，用【采用率 / 转化 / 效率 / 续费 / 验收】说明结果。${currentEvidence}摘要中优先呈现 ${capabilities}。`;
    }

    function buildCandidateProjectReference(row, plan, roleId, index) {
      const current = row.resumeEvidence || "当前简历没有对应项目";
      const title = `#### 项目 ${index + 1}：围绕“${row.capability}”补成一段可追问经历`;
      const jdLine = row.jdEvidence || "JD 未识别到明确原句";
      const noExperienceLine = `- 如果没有真实经历：${plan.noExperience}`;
      if (roleId === "developer") {
        return `${title}

- JD 对齐：${jdLine}
- 当前问题：${plan.gap}
- 参考改写：
  - 【项目 / 系统】：基于“${current}”，改写为负责【模块 / 服务 / 接口】的【设计 / 开发 / 重构 / 排障】。
  - 【我的动作】：说明你如何拆需求边界、设计接口或数据模型、处理异常路径、补单测 / Code Review / 灰度。
  - 【结果口径】：补【P95 / QPS / 错误率 / 发布周期 / 故障恢复时间 / 测试覆盖率】等真实指标。
  - 【复盘】：说明一次取舍、事故或性能瓶颈，以及你改了什么机制。
${noExperienceLine}`;
      }
      if (roleId === "technical_support") {
        return `${title}

- JD 对齐：${jdLine}
- 当前问题：${plan.gap}
- 参考改写：
  - 【客户 / 工单场景】：基于“${current}”，改写为处理【问题类型 / 影响范围 / 优先级】的真实案例。
  - 【我的动作】：写清分诊依据、复现步骤、日志或配置排查、升级给研发的证据包和客户同步方式。
  - 【结果口径】：补【响应时长 / 解决时长 / SLA 达成 / 复发率下降 / FAQ 命中率】等真实指标。
  - 【沉淀】：说明是否形成 SOP、知识库、监控项或升级标准。
${noExperienceLine}`;
      }
      if (roleId === "sales") {
        return `${title}

- JD 对齐：${jdLine}
- 当前问题：${plan.gap}
- 参考改写：
  - 【客户 / 商机场景】：基于“${current}”，改写为推进【行业 / 客户规模 / 商机金额】的真实销售过程。
  - 【我的动作】：写清线索来源、客户画像、决策链、痛点挖掘、方案呈现、价格 / 竞品异议处理。
  - 【结果口径】：补【签约额 / 回款 / 转化率 / 销售周期 / 阶段推进 / Forecast 准确率】等真实指标。
  - 【复盘】：如果丢单，说明原因、下一步动作和 CRM 复盘结论。
${noExperienceLine}`;
      }
      return `${title}

- JD 对齐：${jdLine}
- 当前问题：${plan.gap}
- 参考改写：
  - 【项目 / 产品】：基于“${current}”，改写为围绕【客户问题 / 业务目标】推动【需求判断 / 方案设计 / 研发协同 / 上线复盘】。
  - 【我的动作】：写清你如何判断真需求、做方案取舍、同步研发 / 交付 / 运营，以及如何处理技术或项目风险。
  - 【结果口径】：补【采用率 / 验收结果 / 效率提升 / 投诉下降 / 续费 / 转化】等真实指标。
  - 【复盘】：说明一次被砍需求、延期、客户异议或技术取舍，以及你之后如何迭代。
${noExperienceLine}`;
    }

    function buildCandidateReplacementSentence(row, plan, roleId) {
      const current = row.resumeEvidence || `负责${row.capability}`;
      if (roleId === "developer") {
        return `将“${current}”改成：在【系统 / 模块】中，我负责【接口 / 数据模型 / 性能 / 稳定性】相关工作，通过【关键技术动作】解决【具体问题】，并用【真实工程指标】证明结果。`;
      }
      if (roleId === "technical_support") {
        return `将“${current}”改成：针对【客户 / 工单】的【具体故障】，我完成【分诊、复现、排查、升级协作】并沉淀【SOP / FAQ / 监控项】，结果【真实 SLA 或解决率指标】。`;
      }
      if (roleId === "sales") {
        return `将“${current}”改成：面向【行业 / 客户】商机，我通过【线索来源、需求挖掘、方案呈现、异议处理】推进到【阶段 / 签约 / 回款】，贡献【真实金额或转化指标】。`;
      }
      return `将“${current}”改成：在【项目 / 产品】中，我围绕【客户问题 / 业务目标】完成【需求判断、方案取舍、研发协同、上线复盘】，最终带来【真实业务指标或验收结果】。`;
    }

    function buildCandidateFinalSummary(roleId, roleName, rows, normalized) {
      const targetLevel = normalized.target_level ? `${normalized.target_level} ` : "";
      const capabilities = rows.slice(0, 3).map((row) => row.capability).filter(Boolean).join("、") || "岗位核心能力";
      const evidence = rows.find((row) => row.resumeEvidence)?.resumeEvidence || "相关项目经历";
      if (roleId === "developer") {
        return `- ${targetLevel}${roleName}，核心能力聚焦 ${capabilities}。过往证据包括“${evidence}”，简历中应优先说明系统场景、本人负责模块、技术动作、测试 / 发布方式和工程指标口径。`;
      }
      if (roleId === "technical_support") {
        return `- ${targetLevel}${roleName}，核心能力聚焦 ${capabilities}。过往证据包括“${evidence}”，简历中应优先说明客户问题场景、分诊依据、复现排查、升级协作、SLA 或解决率口径。`;
      }
      if (roleId === "sales") {
        return `- ${targetLevel}${roleName}，核心能力聚焦 ${capabilities}。过往证据包括“${evidence}”，简历中应优先说明客户类型、商机阶段、决策链、异议处理、签约 / 回款或 Forecast 口径。`;
      }
      return `- ${targetLevel}${roleName}，核心能力聚焦 ${capabilities}。过往证据包括“${evidence}”，简历中应优先说明客户问题、需求判断、方案取舍、研发协同、上线结果和复盘口径。`;
    }

    function candidateFinalResumeBullet(row, plan, roleId, index) {
      const prefix = index === 0 ? "重点项目" : "项目经历";
      const evidence = row.resumeEvidence || "待补充真实项目";
      const audit = contributionVerbAudit(row);
      const verb = audit.risk === "高" ? "参与 / 支持" : audit.verb || "负责";
      if (roleId === "developer") {
        return `- ${prefix}：围绕“${row.capability}”，基于“${evidence}”，建议写成：${verb}【系统 / 模块】中的【接口 / 数据模型 / 性能 / 稳定性】工作，完成【关键技术动作】，并用【P95 / QPS / 错误率 / 覆盖率】说明结果。需确认：${plan.facts}`;
      }
      if (roleId === "technical_support") {
        return `- ${prefix}：围绕“${row.capability}”，基于“${evidence}”，建议写成：${verb}【客户 / 工单】问题的【分诊 / 复现 / 排查 / 升级协作】，沉淀【SOP / FAQ / 监控项】，并用【SLA / 响应时长 / 一次解决率】说明结果。需确认：${plan.facts}`;
      }
      if (roleId === "sales") {
        return `- ${prefix}：围绕“${row.capability}”，基于“${evidence}”，建议写成：${verb}【客户 / 行业】商机从【阶段 A】推进到【阶段 B】，处理【痛点 / 竞品 / 价格】异议，并用【签约额 / 回款 / 转化率 / 周期】说明贡献。需确认：${plan.facts}`;
      }
      return `- ${prefix}：围绕“${row.capability}”，基于“${evidence}”，建议写成：${verb}【项目 / 产品模块】的【需求判断 / 方案设计 / 研发协同 / 上线复盘】，通过【采用率 / 验收 / 效率 / 续费】说明结果。需确认：${plan.facts}`;
    }

    function plainTextResumeBullet(row, roleId) {
      const evidence = row.resumeEvidence || "待补充真实项目";
      if (roleId === "developer") {
        return `${row.capability}：${evidence}；补充本人负责模块、接口或系统边界、测试发布方式和工程指标。`;
      }
      if (roleId === "technical_support") {
        return `${row.capability}：${evidence}；补充分诊依据、复现步骤、日志排查、升级协作和 SLA 结果。`;
      }
      if (roleId === "sales") {
        return `${row.capability}：${evidence}；补充客户类型、商机阶段、决策链、异议处理和签约 / 回款口径。`;
      }
      return `${row.capability}：${evidence}；补充客户问题、方案取舍、协作对象、上线结果和复盘。`;
    }

    function buildCandidateSkillLine(roleId, rows) {
      const capabilityKeywords = rows.slice(0, 4).map((row) => row.capability).filter(Boolean);
      const roleKeywords = {
        developer: ["接口设计", "系统设计", "单元测试", "Code Review", "性能 / 稳定性"],
        technical_support: ["工单分诊", "问题复现", "日志排查", "SLA", "知识库 / SOP"],
        sales: ["客户开发", "决策链梳理", "商机推进", "异议处理", "CRM / Forecast"],
        product_manager: ["需求分析", "方案设计", "研发协同", "上线复盘", "指标口径"],
      };
      return [...capabilityKeywords, ...(roleKeywords[roleId] || roleKeywords.product_manager)].slice(0, 9).join("、");
    }

    function stripMarkdown(value) {
      return String(value || "")
        .replace(/^[-*]\s+/gm, "")
        .replace(/[*_`>#]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function candidateMetricDictionary(roleId) {
      if (roleId === "developer") {
        return [
          { name: "P95 / P99 响应时间", probe: "测试环境、基线、峰值/均值、是否由本人模块贡献" },
          { name: "QPS / 吞吐量", probe: "压测口径、流量规模、瓶颈点和优化动作" },
          { name: "错误率 / 故障率", probe: "统计周期、报警来源、根因和修复机制" },
          { name: "测试覆盖率 / 缺陷率", probe: "覆盖范围、单测边界、Code Review 机制" },
        ];
      }
      if (roleId === "technical_support") {
        return [
          { name: "SLA 达成率", probe: "响应口径、解决口径、客户分级和统计周期" },
          { name: "响应 / 解决时长", probe: "平均值或区间、问题类型、升级前后变化" },
          { name: "一次解决率", probe: "工单类型、是否复发、知识库命中情况" },
          { name: "高频问题下降", probe: "流程或 SOP 改动、统计来源、影响范围" },
        ];
      }
      if (roleId === "sales") {
        return [
          { name: "线索数 / 商机数", probe: "线索来源、ICP、有效商机标准和转化口径" },
          { name: "成交率 / 转化率", probe: "漏斗阶段、样本周期、个人贡献和竞品影响" },
          { name: "签约额 / 回款额", probe: "合同口径、回款周期、团队与个人拆分" },
          { name: "销售周期 / Forecast 准确率", probe: "阶段定义、预测偏差和复盘机制" },
        ];
      }
      return [
        { name: "采用率 / 使用率", probe: "用户口径、版本周期、上线前后对比和归因边界" },
        { name: "转化率 / 留存率", probe: "漏斗定义、基线、时间窗口和是否有实验对照" },
        { name: "效率提升 / 步骤减少", probe: "流程前后差异、影响用户、验证方式" },
        { name: "验收 / 续费 / 投诉变化", probe: "客户类型、反馈来源、统计周期和个人动作" },
      ];
    }

    function candidateFactStatus(row) {
      const evidence = `${row.resumeEvidence || ""}`;
      if (row.isMissing || /未提供|缺少|暂无|没有对应|待补充/.test(evidence)) return "needs_confirmation";
      if (row.evidenceLevel <= 1 && hasConcreteEvidenceSignal(evidence)) return "confirmed";
      if (row.evidenceLevel <= 2) return "needs_confirmation";
      return "inferred";
    }

    function candidateFactStatusLabel(row) {
      const status = candidateFactStatus(row);
      if (status === "confirmed") return "已确认：来自简历中的可用项目证据";
      if (status === "needs_confirmation") return "待确认：需要候选人补事实后才能写进最终版";
      return "模型推断：只能作为追问方向，不能直接写进简历";
    }

    function candidateFactNextStep(row) {
      if (candidateFactStatus(row) === "confirmed") {
        return "补指标口径、个人贡献边界、协作对象和复盘细节";
      }
      if (row.isMissing) {
        return `先确认是否有真实项目能证明“${row.capability}”；没有则写相邻经验和补齐计划`;
      }
      return "确认项目名称、你的动作、结果来源和是否可公开；确认前不要使用强动词或精确数字";
    }

    function candidateRequirementMatchLabel(row) {
      if (row.isMissing) return "0% / 缺证：当前不能证明匹配";
      if (candidateFactStatus(row) === "confirmed" && row.evidenceLevel <= 1) return "80% / 较匹配：有项目线索，但仍需补口径";
      if (row.evidenceLevel === 2) return "50% / 弱匹配：有相关表述，但缺个人动作或结果";
      return "30% / 待验证：表述偏泛，面试风险高";
    }

    function candidateUnclearPoint(row) {
      if (!row) return "未识别到明确 JD 要求";
      if (row.isMissing) return "简历没有对应项目证据，无法判断是否具备该能力";
      const missing = [];
      if (!hasContributionSignal(row.resumeEvidence)) missing.push("个人贡献");
      if (!hasMetricSignal(row.resumeEvidence)) missing.push("结果口径");
      if (!hasReviewSignal(row.resumeEvidence)) missing.push("取舍 / 失败 / 复盘");
      if (candidateFactStatus(row) !== "confirmed") missing.push("事实来源");
      if (contributionVerbAudit(row).risk === "高") missing.push("贡献动词证据");
      return missing.length ? `缺少${missing.join("、")}` : "已有线索，但仍建议补协作对象、指标来源和结果归因";
    }

    function candidateRequiredFactsForFinal(row, plan) {
      const facts = [];
      if (row.isMissing || candidateFactStatus(row) !== "confirmed") facts.push("真实项目名称 / 场景");
      if (!hasContributionSignal(row.resumeEvidence)) facts.push("本人动作和职责边界");
      if (!hasMetricSignal(row.resumeEvidence)) facts.push("结果指标或可验证交付");
      if (!hasReviewSignal(row.resumeEvidence)) facts.push("取舍、失败或复盘");
      facts.push(plan.facts);
      return [...new Set(facts)].join("；");
    }

    function hasConcreteEvidenceSignal(value) {
      return /项目|系统|平台|客户|工单|商机|合同|接口|上线|交付|验收|复盘|故障|指标|%|万|元|人|家|次|天|小时|P95|QPS|SLA|CRM|PRD|MVP|Code Review/i.test(value || "");
    }

    function candidateMaterialQuestionsForRow(row) {
      const questions = [];
      const capability = row.capability || "该 JD 要求";
      if (row.isMissing) {
        questions.push(`JD 要求“${capability}”，你是否有真实项目能证明？请补项目名称、时间、你的角色、具体动作和结果。`);
      }
      if (candidateFactStatus(row) !== "confirmed") {
        questions.push(`关于“${capability}”，当前证据还不能直接写进简历：请确认哪些事实来自原简历、哪些只是你可以补充的经历。`);
      }
      if (!hasMetricSignal(row.resumeEvidence)) {
        questions.push(`“${capability}”有没有可公开的结果口径？可以是区间、相对变化、交付验收、采用情况或客户反馈，不要编精确数字。`);
      }
      if (!hasContributionSignal(row.resumeEvidence)) {
        questions.push(`“${capability}”里你本人到底负责哪一段？请区分个人动作、团队成果、协作对象和决策边界。`);
      }
      if (!hasReviewSignal(row.resumeEvidence)) {
        questions.push(`请补一个与“${capability}”相关的取舍、失败、延期、异议或复盘点，面试官通常会深挖这里。`);
      }
      return questions;
    }

    function hasMetricSignal(value) {
      return /%|约|近|超过|提升|降低|减少|增长|下降|万|元|人|家|次|天|小时|P95|QPS|SLA|转化|回款|签约|故障率|覆盖率/i.test(value || "");
    }

    function hasContributionSignal(value) {
      return /我|本人|负责|主导|推动|协同|参与|设计|开发|分析|排查|复盘|交付|验收|谈判|推进/i.test(value || "");
    }

    function hasReviewSignal(value) {
      return /复盘|失败|延期|故障|取舍|风险|冲突|异议|降级|灰度|整改|丢单|根因/i.test(value || "");
    }

    function buildCandidateScores(rows, snapshot) {
      const safeRows = rows || [];
      const total = Math.max(safeRows.length, 1);
      const matched = safeRows.filter((row) => !row.isMissing).length;
      const confirmed = safeRows.filter((row) => candidateFactStatus(row) === "confirmed").length;
      const weak = safeRows.filter((row) => row.evidenceLevel >= 2 || row.isMissing).length;
      const resume = normalizeSnapshot(snapshot).resume || snapshot.resume || "";
      const jdMatchScore = clampScore(Math.round((matched / total) * 55 + (confirmed / total) * 25 + (1 - weak / total) * 20));
      const atsScore = clampScore(55 + Math.min(25, countKeywordSignals(safeRows) * 5) + (hasStandardResumeStructure(resume) ? 20 : 5));
      const hrScore = clampScore(45 + Math.min(30, confirmed * 8) + (hasMetricSignal(resume) ? 15 : 0) + (hasContributionSignal(resume) ? 10 : 0));
      const interviewScore = clampScore(40 + Math.min(25, confirmed * 6) + (hasReviewSignal(resume) ? 20 : 0) + (hasMetricSignal(resume) ? 15 : 0));
      const credibilityScore = clampScore(95 - weak * 10 - countHighVerbRisks(safeRows) * 8);
      return [
        {
          name: "JD 匹配度",
          score: jdMatchScore,
          reason: `当前 ${matched}/${total} 项 JD 要求有简历线索，${confirmed}/${total} 项可作为较强事实证据。`,
          action: "先补高权重缺证项，再把弱证据改成可复核项目。具体看上方差距表。",
        },
        {
          name: "ATS 可读性",
          score: atsScore,
          reason: hasStandardResumeStructure(resume) ? "简历文本包含较标准的经历结构线索。" : "当前输入更像散文式经历，标准标题和技能区仍需候选人确认。",
          action: "输出最终版时使用教育经历、工作经历、项目经历、技能清单等标准标题，关键词必须绑定项目证据。",
        },
        {
          name: "HR 10 秒吸引力",
          score: hrScore,
          reason: confirmed ? "已有部分可前置亮点，但摘要仍需围绕目标岗位重排。" : "缺少能被 HR 快速看懂的目标岗位亮点。",
          action: "把最贴近 JD 的项目放在摘要和第一段经历前两行，压缩低相关内容。",
        },
        {
          name: "面试自洽度",
          score: interviewScore,
          reason: hasReviewSignal(resume) ? "已有少量复盘或风险信号，可继续扩展成回答。" : "当前材料缺少失败、取舍、指标来源和个人边界，容易被追问穿。",
          action: "每个核心项目准备背景、本人动作、结果口径、团队边界和一次复盘。",
        },
        {
          name: "可信度",
          score: credibilityScore,
          reason: weak ? `仍有 ${weak} 项弱证据 / 缺证，强动词和结果口径需要校准。` : "核心证据相对完整，但仍需保留数据来源和归因边界。",
          action: "只有已确认事实进入最终简历；待确认内容先放补充问题，不写成确定结论。",
        },
      ];
    }

    function clampScore(value) {
      return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
    }

    function countKeywordSignals(rows) {
      return new Set((rows || []).map((row) => row.capability).filter(Boolean)).size;
    }

    function hasStandardResumeStructure(resume) {
      return /教育经历|工作经历|项目经历|实习经历|技能|专业技能|个人优势|公司|岗位|20\d{2}|19\d{2}/.test(resume || "");
    }

    function countHighVerbRisks(rows) {
      return (rows || []).filter((row) => contributionVerbAudit(row).risk === "高").length;
    }

    function contributionVerbAudit(row) {
      const text = row.resumeEvidence || "";
      const verb = (text.match(/主导|牵头|负责|推动|参与|协助|支持/) || [])[0] || "";
      if (!verb) {
        return {
          verb,
          risk: row.evidenceLevel >= 3 || row.isMissing ? "中" : "低",
          recommendation: "补出个人动作后再选择贡献动词",
          requiredEvidence: "项目背景、个人动作、协作对象、交付物、结果口径",
        };
      }
      if (/主导|牵头/.test(verb)) {
        const hasOwnerEvidence = /目标|方案|决策|节奏|资源|结果|复盘|指标|验收/.test(text);
        return {
          verb,
          risk: hasOwnerEvidence && row.evidenceLevel <= 1 ? "中" : "高",
          recommendation: hasOwnerEvidence ? "可保留，但必须补关键决策和结果责任" : "降级为“负责 / 推动 / 参与”，直到能证明目标、决策和结果责任",
          requiredEvidence: "目标责任、关键决策、推进节奏、资源协调、结果归因",
        };
      }
      if (/负责|推动/.test(verb)) {
        const hasModuleEvidence = /模块|交付|上线|验收|接口|客户|商机|工单|指标|结果|协调|解决/.test(text);
        return {
          verb,
          risk: hasModuleEvidence && !row.isMissing ? "中" : "高",
          recommendation: hasModuleEvidence ? "保留动词，并补清模块边界和交付结果" : "降级为“参与 / 协助”，或补充明确模块所有权",
          requiredEvidence: "负责范围、交付物、关键动作、协作对象、结果",
        };
      }
      return {
        verb,
        risk: "低",
        recommendation: "当前动词相对稳妥，可补充动作和结果提高证据密度",
        requiredEvidence: "具体任务、完成方式、交付结果",
      };
    }

    function candidateRewritePlan(row, snapshot = {}, context = {}) {
      const roleId = normalizeSnapshot(snapshot).target_role || snapshot.target_role || snapshot.targetRole || "product_manager";
      if (roleId === "developer") return applyEvidenceReuseWarning(developerCandidateRewritePlan(row), row, context);
      if (roleId === "technical_support") return applyEvidenceReuseWarning(technicalSupportCandidateRewritePlan(row), row, context);
      if (roleId === "sales") return applyEvidenceReuseWarning(salesCandidateRewritePlan(row), row, context);
      if (roleId === "product_manager") return applyEvidenceReuseWarning(productCandidateRewritePlan(row), row, context);
      return applyEvidenceReuseWarning(genericCandidateRewritePlan(row), row, context);
    }

    function productCandidateRewritePlan(row) {
      const capability = `${row.capability || ""}`;
      const text = `${capability} ${row.jdEvidence || ""} ${row.resumeEvidence || ""}`;
      if (/行业场景理解/.test(capability) || (!capability && /行业|市场|竞争|业务理解|竞品|政策|客户价值/i.test(text))) {
        return makeRewritePlan({
          gap: `${candidateGapType(row)}；缺少行业判断来源、客户场景、竞品 / 政策约束和你如何影响路线图`,
          action: "把“行业理解”写成一次具体判断：调研了哪些客户 / 竞品 / 政策，发现什么机会或风险，最后如何改变产品优先级",
          template: "原：负责行业产品规划。改：面向【目标行业 / 客户类型】，我通过【客户访谈 / 竞品拆解 / 业务数据】发现【具体痛点】，将路线图调整为【版本 / 模块】，最终带来【客户采用 / 转化 / 效率】变化。",
          facts: "补充调研对象、样本数量或来源、竞品 / 政策结论、你推动的路线图变化、验证指标",
          avoid: "不要只写“熟悉行业”或“负责行业分析”；没有调研来源时不要伪装成行业专家",
          nightAction: "补一张行业判断卡：客户是谁、痛点是什么、竞品怎么做、你据此改了哪个优先级",
          artifact: "行业判断卡、客户访谈摘要、竞品对比、路线图调整前后对照",
          interview: "先讲行业场景和客户痛点，再讲你如何判断优先级，最后讲这个判断如何被数据或客户反馈验证",
          noExperience: "如果没有目标行业经历，写相近 B 端 / 工业 / SaaS 场景的判断方法，并说明入职后前 30 天如何补行业认知",
        });
      }
      if (/产品规划与生命周期管理/.test(capability) || (!capability && /生命周期|产品规划|路线图|版本|迭代|MVP|规划/i.test(text))) {
        return makeRewritePlan({
          gap: `${candidateGapType(row)}；缺少从 0-1、迭代、上线到复盘的生命周期闭环`,
          action: "把“负责产品规划”拆成一个版本生命周期：为什么做、先做什么、砍掉什么、上线后看什么指标",
          template: "原：负责产品生命周期管理。改：在【项目 / 产品】中，我基于【用户问题 / 业务目标】规划【MVP / 版本节奏】，取舍【保留 / 延后 / 放弃】需求，推动【上线动作】，用【指标】复盘并迭代【下一版本】。",
          facts: "补充产品阶段、版本节奏、需求取舍标准、上线结果、复盘后做过的调整",
          avoid: "不要把生命周期写成“从需求到上线全流程参与”；要说清你在哪个节点做了什么决策",
          nightAction: "补一条版本故事：目标、MVP 范围、被砍需求、上线指标和二次迭代",
          artifact: "版本路线图、MVP 范围清单、需求取舍记录、上线复盘指标",
          interview: "按“目标 - MVP - 取舍 - 上线 - 复盘 - 迭代”讲，不要只讲功能清单",
          noExperience: "如果没有完整生命周期经历，诚实说明你负责的阶段，并补充你如何理解前后游约束",
        });
      }
      if (/客户需求分析与方案设计/.test(capability) || (!capability && /客户|需求|方案|咨询|调研|交流|用户/i.test(text))) {
        return makeRewritePlan({
          gap: `${candidateGapType(row)}；缺少客户需求如何被发现、筛选、转成方案并验证的过程`,
          action: "把“客户需求分析”写成一个真实客户问题：谁提出、你如何辨别真需求、方案如何落地、客户如何反馈",
          template: "原：负责客户需求分析与方案设计。改：针对【客户 / 用户角色】的【具体问题】，我通过【访谈 / 数据 / 现场观察】拆出【真实需求】，设计【方案】，协调【研发 / 交付 / 运营】落地，结果【验收 / 续费 / 效率 / 投诉下降】。",
          facts: "补充客户类型、需求来源、判断标准、方案取舍、协作对象、验收或反馈结果",
          avoid: "不要只写“对接客户需求”；没有客户原话、场景和方案取舍时不要写成主导方案",
          nightAction: "补一个客户案例：客户原话、真实问题、你排除的伪需求、最终方案和验收结果",
          artifact: "客户问题卡、需求判断清单、方案草图、验收或反馈记录",
          interview: "先复述客户场景，再说明你如何判断不是伪需求，最后讲方案为什么这样设计",
          noExperience: "如果没有直接客户经验，用内部用户、销售反馈或运营数据案例替代，并说明差异",
        });
      }
      if (/技术架构与研发协同/.test(capability) || (!capability && /技术|架构|研发|系统|选型|风险|接口|数据库|Java|C\+\+|前后端/i.test(text))) {
        return makeRewritePlan({
          gap: `${candidateGapType(row)}；缺少你对技术边界、选型原因、研发协同和技术风险的真实参与`,
          action: "把“技术协同”写成一次技术取舍：你提出了什么约束，和研发如何评审，最后如何控制风险",
          template: "原：指导项目技术架构设计与技术风险控制。改：在【项目】中，我识别【性能 / 数据 / 集成 / 安全】风险，和研发评审【方案 A/B】，明确【接口 / 边界 / 降级策略】，推动【验证动作】，避免【具体风险】。",
          facts: "补充技术问题背景、参与的评审或接口设计、方案取舍原因、风险预案、验证结果",
          avoid: "不要堆技术名词；如果不是你决策，不要写“主导架构”，改写为“参与评审 / 提出业务约束 / 推动风险闭环”",
          nightAction: "补一张技术协同卡：业务约束、技术方案选项、你提出的问题、最终取舍和风险预案",
          artifact: "技术评审记录、接口边界说明、风险清单、压测 / 灰度 / 降级方案",
          interview: "讲清你不一定写代码，但必须说清技术约束、选型理由、边界和风险闭环",
          noExperience: "如果没有架构经验，不要装技术负责人；写你如何和研发定义边界、识别风险、推动验证",
        });
      }
      if (/技术选型与创新探索/.test(capability) || (!capability && /创新|探索|新功能|专利|前瞻|技术探索|布局/i.test(text))) {
        return makeRewritePlan({
          gap: `${candidateGapType(row)}；缺少探索问题来源、试验方法、失败结论和转化结果`,
          action: "把“创新探索”写成一次小实验：为什么探索、假设是什么、怎么验证、失败或成功后怎么处理",
          template: "原：负责前瞻性技术探索。改：围绕【新场景 / 新技术】，我提出【假设】，用【原型 / PoC / 客户验证】测试【关键风险】，根据【结果】决定【继续 / 暂停 / 转入路线图】。",
          facts: "补充探索背景、假设、验证方法、样本或原型、失败结论、是否进入产品路线图",
          avoid: "不要只写“关注新技术”；没有验证动作时不要写成创新成果",
          nightAction: "补一条探索实验：假设、验证方式、结果、失败教训和下一步",
          artifact: "PoC 记录、原型截图、验证问题清单、探索结论",
          interview: "重点讲你如何降低不确定性，而不是讲概念有多新",
          noExperience: "如果没有创新项目，写一次功能优化或流程改进的小实验，并说明验证逻辑",
        });
      }
      if (/成本、进度、质量控制/.test(capability) || (!capability && /成本|进度|质量|项目|交付|里程碑|风险控制|排期/i.test(text))) {
        return makeRewritePlan({
          gap: `${candidateGapType(row)}；缺少项目治理细节，比如里程碑、风险升级、延期处理和质量标准`,
          action: "把“项目推进”写成一次真实治理：如何拆里程碑、发现风险、做取舍、同步干系人并复盘",
          template: "原：负责成本、进度、质量控制。改：在【项目】中，我将目标拆成【里程碑】，识别【风险】，通过【优先级调整 / 资源协调 / 降级方案】保障【交付结果】，并沉淀【复盘机制】。",
          facts: "补充项目周期、里程碑、延期或风险节点、你采取的动作、质量标准、复盘机制",
          avoid: "不要只写“协调推进项目”；没有真实延期或冲突案例时，至少补一个风险预警或取舍案例",
          nightAction: "补一个项目治理案例：排期、风险、冲突、取舍、结果和复盘",
          artifact: "里程碑表、风险清单、优先级调整记录、复盘清单",
          interview: "按时间线讲风险何时出现、你怎么判断、怎么协调、结果如何",
          noExperience: "如果没有项目管理职责，写你负责模块内的排期和质量控制，不要冒充项目负责人",
        });
      }
      return genericCandidateRewritePlan(row);
    }

    function genericCandidateRewritePlan(row) {
      const text = `${row.capability || ""} ${row.jdEvidence || ""} ${row.resumeEvidence || ""}`;
      const baseGap = candidateGapType(row);
      const severity = row.isMissing || row.evidenceLevel >= 3 ? "当前不能直接当作匹配证据" : "当前还不足以抵抗深挖追问";
      if (/行业|市场|竞争|业务理解|竞品|政策|客户价值/i.test(text)) {
        return {
          gap: `${baseGap}；缺少行业判断来源、客户场景、竞品 / 政策约束和你如何影响路线图`,
          action: "把“行业理解”写成一次具体判断：调研了哪些客户 / 竞品 / 政策，发现什么机会或风险，最后如何改变产品优先级",
          template: "原：负责行业产品规划。改：面向【目标行业 / 客户类型】，我通过【客户访谈 / 竞品拆解 / 业务数据】发现【具体痛点】，将路线图调整为【版本 / 模块】，最终带来【客户采用 / 转化 / 效率】变化。",
          facts: "补充调研对象、样本数量或来源、竞品 / 政策结论、你推动的路线图变化、验证指标",
          avoid: "不要只写“熟悉行业”或“负责行业分析”；没有调研来源时不要伪装成行业专家",
          nightAction: "补一张行业判断卡：客户是谁、痛点是什么、竞品怎么做、你据此改了哪个优先级",
          artifact: "行业判断卡、客户访谈摘要、竞品对比、路线图调整前后对照",
          interview: "先讲行业场景和客户痛点，再讲你如何判断优先级，最后讲这个判断如何被数据或客户反馈验证",
          noExperience: "如果没有目标行业经历，写相近 B 端 / 工业 / SaaS 场景的判断方法，并说明入职后前 30 天如何补行业认知",
        };
      }
      if (/生命周期|产品规划|路线图|版本|迭代|MVP|规划/i.test(text)) {
        return {
          gap: `${baseGap}；缺少从 0-1、迭代、上线到复盘的生命周期闭环`,
          action: "把“负责产品规划”拆成一个版本生命周期：为什么做、先做什么、砍掉什么、上线后看什么指标",
          template: "原：负责产品生命周期管理。改：在【项目 / 产品】中，我基于【用户问题 / 业务目标】规划【MVP / 版本节奏】，取舍【保留 / 延后 / 放弃】需求，推动【上线动作】，用【指标】复盘并迭代【下一版本】。",
          facts: "补充产品阶段、版本节奏、需求取舍标准、上线结果、复盘后做过的调整",
          avoid: "不要把生命周期写成“从需求到上线全流程参与”；要说清你在哪个节点做了什么决策",
          nightAction: "补一条版本故事：目标、MVP 范围、被砍需求、上线指标和二次迭代",
          artifact: "版本路线图、MVP 范围清单、需求取舍记录、上线复盘指标",
          interview: "按“目标 - MVP - 取舍 - 上线 - 复盘 - 迭代”讲，不要只讲功能清单",
          noExperience: "如果没有完整生命周期经历，诚实说明你负责的阶段，并补充你如何理解前后游约束",
        };
      }
      if (/客户|需求|方案|咨询|调研|交流|用户/i.test(text)) {
        return {
          gap: `${baseGap}；缺少客户需求如何被发现、筛选、转成方案并验证的过程`,
          action: "把“客户需求分析”写成一个真实客户问题：谁提出、你如何辨别真需求、方案如何落地、客户如何反馈",
          template: "原：负责客户需求分析与方案设计。改：针对【客户 / 用户角色】的【具体问题】，我通过【访谈 / 数据 / 现场观察】拆出【真实需求】，设计【方案】，协调【研发 / 交付 / 运营】落地，结果【验收 / 续费 / 效率 / 投诉下降】。",
          facts: "补充客户类型、需求来源、判断标准、方案取舍、协作对象、验收或反馈结果",
          avoid: "不要只写“对接客户需求”；没有客户原话、场景和方案取舍时不要写成主导方案",
          nightAction: "补一个客户案例：客户原话、真实问题、你排除的伪需求、最终方案和验收结果",
          artifact: "客户问题卡、需求判断清单、方案草图、验收或反馈记录",
          interview: "先复述客户场景，再说明你如何判断不是伪需求，最后讲方案为什么这样设计",
          noExperience: "如果没有直接客户经验，用内部用户、销售反馈或运营数据案例替代，并说明差异",
        };
      }
      if (/技术|架构|研发|系统|选型|风险|接口|数据库|Java|C\+\+|前后端/i.test(text)) {
        return {
          gap: `${baseGap}；缺少你对技术边界、选型原因、研发协同和技术风险的真实参与`,
          action: "把“技术协同”写成一次技术取舍：你提出了什么约束，和研发如何评审，最后如何控制风险",
          template: "原：指导项目技术架构设计与技术风险控制。改：在【项目】中，我识别【性能 / 数据 / 集成 / 安全】风险，和研发评审【方案 A/B】，明确【接口 / 边界 / 降级策略】，推动【验证动作】，避免【具体风险】。",
          facts: "补充技术问题背景、参与的评审或接口设计、方案取舍原因、风险预案、验证结果",
          avoid: "不要堆技术名词；如果不是你决策，不要写“主导架构”，改写为“参与评审 / 提出业务约束 / 推动风险闭环”",
          nightAction: "补一张技术协同卡：业务约束、技术方案选项、你提出的问题、最终取舍和风险预案",
          artifact: "技术评审记录、接口边界说明、风险清单、压测 / 灰度 / 降级方案",
          interview: "讲清你不一定写代码，但必须说清技术约束、选型理由、边界和风险闭环",
          noExperience: "如果没有架构经验，不要装技术负责人；写你如何和研发定义边界、识别风险、推动验证",
        };
      }
      if (/创新|探索|新功能|专利|前瞻|技术探索|布局/i.test(text)) {
        return {
          gap: `${baseGap}；缺少探索问题来源、试验方法、失败结论和转化结果`,
          action: "把“创新探索”写成一次小实验：为什么探索、假设是什么、怎么验证、失败或成功后怎么处理",
          template: "原：负责前瞻性技术探索。改：围绕【新场景 / 新技术】，我提出【假设】，用【原型 / PoC / 客户验证】测试【关键风险】，根据【结果】决定【继续 / 暂停 / 转入路线图】。",
          facts: "补充探索背景、假设、验证方法、样本或原型、失败结论、是否进入产品路线图",
          avoid: "不要只写“关注新技术”；没有验证动作时不要写成创新成果",
          nightAction: "补一条探索实验：假设、验证方式、结果、失败教训和下一步",
          artifact: "PoC 记录、原型截图、验证问题清单、探索结论",
          interview: "重点讲你如何降低不确定性，而不是讲概念有多新",
          noExperience: "如果没有创新项目，写一次功能优化或流程改进的小实验，并说明验证逻辑",
        };
      }
      if (/成本|进度|质量|项目|交付|里程碑|风险控制|排期/i.test(text)) {
        return {
          gap: `${baseGap}；缺少项目治理细节，比如里程碑、风险升级、延期处理和质量标准`,
          action: "把“项目推进”写成一次真实治理：如何拆里程碑、发现风险、做取舍、同步干系人并复盘",
          template: "原：负责成本、进度、质量控制。改：在【项目】中，我将目标拆成【里程碑】，识别【风险】，通过【优先级调整 / 资源协调 / 降级方案】保障【交付结果】，并沉淀【复盘机制】。",
          facts: "补充项目周期、里程碑、延期或风险节点、你采取的动作、质量标准、复盘机制",
          avoid: "不要只写“协调推进项目”；没有真实延期或冲突案例时，至少补一个风险预警或取舍案例",
          nightAction: "补一个项目治理案例：排期、风险、冲突、取舍、结果和复盘",
          artifact: "里程碑表、风险清单、优先级调整记录、复盘清单",
          interview: "按时间线讲风险何时出现、你怎么判断、怎么协调、结果如何",
          noExperience: "如果没有项目管理职责，写你负责模块内的排期和质量控制，不要冒充项目负责人",
        };
      }
      return {
        gap: `${baseGap}；${severity}，需要把职责描述改成可复核的项目证据`,
        action: `围绕“${row.capability}”补一个真实项目，写清问题、你的动作、关键取舍、结果和复盘`,
        template: `原：负责${row.capability}。改：在【真实项目】中，我面对【问题 / 约束】，采取【本人动作】，做出【关键取舍】，最终通过【指标 / 交付物 / 反馈】验证结果。`,
        facts: "补充项目名称、时间、你的角色边界、关键决策、协作对象、结果指标和失败复盘",
        avoid: "不要把团队成果写成个人主导；没有真实经历时不要编造，只写相邻经验和补齐计划",
        nightAction: "补一条项目闭环：背景、目标、约束、本人动作、结果和复盘",
        artifact: "项目流程图、指标口径卡、关键决策清单、失败或取舍案例",
        interview: "先讲问题和约束，再讲个人动作和取舍，最后讲结果、复盘和迁移边界",
        noExperience: "诚实说明相邻经验、可迁移方法和入职后补齐计划，不要伪造项目经历",
      };
    }

    function candidateGapType(row) {
      if (row.isMissing) return "缺项目证据：简历没有证明这条 JD 要求";
      if (row.evidenceLevel >= 3) return "低可信证据：有表述，但缺少可复核项目、结果或个人贡献";
      if (row.evidenceLevel === 2) return "证据不完整：需要补指标口径、个人边界或失败复盘";
      return "表面匹配：仍需补充个人动作、关键决策和结果归因，避免被认为只是团队成果";
    }

    function candidateGapSeverity(row) {
      if (row.isMissing || row.evidenceLevel >= 3) return "高";
      if (row.evidenceLevel === 2) return "中";
      return "低";
    }

    function candidateGapAction(row) {
      if (row.isMissing) return `新增一条真实项目经历，专门证明“${row.capability}”，至少写清背景、本人动作、结果和复盘`;
      if (row.evidenceLevel >= 3) return "把泛泛职责改成项目闭环，补充时间线、交付物、指标和协作对象";
      if (row.evidenceLevel === 2) return "补充指标分母、统计周期、你的决策边界和失败 / 取舍案例";
      return "保留该经历，但把团队成果拆成本人动作、关键决策、协作对象和结果归因";
    }

    function authenticityRiskType(row) {
      if (row.isMissing) return "缺项目证据";
      if (row.evidenceLevel >= 3) return "低可信项目表述";
      if (/技术|架构|研发|系统|Java|C\+\+|数据库|前后端/i.test(`${row.capability} ${row.resumeEvidence}`)) return "技术名词堆砌风险";
      if (/主导|负责|推动|参与/.test(row.resumeEvidence || "")) return "个人角色边界不清";
      return "表面匹配需反包装";
    }

    function authenticityRiskReason(row) {
      if (row.isMissing) return "JD 有要求，但简历没有对应项目，不能直接当作能力成立";
      if (row.evidenceLevel >= 3) return "当前证据缺少项目过程、个人动作、指标或结果归因";
      if (/主导|负责|推动|参与/.test(row.resumeEvidence || "")) return "职责动词不能证明真实贡献，需要拆出具体交付物和决策权";
      return "材料看起来匹配，但仍需验证真实角色、复杂度和失败细节";
    }

    function jdDepthFocus(row) {
      const text = `${row.capability} ${row.jdEvidence}`;
      if (/技术|架构|研发|系统|数据库|Java|C\+\+|前后端|算法|接口|性能|稳定/i.test(text)) {
        return "技术原理、系统边界、选型原因、风险处理和研发协同方式";
      }
      if (/产品|需求|客户|用户|业务|方案|规划|生命周期|指标/i.test(text)) {
        return "用户场景、业务目标、需求取舍、成功指标和上线复盘";
      }
      if (/进度|质量|成本|项目|交付|里程碑|风险/i.test(text)) {
        return "目标拆解、资源约束、里程碑、风险升级和复盘机制";
      }
      return "真实场景理解、个人贡献、方法迁移和结果复盘";
    }

    function jdDepthFollowup(row) {
      const focus = jdDepthFocus(row);
      if (focus.includes("技术")) return "为什么这样选型？边界在哪里？如果数据量或客户量扩大 10 倍，先改哪三处？";
      if (focus.includes("用户")) return "最初用户问题是什么？为什么先做这个方案？上线后哪个指标证明有效？";
      if (focus.includes("里程碑")) return "哪个节点最容易延期？你如何预警、降级、升级和复盘？";
      return "请给出一个真实场景，说明你的判断依据、取舍过程和复盘结果。";
    }

    function jdDepthFailSignal(row) {
      if (row.isMissing) return "无法提供相关项目，只能讲学习意愿或泛泛理解";
      if (row.evidenceLevel >= 3) return "只能复述名词，讲不清原理、边界、指标或个人贡献";
      return "只讲团队做了什么，不能说明自己为什么这么判断、怎么取舍、结果如何验证";
    }

    function interviewerQuestionReason(row) {
      if (row.isMissing) return "JD 有要求但简历没有项目锚点，必须确认是真缺经验、简历漏写，还是候选人无法证明。";
      if (row.evidenceLevel >= 3) return "简历只有低可信表述，容易是关键词堆砌或职责包装，必须追问真实场景和交付物。";
      if (row.evidenceLevel === 2) return "简历有相关线索但证据不完整，需要验证个人贡献、指标口径和结果归因。";
      return "这是当前较强匹配项，但越匹配越需要反包装，确认候选人是否真的做过关键决策和复盘。";
    }

    function interviewerGreenSignal(row) {
      if (row.isMissing) return "候选人能补出真实项目、明确本人动作、协作对象、结果和复盘，可将缺证改为待验证。";
      return "能说清背景、目标、本人边界、关键动作、指标来源、失败或取舍，且与简历表述一致。";
    }

    function interviewerYellowSignal(row) {
      if (row.isMissing) return "能说出相邻经验或学习计划，但没有直接项目；说明可迁移，不能当作直接匹配。";
      return "能讲项目大意，但数据口径、个人交付物、决策人或失败细节不清，需要继续深挖。";
    }

    function interviewerRedSignal(row) {
      if (row.isMissing) return "只能表达意愿或泛泛理解，无法给出项目；说明该 JD 能力当前不成立。";
      if (row.evidenceLevel >= 3) return "只重复简历关键词，无法还原场景、动作、结果或协作对象，存在包装风险。";
      return "前后说法矛盾、把团队成果全归给自己、编不出指标来源或回避失败细节，需标记高风险。";
    }

    function interviewerActionByAnswer(row) {
      if (row.isMissing) return "绿灯则要求补材料；黄灯按可迁移能力记录；红灯则该项不计入 JD 匹配。";
      if (row.evidenceLevel >= 2) return "绿灯可提升证据等级；黄灯继续追问口径；红灯下调匹配并记录包装风险。";
      return "绿灯可进入更深技术 / 业务追问；黄灯补问指标和边界；红灯触发反包装追问。";
    }

    function interviewerLens(index) {
      return ["业务负责人", "产品负责人", "项目推进", "技术架构", "客户方案", "反包装验证", "决策层压力官"][index % 7];
    }

    return {
      buildInterviewerResumeBrief,
      buildInterviewerMatchSnapshot,
      buildInterviewerMandatoryVerificationQuestions,
      buildDirectConclusion,
      buildConcreteJobAnalysis,
      buildCandidateThreeSecondSummary,
      buildInterviewerThreeSecondSummary,
      buildInterviewerOneMinuteDecisionBrief,
      buildCandidateAdvantageCards,
      buildInterviewerAdvantageCards,
      buildAbilityTransferAnalysis,
      buildConcreteGapTable,
      buildCandidateJdGapActionTable,
      buildCandidateMatchSnapshot,
      buildCandidateResumeRevisionWorkbench,
      buildCandidateFinalResumeChecklist,
      buildCandidateTruthfulnessGate,
      buildCandidateScorecard,
      buildCandidateMaterialQuestions,
      buildCandidateContributionVerbAudit,
      buildCandidateOptimizedResumeDraft,
      buildCandidateAtsPlainTextResume,
      buildCandidateHrPitch,
      buildCandidateMetricPromptTable,
      buildCandidateResumeRewriteTable,
      buildCandidateRewrittenResumeReference,
      buildCandidateEvidencePatchCards,
      buildConcreteCandidateQuestions,
      buildCandidateRevisionAdvice,
      buildCandidateStrategyAdvice,
      buildPressureInterviewGuide,
      buildConcreteInterviewerQuestions,
      buildInterviewerAuthenticityRiskTable,
      buildInterviewerJdDepthProbeTable,
      buildInterviewerPotentialSignalsTable,
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
