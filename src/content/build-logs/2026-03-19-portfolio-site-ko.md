---
title: "Claude Code .jsonl로 빌드 로그 자동화 — jidonglab 포트폴리오 허브 전환기"
project: "portfolio-site"
date: 2026-03-19
lang: ko
tags: [claude-code, astro, portfolio, automation, github-api]
description: "73시간 세션, 423번의 도구 호출. .jsonl 세션 로그를 파싱해 빌드 로그를 자동 생성하고, jidonglab.com을 AI 뉴스 사이트에서 프로젝트 포트폴리오 허브로 전환한 과정."
---

세션 하나에 73시간이 걸렸다. tool call이 423번이었다.

**TL;DR** Claude Code 세션 `.jsonl`을 파싱해 빌드 로그를 자동 생성하고, jidonglab.com을 AI 뉴스 사이트에서 프로젝트 포트폴리오 허브로 전환했다. GitHub API로 28개 레포를 연동하고, admin에서 프로젝트 상태를 직접 관리할 수 있게 됐다.

## .jsonl 파일이 쌓이고 있었다

작업 중에 우연히 `~/.claude/projects/` 폴더를 열었다. `.jsonl` 파일들이 가득했다. 프로젝트마다, 세션마다 대화 내역이 전부 기록되어 있었다.

사용자 프롬프트, 도구 호출, 파일 변경 이력. 빌드 로그를 직접 쓸 필요 없이 이 데이터를 파싱하면 되겠다는 생각이 바로 들었다.

실제로 Claude에게 물었다.

> "그러면 어떻게 jsonl 기반으로 프로젝트별 로그, 프롬프트 내용, 작업 어떻게 했는지 정리해서 남길 수 있어?"

Claude는 `scripts/parse-sessions.py`를 만들었다. `.jsonl`을 읽어서 사용자 프롬프트, 변경된 파일, 도구 사용 횟수를 추출하는 스크립트다. 거기에 `scripts/generate-build-log.sh`를 붙여서 파싱 결과를 Markdown 빌드 로그로 변환하는 파이프라인을 완성했다.

수동으로 "오늘 뭐 했지" 회상할 필요가 없어졌다. `.jsonl`이 다 기억하고 있으니까.

## 포트폴리오 허브 전환 — "프로젝트가 안 보여"

jidonglab.com은 원래 AI 뉴스 + 블로그 사이트였다. 근데 프로젝트가 11개인데 포트폴리오에는 7개밖에 안 보이고, 빌드 로그는 수동이었다.

이걸 바꾸는 게 이번 세션의 핵심 작업이었다.

구현한 내용을 크게 나누면 세 가지다. 프로젝트 레지스트리 시스템, GitHub API 연동, admin 페이지 리디자인.

`scripts/project-registry.yaml`을 새로 만들었다. 각 프로젝트의 로컬 git 경로, slug, branch를 매핑하는 파일이다. CLI 스크립트 전용이라 Astro 빌드와는 무관하다. `src/content/config.ts`의 projects 스키마에는 `visible` 필드를 추가해서 admin에서 보임/숨김을 토글할 수 있게 했다.

GitHub API 연동은 예상보다 골치였다. 처음엔 403 에러가 났다.

> "github api error 403"

레포 목록을 읽으려면 Personal Access Token에 `repo` 권한이 필요했는데, 기본 설정으로는 안 됐다. token 권한을 수정하고 나서 28개 레포를 연동하는 데 성공했다. admin 페이지에 "9 registered, 28 on GitHub"라고 뜨는 걸 확인했을 때 뭔가 정리된 느낌이었다.

admin 페이지 작업에서 Bash가 248번, Edit이 72번, Read가 63번 쓰였다. admin.astro 파일 하나가 58KB였는데, 거기에 Projects 탭과 Build Logs 탭을 새로 추가하고 JavaScript 로직을 붙였다.

## Dev.to에 한글 글이 올라가 있었다

작업 중에 이런 프롬프트가 나왔다.

> "devto 에 한글로 된 거 다 내려주고 지금 올라간 기능들에 구글검색 잘되게 하거나, 후킹, 유입이나 광고가 잘되게 세팅되어 있는지 확인해줘"

알고 보니 DEV.to에 한국어 글이 올라가 있었다. 자동 발행 스크립트가 언어 필터 없이 돌았던 것이다.

한글 글을 내리고, 기존에 올라간 영어 빌드 로그들의 제목과 태그를 SEO에 맞게 수정했다. 그리고 번역 작업을 에이전트에 넘겼다.

> "Agent 'Translate 6 build logs to English' completed. All 12 files created successfully."

에이전트 하나가 한국어 빌드 로그 6개를 영어 12개로(한 포스트당 DEV.to용 + Medium용) 번역했다. 이 작업에서 Agent 도구만 따로 쓴 게 의미가 있었다. 맥락 창을 분리하니까 번역 품질이 더 일정했다.

## 6시간마다 자동 업데이트 — CronCreate

빌드 로그 파이프라인을 만들고 나서 자동화를 붙이고 싶었다.

> "이제 이거 claude code schedule로 프로젝트별로 6시간마다 업데이트하고, 블로그 글 써서 jidonglab에 올리게 해줘"

`CronCreate` 도구를 처음 써봤다. 로컬 cron과의 차이를 물어봤더니, CronCreate는 Claude Code 세션 컨텍스트 안에서 돌아서 파일 접근이나 프롬프트 실행이 가능하고, 로컬 cron은 셸 명령어만 실행 가능하다는 차이였다.

`~/Library/LaunchAgents/com.jidong.build-log.plist`도 함께 생성됐다. 로컬 launchd 기반 백업 스케줄이다.

## 세션 통계

이번 작업의 도구 사용 분포:

- Bash: 248번 — 주로 git 상태 확인, npm 빌드, API 테스트
- Edit: 72번 — admin.astro, 스키마, 컴포넌트 수정
- Read: 63번 — 58KB admin.astro를 여러 번 나눠 읽음
- Write: 19번 — 새 파일 생성
- Grep: 10번 — 코드 검색

전체 세션 시간이 73시간 53분으로 찍혔는데, 실제 작업은 하루 이틀에 걸쳐서 했다. Claude Code가 세션을 종료하지 않으면 누적 시간이 계속 쌓이는 방식이다.

admin 페이지에서 프로젝트 상태를 바꾸면 YAML이 어쩌고 에러가 난다는 것도 중간에 발견했다. YAML 파싱 로직에 오류가 있었고, 수정 후 정상 동작을 확인했다.

> 세션 로그는 이미 쌓이고 있다. 그걸 읽는 스크립트만 있으면 빌드 로그는 자동이다.
