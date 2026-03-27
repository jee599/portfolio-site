---
title: "번역 버튼이 반대였다: Claude Code로 i18n 버그 찾아서 고친 과정"
project: "portfolio-site"
date: 2026-03-28
lang: ko
tags: [claude-code, i18n, astro, agentcrow, 병렬에이전트]
description: "영어 기본으로 바꿔달라는 요청 한 줄에 Claude Code가 6개 파일, 47군데 번역 누락을 찾아냈다. 24분, 47 tool calls, 수동으로 했으면 반나절이었을 작업이다."
---

영어가 기본 언어인데 번역 버튼에 `EN`이라고 써 있었다. 클릭하면 한국어로 바뀌는 게 아니라 영어로 바뀌는, 완전히 반대로 작동하는 버튼이었다. 그것도 운영 중인 사이트에.

**TL;DR** `var lang = 'ko'` 한 줄이 하드코딩된 채로 배포됐고, Claude Code가 Base.astro부터 PostLayout까지 6개 파일을 전부 찾아서 47군데를 수정했다.

## 어떻게 발견했나

프롬프트는 단순했다.

> "저기서 지금 번역버튼이 잘 안되는데, 일단 영어 사이트가 기본이여서 영어 번역이 모든 부분에 대해서 되어 있어야해."

Claude Code가 먼저 현재 번역 시스템 구조를 파악했다. `Base.astro`를 읽으니 바로 문제가 보였다.

```javascript
// Base.astro - 초기 상태
var lang = localStorage.getItem('lang') || 'ko';  // 기본값이 ko
```

`<html lang="ko">`도 하드코딩, 버튼 초기 텍스트도 `EN`이었다. 영어가 기본이려면 버튼에는 `KO`가 보여야 하는데 반대였다.

## Claude Code가 한 것

Read(13) → 현재 상태 파악
Grep → `data-ko`, `data-en` 속성 전체 탐색
Bash(12) → 각 파일별 번역 누락 확인
Edit(12) → 수정
Agent(8) → 번역 품질 검증

총 47 tool calls, 24분. 수동으로 했으면 파일 하나씩 열어가면서 반나절은 걸렸을 작업이다.

변경된 핵심 내용은 세 가지였다.

첫째, 기본 언어를 영어로 바꿨다.

```diff
- <html lang="ko">
+ <html lang="en">

- var lang = localStorage.getItem('lang') || 'ko';
+ var lang = localStorage.getItem('lang') || 'en';
```

둘째, 버튼 초기 텍스트를 반대로 뒤집었다. 영어 기본이면 버튼에는 `KO`가 보여야 한다.

셋째, `data-ko`/`data-en` 요소들의 기본 텍스트를 영어로 변경했다. HTML이 처음 렌더될 때 JS 실행 전까지 보이는 텍스트가 한국어였기 때문이다.

## Agent(8)이 한 역할

단순 수정만으로 끝내지 않았다. 수정 후에 Agent 8개를 써서 번역 품질을 검증했다.

> "모든 영어 번역잘 되는지, 번역 매끄러운지 오타 없는지 찾아봐"

검증 에이전트들이 찾아낸 것들: `PostLayout.astro`의 날짜 포맷 함수 `formatDateKo`가 항상 한국어로 날짜를 출력하고 있었고, `blog/[slug].astro`에도 하드코딩된 한국어 문자열이 남아 있었다.

수정 범위는 처음 예상보다 컸다.

- `src/layouts/Base.astro`
- `src/layouts/PostLayout.astro`
- `src/pages/blog/[slug].astro`

## 삽질이 있었다면

없었다. 이게 오히려 이상했다.

보통 i18n 작업은 수정하고 나서 "그거 말고 저기도 안돼요"가 계속 나오는 작업인데, 이번엔 한 번에 끝났다. 이유는 Claude Code가 수정 전에 충분히 탐색했기 때문이다.

`Glob(2)`으로 파일 구조 파악, `Read(13)`으로 컨텍스트 확보, `Grep`으로 `data-ko`/`data-en` 전체 위치 파악 — 수정보다 탐색에 시간을 더 썼다.

이게 수동 작업과 다른 부분이다. 사람은 "번역 버튼 기본값 바꿔야지"하고 `Base.astro` 한 파일만 고치고 끝냈을 것이다. PostLayout의 날짜 함수나 slug 페이지의 하드코딩은 나중에 QA에서 발견됐을 것이다.

## 그날의 다른 세션들

같은 날 세션은 8개였다. 대부분 다른 프로젝트였다.

spoonai i18n 작업(55 tool calls), saju_global Lemon Squeezy 결제 플랫폼 등록(16 tool calls), refmade 레퍼런스 사이트 30개 병렬 재구현(186 tool calls), agentcrow 고도화(598 tool calls, 6h 29min).

그중 refmade 세션이 가장 인상적이었다. 에이전트 30개를 동시에 띄워서 Stripe, Linear, Notion, Vercel, Arc, Raycast 같은 사이트들을 각각 원본 스크린샷 기준으로 재구현했다. 한 에이전트가 구현하면 다른 에이전트가 원본과 95% 이상 일치하는지 검증하는 구조였다.

```
Agent("Rebuild 074-stripe reference HTML") → completed
Agent("Rebuild 075-linear reference HTML") → completed
Agent("Rebuild 077-notion reference HTML") → completed
... 27개 더
```

이게 가능한 건 AgentCrow 덕분이다. 독립적인 작업을 병렬로 나눠서 에이전트에 위임하는 패턴.

## 실제로 효과가 있냐

있다. 단순 계산으로도: 세션 1에서 24분에 47 tool calls. 수동이면 반나절. 세션 6은 6시간 29분에 598 tool calls인데, 이건 혼자 했다면 며칠이었을 작업이다.

다만 한계도 있다. Claude Code는 수정 범위를 넓게 잡는다. 필요한 것 이상으로 파악하고, 필요한 것 이상으로 수정한다. 그게 장점이기도 하지만, 의도하지 않은 변경이 들어갈 수 있다는 뜻이기도 하다.

`console.log` 디버깅 코드를 커밋에 남기지 말라는 규칙을 CLAUDE.md에 박아두는 이유가 그것이다. 탐색 과정에서 남긴 디버그 코드가 그대로 커밋에 들어간 적이 있었다.
