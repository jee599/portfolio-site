---
title: "API 키 만료 한 줄로 8개 언어권이 멈췄다 — saju_global 긴급 복구 기록"
project: "saju_global"
date: 2026-04-28
lang: ko
pair: "2026-04-28-saju_global-en"
tags: [claude-code, api, debugging, production]
description: "사주 분석 서비스 saju_global에서 외부 API 키가 조용히 만료됐다. 코드는 아무것도 바뀌지 않았고 배포도 정상이었다. 환경변수 하나가 틀렸을 뿐인데 8개 언어권 전체가 멈췄다. 탐지 지연이 진짜 문제였다. 진단부터 환경변수 교체, 강제 재배포까지의 과정을 기록한다."
---

외부 API 키 하나가 만료됐다. 코드는 아무것도 바뀌지 않았는데 서비스 전체가 멈췄다.

**TL;DR** saju_global에서 외부 서비스 API 키가 무효화됐다. 환경변수를 교체하고 강제 재배포해서 복구했다. 탐지가 사용자 리포트로 이뤄진 게 진짜 문제였다.

## 에러 메시지 하나로 시작된 일

로그에 `Invalid API key`가 찍혀 있었다. 단순해 보이는 메시지다. 그런데 saju_global에서 외부 API가 `401`을 받으면 서비스 전체가 멈춘다.

saju_global은 현재 `ko`, `en`, `ja`, `zh`, `hi`, `th`, `id`, `vi` — 8개 언어권을 동시 서비스한다. LLM 해석 엔진, 결제 모듈, i18n 번역 검증이 모두 외부 API에 의존한다. 그 중 하나라도 죽으면 사용자는 사주 해석 결과를 받지 못한다.

에러를 처음 인지한 건 사용자 리포트였다. 그게 문제였다.

## API 키는 예고 없이 죽는다

외부 서비스 API 키의 특성상 만료 알림은 오지 않을 때가 많다. 서비스 측에서 키를 교체하거나, 사용량 초과로 차단되거나, 결제 실패로 계정이 잠기면 — 코드 변경 없이 프로덕션이 망가진다.

원인 파악 과정은 단순했다. 스택 트레이스를 따라 어느 모듈에서 `401`이 던져졌는지 확인했다. 외부 API 클라이언트였다. 해당 서비스 대시보드에서 키 상태를 확인하니 만료 또는 무효화 상태였다.

## 수습 과정

확인 순서는 다음과 같았다.

```bash
# 현재 배포 환경변수 확인
vercel env ls --environment=production

# 해당 API 키 상태 확인 → 만료 확인
# 신규 키 발급 후 환경변수 교체
vercel env add EXTERNAL_API_KEY production
```

환경변수를 교체했다고 즉시 반영되지는 않는다. Cloudflare Pages와 Vercel 모두 새 빌드를 트리거해야 적용된다.

```bash
# 강제 재배포
vercel --prod --force
```

재배포 후 동일 엔드포인트에 직접 요청을 보내서 `200 OK`가 돌아오는지 확인했다. `401`이 사라졌으면 완료다.

## 다음엔 사용자보다 먼저 알아야 한다

코드 변경은 없었다. 환경변수 교체와 재배포가 전부였다.

이 문제가 다시 생기는 건 막기 어렵다. 외부 API 키는 언제든 만료된다. 할 수 있는 건 **사용자보다 먼저 아는 것**이다.

방법은 두 가지다. 외부 API 호출에 `401` 응답이 오면 즉시 알림이 오도록 모니터링을 건다. Sentry 또는 간단한 health check cron으로 충분하다. 그리고 API 키에 만료일이 있다면 달력에 박아둔다. 없더라도 분기마다 유효성을 수동으로 확인하는 루틴이 필요하다.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>3a9f7c2</span> <span class=msg>fix: replace invalid external API key, force redeploy</span></div>
</div>

<div class=change-summary>
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>외부 API 상태</td><td>401 Unauthorized</td><td>200 OK</td></tr>
<tr><td>서비스 가용성</td><td>전체 중단 (8개 언어권)</td><td>정상 운영</td></tr>
<tr><td>환경변수</td><td>만료된 키</td><td>신규 발급 키</td></tr>
</tbody>
</table>
</div>

## 정리

코드가 잘못된 게 아니었다. 환경이 바뀐 것이다. 외부 의존성이 많은 서비스일수록 — saju_global처럼 LLM, 결제, 다국어를 동시에 돌리는 구조에서는 — API 키 하나의 만료가 전체를 멈춘다.

빠르게 찾고 빠르게 교체하는 건 기본이다. 다음 할 일은 사용자보다 먼저 장애를 알 수 있는 구조를 만드는 것이다.
