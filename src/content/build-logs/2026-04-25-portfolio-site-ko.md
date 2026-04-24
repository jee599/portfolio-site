---
title: "텔레그램 한 줄 → 4개 포스트 자동 발행 — GPT-5.5 블로그 배포 로그"
project: "portfolio-site"
date: 2026-04-25
lang: ko
tags: [claude-code, auto-publish, multi-platform, agent, automation]
description: "Telegram 요청 하나로 GPT-5.5(Spud) 블로그 한/영 4편을 생성해 3개 플랫폼에 동시 발행. 중복 감지 → 전략 수정 → Agent 병렬 투입 → DEV.to 156자 트랩까지 실전 기록."
---

텔레그램에 "gpt 5.5랑 덕테이프 관련해서 블로그 글 써줘"라고 보냈다. 29시간 39분 뒤, 97번의 tool call이 돌았고 한/영 4개 포스트가 3개 플랫폼에 올라갔다.

**TL;DR** `auto-publish` 스킬이 리서치 → 중복 감지 → 전략 수정 → 병렬 생성 → 발행까지 혼자 처리했다. 사람 개입은 "2편으로 나눠줘" 한 마디뿐이었다.

## "gpt 5.5랑 덕테이프"가 뭔지부터 파악했다

요청에 키워드 두 개가 섞여 있었다. `auto-publish` 스킬은 곧바로 쓰지 않고 `WebSearch` 3번으로 맥락부터 잡았다.

결과: GPT-5.5(코드명 **Spud**, 2026-04-23 릴리스)와 Duct Tape(**GPT Image 2**, LM Arena에서 `packingtape`/`maskingtape` 가명으로 테스트 중인 이미지 모델)은 완전히 다른 프로젝트다. 앵글은 "OpenAI의 4월 양손 런치: 추론 + 이미지 = super app 퍼즐"로 잡았다.

## 8일 전에 이미 썼다는 걸 발견했을 때

구조안을 짜기 전에 중복 체크를 돌렸다. 히스토리를 뒤지니 2026-04-16에 "OpenAI Duct Tape / GPT Image 2" 글을 3개 플랫폼 전부에 이미 발행한 상태였다.

전략을 바꿨다. GPT-5.5(Spud)를 메인으로, 덕테이프는 기존 글 내부 링크로 연결하는 구조. 같은 주제를 다시 쓰는 건 중복이고, canonical 링크로 연결하면 SEO상 오히려 낫다.

이 판단은 사람 없이 모델이 혼자 내렸다.

## "2편으로 나눠줘" — Agent 4개 병렬 투입

구조안을 텔레그램으로 전송했다. 사용자가 "2편으로 나눠줘"라고 답했고, Part 1부터 Agent 4개를 동시에 떴다.

```
Agent 1 → spoonai.me 한국어 (Part 1)
Agent 2 → spoonai.me 영어 (Part 1)
Agent 3 → DEV.to 영어 (Part 1)
Agent 4 → Hashnode 영어 (Part 1)
```

레퍼런스 5개를 미리 `Read`로 올려놓고, canonical URL(`https://jidonglab.com/blog/openai-gpt-5-5-spud`)과 DEV.to 유저명을 확인한 뒤 디스패치했다. 4개가 동시에 돌면서 파일을 생성했다.

Part 2는 Part 1 발행 확인 후 같은 방식으로 처리했다. "발행 대기러 돌려" 한 마디에 git add, commit, push까지 자동으로 실행됐다.

## DEV.to 156자 트랩

4개 생성 후 점검 단계에서 DEV.to description이 156자로 나왔다. 플랫폼 제한인 155자를 1자 초과한 것이다. 트림하고 재확인 후 `git push`를 날렸다.

플랫폼별 제약은 생성 단계가 아니라 검수 단계에서 걸린다. 스킬 구조가 생성 → 검수 → 발행으로 분리돼 있어서 놓치지 않았다. 만약 파이프라인이 일체형이었다면 그냥 넘어갔을 것이다.

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
| 발행 플랫폼 | 3개 (spoonai.me, DEV.to, Hashnode) |

Bash 42회 중 대부분은 `git add`, `git commit`, `git push`가 플랫폼별로 각각 돌아서다. 나중에 묶으면 줄일 수 있다.

> 텔레그램이 입력 채널이 되면, 맥락 없이 짧은 메시지 하나로도 파이프라인 전체를 트리거할 수 있다. 프롬프트를 길게 쓸 필요가 없다.
