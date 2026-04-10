---
title: "writing-plans 스킬 하나로 288페이지 SEO 구현 계획을 10분 만에 뽑아낸 방법"
project: "saju_global"
date: 2026-04-10
lang: ko
tags: [claude-code, planning, seo, superpowers, writing-plans]
description: "288개 SEO 랜딩 페이지 구현 계획을 Claude Code writing-plans 스킬로 10분 만에 완성했다. 23번의 tool call, 13번의 Read, 3개 병렬 에이전트. 계획 없이 코딩하면 더 느리다."
---

288개 페이지를 직접 짜달라고 했으면 몇 시간이 걸렸을 것이다. 계획을 먼저 뽑아달라고 하니 10분 만에 끝났다.

**TL;DR** `writing-plans` 스킬을 쓰면 Claude Code가 코드베이스를 먼저 파악하고 실행 가능한 계획을 만든다. 구현 전에 계획을 뽑는 이 과정이 결국 전체 작업을 빠르게 한다.

## 288페이지 SEO, 어디서 시작할까

사주 앱(`saju_global`)에 궁합 SEO 랜딩 페이지가 필요했다. 12간지 × 12간지 = 144 조합, 남녀 방향 포함하면 288페이지. 스펙 문서는 있었지만 어떤 파일을 건드려야 하는지, 기존 패턴과 어떻게 맞춰야 하는지는 알 수 없었다.

프롬프트는 단순했다:

```
saju_global 프로젝트에서 SEO 궁합 랜딩 288페이지를 구현해줘.
스펙: docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md
```

여기서 바로 구현에 들어가면 실패한다. Claude Code가 선택한 것은 `writing-plans` 스킬이었다.

## writing-plans 스킬이 하는 일

스킬이 로드되면 Claude Code는 구현 전에 전체 컨텍스트를 수집한다. 이번 세션에서 23번의 tool call 중 Read가 13번, Glob이 4번이었다. 코드베이스 파악에 세션의 절반 이상을 썼다는 뜻이다.

에이전트도 3개 병렬로 띄웠다. 각 에이전트가 독립적으로 코드베이스를 탐색하고 결과를 합쳤다. 라우팅 패턴, 기존 SEO 컴포넌트 구조, 콘텐츠 컬렉션 스키마를 동시에 파악한 것이다.

수집한 정보를 바탕으로 만든 계획에는 이런 항목이 들어간다:

- 건드려야 할 파일 목록과 변경 이유
- 단계별 실행 순서 (DRY, YAGNI 기준)
- 테스트 방법
- 커밋 단위 분리 기준

"zero context"를 가정하고 쓴다는 게 이 스킬의 핵심이다. 나중에 이 계획으로 다른 에이전트를 돌려도 문제없이 따라갈 수 있어야 한다.

## 스펙 파일을 못 찾아도 포기하지 않는다

첫 번째 시도에서 Claude Code는 스펙 파일을 찾지 못했다. 경로가 달랐던 것이다. 여기서 멈추지 않고 Glob으로 직접 탐색했다. `docs/superpowers/specs/` 디렉토리를 스캔해서 실제 파일을 찾아냈다.

에러가 났을 때 사용자에게 묻는 대신 자력으로 해결한 케이스다. CLAUDE.md에 "Do not ask questions. Make decisions and proceed."가 있는 덕분이다.

## 나온 결과물

10분, 23번의 tool call로 나온 것:

- **생성 파일**: 1개 (`docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md`)
- **수정 파일**: 0개

파일 하나만 생성했지만 그 파일이 이후 구현 세션 전체를 가이드한다. 계획 없이 288페이지 구현에 바로 들어갔다면 중간에 방향을 잃고 리팩토링을 반복했을 것이다.

세션 마지막에 Claude Code가 물었다: "Subagent-Driven으로 할까, Inline Execution으로 할까?" 계획이 완성됐으니 이제 실행 방식만 결정하면 된다.

## 계획 세션을 분리하는 이유

코딩 에이전트의 흔한 실패 패턴이 있다. 요청을 받자마자 파일을 수정하고, 중간에 방향이 틀어지고, 롤백하거나 처음부터 다시 시작한다. 컨텍스트가 긴 세션일수록 이 문제가 심해진다.

`writing-plans` → `executing-plans`로 세션을 분리하면 각 세션이 단일 책임을 갖는다. 계획 세션은 계획만, 실행 세션은 실행만. 계획이 틀렸으면 파일 수정 없이 계획만 고치면 된다.

도구 사용 통계: Read 13, Glob 4, Agent 3, Skill 1, Bash 1, Write 1. 총 23 tool calls.
