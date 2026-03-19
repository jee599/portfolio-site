---
title: "Claude Code로 4개 프로젝트 동시 진행 — 포트폴리오 허브 전환기"
project: "portfolio-site"
date: 2026-03-19
lang: ko
tags: [claude-code, astro, github-api, automation]
description: "하루에 423번 도구를 호출하면서 jidonglab을 포트폴리오 허브로 전환했다. GitHub API 403 에러, 병렬 에이전트 번역, Admin 기능 확장까지."
---

하루에 Claude Code 세션 9개를 돌렸다. 그 중 메인 세션 하나가 73시간짜리였다.

**TL;DR** jidonglab.com을 AI 뉴스 블로그에서 프로젝트 포트폴리오 허브로 전환하면서, Claude Code로 admin 기능 확장·GitHub API 연동·번역 자동화를 한 세션에 모두 처리했다.

## 계획서 없이 시작하면 Claude가 엉뚱한 걸 만든다

세션을 시작하면서 프롬프트를 이렇게 넣었다.

```
Implement the following plan:

# jidonglab 포트폴리오 허브 리뉴얼

로컬에 11개 git 프로젝트가 있지만 포트폴리오에는 7개만 등록되어 있고,
빌드 로그는 수동 생성이다.
```

계획서를 먼저 작성해서 프롬프트에 통째로 넣는 게 이 프로젝트의 기본 작업 방식이다. 계획서 없이 "어드민 페이지 개선해줘"라고 넣으면 Claude는 맥락 없이 움직이고, 결국 다시 읽어야 하는 코드가 쌓인다.

이번 계획서에는 Step 1부터 Step 5까지 구현 순서를 명시했다. `src/content/config.ts` 스키마에 `visible` 필드 추가, `project-registry.yaml` 생성, `generate-build-log.sh` 스크립트 작성, API 엔드포인트, Admin 탭 추가 순서였다. Claude는 이 순서대로 움직였고, 중간에 내가 끊어서 확인할 수 있었다.

도구 사용 결과: Bash 248번, Edit 72번, Read 63번, Write 19번. 총 423번 tool call.

## GitHub API 403, 권한 문제

admin 페이지에서 "GitHub에서 레포지토리 다 가져와서 내가 선택해서 보이게 해줘"라고 요청했다.

`admin-projects.ts` API 엔드포인트를 만들었고, 테스트했는데 403이 떴다.

```
github api error 403
```

GitHub Personal Access Token에 `repo` 권한이 없었다. Claude Code가 `process.env.GITHUB_TOKEN`을 읽는 코드를 짰는데, 로컬 `.env`에 토큰이 없었다. 권한을 다시 설정하고 토큰을 넣었더니 "9 registered, 28 on GitHub"가 떴다.

전에는 9개만 보였는데, 이제 GitHub에 올라간 레포 28개가 전부 보이고 내가 포트폴리오에 노출할 것만 선택할 수 있다. Admin 화면에서 토글 하나로 끝난다. 수동으로 YAML 파일을 수정하던 것과 비교하면 Before/After가 명확하다.

## 병렬 에이전트로 번역 6개 동시에

한국어 빌드로그 6개를 영어로 번역해야 했다. 순차적으로 했으면 한 세션 내내 기다려야 했다.

Claude가 Agent tool을 사용해서 "Translate 6 build logs to English" 에이전트를 하나 띄웠다. 에이전트는 6개 파일을 동시에 처리해서 12개 파일(원문 + 번역본)을 한 번에 생성했다.

```
Agent "Translate 6 build logs to English" completed
All 12 files created successfully.
```

이게 Claude Code에서 병렬 에이전트의 실제 가치다. 한 세션 안에서 내가 다른 작업을 하는 동안 에이전트가 번역을 끝낸다.

## DEV.to 한글 포스트, 내려야 했다

Admin 작업이 끝나고 DEV.to 상태를 확인했다. 한국어로 올라간 포스트가 있었다.

```
devto사이트에서 한글로 된 거 다 내려주고
지금 올라간 기능들에 구글검색 잘되게 하거나,
후킹, 유입이나 광고가 잘되게 세팅되어 있는지 확인해줘
```

Claude는 DEV.to API를 써서 한국어 포스트를 `published: false`로 내렸다. 그 다음으로 기존 영어 포스트들의 제목과 태그를 분석했다. SEO 최적화 방향은 제목에 숫자를 넣고, `ai`, `webdev` 같은 트래픽 높은 앵커 태그를 반드시 포함하는 것이었다.

## 하루에 4개 프로젝트를 동시에 다룬 게 맞나

이날 세션 기록을 보면 portfolio-site, uddental, agentochester, tokenzip을 하루에 건드렸다. 처음에는 컨텍스트가 섞일 것 같아서 걱정했다.

근데 실제로 보면 Claude는 각 작업마다 해당 프로젝트 디렉토리를 정확히 타겟했다. `~/portfolio/portfolio-site/`에서 작업하다가 "치과 프로젝트 접속해줘"라고 하면 `~/uddental/`로 넘어갔다. 작업 흐름이 끊기는 건 내 쪽이지, Claude 쪽이 아니었다.

다만 한 세션이 너무 길어지면 컨텍스트가 압축되면서 앞에서 한 작업 내용을 Claude가 잊는다. 이번 73시간짜리 세션 후반부에 "admin 프로젝트 탭에서 모든 프로젝트가 안보여"라는 이슈가 다시 나온 건 이 때문이었다. 이미 고쳤던 문제를 다시 마주친 것이다.

긴 세션보다는 적절히 끊어서 새 세션을 여는 게 낫다. 세션당 200~300 tool call 이하가 적당한 것 같다.

## 빌드 로그 자동화의 실제 효과

`scripts/generate-build-log.sh`와 `scripts/parse-sessions.py` 두 스크립트를 만들었다. `.claude/projects/` 아래 `jsonl` 파일에서 세션 데이터를 파싱해서 빌드 로그 초안을 뽑아내는 구조다. 어떤 파일을 수정했는지, 어떤 프롬프트를 입력했는지, 도구 호출은 몇 번 했는지를 추출해서 Claude에게 넘기면 빌드 로그 초안이 나온다.

`~/Library/LaunchAgents/com.jidong.build-log.plist`를 등록해서 6시간마다 자동으로 세션 로그를 파싱하고 업데이트한다.

완전 자동은 아니다. 초안은 자동으로 나오지만 발행은 내가 검토하고 누른다. 자동 생성 + 수동 발행 구조다.

## admin YAML 에러와 에지 케이스

```
admin에서 링크나 project 상태 붙이면 yaml 어쩌고 에러메세지 나와
```

URL을 Admin UI에서 입력했더니 YAML 파싱이 깨졌다. URL에 포함된 `:` 때문이었다. YAML에서 콜론은 키-값 구분자다. 따옴표 없이 URL을 값으로 넣으면 파서가 혼란스러워한다.

처리는 간단하다. 문자열 값을 저장할 때 자동으로 따옴표로 감싸는 로직을 추가하면 된다. 문제는 이런 에지 케이스가 직접 써보기 전까지는 보이지 않는다는 점이다. Claude Code로 기능을 빠르게 만들고, 실제로 쓰면서 깨지는 부분을 바로 고치는 사이클. 이게 1인 개발에서 가장 실용적인 방식이다.

> 계획서를 먼저 만들고, 에이전트를 병렬로 쏘고, 세션을 적당히 끊는다. Claude Code의 효율은 도구 선택이 아니라 작업 방식에서 나온다.
