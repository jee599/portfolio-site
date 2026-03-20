---
title: "CLAUDE.md 한 줄로 144명 에이전트 활성화 — AgentCrow 세팅과 다크 테마 리디자인"
project: "portfolio-site"
date: 2026-03-21
lang: ko
tags: [claude-code, agentcrow, agents, dark-theme, automation]
description: "치과 프로젝트 작업 중 에이전트 글로벌 규칙을 CLAUDE.md에 박았다. npx agentcrow init 한 번으로 144개 에이전트가 생겼고, 이후 모든 프로젝트 작업 방식이 바뀌었다."
---

치과 프로젝트 세션이 1시간 53분째 이어지고 있었다. 보톡스 섹션 업데이트, 의료진 진료 일정 추가, 디자인 에이전트 5명 병렬 dispatch로 UI를 개선하는 240번의 tool call이 쌓이고 있었다.

그 중간에 이 한 마디가 나왔다.

"global로 agent teams 켜줘. 그리고 global md에 작업하기 전에 작업에 알맞는 에이전트 최대 4명 고용해서 작업하라고 해줘. agent 미리 정의 해놓은거 100개 넘게 있지?"

치과 프로젝트 얘기가 아니었다. 작업 방식 자체를 바꾸겠다는 얘기였다. 그리고 이 변화는 portfolio-site에 곧바로 영향을 미쳤다.

**TL;DR** — `~/.claude/CLAUDE.md`에 에이전트 투입 규칙을 박고, `npx agentcrow init`으로 144개 에이전트를 초기화했다. 이후 portfolio-site 다크 테마 리디자인이 첫 실전 투입이었다.

## ~/.claude/CLAUDE.md — 글로벌 설정이란 게 있다

Claude Code에서 CLAUDE.md는 두 종류다. 프로젝트 루트의 CLAUDE.md는 그 프로젝트에만 적용된다. 그런데 `~/.claude/CLAUDE.md`는 다르다. Claude Code를 열 때마다 자동으로 로드된다. 어떤 프로젝트를 열든 상관없이.

`update-config` 스킬을 호출해서 settings.json 훅을 설정하고, 글로벌 CLAUDE.md에 규칙을 추가했다:

```
작업을 시작하기 전에, 해당 작업에 적합한 에이전트를 최대 4명까지 병렬로 고용해서 동시에 작업한다.
- 파일 수정이 겹치지 않는 독립적인 작업은 반드시 병렬 에이전트로 분배한다.
- 리서치/탐색 작업과 코드 수정 작업을 분리해서 병렬로 돌린다.
- UI 감사, 디자인 비평, 코드 리뷰 같은 검증 작업도 에이전트에 위임한다.
```

이 규칙은 글로벌이다. portfolio-site든, spoonai든, 치과 프로젝트든 Claude Code를 쓰는 모든 프로젝트에 적용된다. 매번 프로젝트마다 따로 설정할 필요가 없다. 한 번 박으면 어디서나 작동한다.

## npx agentcrow init — 144명이 대기 중이다

글로벌 규칙을 세웠으면, 에이전트 풀이 있어야 한다.

`npx agentcrow init`을 실행하면 `.claude/agents/` 디렉토리에 에이전트 정의 파일들이 생성된다. 144개. 각 파일은 특정 역할의 에이전트를 정의한 마크다운이다. 어떤 작업을 어떻게 처리하는지, 어떤 도구를 쓰는지, 어떤 관점에서 판단하는지가 담겨 있다.

`frontend_developer`, `qa_engineer`, `security_auditor_deep`, `korean_tech_writer`, `ui_designer`, `ux_researcher`. 이런 이름들이 144개 있다.

portfolio-site의 `.claude/CLAUDE.md`에는 이미 AgentCrow dispatch 규칙이 있었다:

```
🐦 AgentCrow — dispatching N agents:
1. @agent_role → "task description"
2. @agent_role → "task description"
```

이 포맷으로 에이전트가 병렬 실행된다. `npx agentcrow init` 이전에는 에이전트 이름만 있고 실제 행동 방식이 정의되어 있지 않았다. init 이후엔 각자가 어떻게 작업하는지가 명확해진다.

주목할 점은 이 에이전트 파일들이 단순한 역할 이름이 아니라는 것이다. 실제 작업 지침이 담겨 있다. `frontend_developer`에는 TypeScript 우선, React + Next.js, 함수형 컴포넌트 같은 구체적인 코딩 방식이 정의되어 있다. 에이전트를 dispatch하면 그 지침대로 작업이 진행된다.

## 다크 테마 리디자인 — 에이전트 첫 실전 투입

세팅이 끝나고 바로 portfolio-site 다크 테마 작업이 들어왔다.

기존 레이아웃은 toss.tech 스타일 라이트 테마 기반이었다. `BaseLayout.astro`를 리디자인하고 `global.css`에 다크 테마를 완성하는 작업이었다. developer portfolio 톤으로, 액센트 색상 `#00c471`을 유지하면서 전체적인 분위기를 바꾸는 것이다.

에이전트 없이 혼자 작업하면 순차적으로 진행했을 것이다. 현재 구조 파악 → 디자인 설계 → 구현. 이 흐름이 자연스럽지만, 탐색과 구현이 같은 컨텍스트에 쌓이면 길어진다.

에이전트를 쓰면 분리된다. 리서치 에이전트가 현재 `BaseLayout.astro`와 `global.css` 구조를 파악하는 동시에, UI 에이전트가 다크 테마 설계를 시작한다. 서로 다른 파일을 읽는 작업이라 충돌이 없다.

결과적으로 커밋 2개가 순서대로 나왔다:

```
feat: 다크 테마 리디자인 — developer portfolio 톤
feat: Base layout + global.css 다크 테마 완성
```

단계별로, 충돌 없이.

## 이 빌드 로그도 Claude Code가 쓴다

지금 이 글 자체가 한 가지 사실을 보여준다.

28세션에 걸친 작업 기록이 있다. 세션마다 어떤 프롬프트를 던졌는지, 어떤 도구를 몇 번 사용했는지, 어떤 파일이 바뀌었는지. 이 데이터에서 portfolio-site 관련 작업만 추려내고, `blog-writing` 스킬 가이드라인에 맞게 변환하고, 파일로 저장하는 것까지 Claude Code가 한다.

사람이 하는 일은 "portfolio-site 빌드 로그 작성해라"는 프롬프트 하나다.

`blog-writing` 스킬을 호출하고, 세션 요약에서 portfolio-site 관련 작업을 추려내고, 글을 쓰고, Write 도구로 파일을 생성하는 흐름이 자동으로 이어진다. CLAUDE.md 글로벌 규칙에 따라 필요하면 에이전트도 투입된다.

이게 가능한 이유는 작업 방식 자체를 설계했기 때문이다. 글로벌 규칙, 에이전트 풀, 스킬 라이브러리. 이 세 가지가 갖춰지면 Claude Code는 단순 코드 에디터가 아니라 작업 파이프라인이 된다.

프롬프트 한 줄이 28세션 분량의 작업 기록을 블로그 포스트 하나로 만들어낸다. 걸리는 시간은 몇 분이다.

> CLAUDE.md 한 줄이 모든 프로젝트를 바꾼다. 그 한 줄을 언제 어떻게 넣느냐가 진짜 세팅이다.
