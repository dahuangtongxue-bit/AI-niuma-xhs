export const runtime = 'edge';

// 单一代理（流式直通版）：向上游请求 SSE，首字节即开始转发，
// 绕开 Netlify Edge 的首字节时限——慢模型/长输出不再被平台掐成 504。
export async function POST(req) {
  try {
    const { messages, temperature = 0.7, max_tokens = 4000, judge = false } = await req.json();

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
      body: JSON.stringify({ model, messages, temperature, max_tokens, stream: true }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return Response.json(
        { error: `上游 ${upstream.status}：${text.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const ct = upstream.headers.get('content-type') || '';

    // 网关忽略 stream 参数、直接回 JSON 的兼容路径
    if (!ct.includes('event-stream')) {
      const data = await upstream.json().catch(() => null);
      const choice = data?.choices?.[0];
      let content = choice?.message?.content ?? choice?.text ?? '';
      if (Array.isArray(content)) content = content.map((c) => c?.text || '').join('');
      content = String(content).replace(/<think>[\s\S]*?<\/think>/gi, '');
      const ti = content.search(/<think>/i);
      if (ti >= 0) content = content.slice(0, ti);
      content = content.trim();
      if (!content) {
        const hasReasoning = !!choice?.message?.reasoning_content;
        const fr = choice?.finish_reason || '?';
        return Response.json(
          {
            error: hasReasoning
              ? '上游只返回了思考过程没有正文：当前 LLM_MODEL 是思考型（reasoning）模型，请换非思考版'
              : `上游返回空内容（finish_reason=${fr}${fr === 'length' ? '，输出被截断，请调大 max_tokens' : ''}）`,
          },
          { status: 502 }
        );
      }
      return Response.json({ content });
    }

    // SSE 直通
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
