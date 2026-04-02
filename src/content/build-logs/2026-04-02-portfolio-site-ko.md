---
title: "GitHub Actions SyntaxError 한 줄이 DEV.to 자동 발행을 막고 있었다"
project: "portfolio-site"
date: 2026-04-02
lang: ko
tags: [claude-code, github-actions, devto, debugging, workflow]
description: "const lang 이중 선언 SyntaxError 하나가 DEV.to 발행 워크플로우를 완전히 막고 있었다. Claude Code로 원인 찾고 수정하는 과정."
---

DEV.to에 글 2개를 발행하려고 했다. 30번 넘게 Bash를 돌렸는데 결국 막혔다. API 키가 어디에도 없었다.

**TL;DR** GitHub Actions 워크플로우에서 `const lang`이 같은 스코프에 두 번 선언돼 `SyntaxError`가 발생하고 있었다. 키 찾는 데 삽질 8시간, 실제 수정은 Edit 1번으로 끝났다.

## API 키 사냥 — 28번의 Bash

처음 프롬프트는 간단했다.

> `blog-factory/devto/`에 있는 두 글을 DEV.to API로 직접 발행해라. API 키는 환경변수나 설정 파일에서 찾아봐.

Claude는 충실하게 돌아다녔다. `~/.devto`, `~/.config/devto`, 프로젝트 내 `.env*`, macOS 키체인, 환경변수. 4개 background task를 병렬로 띄워서 동시에 탐색했다. 결과는 전부 없음.

```bash
# 이런 탐색이 28번 반복됐다
find ~ -name ".devto" 2>/dev/null
security find-generic-password -s "dev.to" 2>/dev/null
grep -r "DEVTO" ~/.env* 2>/dev/null
```

GitHub 시크릿에 `DEVTO_API_KEY`가 있다는 건 확인했다. 하지만 GitHub CLI로는 시크릿 값을 읽을 수 없다. 쓰기 전용이라 당연한 결과다.

총 도구 사용: Bash 28번, Read 2번, Glob 1번. 8시간짜리 세션이 결론 없이 끝났다.

## 방향 전환 — 워크플로우 확인

다음 세션에서 방향을 바꿨다.

> `.github/workflows/publish-to-devto.yml` 워크플로우 내용을 확인해서 어떤 조건에서 트리거되는지 파악해라.

이미 GitHub Actions 워크플로우가 있었다. `src/content/blog/` 디렉토리에 파일이 push될 때 자동으로 DEV.to API를 호출하는 구조다. 직접 API를 호출할 필요가 없었다.

Claude가 워크플로우 파일을 읽다가 문제를 잡았다.

```javascript
// 워크플로우 내 Node.js 스크립트 (문제 부분)
const lang = frontmatter.lang || 'ko';
// ... 중간 로직 ...
const lang = file.endsWith('-en.md') ? 'en' : 'ko'; // SyntaxError!
```

`const lang`이 같은 스코프에 두 번 선언돼 있었다. 워크플로우가 실행될 때마다 `SyntaxError: Identifier 'lang' has already been declared`로 죽고 있었다. 이전에 발행된 글들이 있으니 어느 시점에는 동작했겠지만, 로직을 추가하면서 변수를 중복 선언한 게 문제였다.

동시에 두 번째 문제도 발견했다. EN 파일들이 `blog-factory/devto/`에만 있고 워크플로우가 감시하는 `src/content/blog/`에는 없었다.

## 수정 — Edit 1번

```javascript
// 수정 후
const effectiveLang = file.endsWith('-en.md') ? 'en' : (frontmatter.lang || 'ko');
```

`const lang` 이중 선언을 `effectiveLang`으로 합쳤다. Edit 도구 1번으로 끝.

EN 파일 2개를 `src/content/blog/`에 복사해서 main에 push했다. 워크플로우가 자동으로 트리거됐다.

## 429 — Rate Limit

첫 번째 글(`claude-agent-sdk-deep-dive-en.md`)은 발행 성공. 두 번째 글(`harness-cicd-deep-dive-en.md`)은 429 Too Many Requests로 실패했다. DEV.to API는 짧은 시간 안에 요청이 몰리면 rate limit을 건다.

```bash
gh workflow run publish-to-devto.yml
```

수동으로 재트리거해서 두 번째 글도 발행 완료.

## 실제 수정에 쓴 시간

API 키 사냥에 Bash 28번, 워크플로우 분석과 수정에 Bash 14번 + Read 2번 + Edit 1번. 실제 버그 수정은 Edit 1번이었다. 삽질 시간이 수정 시간보다 압도적으로 길었다.

## 배운 것

**먼저 워크플로우를 봤어야 했다.** "API 키가 어딘가 있을 것"이라는 가정으로 28번을 탐색했는데, 처음부터 "자동 발행 파이프라인이 있는지"를 확인했다면 훨씬 빨리 끝났다.

Claude Code는 주어진 방향으로 충실하게 실행한다. 방향 자체가 틀리면 아무리 열심히 해도 돌아오지 않는다. 프롬프트를 잘 쓰는 것 이전에, 어디를 먼저 볼지 판단하는 게 더 중요하다.
