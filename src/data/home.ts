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

export interface HomeExperiment {
  num: string;
  title: string;
  titleSerif: boolean;
  desc: string;
  tag: string;
  status: ProjectStatus;
}

// Source of truth: src/content/projects/*.yaml — 운영중/개발중 projects only,
// ordered by `order` then by what's getting active commits.
export const PROJECTS: HomeProject[] = [
  {
    slug: 'portfolio-site',
    idx: '001',
    title: 'jidonglab.com',
    titleEn: 'jidonglab.com',
    tagline: 'AI research portfolio + auto-blogging site',
    taglineKo: 'AI 연구 포트폴리오 + 자동 블로깅 사이트',
    status: 'live',
    year: 2026,
    stack: ['Astro', 'Tailwind', 'Cloudflare', 'Claude Code'],
    thumb: 'typographic',
    accent: 'primary',
    size: 'wide',
    url: 'https://jidonglab.com',
    github: 'https://github.com/jee599/portfolio-site',
    summary: 'Long-running log of builds, essays, and small experiments. Bilingual by default. Every commit auto-generates a build log via Claude Code.',
    summaryKo: '빌드·에세이·작은 실험을 모으는 장기 로그. 기본 2개 언어. 커밋마다 Claude Code가 자동으로 빌드 로그를 쓴다.',
    role: 'solo',
    details: [
      { k: 'Stack', v: 'Astro + MDX' },
      { k: 'Runtime', v: 'Cloudflare Pages' },
      { k: 'Auto', v: 'build-log + dev.to sync' },
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
    summaryKo: '사주 기둥을 구조화된 입력으로 다루고, 해석만 LLM에 맡긴다. 글로벌 전환을 위해 결제를 Toss에서 PayPal로 옮기는 중.',
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
    summary: 'Korean-language book covering Claude API, Claude Code, and skill/agent patterns. Drafted chapter-by-chapter alongside active projects.',
    summaryKo: 'Claude API·Claude Code·스킬·에이전트 패턴을 담은 한국어 책. 활성 프로젝트를 쓰면서 챕터 단위로 초안을 쌓는다.',
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
    tagline: 'AI news collected, analyzed, and auto-published daily',
    taglineKo: 'AI 뉴스를 매일 수집·분석·자동 발행하는 서비스',
    status: 'live',
    year: 2026,
    stack: ['Next.js', 'Claude', 'Resend', 'Vercel'],
    thumb: 'bars',
    accent: 'primary',
    size: 'normal',
    url: 'https://spoonai.me',
    github: 'https://github.com/jee599/news4ai',
    summary: 'Every morning at 08:00 KST a scheduled agent crawls, summarizes, publishes, and emails the day\'s AI news. Individually delivered — no BCC.',
    summaryKo: '매일 08:00 KST에 스케줄 에이전트가 크롤링·요약·발행·메일 발송까지 한다. BCC 없이 개별 발송.',
    role: 'solo',
    details: [
      { k: 'Schedule', v: '08:00 KST daily' },
      { k: 'Delivery', v: 'Resend, per-user' },
      { k: 'Agent', v: 'spoonai-daily-briefing' },
    ],
  },
  {
    slug: 'agentcrow',
    idx: '007',
    title: 'agentcrow',
    tagline: 'Claude Code auto-dispatcher over 144 specialist agents',
    taglineKo: 'Claude Code 에이전트 자동 디스패처. 144개 전문 에이전트 오케스트레이션',
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
    summary: 'Dental clinic website wired into the dental-ad-ops skill pipeline — blog, image generation, and monthly reports all driven from a single clinic.md.',
    summaryKo: '치과 사이트를 dental-ad-ops 스킬 파이프라인과 연결. 블로그·이미지·월간 리포트까지 clinic.md 하나로 굴러간다.',
    role: 'solo',
    details: [
      { k: 'Stack', v: 'Next.js + Tailwind' },
      { k: 'Pipeline', v: 'dental-ad-ops skill' },
    ],
  },
  {
    slug: 'cleantech',
    idx: '009',
    title: 'cleantech',
    tagline: 'B2B air filter company site, ko/en',
    taglineKo: '에어필터 B2B 회사 사이트 (한/영)',
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
    taglineKo: '레퍼런스 기반으로 만든 페이지들의 작은 보관소',
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
    tagline: 'Bilingual dev.to mirror, auto-synced',
    taglineKo: 'dev.to 이중 언어 미러. 자동 싱크',
    status: 'live',
    year: 2026,
    stack: ['Shell', 'dev.to API'],
    thumb: 'waves',
    accent: 'primary',
    size: 'normal',
    url: 'https://dev.to/ji_ai',
    github: 'https://github.com/jee599/dev_blog',
    summary: 'Every bilingual build log on jidonglab.com mirrors to dev.to via API. Canonical URLs point home.',
    summaryKo: 'jidonglab.com의 한/영 빌드 로그가 API로 dev.to에 자동 미러링. canonical은 홈 기준.',
    role: 'solo',
    details: [
      { k: 'Sync', v: 'daily via cron' },
      { k: 'Canonical', v: 'jidonglab.com' },
    ],
  },
];

// Smaller experiments / lab entries. Kept as-is in shape; content trimmed to truth.
export const EXPERIMENTS: HomeExperiment[] = [
  { num: 'L.01', title: 'auto-publish', titleSerif: false, desc: '하나의 스킬로 spoonai·DEV.to·Hashnode에 동시 발행. canonical은 jidonglab.com.', tag: 'skill', status: 'live' },
  { num: 'L.02', title: 'dental-ad-ops', titleSerif: false, desc: '치과 광고 대행 전체 파이프라인. 온보딩·블로그·이미지·월간 리포트 자동화.', tag: 'skill', status: 'live' },
  { num: 'L.03', title: 'spoonai-daily', titleSerif: false, desc: '매일 08:00 KST에 AI 뉴스 수집·분석·발행·메일 발송을 자동으로 돈다.', tag: 'cron', status: 'live' },
  { num: 'L.04', title: 'weekly-review', titleSerif: false, desc: '지난 7일 git 활동 + 세션 + 메모리 교차 리뷰. 주말 자동 집계.', tag: 'skill', status: 'live' },
  { num: 'L.05', title: 'harness-audit', titleSerif: false, desc: '~/.claude 상태 점검. 스킬·훅·에이전트·플러그인·메모리 건강도.', tag: 'skill', status: 'live' },
  { num: 'L.06', title: 'research', titleSerif: false, desc: '주제 던지면 4개 서브에이전트 병렬 디스패치. 각 1500단어, 교차검증.', tag: 'skill', status: 'live' },
];

// Real "what I'm working on now" — pulled from build logs, active projects, and
// the dental-ad-ops / spoonai pipelines that are actually running.
export const NOW_ITEMS = [
  { tag: '지금', txt: 'jidonglab 홈 v2 리디자인 — Astro 네이티브로 포팅 중' },
  { tag: '오늘', txt: '데이터 레이어 정리 — /api/now SSR + 홈 데이터 실사 교체' },
  { tag: '이번 주', txt: 'saju 결제 Toss → PayPal 전환' },
  { tag: '운영중', txt: 'spoonai 매일 08:00 KST 자동 발행' },
  { tag: '운영중', txt: 'dental-ad-ops — 치과 광고 파이프라인 가동' },
  { tag: '진행중', txt: 'Claude Code 소스 80K LOC 역분석 ebook' },
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
