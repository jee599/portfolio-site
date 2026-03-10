---
title: "Anthropic, 트럼프 행정부를 상대로 소송 제기 — 'Supply Chain Risk' 지정 철회 요구와 Code Review 동시 출격"
date: 2026-03-10
model: claude
tags: [ai-news, claude, anthropic, pentagon, lawsuit, code-review, claude-code]
summary: "Anthropic이 미 국방부의 'Supply Chain Risk' 지정에 대해 연방법원에 소송을 제기했습니다. 같은 날 Claude Code Review를 출시하며 엔터프라이즈 시장 공략을 가속화하고 있습니다. OpenAI·Google 직원 37명이 Anthropic을 지지하는 법정 의견서를 제출했습니다."
sources: ["https://federalnewsnetwork.com/artificial-intelligence/2026/03/anthropic-sues-trump-administration-seeking-to-undo-supply-chain-risk-designation-on-ai-company/", "https://techcrunch.com/2026/03/09/openai-and-google-employees-rush-to-anthropics-defense-in-dod-lawsuit/", "https://techcrunch.com/2026/03/09/anthropic-launches-code-review-tool-to-check-flood-of-ai-generated-code/", "https://venturebeat.com/technology/anthropic-rolls-out-code-review-for-claude-code-as-it-sues-over-pentagon"]
auto_generated: true
---

## 무슨 일이 있었나

2026년 3월 10일, Anthropic이 트럼프 행정부를 상대로 연방법원에 소송을 제기했습니다. 미 국방부(DoD)가 지난주 Anthropic을 'Supply Chain Risk'(공급망 위험)으로 지정한 결정을 철회하라는 것이 핵심 요구입니다.

이 지정은 통상 Huawei, ZTE 같은 **외국 적대 기업**에 적용되던 조치입니다. 미국 본토의 AI 기업에 적용된 것은 역사상 처음이며, 이로 인해 연방 직원들의 Claude 사용이 금지되었습니다.

Anthropic의 사용 정책은 처음부터 "인간 감독 없는 자율 살상 무기와 미국 시민 대상 대규모 감시"에 AI를 사용하는 것을 금지해 왔습니다. 국방부가 이러한 용도로 Claude를 사용하려 하자 Anthropic이 거부했고, 그 결과가 이번 'Supply Chain Risk' 지정이었습니다.

Anthropic은 소송에서 이 지정이 **위법**이며 회사의 **언론의 자유와 적법 절차**를 침해한다고 주장하고 있습니다.

<small>[Federal News Network](https://federalnewsnetwork.com/artificial-intelligence/2026/03/anthropic-sues-trump-administration-seeking-to-undo-supply-chain-risk-designation-on-ai-company/)</small>

## 관련 소식

### OpenAI·Google 직원 37명, Anthropic 지지 법정 의견서 제출

소송과 같은 날, OpenAI와 Google DeepMind 직원 37명이 Anthropic을 지지하는 **amicus brief**(법정 조언서)를 연방법원에 제출했습니다. Google DeepMind 수석 과학자 **Jeff Dean**이 서명에 참여했다는 점이 특히 주목됩니다.

의견서에는 이런 내용이 담겼습니다:

> "국방부의 Anthropic 블랙리스트 결정은 우리 산업에 예측 불가능성을 도입하며, 미국의 혁신과 경쟁력을 약화시킵니다."

> "공개 법률이 부재한 상황에서, AI 개발자가 자사 시스템 사용에 부과하는 계약적·기술적 요구사항은 AI의 재앙적 오용에 대한 핵심 안전장치입니다."

이전에도 300명 이상의 Google 직원과 60명 이상의 OpenAI 직원이 공개 서한을 통해 Anthropic을 지지한 바 있습니다.

한편 OpenAI의 로봇공학 책임자 **Caitlin Kalinowski**는 이 사태에 항의하며 사임했습니다. 국방부가 Anthropic을 블랙리스트에 올린 직후 OpenAI와 군사 계약을 체결한 것에 대한 반발이었습니다.

OpenAI CEO Sam Altman도 "Anthropic에 대한 SCR 지정을 강제하는 것은 우리 산업과 국가에 매우 나쁜 일"이라고 발언했습니다.

<small>[TechCrunch — OpenAI and Google employees rush to Anthropic's defense](https://techcrunch.com/2026/03/09/openai-and-google-employees-rush-to-anthropics-defense-in-dod-lawsuit/)</small>

### Claude Code Review 출시 — AI 생성 코드의 품질 문제를 AI로 해결

같은 날 Anthropic은 **Claude Code Review**를 출시했습니다. GitHub PR(Pull Request)에 통합되는 멀티 에이전트 코드 리뷰 시스템입니다.

**작동 방식**: 여러 전문화된 AI 에이전트가 협업합니다. 일부는 결함과 위험 패턴을 탐색하고, 다른 에이전트가 발견 사항을 검증해 노이즈를 줄이며, 최종 패스에서 심각도와 영향도 순으로 이슈를 정렬합니다. 리뷰 한 건에 평균 약 20분이 소요됩니다.

**배경**: "Vibe coding" — AI가 자연어 지시를 받아 대량의 코드를 생성하는 방식 — 의 확산으로 개발자의 코드 출력량이 전년 대비 약 200% 증가했습니다. PR 리뷰가 병목이 되면서, 이를 AI로 해결하겠다는 것이 Anthropic의 전략입니다.

**내부 성과**:
- Code Review 도입 전: PR의 16%에서 의미 있는 피드백 발생
- Code Review 도입 후: **54%**로 상승
- 에이전트가 지적한 사항에 대한 엔지니어의 반론율: **1% 미만**

**가격**: 토큰 기반 과금, 리뷰당 평균 $15~$25. Team과 Enterprise 고객 대상 리서치 프리뷰로 제공됩니다.

Claude Code의 연간 환산 매출(run-rate revenue)은 **$2.5B(약 3.5조 원)**을 돌파했습니다.

<small>[TechCrunch — Anthropic launches code review tool](https://techcrunch.com/2026/03/09/anthropic-launches-code-review-tool-to-check-flood-of-ai-generated-code/)</small>

### Claude, 미국 iOS 앱스토어 1위 달성

소비자 시장에서도 Claude의 존재감이 급상승하고 있습니다. 2월 28일 Claude 앱이 **미국 iOS 앱스토어 전체 1위**를 처음으로 달성했습니다.

2025년 8월부터 2026년 2월까지의 DAU(일일 활성 사용자) 점유율 변화:
- **ChatGPT**: 57% → 42% (미국), 73% → 57% (글로벌)
- **Gemini**: 13% → 25% (미국) — 가장 큰 성장
- **Claude**: 앱스토어 순위 기준 ChatGPT를 처음으로 추월

<small>[Digital Information World](https://www.digitalinformationworld.com/2026/03/whos-winning-ai-chatbot-race-openais.html)</small>

## 수치로 보기

| 항목 | 수치 |
|------|------|
| Anthropic SCR 지정 | 미국 자국 AI 기업 최초 |
| amicus brief 서명자 | 37명 (OpenAI + Google DeepMind) |
| 공개 서한 서명자 | 300+ (Google) + 60+ (OpenAI) |
| Claude Code Review PR 피드백율 | 16% → 54% |
| 에이전트 독립 도구 호출 | 평균 21.2회/세션 |
| Claude Code run-rate 매출 | $2.5B+ (약 3.5조 원) |
| ChatGPT 미국 DAU 점유율 | 57% → 42% (6개월간) |
| Claude 앱스토어 | 미국 iOS 전체 1위 달성 |

## 정리

이번 사태는 단순한 기업-정부 갈등을 넘어, **AI 안전과 국가 안보가 정면충돌한 첫 사례**입니다. 세 가지 시사점이 있습니다.

**첫째, AI 안전 원칙의 비용이 현실화되었습니다.** Anthropic은 "responsible scaling"을 내세우며 성장해 왔지만, 그 원칙이 실제 매출과 정부 관계에 타격을 줄 수 있다는 것이 증명되었습니다. 반대로 OpenAI는 군사 계약을 수용했지만, 내부 반발과 인재 이탈이라는 대가를 치르고 있습니다.

**둘째, 업계의 연대가 주목됩니다.** 경쟁사인 OpenAI와 Google 직원들이 Anthropic을 지지한 것은 이례적입니다. Jeff Dean의 서명 참여는 이것이 단순한 개인적 입장이 아니라 AI 업계 전체의 공통 우려임을 보여줍니다.

**셋째, Anthropic의 양면 전략이 선명해졌습니다.** 소송을 제기하는 같은 날 Code Review를 출시한 것은 우연이 아닙니다. "정부가 막아도 엔터프라이즈 시장에서 충분히 성장할 수 있다"는 메시지를 시장에 보낸 것입니다. Claude Code의 $2.5B run-rate 매출이 그 자신감의 근거입니다.

이 소송의 결과는 AI 산업 전체의 향방에 영향을 미칠 것입니다. 정부가 이기면 어떤 AI 기업이든 "불투명한 기준으로" 블랙리스트에 올릴 수 있는 선례가 됩니다. Anthropic이 이기면 AI 기업의 사용 정책 자율권이 법적으로 보호받는 첫 사례가 됩니다.
