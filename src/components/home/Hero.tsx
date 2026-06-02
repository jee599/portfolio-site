import { PROJECTS } from '../../data/home';

const liveCount = PROJECTS.filter((p) => p.status === 'live').length;

export default function Hero() {
  return (
    <section id="top" className="masthead">
      <div className="masthead-inner">
        <div>
          <p className="masthead-eyebrow">
            <span className="dot" />
            <span data-ko="새 프로젝트 받는 중" data-en="available for new projects">
              새 프로젝트 받는 중
            </span>
          </p>
          <h1 className="masthead-title">
            <span data-ko="데모가 아니라, " data-en="Not demos — ">
              데모가 아니라,{' '}
            </span>
            <em data-ko="매일 굴러가는 AI 제품" data-en="AI products that run every day">
              매일 굴러가는 AI 제품
            </em>
            <span data-ko="을 만든다." data-en=".">
              을 만든다.
            </span>
          </h1>
          <p className="masthead-lede">
            <span
              data-ko="사주 해석 앱, AI 뉴스 메일러, 치과 광고 자동화, CLI 도구까지 — 기획·개발·결제·배포·운영을 혼자 끝낸다. 범위와 마감만 분명하면, 맡아서 끝까지 간다."
              data-en="A saju reader, an AI news mailer, dental ad-ops, CLI tools — planning, code, billing, deploy, and ops, all finished solo. Give me a clear scope and deadline, and I take it the whole way."
            >
              사주 해석 앱, AI 뉴스 메일러, 치과 광고 자동화, CLI 도구까지 — 기획·개발·결제·배포·운영을 혼자 끝낸다. 범위와 마감만 분명하면, 맡아서 끝까지 간다.
            </span>
          </p>
          <div className="masthead-actions">
            <a href="#contact" className="btn primary" data-ko="프로젝트 의뢰 →" data-en="Start a project →">
              프로젝트 의뢰 →
            </a>
            <a href="#projects" className="btn" data-ko="작업 보기" data-en="See work">
              작업 보기
            </a>
            <a
              href="https://github.com/jee599"
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              github ↗
            </a>
          </div>
        </div>

        <aside className="masthead-board" aria-label="현황">
          <div className="board-head">
            <span className="board-k">STATUS</span>
            <span className="board-live">
              <span className="dot" />
              <span data-ko="운영 중" data-en="operating">운영 중</span>
            </span>
          </div>
          <dl className="board-rows">
            <div className="board-row">
              <dt data-ko="라이브" data-en="live">라이브</dt>
              <dd>
                <span className="acc">{liveCount}</span>
                <span data-ko="개 서비스·도구" data-en=" services & tools">개 서비스·도구</span>
              </dd>
            </div>
            <div className="board-row">
              <dt data-ko="배포" data-en="ships">배포</dt>
              <dd data-ko="매일 · git 기준" data-en="daily · from git">매일 · git 기준</dd>
            </div>
            <div className="board-row">
              <dt data-ko="위치" data-en="based">위치</dt>
              <dd data-ko="서울 · 원격 가능" data-en="Seoul · remote-ready">서울 · 원격 가능</dd>
            </div>
            <div className="board-row">
              <dt data-ko="응답" data-en="reply">응답</dt>
              <dd data-ko="평일 24시간 이내" data-en="within 24h, weekdays">평일 24시간 이내</dd>
            </div>
          </dl>
          <a className="board-foot" href="mailto:jidongs45@gmail.com?subject=프로젝트%20문의%20—%20jidonglab">
            <span>jidongs45@gmail.com</span>
            <span>→</span>
          </a>
        </aside>
      </div>
    </section>
  );
}
