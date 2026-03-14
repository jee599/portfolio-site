---
title: "GPT-5 vs Gemini Flash vs Claude Opus — 사주 앱에서 6모델 실전 비교"
description: "같은 사주 데이터로 6개 모델을 돌렸다. $0.0003부터 $0.0442까지, 결과물 차이는?"
date: "2026-02-25"
tags: ["ai", "llm", "webdev", "productivity"]
source: "devto"
---

사주 앱 프로덕션 세팅을 하면서, 어떤 모델을 쓸지 결정해야 했다.

이론적인 벤치마크는 의미 없다. 내 앱에서, 내 프롬프트로, 실제 사주 데이터를 넣고 돌려봐야 안다. 그래서 6개 모델을 같은 조건으로 비교했다.


## 테스트 조건

입력 데이터는 1995년 4월 28일 오전 11시 15분생 여성, 양력 기준. 프롬프트는 동일한 사주 해석 시스템 프롬프트에 JSON 출력을 강제했다. 각 모델에 맞는 토큰 절약 기법도 적용했다 — OpenAI는 `response_format: { type: "json_object" }`, Gemini는 `responseMimeType: "application/json"`, Claude는 프롬프트 캐싱.


## GPT-5가 API를 깨뜨렸다

GPT-5를 처음 호출했을 때 바로 400 에러가 떴다.

```
Unsupported parameter: 'max_tokens'
```

GPT-5 시리즈부터 `max_tokens`가 사라지고 `max_completion_tokens`로 바뀌었다. 거기다 `temperature: 0.7`도 안 된다. GPT-5는 temperature 1 고정이다.

```typescript
// Before — GPT-4 시절
{ max_tokens: 4096, temperature: 0.7 }

// After — GPT-5 대응
const isGpt5 = model.startsWith("gpt-5");
{
  ...(isGpt5
    ? { max_completion_tokens: 4096 }
    : { max_tokens: 4096 }),
  temperature: isGpt5 ? 1 : 0.7,
}
```

두 줄 고치는 데 삽질 30분. 에러 메시지가 친절하지 않다.


## 6모델 결과

같은 입력으로 돌린 결과다.

**GPT-5.2** — 20.5초, $0.0117. 실용적이고 구체적인 조언이 많다. "2026년 하반기 전후로 직업적 전환점이 올 가능성이 높습니다" 같은 구체적 시기 언급. JSON 깔끔.

**GPT-5-mini** — 27.5초, $0.004. 느린데 싸다. 근데 JSON이 가끔 빈 텍스트로 온다. 아직 불안정한 느낌.

**Gemini 3 Flash** — 10.3초, $0.0003. 가장 빠르고 가장 싸다. 사주 용어도 정확하다 — "甲寅 일주"를 정확히 짚었다. 내용은 조금 짧지만 무료 티어에 충분하다.

**Claude Opus 4.6** — 36.6초, $0.0442. 가장 비싸고 가장 느리다. 하지만 결과물이 압도적이다. "을해년, 경진월, 기사일, 경오시"까지 사주 계산을 직접 해서 보여줬다. 해석 깊이가 다르다.

**Claude Sonnet 4.6** — 529 에러. 과부하. 3번 다 실패.

**Claude Haiku 4.5** — 5.9초, $0.0037. 짧지만 정확. 가성비 괴물.


## 가격 차이가 말해준다

가장 싼 Gemini Flash와 가장 비싼 Claude Opus의 차이.

**$0.0003 vs $0.0442.**

147배. 같은 사주 입력, 같은 프롬프트.

Opus가 좋긴 좋다. 근데 하루 1,000건이면 Opus는 월 $1,326, Flash는 월 $9. 무료 서비스에 Opus를 쓸 수는 없다.


## 최종 결정

지금 당장은 단순하게 갔다. 무료 티어에 Gemini Flash, 유료에 GPT-5.2. Flash는 속도와 가격이 압도적이고, GPT-5.2는 실용적인 결과물 품질이 좋다.

나중에 유료 프리미엄 티어를 만들면 Opus를 넣을 거다. "AI 사주 명인이 직접 봐드립니다" 같은 느낌으로. 그때는 $0.044가 정당화된다.

> "모든 질문에 교수를 부르지 마라. 조교도 충분한 답이 있다."

[jidonglab.com](https://jidonglab.com)
