// Runtime Skill Registry: static skill definitions plus audit and prompt helpers.
(function initOfferAgentSkillRegistry(global) {
  "use strict";

  const skillLibrary = {
    hr: {
      name: "虚拟 HR 面试官",
      focus: "稳定性、动机、表达清晰度、风险边界",
      evidence: "从候选人阶段、Offer 约束、岗位动机和简历表达中生成。",
      proof: "候选人能清楚解释求职动机、岗位偏好、到岗约束和长期稳定性。",
      risk: "动机泛化、期望不清、对岗位真实挑战理解不足。",
      questions: [
        "你为什么考虑这个岗位和公司？最看重的三个因素是什么？",
        "如果业务节奏比预期更快，你通常如何管理压力和沟通预期？",
        "你过往离职或转岗的主要原因是什么？这次希望避免什么问题？",
      ],
    },
    business: {
      name: "虚拟业务负责人",
      focus: "业务理解、需求判断、指标意识、结果归因",
      evidence: "从 JD 核心职责、候选人业务项目和结果指标中生成。",
      proof: "候选人能把项目目标、用户问题、业务指标和取舍逻辑讲清楚。",
      risk: "只描述功能交付，无法还原业务判断和结果归因。",
      questions: [
        "请选一个最能代表你产品判断力的项目，说明你如何识别真实需求。",
        "你如何定义项目成功指标？哪些指标是你亲自推动改善的？",
        "如果业务方、客户和研发对优先级判断不同，你如何做取舍？",
      ],
    },
    project: {
      name: "虚拟项目推进面试官",
      focus: "目标拆解、里程碑、资源协调、风险控制、复盘机制",
      evidence: "从 JD 的跨团队推进要求和候选人项目协作经历中生成。",
      proof: "候选人能说明如何拆目标、控风险、协调资源并形成复盘机制。",
      risk: "只说“推动协作”，缺少具体阻力、决策、里程碑和责任边界。",
      questions: [
        "项目中最关键的里程碑是什么？你如何提前发现延期风险？",
        "跨团队协作中最大阻力是什么？你做过哪些具体推动动作？",
        "上线后你如何组织复盘？哪些结论沉淀成后续机制？",
      ],
    },
    negotiation: {
      name: "虚拟谈薪顾问",
      focus: "期望差距、竞争 Offer、入职概率、谈薪策略",
      evidence: "从目标职级、预算、到岗时间、竞争机会和候选人偏好中生成。",
      proof: "候选人能说明机会选择标准、薪资结构偏好和可接受条件。",
      risk: "关键条件后置暴露，导致 Offer 推进节奏和成功率不可控。",
      questions: [
        "你当前最看重薪资、成长、团队还是业务确定性？优先级如何排序？",
        "如果有多个机会，你会基于哪些标准做最终选择？",
        "在入职时间、薪资结构或职责范围上，哪些条件最影响你的决定？",
      ],
    },
    decision: {
      name: "决策层压力官",
      focus: "战略取舍、预算削减、资源约束、投入产出、极端压力判断",
      evidence: "从 JD 的战略职责、资源约束、项目复杂度和 Offer 上下文中生成，固定用于压力测试。",
      proof: "候选人能用业务指标、用户价值、风险等级和投入产出解释取舍，而不是只表达主观偏好。",
      risk: "无法解释判断依据，遇到预算缩减或方向冲突时只做被动执行。",
      questions: [
        "如果上级要求砍掉你负责模块一半预算，你如何重新排定需求优先级？请用具体指标说服我。",
        "如果你判断一个战略方向值得做，但短期 ROI 不好看，你会如何争取资源？",
        "如果项目投入三个月后效果不达预期，你会继续、收缩还是停止？依据是什么？",
      ],
    },
  };

  function createSkillRegistry(dependencies = {}) {
    const {
      defaultRoleId = "product_manager",
      getRoleLabel = (roleId) => roleId,
      getLanguage = () => "zh",
      getText = () => ({ skillCards: {} }),
      clip = (value, length = 160) => {
        const clean = String(value ?? "").replace(/\s+/g, " ").trim();
        return clean.length > length ? `${clean.slice(0, length)}...` : clean;
      },
    } = dependencies;

    // Registry entries expose which skill contributed evidence and questions.
    function buildSkillRegistry(snapshot, rows) {
      const selected = snapshot.selected_skills?.length ? snapshot.selected_skills : ["hr", "business", "project", "decision"];
      const roleLabel = getRoleLabel(snapshot.target_role || defaultRoleId, "zh");
      return selected
        .map((id, index) => {
          const skill = skillLibrary[id];
          if (!skill) return null;
          const highRiskRows = rows.filter((row) => row.isMissing || row.evidenceLevel >= 3);
          return {
            id,
            name: skill.name,
            version: `skill.${id}.v1`,
            role_id: snapshot.target_role || defaultRoleId,
            role_label: roleLabel,
            focus: skill.focus,
            adoption_status: snapshot.selected_skills?.includes(id) ? "selected" : "auto_selected",
            priority: id === "decision" || id === "business" ? 5 : 3 + index,
            audit: {
              contribution: `${skill.name} 贡献 ${skill.questions.length} 个基础问题，并针对 ${highRiskRows.slice(0, 2).map((row) => row.capability).join("、") || "当前核心证据"} 生成追问视角`,
              evidence_edges: highRiskRows.slice(0, 3).map((row) => `ev_req_${rows.indexOf(row) + 1}`),
              question_edges: rows.slice(index, index + 2).map((row) => `q_${rows.indexOf(row) + 1}`),
            },
          };
        })
        .filter(Boolean);
    }

    function formatSelectedSkills(selectedSkills) {
      return selectedSkills
        .map((id) => {
          const skill = skillLibrary[id];
          if (!skill) return "";
          if (getLanguage() === "en") {
            const skillText = getText().skillCards[id];
            return skillText ? `- ${skillText[0]}: ${skillText[1]}` : "";
          }
          return `- ${skill.name}：${skill.focus}。${skill.evidence}`;
        })
        .filter(Boolean)
        .join("\n");
    }

    function buildSkillQuestionMarkdown(selectedSkills, input) {
      const evidence = buildSkillEvidence(input);
      return selectedSkills
        .map((id) => {
          const skill = skillLibrary[id];
          if (!skill) return "";
          const questions = buildDeepQuestions(id, skill, evidence).map((question, index) => `${index + 1}. ${question}`).join("\n");
          return `### ${skill.name}

- 生成依据：${skill.evidence}
- 关联证据：${evidence.summary}
- 关注能力：${skill.focus}
- 好回答应证明：${skill.proof}
- 风险信号：${skill.risk}

${questions}`;
        })
        .filter(Boolean)
        .join("\n\n");
    }

    // Pull a compact evidence snapshot for skill-specific question generation.
    function buildSkillEvidence(input) {
      const text = `${input.resume} ${input.jobDescription} ${input.companyContext} ${input.offerConstraints}`;
      const projectMatch = input.resume.match(/[^。；;]*(项目|平台|系统|看板|CRM|工单|客户成功|产品|模块)[^。；;]*/);
      const jdMatch = input.jobDescription.match(/[^。；;]*(负责|要求|能力|经验|推进|指标|职责)[^。；;]*/);
      const hasMetrics = /指标|数据|提升|下降|转化|留存|响应|成本|营收|%|\d+/.test(text);
      const hasCollab = /推动|协作|研发|设计|运营|销售|客户|跨团队/.test(text);
      const hasOffer = /薪|预算|竞品|offer|Offer|到岗|期望|涨幅|入职|稳定/i.test(text);
      return {
        project: projectMatch ? projectMatch[0].trim() : "候选人简历中的核心项目经历",
        jd: jdMatch ? jdMatch[0].trim() : "JD 中的核心职责与能力要求",
        metric: hasMetrics ? "材料中出现指标或结果线索" : "指标口径和结果归因证据不足",
        collab: hasCollab ? "材料中出现跨团队推进线索" : "跨团队推进细节证据不足",
        offer: hasOffer ? "材料中出现 Offer / 到岗 / 期望约束线索" : "Offer 侧约束暂未充分提供",
        summary: `${clip(input.resume)}；${clip(input.jobDescription)}`,
      };
    }

    // Keep the hard-coded question templates deterministic for stable reports.
    function buildDeepQuestions(id, skill, evidence) {
      const common = {
        hr: [
          `你在选择这个岗位时，如何理解 JD 中“${evidence.jd}”对应的真实工作压力？`,
          `围绕“${evidence.project}”，你希望下一份工作延续什么、避开什么？`,
          `如果团队要求你在入职后快速接手类似职责，你最担心的适应成本是什么？`,
          `你的机会选择标准如何排序？请结合岗位职责、成长空间、薪资和到岗时间说明。`,
        ],
        business: [
          `请围绕“${evidence.project}”说明：最初的业务问题是什么，你如何判断它值得做？`,
          `JD 强调“${evidence.jd}”，你过去哪个项目最能证明这项能力？证据是什么？`,
          "你提到的项目结果如何定义指标口径？哪些改善来自你的判断和动作？",
          "如果业务方、客户和研发对优先级有冲突，你在该项目中如何做取舍？",
          "复盘这个项目，如果重新做一次，你会改变哪个关键产品决策？",
        ],
        project: [
          `请把“${evidence.project}”拆成目标、里程碑、依赖方和风险点。哪个节点最难推进？`,
          "JD 要求跨团队推进时，你如何建立节奏、同步机制和升级机制？",
          "项目中资源不足或需求变化时，你砍掉了什么、保留了什么，依据是什么？",
          "上线后你如何组织复盘？哪些结论沉淀成后续机制或产品规范？",
          "如果面试官扮演项目经理视角，你会如何证明自己不是只参与执行，而是能推进闭环？",
        ],
        negotiation: [
          `结合“${evidence.offer}”，哪些条件会显著影响你接受 Offer 的概率？`,
          "如果岗位职责与预期存在差异，你更看重职责完整度、薪资结构还是团队确定性？",
          "你如何比较这个机会和其他机会？请给出可排序的决策标准。",
          "到岗时间、薪资结构、职级定位中，哪一项最需要提前确认？为什么？",
        ],
        decision: [
          `如果上级要求砍掉“${evidence.project}”一半预算，你如何重排优先级？请用指标说明保留和放弃的依据。`,
          `JD 强调“${evidence.jd}”，如果短期 ROI 不好看但你认为战略上必须做，你会如何争取资源？`,
          "如果项目投入三个月后效果不达预期，你会继续、收缩还是停止？请说明判断阈值和止损机制。",
          "请讲一次你做过的高风险取舍：当时放弃了什么、保护了什么、最终结果如何复盘？",
        ],
      };
      return common[id] || skill.questions;
    }

    return {
      skillLibrary,
      buildSkillRegistry,
      formatSelectedSkills,
      buildSkillQuestionMarkdown,
      buildSkillEvidence,
      buildDeepQuestions,
    };
  }

  global.OfferAgentSkillRegistry = {
    createSkillRegistry,
    skillLibrary,
  };
})(typeof window !== "undefined" ? window : globalThis);
