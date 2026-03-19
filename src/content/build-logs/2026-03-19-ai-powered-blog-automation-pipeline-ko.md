---
title: "자동화된 블로그 배포 파이프라인을 AI로 관리하는 법"
project: "dev_blog"
date: 2026-03-19
lang: ko
tags: [chore, fix, feat]
---

기술 블로거라면 한번은 겪어봤을 문제다. 글은 쓰고 싶은데 배포, 번역, 플랫폼별 발행이 너무 번거롭다. 이번에 완전 자동화된 블로그 파이프라인을 구축하면서 AI를 어떻게 활용했는지, 어떤 프롬프팅 패턴이 효과적인지 정리한다.

## 배경: 무엇을 만들고 있는가

기술 블로그를 DEV.to, Hashnode, Blogger에 동시 발행하는 시스템을 만들고 있다. 글을 쓰면 자동으로 영어 번역되고, 각 플랫폼에 맞게 포맷팅되어 발행된다. 빌드 로그처럼 반복적인 글들도 AI가 대신 작성한다.

이번 작업의 목표는 완전한 hands-off 배포다. 커밋만 하면 모든 게 알아서 돌아가야 한다.

## GitHub Actions와 AI를 엮는 워크플로우 설계

### 프롬프팅 전략: 워크플로우 생성

GitHub Actions 워크플로우를 AI에게 만들게 할 때는 **제약 조건을 명확히** 줘야 한다. 막연하게 "자동화해줘"라고 하면 쓸모없는 코드가 나온다.

> "GitHub Actions로 다음 조건을 만족하는 워크플로우를 만들어줘:
> 1. `posts/*.md` 파일이 변경되면 트리거
> 2. 한국어 파일(`-ko.md`)은 DEV.to 발행 제외
> 3. `build-log` 태그가 있는 글은 자동 unpublish
> 4. API rate limit 고려해서 5초 간격으로 요청
> 5. 실패 시 Slack 알림
> 
> 각 플랫폼별 API 스펙:
> - DEV.to: `article[title]`, `article[body_markdown]` 필수
> - Hashnode: GraphQL mutation, `publicationId` 필요"

이렇게 쓰면 안 된다:
> "블로그 자동 배포 만들어줘"

구체적인 조건을 주니까 바로 쓸 수 있는 워크플로우가 나왔다. `.github/workflows/publish.yml`에서 한국어 파일 스킵 로직도 정확하게 구현됐다.

### Claude Code 활용법: 멀티 플랫폼 API 통합

각 플랫폼별로 API 스펙이 다르다. DEV.to는 REST, Hashnode는 GraphQL, Blogger는 OAuth 필요하다. 이런 복잡한 통합 작업을 AI에게 시킬 때는 **CLAUDE.md**에 API 문서를 미리 넣어둔다.

```markdown
# CLAUDE.md

## Platform APIs
- DEV.to: REST API, API key auth
- Hashnode: GraphQL, bearer token
- Blogger: OAuth 2.0, refresh token flow

## Publishing Rules
- Korean posts (-ko.md): only to local blog
- Build logs: auto-unpublish after 7 days
- Rate limits: 5 requests/minute per platform
```

그다음 `/publish` 명령으로 각 플랫폼별 스크립트를 생성한다. AI가 컨텍스트를 이미 알고 있으니까 일관성 있는 코드가 나온다.

### 구조화 전략: 단계별 배포 검증

큰 실수는 모든 플랫폼에 한번에 배포하려고 하는 것이다. 하나씩 검증하면서 점진적으로 확장해야 한다.

1단계: DEV.to만 연동 (가장 간단한 REST API)
2단계: Hashnode 추가 (GraphQL 학습)
3단계: Blogger 추가 (OAuth 플로우 복잡함)
4단계: 실패 처리 및 롤백

각 단계별로 AI에게 별도 태스크로 요청한다. 한번에 다 하려다가 디버깅 지옥에 빠지기 쉽다.

### 관련 기술 개념: API Rate Limiting 패턴

블로그 API들은 대부분 rate limit이 있다. DEV.to는 분당 5회, Hashnode는 시간당 100회다. 이걸 AI가 알아서 처리하게 하려면 **retry with exponential backoff** 패턴을 명시해야 한다.

```javascript
// AI가 생성한 rate limit 처리 코드
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function publishWithRetry(platformAPI, post, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await platformAPI.publish(post);
    } catch (error) {
      if (error.status === 429) {
        await delay(Math.pow(2, i) * 1000); // 1초, 2초, 4초
        continue;
      }
      throw error;
    }
  }
}
```

AI에게 이런 패턴을 가르쳐두면 다른 프로젝트에서도 재사용할 수 있다.

## 콘텐츠 자동 생성과 번역 파이프라인

### 프롬프팅 전략: 빌드 로그 자동 작성

매일 반복되는 빌드 로그를 AI가 대신 쓰게 했다. 커밋 데이터를 입력으로 받아서 readable한 글로 만든다.

> "다음 커밋 데이터를 기반으로 개발 일지를 작성해줘. 독자는 같은 스택을 쓰는 개발자다.
> 
> 조건:
> - 기술적 의사결정의 배경을 설명
> - 삽질한 부분은 솔직하게 써라
> - 코드 예시는 핵심만 간결하게
> - 다음에 뭘 할 건지 로드맵 제시
> 
> 톤앤매너: 건조한 반말, 개발자 블로그 스타일
> 길이: 1500-2000자
> 
> [커밋 데이터]
> ..."

이런 구조화된 프롬프트를 쓰니까 매번 일정한 품질의 글이 나온다. `posts/2026-03-19-uddental-build-log-en.md` 같은 파일들이 모두 이런 방식으로 생성됐다.

### Claude Code 활용법: 번역 품질 관리

한국어 글을 영어로 번역할 때 단순히 "번역해줘"라고 하면 어색한 결과가 나온다. **custom instructions**에 번역 가이드라인을 설정해둔다.

```markdown
# Translation Guidelines

## Technical Terms (번역 금지)
- commit, deploy, refactor, build → 그대로 유지
- GitHub Actions, Claude Code → 고유명사 유지

## Style Guide
- 한국어 반말 → 영어 casual tone
- "~한다" → "I do", "we implement"
- 기술 블로그 독자층 고려

## Context Awareness
- 이전 번역 결과와 톤 일치
- 프로젝트명, 브랜드명 일관성 유지
```

이렇게 설정하고 `/translate` 명령을 쓰면 훨씬 자연스러운 영어 글이 나온다.

### 구조화 전략: 콘텐츠 타입별 템플릿

모든 글을 같은 방식으로 처리하면 안 된다. 콘텐츠 타입별로 다른 전략을 써야 한다.

**빌드 로그**: 커밋 데이터 → 구조화된 일지
**기술 튜토리얼**: 단계별 검증 → 코드 예시 포함
**AI 뉴스**: 원문 요약 → 개발자 관점 추가

각 타입별로 별도 프롬프트 템플릿을 만들고, 파일명 패턴으로 자동 분류한다.

```bash
# 파일명으로 콘텐츠 타입 판별
*-build-log-*.md → BUILD_LOG_TEMPLATE
*-tutorial-*.md → TUTORIAL_TEMPLATE  
*-news-*.md → NEWS_TEMPLATE
```

### 관련 기술 개념: Markdown Frontmatter 자동 관리

각 플랫폼마다 메타데이터 형식이 다르다. DEV.to는 frontmatter, Hashnode는 tags 배열, Blogger는 labels다. AI가 이걸 자동 변환하게 했다.

```yaml
# 소스 파일 frontmatter
---
title: "포트폴리오 사이트 빌드 로그"
slug: "portfolio-site-build-log"
tags: ["webdev", "portfolio", "build-log"]
published: true
devto_id: 12345
hashnode_id: "abc-def-ghi"
blogger_id: "1234567890"
---
```

발행 후에는 각 플랫폼의 ID를 다시 frontmatter에 업데이트한다. 이렇게 하면 나중에 수정이나 삭제도 자동화할 수 있다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식들보다 더 효율적인 대안들이 있다.

**MCP 서버 활용**: Claude Desktop의 MCP(Model Context Protocol)를 쓰면 GitHub API를 직접 연동할 수 있다. 워크플로우 파일을 수정하고 바로 커밋까지 AI가 해준다. 현재는 수동으로 복붙하고 있는데, MCP GitHub 서버를 설정하면 훨씬 매끄러워진다.

**Anthropic의 Computer Use API**: 최신 Claude 3.5 Sonnet은 브라우저를 직접 조작할 수 있다. 각 플랫폼의 대시보드에 접속해서 발행 상태를 확인하고, 실패한 글을 다시 발행하는 것도 가능하다. API보다 확실하다.

**GitHub Apps 방식**: 현재는 personal access token을 쓰고 있는데, GitHub Apps로 바꾸면 더 세밀한 권한 관리가 된다. organization에서 쓸 때도 안전하다.

**워크플로우 병렬화**: 지금은 각 플랫폼에 순차 발행하는데, matrix strategy로 병렬 처리하면 시간을 절약할 수 있다. 다만 rate limit 때문에 조심해야 한다.

**콘텐츠 품질 검증**: 발행 전에 AI가 글을 다시 검토하는 단계를 추가할 수 있다. 오타, 링크 유효성, 플랫폼별 가이드라인 준수 여부를 체크한다. GitHub Actions의 PR comment로 피드백을 받으면 더 좋다.

## 정리

- 워크플로우 생성할 때는 API 스펙과 제약조건을 구체적으로 명시한다
- CLAUDE.md에 플랫폼별 규칙을 정리해두고 컨텍스트로 활용한다
- 콘텐츠 타입별로 다른 프롬프트 전략을 써야 한다
- 단계별로 검증하면서 점진적으로 확장하는 게 안전하다

<details>
<summary>이번 작업의 커밋 로그</summary>

ece75e5 — post: build logs 2026-03-19 (2 posts, en)
244fbcf — post: build logs 2026-03-19 (2 posts, en)  
e4c1443 — chore: update published articles [skip ci]
3067d14 — chore: update published articles [skip ci]
e14fd1b — post: build logs 2026-03-19 (2 posts, en)
be69eca — chore: update published articles [skip ci]
b872ce0 — post: build logs 2026-03-19 (2 posts, en)
be9979b — chore: update published articles [skip ci]
3ffefc9 — fix: DEV.to에 한국어(-ko.md) 파일 발행 스킵
05e904e — post: build logs 2026-03-18 (2 posts, en)
4de9884 — post: build logs 2026-03-18 (2 posts, en)
2bb1330 — post: build logs 2026-03-18 (2 posts, en)
d455bdf — chore: update published articles [skip ci]
2ac70e2 — chore: update published articles [skip ci]
1a019c3 — post: build logs 2026-03-18 (2 posts, en)
7f105fb — chore: update published articles [skip ci]
0665de4 — post: build logs 2026-03-17 (2 posts, en)
90f8079 — chore: update published articles [skip ci]
d307780 — post: build logs 2026-03-17 (1 posts, en)
2d578e1 — chore: update published articles [skip ci]

</details>