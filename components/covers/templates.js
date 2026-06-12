// 封面工厂：《小红书封面版式库 v1》的代码实现（v1 先做 6 个纯文字版式，图片底版式待接生图后扩展）
// 画布统一 1242×1660（3:4），所有文字走 HTML 层，由 CoverRenderer 缩放预览 + 原尺寸导出

const SANS = "'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif";
const KUAILE = "'ZCOOL KuaiLe','Noto Sans SC','PingFang SC',sans-serif";

export const PALETTES = {
  cream: { bg: 'linear-gradient(165deg,#FFF6E0 0%,#FFE2AE 100%)', ink: '#2B1D0E', accent: '#E8590C', soft: 'rgba(232,89,12,.14)' },
  klein: { bg: 'linear-gradient(170deg,#2240E0 0%,#101E8C 100%)', ink: '#FFFFFF', accent: '#FFD43B', soft: 'rgba(255,212,59,.22)' },
  alert: { bg: '#151515', ink: '#FFFFFF', accent: '#FFD400', danger: '#FF4D3A', soft: 'rgba(255,212,0,.16)' },
  mint:  { bg: 'linear-gradient(165deg,#E9FBF2 0%,#C5F2DD 100%)', ink: '#0A3D2E', accent: '#F76707', soft: 'rgba(10,61,46,.10)' },
  paper: { bg: '#F5EFE0', ink: '#3A332A', accent: '#C92A2A', soft: 'rgba(58,51,42,.10)' },
};

function sizeFor(t) {
  const n = (t || '').length;
  if (n <= 5) return 250;
  if (n <= 7) return 215;
  if (n <= 9) return 185;
  if (n <= 12) return 150;
  return 128;
}

function Title({ text, highlight, p, size }) {
  const fs = size || sizeFor(text);
  const base = { fontSize: fs, fontWeight: 900, lineHeight: 1.18, letterSpacing: 2, color: p.ink, wordBreak: 'break-all' };
  if (highlight && text && text.includes(highlight)) {
    const i = text.indexOf(highlight);
    return (
      <div style={base}>
        {text.slice(0, i)}
        <span style={{ color: p.accent, backgroundImage: `linear-gradient(transparent 62%, ${p.soft} 62%)` }}>{highlight}</span>
        {text.slice(i + highlight.length)}
      </div>
    );
  }
  return <div style={base}>{text}</div>;
}

const frame = (p, extra) => ({
  width: 1242,
  height: 1660,
  background: p.bg,
  fontFamily: SANS,
  color: p.ink,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  overflow: 'hidden',
  position: 'relative',
  ...extra,
});

/* V01 纯色大字报 */
function V01({ d, p }) {
  return (
    <div style={frame(p, { padding: 110, justifyContent: 'space-between' })}>
      <div style={{ alignSelf: 'flex-start', border: `5px solid ${p.ink}`, borderRadius: 999, padding: '16px 44px', fontSize: 46, fontWeight: 700 }}>
        {d.badge || '干货'}
      </div>
      <div>
        <Title text={d.title} highlight={d.highlight} p={p} />
        {d.sub ? <div style={{ fontSize: 64, fontWeight: 500, opacity: 0.78, marginTop: 52 }}>{d.sub}</div> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 46, opacity: 0.6 }}>完整内容见正文</div>
        <div style={{ width: 110, height: 110, borderRadius: '50%', background: p.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, fontWeight: 900 }}>→</div>
      </div>
    </div>
  );
}

/* V03 数字爆炸 */
function V03({ d, p }) {
  return (
    <div style={frame(p, { padding: 100, justifyContent: 'center', textAlign: 'center' })}>
      <div style={{ position: 'absolute', top: 90, left: 90, border: `5px solid ${p.ink}`, borderRadius: 14, padding: '12px 34px', fontSize: 44, fontWeight: 700, transform: 'rotate(-6deg)' }}>
        {d.badge || '盘点'}
      </div>
      <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1.25 }}>{d.title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 16, margin: '10px 0' }}>
        <span style={{ fontSize: 600, fontWeight: 900, lineHeight: 1, color: p.accent, textShadow: `0 18px 0 ${p.soft}` }}>{d.num || '3'}</span>
        <span style={{ fontSize: 150, fontWeight: 900 }}>{d.unit || '个'}</span>
      </div>
      {d.sub ? <div style={{ fontSize: 62, fontWeight: 500, opacity: 0.78 }}>{d.sub}</div> : null}
    </div>
  );
}

/* V07 红黑警告（固定 alert 配色） */
function V07({ d }) {
  const p = PALETTES.alert;
  const points = (d.points || []).slice(0, 3);
  return (
    <div style={frame(p, { padding: 100, justifyContent: 'space-between' })}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        <span style={{ fontSize: 96 }}>⚠️</span>
        <span style={{ border: `6px solid ${p.danger}`, color: p.danger, borderRadius: 14, padding: '12px 36px', fontSize: 58, fontWeight: 900, transform: 'rotate(-7deg)' }}>
          {d.badge || '避坑'}
        </span>
      </div>
      <Title text={d.title} highlight={d.highlight} p={{ ...p, ink: '#FFFFFF', accent: p.danger, soft: 'rgba(255,77,58,.22)' }} />
      <div>
        {points.map((pt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 28, background: 'rgba(255,255,255,.07)', borderRadius: 18, padding: '26px 36px', marginTop: i === 0 ? 0 : 30 }}>
            <span style={{ color: p.danger, fontSize: 64, fontWeight: 900 }}>✗</span>
            <span style={{ fontSize: 64, fontWeight: 700, color: '#FFFFFF' }}>{pt}</span>
          </div>
        ))}
      </div>
      <div style={{ color: p.accent, fontSize: 48, fontWeight: 700 }}>完整避坑清单 → 正文</div>
    </div>
  );
}

/* V08 封面即目录 */
function V08({ d, p }) {
  const points = (d.points || []).slice(0, 4);
  return (
    <div style={frame(p, { padding: 100 })}>
      <div style={{ background: p.soft, borderRadius: 28, padding: '64px 70px' }}>
        <Title text={d.title} highlight={d.highlight} p={p} size={Math.min(sizeFor(d.title), 160)} />
        {d.sub ? <div style={{ fontSize: 56, opacity: 0.75, marginTop: 30 }}>{d.sub}</div> : null}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 52, marginTop: 40 }}>
        {points.map((pt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 34, paddingBottom: 36, borderBottom: `3px dashed ${p.ink}33` }}>
            <span style={{ width: 86, height: 86, flex: 'none', borderRadius: '50%', background: p.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 900 }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 68, fontWeight: 700 }}>{pt}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 50, opacity: 0.65 }}>📌 先收藏，完整版在正文</div>
    </div>
  );
}

/* V17 问答悬念 */
function V17({ d, p }) {
  const pillBg = p.ink;
  const pillColor = p.ink === '#FFFFFF' ? '#151515' : '#FFFFFF';
  return (
    <div style={frame(p, { padding: 110, justifyContent: 'center', alignItems: 'center', textAlign: 'center' })}>
      <div style={{ position: 'absolute', top: -140, right: -90, fontSize: 1250, fontWeight: 900, lineHeight: 1, color: p.ink, opacity: 0.06 }}>？</div>
      <div style={{ border: `4px solid ${p.ink}`, borderRadius: 999, padding: '12px 40px', fontSize: 42, fontWeight: 700, marginBottom: 80 }}>
        {d.badge || '灵魂拷问'}
      </div>
      <Title text={d.title} highlight={d.highlight} p={p} />
      <div style={{ marginTop: 110, background: pillBg, color: pillColor, borderRadius: 999, padding: '28px 64px', fontSize: 54, fontWeight: 700 }}>
        答案在正文 👇
      </div>
    </div>
  );
}

/* V04 手写便签 */
function V04({ d, p }) {
  const points = (d.points || []).slice(0, 3);
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  return (
    <div style={frame(p, { padding: 90 })}>
      <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 8, boxShadow: '0 26px 70px rgba(0,0,0,.18)', transform: 'rotate(-1.6deg)', padding: '110px 95px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', top: -28, left: 120, width: 230, height: 66, background: 'rgba(255,222,125,.85)', transform: 'rotate(-4deg)', boxShadow: '0 4px 10px rgba(0,0,0,.08)' }} />
        <div style={{ position: 'absolute', top: -28, right: 120, width: 230, height: 66, background: 'rgba(255,222,125,.85)', transform: 'rotate(5deg)', boxShadow: '0 4px 10px rgba(0,0,0,.08)' }} />
        <div style={{ fontSize: 42, color: '#A89F90', letterSpacing: 4 }}>{dateStr} · 手记</div>
        <div style={{ marginTop: 56, fontFamily: KUAILE, fontSize: Math.min(sizeFor(d.title), 165), lineHeight: 1.3, color: '#3A332A', wordBreak: 'break-all' }}>
          {d.highlight && d.title && d.title.includes(d.highlight) ? (
            <>
              {d.title.slice(0, d.title.indexOf(d.highlight))}
              <span style={{ color: p.accent }}>{d.highlight}</span>
              {d.title.slice(d.title.indexOf(d.highlight) + d.highlight.length)}
            </>
          ) : d.title}
        </div>
        <div style={{ marginTop: 'auto' }}>
          {points.map((pt, i) => (
            <div key={i} style={{ fontSize: 62, lineHeight: 1.7, color: '#5A5246' }}>· {pt}</div>
          ))}
        </div>
        <div style={{ position: 'absolute', right: 80, bottom: 70, width: 124, height: 124, border: '6px solid #C92A2A', color: '#C92A2A', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, fontWeight: 900, transform: 'rotate(7deg)' }}>
          {(d.badge || '阿桃').slice(0, 2)}
        </div>
      </div>
    </div>
  );
}


/* V_PHOTO 图底大字报（生图层就位时由渲染器自动启用，不进模型可选清单） */
function V_PHOTO({ d }) {
  return (
    <div style={frame({ bg: '#1B1B1B', ink: '#FFFFFF' }, { color: '#FFFFFF', justifyContent: 'flex-end' })}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {d.bgDataUrl ? (
          <img src={d.bgDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : null}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.10) 30%, rgba(0,0,0,.46) 62%, rgba(0,0,0,.82) 100%)' }} />
      <div style={{ position: 'relative', padding: '90px 100px 110px', display: 'flex', flexDirection: 'column', gap: 36 }}>
        <div style={{ alignSelf: 'flex-start', border: '5px solid rgba(255,255,255,.92)', color: '#FFFFFF', borderRadius: 999, padding: '14px 42px', fontSize: 44, fontWeight: 800 }}>
          {d.badge || '实测'}
        </div>
        <div style={{ textShadow: '0 4px 28px rgba(0,0,0,.68)' }}>
          <Title text={d.title} highlight={d.highlight} p={{ ink: '#FFFFFF', accent: '#FFD43B', soft: 'rgba(0,0,0,.38)' }} />
        </div>
        {d.sub ? <div style={{ fontSize: 54, fontWeight: 500, color: 'rgba(255,255,255,.9)', textShadow: '0 2px 16px rgba(0,0,0,.6)' }}>{d.sub}</div> : null}
      </div>
    </div>
  );
}

export const TEMPLATES = {
  V_PHOTO: { name: '图底大字报', Comp: V_PHOTO, defaultScheme: 'cream' },
  V01: { name: '纯色大字报', Comp: V01, defaultScheme: 'cream' },
  V03: { name: '数字爆炸', Comp: V03, defaultScheme: 'klein' },
  V07: { name: '红黑警告', Comp: V07, defaultScheme: 'alert' },
  V08: { name: '封面即目录', Comp: V08, defaultScheme: 'mint' },
  V17: { name: '问答悬念', Comp: V17, defaultScheme: 'paper' },
  V04: { name: '手写便签', Comp: V04, defaultScheme: 'paper' },
};

// 注入提示词的版式规格（与上面实现一一对应）
export const TEMPLATE_SPEC = `V01 纯色大字报（适用：观点输出/干货总纲）字段：title, highlight, sub, badge
V03 数字爆炸（适用：价格/天数/数量是核心钩子时）字段：title, num, unit, sub, badge
V07 红黑警告（适用：避坑/雷区/防骗）字段：title, highlight, points×3, badge
V08 封面即目录（适用：清单/合集/攻略，要点只说前半句吊胃口）字段：title, sub, points×3~4, badge
V17 问答悬念（适用：互动钩/冷知识/争议话题，title 写成问题）字段：title, highlight, badge
V04 手写便签（适用：经验贴/真诚分享/自留笔记感）字段：title, highlight, points×2~3, badge
配色 scheme 可选：cream(奶油暖)/klein(克莱因蓝)/alert(黑黄警示)/mint(薄荷)/paper(纸感)，按内容情绪选；V07 固定 alert。`;
