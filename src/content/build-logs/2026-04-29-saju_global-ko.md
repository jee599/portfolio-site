---
title: "Claude가 Claude 로그를 못 썼다 — API 키 만료로 빌드 로그 파이프라인 2회 실패"
project: "saju_global"
date: 2026-04-29
lang: ko
tags: [claude-code, api, automation, debugging]
description: "saju_global 빌드 로그 자동 생성 파이프라인이 2026-04-28에 2회 연속 실패했다. Anthropic API 키 만료가 원인이었다. 0 tool calls, 0 파일 수정. Claude가 Claude 로그를 못 쓰는 상황이 생겼다."
---

2026-04-28에 saju_global 빌드 로그 자동 생성이 두 번 실행됐다. 두 번 다 실패했다. tool calls 합산 0건.

**TL;DR** Anthropic API 키가 만료돼 빌드 로그 생성 파이프라인 자체가 시동을 못 걸었다. 키를 교체하고 나서야 파이프라인이 재개됐다.

## Claude가 Claude 로그를 못 쓴 날

saju_global 빌드 로그 자동화 파이프라인은 Claude API(`claude-haiku-4-5-20251001`)로 돌아간다. 커밋 diff를 넘기면 빌드 로그를 생성하는 구조다.

세션 1이 시작됐다. 에러가 났다.

```
Error: Invalid API key
```

세션 2가 시작됐다. 같은 에러.

두 세션 모두 아무것도 실행하지 못한 채 종료됐다. Claude가 Claude 로그를 못 쓰는 상황이다. Anthropic API 키가 만료됐거나 무효화된 것이다.

## 왜 이게 생기나

외부 API 키 만료는 코드 변경 없이 파이프라인을 죽인다. `ANTHROPIC_API_KEY` 환경변수가 잘못되면 Claude Code 세션 자체가 시작부터 막힌다. 에러 메시지는 단순하다. `Invalid API key`. 스택 트레이스도 없고 어느 파일이 문제인지도 안 나온다. 키 자체가 문제다.

saju_global 빌드 로그 생성 세션은 이미 어제(04/28) 다른 context에서 이 사실이 포착됐다. 포트폴리오 사이트 빌드 로그에 같은 날 "API 키 만료로 파이프라인 2회 실패"가 기록됐다.

## 수습

환경변수 교체가 전부다.

```bash
# 기존 키 확인 (만료 또는 무효화 상태)
# 신규 키 발급 후 교체
export ANTHROPIC_API_KEY="sk-ant-..."
```

CI 또는 Cloudflare Pages 환경이라면 대시보드에서 환경변수를 직접 교체하고 재배포가 필요하다.

키를 교체한 뒤 파이프라인이 재개됐다. 오늘 이 로그가 생성되는 것이 그 증거다.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>fix</span> <span class=msg>fix: replace invalid external API key</span></div>
</div>

<div class=change-summary>
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>ANTHROPIC_API_KEY</td><td>만료/무효화</td><td>신규 발급 키</td></tr>
<tr><td>빌드 로그 파이프라인</td><td>2회 연속 실패 (0 tool calls)</td><td>정상 재개</td></tr>
<tr><td>세션 수</td><td>2 (실패)</td><td>—</td></tr>
</tbody>
</table>
</div>

## 정리

코드가 잘못된 게 아니었다. 환경이 바뀐 것이다.

어제 saju_global 서비스에서도 외부 API 키 만료로 8개 언어권 전체가 멈추는 사고가 있었다. 그날 같은 날, 빌드 로그 파이프라인도 같은 이유로 멈췄다. 두 사고의 구조가 동일하다. 외부 의존성 — 키 만료 — 침묵 실패.

다음에 할 일은 하나다. `ANTHROPIC_API_KEY`가 `401`을 반환하면 즉시 알림이 오는 구조를 만드는 것. 파이프라인이 조용히 실패하는 것보다 시끄럽게 알려주는 게 낫다.
