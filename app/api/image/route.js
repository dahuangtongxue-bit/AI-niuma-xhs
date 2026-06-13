export const runtime = 'edge';

// 生图代理：OpenAI 兼容 images/generations。
// 关键设计：无论上游返回 b64_json 还是 url，统一在服务端转成 dataUrl 再给前端——
// 远程图片 URL 会让前端 canvas 跨域污染，导致封面 PNG 导出失败，base64 直传则没有这个问题。
export async function POST(req) {
  try {
    const { prompt, size } = await req.json();

    const base = (process.env.IMAGE_API_BASE || process.env.LLM_API_BASE || '').replace(/\/+$/, '');
    const key = process.env.IMAGE_API_KEY || process.env.LLM_API_KEY;
    const model = process.env.IMAGE_MODEL;

    if (!model) {
      // 约定：未配置 IMAGE_MODEL = 生图层关闭（前端据 501 静默降级，不算错误）
      return Response.json({ error: 'IMAGE_MODEL 未配置，生图层关闭' }, { status: 501 });
    }
    if (!base || !key) {
      return Response.json({ error: '缺少 IMAGE_API_BASE / IMAGE_API_KEY（或回退用的 LLM_API_BASE / LLM_API_KEY）' }, { status: 500 });
    }
    if (!prompt) {
      return Response.json({ error: '缺少 prompt' }, { status: 400 });
    }

    // 封面为 3:4 竖图。默认 1664x2208（≈367万像素，贴合主流生图模型"≥368万/1920×1920"的下限且保持竖构图）。
    // 不同模型对尺寸要求不一：可用环境变量 IMAGE_SIZE 覆盖（如即梦/火山系最低 1920x1920；部分模型只收枚举档位）。
    const imgSize = size || process.env.IMAGE_SIZE || '1664x2208';

    const upstream = await fetch(`${base}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: imgSize,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return Response.json({ error: `生图上游 ${upstream.status}：${text.slice(0, 300)}` }, { status: 502 });
    }

    const data = await upstream.json();
    const item = data?.data?.[0] || {};

    if (item.b64_json) {
      return Response.json({ dataUrl: `data:image/png;base64,${item.b64_json}` });
    }

    if (item.url) {
      const img = await fetch(item.url);
      if (!img.ok) {
        return Response.json({ error: `取回生成图失败 ${img.status}` }, { status: 502 });
      }
      const bytes = new Uint8Array(await img.arrayBuffer());
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      const ct = img.headers.get('content-type') || 'image/png';
      return Response.json({ dataUrl: `data:${ct};base64,${btoa(binary)}` });
    }

    return Response.json({ error: '生图返回中没有图片（缺 url / b64_json 字段）' }, { status: 502 });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
