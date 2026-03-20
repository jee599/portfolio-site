---
title: "Claude Code 605번 호출로 포트폴리오 사이트를 허브로 바꾼 기록"
project: "portfolio-site"
date: 2026-03-20
lang: ko
tags: [claude-code, astro, parallel-agents, automation, github-api]
description: "605번의 tool call, Bash 355번. jidonglab.com을 AI 뉴스 사이트에서 프로젝트 포트폴리오 허브로 전환했다. GitHub API 3연타 에러, DEV.to 한글 버그, 빌드 타임아웃까지."
---

605번. Bash 355번, Edit 99번, Read 91번. 한 세션에서 Claude가 호출한 tool 수다.

숫자가 크다고 좋은 게 아니다. 이 세션은 한 방향으로 쭉 나아간 작업이 아니었다. 같은 버그를 세 번 고치고, 에러가 나면 에러를 고치고, 고쳤더니 다른 곳에서 또 에러가 나는 구조였다. 그 과정이 그대로 숫자에 찍혔다.

**TL;DR** jidonglab.com을 AI 뉴스 블로그에서 프로젝트 포트폴리오 허브로 전환했다. JSONL 기반 빌드 로그 자동화, GitHub API 연동 Admin, 병렬 에이전트 리디자인까지. 빌드 타임아웃이라는 예상 못한 버그도 있었다.

## 왜 바꿨나

로컬에 git 프로젝트가 11개 있는데 포트폴리오에는 7개만 등록돼 있었다. 빌드 로그는 수동으로 썼다. 사이트는 AI 뉴스를 자동으로 올리는 기계처럼 돌아가는 동안, 내가 실제로 만들고 있는 것들은 제대로 보이지 않았다.

방문자한테 "이 사람이 뭘 만드는 사람인지"가 전달이 안 됐다. 그게 문제였다.

프롬프트는 구현 계획서 형식으로 던졌다.

```
jidonglab.com을 AI 뉴스/블로그 사이트가 아니라 프로젝트 포트폴리오 허브로 전환한다.
로컬에 11개 git 프로젝트가 있지만 포트폴리오에는 7개만 등록되어 있고,
빌드 로그는 수동 생성이다.

원하는 흐름:
1. CLI로 빌드 로그 생성
2. Admin에서 프로젝트 관리 + 빌드 로그 발행
```

`admin.astro`가 58KB짜리 파일이었다. Claude는 이걸 읽으면서 6단계 구현 계획을 잡았다. `project-registry.yaml` 생성, Content Collection 스키마 변경, CLI 스크립트, API 엔드포인트, Admin 탭 추가, DevTo 연동. Bash 355번을 실행하면서 하나씩 구현했다.

## JSONL이 빌드 로그가 된다

"jsonl 기준으로 빌드로그를 뽑는게 좋은데" — 이 한 문장에서 자동화 파이프라인이 만들어졌다.

Claude Code는 대화 내역을 로컬 `~/.claude/projects/` 아래에 세션별 JSONL 파일로 남긴다. 사용자 프롬프트, tool call, 결과가 전부 기록된다. 이걸 파싱하면 "내가 무슨 작업을 했는지"를 자동으로 뽑을 수 있다.

`parse-sessions.py`가 JSONL을 읽어서 프로젝트별 세션을 필터링하고 작업 요약 JSON을 만든다. `generate-build-log.sh`가 그걸 Claude API에 던지면 마크다운 빌드 로그 초안이 나온다. GitHub Actions에 연결하면 git push마다 자동으로 빌드 로그가 생성된다.

이 글도 그 파이프라인에서 나온 세션 데이터를 소재로 하고 있다.

"로컬 cron이랑 croncreate가 뭐가 다른데?" 라는 질문도 나왔다. 로컬 cron은 컴퓨터가 켜져 있을 때만 돈다. GitHub Actions는 클라우드에서 스케줄대로 돌아간다. 안정성을 위해 GitHub Actions를 선택했다.

## GitHub API 403 → 409 → 422

Admin 페이지에서 프로젝트 설정을 바꾸면 YAML 파일이 GitHub에 직접 커밋되는 구조를 만들었다. GitHub Contents API를 쓰는 방식이다. 에러가 3단계로 나왔다.

403이 먼저 떴다. GitHub Personal Access Token에 `repo` 스코프가 없었다. 토큰을 다시 발급했다.

그다음 409.

```
src/content/projects/news4ai.yaml does not match 7cc02a8819f7f2704cbcdf17f10e0035c78abb6e
```

파일을 업데이트할 때는 현재 파일의 SHA를 함께 보내야 한다. 오래된 SHA를 보내고 있었다. `GET /contents/{path}`로 현재 SHA를 먼저 조회하고, `PUT` 요청에 포함하도록 수정했다.

그다음 422.

```
"sha" wasn't supplied.
```

신규 파일을 만들 때는 SHA가 없어야 하는데 빈 문자열을 보내고 있었다. 파일 존재 여부를 먼저 확인해서, 신규면 SHA 필드 자체를 빼는 분기를 추가했다.

"테스트해서 완벽하게 돌아갈때까지 수정해" 프롬프트 하나로 Claude가 반복 수정을 했는데, 에러가 바뀌는 패턴이 처음부터 예측 가능한 상황이었다. GitHub API docs를 처음에 같이 넘겼으면 한 번에 됐을 작업이다.

## DEV.to에 한글이 세 번 올라갔다

예상 못 한 버그였다. DEV.to는 영어 독자 전용인데 한국어 빌드 로그가 계속 올라갔다.

한 번 "내려줘"라고 했다. 내렸다. 다음 날 또 올라가 있었다. "왜 또 올라가"라고 했다. 고쳤다. 또 올라갔다.

로직이 두 군데 흩어져 있었다. `publish-to-devto.yml` GitHub Actions에서 `lang` 필터가 제대로 동작하지 않았고, `sync-devto.ts` API 레이어에도 별도 로직이 있었다. 한 곳만 고치면 다른 곳에서 또 발행했다.

"이제 절대 안올라가지? devto에는? 빌드 로그는 jidonglab 전용이야" — 이 확인 이후에 두 파일을 동시에 수정하면서 끝났다.

Claude Code는 고친 파일에 집중하는 경향이 있다. 같은 로직이 다른 파일에 있는지 능동적으로 확인하지 않는다. 중요한 제약은 관련 파일을 직접 지정하거나, 반복해서 명시해야 한다.

## 빌드 타임아웃 — 가장 황당했던 버그

배포 후 Cloudflare Pages 빌드가 타임아웃으로 죽었다.

```
Failed: build exceeded the time limit and was terminated
```

원인은 `ProjectCard.astro`였다. 컴포넌트 안에서 `getCollection('build-logs')`를 직접 호출하고 있었다. 프로젝트 카드가 9개면 빌드 시간에 컬렉션 조회가 9번 반복된다. 빌드 로그 글이 24개 있으니 총 216번의 파일 읽기가 일어난다.

해결은 간단했다. `ProjectCard`에서 `getCollection` 호출을 제거하고, 필요한 빌드 로그 데이터를 부모 컴포넌트에서 props로 내려주도록 바꿨다.

```
fix: ProjectCard에서 getCollection 제거 → 빌드 타임아웃 해결
```

컴포넌트가 직접 데이터를 조회하면 안 된다는 기본 원칙인데 놓쳤다. 로컬에서는 멀쩡히 돌아가다가 배포 환경에서만 터지는 종류의 버그다.

## 병렬 에이전트로 리디자인

"전체적으로 사이트 리디자인 해줘. 프로젝트가 제일 메인이야."

AgentCrow가 에이전트 2명을 병렬로 dispatch했다.

```
🐦 AgentCrow — dispatching 2 agents:
1. @frontend_developer → "홈페이지 리디자인 — 프로젝트 중심 구성"
2. @frontend_developer → "Base 레이아웃 nav + footer 개선"
```

`index.astro`와 `Base.astro`가 서로 다른 에이전트에 의해 동시에 수정됐다. 파일 단위로 작업을 나눴기 때문에 충돌이 없었다.

프로젝트 정렬 순서는 나중에 한 마디로 조정됐다.

```
beta는 베타 운영 중이란 뜻인데, 그래서 2번째여야 할 것 같아
```

운영중 → 베타 → 개발중 → 중단. 이 순서가 됐다.

병렬 에이전트를 쓸 때 핵심은 파일 단위 분리다. 같은 파일을 두 에이전트가 동시에 수정하면 충돌이 난다. dispatch 전에 작업 범위를 파일 수준으로 나누는 것이 먼저다.

## 숫자로 본 이번 작업

이번 세션에서 변경된 파일은 36개. 새로 생성된 파일은 18개. 수정된 프로젝트 수는 9개다.

Bash 355번 중 상당수는 빌드 확인(`npm run build`)과 타입 체크(`tsc --noEmit`)였다. 코드를 고칠 때마다 빌드가 통과하는지 확인하는 루프다. 이 패턴이 에러를 조기에 잡는다.

반대로 에러 메시지를 보고 반복 수정하는 루프는 비효율적이다. GitHub API 3연타가 그 예다. 스펙을 먼저 읽고 구현했으면 tool call이 절반은 줄었을 것이다.

> 자동화는 "내가 뭔가를 하는 과정"을 기록으로 바꾸는 일이다. 코드를 짜는 동안 블로그가 쌓인다.
