---
title: "DeerFlow — ByteDance가 공개한 2.8만 스타 SuperAgent 하네스의 아키텍처"
date: 2026-03-10
model: etc
tags: [ai-news, etc, github, open-source, deerflow, bytedance, agent, langgraph, sandbox, python]
summary: "ByteDance의 DeerFlow는 AI 에이전트에게 샌드박스 실행, 영구 메모리, 서브 에이전트 생성 능력을 제공하는 오픈소스 SuperAgent 하네스입니다. LangGraph 기반의 에이전트 오케스트레이션과 Docker 샌드박스 아키텍처, 그리고 확장 가능한 스킬 시스템의 설계를 분석합니다."
sources: ["https://github.com/bytedance/deer-flow"]
auto_generated: false
---

## 무슨 일이 있었나

`bytedance/deer-flow`가 GitHub Trending 1위를 기록하며 **27,938 스타**를 돌파했습니다. 하루에 **1,443 스타**가 추가되는 폭발적인 성장세입니다.

DeerFlow 2.0은 단순한 챗봇이 아닙니다. **"에이전트에게 실제로 일을 할 수 있는 인프라를 제공하는 런타임"**을 자처합니다. 리서치, 코드 실행, 콘텐츠 생성, 수시간에 걸친 장기 작업까지 — 에이전트가 자율적으로 수행할 수 있는 환경을 제공합니다.

v2.0은 v1.x(Deep Research 프레임워크)의 완전한 재작성입니다. 순수 리서치 도구에서 **범용 에이전트 인프라**로 방향을 전환했습니다.

<small>[bytedance/deer-flow](https://github.com/bytedance/deer-flow)</small>

## 프로젝트 구조

DeerFlow는 멀티 서비스 아키텍처입니다.

```
deer-flow/
├── backend/                # Python 백엔드
│   ├── agents/             # LangGraph 에이전트 그래프
│   ├── gateway/            # FastAPI HTTP 게이트웨이
│   ├── memory/             # 영구 메모리 관리
│   ├── skills/             # 스킬 로더 및 실행기
│   └── sandbox/            # Docker 샌드박스 관리
├── frontend/               # React 웹 인터페이스
├── skills/public/          # 빌트인 스킬 (마크다운 정의)
│   ├── research/           # 리서치 스킬
│   ├── report/             # 보고서 생성 스킬
│   ├── slides/             # 슬라이드 생성 스킬
│   └── image/              # 이미지 생성 스킬
├── docker/                 # 컨테이너 설정
├── config.example.yaml     # 설정 템플릿
└── Makefile                # 빌드/실행 명령
```

### 서비스 구성

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────▶│  Gateway API │────▶│ LangGraph Server│
│  (React)    │     │  (FastAPI)   │     │  (에이전트 실행)  │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────┐     ┌─────────▼────────┐
                    │  PostgreSQL  │     │  Docker Sandbox   │
                    │  (상태 저장)  │     │  (코드 실행)      │
                    └──────────────┘     └──────────────────┘
                    ┌──────────────┐     ┌──────────────────┐
                    │  Channels    │     │  MCP Servers     │
                    │  (Slack 등)  │     │  (외부 도구)      │
                    └──────────────┘     └──────────────────┘
```

**LangGraph Server**: 에이전트 그래프의 정의와 실행을 담당합니다. LangGraph의 상태 기반 그래프로 에이전트 로직을 정의합니다.

**Gateway API**: FastAPI로 구현된 REST 인터페이스입니다. 프론트엔드, IM 채널, 외부 시스템과의 통신을 담당합니다.

**Docker Sandbox**: 에이전트가 실행하는 코드(Python, Bash)를 격리된 Docker 컨테이너에서 실행합니다.

## 핵심 기술 스택

### LangGraph 기반 에이전트 오케스트레이션

DeerFlow의 에이전트 엔진은 **LangGraph**를 사용합니다. LangGraph는 LangChain 팀이 만든 **상태 기반 그래프 프레임워크**입니다.

일반적인 LLM 체인이 선형적(A → B → C)인 반면, LangGraph는 **조건부 분기, 루프, 병렬 실행**을 지원합니다. 에이전트가 "이 작업은 세 개로 쪼개서 병렬로 처리하자"라고 판단하면, 그에 맞는 그래프 경로를 동적으로 선택합니다.

```python
# LangGraph 상태 그래프 (개념적 구조)
graph = StateGraph(AgentState)

graph.add_node("plan", plan_task)           # 작업 분해
graph.add_node("execute", execute_subtask)  # 서브태스크 실행
graph.add_node("review", review_results)    # 결과 검토
graph.add_node("synthesize", synthesize)    # 최종 통합

graph.add_edge("plan", "execute")
graph.add_conditional_edges("review", {
    "needs_revision": "execute",   # 수정 필요 → 재실행
    "approved": "synthesize"       # 승인 → 통합
})
```

### Docker 샌드박스 — 안전한 코드 실행

에이전트가 코드를 실행할 때 가장 큰 리스크는 **보안**입니다. `rm -rf /`를 실행하거나, 민감한 파일에 접근하거나, 네트워크를 남용할 수 있습니다.

DeerFlow는 모든 코드를 **격리된 Docker 컨테이너** 안에서 실행합니다.

```yaml
# 샌드박스 파일시스템 구조
/mnt/user-data/
├── uploads/    # 사용자 업로드 파일 (읽기 전용)
├── workspace/  # 작업 공간 (읽기/쓰기)
└── outputs/    # 생성물 (읽기/쓰기)
```

- 파일시스템: `/mnt/user-data/` 경로만 접근 가능
- 네트워크: 제한된 외부 접근
- 시간 제한: 무한 루프 방지
- 리소스 제한: CPU, 메모리 상한선

Kubernetes 환경에서는 **Provisioner** 서비스가 요청에 따라 샌드박스 컨테이너를 동적으로 생성/삭제합니다. 탄력적 스케일링이 가능합니다.

### 마크다운 기반 스킬 시스템

DeerFlow의 스킬은 **마크다운 파일**로 정의됩니다. 코드가 아니라 자연어 + 구조화된 설명입니다.

```markdown
# Research Skill

## Description
웹에서 정보를 검색하고 종합하여 리서치 보고서를 생성합니다.

## Tools Required
- web_search
- web_browse
- file_write

## Workflow
1. 사용자 질문을 분석하여 검색 쿼리 생성
2. 웹 검색 수행 (3-5개 소스)
3. 각 소스의 핵심 내용 추출
4. 종합 분석 및 보고서 작성
5. 출처 포함하여 결과 반환

## Output Format
마크다운 보고서 + 출처 목록
```

스킬을 마크다운으로 정의한 것은 의도적입니다. **코드를 수정하지 않고도 에이전트의 능력을 확장**할 수 있습니다. 새 스킬을 추가하려면 마크다운 파일을 하나 작성하면 됩니다.

### 서브 에이전트 생성과 병렬 실행

복잡한 작업이 들어오면, DeerFlow는 **서브 에이전트**를 생성합니다. 각 서브 에이전트는 독립된 컨텍스트 윈도우에서 자율적으로 작업하고, 결과를 상위 에이전트에게 반환합니다.

```
[메인 에이전트] "10개 기업의 재무 분석 보고서를 작성해"
    ├── [서브 에이전트 1] "삼성전자 재무 분석" → 보고서 A
    ├── [서브 에이전트 2] "SK하이닉스 재무 분석" → 보고서 B
    ├── [서브 에이전트 3] "LG에너지솔루션 재무 분석" → 보고서 C
    └── ... (병렬 실행)
[메인 에이전트] 보고서 A + B + C + ... → 종합 보고서
```

서브 에이전트의 장점:
- **컨텍스트 격리**: 각 서브태스크가 독립된 컨텍스트를 가져, 토큰 한도에 걸리지 않습니다
- **병렬 실행**: 독립적인 작업을 동시에 처리하여 속도를 높입니다
- **실패 격리**: 한 서브 에이전트가 실패해도 다른 작업에 영향을 주지 않습니다

### 장기 메모리

DeerFlow는 **세션 간 영구 메모리**를 지원합니다. 사용자의 선호도, 이전 대화 내용, 작업 결과를 로컬에 저장합니다. 에이전트가 "지난번에 React보다 Vue를 선호한다고 했었지"라고 기억할 수 있습니다.

## 개념 정리

### 에이전트 런타임이란

"에이전트 런타임"은 LLM 에이전트가 실제로 **작업을 수행할 수 있는 실행 환경**입니다. LLM 자체는 텍스트만 생성할 수 있지만, 런타임이 코드 실행, 파일 I/O, 웹 접근, 도구 호출 등의 **능력(capability)**을 제공합니다.

DeerFlow는 이 런타임의 역할을 합니다. LLM이 "이 Python 코드를 실행해"라고 말하면, 런타임이 Docker 샌드박스에서 실제로 실행하고 결과를 돌려줍니다.

### MCP (Model Context Protocol)

DeerFlow는 **MCP 서버**를 지원합니다. MCP는 Anthropic이 주도하는 프로토콜로, LLM과 외부 도구를 연결하는 표준입니다. MCP 서버를 추가하면 에이전트가 사용할 수 있는 도구가 자동으로 확장됩니다.

예를 들어 GitHub MCP 서버를 연결하면 에이전트가 PR을 만들고, 이슈를 관리하고, 코드를 리뷰할 수 있게 됩니다. Slack MCP 서버를 연결하면 메시지를 보내고 채널을 검색할 수 있습니다.

### 멀티 채널 통합

DeerFlow는 웹 UI 외에 **Telegram, Slack, Feishu(라크)**와 네이티브로 통합됩니다. 각 채널은 공용 IP 없이 작동합니다.

- Telegram: 폴링 방식
- Slack: Socket Mode
- Feishu: WebSocket

이 설계 덕분에 NAT 뒤에 있는 서버에서도 IM 채널을 통해 에이전트를 사용할 수 있습니다.

## 정리

DeerFlow가 보여주는 것은 **"AI 에이전트의 다음 단계"**입니다. 단순히 질문에 답하는 챗봇이 아니라, 수시간에 걸친 복잡한 작업을 자율적으로 수행하는 시스템입니다.

ByteDance가 이 프로젝트를 오픈소스로 공개한 것은 전략적입니다. 에이전트 인프라의 표준을 선점하려는 의도가 보입니다. LangGraph 기반의 오케스트레이션, Docker 샌드박스, 마크다운 스킬 시스템 — 이 세 가지 설계 결정은 **"확장성"**에 초점이 맞춰져 있습니다.

2.8만 스타와 하루 1,400+ 스타라는 성장세는 "에이전트에게 실제 업무를 맡기고 싶다"는 수요가 폭발적임을 보여줍니다. DeerFlow는 그 수요를 충족하는 가장 완성도 높은 오픈소스 답변 중 하나입니다.

<small>[bytedance/deer-flow](https://github.com/bytedance/deer-flow)</small>
