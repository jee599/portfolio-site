---
title: "홈페이지 리디자인: 탐색 4세션·58 tool calls 후 워크트리에서 구현"
project: "portfolio-site"
date: 2026-06-02
lang: ko
tags: [claude-code, redesign, worktree, astro, portfolio]
description: "jidonglab 홈페이지를 'personal logbook'에서 'product-studio 피치'로 바꿨다. 탐색 4세션 58 tool calls 후 워크트리로 메인 브랜치를 보호하며 컴포넌트 10개 수정, 2개 신규 생성."
---

실제 파일을 건드리기 전까지 4개 세션, 58번의 tool call을 탐색에만 썼다. 파일 수정이 0줄인 세션이 4개 연속으로 나왔다.

**TL;DR** jidong.lab 홈페이지 방향을 "personal logbook"에서 "product-studio 피치"로 전환했다. 구현은 `claude/jidonglab-redesign-compare` 워크트리에서만 진행해 메인 브랜치를 보호했다. 최종 구현 세션에서 Edit 28회, Read 24회, Bash 21회로 컴포넌트 10개 수정 + 2개 신규 생성.

## 탐색 세션이 4개 연속으로 나온 이유

세션 6, 7, 8, 9는 전부 구조 읽기로 끝났다. 매번 같은 패턴 — 파일 트리 확인 → 컴포넌트 읽기 → 데이터 레이어 확인 → 세션 종료. 수정 없음.

원인은 Hermes 릴레이 구조였다. 작업 지시가 Hermes 크론 잡을 통해 들어오는데, `jidonglab_portfolio_redesign_brief.md`를 `/tmp`에 올리고 프롬프트를 전달하는 방식이다. 문제는 초기 세션들의 프롬프트가 분석 중심이었다는 것이다. "현재 상태를 파악하고 리디자인 계획을 세워라" 수준의 지시에서는 탐색 후 제안으로 끝났다.

실제 구현이 시작된 건 프롬프트에 "Do not only propose a plan"이 명시적으로 들어간 세션 8부터다. 그리고 실제로 파일을 건드린 건 워크트리가 분리된 세션 13이다.

Claude Code에서 구현을 원하면 지시에 명시해야 한다. "분석해줘"와 "구현해줘"는 결과가 다르다.

## 워크트리로 메인 브랜치 보호

구현 전에 한 가지 결정이 있었다. 메인 브랜치에서 직접 작업할지, 워크트리를 분리할지.

선택은 워크트리였다. `portfolio-site-claude-redesign/` 디렉토리를 `claude/jidonglab-redesign-compare` 브랜치로 생성하고 모든 구현을 거기서 진행했다. `main`은 처음부터 끝까지 건드리지 않았다.

리디자인처럼 방향이 크게 바뀌는 작업에서 워크트리 분리는 실용적인 선택이다. 마음에 안 들면 워크트리만 삭제하면 된다. 원본이 남아있어서 비교도 된다. "배포할지"는 구현이 끝난 후 별개로 결정할 수 있다.

## Doctor fix가 먼저였다

워크트리 세션을 시작하자마자 `/doctor` 리포트에서 경고가 떴다.

```
hooks.SessionStart.0.hooks: Expected array, but received object
```

`SessionStart` 훅이 구버전 flat 포맷을 쓰고 있었다. Claude Code가 훅 그룹 구조를 업데이트하면서 생긴 포맷 불일치다.

```json
// 이전 (flat)
{ "command": "bash protect-files.sh" }

// 이후 (group)
{ "hooks": [{ "command": "bash protect-files.sh" }] }
```

`.claude/settings.json`이 `protect-files.sh`에 의해 보호 파일로 잡혀 있어서 수정 전에 확인 요청이 왔다. 허용하고 패치했다. 구현 작업 전에 환경 문제를 먼저 정리하는 게 맞다.

## "logbook"에서 "pitch"로

기존 홈페이지는 "paper/ink editorial logbook" 스타일이었다. 정갈하고 개인적인 톤인데, 클라이언트나 협업자가 봤을 때 "이 사람이 뭘 할 수 있는지"가 한눈에 안 들어왔다.

리디자인 브리프의 핵심:

> "Redesign so it works as Jidong's personal portfolio/business-card site, not a passive project archive."

방향을 잡은 뒤 컴포넌트별로 수정 작업을 진행했다.

`Hero.tsx`는 타이틀 카피를 바꿨다. 기술 나열이 아니라 "어떤 문제를 해결하는 사람인가"를 앞에 세우는 방식으로. `Capabilities.astro`는 기술 스택 목록에서 "어떤 결과를 만들 수 있는가"로 재편했다. `About.astro`는 이력서 톤에서 협업 제안 톤으로 전환했다.

신규로 추가된 컴포넌트 두 개가 변화의 핵심이다.

`Contact.astro`는 처음부터 없었다. CTA가 없는 포트폴리오 사이트였다. 보는 사람이 "연락하고 싶은데 어떻게 하지"를 찾아야 했다. 이걸 섹션으로 만들어서 명시적으로 배치했다.

`Method.astro`는 작업 방식을 설명하는 섹션이다. "어떻게 일하는 사람인가"를 보여주는 것. 프로젝트 목록보다 이게 협업 판단에 더 직접적인 정보다.

`home.ts` 데이터 레이어도 함께 수정했다. 컴포넌트가 받아가는 문자열들을 새 방향에 맞게 전부 업데이트했다.

## 구현 세션 도구 사용

세션 13, 92 tool calls.

| 도구 | 횟수 |
|---|---|
| Edit | 28 |
| Read | 24 |
| Bash | 21 |
| Write | 5 |
| TaskCreate | 5 |

Read가 24회로 높다. Astro + React 혼용 구조에서 props 흐름과 컴포넌트 간 의존성을 계속 확인해야 한다. 한 컴포넌트를 바꾸면 데이터 레이어부터 타입 정의까지 연쇄가 생긴다. TaskCreate 5개는 `npm ci` 설치, 빌드 확인, 변경 파일 검증 같은 백그라운드 태스크들이다.

Bash 21회 중 절반 이상이 빌드 체크였다. `npm run build`를 중간중간 돌려서 타입 에러나 Astro 컴파일 오류를 즉시 잡는 방식으로 진행했다. 마지막에 한꺼번에 고치는 것보다 빌드를 자주 돌리는 게 결국 빠르다.

## 탐색 58번의 실제 가치

탐색 세션 4개는 낭비처럼 보이지만, 구현 세션에서 Read가 24회로 비교적 적게 나온 게 그 흔적이다. 같은 파일을 다시 읽어야 하는 상황이 줄었다.

세션 컨텍스트는 공유되지 않는다. 각 세션이 독립적으로 시작된다. 그런데도 구현 세션이 탐색 없이 빠르게 Edit으로 넘어갈 수 있었던 건, 브리프가 이미 탐색 결과를 반영해서 구체화돼 있었기 때문이다. Hermes가 브리프 파일을 계속 업데이트하면서 컨텍스트를 이어붙인 셈이다.

> 탐색에 쓴 58번의 tool call은 구현 세션의 Read 횟수를 낮추는 데 쓰였다.

---

변경 사항은 `claude/jidonglab-redesign-compare` 브랜치에 있다. 로컬 확인 후 머지 여부를 결정한다. 워크트리 전략의 목적은 여기 있다 — 구현 완료와 배포 결정은 별개다.
