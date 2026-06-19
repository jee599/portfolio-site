---
title: "멀티에이전트로 버그 77건 발굴, 578→9 큐 붕괴 원인 추적: Claude Code 하루 337 tool calls"
project: "portfolio-site"
date: 2026-06-20
lang: ko
tags: [claude-code, multi-agent, workflow, bug-audit, llm-automation]
description: "6개 세션, 337 tool calls, 47개 파일 수정. 578개 후보가 9개로 붕괴된 버그를 추적하고, 멀티에이전트로 앱 버그 77건을 한 번에 감사한 하루 기록."
---

578개 후보 아이템이 큐에 9개만 남았다. 파이프라인 어딘가에서 데이터가 97% 사라졌는데 아무도 몰랐다.

**TL;DR** 어제 하루 6개 세션, 337 tool calls로 두 프로젝트의 고질적 버그를 잡았다. `local-commerce-agent`의 데이터 붕괴 원인을 추적했고, `preterview`는 멀티에이전트 워크플로우로 UI/UX 버그 77건을 한 번에 감사했다.

## 578이 9가 된 이유

`local-commerce-agent`는 로컬 크롤러가 비즈니스 타겟을 수집해 Codex가 큐를 만들고, 거기서 Gmail 초안을 생성하는 파이프라인이다. 크롤러가 578개 후보(95개 draft-quality)를 뽑았는데 실제 큐에는 9개밖에 없었다.

원인을 찾는 프롬프트는 이랬다:

```
improve the JDLab safe no-send cron/crawler/Codex-wrapper logic using the 
latest completed run evidence so future runs convert Hermes-local crawler 
evidence into a much larger, better diversified validated queue.
```

Bash 10번, Read 10번으로 아티팩트를 뒤진 결과가 나왔다. `_local_evidence/*.json`에는 578개 후보가 있었는데, Codex가 채우는 최상위 레인 배치 파일엔 15개 레인 중 11개가 비어 있었다. 큐 빌더는 최상위 배치만 읽기 때문에 로컬 증거 전체가 무시됐다.

해결책은 큐 빌더에 collapse guard를 추가하는 것이었다. 로컬 크롤 요약을 로드한 뒤 풀 크기와 레인 분포를 비교해 `approval_required` 플래그를 세우는 방식이다. `build-jdlab-hourly-queue.mjs`에 guard 로직, `jdlab-build-codex-cron-prompt.mjs`에 프롬프트 보강, 테스트 파일 1개 신규 생성. Edit 8번, Write 3번으로 마무리했다.

이후 Codex 독립 리뷰에서 MAJOR 로직 이슈 하나가 잡혔다. `isCopyBearing` 헬퍼가 없어서 copy-bearing 판단이 부정확했다. 별도 세션(세션 3, 7 tool calls)에서 Read 4번으로 컨텍스트 파악 후 헬퍼 추가로 끝냈다.

## 멀티에이전트 77건 버그 감사

`preterview`는 Next.js App Router 기반 AI 모의면접 SaaS다. 인터뷰 룸·이력서 빌더·포트폴리오·인증·결제·대시보드·관리자·랜딩·i18n까지 10개 도메인이 있다. 컴포넌트 약 9.4K줄 규모.

"자잘한 버그들 없나 모두 찾아봐"라는 프롬프트 하나로 워크플로우를 띄웠다. 구성은 이렇다.

도메인 10개를 병렬 finder 에이전트가 각각 담당하고, 각 발견 건마다 회의적 검증 에이전트가 실제 코드에 대조해 false positive를 걸러낸다. 결과를 중복 제거·우선순위로 종합하는 3단계 파이프라인.

결과: 77건 발견 → 21건 false positive 기각 → 56건 확정 → 병합 후 46건. 가장 많이 나온 패턴은 다국어 누락(영어 하드코딩)과 에러 핸들링 부재였다.

거기서 끝내지 않았다. "모든 방면으로 판단해서 고쳐야하는것만 고쳐"라는 프롬프트로 2차 검증 워크플로우를 돌렸다. 각 버그를 4개 렌즈(글로벌서비스/사용성/보안/토큰낭비)로 스코어링하고, 수정 시 사이드이펙트까지 분석했다. 최종 수정은 24건. Edit 57번, Bash 55번, Read 43번이 들어간 세션 2는 1시간 42분, 162 tool calls였다.

수정된 주요 파일: `InterviewRoom.tsx`, `auth-context.tsx`, `storage.ts`, `lib/format.ts`, `messages/en/*.json`, `messages/ko/*.json` 등 33개 파일.

## 도메인 오염 수정

세션 4는 전형적인 "맥락이 틀렸던" 케이스다. public 사이트 도메인(`jidonglab.com`)과 Gmail 발신자 alias(`jd@tryjdlab.com`)를 코드 전체에서 혼동하고 있었다. 12개 파일에 걸쳐 `tryjdlab.com`이 footer URL로 박혀 있었다.

수정 전략은 단순했다. 공개 URL 컨텍스트에서 `tryjdlab.com`을 `jidonglab.com`으로, 발신자 alias 컨텍스트는 그대로 유지. Bash 8번으로 전체 참조를 매핑하고, Edit 17번으로 12개 파일을 수정했다. 테스트 fixture까지 업데이트해서 회귀 가능성을 차단했다.

## 사업계획서 + 지원사업 분석 5시간

세션 5는 결이 다른 작업이었다. `local-commerce-agent`(치과광고 자동화)와 `preterview` 두 아이템에 대해 기술사업분석서 2개, 지원사업 핏 분석 1개, 사업계획서 2개, 공고분석 체크리스트 1개, 총 6개 문서를 만들었다.

`~/funding/`에 57개 프로그램을 검증해둔 이전 리서치(2일 전)가 있었다. 재사용해서 지원사업 핏 분석은 기존 데이터 위에 두 아이템 매칭으로 좁혔다. 신규 검색 없이 기존 자산 활용. 완성된 문서 6개는 Hermes를 통해 텔레그램으로 전송했다. Bash 33번, Write 9번, TaskCreate 9번.

## preterview GTM 분석, Product Hunt 판단

세션 6은 "어디에 어떻게 팔아야 하나, Product Hunt에 올려야 되나"라는 질문이었다.

이미 6/18자 GTM 플레이북이 존재했다. 25개 리서치 에이전트, 16개 수치 팩트체크로 만든 문서. 거기서 Product Hunt는 "채널 4 · SECONDARY · 1일 스파이크"로 이미 다뤄져 있었다. 재조사 대신 2026년 기준 PH 현실 검증 워크플로우(12개 에이전트, 적대적 팩트체크 포함)를 돌렸다.

결론: Product Hunt는 지금/첫 채널이 아니다. 2026년 PH 성과는 초기 팬베이스 유무와 런치 당일 집중 드라이브에 달려 있다. 커뮤니티 없이 올리면 top 10 진입 확률이 낮다. 먼저 Hacker News Show HN, 관련 Reddit 커뮤니티, Discord 서버로 초기 사용자를 모으는 게 선행이다.

적대적 팩트체크가 핵심 결론은 모두 supported로 확인했고, 과장 수치 몇 개(2016년 데이터, 측정값이 아닌 통설)를 정정했다.

## 하루 수치

| 항목 | 수치 |
|---|---|
| 세션 수 | 6 |
| 총 소요 시간 | 약 8시간 |
| tool calls | 337 |
| 수정 파일 | 47개 |
| 생성 파일 | 14개 |
| 도구별 | Bash 116, Edit 87, Read 81, Write 14, Workflow 5 |

세션 2 혼자 162 tool calls였다. 멀티에이전트 워크플로우가 Bash/Edit/Read를 대량으로 소비하는 구조다. 단일 세션으로는 가장 무거운 작업이었지만, 10개 도메인을 직접 순차 리뷰했으면 훨씬 오래 걸렸을 거다.
