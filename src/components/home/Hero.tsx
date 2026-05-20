export default function Hero() {
  return (
    <section id="top" className="masthead">
      <div className="masthead-inner">
        <div>
          <h1 className="masthead-title">
            <span data-ko="혼자 만들고 " data-en="Built and run ">
              혼자 만들고{' '}
            </span>
            <em data-ko="혼자 굴린다" data-en="solo">
              혼자 굴린다
            </em>
            <span>.</span>
          </h1>
          <p className="masthead-lede">
            <span
              data-ko="작은 프로덕트 몇 개를 혼자 만들고 운영한다. 이 사이트는 그 기록이다."
              data-en="A few small products, built and run alone. This site is the record."
            >
              작은 프로덕트 몇 개를 혼자 만들고 운영한다. 이 사이트는 그 기록이다.
            </span>
          </p>
          <div className="masthead-actions">
            <a href="#projects" className="btn primary" data-ko="프로젝트 →" data-en="Projects →">
              프로젝트 →
            </a>
            <a href="#logs" className="btn" data-ko="빌드 로그" data-en="Build logs">
              빌드 로그
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
            <span className="v">jidonglab</span>
          </div>
          <div className="row">
            <span className="k">loc</span>
            <span className="v" data-ko="서울 · 원격" data-en="Seoul · remote">
              서울 · 원격
            </span>
          </div>
          <div className="row">
            <span className="k">stack</span>
            <span className="v">TypeScript · Astro · Claude</span>
          </div>
          <div className="row">
            <span className="k">contact</span>
            <span className="v">jidongs45@gmail.com</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
