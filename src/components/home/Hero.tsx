import { useEffect, useState } from 'react';

interface Line {
  p?: string;
  c: string;
  t?: 'out';
  typing?: boolean;
}

function HeroTerminal() {
  const lines: Line[] = [
    { p: '~/jidonglab', c: 'npx agentcrow init --lang ko' },
    { t: 'out', c: '→ resolving 144 specialists...' },
    { t: 'out', c: '→ loading router table [14x10.2kB]' },
    { t: 'out', c: 'wired → <span class="k">claude-code</span> @ <span class="s">"mcp://localhost:7331"</span>' },
    { t: 'out', c: 'health: <span class="s">ok</span> · latency: <span class="n">38ms</span>' },
    { p: '~/jidonglab', c: 'agentcrow status --live', typing: true },
  ];
  const [shown, setShown] = useState(0);
  const [cmdLen, setCmdLen] = useState(0);

  useEffect(() => {
    if (shown < lines.length - 1) {
      const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 600 : 420);
      return () => clearTimeout(t);
    }
    const last = lines[lines.length - 1].c;
    const t = setInterval(() => {
      setCmdLen((l) => (l < last.length ? l + 1 : l));
    }, 85);
    return () => clearInterval(t);
  }, [shown]);

  const lastCmd = lines[lines.length - 1].c.slice(0, cmdLen);

  return (
    <div className="hero-terminal">
      <div className="head">
        <div className="lights"><span /><span /><span /></div>
        <span>ji@jidong-studio · zsh</span>
        <span className="path">~/jidonglab</span>
      </div>
      <div className="body">
        {lines.slice(0, shown + 1).map((ln, i) => {
          const isLast = i === lines.length - 1;
          if (ln.t === 'out') {
            return <div key={i} className="line out" dangerouslySetInnerHTML={{ __html: ln.c }} />;
          }
          return (
            <div key={i} className="line">
              <span className="prompt">➜ {ln.p}</span>
              <span className="cmd">
                {isLast ? lastCmd : ln.c}
                {isLast && <span className="cur" />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeroLive() {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 18 }, () => 30 + Math.random() * 70));
  const [req, setReq] = useState(142891);
  const [saved, setSaved] = useState(2384712);

  useEffect(() => {
    const i = setInterval(() => {
      setBars((b) => [...b.slice(1), 30 + Math.random() * 70]);
      setReq((r) => r + Math.floor(Math.random() * 12 + 3));
      setSaved((s) => s + Math.floor(Math.random() * 420 + 120));
    }, 900);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="hero-live-card">
      <h4><span className="dot" />LIVE · 지금 돌아가는 것들</h4>
      <div className="hero-metric-row">
        <span className="l">agentcrow · reqs/h</span>
        <span className="v ok">{req.toLocaleString()}</span>
      </div>
      <div className="hero-sparkline">
        {bars.map((h, i) => (
          <span key={i} className={i === bars.length - 1 ? 'latest' : ''} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="hero-metric-row">
        <span className="l">contextzip · tokens saved</span>
        <span className="v">{saved.toLocaleString()}</span>
      </div>
      <div className="hero-metric-row">
        <span className="l">plumb · eval passrate</span>
        <span className="v ok">94.2%</span>
      </div>
      <div className="hero-metric-row">
        <span className="l">open issues</span>
        <span className="v warn">3</span>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="top" className="hero" data-screen-label="00 Hero">
      <div className="hero-grid-bg" />
      <div className="container hero-inner">
        <div className="hero-meta-row">
          <span className="tick" />
          <span>jidonglab / v2026.04</span>
          <span className="sep">·</span>
          <span>seoul · KR</span>
          <span className="sep">·</span>
          <span>solo · 1 commit ahead of main</span>
        </div>
        <span className="hero-eyebrow">
          <span className="dot" />
          서울에서 지금 작업 중이에요
        </span>
        <h1 className="hero-title">
          AI로 뭔가 만드는 사람들을 위한<br />
          <span className="tag-brackets">&lt;/&gt;</span>
          <span className="accent">작고 쓸모있는 도구</span>를 만들어요<span className="caret" />
        </h1>
        <p className="hero-sub">
          안녕하세요, 지동입니다. 혼자서 AI 에이전트 인프라 도구를 만들고, 만들면서 배운 것들을 기록합니다. 화려한 랜딩 페이지 대신 실제로 돌아가는 것들만 올려요.
        </p>

        <div className="hero-meta-grid">
          <HeroTerminal />
          <HeroLive />
        </div>
        <div className="hero-actions">
          <a href="#work" className="btn-primary">
            작업 보러가기
            <span>→</span>
          </a>
          <a href="#log" className="btn-secondary">
            기록 읽어보기
          </a>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="v">9<span className="unit">개</span></div>
            <div className="l">직접 만들어 출시한 프로젝트</div>
          </div>
          <div className="hero-stat">
            <div className="v">61<span className="unit">편</span></div>
            <div className="l">일요일 밤에 쓴 개발 메모</div>
          </div>
          <div className="hero-stat">
            <div className="v">3<span className="unit">년</span></div>
            <div className="l">혼자 만들어온 시간</div>
          </div>
          <div className="hero-stat">
            <div className="v">1<span className="unit">명</span></div>
            <div className="l">팀원 (저예요)</div>
          </div>
        </div>
      </div>
    </section>
  );
}
