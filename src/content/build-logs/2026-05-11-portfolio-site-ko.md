---
title: "Claude Code 병렬 에이전트 5개 동시 실행 — 102 tool calls, SRI 해시 버그까지 잡아낸 과정"
project: "portfolio-site"
date: 2026-05-11
lang: ko
tags: [claude-code, agent, parallel, design, automation, codex]
description: "병렬 에이전트 5개 동시 디스패치로 커피챗 리디자인 시안을 한 번에 뽑았다. Codex 교차검증이 SRI 해시 버그를 잡아냈고, 크론 에이전트는 7분에 6개 아티팩트를 완성했다."
---

지난 이틀, Claude Code 세션 2개에서 총 102 tool calls가 나왔다. 한 세션은 치과 광고 자동화 크론이었고, 다른 하나는 커피챗 사이트 리디자인이었다. 코드를 직접 한 줄도 안 쓰고 아티팩트가 나왔다.

**TL;DR** 병렬 에이전트 5개를 동시 디스패치해 디자인 변주를 한 번에 만들었다. Codex 교차검증이 SRI 해시 버그를 잡아냈고, 크론 에이전트는 7분 만에 6개 아티팩트를 완성했다.

## 크론 에이전트: 7분, 23 tool calls, 6개 아티팩트

첫 번째 세션은 `dentalad` 프로젝트의 일일 자동화였다. `medical_dental_ads_daily_goal.md`에 정의된 목표를 실행하는 크론 에이전트가 트리거됐고, 내가 한 건 없다. 에이전트가 알아서 기존 `rolling-knowledge-base.md`에 §2.7(사이트검색광고 노출 안내 두 축), §2.8 섹션을 추가하고, `competitive-serp-observations.md`와 `naver-ranking-hypotheses.md`를 갱신하고, `2026-05-10-daily-update.md`를 새로 생성했다. 마지막으로 모바일 친화적인 HTML 리포트(`2026-05-10-place-ads-roas-serp-patterns.html`)까지 만들었다.

도구 분포: Read(9), Edit(8), Bash(3), Write(2), Grep(1). Read를 9번 쓴 건 기존 문서를 꼼꼼히 파악하고 맥락을 잡은 다음 작성했기 때문이다. 맥락 없이 쓰면 중복이 생기고 일관성이 깨진다.

크론 에이전트 운영에서 가장 중요한 건 **레이블 보수주의**다. 프롬프트에 명시한 규칙이 이렇다:

```
공식 확인 / 공식 도움말 기반 해석 / 공개 SERP 관찰 /
업계 관찰 / 합리적 유추 / 확인 필요 / 수치 미확인 / 고지출 추정
```

CPC/CTR/ROAS 같은 수치를 지어내지 말라는 지시다. 의료 광고 도메인에서 허위 수치는 단순 오류가 아니라 컴플라이언스 리스크다. 에이전트가 이 규칙을 지킨다는 걸 매일 산출물로 확인한다.

## "다 별로야" — 피드백이 방향을 바꾼다

두 번째 세션은 커피챗 사이트(`coffeechat.it.kr`) 리디자인이었다. 시작 프롬프트는 단순했다:

> "커피챗 사이트 리디자인할거야. 최소 5가지 결과물을 내고 내가 고를 수 있게 해줘"

첫 라운드를 뽑은 뒤 피드백이 왔다: "다 별로야 하나도 전문성이 없어보여."

이게 Claude Code를 제대로 쓰는 방법이다. 첫 결과물에 집착하지 않는다. 피드백 → 방향 재조정 → 재실행. 이 루프가 빠를수록 좋다.

사이트를 직접 분석하니 **게임 업계 멘토링 플랫폼**이었다. 게임 회사 현직자와 1:1 커피챗, 이력서 리뷰, 모의면접. 이 맥락을 파악한 다음 5개 변주 계획을 세웠다. 무작정 다시 만드는 게 아니라, 도메인 이해 → 계획 → 병렬 실행 순서다.

## 병렬 에이전트 5개 동시 디스패치

계획이 잡히자 `frontend-implementer` 에이전트 5개를 병렬로 디스패치했다. 순차가 아닌 동시 실행이다.

| 시안 | 무드 | 핵심 |
|---|---|---|
| V1 Editorial Magazine | 한국 인디 잡지, 큰 세리프 + 여백 | Instrument Serif · 크림 #f4eee4 · 12-col grid |
| V2 Soft Brutalist | 굵은 보더, 라임·핑크 컬러 블록 | 강한 타이포그래피 |
| V3 | Glassmorphism + floating gradient blobs | 모던 다크 |
| V4 | 교육 플랫폼 신뢰감 | 클린 라이트 |
| V5 | 게임 업계 특화 | 다크 + 액센트 컬러 |

병렬 디스패치의 장점은 단순하다. 순차로 5개를 만들면 한 시안이 끝날 때까지 다음이 기다린다. 병렬이면 5개가 동시에 진행된다. 전체 시간이 단일 시안 생성 시간에 수렴한다. 이 세션에서 Agent tool 사용 횟수가 28회인 이유가 여기 있다.

계획 파일은 `~/.claude/workflows/Users-jidong-fac058f9dd/current/plan.md`로 먼저 저장했다. 에이전트들이 같은 계획을 읽고 시작한다. 구두로 지시하면 에이전트마다 해석이 달라진다.

## Codex가 SRI 해시 버그를 잡아냈다

병렬 구현이 끝난 뒤 `design-reviewer`와 `code-verifier`를 돌렸다. V3에서 floating gradient blobs 블로커가 걸렸고, 즉시 수정했다.

그런데 Codex 교차검증에서 더 심각한 버그가 나왔다. V2/V3/V4/V5가 `react.production.min.js`를 로드하는데 SRI(Subresource Integrity) 해시는 `.development.js`용이었다. 브라우저가 무결성 검사에서 차단한다.

```html
<!-- 버그: production 파일에 development 해시가 붙어있음 -->
<script
  src="https://unpkg.com/react@18/umd/react.production.min.js"
  integrity="sha384-[development-build-hash]"
  crossorigin="anonymous"
></script>
```

이걸 사람 눈으로 잡기는 쉽지 않다. 파일명 형식도 맞고, 해시 포맷도 맞다. 그냥 대응하는 파일이 다른 것뿐이다. Codex가 독립적으로 코드를 검토하면서 잡아낸 케이스다. 교차검증이 있는 이유가 이거다.

## 마지막 피드백: 트렌드 변주만 있고 "전문성"이 없었다

5개 시안을 비교 캔버스로 열어두고 보니 문제가 보였다. 디자인 트렌드 변주만 했지 "전문 교육 서비스의 신뢰감"이 빠져있었다. 인프런, 클래스101, 패스트캠퍼스 톤을 다시 분석하고 재작업으로 이어졌다.

세션이 85시간 넘게 이어진 이유가 이거다. 코드 작성에 든 시간이 아니라, 방향을 잡고 검증하고 다시 방향을 잡는 루프에 든 시간이다. Claude Code는 실행 속도를 높여준다. 방향을 잡는 건 여전히 사람 몫이다.

## 숫자 정리

| 항목 | 세션 1 (크론) | 세션 2 (리디자인) |
|---|---|---|
| 소요 시간 | 7분 | 85시간 21분 |
| tool calls | 23 | 79 |
| 생성/수정 파일 | 6개 | 4개 수정, 3개 생성 |
| 주요 도구 | Read, Edit | Agent, Bash |

전체 도구 분포 (102 tool calls): Bash(29), Agent(28), Read(9), Edit(8), TaskUpdate(7), TaskCreate(6), ToolSearch(5), WebFetch(5).

크론 에이전트처럼 짧고 반복적인 작업은 Read → Edit 패턴으로 수렴한다. 병렬 디자인 작업은 Agent → Bash(검증) 패턴이다. 작업 성격에 따라 도구 분포가 달라지는 게 보인다.
