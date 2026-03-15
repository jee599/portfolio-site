---
title: "에이전트 10명 고용해서 멘토링 플랫폼 만든 기록: 6세션, 1289 tool calls"
project: "coffee-chat"
date: 2026-03-15
lang: ko
tags: [claude-code, multi-agent, nextjs, toss-payments]
---

6번의 세션. 1289번의 tool call. 수정 파일 84개, 생성 파일 26개.

커피챗은 게임 업계 현직 개발자와 멘티를 연결하는 1:1 멘토링 플랫폼이다. 기술 스택은 Next.js 16, Supabase, Toss Payments, Resend. 처음에는 거의 빈 껍데기였다. 의존성도 안 깔려 있고, `.env.example`도 없고, README는 create-next-app 기본 템플릿이었다.

이 상태에서 Claude Code가 어떻게 움직였는지 기록한다.

## 첫 번째 프롬프트: 감사(Audit)부터 시작한다

세션 1에서 던진 첫 프롬프트는 이렇다.

```
Do an initial project audit and make it runnable for local development.
Tasks:
1) Detect the tech stack and how to run/build/test
2) Install dependencies as needed.
3) Try to run the existing tests/build/lint. Fix straightforward issues.
4) Create or update README with exact local setup/run steps.
```

23분, 142번의 tool call이 돌아갔다. `Read` 55번, `Edit` 36번, `Bash` 27번.

빌드는 통과했는데 lint가 22 errors, 40 warnings였다. Claude는 `prefer-const`, `<a>` → `<Link>` 전환 같은 단순한 것만 고치고, `no-explicit-any`나 `set-state-in-effect` 같은 아키텍처 이슈는 건드리지 않았다.

> "The `no-explicit-any` and `set-state-in-effect` errors are architectural/design issues, not straightforward fixes. The build already passes cleanly."

처음 보는 레포에서 블로커만 제거하고 나머지는 판단을 보류한다는 것. 프롬프트에 "fix straightforward issues"라고 명시했으니 당연하지만, 실제로 그 선을 지키는 게 중요하다.

그 다음 프롬프트는 한 줄이었다: `push it`. 커밋하고 푸시까지 자동으로.

## "에이전트 10명이서 마스터플랜 만들어줘"

세션 2에서 이 한 문장을 던졌다.

```
masterplan 에이전트 10명이서 만들어줘
서비스 완전 가능하게
디자인이랑 사용성에 중점을 두고
```

`TeamCreate`로 10개 에이전트가 동시에 뜬다. 각자 페이지/API 라우트, 컴포넌트, 유틸/훅, Supabase 스키마 분석을 나눠서 진행한다. 세션이 6분밖에 안 됐지만 도구 사용은 `Bash` 4, `Read` 3, `Task` 1, `TeamCreate` 1, `TodoWrite` 1.

실제 작업은 세션 3으로 넘어갔다. Claude Opus 4.6으로 전환하고 랜딩 전환율 개선에 집중한다.

```
Goal: Progress coffeechat toward fast launch WITHOUT requiring Supabase CLI
Do:
1) Landing conversion improvements on / (mentee funnel)
2) Add a 3-metric stats strip above the fold (social proof placeholders ok)
3) Add a trust block: refund/no-show policy
```

"Supabase CLI 없이"라는 제약 조건을 명시한 게 중요했다. Homebrew가 막혀 있었고, CLI 없이도 진행할 수 있는 작업만 태스크로 넣었다.

5분, 43번의 tool call로 `Hero.tsx`, `TrustBlock.tsx`, `HomeClient.tsx` 수정 + 디자인 문서 2개 생성이 끝났다.

## 컨텍스트가 날아가는 문제

세션 4는 55분, 216번의 tool call. 근데 이 세션에서 특이한 게 있다. 프롬프트 목록을 보면 이런 게 반복된다.

```
This session is being continued from a previous conversation that ran out of context.
The summary below covers the earlier portion of the conversation.
```

컨텍스트 윈도우가 터지면서 자동 요약이 붙어서 이어진다. 세션 4에서만 3번. 세션 5에서 4번. 세션 6에서도 비슷하게.

이렇게 컨텍스트가 끊기면서도 작업이 이어지는 건 Claude Code가 `docs/STATUS.md`, `docs/MASTER_PLAN.md` 같은 문서에 상태를 계속 기록했기 때문이다. 세션이 새로 시작돼도 "현재 상황 파악해줘" 한 마디면 문서를 읽고 어디서 멈췄는지 파악한다.

세션 4에서 3명의 기획자 에이전트를 붙였다: `biz-planner`, `ux-planner`, `tech-planner`. 비즈니스/UX/기술 각 영역별로 `docs/기획_고도화/` 아래에 문서를 썼다.

## QA 루프: "5개씩 찾아줘 없으면 말고"

세션 5가 가장 길다. 32시간 43분, 567번의 tool call. `Agent`를 71번 썼다.

이 세션에서 반복된 패턴이 있다.

```
커밋해주고 다시 qa 돌려서 5개씩 찾아줘 없으면 스킵하고
다시 확인해봐 5개씩 이제 진짜 없나
```

한 번에 다 고치는 게 아니라, 5개씩 찾아서 고치고 다시 돌리는 루프다. "없으면 스킵"이라는 탈출 조건을 명시했다. 이 루프를 4~5회 돌리면서 136개 이슈를 잡아냈다.

"에이전트 3명이서 각각 해결해"라는 명령으로 병렬 실행도 했다. 디자인 에이전트 2명은 외부 사이트(강의 플랫폼, 소셜 중개 사이트)를 크롤링해서 색감/레이아웃을 비교했다.

근데 여기서 삽질이 있었다.

```
지금 다크모드 필요 없고 폰/웹에서 라이트 모드 하나만 해줘
```

이걸 요청했는데.

```
라이트 모드 안되어 있는데?
```

코드는 고쳤는데 배포가 안 됐거나, 캐시가 남아있거나, 실제로 제대로 반영이 안 됐다. 세션 5에서만 비슷한 말이 4~5번 반복됐다. `coffeechat.it.kr` 주소를 직접 언급하면서 "브라우저에서 확인해봐"까지 나왔다.

```
지금 너가 브라우저 열어서 확인해봐 메인에 시범운영 팝업 없는지 바탕화면 무슨 색인지
진짜 하나도 안고쳐졌어
```

배포 확인을 프롬프트에 명시적으로 포함시키지 않으면 코드만 바꾸고 넘어가는 경우가 생긴다. "배포까지 확인해"를 루프에 넣어야 한다는 교훈.

나중에는 메인 색상도 수정했다.

```
메인컬러인 갈색 조금 더 트랜디한 갈색으로 퀄리티업해줘
```

그 다음.

```
5+ 검증된 멘토 / 2,000+ 상담 완료 / 4.8/5 평균 만족도
거짓말 다 빼줘
```

플레이스홀더 숫자를 실제 데이터처럼 뒀다가 한 번에 다 지운 케이스. 초기에 "social proof placeholders ok"로 빠르게 만든 것들이 나중에 정리돼야 하는 빚이 됐다.

## 토스 결제: 코드보다 규정이 먼저

세션 6, 23시간 7분, 311번의 tool call. 첫 프롬프트가 인상적이다.

```
toss 결제 연동해야하는데, 키발급받기전에 관련 페이지나, 규정 이런거 다 지켜서 작업 해줘
```

"키 발급 전에 규정부터"라고 명시했다. Claude는 이용약관, 개인정보처리방침, 환불규정 페이지 순서로 체크리스트를 만들었다.

- 이용약관: 청약철회 제한 사유 명시 필요
- 개인정보처리방침: 토스페이먼츠 제3자 제공 명시, 2025 가이드라인 반영
- 환불규정: 별도 페이지 필요

`/refund-policy/page.tsx` 생성, `terms/page.tsx`와 `privacy/page.tsx` 수정, `Pricing.tsx`에 환불 안내 추가, `Footer.tsx`에 환불정책 링크 추가. 코드 한 줄 없는 작업이 먼저 나온다.

이 세션에서 `Cron`도 등록됐다. 자동 완료, 환불 처리, 주간 정산, 미확인 예약 자동 취소. `vercel.json`에 크론 설정을 넣었다.

```
크론은 뭘 등록한거야 크론이 뭐야
```

사용자가 직접 물어본 거다. 에이전트가 자의적으로 만들어 둔 것들을 나중에 파악하는 흐름이 생긴다. 에이전트가 많이 움직일수록 "뭘 만든 건지 요약해줘"라는 확인 프롬프트가 필요하다.

## 숫자로 보는 6세션

| 세션 | 시간 | tool calls | 주요 작업 |
|------|------|-----------|---------|
| 1 | 23min | 142 | 초기 감사, lint, README |
| 2 | 6min | 10 | 마스터플랜 에이전트 10명 |
| 3 | 5min | 43 | 랜딩 전환율 개선 |
| 4 | 55min | 216 | 기획자 3명, Phase 1~4 |
| 5 | 32h 43min | 567 | QA 루프, 디자인 개편 |
| 6 | 23h 7min | 311 | 토스 결제, 크론, 쿠폰 |

도구별: `Read` 328번, `Bash` 324번, `Edit` 244번, `Grep` 110번, `Agent` 97번.

`Read`와 `Bash`가 1~2위인 건 코드를 쓰기 전에 읽고 확인하는 시간이 그만큼 길다는 뜻이다. `Agent`가 97번인 건 서브에이전트를 적극적으로 활용했다는 것.

## 배운 것

멀티 에이전트는 빠르다. "에이전트 10명이서 만들어줘"라고 던지면 병렬로 돌아간다. 그런데 그 결과를 검증하고 통합하는 건 여전히 사람 몫이다.

컨텍스트가 끊겨도 `STATUS.md` 하나만 있으면 다시 시작할 수 있다. 문서가 상태를 유지한다. 코드가 아니라 문서가 프로젝트의 기억이다.

QA는 "전부 한 번에"보다 "5개씩 반복"이 낫다. 끝나는 조건을 명시하면 무한루프도 막는다.

> 에이전트가 많이 움직일수록 내가 덜 하는 게 아니라, 내가 확인해야 할 게 더 많아진다.
