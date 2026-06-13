'use client';

import { useState, useRef } from 'react';

const TONES = ['亲切闺蜜风', '专业可信风', '活泼搞笑风', '克制高级风'];

// 把 AI 提取/手填的店铺档案，映射出 prompts 需要的派生字段（向后兼容旧流水线）
function toProfile(d, tone) {
  const signatures = (d.signatures || []).filter(Boolean);
  const diffs = (d.differentiators || []).filter(Boolean);
  const today = new Date();
  const joinedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  return {
    // —— 真实店铺档案（新）——
    name: d.name || '',
    category: d.category || '',
    city: d.city || '',
    area: d.area || '',
    persona: d.persona || '',
    perCapita: d.perCapita || '',
    hours: d.hours || '',
    signatures,
    differentiators: diffs,
    highlights: (d.highlights || []).filter(Boolean),
    landing: d.landing || '',
    tabooConfirmed: d.tabooConfirmed || '',
    audience: d.audience || '',
    tone: tone || TONES[0],
    // —— 派生字段：喂给现有 prompts（保持兼容）——
    industry: d.category || d.name || '',
    product: [d.name, d.persona].filter(Boolean).join('，') || d.category || '',
    sellingPoints: [...signatures, ...diffs].join('\n'),
    forbidden: '',
    benchmarks: '',
    joinedAt,
  };
}

const EMPTY = {
  name: '', category: '', city: '', area: '', persona: '', perCapita: '', hours: '',
  signatures: ['', '', ''], differentiators: ['', ''], highlights: [''], landing: '', audience: '', tabooConfirmed: '',
};

export default function OnboardingForm({ onHire }) {
  const [mode, setMode] = useState('smart'); // smart=链接/截图  manual=手填
  const [url, setUrl] = useState('');
  const [images, setImages] = useState([]); // dataURL[]
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState(null); // 提取/编辑中的档案
  const [tone, setTone] = useState(TONES[0]);
  const fileRef = useRef(null);

  function pickFiles(e) {
    const files = [...(e.target.files || [])].slice(0, 4);
    Promise.all(files.map((f) => new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    }))).then((urls) => setImages((prev) => [...prev, ...urls].slice(0, 4)));
  }

  async function extract() {
    setErr(''); setNote('');
    if (!url.trim() && images.length === 0) {
      setErr('贴一个链接，或上传至少一张截图（点评页/菜单/门头都行）');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), images }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.error) {
        setErr(d.error || `提取失败 HTTP ${r.status}`);
        if (d.fetchNote) setNote(d.fetchNote);
      } else {
        const p = d.profile || {};
        // 规整数组长度，方便编辑
        setDraft({
          ...EMPTY, ...p,
          signatures: [...(p.signatures || []), '', '', ''].slice(0, 4),
          differentiators: [...(p.differentiators || []), '', ''].slice(0, 3),
          highlights: [...(p.highlights || []), ''].slice(0, 3),
        });
        if (d.fetchNote) setNote(d.fetchNote);
      }
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  function startManual() {
    setDraft({ ...EMPTY });
    setErr('');
  }

  function setD(k) { return (e) => setDraft({ ...draft, [k]: e.target.value }); }
  function setArr(k, i) {
    return (e) => {
      const arr = [...(draft[k] || [])];
      arr[i] = e.target.value;
      setDraft({ ...draft, [k]: arr });
    };
  }

  function confirmHire() {
    if (!draft.name.trim() && !draft.category.trim()) {
      setErr('至少要有店名或品类，阿桃才知道在给谁写');
      return;
    }
    onHire(toProfile(draft, tone));
  }

  // ───────── 档案确认/编辑视图 ─────────
  if (draft) {
    return (
      <div className="card formCard">
        <div className="formHead">
          <h2>确认店铺档案</h2>
          <p>这是阿桃读到的信息，<b>请你核对修改</b>——她以后只会基于这份真实档案写，绝不编造。带 <i>*</i> 的尽量填准。</p>
        </div>
        {note ? <div className="hintNote">ℹ️ {note}</div> : null}

        <div className="grid2">
          <label className="field"><span>店名 <i>*</i></span><input value={draft.name} onChange={setD('name')} placeholder="一把抓牛肉面" /></label>
          <label className="field"><span>品类 <i>*</i></span><input value={draft.category} onChange={setD('category')} placeholder="兰州牛肉面" /></label>
          <label className="field"><span>城市</span><input value={draft.city} onChange={setD('city')} placeholder="苏州" /></label>
          <label className="field"><span>商圈/地址 <i>*</i></span><input value={draft.area} onChange={setD('area')} placeholder="相城区元和街道XX路" /></label>
          <label className="field"><span>人均</span><input value={draft.perCapita} onChange={setD('perCapita')} placeholder="25元" /></label>
          <label className="field"><span>营业时间</span><input value={draft.hours} onChange={setD('hours')} placeholder="06:30-14:00" /></label>
        </div>

        <label className="field"><span>老板/品牌人设 <i>*</i></span><input value={draft.persona} onChange={setD('persona')} placeholder="在苏州开店的兰州人，只做正宗牛大" /></label>

        <label className="field"><span>招牌项目（真实菜品/服务，带细节）<i>*</i></span>
          {draft.signatures.map((v, i) => (
            <input key={i} value={v} onChange={setArr('signatures', i)} placeholder={`招牌 ${i + 1}：如 牛肉面（汤每天凌晨现熬，面型分九种）`} style={{ marginBottom: 6 }} />
          ))}
        </label>

        <label className="field"><span>和同行不一样的地方</span>
          {draft.differentiators.map((v, i) => (
            <input key={i} value={v} onChange={setArr('differentiators', i)} placeholder={`差异点 ${i + 1}：如 蓬灰和面，不用碱`} style={{ marginBottom: 6 }} />
          ))}
        </label>

        <label className="field"><span>可写成笔记的真实亮点/故事</span>
          {draft.highlights.map((v, i) => (
            <input key={i} value={v} onChange={setArr('highlights', i)} placeholder={`亮点 ${i + 1}：如 老板凌晨3点到店熬汤`} style={{ marginBottom: 6 }} />
          ))}
        </label>

        <label className="field"><span>引流/到店信息（会写进每篇笔记结尾）<i>*</i></span><textarea rows={2} value={draft.landing} onChange={setD('landing')} placeholder="主页有店铺定位；到店报『小红书』送小菜；私信可预留位" /></label>

        <div className="grid2">
          <label className="field"><span>目标人群</span><input value={draft.audience} onChange={setD('audience')} placeholder="本地上班族 + 想吃正宗牛肉面的游客" /></label>
          <label className="field"><span>语气风格</span>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        {draft.tabooConfirmed ? <div className="hintWarn">⚠️ 素材里出现疑似夸大宣传：{draft.tabooConfirmed}。阿桃不会把它写进笔记。</div> : null}
        {err ? <div className="hintErr">{err}</div> : null}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btnGhost" onClick={() => { setDraft(null); setErr(''); }}>← 重新提供素材</button>
          <button className="btn btnPrimary" style={{ flex: 1 }} onClick={confirmHire}>档案没问题，正式入职</button>
        </div>
      </div>
    );
  }

  // ───────── 素材录入视图 ─────────
  return (
    <div className="card formCard">
      <div className="formHead">
        <h2>入职登记 · 岗前培训</h2>
        <p>给阿桃一个链接或几张截图，她先读懂你的店——这样写出来的每一篇，都是<b>你家店的真东西</b>。</p>
      </div>

      <div className="segTabs">
        <button className={`segTab ${mode === 'smart' ? 'on' : ''}`} onClick={() => setMode('smart')}>🔗 贴链接 / 传截图</button>
        <button className={`segTab ${mode === 'manual' ? 'on' : ''}`} onClick={() => setMode('manual')}>✍️ 直接手填</button>
      </div>

      {mode === 'smart' ? (
        <>
          <label className="field">
            <span>店铺链接（官网 / 公众号文章皆可）</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… 官网或一篇公众号推文链接" />
          </label>
          <div className="hintNote" style={{ marginTop: -4 }}>💡 大众点评等链接常因反爬抓不到，<b>最稳的是上传截图</b>：点评店铺页、菜单、门头、营业执照都行（多模态识别）。</div>

          <label className="field">
            <span>上传截图 / 图片（最多 4 张）</span>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickFiles} />
          </label>
          {images.length ? (
            <div className="thumbRow">
              {images.map((src, i) => (
                <div className="thumb" key={i}>
                  <img src={src} alt="" />
                  <button onClick={() => setImages(images.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
          ) : null}

          {note ? <div className="hintNote">ℹ️ {note}</div> : null}
          {err ? <div className="hintErr">{err}</div> : null}

          <button className="btn btnPrimary" onClick={extract} disabled={busy}>
            {busy ? '阿桃正在读你的店…' : '让阿桃读取素材 →'}
          </button>
        </>
      ) : (
        <>
          <div className="hintNote">手填也可以，下一步直接进档案表，按提示填真实信息即可。</div>
          {err ? <div className="hintErr">{err}</div> : null}
          <button className="btn btnPrimary" onClick={startManual}>开始手动填写 →</button>
        </>
      )}
    </div>
  );
}
