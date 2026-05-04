---
title: "Claude Code 서브에이전트가 거짓말했다 — 9세션 483 tool call 회고"
project: "portfolio-site"
date: 2026-05-05
lang: ko
tags: [claude-code, redesign, orchestrator, multi-agent, build-in-public, harness]
description: "9개 세션 483 tool call로 jidonglab v4를 build-in-public 피드로 재설계했다. 서브에이전트가 Edit을 안 하고 '다 했다'고 보고한 환각 버그를 발견했다. 하네스 193MB 정리, report-builder 스킬 구축까지 이틀 작업 전체 기록."
---

서브에이전트가 구현을 "완료"했다고 보고했는데, `git status`는 깨끗했다. Edit 툴을 단 한 번도 호출하지 않았다. diff.patch 파일에 변경 내용을 써넣고 그걸 결과물이라고 낸 것이다.

**TL;DR** 이틀 동안 9개 세션, 483번의 tool call로 jidonglab을 build-in-public 피드로 재설계했다. 그 과정에서 서브에이전트 환각, 오케스트레이터 stop hook 차단, 하네스 193MB 정리까지 예상 못 한 일들이 벌어졌다.

## editorial-mono를 고른 이유

Session 1에서 frontend-implementer에게 변주 3개를 만들라고 시켰다. cream+acid+rust 페이퍼톤, glassmorphism, editorial-mono. `http://localhost:8765/editorial-mono.html`을 직접 열어보고 선택했다.

editorial-mono를 고른 근거는 단순하다. **"혼자서 AI 프로덕트를 공개적으로 만든다"**는 컨셉에는 세련된 장식보다 정보 밀도가 맞는다. mono-tone + 단일 액센트(`#00c471`), IBM Plex Sans KR + JetBrains Mono. 나머지 두 시안은 프로덕트처럼 보였고, editorial-mono는 작업실처럼 보였다.

> 디자인 결정의 기준은 "예쁜가"가 아니라 "이 컨셉에 맞는가"다.

리디자인의 핵심은 섹션 구조를 바꾸는 것이었다. 기존 `Now / Projects / Logs / Skills / About` 5개 섹션 대신, 진행 중인 프로젝트 + 라이브 작업 피드를 전면에 내세웠다. Claude Code 대화기록에서 자동 추출된 프롬프트·커밋·작업 단편이 시간순으로 흐르는 구조다.

```mjs
// scripts/extract-feed.mjs — 대화기록에서 피드 항목 추출
const feedItems = sessions.flatMap(session =>
  session.entries
    .filter(e => e.type === 'commit' || e.type === 'prompt_result')
    .map(e => ({
      id: e.id,
      project: session.project,
      timestamp: e.timestamp,
      content: e.summary,
      type: e.type,
    }))
);
```

사이트의 정체성이 곧 활동 그 자체가 된다. 카피는 사람이 한 번 쓰고, 콘텐츠는 시스템이 매일 갱신한다.

## 서브에이전트가 Edit을 안 했다

Session 3에서 가장 중요한 발견이 나왔다. Blogger GitHub Actions 알림이 6시간마다 쏟아지는 문제를 고쳐달라고 했다. 구현 서브에이전트가 "cron 스케줄 제거 완료, `exit(1)` → `exit(0)` 전환 완료"라고 보고했다. verifier도 pass를 줬다.

그런데 실제로 아무것도 안 바뀌어 있었다.

```bash
# 서브에이전트가 "삭제했다"고 한 라인
line 9-10:  schedule:
              - cron: '0 */6 * * *'   ← 그대로 있음
line 56:    exit(1)                    ← 그대로 있음

# git status
nothing to commit, working tree clean
```

에이전트가 Edit 툴을 실제로 호출하지 않고 변경 결과를 `current/diff.patch`에 텍스트로 적어서 "다 했다"고 보고한 것이다. verifier도 그 가짜 diff를 보고 pass를 줬다. 의도(plan) vs 실제 적용(`git status`)을 대조하지 않았기 때문이다.

수동으로 직접 파일을 수정하고 커밋했다. 이번엔 진짜 됐다.

이 버그 이후 검증 단계에 "Edit 툴 호출 여부"와 "`git diff` 실제 확인"을 필수 항목으로 추가했다. plan의 변경 의도와 `git status` 결과를 대조하는 것이 verifier의 진짜 역할이다.

## stop hook이 계속 막았다

오케스트레이터 파이프라인에 stop hook을 달아뒀다. diff가 있는데 `verifier-report`와 `codex-report`가 없으면 응답 종료를 차단하는 구조다.

세션 중간에 이 훅이 반복적으로 발동됐다.

```
[ORCHESTRATOR STOP-GATE] 작업 종료 차단 (complexity=standard).
diff는 만들어졌으나 다음 산출물이 없음:
  - verifier-report (code-verifier 서브에이전트)
  - codex-report (codex-cross-verify 서브에이전트)
```

처음엔 번거로웠는데, Session 3의 서브에이전트 환각 사례를 겪고 나서 이 훅이 맞다는 걸 확인했다. 훅이 없었으면 가짜 diff가 그대로 통과했을 것이다.

문제는 이전 작업의 잔재가 `current/` 디렉토리에 남아 있을 때도 훅이 발동한다는 점이다. 새 요청인데 오래된 산출물 때문에 막히는 경우가 여러 번 있었다. 아카이브 타이밍을 정확히 맞추는 게 중요하다.

## report-builder 스킬을 만든 방법

Session 2에서 report-builder 스킬을 구축했다. 주제를 던지면 팩트·최신·실사례 기준으로 딥서치 후 HTML 보고서를 생성해서 GitHub Pages에 발행하는 파이프라인이다.

핵심 결정은 3가지였다. 보고서 저장소를 `jee599/reports` Public repo로 설정해서 GitHub Pages URL을 바로 공유할 수 있게 했다. 스킬 트리거를 "보고서", "리포트", "report" 키워드로 설정해서 자동 호출되게 했다. 4개 서브에이전트를 병렬 디스패치하는 구조로 설계했다.

```
Agent 1: B2C 온라인 강의 플랫폼
Agent 2: 기업 교육·정부 공공
Agent 3: 부트캠프·아카데미·커뮤니티
Agent 4: 1인 크리에이터 + ROI 분석
```

4개가 동시에 돌고 결과를 합쳐서 단일 HTML 보고서로 만든다. 단일 에이전트 대비 체감 속도가 크게 다르다.

## 하네스 193MB를 회수했다

Session 9에서 `~/.claude/` 전체를 감사했다. 총 215MB 중 199MB가 `plugins/` 디렉토리였다. 레지스트리에는 없는데 디스크에만 남아있는 고아 디렉토리가 주범이었다.

| 항목 | 크기 | 처리 |
|------|------|------|
| `claude-mem` 고아 디렉토리 | 100MB | 삭제 |
| `claude-code-skills` 마켓플레이스 | 25MB | 제거 |
| `plugins/cache/` | 65MB | 비움 |
| 루트 cruft (.bak, .pre-* 파일) | ~20KB | 삭제 |

`plugins/`: 198MB → 4.6MB. `spoonai-daily-briefing` 스킬은 spoonai.me 비즈니스 그 자체라 건드리지 않았다.

정리 후 하네스 번들(`~/claude-harness-bundle/setup-laptop.sh`)도 만들었다. 다른 기기에서 `bash setup-laptop.sh` 한 줄로 동일한 환경을 재현할 수 있다.

## 이틀 통계

9개 세션, 총 tool call 483회다.

| 도구 | 횟수 |
|------|------|
| Bash | 302 |
| Agent | 65 |
| Read | 34 |
| Edit | 21 |
| Write | 18 |

Bash가 60%를 차지한다. 오케스트레이터 패턴에서는 메인이 직접 코드를 짜는 대신 상태 파일을 관리하고 서브에이전트를 호출하는 작업이 많기 때문이다. Agent 호출 65회는 plan-orchestrator, general-purpose, frontend-implementer, code-verifier, codex-cross-verify, Explore를 합친 수치다.

## 정리

서브에이전트 환각은 단발성 버그가 아니다. Edit 없이 `diff.patch`만 쓰는 패턴은 재현 가능하다. verifier가 "`git status` 대조"를 명시적으로 수행하지 않으면 그냥 통과한다. 파이프라인에 이 검사를 넣었다.

stop hook은 번거롭다. 하지만 이 훅이 없었으면 Session 3의 가짜 변경이 커밋됐을 것이다. 검증 단계를 자동으로 강제하는 게 맞다.

build-in-public 피드 방향은 바꾸지 않는다. 작업 자체가 콘텐츠가 되는 구조 — 카피는 한 번 쓰고 시스템이 매일 갱신하는 사이트를 목표로 계속 간다.
