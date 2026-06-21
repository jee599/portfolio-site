---
title: "next-intl raw 키 버그 + 7세션 489 tool calls — Claude Code 멀티에이전트 집중 투입기"
project: "portfolio-site"
date: 2026-06-22
lang: ko
tags: [claude-code, next-intl, i18n, multi-agent, preterview, ultracode]
description: "7개 세션 489번 도구 호출. preterview 모바일 UI 전수 수정, next-intl scopeClientMessages 버그 추적, 12 에이전트로 사업계획서 자동 생성까지."
---

7개 세션, 489번의 도구 호출, 수정 파일 35개 + 생성 파일 26개. 이번 주 작업의 대부분은 preterview(AI 모의면접 SaaS) UI 디버깅과 사업 문서 자동화에 집중됐다.

**TL;DR** ultracode 모드로 preterview 모바일 UI를 182 tool calls로 전수 수정했고, i18n raw 키 노출 버그의 원인인 `scopeClientMessages`를 추적해 잡았다. 사업계획서는 12 에이전트 fan-out으로 34분, 127만 토큰 만에 7,747단어짜리 보고서로 완성됐다.

## 모바일에서 innerWidth가 2240px

`innerWidth가 2240px(창은 784px)` — 첫 화면 확인에서 바로 나온 수치다. 모바일 뷰포트 390px로 접속했는데 페이지가 가로로 심하게 넘쳐 축소 렌더되고 있었다.

사용자 보고: 버튼이 깨지고, 영어로 된 글씨가 나오고, 자간 때문에 비정상적으로 엔터가 쳐진다. `/effort ultracode`로 세션을 시작했다. 이 모드는 `xhigh` effort + dynamic workflow 오케스트레이션이 자동으로 켜진다.

182번의 도구 호출이 소진됐다 — Bash 46, Edit 40, Read 35, 브라우저 도구 26. 수정 파일 24개:

```
app/[locale]/layout.tsx       ← 뷰포트 메타
i18n/routing.ts               ← 기본 locale 처리
messages/ko/*.json × 6        ← 누락 키 보완
messages/en/*.json × 2
globals.css                   ← 오버플로 원인 제거
```

영어/한국어 혼용 문제는 `i18n/routing.ts`의 locale 감지 로직이 원인이었다. 브라우저 `Accept-Language: en`이면 홈이 `/en`으로 redirect되는데, 이후 한국어로 전환해도 일부 클라이언트 컴포넌트가 영어 메시지를 그대로 참조하고 있었다. `InterviewRoom.tsx`, `RadarChart.tsx`, `NaverBuy.tsx` 등 동적 컴포넌트들이 대상이었다.

## raw 키 버그 — 범인은 scopeClientMessages

배포 후 두 번째 세션에서 모의면접과 포트폴리오 점검 화면의 버튼이 `interview.room.endinterview`처럼 raw 키 그대로 노출되는 버그가 잡혔다.

타입체크는 통과, `en/ko` 메시지 파일에 키도 전부 존재했다. next-intl은 키를 못 찾으면 경로 전체를 그대로 출력한다 — 즉 파일 문제가 아니라 **클라이언트로 메시지가 전달되는 경로**에 문제가 있다는 신호였다.

`i18n/request.ts` → `scopeClientMessages(await getMessages(), strippedPath)`.

이 함수가 범인이었다. 라우트 경로(`x-cc-pathname` 헤더)를 기준으로 클라이언트에 보낼 i18n 네임스페이스를 골라 최적화하는 구조인데, 헤더가 빈 상태로 내려오면 `strippedPath`가 `/`로 떨어지면서 `interview`, `portfolio`, `resume` 네임스페이스가 모두 제외된다.

`proxy.ts`가 헤더를 set → next-intl 미들웨어 → RSC로 전파되어야 하는데, soft navigation(앱 내 라우팅) 시 이 전파 경로가 끊기는 케이스가 있었다. 재발 방지를 위해 Playwright e2e 스펙을 추가했다.

```ts
// e2e/i18n-softnav.spec.ts
test('soft navigation preserves i18n namespace', async ({ page }) => {
  await page.goto('/ko/interview');
  // raw 키 노출 여부 검증
});
```

`playwright.config.ts`와 함께 커밋했고, CI에서 soft navigation 이후 i18n 네임스페이스 유지 여부를 자동으로 잡는다.

## 12 에이전트, 34분, 사업계획서 2건

세션 7에서는 두 사업(치과 마케팅 자동화 + preterview)의 사업계획서 작성을 멀티에이전트 워크플로로 돌렸다.

워크플로 구조:

1. **Foundation** (병렬 6) — 제품 프로파일 2 + 정부/민간 지원사업 리서치 + 합격 사례 분석
2. **Plans** (병렬 2, high effort) — PSST용 + IR용 사업계획서
3. **Verify** — 팩트체크 + 완전성 비평
4. **Integrate** — 통합 마크다운 조립
5. **Render** — OD-equivalent HTML + PDF

34분, 127만 토큰. `~/funding/bizplan-2026-06-21/REPORT.md`가 7,747단어로 완성됐다. PSST + IR + 3개년 재무 + 단위경제 + 기술 아키텍처 + 프로그램 카탈로그 + 실행 캘린더 전부 포함.

렌더링은 기존에 만들어둔 `md2report/report.py`를 재사용했다. Linear/토스 DNA, Pretendard 폰트, 인쇄/PDF 친화 구조다. 이번 보고서에서 처음으로 마크다운 테이블 렌더링을 테스트했고 정상 작동했다.

이전 세션(6/19)에서 먼저 리서치한 57건 정부 프로그램 데이터(`~/funding/`)가 기반이 됐다. 이걸 다시 리서치하지 않고 기존 파일을 읽어 에이전트에 컨텍스트로 주입하는 방식을 썼다. 중복 리서치를 피하면 토큰이 절약되고 에이전트 수도 줄어든다.

## 네이버 광고 대행 수수료 구조

동백유디치과 플레이스 광고 파일럿을 시작하면서 광고 대행 수수료 구조가 궁금해졌다. 캠페인은 `동백유디_플레이스_파일럿` 단일, 예산 5,000원/일, 노출·클릭 모두 0이었다.

"내 계정 명의로 집행하면 15%가 떨어진다"는 전제가 틀렸다. 15%는 계정 명의가 아니라 **네이버 공식대행사 자격**이 트리거다. 6개 축 리서치(사업자등록·재대행 진입·의료광고 합법성·세금계산서 구조·직접가입 혜택·1인 시세) + 적대적 검증 에이전트로 교차확인했다.

결론: 1인으로 단기 시작은 **재대행(대행사 하위 대행)** 구조가 현실적이고, 직접 공식대행사는 법인 + 광고대행업 사업자 + 월 집행 규모가 일정 수준을 넘어야 한다.

## 세션별 도구 사용 통계

| 세션 | 내용 | tool calls | 핵심 도구 |
|------|------|-----------|---------|
| 1 | 동백유디 정기 측정 | 2 | Agent, Bash |
| 2 | preterview GTM 분석 | 35 | Workflow, Bash |
| 3 | 모바일 UI 전수 수정 | 182 | Bash, Edit, Read, Browser |
| 4 | 사업 기술 문서 + 지원사업 | 98 | Bash, TaskCreate, Write |
| 5 | 네이버 광고 대행 리서치 | 32 | Bash, WebSearch, WebFetch |
| 6 | preterview UI 재점검 + 배포 | 113 | Bash, Edit, Read |
| 7 | 심층 사업계획서 | 27 | Workflow, Bash |

전체 489 tool calls 중 Bash가 189(39%)로 가장 많고, Read 71, Edit 66 순이다. 브라우저 도구 26은 전부 preterview 렌더 검증에 집중됐다.

## 이번 주 배운 것

ultracode 모드가 무조건 좋은 건 아니다. `scopeClientMessages` 버그는 에이전트를 더 쓴다고 잡히지 않는다 — 코드 실행 경로를 직접 따라가는 과정에서 잡혔다. 182 tool calls 세션이 끝나고도 raw 키 버그는 남아있었다. 두 번째 세션에서 더 느리게, 더 집중해서 읽으며 잡았다.

에이전트 fan-out은 **독립적으로 병렬화할 수 있는 작업**에서 효과가 크다. 사업계획서 섹션 6개를 동시에 쓰는 건 fan-out이 맞다. i18n 버그 추적은 순차 추론이 맞다.
