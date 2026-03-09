---
title: "Claude Code, 깔아놓고 채팅만 하고 있다면 — CLAUDE.md, Hooks, MCP 설정법"
description: "Claude Code의 진짜 힘은 채팅창이 아니라 설정 파일에 있다."
pubDate: "2026-03-03"
tags: "ai, webdev, claude, productivity"
lang: "ko"
source: "devto-migration"
---

Claude Code를 깔았다. `claude`를 치면 대화창이 뜬다. 거기서 “이 버그 고쳐줘” “테스트 짜줘”를 한다.

여기서 멈춰있는 사람이 많다.

Claude Code의 진짜 힘은 채팅창이 아니라 **설정 파일 3개**에 있다.

CLAUDE.md, Hooks 설정, MCP 서버 연결.

이 셋만 잡아도 체감이 완전히 달라진다.

## CLAUDE.md — 세션이 바뀌어도 기억이 남는다

Claude Code는 세션이 끝나면 전부 잊는다.

어제 “pytest에 -v 옵션 써”라고 가르쳐줬어도 오늘 다시 말해야 한다.

CLAUDE.md가 이걸 해결한다.

프로젝트 루트에 `CLAUDE.md`를 만들어두면, Claude Code가 세션 시작할 때 자동으로 읽는다. 명시적으로 “이거 읽어”라고 안 해도 된다.

Claude는 이 파일을 “개발자가 나를 위해 남겨둔 지시사항”으로 인식한다.

```md
# Project Guide

## 개발 규칙
- 테스트는 항상 `pytest tests/ -v`로 실행
- DB 작업 전 반드시 백업 생성
- 커밋 메시지는 feat/fix/docs 접두사 사용

## 기술 스택
- Python 3.11, FastAPI, PostgreSQL
- 프론트는 Next.js 14 App Router
```

핵심은 **처음부터 완벽하게 안 써도 된다**는 거다. Claude가 실수할 때마다 교정 사항을 하나씩 추가하면 된다.

세션 중에 `#`으로 시작하면 바로 CLAUDE.md에 추가할 수 있다.

```md
# API 응답은 항상 snake_case로 보낼 것
```

CLAUDE.md는 계층 구조로 동작한다.

- `~/.claude/CLAUDE.md`: 전역 설정
- `./CLAUDE.md`: 프로젝트 설정
- `./.claude/CLAUDE.md`: 프로젝트 로컬(개인) 설정

하위 디렉토리에도 넣을 수 있다. 예: `src/ui/CLAUDE.md`.

## Hooks — “항상” 실행되는 자동화

Hook은 도구 실행 전/후에 셸 명령을 강제로 거는 방식이다.

`.claude/settings.local.json` 예시:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read f; if echo \"$f\" | grep -qE '\\.(ts|tsx)$'; then npx prettier --write \"$f\" 2>/dev/null; fi; }"
          }
        ]
      }
    ]
  }
}
```

차단 Hook도 가능:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json,sys; d=json.load(sys.stdin); p=d.get('tool_input',{}).get('file_path',''); sys.exit(2 if '.env' in p else 0)\""
          }
        ]
      }
    ]
  }
}
```

종료 코드 `2`를 반환하면 실행이 차단된다.

## MCP — Claude Code에 플러그인을 꽂는다

MCP 서버를 연결하면 외부 시스템까지 다룰 수 있다.

```bash
# GitHub
claude mcp add github -s user \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=your-token \
  -- npx -y @modelcontextprotocol/server-github

# Context7
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest

# Playwright
claude mcp add playwright -s project -- npx -y @playwright/mcp@latest

# PostgreSQL
claude mcp add postgres -s project \
  -e DATABASE_URL="postgresql://user:pass@localhost:5432/mydb" \
  -- npx -y @modelcontextprotocol/server-postgres
```

## 이 셋을 합치면

CLAUDE.md로 규칙을 가르치고,
Hook으로 품질을 강제하고,
MCP로 능력을 확장한다.

설정에 30분 쓰면 앞으로 매일 시간을 아낀다.

> Claude Code의 진짜 힘은 대화가 아니라 설정에 있다.

[jidonglab.com](https://jidonglab.com)
