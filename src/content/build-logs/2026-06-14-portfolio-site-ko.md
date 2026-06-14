---
title: "Claude Code 18세션 707 tool calls: Gmail 감사부터 두 사이트 리디자인까지 하루치 로그"
project: "portfolio-site"
date: 2026-06-14
lang: ko
tags: [claude-code, workflow, automation, email, design, hermes]
description: "하루 동안 Claude Code 18세션 707 tool calls로 Gmail 바운스 감사, B2B 이메일 아웃리치 자동화, 사주·커피챗 사이트 리디자인까지 처리한 패턴을 분석한다."
---

707번의 도구 호출, 18개 세션, 51개 파일 — 2026-06-14 하루치 Claude Code 로그다.

**TL;DR** Hermes 릴레이 패턴으로 Gmail 감사, B2B SaaS 이메일 아웃리치, 무협 Godot 게임 기획, 사주·커피챗 사이트 리디자인을 처리했다. Dynamic Workflow는 자율 cron과 인터랙티브 세션 두 컨텍스트 모두에서 권한 게이트에 막혔다.

## Gmail 바운스 82개, 실제론 0개였다

오늘 가장 명쾌한 발견이 여기서 나왔다. JDLab 아웃리치 Gmail 감사 세션에서 로그상 86건의 바운스를 분석했는데, 82건이 수신 거부가 아니라 Gmail 일일 전송 할당량 자가 스로틀이었다. 이메일이 발송 큐 안에서 죽은 것이고, 수신자에겐 도달조차 못 했다.

실제 문제는 딱 3건. 하드 바운스 1건, 리모트 거부 2건. 진짜 사람 답장은 Fjord 1건이었다. Claude Code가 `gmail_audit_full.json` 하나를 받아 `claude_audit_report.md`, `claude_cleanup_plan.json`, `claude_reply_shortlist.md` 세 산출물을 23 tool calls, 5분 만에 뽑았다.

운영자가 "바운스 82건"이라는 숫자를 보면 보통 주소 품질이나 도메인 평판부터 의심한다. 하지만 원인은 전혀 달랐다. JSON 파싱과 패턴 분류를 Claude Code에게 넘기니 본질 원인을 바로 짚어냈다.

## 안전 가드레일의 설계

B2B SaaS 아웃리치 자동화 세션에서 핵심 패턴이 드러났다. 엔진은 `assertSendAllowed({})` 함수를 가지고 있고, 호출하면 `GuardrailError: SEND BLOCKED`를 던진다. 모든 드래프트엔 `approvedToSend: false`가 박혀 있다. 이 가드레일은 단위 테스트(8/8 pass), 엔진 CLI mock 실행, 실제 cron 어느 경로에서도 뚫리지 않았다.

검증은 독립적으로 두 번 돈다. Claude Code가 in-memory로 컴플라이언스 스캔을 돌리고, 그 다음 bash grep으로 파일에 대해 다시 검증한다. `price`, `PayPal`, `$`, `guarantee` 토큰이 실제 email body에서 0건인지 두 번 확인하고 `verification.md`에 기록한다.

Codex 리뷰에서 "31건 매치"라는 숫자에 의문이 제기됐다. 파보니 JSON field name(`hasPriceOrPayment`)이 30개 + 정책 문자열 1개가 합산된 숫자였다. body-level 실제 매치는 0건. 이런 거짓 양성을 잡으려면 naive `grep` 한 번이 아니라 JSON 구조를 이해하는 검증이 필요하다.

설계의 핵심은 **생성과 승인의 완전한 분리**다. 파이프라인이 아무리 돌아가도 사람이 `approvedToSend: true`를 직접 바꾸기 전엔 아무것도 안 나간다.

## Dynamic Workflow가 두 번 차단됐다

오늘 반복된 흥미로운 실패 패턴이다. Dynamic Workflow 툴을 총 9번 시도했는데, 실제로 실행된 건 없다. 자율 cron 컨텍스트에서 차단됐고, 인터랙티브 세션에서도 `"Review dynamic workflow before running"` 게이트가 떴다.

폴백 전략은 매번 동일했다. Agent 서브에이전트를 레인별로 수동 분기해서 순차 실행. 세션 5에서는 12개 B2B-SaaS 니치를 5개 레인으로 나눠 Agent 5개를 순차로 호출했고, 30개 프로스펙트를 생성했다. Workflow가 없어도 동일한 결과가 나온다 — 다만 병렬 속도를 못 쓴다.

권한 게이트가 존재하는 이유는 명확하다. Workflow 툴은 수십 개 에이전트를 병렬로 띄울 수 있기 때문에, 인터랙티브 승인 없이 자율 실행되면 예상 외의 비용이 발생한다. 자율 cron엔 그 승인자가 없다.

## 하루에 두 사이트를 리디자인했다

가장 무거운 세션 두 개는 사이트 리디자인이었다.

사주 사이트(`fortunelab`)는 169 tool calls였다. 문제는 이미지 4장이 서로 다른 시각 언어로 충돌하고 있었다는 것이다. `hero-sky`는 리얼 야경 사진, `ink-cranes`는 밝은 배경의 수묵화, `ink-night`는 어두운 수묵화 — 같은 페이지 안에서 세 방향이 전혀 다른 분위기를 냈다. 방향을 **dark cosmic navy + gold celestial line-work**로 단일화하고, `page.tsx:509-542`에서 리뉴얼 이후에도 살아남은 `$4.99` 구가격 섹션을 같이 제거했다.

커피챗 사이트는 302 tool calls로 하루 최다였다. `git log`를 보니 직전 커밋(`0e578da`)이 히어로의 `InterviewDemo` 애니메이션 컴포넌트를 정적 리포트 쇼케이스로 교체해버렸다. 이번 세션에서 애니메이션 면접 데모를 복구하고, 오른쪽에 리포트 3장 생성 애니메이션을 추가해 2단 레이아웃으로 재구성했다. Edit 119회, Bash 98회, Read 75회 — 반나절이 넘는 작업이었다.

## Hermes 릴레이 패턴

오늘 세션들에서 반복된 구조가 있다. 대부분의 작업이 `"You are Claude Code, the actual executor. Hermes is only the relay/orchestrator."` 형태로 들어왔다. Hermes가 PM/오케스트레이터 역할을 하고, Claude Code CLI가 실제 실행자로 분리된 설계다.

이 패턴의 이점은 명확한 책임 경계다. Hermes가 scope gate와 intake를 처리하고, Claude Code는 주어진 scope 안에서만 실행한다. `"STRICT MODE: READ/WRITE ONLY. Do not use Bash/shell/terminal at all."` 같은 제약도 Hermes 레벨에서 명시적으로 내려온다.

세션 14에서는 이 패턴이 극단적으로 적용됐다. Bash 없이 Read 13회 + Write 1회만으로 cron 로직 전체를 검증하고 리뷰 리포트를 작성했다. 필요한 증거가 모두 파일로 존재한다면 shell 없이도 검증이 가능하다.

## 오늘의 도구 사용 패턴

| 도구 | 횟수 |
|---|---|
| Bash | 292 |
| Read | 180 |
| Edit | 151 |
| Write | 28 |
| Agent | 22 |
| Workflow (시도만, 실행 0) | 9 |

Bash가 292회로 압도적이다. 검증 grep, node 스크립트 실행, Chrome headless PDF 생성, typecheck, 테스트 실행이 대부분이다. Read 180회는 맥락 파악 비용이다 — 세션 초반에 수십 개 파일을 읽고 전체 그림을 잡은 뒤 편집에 들어간다.

Workflow 9회 시도에 실행 0회라는 숫자가 오늘의 특징이다. Agent 폴백이 대신했고, 결과는 나왔다. 다만 병렬 속도를 못 쓴 만큼 순차 실행보다 느렸다. 자율 모드에서 Workflow를 쓰려면 사전 권한 설정이 필요하다는 것도 오늘 배웠다.
