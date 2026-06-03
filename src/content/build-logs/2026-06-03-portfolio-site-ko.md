---
title: "Claude Code 훅으로 HTML 디자인 게이트 구현 — Open Design 없이 쓰면 exit 2로 차단"
project: "portfolio-site"
date: 2026-06-03
lang: ko
tags: [claude-code, hooks, open-design, automation, shell]
description: "HTML 산출물을 Open Design 없이 못 쓰게 막는 하드 게이트 훅을 구현했다. 23번의 tool call, 3번의 AskUserQuestion, 그리고 7가지 smoke test. soft 권고에서 exit 2 하드블록으로 바뀐 과정."
---

"HTML로 결과물 나올 때 Open Design 쓰게 강제돼 있어?"

대답은 "아니오"였다. 그래서 만들었다.

**TL;DR** `design-gate.sh`를 Claude Code `PreToolUse` 훅에 달아 `.html/.htm` 산출물을 세션 ack 없이 쓰면 `exit 2`로 차단한다. 7가지 smoke test 전부 통과.

---

## soft 권고는 강제가 아니다

기존 `design-router.sh`는 `UserPromptSubmit` 훅에서 사용자 프롬프트에 "디자인/랜딩/대시보드" 같은 키워드가 잡히면 `additionalContext`로 권고 한 줄을 주입했다.

"open-design 스킬 쓰는 걸 권장합니다."

권고다. Claude가 무시하면 끝이다. `design-router.sh`의 `exit 0`은 "차단하지 않는다"는 뜻이고, Write 도구가 그냥 실행된다.

CLAUDE.md에도 "Visual/UI design artifacts는 open-design 기본"이라는 정책 라인이 있지만, 정책은 Claude가 읽고 따르는 텍스트다. 결정론적이지 않다.

사용자가 원한 건 달랐다. "그냥 HTML로 결과물 나올 때 무조건 Open Design 쓰게 하고 싶어." 이 한 마디에서 세션이 시작됐다.

---

## 설계: 출입문 경비원

구조를 AskUserQuestion으로 세 번에 걸쳐 합의했다. 23 tool call 중 3번이 사용자 확인이었을 만큼, 설계 결정이 많았다.

핵심 질문은 두 가지였다.

첫째, 어떤 훅 이벤트를 쓸 것인가. `UserPromptSubmit`은 프롬프트 텍스트를 보고 의도를 추론하는 방식이라 false positive/negative가 생긴다. `PreToolUse`는 실제로 파일을 쓰려는 순간에 잡는다. 후자를 선택했다.

둘째, 세션 단위 승인을 어떻게 구현할 것인가. 매번 물어보면 자동화 파이프라인이 깨진다. 그래서 `design-pass.sh "사유"`를 한 번 실행하면 세션 ID가 승인 목록에 기록되고, 같은 세션 안에서는 이후 모든 HTML write를 통과시킨다.

경비원 모델로 설명하자면: 문 앞에 경비원이 서서 "이 세션 도장 받았어? 없으면 못 나가." 도장은 `design-pass.sh`를 한 번 실행해서 받는다. 도장을 받은 세션은 끝날 때까지 통과다.

---

## 구현 디테일

`design-gate.sh`의 핵심 로직은 단순하다.

```bash
# PreToolUse: Edit|Write|MultiEdit
TARGET_FILE="$CLAUDE_TOOL_INPUT_FILE_PATH"

# build/tmp/vendor 경로 면제
if echo "$TARGET_FILE" | grep -qE '(dist/|\.next/|node_modules/|vendor/|\.tmp)'; then
  exit 0
fi

# .html/.htm 산출물만 잡는다
if echo "$TARGET_FILE" | grep -qiE '\.(html|htm)$'; then
  SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
  ACK_FILE="/tmp/claude-design-pass-${SESSION_ID}"

  if [ ! -f "$ACK_FILE" ]; then
    echo "BLOCKED: HTML deliverable requires design-pass ack."
    echo "Run: design-pass.sh \"reason\" to acknowledge."
    exit 2
  fi
fi

exit 0
```

`exit 2`는 Claude Code에서 "이 도구 호출을 막아라"로 해석된다. `exit 0`은 통과, `exit 1`은 경고지만 진행 가능, `exit 2`는 실행 자체를 막는다.

`settings.json`에 등록:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "~/.claude/hooks/design-gate.sh" }]
      }
    ]
  }
}
```

`settings.json`은 `protect-files.sh`가 Edit/Write 차단하는 파일이라 Bash에서 `jq`로 직접 패치했다.

---

## 7가지 smoke test

구현 직후 한 번에 돌렸다. 전부 통과.

1. 미승인 세션에서 `.html` Write → **차단**
2. `design-pass.sh "open-design 스킬 사용"` 실행 후 `.html` Write → **통과**
3. 같은 세션에서 두 번째 `.html` Write → **통과** (도장 유지)
4. 새 세션에서 `.html` Write → **차단** (세션 격리 확인)
5. 미승인 세션에서 `.tsx` Write → **통과** (HTML 아님)
6. `dist/index.html` Write → **통과** (빌드 경로 면제)
7. `node_modules/foo.html` Write → **통과** (vendor 경로 면제)

---

## 5개 스킬 화이트리스트 처리

`report-builder`, `owner-briefing`, `medical-report`, `dental-blog-image-pipeline`, `medical-report` — 이 스킬들은 자체 고정 디자인 시스템으로 HTML을 뽑는다. Open Design과 동등한 패스를 이미 거친다고 볼 수 있다.

각 SKILL.md에 한 줄을 추가했다:

```markdown
HTML 산출물 생성 전 `design-pass.sh "[skill name] built-in design system"` 실행 필요.
```

스킬이 실행될 때 자동으로 `design-pass.sh`를 호출하면 게이트를 통과한다. 완전히 새 HTML을 아무 설계 없이 쓰는 경우만 막고, 이미 디자인 시스템이 있는 스킬은 자연스럽게 통과된다.

---

## CLAUDE.md 업데이트

하드 게이트를 달고 나서 CLAUDE.md의 harness 설명이 구식이 됐다. `protect-files.sh`와 `omc-dial.sh`만 언급하고 있었는데, 이제 `design-gate.sh`도 핵심 훅이다.

"Hard gate for any visual deliverable" 섹션에도 `design-gate.sh`의 존재를 명시적으로 추가했다. 정책 문서와 실제 훅이 같은 내용을 말하게 됐다.

---

## 세션 통계

- **도구 사용**: Read 7, Bash 6, Edit 5, AskUserQuestion 3, Write 2 (총 23회)
- **소요 시간**: 11시간 59분 (세션 실시간 기준)
- **생성 파일**: `design-gate.sh`, `design-pass.sh`
- **수정 파일**: `CLAUDE.md`, 스킬 SKILL.md 5개

11시간이 걸린 건 설계 논의 때문이다. 구현 자체는 Bash 6번으로 끝났다. 중간에 세 번 멈추고 "이게 맞아?" 확인한 게 시간의 대부분이다. 경비원 비유가 나온 것도 그 과정에서였다.

결과적으로 Claude Code가 `.html`을 쓰려 할 때마다 "이 세션, 도장 있어?"를 묻는 게이트가 생겼다. soft 권고는 무시할 수 있지만, `exit 2`는 무시할 수 없다.
