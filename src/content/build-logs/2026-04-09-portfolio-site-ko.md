---
title: "같은 버그를 5번 고쳤다 — overflow-x 삽질과 하루 전면 리디자인"
project: "spoonai-site"
date: 2026-04-09
lang: ko
tags: [claude-code, debugging, mobile, design, parallel-agents]
description: "14세션 624 tool calls, 하루 만에 spoonai.me 전면 리디자인. overflow-x 버그는 5번 수정했다. 같은 버그를 반복하지 않는 디버깅 패턴과 병렬 에이전트 활용법."
---

14세션, 624 tool calls, 수정된 파일 39개. 2026년 4월 6일 하루에 일어난 일이다.

**TL;DR** spoonai.me 모바일 horizontal scroll 버그를 5번 고쳤고, 결국 근본 원인을 찾았다. 그 사이에 다크모드 + Cmd+K 검색 + 인디고 컬러 전면 리디자인까지 끝냈다.

## 같은 버그를 5번 고쳤다

horizontal scroll은 하루 종일 따라다녔다. 세션 1에서 고쳤다고 생각했는데 세션 2에서 다시 나왔다. 세션 4, 6, 11에서도 반복됐다.

각 세션에서 내가 적용한 수정은 이랬다.

- 세션 1: `overflow-x: clip` 추가. iOS 15 이하 Safari는 `clip`을 `visible`로 fallback한다는 걸 몰랐다
- 세션 2: `html { overflow-x: hidden }` 추가 + 전역 `img { max-width: 100% }` — body에만 clip을 걸면 html이 스크롤되면 무시됨
- 세션 6: body의 clip에서 html의 hidden으로 교체 (같은 수정을 다른 방향으로)
- 세션 11: 드디어 근본 원인 발견 — `HomeContent.tsx:98`의 `-mx-5 px-5` 네거티브 마진, `BlogList.tsx:33`의 `-mx-4` 네거티브 마진

symptom을 고칠 때마다 다른 곳에서 똑같이 튀어나왔다. 세션 11에서 `systematic-debugging` 스킬을 제대로 적용한 뒤에야 실제 원인을 잡았다.

```bash
grep -r "\-mx-\|\-ml-\|\-mr-\|w-screen\|100vw" components/
```

이 명령어 하나로 네거티브 마진 2곳을 발견했다. 처음부터 이렇게 했으면 5번 반복할 필요가 없었다.

## 디자인 스킬 설치와 전면 리디자인

세션 5에서 `frontend-design`과 `ui-ux-pro-max` 스킬을 설치했다.

```bash
npx skills add anthropics/claude-code --skill frontend-design
```

`ui-ux-pro-max`는 658줄짜리 스킬이다. 50+ UI 스타일, 161 컬러 팔레트, 57 폰트 페어링, 99 UX 가이드라인. 설치 후 글로벌 `~/.claude/skills/`에도 복사해서 다른 프로젝트에서도 쓸 수 있게 했다.

Opus가 스킬을 읽고 내린 진단은 날카로웠다.

> "Apple 클론 느낌에 머물고 있다. Vercel, Linear, Raycast 같은 모던 테크 사이트들은 고유한 브랜드 아이덴티티가 있다."

색상이 `#0071e3` (Apple 블루) 그대로였고, 전체 레이아웃이 apple.com 구조를 그대로 따랐다. Pretendard, `#fbfbfd` 배경, hairline 보더까지 — Apple의 시각 문법을 충실히 복사하고 있었다.

## Opus 1개로 전면 리디자인: 다크모드 + Cmd+K 검색

세션 12가 가장 크고 복잡한 세션이었다. 148 tool calls, 7시간 33분.

다크모드, Cmd+K 검색 커맨드 팔레트, 인디고(`#4f46e5`) 컬러 시스템, 탭 전환 애니메이션, TOC, 소셜 공유 버튼을 한 세션에 구현했다. CSS 변수 기반 다크/라이트 전환이라 `prefers-color-scheme`도 자동 지원한다.

세션 14에서는 병렬 에이전트 3개로 남은 디자인 개선을 처리했다.

```
🐦 AgentCrow — Dispatching 3 agents:
1. @frontend_developer → HomeContent.tsx + ArticleCard.tsx (hero, 브랜드 컬러, TOP 배지)
2. @frontend_developer → PostContent.tsx (소셜 공유, TOC, 소스 링크 스타일)
3. @frontend_developer → DailyBriefing.tsx + content.ts (밸류 프로포지션, 레이아웃)
```

파일 수정 범위가 겹치지 않도록 에이전트별 스코프를 명시했다. 3개가 동시에 돌아가면서 메인 세션 tool calls는 9개로 줄었다.

## Vercel CANCELED: 연속 push의 함정

하루 종일 Vercel 배포가 CANCELED 상태였다. 처음엔 빌드 오류인 줄 알았다.

실제 원인은 단순했다. 빠른 연속 push가 들어오면 Vercel이 이전 빌드를 자동 취소한다. 수정 커밋과 빈 커밋을 연달아 보내면 둘 다 취소된다.

해결책은 두 가지였다. 하나는 `vercel --prod` CLI로 직접 배포하는 것:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" /opt/homebrew/bin/vercel --prod
```

다른 하나는 단일 커밋만 push하고 기다리는 것. 이후 세션에서는 `git push`를 CANCELED 상태 그대로 두고 `vercel --prod`로 직접 배포했다.

## 로고 이미지 93% 압축

세션 10 성능 최적화에서 `sips`로 로고 이미지를 확인했더니 2220×1501px PNG였다. 표시 크기(200×73)의 11배.

```bash
sips -Z 400 public/images/logo.png
```

737KB → 49KB. 93% 감소. Next.js가 WebP로 변환해서 서빙하지만 소스 파일이 크면 cold start와 git 크기가 커진다.

나머지 포스트 이미지는 리사이즈 후 오히려 더 커진 것들이 있어서 git으로 복원했다. PNG의 경우 해상도를 낮춰도 파일 크기가 늘어나는 경우가 있다. `sips`로 리사이즈 전에 JPEG 변환 여부를 먼저 확인해야 한다.

## 도구 사용 통계

| 도구 | 횟수 |
|------|------|
| Bash | 218 |
| Read | 173 |
| Edit | 100 |
| TodoWrite | 38 |
| Glob | 25 |
| Write | 17 |
| Agent | 16 |
| Grep | 15 |

Agent 16번은 대부분 세션 12와 14의 병렬 디자인 에이전트다. 에이전트 1개당 평균 40~50 tool calls를 처리했으니, 메인 컨텍스트에 약 800 tool calls를 절약한 셈이다.

Grep은 15번으로 가장 적게 썼다. horizontal scroll 디버깅을 처음부터 Grep으로 했다면 5번 반복하지 않았을 것이다.
