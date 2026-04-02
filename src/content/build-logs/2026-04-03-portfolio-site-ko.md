---
title: "DEV.to 자동 발행 삽질기: 8시간 헤매다 3분에 끝낸 GitHub Actions 버그"
project: "portfolio-site"
date: 2026-04-03
lang: ko
tags: [claude-code, github-actions, devto, automation, debugging]
description: "DEV.to API 키를 8시간 찾아 헤맸다. 정작 문제는 키가 아니라 GitHub Actions의 const lang 이중 선언이었다. Claude Code로 3분 만에 fix했다."
---

8시간 동안 API 키를 찾아 헤맸다. 결론은 키 문제가 아니었다.

**TL;DR** DEV.to 자동 발행이 안 된 진짜 이유는 GitHub Actions 워크플로우의 `const lang` 이중 선언 SyntaxError였다. 키 탐색에 쓴 8시간, 버그 fix에 쓴 시간은 3분.

## 8시간 삽질의 시작

프롬프트는 단순했다.

```
blog-factory/devto/ 디렉토리에 있는 두 글을 DEV.to API로 직접 발행해라.
API key는 환경변수나 설정 파일에서 찾아봐. 없으면 보고해.
```

Claude는 병렬로 4개 태스크를 동시에 날렸다. `DEV.to references가 있는 스크립트 찾기`, `env 파일 찾기`, `DEV.to references가 있는 JSON 파일 찾기`, `블로그 발행 스크립트 찾기`. Bash 도구 28번, Read 2번, Glob 1번. 찾은 곳 목록:

- `~/.devto`, `~/.config/devto` — 없음
- `~/.env.local` — `ANTHROPIC_API_KEY`만
- 프로젝트 내 `.env*` 파일 — 없음
- macOS 키체인 — 없음
- 환경변수 — 없음

GitHub 시크릿에 `DEVTO_API_KEY`가 존재는 했다. 하지만 시크릿은 쓰기 전용이라 CLI로 값을 읽을 수 없다. Claude는 "API 키를 붙여넣어 주면 바로 발행하겠다"는 결론을 반복해서 냈다.

같은 세션이 31번의 tool call을 쓰며 같은 결론에 도달했다. 중복 세션까지 합치면 두 번이나.

## 진짜 문제는 다른 곳에 있었다

방향을 바꿨다. 키 직접 발행 대신 GitHub Actions 워크플로우를 활용하는 쪽으로.

```
.github/workflows/publish-to-devto.yml 워크플로우 내용을 확인해서
어떤 조건에서 트리거되는지 파악해라.
파일들이 main에 없으면 main으로 머지하거나 직접 추가해서 push해라.
```

Claude가 워크플로우를 읽자마자 버그를 발견했다.

```javascript
// 워크플로우 내부 — 같은 스코프에 두 번 선언
const lang = file.match(/-ko\.md$/) ? 'ko' : 'en';
// ... 중간 코드 ...
const lang = frontmatter.lang || effectiveLang; // SyntaxError!
```

`const lang`이 같은 스코프에 두 번 선언되어 있었다. 이걸로 모든 워크플로우 실행이 `SyntaxError`로 실패하고 있었던 것이다. API 키는 GitHub 시크릿에 멀쩡히 있었고, 워크플로우 자체가 실행조차 안 됐던 거다.

두 번째 문제도 같이 발견했다. EN 파일들이 `blog-factory/devto/`에만 있고 `src/content/blog/`에 없었다. 워크플로우는 `src/content/blog/`를 바라보고 있었으니 파일 자체를 못 찾는 상황.

## 3분 fix

```
1. 워크플로우 const lang 이중 선언 → effectiveLang 으로 수정
2. EN 파일 2개를 src/content/blog/에 추가 후 main push
```

Edit 도구 1번, Bash 14번, Read 2번. 수정 내용은 한 줄이었다.

```javascript
// Before
const lang = frontmatter.lang || effectiveLang;

// After  
const effectiveLang = frontmatter.lang || detectedLang;
```

push 후 워크플로우 자동 트리거. Claude Agent SDK 포스트 발행 성공. Harness CI/CD는 429 rate limit으로 첫 실행 실패했지만, 수동 재실행으로 두 글 모두 발행 완료.

## 커버 이미지 정리

발행 전에 별도로 처리한 작업이 있다. `blog-factory/devto/` 파일들에 R2 URL을 가리키는 `cover_image` 필드와 본문 `![...]` 이미지 태그가 남아 있었다. R2에 실제 이미지가 없는 상태라 제거해야 했다.

```
cover_image R2 URL 제거 (두 파일)
본문 ![...] 히어로 이미지 태그 + 캡션 제거 (두 파일)
```

Edit 도구 2번으로 끝.

## Claude Code 활용 패턴 정리

**병렬 탐색은 빠르지만 방향이 틀리면 속도가 독이 된다.** API 키 탐색에서 Claude는 4개 태스크를 동시에 실행하며 빠르게 결론을 냈다. 그런데 그 결론 자체가 잘못된 전제에서 출발했다. 키가 없다는 게 진짜 문제가 아니었으니까.

**프롬프트 레벨을 올리면 각도가 달라진다.** "API 키로 직접 발행해라"에서 "GitHub Actions 워크플로우로 발행되는 구조를 파악해라"로 바꾸자마자 실제 버그가 눈에 들어왔다.

**워크플로우 디버깅에서 Claude가 빠른 건 파일을 한꺼번에 읽을 수 있어서다.** `publish-to-devto.yml` 전체를 한 번에 읽고, 같은 스코프의 이중 선언을 바로 잡아냈다. 사람이 직접 읽었다면 한참 스크롤했을 것이다.

총 도구 사용: Bash 45회, Read 6회, Edit 3회, Glob 3회. 실제 버그 fix에 쓴 건 그 중 일부였고, 나머지 대부분은 존재하지 않는 API 키를 찾는 데 소모됐다.
