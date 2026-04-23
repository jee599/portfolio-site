import { PROJECTS, type HomeProject } from '../../data/home';

type CardLang = 'ts' | 'py' | 'as' | 'rs' | 'js';

interface CardMeta {
  status: 'live' | 'oss' | 'beta';
  statusLabel: string;
  lang: CardLang;
  langLabel: string;
}

// Bridge data-driven projects into the v2-pro card shape.
function cardMeta(p: HomeProject): CardMeta {
  const stackStr = p.stack.join(' ').toLowerCase();
  let lang: CardLang = 'ts';
  if (stackStr.includes('python')) lang = 'py';
  else if (stackStr.includes('astro')) lang = 'as';
  else if (stackStr.includes('rust')) lang = 'rs';
  else if (stackStr.includes('next') || stackStr.includes('typescript')) lang = 'ts';

  const ossSlugs = new Set(['agentcrow', 'contextzip']);
  let status: CardMeta['status'];
  let statusLabel: string;
  if (ossSlugs.has(p.slug)) {
    status = 'oss';
    statusLabel = '오픈소스';
  } else if (p.status === 'live') {
    status = 'live';
    statusLabel = '운영 중';
  } else {
    status = 'beta';
    statusLabel = p.status === 'beta' ? '베타' : p.status === 'dev' ? '개발 중' : '아카이브';
  }

  return {
    status,
    statusLabel,
    lang,
    langLabel: p.stack.slice(0, 2).join(' · '),
  };
}

function ProjectCard({ p }: { p: HomeProject }) {
  const m = cardMeta(p);
  const href = `https://github.com/jee599/${p.slug}`;
  return (
    <a
      className="pcard"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${p.title} — ${p.taglineKo}`}
    >
      <div>
        <span className={`p-status ${m.status}`}>{m.statusLabel}</span>
        <div className="p-title">{p.title}</div>
        <p className="p-desc">{p.taglineKo}</p>
      </div>
      <div className="p-bot">
        <span className="p-lang">
          <span className={`lang-dot ${m.lang}`} />
          {m.langLabel}
        </span>
        <span className="lang-arr">→</span>
      </div>
    </a>
  );
}

export default function Projects() {
  // Featured: portfolio-site (this site itself, currently in rebuild).
  const featured = PROJECTS.find((p) => p.slug === 'portfolio-site');
  const rest = PROJECTS.filter((p) => p.slug !== 'portfolio-site').slice(0, 6);

  return (
    <section id="projects" className="sec">
      <div className="sec-head">
        <div className="sec-kicker">
          <span className="ln" />
          <span className="n">01</span>
          <span>Projects · 프로젝트</span>
        </div>
        <h2 className="sec-h">
          실제로 <span className="mark">돌아가는 것</span>만.
        </h2>
        <p className="sec-desc">
          아이디어 단계는 뺐다. 유저가 있거나 주기적으로 유지되는 것만 노출한다.
        </p>
      </div>

      {featured && (
        <div className="featured">
          <div>
            <div className="f-kicker">작업 중 · Astro 리디자인</div>
            <h3 className="f-title">
              <a href={`https://github.com/jee599/${featured.slug}`} target="_blank" rel="noreferrer">
                {featured.title}
              </a>
            </h3>
            <p className="f-desc">
              이 사이트 자체. Astro + React + Content Collections.
              빌드 로그·AI 뉴스·프로젝트를 같은 스키마로 관리한다.
              홈 섹션을 새 디자인 토큰으로 다시 짜는 중.
            </p>
            <div className="f-tags">
              <span className="acid">작업 중</span>
              {featured.stack.map((s) => (
                <span key={s}>{s}</span>
              ))}
              <span>Cloudflare</span>
            </div>
            <a href="#logs" className="f-cta">
              관련 빌드 로그 보기 <span>→</span>
            </a>
          </div>
          <pre className="f-visual">
{`# 어제 작업 기록
$ git log --oneline | head
  43bc6a0 feat: home redesign
  14 files touched

# 새로 쓴 컴포넌트
src/components/home/
  Hero.tsx       Lab.tsx
  Projects.tsx   TechBlock.tsx

src/components/home/
  About.astro    Footer.astro
  NowStrip.astro ShipLog.astro
  Topbar.astro   Writing.astro`}
          </pre>
        </div>
      )}

      <div className="pgrid">
        {rest.map((p) => (
          <ProjectCard key={p.slug} p={p} />
        ))}
      </div>

      <p className="sec-foot">
        <a
          href="/projects"
          data-ko={`전체 프로젝트 ${PROJECTS.length}개 보기 →`}
          data-en={`View all ${PROJECTS.length} projects →`}
        >
          전체 프로젝트 {PROJECTS.length}개 보기 →
        </a>
      </p>
    </section>
  );
}
