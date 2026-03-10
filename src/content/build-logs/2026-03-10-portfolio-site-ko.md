---
title: "Vercel → Cloudflare 마이그레이션 + 관리자 대시보드 + AI 뉴스 자동화"
project: "portfolio-site"
date: 2026-03-10
lang: ko
pair: "2026-03-10-portfolio-site-en"
tags: [cloudflare, github-actions, admin-dashboard, ai-news, devto]
---

포트폴리오 사이트의 인프라를 Vercel에서 Cloudflare Pages로 옮기고, 관리자 대시보드와 AI 뉴스 자동 생성 파이프라인을 구축했다. 3일 동안 커밋 20개 이상.

## Vercel → Cloudflare 마이그레이션

Vercel의 cron은 Pro 플랜부터 사용 가능하다. AI 뉴스를 하루 2번 자동 생성해야 하는데, 무료 플랜에서는 cron을 쓸 수 없었다. Cloudflare Pages로 옮기고 cron은 **GitHub Actions**로 분리했다.

### 마이그레이션 체크리스트

1. `astro.config.mjs`에서 adapter를 `@astrojs/cloudflare`로 변경
2. `wrangler.toml` 추가
3. 환경 변수를 Cloudflare 대시보드에 등록
4. Preview 빌드 비활성화 (main 브랜치만 배포)
5. GitHub Actions로 cron job 3개 설정

```yaml
# .github/workflows/cron-ai-news.yml
on:
  schedule:
    - cron: '0 0,12 * * *'  # UTC 0시, 12시 = KST 9시, 21시
```

> Cloudflare Pages는 빌드가 빠르고 무료 티어가 넉넉하다. 단, `node:` 내장 모듈을 쓰는 SDK는 호환이 안 된다.

### deploy hook 교체

Vercel의 deploy hook URL을 Cloudflare의 deploy hook으로 교체했다. 관리자 대시보드에서 "Rebuild Site" 버튼을 누르면 이 hook이 호출된다.

## AI 뉴스 자동 생성

하루 2번 (KST 9AM, 9PM) AI 뉴스를 자동으로 생성한다.

### 소스 수집

5개 소스에서 AI 관련 뉴스를 크롤링한다:

1. **Google Custom Search** — "AI" 키워드 검색
2. **Hacker News** — `/topstories` API
3. **Reddit** — `/r/artificial`, `/r/MachineLearning`의 hot 포스트
4. **X (Twitter)** — AI 관련 트렌딩
5. **GitHub Trending** — 오늘의 트렌딩 레포

```typescript
const sources = await Promise.all([
  fetchGoogleNews(),
  fetchHackerNews(),
  fetchReddit(),
  fetchTwitter(),
  fetchGitHubTrending(),
]);
```

### Claude로 포스트 생성

수집한 뉴스를 Claude Haiku에게 넘기면, 주제별로 개별 딥다이브 포스트를 생성한다. 처음에는 모델별(Claude, GPT, Gemini) 목록형 포스트였는데, **주제별 개별 포스트**로 전환했다.

```
# 포스트 구조
## 무슨 일이 있었나
## 관련 소식
## 개념 정리 (또는 수치로 보기)
## 정리
```

모델은 Sonnet 4에서 **Haiku 4.5**로 변경했다. 하루 20개 이상 포스트를 생성하니 비용이 문제가 됐다. Haiku로 바꿔도 품질 차이가 거의 없었다.

## 관리자 대시보드

`/admin` 페이지를 만들어서 사이트 운영 현황을 한눈에 볼 수 있게 했다.

### 인증

환경 변수 `ADMIN_SECRET`으로 비밀번호 인증. `sessionStorage`에 저장해서 탭을 닫으면 로그아웃된다.

### 탭 구조

- **Overview**: 방문자 히트맵, 통계 카드, 프로젝트별 빌드로그, Top Engagement
- **Quick Actions**: AI 뉴스 생성, 사이트 리빌드, Dev.to 동기화
- **Content**: 전체 콘텐츠 목록 + 타입별 필터
- **Comments**: 댓글 관리 (삭제 기능)

```typescript
// Quick Action: AI 뉴스 생성
const res = await fetch('/api/admin-actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret, action: 'generate-ai-news' }),
});
```

### 방문자 히트맵

GitHub Contributions 스타일의 캘린더 히트맵을 구현했다. 90일 데이터를 Upstash Redis에서 가져와서 렌더링한다. 월 레이블, 요일 레이블, 호버 툴팁까지 포함.

## Dev.to 크로스포스트

GitHub Actions 워크플로우로 콘텐츠를 Dev.to에 자동 발행한다.

### 동작 방식

1. `src/content/` 하위 디렉토리 변경 감지
2. Dev.to API에서 기존 글 목록 조회 (canonical_url로 중복 체크)
3. 새 글만 `POST /api/articles`로 발행

```javascript
// 중복 방지
const existingUrls = new Set(existing.map(a => a.canonical_url));
if (existingUrls.has(canonicalUrl)) {
  skipped++;
  continue;
}
```

`devto-migration` 소스 태그가 붙은 글은 역방향 sync 대상이므로 발행하지 않는다. rate limit은 3초 간격으로 처리한다.

## 삽질: Cloudflare Workers에서 SDK 사용

Cloudflare Workers 환경에서 `@anthropic-ai/sdk`를 import하면 `node:events` 모듈 에러가 발생한다. Workers는 V8 isolate 기반이라 Node.js 내장 모듈을 지원하지 않는다.

해결: SDK 대신 `fetch`로 직접 API를 호출한다.

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  }),
});
```

## 정리

- **Cloudflare Pages + GitHub Actions cron**은 Vercel Pro 없이도 스케줄링을 구현할 수 있는 조합이다.
- **AI 뉴스 자동화**는 5개 소스 크롤링 → Claude Haiku 포스트 생성 → 하루 2회 실행으로 구성된다.
- **관리자 대시보드**는 SSR API + 클라이언트 렌더링으로 빠르게 만들 수 있다.
- **Cloudflare Workers에서는 SDK 대신 `fetch`를 쓴다.** Node.js 의존성이 있는 라이브러리는 호환되지 않는다.
