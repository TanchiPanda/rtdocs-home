# rtdocs AI 对话代理（Workers AI）

站内右键菜单的「AI 对话」需要一个后端，这里用 Cloudflare Workers AI，不需要自己部署模型。

## 部署

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

部署后会得到类似 `https://rtdocs-ai.<你的子域>.workers.dev` 的地址。用的模型是 `@cf/meta/llama-3.1-8b-instruct`，可在 `ai-proxy.js` 里换。

## 接到站点

- 静态版：`manifest.json` → `"ai": { "endpoint": "https://rtdocs-ai.xxx.workers.dev" }`
- Docker 版：后台「站点设置」→「AI 接口地址」

留空时右键菜单里的「AI 对话」不可点，其余项照常。

## 请求 / 响应

```json
POST { "question": "这篇讲什么", "doc": "docs/index.md", "context": "截取的文档片段", "locale": "zh" }
→ { "text": "……" }
```
