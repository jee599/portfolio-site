---
title: "DEV.to 자동 발행 파이프라인, GitHub Actions SyntaxError로 3일째 침묵하고 있었다"
project: "portfolio-site"
date: 2026-04-02
lang: ko
tags: [claude-code, github-actions, devto, automation, debugging]
description: "DEV.to API 키가 없는 줄 알고 삽질하다가, 실제 원인은 워크플로우 SyntaxError였다. Claude Code로 버그를 추적한 과정 정리."
---

DEV.to 발행 자동화가 조용히 실패하고 있었다. GitHub Actions는 돌아가는 것처럼 보였지만, 실제로는 `SyntaxError`로 모든 실행이 조용히 터지고 있었다. 발견하기까지 3일이 걸렸다.

**TL;DR** `const lang` 이중 선언이 워크플로우 스크립트 전체를 죽이고 있었다. Claude Code가 병렬 검색으로 키 탐색부터 시작했지만, 진짜 문제는 워크플로우 코드였다.

## API 키 사냥에 tool call 28번을 썼다

첫 번째 시도는 단순했다. "DEV.to API 키 어딘가 있을 거야"라는 프롬프트로 시작했다.

Claude Code는 즉시 4개의 백그라운드 태스크를 병렬로 실행했다.

```
Background: "Find scripts with DEV.to references"
Background: "Find env files excluding backups"
Background: "Find JSON files with DEV.to references"
Background: "Find blog publishing scripts"
```

결과는 전부 빈손이었다. `~/.devto`, `~/.config/devto`, `.env*` 없음. macOS 키체인 없음. `~/.env.local`에는 `ANTHROPIC_API_KEY`만 있었다. GitHub Secrets에 `DEVTO_API_KEY`가 존재한다는 건 확인했지만, 시크릿은 쓰기 전용이라 CLI로 값을 읽을 수 없다.

총 Bash 28번, Read 2번, Glob 1번. tool call 31개를 써서 "키 없음"을 확인했다. 여기서 멈추고 워크플로우부터 확인했으면 절반의 시간이 절약됐을 것이다.

## 실제 문제는 워크플로우 코드였다

두 번째 세션에서 방향을 바꿨다. API 키 대신 워크플로우 자체를 먼저 확인하는 프롬프트를 썼다.

```
1. .github/workflows/publish-to-devto.yml 워크플로우 내용 확인
2. 파일들이 main에 있는지 확인
3. gh run list로 실행 기록 확인
```

진단은 빠르게 나왔다. 워크플로우 스크립트 안에서 `const lang`이 같은 스코프에 두 번 선언되고 있었다.

```javascript
// 버그: 같은 함수 스코프 안에서 두 번 선언
const lang = file.frontmatter.lang || 'ko';
// ... 중간 코드 ...
const lang = effectiveLang; // SyntaxError!
```

Node.js strict mode에서 `const` 재선언은 `SyntaxError`다. 워크플로우가 실행을 시작하자마자 조용히 종료됐다. 성공/실패 로그조차 제대로 남기지 않으니 눈에 안 띄었다.

수정은 한 줄이었다. `lang` → `effectiveLang`으로 변수명 변경.

## 파일 위치도 문제였다

워크플로우 버그와 함께 두 번째 문제가 있었다. EN 버전 파일들이 `blog-factory/devto/`에만 있고 워크플로우가 감시하는 `src/content/blog/`에는 없었다.

프롬프트 하나로 두 가지를 동시에 처리했다.

```
두 파일 모두 src/content/blog/에 복사 후 main push → 자동 트리거
```

Push 후 워크플로우가 자동 실행됐다. 첫 번째 포스트(`claude-agent-sdk-deep-dive-en.md`)는 성공. 두 번째(`harness-cicd-deep-dive-en.md`)는 DEV.to API 429 rate limit으로 실패했다. 수동 재실행(`gh workflow run publish-to-devto.yml`)으로 완료했다.

## cover_image 정리도 한 번에

발행 성공 후 이미지 문제가 남아 있었다. 파일에 `cover_image` R2 URL이 남아 있는데 실제로 R2에 파일이 없다.

```
cover_image 필드 제거, 본문 내 heroImage 태그 제거, 커밋 & push
```

Claude Code는 2개 파일의 R2 URL과 이미지 태그를 찾아서 제거했다. Edit 2번, Bash 3번, Glob 2번, Read 2번. tool call 9번으로 깔끔하게 정리.

## 이번에 배운 것

**API 키 탐색보다 워크플로우 로그를 먼저 보는 게 맞다.** "키가 없다"는 에러와 "키가 있는데 워크플로우가 죽는다"는 에러는 증상이 같다. 다음번엔 `gh run list --limit 10`으로 실행 기록부터 확인한다.

**병렬 백그라운드 태스크는 탐색 속도를 올려주지만 방향이 틀리면 소용없다.** 4개를 동시에 돌려도 잘못된 가설을 검증하면 낭비다. 프롬프트에 검색 범위를 좁혀주는 게 낫다.

`const lang` 이중 선언은 로컬에서는 절대 안 터진다. GitHub Actions 환경의 Node.js strict mode에서만 터지는 버그였다. CI 환경과 로컬 환경이 다를 수 있다는 걸 항상 염두에 둬야 한다.
