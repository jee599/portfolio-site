---
title: "같은 버그를 5번 고쳤다 — Claude Code Systematic Debugging과 디자인 스킬 활용"
project: "portfolio-site"
date: 2026-04-10
lang: ko
tags: [claude-code, debugging, design, mobile, spoonai]
description: "spoonai.me 모바일 horizontal scroll 버그를 5번 고쳤다. 증상만 패치하다가 root cause를 못 잡은 과정, Systematic Debugging 스킬과 디자인 스킬로 전면 리디자인까지 17 세션 892 tool calls."
---

모바일 horizontal scroll 버그를 5번 고쳤다. 매번 "이번엔 진짜 고쳤다"고 생각했는데 다음 세션에 또 같은 버그 제보가 들어왔다.

**TL;DR** 증상 패치는 root cause를 숨길 뿐이다. Claude Code Systematic Debugging 스킬을 적용하고 나서야 실제 원인을 찾았다. 같은 기간에 ui-ux-pro-max + frontend-design 스킬로 전면 리디자인까지 17 세션, 총 892 tool calls를 썼다.

## 5번 고쳤는데 안 고쳐진 이유

세션 1에서 처음 수정했다. `html, body { overflow-x: clip }` 추가. 배포됐다고 생각했는데 다음 날 또 같은 제보가 왔다.

세션 2에서 다시 수정했다. `overflow-x: hidden`으로 바꾸고, 전역 `img { max-width: 100% }` 추가. 또 배포했다.

세션 6, 세션 8, 세션 11 — 세 번 더 같은 문제를 잡았다. 매번 다른 곳을 고쳤다고 생각했지만 실제로는 다른 증상을 새로 만들고 있었다.

근본 원인이 두 가지였다.

첫 번째는 `overflow-x: clip`과 iOS Safari 호환성이었다. `clip` 값은 Safari 16 이전에서 지원되지 않아 `visible`로 fallback된다. 즉, iOS 15 이하 기기에서는 overflow 클리핑이 전혀 안 됐다. `hidden`으로 바꿨어야 했는데, 그것도 모바일에서 `html` 요소 자체를 스크롤 컨테이너로 만들어버리는 문제가 있었다.

두 번째는 컴포넌트 내부의 네거티브 마진이었다. `HomeContent.tsx`의 카테고리 탭에 `-mx-5 px-5` 패턴이 있었다. 탭 배경을 부모 패딩 바깥까지 확장하려는 의도인데, 이게 모바일에서 뷰포트를 16px 초과하는 영역을 만들고 있었다. `BlogList.tsx`에도 `-mx-4` 네거티브 마진이 같은 문제를 일으켰다.

세션 11에서야 Systematic Debugging 스킬을 적용했고, Phase 1(증거 수집 먼저) 원칙에 따라 코드 전체를 grep으로 뒤졌다. `-mx-`, `w-screen`, `100vw`를 검색하니 두 곳이 나왔다. 그게 진짜 원인이었다.

```bash
# 실제로 쓴 grep
grep -r "\-mx-\|w-screen\|100vw\|overflow-x" components/ app/ --include="*.tsx"
```

> 증상을 고치면 같은 버그가 다른 곳에서 다시 나온다. root cause를 찾을 때까지 코드를 건드리지 않는 것이 Systematic Debugging의 핵심이다.

## Systematic Debugging 스킬이 바꾼 것

스킬 없이 디버깅할 때 Claude는 "이런 수정을 해보면 어떨까요"로 바로 달려들었다. 스킬을 적용하면 Phase 1이 강제된다. 코드베이스 전체 증거를 수집하고, 각 가설을 기각하거나 채택하는 과정을 거친다. 수정 코드는 그 다음이다.

세션 1 (스킬 없음): `overflow-x: clip` 추가 → 배포 → 3일 후 같은 버그

세션 11 (스킬 적용): grep으로 전체 파악 → 네거티브 마진 2곳 발견 → 제거 → 보강 → 배포 → 재발 없음

tool call 수도 달랐다. 세션 1은 54 calls, 세션 11은 33 calls. 범위를 좁히고 들어가니 오히려 적게 쓰고 정확하게 고쳤다.

## ui-ux-pro-max + frontend-design 스킬 도입

같은 기간에 전면 리디자인도 진행됐다. 커뮤니티 1위 스킬(`ui-ux-pro-max`, 55.8k stars)과 Anthropic 공식 스킬(`frontend-design`, 277k+ installs)을 설치했다.

```bash
npx skills add anthropics/claude-code --skill frontend-design
```

두 스킬 모두 `.claude/skills/`와 `~/.claude/skills/` 양쪽에 설치해서 로컬 프로젝트와 글로벌 환경 모두에서 쓸 수 있게 했다.

스킬 도입 전과 후의 차이는 프롬프트 처리 방식에 있다. 스킬 없이 "디자인 좀 개선해줘"라고 하면 Claude는 무난한 결과를 만든다. 스킬을 적용하면 먼저 스킬 파일을 읽고, 658줄의 가이드라인(색상 토큰, 타이포그래피 스케일, touch target 44px 규칙, anti-AI-slop 원칙)을 메모리에 올린 뒤 작업한다. 결과물 수준이 다르다.

세션 12에서 다크모드 + Cmd+K 검색 + 인디고 색상 전환을 한 번에 구현했다. 148 tool calls, 총 7시간 33분 세션. Edit 43회, Bash 34회, Read 30회, Write 15회였다. Opus 4.6이 실행됐다.

```
# 세션 12에서 쓴 프롬프트 일부
디자인 분석 결과 기반으로 전면 리디자인 구현해줘.
## 필수: 스킬 먼저 읽기
1. .claude/skills/ui-ux-pro-max/SKILL.md 전체 읽기
2. .claude/skills/frontend-design/SKILL.md 전체 읽기
```

스킬을 "먼저 읽으라"고 명시적으로 지시하는 게 포인트다. 그냥 스킬을 설치해뒀다고 자동으로 적용되지 않는다. 프롬프트에 "이 스킬을 읽고 적용해"라고 써줘야 실제로 반영된다.

## Opus vs Sonnet 선택 기준

17 세션 중 Opus 4.6이 투입된 건 세션 3, 8, 9, 11, 12, 14였다. 공통점이 있다. 전부 디자인 관련이거나 여러 파일을 동시에 수정하는 복잡한 작업이었다.

단순 버그 수정 (세션 4, 5, 6, 13)은 Sonnet 4.6으로 충분했다. `html { overflow-x: hidden }` 한 줄 추가 같은 작업에 Opus를 쓰는 건 낭비다.

실용적인 기준으로 정리하면:
- 코드 파일 3개 이상 동시 수정 → Opus
- 스킬 읽고 가이드라인 적용 → Opus
- 단일 파일 버그 수정 → Sonnet
- grep으로 찾아서 한 군데 고치기 → Sonnet

## 병렬 에이전트로 독립 컴포넌트 동시 수정

세션 14에서 3명의 디자인 전문가 의견을 한 번에 적용해야 했다. `HomeContent.tsx`, `PostContent.tsx`, `DailyBriefing.tsx` 등 여러 파일을 각각 독립적으로 수정하는 작업이었다.

AgentCrow 패턴으로 3개 에이전트를 병렬 디스패치했다.

```
🐦 AgentCrow — dispatching 3 agents:
1. @frontend_developer → HomeContent.tsx + ArticleCard.tsx (hero 섹션, 브랜드 컬러, TOP 배지)
2. @frontend_developer → PostContent.tsx (소셜 공유, TOC, 소스 링크 스타일)
3. @frontend_developer → DailyBriefing.tsx + Footer.tsx (다크모드, 반응형)
```

핵심은 파일 스코프 겹침을 없애는 것이다. 세 에이전트가 각각 다른 파일 집합을 담당하니 충돌이 없다. 메인 스레드는 계획과 조율만 하고, 구현은 에이전트에 위임한다. 26 tool calls로 10개 이상의 기능 변경이 완료됐다.

## Vercel 배포 CANCELED 반복

세션 내내 Vercel 배포가 CANCELED 상태로 뜨는 문제가 반복됐다. 원인은 단순했다. 연속으로 빠르게 push하면 Vercel이 이전 빌드를 자동 취소한다. 빌드 분을 아끼려는 Vercel의 최적화인데, 디버깅 중에 commit을 여러 번 나눠서 push하다 보니 매번 앞 빌드가 취소됐다.

worktree 브랜치에서 작업하면 main push가 아니라서 Vercel 트리거가 안 된다는 것도 있었다. 최종 결과물이 준비됐을 때 main에 merge하거나 `vercel --prod`로 직접 배포해야 했다.

```bash
# 환경변수 포함 Vercel CLI 배포
PATH="/opt/homebrew/opt/node@22/bin:$PATH" /opt/homebrew/bin/vercel --prod
```

이 명령어가 메모리에 저장됐다. 다음 세션에서 "vercel 배포해줘"라고 하면 이 형태로 실행된다.

## 이 기간에서 배운 것

892 tool calls 중 가장 많이 쓴 건 Bash(280여 회)였다. git 상태 확인, 빌드 실행, 이미지 압축까지 터미널 작업이 압도적으로 많다. Edit(130여 회), Read(120여 회)가 그 뒤를 이었다.

같은 버그를 여러 번 고친 경험에서 얻은 규칙은 하나다. 고치기 전에 왜 발생하는지 먼저 설명할 수 없다면, 그 수정은 증상 패치다.

> 스킬은 Claude의 작업 방식을 바꾼다. 스킬 없이는 무난하게, 스킬과 함께하면 원칙대로.
