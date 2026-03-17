---
title: "Dev.to 자동 발행이 조용히 멈춘 이유 — 그리고 포트폴리오 허브 전환까지"
project: "portfolio-site"
date: 2026-03-18
lang: ko
tags: [claude-code, github-actions, astro, automation]
description: "5개 포스트를 올렸는데 dev.to에 하나도 안 올라갔다. 원인은 workflow path 1줄이었다. 7세션, 719 tool calls로 jidonglab을 AI 뉴스 사이트에서 포트폴리오 허브로 전환한 과정."
---

5개 블로그 포스트를 작성하고 커밋했다. dev.to에는 하나도 올라가지 않았다.

**TL;DR** GitHub Actions workflow path 불일치 1줄이 원인이었다. 그걸 고치는 김에 jidonglab 전체를 AI 뉴스 사이트에서 프로젝트 포트폴리오 허브로 전환했다.

## 5개 포스트가 조용히 사라진 이유

Claude Code에 5개 드래프트를 넘겨서 `src/content/blog/`에 파일을 생성했다. 커밋도 했고, push도 했다. 그런데 dev.to에는 아무것도 올라오지 않았다. GitHub Actions도 실행된 흔적이 없었다.

원인 분석을 Claude에게 시켰다.

```
이 커밋이 왜 dev.to에 발행되지 않았는지 분석해줘.
publish-to-devto.yml 워크플로와 실제 파일 경로를 비교해서 원인을 찾아줘.
```

3분이 안 돼서 답이 나왔다.

```yaml
# publish-to-devto.yml — 문제의 코드
on:
  push:
    paths:
      - 'src/content/ai-news/**'  # ai-news만 감지
```

`src/content/blog/**`가 trigger paths에 없었다. ai-news 자동화를 붙일 때 기존 blog 경로를 빠뜨린 것이다. workflow가 실행되지 않았으니 발행이 될 리가 없었다.

수정은 간단했다. trigger paths에 `src/content/blog/**`를 추가하고, collections 배열에 blog 디렉토리 항목을 넣었다. Edit 2번, Bash 6번. 커밋 1개.

```yaml
# 수정 후
on:
  push:
    paths:
      - 'src/content/ai-news/**'
      - 'src/content/blog/**'   # 추가
```

이게 세션 3개짜리 작업이었다. 세션 1에서 파일 생성, 세션 2에서 원인 파악, 세션 3에서 수정. 같은 컨텍스트 안에서 끝냈으면 훨씬 빨랐을 텐데, 세션을 나눠서 매번 컨텍스트를 새로 로드했다. 작업 흐름 측면에서는 비효율적인 선택이었다.

## 포트폴리오 허브로 전환

이 작업을 하다가 더 큰 문제가 눈에 들어왔다. jidonglab은 AI 뉴스 사이트로 돌아가고 있었는데, 원래 목적은 포트폴리오였다. 로컬에 11개 git 프로젝트가 있는데 포트폴리오에는 7개만 올라가 있었고, 빌드 로그는 수동으로 작성하고 있었다.

Claude에게 구현 계획을 요청했다.

```
jidonglab.com을 AI 뉴스/블로그 사이트가 아니라 프로젝트 포트폴리오 허브로 전환한다.
프로젝트 레지스트리 + Admin 관리 + 빌드 로그 자동화까지 구현 계획을 세워줘.
```

계획이 나오자마자 바로 구현을 시켰다. `scripts/project-registry.yaml`로 프로젝트 메타데이터를 관리하고, `src/content/projects/` 에 각 프로젝트 YAML을 두고, admin 페이지에서 상태와 링크를 수정할 수 있게 했다.

이 세션의 tool call은 322개였다. Bash가 204번으로 가장 많았고, Edit 44번, Read 41번, Write 19번 순이었다. Bash가 압도적으로 많은 건 파일 존재 확인, npm install 결과 체크, git 상태 확인 같은 짧은 명령들이 쌓였기 때문이다.

## JSONL 기반 빌드 로그 자동화

작업 중에 흥미로운 발견이 있었다. Claude Code는 `.claude/` 안에 대화 내용을 JSONL 포맷으로 저장한다. 이걸 파싱하면 빌드 로그를 자동 생성할 수 있다.

```
.claude/projects/[project-hash]/*.jsonl 파일 구조를 분석하고,
프로젝트별로 세션 요약, 프롬프트 내용, 도구 사용 통계를 추출하는
parse-sessions.py 스크립트를 만들어줘.
```

`scripts/parse-sessions.py`가 생성됐다. 실행하면 각 세션별 작업 요약, 도구 사용 통계, 수정된 파일 목록이 마크다운 형식으로 출력된다. 이 빌드 로그도 그 스크립트 출력을 기반으로 작성했다.

로컬 cron을 붙여서 6시간마다 자동 실행하도록 했다. `LaunchAgents`에 plist를 등록하는 방식이다.

## GitHub API 403 에러

admin에서 프로젝트 상태를 변경하면 에러가 났다.

```
GitHub API Error 403
```

원인은 admin.astro가 프로젝트 정보를 업데이트할 때 GitHub API를 호출하고 있었던 것이다. GitHub API rate limit이나 권한 문제가 아니라, 로컬 파일을 직접 수정해야 하는데 GitHub API로 우회하고 있는 구조 자체가 문제였다.

수정 방향은 GitHub API 호출을 완전히 제거하고 `admin-projects.ts` API route에서 로컬 YAML 파일을 직접 읽고 쓰는 방식으로 바꾸는 것이었다. rate limit 우려도 없고 구조도 단순해졌다.

이게 세션 7의 마지막 픽스였다. 커밋 메시지는 `fix: admin projects GET — GitHub API 호출 제거, rate limit 방지`.

## 7세션 작업 돌아보기

이번 작업을 숫자로 보면 이렇다. 총 7세션, 719 tool calls. 도구별로는 Bash 365번, Write 117번, Read 113번, Edit 98번, Agent 13번이었다. 생성 파일 78개, 수정 파일 31개.

Bash가 절반을 차지하는 건 의도적이다. 파일 생성은 Write나 Edit을 쓰지만, 빌드 확인, 의존성 설치, git 상태 확인은 Bash가 훨씬 빠르다.

세션을 불필요하게 나눈 것(blog path 수정을 3세션에 걸쳐 함)은 아쉬운 부분이다. 작업 단위가 명확히 보이면 하나의 긴 세션이 여러 짧은 세션보다 낫다. 컨텍스트 로딩 비용이 매번 발생하기 때문이다.

가장 효과적이었던 프롬프트는 진단 프롬프트였다. "왜 안 되는지 파악해줘"에서 원인이 나오면 "수정해줘"로 바로 이어가는 패턴이 가장 속도가 빠르다. 처음부터 "이걸 수정해줘"로 시작하면 잘못된 방향으로 고칠 가능성이 생긴다.

> 파악 먼저, 수정은 그다음. 이 순서를 지키는 게 Claude Code를 효율적으로 쓰는 핵심이다.
