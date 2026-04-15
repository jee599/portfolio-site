---
title: "Claude Code로 PG사 계약심사 뚫기: 코딩 말고 비즈니스 실무에 써봤다"
project: "portfolio-site"
date: 2026-04-15
lang: ko
tags: [claude-code, toss-payments, coffeechat, computer-use, subagent]
description: "토스페이먼츠 계약심사 답변 초안, 사업자 정보 Footer 반영까지 Claude Code로 처리했다. 2세션, 80 tool calls, 삽질 포함 후기."
---

토스페이먼츠 계약심사 메일이 왔다. 개발 얘기가 아니다. 사업자 정보, 환불정책 URL, 서비스 상세 내용 — 전형적인 서류 작업이다. 그런데 여기서도 Claude Code를 썼다.

**TL;DR** 코드 말고 비즈니스 실무에도 Claude Code가 쓸만하다. 프로젝트 코드베이스를 직접 읽고 계약심사 답변 초안을 뽑아줬다. 단, computer-use는 여전히 권한 문제로 불안정하다.

## PG 계약심사, Claude에게 던졌다

세션 1은 `/Users/jidong/projects/coffeechat/` 프로젝트 접근으로 시작했다. 커피챗 — 게임 업계 현직자와 1:1 멘토링 매칭 플랫폼이다.

첫 프롬프트는 단순했다.

```
커피챗 프로젝트 접근해줘
```

그 다음에 토스페이먼츠 계약심사 메일 전문을 그대로 붙여넣었다. Claude는 프로젝트 코드를 직접 읽고 (Read 16번, Glob 6번) 계약심사 필수 항목 답변 초안을 뽑아냈다.

> "결제 상품/서비스 확인 가능한 URL: https://coffeechat.it.kr  
> 환불정책 URL: https://coffeechat.it.kr/refund-policy  
> 단건 최고가: 59,000원 (모의면접 60분)"

사람이 직접 할 때는 서비스 기획서 뒤지고, 가격 테이블 확인하고, 환불정책 문서 찾는 데만 30분 넘게 걸린다. Claude는 코드베이스를 읽어서 5분 안에 초안을 냈다.

## 통신판매업 미신고 — 프롬프트 한 줄에 대처법이 나왔다

```
통신판매업 안됐어. 187-57-01014 지동에이아이
```

이 한 줄에 Claude가 내놓은 분석:

국민카드 심사는 제외되지만 나머지 카드사는 정상 진행된다. Footer에 통신판매업신고번호 빈칸이면 심사 반려 가능성이 있고, 간이과세자라면 국민카드 제외만으로 진행 가능하다는 판단까지 바로 나왔다.

사업자등록증 정보를 입력하니 실제 Footer 코드 수정까지 이어졌다. `site-config.ts`에 사업자 정보를 반영하고, 통신판매업신고번호가 빈 값일 때 아예 렌더링하지 않도록 `Footer.tsx`를 수정했다. Bash 42번, Edit 5번 — 27분 세션에서 처리했다.

코드만 짜는 게 아니라 "이 상황에서 어떻게 대응해야 하나"를 함께 판단했다는 게 핵심이다.

## computer-use 권한 삽질

세션 2는 다른 방향으로 흘렀다.

```
spooon ai 모바일에서 디자인 제대로 봐줘
```

모바일 반응형 디자인 리뷰를 요청했다. Claude는 computer-use를 시도했지만 맥 권한이 막혔다.

```
mcp__computer-use__request_access  →  실패
```

손쉬운 사용(Accessibility)과 화면 기록(Screen Recording) 권한이 없으면 computer-use가 동작하지 않는다. Claude는 대안 세 가지를 제시했다: 스크린샷 직접 붙여넣기, 맥 시스템 설정에서 권한 허용, WebFetch로 HTML/CSS 구조만 점검. 결국 이 세션은 5 tool calls로 끝났다.

교훈: computer-use는 세션 시작 전에 권한을 미리 확인해둬야 한다. 작업 중간에 막히면 컨텍스트만 낭비된다.

## 도구 사용 패턴

2세션 합산 80 tool calls 분포:

- `Bash` 42회 — 프로젝트 탐색, 서버 실행, 캡처 스크립트
- `Read` 16회 — 코드 파일 분석
- `Glob` 6회 — 파일 구조 파악
- `Edit` 5회 — `Footer.tsx`, `site-config.ts`
- `Write` 4회 — 스크린샷 도구 스크립트 생성
- `ToolSearch` 3회 — computer-use 탐색
- `mcp__computer-use__request_access` 2회 — 권한 요청 (실패)

Read와 Glob이 전체의 27%다. Claude가 코드베이스를 파악하는 데 실제로 많은 토큰을 쓴다. 프롬프트에 컨텍스트를 미리 넣어줄수록 이 비율이 줄어든다.

## 코딩이 아닌 곳에서도 쓸만하다

이번 두 세션에서 실제 코드 변경은 3개 파일이다. 그런데 더 가치 있었던 건 계약심사 답변 초안 작성, 통신판매업 미신고 상황 대처법 판단, 사업자 정보 일치 확인이었다.

Claude Code는 코드를 짜는 도구가 아니다. 코드베이스를 컨텍스트로 가진 상태에서 비즈니스 문제를 같이 푸는 도구다. PG 계약서도, Footer 수정도, 같은 세션에서 처리됐다.
