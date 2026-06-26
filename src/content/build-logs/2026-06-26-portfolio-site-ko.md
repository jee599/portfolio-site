---
title: "Claude Code 10세션 846 tool call — live 발송 버그 잡고 Paddle 두 번 반려받기까지"
project: "portfolio-site"
date: 2026-06-26
lang: ko
tags: [claude-code, local-commerce, preterview, paddle, ultracode, workflow]
description: "10세션 846 tool call — local-commerce 이메일 아웃리치 live 발송 버그 발견·수정, Paddle 결제 도메인 반려 2회, preterview IR ultracode 멀티에이전트 고도화, jidonglab 홈페이지 개편까지 정리한다."
---

이메일 아웃리치 시스템이 `dry_run=false` 상태로 실제 사업체 17곳에 발송했다. 발각된 건 감사 세션 도중이었다.

**TL;DR** 10세션 846 tool call 동안 local-commerce-agent 보안 감사, preterview Paddle 결제 연동 두 번 반려, IR ultracode 리빌드, jidonglab 홈페이지 개편을 진행했다. 삽질이 많았다.

## 17건 live 발송 — 시스템이 스스로 뻥 뚫렸다

`local-commerce-agent`는 현지 소상공인 이메일 아웃리치 시스템이다. 문서상 이 레포는 "fail-closed / no-send / no-cron" — 실제 발송은 하지 않도록 설계돼 있었다.

세션 1(79 tool calls, 20분)에서 감사 목적으로 최근 실행 로그를 열었더니 `classification=live_send`, `sent_count=17`, `dry_run=false`가 찍혀 있었다. 발송 주소는 `jd@jidonglab.com` — 1차 메일박스, 실제 업무 계정이었다.

원인은 `jdlab_tryjdlab_live_send_launch.sh`였다. 이 론처 스크립트가 모든 게이트를 강제로 열어놓고 있었다.

```bash
JDLAB_DRY_RUN=0
JDLAB_DRAFT_CREATE_OK=approved
JDLAB_LIVE_SEND_OK=approved
```

금지 발신자 체크는 `--expect-profile` 문자열(`jd@tryjdlab.com`)만 보고 있어서, 실제 인증된 발신자(`jd@jidonglab.com`)는 통과시켜버렸다. 체크 대상이 잘못된 필드였다.

세션 2(89 tool calls, 31분)에서 후속 hardening을 진행했다. never-send 패턴에 `webmaster`, `mailer_daemon`(언더스코어 변형) 추가, placeholder/typo 이메일 감지 로직 삽입, 외부 상태를 오해하게 만드는 `done→external_status` 매핑 수정. 두 세션 합산 Edit 32번. 신규 테스트 파일 2개(`jdlab_send_identity_guard.test.js`, `jdlab_goal_mode_hardening.test.js`) 생성.

## preterview Paddle — 두 번 반려

세션 8(211 tool calls)이 가장 많은 tool call을 소모했다. Paddle 결제 연동 작업이었는데, 삽질이 많았다.

첫 번째 문제: 기존 Paddle 계정이 예전 `fortunelab` 시절에 신청했다가 KYC가 만료된 상태였다. Verification status가 "Action required — verification process has expired"였고, 계정을 살리는 게 어려웠다.

두 번째 문제: 새 계정으로 `preterview.com` 도메인을 신청했더니 승인이 거절됐다.

> "We identified the following product categories: Other/Resume/CV Builders, Human Services/Consulting"

AI 면접관이 음성으로 모의면접을 돌리고 실행 피드백 리포트를 자동 생성하는 SaaS인데, Paddle이 "Resume Builder"로 분류했다. Acceptable Use Policy 범위 밖이라는 이유였다. 설명 자료를 다시 제출하는 중이다.

코드 자체는 이미 머지됐다. `feat/paddle-checkout` 브랜치(23커밋, 47개 파일, +4,960 lines)가 main에 들어갔다. `app/api/pay/paddle/`, `components/pricing/PaddleBuy.tsx`, `lib/payments/paddle.ts`가 신규 추가됐다. 한국 결제는 payapp에서 크레딧 형 상품을 지원하지 않아 대안을 찾는 중이다.

## IR ultracode 멀티에이전트 리빌드

세션 4는 preterview 투자자 IR 고도화였다. `ultracode` 모드로 Workflow 도구를 써서 4개 렌즈(VC·포지셔닝·내러티브·디자인) 병렬 검증을 돌렸다. Bash 35회, Read 29회, Edit 24회, 92 tool calls, 46분.

발견한 주요 불일치: IR에 "역량 3축"이라고 적혀 있었는데, 실제 제품 리포트 화면에서는 5축(경험구체성·직무전문성·문제해결력·커뮤니케이션·엔진기본기)이 나왔다. IR 작성 이후 제품이 바뀐 것이다. 워크플로 에이전트들이 코드베이스를 직접 검증해서 잡아냈다.

세션 6에서는 실제 투자자 피드백 PDF(`preterview_feedbacks_260626.pdf`)를 기반으로 2차 리빌드 방향을 수립했다.

## jidonglab 로고 + 홈페이지 개편

세션 5(143 tool calls, 1시간 5분)에서 GPT Image(`gpt-image-2`)로 JL 로고 6가지 방향을 생성했다. 인디고 JL 모노그램 방향을 선정하고 사이트 로고로 교체했다.

동시에 `jidonglab.com` 홈페이지 전체 개편을 진행했다. preterview를 상단에 강조, 치과 광고대행 대시보드 느낌과 실제 보고서 화면(수치·이름 제거)을 섹션으로 구성했다. 변경된 파일만 21개. `BrandMark.tsx`, `DentalShowcase.tsx`, `Flagship.tsx`가 신규 생성됐다.

## 기타

세션 3에서 동백유디치과 정기 측정을 `dental-clinic` 서브에이전트에 위임했다. 소아치과 2편이 발행 하루 만에 '동백 소아치과' 블로그탭 1위, '용인 소아치과' 4위 첫 진입(logNo 224326926066 교차확인).

세션 7에서 판교밸류업 지원 후속 작업과 신규 지원사업 서칭 — 8개 각도 병렬 워크플로로 36개 검증, 23개 추천 후보 도출. `MORE-2026-06-25.md`, `SEOUL-STARTUP-HUB-2026-06-25.md` 생성.

세션 9는 머니투데이 "굿컴퍼니대상" 이메일이 유료 수상 권유인지 확인 작업이었다. WebSearch 4회로 결론냈다 — "취재 지원(멤버십 자격)" 항목이 실제 청구 대상인 광고 영업 패턴이었다.

세션 10은 preterview 광고 전략 수립(162 tool calls). 네이버 파워링크 키워드 선정, GA4 픽셀(`G-ES6SENFGM2`) 코드 삽입, Google RSA 카피 작성. "면접 말버릇", "면접 습관교정" 계열 키워드가 가성비가 좋은 것으로 나왔다.

---

10세션, 846 tool calls. 도구 사용 분포: Bash 268회, Read 151회, Edit 103회, Write 21회, 나머지 기타.
