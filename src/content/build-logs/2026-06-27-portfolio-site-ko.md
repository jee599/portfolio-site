---
title: "이메일 17통이 실수로 나갔다 — Claude Code로 6개 프로젝트 하드닝한 3일"
project: "portfolio-site"
date: 2026-06-27
lang: ko
tags: [claude-code, automation, security, paddle, preterview, multi-agent]
description: "JDLab 이메일 파이프라인에서 17통이 실수로 live 발송됐다. 보안 감사·하드닝부터 Preterview IR 고도화, Paddle 결제 연동 두 번 반려, 치과 마케팅 자동화까지 — 3일 15세션 830+ tool calls 기록"
---

6월 25일 아침, JDLab 이메일 파이프라인 로그를 열었더니 `classification=live_send`, `sent_count=17`, `dry_run=false`가 찍혀 있었다. 실수로 이메일 17통이 실제 발신됐다. 발신자는 `jd@jidonglab.com` — 코드에서 명시적으로 금지한 primary mailbox였다.

**TL;DR** 이메일 보안 감사 2세션 + 하드닝, Preterview IR 고도화(멀티에이전트 워크플로), Paddle 결제 연동 두 번 막힘, 치과 마케팅 위임 자동화, jidonglab.com 홈페이지 개편까지. 3일, 15세션, 830+ tool calls.

## 이메일 17통이 어떻게 실수로 나갔나

문제는 `~/.hermes/scripts/jdlab_tryjdlab_live_send_launch.sh`에 있었다. 이 cron 엔트리포인트가 모든 게이트를 하드코딩으로 열고 있었다:

```bash
JDLAB_DRY_RUN=0
JDLAB_DRAFT_CREATE_OK=approved
JDLAB_LIVE_SEND_OK=approved
SEND_WINDOW=9999
```

전략 문서는 "fail-closed / no-send / no-cron"이라고 명시했는데, 실제 실행 스크립트는 정반대였다. 추가로 금지 발신자 검사 로직이 `--expect-profile` 문자열만 보고 있어서, 실제 인증된 mailbox(`jd@jidonglab.com`)를 From alias `jd@tryjdlab.com`으로 감추면 통과됐다. 즉 게이트가 잘못된 필드를 검사하고 있었다.

Claude에게 "JDLab 워크플로우 end-to-end 감사, 실제 로그·상태파일·Hermes 스크립트까지 전수 확인"을 시켰다. 세션 1에서 Bash 21번, Read 22번, Edit 14번 — 총 79 tool calls로 root cause 3개를 찾고 픽스를 냈다.

픽스 핵심:
- live launcher 완전 비활성화 (crontab/launchd에서 제거 확인)
- 금지 발신자 identity guard를 From alias가 아닌 **authenticated mailbox**로 검사하도록 수정
- `never-send` 패턴 확장 — `webmaster`, `mailer_daemon`(underscore 변형), role variants(`contacto`, `contato`, `press`, `partnerships` 등) 추가

세션 2는 세션 1 픽스를 독립 검증하고 방어 심도 갭을 추가 하드닝하는 follow-up이었다. 4개 독립 감사(bounce/reply 피드백 루프, yield collapse, never-send 패턴, preflight 억제 분류기)를 병렬로 돌렸다. 89 tool calls.

시스템은 세션 2 이후 완전히 fail-closed 상태다. live launcher 비활성화, draft gate 기본 차단, send/draft cron 전부 pause.

## 서브에이전트 위임: 치과 마케팅 자동화

이번 주에 가장 효율적이었던 패턴은 `dental-clinic` 서브에이전트 위임이다. 동백유디치과 정기 측정을 이렇게 요청했다:

```
동백유디치과 정기 측정이다. dental-clinic 서브에이전트에 위임해 수행하라.
공개 데이터 자동 측정: 모니터링 키워드 블로그탭/통검 노출순위 실측.
★발행글 2편(소아) 추적: logNo 224326926066이 소아축 키워드에 진입했는지...
```

메인 세션은 이 프롬프트 하나가 전부다. 에이전트가 `~/dental-promo/dongbaek-uddental/` 아래 `clinic.json`, `cache`, `history.json`을 읽어 컨텍스트를 복원하고, 측정 → 기록 → 다이제스트 생성 → sync까지 도맡는다. 메인 세션 tool call은 `Agent(1)`.

당일 결과: '동백 소아치과' 블로그탭 **1위**, '용인 소아치과' **4위 첫 진입** — 발행 하루 만에 효과가 발현됐다.

유디치과 블로그 발행 세션(세션 6, 53 tool calls)에선 `SendMessage`로 같은 dental-clinic 에이전트 인스턴스를 이어서 호출해 컨텍스트를 유지했다. 새 인스턴스를 띄우면 `clinic.json` 복원 비용이 다시 발생하기 때문이다. 이 세션에서 2편(소아치과) 초안을 최종 패키지로 준비하고 사장님이 직접 네이버 블로그에 붙여넣기로 발행했다.

## IR 고도화: 다차원 검증 워크플로

세션 4에서 preterview IR 문서 고도화 작업을 ultracode 모드로 돌렸다. 먼저 기존 IR에서 검증이 필요한 주장을 목록화했다.

주요 불일치 발견:
- README 가입보너스 300cr vs IR 200cr
- IR "역량 3축" vs **실제 제품 역량 5축** (리포트 스크린샷에서 직접 확인)
- "결제 5종" 주장 → 코드베이스 직접 grep으로 교차 확인

Workflow tool로 4개 에이전트를 병렬 실행했다: VC 렌즈, 포지셔닝 렌즈, 내러티브 렌즈, 디자인 렌즈. 각각 독립적으로 주장을 검증하고 비판했다. 결론은 IR이 README보다 오히려 더 정확했다. "역량 3축 → 5축" 불일치만 수정하고, 실제 면접·리포트 스크린샷(3인 패널·음성 답변·꼬리질문·실시간 음성인식·역량 5축 점수판)을 슬라이드에 직접 임베드했다.

세션 4 도구 사용: Bash 35번, Read 29번, Edit 24번, Workflow 1번. 총 92 tool calls.

## Paddle 결제 연동: 두 번 막힌 이야기

세션 7이 이번 주 제일 길었다. 26시간 52분짜리 세션 (대부분 Paddle 대기 시간 포함), 211 tool calls.

`feat/paddle-checkout` 브랜치(23커밋, 47개 파일, +4,960줄)를 main에 머지하는 것부터 시작했다. 결제 코드 4커밋이 면접·아바타 파일과 안 겹치는 것을 확인하고 클린하게 머지했다.

**첫 번째 막힘**: 기존 Paddle 계정 KYC 인증 만료.
```
Verification status: Action required
We're unable to verify your identity as the verification process has expired.
```
새 계정을 만들어서 sandbox 환경부터 다시 세팅했다. 제품 3개(Starter 800cr/$7.99, Standard 5,000cr/$39, Pro 12,000cr/$79), client-side token, webhook까지 설정 완료.

**두 번째 막힘**: 새 계정으로 도메인 심사 신청했더니 반려.
```
We identified the following product categories on this domain:
Other/Resume/CV Builders
Human Services/Consulting or Advisory Services
These categories fall outside what Paddle can support under our Acceptable Use Policy.
```

AI가 사람을 흉내 내는 인터뷰 코치라서 "Human Services"로 분류됐다. 재심사 신청 시 명확하게 명시했다: "AI 자동 생성, 사람 인터뷰어·코치·컨설턴트 0, 완전히 소프트웨어 제품." 현재 결과 대기 중.

코드 작업으로는 법적 페이지 3개(terms, privacy, refund) 신규 생성, dead payment code 제거, live 환경 env 정리를 함께 처리했다.

## 광고 세팅: 네이버 파워링크 + GA4 픽셀

세션 8(162 tool calls)에서 50만원 예산으로 광고 채널을 결정했다.

워크플로로 국내·글로벌 두 채널을 병렬 조사했다. 국내는 네이버 파워링크로 집중하기로 결론냈다. 가성비 상위 키워드는 "면접 말버릇 교정", "면접 습관 교정" — 검색량 중간, CPC 낮음, 전환 의도 높음. 게임 업계 키워드("게임회사 면접")는 검색량이 너무 작아서 우선순위 후순위.

GA4(`G-ES6SENFGM2`)와 네이버 전환 추적 픽셀을 `app/layout.tsx`에 추가하고 main에 머지했다. 네이버 비즈채널 검수는 당일 통과. GA4는 `NEXT_PUBLIC_GA_ID` 환경변수로 분리해 `.env.local`에서 관리한다.

## 정리

3일, 15세션, 830+ tool calls. 관여한 프로젝트: `local-commerce-agent`, `preterview`, `dongbaek-uddental`, `jidonglab-site`, `portfolio-site`.

유효했던 패턴 두 가지. 하나는 **서브에이전트 위임** — 치과 마케팅처럼 컨텍스트가 무거운 반복 업무는 전담 에이전트에 넘기고 메인 세션은 의사결정과 승인 게이트만. 다른 하나는 **병렬 다각도 검증** — IR 고도화나 보안 감사처럼 여러 관점이 필요한 곳에서 Workflow로 독립 에이전트를 병렬로 돌리면 순차 리뷰보다 놓치는 게 확연히 줄어든다.

Paddle은 아직 열린 변수다. 재심사 통과를 기다리면서 LemonSqueezy를 대안으로 검토 중이다.
