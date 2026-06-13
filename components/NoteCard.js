'use client';

import { useState, useRef } from 'react';
import CoverRenderer from './covers/CoverRenderer';

function CopyBtn({ text, label = '复制', cls = 'btn btnGhost btnSmall' }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch (e) { /* 旧浏览器降级 */ }
  }
  return <button className={cls} onClick={copy}>{done ? '已复制 ✓' : label}</button>;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function NoteCard({ note, index }) {
  const [showRejected, setShowRejected] = useState(false);
  const [dl, setDl] = useState('');
  const coverRef = useRef(null);

  const blockHits = note.bodyIssues?.filter((i) => i.severity === 'block') || [];
  const warnHits = note.bodyIssues?.filter((i) => i.severity === 'warn') || [];

  const title = note.titles[0]?.text || '';
  const photos = note.photos || [];
  const pad = (n) => String(n).padStart(2, '0');

  // 小红书发布框格式：正文带话题标签（#xxx），标题单独复制
  const xhsBody = `${note.body}\n\n${note.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ')}`;
  const fullForCopy = `【标题】${title}\n\n【正文】\n${xhsBody}`;

  // 一键下载全部图片：封面 PNG + 每张配图，编号命名，顺序触发
  async function downloadAllImages() {
    if (dl) return;
    try {
      setDl('正在导出封面…');
      let seq = 1;
      if (coverRef.current?.getPngDataUrl) {
        const png = await coverRef.current.getPngDataUrl();
        if (png) { downloadDataUrl(png, `笔记${index + 1}_${pad(seq)}_封面.png`); seq++; await sleep(400); }
      }
      for (let i = 0; i < photos.length; i++) {
        setDl(`正在下载配图 ${i + 1}/${photos.length}…`);
        downloadDataUrl(photos[i], `笔记${index + 1}_${pad(seq)}_配图${i + 1}.jpg`);
        seq++;
        await sleep(400); // 间隔触发，避免浏览器拦截连续下载
      }
      setDl('全部图片已开始下载 ✓');
      setTimeout(() => setDl(''), 2000);
    } catch (e) {
      setDl('封面导出失败，可单独点封面下载按钮重试');
      setTimeout(() => setDl(''), 2500);
    }
  }

  const imgCount = (note.cover ? 1 : 0) + photos.length;

  return (
    <div className="card noteCard">
      <div className="noteHead">
        <span className="noteIndex mono">交付 {pad(index + 1)}</span>
        <span className="noteTopic">{note.topic.title}</span>
        <span className="noteType chip">{note.topic.type}</span>
      </div>

      {/* —— 发布备料区：三步走 —— */}
      <div className="publishBar">
        <div className="publishSteps">
          <span className="pStep">① 下载全部图片 → 小红书拖图</span>
          <span className="pStep">② 复制文案 → 粘贴</span>
          <span className="pStep">③ 点发布</span>
        </div>
        <div className="publishBtns">
          <button className="btn btnPrimary btnSmall" onClick={downloadAllImages} disabled={!!dl}>
            {dl || `⬇ 一键下载全部图片（${imgCount} 张）`}
          </button>
          <CopyBtn text={fullForCopy} label="📋 一键复制文案（标题+正文+话题）" cls="btn btnDark btnSmall" />
        </div>
      </div>

      <div className="noteBody">
        <div className="noteCover">
          <CoverRenderer ref={coverRef} cover={note.cover} width={280} filename={`笔记${index + 1}封面`} />
          {photos.length ? (
            <div className="notePhotos">
              <div className="notePhotosLabel">本篇配图素材（点图单独下载）</div>
              <div className="notePhotosRow">
                {photos.map((src, i) => (
                  <a href={src} download={`笔记${index + 1}_配图${i + 1}.jpg`} key={i} title="点击下载">
                    <img src={src} alt="" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="noteContent">
          <div className="sectionLabel">标题 Top3（10 进 3）</div>
          {note.titles.map((t, i) => (
            <div className="titleRow" key={i}>
              <span className={`scoreBadge ${t.total >= 9 ? 'scoreHigh' : ''}`}>{t.total}分</span>
              <span className="titleText">{t.text}</span>
              <CopyBtn text={t.text} />
            </div>
          ))}

          <button className="linkBtn" onClick={() => setShowRejected(!showRejected)}>
            {showRejected ? '收起淘汰区 ▲' : `查看被淘汰的 ${note.rejected.length} 条及原因 ▼`}
          </button>
          {showRejected ? (
            <div className="rejectedBox">
              {note.rejected.map((r, i) => (
                <div className="rejectedRow" key={i}>
                  <span className="mono rejectedScore">{r.total}分</span>
                  <span className="rejectedText">{r.text}</span>
                  {r.reasons?.length ? <span className="rejectedWhy">{r.reasons[0]}</span> : null}
                </div>
              ))}
            </div>
          ) : null}

          <div className="sectionLabel" style={{ marginTop: 18 }}>
            正文 <CopyBtn text={note.body} label="复制正文" />
          </div>
          {blockHits.length > 0 ? (
            <div className="hintErr">⚠ 正文命中违禁词：{blockHits.map((h) => h.word).join('、')}（发布前必须替换）</div>
          ) : null}
          {warnHits.length > 0 ? (
            <div className="hintWarn">建议复查：{warnHits.map((h) => h.word).join('、')}</div>
          ) : null}
          <div className="bodyBox">{note.body}</div>

          <div className="sectionLabel" style={{ marginTop: 18 }}>
            标签 <CopyBtn text={note.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ')} label="复制标签" />
          </div>
          <div className="tagRow">
            {note.tags.map((t, i) => <span className="chip" key={i}>{t}</span>)}
          </div>

          {note.tip ? <div className="tipLine">📮 发布建议：{note.tip}</div> : null}
        </div>
      </div>
    </div>
  );
}
