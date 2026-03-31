---
title: "DEV.to 자동 발행 파이프라인 구축 — worktree 함정, SyntaxError 조용한 실패, 429 rate limit"
project: "portfolio-site"
date: 2026-04-01
lang: ko
tags: [claude-code, github-actions, devto, automation, worktree, debugging]
description: "DEV.to 자동 발행 파이프라인을 완성하기까지. worktree 브랜치 혼선, const lang SyntaxError 조용한 실패, API 키 부재까지. 11세션, 186번 도구 호출의 기록."
---

DEV.to에 영어 포스트 2개를 올리는 작업이었다. 예상 소요 시간은 10분. 실제는 11세션, 186번의 도구 호출이 필요했다. 원인은 단순했다 — 파일이 잘못된 브랜치에 있었고, 워크플로우는 만들어진 순간부터 죽어있었다.

**TL;DR** worktree 브랜치에만 있던 파일을 main으로 옮기고, `const lang` 이중 선언 SyntaxError를 수정하자 GitHub Actions가 살아났다.

## 파일이 main에 없었다

세션 6에서 `blog-factory/devto/` 디렉토리의 두 파일을 정리했다. `cover_image` R2 URL을 제거하고, 본문의 히어로 이미지 태그도 걷어냈다. Bash 3번, Edit 2번. 깔끔하게 끝났다.

문제는 커밋이 `cool-edison` worktree 브랜치에만 됐다는 것이다. `main`에는 없었다. GitHub Actions는 main 브랜치 push를 트리거 조건으로 본다. 아무리 파일을 정리해도 main에 없으면 워크플로우가 뜨지 않는다.

세션 8에서 상태를 확인했다.

```bash
git branch
# * claude/cool-edison
# main

git log main..HEAD --oneline
# 2 commits ahead of main
```

브랜치가 어디인지 항상 확인한다. worktree를 쓰다 보면 커밋이 메인이 아닌 임시 브랜치에 쌓이는 걸 놓치기 쉽다.

## GitHub Actions 워크플로우가 처음부터 죽어있었다

파일을 main으로 옮기기 전에 워크플로우를 먼저 읽었다. `.github/workflows/publish-to-devto.yml`. 트리거 조건은 `src/content/blog/` 경로에 파일이 push될 때였다.

EN 파일들은 `blog-factory/devto/`에 있었다. 트리거 경로가 다르다. 트리거 자체가 안 됐다는 얘기다.

더 심각한 문제를 발견했다. 워크플로우 내부 Node.js 스크립트에 `const lang`이 같은 스코프에 두 번 선언되어 있었다.

```javascript
// 워크플로우 스크립트 내부
const lang = file.includes('-en.') ? 'en' : 'ko'

// ... 수십 줄 뒤 ...

const lang = frontmatter.lang || 'ko'  // SyntaxError!
```

`SyntaxError: Identifier 'lang' has already been declared`. 이 워크플로우는 생성된 순간부터 실행된 적이 없었다. 성공 로그도 없었고, 실패 알림도 없었다. 그냥 조용히 실패했다.

수정은 Edit 1번이었다.

```javascript
const lang = file.includes('-en.') ? 'en' : 'ko'
const effectiveLang = frontmatter.lang || lang
```

두 번째 선언을 `effectiveLang`으로 바꿨다. 그다음 EN 파일 2개를 `src/content/blog/`로 복사하고 main에 push했다.

```bash
cp blog-factory/devto/claude-agent-sdk-deep-dive-en.md \
   src/content/blog/claude-agent-sdk-deep-dive-en.md
git add src/content/blog/
git push origin main
```

워크플로우가 자동 트리거됐다. Claude Agent SDK 포스트는 즉시 발행됐다. Harness CI/CD는 429 rate limit으로 첫 시도가 실패해서 `gh workflow run`으로 수동 재실행했다.

> GitHub Actions 워크플로우를 만들고 나면 반드시 `gh run list`로 실제 실행 여부를 확인한다. SyntaxError로 망가진 워크플로우는 아무 알림 없이 조용히 실패한다.

## DEV.to API 키를 로컬에서 못 찾은 이유

세션 10에서 GitHub Actions 대신 API를 직접 호출하려 했다. Bash를 21번 돌렸다. `~/.devto`, `~/.config/devto`, `.env*`, macOS 키체인, 환경변수 전부 확인했다. 없었다.

GitHub 시크릿에는 `DEVTO_API_KEY`가 있다. 그런데 시크릿은 GitHub Actions에서만 읽힌다. `gh secret view`로 값을 가져올 수 없다. 쓰기 전용이다.

이게 로컬 개발에서 자주 나오는 패턴이다. GitHub Actions용 키를 GitHub 시크릿에만 저장하면, 로컬 스크립트에서는 쓸 수 없다. 로컬에서도 써야 할 키는 `.env.local`에 따로 저장해야 한다.

21번의 Bash가 이걸 알려줬다. 앞으로 API 키는 두 곳에 관리한다 — GitHub 시크릿(CI용), `~/.env.local`(로컬용).

## blog-factory 디렉토리 구조 문제

현재 구조:
```
src/content/blog/    ← GitHub Actions 트리거 경로
blog-factory/devto/  ← 작성 단계 파일 보관
```

초안은 `blog-factory/devto/`에서 작성하고 검토한다. 발행 준비가 끝나면 `src/content/blog/`로 옮긴다. 옮길 때 GitHub Actions가 트리거된다.

이 흐름이 세션 내내 혼선을 줬다. 파일을 정리했는데 발행이 안 됐다 → 파일이 트리거 경로에 없었다 → `src/content/blog/`로 복사 → 발행됨.

다음번엔 `blog-factory/devto/`에서 작업 완료 후 바로 `src/content/blog/`로 이동하는 순서를 지킨다.

## 도구 사용 통계 (세션 6~11)

```
전체: 186 tool calls
- Bash:  83 (45%) — 배포, 파일 탐색, API 호출
- Read:  47 (25%) — 파일 내용 확인
- Edit:  14 (8%)  — 실제 코드 변경
- Glob:  10 (5%)  — 파일 경로 탐색
- Bash x21 (세션 10): DEV.to API 키 찾기
```

Bash 45%, Read 25%. 구현보다 탐색이 70%를 차지했다. 실제 코드 변경(Edit)은 8%뿐이었다. 문제 자체는 간단했지만, 상태 파악에 시간이 걸렸다.

## 이번 작업에서 남긴 것

DEV.to 자동 발행 파이프라인이 실제로 동작한다. 앞으로 `src/content/blog/`에 EN 파일을 추가하면 GitHub Actions가 자동으로 발행한다.

파이프라인이 "잘 될 것 같다"와 "실제로 된다"는 다르다. 만들고 나서 한 번은 끝까지 돌려보는 것이 필요하다. 이번엔 11세션이 걸렸지만, 다음엔 2분이면 된다.
