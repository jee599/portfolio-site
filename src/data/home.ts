// Home page data — derived from src/content/projects/*.yaml and real git history.
// No fabricated metrics. Fields are omitted when the real number is unknown.

export type ProjectStatus = 'live' | 'dev' | 'beta' | 'shipped' | 'archived';

export interface HomeProject {
  slug: string;
  idx: string;
  title: string;
  titleEn?: string;
  tagline: string;
  taglineKo: string;
  status: ProjectStatus;
  year: number;
  stack: string[];
  thumb: 'grid' | 'noise' | 'field' | 'lines' | 'bars' | 'typographic' | 'concentric' | 'waves' | 'dots';
  accent: string;
  size: 'wide' | 'normal';
  stars?: number;
  url?: string;
  github?: string;
  summary: string;
  summaryKo: string;
  role: string;
  details: Array<{ k: string; v: string }>;
}

// Source of truth: src/content/projects/*.yaml — 운영중/개발중 projects only,
// ordered by `order` then by what's getting active commits.
export const PROJECTS: HomeProject[] = [
  {
    slug: 'portfolio-site',
    idx: '001',
    title: 'jidonglab.com',
    titleEn: 'jidonglab.com',
    tagline: 'Personal portfolio and build-log archive',
    taglineKo: '포트폴리오 + 빌드 로그 아카이브',
    status: 'live',
    year: 2026,
    stack: ['Astro', 'Tailwind', 'Cloudflare', 'Claude Code'],
    thumb: 'typographic',
    accent: 'primary',
    size: 'wide',
    url: 'https://jidonglab.com',
    github: 'https://github.com/jee599/portfolio-site',
    summary: 'Long-running archive of builds, essays, and small experiments. Bilingual by default.',
    summaryKo: '빌드·에세이·작은 실험을 모으는 장기 아카이브. 기본 2개 언어.',
    role: 'solo',
    details: [
      { k: 'Stack', v: 'Astro + MDX' },
      { k: 'Runtime', v: 'Cloudflare Pages' },
      { k: 'Content', v: 'build logs + essays' },
    ],
  },
  {
    slug: 'saju_global',
    idx: '002',
    title: '사주 분석 앱',
    titleEn: 'fortunelab',
    tagline: 'Manse-calendar engine + LLM interpretation',
    taglineKo: '만세력 엔진 + LLM 해석을 결합한 사주 분석 서비스',
    status: 'live',
    year: 2026,
    stack: ['Next.js', 'Supabase', 'OpenAI', 'Vercel'],
    thumb: 'field',
    accent: 'primary',
    size: 'normal',
    url: 'https://fortunelab.store',
    github: 'https://github.com/jee599/saju',
    summary: 'Bilingual saju reader. Treats classical pillars as structured input and leaves only interpretation to the model. Currently migrating billing from Toss to PayPal for global reach.',
    summaryKo: '만세력으로 기둥을 직접 계산하고, 해석만 LLM에 맡긴다. 글로벌 결제는 Toss에서 PayPal로 이관 중.',
    role: 'solo',
    details: [
      { k: 'Status', v: 'live' },
      { k: 'Billing', v: 'Toss → PayPal 전환 중' },
      { k: 'Langs', v: 'ko · en' },
    ],
  },
  {
    slug: 'contextzip',
    idx: '003',
    title: 'contextzip',
    tagline: 'Trim 60–90% off Claude Code context with six noise filters',
    taglineKo: 'Claude Code 컨텍스트를 60–90% 압축하는 6가지 노이즈 필터',
    status: 'live',
    year: 2026,
    stack: ['Rust', 'CLI'],
    thumb: 'noise',
    accent: 'primary',
    size: 'normal',
    github: 'https://github.com/jee599/contextzip',
    summary: 'Rust CLI proxy that filters tool output before it reaches the model. Hook-based — transparent to Claude Code, measured savings per command.',
    summaryKo: '도구 출력이 모델에 닿기 전에 걸러내는 Rust CLI 프록시. 훅 기반으로 투명하게 동작하고, 명령마다 절약된 토큰을 측정한다.',
    role: 'solo',
    details: [
      { k: 'Runtime', v: 'Rust, no deps' },
      { k: 'Install', v: 'brew / cargo' },
      { k: 'Integration', v: 'Claude Code hook' },
    ],
  },
  {
    slug: 'claudebook',
    idx: '004',
    title: 'Claude Book',
    tagline: 'Claude official docs, organized and summarized into a book',
    taglineKo: 'Claude 공식문서를 정리·요약해서 책으로 출판하는 프로젝트',
    status: 'dev',
    year: 2026,
    stack: ['Markdown', 'Claude', 'Astro'],
    thumb: 'typographic',
    accent: 'primary',
    size: 'normal',
    url: 'https://line-b.vercel.app/',
    github: 'https://github.com/jee599/claudebook',
    summary: 'Korean-language book covering Claude API, Claude Code, and the automation patterns built around them. Drafted chapter-by-chapter alongside active projects.',
    summaryKo: 'Claude API·Claude Code·그 위에 쌓은 자동화 패턴을 담은 한국어 책. 활성 프로젝트를 쓰면서 챕터 단위로 초안을 쌓는다.',
    role: 'solo',
    details: [
      { k: 'Status', v: 'in progress' },
      { k: 'Format', v: 'Astro + Markdown' },
    ],
  },
  {
    slug: 'coffee-chat',
    idx: '005',
    title: '커피챗',
    titleEn: 'coffeechat',
    tagline: 'AI-matched async 1:1 platform',
    taglineKo: 'AI 매칭 기반 커피챗 플랫폼',
    status: 'live',
    year: 2025,
    stack: ['Next.js', 'Supabase'],
    thumb: 'lines',
    accent: 'primary',
    size: 'normal',
    url: 'https://coffeechat.it.kr',
    github: 'https://github.com/jee599/coffee-chat',
    summary: 'Matches people for async coffee chats based on interests and goals. In maintenance mode.',
    summaryKo: '관심사와 목표를 기준으로 비동기 커피챗을 매칭한다. 유지보수 모드.',
    role: 'solo',
    details: [
      { k: 'Status', v: 'live · maintenance' },
      { k: 'Matching', v: 'LLM-assisted' },
    ],
  },
  {
    slug: 'news4ai',
    idx: '006',
    title: 'spoonai',
    titleEn: 'spoonai',
    tagline: 'A quiet archive of AI news, summarized and emailed',
    taglineKo: 'AI 뉴스를 모아 요약·발송하는 작은 서비스',
    status: 'live',
    year: 2026,
    stack: ['Next.js', 'Claude', 'Resend', 'Vercel'],
    thumb: 'bars',
    accent: 'primary',
    size: 'normal',
    url: 'https://spoonai.me',
    github: 'https://github.com/jee599/news4ai',
    summary: 'Collects, summarizes, and emails AI news. Individually delivered — no BCC.',
    summaryKo: 'AI 뉴스를 모아 요약하고 메일로 보낸다. BCC 없이 개별 발송.',
    role: 'solo',
    details: [
      { k: 'Format', v: 'web + email' },
      { k: 'Delivery', v: 'Resend, per-user' },
    ],
  },
  {
    slug: 'agentcrow',
    idx: '007',
    title: 'agentcrow',
    tagline: 'Claude Code auto-dispatcher over 144 specialist agents',
    taglineKo: 'Claude Code 144개 전문 에이전트 자동 디스패처',
    status: 'live',
    year: 2026,
    stack: ['TypeScript', 'Claude', 'MCP'],
    thumb: 'grid',
    accent: 'primary',
    size: 'normal',
    github: 'https://github.com/jee599/agentcrow',
    summary: 'Reads complex requests, picks up to five matching specialists from a local agent library, and dispatches them in parallel or sequentially as needed.',
    summaryKo: '요청을 읽고 로컬 에이전트 라이브러리에서 최대 5명의 전문가를 골라 병렬/순차로 디스패치한다.',
    role: 'solo',
    details: [
      { k: 'Install', v: 'npx agentcrow init' },
      { k: 'Agents', v: '144 specialists' },
      { k: 'License', v: 'MIT' },
    ],
  },
  {
    slug: 'uddental',
    idx: '008',
    title: 'UD Dental',
    tagline: 'Dental clinic site + ad-ops automation',
    taglineKo: '치과 병원 사이트 + 광고 운영 자동화',
    status: 'live',
    year: 2026,
    stack: ['Next.js', 'Tailwind', 'Vercel'],
    thumb: 'concentric',
    accent: 'primary',
    size: 'normal',
    url: 'https://claude-old.vercel.app',
    github: 'https://github.com/jee599/uddental',
    summary: 'Dental clinic website with end-to-end ad-ops automation — blog posts, image assets, and monthly reports all driven from a single clinic.md.',
    summaryKo: '치과 사이트와 광고 운영 자동화를 한 줄로 묶었다. 블로그·이미지·월간 리포트까지 clinic.md 하나로 굴러간다.',
    role: 'solo',
    details: [
      { k: 'Stack', v: 'Next.js + Tailwind' },
      { k: 'Ops', v: 'ad-ops automation' },
    ],
  },
  {
    slug: 'cleantech',
    idx: '009',
    title: 'cleantech',
    tagline: 'B2B air filter company site, ko/en',
    taglineKo: '에어필터 제조사 한·영 사이트',
    status: 'live',
    year: 2026,
    stack: ['Next.js 16', 'TypeScript', 'Tailwind'],
    thumb: 'waves',
    accent: 'primary',
    size: 'normal',
    url: 'https://cleantech-ten.vercel.app',
    github: 'https://github.com/jee599/cleantech',
    summary: 'Bilingual corporate site for a Korean air-filter manufacturer. Built as a template-light Next.js 16 reference.',
    summaryKo: '한국 에어필터 제조사의 한영 기업 사이트. 템플릿 없이 Next.js 16으로 만든 레퍼런스.',
    role: 'solo',
    details: [
      { k: 'Stack', v: 'Next.js 16' },
      { k: 'i18n', v: 'ko · en' },
    ],
  },
  {
    slug: 'clisync',
    idx: '010',
    title: 'clisync',
    tagline: 'Sync LLM CLI settings across machines',
    taglineKo: 'LLM CLI 설정을 머신 간에 동기화',
    status: 'live',
    year: 2026,
    stack: ['JavaScript', 'CLI'],
    thumb: 'dots',
    accent: 'primary',
    size: 'normal',
    github: 'https://github.com/jee599/clisync',
    summary: 'One command to save, one to load. Keeps Claude/Codex/etc. CLI configs aligned across laptops.',
    summaryKo: '한 명령으로 저장, 한 명령으로 복원. 여러 머신 간 CLI 설정을 맞춘다.',
    role: 'solo',
    details: [
      { k: 'Commands', v: 'save · load' },
    ],
  },
  {
    slug: 'claude-code-source-analysis',
    idx: '011',
    title: 'claude-code deep dive',
    tagline: 'Reverse-engineering notes on ~80K LOC of Claude Code',
    taglineKo: 'Claude Code CLI 소스 80K LOC 역분석 노트',
    status: 'dev',
    year: 2026,
    stack: ['TypeScript', 'HTML'],
    thumb: 'grid',
    accent: 'primary',
    size: 'normal',
    github: 'https://github.com/jee599/claude-code-source-analysis',
    summary: 'Architecture, tools, extensibility, context management, and UX runtime of the Claude Code CLI — written up as a Korean ebook.',
    summaryKo: 'Claude Code CLI의 아키텍처·도구·확장성·컨텍스트·런타임을 한국어 ebook으로 정리.',
    role: 'solo',
    details: [
      { k: 'Scope', v: '~80K LOC' },
      { k: 'Format', v: 'Korean ebook' },
    ],
  },
  {
    slug: 'refmade',
    idx: '012',
    title: 'refmade',
    tagline: 'A small place for reference-made pages',
    taglineKo: '레퍼런스로 만든 페이지 아카이브',
    status: 'live',
    year: 2026,
    stack: ['HTML'],
    thumb: 'lines',
    accent: 'primary',
    size: 'normal',
    url: 'https://refmade.com',
    github: 'https://github.com/jee599/refmade',
    summary: 'Archive site for landing-page references and small HTML experiments.',
    summaryKo: '랜딩 레퍼런스와 작은 HTML 실험을 모아두는 아카이브.',
    role: 'solo',
    details: [
      { k: 'Stack', v: 'static HTML' },
    ],
  },
  {
    slug: 'dev_blog',
    idx: '013',
    title: 'dev.to blog',
    tagline: 'Bilingual dev.to mirror of build logs',
    taglineKo: 'dev.to 한·영 미러',
    status: 'live',
    year: 2026,
    stack: ['Shell', 'dev.to API'],
    thumb: 'waves',
    accent: 'primary',
    size: 'normal',
    url: 'https://dev.to/ji_ai',
    github: 'https://github.com/jee599/dev_blog',
    summary: 'Bilingual build logs from jidonglab.com mirror over to dev.to. Canonical URLs point home.',
    summaryKo: 'jidonglab.com의 한/영 빌드 로그를 dev.to에 미러링. canonical은 홈 기준.',
    role: 'solo',
    details: [
      { k: 'Sync', v: 'dev.to API' },
      { k: 'Canonical', v: 'jidonglab.com' },
    ],
  },
];

// Map slug → screenshot path under /public/images/projects.
// Only slugs listed here render an <img>; the rest fall back to a CSS visual.
export const PROJECT_IMAGE: Record<string, string> = {
  'portfolio-site': '/images/projects/jidonglab.png',
  'saju_global': '/images/projects/fortunelab.png',
  'coffee-chat': '/images/projects/coffeechat.png',
  'news4ai': '/images/projects/spoonai.png',
  'uddental': '/images/projects/uddental.png',
  'cleantech': '/images/projects/cleantech.png',
  'refmade': '/images/projects/refmade.png',
  'dev_blog': '/images/projects/devto.png',
};

// 짧게. 지금 무엇이 돌아가고 있는지만.
export const NOW_ITEMS = [
  { tag: '이번 주', txt: 'fortunelab 결제 Toss → PayPal 이관' },
  { tag: '운영중', txt: 'spoonai · 매일 9AM/9PM 발송' },
  { tag: '운영중', txt: 'uddental · 치과 광고 자동화' },
  { tag: '집필중', txt: 'claudebook · claude-code deep dive' },
];

export interface ShipRow {
  h: string;
  date: string;
  msg: string;
  ko: string;
  proj: string;
  status: 'ok' | 'build' | 'test';
  diff: { a: number; d: number };
}

// Real commits from portfolio-site repo (git log -n 8, captured 2026-04-23 KST).
// `diff` counts omitted because we don't track them here; defaulted to 0/0.
export const SHIP_ROWS: ShipRow[] = [
  { h: '721bb60', date: 'just now', msg: 'chore: baseline before v2-pro design port', ko: 'v2-pro 디자인 포팅 전 베이스라인', proj: 'portfolio-site', status: 'ok', diff: { a: 0, d: 0 } },
  { h: '72d6282', date: '41m ago', msg: 'feat: build logs 2026-04-23 (1 posts, auto)', ko: '빌드 로그 자동 생성 (2026-04-23)', proj: 'portfolio-site', status: 'ok', diff: { a: 0, d: 0 } },
  { h: 'e1a571c', date: '7h ago', msg: 'feat: build logs 2026-04-23 (1 posts, auto)', ko: '빌드 로그 자동 생성 (2026-04-23)', proj: 'portfolio-site', status: 'ok', diff: { a: 0, d: 0 } },
  { h: '847fc34', date: '13h ago', msg: 'feat: build logs 2026-04-23 (1 posts, auto)', ko: '빌드 로그 자동 생성 (2026-04-23)', proj: 'portfolio-site', status: 'ok', diff: { a: 0, d: 0 } },
  { h: '0176c48', date: '19h ago', msg: 'feat: build logs 2026-04-23 (1 posts, auto)', ko: '빌드 로그 자동 생성 (2026-04-23)', proj: 'portfolio-site', status: 'ok', diff: { a: 0, d: 0 } },
  { h: '43bc6a0', date: '25h ago', msg: 'feat: build logs 2026-04-22 (1 posts, auto)', ko: '빌드 로그 자동 생성 (2026-04-22)', proj: 'portfolio-site', status: 'ok', diff: { a: 0, d: 0 } },
  { h: '2dd0793', date: '31h ago', msg: 'feat: build logs 2026-04-22 (1 posts, auto)', ko: '빌드 로그 자동 생성 (2026-04-22)', proj: 'portfolio-site', status: 'ok', diff: { a: 0, d: 0 } },
  { h: 'ba1c318', date: '2d ago', msg: 'feat: build logs 2026-04-22 (1 posts, auto)', ko: '빌드 로그 자동 생성 (2026-04-22)', proj: 'portfolio-site', status: 'ok', diff: { a: 0, d: 0 } },
];
