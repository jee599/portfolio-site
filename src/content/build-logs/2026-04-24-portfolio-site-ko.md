---
title: "Claude Design 시스템 프롬프트 역공학 + DEV.to 3편 자동 발행 — 3세션 284 tool calls"
project: "portfolio-site"
date: 2026-04-24
lang: ko
tags: [claude-code, claude-design, 서브에이전트, devto, 자동화]
description: "Claude Design 출시 당일 유출된 422라인 시스템 프롬프트를 역공학해 로컬 스킬로 이식. 서브에이전트 5개 병렬 광고 리서치 검증, DEV.to AI GitHub 시리즈 3편 자동 발행 — 3세션 284 tool calls 기록."
---

2026-04-17, Claude Design이 출시됐다. 같은 날 시스템 프롬프트 422라인이 GitHub에 올라왔다. 이틀 뒤 그걸 Claude Code로 분석해 로컬 `claude-design-lite` 스킬로 이식했다. 그 세션이 128 tool calls, 22시간짜리였다.

**TL;DR** 3세션 284 tool calls — 광고 리서치 병렬 검증, Claude Design 역공학 후 스킬 이식, DEV.to 시리즈 3편 자동 발행.

## 서브에이전트 5개로 66,745단어 리서치를 검증했다

`dentalad/` 프로젝트를 다시 열었다. V1 리서치와 V2 검증 사이에 전제가 대거 뒤집혀 있는데 FINAL-REPORT에 반영이 안 된 상태였다.

대표적인 오차: 네이버 Cue:가 2026-04-09 종료됐는데 V1은 "핵심 알고리즘"으로 가정해 전략을 짰다. 블로그 1건 AI 생성 원가도 V1 2.6만 원 → V2 1,700원으로 정정됐지만 최종본은 V1 수치 그대로였다.

도메인별로 에이전트를 분리했다.

```
에이전트 1 → 규제 (AI 기본법·공정위·의료법)
에이전트 2 → 경쟁사 (케어랩스 등 Top 5)
에이전트 3 → 플랫폼 (네이버·Meta·ChatGPT)
에이전트 4 → 유닛 이코노믹스 (원가·가격·MRR)
에이전트 5 → 시장 데이터 (ROAS·LTV·TAM)
```

병렬로 돌리고 결과를 수집했다. 주요 발견:

- 경쟁사 → 상승기획·라온하제·애드리절트 매출이 직원수 대비 과대 (V2가 하향 권고했으나 FINAL-REPORT는 V1 유지)
- 플랫폼 → "ChatGPT가 네이버 차단"이 아니라 **네이버가 ChatGPT 차단** — 주어가 거꾸로였음
- 규제 → 공정위 가상인물 가이드라인은 "행정예고 단계", 시행 아님 (V1은 기정사실로 기술)

수정된 내용을 각 문서에 반영하고 `verification/` 하위에 5개 리포트로 분리 저장했다. 세션 1: Bash 31회, Edit 23회, TaskCreate 9회.

## Claude Design 422라인 프롬프트를 뜯었다

"claude design 코드 유출된 거 찾아줘"에서 시작됐다. 웹 검색으로 `elder-plinius/CL4R1T4S` 레포를 찾았다 — `Claude-Design-Sys-Prompt.txt`, 422라인, 73KB.

파일 커밋 날짜가 2026-04-17 19:55. Claude Design 공식 출시일과 동일하다.

팩트 기반 분석에서 뽑은 구조 세 가지:

**역할 정의** — "HTML을 도구로 쓰는 전문 디자이너". 사용자는 매니저, 모델은 실무자. 영상·슬라이드·프로토타입 모두 HTML로 구현 후 변환한다. 마크다운이나 일반 텍스트 응답은 하지 않는다.

**파일시스템 기반** — 일반 claude.ai 채팅과 달리 프로젝트 단위로 작동한다. 경로 규칙 `<relative path>`, 별도 프로젝트는 `/projects/<project-name>/` 하위. 파일을 직접 쓰고 수정한다.

**내장 툴 13종** — `create_file`, `edit_file`, `web_search`, `screenshot_page` 포함. 브라우저 미리보기까지 인라인으로 처리한다.

로컬 CLI에서 이 구조를 재현하는 게 목표였다. 호스트 의존 기능(Live Preview, Tweaks, Design Mode)은 버리고 **질문 기법·컨텍스트 수집·변주 생성·AI-slop 가드**만 이식했다. 결과물이 `~/.claude/skills/claude-design-lite/` 스킬이다.

스킬 생성 직후 `jidonglab.com` 리디자인에 적용했다. v1-notebook, v2-pro, v2-studio, v3-labos 4가지 방향을 HTML로 뽑았다. 세션 2: Edit 37회, Bash 36회, WebSearch 11회, Write 12회. 총 128 tool calls, 세션 길이 22시간 3분.

## DEV.to AI GitHub 시리즈 3편 자동 발행

"ai git에서 유명한 프로젝트 한 4개 정도 최신거 분석 글 devto에 블로그 올려줘". `auto-publish` 스킬 발동.

4개 프로젝트를 3편 시리즈로 재구성했다 — 편당 2,500~3,500단어, 독립적으로 읽히면서 시리즈로 연결되는 구조.

| 편 | 다룬 프로젝트 | 앵글 | 상태 |
|---|---|---|---|
| Part 1 | andrej-karpathy/skills + hermes-agent | Skills 패러다임 탄생 | 발행 완료 |
| Part 2 | OpenClaw | 로컬 MCP 게이트웨이 | 드래프트 (04-25) |
| Part 3 | opencode | 터미널 에이전트 전쟁 | 드래프트 (04-27) |

Part 1 [How a Markdown File Hit 16K Stars: Skills in 2026](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi) — 2026-04-23 14:55 UTC 발행. Parts 2·3는 `published: false`로 드래프트 업로드해뒀다가 날짜에 맞춰 게시한다.

기존 OpenClaw 글(`claude-code-channels-vs-openclaw-en.md`)이 있었는데 "Claude Code 채널 vs OpenClaw" 비교 각도라 이번 글과 겹치지 않는다고 판단해 내부 링크로만 연결했다. 세션 3: Bash 22회, WebSearch 4회, 53 tool calls, 3시간 25분.

## 3세션 합산

| 세션 | 날짜 | 시간 | Tool calls | 주요 작업 |
|---|---|---|---|---|
| 1 | 04-22 | 3h 12min | 103 | dentalad 리서치 검증 |
| 2 | 04-22 | 22h 3min | 128 | Claude Design 역공학 + 리디자인 |
| 3 | 04-23 | 3h 25min | 53 | DEV.to 시리즈 발행 |

도구별: Bash 89회, Edit 64회, TaskUpdate 31회, Write 25회. 생성 파일 23개, 수정 파일 7개.

이번에 처음 실전 투입된 스킬이 두 개다 — `claude-design-lite`와 `auto-publish`. 둘 다 세션 내에서 만들어서 바로 썼다.
