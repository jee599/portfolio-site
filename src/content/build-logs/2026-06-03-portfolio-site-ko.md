---
title: "GitHub Actions 26연속 실패, Claude Code로 56개 저장소 전체 스캔해서 정리"
project: "portfolio-site"
date: 2026-06-03
lang: ko
tags: [claude-code, github-actions, automation, devops, open-design]
description: "portfolio-site AI News 워크플로우가 26회 연속 실패 중이었는데 아무도 몰랐다. Claude Code로 56개 저장소를 스캔해 4개 실패 Action을 찾아내고 비활성화한 과정. 34분, 60 tool calls."
---

portfolio-site의 "Generate AI News" 워크플로우가 26회 연속으로 실패 중이었다. 알림도 없었고, 직접 열어보기 전까지 몰랐다.

**TL;DR** Claude Code 한 줄 프롬프트로 `jee599` 계정 56개 저장소 전체를 스캔했다. 4개 저장소에서 100% 실패 중인 워크플로우를 찾아내 모두 비활성화했다. 총 34분, Bash 35회, Read 11회, Edit 12회.

## "계속 실패하는 Action이나 불필요한 거 지워줘"

프롬프트는 이게 전부였다. 어떤 저장소인지, 어떤 워크플로우가 문제인지 아무것도 명시하지 않았다.

Claude Code는 먼저 `gh auth status`로 인증을 확인하고 저장소 목록을 가져왔다. 56개. 워크플로우가 있는 저장소를 필터링하고, 각 저장소의 최근 실행 결과를 조회했다. `gh run list --repo <name> --limit 20` 반복 호출로 실패율 패턴을 분류했다. Bash 35회 중 대부분이 이 스캔 과정이었다.

결과:

| 저장소 | 워크플로우 | 실패율 | 원인 |
|---|---|---|---|
| `dev_blog` | Publish to Hashnode | 16/16 | HASHNODE_TOKEN 만료 + 중복 |
| **`portfolio-site`** | **Generate AI News** | **26/26** | **환경변수 누락** |
| `saju` | CI | 최신 실패 중 | 코드 오류 |
| `contextzip` | CI | 8/8 | Rust 컴파일 오류 |

## portfolio-site AI News가 26번 다 실패한 이유

원인은 단순했다. GitHub Actions에서 `/api/generate-ai-news` endpoint를 호출하는데, 해당 endpoint는 `ANTHROPIC_API_KEY`가 필요하다. Actions secrets에 그 환경변수가 없었다. 매번 에러가 났는데 알림 설정도 없어서 조용히 쌓였다.

`dev_blog`의 Hashnode 발행도 비슷한 패턴이었다. `HASHNODE_TOKEN`이 만료된 채로 계속 돌고 있었는데, 거기다 `hashnode_blog` 레포가 같은 발행 작업을 이미 정상 수행 중이었다. 중복이면서 고장난 상태였다.

## 삭제 대신 Disable

`gh workflow disable <workflow-id> --repo <name>` 명령으로 4개를 모두 비활성화했다. 파일 삭제가 아니다.

이유는 복원이 쉬워서다. 워크플로우 파일은 그대로 두고 실행만 막는다. `ANTHROPIC_API_KEY`를 Actions secrets에 추가하면 `gh workflow enable`로 바로 살릴 수 있다. 처리 후 `gh workflow view`로 상태를 검증했다. 4개 모두 `disabled_manually` 확인.

## contextzip은 코드도 고쳤다

contextzip의 CI 실패는 비활성화만으로 끝나지 않았다. Rust 컴파일 오류가 원인이라 실제 코드를 수정해야 했다. `src/cargo_cmd.rs`, `src/compact_cmd.rs`, `src/discover/mod.rs`, `src/discover/report.rs`, `src/hook_audit_cmd.rs`, `src/learn/detector.rs`, `src/lint_cmd.rs`, `src/mypy_cmd.rs`, `src/tsc_cmd.rs`, `.github/workflows/ci.yml` — 10개 파일, Edit 12회. 수정 후 CI를 통과시키고 워크플로우를 재활성화했다.

## 같은 날: HTML 결과물에 강제 디자인 게이트

같은 날 전혀 다른 세션에서, harness 개선 작업도 있었다. 이쪽이 더 오래 걸렸다. 14시간 20분, 124 tool calls.

배경은 이렇다. Claude Code가 HTML 산출물을 만들 때 Open Design 없이 raw CSS를 그냥 뱉는 경우가 있었다. "텍스트 박스 뒤에 배경이 그라데이션이고 AI 티가 난다"는 피드백이 나왔다. soft 권고로 두면 계속 같은 일이 반복된다.

`hooks/design-gate.sh`를 만들었다. `PreToolUse: Edit|Write|MultiEdit` 이벤트에 걸린다. `.html/.htm` 파일을 쓰려고 할 때 그 세션이 디자인 패스로 승인됐는지 확인하고, 안 됐으면 `exit 2`로 차단한다. 승인은 `hooks/design-pass.sh "사유"` 한 번 실행하면 그 세션 동안 유효하다. `dist/`, `/tmp/`, `node_modules/` 같은 빌드/벤더 경로는 면제다.

7가지 smoke test를 직접 돌렸다: 미승인 차단, 승인 후 통과, 세션 내 연속 통과, 새 세션 재차단, 비-HTML 면제, 빌드 경로 면제, 감사 로그 기록. 전부 통과.

이제 Claude Code가 `.html`을 쓰려고 할 때마다 "이 세션, 도장 있어?"를 확인하는 게이트가 생겼다. soft 권고는 무시할 수 있지만 `exit 2`는 무시할 수 없다.

## 26개 Action이 조용히 실패하는 걸 막으려면

이번 작업에서 분명해진 것이 있다. GitHub의 기본 실패 알림은 cron 기반 워크플로우에 너무 약하다. "항상 실패"가 기본 상태가 되면 알림 피로 때문에 무시하게 된다.

취한 원칙은 단순하다. 확실히 고장난 것은 disable, 중복된 것도 disable, 고칠 수 있는 것은 수정 후 검증하고 재활성화. "나중에 고치자"가 아니라 지금 당장 상태를 깨끗하게 유지하는 것. CI가 조용하면 신뢰할 수 있다. 노이즈가 쌓이면 진짜 실패가 보이지 않는다.

portfolio-site의 AI News 자동화는 `ANTHROPIC_API_KEY`를 Actions secrets에 추가하면 다시 살릴 수 있다. 그게 다음 작업이다.
