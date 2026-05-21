import { PROJECTS, type HomeProject } from '../../data/home';
import { ProjectThumb } from './Thumbnails';

type CardLang = 'ts' | 'py' | 'as' | 'rs' | 'js';

interface CardMeta {
  status: 'live' | 'oss' | 'dev' | 'beta';
  statusLabel: string;
  lang: CardLang;
  stackLabel: string;
}

const OSS_SLUGS = new Set(['agentcrow', 'contextzip', 'clisync']);

function cardMeta(p: HomeProject): CardMeta {
  const stackStr = p.stack.join(' ').toLowerCase();
  let lang: CardLang = 'ts';
  if (stackStr.includes('python')) lang = 'py';
  else if (stackStr.includes('astro')) lang = 'as';
  else if (stackStr.includes('rust')) lang = 'rs';
  else if (stackStr.includes('shell') || stackStr.includes('javascript')) lang = 'js';

  let status: CardMeta['status'];
  let statusLabel: string;
  if (OSS_SLUGS.has(p.slug)) {
    status = 'oss';
    statusLabel = 'OSS';
  } else if (p.status === 'live') {
    status = 'live';
    statusLabel = 'live';
  } else if (p.status === 'dev') {
    status = 'dev';
    statusLabel = 'dev';
  } else {
    status = 'beta';
    statusLabel = p.status;
  }

  return {
    status,
    statusLabel,
    lang,
    stackLabel: p.stack.slice(0, 2).join(' · '),
  };
}

function projectHref(p: HomeProject): string {
  return p.url ?? p.github ?? `https://github.com/jee599/${p.slug}`;
}

function ActiveCard({ p }: { p: HomeProject }) {
  const m = cardMeta(p);
  return (
    <a
      className="pcard"
      href={projectHref(p)}
      target="_blank"
      rel="noreferrer"
      aria-label={`${p.title} — ${p.taglineKo}`}
    >
      <ProjectThumb slug={p.slug} title={p.title} variant="card" />
      <div className="p-body">
        <div className="p-row1">
          <span className={`p-status ${m.status}`}>
            <span className="dot" />
            {m.statusLabel}
          </span>
          <span className="p-idx">{p.idx}</span>
        </div>
        <div className="p-title">{p.title}</div>
        <p className="p-desc">{p.taglineKo}</p>
        <div className="p-bot">
          <span className="p-stack">
            <span className={`lang-dot ${m.lang}`} />
            {m.stackLabel}
          </span>
          <span className="p-arr">→</span>
        </div>
      </div>
    </a>
  );
}

function IndexRow({ p }: { p: HomeProject }) {
  const m = cardMeta(p);
  return (
    <a className="pindex-row" href={projectHref(p)} target="_blank" rel="noreferrer">
      <span className="idx">{p.idx}</span>
      <span className="name">{p.title}</span>
      <span className="desc">{p.taglineKo}</span>
      <span className="stack">{p.stack.slice(0, 2).join(' · ')}</span>
      <span className={`stat ${m.status}`}>{m.statusLabel}</span>
    </a>
  );
}

export default function Projects() {
  const featuredSlugs = ['saju_global', 'contextzip', 'news4ai'];
  const featured =
    PROJECTS.find((p) => p.slug === featuredSlugs[0]) ??
    PROJECTS.find((p) => p.status === 'live' && p.slug !== 'portfolio-site');

  const activePool = PROJECTS.filter(
    (p) => p.slug !== featured?.slug && p.slug !== 'portfolio-site' && p.status === 'live'
  ).slice(0, 3);

  const indexed = PROJECTS.filter(
    (p) =>
      p.slug !== featured?.slug && !activePool.some((a) => a.slug === p.slug)
  );

  return (
    <section id="projects" className="sec">
      <div className="sec-head">
        <div className="lead">
          <div className="sec-kicker">
            <span className="n">01</span>
            <span className="sep">/</span>
            <span>projects</span>
          </div>
          <h2 className="sec-h">
            <span data-ko="지금 만들고 운영 중인 것들" data-en="Building and running">
              지금 만들고 운영 중인 것들
            </span>
          </h2>
          <p className="sec-desc">
            <span
              data-ko="운영 중인 제품과 만들고 있는 것까지 같이 둔다. 대표 1개, 활성 3개는 카드로, 나머지는 아래 인덱스로 본다."
              data-en="Live products and works in progress, side by side. One featured plus three active as cards, the rest indexed below."
            >
              운영 중인 제품과 만들고 있는 것까지 같이 둔다. 대표 1개, 활성 3개는 카드로, 나머지는 아래 인덱스로 본다.
            </span>
          </p>
        </div>
        <a className="sec-link" href="/projects" data-ko={`전체 ${PROJECTS.length}개 →`} data-en={`all ${PROJECTS.length} →`}>
          {`전체 ${PROJECTS.length}개 →`}
        </a>
      </div>

      {featured && (
        <div className="featured-wrap">
          <article className="featured">
            <ProjectThumb slug={featured.slug} title={featured.title} variant="featured" />
            <div className="f-body">
              <div className="f-top">
                <span className="f-status">
                  <span className="dot" />
                  <span>featured · {featured.status}</span>
                </span>
                <span>{featured.idx}</span>
              </div>
              <h3 className="f-title">
                <a href={projectHref(featured)} target="_blank" rel="noreferrer">
                  {featured.title}
                </a>
              </h3>
              <p className="f-desc">{featured.summaryKo}</p>
              <div className="f-tags">
                {featured.stack.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <div className="f-links">
                {featured.url && (
                  <a href={featured.url} target="_blank" rel="noreferrer">
                    live ↗
                  </a>
                )}
                {featured.github && (
                  <a href={featured.github} target="_blank" rel="noreferrer">
                    github ↗
                  </a>
                )}
              </div>
            </div>
          </article>
        </div>
      )}

      <div className="pgrid-wrap">
        <div className="pgrid">
          {activePool.map((p) => (
            <ActiveCard key={p.slug} p={p} />
          ))}
        </div>
      </div>

      <div className="pindex-wrap">
        <div className="pindex">
          <div className="pindex-h">
            <span className="idx">#</span>
            <span className="name" data-ko="이름" data-en="name">이름</span>
            <span className="desc" data-ko="설명" data-en="description">설명</span>
            <span className="stack" data-ko="스택" data-en="stack">스택</span>
            <span className="stat" data-ko="상태" data-en="status">상태</span>
          </div>
          {indexed.map((p) => (
            <IndexRow key={p.slug} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
