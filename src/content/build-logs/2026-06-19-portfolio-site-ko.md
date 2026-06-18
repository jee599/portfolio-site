---
title: "프리터뷰 리브랜딩 + 결제 디버깅: Claude Code 3세션 371 tool calls 기록"
project: "portfolio-site"
date: 2026-06-19
lang: ko
tags: [claude-code, nextjs, payment, debugging, rebranding]
description: "coffeechat에서 preterview로 리브랜딩, KakaoPay 심사 장벽에 부딪혀 PayApp으로 피벗, 실결제 후 크레딧 미적립 버그까지. Claude Code 3세션 371 tool call의 생생한 기록."
---

실결제가 됐는데 크레딧이 안 들어왔다. 7분짜리 세션에서 Vercel 런타임 로그를 파고 들어간 끝에, `PAYAPP_LINKVAL` 환경변수가 PayApp 서버가 보내는 실제 값과 다르다는 걸 확인했다. 하루 전날엔 GitHub 레포 이름부터 Vercel 프로젝트명까지 죄다 바꾸면서 결제 모듈 세 개를 갈아치웠다.

**TL;DR** 11시간짜리 세션 하나에 리브랜딩·결제 통합·법적 페이지 작성을 쑤셔 넣었고, 다음 날 7분 만에 웹훅 버그 하나를 잡았다.

## coffeechat이 preterview가 되기까지

세션 시작 프롬프트는 단순했다. "래포랑 깃 관련해서 프리터뷰로 다 바꿔줘." 면접 준비 서비스에 커피챗이라는 이름은 맞지 않았고, preterview(Pre+Interview)로 리브랜딩하기로 한 상태였다.

코드 내부(`package.json`, README, 브랜드 텍스트)는 이미 `preterview`로 되어 있었다. 문제는 인프라였다. `git remote`가 아직 `github.com/jee599/coffeechat`를 가리키고 있었고, Vercel 프로젝트명도 `coffeechat`이었다. `gh repo rename` 한 줄로 GitHub 쪽은 끝났는데, Vercel CLI는 `project rename` 명령 자체가 없었다. 결국 Vercel REST API(`PATCH /v9/projects`)를 직접 호출해서 바꿨다. 인증 토큰은 서브셸 변수 안에서만 쓰고 출력엔 노출 안 됐다.

리브랜딩 도중 다른 버그가 올라왔다. "면접 한 번 하고 보고서 받으면 다음 면접을 못 시작한다"는 것이었다. 다이나믹 워크플로우로 `app/[locale]/interview/page.tsx`의 클라이언트 상태 머신을 추적해 보니, 보고서 수령 후 인터뷰 상태가 초기화되지 않고 종료 상태로 고착되는 문제였다.

## KakaoPay에서 PayApp으로 피벗

결제 모듈 통합이 이날의 주 작업이었다. KakaoPay 연동부터 시작했다. 앱 등록, 키 발급까지 했는데 결정적인 장벽이 있었다. **가맹점 심사**. 사업자는 있었지만 심사 통과를 위해 이용약관·개인정보처리방침·환불정책 페이지가 전부 필요했다.

`전자상거래법 표시의무`와 `PG 가맹 심사 요건`을 다이나믹 워크플로우 4개 렌즈로 감사하고 나서 12개 필수 항목 갭이 나왔다. 통신판매번호(`2026-성남분당A-0452`)와 사업자등록번호를 직접 입력해서 `lib/business.ts`에 반영하고, 법적 페이지 3개(`/terms`, `/privacy`, `/refund`)를 새로 만들었다.

그 사이에 "더 싼 결제 모듈 없냐"는 질문이 나왔다. 다이나믹 워크플로우가 국내 PG사들을 전수 조사한 끝에 **PayApp**(수수료 3.3%, 사업자 기반 즉시 가입)을 추천했다. 카카오페이 준비 코드를 그대로 두고 PayApp도 병렬로 붙였다. 한 세션에 `lib/payments/kakao.ts`, `lib/payments/payapp.ts`, API 라우트 4개(`/pay/kakao/ready`, `/pay/kakao/approve`, `/pay/payapp/ready`, `/pay/payapp/feedback`), 컴포넌트 2개가 생겼다.

## 7분 만에 웹훅 버그 잡기

다음 날 짧은 세션. "실결제 이후에 크레딧 안 들어오는데?" 그게 전부였다.

`.env.local`엔 `APP_ORIGIN`밖에 없었다. 프로덕션 시크릿은 Vercel에만 있어서 직접 DB를 볼 수 없었다. Vercel MCP로 런타임 로그를 가져왔다. 두 번의 결제 시도 흔적이 있었다.

- **17:49** — `feedback 검증 실패(위조 가능)` → `linkkey`/`userid` 검증 단계에서 탈락
- **19:19** — `feedback linkval 불일치` → 1차 검증은 통과했지만 `PAYAPP_LINKVAL`이 PayApp이 실제로 보낸 `linkval`과 달랐다

`confirmPayappFeedback` 웹훅 핸들러가 환경변수로 linkval을 비교하는 구조인데, 등록된 값이 달랐던 것이다. Vercel 로그 `Bash(2)` + 파일 읽기 `Read(5)` 조합으로 10개 tool call 안에 원인을 특정했다. 진단 스크립트 `scripts/diag-payapp.mjs`도 남겼다.

## 이날의 도구 사용 통계

3개 세션 합산:

- 총 tool calls: **371회**
- `Bash` 152번 — 레포 전환, Vercel API 호출, 런타임 로그 파싱
- `Edit` 82번 — 상태 머신 수정, 결제 라우트, 법적 페이지
- `Read` 65번 — 코드 탐색, 환경변수 확인
- `Write` 20번 — 새 파일 17개 생성

세션 1에서 `AskUserQuestion`을 5번 썼다. 통신판매번호, 주소 표기 방식, 이메일 통일 여부 같은 판단은 혼자 결정할 수 없으니 당연하다.

## 정리

리브랜딩은 코드 한 줄 안 건드리고 인프라 레이어에서 끝났다. 결제는 KakaoPay 심사 대기 중에 PayApp을 병렬로 붙였고, 실결제 후 크레딧 미적립 버그는 환경변수 불일치였다. 11시간 세션에서 압축해서 처리하고, 7분 세션에서 웹훅 로그 두 줄로 문제를 특정했다.

긴 세션보다 짧은 세션이 더 집중적으로 돌아가는 경우가 많다.
