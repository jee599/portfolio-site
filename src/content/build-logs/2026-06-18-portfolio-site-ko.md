---
title: "디자인 레퍼런스 추출기를 고쳤다 — grep hex의 실패와 Playwright DOM 해법"
project: "portfolio-site"
date: 2026-06-18
lang: ko
tags: [claude-code, open-design, playwright, design-tokens, coffeechat]
description: "Claude Code가 레퍼런스 사이트에서 색만 가져오던 이유를 추적했다. 2 세션 171 tool call로 grep hex → Playwright getComputedStyle로 교체, Linear.app의 Inter 510 weight와 -1.584px 자간까지 잡아냈다."
---

`open-design` 스킬이 레퍼런스 사이트 디자인을 따올 때 색감만 오고 폰트·레이아웃·자간이 빠지는 버그가 있었다. "색만 온다"는 게 느낌이 아니라 추출 레시피가 문자 그대로 그것만 하고 있었다. 2 세션, 171 tool call, 11시간을 써서 원인을 추적하고 Playwright 기반 추출기로 교체했다.

**TL;DR** `grep hex`로 CSS 문자열을 파싱하던 방식을 버리고 Playwright `getComputedStyle`로 실제 렌더된 DOM에서 토큰을 뽑는다. 폰트 패밀리·사이즈·웨이트·자간·radius·shadow·컨테이너 폭·섹션 구조까지 추출된다.

## "색만 온다"의 실제 원인

기존 `SKILL.md`의 레퍼런스 추출 레시피는 한 줄이었다.

```bash
grep -E '#[0-9a-fA-F]{3,8}' site.css   # hex 색상만 추출
# 스크린샷에서 타이포 추정
```

여기서 다섯 가지가 동시에 실패한다. hex 문법에 없는 `rgb()`, `hsl()`, CSS 변수 `var(--color-*)` 전부 누락된다. 폰트 패밀리·사이즈·웨이트·`letter-spacing`은 grep으로 잡히지 않는다. 섹션 구조(히어로→benefits→changelog→CTA)는 CSS 파일에 없다. `@font-face`로 로드하는 커스텀 폰트는 파일명만 있고 실제 렌더 웨이트를 모른다. 스크린샷 OCR 추정은 실제 computed 값과 다르다.

원인이 명확했다. grep은 문자열 패턴 매처고, 디자인 토큰은 렌더된 DOM 상태다. 레이어가 다르다.

## Playwright `getComputedStyle`로 교체

`~/.claude/skills/open-design/scripts/extract-reference.mjs`를 새로 작성했다. Playwright로 실제 브라우저를 띄우고 `page.evaluate()`로 DOM에서 computed style을 뽑는다.

```js
const tokens = await page.evaluate(() => {
  const h1 = document.querySelector('h1')
  const cs = (el) => window.getComputedStyle(el)
  return {
    heading: {
      fontSize: cs(h1).fontSize,
      fontWeight: cs(h1).fontWeight,
      fontFamily: cs(h1).fontFamily,
      letterSpacing: cs(h1).letterSpacing,
    },
    colors: {
      background: cs(document.body).backgroundColor,
      text: cs(document.body).color,
    },
    container: {
      maxWidth: cs(document.querySelector('main')).maxWidth,
    },
    // radius, shadow, spacing...
  }
})
```

실제로 Linear.app을 돌려보니 이런 결과가 나왔다.

```
h1: 72px / weight 510 / Inter Variable / letter-spacing -1.584px
body: 15px / 400 / 같은 폰트 스택
로드 폰트: Inter Variable + Berkeley Mono (모노스페이스)
캔버스: rgb(8,9,10)
시그니처 그린: rgba(0,255,5,0.1)
섹션 구조: 히어로 → benefits → PageSection ×5 → changelog → CTA
```

`weight 510`과 `letter-spacing -1.584px` — 이게 "Linear 느낌"의 정체다. 400이 아닌 510 웨이트, 양수가 아닌 음수 자간. 이전 방식으론 두 값 모두 잡히지 않았다. 스크린샷에서 타이포를 눈으로 읽어 추정하면 "Inter, 크고 굵고 어두움" 수준에서 멈춘다.

## 훅으로 강제

추출기를 만드는 것만으로는 부족했다. Claude가 레퍼런스 없이 HTML을 먼저 쓰기 시작하면 소용없다. `reference-gate.sh`를 PreToolUse 훅으로 등록해서 `.html` Write 시도 전에 `reference-tokens.json`이 존재하는지 확인하도록 강제했다.

```bash
# ~/.claude/hooks/reference-gate.sh
if [[ -n "$REFERENCE_ARMED" ]] && [[ ! -f "$PROJECT_DIR/reference-tokens.json" ]]; then
  echo "BLOCK: extract-reference.mjs를 먼저 실행해라."
  exit 1
fi
```

`design-router.sh`는 사용자 프롬프트에서 "토스처럼", "Linear 참고" 같은 패턴을 감지하면 훅을 arm 상태로 전환한다. arm 상태에서 HTML을 쓰려 하면 게이트가 막는다.

`compare-tokens.mjs`는 빌드 후 단계에서 실행된다. 완성된 HTML을 headless 렌더링해서 추출된 레퍼런스 토큰과 비교, 0~100 충실도 점수를 낸다. 70 미만이면 경고를 출력한다. 이 검증기도 Session 4에서 한 번 더 리뷰해 구조 비교 로직을 보완했다 — 색만 보던 초기 버전에서 폰트·간격·radius 가중 평균으로 바뀌었다.

## 남은 한계

`brand-urls.tsv`에 등록된 브랜드(토스, Linear, Vercel, X 등)는 자동으로 URL을 찾아 추출한다. 등록되지 않은 브랜드는 URL을 직접 넘겨야 한다. "A처럼 해줘"로 입력했을 때 TSV 매칭이 실패하면 조용히 추출을 건너뛰는 케이스가 아직 있다. 이건 router가 TSV 미히트를 명시적 오류로 처리하도록 고쳐야 한다.

## 같은 기간 병행: coffeechat SaaS 리빌드

같은 기간에 `~/coffeechat`를 멘토-멘티 플랫폼에서 AI 면접 prep SaaS로 전면 리빌드했다. 이력서 빌더(5단계 위저드) + 포트폴리오 점검 + 모의 면접(AI 면접관 3명)을 한 세션에서 구현했다.

Session 5의 스펙이 넓어서 먼저 6개 차원(로직·토큰 효율·면접 AI·이력서 AI·UX·디자인) 병렬 감사 워크플로를 돌려 코드베이스를 진단하고, 검증된 발견 기준으로 구현에 들어갔다. Edit 182회, Bash 110회, Read 111회 — 437 tool call, 14시간짜리 세션이었다. Fable 5 기반 Session 6까지 합치면 796 tool call이 넘는다.

면접 모델은 Opus 4.8, 이력서는 Sonnet 4.6으로 분리했다. 크레딧 단가는 "API 비용 × 7배"로 정했다. 음수 잔액은 내가 흡수하고, 유저에게는 0으로 보여준다. 크레딧 게이트는 면접 세션 시작 시점에 키를 발급해서 같은 면접에 대한 보고서 재생성을 막는 캐싱 레이어를 달았다.

## 숫자로

| 항목 | 값 |
|---|---|
| Open Design 레퍼런스 작업 세션 | 2 |
| 총 tool call (Sessions 2 + 4) | 171 |
| 소요 시간 | 11h 14min |
| 새로 만든 스크립트 | `extract-reference.mjs`, `compare-tokens.mjs`, `shot.mjs` |
| 새로 만든 훅 | `reference-gate.sh`, `reference-required.sh` |
| coffeechat 리빌드 tool call (Sessions 5 + 6) | 796 |
| 수정/생성 파일 (coffeechat 합산) | 75개 이상 |
