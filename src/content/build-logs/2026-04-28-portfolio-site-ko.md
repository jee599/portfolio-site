---
title: "YAML 에러인 줄 알았는데 CountUp.tsx가 없었다 — spoonai 빌드 복구 + saju_global JP/SEA 확장"
project: "portfolio-site"
date: 2026-04-28
lang: ko
tags: [claude-code, debugging, subagent, i18n]
description: "세션 5개, tool call 445번. spoonai 빌드 실패의 진짜 원인은 YAML이 아니라 누락된 컴포넌트였다. 동시에 사주 글로벌 일본/동남아 확장 작업도 진행했다."
---

에러 메시지가 틀렸다. Vercel 빌드가 `YAMLException: incomplete explicit mapping pair`로 떨어지길래 YAML 문제인 줄 알았는데, 481개 파일을 `gray-matter`로 전수 파싱해보니 깨진 파일이 하나도 없었다. 진짜 원인은 따로 있었다.

**TL;DR** spoonai의 빌드 실패는 `CountUp.tsx` 누락이었다. YAML 에러는 이미 4/14에 패치됐는데 빌드 로그가 그 메시지를 계속 보여줬다. 사주 글로벌에선 Telegram 메시지 한 줄로 JP/SEA 시장 분석 → 사이트 디자인 변경 → 배포까지 이어졌다.

## "YAML 에러"인데 YAML 파일은 전부 멀쩡했다

spoonai 웹 배포가 4/27~4/28 사이 전부 CANCELED 상태였다. 사용자가 전달한 에러는 이랬다.

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

파일명도 지목됐다. `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`. 이걸 믿고 YAML 파싱부터 들어갔다.

`gray-matter`로 `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/`를 전수 검사했다. 481개. 결과: **에러 0건**.

그다음 `js-yaml`로 다시 돌렸다. 역시 0건. 지목된 파일 line 3을 직접 열어보니 204자짜리 정상 문자열이었다. `3095c96` 커밋에서 4/14에 이미 수정됐던 파일이다.

실제 블로커는 다른 데 있었다. `HomeContent.tsx`가 `CountUp`을 import하는데 `CountUp.tsx`가 존재하지 않았다. Next.js 16 Turbopack 빌드가 이 시점에 터지면서 Vercel이 YAML 파서 에러 메시지를 출력한 것이다. 에러 메시지가 실제 원인을 가리키지 않았다.

`CountUp.tsx`를 생성하고 `2026-04-10-en.md`, `2026-04-10.md` 두 파일의 깨진 frontmatter(닫는 `---` 없음)를 수정했다. 로컬 빌드를 돌리니 480개 정적 페이지가 생성됐다. `8aa059b`로 커밋 후 push. Vercel 자동 배포 트리거.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>8aa059b</span> <span class=msg>fix: CountUp component missing + broken daily frontmatter (spoonai)</span></div>
<div class=commit-row><span class=hash>3b014bc</span> <span class=msg>feat: build logs 2026-04-28</span></div>
</div>

<div class=change-summary>
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>spoonai Vercel 배포</td><td>CANCELED (4/27~4/28 전부)</td><td>자동 배포 재개</td></tr>
<tr><td>CountUp.tsx</td><td>없음 (import만 존재)</td><td>생성 완료</td></tr>
<tr><td>content/daily 깨진 파일</td><td>2개 (닫는 --- 없음)</td><td>0개</td></tr>
<tr><td>로컬 빌드 결과</td><td>빌드 실패</td><td>480페이지 생성</td></tr>
</tbody>
</table>
</div>

이 세션이 두 번 실행된 게 포인트다. 세션 4는 9분 91회, 세션 5는 13분 117회. 두 세션 모두 같은 현상을 봤지만 접근이 달랐다. 세션 4는 빌드를 직접 재현해서 `CountUp` 누락을 찾아 수정까지 완료했고, 세션 5는 파일 전수 조사에 더 많은 시간을 썼지만 결론에 닿지 못하고 끝났다. 두 세션이 컨텍스트를 공유하지 않아서 중복 조사가 발생한 것이다.

> 에러 메시지를 곧이곧대로 믿으면 엉뚱한 방향으로 파고든다. 재현이 우선이다.

## Telegram 한 줄 → 에이전트 5개 병렬 → 사이트 디자인 변경 → 배포

같은 날 saju_global 프로젝트에서는 Telegram 메시지가 작업 트리거였다.

```
사주 프러젝트 방문자나 결제한 사람 있어?
```

DB를 직접 조회해서 응답했다. 누적 결제 30건, ₩171,000. 3월 이후 결제 끊김. 4월 트래픽은 87세션. 결제 플랫폼 상태: Toss 작동 확인, LS 점술 업종 반려 사망, PayPal 라이브 설정만 됐고 실결제 0건.

```
동남아/일본 시장에 팔아서 무조건 수익을 내는 에이전트 하나씩 돌려줘
모든 방법을 사용해서 광고/사이트리디자인/바이랄 모두
```

5개 에이전트를 백그라운드 병렬로 띄웠다.

- `JP fortune market data` → `jp-market-data.md`
- `SEA fortune market data` → `sea-market-data.md` (소스 136개 inline)
- `Viral fortune video pattern decode` → `viral-formula.md`
- `Top-converting fortune site references`
- `Site CRO audit JP/TH` → `cro-audit-jp-th.md`

에이전트들이 돌아가는 동안 PayPal 라이브 엔드포인트를 직접 테스트했다. 실제 $1.99 주문 DB 생성, 승인 URL 발급. `scripts/paypal-live-test.sh`로 저장했다.

에이전트 결과 중 진짜 버그가 하나 나왔다. 일본어 `common.json:3`에 `運命研究所`, `countries.ts:142`엔 `FortuneLab`. 같은 앱에서 브랜드명이 두 개였다. 이건 수정이 필요한 실제 이슈다.

반면 CRO 에이전트가 올린 알람 하나는 거짓 양성이었다. "태국 사용자에게 ₩ 기호가 노출된다"는 건데, 코드를 직접 보니 해당 코드는 `toss` 네임스페이스 안에 있어서 Korean checkout에서만 렌더링된다. 태국 사용자는 PayPal 호스팅 페이지로 라우팅되므로 ₩를 볼 일이 없다.

에이전트를 많이 띄울수록 거짓 양성도 따라 늘어난다. 결과를 코드 레벨에서 교차 검증하는 레이어가 필요하다.

```
일단 디자인 쪽을 바꿔줘
```

i18n 메시지 파일 10개 언어(`ko`, `en`, `ja`, `th`, `id`, `hi`, `zh`, `vi` 등), `page.tsx`, `paywall/page.tsx`, `globals.css` 수정 후 배포까지 완료.

## 오늘 도구 사용 통계

| 세션 | 소요 시간 | Tool Calls | 주요 도구 |
|------|-----------|-----------|-----------|
| saju_global JP/SEA | 33h 47min | 237 | Bash(126), Edit(25), TG reply(18) |
| spoonai 복구 A | 9min | 91 | Bash(76), Read(13) |
| spoonai 복구 B | 13min | 117 | Bash(100), Read(9) |
| **합계** | — | **445** | **Bash(302), Read(56), Edit(26)** |

오늘 tool call의 68%가 Bash다. 에이전트 위임보다 직접 셸 실행 비중이 높았다. 빌드 재현, DB 조회, PayPal 테스트 모두 Bash로 처리했다. 리서치는 에이전트, 실증·검증은 Bash로 분리되는 패턴이 자연스럽게 나타난다.

> 에이전트는 답을 빠르게 가져오지만, 그 답이 맞는지는 직접 확인해야 한다.
