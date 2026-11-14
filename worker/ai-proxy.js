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
    const deep = !!body.deep;
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    const sys = deep
      ? '你是文档站的深度阅读助手。回答前先在内部推理：定位问题要点、检查文档依据、排除不确定的推断，然后输出结论。用简体中文，结构清晰，必要时分点；只依据给定文档与对话上下文，信息不足就明确说缺什么。'
      : '你是文档站的阅读助手，用简体中文回答，简洁准确，只依据给出的文档片段与对话上下文；信息不足时直说。';

    const messages = [{ role: 'system', content: sys }];
    for (const m of history) {
      const role = m && m.role === 'assistant' ? 'assistant' : 'user';
      const content = String((m && m.content) || '').slice(0, 2000);
      if (content) messages.push({ role, content });
    }
    messages.push({
      role: 'user',
      content: (doc ? `【文档】${doc}\n` : '') + (context ? `【片段】\n${context}\n` : '') + `【问题】${question}`,
    });

    const MODELS = [
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/meta/llama-3.1-8b-instruct-fp8',
      '@cf/qwen/qwen3-30b-a3b-fp8',
    ];
    let lastErr = '';
    for (const model of MODELS) {
      try {
        const out = await env.AI.run(model, { messages, max_tokens: deep ? 1400 : 700 });
        const text = (out && (out.response || out.result || '')) || '';
        if (String(text).trim()) return json({ text: String(text).trim(), model });
      } catch (e) {
        lastErr = (e && e.message) ? e.message : 'unknown';
      }
    }
    return json({ error: 'AI 调用失败: ' + lastErr }, 502);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS),
  });
}
