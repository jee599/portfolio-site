---
title: "Claude Code 10개 세션 740+ 도구 호출 — 5개 프로젝트 동시 진행 후기"
project: "portfolio-site"
date: 2026-06-26
lang: ko
tags: [claude-code, multi-agent, dental-marketing, preterview, jdlab, workflow]
description: "3일간 10개 세션, 740+ tool calls, 5개 프로젝트를 병렬로 처리했다. 버그 발굴부터 IR 고도화, 치과 마케팅, 결제 시스템 연동까지 — Claude Code 에이전트 위임 패턴의 실전 기록."
---

3일 동안 Claude Code 세션을 10개 돌렸다. Bash 200+, Edit 80+, Read 95+, Workflow 2회. 프로젝트는 다섯 개가 동시에 굴러갔다 — JDLab 아웃리치 시스템, 동백유디치과, Preterview, 지원사업 발굴, 머니투데이 수상 검증.

**TL;DR** 에이전트 위임 패턴이 실제로 효과가 있다. dental-clinic 서브에이전트 하나가 치과 프로젝트 전체를 자율 처리했고, ultracode 모드 Workflow가 3일치 조사를 2시간 안에 끝냈다.

## 17통의 이메일이 잘못 발송됐다

JDLab 세션(세션 1-2)의 시작은 평범한 "전체 시스템 감사"였다. 그런데 로그를 읽으면서 즉시 이상한 걸 발견했다.

전략 문서에는 "fail-closed / no-send / no-cron"이라 적혀 있었다. 근데 최근 실행 로그에는 `classification=live_send`, `sent_count=17`, `dry_run=false`가 찍혀 있었다. 79번의 도구 호출 끝에 근본 원인이 나왔다.

`jdlab_tryjdlab_live_send_launch.sh`가 모든 게이트를 하드코딩으로 열어놓고 있었다 — `JDLAB_DRY_RUN=0`, `DRAFT_CREATE_OK=approved`, `LIVE_SEND_OK=approved`. 더 심각한 건 발신자가 `jd@tryjdlab.com` 별칭이지만 실제 인증 계정은 `jd@jidonglab.com`(1차 주소)이었다. forbidden-sender 게이트는 별칭 문자열만 보고 통과시켰다.

수정은 세 방향으로 갔다. 첫째, 라이브 런처를 비활성화. 둘째, 발신자 검증 로직을 `profile_email` 기준으로 변경. 셋째, never-send 정규식에 웹마스터·역할 이메일 패턴 추가. 세션 2에서 후속 강화까지 합쳐 89 tool calls를 썼다.

```bash
# before: 별칭만 확인
if [[ "$EXPECT_PROFILE" == *"tryjdlab.com"* ]]; then

# after: 실제 인증 계정 확인
if [[ "$AUTHENTICATED_EMAIL" == *"jidonglab.com"* ]]; then
```

이런 버그는 코드 리뷰로 잡기 어렵다. 환경 변수가 런처 스크립트에서 오버라이드되는데, 테스트는 코드 경로를 직접 실행하기 때문이다. 실제 로그 파일을 읽어야 보인다.

## 치과 마케팅은 서브에이전트에게

동백유디치과 작업(세션 3-4)은 dental-clinic 서브에이전트에 완전 위임했다. 메인 세션이 직접 작업하면 치과 컨텍스트(clinic.json·캐시·히스토리)가 다른 프로젝트와 섞인다.

세션 3은 tool call이 단 1개다 — `Agent(dental-clinic)` 한 번. 에이전트가 `~/dental-promo/dongbaek-uddental/`를 읽어 컨텍스트를 복원하고, 키워드 순위 측정→기록→다이제스트→sync까지 끝냈다.

세션 4에서 실제 임팩트가 나왔다. 2편(소아 치과 글)을 발행한 다음 날, '동백 소아치과' 블로그탭 1위, '용인 소아치과' 4위 첫 진입을 기록했다. 플레이스 유입 데이터에서는 시술 키워드 유입이 0%라는 것도 확인했다 — 신환이 브랜드 검색으로만 들어오고 있었다. 이게 블로그 볼륨 확대의 근거가 됐다.

`SendMessage`로 같은 에이전트 인스턴스를 이어서 호출하는 방식이 핵심이다. 새 에이전트를 띄우면 컨텍스트 복원 비용이 든다. 같은 세션에서 이어받으면 에이전트가 직전 상태를 그대로 갖고 있다.

## ultracode Workflow가 어디까지 되나

Preterview IR 고도화(세션 5)와 지원사업 발굴(세션 6)에서 ultracode 모드 Workflow를 두 번 돌렸다.

IR 작업은 이렇게 흘렀다. 기존 12슬라이드 HTML IR이 있었다. 근데 "역량 3축"이라 적혀 있는데 실제 제품 리포트 화면은 "역량 5축"이었다. Workflow가 코드베이스 검증 → 마케팅/VC/포지셔닝/디자인 4개 렌즈 비평 → 슬라이드별 리빌드 스펙 합성을 병렬로 돌렸다. Read 29번, Bash 35번, Edit 24번이 나왔다.

지원사업 발굴에서는 기존 42개 배치에 없는 새 프로그램을 8각도 병렬 서칭했다 — 중앙부처·NIPA/AI·경기/판교·콘텐츠/에듀테크·액셀러레이터·공모전·헬스케어·글로벌. 웹 실검증까지 포함해 검증된 추천 프로그램 23개가 나왔다.

## 결제 연동은 생각보다 험하다

Preterview 결제(세션 7)는 이번 세션에서 가장 긴 작업이었다. 26시간 세션, 211 tool calls.

Paddle 계정 문제가 연달아 터졌다. 구 계정은 KYC 만료, 신규 계정은 도메인 심사 반려("HR Service" 카테고리 해당), 크레딧 결제 모델이 Paddle 정책과 충돌. `feat/paddle-checkout` 브랜치 23커밋이 main에 머지되지 않은 채 남아있었다.

Bash 104번 + mcp__claude-in-chrome 27번이 보여주듯, 브라우저 자동화가 절반을 차지했다. 코드 수정보다 외부 서비스 연동의 사람 손 작업 부분이 병목이었다. 결제 시스템은 "코드는 다 됐는데 플랫폼 심사가 문제"인 상황이 제일 어렵다.

## 숫자로 보면

| 항목 | 수치 |
|---|---|
| 전체 세션 | 10개 |
| 총 tool calls | 740+ |
| 최대 세션 | 211 calls (26시간, Preterview 결제) |
| 최소 세션 | 1 call (치과 측정 위임) |
| 변경된 파일 | 30+ |

가장 효율적인 세션은 dental-clinic 위임 1-call 세션이다. 가장 긴 세션은 외부 서비스(Paddle)가 낀 결제 연동이었다. 에이전트가 처리할 수 있는 건 위임하고, 외부 서비스 심사처럼 사람이 개입해야 하는 단계는 병목이 남는다.

에이전트 위임 패턴은 세션 컨텍스트를 깨끗하게 유지해준다. 치과, 아웃리치, IR, 결제가 섞이면 모든 컨텍스트를 메인 세션이 들고 있어야 한다. 도메인별로 에이전트를 나누면 각각의 히스토리와 상태가 분리된다.
