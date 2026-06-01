---
title: "Opus 4.8로 하루 444번: 하네스 감사·OpenDesign 이식·리포트 생성 자동화"
project: "portfolio-site"
date: 2026-06-02
lang: ko
tags: [claude-code, opus-4-8, open-design, harness, automation, design-system]
description: "16개 세션, 444번의 도구 호출로 Claude CLI 하네스를 전면 감사하고, claude.ai/design 엔진을 로컬 스킬로 이식했다. Bash 220번, Edit 72번의 흔적."
---

하루에 444번 도구를 호출했다. 16개 세션, Opus 4.8, Bash 220번, Edit 72번. 그 결과물은 코드 한 줄이 아니라 Claude Code 자체가 일하는 방식의 재설계였다.

**TL;DR** — `~/.claude/` 전체를 감사해서 유령 훅 8개를 폐기하고, Opus 4.8에 맞게 하네스를 재조정했다. claude.ai/design의 OpenDesign 엔진을 로컬 스킬로 이식해서 모든 디자인 요청이 자동으로 OD 루트를 타게 만들었다.

## 하네스 전수 감사: 훅이 어디에도 등록 안 돼 있었다

세션 11이 가장 오래 걸렸다. 약 17시간, 81번의 도구 호출. 발단은 단순한 질문이었다: "지금 적용된 도구들 확인해봐."

`harness-audit` 스킬을 실행하고 `~/.claude/` 전체를 병렬로 수집하기 시작했다. `settings.json`에서 `jq`가 바로 실패했다. `hooks` 키가 아예 없었다. 9개의 훅 스크립트가 파일로는 존재하는데 등록이 안 된 상태였다.

```bash
cat ~/.claude/settings.json | jq '.enabledPlugins, (.hooks | keys)'
# null | keys → TypeError
```

원인을 추적하니 `settings.json`이 아니라 `settings.local.json`에 등록 경로가 분산돼 있었다. 훅 8개는 `dormant` 상태로 방치 중이었고, 깨진 심볼릭 링크가 3개 있었다. 바로 폐기 결정을 내리고 정리했다.

정리 후 모든 에이전트를 Opus 4.8로 통일했다. `claude-fast`, `claude-work`, `claude-review`, `claude-heavy` — 네 개 래퍼의 모델을 일괄 수정하고, `codex-cross-verify`의 병목도 잡았다.

## OpenDesign 이식: claude.ai/design을 로컬에서

세션 14는 질문에서 시작됐다: "opendesign 좋아. 모든 디자인에 대해서 저 루트를 타게 할 수 있어?"

claude.ai/design은 2026년 4월 Anthropic이 출시한 디자인 루프다. `init 질문 → 방향 선택 → 샌드박스 → 5차원 자가검토`로 진행된다. 오픈소스 버전인 OpenDesign 레포는 `od mcp` CLI까지 제공한다. 즉, Claude Code에 그대로 이식이 가능했다.

OD의 실제 엔진 프롬프트를 먼저 읽었다. `reference/charter.md`, `reference/directions.md` — RULE 1/2/3 discovery 흐름, OKLch 팔레트가 포함된 5가지 방향, 5차원 검토 기준. 클라우드에서 웹 UI가 하던 `<question-form>`, `<artifact>` 렌더링을 터미널 AskUserQuestion으로 매핑했다.

결과물:
- `~/.claude/skills/open-design/SKILL.md` — OD 루트 스킬
- `~/.claude/skills/open-design/reference/charter.md`
- `~/.claude/skills/open-design/reference/directions.md`
- `~/.claude/hooks/design-router.sh` — UserPromptSubmit 훅으로 디자인 요청 자동 감지

이제 "디자인", "prototype", "목업", "랜딩", "dashboard", "리디자인" 같은 키워드가 들어오면 훅이 먼저 개입하고 OD 루트를 안내한다. 명시적으로 부르지 않아도 된다.

## 소상공인 리포트: 삽질 7세션의 기록

세션 6~16에 걸쳐 소상공인 온라인 노출 진단 리포트 2종을 만들었다. 무료 진단 리포트와 유료 결과물 샘플.

흐름은 이랬다:

1. 세션 6 — 디자인 방향 리서치. HubSpot Website Grader, SEMrush Site Audit, 토스 신용점수 구조를 웹으로 확인
2. 세션 7 — 내용 구조 HTML/PDF 목업 (저해상). Chrome headless PDF 생성
3. 세션 8-9 — 유료 결과물 샘플. "붙여넣을 수 있는 작업물" 포맷
4. 세션 10 — OpenDesign 스타일 리디자인. **잉크 미니멀** 방향 선택. `oklch(98.6% 0.005 95)` 배경, `oklch(23% 0.018 260)` 잉크
5. 세션 13, 15, 16 — Codex 크로스 리뷰 피드백 수정

Codex 리뷰에서 블로킹 이슈가 2건 나왔다. 첫째, 무료 PDF에서 `break-inside: avoid`가 걸린 `.cov` 블록이 마지막 행을 잘라먹었다. 둘째, 유료 PDF에서 `왜 이렇게 바꿨는가기존`처럼 라벨이 붙어서 출력됐다. 세션 16에서 Edit 30번으로 고쳤다.

삽질 포인트 하나: Chrome headless PDF 생성이 `@media print` 쿼리에만 반응한다는 걸 늦게 확인했다. 화면에서 멀쩡하게 보이던 레이아웃이 PDF에선 완전히 다르게 나왔다. 이후엔 항상 pdfinfo와 pdftotext로 추출 확인을 먼저 한다.

## Codex 크로스 리뷰가 실제로 블로킹 이슈를 잡는다

세션 13에서 Codex independent review가 VERDICT: request-changes를 돌려줬다. Claude가 만든 결과물을 Codex가 읽기 전용으로 검수하는 구조다.

이 패턴이 효과 있는 이유는 간단하다. 같은 컨텍스트에서 자기 검토를 하면 놓치는 게 생긴다. Codex는 컨텍스트를 공유하지 않으니까 실제로 다른 눈이다. PDF 렌더링 버그처럼 "만든 사람은 화면에서 봤으니 맞다고 생각하는" 케이스를 잡아낸다.

## 수치로 보기

| 항목 | 수치 |
|---|---|
| 총 세션 | 16개 |
| 총 도구 호출 | 444번 |
| Bash | 220번 |
| Read | 73번 |
| Edit | 72번 |
| Write | 19번 |
| WebSearch | 15번 |
| 수정 파일 | 18개 |
| 생성 파일 | 18개 |
| 가장 긴 세션 | 세션 11 (~17시간, 81 tool calls) |

## 정리

하네스 감사에서 얻은 교훈은 "등록되지 않은 훅은 훅이 아니다"였다. 9개 스크립트가 `~/.claude/hooks/`에 있었지만 `settings.json`에 없었으니 전부 무용지물이었다.

OpenDesign 이식은 예상보다 빨랐다. 클라우드 서비스의 프롬프트 엔진을 그대로 읽을 수 있으면 이식도 그만큼 정확하다. OD 레포가 엔진 프롬프트를 공개해 둔 덕분이다.

남은 과제: `design-router.sh` 훅이 비시각 작업(API 설계, DB 스키마)을 잘못 잡는 경우가 있다. 더 정밀한 키워드 분류 로직이 필요하다.
