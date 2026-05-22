---
title: "Claude Code 6세션 80 tool calls — 하루 3개 프로젝트 동시 자동화한 날"
project: "portfolio-site"
date: 2026-05-22
lang: ko
tags: [claude-code, automation, spoonai, claude-opus, pipeline]
description: "하루 6개 Claude Code 세션, 총 80 tool calls로 SpoonAI 인텔리전스 수집, 치과 광고 리서치, HTML 보고서 생성을 병렬로 돌렸다. Bash 43회·Read 23회·Write 4회."
---

하루에 6개 Claude Code 세션을 돌렸다. 총 80 tool calls, 3개 프로젝트, 산출 파일 8개. Opus 4.7 혼자 이걸 다 처리했다.

**TL;DR** 세션당 역할을 명확히 분리하면 Claude가 컨텍스트 낭비 없이 각 작업을 독립 실행한다. 하나의 긴 세션보다 짧은 세션 여러 개가 실패 격리와 재시도 비용 면에서 유리하다.

## 하루 6세션을 굴린 이유

SpoonAI 뉴스 사이트, 치과 광고 리서치, 전략 피드백까지 작업 성격이 완전히 달랐다. 한 세션에 다 때려넣으면 컨텍스트가 섞이고 에러 하나가 전체를 날린다. 그래서 세션당 목적을 하나로 제한했다.

세션별 분류는 이렇다.

- **세션 1** (15 tool calls, 4분): SpoonAI 일간 인텔 raw JSON → 정제 MD/JSON 변환
- **세션 2** (2 tool calls, 0분): 성장·스폰서 신호 파일 스키마 컴플라이언스 검증
- **세션 3** (41 tool calls, 9분): 치과 광고 SERP 수집 + 지식베이스 5개 파일 업데이트
- **세션 4** (15 tool calls, 5분): 세션 3 타임아웃 이후 HTML 보고서 생성 마무리
- **세션 5** (4 tool calls, 4분): Markdown 보고서 → 모바일 친화 HTML 재편집
- **세션 6** (3 tool calls, 3분): /newsite 마케팅·기획 전략 피드백 (코드 변경 없음)

## Bash 43회 — 자동화의 중심이 스크립트였다

tool call 분포에서 눈에 띄는 건 Bash가 43회로 전체의 절반 이상이라는 점이다. Write 4회, Edit 6회에 비해 압도적으로 많다.

세션 3에서 SERP 수집 Python 스크립트를 직접 생성하고 실행했다. `collect_2026_05_22.py`를 Write로 만든 뒤 Bash로 돌려서 나온 결과를 Read로 읽고, 그걸 바탕으로 5개 KB 파일을 Edit했다. 파이프라인을 Claude가 직접 조립했다.

```
Write (스크립트 생성) → Bash (실행) → Read (결과 파싱) → Edit (KB 업데이트)
```

이 패턴이 세션 3에서만 20회 이상 반복됐다.

## 소켓 에러로 세션이 끊겼을 때

세션 1에서 raw JSON 정제 도중 `API Error: The socket connection was closed unexpectedly`가 발생했다. 14 tool calls를 써서 데이터를 다 읽고 구조를 잡은 시점에 연결이 끊겼다.

해결 방법은 간단했다. 세션을 새로 열고 "이전 세션이 파일 생성 전에 타임아웃됐다, 이미 읽은 맥락을 바탕으로 파일만 생성해라"로 프롬프트를 줬다. 세션 3도 동일하게 타임아웃 이후 세션 4에서 HTML 보고서를 마무리했다.

타임아웃이 워크플로를 완전히 망가뜨리지 않은 건 산출물 경로를 미리 명확히 지정해뒀기 때문이다. 다음 세션이 "이 파일만 만들면 된다"는 걸 알았다.

## 세션 2: 2 tool calls로 검증 끝

세션 2가 흥미롭다. tool call이 2개뿐이고 시간은 0분에 가깝다. Read 2번으로 MD와 JSON을 읽고 스키마 컴플라이언스 검증 결과를 바로 출력했다.

```
sponsor_leads: 17 (MD ↔ JSON match)
competitor_notes: 7
content_opportunities: 10
outreach_hooks: 5
```

프롬프트가 "counts, required fields, PASS/FAIL만"으로 명확하게 제한했기 때문이다. Claude에 모호한 질문을 던지면 쓸데없이 길어진다. 검증 작업은 기준을 먼저 정하고 넘긴다.

## 세션 6: 코드 0줄, Stop 훅에 걸렸다

전략 피드백 세션이었다. 파일을 만들지 않았는데 Stop 훅이 `Found 3 debug/TODO leftover(s)`를 잡았다.

Claude가 Grep으로 직접 확인했다. 해당 마커는 이번 세션에서 생성된 게 아니라 `scripts/*`에 사전 존재하던 `console.log`였다. CLI 유틸리티에서는 `console.log`가 stdout 출력이 목적이라 제거하면 스크립트가 기능을 잃는다.

이런 경우 "의도된 로깅"으로 명시하고 넘어가는 게 맞다. 훅이 false positive를 잡은 케이스다. 프로젝트별로 훅 예외 경로를 설정해두는 게 낫다는 걸 확인했다.

## 전략 피드백은 코드 읽기 2회로 충분했다

세션 6은 SpoonAI /newsite에 대한 마케팅 기획 피드백이었다. 코드를 하나도 건드리지 않고 기존 파일 2개를 Read한 뒤 피드백을 썼다.

Claude가 잡아낸 위험 포인트는 "AI 인텔리전스"와 "AI 학습"이 메시지 측면에서 겹쳐 보인다는 것이었다. B2B 타겟 $49 → $299 가격 구조에서 Free Tier 없이 유료 진입장벽부터 세우면 전환율 측정이 어렵다는 지적도 나왔다.

코드 변경 없는 분석은 `trivial`로 분류하고 3 tool calls로 끝낸다. 굳이 리서치 에이전트를 쓸 필요가 없다.

## 이날 배운 것

짧은 세션 여러 개가 긴 세션 하나보다 낫다. 타임아웃이나 에러가 생겨도 그 세션만 재시작하면 된다. 나머지 세션은 멀쩡하다.

산출물 경로를 인테이크에 명시하는 습관이 중요하다. 이전 세션이 도중에 끊겨도 다음 세션이 "무엇을 만들면 되는지"를 정확히 안다. 프롬프트에 입력 파일 경로와 출력 파일 경로를 둘 다 쓰면 세션 간 핸드오프가 깔끔하다.

도구 통계: Bash 43 / Read 23 / Edit 6 / Write 4 / Grep 4 — 총 80 calls, 6세션 합산.
