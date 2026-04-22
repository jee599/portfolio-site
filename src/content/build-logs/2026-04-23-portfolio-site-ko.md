---
title: "Claude Design 시스템 프롬프트 역공학 + 5-에이전트 병렬 검증, 2세션 201 tool calls"
project: "portfolio-site"
date: 2026-04-23
lang: ko
tags: [claude-code, multi-agent, claude-design, reverse-engineering, research-verification]
description: "422줄 Claude Design 시스템 프롬프트를 역공학해서 로컬 스킬로 이식하고, 66,745단어 리서치 문서를 5개 에이전트로 한 세션에 검증한 작업 기록. 총 201 tool calls."
---

어제 하루 Claude Code 세션 2개를 돌렸다. 3시간 12분 + 2시간 5분, 총 201 tool calls. 한 세션은 치과 광고 리서치 검증, 다른 한 세션은 Claude Design 시스템 프롬프트를 파헤치는 데 썼다.

**TL;DR** 5개 에이전트 병렬로 66,745단어 문서를 검증했고, 422줄 시스템 프롬프트를 분석해서 로컬 CLI 스킬로 이식했다.

## 5개 에이전트, 하나의 리서치 문서를 동시에 뜯다

`/Users/jidong/dentalad/ads-research/`에 쌓인 리서치 문서가 66,745단어다. V1 원본 12건 + V2 검증본 8건 + 통합 4건. 단일 컨텍스트로 읽으면 토큰이 터진다. 그래서 도메인별로 쪼개서 에이전트 5개를 동시에 날렸다.

```
1. 규제 검증 — AI 기본법·공정위·대법원·의료법
2. 경쟁사 검증 — 케어랩스 외 Top 5 + 글로벌
3. 플랫폼 검증 — 네이버·Meta·ChatGPT 동향
4. 유닛 이코노믹스 — 원가·가격·MRR 구조
5. 시장 데이터 — CRM·ROAS·LTV·TAM 수치
```

에이전트마다 특정 도메인의 사실 여부를 웹 검색으로 교차검증하고 리포트를 낸다. 순차적으로 하면 4~5시간짜리 작업이다. 병렬로 돌리니 전체 완료까지 단일 세션 안에 끝났다.

결과에서 건진 것들이 있다. 플랫폼 리포트에서 "ChatGPT가 네이버 차단"이라는 문장이 **주어가 반대**였다는 걸 잡아냈다. 실제로는 네이버가 ChatGPT 봇을 차단한 것이다. 이런 식의 미묘한 사실 오류는 원문 읽기만 해서는 놓친다. 역할을 쪼개서 각 에이전트가 "반증"에 집중하도록 프롬프트를 짜야 한다.

> 검증 에이전트는 "사실이다"를 찾는 게 아니라 "이게 틀릴 수 있는 이유"를 찾도록 프롬프트해야 한다.

규제 도메인에서도 타이밍 오류가 나왔다. 공정위 가상인물 규제는 "시행"이 아니라 "행정예고 단계"였다. 5배 징벌적 손배도 입법은 2026 Q1이지 발표일이 시행일이 아니다. 리서치 문서가 틀린 게 아니라 시점 표현이 부정확했던 것인데, 이런 뉘앙스 차이가 실제 비즈니스에서는 크게 다르다.

## Claude Design 시스템 프롬프트, 422줄을 전부 읽었다

2026-04-17에 Anthropic Labs가 `claude.ai/design`을 출시했다. 같은 날 GitHub에 시스템 프롬프트가 올라왔다. `elder-plinius/CL4R1T4S` 레포의 `ANTHROPIC/Claude-Design-Sys-Prompt.txt`. 422줄, 약 73KB.

처음에는 "Claude Design 코드 유출된 거 찾아줘"라는 요청이었다. 소스 코드 유출은 없었다. Claude Code TypeScript 소스 51만 3천 줄은 2026-03-31에 npm sourcemap 사고로 나왔지만, Design의 React 코드는 공개 안 됐다. 유출된 건 시스템 프롬프트와 툴 스키마뿐이다.

그 422줄로 내부 구조를 역공학했다.

```
claude.ai/design (Next.js / React)
  ├── Live Preview iframe
  ├── Tweaks 패널 (palette / font / density)
  ├── Claude Opus 4.7 (모델 고정)
  └── 파일시스템 기반 프로젝트 워크스페이스
```

프롬프트에서 읽어낸 핵심: 이 모델은 "HTML을 도구로 쓰는 전문 디자이너"로 설정돼 있다. 사용자는 매니저, 모델은 실무자. 영상·슬라이드·프로토타입 모두 HTML로 구현한다. 일반 Claude 채팅과 다른 점은 **파일시스템 기반 프로젝트**라는 것이다. 상대 경로로 파일을 참조하고, 프로젝트 간 격리가 된다.

그 다음 질문은 당연히 "CLI에서 똑같이 낼 수 없어?"였다. Live Preview나 Tweaks 패널 같은 호스트 의존 기능은 복제가 안 된다. 하지만 **질문 기법·컨텍스트 수집·변주 생성·AI-slop 가드**는 이식 가능하다.

결과물: `~/.claude/skills/claude-design-lite/SKILL.md`. Claude Design이 사용자에게 던지는 10가지 질문 패턴을 분석해서 로컬 스킬에 박아 넣었다. 이제 `claude-design-lite` 스킬을 발동하면 프롬프트 없이도 비슷한 방식으로 디자인 컨텍스트를 수집한다.

## jidonglab.com 리디자인, 4개 방향 동시에

Claude Design 분석이 끝나자마자 바로 적용했다. `~/jidonglab-redesign/`에 4개 방향을 동시에 생성했다.

- `v1-notebook.html` — 노트북 스타일
- `v2-pro.html` — 테크 포트폴리오
- `v2-studio.html` — 스튜디오 느낌
- `v3-labos.html` — 실험적 방향

사용자 피드백: "2번 괜찮은데 좀 더 고도화할 거 없어? 테크 포트폴리오 느낌으로". 그 다음에 나온 요구사항이 실제 커밋 히트맵이었다.

> "매일, 기록한다. 1년치 커밋·포스트·빌드로그를 한 화면에. 놀았던 날도, 폭주한 날도 숨기지 않는다."

이 카피가 확정되면서 히트맵 섹션의 방향이 잡혔다. 실제 GitHub 데이터를 붙이는 건 다음 세션 작업이다.

## 도구 사용 패턴

세션 1 (dentalad 검증): Bash 31, Edit 23, TaskUpdate 18, Write 10, TaskCreate 9  
세션 2 (Claude Design + 리디자인): Edit 37, Bash 24, WebSearch 11, Write 11, Read 8

두 세션 합산으로 Edit이 60회, Bash가 55회다. 검증 세션에서 `TaskCreate`와 `TaskUpdate`가 많은 건 에이전트 디스패치와 완료 알림을 추적했기 때문이다. 리디자인 세션에서 `WebSearch`가 11회 나온 건 Claude Design 관련 사실 교차검증에 썼다.

생성 파일 19개, 수정 파일 4개. 검증 리포트 5개(`verification/01~05.md`)와 HTML 가이드, 리디자인 변형 4개가 대부분이다.
