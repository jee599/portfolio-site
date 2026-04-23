export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-inner">
        <div className="hero-tag">
          <span className="led" />
          <span data-ko="2026 2분기 프로젝트 수주 받는 중" data-en="Taking on Q2 2026 projects">
            2026 2분기 프로젝트 수주 받는 중
          </span>
        </div>

        <h1 className="hero-h">
          <span data-ko="혼자서 " data-en="Building ">혼자서 </span>
          <span className="mark" data-ko="AI 프로덕트" data-en="AI products">AI 프로덕트</span>
          <span data-ko="를 " data-en=" ">를 </span>
          <span className="italic" data-ko="공개적으로" data-en="in public">공개적으로</span>
          <span data-ko=" 만든다." data-en=", solo.">{' '}만든다.</span>
        </h1>

        <div className="hero-bottom">
          <p className="hero-sub">
            <span
              data-ko="회사가 아니라 "
              data-en="Not a company. "
            >회사가 아니라 </span>
            <strong data-ko="1인 연구실" data-en="a one-person lab">1인 연구실</strong>
            <span
              data-ko="이다. 아이디어부터 배포·운영까지 혼자. 매 결정에 근거가 있고, 매 실패에 기록이 있다."
              data-en=". Idea to deploy to ops — alone. Every decision has a reason, every failure a log."
            >이다. 아이디어부터 배포·운영까지 혼자. 매 결정에 근거가 있고, 매 실패에 기록이 있다.</span>
          </p>
          <div className="hero-ctas">
            <a href="#projects" className="cta acid" data-ko="프로젝트 보기 →" data-en="View projects →">
              프로젝트 보기 →
            </a>
            <a href="#logs" className="cta ghost" data-ko="빌드 로그" data-en="Build logs">
              빌드 로그
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
