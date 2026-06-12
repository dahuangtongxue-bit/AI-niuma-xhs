'use client';

import { useState } from 'react';

const TONES = ['亲切闺蜜风', '专业可信风', '活泼搞笑风', '克制高级风'];

export default function OnboardingForm({ onHire }) {
  const [f, setF] = useState({
    industry: '',
    product: '',
    sellingPoints: '',
    audience: '',
    tone: TONES[0],
    forbidden: '',
    benchmarks: '',
  });
  const [err, setErr] = useState('');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function submit() {
    if (!f.industry.trim() || !f.product.trim() || !f.audience.trim()) {
      setErr('行业、产品介绍、目标人群是必填项——这是阿桃干活的最低情报');
      return;
    }
    const today = new Date();
    const joinedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    onHire({ ...f, joinedAt });
  }

  return (
    <div className="card formCard">
      <div className="formHead">
        <h2>入职登记 · 岗前培训</h2>
        <p>这份档案就是阿桃的"业务大脑"，写得越具体，她产出越准。</p>
      </div>

      <label className="field">
        <span>行业 / 赛道 <i>*</i></span>
        <input value={f.industry} onChange={set('industry')} placeholder="例：兰州牛肉面馆 / 母婴用品电商 / 法律咨询" />
      </label>

      <label className="field">
        <span>产品或店铺一句话介绍 <i>*</i></span>
        <input value={f.product} onChange={set('product')} placeholder="例：开了12年的老字号牛肉面馆，主打手工拉面和秘制辣油" />
      </label>

      <label className="field">
        <span>核心卖点（每行一条，最多3条）</span>
        <textarea rows={3} value={f.sellingPoints} onChange={set('sellingPoints')} placeholder={'例：\n汤底每天凌晨4点现熬\n辣油是传了三代的方子'} />
      </label>

      <label className="field">
        <span>目标人群 <i>*</i></span>
        <input value={f.audience} onChange={set('audience')} placeholder="例：本地25-40岁上班族 + 来兰州旅游的游客" />
      </label>

      <label className="field">
        <span>语气风格</span>
        <select value={f.tone} onChange={set('tone')}>
          {TONES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>品牌禁忌词（逗号分隔，可空）</span>
        <input value={f.forbidden} onChange={set('forbidden')} placeholder="例：网红店, 加盟" />
      </label>

      <label className="field">
        <span>对标账号或爆款链接（每行一个，可空）</span>
        <textarea rows={2} value={f.benchmarks} onChange={set('benchmarks')} placeholder="贴几个你觉得'就该做成这样'的账号或笔记" />
      </label>

      {err ? <div className="hintErr">{err}</div> : null}

      <button className="btn btnPrimary" onClick={submit}>发 Offer，正式入职</button>
    </div>
  );
}
