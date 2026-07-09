# GitHub Pages 托管步骤

第一版是纯静态 Web MVP，可以直接托管到 GitHub Pages。你只需要自己在 GitHub 上配置仓库和 Pages。

## 1. 创建 GitHub 仓库

1. 在 GitHub 新建仓库，例如 `OfferAgent`。
2. 建议先选择 Public，方便开源展示。
3. 不要在 GitHub 页面初始化 README、License 或 `.gitignore`，本地已经有这些文件。

## 2. 推送本地代码

在 `D:\OfferAgent` 执行：

```bash
git remote add origin https://github.com/<your-name>/<your-repo>.git
git branch -M master
git add .
git commit -m "Initial OfferAgent web MVP"
git push -u origin master
```

如果已经配置过 remote，使用：

```bash
git remote set-url origin https://github.com/<your-name>/<your-repo>.git
git push -u origin master
```

## 3. 启用 GitHub Pages

1. 打开 GitHub 仓库。
2. 进入 `Settings`。
3. 进入 `Pages`。
4. 在 `Build and deployment` 中选择 `GitHub Actions`。
5. 等待 `.github/workflows/pages.yml` 自动部署完成。

当前 workflow 会发布 `apps/web` 目录，这是最新 Web 界面入口。

部署成功后，GitHub 会给出访问地址，通常类似：

```text
https://<your-name>.github.io/<your-repo>/
```

## 4. 使用方式

1. 打开 GitHub Pages 页面。
2. 选择 Mock Demo，或选择模型服务商并临时输入自己的 API Key。
3. 选择目标岗位，并粘贴简历和 JD。
4. 点击生成报告。
5. 在图谱页查看评估报告、证据关系图谱、虚拟委员会和结果摘要。
6. 面试官模式下填写人工反馈。
7. 下载与当前角色匹配的 PDF 报告。

## 5. 隐私与 Key

- 页面不需要登录。
- 页面不保存用户信息。
- API Key 只保存在当前页面内存。
- 刷新或关闭页面后，Key、简历、JD、报告都会丢失。
- 不要把真实 API Key 写入仓库。
- 不要在公共设备上输入真实简历和 API Key。

## 6. 常见问题

### 浏览器直连模型接口失败

部分模型服务商可能限制浏览器跨域请求。可以先使用 Mock Demo 跑通流程；后续如果需要真实稳定调用，可以自行加一个代理或 Serverless Function。

### 没有 API Key 能不能用

可以。选择 `Mock Demo`，填充脱敏样例后即可生成模拟报告。

