---
title: "Cloudflare 404 + SEO + 빌드 로그 자동화"
project: "portfolio-site"
date: 2026-03-31
lang: ko
tags: [claude-code, cloudflare, seo, astro, automation, build-log]
description: "Cloudflare Pages 배포 직후 404 원인 분석부터 llms.txt/JSON-LD SEO, 그리고 세션 기록으로 빌드 로그 5개를 자동 생성하는 루프까지. 7개 세션 177 tool calls."
---

포트폴리오 사이트를 Cloudflare Pages에 배포하자마자 블로그 포스트가 전부 404였다. 거기서 시작해 UI 3개 수정, SEO/AEO/GEO 최적화, 빌드 로그 자동 생성까지 하루에 몰아쳤다. 7개 세션, 177 tool calls.

**TL;DR** `_routes.json` 설정 오류가 Cloudflare 404의 원인이었다. SEO는 `llms.txt`를 추가해서 AI 크롤러 대응까지 챙겼다. 세션 기록 요약을 넘기면 빌드 로그가 자동으로 생성된다.

## Cloudflare 배포하자마자 블로그 전체 404

배포 후 첫 확인. `/blog/tips/some-post`를 열면 404. 로컬 빌드는 정상인데 라이브에서만 깨진다.

처음에는 Astro `output: 'hybrid'` 설정 문제를 의심했다. 정적 페이지가 SSR 함수로 라우팅되는 충돌이 있을 수 있어서다. 빌드 아웃풋을 뒤졌다.

```bash
npx astro build
# dist/ 확인 → /blog/tips/[slug]/index.html 정상 생성
```

파일은 있었다. 그런데 Cloudflare가 요청을 엉뚱한 곳으로 보내고 있었다. 원인은 `_routes.json`이었다:

```json
// 기존 — 너무 좁음
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*", "/_astro/*", "/favicon.svg"]
}
```

`exclude` 배열이 너무 짧아서 정적 HTML 파일들이 SSR 함수 라우터를 통해 처리됐다. Cloudflare Pages에서 정적 파일과 함수 라우트가 섞이면 이 설정이 결정적이다. 이미지, 스크립트 패턴을 `exclude`에 추가해서 해결했다.

같은 세션에서 `src/pages/api/generate-ai-news.ts`의 `process.env` → `import.meta.env` 전환도 처리했다. Cloudflare Pages Function은 Node.js 런타임이 아니라서 `process.env`가 undefined를 반환한다.

세션 38분, 22 tool calls. Read 8회, Bash 8회, Glob 4회, Edit 2회.

## BuildLogCard 스키마 불일치 — 이미지 전체 깨진 이유

배포 후 카드 이미지가 전부 안 보였다. 스크린샷을 보니 빈 박스만 가득했다.

처음에는 이미지 경로 문제라고 생각했다. `public/images/posts/` 디렉토리를 확인하고, frontmatter 경로도 확인했다. 파일은 다 있었다.

```typescript
// src/content/config.ts — build-logs 스키마
coverImage: z.string().optional()

// src/content/config.ts — tips 스키마
image: z.string().optional()
```

`build-logs`는 `coverImage`, `tips`는 `image`. 이 두 스키마가 달랐다. `BuildLogCard.astro`는 `coverImage` prop을 받도록 되어 있었는데, `BlogCard.astro`는 `image` prop을 쓰고 있었다. 빌드 오류는 없었다 — 타입이 `optional`이라 조용히 `undefined`로 넘어갔다.

해결: 두 컴포넌트에 fallback 추가. 이미지가 없으면 초록 그라디언트 배경을 보여준다.

```astro
<!-- BuildLogCard.astro -->
{coverImage ? (
  <img src={coverImage} alt={title} class="w-full h-48 object-cover" />
) : (
  <div class="w-full h-48 bg-gradient-to-br from-[#00c471] to-[#00a060]" />
)}
```

`BlogCard.astro`도 동일하게 처리했다. 이미지가 있는 포스트는 이미지, 없는 포스트는 브랜드 초록 그라디언트. 일관성도 생겼다.

같은 세션에서 카드 description 2줄 truncate도 처리했다. 전체 요약이 다 보이면 카드가 너무 길어진다.

```css
.description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

두 세션 합쳐 59 tool calls (24+45). 주로 Read와 Glob으로 스키마 파악에 시간을 썼다.

## SEO/AEO/GEO: llms.txt를 처음 추가해봤다

프롬프트 한 줄:

> "SEO/AEO/GEO 최적화 해줘. 다 챙겨서. JSON-LD, llms.txt, sitemap, robots.txt, OG tags"

Claude가 현재 상태를 먼저 체크했다. `robots.txt`는 기본 허용만 있었고, JSON-LD는 `WebSite` 스키마 하나뿐이었다. OG 태그도 기본 4개밖에 없었다.

**robots.txt** — AI 크롤러 명시 추가:

```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /
```

Googlebot은 기본 허용이라 굳이 명시 안 해도 되지만, AI 크롤러는 기본 차단되는 케이스가 있어서 명시했다.

**llms.txt** — GEO(Generative Engine Optimization)용 파일이다. AI가 사이트 컨텍스트를 더 잘 이해하게 만든다. `/public/llms.txt`에 사이트 구조, 주요 섹션, 작성자 정보를 텍스트로 넣었다.

**JSON-LD** — `Base.astro`에 `Article`, `Person` 스키마 추가. 포스트 페이지에서는 `Article` 타입이 자동으로 들어가고, 글쓴이 정보(`Person`)가 연결된다.

**OG 태그** — `og:site_name`, `og:article:author`, `og:article:published_time` 추가. Twitter Card용 `twitter:creator`도 넣었다.

세션 23분, 37 tool calls. Read 15회, Bash 11회, Edit 6회. 빌드 검증에 Bash를 많이 썼다.

## 빌드 로그 자동 생성 루프

세션 11-13은 메타 작업이었다. "자동으로 빌드 로그 생성해줘"라고 했더니 Claude가 git log와 기존 빌드 로그를 읽고 아직 커버 안 된 세션들을 파악해서 직접 파일을 썼다.

```
세션 11: "자동으로 빌드 로그 생성해줘. 모든 세션 기록 기반으로"
→ 1개 생성 (Cloudflare 404 + API env vars)

세션 12: "또 생성해줘. 쓸만한 내용으로"
→ 1개 생성 (mass auto-publish 스토리)

세션 13: "지금 build log 2개만 있는데 총 몇개 생성돼야해?"
→ 3개 더 생성 (카드 truncate, 이미지 fallback, SEO)
```

한 번에 전부 요청하지 않고 세 세션으로 나뉜 건 "어떤 각도로 쓸지"를 판단하는 게 대화 속에서 자연스럽게 이뤄졌기 때문이다. 세션 12에서 "쓸만한 내용으로"라고 했을 때 Claude가 이미 커버된 내용을 피하고 auto-publish 스토리를 골랐다. 세션 13에서 숫자 기준을 물어봤더니 "커버 안 된 세션 3개"를 파악해서 정확히 3개를 만들었다.

3개 세션 합쳐 57 tool calls (18+25+14). Write 도구가 처음으로 주역이 됐다.

## 세션별 통계

| 세션 | 내용 | 시간 | tool calls |
|------|------|------|-----------|
| 7 | Cloudflare 404 + env vars | 49min | 22 |
| 8 | 카드 description truncate | 4min | 14 |
| 9 | 이미지 fallback | 38min | 45 |
| 10 | SEO/AEO/GEO | 23min | 37 |
| 11 | 빌드 로그 1개 생성 | 11min | 18 |
| 12 | 빌드 로그 1개 생성 | 22min | 25 |
| 13 | 빌드 로그 3개 생성 | 9min | 14 |

전체: 2h 36min, 175 tool calls. 도구별: Read 68회, Bash 39회, Glob 22회, Edit 16회, Write 4회.

배포 직후 버그 수정에 Read와 Glob이 집중됐다 — 스키마 파악, 컴포넌트 구조 이해, 라우팅 설정 확인. 코드를 먼저 읽어야 정확하게 고친다는 게 수치로도 나온다.
