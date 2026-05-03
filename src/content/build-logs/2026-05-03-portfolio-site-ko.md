---
title: "정적 포트폴리오에서 build-in-public 피드로 — jidonglab v4 리디자인"
project: "portfolio-site"
date: 2026-05-03
lang: ko
tags: [claude-code, design, astro, refactor, workflow, multi-agent]
description: "하루 8세션 565 tool calls. v3 포트폴리오를 버리고 Claude Code 작업 기록이 자동으로 흐르는 build-in-public 라이브 피드 사이트로 방향을 전환했다."
---

하루 8세션, 565 tool calls. 오늘 가장 큰 결정은 코드 수정이 아니라 사이트 정체성을 바꾸는 것이었다. "포트폴리오"에서 "작업 피드"로.

**TL;DR** jidonglab을 정적 포트폴리오에서 Claude Code 세션 기록이 자동으로 흐르는 build-in-public 스트림으로 전환했다. claude-design-lite 스킬로 claude.ai/design 워크플로를 로컬에서 재현하고 editorial-mono 방향을 확정했다. AgentCrow 잔재도 6개 프로젝트에서 전부 뽑아냈다.

## v3를 버린 이유

기존 v3는 cream + acid + rust 페이퍼톤. 나쁘지 않았다. 그런데 "방문자가 뭘 봐야 하는가"를 생각했을 때 답이 없었다. 프로젝트 목록은 GitHub에도 있고, 자기소개는 LinkedIn에도 있다. 차별화할 수 있는 건 하나뿐이다 — 매일 Claude Code로 뭘 만드는지, 그 과정 자체.

그래서 방향을 틀었다. 카피는 한 번 쓰고, 콘텐츠는 시스템이 매일 갱신한다.

## claude-design-lite로 디자인 워크플로 구동

세션 8에서 "리디자인"을 요청하자 `claude-design-lite` 스킬이 발동했다. claude.ai/design의 시스템 프롬프트를 이식한 로컬 스킬로, 동작 방식이 거의 동일하다.

1. 디자이너 페르소나로 진입 후 질문 라운드
2. 디자인 시스템 선언 (타이포, 컬러, 스페이싱 원칙)
3. HTML 변주 3개 병렬 생성
4. design-reviewer 검증 후 최종 선택

세 변주 중 `editorial-mono.html`이 채택됐다. 모노톤 + 단일 액센트, 글이 주역이고 UI는 배경으로 물러나는 구조다. 로컬에서 `http://localhost:8765/editorial-mono.html`을 직접 확인해서 결정했다.

> build-in-public 스트림에서 디자인이 복잡하면 콘텐츠가 묻힌다. UI는 투명할수록 좋다.

## 핵심 기능: 작업 자동 피드

새 사이트의 중심은 Claude Code 세션 기록 자동 추출이다. 프롬프트·작업 단편·커밋·결과 스니펫이 시간순으로 흐르고, 각 프로젝트 카드는 "마지막 활동" 라이브 데이터를 달고 있다.

```json
{
  "items": [
    {
      "type": "commit",
      "project": "coffeechat",
      "message": "feat: google meet oauth integration",
      "ts": "2026-05-01T14:23:00Z"
    },
    {
      "type": "session",
      "project": "portfolio-site",
      "summary": "jidonglab v4 리디자인 editorial-mono 방향 확정",
      "tool_calls": 57
    }
  ]
}
```

GitHub API + Astro Content Collections 빌드로그를 조합해서 정적 생성 시점에 피드를 구성한다. 실시간은 아니지만 GitHub Actions가 매일 돌면 하루 단위로 갱신된다. `mock-feed.json`이 지금은 자리만 잡고 있고, 다음 작업이 실제 데이터 연결이다.

## claude-design-lite 훅 설정

세션 4에서 훅도 추가했다. "리디자인", "UI 수정" 같은 발화가 들어오면 claude-design-lite 스킬이 자동으로 발동하도록 `~/.claude/settings.json`에 훅을 연결했다. 명시적으로 "/claude-design-lite"를 타이핑하지 않아도 디자인 관련 요청이면 바로 6단계 워크플로가 시작된다.

`~/.claude/hooks/design-trigger.sh`에 트리거 조건을 정의했다. 키워드 매칭 후 스킬 발동까지 중간 확인이 없다. 품질 보장을 사람이 매번 체크하는 게 아니라 구조로 강제하는 방식이다.

## AgentCrow 전면 제거

세션 5에서 꽤 큰 청소 작업을 했다. 예전에 실험했던 AgentCrow가 6개 프로젝트에 심볼릭 링크와 boilerplate를 남겨두고 있었다.

제거한 것들은 크게 세 종류였다. 첫 번째는 `.claude/agents` 심볼릭 링크 — `saju_global`, `claude-code-book`, `uddental`, `portfolio/portfolio-site` 등 6개 프로젝트에서 `.agentcrow/agents/md`를 가리키고 있었다. 두 번째는 `CLAUDE.md` 안의 AgentCrow 섹션 8개 파일. 세 번째는 `settings.local.json`의 AgentCrow 항목.

처음 실행했을 때 code-verifier가 `saju_global` worktree 내부의 파일 3개를 잡아냈다. worktree 안까지 스캔하는 부분을 빠뜨렸기 때문이다. 두 번째 라운드에서 전부 정리됐다. 검증 단계가 없었으면 놓쳤을 케이스다.

## report-builder 스킬 제작

세션 7에서 `report-builder` 스킬을 새로 만들었다. "보고서 줘"라는 발화가 들어오면 딥서치 → HTML 보고서 생성 → `jee599/reports` GitHub Pages 자동 발행까지 이어지는 파이프라인이다.

```
트리거: "보고서", "리포트", "report"
→ 추가 질문 1라운드 (딥서치 방향 확인)
→ 서브에이전트 4개 병렬 리서치
→ HTML 보고서 생성
→ git push → GitHub Pages 발행
```

포트폴리오 사이트와 직접 연결은 아니지만, 1인 개발자가 시장 리서치를 반복할 때 재사용하는 인프라 조각이 됐다. AX 일자리 시장 리포트를 첫 번째 실행 케이스로 만들었다.

## 오늘 수치

세션 8개, tool calls 565회. 도구별 분포는 Bash 242, TaskUpdate 71, Read 50, Agent 37, Edit 32 순이다. Agent 호출이 37번인 건 서브에이전트 패턴을 적극 썼다는 뜻이다 — 리서치, 구현, 검증을 각각 분리해서 위임했다.

생성 파일 32개, 수정 파일 9개. 세션 8은 57 tool calls로 jidonglab 리디자인 방향 확정 + mock-feed 구조 정의까지 끝냈다.

## 다음 단계

`mock-feed.json`이 v4 HTML의 자리만 잡아뒀다. 실제 GitHub API + Astro Content Collections 연결이 다음 작업이다. 빌드 시점에 진짜 데이터로 피드가 채워지면 v4가 완성된다. 섹션 정리는 "불필요한 건 지우고 진행 중 프로젝트 위주"로 확정됐다.
