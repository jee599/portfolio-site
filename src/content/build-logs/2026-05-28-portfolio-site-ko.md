---
title: "Claude Code로 하루 4개 도메인을 69번의 tool call로 처리한 기록"
project: "portfolio-site"
date: 2026-05-28
lang: ko
tags: [claude-code, automation, ai-ops, claude-opus-4-7, orchestration]
description: "하루 8개 세션 69 tool calls로 치과 광고 SERP 리서치·SpoonAI AI 인텔·P1 매출 보고서·CLI 상태 보고서를 처리했다. 오케스트레이터 게이트 차단 삽질 포함 실제 운영 기록."
---

8개 세션, 69번의 tool call. 오늘 하루 Claude Code가 처리한 작업의 전체 규모다.

**TL;DR** claude-opus-4-7로 치과 광고 SERP 분석, SpoonAI AI 뉴스 큐레이션, P1 제품 매출 보고서, CLI 버전 상태 보고서를 하루에 처리했다. 멀티 도메인 ops 허브로 Claude Code를 운영하는 패턴이 안정화됐다.

## 오늘 실제로 돌린 작업 4개

세션은 8개지만 의미 있는 작업은 4가지다. 세션 7·8은 `CLAUDE_OK`, `CLAUDE_OK_AFTER_FIX`를 반환하는 헬스체크 핑이다.

**세션 1 — SpoonAI 데일리 AI 인텔 정리**: `2026-05-28-daily-intel-raw.json`을 읽고 카드뉴스형 마크다운과 JSON으로 정제했다. Bash 10번만으로 끝났다. raw 데이터가 이미 JSON으로 구조화되어 있었기 때문에 Read 없이 Bash에서 jq로 처리했다.

**세션 2·3 — 한국 치과 광고 SERP 리서치**: 이 날이 실제로 네이버 플레이스광고 노출 수 상향 D-Day(공지 31700번)였다. SERP 샘플 15건(지역×진료 12건 + 위험표현 결합 2건 + 비용이벤트 결합 1건)을 분석해 `rolling-knowledge-base.md`, `naver-ranking-hypotheses.md` 등 5개 누적 파일을 업데이트했다.

세션이 둘로 쪼개진 이유가 있다. 첫 패스에서 `2026-05-28-daily-update.md`를 만들었지만 누적 파일 업데이트와 HTML 보고서를 완료하지 못했다. 세션 3이 Narrow Finish Pass로 나머지를 채웠다.

**세션 4 — P1 제품 통합 매출 보고서**: 4개 P1 제품을 대상으로 목요일 시그널 기반 HTML 보고서를 생성했다. `TaskCreate` 5번으로 섹션별 체크포인트를 찍으며 진행했고, `WebSearch` 4번으로 당일 치과 SNS 사전심의 이슈 같은 프레시 신호도 끌어왔다.

**세션 5·6 — CLI 버전 상태 HTML 보고서**: 여기서 삽질이 있었다. 자세한 건 아래 섹션에서.

## 오케스트레이터 게이트가 막은 순간

세션 5에서 오케스트레이터 게이트가 작업을 차단했다. 단일 HTML 파일 생성인데 `standard`로 분류돼서 `plan-orchestrator`를 요구하는 흐름으로 들어간 것이다.

원인은 프롬프트 길이였다. Claude Code 버전, Codex CLI 버전, Hermes 버전 상태를 모두 포함하다 보니 프롬프트가 길어졌고, 오케스트레이터가 내용 기반으로 `standard`로 올려잡았다.

해결은 두 경로로 진행됐다. 세션 5에서 내부에서 `simple`로 재분류 후 진행, 세션 6에서 프롬프트 자체를 단순화해 재요청. 둘 다 동작했다. **프롬프트 길이와 실제 작업 복잡도는 다르다** — 오케스트레이터 게이트가 항상 정확하게 분류하지는 않는다.

## tool call 분포

```
Bash:         33번 (48%)
Read:         24번 (35%)
TaskCreate:    5번
WebSearch:     4번
Write:         2번
ToolSearch:    1번
```

Bash가 절반 가까이다. 파일 I/O, jq 처리, git 작업, 상태 업데이트, HTML 생성까지 Bash에서 처리했다. Read가 35%인 건 세션 3에서 기존 누적 파일을 15개 순서대로 읽었기 때문이다.

Write가 2번뿐인 게 눈에 띈다. 대부분 산출물이 `Bash`의 `cat > file` 방식으로 쓰였다. Write 도구보다 Bash가 실제로 더 많은 파일을 만들었다.

## 플레이스광고 D-Day를 SERP로 관찰한 방법

치과 SERP 세션에서 흥미로운 점이 하나 있다. 네이버 플레이스광고 노출 수 상향 적용이 바로 오늘이었고, 그걸 SERP 샘플 15건으로 직접 관찰했다. Claude Code가 `evidence_brief.md`에서 "오늘이 D-Day"라는 사실을 읽고 그 맥락을 가설 파일 업데이트에 반영했다.

전날 raw 수집 → 당일 정제·해석 구조가 이걸 가능하게 했다. 콘텐츠 리서치든 SERP 분석이든, 날짜 기반 트리거가 있는 작업은 이 패턴이 유효하다.

## Narrow Finish Pass 패턴

세션 2·3의 관계가 이 프로젝트의 전형적인 패턴이다. 큰 작업 하나를 한 세션에서 끝내려다 실패하고, 잔여 작업을 별도 세션으로 처리했다. 두 번째 프롬프트 구조가 핵심이다.

```
The first artifact pass created 2026-05-28-daily-update.md
but did not finish cumulative files or HTML report.

## Scope
Only finish/update these existing required artifacts:
- rolling-knowledge-base.md
- source-index.md
- competitive-serp-observations.md
- naver-ranking-hypotheses.md
```

이미 완료된 파일을 명시하지 않으면 두 번째 세션도 첫 번째와 동일한 탐색부터 시작한다. 완료 목록과 미완료 목록을 분리해서 넘기는 것이 컨텍스트 낭비를 막는다.

## 오늘의 숫자

| 항목 | 값 |
|------|-----|
| 세션 수 | 8 (유효 작업 6) |
| 총 tool calls | 69 |
| Bash | 33 |
| Read | 24 |
| Write | 2 |
| 생성 파일 | 2개 |
| 총 소요 시간 | 약 6분 |
| 모델 | claude-opus-4-7 (전 세션) |

> 하루 6분, 4개 도메인. 오케스트레이션 레이어가 있으면 도구 사용은 Claude에게 맡기고 사람은 입력 소재와 범위만 정하면 된다.

---

*이 빌드 로그는 Claude Code 세션 기록에서 자동 추출·생성된다.*
