---
title: "Claude Code로 하루 4개 프로젝트를 동시에 — 7세션, 86 tool calls"
project: "portfolio-site"
date: 2026-05-23
lang: ko
tags: [claude-code, claude-opus, automation, agent, workflow]
description: "하루에 Claude Code 7세션을 돌렸다. SpoonAI 콘텐츠 수집, 치과 광고 리서치, HTML 보고서 생성, 전략 자문까지. Opus 4-7로 86번의 도구 호출 결과."
---

5월 22일 하루 동안 Claude Code 세션을 7번 열었다. 모두 `claude-opus-4-7`이었고, 합산 86 tool calls가 나왔다. 코딩 세션은 거의 없었다. SpoonAI 콘텐츠 인텔리전스 수집, 치과 광고 규제 리서치, HTML 보고서 생성, 스타트업 전략 자문까지 — 코드 에디터가 아니라 프로젝트 간 오케스트레이터로 쓴 하루였다.

**TL;DR** — Claude Code를 코딩 도구가 아니라 멀티 프로젝트 에이전트로 쓰면 어떤 일이 일어나는지 실측 데이터다. 에러도 있었고, 타임아웃도 있었고, 잘 작동한 것도 있었다.

## 가장 오래 걸린 세션: 치과 광고 규제 추적

세션 3이 9분에 41 tool calls였다. Bash 20번, Read 13번, Edit 6번, Write 2번. 이걸 한 세션에 소화한 건 프롬프트 구조 덕분이다.

프롬프트 시작부에 이런 인테이크를 달았다:

```
1. Goal: medical_dental_ads_daily_goal.md 지침에 따라 2026-05-22 한국 병원/치과 
   광고·마케팅 최신 정보와 공개 SERP 표본을 수집·분석하고, 지정된 누적 
   지식베이스 파일을 업데이트한다.
2. Scope: ~/dentalad/research/daily-medical-dental-ads/ 아래 오늘자 파일들.
   공식/준공식 소스와 공개 네이버 통합검색 SERP 표본만 사용한다.
```

목표·범위·제외 범위를 명시하면 Claude가 직접 "어디까지 할지"를 결정하지 않아도 된다. 그날 핵심 발견은 네이버 공지 31700번 — 2026-05-28부터 통합검색 플레이스광고 슬롯 상향, 병의원 포함. 이걸 감지해서 rolling KB를 업데이트하고 HTML 보고서까지 생성했다.

산출물:
- `2026-05-22-daily-update.md`
- `rolling-knowledge-base.md` 업데이트
- `source-index.md` 업데이트
- `competitive-serp-observations.md` 업데이트
- `naver-ranking-hypotheses.md` 업데이트

그런데 세션이 타임아웃으로 끊겼다. HTML 보고서 생성 직전에.

## 타임아웃 이후: 이어받기 세션 전략

세션 4는 세션 3의 마저 못 한 일을 마무리하는 것이었다.

```
The previous Claude run updated the markdown files and sources but timed out 
before creating the HTML report referenced in 2026-05-22-daily-update.md.

Goal: Create the missing mobile-friendly HTML report and verify the daily artifacts.
Do not redo the whole crawl unless required.
```

"이전 실행이 어디서 멈췄는지"를 명시하고, "처음부터 다시 하지 말라"는 제약을 걸었다. 이렇게 하면 Bash 7번, Read 4번, Grep 3번, Write 1번으로 충분히 마무리된다. 이전 세션에서 5분을 썼다면 이어받기 세션은 5분 안에 끝낸다.

최종 산출물: `2026-05-22-integrated-search-place-ad-slot-expansion.html` (23.0KB, 자기완결형, 모바일 친화 CSS).

## API 에러가 났을 때

세션 1에서 SpoonAI 콘텐츠 인텔리전스를 수집하던 중 이런 에러가 났다:

```
API Error: The socket connection was closed unexpectedly. 
For more information, pass `verbose: true` in the second argument to fetch()
```

Bash 14번을 쓴 세션이었다. raw JSON 파싱 → 후보 선별 → 파일 저장까지 하려다가 소켓이 끊긴 것이다. 이 경우도 이어받기 세션이 아니라 세션 2를 별도로 열어서 "이 두 파일이 스키마에 맞는지만 검증해라"라는 좁은 태스크로 나눴다.

결과: Read 2번으로 PASS 판정. 세션 1이 파일을 생성하는 데까지는 성공했던 것이다.

## 코딩 없이 전략 자문

세션 6이 흥미로웠다. SpoonAI `/newsite` 프로토타입에 대한 마케팅·기획 피드백을 요청했다. 코드 변경 0줄, Read 2번 + Grep 1번.

그런데 Stop 훅이 막았다:

```
Stop hook feedback:
Found 3 debug/TODO leftover(s) in working tree. 
Clean them up or confirm intentional before stopping.
```

Claude가 확인해보니 이번 세션에서 작성한 코드가 아니었다. `scripts/*`의 `console.log`는 CLI 유틸리티의 stdout 출력이 본 목적이고, `app/api/subscribe/route.ts`의 마커는 사전 존재하는 것이었다. 이 경우엔 훅 판단이 틀렸다는 걸 설명하고 통과시켰다.

전략 자문 결과는 Telegram에 바로 붙여넣을 수 있는 형식으로 나왔다. B2B SaaS로 포지셔닝할 때 `/newsite`의 5개 학습 트랙 중 "논쟁 트랙"이 가장 차별화 포인트라는 판단도 여기서 나왔다.

## 도구 사용 통계로 보는 세션 특성

| 세션 | 주요 도구 | 특성 |
|------|-----------|------|
| 1 | Bash(14) | 네트워크 집약적, API 에러 발생 |
| 2 | Read(2) | 검증만, 최소 도구 |
| 3 | Bash(20), Read(13), Edit(6) | 리서치+파일 업데이트 동시 |
| 4 | Bash(7), Read(4), Grep(3) | 타임아웃 이어받기 |
| 5 | Read(1), Write(1) | 단순 재편집 |
| 6 | Read(2), Grep(1) | 코드 없는 자문 |
| 7 | Bash(4), Write(2) | HTML 보고서 단일 생성 |

Bash가 많으면 외부 리소스 수집이 필요한 세션이다. Read/Edit 비율이 높으면 기존 파일 기반 업데이트 세션이다. Write만 1번이면 가장 빠르게 끝난다.

## 프롬프트 구조에서 배운 것

이번 7세션을 통해 확인한 패턴이 있다. 잘 작동한 프롬프트는 세 가지 공통점이 있다.

첫째, **인테이크 구조가 있다**. 목표·범위·실제 작업·제외 범위를 번호로 구분한다. Claude가 "이걸 어디까지 해야 하지?"를 스스로 추론하는 시간을 없앤다.

둘째, **이전 상태를 명시한다**. "이전 실행이 마크다운까지는 했고, HTML만 남았다"처럼 컨텍스트를 넘기면 처음부터 다시 탐색하지 않는다.

셋째, **산출물 경로를 고정한다**. `~/dentalad/research/daily-medical-dental-ads/` 같은 절대 경로를 프롬프트에 박아두면 Claude가 파일을 어디 둘지 결정하지 않는다. 이게 이어받기 세션에서 특히 중요하다.

## 숫자로 보는 하루

- 총 세션: 7개
- 총 tool calls: 86
- 생성 파일: 5개
- 수정 파일: 4개
- 타임아웃 발생: 1회
- API 소켓 에러: 1회
- 코드 커밋: 0건

코딩은 없었다. 그래도 이 세션들이 없었으면 치과 광고 KB 업데이트, SpoonAI 인텔 수집, 담배 재고 MVP 보고서가 수동으로 몇 시간 걸렸을 것이다.
