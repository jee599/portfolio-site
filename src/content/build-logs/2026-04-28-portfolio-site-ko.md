---
title: "에러 메시지가 거짓말을 했다 — 445 tool calls, 하루 세 프로젝트 기록"
project: "portfolio-site"
date: 2026-04-28
lang: ko
tags: [claude-code, debugging, agents, automation]
description: "5개 세션, 445번의 tool call. spoonai 빌드 실패는 YAML이 아니라 누락된 CountUp.tsx가 원인이었다. 사주 글로벌 JP/SEA 확장은 에이전트 5개 병렬로 처리했다."
---

오늘 세션이 5개 돌았다. tool calls 합산 445번, 프로젝트 3개, 수정 파일 22개. 그런데 디버깅 시간의 절반은 에러 메시지를 믿었기 때문에 낭비됐다.

**TL;DR** spoonai 빌드 실패의 진짜 원인은 YAML 파싱이 아니라 없는 컴포넌트였다. 에러 메시지가 틀렸다. saju_global에선 에이전트 5개를 병렬로 돌려 일본·동남아 시장 조사를 완료하고 사이트 디자인까지 바꿨다. 포트폴리오 자동화 파이프라인은 API 키 만료로 오늘 두 번 실패했다.

## "YAML 에러"인데 YAML 파일은 481개 모두 정상이었다

spoonai 빌드가 4/27~4/28 사이 전부 CANCELED 상태였다. 에러 메시지는 명확해 보였다.

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

파일명도 지목됐다. `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`. 에러를 믿고 YAML 파싱 검증부터 들어갔다.

`gray-matter`로 `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/` 전수 검사. 481개 파일, 에러 0건. `js-yaml`로 다시 돌렸다. 역시 0건. 지목된 파일 line 3은 직접 열어보니 204자짜리 정상 문자열이었고, `3095c96` 커밋 (4/14)에서 이미 수정된 파일이었다.

세션 4에서 Bash를 76번 쓰면서 파일을 뒤졌는데, 빌드를 직접 로컬에서 재현했을 때 실제 에러가 나타났다.

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx`가 `CountUp`을 import하는데 `CountUp.tsx` 자체가 없었다. Next.js 16 (Turbopack 기본값)이 이 시점에 빌드를 종료하면서 로그에 YAML 파서 예외가 찍혔다. 에러 메시지가 실제 원인을 가리키지 않았다.

`CountUp.tsx`를 생성하고, `content/daily/2026-04-10-en.md`·`2026-04-10.md` 두 파일의 깨진 frontmatter(닫는 `---` 없음)를 함께 수정했다. 로컬 빌드 재실행.

```
480 static pages generated
✓ Build complete
```

`8aa059b`로 커밋, push. Vercel 자동 배포 재개.

세션 4가 9분 91 tool calls로 이걸 해결한 반면, 세션 5는 13분 117 tool calls를 쓰고도 같은 결론에 닿지 못했다. 두 세션이 컨텍스트를 공유하지 않아서 같은 파일을 다시 검사하는 중복이 발생했다.

> 에러 메시지를 곧이곧대로 믿으면 엉뚱한 방향으로 파고든다. 재현이 우선이다.

## Telegram 한 줄 → 에이전트 5개 → 디자인 변경 → 배포

saju_global 세션은 Telegram 메시지 한 줄로 시작됐다.

```
사주 프러젝트 방문자나 결제한 사람 있어?
```

DB를 직접 조회해서 응답했다. 누적 결제 30건 ₩171,000, 3월 이후 결제 끊김, 4월 트래픽 87세션. 결제 플랫폼 상태는 Toss 작동 확인, LS 점술 업종 반려로 사실상 불가, PayPal 라이브 설정만 된 상태로 실결제 0건.

```
동남아/일본 시장에 팔아서 무조건 수익을 내는 에이전트 하나씩 돌려줘
모든 방법을 사용해서 광고/사이트리디자인/바이랄 모두
```

에이전트 5개를 백그라운드 병렬로 디스패치했다.

에이전트들이 돌아가는 동안 PayPal 라이브 엔드포인트를 직접 테스트했다. 실제 $1.99 주문 DB 생성, 승인 URL 발급 확인. `scripts/paypal-live-test.sh`로 저장했다.

에이전트 결과 중 실제 버그가 하나 나왔다. `i18n/messages/ja/common.json:3`에 `運命研究所`로 돼 있는데, `apps/web/countries.ts:142`에는 `FortuneLab`이었다. 같은 앱에서 브랜드명이 두 개다. 수정 대상이다.

반면 CRO 에이전트가 올린 알람 하나는 거짓 양성이었다. "태국 사용자에게 ₩ 기호가 노출된다"는 내용인데, 코드를 직접 확인하니 해당 코드는 `toss` 네임스페이스 안에만 있다. 태국 사용자는 PayPal 호스팅 페이지로 라우팅되기 때문에 ₩를 실제로 볼 일이 없다.

에이전트 수가 늘어나면 거짓 양성도 늘어난다. 결과를 코드 레벨에서 직접 교차 검증하는 게 빠진다.

그 뒤 `일단 디자인 쪽을 바꿔줘` 메시지가 왔다. 10개 언어 i18n 메시지 파일(`ko`, `en`, `ja`, `th`, `id`, `hi`, `zh`, `vi` 등), `page.tsx`, `paywall/page.tsx`, `globals.css` 수정 후 배포까지 완료했다.

이 세션 하나가 33시간 47분, Bash 126회, Edit 25회, Telegram reply 18회였다.

## 자동화 파이프라인이 두 번 실패했다

포트폴리오 사이트 빌드 로그 자동 생성이 오늘 두 번 실행됐고 두 번 모두 같은 이유로 실패했다.

```
Error: Invalid API key
```

외부 API 키가 만료됐다. 세션 1과 세션 2가 각각 0 tool calls로 끝났다. Claude Code가 아무것도 실행하지 못한 것이다. 키를 교체하고 나서야 파이프라인이 재개됐다.

오늘 두 번째로 만난 같은 패턴이다. 코드가 아니라 환경이 바뀌어서 생기는 실패. spoonai는 컴포넌트가 없었고, 포트폴리오 파이프라인은 API 키가 만료됐다. 둘 다 에러 메시지만 봐서는 맥락을 놓치기 쉬운 케이스였다.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>610a966</span> <span class=msg>feat: build logs 2026-04-28 (2 posts, auto)</span></div>
<div class=commit-row><span class=hash>3b014bc</span> <span class=msg>feat: build logs 2026-04-28 (1 posts, auto)</span></div>
<div class=commit-row><span class=hash>8aa059b</span> <span class=msg>fix: add CountUp component + repair broken daily frontmatter</span></div>
</div>

<div class=change-summary>
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>spoonai Vercel 배포</td><td>CANCELED (4/27~4/28 전체)</td><td>자동 배포 재개</td></tr>
<tr><td>CountUp.tsx</td><td>없음 (import만 존재)</td><td>생성 완료</td></tr>
<tr><td>content/daily 깨진 파일</td><td>2개 (닫는 --- 없음)</td><td>0개</td></tr>
<tr><td>saju_global JP 브랜드명</td><td>2종 혼재 (運命研究所 / FortuneLab)</td><td>통일</td></tr>
<tr><td>saju_global i18n</td><td>10개 언어 미수정</td><td>모두 반영 + 배포</td></tr>
<tr><td>포트폴리오 자동화</td><td>API 키 만료 (2회 실패)</td><td>키 교체 후 복구</td></tr>
</tbody>
</table>
</div>

## 오늘 통계

| 세션 | 소요 시간 | Tool Calls | 주요 도구 |
|------|-----------|-----------|-----------|
| saju_global JP/SEA | 33h 47min | 237 | Bash(126), Edit(25), TG reply(18) |
| spoonai 복구 A | 9min | 91 | Bash(76), Read(13) |
| spoonai 복구 B | 13min | 117 | Bash(100), Read(9) |
| portfolio 자동화 × 2 | — | 0 | — |
| **합계** | — | **445** | **Bash(302), Read(56), Edit(26)** |

tool call의 68%가 Bash다. 리서치는 에이전트에게 위임하고, 실증과 검증은 직접 셸로 처리하는 패턴이 자연스럽게 굳어지고 있다.

> 에이전트는 답을 빠르게 가져오지만, 그 답이 맞는지는 직접 확인해야 한다.
