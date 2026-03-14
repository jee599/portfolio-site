---
title: "LLM은 CPU고, 에이전트는 프로세스다 — Agentic AI의 진짜 구조"
description: "GPT-4급 성능이 100분의 1 가격이 된 2026년, 진짜 병목은 모델이 아니라 아키텍처다"
date: "2026-03-09"
tags: ["ai", "agenticai", "llm", "architecture"]
source: "devto"
---

2024~2026년 프로덕션 AI 실패의 대부분은 모델 품질 때문이 아니었다.

Gartner에 따르면 2026년 말까지 기업 애플리케이션의 40%가 AI 에이전트를 내장할 것으로 예측된다.
2025년의 5% 미만에서 8배 점프다.

시장 규모도 78억 달러에서 2030년까지 520억 달러를 넘긴다.
멀티 에이전트 시스템에 대한 기업 문의는 2024년 Q1 대비 2025년 Q2에 1,445% 폭증했다.

숫자만 보면 “에이전트가 대세”라는 얘기인데,
정작 프로덕션에 올린 팀들은 데모와 현실 사이의 괴리에 시달리고 있다.

데모는 잘 된다.
프로덕션에서 깨진다.
모델을 바꿔도 나아지지 않는다.

문제는 모델이 아니라 모델을 감싸는 시스템이다.

## “에이전트”라는 단어가 실제로 의미하는 것

에이전트를 한 줄로 정의하면 이렇다.

루프 안에 감싸진 LLM으로,
상태를 관찰하고,
도구를 호출하고,
결과를 기록하고,
완료 시점을 스스로 결정할 수 있는 시스템.

일반적인 LLM 호출과 비교하면 차이가 명확하다.

일반 호출은 사용자가 프롬프트를 보내고,
LLM이 학습 데이터 기반으로 답하고,
끝이다.

한 번 쏘고 끝나는 구조다.

에이전트는 다르다.
사용자가 목표를 전달하면,
LLM이 “다음에 뭘 해야 할지” 판단한다.
도구를 호출하고,
결과를 확인하고,
다시 판단한다.
목표를 달성했다고 스스로 판단하면 그때 종료된다.

이 루프가 핵심이다.

비유가 하나 있다.

LLM은 CPU고,
에이전트는 프로세스이며,
에이전틱 프레임워크는 운영체제다.

LLM 자체는 연산 엔진일 뿐이고,
그걸 감싸는 시스템 아키텍처가 에이전트를 만든다.

실제 코드로 보면 이렇다.

```python
# 오케스트레이터 = 이 코드 자체 (LLM이 아님)
def run_agent(user_query: str):
    messages = [system_prompt, tools_definition, user_query]

    while True:  # ← 이 루프가 에이전트의 전부
        response = llm.call(messages)  # LLM은 판단만 한다

        if response.has_action():
            tool_name, params = parse_action(response)
            result = execute_tool(tool_name, params)  # 실행은 코드가
            messages.append(response)
            messages.append(result)  # 다시 루프 시작

        elif response.has_answer():
            return response.answer  # 종료 판단도 LLM이
```

여기서 중요한 건 **오케스트레이터가 LLM이 아니라 코드(while 루프)**라는 점이다.
LLM은 “다음에 뭘 할지” 판단만 하고,
실제 도구 실행과 흐름 제어는 코드가 한다.

## ReAct: 에이전트의 기본 심장 박동

에이전트에서 가장 기본이 되는 패턴이 ReAct(Reason + Act)다.

LLM이 “생각(Thought) → 행동(Action) → 관찰(Observation)”을 반복하는 구조다.

“강남구 아파트 시세 알려줘”라는 질문이 들어오면,
내부에서 이런 일이 벌어진다.

```text
── 루프 1회차 ──
LLM: Thought: 강남구 아파트 실거래가를 조회해야 한다.
LLM: Action: search_real_estate_api("강남구", "34평")
오케스트레이터: Action 감지 → API 실행 → 결과 수신
도구 결과: {"은마": "22.3억", "대치 래미안": "28.1억"}

── 루프 2회차 ──
LLM: Thought: 데이터를 받았다. 정리해서 답변하자.
LLM: Answer: "강남구 34평 기준 은마 22.3억, 대치 래미안 28.1억..."
오케스트레이터: Answer 감지 → 루프 종료 → 사용자에게 반환
```

LLM이 직접 API를 호출하는 게 아니다.
LLM은 “search_real_estate_api를 호출하겠다”는 의사결정만 하고,
실제 호출은 오케스트레이터 코드가 한다.

## 7가지 디자인 패턴: 전부 필수가 아니다

에이전트에는 ReAct 외에도 여러 패턴이 있다.

- ReAct
- Reflection
- Planning
- Tool Use
- Multi-Agent Collaboration
- Sequential Workflows
- Human-in-the-Loop

중요한 건, **전부 필수가 아니라는 것**이다.

에이전트의 필수 요소는
LLM, 루프, 도구, 종료 조건 네 가지뿐이다.
나머지 패턴은 작업 복잡도에 따라 조합하는 것이다.

## Reflection: 자기 출력을 다시 평가하는 구조

Reflection은 LLM이 자기가 생성한 출력을
별도의 호출로 비판/평가하는 패턴이다.

```python
response_1 = llm.call("강남구 취득세 계산. 매매가 15억, 1주택자")
review = llm.call(f"아래 답변의 사실 오류를 검토해라:\n{response_1}")
final = llm.call(f"원본: {response_1}\n피드백: {review}\n수정본 작성")
```

Reflection의 목적은 지능 향상이 아니라 **리스크 감소**다.

## Planning: “먼저 계획 세워”라는 별도 호출

Planning도 LLM 호출이다.
차이는 “실행하지 마, 계획만 세워”라는 사전 단계라는 점이다.

```python
plan = llm.call("""
요청: '강남구 아파트 매매 시 총 비용 분석'
단계별 계획을 JSON으로 작성해라. 실행하지 마.
""")
for step in plan:
    execute_step(step)
```

복잡한 작업에서는 계획 객체 없이 장기 실행 에이전트를 만들지 않는 게 원칙이다.

## Tool Use: “정확해야 하는 건 LLM이 계산하지 마”

이 원칙이 에이전트 아키텍처의 가장 중요한 설계 결정이다.

```python
# LLM이 직접 계산 ← 절대 하면 안 됨
"매매가 15억의 취득세는..."  # 환각 확률 높음

# LLM이 도구 호출을 판단 ← 올바른 패턴
LLM: "calculate_tax 도구를 호출하겠다"
오케스트레이터: calculate_tax(price=1_500_000_000, houses=1)
결과: 27_000_000  # 정확한 계산
```

LLM은 “어떤 도구를 어떤 파라미터로 호출할지”를 결정하고,
계산 자체는 결정론적 코드가 수행해야 한다.

## Multi-Agent: 왜 같은 LLM을 여러 개로 나누는가

같은 LLM인데 Research Agent, Calculator Agent로 나누는 이유가 있다.

하나의 에이전트에 도구 30개를 전부 주면,
프롬프트가 길어지고,
엉뚱한 도구를 고르는 확률이 올라간다.

```text
Orchestrator
├── Research Agent (search_api만)
├── Calculator Agent (tax_calc, fee_calc만)
├── Writer Agent (텍스트 생성 전문)
└── QA Agent (검증 전문)
```

각 에이전트의 컨텍스트가 짧고 명확해서 정확도가 올라간다.

## 프로덕션에서 깨지는 진짜 이유

프로토타입과 프로덕트의 차이는 더 나은 프롬프트가 아니라 아키텍처다.

프로덕션 에이전트 3대 원칙:

1. **오케스트레이션은 인프라다**
2. **상태는 외부에 있어야 한다**
3. **제로 트러스트 실행**

초기 시스템은 추론, 상태 저장, 도구 호출, 실행을 한 루프에 다 넣는다.
해커톤에서는 돌아가지만,
스케일/장애복구/컴플라이언스가 붙으면 무너진다.

## “에이전트 워싱”에 속지 않기

진짜 에이전트인지 판별하는 기준은 명확하다.

- LLM이 루프 안에서 판단하는가?
- 도구를 사용하는가?
- 스스로 종료 시점을 결정하는가?
- 실패 시 다른 전략을 시도하는가?

하나라도 빠지면 에이전트가 아니라 자동화 스크립트다.

프롬프트 엔지니어링의 시대는 끝나가고 있다.
2026년의 승부처는 LLM을 감싸는 시스템 아키텍처다.

> 에이전트의 핵심은 더 똑똑한 모델이 아니라 더 나은 루프다.

---

- [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Google Multi-Agent Design Patterns](https://cloud.google.com/discover/what-are-ai-agents)
- [Gartner Agentic AI Predictions 2026](https://www.gartner.com/en/topics/agentic-ai)
