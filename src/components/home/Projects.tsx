import { useEffect, useState } from 'react';
import { PROJECTS, type HomeProject } from '../../data/home';
import { ProjectThumb } from './Thumbnails';

interface CardProps {
  p: HomeProject;
  expanded: boolean;
  onToggle: () => void;
  time: number;
}

function ProjectCard({ p, expanded, onToggle, time }: CardProps) {
  const statusText =
    p.status === 'dev' ? '개발 중' :
    p.status === 'live' ? '운영 중' :
    p.status === 'beta' ? '베타' : '출시 완료';

  return (
    <article
      className={`project-card ${expanded ? 'expanded' : ''}`}
      data-size={p.size}
      onClick={() => !expanded && onToggle()}
    >
      <div className="project-thumb">
        <ProjectThumb kind={p.thumb} time={time} />
        <span className={`project-status status-${p.status}`}>
          <span className="status-dot" />
          {statusText}
        </span>
        <div className="thumb-meta">
          <span className="thumb-tag">{p.idx}</span>
          {p.stars ? <span className="thumb-tag v">★ {p.stars}k</span> : null}
        </div>
      </div>
      <div className="project-body">
        <h3 className="project-title">{p.title}</h3>
        <p className="project-desc">
          <span className="ko">{p.taglineKo}</span>
          {p.tagline}
        </p>
        <div className="project-meta">
          <span className="stack">{p.stack.map((s) => <span key={s}>{s}</span>)}</span>
          {p.status === 'live' ? (
            <span className="live-ping"><span className="d" />LIVE</span>
          ) : (
            <span className="num-ver">v{p.year === 2026 ? '0.' : ''}{p.year === 2026 ? (2 + (p.slug.length % 3)) : '1.0'}</span>
          )}
        </div>
      </div>
      <div className="project-expand">
        <div className="project-expand-inner">
          <div>
            <h4>개요</h4>
            <p>{p.summary}</p>
            <p style={{ color: 'var(--text)', fontWeight: 500 }}>{p.summaryKo}</p>
            <div className="project-actions">
              <a
                className="btn-ghost primary"
                href={`https://github.com/jee599/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                GitHub <span>↗</span>
              </a>
              <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                닫기
              </button>
            </div>
          </div>
          <div>
            <h4>상세</h4>
            <ul>
              {p.details.map((d) => (
                <li key={d.k}><span className="k">{d.k}</span><span className="v">{d.v}</span></li>
              ))}
              <li><span className="k">Role</span><span className="v">{p.role}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [time, setTime] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      setTime((performance.now() - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const filtered = PROJECTS.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (yearFilter !== 'all' && String(p.year) !== yearFilter) return false;
    return true;
  });

  const statuses = [
    { k: 'all', label: '전체', count: PROJECTS.length },
    { k: 'live', label: '운영 중', count: PROJECTS.filter((p) => p.status === 'live').length },
    { k: 'shipped', label: '출시 완료', count: PROJECTS.filter((p) => p.status === 'shipped').length },
    { k: 'beta', label: '베타', count: PROJECTS.filter((p) => p.status === 'beta').length },
    { k: 'dev', label: '개발 중', count: PROJECTS.filter((p) => p.status === 'dev').length },
  ];
  const years = [{ k: 'all', l: '전체' }, { k: '2026', l: '2026' }, { k: '2025', l: '2025' }, { k: '2024', l: '2024' }];

  return (
    <section id="work" className="section" data-screen-label="01 Work">
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">작업실</span>
          <h2 className="section-title">혼자 만들어 본, 자랑스러운 9가지</h2>
          <p className="section-sub">일부는 아직 운영 중이고, 일부는 좋은 기억으로 남아있어요. 카드를 눌러 자세히 볼 수 있어요.</p>
        </div>

        <div className="projects-controls">
          <div className="filter-group">
            <span className="lbl">상태</span>
            {statuses.map((s) => (
              <button
                key={s.k}
                className={`chip ${statusFilter === s.k ? 'active' : ''} ${s.k !== 'all' ? `status-${s.k}` : ''}`}
                onClick={() => setStatusFilter(s.k)}
              >
                {s.label}<span className="count">{s.count}</span>
              </button>
            ))}
          </div>
          <div className="filter-group">
            <span className="lbl">연도</span>
            {years.map((y) => (
              <button key={y.k} className={`chip ${yearFilter === y.k ? 'active' : ''}`} onClick={() => setYearFilter(y.k)}>
                {y.l}
              </button>
            ))}
          </div>
        </div>

        <div className="projects-grid">
          {filtered.map((p) => (
            <ProjectCard
              key={p.slug}
              p={p}
              time={time}
              expanded={expandedSlug === p.slug}
              onToggle={() => setExpandedSlug((prev) => (prev === p.slug ? null : p.slug))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
