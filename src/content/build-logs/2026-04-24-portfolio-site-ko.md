---
title: "422라인 유출 프롬프트로 Claude Design 내부를 뜯었다 — 로컬 스킬 이식까지 136 tool calls"
project: "portfolio-site"
date: 2026-04-24
lang: ko
tags: [claude-code, claude-design, devto, 자동화, 역공학]
description: "Claude Design 출시 당일 유출된 422라인 시스템 프롬프트를 역공학해 로컬 CLI 스킬로 이식. jidonglab.com 리디자인 4버전 + DEV.to AI GitHub 시리즈 3편 발행 — 2세션 193 tool calls."
---

2026-04-17, Claude Design이 출시됐다. 같은 날 시스템 프롬프트 422라인이 GitHub에 올라왔다. 나흘 뒤 그걸 Claude Code로 뜯어서 로컬 스킬로 이식했다. 세션 길이 27시간 27분, 136 tool calls.

**TL;DR** 2세션 193 tool calls — Claude Design 유출 프롬프트 역공학 후 `claude-design-lite` 스킬 생성, jidonglab.com 리디자인 4버전 HTML, DEV.to AI GitHub 시리즈 3편 발행.

## "claude design 코드 유출된 거 찾아줘"에서 시작했다

첫 프롬프트가 저거였다. 처음에는 로컬 코드를 검색하는 건지, 외부 유출 자료를 찾는 건지 불분명해서 범위를 좁혀가며 웹 검색을 돌렸다.

찾은 건 `elder-plinius/CL4R1T4S` 레포의 `Claude-Design-Sys-Prompt.txt` — 422라인, 73KB. 파일 커밋 타임스탬프가 2026-04-17 19:55. Claude Design 공식 출시일과 일치한다.

이후 프롬프트가 이어졌다. "최신거 맞아?", "소스 코드 있어?", "내부에 어떻게 구현되어 있는지", "어떻게 쓰는 거야?". 팩트 기반으로 정리하면서 공개 유출된 것과 안 된 것을 분리했다.

| 항목 | 유출 여부 |
|---|---|
| Claude Code TypeScript 소스 513,000 라인 | ✅ 2026-03-31 npm sourcemap 사고 |
| Claude Design 시스템 프롬프트 + 툴 스키마 | ✅ 2026-04-17 공개 레포 |
| Claude Design 실제 소스 코드 | ❌ 비공개 |

## 422라인 프롬프트에서 뽑은 구조 세 가지

전체 프롬프트 + 툴 스키마를 읽고 역공학으로 내부 구조를 추론했다. "코드를 본 것"이 아니라 "강제된 contract로부터 추론"한 결과다.

**역할 정의** — "HTML을 도구로 쓰는 전문 디자이너". 사용자는 매니저, 모델은 실무자. 영상·슬라이드·프로토타입·데크 전부 HTML로 구현 후 변환한다. 마크다운 응답은 없다.

**파일시스템 기반 프로젝트** — 일반 claude.ai 채팅과 별개 공간. 경로 규칙 `<relative path>`, 다른 프로젝트는 `/projects/<project-name>/` 하위. 파일을 직접 읽고 쓴다.

**내장 툴 13종** — `create_file`, `edit_file`, `web_search`, `screenshot_page` 포함. 브라우저 미리보기를 인라인으로 처리한다.

이 분석 결과를 HTML 가이드로 만들어서 `/Users/jidong/claude-design-guide.html`에 저장했다. Instrument Serif 헤드라인 + IBM Plex Sans 본문 + JetBrains Mono 코드 구성, 다크/라이트 자동 전환.

## "저거 CLI에 주입해서 같은 기능 낼 수 없어?"

프롬프트가 이 방향으로 흘렀다. Claude Design의 호스트 의존 기능 — Live Preview, Tweaks, Design Mode — 은 로컬 CLI에서 구현 불가다. 그러나 **질문 기법·컨텍스트 수집·변주 생성·AI-slop 가드**는 이식할 수 있다.

`~/.claude/skills/claude-design-lite/SKILL.md`를 만들었다. 핵심 로직:

```
1. 발동 전 3가지 자문 — 진짜 디자인 작업인가, 충분한 컨텍스트가 있는가, follow-up인가 새 탐색인가
2. 10가지 질문 템플릿 — 정체성, 사용자, 기능 범위, 레퍼런스 등
3. 3가지 변주 방향 — 각각 다른 미적 원칙으로
4. AI-slop 가드 — glassmorphism, neumorphism, 그라데이션 남발 차단
```

스킬 생성 직후 `jidonglab.com` 리디자인에 바로 적용했다. 10가지 질문에 답하고 나서 4가지 방향을 뽑았다:

- `v1-notebook.html` — 노트북 느낌, 손글씨 텍스처
- `v2-pro.html` — cream/acid/deep 팔레트, 실데이터 기반
- `v2-studio.html` — 다크, 스튜디오 톤
- `v3-labos.html` — 실험적, 비대칭 레이아웃

"v2-pro 괜찮은데 좀 더 고도화할 거 없어?"라는 피드백에 activity heatmap을 추가했다 — 1년치 커밋·포스트·빌드로그를 한 화면에. 누적 건수와 최장 연속 일수까지. 디자인 리뷰 중 "진짜야?"라는 피드백이 왔고, 실데이터로 바꾸는 방향으로 수정했다.

세션 2 합산: Edit 37회, Bash 36회, Write 12회, WebSearch 11회. 136 tool calls, 27시간 27분.

## DEV.to 3편 시리즈, 하루에 병렬로 발행했다

별도 세션에서 "ai git에서 유명한 프로젝트 한 4개 정도 최신거 분석 글 devto에 블로그 올려줘"가 들어왔다. `auto-publish` 스킬 발동. "3편 정도"라는 수정 지시 후 구조 제안, 승인, 발행 순서로 진행했다.

4개 프로젝트를 테마별로 묶어 3편 시리즈로 재구성했다:

| 편 | 다룬 프로젝트 | 앵글 | 상태 |
|---|---|---|---|
| Part 1 | andrej-karpathy/skills + hermes-agent | Skills 패러다임 탄생 | 발행 (04-23 14:55 UTC) |
| Part 2 | OpenClaw | 로컬 MCP 게이트웨이 | 드래프트 (04-25 예정) |
| Part 3 | opencode | 터미널 에이전트 전쟁 | 드래프트 (04-27 예정) |

[Part 1 — How a Markdown File Hit 16K Stars: Skills in 2026](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi)이 라이브로 올라갔다. Parts 2·3는 `published: false`로 드래프트 업로드해서 날짜에 맞춰 게시한다.

기존 OpenClaw 글(`claude-code-channels-vs-openclaw-en.md`)이 "Claude Code 채널 vs OpenClaw" 비교 각도라 이번 글과 겹치지 않아 내부 링크로만 연결했다.

세션 1: Bash 22회, WebSearch 4회, TaskCreate 4회. 53 tool calls, 3시간 25분.

## 2세션 합산

| 세션 | 날짜 | 시간 | Tool calls | 주요 작업 |
|---|---|---|---|---|
| 세션 4 | 04-22 | 27h 27min | 136 | Claude Design 역공학 + 리디자인 4버전 |
| 세션 1 | 04-23 | 3h 25min | 53 | DEV.to 시리즈 3편 발행 |

도구별: Bash 59회, Edit 41회, Read 19회, WebSearch 15회, TaskUpdate 15회, Write 15회, TaskCreate 10회. 생성 파일 13개, 수정 파일 4개.

이번에 처음 실전 투입된 스킬이 둘이다 — `claude-design-lite`(세션 내에서 만들고 바로 리디자인에 적용)와 `auto-publish`(DEV.to 3편 시리즈). 둘 다 만들면서 바로 썼다.
