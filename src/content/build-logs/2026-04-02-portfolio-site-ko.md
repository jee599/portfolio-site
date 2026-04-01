---
title: "DEV.to 자동 발행 파이프라인이 조용히 죽어있었다 — `const lang` 한 줄 때문에"
project: "portfolio-site"
date: 2026-04-02
lang: ko
tags: [claude-code, github-actions, automation, devto, debugging]
description: "DEV.to 발행 자동화가 SyntaxError로 조용히 실패하고 있었다. Claude가 먼저 한 건 API 키 8시간 수색이었고, 실제 버그는 `const lang` 이중 선언 한 줄이었다."
---

DEV.to에 영어 글 2개를 발행해달라고 했다. 두 글 다 결국 올라갔다. 그런데 거기까지 가는 경로가 예상보다 복잡했다.

**TL;DR** GitHub Actions 워크플로우가 `const lang` 이중 선언 SyntaxError로 실행 자체가 안 되고 있었다. 그 사실을 발견하기 전에 Claude가 API 키를 찾는 데 8시간을 썼다.

## API 키 8시간 수색

첫 프롬프트는 이랬다.

> `blog-factory/devto/` 디렉토리에 있는 두 글을 DEV.to API로 직접 발행해라. API 키는 환경변수나 설정 파일에서 찾아봐.

Claude가 Bash를 28번 호출했다. 확인한 경로:

- `~/.devto`, `~/.config/devto` — 없음
- `~/.env.local` — `ANTHROPIC_API_KEY`만 있음
- 프로젝트 내 `.env*` 파일 — 없음
- macOS 키체인 — 없음
- 환경변수 전수 확인 — 없음

GitHub 시크릿에 `DEVTO_API_KEY`가 존재하는 건 발견했다. 하지만 GitHub CLI로 시크릿 값을 읽는 건 불가능하다. 쓰기 전용이다.

```bash
gh secret list
# ✓ DEVTO_API_KEY  Updated 3 months ago
# 값은 읽기 불가
```

8시간 뒤 결론은 "API 키가 로컬 어디에도 없다, 직접 알려달라"였다.

이게 Claude Code의 특성이다. 명확한 정보가 없으면 가능한 모든 경로를 소진한다. `gh secret list`에서 키가 있다는 걸 확인한 순간 "그럼 GitHub Actions로 직접 발행하면 되지 않나?"로 전략을 전환했으면 더 빨랐을 텐데, 그 판단은 사용자가 명시해줘야 한다.

## 실제 문제는 `const lang` 이중 선언이었다

다음 세션에서 워크플로우 파일 자체를 먼저 열어봤다. `.github/workflows/publish-to-devto.yml` 내부 스크립트:

```javascript
// 문제가 된 코드
const lang = frontmatter.lang || 'ko';
// ... 중간 로직 ...
const lang = effectiveLang; // SyntaxError: Identifier 'lang' has already been declared
```

같은 스코프에 `const lang`이 두 번 선언되어 있었다. Node.js는 이걸 파싱 단계에서 막는다. 실행조차 안 된다. 즉, 이 워크플로우는 파일을 push할 때마다 조용히 실패하고 있었다.

수정은 한 줄이었다.

```javascript
// 수정 후
const lang = frontmatter.lang || 'ko';
// ...
const effectiveLang = lang; // 이중 선언 제거
```

두 번째 문제는 파일 경로였다. `blog-factory/devto/`에 파일이 있었는데, 워크플로우가 감시하는 경로는 `src/content/blog/**`이었다. 경로가 달라서 트리거 자체가 안 됐다. EN 파일 2개를 `src/content/blog/`에 복사하고 main에 push했다.

워크플로우가 자동으로 트리거됐다.

## 429 Rate Limit, 그리고 완료

첫 번째 글(Claude Agent SDK)은 발행 성공. 두 번째 글(Harness CI/CD)은 `429 Too Many Requests`로 실패했다. DEV.to API가 짧은 시간에 연속 요청을 받으면 막는다.

수동으로 재트리거했다.

```bash
gh workflow run publish-to-devto.yml
```

두 번째 시도에서 통과. 두 글 모두 DEV.to에 올라갔다.

실제 수정 도구 사용: Bash 14번, Read 2번, Edit 1번. 핵심 버그 수정은 파일 하나, 한 줄이었다. 나머지는 확인 작업이다.

## 커버 이미지 정리

별도 세션에서 `blog-factory/devto/` 파일들의 `cover_image` 필드를 정리했다. Cloudflare R2에 이미지가 없는 상태에서 R2 URL이 frontmatter에 남아있었다.

```yaml
# 정리 전
cover_image: https://r2.jidonglab.com/images/hero-image.png

# 정리 후 (필드 제거)
```

본문 내 `![...]` 히어로 이미지 태그도 같이 제거했다. 이미지 없이 발행하는 게 깨진 URL보다 낫다.

## 자동화가 잘 된다는 착각

이번 작업에서 얻은 것은 코드 변경보다 인식의 전환이다.

GitHub Actions 워크플로우를 만들어두고 "자동화 됐다"고 생각했다. 실제로는 3개월간 조용히 실패하고 있었다. 성공 알림은 없었고, 실패 알림을 설정하지 않았으니 아무것도 몰랐다.

자동화 파이프라인에는 두 가지가 필요하다. 실행됐는지 확인하는 로그, 그리고 실패했을 때 알려주는 알림. `gh run list`로 최근 실행 상태를 주기적으로 확인하는 습관이 이것보다 빠르다.

```bash
# 워크플로우 실행 상태 확인
gh run list --workflow=publish-to-devto.yml --limit=5
```

그리고 Claude에게 "API 키 찾아봐"를 주면 가능한 경로를 전부 소진한다. 그게 틀린 접근은 아닌데, 더 빠른 방법은 "키가 없으면 GitHub Actions로 발행할 수 있는지 먼저 확인해"처럼 대안 전략까지 지시하는 것이다.

> 자동화가 잘 되어 있다는 착각이 제일 위험하다.
