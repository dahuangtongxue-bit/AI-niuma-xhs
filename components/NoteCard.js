'use client';

import { useState } from 'react';
import CoverRenderer from './covers/CoverRenderer';

function CopyBtn({ text, label = '复制' }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch (e) {
      /* 旧浏览器降级：忽略 */
    }
  }
  return (
    <button className="btn btnGhost btnSmall" onClick={copy}>
      {done ? '已复制 ✓' : label}
    </button>
  );
}

export default function NoteCard({ note, index }) {
  const [showRejected, setShowRejected] = useState(false);
  const blockHits = note.bodyIssues?.filter((i) => i.severity === 'block') || [];
  const warnHits = note.bodyIssues?.filter((i) => i.severity === 'warn') || [];

  const fullText = `${note.titles[0]?.text || ''}\n\n${note.body}\n\n${note.tags.join(' ')}`;

  return (
    <div className="card noteCard">
      <div className="noteHead">
        <span className="noteIndex mono">交付 {String(index + 1).padStart(2, '0')}</span>
        <span className="noteTopic">{note.topic.title}</span>
        <span className="noteType chip">{note.topic.type}</span>
      </div>

      <div className="noteBody">
        <div className="noteCover">
          <CoverRenderer cover={note.cover} width={280} filename={`笔记${index + 1}封面`} />
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
            标签 <CopyBtn text={note.tags.join(' ')} label="复制标签" />
          </div>
          <div className="tagRow">
            {note.tags.map((t, i) => (
              <span className="chip" key={i}>{t}</span>
            ))}
          </div>

          {note.tip ? <div className="tipLine">📮 发布建议：{note.tip}</div> : null}

          <div className="noteActions">
            <CopyBtn text={fullText} label="一键复制整篇（标题+正文+标签）" />
          </div>
        </div>
      </div>
    </div>
  );
}
