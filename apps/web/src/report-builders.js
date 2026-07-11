// Audience-specific report composition and Offer simulation markdown builders.
(function initOfferAgentReportBuilders(global) {
  "use strict";

  function createReportBuilders(dependencies = {}) {
    const {
      getLanguage = () => "zh",
      getRunLanguage = () => "zh",
      clip = (value, length = 80) => String(value ?? "").slice(0, length),
      buildDirectConclusion = () => ({ blockQuestions: false, label: "" }),
      buildGateAssessment = () => ({}),
      buildOfferLeverage = () => ({}),
      buildConcreteJobAnalysis = () => "",
      buildAbilityTransferAnalysis = () => "",
      buildConcreteGapTable = () => "",
      buildCandidateJdGapActionTable = () => "",
      buildCandidateMatchSnapshot = () => "",
      buildCandidateResumeRevisionWorkbench = () => "",
      buildCandidateFinalResumeChecklist = () => "",
      buildCandidateTruthfulnessGate = () => "",
      buildCandidateScorecard = () => "",
      buildCandidateMaterialQuestions = () => "",
      buildCandidateContributionVerbAudit = () => "",
      buildCandidateOptimizedResumeDraft = () => "",
      buildCandidateAtsPlainTextResume = () => "",
      buildCandidateHrPitch = () => "",
      buildCandidateMetricPromptTable = () => "",
      buildCandidateResumeRewriteTable = () => "",
      buildCandidateRewrittenResumeReference = () => "",
      buildCandidateEvidencePatchCards = () => "",
      buildCandidateRevisionAdvice = () => "",
      buildCandidateStrategyAdvice = () => "",
      buildConcreteCandidateQuestions = () => "",
      buildPressureInterviewGuide = () => "",
      buildHumanFeedbackMarkdown = () => "",
      buildInterviewerResumeBrief = () => "",
      buildInterviewerMatchSnapshot = () => "",
      buildInterviewerMandatoryVerificationQuestions = () => "",
      buildInterviewerAuthenticityRiskTable = () => "",
      buildInterviewerJdDepthProbeTable = () => "",
      buildInterviewerPotentialSignalsTable = () => "",
      buildCandidateProfile = () => "",
      buildInterviewerScorecard = () => "",
      buildInterviewerSignalTable = () => "",
      buildInterviewerFollowupPaths = () => "",
      buildInterviewerDecisionAdvice = () => "",
      buildRoleAwareInterviewerModules = () => "",
      buildInterviewHandoffCard = () => "",
      buildPostInterviewEvaluationTemplate = () => "",
      buildConcreteInterviewerQuestions = () => "",
      localizePanelStance = (value) => value || "",
      localizePanelStage = (value) => value || "",
      localizePanelImpact = (value) => value || "",
      localizePanelClaim = (value) => value || "",
      localizeModeratorConsensus = (value) => value || "",
      localizeFeedbackImpact = (value) => value || "",
      buildRequirementEvidenceRows = () => [],
      translateGateResult = (value) => value || "",
      translateStage = (value) => value || "",
      translateOfferRating = (value) => value || "",
      translateGeneratedText = (value) => value || "",
      summarizeEvidenceCounts = () => "",
      normalizeSnapshot = (value) => value || {},
      buildEvidenceSummary = () => "",
      buildJdHiddenPainRows = () => [],
    } = dependencies;

    const resolveLanguage = () => getLanguage?.() === "en" ? "en" : "zh";

    // Compose all audience variants used by the live preview.
    function buildPreviewMarkdown(run) {
      return `${buildAudienceMarkdown(run, "candidate")}

${buildAudienceMarkdown(run, "interviewer")}

${buildAudienceMarkdown(run, "offer")}`;
    }

    // Keep audience selection in one place so exports and preview share logic.
    function buildAudienceMarkdown(run, audience) {
      if (getLanguage() === "en") return buildAudienceMarkdownEn(run, audience);

      const report = run.display_report ?? run.report ?? "";
      const snapshot = run.input_snapshot || {};
      const directConclusion = buildDirectConclusion(snapshot);
      const gate = buildGateAssessment(snapshot);

      if (audience === "candidate") {
        const body = [
          extractSection(report, "项目匹配闸口"),
          extractSection(report, "JD 隐性痛点解码"),
          extractSection(report, "岗位匹配"),
          extractSection(report, "风险与待验证"),
          extractSection(report, "候选人准备重点"),
          extractSection(report, "候选人策略建议"),
          extractSection(report, "必问追问"),
          extractSection(report, "动态校准指令"),
          extractSection(report, "证据链"),
        ]
          .filter(hasSubstantiveSection)
          .join("\n\n");
        return `# 候选人简历润色与面试问题准备报告

## 第一部分：简历润色

### 一页结论：匹配度与改简历顺序

${buildCandidateMatchSnapshot(snapshot)}

### 逐项改简历工作单：哪里没写清楚、怎么改

${buildCandidateResumeRevisionWorkbench(snapshot)}

### JD 要求与简历差距明细

${buildCandidateJdGapActionTable(snapshot)}

### 事实闸口：哪些内容能写进最终简历

${buildCandidateTruthfulnessGate(snapshot)}

### 当前材料五项评分

${buildCandidateScorecard(snapshot)}

### 先补这些信息，再生成最终投递版

${buildCandidateMaterialQuestions(snapshot)}

### JD 定制版简历草稿

${buildCandidateOptimizedResumeDraft(snapshot)}

### ATS 纯文本版

${buildCandidateAtsPlainTextResume(snapshot)}

### 最终投递前检查清单

${buildCandidateFinalResumeChecklist(snapshot)}

### HR 摘要与投递沟通话术

${buildCandidateHrPitch(snapshot)}

### 岗位指标追问词典

${buildCandidateMetricPromptTable(snapshot)}

### 改写后简历参考稿

${buildCandidateRewrittenResumeReference(snapshot)}

### 贡献动词风险校准

${buildCandidateContributionVerbAudit(snapshot)}

### 简历逐条修改清单

${buildCandidateResumeRewriteTable(snapshot)}

### 最该补强的 3 个项目证据

${buildCandidateEvidencePatchCards(snapshot)}

### 30 分钟简历修改顺序

${buildCandidateRevisionAdvice(snapshot)}

## 第二部分：面试预测问题准备

### 面试官最可能追问什么、怎么答

${buildConcreteCandidateQuestions(snapshot)}

### 压力追问应对

${buildPressureInterviewGuide(snapshot)}

### 面试主动节奏

${buildAbilityTransferAnalysis(snapshot)}

${buildCandidateStrategyAdvice(snapshot)}

## 附录：招聘岗位分析

${buildConcreteJobAnalysis(snapshot)}

## 附录：简历与 JD 不匹配原始对照

${buildConcreteGapTable(snapshot)}

## 附录：证据链与原始报告摘录

${body}

${buildHumanFeedbackMarkdown(run)}`;
      }

      if (audience === "interviewer") {
        const generatedDecision = extractSection(report, "面试官决策辅助");
        const generatedQuestions = extractSection(report, "面试官候选问题库（供挑选）");
        const generatedLens = extractSection(report, "面试官视角库");
        const generatedEvidence = extractSection(report, "证据链");
        const body = [
          generatedDecision,
          generatedQuestions,
          generatedLens,
          generatedEvidence,
        ]
          .filter(hasSubstantiveSection)
          .join("\n\n");
        return `# 面试官 JD 匹配与简历验真手册

## 一页结论：候选人与 JD 的匹配度

${buildInterviewerMatchSnapshot(snapshot)}

## 必问验真问题：用问询证明简历是否真实

${directConclusion.blockQuestions ? "当前核心能力缺少足够项目锚点，建议先要求候选人补充项目材料；补齐后再生成可采用追问。" : buildInterviewerMandatoryVerificationQuestions(snapshot)}

## 简历初评

${buildInterviewerResumeBrief(snapshot)}

## 项目经历真实性风险雷达：哪些地方最可能包装

${buildInterviewerAuthenticityRiskTable(snapshot)}

## JD 技术 / 业务理解验证

${buildInterviewerJdDepthProbeTable(snapshot)}

## 潜力判断：只看可观察信号

${buildInterviewerPotentialSignalsTable(snapshot)}

## 建议面试流程

${buildInterviewerFollowupPaths(snapshot)}

## 备用追问清单

${directConclusion.blockQuestions ? "当前核心能力缺少足够项目锚点，建议先要求候选人补充项目材料；补齐后再生成可采用追问。" : buildConcreteInterviewerQuestions(snapshot)}

## 结构化评分卡

${buildInterviewerScorecard(snapshot)}

## 红灯 / 绿灯信号

${buildInterviewerSignalTable(snapshot)}

## 候选人画像

${buildCandidateProfile(snapshot)}

## 录用条件与补充验证

${buildInterviewerDecisionAdvice(snapshot)}

## 角色分化面试官模块

${buildRoleAwareInterviewerModules(snapshot)}

## 面试后记录卡

${buildPostInterviewEvaluationTemplate(snapshot)}

## 面试轮次信息传递卡

${buildInterviewHandoffCard(snapshot)}

${directConclusion.blockQuestions ? `## 面试官处理建议

| 结论 | 原因 | 建议 |
| --- | --- | --- |
| 当前不列举追问问题 | 全部核心能力均为待验证 / 缺证，没有足够项目锚点支撑有效追问 | 建议先要求候选人补充能证明缺口能力的项目材料；补齐后再进入追问或沙盘 |
| 暂不进入下一轮沙盘 | 简历缺少支撑 JD 核心职责的有效项目证据 | 只保留不匹配点和证据缺口，作为筛选记录 |
` : ""}

${buildVirtualPanelMarkdown(run)}

${body}`;
      }

      if (audience === "offer") {
        return buildOfferSandboxMarkdown(run);
      }

      return report;
    }

    function buildAudienceMarkdownEn(run, audience) {
      const report = run.display_report ?? run.report ?? "";

      if (audience === "candidate") {
        const body = [
          extractSection(report, "Project Match Gate"),
          extractSection(report, "JD Hidden Pain Point Decoding"),
          extractSection(report, "Role Match"),
          extractSection(report, "Risks and Validation Needed"),
          extractSection(report, "Candidate Preparation Priorities"),
          extractSection(report, "Must-Ask Follow-Up Questions"),
          extractSection(report, "Evidence Chain"),
        ].filter(hasSubstantiveSection).join("\n\n");

        return `# Candidate Interview Preparation Report

${body || report}

${buildHumanFeedbackMarkdown(run)}`;
      }

      if (audience === "interviewer") {
        const body = [
          extractSection(report, "Interviewer Decision Support"),
          extractSection(report, "Interviewer Question Bank"),
          extractSection(report, "Interviewer Lens Library"),
          extractSection(report, "Evidence Chain"),
        ].filter(hasSubstantiveSection).join("\n\n");

        return `# Interviewer Question Guide

${buildVirtualPanelMarkdown(run)}

${body || report}`;
      }

      if (audience === "offer") return buildOfferSandboxMarkdownEn(run);

      return report;
    }

    function buildVirtualPanelMarkdown(run) {
      const panel = run.virtual_panel || [];
      const rounds = run.panel_discussion_rounds || [];
      const summary = run.moderator_summary || {};
      if (!panel.length) return "";
      const panelRows = panel
        .map((agent) => `| ${agent.name} | ${localizePanelStance(agent.stance)} | ${agent.influence_weight} | ${agent.focus} |`)
        .join("\n");
      const turnRows = rounds
        .flatMap((round) => (round.turns || []).slice(0, 3).map((turn) => {
          const agent = panel.find((item) => item.id === turn.agent_id);
          return `| ${localizePanelStage(round.stage)} | ${agent?.name || turn.agent_id} | ${localizePanelImpact(turn.impact)} | ${localizePanelClaim(turn.claim)} |`;
        }))
        .slice(0, 8)
        .join("\n");
      if (resolveLanguage() === "en") {
        return `## Virtual Interview Panel

| Persona | Stance | Influence | Focus |
| --- | --- | --- | --- |
${panelRows}

| Round | Persona | Impact | Claim |
| --- | --- | --- | --- |
${turnRows}

| Moderator Summary | Value |
| --- | --- |
| Consensus | ${summary.consensus || ""} |
| Lead persona | ${summary.lead_agent_id || ""} |
| Final recommendation | ${summary.final_recommendation || ""} |
| Offer impact | ${summary.offer_impact || ""} |
| Feedback impact | ${summary.feedback_impact || ""} |`;
      }

      return `## 虚拟面试委员会

| 委员角色 | 立场 | 影响权重 | 关注点 |
| --- | --- | --- | --- |
${panelRows}

| 轮次 | 委员角色 | 影响 | 发言 |
| --- | --- | --- | --- |
${turnRows}

| 主持人总结 | 内容 |
| --- | --- |
| 共识 | ${localizeModeratorConsensus(summary.consensus)} |
| 主导委员 | ${panel.find((agent) => agent.id === summary.lead_agent_id)?.name || summary.lead_agent_id || ""} |
| 最终建议 | ${localizePanelClaim(summary.final_recommendation || "")} |
| Offer 影响 | ${summary.offer_impact || ""} |
| 反馈影响 | ${localizeFeedbackImpact(summary.feedback_impact)} |`;
    }

    function buildOfferSandboxMarkdownEn(run) {
      const report = run.display_report ?? run.report ?? "";
      const snapshot = run.input_snapshot || {};
      const gate = buildGateAssessment(snapshot);
      const offerLeverage = buildOfferLeverage(snapshot);
      const rows = buildRequirementEvidenceRows(snapshot);

      return `# Offer Simulation Report

## Simulation Conclusion

| Module | Current Judgment | Next Step |
| --- | --- | --- |
| Project gate | ${translateGateResult(gate.result)} | ${gate.enterSandbox ? "Continue to offer-risk validation." : "Pause progression and request stronger project evidence."} |
| Candidate stage | ${translateStage(snapshot.candidate_stage)} | Align interview-round purpose before negotiation. |
| Target level | ${snapshot.target_level || "Not provided"} | Clarify scope, level anchor, and evaluation standard. |
| Negotiation leverage | ${translateOfferRating(offerLeverage.rating)} | ${translateGeneratedText(offerLeverage.detail, "en")} |
| Offer constraints | ${snapshot.offer_constraints ? clip(snapshot.offer_constraints) : "Not provided"} | Add budget, expected compensation, competing offers, start date, and team urgency. |
| Evidence credibility | ${summarizeEvidenceCounts(rows)} | First-level evidence may support pricing; pending evidence should trigger more validation. |

## Decision Matrix

| Scenario | Recommended Action | Risk Signal |
| --- | --- | --- |
| ${gate.enterSandbox ? "Can enter next validation round" : "Do not push forward yet"} | ${gate.enterSandbox ? "Validate project evidence, incident review, metric definition, and motivation constraints." : "Ask the candidate to supplement project loop, personal contribution, and role-fit evidence first."} | Candidate cannot explain ownership, denominator, trade-off, failure, or mechanism change. |
| Before negotiation | Clarify level, compensation structure, start date, competing offers, and decision criteria. | Key constraints are revealed too late. |
| After interview | Update role match, evidence credibility, acceptance probability, and negotiation risk. | Feedback is not captured and the question library cannot improve. |

## Extracted Report Context

${[
  extractSection(report, "Offer Simulation"),
  extractSection(report, "Interviewer Question Bank"),
  extractSection(report, "Interviewer Lens Library"),
  extractSection(report, "Dynamic Calibration Instruction"),
  extractSection(report, "Evidence Chain"),
].filter(hasSubstantiveSection).join("\n\n") || "No extracted offer, question bank, lens library, calibration, or evidence-chain content is available yet."}`;
    }

    function buildOfferSandboxMarkdown(run) {
      const report = run.display_report ?? run.report ?? "";
      const snapshot = run.input_snapshot || {};
      const gate = buildGateAssessment(snapshot);
      const offerLeverage = buildOfferLeverage(snapshot);
      const normalized = normalizeSnapshot(snapshot);
      const directConclusion = buildDirectConclusion(snapshot);
      const offerSection = extractSection(report, "Offer 沙盘推演");
      const summarySection = extractSection(report, "一页摘要");
      const gateSection = extractSection(report, "项目匹配闸口");
      const hiddenPainSection = extractSection(report, "JD 隐性痛点解码");
      const matchSection = extractSection(report, "岗位匹配");
      const riskSection = extractSection(report, "风险与待验证");
      const questionSection = extractSection(report, "面试官候选问题库（供挑选）");
      const interviewerSection = extractSection(report, "面试官视角库");
      const dynamicSection = extractSection(report, "动态校准指令");
      const evidenceSection = extractSection(report, "证据链");
      const requirementRows = buildRequirementEvidenceRows(snapshot);
      const evidenceSummary = buildEvidenceSummary(requirementRows);
      const matchedRows = requirementRows.filter((row) => !row.isMissing);
      const missingRows = requirementRows.filter((row) => row.isMissing);
      const hiddenPainRows = buildJdHiddenPainRows(snapshot);
      const sevenStepReasoning = buildOfferSevenStepReasoning({
        report,
        snapshot,
        normalized,
        gate,
        directConclusion,
        offerLeverage,
        requirementRows,
        matchedRows,
        missingRows,
        hiddenPainRows,
        sections: {
          summarySection,
          gateSection,
          hiddenPainSection,
          matchSection,
          riskSection,
          offerSection,
          questionSection,
          interviewerSection,
          dynamicSection,
          evidenceSection,
        },
      });
      const extractedAppendix = [
        offerSection,
        questionSection,
        interviewerSection,
        dynamicSection,
        evidenceSection,
      ].filter(hasSubstantiveSection).join("\n\n");

      return `# Offer 沙盘推演报告

## 沙盘结论

| 模块 | 当前判断 | 推进动作 |
| --- | --- | --- |
| 项目闸口 | ${gate.result}：${gate.summary} | ${gate.nextStep} |
| 候选人阶段 | ${normalized.candidate_stage || "未提供"} | 根据面试轮次决定是补证、深挖还是进入谈薪验证 |
| 目标职级 | ${normalized.target_level || "未提供"} | 面试前明确职级锚点、职责边界和评估标准 |
| 谈判杠杆 | ${offerLeverage.rating}：${offerLeverage.summary} | ${offerLeverage.detail} |
| Offer 约束 | ${normalized.offer_constraints ? clip(normalized.offer_constraints) : "未提供 Offer / 谈薪约束"} | 补充预算范围、候选人期望、竞对 Offer、到岗时间和团队紧急程度 |
| 证据可信度 | ${evidenceSummary} | 一级证据可用于定价，二级证据需追问，三级证据不得直接转化为 Offer 溢价 |

## 七个步骤推理总览

${sevenStepReasoning.overview}

## 七个步骤详细推演

${sevenStepReasoning.detail}

## Offer 决策矩阵

${sevenStepReasoning.decisionMatrix}

## 推进建议

| 场景 | 建议动作 | 风险信号 |
| --- | --- | --- |
| ${gate.enterSandbox ? "可进入下一轮沙盘" : "暂不建议推进"} | ${gate.enterSandbox ? "围绕项目证据、失败复盘、指标口径和动机约束继续验证" : "先要求候选人补齐项目闭环、个人贡献和岗位匹配证据"} | 候选人无法解释真实角色、指标分母、资源取舍或失败复盘 |
| 谈薪前 | 明确职级、薪资结构、到岗时间、竞对机会和候选人选择标准 | 关键约束后置暴露，导致 Offer 成功率下降 |
| 面试后 | 根据实际回答更新岗位匹配、证据可信度、入职概率和谈薪风险 | 面试反馈未回填，题库和判断无法迭代 |

## 原始报告摘录

${extractedAppendix || "原始报告中暂无可摘录的 Offer、问题库、视角库、动态校准或证据链内容。"}`;
    }

    // Keep the seven-step reasoning deterministic and reusable across exports.
    function buildOfferSevenStepReasoning(context) {
      const {
        normalized,
        gate,
        directConclusion,
        offerLeverage,
        requirementRows,
        matchedRows,
        missingRows,
        hiddenPainRows,
        sections,
      } = context;
      const strongestRows = [...requirementRows]
        .filter((row) => !row.isMissing)
        .sort((a, b) => a.evidenceLevel - b.evidenceLevel)
        .slice(0, 3);
      const weakestRows = (missingRows.length ? missingRows : requirementRows.filter((row) => row.evidenceLevel >= 2))
        .slice(0, 3);
      const extractedOfferSummary = summarizeSection(sections.offerSection, "原始报告未生成明确 Offer 沙盘推演正文，需要以闸口、证据和约束补推。");
      const extractedRiskSummary = summarizeSection(sections.riskSection, "原始报告未生成明确风险段落，按缺证项、约束后置和动机不清处理。");
      const extractedQuestionSummary = summarizeSection(
        [sections.questionSection, sections.interviewerSection].filter(Boolean).join("\n"),
        "原始报告未生成明确问题库，面试中应围绕项目真实性、失败复盘、指标口径和谈薪动机追问。",
      );
      const hiddenPainSummary = hiddenPainRows
        .map((row) => `${row.phrase}：${row.pressure}；准备 ${row.prep}`)
        .join("；");

      const stepRows = [
        {
          step: "1. 证据解析",
          reasoning: `先读取简历、JD、公司上下文和 Offer 约束。当前证据可信度为 ${buildEvidenceSummary(requirementRows)}。`,
          evidence: `简历：${normalized.resume ? clip(normalized.resume) : "未提供"}；JD：${normalized.job_description ? clip(normalized.job_description) : "未提供"}`,
          offerImpact: strongestRows.length
            ? `可暂作谈判锚点的证据：${strongestRows.map((row) => `${row.capability}（${row.evidenceLevelLabel}）`).join("、")}`
            : "暂未发现可直接支撑 Offer 溢价的高可信证据。",
          action: "面试前把每个关键证据补齐分母、周期、个人贡献和可复核结果。",
        },
        {
          step: "2. 匹配闸口",
          reasoning: `${gate.result}。${gate.summary}`,
          evidence: gate.bestEvidence,
          offerImpact: gate.enterSandbox
            ? "可进入下一轮，但 Offer 强度取决于后续追问能否把二级/三级证据提升为可信项目证据。"
            : "暂不建议进入谈薪或强推进，否则容易在业务面或谈薪阶段暴露核心不匹配。",
          action: gate.nextStep,
        },
        {
          step: "3. 岗位匹配",
          reasoning: `${directConclusion.label}。已匹配 ${matchedRows.length}/${requirementRows.length} 项，缺证 ${missingRows.length} 项。`,
          evidence: matchedRows.length
            ? matchedRows.map((row) => `${row.capability}：${row.resumeEvidence}`).join("；")
            : "简历未体现明确岗位匹配证据。",
          offerImpact: missingRows.length
            ? `缺证项会压低职级或薪资空间：${missingRows.slice(0, 3).map((row) => row.capability).join("、")}`
            : "岗位匹配表面完整，但仍需用反包装追问验证真实角色和指标归因。",
          action: "把岗位要求转成面试评分项，逐项记录回答质量、证据等级和是否影响 Offer 定级。",
        },
        {
          step: "4. 风险校准",
          reasoning: extractedRiskSummary,
          evidence: weakestRows.map((row) => `${row.capability}：${row.resumeEvidence}`).join("；") || "暂无明确风险证据。",
          offerImpact: "风险项决定是否降级、延后 Offer、加面或要求补材料。",
          action: "至少追问一次项目延期或线上故障，要求按时间线说明发现、止血、根因、整改和后续机制变化。",
        },
        {
          step: "5. 沙盘推演",
          reasoning: extractedOfferSummary,
          evidence: `阶段：${normalized.candidate_stage || "未提供"}；目标职级：${normalized.target_level || "未提供"}；约束：${normalized.offer_constraints ? clip(normalized.offer_constraints) : "未提供"}`,
          offerImpact: `${offerLeverage.rating}。${offerLeverage.detail}`,
          action: "在业务面后更新入职概率、竞对机会、薪资底线、到岗时间、职级锚点和团队紧急程度。",
        },
        {
          step: "6. 问题库生成",
          reasoning: extractedQuestionSummary,
          evidence: hiddenPainSummary || "JD 暂未识别出明确隐性压力源。",
          offerImpact: "问题库回答质量会决定是否推进终面、是否追加技术/业务交叉面、是否进入谈薪。",
          action: "使用业务负责人、项目推进、技术架构、谈薪顾问和决策层压力官视角交叉验证同一项目。",
        },
        {
          step: "7. 证据链收束",
          reasoning: "将简历证据、JD 证据、公司上下文、Offer 约束和面试反馈收束为可复核决策链。",
          evidence: buildEvidenceChainPlain(normalized),
          offerImpact: "只有能被证据链支撑的能力、稀缺性和到岗确定性，才应进入最终 Offer 定价。",
          action: "面试后把实际追问、候选人回答、证据等级变化和谈薪约束回填到该报告，形成最终推进建议。",
        },
      ];

      const overview = `| 步骤 | 推理结论 | Offer 影响 | 下一步 |
| --- | --- | --- | --- |
${stepRows.map((row) => `| ${row.step} | ${row.reasoning} | ${row.offerImpact} | ${row.action} |`).join("\n")}`;

      const detail = stepRows
        .map(
          (row) => `### ${row.step}

| 维度 | 内容 |
| --- | --- |
| 推理内容 | ${row.reasoning} |
| 证据来源 | ${row.evidence} |
| 对 Offer 的影响 | ${row.offerImpact} |
| 必须补充 / 验证 | ${row.action} |`,
        )
        .join("\n\n");

      const decisionMatrix = `| 决策项 | 当前判断 | 触发条件 | 建议动作 |
| --- | --- | --- | --- |
| 是否继续推进 | ${gate.enterSandbox ? "继续推进，但必须带条件验证" : "暂缓推进"} | ${gate.result}；${gate.summary} | ${gate.nextStep} |
| 职级定位 | ${normalized.target_level || "未提供"} | 岗位匹配、项目复杂度、真实决策权、研发协同深度 | 面试后根据证据等级决定维持、下调或加面 |
| 薪资 / 溢价 | ${offerLeverage.rating} | ${offerLeverage.summary} | ${offerLeverage.detail} |
| 入职概率 | 待验证 | 动机清晰、约束前置、竞对机会透明、到岗时间明确 | HR 面或谈薪前补齐选择标准和关键约束 |
| 风险处置 | ${missingRows.length ? "存在缺证风险" : "表面完整但需反包装"} | 无法解释失败、指标口径、个人贡献或技术取舍 | 追加项目复盘题和现场推演题 |`;

      return { overview, detail, decisionMatrix };
    }

    function summarizeSection(section, fallback) {
      if (!hasSubstantiveSection(section || "")) return fallback;
      return clip(
        section
          .replace(/^## .+$/m, "")
          .replace(/\|/g, " ")
          .replace(/---/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      );
    }

    function buildEvidenceChainPlain(snapshot) {
      return [
        `简历：${snapshot.resume ? clip(snapshot.resume) : "未提供"}`,
        `JD：${snapshot.job_description ? clip(snapshot.job_description) : "未提供"}`,
        `上下文：${snapshot.company_context ? clip(snapshot.company_context) : "未提供"}`,
        `Offer 约束：${snapshot.offer_constraints ? clip(snapshot.offer_constraints) : "未提供"}`,
      ].join("；");
    }

    function extractSection(markdown, heading) {
      const pattern = new RegExp(`(^## ${escapeRegExp(heading)}\\n[\\s\\S]*?)(?=\\n## |$)`, "m");
      const match = String(markdown || "").match(pattern);
      return match ? match[1].trim() : "";
    }

    function hasSubstantiveSection(section) {
      const body = String(section || "").replace(/^## .+$/m, "").replace(/\s+/g, "");
      return body.length > 30;
    }

    function escapeRegExp(value) {
      return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    return {
      buildPreviewMarkdown,
      buildAudienceMarkdown,
      buildAudienceMarkdownEn,
      buildVirtualPanelMarkdown,
      buildOfferSandboxMarkdownEn,
      buildOfferSandboxMarkdown,
      buildOfferSevenStepReasoning,
      summarizeSection,
      buildEvidenceChainPlain,
      extractSection,
      hasSubstantiveSection,
    };
  }

  global.OfferAgentReportBuilders = {
    createReportBuilders,
  };
})(typeof window !== "undefined" ? window : globalThis);
