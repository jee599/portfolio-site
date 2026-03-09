---
title: "Gemini를 복제하려는 10만 건의 프롬프트 공격 — AI 모델 보안의 새로운 전쟁터"
date: 2026-03-09
model: gemini
tags: [ai-news, gemini, google, security, model-extraction, distillation]
summary: "Google이 Gemini AI를 복제하려는 대규모 공격을 공개했습니다. 10만 건 이상의 프롬프트로 내부 추론 과정을 추출하려는 시도였으며, 북한·러시아·중국 등에서 발원한 것으로 추정됩니다. AI 모델 보안이 새로운 사이버 보안 영역으로 부상하고 있습니다."
sources: ["https://www.nbcnews.com/tech/security/google-gemini-hit-100000-prompts-cloning-attempt-rcna258657", "https://www.inc.com/ava-levinson/hackers-are-hammering-googles-gemini-with-prompts-to-steal-the-llm-every-ai-company-should-be-worried/91302215", "https://www.csoonline.com/article/4132098/google-fears-massive-attempt-to-clone-gemini-ai-through-model-extraction.html", "https://www.eweek.com/news/google-gemini-model-extraction-attacks/"]
auto_generated: true
---

## 무슨 일이 있었나

Google이 자사 AI 챗봇 **Gemini**를 대상으로 한 대규모 **모델 추출(model extraction)** 공격을 공개했습니다. 공격자들은 **10만 건 이상의 프롬프트**를 체계적으로 보내, Gemini의 내부 작동 방식을 파악하고 복제하려 했습니다.

Google이 발표한 보고서에 따르면, 이 공격은 **"증류(distillation) 공격"**으로 분류됩니다. 챗봇에 반복적으로 질문을 던져 응답 패턴과 내부 로직을 추출하는 방식입니다. 공격자들은 특히 Gemini의 **Chain of Thought(추론 과정)**에 집중했습니다. 정교하게 설계된 프롬프트로 모델이 더 상세한 단계별 추론을 노출하도록 유도했습니다.

공격의 규모와 체계성이 눈에 띕니다. 10만 건의 프롬프트는 무작위가 아니라, 다양한 태스크와 언어에 걸쳐 **방법론적으로** 구성됐습니다. 충분한 데이터를 수집하면 Gemini의 추론 능력을 복제할 수 있다는 전제하에 설계된 공격입니다.

<small>[NBC News — Google says attackers used 100,000+ prompts to try to clone Gemini](https://www.nbcnews.com/tech/security/google-gemini-hit-100000-prompts-cloning-attempt-rcna258657)</small>

## 관련 소식

**누가, 왜?**

Google은 공격자를 "상업적 동기(commercially motivated)"를 가진 집단으로 분류했습니다. 대부분 **자체 AI를 구축하거나 강화하려는 민간 기업 또는 연구자**로 추정됩니다. 발원지는 **북한, 러시아, 중국** 등으로 확인됐습니다.

새 모델을 처음부터 훈련하는 데 드는 비용을 생각하면, 기존 frontier 모델의 지식을 "훔치는" 것이 경제적으로 합리적인 전략이 됩니다. Gemini 3.1 Pro급 모델의 훈련 비용은 **수억 달러**로 추정됩니다. 10만 건의 API 호출 비용은 이에 비하면 무시할 수 있는 수준입니다.

AppOmni의 AI 디렉터 Melissa Ruzzi는 이렇게 평했습니다: "새 모델 훈련 비용을 감안하면, 모델 추출 공격이 불법적인 경쟁 우위 확보 수단으로 등장한 것은 놀랍지 않습니다."

<small>[Inc. — Hackers Are Hammering Google's Gemini to Steal the LLM](https://www.inc.com/ava-levinson/hackers-are-hammering-googles-gemini-with-prompts-to-steal-the-llm-every-ai-company-should-be-worried/91302215)</small>

**Google의 대응**

Google은 실시간으로 공격을 탐지하고, 관련 계정을 차단했으며, 내부 추론 과정(reasoning traces)이 노출되지 않도록 방어 체계를 강화했다고 밝혔습니다. 구체적인 방어 메커니즘은 공개하지 않았지만, 프롬프트 패턴 분석, 이상 탐지, 출력 필터링 등이 포함된 것으로 보입니다.

Google의 수석 분석가 John Hultquist는 경고했습니다: "우리가 탄광의 카나리아가 될 것입니다. 더 작은 기업들의 커스텀 AI 도구에 대해서도 이런 공격이 곧 일반화될 것입니다."

<small>[CSO Online — Google fears massive attempt to clone Gemini AI](https://www.csoonline.com/article/4132098/google-fears-massive-attempt-to-clone-gemini-ai-through-model-extraction.html)</small>

**HONESTCUE — Gemini API를 악용하는 새 악성코드**

같은 보고서에서 Google은 **HONESTCUE**라는 새로운 악성코드 패밀리도 공개했습니다. 이 악성코드는 Gemini의 API를 직접 통합해, 작동 코드를 생성하는 프롬프트를 보내고 결과를 메모리에서 컴파일·실행합니다.

위험한 점은 각 프롬프트가 **개별적으로는 무해하게** 보인다는 것입니다. Gemini의 안전 필터를 우회하면서도, 조합하면 악성 코드가 완성됩니다. AI를 "도구"로 활용하는 사이버 공격의 진화를 보여주는 사례입니다.

<small>[eWeek — Gemini AI Faces 100K Distillation Attacks](https://www.eweek.com/news/google-gemini-model-extraction-attacks/)</small>

## 개념 정리

**모델 추출 공격(Model Extraction Attack)이란?**

AI 모델의 입출력 관계를 대량으로 수집해 원본 모델의 동작을 복제하는 공격입니다.

| 단계 | 설명 |
|------|------|
| **1. 프롬프트 설계** | 다양한 태스크, 언어, 난이도의 질문을 체계적으로 구성 |
| **2. 대량 질의** | API 또는 웹 인터페이스를 통해 수만~수십만 건의 프롬프트를 전송 |
| **3. 응답 수집** | 모델의 출력(텍스트, 확률 분포, 추론 과정)을 저장 |
| **4. 지식 증류** | 수집된 입출력 쌍으로 소규모 모델을 fine-tuning. 원본의 행동을 모방 |

이 공격이 위험한 이유는 **모델 가중치에 직접 접근하지 않아도** 된다는 점입니다. 공개 API만으로도 충분합니다. 현재 대부분의 AI 기업은 rate limiting과 이상 탐지로 방어하고 있지만, 공격자가 여러 계정과 IP를 분산 사용하면 탐지가 어려워집니다.

**기존 지적재산 보호와의 차이**

전통적인 소프트웨어는 코드를 직접 복사해야 침해가 성립합니다. 하지만 AI 모델은 "동작을 복제"하는 것만으로도 수억 달러의 R&D 투자를 탈취할 수 있습니다. 현행법으로 이를 어디까지 보호할 수 있는지는 아직 미지수입니다.

## 정리

이번 사건은 AI 보안의 새로운 차원을 열었습니다. 기존의 사이버 보안은 "데이터를 훔치는 것"에 초점을 맞췄지만, 이제는 **"지능을 훔치는 것"**이 현실적 위협이 됐습니다.

Google 규모의 기업이라서 탐지하고 방어할 수 있었습니다. Hultquist의 경고처럼, 중소기업이나 스타트업의 커스텀 AI 모델은 같은 수준의 방어 체계를 갖추기 어렵습니다. AI 모델이 핵심 비즈니스 자산이 되는 시대에, 모델 보안은 더 이상 선택이 아닙니다.

법적 관점에서도 흥미로운 문제가 남아 있습니다. 공개 API를 통해 합법적으로 구매한 응답을 사용해 모델을 훈련하는 것이 "지적재산 침해"에 해당하는가? Google은 이를 IP 도용으로 보고 있지만, 법원의 판단은 아직 나오지 않았습니다. 이 문제는 향후 AI 산업의 경쟁 규칙을 결정짓는 핵심 법적 쟁점이 될 것입니다.

<small>출처: [NBC News](https://www.nbcnews.com/tech/security/google-gemini-hit-100000-prompts-cloning-attempt-rcna258657) · [CSO Online](https://www.csoonline.com/article/4132098/google-fears-massive-attempt-to-clone-gemini-ai-through-model-extraction.html) · [eWeek](https://www.eweek.com/news/google-gemini-model-extraction-attacks/)</small>
