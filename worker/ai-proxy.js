// rtdocs AI 对话代理：Cloudflare Workers AI
// 部署：wrangler deploy（需在 Cloudflare 账号里启用 Workers AI）
// 前端在 manifest.ai.endpoint 或 Docker 后台「AI 接口地址」填这个 Worker 的 URL

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405);
    }
    let body = {};
    try { body = await req.json(); } catch (e) {}
    const question = String(body.question || '').slice(0, 500);
    if (!question) return json({ error: 'question required' }, 400);

    const doc = String(body.doc || '').slice(0, 200);
    const context = String(body.context || '').slice(0, 3000);

    const messages = [
      { role: 'system', content: '你是文档站的阅读助手，用简体中文回答，简洁准确，只依据给出的文档片段；信息不足时直说。' },
      { role: 'user', content: (doc ? `【文档】${doc}\n` : '') + (context ? `【片段】\n${context}\n` : '') + `【问题】${question}` },
    ];

    try {
      const out = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages, max_tokens: 700 });
      const text = (out && (out.response || out.result || '')) || '';
      return json({ text: String(text).trim() || '（模型没有返回内容）' });
    } catch (e) {
      return json({ error: 'AI 调用失败: ' + (e && e.message ? e.message : 'unknown') }, 502);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS),
  });
}
