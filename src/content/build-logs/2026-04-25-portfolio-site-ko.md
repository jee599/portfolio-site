---
title: "텔레그램 5자로 4개 포스트 발행 — auto-publish 실전 로그"
project: "portfolio-site"
date: 2026-04-25
lang: ko
tags: [claude-code, auto-publish, multi-platform, agents, automation, telegram]
description: "텔레그램 '글 써줘' 한 줄이 97 tool call, 29시간 39분짜리 파이프라인을 돌렸다. 중복 감지 → 전략 수정 → Agent 4개 병렬 → DEV.to 1자 초과 트랩까지 실전 기록."
---

텔레그램에 "gpt 5.5랑 덕테이프 관련해서 블로그 글 써줘"라고 보냈다. 이 11자가 97번의 tool call을 트리거했다.

**TL;DR** `auto-publish` 스킬이 리서치 → 중복 감지 → 전략 수정 → Agent 4개 병렬 생성 → 3플랫폼 발행을 혼자 처리했다. 사람이 입력한 건 "2편으로 나눠줘", "발행 대기러 돌려" 두 문장이 전부다.

## 요청에 키워드 두 개가 섞여 있었다

"GPT 5.5"와 "덕테이프"는 전혀 다른 OpenAI 프로젝트다. `WebSearch` 3회로 맥락을 잡았다.

- **GPT-5.5 (코드명 Spud)** — 2026-04-23 릴리스된 추론 모델
- **Duct Tape (GPT Image 2)** — LM Arena에서 `packingtape`/`maskingtape` 가명으로 테스트 중인 이미지 모델

두 개를 묶는 앵글: "OpenAI의 4월 양손 런치 — 추론 + 이미지 = super app 퍼즐"

구조안을 짜기 전에 히스토리 중복 체크를 먼저 돌렸다.

## 8일 전에 이미 썼다는 걸 발견했다

2026-04-16에 "OpenAI Duct Tape / GPT Image 2" 글을 spoonai.me, DEV.to, Hashnode 세 곳에 이미 발행한 상태였다.

전략을 바꿨다. **GPT-5.5(Spud)를 메인**으로, 덕테이프는 기존 글에 내부 링크로 연결하는 구조. 같은 주제를 다시 쓰는 건 중복이고, canonical 링크로 연결하면 SEO상 오히려 낫다.

이 판단은 모델이 혼자 내렸다. 사용자에게 확인하지 않았다.

구조안을 텔레그램으로 전송했다. 사용자가 "2편으로 나눠줘"라고 답하면서 방향이 확정됐다.

## Agent 4개 병렬 — 레퍼런스 5개 로드 후 디스패치

디스패치 전에 레퍼런스 5개를 `Read`로 로컬에 올렸다. canonical URL(`https://jidonglab.com/blog/openai-gpt-5-5-spud`)과 DEV.to 유저명을 확인하고 나서 Part 1을 동시에 생성했다.

```
Agent 1 → spoonai.me 한국어 (Part 1)
Agent 2 → spoonai.me 영어 (Part 1)
Agent 3 → DEV.to 영어 (Part 1)
Agent 4 → Hashnode 영어 (Part 1)
```

4개가 동시에 돌면서 파일을 생성했다. Part 2는 Part 1 발행 확인 후 동일 방식으로 처리했다.

"발행 대기러 돌려" — 이 한 마디에 `git add`, `git commit`, `git push`가 플랫폼별로 자동 실행됐다.

## DEV.to 156자 트랩

4개 생성 후 검수 단계에서 DEV.to `description`이 156자였다. 플랫폼 제한은 155자다. 1자 초과.

트림하고 재확인 후 `git push`를 날렸다. 이 버그가 걸린 이유는 생성 → 검수 → 발행 단계가 분리돼 있어서다. 파이프라인이 일체형이었다면 그냥 넘어갔을 것이다.

> 플랫폼별 제약은 생성 단계가 아니라 검수 단계에서 잡힌다. 분리된 파이프라인 구조가 이걸 가능하게 한다.

## 세션 수치

| 항목 | 값 |
|---|---|
| 세션 길이 | 29시간 39분 |
| 총 tool calls | 97회 |
| Bash | 42회 (43%) |
| 텔레그램 메시지 | 11회 |
| Agent 디스패치 | 8회 |
| Read | 7회 |
| 생성 포스트 | 4개 |
| 발행 플랫폼 | 3개 |

Bash 42회 중 대부분은 `git add + commit + push`가 플랫폼별로 각각 돌아서다. 하나의 multi-repo push 커맨드로 묶으면 횟수를 절반 이하로 줄일 수 있다.

텔레그램이 입력 채널이 되면, 컨텍스트 없이 짧은 메시지 하나로도 파이프라인 전체를 트리거할 수 있다. 프롬프트를 길게 쓸 필요가 없다.
