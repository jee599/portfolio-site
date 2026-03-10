---
title: "toss.tech 스타일 리디자인 + 조회수/리액션 시스템 구축"
project: "portfolio-site"
date: 2026-03-07
lang: ko
pair: "2026-03-07-portfolio-site-en"
tags: [astro, design-system, toss-tech, upstash-redis, engagement]
---

포트폴리오 사이트를 toss.tech 스타일로 전면 리디자인하고, 조회수·리액션·댓글 시스템을 올렸다. 커밋 15개, 디자인 토큰부터 레이아웃까지 전부 갈아엎었다.

## 왜 리디자인했나

기존 사이트는 기본 Astro 템플릿에 Tailwind만 얹은 수준이었다. 글이 늘어날수록 "어디서 뭘 봐야 하는지" 알 수 없는 구조가 됐다. toss.tech의 **클린한 카드 레이아웃 + 명확한 섹션 구분**을 참고해서 전면 재구성했다.

## 디자인 토큰 정리

가장 먼저 한 건 **디자인 토큰**을 CSS 변수로 정리하는 것이다.

```css
:root {
  --color-heading: #191f28;
  --color-body: #333d4b;
  --color-muted: #8b95a1;
  --color-accent: #00c471;
  --color-bg: #f9fafb;
  --font-display: 'IBM Plex Sans KR', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

이렇게 한 곳에 모아두면 "액센트 색 바꿔줘" 같은 요청을 변수 하나만 수정해서 처리할 수 있다. Claude에게 "디자인 토큰을 CSS 변수로 분리해줘"라고 시키면 Tailwind의 `@layer`와 충돌이 생기는데, `is:inline` 스타일로 우회했다.

> 디자인 토큰은 컴포넌트보다 먼저 정의한다. 토큰 없이 컴포넌트를 만들면 하드코딩된 색상값이 곳곳에 박힌다.

## 히어로 + 섹션 레이아웃

메인 페이지를 3개 섹션으로 나눴다:

1. **히어로**: 이름, 한 줄 소개, GitHub/Dev.to 링크
2. **아티클**: 최신 빌드로그/팁/블로그 카드
3. **프로젝트**: 프로젝트 카드 + 상태 뱃지

기존에는 프로젝트가 상단이었는데, **글을 먼저 보여주는 게 체류 시간에 유리하다**고 판단해서 아티클을 위로 올렸다. Featured 카드도 아티클 섹션 아래로 이동했다.

### 카테고리 필터 버튼

`/posts` 페이지에 카테고리 필터를 추가했다. Build Log, AI Tip, Blog를 pill 버튼으로 필터링한다.

```typescript
const categories = [
  { key: 'all', label: '전체', color: '#191f28' },
  { key: 'build-log', label: 'Build Log', color: '#00a85e' },
  { key: 'tip', label: 'AI Tip', color: '#d97706' },
  { key: 'blog', label: 'Blog', color: '#3b82f6' },
];
```

각 버튼에 `data-category` 속성을 달고, 클라이언트에서 `display: none`으로 필터링한다. SSG 사이트에서 가장 간단한 방식이다.

## 조회수 + 리액션 시스템

Upstash Redis를 붙여서 **서버리스 카운터**를 만들었다.

### 구현 구조

- `post:views:{slug}` — 페이지 조회수 (페이지 로드 시 increment)
- `post:likes:{slug}` — 좋아요 수
- `post:comments:{slug}` — 댓글 리스트 (Redis List)
- `visitors:{YYYY-MM-DD}` — 일별 방문자 수

```typescript
// 조회수 증가
await redis.incr(`post:views:${slug}`);

// 좋아요 토글
const key = `post:likes:${slug}`;
const current = await redis.get<number>(key) || 0;
await redis.set(key, current + delta);
```

클라이언트에서 `localStorage`로 중복 방지한다. 같은 브라우저에서 같은 글에 두 번 좋아요를 누르면 취소된다.

### Cloudflare Workers 호환성

처음에 `@anthropic-ai/sdk`를 직접 import했다가 Cloudflare Workers에서 `node:` 모듈 에러가 발생했다. `fetch` API로 직접 호출하는 방식으로 교체했다.

```typescript
// ❌ Cloudflare Workers에서 작동 안 함
import Anthropic from '@anthropic-ai/sdk';

// ✅ fetch로 직접 호출
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({ model, messages, max_tokens }),
});
```

> 서버리스 환경에서는 SDK보다 `fetch` 직접 호출이 호환성이 높다. Node.js 전용 의존성을 피할 수 있다.

## 다국어 지원 — 클라이언트 사이드 i18n

Astro의 SSG 특성상 서버에서 locale별 페이지를 생성하면 빌드 시간이 2배가 된다. 대신 **`data-ko`, `data-en` 속성**으로 클라이언트에서 텍스트를 스왑하는 방식을 택했다.

```html
<p data-ko="빌드 로그, AI 팁, 블로그 글을 모아 놓은 곳이다."
   data-en="Build logs, AI tips, and blog posts all in one place.">
  빌드 로그, AI 팁, 블로그 글을 모아 놓은 곳이다.
</p>
```

`localStorage`의 `lang` 키를 읽어서 `data-ko` 또는 `data-en` 값으로 교체한다. 빌드로그는 `lang` 필드로 한국어/영어 버전을 분리하고, `pair` 필드로 번역쌍을 연결한다.

## prose 타이포그래피

블로그 글의 가독성을 올리기 위해 toss.tech 스타일 prose CSS를 추가했다.

- 본문 `line-height: 1.8`, `letter-spacing: -0.01em`
- `h2` 상단에 `3rem` 마진으로 섹션 구분
- 인라인 코드에 초록빛 배경(`#e6f9f0`) + 테두리
- 인용문에 초록 왼쪽 보더

```css
.prose code:not(pre code) {
  background: #e6f9f0;
  border: 1px solid #c6efdb;
  color: #00875a;
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.88em;
}
```

## 정리

- **디자인 토큰을 먼저 정의한다.** 컴포넌트에 색상을 하드코딩하면 나중에 전부 찾아서 바꿔야 한다.
- **콘텐츠 중심 레이아웃으로 전환했다.** 프로젝트보다 글을 먼저 보여준다.
- **Upstash Redis로 서버리스 카운터를 구현했다.** SDK 대신 `fetch`로 Cloudflare Workers 호환성을 확보했다.
- **클라이언트 사이드 i18n**으로 빌드 시간 증가 없이 다국어를 지원한다.
