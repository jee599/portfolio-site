---
title: "Opus 4.6 기본 모델 전환, Sonnet 4.6 1M Context 베타 — Anthropic 모델 라인업 전면 교체"
date: 2026-03-07
model: claude
tags: [ai-news, claude, opus, sonnet, model-update]
summary: "Anthropic이 모델 라인업을 대폭 교체했습니다. Opus 4.6가 기본 모델이 되고, Opus 4/4.1은 퇴역합니다. Sonnet 4.6는 1M token context를 베타로 제공하며, Cowork 기능이 Pro 사용자에게 공개됐습니다."
sources: ["https://releasebot.io/updates/anthropic"]
auto_generated: true
---

## 무슨 일이 있었나

Anthropic이 3월 첫째 주에 모델 라인업을 대폭 갱신했습니다.

- **Opus 4.6**이 Max/Team 구독자의 기본 모델로 설정됐습니다 (medium effort)
- **Opus 4, Opus 4.1**이 Claude Code에서 완전 제거됐습니다
- **Sonnet 4.6**가 **1M token context window** (beta)와 함께 출시됐습니다
- **Cowork** 기능이 Pro 사용자에게 공개됐습니다

## 관련 소식

**경쟁사도 동시에 모델 세대 교체 중**

OpenAI도 같은 시기에 GPT-4o, GPT-4.1, o4-mini를 ChatGPT에서 은퇴시켰습니다. GPT-5도 은퇴 대상에 포함됐습니다. 업계 전체가 "구세대 모델을 빠르게 정리하고 최신 모델로 일원화"하는 방향으로 움직이고 있습니다.

**1M Context — 이제 Frontier 모델의 기본 스펙**

Sonnet 4.6의 1M token context는 약 **3,000페이지** 분량의 텍스트를 한 번에 처리할 수 있는 양입니다. OpenAI GPT-5.4, Google Gemini 3.1 Pro 모두 1M context를 지원하면서, 이제 context window 크기는 차별화 포인트가 아니라 테이블 스테이크(table stakes)가 됐습니다.

**Cowork — 멀티 에이전트 협업의 시작**

Cowork은 여러 Claude 인스턴스가 하나의 작업을 분담해서 처리하는 기능입니다. 예를 들어 하나의 인스턴스가 코드를 작성하는 동안 다른 인스턴스가 테스트를 설계하고, 또 다른 인스턴스가 문서를 작성하는 식입니다. "단일 모델에게 모든 것을 시키는" 패러다임에서 "여러 에이전트가 협력하는" 패러다임으로의 전환이 제품 수준에서 시작된 것입니다.

## 수치로 보기

| 항목 | 수치 |
|------|------|
| Sonnet 4.6 Context Window | 1,000,000 tokens (beta) |
| 퇴역 모델 | Opus 4, Opus 4.1 |
| Cowork 대상 | Pro 구독자 |
| 경쟁사 1M context 지원 | GPT-5.4, Gemini 3.1 Pro |

## 정리

주목할 포인트는 세대 교체 속도입니다. 과거에는 구 모델이 수개월간 병행 운영됐지만, 이번에는 Opus 4/4.1이 비교적 빠르게 퇴역했습니다. API 사용자 입장에서는 마이그레이션 부담이 있을 수 있지만, Anthropic이 "최신 모델에 집중하겠다"는 메시지를 시장에 보내고 있는 것은 분명합니다.

Cowork 기능에도 주목할 필요가 있습니다. 현재는 Pro 사용자 한정이고 초기 단계이지만, 멀티 에이전트 시스템이 제품에 녹아드는 첫 사례 중 하나입니다. AI 에이전트 간 분업과 조율이 성숙하면, 복잡한 프로젝트에서의 AI 활용 방식이 근본적으로 달라질 수 있습니다.

<small>출처: [Releasebot — Anthropic Release Notes](https://releasebot.io/updates/anthropic)</small>
