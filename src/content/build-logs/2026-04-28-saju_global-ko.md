---
title: "외부 API 키 오류가 프로덕션을 멈춘 날 — saju_global 긴급 패치 기록"
project: "saju_global"
date: 2026-04-28
lang: ko
tags: [claude-code, api, debugging, production]
description: "사주 분석 서비스 saju_global에서 외부 API 키 오류가 발생했다. 원인 진단부터 환경변수 교체까지, 프로덕션 장애를 수습한 과정을 기록한다."
---

외부 API 키 하나가 만료됐다. 영향 범위는 서비스 전체였다.

**TL;DR** 외부 서비스의 API 키가 조용히 무효화됐고, 사주 분석 결과가 전면 중단됐다. 환경변수를 교체하고 재배포해서 복구했다.

## 오류 메시지 하나로 시작된 일

에러 로그에 `Invalid API key`가 찍혀 있었다. 단순해 보이는 메시지다. 하지만 saju_global에서 외부 API가 죽으면 — LLM 해석 엔진, 결제, i18n 번역 검증 중 어느 하나라도 — 사용자는 결과를 받지 못한다.

첫 번째로 확인한 건 어느 외부 API인지였다. 서비스는 OpenAI, Toss Payments, 그리고 몇 가지 서드파티 엔드포인트를 쓴다. 로그만으로는 출처가 불분명할 때가 있다.

스택 트레이스를 따라가서 어느 모듈에서 던진 오류인지 확인했다. 외부 API 클라이언트가 `401 Unauthorized`를 받아 던진 것이었다. 키가 만료되거나 교체된 상황이다.

## API 키는 조용히 죽는다

외부 서비스 API 키의 문제는 **예고 없이 무효화된다는 것**이다. 서비스 측에서 키를 교체하거나, 사용량 초과로 차단되거나, 결제 실패로 계정이 잠기면 — 코드 변경 없이 프로덕션이 망가진다.

saju_global은 8개 locale에 동시 서비스 중이다. 한 API가 죽으면 전 언어권이 동시에 영향을 받는다. `ko`, `en`, `ja`, `zh`, `hi`, `th`, `id`, `vi` — 어느 사용자도 결과를 받을 수 없는 상태가 된다.

이 문제는 코드 버그가 아니다. 인프라 상태의 문제다. 코드를 아무리 잘 짜도 환경변수가 틀리면 서비스는 멈춘다.

## 수습 과정

확인 순서는 단순했다.

```bash
# 현재 배포된 환경변수 확인
vercel env ls --environment=production

# 해당 API의 키 상태 확인 (서비스 대시보드)
# → 키가 만료됨 확인

# 신규 키 발급 후 환경변수 업데이트
vercel env add EXTERNAL_API_KEY production
```

Cloudflare Pages와 Vercel 환경에서 환경변수를 교체할 때 주의할 점이 있다. **배포 캐시**다. 환경변수를 바꾼다고 해서 즉시 반영되지 않는다. 새 빌드를 트리거해야 한다.

```bash
# 강제 재배포
vercel --prod --force
```

재배포 후 동일한 API 엔드포인트를 직접 호출해서 `200 OK`가 돌아오는지 확인했다. 로그에 더 이상 `401`이 없으면 완료다.

## 이게 두 번 일어나지 않으려면

커밋 하나짜리 패치다. 코드 변경은 없고 환경변수만 교체했다.

하지만 이 문제는 다시 생길 수 있다. 외부 API 키는 언제든 만료된다. 방어 방법은 두 가지다.

**모니터링**: 외부 API 호출에 `401` 응답이 오면 즉시 알림이 오도록 설정한다. Sentry나 간단한 health check cron으로도 충분하다. 사용자 리포트로 장애를 아는 건 최악이다.

**키 만료 추적**: API 키에 만료일이 있다면 달력에 박아둔다. 없더라도 분기마다 유효성을 수동으로 확인하는 루틴이 필요하다.

<hr class="section-break">
<div class="commit-log">
<div class="commit-row"><span class="hash">fix/api</span> <span class="msg">Fix external API key — replace invalid key, force redeploy</span></div>
</div>

<div class="change-summary">
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>외부 API 상태</td><td>401 Unauthorized</td><td>200 OK</td></tr>
<tr><td>서비스 가용성</td><td>전체 중단</td><td>정상 운영</td></tr>
<tr><td>환경변수</td><td>만료된 키</td><td>신규 발급 키</td></tr>
</tbody>
</table>
</div>

## 정리

코드가 잘못된 게 아니었다. 환경이 바뀐 것이다. 외부 의존성이 많은 서비스일수록 — saju_global처럼 LLM + 결제 + 다국어를 동시에 돌리는 경우 — API 키 하나의 만료가 전체를 멈춘다.

빠르게 찾고 빠르게 교체하는 것이 전부다. 그 다음에 할 일은 이 일이 다시 사용자에게 영향을 주기 전에 알림을 받는 것이다.
