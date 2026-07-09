// Central domain data shared by the static UI and report builders.
(function initOfferAgentDomainData(global) {
  "use strict";

  const CONSISTENCY_SCHEMA_VERSION = "offeragent.consistency.v1";
  const RUN_CACHE_PREFIX = "offeragent:run:";
  const RUN_CACHE_LIMIT = 12;
  const MIROFISH_REFERENCE_WORKFLOW = [
    "seed_extraction",
    "graph_memory",
    "persona_generation",
    "agent_configuration",
    "panel_simulation",
    "moderator_report",
  ];
  
  const providerDefaults = {
    mock: { model: "mock-product-manager-v1", baseUrl: "" },
    openai: { model: "gpt-4.1-mini", baseUrl: "https://api.openai.com/v1" },
    deepseek: { model: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1" },
    qwen: { model: "qwen-plus", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
    kimi: { model: "moonshot-v1-8k", baseUrl: "https://api.moonshot.cn/v1" },
    custom: { model: "", baseUrl: "" },
  };
  
  const samples = {
    zh: {
      targetRole: "product_manager",
      resume:
        "候选人：张三，5 年 B 端 SaaS 产品经验。曾负责客户成功平台、工单系统和数据看板。主导过从 0 到 1 的功能规划，推动研发、设计、运营协作，上线后工单平均响应时长下降 28%。在另一个项目中负责数据看板需求梳理，但简历未说明指标口径和业务复盘方式。候选人期望负责更完整的产品模块，并希望团队业务增长确定性更强。",
      job:
        `1、负责智慧矿山行业产品规划、设计和产品生命周期管理，包括不限于行业市场与竞争分析；
  2、负责智慧矿山业务咨询，智慧矿山行业调研、产品调研以及项目调研等，包括客户需求分析、技术交流引导和项目方案设计，指导项目技术架构设计与技术风险控制；
  3、负责前瞻性技术探索，对核心技术选型、新功能研发、新专利布局负责；
  4、对技术转化负责，深入用户场景研究需求，并推动方案实施；
  5、能够深入研发一线，参与和指导研发工作。
  
  任职要求：
  1、计算机相关专业，统招本科及以上学历，5年以上产品研发经验，有系统设计与开发经验优先；
  2、精通Axure、Figma等产品设计软件，熟悉C++、Java、Java script等编程语言及常用的前后端框架，熟悉常用的数据库和操作系统；
  3、优秀的解决问题能力，良好的沟通协调能力和团队精神，较强学习能力和抗压能力；
  4、5年以上智慧矿山产品研发工作经验，负责过完整矿山或GIS平台产品的0-1开发工作，以及丰富的客户交流及内部协调经验；
  5、有产品意识，熟悉产品生命周期管理，具有敏锐的产品嗅觉和较强的创新能力，思路清晰，良好的产品开发成本、进度和质量控制能力；
  6、有3年以上软件研发经验者优先。`,
      context:
        "公司为成长期 B 端 SaaS 团队，希望候选人能独立负责客户成功相关产品模块。面试重点：需求判断、指标意识、跨团队推动、复盘能力。",
      offerConstraints:
        "目标职级：中级产品经理。预算较紧，希望候选人 4 周内到岗。候选人可能同时接触另一家 CRM 公司，需要验证动机和岗位偏好。",
      candidateStage: "业务一面",
      targetLevel: "中级产品经理",
    },
    en: {
      targetRole: "product_manager",
      resume:
        "Candidate: Alex Chen, 5 years of B2B SaaS product experience. Owned a customer success platform, ticketing workflow, and analytics dashboard. Led 0-to-1 feature planning, coordinated engineering, design, and operations, and reduced average ticket response time by 28% after launch. Also handled analytics dashboard requirement discovery, but the resume does not clarify metric definitions, personal contribution boundaries, or post-launch review methods. The candidate wants to own a more complete product module and prefers a team with clearer business growth visibility.",
      job:
        `1. Own product planning, design, and lifecycle management for smart mining products, including industry market research and competitive analysis.
  2. Lead smart mining consulting, industry research, product research, and project discovery, including customer requirement analysis, technical communication, solution design, and guidance on technical architecture and risk control.
  3. Explore forward-looking technologies and take ownership of core technology selection, new feature R&D, and patent planning.
  4. Own technology commercialization by deeply studying user scenarios and driving implementation.
  5. Work closely with frontline engineering teams and participate in or guide R&D work.
  
  Requirements:
  1. Bachelor's degree or above in computer science or a related field; 5+ years of product/R&D experience; system design or software development experience preferred.
  2. Proficient with Axure, Figma, and similar product design tools; familiar with C++, Java, JavaScript, common frontend/backend frameworks, databases, and operating systems.
  3. Strong problem-solving, communication, collaboration, learning ability, and pressure tolerance.
  4. 5+ years of smart mining product R&D experience, ownership of complete 0-to-1 mining or GIS platform products, and rich customer communication plus internal coordination experience.
  5. Strong product sense, lifecycle management capability, innovation ability, clear thinking, and product development cost, schedule, and quality control.
  6. 3+ years of software engineering experience preferred.`,
      context:
        "The company is a growth-stage B2B SaaS team and expects the candidate to independently own customer-success-related product modules. Interview focus: requirement judgment, metric thinking, cross-functional execution, and retrospective capability.",
      offerConstraints:
        "Target level: Mid-level Product Manager. Budget is tight and the team hopes the candidate can join within 4 weeks. The candidate may also be speaking with another CRM company, so motivation and role preference need validation.",
      candidateStage: "业务一面",
      targetLevel: "Mid-level Product Manager",
    },
  };
  
  const sample = samples.zh;
  
  const roleProfiles = {
    product_manager: {
      label: "产品经理",
      labelEn: "Product Manager",
      summary: "围绕场景理解、产品规划、客户需求、研发协同、创新探索和交付质量评估候选人。",
      summaryEn:
        "Evaluates scenario understanding, product planning, customer needs, engineering collaboration, innovation, and delivery quality.",
      requirements: [
        {
          capability: "行业场景理解",
          keywords: ["智慧矿山", "smart mining", "GIS", "矿山", "mining", "冶金", "矿产", "行业", "industry", "B 端", "B端", "B2B", "SaaS", "企业", "enterprise"],
          verificationFocus: "目标行业、客户角色、业务约束和可迁移经验",
        },
        {
          capability: "产品规划与生命周期管理",
          keywords: ["产品规划", "product planning", "lifecycle", "生命周期", "0-1", "0-to-1", "0 到 1", "从零", "产品设计", "product design", "规划", "roadmap"],
          verificationFocus: "路线图取舍、版本节奏、从 0 到 1 的闭环和复盘",
        },
        {
          capability: "客户需求分析与方案设计",
          keywords: ["客户", "customer", "requirement", "需求分析", "技术交流", "technical communication", "方案设计", "solution", "consulting", "咨询", "调研", "research", "需求梳理"],
          verificationFocus: "需求真伪判断、方案边界、客户沟通和落地结果",
        },
        {
          capability: "技术架构与研发协同",
          keywords: ["架构", "architecture", "研发", "R&D", "engineering", "C++", "Java", "JavaScript", "database", "数据库", "operating system", "操作系统", "前后端", "backend", "frontend", "技术"],
          verificationFocus: "技术约束理解、研发协同、方案取舍和风险控制",
        },
        {
          capability: "技术选型与创新探索",
          keywords: ["前瞻", "forward-looking", "技术选型", "technology selection", "新功能", "new feature", "专利", "patent", "技术探索", "innovation", "创新", "开源", "open source"],
          verificationFocus: "技术趋势判断、创新来源、验证方式和商业化路径",
        },
        {
          capability: "成本、进度、质量控制",
          keywords: ["成本", "cost", "进度", "schedule", "quality", "质量", "风险控制", "risk control", "协调", "coordination", "推进", "delivery", "延期", "delay", "milestone", "里程碑", "retrospective", "复盘"],
          verificationFocus: "里程碑、资源约束、质量标准、延期处理和复盘机制",
        },
      ],
    },
    developer: {
      label: "开发人员",
      labelEn: "Developer",
      summary: "围绕工程实现、系统设计、代码质量、排障、性能安全和交付协作评估候选人。",
      summaryEn:
        "Evaluates implementation depth, system design, code quality, debugging, performance/security, and delivery collaboration.",
      requirements: [
        {
          capability: "编程语言与工程实现",
          keywords: ["Java", "Python", "Go", "Golang", "C++", "C#", "JavaScript", "TypeScript", "前端", "后端", "frontend", "backend", "API", "接口", "编码", "开发", "implementation"],
          verificationFocus: "核心语言熟练度、关键模块实现、代码边界和个人贡献",
        },
        {
          capability: "系统设计与架构理解",
          keywords: ["架构", "architecture", "system design", "微服务", "microservice", "分布式", "缓存", "cache", "消息队列", "MQ", "数据库", "database", "高并发", "scalable"],
          verificationFocus: "架构取舍、容量预估、数据流、接口边界和演进成本",
        },
        {
          capability: "代码质量与测试习惯",
          keywords: ["测试", "test", "unit test", "单元测试", "集成测试", "CI", "CD", "code review", "重构", "refactor", "质量", "覆盖率", "lint"],
          verificationFocus: "测试策略、代码评审、缺陷预防和质量度量",
        },
        {
          capability: "问题排查与线上稳定性",
          keywords: ["排障", "debug", "故障", "incident", "线上", "生产", "监控", "monitoring", "日志", "log", "告警", "rollback", "回滚", "SRE"],
          verificationFocus: "事故时间线、定位方法、止血动作、根因和长期修复",
        },
        {
          capability: "性能、安全与可维护性",
          keywords: ["性能", "performance", "优化", "latency", "延迟", "吞吐", "QPS", "安全", "security", "权限", "auth", "可维护", "observability"],
          verificationFocus: "性能瓶颈、安全边界、可观测性和维护成本",
        },
        {
          capability: "交付协作与需求理解",
          keywords: ["需求", "PRD", "协作", "沟通", "delivery", "交付", "敏捷", "scrum", "迭代", "排期", "项目推进", "跨团队"],
          verificationFocus: "需求澄清、排期承诺、跨角色协作和交付风险",
        },
      ],
    },
    technical_support: {
      label: "技术支持人员",
      labelEn: "Technical Support",
      summary: "围绕问题分诊、故障定位、客户沟通、SLA、升级协作和知识沉淀评估候选人。",
      summaryEn:
        "Evaluates triage, troubleshooting, customer communication, SLA ownership, escalation, and knowledge management.",
      requirements: [
        {
          capability: "问题分诊与优先级判断",
          keywords: ["分诊", "triage", "优先级", "priority", "工单", "ticket", "case", "问题分类", "影响范围", "严重级别", "P0", "P1"],
          verificationFocus: "影响范围、严重级别、客户紧急度和处理顺序",
        },
        {
          capability: "技术排查与复现能力",
          keywords: ["排查", "troubleshoot", "复现", "reproduce", "日志", "log", "抓包", "诊断", "debug", "配置", "环境", "root cause"],
          verificationFocus: "复现路径、日志证据、排查假设和根因确认",
        },
        {
          capability: "客户沟通与预期管理",
          keywords: ["客户沟通", "customer communication", "预期管理", "解释", "安抚", "汇报", "同步", "stakeholder", "满意度", "CSAT"],
          verificationFocus: "客户语言转换、进展同步、风险解释和满意度维护",
        },
        {
          capability: "SLA 响应与服务质量",
          keywords: ["SLA", "响应时间", "response time", "解决时长", "MTTR", "服务质量", "时效", "on-call", "值班", "升级"],
          verificationFocus: "响应节奏、超时处理、服务指标和质量复盘",
        },
        {
          capability: "升级协作与跨团队推进",
          keywords: ["升级", "escalation", "研发", "产品", "运维", "协作", "跨团队", "推动", "缺陷", "bug", "hotfix", "补丁"],
          verificationFocus: "升级标准、协作对象、推动方式和闭环结果",
        },
        {
          capability: "知识库与流程沉淀",
          keywords: ["知识库", "knowledge base", "FAQ", "文档", "SOP", "流程", "沉淀", "培训", "复盘", "自助"],
          verificationFocus: "文档沉淀、流程改进、复用效果和培训覆盖",
        },
      ],
    },
    sales: {
      label: "销售人员",
      labelEn: "Sales",
      summary: "围绕线索发现、客户开发、商机推进、异议处理、业绩达成和管道纪律评估候选人。",
      summaryEn:
        "Evaluates lead discovery, customer development, deal progression, objection handling, quota achievement, and pipeline discipline.",
      requirements: [
        {
          capability: "线索发现与客户画像",
          keywords: ["线索", "lead", "leads", "客户画像", "ICP", "获客", "prospecting", "名单", "商机来源", "渠道", "拓客"],
          verificationFocus: "线索来源、客户筛选标准、触达策略和转化数据",
        },
        {
          capability: "客户开发与需求挖掘",
          keywords: ["客户开发", "BD", "拜访", "访谈", "需求挖掘", "痛点", "discovery", "客户关系", "决策链", "stakeholder"],
          verificationFocus: "客户角色、痛点验证、决策链和真实预算",
        },
        {
          capability: "商机推进与方案呈现",
          keywords: ["商机", "opportunity", "pipeline", "推进", "demo", "演示", "方案", "proposal", "POC", "试点", "招投标"],
          verificationFocus: "阶段推进、方案匹配、关键动作和赢单障碍",
        },
        {
          capability: "谈判与异议处理",
          keywords: ["谈判", "negotiation", "异议", "objection", "价格", "报价", "折扣", "采购", "合同", "竞品", "竞争"],
          verificationFocus: "价格边界、竞品对比、异议拆解和成交策略",
        },
        {
          capability: "业绩达成与收入贡献",
          keywords: ["业绩", "quota", "ARR", "MRR", "收入", "revenue", "GMV", "回款", "签约", "成单", "赢单", "目标达成", "%"],
          verificationFocus: "目标口径、个人贡献、签约金额、回款和可复现打法",
        },
        {
          capability: "CRM 管理与销售纪律",
          keywords: ["CRM", "Salesforce", "HubSpot", "纷享销客", "销售漏斗", "forecast", "预测", "复盘", "跟进", "next step"],
          verificationFocus: "管道更新、预测准确性、跟进节奏和复盘机制",
        },
      ],
    },
  };
  
  const defaultRoleId = "product_manager";
  
  function getRoleProfile(roleId) {
    return roleProfiles[roleId] || roleProfiles[defaultRoleId];
  }
  
  function getRoleLabel(roleId, language = "zh") {
    const profile = getRoleProfile(roleId);
    return language === "en" ? profile.labelEn : profile.label;
  }

  global.OfferAgentData = Object.freeze({
    CONSISTENCY_SCHEMA_VERSION,
    RUN_CACHE_PREFIX,
    RUN_CACHE_LIMIT,
    MIROFISH_REFERENCE_WORKFLOW,
    providerDefaults,
    samples,
    sample,
    roleProfiles,
    defaultRoleId,
    getRoleProfile,
    getRoleLabel,
  });
})(window);
