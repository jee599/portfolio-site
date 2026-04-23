import { useEffect, useRef, useState } from 'react';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}

function Ticker() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((v) => v + 1), 1100);
    return () => clearInterval(i);
  }, []);
  const jitter = (seed: number, base: number, range: number) =>
    base + ((Math.sin((t + seed) * 0.7) + 1) / 2) * range;
  const items = [
    { l: 'agentcrow', v: `${Math.floor(jitter(1, 2140, 140))}`, c: 'up', s: 'reqs/h' },
    { l: 'contextzip', v: `−${(72 + ((t * 3) % 6)).toFixed(1)}%`, c: 'up', s: 'tokens' },
    { l: 'plumb eval', v: '94.2', c: 'acc', s: 'pass' },
    { l: 'p95 latency', v: `${Math.floor(jitter(3, 36, 14))}ms`, c: 'up', s: '' },
    { l: 'open issues', v: '3', c: 'down', s: '' },
    { l: 'uptime', v: '137d', c: 'up', s: '' },
    { l: 'this week', v: '+34', c: 'up', s: 'commits' },
    { l: 'last deploy', v: '4m', c: '', s: 'ago' },
  ];
  const loop = [...items, ...items];
  return (
    <div className="ticker">
      <div className="ticker-track">
        {loop.map((it, i) => (
          <span key={i} style={{ display: 'contents' }}>
            <span className="item">
              <span className="l">{it.l}</span>
              <span className={`v ${it.c}`}>
                {it.v}
                {it.s ? <span style={{ opacity: 0.4, marginLeft: 4, fontSize: 11 }}>{it.s}</span> : null}
              </span>
            </span>
            <span className="sep">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Architecture() {
  const nodes = [
    { id: 'in', x: 8, y: 50, k: 'INPUT', v: 'prompt · ko/en', cls: 'dark', ping: false },
    { id: 'cz', x: 25, y: 28, k: 'FILTER', v: 'contextzip', cls: '', ping: true },
    { id: 'ac', x: 50, y: 50, k: 'ROUTER', v: 'agentcrow', cls: 'accent', ping: true },
    { id: 'sp1', x: 72, y: 22, k: 'AGENT·42', v: 'ko-writer', cls: '', ping: false },
    { id: 'sp2', x: 72, y: 50, k: 'AGENT·88', v: 'sql-expert', cls: '', ping: true },
    { id: 'sp3', x: 72, y: 78, k: 'AGENT·13', v: 'debugger', cls: '', ping: false },
    { id: 'pl', x: 92, y: 50, k: 'EVAL', v: 'plumb', cls: 'dark', ping: false },
  ];
  const edges: Array<[string, string]> = [
    ['in', 'cz'], ['cz', 'ac'], ['ac', 'sp1'], ['ac', 'sp2'], ['ac', 'sp3'],
    ['sp1', 'pl'], ['sp2', 'pl'], ['sp3', 'pl'],
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <div className="arch reveal">
      <div className="arch-head">
        <div>
          <h3><span className="dot" />ARCHITECTURE · 흐름도</h3>
          <div className="title-big">어떻게 <em>흘러가는지</em> 그려봤어요</div>
        </div>
        <div className="arch-legend">
          <span><span className="sw" style={{ background: 'var(--accent)' }} />router</span>
          <span><span className="sw" style={{ background: 'var(--text)' }} />io</span>
          <span><span className="sw" style={{ background: '#4ADE80' }} />live</span>
        </div>
      </div>
      <div className="arch-canvas">
        <svg className="arch-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
          {edges.map(([a, b], i) => {
            const na = byId[a], nb = byId[b];
            const live = na.ping && nb.ping;
            return (
              <line
                key={i}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={live ? 'var(--accent)' : '#D1D6DB'}
                strokeWidth="0.3"
                className={live ? 'arch-edge-dash' : ''}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {nodes.map((n) => (
          <div key={n.id} className={`arch-node ${n.cls}`} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <span className="k">{n.k}</span>
            <span className="v">{n.v}</span>
            {n.ping && <span className="ping" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function CounterStrip() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((v) => v + 1), 1500);
    return () => clearInterval(i);
  }, []);
  const spark = (seed: number) =>
    Array.from({ length: 12 }, (_, i) => 30 + ((Math.sin((i + seed + t * 0.3) * 0.9) + 1) / 2) * 70);
  const cells = [
    { l: '오늘 요청 수', live: true, v: (14280 + t * 12).toLocaleString(), unit: '', delta: '+8.4%', spark: spark(1) },
    { l: '절약한 토큰', live: true, v: ((2384712 + t * 420) / 1000).toFixed(0), unit: 'k', delta: '−74%', spark: spark(2) },
    { l: '평가 통과율', live: false, v: '94.2', unit: '%', delta: '+1.2pt', spark: spark(3) },
    { l: '이번 주 커밋', live: false, v: '34', unit: '', delta: '+12', spark: spark(4) },
  ];
  return (
    <div className="counter-strip reveal">
      {cells.map((c, i) => (
        <div key={i} className="counter-cell">
          <div className="l">{c.live && <span className="d" />}{c.l}</div>
          <div className="v">{c.v}<span className="unit">{c.unit}</span></div>
          <div className="mini-spark">
            {c.spark.map((h, j) => (
              <span key={j} className={j === c.spark.length - 1 ? 'latest' : ''} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="delta">↗ {c.delta}</div>
        </div>
      ))}
    </div>
  );
}

export default function TechBlock() {
  const wrap = useReveal();
  return (
    <div ref={wrap}>
      <section className="section" style={{ paddingTop: 24, paddingBottom: 12 }} data-screen-label="02b Tech">
        <div className="container">
          <Ticker />
          <CounterStrip />
          <Architecture />
        </div>
      </section>
    </div>
  );
}
