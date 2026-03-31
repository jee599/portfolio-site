---
title: "Claude Agent SDK 딥다이브, Claude Code를 라이브러리로 쓴다는 건 이런 뜻이다"
description: "Claude Agent SDK는 Claude Code의 에이전트 루프, 도구, 컨텍스트 관리를 Python/TypeScript 라이브러리로 제공한다. 아키텍처, 핵심 API, 훅, 커스텀 도구, 다른 프레임워크와의 차이점까지 실전 코드와 함께 분석했다."
pubDate: 2026-03-31
category: "AI 기술 분석"
tags: ["Claude", "Agent SDK", "AI에이전트", "Anthropic", "MCP", "에이전트프레임워크"]
heroImage: "https://r2.jidonglab.com/blog/2026/03/claude-agent-sdk-hero.jpg"
heroImageCaption: "사진 출처: Anthropic / claude.com"
heroImageAlt: "Claude Agent SDK 아키텍처를 보여주는 공식 다이어그램"
readingTime: 14
source:
  title: "Building agents with the Claude Agent SDK"
  url: "https://claude.com/blog/building-agents-with-the-claude-agent-sdk"
  author: "Thariq Shihipar, Anthropic"
---

![Claude Agent SDK 아키텍처를 보여주는 공식 다이어그램](https://r2.jidonglab.com/blog/2026/03/claude-agent-sdk-hero.jpg)

에이전트 프레임워크가 6개 넘게 경쟁하는 2026년, Anthropic은 기존 프레임워크와 완전히 다른 접근을 택했다.
LangGraph처럼 그래프를 설계하거나, CrewAI처럼 역할을 분배하는 게 아니다.
이미 수십만 명이 쓰고 있는 Claude Code — 그 자체를 라이브러리로 풀어버렸다.

**출처:** [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk) – Thariq Shihipar, Anthropic

## "Claude Code SDK"가 "Agent SDK"로 이름을 바꾼 이유

2025년 말, Anthropic은 Claude Code SDK의 이름을 Claude Agent SDK로 변경했다. 단순한 리브랜딩이 아니다. Claude Code가 코딩 에이전트로 시작했지만, SDK로 만들 수 있는 에이전트가 코딩에 국한되지 않는다는 걸 인정한 셈이다.

실제로 SDK 데모 레포지토리에는 이메일 어시스턴트, 리서치 에이전트, 고객 지원 봇 같은 비코딩 에이전트들이 올라와 있다. 파일을 읽고, 셸 명령을 실행하고, 웹을 검색하고, 코드를 수정하는 — Claude Code가 하던 모든 걸 프로그래밍 가능한 형태로 쓸 수 있다는 뜻이다.

핵심 설계 철학은 한 줄로 요약된다. **"에이전트에게 컴퓨터를 줘라."** API 호출만 시키는 게 아니라, 파일 시스템, 터미널, 코드 실행 환경을 통째로 넘긴다. 사람이 컴퓨터로 일하듯, 에이전트도 컴퓨터로 일하게 만드는 거다.

## query()와 ClaudeSDKClient, 두 가지 진입점

SDK에는 에이전트를 실행하는 방법이 두 가지 있다.

첫 번째는 `query()`. 비동기 함수로, 프롬프트를 던지면 AsyncIterator로 응답 메시지를 돌려준다. 가장 단순한 형태의 에이전트 실행이다. 단발성 작업에 적합하다.

```python
async for message in query(
    prompt="Find and fix the bug in auth.py",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"]),
):
    print(message)
```

두 번째는 `ClaudeSDKClient`. 양방향 대화형 세션을 지원한다. `query()`와 달리 커스텀 도구와 훅을 콜백 함수로 정의할 수 있다. 프로덕션 에이전트를 만들려면 이쪽을 써야 한다.

둘의 차이가 중요한 이유가 있다. Anthropic Client SDK(일반 API)를 쓰면 도구 실행 루프를 직접 구현해야 한다. `stop_reason`이 `tool_use`인지 확인하고, 도구를 실행하고, 결과를 다시 API에 보내고. 이걸 반복하는 코드를 매번 짜야 한다.

Agent SDK는 이 루프 전체를 내장하고 있다. Claude가 자율적으로 도구를 호출하고, 결과를 확인하고, 다음 액션을 결정한다. 개발자는 프롬프트와 허용할 도구 목록만 넘기면 된다.

## 빌트인 도구 9개, 설치하자마자 바로 작동한다

Agent SDK의 가장 큰 차별점은 빌트인 도구다. 다른 프레임워크들은 도구를 직접 정의해야 하지만, Agent SDK에는 Claude Code가 쓰는 도구가 그대로 들어있다.

Read(파일 읽기), Write(파일 쓰기), Edit(파일 수정), Bash(셸 명령), Glob(파일 패턴 검색), Grep(내용 검색), WebSearch(웹 검색), WebFetch(웹 페이지 파싱), AskUserQuestion(사용자 질문) — 이 9개 도구가 기본 탑재되어 있다.

이게 왜 큰 차이인지 생각해보면 이렇다. LangGraph로 파일을 읽고 수정하는 에이전트를 만들려면, 파일 읽기 도구부터 직접 구현해야 한다. Agent SDK에서는 `allowed_tools=["Read", "Edit"]`만 넘기면 끝이다. 도구 실행 로직도 SDK가 처리한다.

```python
async for message in query(
    prompt="Find all TODO comments and create a summary",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Glob", "Grep"]),
):
    if hasattr(message, "result"):
        print(message.result)
```

코드에서 보듯, 에이전트가 코드베이스 전체를 탐색하고, TODO를 찾고, 요약까지 하는 과정이 5줄이다.

## 훅 시스템이 에이전트의 행동을 통제하는 방식

프로덕션 에이전트에서 가장 중요한 건 "에이전트가 뭘 하지 못하게 막을 수 있는가"다. Agent SDK의 훅 시스템은 이 문제를 정면으로 해결한다.

훅은 에이전트 실행의 주요 지점에서 호출되는 콜백 함수다. 도구가 호출되기 직전(`PreToolUse`), 도구 실행이 끝난 직후(`PostToolUse`), 에이전트가 멈출 때(`Stop`), 서브에이전트가 시작/종료될 때(`SubagentStart`/`SubagentStop`) — 총 18개 이벤트에 훅을 걸 수 있다.

예를 들어, `.env` 파일 수정을 막는 훅은 이렇게 생겼다.

```python
async def protect_env_files(input_data, tool_use_id, context):
    file_path = input_data["tool_input"].get("file_path", "")
    if file_path.split("/")[-1] == ".env":
        return {"hookSpecificOutput": {
            "permissionDecision": "deny",
            "permissionDecisionReason": "Cannot modify .env files",
        }}
    return {}
```

이 훅을 `PreToolUse` 이벤트에 `"Write|Edit"` 매처로 등록하면, Write나 Edit 도구가 `.env` 파일을 건드리려 할 때만 실행된다. 매처는 정규식이라 `"^mcp__"` 같은 패턴으로 모든 MCP 도구를 한꺼번에 잡을 수도 있다.

훅의 출력은 두 계층으로 나뉜다. `hookSpecificOutput`은 현재 작업을 허용(`allow`), 거부(`deny`), 또는 수정(`updatedInput`)한다. 최상위 레벨의 `systemMessage`는 대화에 메시지를 주입해서 Claude가 왜 거부당했는지 알 수 있게 한다. 여러 훅이 적용될 때는 deny가 ask보다, ask가 allow보다 우선한다. 어떤 훅이든 deny를 반환하면 무조건 차단된다.

비동기 훅도 지원한다. 로깅이나 웹훅 전송처럼 에이전트 행동에 영향을 주지 않는 사이드 이펙트는 `{"async_": True}`를 반환하면 에이전트가 기다리지 않고 바로 다음으로 넘어간다.

## 커스텀 도구는 인프로세스 MCP 서버로 돌아간다

커스텀 도구의 구현 방식이 흥미롭다. Agent SDK에서 커스텀 도구를 만들면, 그건 별도 프로세스가 아니라 애플리케이션 내부에서 돌아가는 인프로세스 MCP 서버가 된다. 일반 MCP 서버처럼 별도 프로세스를 띄울 필요가 없다는 뜻이다.

도구 하나를 정의하려면 이름, 설명, 입력 스키마, 핸들러 — 네 가지가 필요하다. Python에서는 `@tool` 데코레이터, TypeScript에서는 `tool()` 함수를 쓴다. 여러 도구를 하나의 서버에 묶어서 `query()`에 전달한다.

```python
@tool("get_temperature", "현재 기온을 조회한다",
      {"latitude": float, "longitude": float})
async def get_temperature(args):
    # API 호출 → 결과 반환
    return {"content": [{"type": "text", "text": f"기온: 22°C"}]}

weather_server = create_sdk_mcp_server(
    name="weather", version="1.0.0",
    tools=[get_temperature],
)
```

도구를 등록하면 이름이 `mcp__weather__get_temperature` 형태로 바뀐다. `mcp__{서버이름}__{도구이름}` 패턴이다. 이 이름을 `allowed_tools`에 넣으면 자동 승인, 안 넣으면 매번 권한 확인을 거친다.

에러 처리도 깔끔하다. 핸들러에서 예외를 throw하면 에이전트 루프 자체가 멈춘다. 대신 `is_error: True`를 반환하면 Claude가 에러를 "데이터"로 받아들여서 재시도하거나 다른 방법을 시도한다. 프로덕션에서는 반드시 후자를 써야 한다.

도구 어노테이션으로 `readOnlyHint: True`를 붙이면 Claude가 다른 읽기 전용 도구들과 병렬로 실행할 수 있다. 작은 설정이지만 에이전트 실행 속도에 체감 차이가 난다.

## 서브에이전트와 세션, 복잡한 워크플로우를 다루는 법

복잡한 작업은 서브에이전트로 분리한다. 메인 에이전트가 작업을 위임하면, 서브에이전트가 격리된 컨텍스트 윈도우에서 실행되고 결과만 돌려준다. 각 서브에이전트에 별도의 도구, 프롬프트, 역할을 부여할 수 있다.

```python
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "Agent"],
    agents={"code-reviewer": AgentDefinition(
        description="코드 리뷰 전문가",
        prompt="코드 품질을 분석하고 개선점을 제안해라.",
        tools=["Read", "Glob", "Grep"],
    )}
)
```

`Agent` 도구를 `allowed_tools`에 포함해야 서브에이전트를 호출할 수 있다. 서브에이전트의 메시지에는 `parent_tool_use_id`가 붙어서 어떤 서브에이전트의 출력인지 추적할 수 있다.

세션 관리도 내장되어 있다. 첫 번째 쿼리에서 `session_id`를 캡처하면, 두 번째 쿼리에서 `resume=session_id`로 이어갈 수 있다. Claude가 이전에 읽은 파일, 분석한 내용, 대화 히스토리를 전부 기억한다. "인증 모듈 읽어줘" → "그걸 호출하는 곳을 다 찾아줘"처럼 대명사("그걸")가 통하는 이유다.

컨텍스트가 토큰 한도에 가까워지면 자동으로 컴팩션이 실행된다. 대화를 요약해서 컨텍스트를 줄이는 건데, `PreCompact` 훅을 걸면 요약 전에 전체 트랜스크립트를 아카이빙할 수도 있다.

## 다른 에이전트 프레임워크와 뭐가 다른가

2026년 3월 기준, 프로덕션 에이전트 프레임워크는 최소 6개가 경쟁 중이다. LangGraph(1.0 GA), CrewAI(44,600+ 깃허브 스타), OpenAI Agents SDK(v0.10.2), Claude Agent SDK(Python v0.1.48 / TypeScript v0.2.71), Google ADK(v1.26.0) 등이 있다.

각 프레임워크의 설계 철학이 다르다.

LangGraph는 그래프 기반이다. 노드와 엣지로 에이전트 워크플로우를 설계한다. 루프, 병렬 분기, 승인 게이트가 필요한 복잡한 워크플로우에 강하다. 대신 간단한 에이전트도 그래프를 그려야 해서 보일러플레이트가 많다.

CrewAI는 역할 기반이다. "리서처", "작가", "편집자" 같은 역할을 정의하고 협업시킨다. 직관적이지만 역할 간 통신이 복잡해지면 디버깅이 어렵다.

OpenAI Agents SDK는 핸드오프 패턴을 쓴다. 에이전트 간에 대화를 넘기는 구조인데, Claude Agent SDK와 비슷하게 간결하지만 빌트인 도구가 없다.

Claude Agent SDK의 차별점은 세 가지다.

첫째, 빌트인 도구. 파일 시스템과 셸에 대한 접근이 기본 탑재되어 있다. 다른 프레임워크에서 수십 줄에 걸쳐 구현해야 하는 걸 한 줄로 쓸 수 있다.

둘째, MCP 통합의 깊이. MCP가 가장 깊게 통합된 프레임워크다. Playwright로 브라우저를 자동화하고, Slack으로 알림을 보내고, GitHub로 PR을 만드는 걸 MCP 서버 연결 한 줄로 처리한다. 커스텀 도구도 인프로세스 MCP로 돌아가니까 외부 MCP 서버와 자연스럽게 공존한다.

셋째, 라이프사이클 제어. 18개 훅 이벤트로 에이전트 실행의 거의 모든 지점을 가로챌 수 있다. 도구 호출 전후, 서브에이전트 시작/종료, 컨텍스트 컴팩션, 권한 요청까지. 프로덕션에서 "이 에이전트가 절대로 X를 하지 못하게 해야 한다"는 요구사항을 훅으로 구현할 수 있다.

## 트레이드오프 — Anthropic 전용, 영속성 없음

장점만 있는 건 아니다. 가장 큰 제약은 Anthropic 전용이라는 점이다. Claude 모델만 쓸 수 있다. 태스크 유형에 따라 Claude, GPT, Gemini를 라우팅해야 하는 아키텍처라면 Agent SDK 위에 별도 오케스트레이션 레이어를 얹어야 한다.

내장 영속성 레이어도 없다. 세션이 서버 재시작을 넘기려면 직접 구현해야 한다. LangGraph는 체크포인트를 내장하고 있어서 이 부분에서 유리하다.

Python SDK와 TypeScript SDK의 기능 격차도 있다. `SessionStart`, `SessionEnd` 같은 훅은 TypeScript에서만 콜백으로 등록할 수 있고, Python에서는 설정 파일 기반 셸 명령 훅으로만 쓸 수 있다. Python이 메인인 팀이라면 확인이 필요하다.

그리고 인증. Anthropic은 Agent SDK로 만든 프로덕트에서 claude.ai 로그인이나 레이트 리밋을 쓰는 걸 허용하지 않는다. API 키 인증만 가능하다. Amazon Bedrock, Google Vertex AI, Microsoft Azure를 통한 인증은 지원한다.

## 실전에서 에이전트를 쓸 때 확인할 것들

Anthropic 엔지니어링 팀이 공유한 에이전트 개선 체크리스트가 실용적이다.

에이전트가 작업에 적합한 도구를 가지고 있는지 먼저 확인한다. 도구가 부족하면 아무리 좋은 프롬프트를 줘도 소용없다. 검색 API가 에이전트가 원하는 방식으로 데이터를 찾을 수 있게 구조화되어 있는지도 중요하다.

반복적으로 실패하는 패턴이 있으면 훅으로 규칙을 만든다. LLM-as-judge(다른 모델로 결과를 평가하는 방식)보다 규칙 기반 피드백이 더 안정적이고 빠르다. 코드 린팅, 명시적 검증 규칙, 결과물의 스크린샷 확인 같은 검증 메커니즘을 에이전트 루프에 넣는 것이 핵심이다.

에이전트의 실행 루프 자체가 "컨텍스트 수집 → 액션 실행 → 결과 검증 → 반복" 구조다. 이건 사람이 일하는 방식과 같다. 차이는 속도뿐이다.

> Claude Code를 라이브러리로 쓴다는 건, Claude가 코드를 짜는 그 정확한 방식 — 파일을 읽고, 명령을 실행하고, 결과를 확인하고, 다시 시도하는 — 을 내 프로덕트 안에 심을 수 있다는 뜻이다. 이건 API 호출과는 차원이 다른 이야기다.

---
- [Agent SDK 공식 문서](https://platform.claude.com/docs/en/agent-sdk/overview) – Anthropic
- [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk) – Thariq Shihipar
- [claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) – GitHub
- [claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) – GitHub
- [claude-agent-sdk-demos](https://github.com/anthropics/claude-agent-sdk-demos) – GitHub
