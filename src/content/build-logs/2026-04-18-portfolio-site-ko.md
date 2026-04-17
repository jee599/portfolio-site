---
title: "Opus 4.7 출시 당일: 15 세션·4 프로젝트·에이전트 6종 재설계"
project: "portfolio-site"
date: 2026-04-18
lang: ko
tags: [claude-code, auto-publish, harness, contextzip, agents]
description: "48시간 동안 Opus 4.7 당일 블로그 발행, Claude Code 하네스 에이전트 6종 추가, ContextZip v0.2 릴리스, spoonai 디자인 리팩토링을 15개 세션·1000+ tool call로 처리한 기록"
---

48시간 동안 Claude Code 세션을 15개 돌렸다. Opus 4.7이 4월 16일 오전에 나왔고, 당일 오후에 블로그 2개가 DEV.to에 올라갔다. 그 사이에 하네스를 뜯어 고치고, contextzip v0.2를 배포하고, spoonai 디자인을 전면 교체했다.

**TL;DR** Opus 4.7 출시 대응부터 에이전트 재설계까지 전부 Claude Code로 처리. 가장 큰 변화는 `~/.claude/agents/`에 에이전트 6종을 추가해 블로그·디자인·구현 파이프라인을 분리한 것이다.

## 세션 1: 232페이지 시스템 카드를 읽다

4월 16일 오전, Anthropic이 Opus 4.7 System Card PDF를 공개했다. 232페이지짜리 문서다. 프롬프트는 단순했다.

```
https://cdn.sanity.io/.../037f06850df7fbe871e206dad004c3db5fd50340.pdf 분석해줘
```

Read 3번, Bash 2번으로 핵심을 뽑아냈다. 주요 포지셔닝: 일반 공개 중 가장 강한 모델, Mythos Preview보다는 아래. 주력은 SWE·에이전트·컴퓨터 사용. 6분 세션에서 벤치마크 비교표와 alignment 요약까지 나왔다.

## auto-publish: 출시 4시간 만에 블로그 2개

분석이 끝나자마자 글을 썼다. `auto-publish` 스킬을 활용해 두 포스트를 병렬로 생성했다.

**Post 1 — Opus 4.7 마이그레이션 가이드**
제목: `Opus 4.7 just killed budget_tokens: what broke and how to migrate`

실제로 breaking change가 있었다. Adaptive thinking만 남기고 기존 `budget_tokens` 방식이 400 에러를 뱉는다. `type: "enabled"` + `budget_tokens` 조합으로 바꾸는 마이그레이션 포인트를 중심에 놨다.

**Post 2 — OpenAI duct-tape 분석**
LM Arena에 몇 시간 동안 올라갔다가 내려간 이미지 모델 3종(packingtape/maskingtape/gaffertape-alpha)에 관한 글. DALL-E 리타이어 데드라인(2026-05-12) 맥락까지 엮었다.

두 포스트는 에이전트 2명이 각각 담당했다. 각자 spoonai ko/en, DEV.to, Hashnode 4개 파일을 만들었다. Bash 74번, Edit 8번, Write 포함 총 97개 tool call.

## 사주 어드민 접근 불가 — 개행문자 1개

중간에 다른 프로젝트 이슈가 끼었다. `fortunelab.store` 어드민에 `920802`를 입력해도 계속 401이 나왔다. 코드 버그가 아니었다.

```
ADMIN_PASSWORD="920802\n"
```

Vercel 환경변수에 개행문자가 붙어있었다. 서버는 `920802\n`과 비교하고, 사용자는 `920802`를 입력하니 `!==`. Bash 10번으로 원인을 찾았다.

## 하네스 재설계: Hermes 리서치 → 에이전트 6종

이 날 가장 큰 작업이다. 먼저 4명의 서브에이전트를 병렬로 돌려 딥리서치를 했다.

- Harness 이론 + Hermes 정체성
- Harness 실전 + Hermes 응용

결론은 명확했다. 현재 `~/.claude/`가 과부하 상태. CLAUDE.md 82줄, MEMORY 92KB, 스킬 20+개. Anthropic 공식 원칙은 "관찰된 실패 이후에만 추가"인데 반대로 쌓여있었다.

구조 정리 후 에이전트를 추가했다.

| 에이전트 | 역할 |
|---|---|
| `blog-writer` | 플랫폼별 드래프트 생성 (spoonai·naver-dental·devto) |
| `content-editor` | AI 클리셰 제거 + 산문 강화 |
| `design-reviewer` | UI 5축 읽기전용 점수 |
| `frontend-implementer` | TS+Next+Tailwind 구현 |
| `plan-orchestrator` | 계획 전 read-only 정찰 |
| `code-verifier` | 완료 전 테스트/린트/console.log 체크 |

훅도 함께 추가했다. `sticky-rules` (compact 후 재주입), `contextzip-rewrite` (Bash 자동 래핑), `protect-files` (Edit/Write 가드), `commit-cleanliness` (Stop hook), `trajectory-log`.

```
~/.claude/agents/blog-writer.md
~/.claude/agents/content-editor.md
~/.claude/agents/design-reviewer.md
~/.claude/agents/frontend-implementer.md
```

이 구조의 핵심은 **파일 기반 컨텍스트 분리**다. 에이전트 간에 대화 컨텍스트를 공유하지 않는다. 오케스트레이터가 판단하고, 실행은 각자 고립된 컨텍스트에서 한다.

## ContextZip v0.2 배포

`/Users/jidong/tokenzip/` (GitHub: `jee599/contextzip`)를 v0.2.0으로 올렸다. 마지막 릴리스(v0.1.1)이후 30+ 커밋이 쌓여있었다.

v0.2의 핵심은 `compact/apply/expand` — 세션 히스토리 압축기다. 기존 contextzip이 명령어 출력을 압축했다면, v0.2는 Claude 대화 히스토리 자체를 압축 대상으로 확장한다.

5플랫폼(linux-x86_64, linux-musl, macos-arm64, macos-x86_64, windows-x86_64) 바이너리를 GitHub Actions로 빌드했다.

배포 전 코드 분석에서 흥미로운 수치가 나왔다.

```
Tool use (inputs)  : 46.4%
Tool results       : 39.4%
User text          : 10.1%
Assistant text     :  4.1%
```

Claude 응답 자체는 전체 토큰의 4%밖에 안 된다. 진짜 낭비는 Read(22.1%), Agent(20.0%), Write(18.9%) 등 도구 인/아웃풋이다.

Bash 33번, Glob 8번, Read 4번, Edit 1번.

## spoonai 디자인 전면 교체

마지막 대형 세션은 `spoonai-site` 디자인 리팩토링이었다. 10개 목업을 병렬로 생성했다.

- Bento grid (Apple 스타일)
- Masonry Pinterest 
- Neo-brutalism
- Swiss 타이포그래피
- Japanese Kinfolk
- Netflix 시네마
- Y2K Chrome 레트로
- Dashboard 티커

각 목업을 서브에이전트가 HTML로 만들고 로컬 서버에 띄웠다. Masonry 방식을 선택했고, 기사 카드에 이미지가 실제로 보이도록 수정했다. 반응형·애니메이션·뉴스레터 섹션까지 손봤다.

admin 페이지 인증 우회 버그도 이 세션에서 발견·수정했다.

총 395 tool call, 20시간 40분짜리 세션이었다.

## 도구 사용 통계 (전체 15 세션)

| 도구 | 주요 사용처 |
|---|---|
| Bash | 압도적 1위, 빌드·배포·git·분석 |
| Edit | 코드 수정 |
| Read | 파일 읽기·분석 |
| Agent | 병렬 서브에이전트 디스패치 |
| Write | 파일 생성 |
| TaskUpdate/Create | 멀티 에이전트 조율 |

서브에이전트를 가장 많이 쓴 세션은 세션 10 (spoonai 디자인, 395 tool call). 가장 짧은 건 세션 1 (PDF 분석, 6 tool call).

## 뭐가 달라졌나

에이전트 파이프라인이 생겼다. 블로그 포스트 하나를 만들 때 이제 흐름이 명확하다.

```
blog-writer → content-editor → design-reviewer(필요 시) → 발행
```

각 단계가 독립 에이전트라 컨텍스트 오염이 없다. `sticky-rules.md`에 체인 규약을 박아뒀고, 컴팩션 후에도 SessionStart 훅이 다시 주입한다.

contextzip v0.2도 중요한 변화다. Claude Code 세션이 길어질수록 히스토리가 무거워지는데, `compact` 명령으로 세션을 요약·압축해서 토큰 낭비를 줄인다.
