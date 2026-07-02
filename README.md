# 面试准备助手

面试准备助手是一个开源的最小 Web MVP，目标产品形态是 **Offer 沙盘 + 面试官视角库**。

> Demo 地址：https://mathsionyang.github.io/offerAgent/

当前第一版定位很克制：面试准备助手。它的核心用途是辅助候选人更好准备面试：用户粘贴简历和 JD 后，系统先做“项目匹配闸口”，判断候选人项目经历是否支撑 JD 核心职责；匹配则进入下一轮 Offer 沙盘，不匹配则输出基于证据的“不推进 / 淘汰建议”和补证方向。随后系统结合 Offer 沙盘上下文与面试官视角库，输出候选人准备重点、岗位匹配、证据链、风险点和可下载报告。同时，它会生成一组可供面试官挑选的候选人追问题库，帮助面试官围绕项目经历和 JD 职责提问。

这是一个早期 Demo，用于验证“简历 + JD → 面试准备报告”的最小闭环，不是商业化招聘系统，也不替代人工招聘判断。

## 第一版原则

- 不需要登录。
- 不保存用户信息。
- 不保存简历、JD、Key 或报告。
- 大模型 Key 每次打开页面由用户临时设置。
- 刷新或关闭页面后，Key 和所有输入都会丢失。
- 报告生成后下载到本地保存。
- 未配置 Key 时可以使用 Mock Demo 模式。

## 运行说明

当前版本是纯静态页面，不需要 Node.js。

### 1. 本地运行 Mock Demo

如果只体验 Mock Demo，推荐用本地 HTTP 服务打开，避免 IDE 预览或 `file://` 页面触发浏览器安全限制：

```powershell
cd apps\web
python -m http.server 5173
```

然后访问：

```text
http://localhost:5173/
```

也可以直接打开：

```text
apps/web/index.html
```

但如果在 IDE 内置预览里看到类似 `Unsafe attempt to load URL file:///...#workspace`，请改用上面的本地 HTTP 服务，或直接部署到 GitHub Pages。

### 2. 本地运行真实模型

如果要在本地使用真实模型，启动本地页面和本地代理：

```powershell
cd D:\OfferAgent
python scripts\local_proxy.py --key-file 1.md
```

然后访问：

```text
http://127.0.0.1:5173/
```

页面中填写：

- 模型服务商：`OpenAI-Compatible 代理 / 自定义接口`
- 模型名称：`qwen-plus`
- 临时 API Key：你的真实模型 Key
- 代理 / 自定义 Base URL：`http://127.0.0.1:8787`

`1.md` 格式：

```text
KEY:你的模型 Key
URL:模型服务商 OpenAI-Compatible Base URL
```

例如阿里百炼 / MaaS：

```text
URL:https://ws-ppprfnb8819dlxt6.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
```

### 3. 线上运行真实模型

GitHub Pages 纯静态页面可能被模型服务商 CORS 策略拦截。线上真实模型建议部署 `serverless/cloudflare-worker.js`，再把 Worker 根地址填入页面的 `代理 / 自定义 Base URL`。

## GitHub Pages

当前 Demo 部署在：

```text
https://mathsionyang.github.io/offerAgent/
```

仓库内置了 GitHub Pages workflow。推送到默认分支后，可在 GitHub 仓库 Settings 中启用 Pages，选择 GitHub Actions 部署。

详细步骤见 [部署说明.md](部署说明.md)。

## 真实模型调用

部分模型服务商不允许浏览器从 GitHub Pages 直接跨域调用，会出现 `Failed to fetch`。这种情况下需要使用自己控制的代理或 Serverless Function。

项目提供了 Cloudflare Worker 示例：

```text
serverless/cloudflare-worker.js
```

部署后，在页面里选择 `OpenAI-Compatible 代理 / 自定义接口`，并把 Worker 地址填到 `代理 / 自定义 Base URL`。

## MVP 功能

- 简历输入。
- JD 输入。
- Offer 沙盘上下文：候选人阶段、目标职级、Offer / 谈薪约束。
- 面试官视角库：结合候选人项目经历与 JD 职责，虚拟生成 HR、业务负责人、项目推进、谈薪顾问等不同提问视角。
- Mock Demo 或用户自带 Key 调用模型。
- 项目匹配闸口：先按 JD 职责判断候选人项目经历是否匹配，决定是否进入下一轮沙盘。
- 候选人准备重点、分析结果、Offer 沙盘推演、证据链、追问清单。
- 报告分块流式输出，先展示项目匹配闸口、候选人准备重点、证据解析和岗位匹配，再展开沙盘推演与面试官候选问题库。
- 岗位要求、项目经历、项目经理 / 推进视角的可选面试问题库，每个虚拟面试官视角会输出生成依据、关注能力、关联证据、深挖问题、好回答标准和风险信号。
- 高匹配反包装追问：当简历与 JD 高度匹配时，进一步验证真实角色、关键决策、指标口径、失败细节和现场推演能力。
- 岗位职责与项目经历联动提问：每个问题同时锚定 JD 职责和候选人项目证据，避免泛泛提问。
- 双模块 HTML 下载：候选人报告只保留不匹配点和重点准备问题；面试官报告保留不匹配点、不同视角提问和反包装验证问题。
- 结论证据化：报告先下结论，再列详细分析；每个结论都必须给出 JD 或简历证据，候选人报告额外包含招聘岗位能力分析和匹配程度判断。
- 专业 HTML 报告：渲染时清理多余 Markdown 装饰符，使用正式的表格、列表和章节样式，提升可读性与可信度。
- 人工反馈写入报告。
- 静态 HTML 报告本地下载。

## 功能测试

静态功能检查：

```powershell
python scripts\smoke_test.py
```

如果本地有临时模型配置文件 `1.md`，格式如下：

```text
KEY:你的模型 Key
URL:模型服务商 OpenAI-Compatible Base URL
```

可以测试真实模型流式接口：

```powershell
python scripts\smoke_test.py --with-llm 1.md --model qwen-plus
```

`1.md` 已加入 `.gitignore`，不要把真实 Key 提交到 GitHub。

## 目录结构

```text
apps/web               # 最小 Web MVP
docs                   # 产品文档
prompts                # Prompt 与面试官视角草案
examples               # 脱敏样例
schemas                # 数据结构 Schema
scripts                # 功能自测脚本
serverless             # 可选模型代理示例
.github/workflows      # GitHub Pages 部署
```

## 隐私说明

默认所有输入仅在浏览器当前页面内存中处理，不写入 LocalStorage、SessionStorage、Cookie、IndexedDB 或远程数据库。请不要在公共设备上输入真实简历和 API Key。
