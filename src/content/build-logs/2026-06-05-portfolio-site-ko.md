---
title: "Claude Opus 4.8로 하루 611번 도구 호출 — 사주 앱 해외 확장, PayPal 버그, 이미지 4회 반복"
project: "portfolio-site"
date: 2026-06-05
lang: ko
tags: [claude-code, opus-4-8, multi-agent, paypal, saju, workflow]
description: "Claude Opus 4.8로 하루 17세션, 611 tool call을 돌렸다. 사주 앱 글로벌화 195 tool call, PayPal 25자 버그, design-gate 레이스 컨디션까지 한 날의 기록."
---

하루에 611번 도구를 사용했다. 17개 세션, 4개 프로젝트, 전부 `claude-opus-4-8`. 치과 광고 리서치부터 시작해서 사주 앱 해외 결제 완성까지 이 날 다 들어갔다.

**TL;DR** 가장 큰 단일 세션은 사주 앱 글로벌화 — 3시간 49분, 195번의 도구 호출, 9개 병렬 에이전트. 그 사이 PayPal 인보이스 25자 제한 버그를 발견했고, design-gate가 병렬 세션 때문에 레이스 컨디션을 맞았다.

## 하루의 규모: 세션 17개, tool call 611번

다룬 프로젝트:

- `dentalad` — 치과 광고 마케팅 리서치 daily update (HTML 리포트 포함)
- `ai-10-dollar-june` — AI 활용 첫 $10 일일 보고서
- `local-commerce-agent` — JDLab 글로벌 아웃리치 + PayPal API 연동 + 이미지 제작
- `saju_global` — 사주 앱 글로벌화 (ultraplan)

세션별 시간을 합산하면 총 약 6시간 40분. 그중 사주 세션 혼자 3시간 49분을 먹었다.

도구 사용 분포를 전체로 보면 Bash가 압도적으로 많다. Bash 255회, Read 157회, Edit 103회, Write 55회. 읽는 것보다 실행하는 비율이 높은 날이었다.

## 사주 앱 글로벌화: ultraplan, 195번의 도구 호출

세션 14가 이 날의 메인이었다. 시작 프롬프트는 이것이다.

```
사주 프로젝트 처음부터 끝까지 점검해서 세계화로 팔기에 문제가 없는지,
결제, 모든 로직 제대로 동작하는지 어느 나라에 어떤 식으로 홍보나 광고...
```

`/ultraplan`을 쳤는데 먼저 실패했다. git repo가 없는 디렉토리에서 실행했기 때문이다.

```
ultraplan: cannot launch remote session —
Background tasks require a git repository (checked: /Users/jidong).
```

`saju_global` 디렉토리로 옮겨서 로컬 실행으로 우회했다. 그다음 `Workflow`를 호출해 9개 에이전트를 병렬로 띄웠다.

에이전트 구성:
- **코드 감사** 4개: 결제 로직, Saju 엔진/점성 계산, i18n·법적 요건(GDPR·특정상거래법), 전환 퍼널
- **시장 리서치** 5개: 글로벌·경쟁자, 일본, 동남아, 인도·중화권, 서구·채널 경제성

결과물은 ~785K 토큰의 분석이었다. 161K 자짜리 출력을 파싱해서 실제 코드 변경으로 이어진 파일 수는 30개+.

세션 중반에 방향이 바뀌었다. 사용자가 "한국 결제 안할거야. 그냥 해외부터 할거야"라고 했다. Toss 결제 코드를 정리하고, PayPal + Lemon Squeezy 중심으로 재구성했다. Toss 페이지(`checkout/toss/page.tsx`, `checkout/toss/success/page.tsx`)는 로직은 유지하면서 KR 전용 임시 비활성으로 처리했다.

추가된 컴포넌트들:
- `CookieConsent.tsx` — GDPR 동의 수집
- `AnalyticsGate.tsx` — 동의 없으면 트래킹 차단
- `UsageCounter.tsx` — 무료 사용 횟수 표시
- `data-request/page.tsx` — GDPR 데이터 요청 페이지
- `tokushoho/page.tsx` — 일본 특정상거래법 페이지 (법적 필수)
- `cron/retarget/route.ts` — 리타겟 이메일 cron

세션 말미에 "응 푸시하고 메인에 합쳐"가 나왔다. 브랜치를 확인하고 main에 merge까지 한 번에 처리했다.

산출물로는 `FORTUNELAB_GTM_US_SEA_PLAYBOOK.html`과 `FORTUNELAB_REVENUE_PLAN_2026-06.html` 두 개의 전략 문서도 나왔다. 이것들은 코드가 아니라 앞으로 마케팅을 어떻게 할지 담은 실행 플레이북이다.

## PayPal invoice_number 25자 제한 버그

세션 4에서 PayPal Invoicing v2 API 연동을 만들었다. 세션 5는 그다음 날 바로 Codex 리뷰에서 올라온 블로킹 이슈를 픽스한 세션이다.

문제는 `invoice_number` 필드의 25자 제한이었다.

dry-run 경로에서 생성되는 인보이스 번호 길이는 정확히 25자였다. 안전해 보였다. 그런데 live 경로에서는 타임스탬프 접미사가 붙는다.

```
dry-run:  JDLAB-MADEINN-VT-20260605     → 25자 (정확히 제한값)
live:     JDLAB-MADEINN-VT-20260605-114827 → 32자 (PayPal API 에러)
```

경계값에 딱 맞게 만들어뒀는데 live 경로에서 초과하는 전형적인 버그였다. dry-run이 한계값과 일치한다는 것 자체가 위험 신호였는데 그걸 놓쳤다.

픽스는 compact 포맷으로 번호를 단축하고, 테스트에 배치 레벨 25자 캡 검증을 추가하는 것이었다. Edit 6회, Read 5회, Bash 5회, 총 16 tool calls로 4분 만에 끝났다.

구현보다 리뷰에서 버그를 잡는 패턴이 이 날 여러 번 반복됐다. Claude가 구현하고 Codex가 read-only 리뷰를 해서 블로커를 넘기면, 다음 세션에서 픽스한다. 짧은 픽스 세션들(세션 5, 7, 16)이 다 이 패턴으로 나왔다.

## Design Gate가 레이스 컨디션을 맞았다

세션 6에서 이상한 일이 생겼다.

이 프로젝트에는 `.html` 파일을 생성하기 전에 반드시 "Open Design equivalent" 패스를 인증받아야 하는 hook이 있다. `design-pass.sh`로 세션 ID를 `design-gate.ok` 파일에 기록하는 방식이다.

세션 6에서 인증을 마쳤는데 바로 다시 gate가 막혔다. 조사해보니 원인이 이것이었다.

```
shared gate state has a cross-session race —
a concurrent session (a45e846e, jidonglab-site) consumed my ack
and set design-gate.ok to its own session id.
```

병렬로 실행 중인 다른 세션이 같은 파일을 읽고 덮어쓴 것이다. 파일 기반 shared state를 여러 세션이 동시에 쓰면 마지막 쓰기가 이긴다. 이전 세션의 인증이 날아가는 것이다.

해결책은 재인증이었다. 근본 원인을 고치려면 파일 기반 lock을 세션 ID 스택이나 파일당 세션 ID를 쓰는 방식으로 바꿔야 하는데, 이건 hook 자체의 설계 문제라 그 세션에서는 건드리지 않았다.

단일 세션에서 순차적으로 작업할 때는 문제없지만, 같은 날 여러 세션을 병렬로 돌리면 이 취약점이 노출된다. 이날은 여러 세션을 동시에 실행했고 그게 정확히 이 버그를 촉발했다.

## PayPal 이미지 디자인을 4번 반복한 이유

세션 10부터 13까지, 총 4세션에 걸쳐 PayPal 결제 링크 제품 이미지를 반복 제작했다.

**세션 10**: Python으로 SVG 생성기를 만들고, headless Chrome으로 1200×1200 PNG를 rasterize하는 파이프라인을 구축했다. 첫 버전은 파란 accent(`#2348DA`), `yourstore.com` placeholder 사이트.

**세션 11**: jidonglab.com 실제 브랜딩으로 교체. 사이트에서 실제 색상(`#00c471` 초록)과 카피를 WebFetch로 가져와서 적용했다. "yourstore.com/product/soy-candle" → 실제 jidonglab 서비스 카피.

**세션 12**: 영어 deliverable 상세 추가. "구매자가 뭘 받는지"를 명확히 적어야 한다는 요구. 각 이미지에 deliverable 목록, 섹션 구성, 페이지 수까지 넣었다.

**세션 13**: "dense report feel" — 더 많은 콘텐츠를 넣어 묵직한 보고서 느낌. sparse한 카드 레이아웃에서 섹션이 빼곡한 미리보기 레이아웃으로 교체했다.

각 세션마다 headless Chrome 렌더링 후 실제 thumbnail 크기(200px, 96px)에서도 읽히는지 육안으로 확인했다. Playwright가 없어서 Chrome headless shell binary를 직접 구동했다.

흥미로운 점은 파이프라인 구조다. 세션 10에서 `build.py` → SVG 생성 → Chrome rasterize를 한 번 만들고, 이후 세션 3개는 `build.py`만 교체해서 재사용했다. 렌더러는 변경 없이 콘텐츠 생성기만 바꾸는 구조가 반복 작업을 빠르게 만들었다.

## 오늘 확인한 것들

큰 작업을 에이전트로 쪼개면 커버리지가 높아진다. 사주 ultraplan에서 코드 감사 4개 + 리서치 5개를 병렬로 돌렸는데, 단일 에이전트로 순차 실행했으면 하나를 깊이 파면 다른 걸 놓쳤을 것이다.

파이프라인을 한 번 만들면 반복 비용이 줄어든다. PayPal 이미지를 4번 고쳤는데 파이프라인이 있어서 각 세션이 10분 내외로 끝났다. 파이프라인 없이 매번 처음부터 했으면 세션당 30분+였을 것이다.

파일 기반 공유 상태에 병렬 세션은 위험하다. design-gate race condition이 그걸 보여줬다. 공유 파일에 쓰는 hook이 있으면 병렬 세션 상황을 가정하고 설계해야 한다.

Codex 리뷰 루프는 경계값 버그를 잡는다. PayPal 25자 버그는 자동화 테스트로는 안 잡힌 케이스였다. dry-run이 정확히 25자라는 사실 자체를 이상하게 봐야 했는데, 구현 당시에는 통과로 봤다. 외부 리뷰어 시점이 다르다.
