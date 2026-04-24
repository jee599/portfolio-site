---
title: "텔레그램 → DEV.to 5편 예약 발행: auto-publish 실전 투입 4세션"
project: "portfolio-site"
date: 2026-04-25
lang: ko
tags: [claude-code, auto-publish, devto, content-automation, telegram, claude-design]
description: "텔레그램 메시지 하나로 GPT-5.5 발행, AI GitHub 트렌딩 3편 시리즈 예약 배포, Claude Design 역공학 스킬 이식 — 4세션 279 tool calls로 end-to-end 콘텐츠 파이프라인 완성"
---

텔레그램 메시지 하나가 DEV.to 발행으로 끝났다. 리서치부터 중복 체크, 파일 생성, API 호출까지 전부 모델이 처리한다. 이번 4세션에서 이 패턴이 처음으로 end-to-end로 작동했다.

**TL;DR** 4세션 279 tool calls. DEV.to에 5편 배포(1편 즉시, 4편 예약 드래프트), Claude Design 422줄 유출 프롬프트 역공학 후 `claude-design-lite` 스킬 이식, jidonglab.com 리디자인 4개 변주.

## AI GitHub 트렌딩 4개 → 3편 시리즈, 날짜 분산 발행

"ai git에서 유명한 프로젝트 한 4개 정도 최신거 분석 글 devto에 올려줘" — 이게 출발점이었다.

`auto-publish` 스킬 Phase 1에서 WebSearch로 2026년 4월 트렌딩을 수집했다. `andrej-karpathy/skills`(16K 스타), `hermes-agent`, `OpenClaw`(295K 스타), `opencode` 4개가 나왔다.

"3편 정도"로 수정 지시가 왔다. 프로젝트별 나열이 아니라 기술 패러다임 앵글로 재구성했다.

| 편 | 프로젝트 | 각도 | 발행 |
|---|---|---|---|
| Part 1 | andrej-karpathy/skills + hermes-agent | Skills 패러다임 탄생 | 04-23 즉시 |
| Part 2 | OpenClaw | 로컬 MCP 게이트웨이 | 04-25 예약 |
| Part 3 | opencode | 터미널 에이전트 전쟁 | 04-27 예약 |

Parts 2·3은 `published: false`로 DEV.to에 드래프트 업로드했다. 날짜에 맞춰 수동 게시하는 방식이다. 한 번에 올리면 피드에 묻힌다. 3일 간격으로 나누면 각 편이 독립적으로 노출된다.

Part 1 발행: [How a Markdown File Hit 16K Stars: Skills in 2026](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi) — DEV.to id=3542024, 04-23 14:55 UTC.

분산 예약 발행이 처음으로 제대로 돌아간 세션이었다.

## 텔레그램 메시지 → GPT-5.5 발행, 중복 방지 로직이 먼저 작동했다

4번째 세션. 텔레그램 메시지 하나: "gpt 5.5랑 덕테이프 관련해서 블로그 글 써줘"

두 주제가 연결돼 보이지만 실제로는 별개다. GPT-5.5(코드명 Spud, 2026-04-23 릴리스)와 Duct Tape(GPT Image 2, LM Arena에서 `packingtape`/`maskingtape` 가명으로 테스트 중인 이미지 모델).

리서치 전에 중복 체크가 먼저였다. 8일 전인 04-16에 이미 "OpenAI Duct Tape / GPT Image 2" 글을 3개 플랫폼에 발행해뒀다. 덕테이프를 메인으로 또 쓰면 중복이다. GPT-5.5(Spud) 메인, 덕테이프는 내부 링크 처리로 방향을 바꿨다.

```
GPT-5.5 메인 + 덕테이프 내부 링크
→ canonical: https://jidonglab.com/blog/openai-gpt-5-5-spud
→ DEV.to description: 156자 → 트림 후 push
```

"2편으로 나눠줘" → "발행 대기러 돌려" — Agent 4개 병렬 디스패치로 파일 생성. DEV.to description 1자 초과 버그 하나를 트림하고 push. 텔레그램으로 방향을 잡으면 모델이 처음부터 끝까지 처리하는 구조가 이 세션에서 정착했다.

## 422줄 시스템 프롬프트 역공학 → claude-design-lite 스킬

가장 긴 세션. 27시간 27분, 136 tool calls.

"claude design 코드 유출된거 찾아줘"로 시작해서 범위를 좁혔다. `elder-plinius/CL4R1T4S` 레포에서 `Claude-Design-Sys-Prompt.txt`를 찾았다. 422줄, 약 73KB. 커밋 타임스탬프는 2026-04-17 19:55 — Claude Design 공식 출시일과 일치한다.

소스 코드는 없다. 프롬프트 + 툴 스키마만 공개됐다. "강제된 contract로부터 추론"하는 방식으로 내부 구현을 역공학했다.

역공학으로 뽑은 핵심:
- **유일한 출력 포맷**: HTML. 슬라이드·영상·프로토타입 모두 HTML로 구현 후 변환
- **Variationer 패턴**: 스타일·레이아웃·컬러 팔레트를 달리한 3개 변주 자동 생성
- **10개 질문 선행**: 결과물 전에 반드시 컨텍스트 수집 먼저

"저거 CLI에 주입해서 같은 기능 낼 수 없어?" 물었다. Live Preview, Design Mode는 호스트 의존이라 로컬에서 안 된다. **질문 기법·컨텍스트 수집·변주·AI-slop 가드**만 이식 가능하다.

`~/.claude/skills/claude-design-lite/SKILL.md`를 만들었다. 핵심 로직:

```
발동 전 3가지 자문
  - 진짜 디자인 작업인가 vs 단순 마크업/리팩토링?
  - 이미 풍부한 컨텍스트가 있는가?
  - follow-up인가, 새 탐색인가?

10가지 컨텍스트 질문 (정체성, 사용자, 기능 범위, 레퍼런스, 색상 등)

AI-slop 가드
  glassmorphism, neumorphism, 그라데이션 남발 차단
```

스킬 완성 직후 jidonglab.com 리디자인에 바로 적용했다. 10개 질문에 답하고 4개 변주를 뽑았다: `v1-notebook`(노트북 텍스처), `v2-pro`(cream/acid/deep 팔레트), `v2-studio`(다크 톤), `v3-labos`(비대칭 레이아웃). `v2-pro`에는 1년치 커밋·포스트·빌드로그를 보여주는 activity heatmap을 실데이터로 추가했다.

> 만들면서 바로 쓰는 것이 스킬 완성도를 빠르게 올린다. 추상적인 스킬은 실전 없이 정제되지 않는다.

## 도구 사용 통계 — 4세션 합산

| 도구 | 횟수 | 비율 |
|---|---|---|
| Bash | 95 | 34% |
| Edit | 42 | 15% |
| Read | 26 | 9% |
| TaskUpdate | 26 | 9% |
| WebSearch | 18 | 6% |
| Write | 15 | 5% |
| Agent | 12 | 4% |
| 기타 | 45 | 16% |

Bash 34%는 `auto-publish` 구조 때문이다. git push, DEV.to API 호출, 파일 확인이 모두 Bash로 돌아간다. Agent 12회는 전부 병렬 콘텐츠 생성. 독립 작업을 서브에이전트로 분리하면 메인 컨텍스트가 줄고 속도가 빠르다.

생성 파일 13개, 수정 5개. Claude Design 세션 하나에서 생성 파일 11개가 나왔다 — HTML 변주 4개, 스킬 파일 3개, 가이드 1개, API 라우트(`/api/now.ts`) 1개, 기타.

이번 세션들로 실전 투입된 스킬이 두 개다. `claude-design-lite`는 만들고 바로 리디자인에 적용했다. `auto-publish`는 분산 예약 발행을 처음으로 제대로 돌렸다. 텔레그램 → 모델 → DEV.to 파이프라인이 처음으로 end-to-end로 완성됐다.
