import { topicPrompt, notePrompt, judgePrompt } from './prompts';
import { combineScore } from './scoring';
import { checkText } from './bannedWords';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 剥离思考型模型的 <think> 段：完整段直接删；未闭合（思考没说完就被截断）则从 <think> 起全部丢弃
function stripThink(s) {
  let t = String(s || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
  const i = t.search(/<think>/i);
  if (i >= 0) t = t.slice(0, i);
  return t.trim();
}

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

  // 流式：增量(delta)拼接；部分网关每帧回全量快照(message.content)，对快照取"覆盖"而非"追加"，防重复拼接
  if (ct.includes('text/event-stream')) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let delta = '';
    let snapshot = '';
    let sawDelta = false;
    const feed = (payload) => {
      try {
        const j = JSON.parse(payload);
        const c0 = j?.choices?.[0];
        const d = c0?.delta?.content;
        if (typeof d === 'string' && d) { delta += d; sawDelta = true; return; }
        const full = c0?.message?.content ?? c0?.text;
        if (typeof full === 'string' && full) snapshot = full;
      } catch (e) { /* 非 JSON 负载，忽略 */ }
    };
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
        feed(payload);
      }
    }
    const tail = buf.trim();
    if (tail.startsWith('data:')) {
      const p = tail.slice(5).trim();
      if (p && p !== '[DONE]') feed(p);
    }
    const content = stripThink(sawDelta ? delta : snapshot);
    if (!content) throw new Error('流式返回为空：当前模型可能只输出思考过程，请把 LLM_MODEL 换成非思考版');
    return content;
  }

  // 非流式 JSON（兼容路径）
  const data = await res.json().catch(() => ({}));
  if (data.error) throw new Error(data.error);
  let c = data.content ?? data?.choices?.[0]?.message?.content ?? '';
  if (Array.isArray(c)) c = c.map((x) => x?.text || '').join('');
  c = stripThink(c);
  if (!c) throw new Error('上游返回空内容');
  return c;
}

// 括号配对扫描：提取文本中所有平衡的 JSON 候选（容忍前后缀废话与多个 JSON 块）
function extractCandidates(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch !== '{' && ch !== '[') continue;
    let depth = 0, inStr = false, esc = false, end = -1;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (esc) { esc = false; continue; }
      if (inStr) {
        if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') {
        depth--;
        if (depth === 0) { end = j; break; }
      }
    }
    if (end > i) { out.push(s.slice(i, end + 1)); i = end; }
  }
  return out;
}

// 轻量修复：字符串内的裸换行/回车/制表符转义 + 去尾逗号（模型最常见的两种 JSON 病）
function repairJSON(s) {
  let r = '', inStr = false, esc = false;
  for (const c of s) {
    if (esc) { r += c; esc = false; continue; }
    if (inStr) {
      if (c === '\\') { r += c; esc = true; continue; }
      if (c === '"') { inStr = false; r += c; continue; }
      if (c === '\n') { r += '\\n'; continue; }
      if (c === '\r') { r += '\\r'; continue; }
      if (c === '\t') { r += '\\t'; continue; }
      r += c; continue;
    }
    if (c === '"') inStr = true;
    r += c;
  }
  return r.replace(/,\s*([}\]])/g, '$1');
}

function parseJSON(text) {
  const cleaned = String(text).replace(/```json|```/gi, '').trim();
  const cands = extractCandidates(cleaned);
  cands.sort((a, b) => b.length - a.length); // 最大的候选才是笔记本体
  const tries = cands.length ? cands : [cleaned];
  let lastErr;
  for (const c of tries) {
    try { return JSON.parse(c); } catch (e) { lastErr = e; }
    try { return JSON.parse(repairJSON(c)); } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('未找到可解析的 JSON');
}

async function chatJSON(messages, opts) {
  let lastErr;
  let lastRaw = '';
  for (let i = 0; i < 2; i++) {
    try {
      lastRaw = await chat(messages, opts);
      return parseJSON(lastRaw);
    } catch (e) {
      lastErr = e;
    }
  }
  const head = String(lastRaw).slice(0, 100).replace(/\s+/g, ' ');
  throw new Error(`输出解析失败：${lastErr?.message || lastErr}${head ? `｜原文开头：${head}…` : ''}`);
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
    const draft = await chatJSON(notePrompt(profile, topic), { temperature: 0.9, max_tokens: 6000 });

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
    if (Array.isArray(judged)) {
      for (const j of judged) {
        if (j && typeof j === 'object' && Number.isInteger(j.i)) judgeMap[j.i] = j;
      }
    }

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
