---
title: "481개 파일 전부 멀쩡했다 — spoonai YAML 에러의 진짜 원인은 CountUp.tsx였다"
project: "portfolio-site"
date: 2026-04-29
lang: ko
tags: [claude-code, debugging, parallel-agents, spoonai]
description: "spoonai Vercel 빌드가 YAML 에러로 실패한다고 했지만 481개 파일 중 깨진 것은 0개였다. 진짜 원인은 CountUp.tsx 누락. 두 세션, 208 tool calls, 결국 9분 만에 배포."
---

Vercel 빌드가 4일 연속 실패하고 있었다. YAML frontmatter 파싱 에러라는 메시지가 떴다. 파일을 열어보니 멀쩡했다. 더 파보니 모든 파일이 멀쩡했다. 481개 전부.

**TL;DR** 사용자가 YAML 에러라고 보고한 문제는 이미 두 달 전에 수정돼 있었다. 실제 빌드 블로커는 `HomeContent.tsx`에서 import하는 `CountUp.tsx` 컴포넌트가 존재하지 않았기 때문이다. 두 세션, 208 tool calls, 22개 파일 수정. 배포는 결국 9분 만에 끝났다.

## "YAML 에러"라는 말을 믿지 말았어야 했다

사용자가 준 에러 메시지는 이랬다.

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

발생 파일: `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`. 4/27, 4/28 Vercel 배포가 전부 CANCELED 상태. 프로덕션은 4/26 수동 배포 버전에 멈춰 있었다.

1차 반응은 당연히 해당 파일을 열어보는 것이었다. line 3을 봤더니 204자였다. column 277이 나올 구조가 아니었다. 같은 날 커밋 `3095c96`에서 이미 정리된 내용이었다. 에러 메시지가 가리키는 곳에 에러가 없었다.

그래서 범위를 넓혔다. `gray-matter`로 `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/` 전체를 파싱했다. Bash 76번, Read 13번. 결과: 481개 파일 중 깨진 것 0개.

## 진짜 원인은 다른 곳에 있었다

파일 파싱이 다 통과한다면, 빌드 파이프라인이 다른 이유로 죽는다는 뜻이다. 로컬에서 직접 빌드를 돌려 재현해봤다.

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx`가 `CountUp`을 import하고 있었다. 그 컴포넌트가 없었다. Next.js 16(Turbopack 기본값)에서는 존재하지 않는 모듈 import가 빌드를 즉사시킨다. YAML 에러 메시지는 이 시점에서 이미 사라진 과거의 에러였다. Vercel 빌드 실패 로그에 YAML 에러가 캐시돼 있었거나, 사용자가 이전 로그를 보고 있었을 가능성이 높다.

`CountUp.tsx`를 새로 작성하고, 파싱 에러가 완전히 없다는 사실을 확인한 뒤 커밋했다. 로컬 빌드에서 480개 정적 페이지 생성 확인. 배포 완료.

## 같은 문제를 두 번 디버깅한 이유

세션 4(9분, 91 tool calls)와 세션 5(13분, 117 tool calls)가 동일한 문제를 따로 디버깅했다. 두 세션이 서로를 모르는 상태로 같은 작업을 중복 실행한 것이다.

세션 4는 빠르게 `CountUp.tsx` 누락을 발견하고 수정해서 배포까지 완료했다. 세션 5는 `superpowers:systematic-debugging` 스킬을 실행하며 더 체계적으로 접근했지만, 세션 4가 이미 해결한 뒤였다. 결과적으로 세션 5는 이미 수정된 상태에서 YAML 검증을 다시 처음부터 돌렸다.

이 패턴은 Claude Code 운영에서 자주 나온다. 이전 세션 컨텍스트 없이 같은 프롬프트로 새 세션을 시작하면, 모델은 아무것도 모르는 채로 시작한다. 같은 지점부터 다시 삽질한다. 해결책은 세션 완료 상태를 어딘가에 명시적으로 기록하는 것이다. 커밋 메시지나 별도 상태 파일로.

## 같은 날, 사주 글로벌에선 에이전트 5개가 병렬로 돌았다

세션 3는 다른 종류의 작업이었다. Telegram 메시지 하나가 트리거였다.

> "동남아/일본 시장에 팔아서 무조건 수익을 내는 에이전트 하나씩 돌려줘 모든 방법을 사용해서 광고/사이트리디자인/바이럴 모두"

이 메시지 하나가 237 tool calls, 33시간 47분 세션을 만들었다. 에이전트 5개가 병렬로 실행됐다.

```
JP fortune market data agent
SEA fortune market data agent
Viral fortune video pattern decode agent
Top-converting fortune site references agent
Site CRO audit JP/TH agent
```

각 에이전트는 독립적으로 리서치해서 `/saju_global/blog-drafts/` 아래에 파일을 생성했다. JP 시장 데이터, SEA 시장 데이터, 바이럴 영상 패턴 분석, 사이트 레퍼런스, CRO 감사. 합산 약 15,000단어 분량.

PayPal 라이브 엔드포인트도 검증했다. 실제 $1.99 주문이 DB에 생성됐고 승인 URL이 발급됐다. Toss는 3월까지 29건 실결제 성공이 확인된 상태. 결론은 "결제 플랫폼은 바꾸지 않아도 된다. 트래픽이 없는 게 문제다. $50로 광고 먼저 테스트하라"였다.

CRO 에이전트가 태국 결제창에 ₩ 기호가 표시된다고 올렸다. 검증해보니 거짓 양성이었다. `toss` 네임스페이스 안에만 있는 코드라 태국 사용자는 PayPal 페이지로 라우팅돼 그 화면을 볼 일이 없었다. 에이전트가 컨텍스트 없이 코드만 읽으면 이런 실수가 생긴다. 수동 검증이 필요한 이유다.

이후 사이트 i18n 메시지 파일 21개를 업데이트하고 디자인 수정을 배포했다.

## 삽질에서 건진 것

spoonai 디버깅에서 하나 건진 게 있다. `validate-content.mjs`가 `matter.stringify`로 파일을 다시 쓰는 로직이 있었다. self-critique이 적용된 4/27 이후 기사들을 직접 파싱해서 long line이 있는지 확인했다. `content/daily/2026-04-10-en.md`에 frontmatter가 없는 파일이 발견됐다. 본래 문제는 아니었지만 잠재적 버그였다.

YAML 에러 사냥을 하다 예상치 못한 데이터 품질 문제를 하나 발견한 셈이다. 잘못된 가설로 시작한 디버깅이 전혀 다른 문제를 드러낼 때가 있다.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>8aa059b</span> <span class=msg>fix: add missing CountUp component, fix broken daily frontmatter</span></div>
</div>

<div class=change-summary>
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>Vercel 배포 상태</td><td>4일 연속 CANCELED</td><td>정상 배포 완료</td></tr>
<tr><td>CountUp.tsx</td><td>없음 (import만 존재)</td><td>생성됨</td></tr>
<tr><td>YAML 파일 검증</td><td>481개 미검증</td><td>481개 전부 통과</td></tr>
<tr><td>세션 수</td><td>—</td><td>2 (세션4 + 세션5 중복)</td></tr>
<tr><td>tool calls 합산</td><td>—</td><td>208 (91 + 117)</td></tr>
<tr><td>수정 파일 (saju_global)</td><td>—</td><td>21개 i18n 파일</td></tr>
</tbody>
</table>
</div>

## 정리

에러 메시지를 그대로 믿지 않는 것이 디버깅의 시작이다.

사용자가 "YAML 에러"라고 보고했을 때, 그 에러 메시지가 언제 발생한 것인지 먼저 확인했어야 했다. Vercel 대시보드의 에러 로그는 실시간이 아닐 수 있다. 의심스러운 파일을 열기 전에 로컬 빌드를 돌려 현재 에러를 재현하는 게 더 빠른 경로였다.

그리고 세션 완료 상태는 반드시 기록으로 남겨야 한다. 같은 작업을 두 번 하는 비용은 생각보다 크다.
