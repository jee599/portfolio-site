---
title: "Claude Code 기능 10개, 중요한 순서대로 정리했다 (2/2)"
description: "Ralph Loop부터 Agent Teams까지. 스케일링과 병렬화의 영역."
date: "2026-03-04"
tags: ["ai", "claudecode", "productivity", "webdev"]
source: "devto"
---

1편에서 기반 5개를 다뤘다. CLAUDE.md, Skills, Hooks, GitHub Actions, Subagents.

이번에는 나머지 5개를 다룬다. 1편이 “Claude Code를 똑똑하게 만드는 법”이었다면, 2편은 “Claude Code를 여러 개 동시에 굴리는 법”이다. 대규모 작업, 병렬 처리, 외부 연동, 품질 게이트. 규모가 커질 때 필요한 도구들이다.

## Ralph Loop

대규모 작업의 게임체인저. Claude에게 작업을 주고 “끝날 때까지 계속 반복해”라고 시키는 기능이다.

동작 원리는 의외로 단순하다. Claude가 작업을 끝내고 종료하려 하면, Stop hook이 가로채서 같은 프롬프트를 다시 넣는다. Claude는 이전 반복에서 수정한 파일과 git 히스토리를 보고 다음에 뭘 해야 하는지 스스로 판단한다.

흐름:
- 1회차: 파일 수정
- 종료 시도 → Stop hook 개입
- 2회차: 같은 프롬프트 + 변경된 코드베이스를 보고 다음 작업 진행
- 전부 끝나면 `<promise>DONE</promise>` 출력

```bash
/ralph-loop "모든 API 엔드포인트에 에러 핸들링 추가. 완료 시 <promise>DONE</promise> 출력" --max-iterations 20
```

`--max-iterations`는 필수 안전장치다.

큰 작업에서는 PROGRESS.md 패턴이 중요하다. 매 반복마다 체크리스트를 읽고 한 항목씩 처리하며 체크한다.

## MCP

Model Context Protocol. Claude Code를 외부 세계에 연결하는 표준 프로토콜이다.

```bash
claude mcp add github -s user -- npx @modelcontextprotocol/server-github
```

이 한 줄로 GitHub API 도구를 연결할 수 있다.

실전 강점은 티켓 시스템 연동이다.

```text
JIRA-1234 티켓을 읽고, 요구사항대로 구현해줘.
끝나면 티켓 상태를 In Review로 바꾸고 코멘트 남겨.
```

스코프:
- `-s user`: 전역
- `-s local`: 현재 프로젝트만, git 미포함
- `-s project`: 프로젝트 공유(git 포함)

주의:
1) MCP 서버는 컨텍스트를 먹는다. 안 쓰는 건 제거.
2) MCP 서버는 Claude 기본 도구(Read/Write/Bash)를 상속하지 않는다.

## Git Worktrees

병렬 작업의 인프라다.

```bash
# 기능 개발
claude --worktree feature-social-login

# 버그 수정
claude --worktree bugfix-login-crash
```

각각 별도 디렉토리/브랜치에서 돌아가므로 파일 충돌이 줄어든다.

`--tmux`를 붙이면 백그라운드로 여러 세션을 동시에 돌릴 수 있다.

```bash
claude --worktree feature-auth --tmux
claude --worktree feature-dashboard --tmux
claude --worktree refactor-api --tmux
```

Subagent와도 연동 가능:

```md
---
name: parallel-builder
description: 병렬 빌드 에이전트
isolation: worktree
---
```

## Code Review 플러그인

PR 변경사항을 여러 에이전트가 병렬 분석하는 공식 플러그인.

- `/code-review`: 기본 멀티 에이전트 리뷰
- `/pr-review-toolkit:review-pr`: 주제별 정밀 리뷰

예:

```bash
/code-review
/code-review --comment
/pr-review-toolkit:review-pr tests
/pr-review-toolkit:review-pr errors
/pr-review-toolkit:review-pr types
/pr-review-toolkit:review-pr all
```

로컬 사전 점검(`/code-review`) + CI 자동 점검(GitHub Actions)을 함께 쓰면 이중 안전망이 된다.

## Agent Teams

여러 Claude 세션이 팀처럼 협업하는 실험 기능이다.

Subagent는 일방향 보고에 가깝고, Agent Teams는 팀원끼리 메시지로 조율한다.

활성화:

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

사용 예:

```text
3명의 팀메이트를 만들어서 결제 모듈을 리팩토링해줘.
API 담당, DB 담당, 테스트 담당으로.
서로 스키마 변경사항과 API 인터페이스를 공유하면서 진행해.
```

현실적으로는 아직 실험적이라,
- 세션 재개 불안정
- 조기 종료
- 높은 토큰 소비
같은 제약이 있다.

일상 작업은 Subagent + Worktree로 충분한 경우가 많고,
복잡한 교차 레이어 작업에서만 Agent Teams를 꺼내는 게 실용적이다.

-----

정리하면 이렇다.

- CLAUDE.md/Skills/Hooks = 기반
- GitHub Actions/Subagents = 실행 레이어
- Ralph Loop/Worktrees = 스케일링
- Code Review/MCP/Agent Teams = 상황별 도구

전부 한꺼번에 세팅할 필요 없다. CLAUDE.md 하나 제대로 쓰는 것부터 시작해서 점진적으로 확장하면 된다.

> “도구가 10개 있어도, 쓰는 건 3개면 충분하다. 단, 그 3개가 뭔지는 알아야 한다.”

[jidonglab.com](https://jidonglab.com)
