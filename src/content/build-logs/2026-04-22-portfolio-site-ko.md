---
title: "deploy 폴더 하나로 홈 리디자인: Claude Code 에이전트 106회 tool call 기록"
project: "portfolio-site"
date: 2026-04-22
lang: ko
tags: [claude-code, astro, homepage, refactor, agent-orchestration]
description: "'deploy 폴더 내용 jidonglab에 적용해줘' 한 줄 명령이 106회 tool call, 3시간 26분짜리 세션이 됐다. 폴더 탐색부터 컴포넌트 분리, 스타일 분리까지 전 과정을 기록한다."
---

"deploy 폴더에 있는거 jidonglab에 다 적용해줘."

이 한 줄짜리 프롬프트로 시작한 세션이 106회 tool call, 3시간 26분짜리 작업으로 이어졌다.

**TL;DR** `~/portfolio/deploy/`에 모아둔 홈 리디자인 파일들을 portfolio-site에 통합. `src/components/home/`, `src/data/home.ts`, `src/styles/home.css` 신규 생성, `index.astro` 리팩토링 완료.

## 에이전트가 먼저 해야 했던 것: 폴더 탐색

`deploy` 폴더가 홈 디렉토리에 없었다. 에이전트가 `~/` 전체를 탐색해서 위치를 찾아야 했다. `jidonglab`이라는 이름도 마찬가지 — 실제 레포 이름이 `portfolio-site`라서 매핑이 필요했다.

```bash
# 에이전트가 실행한 흐름 (단순화)
find ~/ -name "deploy" -type d 2>/dev/null
# → ~/portfolio/deploy 발견
ls ~/portfolio/portfolio-site/src/pages/index.astro
# → 19,200바이트 Astro 파일 존재 확인
```

이 탐색에만 `Bash` + `Glob` 호출이 여러 차례 들어갔다. 명시적인 경로를 넘겨줬으면 10분을 절약했을 것이다.

## 기존 index.astro의 문제

19.2K짜리 `index.astro` 파일 하나에 홈 전체가 들어 있었다. 컴포넌트 분리 없이 인라인으로 마크업이 쌓인 구조. 에이전트가 "기존 구조에 그냥 붙여넣을지 vs 컴포넌트로 쪼갤지"를 물었고, 나는 "너 추천대로 해"로 답했다.

에이전트의 선택:

- `src/components/home/` — 섹션별 컴포넌트 분리
- `src/data/home.ts` — 하드코딩된 데이터 분리
- `src/styles/home.css` — 홈 전용 스타일 격리
- `index.astro` — import 껍데기로 축소

관심사가 나뉘면 나중에 콘텐츠는 `home.ts`만 건드리면 된다. 구조 결정을 에이전트에게 위임했는데, `deploy` 폴더 코드에 의도가 충분히 드러나 있어서 가능했던 것이다.

## tool call 분포

106회 중 주요 도구 비율:

- `Read` / `Glob` / `Grep` — 탐색 약 30회: deploy 폴더 구조 파악, 기존 코드 독해
- `Write` / `Edit` — 실제 작업 약 40회: 컴포넌트 생성, index.astro 수정
- `Bash` — 빌드 확인 약 20회: `astro check`, 타입 오류 확인
- `Agent` — 독립 서브태스크 위임 약 15회

탐색에 전체의 30%가 소요됐다. 프로젝트 구조와 경로를 미리 컨텍스트로 넘기면 이 비율을 절반으로 줄일 수 있다.

## 4월 17~21일 세션 전체 맥락

이번 portfolio-site 작업은 총 6개 세션 중 마지막에 있었다. 나머지 세션에서 병렬로 처리한 것들:

**DEV.to 자동 발행 파이프라인** (세션 2, 148회 tool call): `launchd` plist + `publish.yml` 수정으로 6시간 간격 자동 발행 구축. `publish.yml:205`에 하드코딩된 `"published": False`를 `should_publish` 변수 참조로 바꾸는 게 핵심이었다.

**spoonai.me 버그 수정** (세션 3, 162회 tool call): `ArticleCard.tsx:148`에서 `post.source.title`이 기사 전체 제목으로 찍히던 문제. 스킬 스펙 2곳 수정 + 기존 MD 24개 일괄 도메인→퍼블리셔명 교체.

**치과 광고 리서치** (세션 4, 182회 tool call): 에이전트 12개 병렬 실행, 각 2,500~4,500자 리포트. `dentalad/ads-research/reports/` 아래 10여 개 파일 생성.

세션별 tool call 합계만 약 600회. 같은 기간 혼자 했다면 일주일은 걸렸을 작업량이다.

## 프롬프트에서 배운 것

효과적이었던 것:

> "너 추천대로 해"

컨텍스트가 코드에 있을 때는 구조 결정을 위임해도 된다. `deploy` 폴더가 의도를 드러내고 있었기 때문에 에이전트가 합리적인 선택을 했다.

실패한 패턴:

> "deploy 폴더에 있는거 jidonglab에 다 적용해줘"

경로 없이 이름만 넘기면 탐색 비용이 생긴다. `~/portfolio/deploy → ~/portfolio/portfolio-site` 처럼 처음부터 절대 경로를 주는 게 낫다. 에이전트가 추론할 수 있다고 해서 추론하게 두는 건 비효율이다.

## 변경된 파일

```
M  src/pages/index.astro
?? src/components/home/
?? src/data/home.ts
?? src/styles/home.css
```

아직 미커밋 상태. `astro build` 통과 확인 후 밀어낼 예정이다.
