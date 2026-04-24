---
title: "Claude Design 422라인 시스템 프롬프트 역공학 + DEV.to 4편 자동 발행"
project: "portfolio-site"
date: 2026-04-24
lang: ko
tags: [claude-code, claude-design, auto-publish, devto, content-automation, agents]
description: "Claude Design 유출 시스템 프롬프트 422줄 전수 분석, jidonglab 리디자인 4종, auto-publish로 DEV.to 4편 연속 배포 — 4세션 279 tool calls 기록"
---

422라인짜리 Claude Design 시스템 프롬프트가 2026-04-17에 GitHub에 올라왔다. 출시 당일이다.

**TL;DR** Claude Design 유출 프롬프트를 분석해서 로컬 스킬로 이식했고, auto-publish 스킬로 DEV.to에 4편 연속 발행했다. 4개 세션, 279 tool calls.

## 422줄 유출 프롬프트를 뜯다

가장 긴 세션. 27시간 27분, 136 tool calls.

시작 프롬프트: "claude design 코드 유출된거 찾아줘"

처음엔 어떤 claude design인지 불분명했다. 로컬 코드인지, 외부 유출인지 확인하면서 범위를 좁혔다. `claude.ai/design` — 2026-04-17 Anthropic Labs에서 출시한 신제품이라는 걸 확인하고 나서 웹 검색을 돌렸다.

`elder-plinius/CL4R1T4S` 레포에서 찾았다. `Claude-Design-Sys-Prompt.txt` — 422줄, 약 73KB. 파일 커밋 타임스탬프 2026-04-17 19:55. Claude Design 공식 출시일과 일치한다.

| 항목 | 유출 여부 | 비고 |
|---|---|---|
| Claude Code TypeScript 소스 513,000줄 | ✅ | 2026-03-31 npm sourcemap 사고 |
| Claude Design 시스템 프롬프트 + 툴 스키마 | ✅ | 2026-04-17 공개 레포 |
| Claude Design 실제 소스 코드 | ❌ | 비공개 |

역공학으로 뽑은 핵심 구조:

**역할 정의** — "HTML을 도구로 쓰는 전문 디자이너". 유일한 네이티브 출력 포맷이 HTML이다. 영상·슬라이드·프로토타입·데크 모두 HTML로 구현 후 변환한다.

**파일시스템 기반 프로젝트** — 일반 claude.ai 채팅과 별개 공간. 경로 규칙 `<relative path>`, 타 프로젝트는 `/projects/<project-name>/` 하위. 파일을 직접 읽고 쓴다.

**Variationer 패턴** — 동일 요청에 스타일·레이아웃·컬러 팔레트를 달리한 3개 변주를 자동 생성한다.

> 소스 코드 없이 422줄 프롬프트 + 툴 스키마만으로 "강제된 contract로부터 추론"하는 방식이다. Claude Design이 할 수 없는 건 프롬프트에서 금지된 게 아니라 툴 스키마에 존재하지 않는 것으로 판단한다.

이 분석 결과를 먼저 HTML 가이드로 정리했다. `/Users/jidong/claude-design-guide.html`, 7섹션. "프롬프트/스킬인가?" 질문에 대한 답부터 실제 사용 흐름, 13종 내장 툴까지 담았다.

## CLI에 질문 기법 이식 — claude-design-lite 스킬

"저거 CLI에 주입해서 같은 기능 낼 수 없어?"

Live Preview, Tweaks, Design Mode 같은 호스트 의존 기능은 로컬에서 구현이 안 된다. 하지만 **질문 기법·컨텍스트 수집·변주 생성·AI-slop 가드**는 이식할 수 있다.

`~/.claude/skills/claude-design-lite/SKILL.md`를 만들었다. 핵심 로직:

```
발동 전 3가지 자문
 - 진짜 디자인 작업인가 vs 단순 마크업/리팩토링?
 - 이미 풍부한 컨텍스트가 있는가?
 - follow-up인가, 새 탐색인가?

10가지 컨텍스트 질문 템플릿
 (정체성, 사용자, 기능 범위, 레퍼런스, 색상 방향성 등)

3개 변주 방향 + AI-slop 가드
 - glassmorphism, neumorphism, 그라데이션 남발 차단
```

Claude Design이 빈 캔버스에서 10개 질문으로 컨텍스트를 채우는 방식이 핵심이었다. 일반 프롬프트는 바로 결과물부터 뽑으려 하는데, Design은 질문 선행이 의무다. 그 구조를 그대로 스킬에 심었다.

스킬 생성 직후 jidonglab.com 리디자인에 바로 적용했다. 10개 질문에 답하고 4개 방향을 뽑았다.

- `v1-notebook.html` — 노트북 텍스처, 손글씨 느낌
- `v2-pro.html` — cream/acid/deep 팔레트, 실데이터 기반
- `v2-studio.html` — 다크, 스튜디오 톤
- `v3-labos.html` — 실험적, 비대칭 레이아웃

"v2-pro 괜찮은데 좀 더 고도화할 거 없어?" 피드백에 1년치 커밋·포스트·빌드로그를 한 화면에 보여주는 activity heatmap을 추가했다. "진짜야?"라는 피드백이 왔고, 실데이터로 교체하는 방향으로 수정했다. 배포는 다음 세션 범위.

## AI GitHub 트렌딩 4개 → DEV.to 3편 시리즈

별도 세션. 3시간 25분, 53 tool calls.

시작: "ai git에서 유명한 프로젝트 한 4개 정도 최신거 분석 글 devto에 블로그 올려줘"

`auto-publish` 스킬 발동. WebSearch로 2026년 4월 기준 트렌딩 프로젝트를 수집했다.

- `andrej-karpathy/skills` — 16K 스타. Markdown 파일 하나로 에이전트 스킬을 정의하는 패러다임
- `hermes-agent` — Hermes 모델 기반 에이전트 프레임워크
- `OpenClaw` (steipete) — 295K 스타. 로컬 AI 게이트웨이 + 50개 이상 통합
- `opencode` — 터미널 네이티브 AI 에이전트

"3편 정도"라는 수정 지시가 왔다. 4개를 3편으로 테마별로 묶었다. 프로젝트별 목록이 아니라 기술 패러다임별 시리즈로 각도를 잡는 게 핵심이었다.

| 편 | 다룬 프로젝트 | 앵글 | 상태 |
|---|---|---|---|
| Part 1 | andrej-karpathy/skills + hermes-agent | Skills 패러다임 탄생 | 발행 완료 |
| Part 2 | OpenClaw | 로컬 MCP 게이트웨이 | 드래프트 (04-25) |
| Part 3 | opencode | 터미널 에이전트 전쟁 | 드래프트 (04-27) |

Part 1 발행: [How a Markdown File Hit 16K Stars: Skills in 2026](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi) — DEV.to id=3542024, 04-23 14:55 UTC.

Parts 2·3는 `published: false`로 DEV.to 드래프트 업로드 후 날짜에 맞춰 수동 게시한다. 분산 예약 발행이 처음으로 제대로 돌아간 세션이었다.

## GPT-5.5 + 덕테이프, 텔레그램으로 전부 처리

4번째 세션. 10시간, 88 tool calls.

텔레그램 메시지로 시작됐다: "gpt 5.5랑 덕테이프 관련해서 블로그 글 써줘"

두 주제가 연결되는 것처럼 보이지만 사실 다른 프로젝트다. GPT-5.5(코드명 "Spud", 2026-04-23 릴리스)와 Duct Tape(GPT Image 2, LM Arena에서 `packingtape`/`maskingtape` 가명으로 테스트 중)를 리서치했다.

중복 체크가 첫 번째 작업이었다. 8일 전인 04-16에 "OpenAI Duct Tape / GPT Image 2" 글을 3개 플랫폼에 이미 발행해뒀다. 덕테이프를 또 메인으로 쓰면 중복이다. 새 글은 GPT-5.5(Spud) 메인, 덕테이프는 내부 링크 처리로 재구성했다.

"2편으로 나눠줘" → "발행 대기러 돌려" — 방향이 확정된 후 Agent 4개를 병렬 디스패치해서 파일을 생성했다. DEV.to description이 156자로 1자 초과한 게 유일한 버그였다. 트림하고 바로 push.

텔레그램으로 진행 상황을 주고받으면서 작업하는 패턴이 이번 세션에서 처음 제대로 정착했다. 메시지 하나로 방향을 잡고 모델이 알아서 진행하는 것이 빠르다.

## 4세션 도구 사용 통계

| 도구 | 횟수 | 비율 |
|---|---|---|
| Bash | 95 | 34% |
| Edit | 42 | 15% |
| TaskUpdate | 26 | 9% |
| Read | 26 | 9% |
| WebSearch | 18 | 6% |
| Write | 15 | 5% |
| Agent | 12 | 4% |
| 기타 | 45 | 16% |

Bash 34%는 `auto-publish` 스킬 구조 때문이다. git push, DEV.to API 호출, 파일 생성 확인이 모두 Bash로 돌아간다. Agent 12회는 전부 병렬 콘텐츠 생성에 썼다. 독립 도메인을 서브에이전트로 분리하면 메인 컨텍스트를 아끼면서 병렬 처리가 된다.

생성 파일 13개, 수정 5개. Claude Design 세션 하나에서 생성 파일 11개가 나왔다 — HTML 변주 4개 + 스킬 파일 3개 + 가이드 1개 + API 라우트 1개 + 기타.

이번에 처음 실전 투입된 스킬이 둘이다. `claude-design-lite`는 만들고 바로 리디자인에 적용했고, `auto-publish`는 분산 예약 발행을 처음으로 제대로 돌렸다. 만들면서 바로 쓰는 것이 스킬 완성도를 빠르게 올린다.
