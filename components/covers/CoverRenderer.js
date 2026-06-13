'use client';

import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { TEMPLATES, PALETTES } from './templates';

const W = 1242;
const H = 1660;

/**
 * 封面预览 + 导出
 * props: cover, width, filename
 * ref:   { getPngDataUrl() } —— 供父组件"一键下载全部图片"编排使用
 */
const CoverRenderer = forwardRef(function CoverRenderer({ cover, width = 300, filename = '封面' }, ref) {
  const nodeRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const hasBg = !!cover?.bgDataUrl;
  const tpl = hasBg ? TEMPLATES.V_PHOTO : (TEMPLATES[cover?.template] || TEMPLATES.V01);
  const scheme = cover?.template === 'V07'
    ? 'alert'
    : (PALETTES[cover?.scheme] ? cover.scheme : tpl.defaultScheme);
  const p = PALETTES[scheme];
  const d = {
    ...cover,
    title: (cover?.title || '').slice(0, 12),
  };
  const scale = width / W;
  const Comp = tpl.Comp;

  async function getPngDataUrl() {
    if (!nodeRef.current) return null;
    const { toPng } = await import('html-to-image');
    return toPng(nodeRef.current, {
      width: W, height: H, pixelRatio: 1, cacheBust: true, style: { transform: 'none' },
    });
  }

  // 暴露给父组件
  useImperativeHandle(ref, () => ({ getPngDataUrl }), []);

  async function exportPng() {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await getPngDataUrl();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename}_${tpl.name}.png`;
      a.click();
    } catch (e) {
      setErr('导出失败，可重试（字体加载慢时偶发）');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="coverWrap" style={{ width }}>
      <div className="coverViewport" style={{ width, height: H * scale }}>
        <div ref={nodeRef} style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Comp d={d} p={p} />
        </div>
      </div>
      <button className="btn btnGhost btnSmall" onClick={exportPng} disabled={busy} style={{ width: '100%', marginTop: 8 }}>
        {busy ? '正在出图…' : '下载封面 PNG（1242×1660）'}
      </button>
      {err ? <div className="hintErr">{err}</div> : null}
    </div>
  );
});

export default CoverRenderer;
