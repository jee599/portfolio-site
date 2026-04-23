---
title: "Claude Design 시스템 프롬프트 422라인 역공학 + 5개 에이전트 병렬 검증, 5h 17min"
project: "portfolio-site"
date: 2026-04-23
lang: ko
tags: [claude-code, multi-agent, claude-design, skill, research, reverse-engineering]
description: "하루 두 세션, 5시간 17분, 201 tool calls. 치과 광고 리서치를 5개 에이전트로 병렬 검증하고 Claude Design 시스템 프롬프트 422라인을 역공학해 로컬 스킬로 이식했다. 66,745단어 문서에서 주어가 반대인 오류를 잡아낸 과정."
---

하루에 도구를 201번 썼다. 5시간 17분, 두 세션 내내 `claude-opus-4-7`. 코드는 한 줄도 안 쓴 날이었다 — 전부 리서치 검증, 시스템 프롬프트 역공학, 리디자인 프로토타이핑이었다.

**TL;DR** 66,745단어 dentalad 리서치를 5개 에이전트로 병렬 검증해 12개 오류를 잡아냈고, Claude Design 시스템 프롬프트 422라인을 분석해 `claude-design-lite` 로컬 스킬로 이식한 뒤 jidonglab.com 리디자인 시안 4개를 뽑았다.

## 66,745단어를 5개로 쪼개서 동시에 검증하면 생기는 일

`dentalad/ads-research/`에 광고 리서치가 쌓여 있었다. V1 원본 12건 + V2 검증본 8건 + 통합 리포트 4건. V2가 V1을 뒤집은 내용이 12가지였다 — 네이버 Cue:가 "핵심 알고리즘"으로 가정돼 있었으나 2026-04-09에 이미 종료됐고, 블로그 제작 원가는 2.6만원이 아니라 1,700원 + 인건비로 수정됐다. 그 V2가 맞는지 다시 검증해야 했다.

도메인 5개로 쪼개서 에이전트를 동시에 디스패치했다:

```
규제   → AI 기본법·공정위·대법원·의료법
경쟁사 → 케어랩스 외 Top 5 + 글로벌
플랫폼 → 네이버·Meta·ChatGPT 동향
이코노믹스 → 원가·가격·MRR 구조
시장  → CRM·ROAS·LTV·TAM 수치
```

순차로 돌렸으면 4~5시간짜리 작업이다. 병렬로 돌리니 단일 세션 안에 끝났다. 각 에이전트에 "900단어 이내 팩트체크 리포트"라고 명시했다 — 길어지면 컨텍스트가 터진다.

가장 예상 못 한 발견은 플랫폼 에이전트에서 나왔다. 원문에 "ChatGPT가 네이버를 차단"이라는 문장이 있었는데, 실제로는 **네이버가 ChatGPT 봇을 차단**한 것이다. 주어와 목적어가 통째로 뒤집혔다. 규제 에이전트는 공정위 가상인물 규정이 "시행"이 아니라 "행정예고 단계"임을 잡았다. 경쟁사 에이전트는 케어랩스가 2024-10부터 매각 진행 중이라는 사실을 dossier 외부에서 발굴했다.

검증이 끝난 뒤 `FINAL-REPORT.md`, `EXECUTIVE-SUMMARY.md`, `RISKS.md`를 수정하고 `verification/01~05.md`를 생성했다.

> 검증 에이전트는 "이게 사실이다"를 찾는 게 아니라 "이게 틀릴 수 있는 이유"를 찾도록 프롬프트해야 한다.

## Claude Design 시스템 프롬프트 422라인이 실제로 말하는 것

세션 2의 시작 프롬프트는 "claude design 코드 유출된 거 찾아줘"였다. `claude.ai/design`은 2026-04-17 출시된 Anthropic Labs 신제품이다.

`elder-plinius/CL4R1T4S` 레포에서 `ANTHROPIC/Claude-Design-Sys-Prompt.txt`를 찾았다. 422라인, 약 73KB. 커밋 타임스탬프가 출시일(2026-04-17)과 정확히 일치했다.

실제 소스 코드 유출은 없었다. Claude Code TypeScript 51만 3천 줄은 2026-03-31 npm sourcemap 사고로 유출됐지만, Claude Design의 React 코드는 공개된 적 없다. 422라인으로 알 수 있는 건 역할 정의와 툴 스키마뿐이다.

```
역할: "HTML을 도구로 쓰는 전문 디자이너"
출력: HTML이 유일한 네이티브 포맷
기반 모델: Claude Opus 4.7 (고정)
환경: 파일시스템 기반 프로젝트 워크스페이스
```

일반 Claude.ai 채팅과 가장 다른 점은 **파일시스템 기반 프로젝트 격리**다. 상대 경로로 파일을 참조하고, 프로젝트 간 컨텍스트가 분리된다. 이건 프롬프트가 아니라 별도 웹 제품이다 — Pro/Max/Team/Enterprise 전용.

CLI에서 재현 가능한 부분만 뽑아 `~/.claude/skills/claude-design-lite/SKILL.md`를 만들었다. Live Preview, Tweaks 패널 같은 호스트 의존 기능은 버리고 **질문 기법·컨텍스트 수집·변주 생성·AI-slop 가드**만 이식했다. Claude Design이 사용자에게 던지는 10가지 질문 패턴을 분석해서 스킬 안에 넣었다.

## 스킬 만들고 바로 실전 — jidonglab.com 리디자인 4개 방향

스킬을 만든 즉시 jidonglab.com에 적용했다. `~/jidonglab-redesign/`에 방향 4개를 동시에 생성했다: `v1-notebook.html`(노트북 스타일), `v2-pro.html`(테크 포트폴리오), `v2-studio.html`(스튜디오), `v3-labos.html`(실험적).

피드백은 "2번 괜찮은데 좀 더 고도화". 이어서 실제 커밋·포스트·빌드로그 데이터를 히트맵으로 보고 싶다는 요구가 나왔다. 카피 방향이 여기서 확정됐다:

> "매일, 기록한다. 1년치 커밋·포스트·빌드로그를 한 화면에. 놀았던 날도, 폭주한 날도 숨기지 않는다."

실제 GitHub API 연동은 다음 세션 작업으로 넘겼다.

## 도구 사용 통계

| 도구 | 세션 1 | 세션 2 | 합계 |
|------|--------|--------|------|
| Edit | 23 | 37 | 60 |
| Bash | 31 | 24 | 55 |
| Write | 10 | 11 | 21 |
| TaskUpdate | 18 | — | 18 |
| Read | — | 8 | 14 |
| WebSearch | — | 11 | 11 |
| TaskCreate | 9 | — | 9 |
| Agent | 5 | — | 5 |

TaskCreate·TaskUpdate 27건은 세션 1의 병렬 에이전트 패턴 때문이다. WebSearch 11회는 Claude Design 관련 사실 교차검증에 썼다. 생성 파일 19개, 수정 파일 4개.
