export const runtime = 'edge';

// 单一代理：所有 LLM 调用走这里。环境变量见 .env.example
export async function POST(req) {
  try {
    const { messages, temperature = 0.7, max_tokens = 3000, judge = false } = await req.json();

    const base = (process.env.LLM_API_BASE || '').replace(/\/+$/, '');
    const key = process.env.LLM_API_KEY;
    const model = judge
      ? (process.env.LLM_MODEL_JUDGE || process.env.LLM_MODEL)
      : process.env.LLM_MODEL;

    if (!base || !key || !model) {
      return Response.json(
        { error: '缺少环境变量：请在 Netlify 配置 LLM_API_BASE / LLM_API_KEY / LLM_MODEL' },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return Response.json(
        { error: `上游 ${upstream.status}：${text.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    if (!content) {
      return Response.json({ error: '上游返回空内容' }, { status: 502 });
    }
    return Response.json({ content });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
