# OfferAgent

OfferAgent 是一个开源的最小 Web MVP，目标产品形态是 **Offer 沙盘 + 面试官 Skill 库**。

当前第一版定位很克制：产品经理面试准备助手。它帮助用户粘贴简历和 JD，生成岗位匹配、证据链、风险点、必问追问、可选面试问题库和可下载报告。

## 第一版原则

- 不需要登录。
- 不保存用户信息。
- 不保存简历、JD、Key 或报告。
- 大模型 Key 每次打开页面由用户临时设置。
- 刷新或关闭页面后，Key 和所有输入都会丢失。
- 报告生成后下载到本地保存。
- 未配置 Key 时可以使用 Mock Demo 模式。

## 本地打开

当前版本是纯静态页面，不需要 Node.js。

直接打开：

```text
apps/web/index.html
```

或部署到 GitHub Pages。

## GitHub Pages

仓库内置了 GitHub Pages workflow。推送到 `main` 后，可在 GitHub 仓库 Settings 中启用 Pages，选择 GitHub Actions 部署。

详细步骤见 [docs/github-pages.md](docs/github-pages.md)。

## MVP 功能

- 简历输入。
- JD 输入。
- Mock Demo 或用户自带 Key 调用模型。
- 分析结果、证据链、追问清单。
- 岗位要求、项目经历、项目经理 / 推进视角的可选面试问题库。
- 人工反馈写入报告。
- Markdown / JSON 本地下载。

## 目录结构

```text
apps/web               # 最小 Web MVP
docs                   # 产品文档
prompts                # Prompt 与 Skill 草案
examples               # 脱敏样例
schemas                # 数据结构 Schema
.github/workflows      # GitHub Pages 部署
```

## 隐私说明

默认所有输入仅在浏览器当前页面内存中处理，不写入 LocalStorage、SessionStorage、Cookie、IndexedDB 或远程数据库。请不要在公共设备上输入真实简历和 API Key。
