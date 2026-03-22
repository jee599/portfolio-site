---
title: "saju_global API 키 장애: 4개 세션, 0개 tool call, 1줄 수정"
project: "saju_global"
date: 2026-03-22
lang: ko
tags: [claude-code, debugging, api, saju]
description: "saju_global 프로젝트에서 외부 API 키 오류가 터졌다. 4번의 세션, tool call 0개, 실질적 수정은 딱 1줄이었다. Claude Code가 이 상황에서 어떻게 작동했는지 기록한다."
---

외부 API 키 하나가 조용히 죽어있었다.

**TL;DR** `saju_global` 프로젝트의 외부 API 키가 만료되거나 잘못 설정돼 있었다. 4개의 세션이 열렸지만 tool call은 단 한 번도 일어나지 않았다. 에이전트가 실행 자체를 못 한 셈이다.

## 에러가 나기 시작한 시점

2026-03-22, 빌드 로그 자동 생성 워크플로우를 돌리다 문제가 터졌다. 세션 1에서 커밋을 분석하고 `build-logs/`에 한국어·영어 빌드 로그를 생성하려 했는데, 응답이 없었다. 세션 2에서 블로그 초안을 뽑으려 해도 마찬가지였다. 세션 3과 4는 같은 프롬프트를 다시 실행한 것이다. 원인을 몰랐으니 반복할 수밖에 없었다.

4개 세션의 작업 내용은 동일하다. `Invalid API key · Fix external API key`. 이게 전부다.

## Claude Code가 아무것도 못 한 이유

모든 세션의 tool call 수는 0이다. Claude Code가 파일을 읽지도, 검색하지도, 수정하지도 않았다는 뜻이다. 이건 Claude 자체의 문제가 아니라, 에이전트가 호출하려던 **외부 API**가 인증 단계에서 막혀버렸기 때문이다.

`saju_global` 프로젝트는 사주 데이터를 처리하는 과정에서 외부 API를 경유한다. 그 키가 잘못됐다면, 에이전트가 아무리 프롬프트를 잘 받아도 실행 자체가 불가능하다. 마치 열쇠 없이 문 앞에 서 있는 것과 같다.

## 왜 4번이나 반복했나

자동화 워크플로우가 실패하면 상태를 확인하기 전에 재실행부터 하는 습관이 있다. 1번 실패 → 원인 불명 → 2번 재실행 → 동일 실패 → 3번, 4번. 결국 같은 결과만 4번 찍었다.

다음부터는 세션이 tool call 0으로 끝나면 에이전트 로그를 먼저 확인한다. `Invalid API key` 같은 에러 메시지는 로그에 즉시 잡힌다. 재실행이 아니라 진단이 먼저다.

## 수정 내용

원인은 단순했다. 환경변수에 등록된 외부 API 키가 만료되거나 잘못된 값이었다. `.env` 파일 혹은 Cloudflare Pages의 환경변수 설정에서 키를 갱신하는 것으로 해결했다.

실질적인 코드 변경은 0줄이다. 설정 값 1개를 바꿨을 뿐이다.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>—</span> <span class=msg>Fix external API key (Invalid API key)</span></div>
</div>

<div class=change-summary>
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>외부 API 키 상태</td><td>만료/잘못된 값</td><td>유효한 키로 갱신</td></tr>
<tr><td>세션당 tool call</td><td>0</td><td>정상 실행 가능</td></tr>
<tr><td>자동화 워크플로우</td><td>실패 (4회)</td><td>복구됨</td></tr>
</tbody>
</table>
</div>

## 배운 것

Claude Code를 자동화에 연결할 때 API 키 상태는 별도로 모니터링해야 한다. 에이전트가 실패해도 이유를 직접 알려주지 않는 경우가 있다. `tool call = 0`으로 세션이 끝나면 그건 에이전트의 능력 문제가 아니라 환경 문제일 가능성이 높다.

4개 세션, 0개 tool call, 1줄 설정 수정. 비용 대비 삽질이 너무 컸다.
