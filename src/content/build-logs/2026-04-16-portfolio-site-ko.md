---
title: "토스 계약서부터 288 SEO 페이지까지, Claude Code 4세션 280 tool calls 기록"
project: "portfolio-site"
date: 2026-04-16
lang: ko
tags: [claude-code, subagent, seo, toss-payments, workflow]
description: "4세션 280 tool calls. 결제사 계약심사 메일 작성, 288개 SEO 페이지 자동 생성, 디자인 리뷰까지 Claude Code로 처리한 작업 흐름을 공개한다."
---

4세션 동안 Bash 159번, Read 42번, Agent 19번을 썼다. 코딩만 한 게 아니다. 결제사 계약심사 메일 답변, 290개 SEO 랜딩 페이지 생성, 이메일 자동화, 디자인 리뷰까지 한 주를 Claude Code로 돌렸다.

**TL;DR** 개발 작업 외에 비즈니스 어드민 업무도 Claude Code로 처리할 수 있다. 서브에이전트로 태스크를 병렬 분산하면 컨텍스트가 깨끗하게 유지된다.

## 토스페이먼츠 계약심사를 Claude가 처리했다

첫 세션은 코드가 아니었다. 토스페이먼츠에서 계약심사 메일이 왔고, 사업자정보·환불정책·상품가격을 정리해서 답변해야 했다. 프롬프트는 단순했다.

```
커피챗 프로젝트 접근해줘
```

그 다음 계약심사 메일을 붙여넣었다. Claude는 `/Users/jidong/projects/coffeechat/`를 읽고 스택(Next.js 16 + Supabase + Toss Payments), 가격 구조, 환불정책 위치를 파악해서 답변 초안을 바로 뽑아냈다.

추가로 통신판매업 미신고 상태라는 걸 알자, 자동으로 두 가지를 처리했다. `site-config.ts`에서 통신판매업신고번호 필드가 빈 값일 때 렌더링을 숨기는 분기를 추가했고, `Footer.tsx`에 사업자주소·전화번호를 카드사 심사 기준에 맞게 추가했다. 내가 "footer 수정해줘"라고 말한 적 없다. 맥락에서 판단해서 먼저 움직였다.

Bash 42번, Read 16번, Edit 5번. 27분짜리 세션이었다.

## 브라우저 권한 없으면 Claude도 못 본다

두 번째 세션은 삽질이었다. spoonai 모바일 디자인을 보여달라고 했는데, Claude에 macOS 손쉬운 사용 + 화면 기록 권한이 없었다. `computer-use` 도구가 있어도 시스템 권한이 없으면 아무것도 못 한다.

```
computer use 열려있는데? chrome mcp는 왜 없어?
```

이 세션에 Chrome MCP가 설치되지 않았다. WebFetch는 HTML을 마크다운으로 변환할 뿐이라 실제 레이아웃은 확인이 안 된다. 결국 두 가지 대안만 남는다. 시스템 설정에서 Claude에 권한을 주거나, 개발자 도구 모바일 뷰에서 스크린샷을 직접 찍어 붙이거나.

tool calls 7번으로 끝났다. 인프라 설정이 안 되어 있으면 Claude가 아무리 똑똑해도 한계가 있다.

## 288 SEO 페이지, 서브에이전트로 분산했다

세 번째 세션이 이번 주의 핵심이다. `saju_global`에서 사주 궁합 SEO 랜딩 288페이지를 구현하는 작업이었다. Bash 111번, Read 20번, Agent 17번, TaskCreate 7번, TaskUpdate 14번. 총 182 tool calls.

계획부터 시작했다. `writing-plans` 스킬을 실행해서 스펙 파일(`docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md`)을 기반으로 구현 계획을 `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md`에 저장했다.

그 다음 `subagent-driven-development` 스킬을 실행했다. 태스크별로 독립 서브에이전트를 디스패치하고, 각 태스크 완료 후 스펙 컴플라이언스 리뷰 → 코드 퀄리티 리뷰 2단계로 검증하는 패턴이다.

콘텐츠 생성은 스크립트로 백그라운드에 돌렸다.

```
nohup npx tsx scripts/generate-compat-content.ts > /tmp/compat-gen.log 2>&1 &
```

백그라운드 태스크가 돌아가는 동안 메인 스레드는 다른 작업을 처리한다. "잘되고 있어?"라는 질문에 Claude는 로그 파일을 읽어 진행상황을 보고했다. 최종 결과물은 `apps/web/data/zodiac-compat-content.json`으로 생성됐다.

서브에이전트 패턴의 핵심은 메인 컨텍스트를 깨끗하게 유지하는 것이다. 파일 탐색, 구현, 검증이 분리된 에이전트에서 실행되니 메인 스레드에 불필요한 출력이 쌓이지 않는다.

## 아카이브 이미지가 없는 이유: 타입 문제였다

네 번째 세션. spoonai 아카이브에서 이미지가 안 나온다는 문제였다. 처음에는 렌더링 버그라고 생각했는데, Read와 Grep으로 파고들어 보니 루트 원인은 타입 정의였다.

`lib/types.ts`의 `ArchiveEntry`에 `image` 필드 자체가 없었다. `getArchiveEntries()` 함수가 `meta.image`를 버리고 `date/title/summary`만 담고 있었다. `ArchiveList.tsx`도 썸네일 자리 없이 텍스트 카드만 렌더링했다. "사진이 안 나오는" 게 아니라 처음부터 렌더링하지 않도록 만들어진 구조였다.

Bash 6번, Read 6번, WebFetch 2번, Grep 1번. 1시간 39분 세션에서 상황 파악까지만 완료했다.

## 이번 주를 돌아보면

| 세션 | 작업 | Tool calls | 소요 시간 |
|------|------|-----------|---------|
| 1 | 결제사 계약심사 + footer 수정 | 73 | 27분 |
| 2 | 모바일 디자인 확인 시도 | 7 | — |
| 3 | 288 SEO 페이지 계획 + 생성 | 182 | 105h 누적 |
| 4 | 아카이브 이미지 문제 파악 | 16 | 1h 39min |

Claude Code를 개발 도구로만 쓰면 활용도의 절반도 안 된다. 계약서 답변 초안 작성, 비즈니스 로직 기반 코드 자동 수정, 대용량 콘텐츠 배치 생성까지 "맥락을 넘기면 알아서 움직이는" 도구다.

서브에이전트 패턴은 큰 작업에서 필수다. 메인 컨텍스트를 정보로 채우는 대신, 태스크를 분리하고 결과만 받아온다. 토큰을 아끼면서 품질을 유지하는 방법이 이거다.
