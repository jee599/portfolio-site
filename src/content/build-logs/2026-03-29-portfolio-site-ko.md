---
title: "번역 구멍 4개를 Grep으로 5분 만에 찾았다 — i18n 디버깅 패턴"
project: "portfolio-site"
date: 2026-03-29
lang: ko
tags: [claude-code, i18n, debugging, skill-management, gemini]
description: "spoonai에서 번역이 안 되는 버그: useLocale을 쓰지 않는 컴포넌트 4개를 Grep으로 5분 만에 발견했다. 같은 날 디자인 스킬 11개를 5개로 정리하고, CSS 도형으로 채워진 레퍼런스에 Gemini 8K 이미지를 적용했다."
---

spoonai.me에서 영어 전환을 해도 번역이 안 된다는 걸 발견했다. "번역이 안 된다"가 구체적으로 어느 컴포넌트인지 먼저 좁혀야 했다.

**TL;DR** `useLocale`을 호출하지 않는 컴포넌트를 Grep 한 번으로 추렸다. 총 4개가 누락돼 있었다. 같은 날 디자인 스킬 11개를 5개로 정리했고, refmade에서 CSS 도형을 Gemini Imagen API 8K 이미지로 교체했다.

## "번역이 안 된다" — 범위부터 좁혔다

i18n은 이미 구현돼 있었다. `lib/i18n.ts`에 50개 이상의 번역 키, 헤더에 토글 버튼, localStorage 저장까지. 코드는 있는데 화면이 안 바뀐다는 건 `useLocale`을 쓰지 않는 컴포넌트가 있다는 뜻이다.

확인 방법은 단순했다. `useLocale`을 Grep으로 찾고, 전체 컴포넌트 목록과 교차했다.

```bash
grep -r "useLocale" src/components/ --include="*.tsx" -l
```

결과: `Header.tsx`, `PostContent.tsx`, `SubscribeForm.tsx`, `BlogList.tsx` — 4개뿐이었다. 나머지는 전부 번역 함수를 호출하지 않고 한국어 텍스트를 하드코딩하고 있었다.

누락 목록이 나왔다.

`DailyBriefing.tsx`는 `아카이브`, `이전`, `다음`, `전체 보기`를 하드코딩했다. `ArchiveList.tsx`는 `Article`이 하드코딩. `ArticleCard.tsx`는 `useLocale` 자체가 없었다. 마지막이 가장 묘했다 — `PostContent.tsx`는 `useLocale`을 쓰고 있는데도 버그가 있었다.

원인: `formatDateKo` 함수가 locale과 무관하게 항상 한국어 날짜를 반환했다. 함수명에 이미 답이 있었는데 그냥 쓰고 있던 것이다. locale 인자를 받는 `formatDate(locale)` 패턴으로 전환하면서 해결됐다.

수정은 빠르게 됐다. 5개 컴포넌트에 `useLocale` 적용, `formatDateKo` 교체. 세션 총 25분, 55 tool calls. Read 23회, Bash 14회, Edit 5회.

이 세션에서 효과적인 패턴은 "어디에 구현됐는가"를 먼저 확인하고, "어디에 빠졌는가"를 Grep으로 추리는 것이었다. 에러 메시지가 없어도 버그는 있고, 그걸 찾는 건 결국 코드베이스 탐색이다.

## 스킬 11개가 충돌하지 않는 이유, 그리고 5개로 줄인 이유

coffeechat 프로젝트에서 디자인을 처음부터 다시 한다고 했다. 그전에 디자인 관련 스킬과 에이전트가 얼마나 있는지 확인했다. 스킬 11개, 에이전트 6개.

"이렇게 많이 깔려있으면 충돌 안 나?"는 합리적인 질문이었다.

충돌은 안 난다. 스킬은 `Skill` 도구로 명시적으로 호출해야 실행된다. 자동으로 끼어들지 않는다. 에이전트도 마찬가지다. 도구함에 렌치가 10개 있어도 꺼내야 쓰는 것과 같다.

그런데 중복은 있었다. `ui-ux-pro-max` 하나가 다른 스킬 6개를 이미 커버하고 있었다. 161개 팔레트는 `colorize`를, 57개 폰트 페어링은 `typeset`을, 레이아웃 가이드라인은 `arrange`를 포함한다. `audit`과 `critique`도 겹쳐서 더 포괄적인 것만 남겼다.

11개에서 남긴 것: `ui-ux-pro-max`, `frontend-design`, `critique`, `animate`, `overdrive`. 선택지가 많으면 시작이 느려진다. 마지막으로 직접 호출한 게 언제인지 기준으로 자르면 된다.

스킬 큐레이션보다 흥미로운 게 있었다. coffeechat 레퍼런스 서치를 하면서 외부 GitHub 프로젝트들을 WebSearch로 조회했는데, `interface-design` 스킬(~4.2k⭐)이 "디자인 결정을 대화 간 기억"하는 기능을 포함한다는 걸 발견했다. 세션마다 디자인 시스템을 다시 설명하는 대신 스킬이 컨텍스트를 들고 있는 패턴이다. 세션 39 tool calls, Bash 22회, WebSearch 11회.

## CSS 도형에서 8K 이미지로

refmade는 Stripe, Vercel, Linear, Notion 같은 SaaS 랜딩 페이지를 HTML로 재현하는 프로젝트다. 83개 레퍼런스를 병렬 에이전트로 처리하는 루프를 돌리고 있었는데, 이미지가 필요한 레퍼런스들에서 CSS 도형으로 대체하고 있었다.

원본 Revolut 페이지에는 auburn hair 여성 모델 사진이 있다. 구현체에는 파란 직사각형이 있었다. "말도 안 되는 퀄리티"라는 피드백이 정확했다.

Gemini Imagen API 키를 받고, 각 레퍼런스에 맞는 프롬프트를 Claude가 직접 작성해서 이미지를 생성했다. 프롬프트 전략은 레퍼런스별로 달랐다.

```
056-app-store:
"professional woman, auburn hair, cream blazer, holding smartphone,
fintech app, white background, 8K hyperrealism"

064-neon-cinema:
"live concert stage, pyrotechnics explosion, crowd audience,
dramatic stage lighting, dark atmosphere, 8K hyperrealism"

073-poppr:
"person in VR/AR exhibition space, amber warm lighting,
immersive environment, modern gallery, 8K hyperrealism"
```

CSS 도형이 있던 자리에 실제 이미지가 들어가자 레퍼런스와의 유사도가 눈에 띄게 달라졌다. 5개 레퍼런스에 병렬 적용. 에이전트가 프롬프트 작성 → API 호출 → HTML 적용을 한 번에 처리했다.

API 키를 프롬프트에 그대로 붙여넣었는데, 코드에 하드코딩하지 않고 처리한 점이 인상적이었다. 시크릿에 대한 기본 판단이 있다.

## 이번 세션 통계

세션 4개(spoonai, coffeechat, refmade, agentcrow 벤치마크), 총 tool calls 625+. 도구별로는 Read 187회, Bash 124회, Agent 59회 순이었다. 수정 파일은 `HomeContent.tsx`, `PostContent.tsx`, `GalleryClient.tsx`, `next.config.ts`, `middleware.ts`.

spoonai 세션에서 비밀번호 변경 요청이 중간에 들어왔는데 번역 버그를 먼저 처리했다. "그걸로 바꿔줘"보다 "영어로 했을 때 번역이 안 된다"가 더 긴급한 맥락이었기 때문이다. Claude가 맥락 우선순위를 잘 판단하는 편이지만, 순서가 중요할 때는 명시적으로 말하는 게 낫다.
