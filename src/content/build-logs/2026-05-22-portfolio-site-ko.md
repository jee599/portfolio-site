---
title: "Claude Opus 4 하루 7세션 86 calls — 소켓 에러·Stop 훅 false positive·Complexity 재분류 실록"
project: "portfolio-site"
date: 2026-05-22
lang: ko
tags: [claude-code, automation, opus, orchestration, build-log]
description: "Claude Opus 4.7로 하루 7세션 86 tool calls, SpoonAI·치과광고·기술보고서 3개 도메인을 소화했다. API 소켓 에러, Stop 훅 false positive, complexity 재분류까지 — 자동화 파이프라인의 실제 삽질 기록."
---

하루에 API 소켓이 한 번 끊겼다. 세션 1이 14번의 tool call을 완료하기 직전, `The socket connection was closed unexpectedly`가 떴다. 결과물은 절반만 나왔다.

**TL;DR** 2026-05-22, Claude Opus 4.7로 7개 세션, 86 tool calls, 3개 도메인(SpoonAI·치과광고·기술보고서)을 소화했다. 소켓 에러, Stop 훅 false positive, complexity 재분류 — 자동화 파이프라인이 실제로 어떻게 흔들리고 복구되는지 기록한다.

## 하루에 3개 도메인, 7번 세션

5월 22일 세션은 총 7개였다. 프로젝트별로 분류하면:

- **SpoonAI**: 콘텐츠 인텔리전스 수집(세션 1-2), HTML 보고서 변환(세션 5), 마케팅 피드백(세션 6)
- **치과광고(dentalad)**: 의료 광고 최신전략 리서치(세션 3-4)
- **기술보고서**: 담배 재고 인식 앱 MVP 분석(세션 7)

도메인이 달라도 패턴은 같다. 원자료를 읽고, 정제하고, 구조화된 HTML/MD로 내보낸다. Opus 4.7이 이 파이프라인을 반복한다.

세션당 평균 12.3 tool calls, 평균 소요 약 4분. 세션 2(0분, 2 calls)처럼 검증만 한 짧은 세션을 제외하면 실질 작업 세션은 평균 20 calls였다.

## API 소켓이 끊겼다

세션 1은 SpoonAI raw crawl JSON을 읽어 일반용·전문가용 콘텐츠 후보를 정리하는 작업이었다. Bash 14번, Read 1번 — tool call이 거의 끝나가던 시점에 소켓이 닫혔다.

```
API Error: The socket connection was closed unexpectedly.
For more information, pass `verbose: true` in the second argument to fetch()
```

세션 2는 그 결과물을 이어받아 바로 검증만 했다. Read 2번으로 MD/JSON 파일을 읽고 스키마 준수 여부를 확인했다. 결과는 PASS. 소켓이 끊겼지만 파일은 이미 저장되어 있었고, 세션을 분리해 검증 전용으로 이어받는 패턴이 자연스럽게 생겼다.

세션 3-4도 동일하다. 세션 3에서 SERP 수집, KB 5개 파일 업데이트를 41 calls로 처리하다가 타임아웃 직전에 멈췄다. 세션 4는 HTML 보고서 생성만 이어받아 Bash 7회, Read 4회, Grep 3회, Write 1회로 마무리했다.

에러를 막을 수는 없다. 파일 기반으로 중간 상태를 저장하면 다음 세션에서 "무엇을 만들면 되는지"만 알면 된다. `current/state.json`을 두는 이유다.

## Stop 훅 false positive

세션 6은 코드를 한 줄도 쓰지 않았다. SpoonAI `/newsite`에 대한 마케팅·기획 피드백 자문이었다. 전략 분석 텍스트만 출력하면 끝나는 작업이었는데, 세션 종료 시점에 Stop 훅이 걸렸다.

```
Stop hook feedback:
Found 3 debug/TODO leftover(s) in working tree. Clean them up or confirm intentional before stopping.
```

훅이 잡은 것은 `scripts/*.ts`의 `console.log`와 `app/api/subscribe/route.ts`의 로그였다. 이번 세션에서 추가한 코드가 아니었다. `scripts/post-to-x.ts`, `scripts/send-email.ts` 같은 CLI 유틸리티의 `console.log`는 stdout 출력이 목적이라 제거하면 스크립트가 기능을 잃는다.

Grep으로 파일 분포를 확인하고 세션 내 작성 코드가 0줄임을 증명한 뒤 통과했다. 현재 훅 규칙은 "이번 세션에서 작성한 코드"와 "기존에 의도적으로 존재하던 로그"를 구분하지 못한다. 프로젝트별 훅 예외 경로를 설정하는 게 다음 개선 포인트다.

## Complexity 재분류: 선언하고 전환한다

세션 6과 7에서 각각 complexity 재분류가 발생했다.

세션 6은 파일 변경이 없는 전략 자문이라 `trivial` 범주였다. 세션 7은 단일 HTML 파일 생성이라 `simple`이었다. 오케스트레이션 훅이 `complexity=simple, stage=implementing`을 자동 주입했지만, 초기 판단이 `major`로 잡혔다.

세션 7에서 재분류 선언:

> "작업 분류가 잘못되었다. 단일 HTML 파일 생성(콘텐츠 작성)은 `simple` 범위다. 재분류 후 진행한다."

이 선언 이후 Bash 4번, Write 2번으로 끝냈다. plan-orchestrator, codex cross-verify 없이. `major` 파이프라인을 그대로 따랐다면 불필요한 계획 단계와 검증 루프가 붙었을 것이다. 재분류는 빠르게 선언하고 가벼운 경로로 전환하는 게 낫다.

## 86 calls의 도구 분포

전체 7세션, 86 tool calls의 분포:

- `Bash`: 47회 (54.7%) — 스크립트 실행, Python 크롤러 호출, 상태 업데이트
- `Read`: 23회 (26.7%) — raw JSON, KB 파일, 보고서 스타일 참조
- `Write`: 6회 (7.0%) — HTML 보고서, MD 파일 최종 출력
- `Edit`: 6회 (7.0%) — 기존 KB 파일 누적 업데이트
- `Grep`: 4회 (4.7%) — console.log 분포 확인, 마커 탐색

Bash가 절반을 넘는다. SERP 수집 스크립트 실행, 디렉토리 확인, `state.sh` 헬퍼 호출이 많아서다. Write는 6번뿐이지만 각각 20K 이상의 HTML이거나 수천 자의 MD였다. 가장 무거운 세션 3이 41 calls로 전체의 47.7%를 차지했다.

## 정리

소켓 에러는 파일 기반 상태로 세션을 분리해서 풀었다. Stop 훅 false positive는 Grep으로 증거를 모아 반박했다. complexity 재분류는 즉시 선언하고 가벼운 경로로 전환했다.

자동화 파이프라인이 매끄럽게 돌아가는 날은 드물다. 어딘가에서 끊기고, 훅이 걸리고, 분류가 틀린다. 기록을 남기는 이유는 다음번에 같은 지점에서 덜 삽질하기 위해서다.
