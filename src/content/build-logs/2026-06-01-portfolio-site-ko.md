---
title: "Claude CLI 하네스 전면 재편: 16세션·444 tool calls로 Open Design 로컬 이식"
project: "portfolio-site"
date: 2026-06-01
lang: ko
tags: [claude-code, open-design, harness, opus-4-8, automation, hooks]
description: "하루 16세션 444 tool calls. 하네스 대청소·dormant 훅 8개 폐기·Open Design 로컬 이식·design-router 자동화까지. Opus 4.8 시대 Claude CLI 구조를 다시 짰다."
---

하루에 16개 세션, 444번의 tool call이 소비됐다. 코드 구현이 아니라 Claude CLI 구조 자체를 다시 짜는 데 절반이 넘게 쓰였다.

**TL;DR** `~/.claude/settings.json`에 `hooks` 키가 아예 없었다. 스크립트 9개가 파일로 존재하지만 전부 미등록 상태. `harness-audit`으로 전체를 감사하고, dormant 훅 8개 폐기 + Open Design 로컬 이식 + `design-router.sh` 자동 라우팅까지 하루에 처리했다.

## 훅 9개가 전부 안 됐던 이유

세션 11이 이날의 핵심이었다. 프롬프트 하나로 81번의 tool call이 이어졌다.

```
지금 적용되어 있는 도구들 확인해봐 구조 관련해서, 하네스, 스킬, md 훅 이런거 모두
```

`harness-audit` 스킬을 트리거하고 인벤토리를 병렬 수집했다. `settings.json`의 훅 등록 상태를 확인하는 시점에 첫 번째 오류가 떴다.

```bash
cat ~/.claude/settings.json | jq '.enabledPlugins, (.hooks | keys)'
# Error: null | keys
```

`hooks` 키가 아예 없었다. `~/.claude/hooks/` 안에 스크립트 9개가 존재하고 실행권한도 맞는데, Claude Code 입장에서는 없는 것과 같았다. 훅이 동작 안 한다면 `settings.json` 등록 여부를 제일 먼저 봐야 한다는 교훈이다. 파일 위치나 실행권한 디버깅보다 앞에 온다.

감사 결과 전체 현황:

| 범주 | 갯수 | 상태 |
|---|---|---|
| 스킬 (소유 디렉토리) | 11개 | 정상 |
| 에이전트 YAML | 12개 | 정상 |
| 훅 스크립트 | 9개 | **전부 미등록** |
| 깨진 심볼릭 링크 | 3개 | 정리 완료 |
| dormant 훅 | 8개 | **폐기** |

Bash 41번, Edit 13번으로 정리했다.

## Opus 4.8에 적합한 하네스 구조

감사 도중 사용자 질문이 여러 번 방향을 바꿨다.

```
"내가 명시적으로 호출하는것보다 알아서 잘 호출되는게 좋아"
"4.8에 가장 효과적인 구조로 짜줘"
```

결론은 직관에 반했다. 훅이 많을수록 모델이 어떤 훅이 트리거됐는지 파악하는 데 초반 컨텍스트를 쓴다. Opus 4.8은 문맥 이해도가 이미 충분히 높아서 복잡한 라우팅 레이어가 오히려 걸림돌이 된다.

최적 구조: **`CLAUDE.md` 품질 높이기 + 최소 훅**.

실제로 남긴 훅은 두 개뿐이다. `protect-files.sh`(PreToolUse, 비밀 파일 보호용 결정적 가드)와 `omc-dial.sh`(UserPromptSubmit, 고위험 작업에서만 plan/scope/self-verify 넛지 주입, 그 외에는 침묵). 강제 파이프라인, 필수 리뷰 루프는 opt-in으로 남겼다.

## Open Design 로컬 이식

세션 14가 두 번째 큰 작업이었다. 1시간 21분, 70 tool calls.

사용자가 claude.ai/design에 관심을 보였다. 로컬을 탐색해보니 `open-design` 레포가 이미 있었고, `od mcp` 커맨드로 Claude Code에 직접 연결하는 MCP 서버까지 내장돼 있었다.

OD의 엔진 프롬프트 파일들을 추측으로 재구현하지 않고 그대로 읽어서 이식했다. discovery 플로우(RULE 1/2/3), 5가지 시각 방향(oklch 팔레트 포함), 디자이너 헌장, anti-slop 체크리스트, 5차원 자가검토 — 전부 verbatim.

```
~/.claude/skills/open-design/SKILL.md
~/.claude/skills/open-design/reference/charter.md
~/.claude/skills/open-design/reference/directions.md
```

## design-router 훅: 명시적 호출 없이 자동화

스킬만 만들면 여전히 사용자가 "open-design 써줘"라고 명시해야 한다. 원하는 건 자동이었다. `design-router.sh`를 `UserPromptSubmit` 훅으로 등록해서 해결했다.

랜딩, 목업, 대시보드, 프로토타입, 시안, 리뉴얼 같은 키워드가 프롬프트에 나타나면 OD 루트를 타라는 system-reminder를 자동 주입한다. 코드 실행 없이 프롬프트 컨텍스트 레벨에서 처리한다. `CLAUDE.md`에도 동일한 라우팅 규칙을 명시해서 양쪽에서 강제한다.

Edit 21번, Write 9번이 들었다. 수정된 파일만 18개였다.

## 소상공인 진단 보고서 HTML/PDF

세션 6~10, 13, 15, 16은 별개의 맥락이었다. 소상공인 온라인 상품 페이지 진단 보고서를 HTML/PDF로 만드는 흐름이었다.

무료 진단 리포트 → 유료 결과물 샘플 → OpenDesign 스타일 v1 리디자인 순서로 진행됐다. Codex가 독립 리뷰에서 `VERDICT: request-changes`를 반환했고, 블로커가 두 개였다.

첫째, 무료 PDF에서 커버리지 테이블 마지막 두 행이 잘렸다. `break-inside:avoid`가 걸린 `.cov` 블록이 페이지 경계에서 행을 삭제한 것이었다. 둘째, 유료 PDF의 FAQ Q/A 마커가 CSS로만 생성돼 실제 텍스트가 없어서 복사가 안 됐고, 가격 숫자에 줄바꿈이 발생했다.

세션 16에서 Edit 30번, print CSS 수정, `<span>` 실제 텍스트 전환, `white-space:nowrap` 추가로 두 블로커를 해결하고 Chrome headless로 PDF를 다시 뽑았다.

## 도구 사용 통계

```
Bash        ██████████████████████████████ 220
Read        ██████████ 73
Edit        ██████████ 72
Write       ██ 19
WebSearch   ██ 15
Agent       █ 8
TaskUpdate  █ 8
ToolSearch  █ 7
```

16세션 합계 444 tool calls. Bash가 절반을 차지한다. 구조 파악·상태 확인·디렉토리 탐색이 구현보다 많은 전형적인 감사+리서치 세션 구성이다.

## 남은 것

`~/.claude/plans/harness-report-2026-06-01.md`와 `opus48-cli-research-2026-06-01.md`가 다음 작업의 시작점이다. `design-router.sh`의 키워드 목록은 실제 사용 패턴을 보면서 계속 조정해야 한다.

Claude Certified Architect(CCA) 시험이 2026년 3월에 출시됐는데 파트너사 직원에게만 열려 있어서 응시 자체가 막혀 있다는 것도 이날 확인했다.
