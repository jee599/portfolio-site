interface Skill {
  name: string;
  kind: string;
  desc: string;
  triggers: string[];
}

const SKILLS: Skill[] = [
  {
    name: 'auto-publish',
    kind: 'skill',
    desc: '소재 URL 하나 주면 spoonai.me · DEV.to · Hashnode 3개 플랫폼에 SEO·후킹·이미지 전략까지 포함해 자동 발행한다.',
    triggers: ['글 써줘', '/auto-publish'],
  },
  {
    name: 'spoonai-daily-briefing',
    kind: 'cron skill',
    desc: '매일 아침 08:00 KST에 AI 뉴스 수집·분석·포스트 생성·이메일 발송까지 자동 실행한다.',
    triggers: ['cron: 0 8 * * *'],
  },
  {
    name: 'dental-ad-ops',
    kind: 'pipeline',
    desc: '치과 광고 온보딩·카드 이미지·블로그·사이트 구축 파이프라인. Playwright + Gemini로 시각 에셋 자동화.',
    triggers: ['치과 광고', '온보딩'],
  },
  {
    name: 'naver-dental-blog',
    kind: 'skill',
    desc: '네이버 블로그 상위 노출 알고리즘 대응과 의료법 준수 자동 포스팅. 이미지 파이프라인 스킬과 연동된다.',
    triggers: ['네이버 블로그', '치과 포스팅'],
  },
  {
    name: 'claude-design-lite',
    kind: 'skill',
    desc: 'Claude Design(claude.ai/design)의 질문 기법·컨텍스트 수집·AI-slop 가드를 역공학해서 로컬 Claude Code로 이식했다.',
    triggers: ['디자인해줘', '프로토타입'],
  },
  {
    name: 'research',
    kind: 'meta',
    desc: '주제 하나 주면 4개 서브 에이전트가 병렬로 딥 리서치. 각 1,500단어 + 교차 검증.',
    triggers: ['리서치', '/research'],
  },
];

export default function Lab() {
  return (
    <section id="lab" className="sec">
      <div className="sec-head">
        <div className="sec-kicker">
          <span className="ln" />
          <span className="n">03</span>
          <span>Lab · 자체 제작 스킬</span>
        </div>
        <h2 className="sec-h">
          1인 운영을 <span className="mark">가능하게 하는</span> 도구.
        </h2>
        <p className="sec-desc">
          Claude Code에 직접 만들어 설치한 스킬. 반복 작업을 자동화하는 사설 툴체인이다.
        </p>
      </div>

      <div className="lab-grid">
        {SKILLS.map((s) => (
          <div className="lab-card" key={s.name}>
            <div className="l-top">
              <div className="l-name">{s.name}</div>
              <div className="l-kind">{s.kind}</div>
            </div>
            <div className="l-desc">{s.desc}</div>
            <div className="l-trigger">
              트리거 ·{' '}
              {s.triggers.map((t, i) => (
                <span key={t}>
                  <code>{t}</code>
                  {i < s.triggers.length - 1 ? ' · ' : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
