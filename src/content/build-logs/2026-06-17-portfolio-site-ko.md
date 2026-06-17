---
title: "open-design 레퍼런스 충실도 수리 — grep hex 버리고 Playwright getComputedStyle로"
project: "portfolio-site"
date: 2026-06-17
lang: ko
tags: [claude-code, open-design, playwright, design-system, hooks]
description: "open-design 스킬이 레퍼런스 사이트에서 색깔만 뽑던 근본 원인을 찾아 수리했다. grep hex 한 줄을 Playwright 실측으로 교체하니 72px/weight 510/letter-spacing −1.584px까지 잡혔다. 7h 47min, 86 tool calls."
---

open-design 스킬에 "레퍼런스 사이트 URL을 줬더니 대략적인 색감만 나온다"는 문제가 오래됐다. 막연한 느낌이 아니라 메커니즘이 명확한 실패였고, 어제 하루 7시간 47분을 써서 수리했다.

**TL;DR** — 추출 레시피가 `grep -E '#[0-9a-fA-F]{3,8}'` 한 줄이었다. hex 색만 잡고 폰트·구조·간격·shadow는 통째로 빠졌다. Playwright `getComputedStyle` 실측으로 교체하고 게이트 훅 2개를 달았다.

## 원인이 명확했다 — grep hex 한 줄

`~/.claude/skills/open-design/SKILL.md` RULE 2 분기 B의 추출 명령이 이렇게 돼 있었다:

```
실제 값 추출 — grep -E '#[0-9a-fA-F]{3,8}' 로 hex, 스크린샷에서 타이포
```

grep으로 hex를 긁으면 색은 나온다. 그런데 폰트 패밀리, 폰트 스케일, letter-spacing, line-height, radius, shadow, 컨테이너 폭, 섹션 구조는 hex에 없다. "스크린샷에서 타이포"는 Claude에게 이미지를 보고 폰트를 추측하라는 뜻인데, 이게 제대로 될 리 없다.

결과적으로 레퍼런스에서 색상 팔레트 몇 개만 받아서 나머지를 전부 모델 자체 판단으로 채웠다. "토스처럼"을 요청하면 토스 색은 깔리고 토스 폰트·간격·구조는 빠지는 게 이 때문이었다.

## 수리 방향 탐색 — 6갈래 서치

고치기 전에 최신 방법을 먼저 탐색했다. 동적 워크플로로 6개 방향을 병렬 서칭해서 유의미한 것만 추리면:

- **Playwright `getComputedStyle`** — 브라우저가 실제 렌더링한 값을 읽는다. 폰트·색·간격 전부 정확.
- **Dembrandt** (MIT, 2026-06 최신) — CSS 토큰 추출 라이브러리. 좋지만 Node 의존성 추가 비용.
- **Figma REST API** — 디자인 파일이 있어야 한다. 직구 불가.

Playwright는 이미 dental 파이프라인에 Node 1.59.1로 설치돼 있었다. 별도 의존성 없이 재사용할 수 있어서 그걸로 결정했다.

## 추출기 구현 — extract-reference.mjs

`~/.claude/skills/open-design/scripts/extract-reference.mjs`를 새로 만들었다. 핵심은 `getComputedStyle`로 실측하는 것이다. 색만 아니라 타이포그래피·간격·구조를 한 번에 긁는다.

```js
const h1 = document.querySelector('h1')
const cs = getComputedStyle(h1)
return {
  fontSize: cs.fontSize,
  fontWeight: cs.fontWeight,
  fontFamily: cs.fontFamily,
  letterSpacing: cs.letterSpacing,
}
```

Linear.app에 실행한 결과가 이랬다:

- h1: **72px / weight 510 / Inter Variable / letter-spacing −1.584px** — Linear 특유의 510 웨이트와 음수 자간이 정확히 잡혔다. 이게 "Linear 느낌"의 실체였다.
- 다크 캔버스 `rgb(8,9,10)`, 시그니처 그린 `rgba(0,255,5,0.1)`
- 섹션 구조: hero → benefits → PageSection ×5 → changelog → customer quotes → CTA

이전엔 섹션 구조가 통째로 비었는데, DOM에서 직접 읽으니 채워진다.

추출기 파일 3개가 생겼다:

- `extract-reference.mjs` — Playwright 실측 메인
- `compare-tokens.mjs` — 추출 토큰 vs 렌더된 CSS 충실도 비교 (≥70% 게이트)
- `shot.mjs` — 전체 페이지 스크린샷 캡처

## 훅 게이트 — 강제 적용

추출기만 만들면 쓸지 말지는 모델 판단에 달린다. 이걸 하드 게이트로 만들었다.

`reference-gate.sh` — `.html` 파일 Write를 시도할 때 `reference-tokens.json`이 없으면 차단한다. 추출을 건너뛰면 빌드 자체가 막힌다.

`reference-required.sh` — 레퍼런스 URL이 감지될 때 추출 실행을 강제 알림한다.

`design-router.sh`도 수정했다. "토스처럼", "Linear 느낌으로" 같은 브랜드 키워드가 나오면 `brand-urls.tsv`에서 해당 브랜드 URL을 찾아 `extract-reference.mjs`를 먼저 실행한다. 브랜드 URL 매핑은 tsv 파일로 분리했다:

```
toss	https://toss.tech
linear	https://linear.app
inflearn	https://inflearn.com
```

## 같은 날 세션 1 — 포켓몬 카드 EV 리포트

완전히 다른 맥락에서 open-design이 끼어들었다. 포켓몬 카드 직구 매물을 Buyee에서 탐색하다가 "HTML로 줘"라는 요청이 들어왔다. `mcp__claude-in-chrome`으로 Buyee를 직접 탐색해서 박스별 기대값(EV)을 뽑고, open-design 스킬을 타서 `~/pokemon-box-ev-report.html`로 산출했다. 2시간 22분, 104 tool calls, `mcp__claude-in-chrome__computer` 31회였다. 직구 리서치에 디자인 스킬이 붙은 케이스다.

## 세션 3 — 500 에러로 전멸

커피챗 사이트 개선 요청이 들어왔지만 Claude API 500 Internal Server Error가 떠서 아무것도 안 됐다. 2분, tool calls 0개. 서버 이슈라 별도 대응 없이 종료.

## 통계

| | 수치 |
|---|---|
| 총 세션 | 3 |
| 총 소요 시간 | ~10h 11min |
| 총 tool calls | 190 |
| 주요 도구 | Bash 44회, mcp__claude-in-chrome__computer 31회, Edit 18회, Read 16회 |
| 생성 파일 | 10개 |
| 수정 파일 | 5개 |

## 얻은 것

"토스처럼"을 요청하면 이제 토스 사이트를 실측해서 폰트·색·구조를 바인딩한다. 훅 게이트로 강제하기 때문에 건너뛸 수 없다. grep으로 색만 긁던 시절의 open-design은 반쪽짜리였다.
