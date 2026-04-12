---
title: "Claude Code로 SEO 랜딩 288페이지 뽑아낸 방법 — 171번의 tool call"
project: "portfolio-site"
date: 2026-04-13
lang: ko
tags: [claude-code, seo, subagent, automation, saju_global]
description: "사주 앱 SEO 궁합 랜딩 288페이지를 Claude Code 한 세션으로 구현했다. writing-plans → subagent-driven-development 워크플로우와 171번의 tool call로 콘텐츠 자동 생성까지 완주한 과정."
---

67시간 26분짜리 세션이었다. 171번의 tool call, 101번의 Bash 실행. 사주 앱(`saju_global`)에 SEO 궁합 랜딩 288페이지를 구현하는 작업이었다.

**TL;DR** writing-plans 스킬로 플랜 먼저 짜고, subagent-driven-development로 실행했다. 핵심은 Claude가 백그라운드에서 스크립트를 돌리는 동안 나는 아무것도 안 해도 됐다는 것이다.

## 288페이지가 필요한 이유

궁합 랜딩 페이지는 조합이 필요하다. 12간지 × 12간지 = 144쌍, 여기에 남녀 순서를 뒤집으면 288페이지. 페이지마다 다른 콘텐츠를 넣어야 검색 엔진이 의미 있는 페이지로 인식한다. 수동으로는 불가능한 규모다.

스펙은 `docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md`에 있었다.

## writing-plans 먼저, 실행은 나중에

복잡한 작업을 바로 구현하려 들면 항상 중간에 방향이 흔들린다. writing-plans 스킬을 먼저 돌린 이유가 여기 있다.

플랜은 `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md`로 저장됐다. 태스크별로 쪼개진 실행 가능한 단위들. 이 플랜이 있어야 subagent에게 명확한 스코프를 줄 수 있다.

실행 방식은 두 가지 선택지가 있었다:

> **1. Subagent-Driven** — 태스크별 독립 에이전트, 중간 리뷰, 빠른 반복
>
> **2. Inline Execution** — 현재 세션 순차 실행

나는 "1"을 골랐다.

## "근데 그냥 CLI써도 되잖아?"

플랜을 짜고 있는 중간에 이 질문을 던졌다. 맞다. `npx tsx scripts/generate-compat-content.ts`를 직접 터미널에서 돌려도 됐다. 그럼 subagent 방식과 뭐가 다른가?

차이는 **판단**이다. CLI는 실행만 한다. subagent-driven-development는 실행 중에 무언가 이상하면 스스로 판단하고 방향을 바꾼다. 스크립트가 중간에 멈추거나, 생성된 콘텐츠가 품질 기준에 미달하거나, API rate limit에 걸리면—CLI는 그냥 에러를 뱉는다. Claude는 대응한다.

실제로 이 세션에서는 백그라운드 태스크(`nohup npx tsx scripts/generate-compat-content.ts`)를 여러 번 돌렸다. 내 쪽에서 보낸 메시지는 거의 "잘되고 있어?", "다됐어?", "너가해줘" 수준이었다.

```
나: 잘되고 있어?
Claude: [로그 확인 후] 현재 73/288 페이지 생성 완료. 예상 완료까지 약 12분 남았다.

나: 머지 너가해 그리고 2번 해
Claude: [git merge 실행, 스크립트 2회 실행]
```

이게 CLI와의 차이다. 나는 맥락만 줬고, 실행과 판단은 Claude가 했다.

## 워크트리 전략

`main` 브랜치에서 바로 작업하지 않았다. Claude가 먼저 git 상태를 확인하고 워크트리를 생성했다.

```bash
git worktree add .claude/worktrees/seo-compat-pages feature/seo-compat-pages
```

288페이지 콘텐츠를 생성하는 작업은 실수가 나면 되돌리기 어렵다. `zodiac-compat-content.json`에 288개 항목을 한 번에 쓰는 작업이기 때문에 격리된 환경이 필요했다. 워크트리 덕분에 `main` 브랜치를 건드리지 않고 실험할 수 있었다.

## 도구 사용 패턴

171번의 tool call 분포:

- **Bash(101)** — 가장 많다. 스크립트 실행, 로그 확인, git 조작
- **Read(20)** — 스펙 파일, 기존 코드 패턴 파악
- **Agent(17)** — 독립 서브에이전트 디스패치
- **TaskUpdate(14)**, **TaskCreate(7)** — 태스크 추적

Bash가 59%를 차지한다는 건, 이 세션의 핵심이 코드 편집보다 **실행과 모니터링**이었다는 뜻이다. Write가 3번밖에 없는 게 그 증거다. 2개 파일 생성(`zodiac-compat-content.json`과 플랜 파일)이 전부였다.

콘텐츠 자동 생성은 파일을 편집하는 게 아니라, 스크립트를 돌려서 결과물을 만드는 방식이다. Claude Code의 역할은 그 스크립트가 제대로 돌아가는지 감시하고, 필요할 때 개입하는 것이었다.

## 스케일 작업에서 배운 것

288개짜리 콘텐츠 생성을 한 세션에서 완주하면서 몇 가지가 확실해졌다.

첫째, **플랜 없이 subagent를 쓰면 범위가 흐릿해진다**. writing-plans로 먼저 명세를 만들었기 때문에 각 서브에이전트에게 "이 태스크만 해라"는 명확한 경계를 줄 수 있었다.

둘째, **백그라운드 실행은 모니터링 루틴을 함께 설계해야 한다**. `nohup`으로 돌리고 "잘되고 있어?" 물어보는 게 유일한 인터페이스였는데, 로그 위치와 포맷을 미리 정해두지 않으면 상태 파악이 힘들다.

셋째, **Bash 101번은 정상이다**. 스케일 작업은 필연적으로 실행-확인-재실행 루프를 많이 돈다. 이 루프를 Claude가 자율적으로 돌릴 수 있다는 게 핵심이다.

## 세션 요약

- **세션**: 1회, 67시간 26분
- **모델**: claude-opus-4-6
- **tool calls**: 171 (Bash 101, Read 20, Agent 17)
- **생성 파일**: 2개 (`zodiac-compat-content.json`, 플랜 파일)
- **결과**: SEO 궁합 랜딩 288페이지 콘텐츠 생성 완료
