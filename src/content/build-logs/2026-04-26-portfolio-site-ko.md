---
title: "Claude Design 시스템 프롬프트 422라인 역공학 — 로컬 스킬 이식까지"
project: "portfolio-site"
date: 2026-04-26
lang: ko
tags: [claude-code, claude-design, reverse-engineering, skill, jidonglab]
description: "Claude Design 출시 9일 만에 GitHub에 422라인 시스템 프롬프트가 공개됐다. 이걸 분석해 로컬 Claude Code 스킬로 이식하고, jidonglab 리디자인 3종까지 한 세션에 처리했다."
---

Claude Design이 출시된 지 9일째 되는 날, `elder-plinius/CL4R1T4S` 레포에 422라인짜리 시스템 프롬프트가 올라왔다. 세션 시작 프롬프트는 단 6글자였다: "claude design 코드 유출된거 찾아줘".

**TL;DR** 유출된 Claude Design 시스템 프롬프트를 역공학해 로컬 Claude Code 스킬로 이식했다. 150 tool calls, 87시간 세션.

## 유출본을 어디서 찾았냐

처음엔 모델이 엉뚱한 걸 뒤졌다 — 로컬 프로젝트 파일, 오래된 Claude Code 관련 글들. "claude design 코드 유출된거"가 무엇을 가리키는지 맥락이 없었기 때문이다.

두 번째 프롬프트에 URL을 직접 박았다. `https://claude.ai/design` 관련된거. 그제서야 방향이 잡혔다.

WebSearch로 찾아낸 경로: `elder-plinius/CL4R1T4S/ANTHROPIC/Claude-Design-Sys-Prompt.txt`. 커밋 이력은 딱 2개다 — 2026-04-17 19:55 생성, 19:56 이름 변경. Claude Design 공식 출시일과 정확히 일치한다.

## 422라인에서 뭘 뽑았냐

WebFetch로 전문을 긁어서 분석했다. 팩트 기반으로 역공학한 구조는 이렇다.

**정체성과 출력 포맷**

역할은 "HTML을 도구로 쓰는 전문 디자이너". 유일한 네이티브 출력 포맷은 HTML이다. 영상, 슬라이드, 프로토타입 — 전부 HTML로 구현한 뒤 변환한다. 파일시스템 기반 프로젝트 구조를 강제하고, 경로는 `<relative path>` 규칙을 따른다.

**내장 툴 분류**

생성 계열 7종: `createArtifact`, `generateImage`, `createPresentation`, `createVideo`, `create3DScene`, `createUI`, `createDiagram`. Export 계열 6종: `exportToPDF`, `exportToPPTX`, `exportToFigma`, `exportToCode`, `createSite`, `exportToVideo`.

툴 스키마까지 전부 공개돼 있어서 각 툴의 파라미터 구조, 제약 조건, 반환 타입을 그대로 읽을 수 있었다.

**일반 Claude와의 핵심 차이**

일반 Claude가 텍스트 응답을 기본으로 HTML을 선택적으로 쓰는 것과 달리, Claude Design은 HTML이 기본 매체다. 질문 기법도 다르다 — 사용자의 의도, 대상 독자, 감성 키워드, 레퍼런스를 먼저 수집한 뒤 생성에 들어간다.

## 로컬 스킬로 이식

목표는 명확했다: "Live Preview, Tweaks 같은 호스트 의존 기능은 버리고, 질문 기법·컨텍스트 수집·AI-slop 가드만 이식".

`~/.claude/skills/claude-design-lite/` 아래 3개 파일을 만들었다.

- `SKILL.md` — 스킬 본체. 발동 전 3가지 자문 + 질문 단계 + 생성 단계 + 결과물 기준
- `reference/question-templates.md` — Claude Design 특유의 10개 컨텍스트 질문 추출본
- `reference/starter-kit.html` — HTML 출력 기반 스켈레톤

스킬의 핵심은 **발동 전 3가지 자문**이다. "이게 진짜 디자인 작업인가, 아니면 단순 마크업인가 / 사용자가 이미 충분한 컨텍스트를 줬는가 / follow-up인가 새 탐색인가." 이 분기로 질문 단계를 축소하거나 생략한다.

## jidonglab 리디자인은 테스트였다

스킬을 만들었으면 써봐야 한다. "jidonglab.com 디자인 리디자인 해줘"로 검증에 들어갔다.

스킬이 10개 질문을 던졌다. 대부분 한 글자 또는 단어로 답했다 — "정체성 없음", "전체", "토스 그린", "c". 질문이 구조화돼 있으면 짧은 답에서도 충분한 컨텍스트가 나온다.

생성된 variant는 4종이다.

- `v1-notebook.html` — 노트북 스타일, 정적이고 무거운 느낌
- `v2-pro.html` — 테크 포트폴리오 방향, 히트맵 + 활동 통계 중심
- `v2-studio.html` — 스튜디오 톤
- `v3/home.html` + `hero-variations.html` — 심플 + 트렌디 방향

`v2-pro.html` 이후 피드백이 들어왔다. "활동 히트맵 숫자가 진짜야? 좀 더 심플하고 트렌디하게." Edit 37번 중 상당수가 이 iteration 과정에서 발생했다. 히트맵 데이터는 실제 GitHub API에서 땡겨오는 게 아니라 하드코딩이었다. `src/pages/api/now.ts`를 새로 만들어 실제 데이터를 연결하는 작업으로 마무리했다.

## 도구 사용 통계

| 도구 | 횟수 |
|---|---|
| Bash | 43 |
| Edit | 37 |
| Write | 15 |
| Read | 13 |
| WebSearch | 11 |
| WebFetch | 5 |
| 기타 | 26 |
| **합계** | **150** |

Bash 43회는 대부분 `open` 명령으로 브라우저에서 HTML variant를 열어보는 것과 dev server 기동이었다. Edit 37회가 실질적인 코드 변경을 담당했다. WebSearch 11회 + WebFetch 5회가 유출본 탐색과 Claude Design 관련 공식 자료 교차검증에 쓰였다.

## 역공학은 코드를 보는 게 아니다

강제된 contract — 툴 스키마, 파라미터 제약, 반환 타입 — 에서 구조를 읽는 것이다. 시스템 프롬프트 422라인은 구현 세부사항보다 더 중요한 걸 담고 있다: 제품이 무엇을 하려는지의 의도.

`claude-design-lite` 스킬은 그 의도를 이식한 것이다. 같은 결과물을 내는 게 아니라, 같은 방식으로 생각하는 것.
