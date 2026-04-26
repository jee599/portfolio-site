---
title: "Claude Design 시스템 프롬프트 역공학 — 422라인 뜯어서 로컬 스킬로 만들기"
project: "portfolio-site"
date: 2026-04-26
lang: ko
tags: [claude-design, reverse-engineering, skill, 리디자인, claude-code]
description: "Claude Design 시스템 프롬프트 422라인이 출시 당일 GitHub에 올라왔다. 그걸 뜯어서 역공학하고 로컬 CLI 스킬로 이식했다. claude-opus-4-7로 87시간, 150 tool calls — 부산물로 jidonglab 리디자인 5개 variant도 나왔다."
---

Claude Design이 출시된 날, 시스템 프롬프트 422라인이 통째로 GitHub에 올라왔다.

**TL;DR** 유출 프롬프트를 역공학해서 로컬 CLI 스킬로 이식했다. 부산물로 jidonglab 리디자인 variant 5개가 나왔다.

## 422라인짜리가 GitHub에 올라온 경위

`claude.ai/design`은 2026-04-17 Anthropic Labs에서 출시한 신규 제품이다. 일반 채팅과 다른 독립 워크스페이스로, HTML을 네이티브 포맷으로 쓰는 디자인 특화 모드다. Pro/Max/Team/Enterprise 전용.

출시 당일, `elder-plinius/CL4R1T4S` 레포에 `Claude-Design-Sys-Prompt.txt`가 올라왔다. 커밋 타임스탬프: 2026-04-17 19:55. 시스템 프롬프트 422라인, 약 73KB.

같은 레포에는 이미 `Claude-Opus-4.7.txt`(04-16), `Muse_Spark`(04-08) 같은 유출본들이 쌓여 있었다. Claude Design 관련은 이 파일 하나뿐. 커밋이 딱 2개(생성 + 이름 변경)라 최초 유출본이 맞다.

## 역공학으로 뭘 뽑았나

소스 코드가 유출된 건 아니다. 강제된 contract — 시스템 프롬프트와 툴 스키마 — 로부터 내부 구현을 추론하는 방식이다.

프롬프트에서 추출한 핵심:

- **역할 정의**: "HTML을 도구로 쓰는 전문 디자이너". 사용자는 매니저, 모델은 실무자.
- **출력 포맷**: HTML 단일. 슬라이드·프로토타입·데크 전부 HTML로 구현 후 변환.
- **파일시스템**: `<relative path>` 규칙, 타 프로젝트는 `/projects/<name>/` 하위.
- **내장 스킬**: 파일 읽기/쓰기, 디렉토리 탐색, 브라우저 preview 등 13개.

Claude Code와 기능이 유사하지만 **디자인 특화 질문 기법**이 핵심 차이다. 요청이 들어오면 10개 항목을 체계적으로 물어보고 컨텍스트를 쌓은 뒤 구현한다. 단순히 만들어주는 게 아니라 브리프를 먼저 뽑는다.

## 로컬 스킬로 이식하기

호스트 의존 기능(Live preview, Tweaks, Design Mode)은 버렸다. 이식 대상은 세 가지:

1. 질문 기법 — 컨텍스트 수집 10개 항목
2. 변주 전략 — 동일 브리프에서 방향 다른 N개 생성
3. AI-slop 가드 — 클리셰 제거 규칙

결과물: `~/.claude/skills/claude-design-lite/SKILL.md` + `reference/question-templates.md` + `reference/starter-kit.html`

스킬 발동 조건도 프롬프트에서 그대로 뽑았다:

> 이게 단순 마크업/리팩토링인가? → 후자면 발동하지 말 것  
> 사용자가 이미 풍부한 컨텍스트를 줬나? → 줬으면 질문 단계 축소  
> follow-up인가, 새 탐색인가? → follow-up이면 질문 생략하고 바로 수정

Claude Design의 "Mocking from scratch" 접근법도 그대로 따랐다. 기존 디자인에 얽매이지 않고 브리프만 갖고 새로 시작하는 방식.

## jidonglab 리디자인까지 번졌다

스킬 테스트를 겸해서 jidonglab.com 리디자인을 돌렸다. 10개 질문으로 컨텍스트를 수집하고 3개 방향을 동시에 탐색했다.

| variant | 컨셉 | 파일 |
|---|---|---|
| v1 | Notebook | `v1-notebook.html` |
| v2a | Pro Studio | `v2-pro.html` |
| v2b | Studio Dark | `v2-studio.html` |
| v3a | LabOS | `v3-labos.html` |
| v3b | Home | `v3/home.html` |
| v3c | Hero variations | `v3/hero-variations.html` |

요청은 "2번이 괜찮은데 좀 더 고도화할 거 없어?"였다. 질문 10개 → variant 3개 → 선택 → 디테일업 순서. 브리프 한 번으로 방향 6개가 나왔다.

GitHub 기여 잔디 스타일 활동 히트맵 UI도 이 세션에서 나왔다. "1년치 커밋·포스트·빌드로그를 한 화면에"라는 요구였는데, 더미 숫자를 실제 데이터와 연결하는 `src/pages/api/now.ts` 엔드포인트도 함께 생성됐다.

## 세션 통계

- 총 소요: 87시간 22분 (`claude-opus-4-7`)
- 총 tool calls: 150
- `Bash` 43 / `Edit` 37 / `Write` 15 / `Read` 13 / `WebSearch` 11 / `TaskUpdate` 12 / `TaskCreate` 6 / `WebFetch` 5
- 생성 파일: 12개 / 수정 파일: 1개

`WebSearch` 11회가 특징적이다. 유출 자료 크로스체크, 공식 출시일 검증, 레포 커밋 이력 확인에 집중됐다. 코드 작성보다 정보 수집에 먼저 시간을 쓴 세션이었다. 팩트를 확인한 뒤에 구현하는 순서.
