'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Stage = 'input' | 'card' | 'calendar';

type Draft = {
  title: string;
  deadline: string;
  submitTo: string;
  overview: string;
  items: string;
};

type CalendarEvent = Draft & {
  id: string;
  createdAt: string;
};

const STORAGE_KEY = 'actionbox-events-v1';

const sampleText = `创新创业比赛报名
截止时间：2026年9月12日 18:00
提交至：比赛官网
负责人：张老师
- 填写报名表
- 准备项目介绍
- 收集成员信息
- 联系指导老师签字`;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toLocalInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function extractDeadline(text: string) {
  const normalized = text.replace(/[／/]/g, '-');
  const full = normalized.match(/(20\d{2})[年-](\d{1,2})[月-](\d{1,2})日?(?:\s*[日号])?(?:\s*(\d{1,2})(?:[:：时](\d{1,2}))?分?)?/);
  const short = normalized.match(/(?:截止(?:时间)?|截至|日期)?[^\d]{0,6}(\d{1,2})月(\d{1,2})日(?:\s*(\d{1,2})(?:[:：时](\d{1,2}))?分?)?/);
  const relative = new Date();

  if (/后天/.test(text)) relative.setDate(relative.getDate() + 2);
  else if (/明天/.test(text)) relative.setDate(relative.getDate() + 1);
  else if (/今天/.test(text)) relative.setDate(relative.getDate());
  else if (!full && !short) {
    relative.setDate(relative.getDate() + 7);
    relative.setHours(18, 0, 0, 0);
    return toLocalInput(relative);
  }

  if (full) {
    const [, year, month, day, hour = '18', minute = '0'] = full;
    return `${year}-${pad(Number(month))}-${pad(Number(day))}T${pad(Number(hour))}:${pad(Number(minute))}`;
  }

  if (short) {
    const [, month, day, hour = '18', minute = '0'] = short;
    return `${new Date().getFullYear()}-${pad(Number(month))}-${pad(Number(day))}T${pad(Number(hour))}:${pad(Number(minute))}`;
  }

  const time = text.match(/(\d{1,2})[:：时](\d{1,2})?/);
  relative.setHours(Number(time?.[1] ?? 18), Number(time?.[2] ?? 0), 0, 0);
  return toLocalInput(relative);
}

function parseText(text: string): Draft {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const taskLines = lines
    .filter((line) => /^[-•·✓□]|^\d+[.、]/.test(line))
    .map((line) => line.replace(/^[-•·✓□\s]+|^\d+[.、]\s*/g, '').trim());
  const submitMatch = text.match(/(?:提交至|提交到|发送至|发送到|交给|提交渠道)[:：]?\s*([^，。；\n]+)/);
  const ownerMatch = text.match(/(?:负责人|联系人)[:：]?\s*([^，。；\n]+)/);
  const firstContentLine = lines.find((line) => !/(截止|截至|提交至|提交到|负责人|联系人)/.test(line) && !/^[-•·✓□]|^\d+[.、]/.test(line));
  const title = (firstContentLine || '未命名事项').replace(/^(事项|任务)[:：]\s*/, '').slice(0, 36);

  return {
    title,
    deadline: extractDeadline(text),
    submitTo: [submitMatch?.[1], ownerMatch ? `负责人：${ownerMatch[1]}` : ''].filter(Boolean).join(' · ') || '待补充',
    overview: lines.filter((line) => !/^[-•·✓□]|^\d+[.、]/.test(line)).slice(0, 4).join('；'),
    items: taskLines.join('\n') || '完成并提交事项',
  };
}

function formatDeadline(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('input');
  const [source, setSource] = useState('');
  const [draft, setDraft] = useState<Draft>(() => parseText(sampleText));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [message, setMessage] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setEvents(JSON.parse(saved));
    } catch {
      setMessage('当前浏览器无法读取已保存事项。');
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // The app remains usable for this session when storage is unavailable.
    }
  }, [events, storageLoaded]);

  const calendarCells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [month]);

  function createCard() {
    if (!source.trim()) {
      setMessage('请先输入一段事项信息。');
      return;
    }
    setDraft(parseText(source));
    setMessage('');
    setStage('card');
  }

  async function pasteText() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) throw new Error('empty');
      setSource((current) => current ? `${current}\n${text}` : text);
      setMessage('已粘贴剪贴板文本。');
    } catch {
      setMessage('无法读取剪贴板，请使用 Ctrl/⌘ + V 粘贴。');
    }
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: new () => any; SpeechRecognition?: new () => any }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('当前浏览器不支持语音识别，请使用 Chrome 或 Edge。');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      setSource((current) => current ? `${current}\n${transcript}` : transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setMessage('语音识别没有成功，请检查麦克风权限。');
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setMessage('正在聆听…');
  }

  function confirmEvent() {
    if (!draft.title.trim() || !draft.deadline) {
      setMessage('事项名称和截止时间不能为空。');
      return;
    }
    const event: CalendarEvent = {
      ...draft,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    setEvents((current) => [...current, event]);
    const deadline = new Date(draft.deadline);
    setMonth(new Date(deadline.getFullYear(), deadline.getMonth(), 1));
    setStage('calendar');
    setMessage('事项已加入日历。');
  }

  function startNew() {
    setSource('');
    setDraft(parseText(sampleText));
    setMessage('');
    setStage('input');
  }

  function eventsForDay(day: number) {
    return events.filter((event) => {
      const date = new Date(event.deadline);
      return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth() && date.getDate() === day;
    });
  }

  return (
    <main className="app">
      <header className="app-header">
        <button className="logo" onClick={startNew} aria-label="返回输入页"><span>A</span><strong>ActionBox</strong></button>
        <div className="steps" aria-label="使用流程">
          <button className={stage === 'input' ? 'active' : ''} onClick={() => setStage('input')}><i>1</i>输入</button>
          <span />
          <button className={stage === 'card' ? 'active' : ''} disabled={stage === 'input'} onClick={() => setStage('card')}><i>2</i>确认</button>
          <span />
          <button className={stage === 'calendar' ? 'active' : ''} onClick={() => setStage('calendar')}><i>3</i>日历</button>
        </div>
        <button className="calendar-shortcut" onClick={() => setStage('calendar')}>日历 <b>{events.length}</b></button>
      </header>

      <section className="screen">
        {stage === 'input' && (
          <div className="input-view">
            <div className="view-title"><span>第 1 步</span><h1>把事情交给我</h1><p>粘贴通知或直接说出来，我会整理成一张可确认的事项卡片。</p></div>
            <div className="input-box">
              <textarea
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder={'例如：\n创新创业比赛报名，9月12日18:00前提交到比赛官网，需要准备报名表、项目介绍和成员信息。'}
                aria-label="输入事项信息"
                autoFocus
              />
              <div className="input-actions">
                <div>
                  <button className={listening ? 'tool-button listening' : 'tool-button'} onClick={toggleVoice}><span>●</span>{listening ? '结束录音' : '语音输入'}</button>
                  <button className="tool-button" onClick={pasteText}><span>▣</span>一键粘贴</button>
                  <button className="tool-button quiet" onClick={() => { setSource(sampleText); setMessage('已填入示例。'); }}>使用示例</button>
                </div>
                <button className="primary-button" onClick={createCard}>生成事项卡片 <span>→</span></button>
              </div>
            </div>
            {message && <p className="message" role="status">{message}</p>}
          </div>
        )}

        {stage === 'card' && (
          <div className="card-view">
            <div className="view-title"><span>第 2 步</span><h1>确认事项信息</h1><p>信息都可以修改，确认后才会写入日历。</p></div>
            <article className="event-card">
              <label className="field title-field"><span>事项名称</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
              <div className="field-grid">
                <label className="field"><span>截止时间</span><input type="datetime-local" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} /></label>
                <label className="field"><span>提交对象 / 地点</span><input value={draft.submitTo} onChange={(event) => setDraft({ ...draft, submitTo: event.target.value })} /></label>
              </div>
              <label className="field"><span>事项概述</span><textarea rows={3} value={draft.overview} onChange={(event) => setDraft({ ...draft, overview: event.target.value })} /></label>
              <label className="field"><span>需要完成（每行一项）</span><textarea rows={5} value={draft.items} onChange={(event) => setDraft({ ...draft, items: event.target.value })} /></label>
              <div className="card-preview-line"><span>截止</span><strong>{formatDeadline(draft.deadline)}</strong></div>
              <div className="card-actions">
                <button className="secondary-button" onClick={() => setStage('input')}>返回修改原文</button>
                <button className="primary-button" onClick={confirmEvent}>确认并加入日历 <span>→</span></button>
              </div>
            </article>
            {message && <p className="message" role="status">{message}</p>}
          </div>
        )}

        {stage === 'calendar' && (
          <div className="calendar-view">
            <div className="calendar-top">
              <div className="view-title compact"><span>第 3 步</span><h1>事项日历</h1><p>所有事项保存在当前浏览器中。</p></div>
              <button className="primary-button small" onClick={startNew}>＋ 新建事项</button>
            </div>
            {message && <p className="message success" role="status">{message}</p>}
            <section className="calendar-card">
              <div className="calendar-toolbar">
                <button aria-label="上个月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
                <h2>{month.getFullYear()}年 {month.getMonth() + 1}月</h2>
                <button aria-label="下个月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
              </div>
              <div className="week-row">{['日','一','二','三','四','五','六'].map((day) => <span key={day}>周{day}</span>)}</div>
              <div className="calendar-grid">
                {calendarCells.map((day, index) => (
                  <div className={day ? 'day-cell' : 'day-cell empty'} key={`${day}-${index}`}>
                    {day && <><span className="day-number">{day}</span><div className="day-events">{eventsForDay(day).map((event) => <div className="calendar-event" key={event.id}><strong>{event.title}</strong><small>{new Date(event.deadline).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })} 截止</small><button aria-label={`删除${event.title}`} onClick={() => setEvents((current) => current.filter((item) => item.id !== event.id))}>×</button></div>)}</div></>}
                  </div>
                ))}
              </div>
            </section>
            {events.length === 0 && <div className="empty-state"><span>□</span><h3>日历里还没有事项</h3><p>创建第一张事项卡片，它会出现在截止日期当天。</p><button className="primary-button small" onClick={startNew}>创建事项</button></div>}
          </div>
        )}
      </section>
    </main>
  );
}
