---
title: "Claude Code 서브에이전트 12개 병렬 — 3프로젝트를 하루에 동시에 굴린 기록"
project: "portfolio-site"
date: 2026-04-27
lang: ko
tags: [claude-code, subagent, automation, devto, market-research]
description: "세션 3개, tool call 444번. DEV.to 시리즈 발행부터 치과 광고 시장 조사, 사주 사이트 일본/동남아 확장까지 Claude Code 서브에이전트로 병렬 처리한 기록."
---

세션 3개, 444번의 tool call, 총 93시간 39분. 같은 날 DEV.to에 AI 시리즈를 발행하고, 치과 광고 시장 조사 보고서 6개를 만들고, 사주 사이트 일본/동남아 시장 데이터를 수집해서 사이트 디자인까지 바꿨다. 프로젝트 이름도, 도메인도 다른 세 작업이 동시에 진행됐다.

**TL;DR** 서브에이전트 병렬 디스패치가 핵심이다. 한 프롬프트로 12개 에이전트를 동시에 띄우면 직렬로 처리할 때 하루 걸릴 작업이 2시간에 끝난다.

## "devto에 AI github 프로젝트 분석 글 올려줘" — 한 줄 프롬프트, 3편 시리즈

첫 세션은 단순한 요청으로 시작됐다.

```
ai git에서 유명한 프로젝트 한 4개 정도 최신거 분석 글 devto에 블로그 올려줘
```

Claude Code는 웹서치로 2026년 4월 기준 트렌딩 프로젝트를 수집했다. `andrej-karpathy-skills`(16K 스타), `hermes-agent`, OpenClaw(295K 스타), opencode가 걸렸다. 4개를 3편 시리즈로 재구성해서 구조를 제안했다.

시리즈명은 `The 2026 AI GitHub Playbook`. Part 1을 즉시 발행하고 나머지 두 편은 DEV.to 드래프트로 올렸다. 예약 발행 대기 상태.

발행 완료: `https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi` (2026-04-23 14:55 UTC, DEV.to id=3542024)

사용자 개입은 세 번뿐이었다. 초기 프롬프트, "3편 정도", "진행". 나머지는 Claude Code가 웹서치 → 구조 제안 → 콘텐츠 생성 → API 발행까지 단독으로 처리했다.

이 세션에서 흥미로운 부분이 하나 있었다. 기존에 작성해둔 OpenClaw 관련 글(`claude-code-channels-vs-openclaw-en.md`)이 이미 존재했는데, 스킬이 이를 자동으로 감지해서 겹치지 않는 앵글로 접근했다. "이미 다룬 프로젝트니까 내부 링크로 연결하겠다"는 판단은 사람이 내린 게 아니다.

세션 중반에는 spoonai 기사 품질 문제가 끼어들었다. "26일자 기사랑 25일자 기사의 퀄리티가 달라"는 지적에 `SKILL-2-publish.md`와 `self-critique.mjs` 자가 검증 루프를 수정했다. 한 세션에서 두 프로젝트가 동시에 진행됐다. 191 tool call, Bash 96번, Agent 11번.

## 서브에이전트 12개 병렬: 치과 광고 시장 조사를 2시간 26분에 끝낸 방법

두 번째 세션은 치과 광고 프로젝트였다. 요청은 간결했다.

```
ai로 치과/병원 광고하는 업체들 모두 조사해서 보고서 써줘. 서브에이전트 10개 이상 사용해서
```

12개 서브에이전트를 병렬로 디스패치했다. 각 에이전트가 다른 도메인을 맡아서 중복 없이 조사한다.

- 한국 AI 의료 광고 업체 지형도 (8개 카테고리 60곳)
- 네이버 C-Rank / D.I.A.+ 알고리즘 변화
- 실제 운영 중인 치과 블로그 사례 수집
- 5년/1년/90일 트렌드 비교

결과물: HTML 보고서 6개. `TREND-COMPARISON-REPORT.html`, `AI-AGENCIES-DEEP-REPORT.html`, `AI-AGENCIES-PRIMER.html`, `AI-AGENCIES-EXAMPLES.html`, `AI-AGENCIES-EVIDENCE.html`, `AI-DENTAL-TELEGRAM.md`. 모두 브라우저에서 바로 열 수 있는 형태로 생성됐다.

에이전트들이 가져온 자료에는 신뢰도 등급을 붙였다. "실명+정량(별 5개)", "이니셜+풍부한 수치(별 4개)" 식으로. `호원앤컴퍼니`는 실제 클라이언트 케이스 직링크가 나왔고, `인블로그`는 실제 운영 중인 치과 블로그(`heritagedental.inblog.io`)까지 가져왔다.

서브에이전트 병렬 디스패치의 핵심은 **도메인 분리**다. 같은 주제를 여러 에이전트가 탐색하면 중복이 생기고 결과를 합치기 어렵다. 도메인을 미리 잘라서 각 에이전트가 겹치지 않게 할당하면 결과를 그냥 concat하면 된다.

63 tool call, Agent 35번, 2시간 26분. 직렬로 했다면 하루 넘게 걸렸을 작업이다.

## Telegram 한 줄 → DB 조회 → PayPal 실결제 테스트 → 시장 분석 → 디자인 변경

세 번째 세션은 Telegram 메시지로 시작됐다.

```
사주 프러젝트 방문자나 결제한 사람 있어?
```

Telegram 플러그인이 Claude Code 컨텍스트에 연결되어 있어서 채널 메시지가 세션으로 직접 들어온다. DB를 즉각 조회해서 답했다. 누적 결제 30건(₩171,000), 3월 이후 결제 끊김, 4월에도 트래픽은 87세션 들어오는 중. Toss는 작동 확인, LS는 점술 업종 반려로 사망, PayPal은 라이브 설정만 됐고 실결제 미검증 상태.

다음 Telegram 메시지가 왔다.

```
동남아/일본 시장에 팔아서 무조건 수익을 내는 에이전트 하나씩 돌려줘
```

4개 에이전트를 백그라운드로 병렬 실행했다.

- `JP fortune market data` → `jp-market-data.md`
- `SEA fortune market data` → `sea-market-data.md` (소스 136개 inline)
- `Viral fortune video pattern decode` → `viral-formula.md`
- `Top-converting fortune site references`

에이전트들이 돌아가는 동안 PayPal 라이브 엔드포인트를 직접 테스트했다. 실제 $1.99 주문이 DB에 생성되고 승인 URL이 발급됐다. `scripts/paypal-live-test.sh`로 결과 저장.

에이전트 결과에서 중요한 발견이 하나 나왔다. 일본어 파일 `common.json:3`에 `運命研究所`라고 표기됐는데 `countries.ts:142`는 `FortuneLab`이라고 되어 있었다. 브랜드 일관성 문제. 실제 수정이 필요한 버그였다.

반면 CRO 에이전트가 올린 "태국 사용자에게 ₩ 기호가 보인다"는 알람은 거짓 양성이었다. 직접 코드를 확인하니 `toss` 네임스페이스 안에 있어서 Korean checkout에서만 렌더링됐다. 태국 유저는 PayPal 호스팅 페이지로 라우팅되기 때문에 ₩를 볼 일이 없다.

에이전트 수를 늘릴수록 거짓 양성도 늘어난다. 결과물을 검증하는 레이어 없이 에이전트만 늘리면 노이즈가 커진다.

```
일단 디자인 쪽을 바꿔줘
```

i18n 메시지 파일 10개 언어, `page.tsx`, `paywall/page.tsx`, `globals.css`를 수정했다. 190 tool call, Bash 92번, Edit 25번.

## 3세션 도구 사용 통계

| 세션 | 시간 | Tool Calls | 주요 도구 |
|------|------|-----------|-----------|
| 세션 1 (DEV.to + spoonai) | 75h 58min | 191 | Bash 96, Agent 11 |
| 세션 2 (치과 광고 조사) | 2h 26min | 63 | Agent 35, Bash 9 |
| 세션 3 (사주 글로벌) | 15h 15min | 190 | Bash 92, Edit 25 |
| **합계** | **93h 39min** | **444** | Bash 197, Agent 53 |

전체 tool call의 44%가 Bash, 12%가 Agent다. Agent 53번으로 병렬 조사를 돌린 게 이 세션들의 핵심 패턴이다.

리서치 도메인에서 에이전트 효율이 가장 높다. 검색 범위가 넓고, 결과를 병렬로 수집하고, 개별 에이전트가 틀려도 전체 그림은 나온다. 반면 코드 변경에서는 에이전트보다 직접 `Edit`이 빨랐다. i18n 파일 21개 수정은 에이전트 없이 `Edit` 25회로 끝났다.

도구 선택이 곧 전략이다.
