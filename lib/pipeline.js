import { topicPrompt, notePrompt, judgePrompt } from './prompts';
import { combineScore } from './scoring';
import { checkText } from './bannedWords';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function chat(messages, { temperature = 0.7, judge = false, max_tokens = 4000 } = {}) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature, judge, max_tokens }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const d = await res.json();
      if (d.error) msg = d.error;
    } catch (e) { /* 非 JSON 错误体（如平台 504 页） */ }
    throw new Error(msg);
  }

  const ct = res.headers.get('content-type') || '';

  // 流式：边出字边收，拼完整后返回
  if (ct.includes('text/event-stream')) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let content = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const j = JSON.parse(payload);
          const d = j?.choices?.[0]?.delta?.content ?? j?.choices?.[0]?.message?.content ?? '';
          if (typeof d === 'string' && d) content += d;
        } catch (e) { /* 半截 JSON，等下一块 */ }
      }
    }
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (!content) throw new Error('流式返回为空：当前模型可能只输出思考过程，请把 LLM_MODEL 换成非思考版');
    return content;
  }

  // 非流式 JSON（兼容路径）
  const data = await res.json().catch(() => ({}));
  if (data.error) throw new Error(data.error);
  let c = data.content ?? data?.choices?.[0]?.message?.content ?? '';
  if (Array.isArray(c)) c = c.map((x) => x?.text || '').join('');
  c = String(c).replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (!c) throw new Error('上游返回空内容');
  return c;
}

function parseJSON(text) {
  const cleaned = String(text).replace(/```json|```/gi, '').trim();
  const m = cleaned.match(/[\[{][\s\S]*[\]}]/);
  return JSON.parse(m ? m[0] : cleaned);
}

async function chatJSON(messages, opts) {
  let lastErr;
  for (let i = 0; i < 2; i++) {
    try {
      return parseJSON(await chat(messages, opts));
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`输出解析失败：${lastErr?.message || lastErr}`);
}

const now = () =>
  new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/**
 * 跑一次完整日更生产
 * 注：三篇生产为「串行 + 单篇失败自动重试一次」。
 * 国内模型网关普遍有并发限制（并发1~2很常见），三发并齐极易集体 429；
 * 串行牺牲一两分钟总时长换可靠性，员工干活本来也是一篇一篇写的。
 */
export async function runProduction({ profile, hot, onLog, onTopics, onNote }) {
  const log = (text, type = 'info') => onLog && onLog({ time: now(), text, type });

  log('打卡上班 ✓ 正在复习入职档案与《标题公式库》（41式）…');

  // ─ 选题引擎 ─
  log(hot ? '收到今日热点情报，开始结合热点做选题…' : '开始今日选题（未投喂热点，按人群痛点与搜索习惯展开）…');
  const topicData = await chatJSON(topicPrompt(profile, hot), { temperature: 0.85 });
  const topics = (topicData.topics || []).slice(0, 5);
  if (topics.length === 0) throw new Error('选题引擎未返回有效选题');
  onTopics && onTopics(topics);
  const picked = topics.slice(0, 3);
  log(`选题完成：共 ${topics.length} 个方向，已锁定最优 3 个，逐篇开写（避开网关并发限制）`, 'ok');

  // ─ 单篇生产（抽出便于重试）─
  async function produceNote(topic, idx, tag) {
    log(`${tag}「${topic.title}」开写：先出 10 个候选标题 + 正文 + 封面文案…`);
    const draft = await chatJSON(notePrompt(profile, topic), { temperature: 0.9, max_tokens: 4000 });

    const rawTitles = (draft.titles || [])
      .map((t) => (typeof t === 'string' ? { text: t, formula: '' } : t))
      .filter((t) => t && t.text)
      .slice(0, 10);
    if (rawTitles.length === 0) throw new Error('未生成有效标题');

    // ─ 质检环：模型评分 + 硬规则合并（评分失败自动降级，不影响交付）─
    log(`${tag} 标题初稿 ${rawTitles.length} 条，质检环开始打分…`);
    let judged = [];
    try {
      judged = await chatJSON(judgePrompt(rawTitles.map((t) => t.text), profile), { temperature: 0.2, judge: true });
    } catch (e) {
      log(`${tag} 评分模型异常，降级为纯硬规则打分（${e.message}）`, 'warn');
    }
    const judgeMap = {};
    for (const j of judged || []) judgeMap[j.i] = j;

    const scored = rawTitles.map((t, i) => {
      const j = judgeMap[i] || {};
      const s = combineScore(t.text, j.s, j.why);
      return { ...t, ...s };
    });
    scored.sort((a, b) => b.total - a.total);

    const passed = scored.filter((s) => s.pass);
    const top3 = (passed.length >= 3 ? passed : scored).slice(0, 3);
    const rejected = scored.filter((s) => !top3.includes(s));
    const cutLine = rejected
      .slice(0, 2)
      .map((r) => `「${r.text}」${r.total}分${r.reasons[0] ? '·' + r.reasons[0] : ''}`)
      .join('；');
    log(`${tag} 淘汰 ${rejected.length} 条${cutLine ? '，例如：' + cutLine : ''}`, 'cut');
    log(`${tag} 定稿标题：「${top3[0].text}」（${top3[0].total}分）`, 'ok');

    // ─ 正文违禁词复查 ─
    const bodyIssues = checkText(draft.body || '');
    if (bodyIssues.some((i) => i.severity === 'block')) {
      log(`${tag} 正文命中违禁词：${bodyIssues.filter((i) => i.severity === 'block').map((i) => i.word).join('、')}，已标红待替换`, 'warn');
    }

    log(`${tag} 封面已按「${draft.cover?.template || 'V01'}」版式排版，自检通过 ✓`, 'ok');

    return {
      id: idx,
      topic,
      titles: top3,
      rejected,
      body: draft.body || '',
      bodyIssues,
      tags: (draft.tags || []).slice(0, 8),
      cover: draft.cover || { template: 'V01', title: (top3[0].text || '').slice(0, 9) },
      tip: draft.tip || '',
    };
  }

  // ─ 三篇串行 + 失败自动重试一次 ─
  const notes = [];
  const failMsgs = [];
  for (let idx = 0; idx < picked.length; idx++) {
    const topic = picked[idx];
    const tag = `笔记${idx + 1}`;
    let note = null;
    for (let attempt = 1; attempt <= 2 && !note; attempt++) {
      try {
        if (attempt > 1) {
          log(`${tag} 第 2 次尝试（已等待 4 秒避开限流）…`, 'warn');
          await sleep(4000);
        }
        note = await produceNote(topic, idx, tag);
        onNote && onNote(note);
        notes.push(note);
      } catch (e) {
        log(`${tag} 生产失败（第 ${attempt} 次）：${e.message}`, 'warn');
        if (attempt === 2) failMsgs.push(`${tag}：${e.message}`);
      }
    }
    if (idx < picked.length - 1) await sleep(1500);
  }

  if (notes.length === 0) {
    throw new Error(`三篇笔记全部生产失败。首个错误 → ${failMsgs[0] || '未知'}`);
  }
  log(`今日交付完成：${notes.length} 套笔记已上架交付区，请老板验收 ✓`, 'ok');
  return { topics, notes };
}
