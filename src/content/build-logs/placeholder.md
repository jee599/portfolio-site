---
title: "빌드 로그 자동 생성 시스템 가동"
project: "portfolio-site"
date: 2026-03-07
lang: ko
tags: [setup, automation]
---

main 브랜치에 push하면 GitHub Action이 커밋 내용을 분석해서 빌드 로그를 자동 생성한다.

## 동작 방식

1. `main` 브랜치에 push 이벤트 발생
2. 커밋 메시지와 변경된 파일을 분석한다
3. 프로젝트를 감지하고 빌드 로그 마크다운을 생성한다
4. GitHub API로 `src/content/build-logs/`에 자동 커밋한다

auto-merge, AI news 자동 생성 등 자동화 커밋은 `[skip-log]` 패턴으로 건너뛴다.
