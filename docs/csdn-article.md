# 【开源实战】纯前端 6000 行代码，我做了一个"让证据可点击"的面试评估沙盘（附 4 张截图）

> 在线 Demo：https://mathsionyang.github.io/offerAgent/
> GitHub：https://github.com/MathsionYang/offerAgent
> 已实现：产品经理 / 开发 / 技术支持 / 销售 4 类岗位评估，候选人 + 面试官双模式

## 一、先看效果

### 截图 1：工作台 —— 模型配置 + 简历 + JD 三区合一

![工作台输入区](img/06.png)

页面上半部分是"Step 1 临时配置模型"（支持 OpenAI / DeepSeek / 通义千问 / Kimi / 自定义代理 6 种），右侧是"Offer 沙盘"（目标岗位 / 阶段 / 职级 / 谈薪约束）。下半部分是简历和 JD 的左右对照输入区。

### 截图 2：面试官视角库 —— 5 个 Skill 视角可勾选

![面试官视角库](img/07.png)

内置 5 个虚拟面试官角色：HR、业务负责人、项目推进、谈薪顾问、决策层压力官。勾选不同的组合，会直接影响追问角度、风险判断、虚拟委员会角色和证据图谱中的 Skill 贡献。

### 截图 3：报告页 —— 评估报告 + 证据关系图谱

![评估报告 + 证据图谱](img/08.png)

报告分块流式输出（左侧），按"项目匹配闸口 → 简历证据 → Offer 沙盘 → 风险校准"等模块逐步渲染。右侧是 EvidenceGraph 证据关系图谱，节点按 `job_requirement / JD / 客户需求分析与方案设计 / 证据` 等列分组，连线带 confidence / weight / source，点击节点可跳转回报告对应段落。

### 截图 4：虚拟面试委员会 —— 微信群聊式气泡流

![虚拟面试委员会气泡流](img/09.png)

报告页下方以聊天气泡流式逐条展示虚拟角色发言（seed_extraction → panel_simulation），生成完成后保留完整讨论记录。共识 / 分歧 / 主导角色 / 最终建议都会写入主持人总结。

---

## 二、为什么做这个？

我自己求职和招人两端都待过，遇到过两类高频痛点：

**求职端**：背了一周的项目细节，面试官问的全是八股题；简历上写的"主导 X 项目"，面试官一句话就证伪了。

**招人端**：简历初筛"感觉不错"，业务面试凭印象打分，入职发现完全不对版；想追问一些深度问题，但又怕候选人答不上来太尴尬。

OfferAgent 的目标只有一个：**让"感觉"和"经验"变成"可点击、可审计、可回填的结构化证据"**。

## 三、产品定位：沙盘，不是打分器

| 维度 | 传统面试辅助 | OfferAgent |
| --- | --- | --- |
| 形态 | 文档 / 表格 / 微信语音 | 浏览器内可交互工作台 |
| 结论 | 录用 / 淘汰 | **项目匹配闸口**（匹配进入 / 条件进入 / 缺证不匹配） |
| 追问 | 临时想 | **Skill 视角库 × 虚拟面试委员会**生成 |
| Offer | 谈薪经验 | **OfferSimulationRun** 三场景结构化推演 |
| 反馈 | 拍脑袋 | **FeedbackDistillation** 升级 / 降权 / 删除 / 保留 |
| 隐私 | 简历上传 | **Key 只在内存、刷新即清空** |

它不是 ATS，也不是打分机器人，而是**让每一个结论都能溯源、每一次追问都能审计、每一份反馈都能沉淀**的评估沙盘。

## 四、核心设计一：项目匹配闸口

面试最常见的事故是：**简历上写"主导过 X 项目"，JD 上要"有 Y 经验"，结果一拍即合——直到入职才发现完全对不上。**

OfferAgent 设计的第一道闸口：

1. 从 JD 中抽取**岗位职责 + 能力要求**（一级 / 二级 / 三级可信度）
2. 从简历中找**项目经历锚点**（同样分等级）
3. 输出匹配结果：**匹配进入 / 条件进入 / 缺证不匹配**
4. 对缺证结论**强制要求补项目材料**
5. 对表面高匹配内容**生成反包装追问**

**这一步不是黑盒打分，而是把"为什么匹配 / 为什么不匹配"摆到台面上。**

## 五、核心设计二：EvidenceGraph 证据关系图谱

这是项目的"心脏"。

传统报告：

```text
"候选人具备产品规划能力" —— 完了。
```

OfferAgent 把这个结论**逆向拆解成图谱节点**：

```text
job_requirement(产品规划) ← requires(0.92) ← evidence(主导 XX 项目)
                              ↘ 风险(缺少复盘机制)
                              ↘ skill(虚拟业务负责人视角)
                              ↘ feedback(未反馈)
                              ↘ offer_signal(谈判优先级提升)
```

**每个节点都能点击跳转到报告对应段落**，让面试官能从结论反推证据，也能从证据追到结论。

**9 种节点类型**：`job_requirement / evidence / validation / risk / feedback / offer_signal / skill / agent_persona / report_section`

**7 种带权边**：`supports / requires / raises / risks / discusses / challenges / reads_memory`，每条都带 `confidence / weight / source`。

当图谱出现**证据缺口**时，会高亮提示"这块没简历背书，面试官需要追问验证"。

## 六、核心设计三：虚拟面试委员会

这个模块借鉴了 MiroFish 的 **"种子材料 → 图谱记忆 → Persona 生成 → 多轮模拟 → 汇总报告"** 思路，做了一个适合静态 Web 的轻量版。

### 6.1 五个内置 Skill 视角

```text
1. 虚拟 HR 面试官        —— 动机、岗位偏好、到岗约束
2. 虚拟业务负责人        —— 业务判断、指标口径、结果归因
3. 虚拟项目推进面试官    —— 里程碑、资源协调、复盘机制
4. 虚拟谈薪顾问          —— 机会选择、竞争 Offer、谈判策略
5. 决策层压力官          —— 预算剪裁、战略取舍、ROI 压力
```

### 6.2 多轮轻量讨论流程

```text
buildVirtualPanel()           // 从岗位/JD/简历/Skill 生成虚拟角色
buildPanelDiscussionRounds()  // 围绕证据/风险/Offer 多轮讨论
buildModeratorSummary()       // 汇总共识、分歧、主导角色、最终建议
```

### 6.3 微信群聊式气泡流

报告页下方会以**聊天气泡流式**逐条展示虚拟角色发言，生成完成后保留完整讨论记录。

> **注意**：这不是完整的多 Agent 仿真引擎，而是基于规则和结构化上下文的轻量推理。但作为 MVP，已经能帮助面试官看到"不同视角如何看同一份简历"。

## 七、核心设计四：OfferSimulationRun 状态机

以前 Offer 推演在报告里只是一段文字。OfferAgent 把它升级为**结构化状态机**：

```json
{
  "scenario": "base | optimistic | conservative",
  "stage": "draft | negotiating | accepted | rejected",
  "history": [...],
  "version": "v1.2.0",
  "status_backfill": "可回填到下一轮问题生成、风险判断、谈判策略"
}
```

跑完三个场景对比后，Offer 结果可以**反向回填**到：
- 下一轮追问问题生成
- 风险判断的优先级
- 虚拟谈薪顾问的策略建议

**Offer 决策不再是孤立的段落，而是影响后续整个流程的状态。**

## 八、核心设计五：一致性模式（解决 LLM 报告漂移）

用 LLM 生成报告的人都知道：**同样的输入，今天和昨天的结论可能差 30%。**

OfferAgent 加了一致性模式：

1. **输入指纹 `input_fingerprint`**：对 role + resume + jd + constraints + skills 做哈希
2. **结构化中间层 `structured_evaluation`**：先把评估结果结构化，再渲染报告
3. **本地缓存复用**：相同指纹命中缓存时直接复用基础报告
4. **真实模型请求**：`temperature: 0` + `seed`
5. **隐私保护**：**缓存不存 API Key，不存人工反馈**

> 缓存大小限制为 12 条，避免 localStorage 膨胀。

## 九、双模式工作台

```text
候选人模式 → 隐藏人工反馈 → 只显示候选人报告
面试官模式 → 显示人工反馈 → 只显示面试官报告
```

**输入信息不丢**——切换模式只切视图，不清空数据。报告分块流式输出，体验类似 ChatGPT 打字机效果。

## 十、隐私设计

这是我在设计时最在意的点：

- 不需要注册或登录
- 不上传简历到任何服务器
- 不保存 API Key（只在当前页面内存）
- 不保存简历、JD、报告或反馈（刷新即清空）
- 不写 cookie / 不写后端数据库

如果浏览器直连模型服务商报 CORS 错，项目自带 **Cloudflare Worker 代理示例**（`serverless/cloudflare-worker.js`）。把 Key 放服务端，前端通过 Worker 转发，**Key 不再暴露给浏览器**。

## 十一、技术实现：纯前端 6000 行的取舍

整个 Web 端核心入口已经迁移到 `apps/web`：

```text
apps/web/
├── index.html         (302 行)
├── styles.css         (2202 行)
├── app.js             (8151 行)
└── img/ (截图资源)
```

**没有 React / Vue / 任何框架**。

**理由**：
1. 可移植：纯 HTML + 原生 JS 可直接丢 GitHub Pages，无需构建
2. 可读：所有人打开 DevTools 就能看到全部逻辑
3. 零依赖：没有 npm install / node_modules / 供应链风险
4. 可审计：6800 行 JS 跑一个面试评估，逻辑密度高但完全可读

**代价**：
- 业务逻辑耦合在单文件（已在开发路线 P4 列入模块化计划）
- 没有虚拟 DOM，长列表性能需要手动优化
- 状态管理靠全局变量和 DOM 联动

但作为 MVP，**这种"返璞归真"反而是优势**——fork 之后改一个 `app.js` 就能自定义自己的报告模板。

## 十二、四类岗位支持

| 岗位 | 评估维度 |
| --- | --- |
| 产品经理 | 场景理解 / 产品规划 / 客户需求 / 研发协同 / 创新探索 / 交付质量 |
| 开发人员 | 技术栈 / 系统设计 / 编码能力 / 项目推进 / 故障排查 / 工程素养 |
| 技术支持 | 问题分诊 / 故障定位 / 客户沟通 / SLA / 升级协作 / 知识沉淀 |
| 销售 | 客户开发 / 商机推进 / 谈判能力 / 客户管理 / 业绩达成 / 行业理解 |

每类岗位都有**专属关键词、验证重点、报告生成逻辑**。

## 十三、3 分钟跑起来

```bash
git clone https://github.com/MathsionYang/offerAgent.git
cd offerAgent/apps/web
python -m http.server 5173
# 浏览器打开 http://localhost:5173
```

默认进 **Mock Demo** 模式，**不调用任何模型**，跑完整套流程。

接真实模型：页面上 6 个常用服务商下拉选择（OpenAI / DeepSeek / 通义千问 / Kimi / 豆包 / 智谱 / 硅基流动等都兼容），临时输入 Key 即可。担心 CORS？用 Cloudflare Worker 代理。

GitHub Pages 一键部署：项目自带 `.github/workflows/pages.yml`，推 `main` 自动部署到 `https://<your-name>.github.io/offerAgent/`。

## 十四、当前边界 & 后续规划

**明确不做**：
- 用户账号 / 团队协作 / 云端报告保存
- ATS / HRIS 集成
- 真实样本评测数据集
- 完整的多 Agent 仿真引擎
- 持久化知识图谱数据库

**后续优先级**（来自开发路线）：
- **P0**：稳定当前体验（清理文案、Playwright 截图回归、smoke test 拆分）
- **P1**：让虚拟委员会更可审计（展示 stance、influence_weight、focus）
- **P2**：让图谱成为决策工具（节点搜索、风险等级过滤、feedback diff）
- **P3**：把反馈闭环做实（结构化反馈、SkillDefinition 更新候选）
- **P4**：模块化工程结构（i18n.js / roles.js / skills.js / graph.js / reports.js ...）

## 十五、写在最后

它不能解决求职和招聘的所有问题，但能做一件事：

> **把"感觉"和"经验"变成"可点击、可审计、可回填的结构化证据"。**

如果它能在你和候选人 / 面试官之间，**省下一次失败的面试，或多抓住一个被低估的候选人**，那这个项目就值了。

## 链接

- **Demo**：https://mathsionyang.github.io/offerAgent/
- **GitHub**：https://github.com/MathsionYang/offerAgent
- **Issue 反馈**：直接提 GitHub Issue

如果觉得有帮助，**欢迎 Star** 一下，给作者一点继续迭代的动力 🚀

---

> 本文工具完全开源（MIT 协议），无后端、无追踪、无注册。
