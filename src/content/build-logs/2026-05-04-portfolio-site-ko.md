---
title: "서브에이전트 환각 버그 + AgentCrow 전사 제거: 13개 세션, 800+ tool calls"
project: "portfolio-site"
date: 2026-05-04
lang: ko
tags: [claude-code, orchestration, multi-agent, debugging, refactoring]
description: "13개 세션, 800회 이상 tool call. 서브에이전트가 '다 했다'고 거짓 보고하는 환각 버그를 직접 발견했고, AgentCrow 흔적을 시스템 전체에서 제거했다."
---

서브에이전트가 Bash 툴을 실제로 호출하지 않고 변경 *결과만* diff.patch에 적어서 "완료"를 보고했다. 검증자도 가짜 diff만 보고 pass를 줬다. 그 사실을 `git status`로 발각하기까지 전체 파이프라인이 정상 돌아가는 척 했다.

**TL;DR** 2026-04-22 ~ 05-03, 13개 세션. 오케스트레이션 Stop hook이 실질적으로 작동하기 시작했고, 에이전트 환각 문제를 실전에서 처음 맞닥뜨렸다.

---

## "다 했다"는 에이전트, 실제로는 0줄 변경

Blogger GitHub Actions 워크플로우 cron 스케줄 제거 작업이었다. `publish-blogger.yml`에서 6시간마다 돌던 `'0 */6 * * *'`를 빼고, 토큰 만료 시 `exit(1)` → `exit(0)`으로 바꾸는 단순한 yaml 수정.

구현 서브에이전트가 diff.patch를 만들었다. verifier가 pass를 줬다. Stop hook도 통과했다. 그런데 실제 파일은 그대로였다.

```
line 9-10:  schedule:
              - cron: '0 */6 * * *'   ← 그대로 있음
line 56:    exit(1)                    ← 그대로 있음
```

`git status`는 변경 0건. 서브에이전트는 툴을 호출하지 않고 예상 결과물을 직접 생성해 산출물 파일에 썼고, verifier는 그 가짜 diff를 실제인 것처럼 검증했다.

재디스패치 후 두 번째에서야 실제 변경이 반영됐다. 재현 조건으로 추정되는 건 세션이 길어진 상태에서 특정 구현 에이전트가 context 압박을 받을 때 실행 대신 예측 결과를 생성하는 것. 지금 당장의 대책은 **구현 후 `git diff` 직접 확인을 파이프라인에 명시**하는 것이다. verifier도 diff.patch를 신뢰하기 전에 `git diff HEAD`와 교차 확인해야 한다.

---

## AgentCrow: 7개 프로젝트 동시 감염

AgentCrow는 이전에 실험했던 에이전트 오케스트레이션 도구다. 지워진 줄 알았는데 `.claude/agents`가 전부 심볼릭 링크로 살아 있었다.

발견된 흔적:

- `saju_global`, `claude-code-book`, `uddental`, `portfolio/portfolio-site` 4곳의 `.claude/agents` → `/Users/jidong/.agentcrow/agents/md` 심볼릭 링크
- `uddental/.claude/CLAUDE.md` 33줄 전체가 AgentCrow boilerplate
- `saju_global` worktree 2개 내부에도 `.claude/CLAUDE.md`로 잔류

단계를 나눴다. 설정/룰/링크는 즉시 제거. 실제 구현 파일은 더 조사 후 결정. `worktree` 안에 숨어 있던 2개는 verifier가 1차에서 걸러냈고, 2차 구현 라운드로 제거했다.

major 분류로 plan-orchestrator → 구현 → code-verifier → codex-cross-verify → 보고 전 파이프라인을 전부 탔다. verifier-report와 codex-report 모두 `~/.claude/workflow/current/`에 저장됐고, Stop hook이 두 파일 없으면 응답을 차단했다.

---

## jidonglab: 정적 포트폴리오 → build-in-public 피드

리디자인 방향이 세션 중에 바뀌었다. v3(cream+acid+rust 페이퍼톤)를 버리고 처음부터 다시 짰다.

기존: "이런 프로젝트를 만들었습니다" 정적 카드 나열
새 방향: Claude Code 대화기록에서 자동 추출된 프롬프트·작업 단편·커밋·결과 스니펫이 시간순으로 흐르는 라이브 피드

컨셉 정리하면 — 카피는 사람이 한 번 쓰고, 콘텐츠는 시스템이 매일 갱신한다. 사이트의 정체성이 곧 활동 그 자체.

비주얼은 `editorial-mono.html` 변주 중 모노톤 + 단일 액센트 방향으로 결정됐다. `extract-feed.mjs`가 JSONL 로그에서 피드를 뽑는 핵심 스크립트다. mock-feed.json에 테스트 데이터 넣고 검증까지는 됐다. 실제 GitHub API·commit hook 연동은 다음 단계.

---

## 오케스트레이션 Stop hook: 실전 적용

이 기간 동안 Stop hook이 여러 번 작업을 막았다.

세션 5(AgentCrow 제거):
```
[ORCHESTRATOR STOP-GATE] 작업 종료 차단 (complexity=standard).
diff는 만들어졌으나 다음 산출물이 없음:
  - codex-report (codex-cross-verify 서브에이전트)
```

세션 9(Blogger 수정):
```
[ORCHESTRATOR STOP-GATE] 작업 종료 차단 (complexity=simple).
diff는 만들어졌으나 다음 산출물이 없음:
  - verifier-report (code-verifier 서브에이전트)
```

simple 분류 작업에도 verifier-report가 없으면 차단한다. 예외 없이. 처음엔 번거로웠는데, 서브에이전트 환각 버그를 발각한 것도 이 파이프라인 덕분이다. verifier가 가짜 diff를 pass 준 건 문제였지만, 그 레이어가 없었으면 아예 `git status`를 확인할 타이밍도 없었다.

세션 4(커피챗 리디자인)에서는 디자인 관련 요청 시 자동으로 `claude-design-lite` 스킬이 발동되도록 `~/.claude/settings.json`에 hook을 추가했다. 사용자가 "리디자인"이나 디자인 관련 단어를 쓰면 6단계 워크플로우가 자동 시작되는 구조.

---

## 이 기간 새로 만든 것들

`report-builder` 스킬 신설. "보고서 줘" 한 마디에 팩트·최신 소식·실사례 기반 딥서치 → HTML 보고서 → `jee599/reports` GitHub Pages 자동 발행까지 파이프라인이 돌아간다. 지금은 AX 시장 보고서 1편이 올라가 있다.

Claude 구독 사용량 추적도 정리했다. `~/.claude/projects/**/*.jsonl`에 모든 요청의 모델·토큰·타임스탬프가 기록된다. `npx ccusage@latest --instances`로 프로젝트별 비용 분해가 가능하다.

---

## 숫자

- 세션: 13개
- 기록된 tool call: Bash 224+, Agent 39+, Write 38+, Edit 28+, Read 12+
- 가장 긴 세션: 세션 2 (192 tool calls, 259h 누적)
- 환각으로 낭비한 라운드: 1 (Blogger 수정, +1 재디스패치)
- 제거한 AgentCrow 링크: 4개 프로젝트 심볼릭 링크 + worktree 내부 2개 = 총 6건
