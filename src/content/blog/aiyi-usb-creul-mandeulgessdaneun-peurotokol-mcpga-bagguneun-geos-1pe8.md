---
title: "AI의 USB-C를 만들겠다는 프로토콜 — MCP가 바꾸는 것"
description: "N개 AI × M개 도구 = N×M개 커스텀 연동. MCP는 이걸 N+M으로 바꿨다"
pubDate: "2026-03-09"
tags: "ai, mcp, llm, productivity"
lang: "ko"
source: "devto-migration"
---

AI 3개와 도구 3개를 연동하려면 과거엔 9개의 커스텀 코드가 필요했다. Claude용, ChatGPT용, Cursor용을 각각 따로 짜야 했기 때문이다. N×M 문제다.

Model Context Protocol(MCP)은 이 병목을 표준화로 푼다. 도구를 MCP Server로 한 번 감싸면, 여러 Host(Claude Code, Cursor, ChatGPT 등)에서 재사용할 수 있다. N+M 구조로 바뀐다.

## MCP는 무엇을 표준화하나

MCP는 AI 앱과 외부 시스템을 연결하는 오픈 프로토콜이다. JSON-RPC 2.0 기반 메시지 교환으로 도구 정의, 파라미터 스키마, 결과 포맷을 통일한다.

- Tools: 실행 가능한 함수
- Resources: 읽기 전용 데이터
- Prompts: 재사용 가능한 작업 템플릿

핵심은 벤더 종속 제거다.

## 아키텍처

- Host: Claude Desktop, Claude Code, Cursor 같은 클라이언트 앱
- Client: Host 내부에서 Server와 1:1 세션 관리
- Server: GitHub, Postgres, Drive 등을 MCP 인터페이스로 노출

연결 흐름은 `초기화 → 메시지 교환 → 종료` 3단계다.

## Function Calling과의 관계

MCP는 Function Calling을 대체하지 않는다. **표준화**한다.

기존 방식은 벤더별 도구 스키마를 각각 작성해야 했다.
MCP는 한 번 정의한 도구를 여러 모델/앱에서 공통으로 쓰게 만든다.

## MCP vs RAG

- RAG: 관련 문서 검색 후 읽기 중심 응답 (주로 read-only)
- MCP: 읽기 + 쓰기 + API 호출 + 워크플로 오케스트레이션 (양방향)

실무에서는 둘을 함께 쓴다. MCP로 실행 흐름을 제어하고, RAG로 지식을 보강한다.

## 보안

프롬프트 인젝션, 과권한 도구 조합, lookalike tool 같은 공격면이 있다. 최신 스펙은 OAuth 2.1, PKCE, 최소 권한 원칙을 강화했지만, 프로덕션에서는 여전히 다음이 필수다.

- 도구 권한 최소화
- 핵심 액션 HITL 승인
- 감사 로그 유지

> AI의 가치는 모델 안이 아니라, 모델이 도달할 수 있는 시스템 범위에 있다.

---
- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io/)
- [Anthropic MCP 발표](https://www.anthropic.com/news/model-context-protocol)
- [MCP Wikipedia](https://en.wikipedia.org/wiki/Model_Context_Protocol)
