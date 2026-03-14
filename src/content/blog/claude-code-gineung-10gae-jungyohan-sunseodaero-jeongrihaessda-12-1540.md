---
title: "Claude Code 기능 10개, 중요한 순서대로 정리했다 (1/2)"
description: "CLAUDE.md부터 Subagents까지. 이 5개가 기반이다."
date: "2026-03-04"
tags: ["ai", "claudecode", "productivity", "webdev"]
source: "devto"
---

Claude Code를 쓰면서 기능이 너무 많아서 헷갈렸다. CLAUDE.md, Skills, Hooks, MCP, Ralph Loop, Agent Teams, Worktrees, Subagents, Plugins… 이름만 들으면 뭐가 뭔지 모르겠고, 블로그 글마다 말하는 게 다르다.

그래서 공식 문서를 전부 뒤졌다. Anthropic GitHub 레포, code.claude.com 공식 독스, 플러그인 marketplace.json까지. 실제로 존재하는 기능만 추려내고, 중요한 순서대로 10개를 정리했다.

1편에서는 기반이 되는 5개를 다룬다. 이 5개가 탄탄하지 않으면 나머지 5개를 써봤자 효과가 반감된다.

## CLAUDE.md

모든 기능의 기반이다. 이게 없으면 나머지 9개가 반쪽짜리가 된다.

세션 시작할 때 자동으로 읽히는 프로젝트 컨텍스트 파일이다. 코딩 컨벤션, 아키텍처 규칙, 금지사항을 여기에 적어두면 매 세션마다 “우리 프로젝트는 TypeScript 쓰고, 컴포넌트는 함수형이고, 커밋은 conventional commits야”를 반복할 필요가 없다.

중요한 건, 다른 기능들이 전부 이걸 참조한다는 거다. `/code-review`를 돌리면 CLAUDE.md 기준으로 체크한다. GitHub Actions에서 자동 리뷰를 해도 여기에 정의된 규칙을 따른다. Subagent를 띄워도 CLAUDE.md를 읽고 시작한다.

이게 부실하면 다른 기능의 정확도가 전부 떨어진다.

위치가 유연하다는 것도 핵심이다. 프로젝트 루트에 놓으면 전체 규칙이 되고, src/UI/ 같은 하위 디렉토리에 놓으면 해당 디렉토리 작업 시에만 로드된다. `~/.claude/CLAUDE.md`에 놓으면 모든 프로젝트에 공통으로 적용된다.

실제로 내가 쓰는 구조는 이렇다.

- 프로젝트루트/CLAUDE.md ← 기술 스택, 전체 컨벤션
- 프로젝트루트/src/UI/CLAUDE.md ← UI 시스템 고유 규칙
- ~/.claude/CLAUDE.md ← 커밋 메시지 포맷, 공통 습관

루트 CLAUDE.md에는 기술 스택 개요, 디렉토리 구조, 코딩 규칙, 빌드/테스트 방법, 금지사항을 넣는다. 하위 CLAUDE.md에는 해당 모듈에서만 적용되는 세부 규칙을 넣는다. 이렇게 분리하면 UI 작업할 때는 UI 규칙이 추가로 로드되고, API 작업할 때는 API 규칙이 로드된다. 컨텍스트가 자동으로 맞춰진다.

실전 예시를 보자. Next.js 사이드 프로젝트의 CLAUDE.md:

```md
# FateSaju - AI 사주 분석 서비스

## 기술 스택
Next.js 14 (App Router), TypeScript, Tailwind CSS
Supabase (Auth + DB + Edge Functions)
Claude API (사주 해석)
Vercel 배포

## 규칙
- 컴포넌트는 함수형 + hooks만
- API 호출 시 반드시 try-catch
- 한국어 UI 텍스트는 constants/에서 관리
- 커밋: conventional commits (feat:, fix:, docs:)

## 금지
- any 타입 사용 금지
- console.log 커밋 금지
- 하드코딩된 API URL 금지 (env 변수 사용)
```

팁 하나. CLAUDE.md는 짧고 명확할수록 좋다. “~하면 좋겠다”가 아니라 “~해라”. 모호한 표현은 Claude가 자기 맘대로 해석한다. 그리고 너무 길면 컨텍스트를 낭비한다. 핵심만 넣고, 자세한 건 Skills로 분리하자. 그게 다음 기능이다.

## Skills

CLAUDE.md가 “항상 들고 다니는 메모”면, Skills는 “필요할 때 꺼내보는 매뉴얼”이다. `.claude/skills/`에 SKILL.md로 정의하면 Claude가 대화 맥락에 따라 자동으로 로드한다. “위젯 만들어줘”라고 하면 UI 관련 Skill이 올라오고, “배포해줘”라고 하면 배포 체크리스트 Skill이 올라온다. `/skill-name`으로 직접 호출할 수도 있다.

왜 CLAUDE.md에 다 안 넣나. 토큰 때문이다. CLAUDE.md에 모든 걸 넣으면 매 세션마다 그 토큰을 전부 소비한다. UI 시스템 규칙이 500토큰이고, API 컨벤션이 300토큰이고, 배포 체크리스트가 200토큰이면, API 작업할 때도 UI 규칙 500토큰이 낭비된다. Skills로 분리하면 필요한 순간에만 컨텍스트를 쓴다.

둘의 차이를 정리하면 이렇다.

- CLAUDE.md는 세션 시작 시 항상 로드된다. 컨텍스트를 항상 차지한다. 프로젝트 전체 규칙에 쓴다.
- Skills는 관련 작업 시에만 로드된다. 필요할 때만 컨텍스트를 차지한다. 특정 도메인 지식이나 워크플로우에 쓴다.

실전 예시. UE5 프로젝트에서 CommonUI 관련 Skill:

`.claude/skills/ue5-ui-system/SKILL.md`

```md
---
name: ue5-ui-system
description: UE5 CommonUI 기반 UI 시스템 개발 가이드. "위젯", "UI", "CommonUI", "팝업" 키워드에 반응.
---

# UE5 UI 시스템 규칙

## 위젯 생명주기
CreateWidget<T>() → AddToViewport() or AddChild()
반드시 NativeConstruct()에서 초기화
RemoveFromParent()로 제거 (GC가 처리)

## CommonUI 패턴
모든 UI 위젯은 UCommonActivatableWidget 상속
입력 라우팅은 UCommonUIActionRouterBase 사용
팝업은 PushContentToLayer_ForPlayer() 사용
ESC 키는 OnHandleBackAction() 오버라이드

## 자주 나는 버그
위젯 crash: Outer가 nullptr인 상태에서 CreateWidget
입력 먹통: InputComponent의 Priority 충돌
포커스 이탈: ActivateWidget() 미호출
```

이 Skill은 평소에는 로드되지 않는다. Claude에게 “팝업 위젯 만들어줘”라고 하면 description에 있는 “위젯”, “팝업” 키워드에 반응해서 자동으로 올라온다. UI 작업이 아닐 때는 컨텍스트를 0만큼 차지한다.

Slash Commands도 여기에 통합됐다. 예전에는 `.claude/commands/`와 `.claude/skills/`가 별개였는데, 지금은 둘 다 같은 방식으로 동작한다. `.claude/skills/review/SKILL.md`를 만들면 `/review`로 호출할 수 있다. 기존 `.claude/commands/` 파일도 그대로 동작하니까 마이그레이션 부담은 없다.

고급 기능으로 `context: fork`가 있다. frontmatter에 이걸 넣으면 별도 subagent에서 실행된다. 메인 대화 컨텍스트를 오염시키지 않는다.

```md
---
name: deep-research
description: 코드베이스 심층 조사
context: fork
agent: Explore
---

$ARGUMENTS에 대해 철저히 조사하라:
1. Glob과 Grep으로 관련 파일 찾기
2. 코드 읽고 분석
3. 파일 참조와 함께 결과 요약
```

`/deep-research 인증 시스템`이라고 치면, Explore 에이전트가 별도 컨텍스트에서 인증 관련 파일을 전부 뒤지고 요약만 돌려준다. 메인 대화에는 요약만 남으니까 컨텍스트가 깨끗하다.

## Hooks

자동화의 심장. 한번 세팅하면 이후 모든 세션에서 자동으로 돌아간다.

Claude Code의 특정 이벤트에 스크립트를 걸어두는 거다. 웹 개발의 Git hooks이나 UE5의 Delegate와 비슷한 개념이다. “이 이벤트가 발생하면 이 스크립트를 실행해라.”

이벤트가 꽤 많다. PostToolUse는 도구 실행 직후에 발동한다. 여기에 린트를 걸면 코드 수정할 때마다 자동 포맷팅이 된다. PreToolUse는 도구 실행 직전에 발동한다. 위험한 bash 명령을 차단할 수 있다. Stop은 Claude가 응답을 끝내고 종료하려 할 때 발동한다. Ralph Loop의 핵심이 이거다. SessionStart는 세션 시작 시, Notification은 알림이 필요할 때 발동한다.

실전 예시부터 보자. 코드 편집 후 자동 포맷팅:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/format-check.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

`matcher`가 “Write|Edit”이니까, Claude가 파일을 쓰거나 편집할 때만 발동한다. Bash 도구를 쓸 때는 안 돈다. `$CLAUDE_PROJECT_DIR`은 프로젝트 루트 경로로 자동 치환된다.

format-check.sh는 이런 식이다:

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
  npx prettier --write "$FILE_PATH" 2>/dev/null
  echo '{"feedback": "Prettier 포맷팅 완료"}'
fi
```

stdin으로 JSON이 들어온다. 거기서 파일 경로를 뽑아서 Prettier를 돌린다. feedback 필드로 메시지를 보내면 Claude가 “포맷팅 완료됐다”는 걸 알게 된다.

위험한 명령 차단도 같은 구조다:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/validate-bash.sh"
          }
        ]
      }
    ]
  }
}
```

validate-bash.sh에서 `rm -rf /`나 `DROP TABLE` 같은 패턴을 감지하면 `{"block": true, "message": "위험한 명령입니다"}`를 리턴한다. Claude가 해당 명령을 실행하지 않는다.

장시간 작업 시 데스크톱 알림도 걸 수 있다:

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude 작업 완료\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

Ralph Loop 돌려놓고 다른 일 하다가, 끝나면 맥 알림이 뜬다.

Hook 타입은 세 가지다.

- `command`: 셸 커맨드 실행. 가장 범용적이다.
- `http`: HTTP POST 요청. 외부 서비스 연동할 때 쓴다.
- `prompt`: LLM이 판단하는 건데, 이건 Stop과 SubagentStop에서만 지원된다.

Hooks를 이해하면 Claude Code의 자동화가 열린다. 포맷팅, 린트, 테스트, 알림, 보안 검증까지 전부 자동화할 수 있다.

## GitHub Actions PR 자동화

`@claude`를 PR이나 이슈 코멘트에 태그하면 Claude가 코드를 분석하고, PR을 생성하고, 리뷰 코멘트를 달고, 린트 에러를 수정해준다.

셋업은 Claude Code 터미널에서 `/install-github-app` 한 줄이면 된다. GitHub App 설치, 시크릿 설정, 워크플로우 파일 생성까지 가이드해준다.

수동으로 하고 싶으면 `https://github.com/apps/claude`에서 앱 설치하고, `ANTHROPIC_API_KEY`를 repo secrets에 추가하고, 워크플로우 yml을 복사하면 된다.

실제로 쓰면 이런 시나리오가 된다.

GitHub 이슈에 이렇게 쓴다:

```text
@claude 이 이슈를 구현해줘.
로그인 페이지에 카카오/구글 소셜 로그인 버튼 추가.
기존 LoginForm 컴포넌트를 수정하고, SocialLoginButton 컴포넌트를 새로 만들어줘.
```

Claude가 코드를 구현하고, 변경사항이 포함된 PR을 자동 생성한다. PR 설명도 달아준다.

PR 리뷰 중에 문제를 발견하면:

```text
@claude 이 함수에 에러 핸들링이 빠져있어. try-catch 추가하고, 에러 시 토스트 메시지 보여줘.
```

Claude가 해당 파일을 수정하고 새 커밋을 PR에 추가한다. 사람이 직접 코드를 고칠 필요가 없다.

자동 리뷰도 된다. 워크플로우를 이렇게 짜면:

```yaml
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            이 PR의 변경사항을 리뷰해줘.
            CLAUDE.md 기준으로 체크하고, 보안, 성능, 에러 핸들링을 중점 확인해.
```

PR이 올라올 때마다 Claude가 자동으로 리뷰 코멘트를 단다. CLAUDE.md에 정의된 규칙 기준으로.

Security Review용 별도 Action(`claude-code-security-review`)도 있다. Anthropic 공식 레포에 있다. OWASP 기준으로 보안 취약점을 분석하는데, 패턴 매칭이 아니라 코드 의미를 이해해서 분석하니까 false positive이 적다.

혼자 개발할 때 특히 강력하다. 사이드 프로젝트에서 코드 리뷰어가 없는 상황. Claude가 매 PR마다 자동 리뷰를 해주면, 새벽에 졸면서 짠 코드의 실수를 잡아줄 안전망이 생긴다. 린트 에러도 “@claude 고쳐줘” 한 마디면 끝이다.

## Custom Subagents

Claude가 작업 중에 전문 “부하 에이전트”를 생성해서 일을 시키는 기능이다. RPG에서 파티원에게 역할을 분담하는 것과 비슷하다. 각 subagent는 자기만의 컨텍스트 윈도우에서 독립적으로 작업하고, 결과 요약만 메인 대화로 돌려준다. 메인 컨텍스트가 깨끗하게 유지된다는 게 핵심이다.

왜 필요한가. 메인 대화가 길어지면 컨텍스트가 부족해진다. PR 리뷰를 시키면 파일 내용이 전부 메인 컨텍스트에 쌓인다. 그러면 이후 작업에서 “아까 말했잖아”를 해도 Claude가 기억을 못 한다. Subagent를 쓰면 리뷰 작업이 격리된 환경에서 돌아가고, 메인에는 “3개 이슈 발견: A, B, C” 같은 요약만 남는다.

만드는 방법은 두 가지다. `/agents` 명령어에서 대화형으로 만들거나, 직접 마크다운 파일을 만들면 된다.

`.claude/agents/code-reviewer.md`:

```md
---
name: code-reviewer
description: 코드 리뷰 에이전트
tools:
  - Read
  - Glob
  - Grep
  - Bash(git diff *)
skills:
  - ue5-ui-system
permissionMode: bypassPermissions
---

# 코드 리뷰 에이전트

변경된 코드를 분석하고 다음을 체크한다:
- 버그 가능성 — nullptr 접근, 메모리 누수, 레이스 컨디션
- 성능 이슈 — Tick 함수 내 비싼 연산, 불필요한 동적 할당
- 컨벤션 위반 — CLAUDE.md에 정의된 규칙 위반

각 이슈에 파일 경로, 라인 번호, 심각도, 수정 제안을 포함해라.
```

frontmatter에서 몇 가지를 제어한다.

- `tools`: 이 에이전트가 쓸 수 있는 도구를 제한
- `skills`: 특정 지식 주입
- `permissionMode: bypassPermissions`: 권한 확인 없이 실행
- `isolation: worktree`: 별도 git worktree에서 실행

Subagent 대신 Skills를 쓰는 게 나을 때도 있다. Subagent는 격리된 컨텍스트에서 작업을 위임할 때 쓰고, Skills는 메인 대화에서 지식을 추가할 때 쓴다. “이 코드 리뷰해줘”는 Subagent가 낫고, “이 API 컨벤션 따라서 코드 짜줘”는 Skills가 낫다.

-----

여기까지가 기반 5개다. CLAUDE.md로 규칙을 정의하고, Skills로 도메인 지식을 분리하고, Hooks로 자동화를 걸고, GitHub Actions로 PR 워크플로우를 자동화하고, Subagents로 전문 작업을 위임한다.

이 5개가 탄탄하면, 2편에서 다룰 나머지 5개(Ralph Loop, MCP, Git Worktrees, Code Review 플러그인, Agent Teams)가 제대로 동작한다. 이 5개가 부실하면, Ralph Loop을 돌려도 엉뚱한 결과가 나오고, Agent Teams를 써도 팀메이트가 컨벤션을 무시한다.

2편에서는 대규모 작업을 위한 스케일링 도구와 상황별 도구를 다룬다.

> “도구가 10개 있어도, 기반이 되는 3개를 먼저 세팅하라.”

[jidonglab.com](https://jidonglab.com)
