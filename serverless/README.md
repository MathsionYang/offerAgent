# 模型代理说明

GitHub Pages 是纯静态页面，浏览器直连部分模型服务商时会被 CORS 跨域策略拦截，表现为：

```text
生成失败：浏览器直连被模型服务商跨域策略拦截
```

解决方式是部署一个自己控制的轻量代理，让页面请求代理地址，由代理转发到模型服务商。

## Cloudflare Worker 部署

1. 打开 Cloudflare Dashboard。
2. 进入 `Workers & Pages`。
3. 创建一个新的 Worker。
4. 将 `cloudflare-worker.js` 的内容复制到 Worker 编辑器。
5. 在 Worker 的环境变量中新增：

```text
UPSTREAM_BASE_URL=https://ws-ppprfnb8819dlxt6.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
```

也可以替换成其他 OpenAI-Compatible 模型服务商地址。

6. 部署 Worker，得到类似地址：

```text
https://your-worker.your-name.workers.dev
```

## 页面里如何填写

在页面中：

1. 模型服务商选择 `OpenAI-Compatible 自定义接口`。
2. 模型名称填写实际模型，例如 `qwen-plus`。
3. 临时 API Key 填写你自己的模型 Key。
4. 自定义 Base URL 填写 Worker 地址，例如：

```text
https://your-worker.your-name.workers.dev
```

不要在 Base URL 后面加 `/chat/completions`，页面会自动拼接。

## 安全边界

- 这个代理不保存用户输入、简历、JD、报告或 API Key。
- API Key 仍然由用户每次在页面临时填写，通过 `Authorization` 请求头转发。
- 建议只把 Worker 给自己或可信用户使用。
- 如果公开使用，建议在 Worker 中增加访问口令、域名白名单或限流。
