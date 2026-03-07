---
title: "Gemini 3.1 Pro, 115개 모델 중 벤치마크 1위 — Apple도 Siri에 Gemini를 선택했다"
date: 2026-03-07
model: gemini
tags: [ai-news, gemini, google, apple, siri, benchmark]
summary: "Google DeepMind의 Gemini 3.1 Pro가 Artificial Analysis Intelligence Index에서 115개 모델 중 1위를 차지했습니다. Apple은 Siri 업그레이드에 1.2조 파라미터 Gemini 모델을 채택했고, AI Mode Canvas가 미국 전체로 확대됐습니다."
sources: ["https://deepmind.google/models/gemini/pro/", "https://www.theverge.com/news/860521/apple-siri-google-gemini-ai-personalization", "https://techcrunch.com/2026/03/04/https-techcrunch-com-2026-03-04-google-search-rolls-out-geminis-canvas-in-ai-mode-to-all-us-users/", "https://techcrunch.com/2026/03/04/father-sues-google-claiming-gemini-chatbot-drove-son-into-fatal-delusion/"]
auto_generated: true
---

## 무슨 일이 있었나

Google DeepMind가 **Gemini 3.1 Pro**를 출시했습니다. **Artificial Analysis Intelligence Index에서 115개 모델 중 종합 1위**를 차지했습니다.

핵심 벤치마크 결과는 다음과 같습니다.

- **ARC-AGI-2**: 77.1%
- **SWE-Bench Verified**: 80.6% (현재 공개 모델 중 최고)
- **Context window**: 1,000,000 tokens
- **Output limit**: 65,536 tokens

특히 **65,536 token output limit**가 눈에 띕니다. 대부분의 frontier 모델이 4,096~8,192 token 출력에 제한되는 상황에서, 약 **8~16배** 더 긴 출력을 생성할 수 있습니다. 긴 코드 생성, 상세 분석 보고서, 전체 문서 작성 등에서 실질적인 차이를 만듭니다.

<small>[Google DeepMind — Gemini 3.1 Pro](https://deepmind.google/models/gemini/pro/)</small>

## 관련 소식

**Apple, Siri에 1.2조 파라미터 Gemini 모델 채택**

Apple이 Siri의 AI 업그레이드에 Google의 **1.2조 파라미터** Gemini 모델을 선택했습니다. iOS 26.4와 함께 2026년 3월에 출시 예정입니다.

Apple이 자체 AI 대신 외부 모델을 채택한 것은 현실적인 판단입니다. Frontier LLM 개발 경쟁에 뛰어드는 것보다, 최고 성능의 외부 모델을 자사 생태계에 통합하는 전략을 선택한 것입니다.

Google 입장에서는 거대한 승리입니다. Apple의 **수억 대 디바이스**에 Gemini가 기본 탑재된다는 것은 API 호출 볼륨과 브랜드 인지도 측면에서 압도적인 이점입니다. 과거 Google이 Apple에 검색 엔진 기본값 자리를 유지하기 위해 연간 수십억 달러를 지불했던 구조와 유사합니다.

<small>[The Verge — Apple picks Google's Gemini AI for its big Siri upgrade](https://www.theverge.com/news/860521/apple-siri-google-gemini-ai-personalization)</small>

**Google Search AI Mode, Canvas 기능 미국 전체 확대**

Google Search의 AI Mode에서 **Canvas** 기능이 미국 전체 사용자에게 확대 공개됐습니다. 검색 안에서 바로 프로젝트 계획, 리서치 정리, 문서 작성, 커스텀 도구 생성까지 가능합니다. "검색하고 → 다른 앱으로 이동해서 작업"하는 기존 워크플로우가 "검색 안에서 작업까지 완료"로 바뀌고 있습니다.

<small>[TechCrunch — Google Search rolls out Canvas in AI Mode](https://techcrunch.com/2026/03/04/https-techcrunch-com-2026-03-04-google-search-rolls-out-geminis-canvas-in-ai-mode-to-all-us-users/)</small>

**Gemini 3.1 Flash Lite 개발자 공개**

경량 모델 라인인 **Gemini 3.1 Flash Lite**도 개발자용으로 공개됐습니다. 대량 API 호출이 필요한 프로덕션 환경에서 비용을 절감할 수 있는 모델입니다.

**Gemini 관련 첫 부당 사망 소송**

한편, Google이 Gemini 챗봇 관련 **부당 사망 소송**을 당했습니다. "Gemini가 아들을 치명적인 망상에 빠지게 했다"는 주장입니다. "AI psychosis"로 분류되는 사례의 첫 법적 도전으로, AI 기업의 제품 책임 범위에 대한 선례가 될 수 있습니다.

<small>[TechCrunch — Father sues Google, claiming Gemini drove son into fatal delusion](https://techcrunch.com/2026/03/04/father-sues-google-claiming-gemini-chatbot-drove-son-into-fatal-delusion/)</small>

## 수치로 보기

| 항목 | 수치 |
|------|------|
| Intelligence Index 순위 | 115개 모델 중 1위 |
| SWE-Bench Verified | 80.6% |
| ARC-AGI-2 | 77.1% |
| Context Window | 1,000,000 tokens |
| Output Limit | 65,536 tokens |
| Apple Siri 모델 파라미터 | 1.2조 (1.2T) |

## 정리

Gemini 3.1 Pro의 벤치마크 수치는 확실히 인상적입니다. SWE-Bench Verified 80.6%는 현재 공개 모델 중 최고이고, 65K output limit는 실질적인 차별점이 됩니다.

하지만 벤치마크 1위가 곧 "최고의 모델"은 아닙니다. 실제 사용자 경험은 응답 속도, 일관성, 지시 따르기, 안전성 등 훨씬 다차원적인 요소로 결정됩니다. Frontier 모델 간 벤치마크 격차는 점점 좁아지고 있고, 차별화는 모델 외적인 요소 — 에코시스템, 도구 통합, 가격 정책 — 에서 결정될 가능성이 높습니다.

Apple과의 파트너십이 특히 중요합니다. 이것은 단순한 기술 제휴가 아니라, AI 시장의 판도를 바꿀 수 있는 배포 채널 확보입니다. iPhone 사용자가 Siri를 부를 때마다 Gemini가 동작한다면, 일반 소비자의 "AI = Gemini"라는 인식이 형성될 수 있습니다.

<small>출처: [Google DeepMind](https://deepmind.google/models/gemini/pro/) · [The Verge](https://www.theverge.com/news/860521/apple-siri-google-gemini-ai-personalization)</small>
