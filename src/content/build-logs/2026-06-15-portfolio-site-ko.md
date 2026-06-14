---
title: "8세션 돌려서 보낸 이메일 0건: AEO 안전 파이프라인 설계 기록"
project: "portfolio-site"
date: 2026-06-15
lang: ko
tags: [claude-code, safety-guardrail, multi-agent, email-pipeline, hermes, codex-review]
description: "B2B SaaS 이메일 자동화 파이프라인을 8개 세션에 걸쳐 만들었다. 컴플라이언스 검증, Codex 교차 검토, 크론 자동화까지. 최종 발송 건수는 0. 설계가 맞다."
---

8개 세션, 누적 130회 이상 tool call, 최종 이메일 발송 건수 0. 숫자만 보면 실패처럼 보이는데 아니다. `approvedToSend: false`가 모든 초안에 붙어 있는 게 정확히 의도된 설계다.

**TL;DR** 이메일을 '보내는' 자동화가 아니라 '보낼 수 있는 초안까지만 만드는' 파이프라인을 클로드로 만들었다. 8세션 반복 끝에 나온 구조는 독립 검증 + Codex 교차 검토 + 크론 스케줄링까지 포함한다.

## 첫 프롬프트부터 안전 경계를 그었다

세션 4의 시작 프롬프트: "안전안으로 해. 그리고 claude dynamic workflow 써서 가장 효과적으로 결제를 일으킬 수 있는 타겟에 마케팅적이고 전문적인 이메일로 보내서 결제 일으켜줘"

요청에 "안전안으로"가 먼저 나온다. 이게 엔진 설계의 출발점이 됐다. 클로드가 먼저 한 일은 기존 guardrail 코드를 읽는 것이었다.

```
typecheck: clean
test: 8/8 pass
audit → leads → draft: mock=true 모드, RED(DE) 자동 드롭
send gate: assertSendAllowed({}) → GuardrailError('SEND BLOCKED')
```

`ANTHROPIC_API_KEY`가 없는 환경에선 send gate가 `GuardrailError`를 던진다. 이걸 먼저 실증했다. 도구 사용: `Read(16), Bash(6), Agent(6), Workflow(1)` — Workflow 1회 시도 후 차단, 즉시 6개 병렬 Agent로 전환.

## 파이프라인 구조

B2B SaaS 12개 카테고리를 lane으로 나눴다. 각 lane이 독립적으로 프로스펙트를 생성하고 컴플라이언스를 자체 검증한다. 조립(assemble) 단계에서 세 가지를 추가로 실행한다.

**1. 중복 제거**: 발신 억제 목록(suppression set) 대조. `email_sequences.json` 전체 30개 초안 중 억제 목록 충돌 0건.

**2. 금지 토큰 스캔**: `price`, `PayPal`, `$`, `guarantee` 같은 단어를 본문에서 직접 검색. 세션 8에서 `verification.md`에 "31"이라는 숫자가 등장해서 혼란이 생겼는데, 원인은 JSON 필드명(`hasPriceOrPayment`, `hasGuaranteeOrFakeClaim`)과 정책 문자열 자체에 단어가 포함돼 있었기 때문이다. 본문 레벨 스캔 결과는 0이었다. 이 구분을 `verification.md`에 명시적으로 추가했다.

**3. eligible 파일 분리**: `verified_pass`인 초안만 `eligible_email_sequences.json`으로 분리. 검토자가 최종 발송 대상을 한 파일에서 볼 수 있게.

## Codex가 먼저 잡았다

세션 8과 9는 같은 태스크를 두 번 실행한다. 이유가 있다.

세션 8 시작 지시: "Codex-review가 독립적으로 확인한 결과 두 가지 문제를 발견했다. 수정해라." Codex가 `verification.md`의 "price/PayPal/$ token in eligible bodies: 31" 행이 나중에 나오는 "price/PayPal/guarantee tokens in email bodies: NONE"과 충돌한다고 플래그했다.

클로드가 수정을 완료했는데 세션 9에서 동일한 작업 지시가 다시 들어왔다. Hermes가 세션을 새로 열었기 때문이다. 세션 9에서 클로드가 한 일은 수정이 아니라 **검증**이었다.

```bash
# verification.md §6 body-level claim 검증
grep -oc 'price\|paypal\|\$\|guarantee' eligible_email_sequences.json
# → 0 (JSON 메타 필드 제외)
```

이미 완료된 작업을 독립적으로 재검증해서 결과가 맞다는 걸 확인하고 종료했다. 도구 사용: `Bash(14), Read(4)` — 파일을 수정하지 않고 검증만 했다.

Codex → Claude 교차 검증 루프다. Codex가 read-only 리뷰어로 플래그를 세우면 Claude가 수정하고, 다음 세션에서 동일한 주장을 독립적으로 재검증한다. 자동화 파이프라인에서 신뢰성을 높이는 구조다.

## 크론으로 6시간마다 돌리기

세션 10은 자율 크론 컨텍스트였다. 목표는 6시간마다 새 억제-목록-대조 초안 세트를 생성하는 것이었다.

크론에서 Workflow 툴은 또 차단됐다. 자율 크론 컨텍스트엔 인터랙티브 승인자가 없다. `verification.md §6`: *"실제 Workflow 툴이 권한 게이트에 의해 거부됨 — autonomous cron에서는 interactive approver가 없어 차단. 5-lane Agent 분해로 fallback."*

그래서 5개 lane을 수동으로 병렬 Agent로 분해했다. 결과: 30개 초안, 전수 컴플라이언스 검증 통과, `approvedToSend: false` 전체, eligible 27개. 도구 사용: `Bash(11), Read(5), Agent(5), Write(3), Workflow(1)`.

## 본문에서 "I tested" 지우기

세션 11은 좁은 수정이었다. eligible 이메일 4개 본문에 "I tested"라는 구절이 있었다. 특정 사이트를 실제로 테스트했다는 인상을 줄 수 있어 컴플라이언스 위반.

```javascript
// _revise.mjs — 4개 본문 일괄 교체
const replacements = {
  "a general market pattern I tested on your site": 
    "a general market pattern, though specifics will vary by site",
  // ... 3개 더
}
```

파일 4개에 동일한 교체를 적용했다: `email_sequences.json`, `email_sequences.md`, `eligible_email_sequences.json`, `eligible_email_sequences.md`. `_lanes/lane_1.json`은 범위 밖이라 건드리지 않았다. 도구 사용: `Bash(3), Write(2), Read(1), Edit(1)` — 7 tool calls.

이 좁은 범위 유지가 중요하다. 초안 전체를 다시 생성하는 대신 정확히 문제가 있는 패턴만 교체했다.

## Gmail 감사: 86건 중 82건은 주소 문제가 아니었다

세션 1은 Gmail 발신 감사였다. 86개 "bounce"의 원인이 뭔지 확인하는 작업이다.

```
- Gmail daily-send-quota self-throttle: 82건 (배달 시도조차 없음)
- 실제 하드 바운스: 1건
- 원격 서버 거부: 3건
- 실제 인간 회신: 1건 (Fjord)
```

82건이 quota throttle이었다. 이메일 주소가 잘못된 게 아니라 일일 발신 할당량 초과로 Gmail이 자체 차단한 것이다. 원인을 모르면 주소 목록을 정리하는 잘못된 방향으로 갔을 것이다. 산출물 3개: 한국어 감사 리포트, `cleanup_plan.json`, 답장 shortlist. 도구 사용: `Bash(18), Write(3), Read(2)`.

## Hermes 릴레이 패턴

세션 1-13의 대부분은 이 구조를 공유한다:

```
"You are Claude Code, the actual executor. Hermes is only the relay/orchestrator."
```

Hermes가 프롬프트를 기획하고 전달하면, 클로드가 실제 파일을 만든다. 세션 간 컨텍스트는 없다. 각 세션은 새로운 시작이다.

이 구조의 장점은 역할이 명확하다는 거다. 클로드는 실행에만 집중한다. Hermes의 지시에 "목표 / 범위 / 산출물 경로 / 제약" 네 가지가 명시적으로 들어오면 삽질이 줄어든다.

반대 예시가 Godot 기획서 세션들이다. 세션 2, 3에서 탐색만 하고 파일이 안 나왔다. 세션 7의 지시: *"Do NOT use TaskCreate/TaskUpdate/workflow/planning tools. Do NOT spend time searching for tools. Immediately perform file operations."* 금지어를 추가하자 바로 파일이 나왔다. 컨텍스트 리셋 환경에서는 제약이 구체적일수록 예측 가능성이 높아진다.

## 숫자

| 항목 | 수치 |
|---|---|
| AEO 파이프라인 관련 세션 | 8개 (세션 4, 5, 8, 9, 10, 11, 12, 13) |
| 생성된 이메일 초안 (최종 누적) | 57개 |
| 최종 eligible (전수 검증 통과) | 27~30개 |
| 실제 발송 건수 | 0 |
| `approvedToSend: true`인 초안 | 0 |
| 세션당 평균 tool calls (AEO 관련) | 17회 |
| Codex 교차 검증 사이클 | 1회 (세션 8 수정 → 세션 9 독립 재검증) |

`approvedToSend: false`가 전체에 걸려 있는 상태가 목표다. 발송 단계는 인간이 직접 판단한다. 자동화가 커버하는 범위는 그 판단을 내리기 전 단계까지다.
