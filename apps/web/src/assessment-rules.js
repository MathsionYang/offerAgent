// Base assessment rules for evidence grading, gate decisions, and Offer leverage.
(function initOfferAgentAssessmentRules(global) {
  "use strict";

  function createAssessmentRules(dependencies = {}) {
    const {
      defaultRoleId = "product_manager",
      getRoleProfile = () => ({ requirements: [] }),
      clip = (value, length = 80) => String(value ?? "").slice(0, length),
    } = dependencies;

    function buildRequirementEvidenceRows(snapshot) {
      const normalized = normalizeSnapshot(snapshot);
      const jd = normalized.job_description || "";
      const resume = normalized.resume || "";
      const roleProfile = getRoleProfile(normalized.target_role);
      const requirements = roleProfile.requirements;
      return requirements.map((requirement) => {
        const resumeEvidence = findResumeEvidence(resume, requirement.keywords) || "简历未体现明确证据";
        const evidenceLevel = classifyEvidenceLevel(resumeEvidence);
        const isMissing = resumeEvidence === "简历未体现明确证据";
        return {
          capability: requirement.capability,
          jdEvidence: findEvidence(jd, requirement.keywords) || "JD 未提供明确原文",
          resumeEvidence,
          isMissing,
          evidenceLevel,
          evidenceLevelLabel: evidenceLevelLabel(evidenceLevel),
          evidenceReason: evidenceLevelReason(evidenceLevel, resumeEvidence),
          matchStatus: isMissing ? "不匹配 / 待补证" : evidenceLevel === 1 ? "匹配但仍需复核口径" : "部分匹配 / 需追问验证",
          verificationQuestion: buildVerificationQuestion(requirement.capability, resumeEvidence, evidenceLevel, requirement.verificationFocus),
        };
      });
    }

    function normalizeSnapshot(input = {}) {
      return {
        target_role: input.target_role || input.targetRole || defaultRoleId,
        resume: input.resume || "",
        job_description: input.job_description || input.jobDescription || "",
        company_context: input.company_context || input.companyContext || "",
        candidate_stage: input.candidate_stage || input.candidateStage || "",
        target_level: input.target_level || input.targetLevel || "",
        offer_constraints: input.offer_constraints || input.offerConstraints || "",
        selected_skills: input.selected_skills || input.selectedSkills || [],
        language: input.language || "zh",
      };
    }

    // Evidence levels intentionally prefer verifiable ownership and measurable outcomes.
    function classifyEvidenceLevel(evidenceText) {
      if (!evidenceText || evidenceText === "简历未体现明确证据") return 3;
      const hasQuant = /(\d+(\.\d+)?\s*%|\d+\s*(万|千|个|人|家|天|周|月|年|次|单|小时|分钟|ms|元|万元|亿)|上线|版本|v\d|ROI|DAU|MAU|GMV|SLA)/i.test(evidenceText);
      const hasSpecificRole = /主导|负责|Owner|owned|led|牵头|独立|设计|designed|launched|上线|落地|delivered|交付|专利|开源/i.test(evidenceText);
      const hasVagueTeam = /我们|参与|participated|协助|supported|支持|熟悉|了解|学习|接触|团队|team/i.test(evidenceText);
      if (hasQuant && hasSpecificRole) return 1;
      if (hasSpecificRole || hasQuant) return 2;
      if (hasVagueTeam) return 3;
      return 2;
    }

    function evidenceLevelLabel(level) {
      if (level === 1) return "一级证据（高可信）";
      if (level === 2) return "二级证据（中可信）";
      return "三级证据（低可信 / 待验证）";
    }

    function evidenceLevelReason(level, evidenceText) {
      if (level === 1) return "包含量化结果、上线/版本或明确个人动作，可优先复核口径";
      if (level === 2) return "包含负责、主导、上线或定性职责描述，需要面试追问验证";
      if (!evidenceText || evidenceText === "简历未体现明确证据") return "没有可引用的简历证据";
      return "表达较模糊或偏团队成果，个人贡献边界不清";
    }

    function buildVerificationQuestion(capability, evidenceText, level, verificationFocus = "") {
      const focusSuffix = verificationFocus ? `重点验证：${verificationFocus}。` : "";
      if (!evidenceText || evidenceText === "简历未体现明确证据") {
        return `请补充一个能证明“${capability}”的项目，说明背景、目标、个人动作、结果和复盘。${focusSuffix}`;
      }
      if (level === 1) {
        return `围绕“${capability}”说明指标分母、统计周期、上线前后对比和你的直接贡献。${focusSuffix}`;
      }
      if (level === 2) {
        return `你提到“${clip(evidenceText)}”，请拆解真实角色、关键决策、协作对象和结果归因。${focusSuffix}`;
      }
      return `这段经历更像模糊团队成果，请说明你个人做了什么、为什么由你负责、失败点是什么。${focusSuffix}`;
    }

    function buildEvidenceSummary(rows) {
      const counts = rows.reduce(
        (acc, row) => {
          acc[row.evidenceLevel] += 1;
          return acc;
        },
        { 1: 0, 2: 0, 3: 0 },
      );
      return `一级 ${counts[1]} 项，二级 ${counts[2]} 项，三级/缺证 ${counts[3]} 项`;
    }

    // Gate assessment decides whether the run can enter the Offer sandbox.
    function buildGateAssessment(snapshot, rows = buildRequirementEvidenceRows(snapshot)) {
      const normalized = normalizeSnapshot(snapshot);
      const roleProfile = getRoleProfile(normalized.target_role);
      const matchedRows = rows.filter((row) => !row.isMissing);
      const strongRows = rows.filter((row) => row.evidenceLevel === 1);
      const resume = normalized.resume || "";
      const jd = normalized.job_description || "";
      const roleKeywords = roleProfile.requirements.flatMap((item) => item.keywords || []);
      const roleSignalHits = roleKeywords.filter((keyword) => resume.toLowerCase().includes(String(keyword).toLowerCase())).length;
      const hasTargetIndustry = normalized.target_role === "product_manager" && /智慧矿山|矿山|GIS|冶金|矿产/i.test(resume);
      const jdNeedsTargetIndustry = normalized.target_role === "product_manager" && /智慧矿山|矿山|GIS|冶金|矿产/i.test(jd);
      const hasTransferableSignals =
        roleSignalHits >= 2 ||
        /B\s*端|B端|SaaS|企业|客户|方案|架构|研发|平台|系统|0-1|0 到 1|上线|交付|推进|数据|指标|项目|销售|工单|SLA|CRM|pipeline|测试|debug|代码|收入/i.test(resume);
      const bestEvidence = matchedRows[0]?.resumeEvidence || "简历尚未提供可直接支撑 JD 的项目证据";

      if (matchedRows.length >= 4 && (!jdNeedsTargetIndustry || hasTargetIndustry || strongRows.length >= 2)) {
        return {
          result: "匹配进入",
          enterSandbox: true,
          matchedCount: matchedRows.length,
          bestEvidence,
          summary: `已看到 ${matchedRows.length}/${rows.length} 项 JD 能力证据，具备进入下一轮沙盘的基础。`,
          nextStep: "进入下一轮沙盘，重点验证一级证据口径、失败复盘和真实决策权",
          transferPitch: "",
        };
      }

      if (matchedRows.length >= 2 || (hasTransferableSignals && matchedRows.length >= 1)) {
        return {
          result: "条件性进入（转岗适配）",
          enterSandbox: true,
          matchedCount: matchedRows.length,
          bestEvidence,
          summary: `目标岗位证据不足，但有 ${matchedRows.length}/${rows.length} 项可迁移能力线索，可进入条件性沙盘验证。`,
          nextStep: `使用能力迁移话术进入验证，但必须补齐 ${roleProfile.requirements.slice(0, 3).map((row) => row.capability).join("、")} 证据`,
          transferPitch: buildTransferPitch(normalized, matchedRows),
        };
      }

      return {
        result: "不匹配不推进",
        enterSandbox: false,
        matchedCount: matchedRows.length,
        bestEvidence,
        summary: `仅看到 ${matchedRows.length}/${rows.length} 项 JD 能力线索，核心项目证据不足。`,
        nextStep: "暂不进入下一轮沙盘，先补充完整项目闭环、指标口径和个人贡献证据",
        transferPitch: "",
      };
    }

    function buildTransferPitch(snapshot, matchedRows) {
      const anchor = matchedRows[0]?.resumeEvidence || clip(snapshot.resume) || "过往复杂项目经历";
      return `虽然我过往项目未必完全处于 JD 指定行业，但我处理过“${anchor}”这类复杂业务 / 系统问题。其核心能力包括需求拆解、客户沟通、技术方案取舍、研发协同和结果复盘，可迁移到贵司岗位。面试中我会用具体项目说明相似点、差异点和补齐行业认知的计划。`;
    }

    // Offer leverage is a signal, not an automatic salary recommendation.
    function buildOfferLeverage(snapshot) {
      const normalized = normalizeSnapshot(snapshot);
      const text = `${normalized.resume} ${normalized.company_context} ${normalized.offer_constraints}`;
      const levers = [];
      if (/竞对|竞争|其他 offer|其它 offer|Offer|offer/i.test(text)) levers.push("存在竞争机会 / Offer 线索");
      if (/S\s*级|A\s*级|绩效|晋升|核心员工|负责人/i.test(text)) levers.push("存在绩效、晋升或核心角色线索");
      if (/专利|论文|开源|著作权|标准|奖项/i.test(text)) levers.push("存在专利、论文、开源或外部成果");
      if (/智慧矿山|GIS|矿山|垂直领域|行业资源|客户资源|人脉/i.test(text)) levers.push("存在垂直领域资源或行业经验");
      if (/0-1|0 到 1|从零|上线|交付|提升|下降|%|\d+/.test(text)) levers.push("存在 0-1、上线交付或量化结果");
      const rating = levers.length >= 4 ? "强杠杆" : levers.length >= 2 ? "中杠杆" : levers.length >= 1 ? "弱杠杆" : "暂无明确杠杆";
      const summary = levers.length ? levers.slice(0, 2).join("；") : "材料中未发现竞对 Offer、绩效、专利、开源、垂直资源或明确量化成果";
      return {
        rating,
        summary,
        detail: levers.length ? `${levers.join("；")}。谈判时应转化为可量化贡献、稀缺经验和到岗确定性。` : "当前缺少可支撑溢价的明确证据，建议先补充竞对机会、绩效结果、垂直行业资源或可复核项目成果。",
      };
    }

    function findEvidence(text, keywords) {
      if (!text) return "";
      const parts = splitEvidenceParts(text);
      const hit = parts.find((part) => keywords.some((keyword) => part.toLowerCase().includes(keyword.toLowerCase())));
      return hit ? clip(hit) : "";
    }

    function findResumeEvidence(text, keywords) {
      if (!text) return "";
      const parts = splitEvidenceParts(text);
      const hit = parts.find((part) => {
        const matchesKeyword = keywords.some((keyword) => part.toLowerCase().includes(String(keyword).toLowerCase()));
        return matchesKeyword && isSubstantiveResumeEvidence(part);
      });
      return hit ? clip(hit) : "";
    }

    function splitEvidenceParts(text) {
      return String(text || "")
        .split(/[。；;\n]/)
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter(Boolean);
    }

    function isSubstantiveResumeEvidence(part) {
      const text = String(part || "").trim();
      if (!text) return false;
      if (isEmploymentHeaderEvidence(text)) return false;
      return true;
    }

    function isEmploymentHeaderEvidence(text) {
      const hasDateRange = /(\d{4}[./-]\d{1,2}|\d{4}\s*年\s*\d{1,2}\s*月|\d{4})\s*[-~至到—]+\s*(\d{4}[./-]\d{1,2}|\d{4}\s*年\s*\d{1,2}\s*月|至今|现在|present|now)/i.test(text);
      const hasOrganization = /公司|有限公司|集团|科技|信息技术|网络|软件|Inc\.?|LLC|Ltd\.?/i.test(text);
      const hasRoleTitle = /岗位|项目实施岗|实施岗|工程师|经理|顾问|专员|主管|实习|负责人|销售|支持/i.test(text);
      const hasSubstantiveAction = /主导|负责(?!人|岗位)|牵头|独立|设计|开发|上线|落地|交付|排查|定位|优化|提升|降低|完成|搭建|改造|推动|协调|复盘|签约|回款|处理|解决|沉淀|验证|实现|owner|owned|led|launched|delivered|improved/i.test(text);
      return hasDateRange && (hasOrganization || hasRoleTitle) && !hasSubstantiveAction;
    }

    return {
      buildRequirementEvidenceRows,
      normalizeSnapshot,
      classifyEvidenceLevel,
      evidenceLevelLabel,
      evidenceLevelReason,
      buildVerificationQuestion,
      buildEvidenceSummary,
      buildGateAssessment,
      buildTransferPitch,
      buildOfferLeverage,
      findEvidence,
      findResumeEvidence,
      isEmploymentHeaderEvidence,
    };
  }

  global.OfferAgentAssessmentRules = {
    createAssessmentRules,
  };
})(typeof window !== "undefined" ? window : globalThis);
