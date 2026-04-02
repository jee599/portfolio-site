---
title: "치과 사이트 10개 페이지, 3시간에 전부 뜯어고친 방법"
project: "portfolio-site"
date: 2026-04-03
lang: ko
tags: [claude-code, next-js, tailwind, ui-design, mobile]
description: "uddental 동백유디치과 사이트를 3시간 만에 전면 개편. 10개 페이지 동시 수정, 플로팅 진료표 컴포넌트 신규 제작, 모바일 대응까지. Edit 76번, Bash 47번, 총 171 tool calls."
---

"진짜 최악이야 지금 디자인"이라는 스크린샷 한 장이 3시간짜리 작업의 시작이었다.

**TL;DR** uddental 치과 사이트를 Claude Opus 4.6으로 3시간 만에 10개 페이지 전면 개편. 디자인 임팩트 개선 + 플로팅 진료표 신규 제작 + 모바일 대응까지. 총 171 tool calls.

## "큼직큼직 임팩트 있게" — 추상적 요청을 구체적 수치로

첫 프롬프트는 이랬다.

> "지금 걸로 배포해주는데, 디자인 좀 더 큼직큼직 임팩트 있게 바꿔줘. 확인 받고 배포해"

이런 요청은 계획 단계가 핵심이다. Claude가 파일을 먼저 읽고 변경 방향을 제안했다.

히어로 높이를 `70-80vh`에서 `90vh`로, 헤드라인을 `5xl`에서 `7xl`로. 섹션 타이틀은 `4xl`에서 `5xl~6xl`, 통계 숫자는 `5xl`에서 `6xl~7xl`로 강조. 계획 승인 없이 바로 코드를 건드렸다면 방향이 틀렸을 때 되돌리는 비용이 컸다. 10개 페이지에 동일한 패턴을 적용해야 하므로 기준을 먼저 잡는 게 맞다.

## 병렬 Edit으로 10개 파일 동시 수정

승인 후 전략은 병렬 Edit이었다. 페이지마다 순차적으로 수정하면 누락이 생기고 일관성도 떨어진다.

파악한 파일 목록: `page.tsx`, `about/page.tsx`, `services/page.tsx`, `doctors/page.tsx`, `facilities/page.tsx`, `contact/page.tsx`, `location/page.tsx`, `PageHero.tsx`, `FloatingReservation.tsx`, `globals.css`.

한 번의 응답에 Edit 도구를 여러 번 호출해 병렬로 처리했다. 전체 10개 페이지 공통 패턴:

```tsx
// Before
<section className="py-16">
  <h2 className="text-4xl">

// After
<section className="py-32">
  <h2 className="text-6xl">
```

`PageHero` 공통 컴포넌트가 있어서 히어로 변경은 한 곳만 고치면 됐다. 공통 컴포넌트의 가치가 여기서 드러난다.

## 삽질 1: npm이 엉뚱한 디렉토리를 찾다

빌드 확인 중 이런 에러가 떴다.

```
npm error path /Users/jidong/package.json
npm error enoent Could not read package.json
```

`/Users/jidong`에서 `npm`을 실행했기 때문이다. 작업 디렉토리가 `/Users/jidong/uddental/implementations/claude/`인데, Bash 도구가 홈 디렉토리에서 실행된 것. 절대 경로를 명시적으로 지정해서 해결했다.

```bash
cd /Users/jidong/uddental/implementations/claude && npm run build
```

별것 아닌 실수지만, 여러 프로젝트를 넘나들 때 자주 발생한다.

## 삽질 2: webpack 런타임 에러의 미로

더 짜증스러운 건 이거였다.

```
Cannot find module './611.js'
Require stack: ...webpack-runtime.js
```

그리고 조금 뒤엔 `__webpack_modules__[moduleId] is not a function`까지 등장했다. Next.js 15 + webpack 조합에서 `.next/` 캐시가 오염된 경우다. 해결법은 단순하다.

```bash
rm -rf .next && npm run build
```

클린 빌드 후 정상. 이 에러가 처음엔 컴포넌트 코드 문제처럼 보여서 잠깐 헤맸다. webpack 에러는 80%가 캐시 문제다.

백그라운드 dev 서버 태스크도 exit code 144, 56으로 두 번 실패했다. 결국 절대 경로 + 올바른 디렉토리 지정으로 세 번째에 성공했다. 에러 코드만 봐서는 원인이 불명확해서 경로부터 의심하는 게 맞다.

## FloatingSchedule — 중간에 추가된 요구사항

작업 중간에 새 기능 요청이 들어왔다.

> "메인에서 이번주 진료표 플로팅해서 보이고, 끌 수 있게 해줘"

진료 데이터는 텍스트로 직접 붙여넣어 줬다. 박 원장, 권 원장, 조 원장의 요일별 진료 여부. `FloatingSchedule.tsx`를 신규 생성했다. 요구사항이 중간에 추가됐을 때 별도 컴포넌트로 분리하는 게 맞다. `page.tsx`에 인라인으로 넣었다가 나중에 수정 범위가 커진다.

```tsx
const SCHEDULE = {
  박: { 월: true, 화: true, 수: false, 목: false, 금: true, 토: true },
  권: { 월: true, 화: true, 수: true, 목: true, 금: false, 토: false },
  조: { 월: false, 화: false, 수: false, 목: false, 금: true, 토: false },
}
```

닫기 버튼은 로컬 스테이트로, 재방문 시 다시 보이도록 했다. `localStorage`로 영구 닫기를 구현하면 사용자가 진료표를 못 보는 경우가 생겨서 세션 기반으로만 처리했다.

## 모바일 대응은 처음부터 챙겼어야 했다

배포 직전에 이 질문이 나왔다.

> "모바일 고려했어?"

처음 프롬프트에 모바일 언급이 없었고, 데스크톱 기준으로 작업하다 보니 누락됐다. 결국 별도 라운드가 필요했다.

```tsx
// Before: 고정 크기
<h1 className="text-7xl">

// After: 반응형
<h1 className="text-4xl md:text-6xl lg:text-7xl">
```

교훈: 디자인 작업 시작 전에 모바일 대응 여부를 프롬프트에 명시해야 한다. 나중에 추가하면 작업량이 배로 늘어난다.

## 도구 사용 통계

3시간 2분, 171 tool calls.

Edit 76회(44%), Bash 47회(27%), Read 23회(13%), Write 14회(8%), Agent 3회(2%). Edit이 절반 가까이인 건 10개 페이지 전면 수정 때문이다. Bash 47번 중 상당수는 빌드 실패 재시도였다. 클린 빌드 포함 5회 이상 빌드를 돌렸다.

## 배포 확인과 Vercel MCP

로컬 빌드 성공 후 `mcp__claude_ai_Vercel__web_fetch_vercel_url`로 배포 URL을 직접 확인했다. 브라우저를 켜지 않아도 응답 코드와 HTML을 Claude가 받아볼 수 있다. Vercel MCP가 있으면 "배포 상태 어때?"라고 물었을 때 Claude가 직접 체크한다. 도구 하나가 맥락 전환 비용을 없애준다.

## 결론

단순한 "디자인 개선" 요청이 10개 파일 수정 + 신규 컴포넌트 제작 + 모바일 대응으로 확장됐다. 3시간이 걸린 이유는 삽질(webpack 캐시, npm 경로) + 중간 요구사항 추가(진료표) 때문이었다.

처음부터 명확한 요구사항이 있었다면 1.5시간으로 끝낼 수 있었다. "큼직큼직하게, 모바일도 고려해서, 진료표 플로팅 추가"를 첫 프롬프트에 다 넣었으면 한 번의 계획 사이클로 처리됐다. 프롬프트 품질이 작업 시간을 직접 결정한다.
