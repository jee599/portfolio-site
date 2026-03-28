---
title: "AgentCrow Teams Router: 4개 세션, 883 tool calls, 83개 레퍼런스 병렬 구현"
project: "portfolio-site"
date: 2026-03-29
lang: ko
tags: [claude-code, agent-teams, agentcrow, parallel-agents, automation]
description: "Claude Code를 프롬프트 라우터로 만들었다. 144개 에이전트 페르소나를 Teams에 자동 주입하는 AgentCrow v5를 6시간 만에 구축하고, 같은 방법으로 83개 레퍼런스 사이트를 하루 만에 병렬 구현했다."
---

4개 세션, 총 883 tool calls, 누적 22시간. AgentCrow를 Claude Code의 Teams 라우터로 완성하고, 그걸 그대로 써서 83개 웹 레퍼런스를 하루 만에 병렬 구현했다.

**TL;DR** AgentCrow v5는 프롬프트를 받으면 144개 에이전트 중 적합한 페르소나를 골라 Agent Teams에 자동 주입하는 라우터다. 이걸 만든 세션과, 이걸 써서 refmade 레퍼런스 83개를 병렬 처리한 세션 두 가지를 다룬다.

## 삽질의 시작: "다 해줘"

세션 1의 첫 프롬프트는 단순했다.

```
agentcrow 프로젝트 열어서 현재 프로젝트에 대해 파악해줘
수정할 부분이나 보완 / 더 구현해야할 부분 모든 분야에서
```

그 다음 프롬프트는 더 단순했다.

```
다 해줘
```

Claude는 이걸 받아서 6시간 29분, 598 tool calls를 썼다. Bash 179번, Edit 124번, Read 81번. `VERSION`이 `cli.ts`와 `package.json` 두 곳에 이중 관리되던 걸 시작으로, 모놀리식 `cli.ts`를 `commands/` 디렉토리로 분리하고, 테스트를 74개에서 88개로 늘렸다.

그런데 정작 내가 원했던 건 따로 있었다.

## 진짜 문제: Teams인가 서브에이전트인가

AgentCrow가 에이전트를 스폰하고 있었는데, 알고 보니 그냥 `subagent`였다. `Agent Teams`를 쓰는 게 아니었다. 대화가 이렇게 흘렀다.

```
나: 에이전트 생성하면 알아서 agent teams에 넘겨?
Claude: 현재는 Teams 없이 직접 서브에이전트를 스폰합니다
나: 내가 원하는건 teams를 활용하는거야
나: teams랑 프롬프트 사이의 라우터 느낌으로 가고 싶어
```

차이는 명확하다. 서브에이전트는 그냥 병렬 실행이고, Teams는 `SendMessage`로 결과를 주고받을 수 있는 조율 레이어가 생긴다. 의존성 있는 작업(`A → B → C` 핸드오프)에는 Teams가 필요하다.

## AgentCrow v5 구조

결국 만든 건 이런 흐름이다.

```
프롬프트 입력
    ↓
INDEX.md에서 에이전트 역할 매칭
    ↓
TeamCreate(team_name)
    ↓
Agent(team_name, name, subagent_type, prompt + 페르소나)
    ↓
SendMessage로 조율 / 의존성 핸드오프
    ↓
TeamDelete
```

핵심은 에이전트 스폰 시 `.claude/agents/{role}.md` 페르소나를 프롬프트에 자동 주입하는 것이다. 144개 페르소나가 있고, `agentcrow-inject.sh` hook이 `catalog-index.json`에서 매칭해서 넣어준다.

에이전트 수 결정 기준도 명확하게 정의했다.

| 규모 | 에이전트 | 기준 |
|------|---------|------|
| 단일 파일 수정 | 0 (직접) | 도메인 1개, 파일 1-2개 |
| 소규모 | 2 | API+테스트, UI+스타일 |
| 중규모 | 3-4 | 인증+테스트+문서 |
| 대규모 | 5 (최대) | 리서치+구현+리뷰 |

무조건 5명이 아니다. 벤치마크 결과 직접 처리 30초, 병렬 에이전트 51초, Teams 65초였다. Teams는 조율 오버헤드가 있으니까, 의존성 없는 독립 작업은 그냥 병렬로 던지는 게 빠르다.

## refmade: 83개 레퍼런스를 하루 만에

세션 3은 `refmade` 프로젝트였다. Stripe, Vercel, Linear, Notion, Supabase, Clerk 등 실제 SaaS 랜딩 페이지를 HTML로 재현하는 작업인데, 남은 것만 80개가 넘었다.

프롬프트는 이거였다.

```
refmade 프로젝트 레퍼런스 구현→평가 루프 이어서 해줘. 007 재평가부터 시작
```

세션 3의 패턴은 명확했다. 4-5개씩 묶어서 병렬 스폰, 각 에이전트가 원본 스크린샷과 비교하며 구현, 평가 점수 9점 이상이면 PASS. 285 tool calls, 15시간 45분.

```
배치 1: 023, 025, 027, 029 → 전부 9.0+ PASS
배치 2: 030, 031, 039, 043 → 전부 9.0+ PASS
...
배치 N: 056, 057, 058, 059 → ...
```

중간에 rate limit을 여러 번 맞았다. 에이전트가 "You've hit your limit · resets 11pm (Asia/Seoul)"을 반환하는데, 이건 해당 에이전트만 멈추고 나머지는 계속 돌아간다. "다시 진행해"를 3번 쳤다.

## Gemini로 8K 하이퍼리얼리즘 이미지

CSS 도형으로 만든 가짜 이미지들이 퀄리티를 망치고 있었다. 해결책은 Gemini Imagen API 직접 호출이었다.

프롬프트는 이렇게 넘겼다.

```
nano banana api 줄테니까 직접 실사 수준의 8k 이미지를 프롬프트로 생성해서 쓸래?
프롬프트를 정확히 만들어서 8k 하이퍼리얼리즘으로 해야돼
```

각 레퍼런스에 맞는 이미지 프롬프트를 Claude가 직접 작성하고, API 호출해서 `public/images/`에 저장, HTML에 교체하는 흐름으로 돌아갔다. `056-app-store`에는 auburn hair + cream blazer 여성, `064-neon-cinema`에는 실제 콘서트 무대 사진, `073-poppr`에는 VR 전시 공간.

CSS 도형 대비 체감 퀄리티는 비교 불가였다.

## CLAUDE.md에 남긴 것

이번 작업에서 CLAUDE.md에 정착한 규칙들이다.

```markdown
## 에이전트 수 결정
벤치마크: 직접 30초 vs 병렬 51초 vs Teams 65초
- 소규모 독립 작업: 직접 처리
- 독립 병렬: 병렬 에이전트 (Teams 없이)
- 의존성 있음: Teams (SendMessage 핸드오프)
- 대규모 리서치+구현: Teams
```

Teams는 만능이 아니다. 오버헤드가 있고, 단순 병렬 작업엔 그냥 Agent를 직접 스폰하는 게 낫다. 이 판단 기준을 문서화해두는 게 핵심이었다.

## 세션별 통계

| 세션 | 시간 | Tool calls | 주요 작업 |
|------|------|-----------|---------|
| 1 | 6h 29min | 598 | AgentCrow v5 구축 |
| 2 | 0min | 0 | API key 오류 |
| 3 | 15h 45min | 285 | refmade 83개 구현 |
| 4 | 16h 26min | 97 | Teams Router 검증 |

세션 2는 API 인증 오류로 바로 죽었다. `Invalid authentication credentials`. 키 바꾸고 재시작.

## 배운 것

"다 해줘" 프롬프트는 생각보다 잘 작동한다. 단, 방향을 잃지 않으려면 중간에 "현재 기능 다시 파악해줘 어떻게 동작해?"를 던지는 게 필요하다. 6시간짜리 세션에서 3번 던졌다. Claude가 지금 뭘 만들고 있는지 재확인하는 용도로.

병렬 에이전트로 대량 작업을 돌릴 때는 rate limit을 예상하고 설계해야 한다. 에이전트별 독립 실행이니까 일부가 죽어도 나머지는 계속 가고, "다시 진행해"로 죽은 것만 재시작하면 된다.
