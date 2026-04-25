---
title: "97번 tool call, 30시간 세션 — Claude로 GPT-5.5 분석 글 3곳 동시 발행"
project: "portfolio-site"
date: 2026-04-26
lang: ko
tags: [claude-code, auto-publish, multi-agent, telegram]
description: "단일 세션 97회 tool call, 29시간 39분. Claude Opus 4.7이 GPT-5.5(Spud) 분석 블로그 글을 2편으로 쪼개 spoonai.me·DEV.to·Hashnode 3곳에 동시 발행한 과정."
---

97번. 단일 세션에서 Claude가 도구를 호출한 횟수다. 29시간 39분 동안 Bash 42번, 텔레그램 응답 11번, Agent 8번. "GPT 5.5랑 덕테이프 관련해서 블로그 글 써줘"라는 짧은 텔레그램 메시지 하나로 시작됐다.

**TL;DR** GPT-5.5(코드명 Spud)와 Duct Tape(GPT Image 2) 분석 글을 2편으로 나눠 3개 플랫폼에 동시 발행했다. 핵심은 중복 체크 — 8일 전에 이미 Duct Tape 글이 발행돼 있어서 구성 전략을 바꿨다.

## 텔레그램 한 줄이 30시간 작업으로

메시지는 짧았다. `gpt 5.5랑 덕테이프 관련해서 블로그 글 써줘`. 이걸 받자마자 `auto-publish` 스킬을 띄우고 리서치부터 시작했다.

GPT-5.5와 Duct Tape는 전혀 다른 프로젝트였다. **GPT-5.5(코드명 Spud)**는 2026-04-23 릴리스된 새 모델이고, **Duct Tape**는 LM Arena에서 `packingtape`/`maskingtape` 가명으로 테스트 중인 GPT Image 2의 내부 코드명이다. 묶는 앵글은 "OpenAI의 4월 양손 런치: 추론 + 이미지 = super app 퍼즐"로 잡았다.

리서치 결과를 텔레그램으로 정리해 보냈다. 승인 대기 없이 바로 구조안까지 함께 전송했다.

## 중복 체크가 전략을 바꿨다

레퍼런스를 수집하기 전에 기존 발행 이력을 먼저 뒤졌다. 여기서 결정적인 게 나왔다.

**8일 전(2026-04-16)에 "OpenAI Duct Tape / GPT Image 2" 글을 3곳 전부에 이미 발행했다.** 그쪽은 이미 깊게 커버됐다. 새 글을 그대로 쓰면 중복이다.

전략을 수정했다. GPT-5.5(Spud)를 메인으로, Duct Tape는 기존 글 내부 링크로만 연결하는 구성. canonical URL은 `https://jidonglab.com/blog/openai-gpt-5-5-spud`로 통일했다.

사용자 요청("2편으로 나눠줘")을 받아 Part 1(GPT-5.5 기술 분석)과 Part 2(OpenAI Super App 로드맵)로 분리했다.

## Agent 4개 병렬 디스패치

레퍼런스 5개 로드 완료 후 한 번에 4개 Agent를 병렬 디스패치했다.

```
1. @content-writer → "Part 1 ko (spoonai.me)"
2. @content-writer → "Part 1 en (spoonai.me)"
3. @content-writer → "Part 1 DEV.to (영어)"
4. @content-writer → "Part 1 Hashnode (영어)"
```

순차 작업이었으면 4배 시간이 걸렸다. 병렬로 던지면 가장 느린 Agent 시간만 걸린다.

생성 후 체크 과정에서 사소한 버그가 하나 나왔다. DEV.to description이 156자 — 제한인 155자를 1자 초과했다. 트리밍하고 push.

## 발행 흐름

Part 1 검증 후 Part 2도 같은 방식으로 처리했다. 최종 발행 흐름은 이렇다.

```
spoonai-site:
  git add content/blog/2026-04-25-openai-gpt-5-5-spud-{ko,en}.md
  git commit -m "feat: GPT-5.5 Spud 분석 (Part 1 ko/en)"
  git push origin main

dev_blog:
  git add posts/2026-04-25-openai-gpt-5-5-spud-en.md
  git push origin main
```

텔레그램으로 각 단계 완료 보고를 보냈다. 에러가 나면 즉시 텔레그램으로 알리는 구조라 세션 도중에 자리를 비워도 됐다.

## 이 세션에서 쓴 도구 분포

| 도구 | 횟수 | 용도 |
|---|---|---|
| Bash | 42 | git push, 파일 확인, 메타 조회 |
| 텔레그램 응답 | 11 | 진행 상황 보고, 구조안 전송 |
| TaskUpdate | 11 | 세션 내 태스크 상태 업데이트 |
| Agent | 8 | 콘텐츠 병렬 생성 |
| TaskCreate | 7 | 세부 태스크 생성 |
| Read | 7 | 레퍼런스·기존 파일 확인 |

Bash가 42회로 가장 많은 건 git 작업과 파일 시스템 확인이 반복됐기 때문이다. 콘텐츠 생성 자체는 Agent 8회로 처리됐다.

## 중복 체크 없이 진행했으면

같은 주제의 글이 두 번 발행됐을 거다. SEO 관점에서 canonical이 충돌하고, 독자 입장에선 중복 콘텐츠다. 리서치 단계에서 발행 이력을 먼저 확인하는 순서가 중요하다.

`auto-publish` 스킬의 Phase 1(소재 분석)이 이걸 강제한다. 키워드 입력 시 기존 발행 이력 확인이 포함돼 있다. 스킬을 따르면 이 실수를 건너뛸 수 있다.
