'use client';

import { useEffect, useState } from 'react';
import EmployeeCard from './EmployeeCard';
import WorkLog from './WorkLog';
import NoteCard from './NoteCard';
import { runProduction } from '@/lib/pipeline';

const todayKey = () => {
  const d = new Date();
  return `delivery:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Workbench({ profile, onRetrain }) {
  const [hot, setHot] = useState('');
  const [status, setStatus] = useState('idle'); // idle | working | done
  const [logs, setLogs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');

  // 恢复当日已完成的交付
  useEffect(() => {
    try {
      const saved = localStorage.getItem(todayKey());
      if (saved) {
        const data = JSON.parse(saved);
        setNotes(data.notes || []);
        setLogs(data.logs || []);
        if ((data.notes || []).length > 0) setStatus('done');
      }
    } catch (e) { /* 忽略坏数据 */ }
  }, []);

  async function start() {
    setStatus('working');
    setError('');
    setNotes([]);
    const collected = { logs: [], notes: [] };
    setLogs([]);

    try {
      await runProduction({
        profile,
        hot: hot.trim(),
        onLog: (entry) => {
          collected.logs.push(entry);
          setLogs((prev) => [...prev, entry]);
        },
        onTopics: () => {},
        onNote: (note) => {
          collected.notes.push(note);
          setNotes((prev) => [...prev, note].sort((a, b) => a.id - b.id));
        },
      });
      setStatus('done');
      try { localStorage.setItem(todayKey(), JSON.stringify(collected)); } catch (e) { /* 容量超限忽略 */ }
    } catch (e) {
      setStatus(notes.length > 0 ? 'done' : 'idle');
      setError(String(e.message || e));
    }
  }

  const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="workbench">
      <div className="lanyard" />
      <header className="topbar">
        <EmployeeCard profile={profile} mini />
        <div className="topbarRight">
          <span className="topbarDate">{dateStr}</span>
          <button className="btn btnGhost btnSmall" onClick={onRetrain}>重新培训（改档案）</button>
        </div>
      </header>

      <div className="card controlCard">
        <div className="controlLeft">
          <div className="sectionLabel">今日热点投喂（可选）</div>
          <textarea
            rows={2}
            value={hot}
            onChange={(e) => setHot(e.target.value)}
            placeholder="把今天看到的热点、对标爆款标题、行业新闻贴进来，阿桃会结合选题。空着也能干活。"
            disabled={status === 'working'}
          />
        </div>
        <div className="controlRight">
          <button className="btn btnPrimary btnBig" onClick={start} disabled={status === 'working'}>
            {status === 'working' ? '阿桃工作中…' : status === 'done' ? '重新生产今日内容' : '阿桃，开工'}
          </button>
          <div className="controlHint">交付物：3 套完整笔记（封面图＋标题＋正文＋标签）</div>
        </div>
      </div>

      {error ? (
        <div className="card errorCard">
          生产中断：{error}
          <div className="errorHint">常见原因：Netlify 未配置 LLM_API_BASE / LLM_API_KEY / LLM_MODEL，或网关额度不足。</div>
        </div>
      ) : null}

      <div className="mainGrid">
        <div className="deliverCol">
          {notes.length === 0 && status !== 'working' ? (
            <div className="card emptyCard">
              <div className="emptyEmoji">📭</div>
              <div>交付区还是空的。点「阿桃，开工」，几分钟后来收今天的 3 套笔记。</div>
            </div>
          ) : null}
          {status === 'working' && notes.length === 0 ? (
            <div className="card emptyCard">
              <div className="emptyEmoji">⏳</div>
              <div>生产线运转中——右侧工作日志可以看她每一步在干什么。</div>
            </div>
          ) : null}
          {notes.map((n, i) => (
            <NoteCard note={n} index={i} key={n.id ?? i} />
          ))}
        </div>
        <div className="logCol">
          <WorkLog entries={logs} />
        </div>
      </div>
    </div>
  );
}
