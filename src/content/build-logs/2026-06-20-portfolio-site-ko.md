---
title: "Claude Code 하루 7세션: Workflow로 버그 77건 감사, 578→9 파이프라인 붕괴 추적"
project: "portfolio-site"
date: 2026-06-20
lang: ko
tags: [claude-code, multi-agent, workflow, bug-audit, llm-automation]
description: "7개 세션, 338 tool calls, 47개 파일 수정. 578개 후보가 9개로 붕괴된 버그를 추적하고, Workflow로 Next.js 버그 77건을 한 번에 감사한 하루 기록. 구체적 숫자와 프롬프트 포함."
---

578개 후보 아이템이 큐에 9개만 남았다. 파이프라인 어딘가에서 데이터가 97% 사라졌는데 아무도 몰랐다.

**TL;DR** 하루 7개 세션, 338 tool calls로 5개 프로젝트를 동시 진행했다. `local-commerce-agent` 데이터 붕괴 원인을 추적했고, `preterview`는 Workflow로 UI/UX 버그 77건을 한 번에 감사했다. 치과 정기측정은 에이전트 위임 1 tool call로 끝냈다.

## 578이 9가 된 이유

`local-commerce-agent`는 로컬 크롤러가 비즈니스 타겟을 수집해 Codex가 큐를 만들고, 거기서 Gmail 초안을 생성하는 파이프라인이다. 크롤러가 578개 후보(95개 draft-quality)를 뽑았는데 실제 큐에는 9개밖에 없었다.

진단 프롬프트는 이랬다:

```
improve the JDLab safe no-send cron/crawler/Codex-wrapper logic using the latest
completed run evidence so future runs convert Hermes-local crawler evidence into a
much larger, better diversified validated queue.
```

Bash 10번, Read 10번으로 아티팩트를 병렬로 뒤졌다. `_local_evidence/*.json`에는 578개 후보가 있었는데, Codex가 채우는 최상위 레인 배치 파일엔 15개 레인 중 11개가 비어 있었다. 큐 빌더는 최상위 배치만 읽으니 로컬 증거 전체가 무시됐다.

해결: `build-jdlab-hourly-queue.mjs`에 collapse guard 추가. 로컬 크롤 요약을 풀 크기·레인 분포와 비교해 `approval_required` 플래그를 세운다. `jdlab-build-codex-cron-prompt.mjs`에 프롬프트 보강, 테스트 파일 1개 신규 생성. Edit 8번, Write 3번으로 마무리. 9min, 32 tool calls.

세션 3에서 독립 Codex 리뷰가 MAJOR 로직 이슈를 추가 발견했다. `isCopyBearing` 헬퍼가 없어서 copy-bearing 판단이 부정확했다. Read 4번으로 컨텍스트 파악 후 헬퍼 추가. 7 tool calls.

## Workflow로 Next.js 버그 77건을 한 번에

`preterview`는 Next.js App Router 기반 AI 모의면접 SaaS다. 인터뷰 룸·이력서 빌더·포트폴리오·인증·결제·대시보드·관리자·랜딩·i18n까지 10개 도메인, 컴포넌트 ~9.4K줄 규모다. 수동으로 훑기엔 너무 크다.

프롬프트 하나로 워크플로우를 띄웠다:

```
preterview ui/ux나 기능상에 자잘한 버그들 없나 모두 찾아봐
```

Claude Code가 구조를 파악한 뒤 Workflow를 자동 설계했다. **도메인별 10개 finder 병렬 실행 → 각 발견 건마다 회의적 검증 에이전트가 실제 코드에 대조 → false positive 제거 → 중복 병합·우선순위 정렬**. finder가 도메인 A를 보는 동안 도메인 B의 검증이 이미 돌고 있다.

결과: 77건 발견 → 21건 기각 → 56건 확정 → 병합 후 46건. severity는 high 2, medium 8, low 26, nit 10. 가장 많이 반복된 패턴은 다국어 누락(영어 사용자에게 한국어 텍스트 노출)이었다.

거기서 끝내지 않았다:

```
고쳐야하는 것들 모두 진짜 고쳐야하는지, 고치고 나서 사이드 이슈는 없는지,
중요한 순으로 일단 모두 검증해줘
글로벌 서비스 / 유저사용성 / 보안 / 토큰 낭비는 없는지
```

2차 Workflow를 하나 더 띄워 55건 각각을 **글로벌/사용성/보안/토큰낭비** 4개 렌즈로 재채점하고, 수정 시 사이드이펙트까지 분석했다. "모든 방면으로 판단해서 고쳐야하는것만 고쳐"로 최종 확정. 24건 수정, `InterviewRoom.tsx`·`auth-context.tsx`·`storage.ts`·`lib/format.ts`·`messages/en/*.json` 등 33개 파일 변경. 세션 1h 42min, 162 tool calls.

## 에이전트에 에이전트를 위임하다

동백유디치과 정기측정은 이 프롬프트 하나였다:

```
동백유디치과(dongbaek-uddental) 정기 측정이다.
dental-clinic 서브에이전트에 위임해 수행하라.
```

메인 Claude가 `dental-clinic` 에이전트를 띄우고, 에이전트가 `~/dental-promo/dongbaek-uddental/` 아래 `clinic.json`·`history.json`·`cache`를 읽어 컨텍스트를 복원한 뒤 처음부터 끝까지 수행했다. SERP 6키워드 실측(차단 0) → inbox `place-stats-2026-06-19.md` 판독 → `history.json` 갱신 → `sync.sh` → 커밋·푸시.

부가 결과: 발행 블로그 첫 글이 `동백 임플란트` 키워드에서 7위로 첫 검색 진입(인덱싱 +1일 조기). 메인 세션에서 쓴 tool call은 `Agent` 1번뿐이다.

## 도메인 오염 수정 — 조용히 퍼진 버그

세션 4는 전형적인 "맥락이 틀렸던" 케이스다. public 사이트 도메인(`jidonglab.com`)과 Gmail 발신자 alias(`jd@tryjdlab.com`)를 코드 전체에서 혼동하고 있었다. 12개 파일에 `tryjdlab.com`이 footer URL로 박혀 있었다.

Bash 8번으로 전체 참조를 매핑하고, Edit 17번으로 12개 파일 수정. 공개 URL 컨텍스트에서 `tryjdlab.com`을 `jidonglab.com`으로, 발신자 alias는 그대로. 테스트 fixture까지 업데이트해서 회귀 차단. 4min, 39 tool calls.

## 사업계획서 6개를 하루에

세션 6은 결이 달랐다. `local-commerce-agent`(치과광고 자동화)와 `preterview` 두 아이템에 대해 기술사업분석서 2개, 사업계획서 2개, 지원사업 핏 분석 1개, 공고분석 체크리스트 1개 — 총 6개 문서. 완성된 문서는 hermes를 통해 텔레그램으로 전송했다.

한 가지 관찰: `~/funding/`에 57개 프로그램 검증 데이터(이틀 전 작업)가 있었다. Claude Code가 그걸 먼저 찾아 재활용했다. 신규 리서치 없이 기존 데이터 위에 두 아이템 매칭으로 좁혔다. 5h 30min, 88 tool calls.

## 하루 수치

| 항목 | 수치 |
|---|---|
| 세션 수 | 7 |
| 총 tool calls | 338 |
| 수정 파일 | 47개 |
| 생성 파일 | 14개 |
| 도구별 | Bash 116, Edit 87, Read 81, TaskUpdate 18, Write 14, Workflow 5 |

세션 2 혼자 162 tool calls였다. Workflow가 Bash/Edit/Read를 대량으로 소비하는 구조다. 10개 도메인을 직접 순차 리뷰했으면 훨씬 오래 걸렸을 거다. 병렬성이 핵심이다 — finder A가 탐색하는 동안 finder B의 검증이 이미 돌고 있다.
