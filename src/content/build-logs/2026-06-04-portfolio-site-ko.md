---
title: "GitHub Actions 26/26 실패 방치 → 한 번에 정리, Claude Code 하네스 Design Gate 구축"
project: "portfolio-site"
date: 2026-06-04
lang: ko
tags: [claude-code, github-actions, automation, open-design, harness]
description: "portfolio-site의 Generate AI News 워크플로우가 26번 연속 실패 중이었다. 35개 세션, 60+ tool calls로 GitHub Actions를 정리하고 HTML 결과물 강제 Design Gate를 구축했다."
---

26번. `Generate AI News` 워크플로우가 연속으로 실패한 횟수다. 그리고 아무도 몰랐다.

**TL;DR** GitHub Actions 4개를 비활성화하고, HTML 산출물을 막는 `design-gate.sh` 훅을 Claude Code 하네스에 심었다. portfolio-site 관련 작업은 그 과정의 부산물로 정리됐다.

## GitHub Actions가 조용히 죽어 있었다

세션 10에서 `jee599` 계정의 56개 저장소를 한 번에 스캔했다. 워크플로우 실패 현황을 뽑아보니 패턴이 바로 보였다.

```
portfolio-site / Generate AI News → 26/26 실패
dev_blog / Publish to Hashnode → 16/16 실패 (HASHNODE_TOKEN 만료)
saju / CI → 최신 실패 (의존성 충돌)
contextzip / CI → 8/8 실패 (Rust 빌드 오류)
```

`Generate AI News`의 실패 원인은 API 키 문제였다. 고칠 수도 있었지만 먼저 "이 워크플로우가 지금 필요한가"를 따졌다. 결론: 로컬에서 GitHub Actions 대신 직접 실행하는 구조로 바꿔두었기 때문에 이 워크플로우는 더 이상 쓰지 않는 것이었다.

삭제 대신 `disable`을 택했다. `gh workflow disable` 명령 하나로 되돌리기 쉬운 상태로 보존한다.

```bash
gh workflow disable "Generate AI News" --repo jee599/portfolio-site
```

Bash 35번, Read 11번, AskUserQuestion 2번 — 총 60 tool calls. 작업 시간 34분. 56개 저장소 스캔부터 검증까지 한 세션에서 끝냈다.

## Design Gate: HTML 파일을 막는 훅

같은 날 더 긴 작업이 있었다. 세션 15, 124 tool calls, 14시간 20분.

발단은 질문 하나였다.

> "html로 나오거나 웹으로 나오는 모든 결과물 open design 통하게 강제돼 있어?"

확인해보니 강제가 아니었다. `design-router.sh`는 키워드를 감지해서 권고 메시지를 주입하는 soft 라우팅이었다. 프롬프트에 "강제로 해"라는 말이 나왔고, 실제 하드 게이트를 만들기로 했다.

설계는 단순했다. `Write|Edit|MultiEdit` 도구로 `.html/.htm` 파일을 만들려고 할 때, 세션이 디자인 패스를 받지 않았으면 `exit 2`로 차단한다.

```bash
# hooks/design-gate.sh 핵심 로직
if [[ "$tool_name" =~ ^(Write|Edit|MultiEdit)$ ]]; then
  if [[ "$file_path" =~ \.(html|htm)$ ]]; then
    if ! session_acknowledged; then
      echo "Design pass required. Run: design-pass.sh \"사유\""
      exit 2
    fi
  fi
fi
```

승인 방법은 `design-pass.sh "사유"` 한 번. 그 세션 동안은 계속 통과. 새 세션이면 다시 요청해야 한다.

빌드 경로(`/tmp/`, `dist/`, `vendor/`)는 자동 면제한다. 자동화 워크플로우가 매번 막히면 의미 없으니까.

smoke test 7케이스를 돌려서 검증했다: 미승인 차단, 승인 후 통과, 세션 내 지속, 새 세션 재차단, HTML 외 파일 통과, 빌드 경로 면제.

## report-builder, owner-briefing 등 스킬은 사전 면제

`design-gate.sh`를 붙이고 나서 문제가 하나 생겼다. `report-builder`, `owner-briefing`, `medical-report` 같은 스킬들은 자체 디자인 시스템이 있는데 매번 ack를 받아야 했다.

해결은 각 스킬 `SKILL.md`에 세션 시작 시 자동으로 `design-pass.sh`를 호출하도록 추가하는 것이었다. 스킬이 실행될 때 "이건 OD-equivalent 디자인 패스를 내장하고 있다"고 선언하는 방식이다.

`~/.claude/CLAUDE.md`의 하네스 설명도 업데이트했다. 이전에는 `protect-files.sh`와 `omc-dial.sh` 두 개만 적혀 있었는데, `design-gate.sh`와 `design-router.sh`를 추가했다.

## 치과 진단 보고서: Design Gate 첫 실전

Design Gate를 붙인 직후 동백유디치과 진단 보고서를 만들었다. `dental-promo-audit` 스킬로 네이버 플레이스, 블로그 SEO, 홈페이지 구조를 실측 크롤링해서 HTML 보고서로 뽑는 작업이다.

첫 HTML Write 시도에서 게이트가 막았다. `design-pass.sh "dental-promo-audit OD-equivalent pass"` 실행 후 통과. 보고서는 `~/dental-promo/dongbaek-uddental/2026-06-03/01-원장님-진단보고서.html`에 생성됐다.

게이트가 실제로 작동하는 걸 처음 목격한 순간이었다.

## 결과 요약

이번 주기에서 portfolio-site에 직접 닿은 변경은 `Generate AI News` 워크플로우 비활성화 하나다. 나머지는 하네스 레벨 변경 — 모든 프로젝트에 적용되는 `design-gate.sh` 구축.

지금 Claude Code 설정에 걸려 있는 훅:
- `protect-files.sh` — `.env`, `.ssh`, `credentials` 파일 쓰기 차단
- `design-gate.sh` — `.html/.htm` 산출물을 Design Pass 없이 차단
- `omc-dial.sh` — 고난도 작업 계획·검증 유도
- `design-router.sh` — 시각 디자인 의도 감지 → open-design 스킬 라우팅

다음은 AI News 워크플로우를 새 구조에 맞게 다시 붙이는 작업이다.
