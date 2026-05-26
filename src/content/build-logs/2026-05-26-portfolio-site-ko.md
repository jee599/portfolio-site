---
title: "Claude Code 144 tool calls, 하루 PDF 보고서 5개 자동화한 방법"
project: "portfolio-site"
date: 2026-05-26
lang: ko
tags: [claude-code, automation, pdf, report-generation, hermes]
description: "Claude Code 10개 세션, 144 tool calls로 PDF 보고서 5개를 하루에 자동 생성했다. Chrome headless 변환 파이프라인, Hermes 릴레이 패턴, Codex 리뷰 기반 수정 세션까지 — 실전 리포트 팩토리 기록."
---

하루 10개 세션에서 Claude Code가 Bash를 71번 실행했다. 전체 144 tool calls 중 절반이 셸 명령이었는데, 대부분은 `chromium --headless` 한 줄이었다.

**TL;DR** Chrome headless로 HTML을 PDF로 변환하는 파이프라인을 세우면, Claude Code는 전문 컨설팅 보고서를 1시간 안에 생성하고 키워드 검증까지 끝낸다. 수정이 필요하면 별도 세션으로 분리하는 게 깔끔하다.

## Bash 71번의 정체

HTML 작성보다 PDF 변환과 검증에 더 많은 셸 실행이 필요했다. 파이프라인은 단순하다:

```bash
chromium --headless --no-sandbox \
  --print-to-pdf="report.pdf" \
  --print-to-pdf-no-header \
  file:///path/to/report.html
```

변환 후에는 `pdftotext`로 필수 키워드가 실제로 들어갔는지 검증한다. 세션 8에서는 경기도 공공데이터, 보건의료빅데이터, 지식재산 데이터, 공공조달데이터 — 이 네 키워드를 모두 확인했다. 하나라도 빠지면 보고서로 제출할 수 없다. 이 검증 루프가 Bash 횟수를 높인 주요 원인이다.

## 하루 5개 보고서 파이프라인

오늘 생성된 보고서 목록:

- `2026-05-25_gov_startup_support_realistic_strategy` — 공공 스타트업 지원 실전 공략 10페이지, 2.5 MB
- 위 수정본 — Codex 리뷰로 발견된 두 줄 오류 반영
- `2026-05-26-medical-dental-ads-daily` — 치과광고 SERP 일일 분석 HTML
- `2026-05-26_ai_data_contest_strategy_report` — AI 데이터 공모전 전략 13페이지, 2.9 MB
- `2026-05-26_contest_prize_difficulty_mvp_playbook` — 공모전별 MVP 플레이북

세션마다 주제는 달랐지만 흐름은 같았다. 기존 보고서 스타일 확인 → HTML 작성 → `chromium --headless` 변환 → `pdftotext` 키워드 검증 → 워크플로 state 업데이트. 이 패턴이 반복될수록 각 세션 소요 시간이 줄었다. 세션 8이 8분 18 tool calls였는데, 바로 이어진 세션 9는 같은 도메인의 심화 보고서를 8분 17 tool calls로 끝냈다.

## "You are Claude CLI, Hermes is only the relay"

세션 프롬프트마다 이 문장이 있었다. Telegram 봇(Hermes)이 요청을 중계하고, Claude CLI가 실제 파일을 만든다는 역할 분리다.

이 문장이 단순한 컨텍스트 주입 이상의 효과를 낸다. Claude가 "나는 오케스트레이터"라는 모드로 빠지는 걸 명시적으로 차단한다. 실제로 세션 8에서 Claude는 복잡도를 `major`로 분류하려다가 스스로 재분류했다: "실제 작업은 fully provided spec으로 단일 파일 생성 — `simple`에 가깝다." 역할 정의가 명확하면 Claude가 불필요한 파이프라인을 만들지 않는다.

## 수정 전용 세션 3개

전체 10세션 중 3개가 수정 전용이었다.

세션 2(13 tool calls)는 Codex가 리뷰한 두 줄을 고쳤다. A5, B5 항목의 "직접 현금 미확인" 문구를 "직접 현금성 지원은 1차 스크리닝에서 미확인 — 공고 첨부 확인 필요"로 통일하는 작업이었다. 세션 6(20 tool calls)은 일관성 오류 2건 — executive summary의 잘못된 미검출 표기와 HTML 보고서 내 가설 신뢰도 혼용이었다. 세션 7(5 tool calls)은 특정 병원명이 `competitive-serp-observations.md`에 노출된 걸 익명화 표현으로 대체했다. `임플란트, 아이디병원` → `일부 종합병원/성형외과성 브랜드 광고`.

각 수정 세션은 `claude_consistency_repair.md`, `claude_named_leak_repair.md` 같은 별도 프롬프트 파일로 트리거됐다. 패턴은 `Read and execute /path/to/claude_*.md`. 수정 범위를 파일에 미리 정의하고 실행하면 Claude가 범위를 벗어나지 않는다. 구체적 diff 지시 없이 "고쳐줘"라고 하면 인접 코드까지 손대는 경우가 있어서 이 방식이 안전하다.

## 소켓 끊김과 대형 Bash 세션의 위험

세션 3에서 `API Error: The socket connection was closed unexpectedly`가 발생했다. Bash 19번 연속 실행 중 연결이 끊겼다. SpoonAI 인텔 큐레이션용 Python 스크립트를 실행하던 중이었고, 결과적으로 산출물 없이 세션이 종료됐다.

장시간 Bash 루프가 위험한 이유다. 검증→변환→검증 같은 반복 작업은 중간에 상태를 파일로 저장하거나, 단계를 작은 세션으로 나누는 게 낫다. 특히 외부 바이너리 의존 작업은 실패 지점이 많다. 세션 3이 실패한 것과 달리 세션 8이 성공한 차이는 Python 스크립트 일괄 실행 vs. 단계별 Chrome headless 호출의 차이였다.

## tool call 분포로 보는 하루

| 도구 | 횟수 | 비율 |
|------|------|------|
| Bash | 71 | 49% |
| Read | 44 | 31% |
| Edit | 16 | 11% |
| Grep | 8 | 6% |
| Write | 5 | 3% |

Write가 5번에 불과하다. HTML 보고서 전체를 Write로 작성하고, 수정은 Edit(16번)으로 처리했다. 500줄짜리 HTML도 Edit가 타깃 라인만 교체하기 때문에 전체를 다시 Write하는 것보다 안정적이다. Read(44번)가 많은 건 "기존 스타일 참고 → 작성 → 검증"이 세 번씩 Read를 유발하기 때문이다. 세션 4에서만 Read를 17번 실행했다 — 치과광고 daily update 포맷을 파악하는 데 읽어야 할 파일이 많았다.

내일도 같은 파이프라인이 돌아간다. 치과광고 SERP 분석은 매일 반복이고, 공모전 보고서는 마감 전 심화 버전이 필요하다. 패턴이 굳어지면 세션당 소요 시간이 더 줄어들 것이다.
