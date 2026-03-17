---
title: "Claude Code로 4개 프로젝트를 동시에: 813 tool calls, 3일의 기록"
project: "portfolio-site"
date: 2026-03-18
lang: ko
tags: [claude-code, monorepo, automation, multi-project]
description: "빈 레포에서 LLM 라우팅 앱을 하루 만에 뼈대까지 세웠다. 같은 기간에 포트폴리오 허브 전환, 치과 웹사이트 콘텐츠 업데이트, 사주 앱 토스페이먼츠 심사까지. 813 tool calls, 4개 프로젝트, 3일."
---

빈 레포지토리 하나가 있었다. `git@github.com:jee599/llmmixer_claude.git`. 커밋이 하나도 없었다.

**TL;DR** SPEC.md 한 장을 던지고 "구현해줘"를 눌렀다. 370 tool calls 뒤에 Next.js 대시보드가 달린 멀티패키지 monorepo가 올라왔다. 같은 기간에 포트폴리오, 치과, 사주 앱까지 총 4개 프로젝트를 동시에 건드렸다.

## 빈 레포 + SPEC.md → monorepo

세션 1의 시작 프롬프트는 단순했다.

```
/Users/jidong/Downloads/SPEC.md 이거 구현해줘.
구현계획을 조금 촘촘하게 일단 세워서 구현계획 md를 만들어줘
```

Claude가 먼저 `IMPLEMENTATION_PLAN.md`를 만들었다. Phase 0부터 3까지 구조화된 계획이다. Phase 0은 프로젝트 초기 셋업, Phase 1은 CLI + 대시보드 서버 + Claude 어댑터, Phase 2는 LLM Decomposer + Router + WorkflowEngine, Phase 3는 Codex/Gemini 어댑터.

계획이 나오자 "각 phase 구현하고 피드백 후 최대 3번 수정, 그리고 다음 Phase"를 지시했다. 스스로 피드백하고 고치는 루프를 돌리도록 했다.

이 세션에서 Write가 93번, Bash가 151번, Read가 66번, Edit이 52번 나왔다. 파일 93개가 새로 생겼다. `packages/core/`와 `packages/dashboard/` 두 패키지, `bin/`, `config/templates/`까지 골격이 완성됐다.

npm workspace 의존성에서 한 번 걸렸다. `workspace:*` 프로토콜을 쓰고 있었는데 npm이 지원하지 않는 형식이었다. 빌드가 깨졌다. Claude가 `package.json`을 수정해서 해결했다.

Phase 0 셀프 리뷰에서 스스로 3가지 문제를 잡아냈다. `outputFileTracingRoot` 경고, dev 서버 프로세스 처리, `tsconfig.json` 모듈 호환성. 사람이 지적하지 않아도 찾아냈다는 게 인상적이었다.

## Hydration 에러와 Gemini 인증 문제

세션 중에 두 가지 큰 에러가 터졌다.

하나는 SSR hydration 에러였다. `tree hydrated but some attributes of the server rendered HTML didn't match the client properties`. 날짜 포맷, `window` 분기, `Math.random()` 같은 서버/클라이언트 불일치가 원인이다. 에러 스택을 그대로 붙여넣자 Claude가 해당 컴포넌트에서 `typeof window !== 'undefined'` 분기를 찾아내 수정했다.

또 하나는 Gemini CLI 인증 문제였다. `Please set an Auth method in your settings.json` 에러. 여기서 방향이 바뀌었다.

```
아니 claude api로 안 쓰고 cli 구독모델로 쓸거라고
```

Claude API를 직접 호출하는 대신 Claude Code CLI를 subprocess로 실행하는 방식으로 전환했다. 어댑터 구조가 유연하게 설계된 덕에 `adapters/claude.ts`만 수정하면 됐다.

## 포트폴리오 허브 전환

세션 2는 구현 플랜을 직접 붙여서 시작했다.

```
Implement the following plan:

# jidonglab 포트폴리오 허브 리뉴얼

jidonglab.com을 AI 뉴스/블로그 사이트가 아니라
프로젝트 포트폴리오 허브로 전환한다.
```

이 방식이 빠르다. 뭘 만들지 Claude가 파악하는 시간이 없다. 플랜이 명세서 역할을 한다.

`admin.astro`가 58KB였다. 기존 코드를 읽고 파악한 다음, Projects 탭과 Build Logs 탭을 추가했다. `scripts/project-registry.yaml`로 로컬 git 경로를 관리하고, `src/content/projects/`에 YAML을 두고, `visible` 필드로 공개 여부를 제어하는 구조를 만들었다.

세션 2의 tool call 분포를 보면 Bash 213번, Edit 44번, Read 41번, Write 19번이다. Bash가 압도적인 건 파일 존재 확인, `npm install` 결과 체크, git 상태 확인 같은 짧은 명령들이 쌓이기 때문이다. 실제 코드 생산과 직결되는 건 Edit + Write인데, 이 두 개를 합쳐도 Bash의 절반 수준이다.

`admin-projects.ts`에서 GitHub API 403 에러가 났다. 원인은 구조 문제였다. 로컬 YAML을 수정해야 하는데 GitHub API로 우회하고 있었다. GitHub API를 완전히 제거하고 파일 시스템 직접 접근 방식으로 바꿨다. rate limit 걱정도 없어졌다.

## Dev.to SEO: 한국어 게시물 전량 내리기

세션 2 후반에 Dev.to에 올라간 한국어 게시물 처리를 했다.

```
devto사이트에서 한글로 된 거 다 내려주고
지금 올라간 기능들에 구글검색 잘되게 하거나,
후킹, 유입이나 광고가 잘되게 세팅되어 있는지 확인해줘
```

Dev.to는 영어 독자 플랫폼이다. 한국어 게시물은 노출이 안 된다. Claude가 Dev.to API로 published 상태를 false로 일괄 변경하고, 기존 영어 게시물들의 제목과 태그를 SEO 관점에서 재검토했다.

"Claude Code로 빌드 로그 자동화" 같은 제목보다 "I automated my build logs using Claude Code's JSONL files — here's how" 방식이 클릭률이 높다. 숫자와 결과가 제목에 있을 때 차이가 난다.

## 세션 3, 4: 클라이언트 프로젝트 빠른 처리

세션 3은 17분, 73 tool calls였다. 치과 웹사이트 업데이트다.

원장 3명의 진료 시간표, 임플란트에 구강외과전문의 강조, 소아치과 제거, 턱관절 치료 섹션 신설. `site-data.ts`를 중심으로 데이터를 수정하고, `doctors/page.tsx`와 `services/page.tsx`를 새로 만들었다.

세션 4는 9분, 39 tool calls였다. 사주 앱 토스페이먼츠 계약 심사 요구사항 처리다.

```
현재 홈페이지 하단 정보가 확인되지 않아 해당 부분 수정 요청 드립니다.
1. 결제 가능한 상품이나 서비스를 1개 이상 올려주세요.
2. 홈페이지 하단에 사업자정보를 기재해주세요.
```

토스페이먼츠 담당자 메일을 그대로 붙여넣었다. 요구사항이 4가지였는데 코드 작업이 필요한 건 2가지, 나머지는 코드 밖의 일이었다.

원인은 `.constellationPage`의 CSS 문제였다. `overflow: hidden; height: 100vh`가 설정되어 있어서 사업자정보 푸터가 뷰포트 밖에 숨겨져 있었다. Claude가 CSS를 찾아내고 홈 페이지에 pricing 섹션까지 렌더링했다. 이미 i18n 파일에 `pricing` 키가 8개 로케일 전부 준비되어 있었다. 쓰지 않고 있었을 뿐이었다.

## 스킬과 플러그인 탐색

세션들 사이에서 Claude Code 스킬 생태계를 탐색했다. superpowers, engineering-skills, product-skills, marketing-skills를 설치했다. 아직 본격적으로 활용한 건 superpowers의 brainstorming과 writing-plans 정도다.

설치 후 느낀 건 스킬 자체보다 "어떤 작업에 어떤 스킬을 쓸지" 판단이 더 중요하다는 것이다. 스킬이 많아질수록 선택 비용이 생긴다.

## 3일 813 tool calls 돌아보기

전체 통계다. 4개 세션, 813 tool calls. 도구별로 Bash 395번, Read 137번, Write 116번, Edit 116번, Grep 15번, Agent 14번이다. 생성 77개, 수정 40개.

두 가지 패턴이 효과적이었다.

첫 번째는 플랜 선행이다. 세션 2처럼 구현 플랜을 붙여서 시작하면 탐색 비용이 줄어든다. Claude가 뭘 만들지 파악하는 단계를 건너뛴다.

두 번째는 에러 원문 붙여넣기다. 세션 3, 4처럼 에러 메시지나 요구사항을 그대로 붙여넣으면 Claude가 문맥을 정확히 파악한다. "이거 왜 안 돼?"보다 에러 스택이나 이메일 전문이 훨씬 빠르다.

반면 세션 1 후반처럼 "다시 고치고 모든 기능이 의도대로 동작하도록"은 목표가 모호했다. 반복 수정이 늘었다. 기대 동작을 구체적으로 주는 게 빠르다.

> 더 나은 프롬프트를 쓰는 건 Claude를 위한 게 아니다. 내 시간을 아끼는 거다.
