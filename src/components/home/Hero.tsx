export default function Hero() {
  return (
    <section id="top" className="masthead">
      <div className="masthead-inner">
        <div>
          <p className="masthead-eyebrow">
            <span className="dot" />
            <span data-ko="independent AI product builder" data-en="independent AI product builder">
              independent AI product builder
            </span>
          </p>
          <h1 className="masthead-title">
            <span data-ko="AI 프로덕트를 만들고, 고치고, " data-en="I build, fix, and ">
              AI 프로덕트를 만들고, 고치고,{' '}
            </span>
            <em data-ko="매일 운영한다" data-en="run AI products daily">
              매일 운영한다
            </em>
            <span>.</span>
          </h1>
          <p className="masthead-lede">
            <span
              data-ko="LLM 서비스·운영 자동화·작은 웹 제품을 혼자 짓는다. 어제 짠 코드가 오늘도 돌고, 그 기록을 이 사이트에 쌓아둔다."
              data-en="LLM products, ops automation, and small web apps — all solo. Yesterday's code is still running today, and the trail of it lives here."
            >
              LLM 서비스·운영 자동화·작은 웹 제품을 혼자 짓는다. 어제 짠 코드가 오늘도 돌고, 그 기록을 이 사이트에 쌓아둔다.
            </span>
          </p>
          <div className="masthead-actions">
            <a href="#projects" className="btn primary" data-ko="프로젝트 보기 →" data-en="See projects →">
              프로젝트 보기 →
            </a>
            <a href="#do" className="btn" data-ko="하는 일" data-en="What I do">
              하는 일
            </a>
            <a href="mailto:jidongs45@gmail.com" className="btn" data-ko="일 의뢰" data-en="Hire me">
              일 의뢰
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

        <aside className="masthead-meta">
          <div className="row">
            <span className="k">name</span>
            <span className="v">jidonglab · 지동랩</span>
          </div>
          <div className="row">
            <span className="k">role</span>
            <span className="v ac" data-ko="solo AI builder" data-en="solo AI builder">
              solo AI builder
            </span>
          </div>
          <div className="row">
            <span className="k">based</span>
            <span className="v" data-ko="서울 · 원격 가능" data-en="Seoul · remote-ready">
              서울 · 원격 가능
            </span>
          </div>
          <div className="row">
            <span className="k">stack</span>
            <span className="v">TypeScript · Next.js · Astro</span>
          </div>
          <div className="row">
            <span className="k">focus</span>
            <span className="v">LLM · automation · web</span>
          </div>
          <div className="row">
            <span className="k">contact</span>
            <span className="v">
              <a href="mailto:jidongs45@gmail.com">jidongs45@gmail.com</a>
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
