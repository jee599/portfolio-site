// Home page data — ported from deploy bundle's data.js.
// Real build-logs come from the `build-logs` content collection; see Writing.astro.

export type ProjectStatus = 'live' | 'dev' | 'beta' | 'shipped';

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

export const PROJECTS: HomeProject[] = [
  {
    slug: 'agentcrow',
    idx: '001',
    title: 'agentcrow',
    titleEn: 'agentcrow',
    tagline: 'A little helper that lets Claude delegate to 144 tiny specialists',
    taglineKo: '프롬프트 하나를, 144명의 작은 도우미에게 나눠줘요',
    status: 'live',
    year: 2026,
    stack: ['TypeScript', 'Claude', 'MCP'],
    thumb: 'grid',
    accent: 'primary',
    size: 'wide',
    stars: 2,
    summary: 'A friendly dispatcher that quietly splits one prompt across a team of specialists, each focused on their own little corner. Just run npx once and it hooks itself into Claude Code.',
    summaryKo: '프롬프트 하나를 여러 작은 도우미들에게 나눠주는 조용한 친구예요. 각자 자기 역할만 보고 일해요.',
    role: 'solo',
    details: [
      { k: 'Shipped', v: 'Feb 2026' },
      { k: 'Install', v: 'npx agentcrow init' },
      { k: 'Agents', v: '144 specialized' },
      { k: 'License', v: 'MIT' },
    ],
  },
  {
    slug: 'contextzip',
    idx: '002',
    title: 'contextzip',
    tagline: '컨텍스트의 지방을 살짝 걷어내는 작은 도구 ☕',
    taglineKo: 'Claude 컨텍스트를 60~90% 가볍게 만들어줘요',
    status: 'live',
    year: 2026,
    stack: ['Rust', 'CLI'],
    thumb: 'noise',
    accent: 'primary',
    size: 'normal',
    stars: 4,
    summary: 'Modeled like a polite barista — it trims the foam off big context payloads before they reach the model. Six gentle filters, tuned across 14 languages.',
    summaryKo: '모델에 닿기 전에, 반복되는 부분들을 조용히 걷어내요. 14개 언어에서 다듬은 필터 여섯 개가 일해요.',
    role: 'solo',
    details: [
      { k: 'Shipped', v: 'Jan 2026' },
      { k: 'Median', v: '−74% tokens' },
      { k: 'Benchmark', v: '14 langs' },
      { k: 'Runtime', v: 'Rust, no deps' },
    ],
  },
  {
    slug: 'saju',
    idx: '003',
    title: 'saju',
    tagline: 'A little birth-chart reader with a modern face',
    taglineKo: '사주를 현대적인 올키로 읽어주는 작은 실험',
    status: 'beta',
    year: 2025,
    stack: ['TypeScript', 'GPT-4o'],
    thumb: 'field',
    accent: 'primary',
    size: 'normal',
    stars: 0,
    summary: "A bilingual birth-chart reader that treats classical saju pillars as structured input for LLMs. Built after reading a shelf of Korean astrology books; treats the tradition seriously.",
    summaryKo: '사주 기둥을 구조화된 입력으로 다루고, 해석만 LLM에 맡긴다. 한국·영어 이중 언어.',
    role: 'solo',
    details: [
      { k: 'Status', v: 'beta • invite-only' },
      { k: 'Input', v: '사주팔자 → JSON' },
      { k: 'Output', v: 'bilingual prose' },
      { k: 'Sources', v: '12 classical texts' },
    ],
  },
  {
    slug: 'coffeechat',
    idx: '004',
    title: 'coffeechat',
    tagline: 'Async 1:1s for people allergic to calendars',
    taglineKo: '캘린더 잡기 싫은 날 쓰용하는 비동기 1:1',
    status: 'shipped',
    year: 2025,
    stack: ['TypeScript', 'Supabase'],
    thumb: 'lines',
    accent: 'primary',
    size: 'normal',
    summary: 'Short-form audio voicenotes threaded into an ongoing conversation. No scheduling, no video, no AI summarization — just a slower, clearer back-and-forth.',
    summaryKo: '짧은 음성 메모를 주고받는 느린 대화. 스케줄도, 화상도, 요약도 없다.',
    role: 'solo',
    details: [
      { k: 'Shipped', v: 'Oct 2025' },
      { k: 'Status', v: 'in maintenance' },
      { k: 'Users', v: '1.2k monthly' },
    ],
  },
  {
    slug: 'news4ai',
    idx: '005',
    title: 'news4ai',
    tagline: 'News, but for your agents to read',
    taglineKo: '사람 대신 에이전트가 읽는 뉴스 피드',
    status: 'dev',
    year: 2026,
    stack: ['Python', 'Postgres', 'Cron'],
    thumb: 'bars',
    accent: 'primary',
    size: 'normal',
    summary: 'A structured feed of AI/tech news with entity tags, claim extraction, and deduplication across 400+ sources. Designed to be consumed by agents, not scrolled by humans.',
    summaryKo: '400개 이상의 소스에서 개체·주장·중복을 추출해, 에이전트가 읽을 수 있는 형태로 다시 낸다.',
    role: 'solo',
    details: [
      { k: 'Status', v: 'private alpha' },
      { k: 'Sources', v: '437 feeds' },
      { k: 'Update', v: 'every 12 min' },
    ],
  },
  {
    slug: 'portfolio-site',
    idx: '006',
    title: 'portfolio-site',
    tagline: 'This site. A slow notebook.',
    taglineKo: '이 사이트. 느릿하게 쓰는 노트',
    status: 'live',
    year: 2026,
    stack: ['Astro', 'MDX'],
    thumb: 'typographic',
    accent: 'primary',
    size: 'normal',
    summary: 'Built as a long-running log of builds, essays, and small experiments. Bilingual by default. Type-led, image-light.',
    summaryKo: '빌드·에세이·작은 실험을 모으는 장기 로그. 기본 2개 언어. 타입 중심, 이미지 최소화.',
    role: 'solo',
    details: [
      { k: 'Stack', v: 'Astro + MDX' },
      { k: 'Content', v: '84 posts' },
      { k: 'Feeds', v: 'RSS · JSON · atom' },
    ],
  },
  {
    slug: 'spoonai',
    idx: '007',
    title: 'spoon.ai',
    tagline: 'A recipe bot that also does the shopping',
    taglineKo: '장보기까지 대신 해주는 레시피 봇',
    status: 'shipped',
    year: 2024,
    stack: ['Next.js', 'LangChain'],
    thumb: 'concentric',
    accent: 'primary',
    size: 'normal',
    summary: 'Plan a week of meals in one prompt — spoon pulls recipes, generates the grocery list, and hands off to the user\'s preferred delivery service. Shipped, archived, fond memory.',
    summaryKo: '한 문장으로 한 주치 식단을 만들고, 장바구니까지 넘긴다. 출시하고, 멈추고, 좋은 기억.',
    role: 'co-founder',
    details: [
      { k: 'Shipped', v: 'Jun 2024' },
      { k: 'Archived', v: 'Mar 2025' },
      { k: 'Peak MAU', v: '18k' },
    ],
  },
  {
    slug: 'ji-ai',
    idx: '008',
    title: 'ji / notes',
    tagline: 'Sunday-night dev notes',
    taglineKo: '일요일 밤에 쓰는 작은 개발 메모',
    status: 'live',
    year: 2025,
    stack: ['MDX', 'dev.to'],
    thumb: 'waves',
    accent: 'primary',
    size: 'normal',
    summary: 'A weekly note published to dev.to. Small lessons from shipping solo: prompt patterns, eval harnesses, developer experience fixes.',
    summaryKo: 'dev.to에 매주 올리는 개발 기록. 혼자 빠르게 출시하면서 배운, 작은 교훈들.',
    role: 'solo',
    details: [
      { k: 'Cadence', v: 'weekly, Sun 10pm' },
      { k: 'Posts', v: '61 published' },
      { k: 'Reach', v: '84k reads' },
    ],
  },
  {
    slug: 'plumb',
    idx: '009',
    title: 'plumb',
    tagline: 'Eval harness that actually speaks Korean',
    taglineKo: '한국어를 제대로 이해하는 평가 도구',
    status: 'beta',
    year: 2026,
    stack: ['Python', 'DuckDB'],
    thumb: 'dots',
    accent: 'primary',
    size: 'normal',
    summary: "Eval harness with native support for Korean morphology, formality levels, and bilingual prompt sets. Opinionated about what counts as a 'correct' Korean answer.",
    summaryKo: '한국어 형태소·존대·이중 언어 프롬프트까지 1급으로 다루는 평가 하네스.',
    role: 'solo',
    details: [
      { k: 'Status', v: 'closed beta' },
      { k: 'Testsets', v: '22 task bundles' },
      { k: 'Langs', v: 'ko · en · ja' },
    ],
  },
];

export const EXPERIMENTS: HomeExperiment[] = [
  { num: 'L.01', title: 'token·map', titleSerif: true, desc: 'Live visualization of token boundaries in Korean vs English — same sentence, different weights.', tag: 'vis', status: 'live' },
  { num: 'L.02', title: '프롬프트 압축기', titleSerif: false, desc: 'Paste a long prompt, watch it fold along the six filters. Shows what\'s dropped and why.', tag: 'tool', status: 'live' },
  { num: 'L.03', title: 'saju·cli', titleSerif: true, desc: 'Type your birth moment, get a JSON pillar in your terminal. Interpretation is up to you.', tag: 'cli', status: 'beta' },
  { num: 'L.04', title: 'eval·diff', titleSerif: true, desc: 'Paired comparison of model outputs with morpheme-level highlighting for ko/en/ja.', tag: 'vis', status: 'dev' },
  { num: 'L.05', title: 'cron·whisper', titleSerif: true, desc: 'A cron that posts a single sentence to a private feed every time I ship a commit.', tag: 'note', status: 'live' },
  { num: 'L.06', title: '404·museum', titleSerif: true, desc: 'Every 404 on jidonglab gets archived as a page. Small, strange, growing.', tag: 'zine', status: 'live' },
];

export const NOW_ITEMS = [
  { tag: '지금', txt: 'agentcrow v0.3 버그 잡는 중' },
  { tag: '오늘', txt: '카페에서 코드 정리 중 ☕' },
  { tag: '이번 주', txt: '한국어 평가 도구 손보는 중' },
  { tag: '듣는 중', txt: 'Nils Frahm, 또 반복' },
  { tag: '읽는 중', txt: 'DDIA 7장, 세 번째' },
  { tag: '예정', txt: 'plumb 베타 다음 주 오픈' },
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

export const SHIP_ROWS: ShipRow[] = [
  { h: 'a9f2e71', date: '4m ago', msg: 'fix: router table drift on cold start', ko: '라우터 테이블 콜드스타트 버그', proj: 'agentcrow', status: 'ok', diff: { a: 42, d: 18 } },
  { h: '7c1b3d9', date: '2h ago', msg: 'feat: morpheme-aware diff for ko eval', ko: '한국어 형태소 diff', proj: 'plumb', status: 'build', diff: { a: 184, d: 0 } },
  { h: 'e04a2f1', date: '8h ago', msg: 'perf: cut p95 latency by 31%', ko: 'p95 레이턴시 31% 개선', proj: 'contextzip', status: 'ok', diff: { a: 28, d: 91 } },
  { h: '3b8c19a', date: '1d ago', msg: 'docs: add ko README + install flow', ko: '한국어 README 추가', proj: 'agentcrow', status: 'ok', diff: { a: 312, d: 14 } },
  { h: 'f92d44e', date: '2d ago', msg: 'test: add 22-task eval bundle', ko: '22개 테스트 번들 추가', proj: 'plumb', status: 'test', diff: { a: 460, d: 22 } },
  { h: '12ab77c', date: '3d ago', msg: 'refactor: unify pillar JSON schema', ko: '사주 스키마 통일', proj: 'saju', status: 'ok', diff: { a: 88, d: 114 } },
];
