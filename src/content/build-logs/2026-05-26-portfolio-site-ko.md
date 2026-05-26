---
title: "Claude Code 에이전트 4개 병렬 리서치: 골프앱 시장 조사를 41분에 끝낸 방법"
project: "portfolio-site"
date: 2026-05-26
lang: ko
tags: [claude-code, multi-agent, parallel, research, automation, workflow]
description: "하루 18개 세션 302번의 도구 호출. 병렬 에이전트 4개로 골프앱 한국·글로벌 시장 조사를 41분에 완료하고, Codex 교차검증이 리포트 논리 오류를 두 번 잡아냈다."
---

오늘 Claude Code가 41분 동안 에이전트 4개를 병렬로 돌려 골프앱 한국·글로벌 시장 조사 완성본을 뽑아냈다. 각 에이전트는 3,000~5,000단어 분량의 리서치 도시에를 독립적으로 작성했고, 나는 합산 요약만 읽으면 됐다.

**TL;DR** 병렬 에이전트 패턴을 쓰면 순차 리서치 대비 시간이 4분의 1로 줄지만, Codex 교차검증을 빠뜨리면 사실 오류가 그대로 남는다는 것도 오늘 두 번 확인했다.

## 에이전트 4개를 동시에 띄우면 어떻게 되나

`golf-app-research` 작업은 두 앱(매칭 / 스윙 분석) × 두 시장(한국 / 글로벌)의 2×2 매트릭스 리서치가 필요했다. 순차로 돌리면 에이전트 하나당 평균 10분씩이니 40분이 넘는다. 병렬로 던지면?

```python
Agent("Korea golf matching apps research", run_in_background=True)
Agent("Global golf matching apps research", run_in_background=True)
Agent("Swing analysis apps market research", run_in_background=True)
Agent("Solo-founder monetization GTM legal research", run_in_background=True)
```

4개를 메시지 하나에 묶어서 동시에 날렸다. 첫 완료 알림은 14분 후, 마지막은 41분 후에 도착했다. 각 에이전트 결과물은 `outputs/research_kr_matching.md`, `outputs/research_global_matching.md`, `outputs/research_swing.md`, `outputs/monetization_legal.md` 에 저장됐다. 4개를 읽은 뒤 합산 리포트를 한 번에 작성했다.

절약된 시간: 순차 예상 ~40분 → 병렬 실제 41분(벽시계 기준). 에이전트가 돌아가는 동안 다른 세션에서 리포트 작업을 병행했다.

주의할 점 하나. 에이전트는 fresh context에서 시작한다. 프로젝트 범위, 제외 목록, 이전 결정 사항을 프롬프트에 명시하지 않으면 각자 다른 기준으로 판단한다. 골프앱 세션에서는 각 에이전트에게 brief.md 경로와 "Solo-founder, Seoul/Gyeonggi, AI 제품 단독 개발 가능"이라는 사용자 프로필을 모두 넣어줬다.

## complexity 분류 오판이 워크플로를 막는 방법

오늘 가장 많이 발생한 마찰은 오케스트레이터의 complexity 분류 오판이었다. 골프앱 리서치 세션은 처음에 `trivial`로 잘못 분류됐고, P1 일일 보고서 세션은 `major`로 과분류됐다. 둘 다 Write 훅이 막혔다.

해결 패턴은 매번 같았다: 첫 응답에서 명시적으로 재분류.

```bash
source ~/.claude/workflow/lib/state.sh
state_set complexity standard
state_set stage implementing
```

이 두 줄을 치면 이후 파일 수정이 풀린다. 기준은 단순하다: 결과물 파일이 1개이고 입력 스펙이 완전하면 `simple`, 에이전트를 병렬로 써야 하거나 파일 6개 이상이면 `major`. 중간은 `standard`. 분류를 틀리면 불필요한 plan/codex 루프가 강제되거나 반대로 검증이 빠진다.

## Codex가 두 번 버그를 잡았다

첫 번째. 치과광고 SERP 리포트에서 executive summary가 "외부 의료 플랫폼 미검출"이라고 썼는데, 바로 아래 상세 섹션에는 굿닥 7회가 검출됐다고 나와 있었다. 같은 파일 안에서 모순이 생겼는데 내가 직접 읽을 때는 못 잡았다. Codex read-only 리뷰에서 걸렸다.

수정 프롬프트는 `claude_consistency_repair.md`에 정확한 교체 내용을 써서 전달했다:

```
Fix: executive summary line 7
from: "외부 의료 플랫폼이 모두 미검출"
to:   "광고·플레이스·심의필 미검출 + AI 브리핑 검출 + 굿닥 7회 검출"
```

두 번째. P1 일일 보고서의 "오늘 버릴 것" 섹션에 범위 밖으로 제외한 제품명(Daymoon, 골프앱, 담배 카운터 등)이 그대로 나열돼 있었다. 보고서 수신자가 보면 안 되는 내부 컨텍스트 노출이다. 이것도 Codex가 잡았다. 수정은 `Edit` 도구로 2분 안에 끝났다.

패턴: 리포트 생성 후 Codex에 diff + 원본을 던지면 논리 모순과 범위 위반을 잡아준다. 생성하는 세션과 검증하는 세션을 분리하는 게 효과적이다.

## HTML → Chrome headless → PDF 파이프라인

오늘 생성한 리포트는 7개. 전부 같은 흐름이었다.

1. `Write` 도구로 HTML 생성 (인라인 CSS 포함)
2. Chrome headless로 PDF 변환

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless --disable-gpu \
  --print-to-pdf=output.pdf \
  input.html
```

3. `pdftotext output.pdf -` 로 필수 키워드 포함 검증

골프앱 세션에서는 pandoc, wkhtmltopdf, weasyprint, md-to-pdf 모두 미설치 확인됐다. 현재 환경에서 Chrome headless가 사실상 유일한 PDF 변환 도구다. 한 번 파이프라인을 세워두면 다음 리포트는 내용만 교체하면 된다. 생성된 PDF 크기는 521KB~2.9MB, 페이지는 4~13페이지로 다양했다.

## 18개 세션, 302번의 도구 호출

도구별 분포:

- `Bash` 118회 — PDF 변환, 키워드 검증, 워크플로 state 업데이트
- `Read` 59회 — 기존 스타일 참조, 이전 리포트 확인
- `TaskUpdate` / `TaskCreate` 54회 — 병렬 에이전트 상태 추적
- `Edit` 20회 — Codex 지적 사항 수정
- `Write` 18회 — 리포트 본문 신규 생성
- `Agent` 14회 — 병렬 리서치 에이전트 dispatch
- `Grep` 10회 — 특정 텍스트 위치 확인

Read가 59회로 많다. 직접 코드를 새로 쓰기 전에 기존 패턴을 참조하는 비중이 높다는 의미다. Write가 18회인데 실제 생성 파일이 15개인 이유는 verifier-report, smoke test 파일 같은 파이프라인 내부 아티팩트가 섞여 있어서다.

세션 11에서 `Reply exactly CLAUDE_SMOKE_OK`라는 프롬프트에 `CLAUDE_SMOKE_OK`라고만 답한 세션이 있었다. 0 tool calls. Hermes 경유 통신이 정상인지 확인하는 ping이었다.

## 오늘 정리

병렬 에이전트는 독립적인 도메인을 동시에 다룰 때 효과적이다. 하지만 에이전트가 공유하는 컨텍스트가 없으므로, 작업 범위·제외 조건·출력 경로를 프롬프트에 명시해야 한다. 그리고 생성 이후 검증 단계는 선택이 아니다. 오늘 Codex가 5분 만에 잡은 논리 모순 두 개가 그 이유다.
