'use client';

import { useEffect, useState, useRef } from 'react';
import EmployeeCard from './EmployeeCard';
import WorkLog from './WorkLog';
import NoteCard from './NoteCard';
import { runProduction, runSingleNote } from '@/lib/pipeline';
import FeedPanel from './FeedPanel';

const todayKey = () => {
  const d = new Date();
  return `delivery:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Workbench({ profile, onRetrain }) {
  const [mode, setMode] = useState('feed'); // feed=单篇投喂  daily=日更3篇
  const [hot, setHot] = useState('');
  const [status, setStatus] = useState('idle'); // idle | working | done
  const stopRef = useRef({ stop: false });
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

  function stopWork() {
    stopRef.current.stop = true;
  }

  async function start() {
    stopRef.current = { stop: false };
    setStatus('working');
    setError('');
    setNotes([]);
    const collected = { logs: [], notes: [] };
    setLogs([]);

    try {
      await runProduction({
        profile,
        hot: hot.trim(),
        shouldStop: () => stopRef.current.stop,
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
      try { localStorage.setItem(todayKey(), JSON.stringify(collected, (k, v) => (k === 'bgDataUrl' ? undefined : v))); } catch (e) { /* 容量超限忽略 */ }
    } catch (e) {
      setStatus(notes.length > 0 ? 'done' : 'idle');
      setError(String(e.message || e));
    }
  }

  async function startFeed(feed) {
    stopRef.current = { stop: false };
    setStatus('working');
    setError('');
    setNotes([]);
    setLogs([]);
    const collected = { logs: [], notes: [] };
    try {
      await runSingleNote({
        profile,
        feed,
        shouldStop: () => stopRef.current.stop,
        onLog: (entry) => { collected.logs.push(entry); setLogs((prev) => [...prev, entry]); },
        onNote: (note) => { collected.notes.push(note); setNotes((prev) => [...prev, note]); },
      });
      setStatus('done');
      // 投喂模式的封面/照片可能是大图，本地存储一律剔除图片字段
      try { localStorage.setItem(todayKey(), JSON.stringify(collected, (k, v) => ((k === 'bgDataUrl' || k === 'photos' || k === 'coverDataUrl') ? undefined : v))); } catch (e) {}
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

      <div className="modeTabs">
        <button className={`modeTab ${mode === 'feed' ? 'on' : ''}`} onClick={() => status !== 'working' && setMode('feed')}>
          📸 投喂一篇<span>给素材，精做一篇</span>
        </button>
        <button className={`modeTab ${mode === 'daily' ? 'on' : ''}`} onClick={() => status !== 'working' && setMode('daily')}>
          🗓 日更三篇<span>阿桃自主选题</span>
        </button>
      </div>

      {mode === 'feed' ? (
        <div className="card controlCard feedControlCard">
          <FeedPanel working={status === 'working'} onProduce={startFeed} onStop={stopWork} />
        </div>
      ) : (
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
            <button
              className={`btn btnBig ${status === 'working' ? 'btnStop' : 'btnPrimary'}`}
              onClick={status === 'working' ? stopWork : start}
            >
              {status === 'working' ? '⏹ 阿桃工作中…点此叫停' : status === 'done' ? '重新生产今日内容' : '阿桃，开工'}
            </button>
            <div className="controlHint">交付物：3 套完整笔记（封面图＋标题＋正文＋标签）</div>
          </div>
        </div>
      )}

      {error ? (
        <div className="card errorCard">
          生产中断：{error}
          <div className="errorHint">排查：① 看右侧工作日志底部「笔记X 生产失败」的具体原因；② 含 429 → 网关并发/频率限流（已自动串行+重试，仍超限请调网关额度）；③ 含「思考过程/空内容」→ LLM_MODEL 换成非思考版模型；④ 含 504/超时 → 模型出字太慢，换更快的模型。</div>
        </div>
      ) : null}

      <div className="mainGrid">
        <div className="deliverCol">
          {notes.length === 0 && status !== 'working' ? (
            <div className="card emptyCard">
              <div className="emptyEmoji">📭</div>
              <div>{mode === 'feed' ? '上面给阿桃投喂素材：照片＋主题＋文风，她精做一篇给你。' : '交付区还是空的。点「阿桃，开工」，几分钟后来收今天的 3 套笔记。'}</div>
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
