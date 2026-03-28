---
title: "Claude Code로 Claude Code 에이전트 라우터를 만든다: AgentCrow 598 tool calls"
project: "portfolio-site"
date: 2026-03-28
lang: ko
pair: "2026-03-28-portfolio-site-en"
tags: [claude-code, agentcrow, agent-teams, cli-refactor, refmade]
description: "4개 세션, 863 tool calls. AgentCrow Teams Router 구현, CLI 13개 모듈 분리, 86개 테스트 통과. 에이전트가 에이전트를 만드는 메타 작업 기록."
---

Claude Code로 Claude Code 에이전트 라우터를 만들었다. AgentCrow — 프롬프트를 분해해서 역할에 맞는 에이전트 페르소나를 붙여 Agent Teams로 디스패치하는 CLI. 만드는 과정 자체가 Agent Teams를 쓰는 방식으로 진행됐다.

**TL;DR** 4개 세션, 863 tool calls. AgentCrow CLI를 `cli.ts` 단일 파일에서 13개 모듈로 쪼개고, Teams 라우터를 구현했다. 별도로 refmade UI 레퍼런스 83개를 병렬 에이전트로 구현해서 평균 9.1/10 통과시켰다.

## "다 해줘"가 만든 28개 수정 + 31개 신규 파일

세션 시작 프롬프트:

> "agentcrow 프로젝트 열어서 현재 프로젝트에 대해 파악해줘 수정할 부분이나 보완 / 더 구현해야할 부분 모든 분야에서"

분석 에이전트 3개를 병렬로 띄웠다. 경쟁 프레임워크 리서치(LangGraph, CrewAI, agency-agents), GitHub 인기 에이전트 팩 조사, 로컬 코드 감사. 세 작업이 동시에 진행됐다.

돌아온 보고서에서 핵심 문제 두 가지가 나왔다.

1. `VERSION`이 `cli.ts:33`과 `package.json`에 이중 관리
2. `src/cli.ts` 하나에 모든 커맨드가 뭉쳐 있어 확장 불가

"다 해줘"로 리팩토링을 진행했다. 결과:

```
src/
  cli.ts           — main + arg parsing만
  commands/
    init.ts
    agents.ts
    compose.ts
    lifecycle.ts
    add.ts
    doctor.ts
    update.ts
    uninstall.ts
    inject.ts
    serve.ts
    stats.ts
  utils/
    constants.ts   — VERSION 단일 관리
    hooks.ts
    history.ts
    catalog-index.ts
    mcp-config.ts
    index-generator.ts
```

기존 `tests/cli.test.ts`가 구 구조에 의존하고 있어서 테스트도 전부 재작성했다. 74개에서 86개로 늘었다. 수정 파일 28개, 신규 파일 31개. 도구 분포: `Bash(179)`, `Edit(124)`, `Read(81)`. 6시간 29분.

## Teams 라우터의 핵심 메커니즘

세션 4에서 이런 대화가 있었다.

> "지금 그러면 agent teams을 쓰는게 아니라 그냥 서브에이전트야?"

정확했다. `Agent()` 호출만으로는 Teams 인프라 위에 올라가지 않는다. Teams를 제대로 활용하려면 흐름이 달라야 한다.

```
TeamCreate(team_name)
  → Agent(team_name, name, subagent_type, prompt)  # 팀 소속으로 스폰
  → SendMessage(to, task)                           # 작업 지시
  → [결과 수신]
  → SendMessage(to, {type: "shutdown_request"})
  → TeamDelete(team_name)
```

여기서 AgentCrow가 하는 일은 페르소나 주입이다. `agentcrow-inject.sh` PreToolUse hook이 에이전트 스폰 시 `catalog-index.json`에서 역할에 맞는 `.claude/agents/*.md` 파일을 찾아서 프롬프트 앞에 자동으로 붙인다. `frontend_developer`가 필요하다고 판단하면, 해당 페르소나의 role, persona, deliverables, success_metrics가 컨텍스트 앞에 추가된다.

이게 없으면 Agent Teams의 에이전트들은 역할 구분 없이 똑같이 동작한다. 페르소나가 붙으면 QA 에이전트는 테스트 케이스를 먼저 찾고, 보안 에이전트는 취약점을 먼저 찾는다.

## 에이전트 YAML 품질 검증

builtin 에이전트 14개 + 영문 에이전트 9개 = 23개. "품질 검증해줘"라고 하자 두 에이전트를 병렬 디스패치했다.

- GitHub 조사 에이전트: `awesome-claude-code-subagents`, `agency-agents` 비교
- 로컬 감사 에이전트: YAML 스키마 일관성, 누락 필드 체크

피드백: `output_format`과 `example` 필드가 없으면 에이전트 출력 일관성이 떨어진다. 9개 파일에 두 필드를 일괄 추가했다. README 한/영/다국어 동기화는 에이전트 3개 병렬로 처리했다.

## Rate Limit이 만든 세션 2의 공백

598 tool calls를 단일 세션에 밀어넣은 결과, "You've hit your limit · resets 11pm (Asia/Seoul)" 메시지로 세션이 끝났다. 세션 2 기록이 없는 이유다. API 키 에러로 0 tool calls.

AgentCrow 세션 마지막에 남겨둔 체크포인트 메시지 덕분에 새 세션에서 이어가는 데 문제가 없었다:

> "새 세션에서 '007 재평가부터 시작' 이라고 말하면 된다"

컨텍스트 전환 비용을 최소화하려면 세션 마지막에 다음 세션 시작 방법을 명시해두는 게 효과적이다.

## refmade: 5개 에이전트 병렬로 83개 HTML 구현

refmade는 Stripe, Linear, Vercel, Supabase, Arc, Raycast 같은 실제 서비스 랜딩 페이지를 HTML로 재현하는 데이터셋이다. 원본 스크린샷 기준으로 구현하고, Playwright로 캡처해서 원본과 비교 평가한다. 9.0/10 이상이면 PASS.

83개 미완료 레퍼런스를 병렬 에이전트 5개로 동시 처리했다. 각 에이전트가 독립된 HTML 파일을 담당하므로 파일 충돌이 없다.

CSS 도형으로 대충 채워진 이미지들은 Google Imagen API로 교체했다. 에이전트가 직접 프롬프트를 작성해서 이미지를 생성했다.

> "8K hyperrealism, professional woman in cream blazer, auburn hair, fintech mobile app, white background, photorealistic"

배치 평가 결과:

| 배치 | 레퍼런스 | 평균 점수 |
|------|----------|----------|
| 023-031 | Glassmorphism~Minimal Product | 9.1 |
| 056-065 | App Store~Editorial | 9.0 |
| 066-075 | Reality Interface~Linear | 9.2 |
| 076-083 | Vercel~Clerk | 9.3 |

도구 분포: `Read(156)`, `Bash(56)`, `Agent(54)`. 원본 스크린샷을 반복해서 참조하면서 작업하기 때문에 Read가 1위다.

## 병렬 에이전트 쓸 수 있는 조건 한 가지

병렬은 파일 충돌이 없을 때만 쓴다. 기준은 단순하다 — 같은 파일을 두 에이전트가 건드리면 충돌난다.

refmade가 병렬에 이상적인 구조인 이유는 레퍼런스마다 독립된 HTML 파일 하나씩 담당하기 때문이다. AgentCrow에서도 GitHub 리서치 에이전트와 로컬 감사 에이전트가 건드리는 파일이 완전히 분리됐다.

반대로 `cli.ts` 모듈 분리는 순차로 진행했다. 파일 구조 자체를 바꾸는 작업이고, 빌드와 테스트 통과 여부를 확인한 다음에 다음 단계로 넘어가야 하기 때문이다.

벤치마크 기준: 직접 처리 30초 vs 병렬 에이전트 51초 vs Teams 65초. 에이전트가 항상 빠른 게 아니다. 스폰 오버헤드가 있다. 작은 작업(파일 3-5개)은 직접 처리가 오히려 빠르다.
