'use client';

import { useMemo, useState } from 'react';

const tasks = [
  { title: '填写报名表' },
  { title: '准备项目介绍' },
  { title: '收集成员信息' },
  { title: '联系指导老师签字' },
];

const planItems = [
  { title: '比赛报名', date: '9月12日', days: '还剩 15 天', width: 92, tone: 'blue' },
  { title: '课程作业', date: '9月5日', days: '还剩 8 天', width: 57, tone: 'orange' },
  { title: '产品会议', date: '9月1日', days: '还剩 4 天', width: 34, tone: 'purple' },
];

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [pasted, setPasted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [completed, setCompleted] = useState([true, false, false, false]);

  const completeCount = useMemo(() => completed.filter(Boolean).length, [completed]);

  function toggleTask(index: number) {
    setCompleted((current) => current.map((item, itemIndex) => itemIndex === index ? !item : item));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand-mark">A</div>
        <nav className="side-nav">
          <button className="nav-item active"><span className="nav-glyph">⌂</span><span>收件箱</span><b>2</b></button>
          <button className="nav-item"><span className="nav-glyph">▥</span><span>计划</span></button>
          <button className="nav-item"><span className="nav-glyph">✓</span><span>待办</span></button>
          <button className="nav-item"><span className="nav-glyph">◇</span><span>已完成</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><span className="nav-glyph">?</span><span>帮助</span></button>
          <button className="nav-item"><span className="nav-glyph">⚙</span><span>设置</span></button>
          <div className="profile"><span className="avatar">林</span><div><strong>林澈</strong><small>个人空间</small></div></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">A</span><strong>ActionBox</strong></div>
          <div className="desktop-title"><p>8月28日 · 星期五</p><h1>上午好，林澈</h1></div>
          <button className="search-button" aria-label="搜索事项"><span>⌕</span><span className="search-label">搜索事项</span><kbd>⌘ K</kbd></button>
          <button className="notice-button" aria-label="通知">●</button>
          <span className="mobile-avatar">林</span>
        </header>

        <div className="content-wrap">
          <section className="mobile-greeting"><p>8月28日 · 星期五</p><h1>上午好，林澈</h1></section>

          <section className="capture-card" aria-labelledby="capture-title">
            <div className="capture-copy">
              <span className="eyebrow">行动收件箱</span>
              <h2 id="capture-title">今天，要处理什么？</h2>
              <p>把刚看到的信息交给我，我来提取事项和截止时间。</p>
            </div>

            <div className="recent-shot">
              <div className="shot-preview" aria-hidden="true">
                <span className="shot-dot red" /><span className="shot-dot yellow" /><span className="shot-dot green" />
                <div className="shot-lines"><i /><i /><i /><i /></div>
              </div>
              <div className="shot-info"><strong>检测到刚刚的截图</strong><span>比赛报名通知 · 1分钟前</span></div>
              <button className="use-shot">已加入 <span>✓</span></button>
            </div>

            {pasted && <div className="pasted-chip"><span>剪贴板</span> 已加入补充通知文本 <button onClick={() => setPasted(false)} aria-label="移除剪贴板内容">×</button></div>}
            {recording && <div className="voice-line"><span className="pulse" />正在聆听：请说出你希望如何处理这件事…</div>}

            <div className="capture-actions">
              <button className={recording ? 'action-button recording' : 'action-button'} onClick={() => setRecording(!recording)}><span className="action-icon mic">●</span>{recording ? '结束录音' : '说出需求'}</button>
              <button className="action-button" onClick={() => setPasted(true)}><span className="action-icon">▣</span>粘贴内容</button>
              <button className="action-button"><span className="action-icon">＋</span>添加文件</button>
              <button className="analyze-button">开始分析 <span>→</span></button>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="result-panel">
              <div className="section-heading">
                <div><span className="status-dot" /><h2>{confirmed ? '已加入待办' : '待你确认'}</h2><span className="count-pill">1</span></div>
                <button>查看全部</button>
              </div>

              <article className={confirmed ? 'event-card confirmed' : 'event-card'}>
                <div className="event-topline">
                  <div><span className="event-label">报名事项</span><span className="source-label">来自 2 份材料</span></div>
                  <button className="more-button" aria-label="更多操作">•••</button>
                </div>
                <h3>创新创业比赛报名</h3>
                <p className="event-summary">完成参赛信息填写并提交项目材料，需指导老师签字确认。</p>

                <div className="event-meta">
                  <div><span className="meta-icon calendar-icon">□</span><p><small>截止时间</small><strong>9月12日 周六 18:00</strong></p><span className="urgent-pill">还剩15天</span></div>
                  <div><span className="meta-icon">◎</span><p><small>提交至</small><strong>比赛官网 · 在线提交</strong></p></div>
                  <div><span className="meta-icon">人</span><p><small>负责人</small><strong>张老师 · 创新中心</strong></p></div>
                </div>

                <div className="task-block">
                  <div className="task-title"><strong>需要完成</strong><span>{completeCount}/{tasks.length}</span></div>
                  <div className="task-list">
                    {tasks.map((task, index) => (
                      <button key={task.title} className={completed[index] ? 'task-row done' : 'task-row'} onClick={() => toggleTask(index)}>
                        <span className="check">{completed[index] ? '✓' : ''}</span><span>{task.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="event-footer">
                  <button className="source-button">▤ 查看原文依据</button>
                  <div><button className="ghost-button">修改信息</button><button className="confirm-button" onClick={() => setConfirmed(true)}>{confirmed ? '已加入待办 ✓' : '确认并加入待办'}</button></div>
                </div>
              </article>
            </section>

            <aside className="plan-panel">
              <div className="section-heading"><div><h2>截止计划</h2></div><button>本月⌄</button></div>
              <div className="plan-card">
                <div className="plan-header"><span>8月28日</span><span>9月12日</span></div>
                <div className="today-marker"><span>今天</span></div>
                <div className="plan-list">
                  {planItems.map((item) => (
                    <div className="plan-row" key={item.title}>
                      <div className="plan-copy"><strong>{item.title}</strong><span>{item.days}</span></div>
                      <div className="bar-track"><span className={`bar-fill ${item.tone}`} style={{ width: `${item.width}%` }}><i /></span></div>
                      <time>{item.date}</time>
                    </div>
                  ))}
                </div>
                <button className="full-plan-button">打开完整计划视图 <span>→</span></button>
              </div>

              <div className="today-card">
                <div><span className="today-date">28</span><p><strong>今天</strong><small>星期五</small></p></div>
                <span>1 项即将截止</span>
                <div className="today-task"><i /><p><strong>完善课程作业</strong><small>9月5日截止</small></p><button>○</button></div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <nav className="mobile-nav" aria-label="移动端导航">
        <button className="active"><span>⌂</span>收件箱<i>2</i></button>
        <button><span>▥</span>计划</button>
        <button className="mobile-add" aria-label="添加事项">＋</button>
        <button><span>✓</span>待办</button>
        <button><span>◇</span>我的</button>
      </nav>
    </main>
  );
}
