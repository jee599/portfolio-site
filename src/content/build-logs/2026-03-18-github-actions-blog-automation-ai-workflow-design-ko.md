---
title: "GitHub Actions로 블로그 자동화 파이프라인 만들기 — AI 에이전트가 워크플로우 설계하는 법"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

커밋 로그를 보면 `chore: update published articles [skip ci]`가 반복된다. 블로그 자동화 파이프라인을 AI와 함께 설계하면서 배운 워크플로우 설계 패턴과 프롬프팅 전략을 정리한다.

## 배경: 다중 플랫폼 블로그 자동화가 필요했다

기술 블로그를 여러 플랫폼에 동시 발행하는 상황이다. DEV.to, Hashnode, Blogger에 영어 글을 자동으로 올리고, 한국어 글은 별도 관리한다. 수동으로 하면 실수가 생기고 시간도 오래 걸린다.

이번 작업의 목표는 GitHub Actions로 완전 자동화된 발행 파이프라인을 만드는 것이었다. AI 에이전트에게 워크플로우 설계를 맡기면서 어떤 프롬프팅이 효과적인지 배웠다.

## 워크플로우 설계: 제약 조건부터 명시한다

AI에게 GitHub Actions 워크플로우를 만들어달라고 할 때 가장 중요한 것은 **제약 조건을 먼저 정의**하는 것이다.

> "블로그 자동화 워크플로우를 만들어줘"

이렇게 막연하게 요청하면 범용적인 답만 나온다. 대신 이렇게 한다:

> "GitHub Actions로 블로그 자동화 파이프라인을 설계해줘. 제약 조건:
> 
> 1. 영어 글(`-en.md`)만 DEV.to, Hashnode, Blogger에 발행
> 2. 한국어 글은 로컬에만 보관, 외부 발행 안 함
> 3. `build-log` 카테고리는 DEV.to에서 제외 (스팸 방지)
> 4. API 응답을 파싱해서 발행 상태를 frontmatter에 업데이트
> 5. 실패 시 rollback 없이 로그만 남기고 계속 진행
> 6. OAuth refresh token 방식으로 인증 (API 키 만료 대응)
> 
> 각 플랫폼별 API 차이점을 고려해서 에러 핸들링도 포함해줘."

이렇게 구체적인 제약을 주면 AI가 훨씬 정교한 워크플로우를 설계한다. 특히 **예외 상황**을 미리 정의하는 것이 핵심이다.

## Claude Code의 MCP 서버 활용법

`CLAUDE.md`에 프로젝트 컨텍스트를 잘 설정해두면 Claude가 워크플로우 파일 구조를 이해한다:

```markdown
# Blog Automation Pipeline

## Architecture
- `.github/workflows/`: GitHub Actions 워크플로우
- `posts/`: 마크다운 포스트 (한/영 분리)
- `publish-log.txt`: 발행 상태 추적

## Publishing Rules
- English posts (`*-en.md`): DEV.to + Hashnode + Blogger  
- Korean posts: Local only
- Build logs: Exclude from DEV.to

## API Integration
- DEV.to: REST API with API key
- Hashnode: GraphQL with token  
- Blogger: OAuth 2.0 with refresh token
```

이 정보가 있으면 Claude가 `/commit` 명령어로 커밋을 생성할 때도 맥락을 고려한다. 워크플로우 파일을 수정하면서 자동으로 관련 스크립트도 함께 업데이트해준다.

**멀티 파일 작업**에서는 `@workspace`로 전체 컨텍스트를 로드한 후 단계별로 진행한다:

1. 워크플로우 YAML 파일 생성
2. 각 플랫폼별 발행 스크립트 작성  
3. 에러 핸들링 및 로깅 로직 추가
4. frontmatter 업데이트 스크립트 연동

각 단계마다 "이전 단계 결과를 확인해봐" 프롬프트를 넣으면 일관성이 유지된다.

## 자동화 스크립트: API 차이점을 구조화한다

각 플랫폼의 API가 다르니까 공통 인터페이스를 만들어야 한다. AI에게 이런 구조화를 시킬 때는 **데이터 플로우**를 명확히 정의한다:

> "3개 플랫폼 API를 추상화해서 공통 발행 인터페이스를 만들어줘. 
>
> Input: 마크다운 파일 경로
> Output: {platform, status, url, error}
>
> DEV.to는 REST, Hashnode는 GraphQL, Blogger는 OAuth 갱신 필요. 각각 다른 에러 코드를 반환하니까 normalize해줘."

AI가 제안한 구조:

```javascript
class PublishingManager {
  async publishToAll(postPath) {
    const results = await Promise.allSettled([
      this.publishToDev(postPath),
      this.publishToHashnode(postPath), 
      this.publishToBlogger(postPath)
    ]);
    
    return results.map(this.normalizeResult);
  }
  
  normalizeResult(result) {
    // 플랫폼별 응답을 통일된 형태로 변환
  }
}
```

이런 추상화 패턴을 AI가 제안하게 하려면 **인터페이스 우선**으로 생각하라고 지시하는 것이 효과적이다.

## GitHub Actions 워크플로우: 조건부 실행 패턴

커밋 메시지에서 `[skip ci]`가 보이는 이유는 **무한 루프 방지** 때문이다. 워크플로우가 frontmatter를 업데이트하면서 또 다른 커밋을 생성하는데, 이게 다시 워크플로우를 트리거하면 안 된다.

AI에게 이런 조건부 실행 로직을 설계하게 할 때는 **상태 머신** 관점으로 접근한다:

> "GitHub Actions 워크플로우에서 순환 트리거를 방지하는 패턴을 설계해줘. 
>
> 시나리오:
> 1. 사용자가 새 포스트 커밋 → 워크플로우 실행
> 2. 워크플로우가 발행 후 frontmatter 업데이트 → 자동 커밋 
> 3. 자동 커밋이 다시 워크플로우를 트리거하면 안 됨
>
> `[skip ci]`, 커밋 작성자 확인, 파일 경로 필터링 등 여러 방법을 조합해줘."

결과적으로 이런 조건 체크가 생긴다:

```yaml
on:
  push:
    paths:
      - 'posts/**/*.md'
    branches: [main]

jobs:
  publish:
    if: >
      !contains(github.event.head_commit.message, '[skip ci]') &&
      github.event.head_commit.author.name != 'github-actions[bot]'
```

## 에러 핸들링: 부분 실패를 허용한다

자동화 파이프라인에서 가장 까다로운 부분이 에러 핸들링이다. 3개 플랫폼 중 1개가 실패해도 나머지는 계속 진행되어야 한다.

AI에게 이런 **resilient 시스템**을 설계하게 하는 프롬프트:

> "블로그 발행 워크플로우에서 부분 실패 허용 패턴을 구현해줘.
>
> 요구사항:
> - DEV.to 실패해도 Hashnode, Blogger는 계속 진행
> - 각 실패는 개별적으로 로깅, 전체 워크플로우는 success
> - 재시도 로직: API 429 에러만 3회 재시도, 나머지는 바로 스킵
> - 실패한 항목은 다음 실행 때 자동으로 재시도"

이런 요구사항을 주면 AI가 `Promise.allSettled()` 패턴과 상태 추적 로직을 함께 제안한다. 핵심은 **전체 실패 vs 부분 실패**를 명확히 구분해서 지시하는 것이다.

## 더 나은 방법은 없을까

현재 방식은 GitHub Actions 내에서 모든 발행 로직을 처리한다. 하지만 더 효율적인 대안들이 있다:

**1. Webhook 기반 아키텍처**
각 플랫폼에서 웹훅을 제공한다면 push → webhook → 발행 순서로 처리할 수 있다. GitHub Actions보다 빠르고 안정적이다.

**2. Serverless Functions**
Vercel Functions나 Netlify Functions로 발행 로직을 분리하면 GitHub Actions는 단순히 HTTP 요청만 보내면 된다. 디버깅과 모니터링이 쉬워진다.

**3. GitHub Apps**
GitHub App으로 만들면 더 세밀한 권한 제어와 webhook 이벤트 처리가 가능하다. 여러 레포지토리에서 재사용할 수 있고, marketplace에 등록도 할 수 있다.

**4. MCP Server 연동**
Claude의 MCP(Model Context Protocol) 서버로 발행 로직을 만들면 AI가 직접 블로그를 관리할 수 있다. 포스트 생성부터 발행까지 완전 자동화가 가능하다.

현재 방식의 **장점**은 GitHub 생태계 내에서 완결된다는 것이다. 외부 서비스 의존성이 없고, Git 히스토리로 모든 변경사항을 추적할 수 있다. **단점**은 GitHub Actions의 실행 시간 제약과 API rate limit 처리의 복잡성이다.

팀 규모가 커지거나 발행 빈도가 높아지면 serverless 방식으로 전환하는 것이 좋다.

## 정리

- AI에게 워크플로우 설계를 맡길 때는 제약 조건과 예외 상황을 먼저 정의한다
- `CLAUDE.md`로 프로젝트 컨텍스트를 설정하면 멀티 파일 작업이 일관성 있게 진행된다  
- API 통합에서는 공통 인터페이스를 만들어 플랫폼 차이점을 추상화한다
- 자동화 파이프라인에서는 부분 실패를 허용하고 순환 트리거를 방지하는 패턴이 필수다

<details>
<summary>이번 작업의 커밋 로그</summary>

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
d023b82 — post: build logs 2026-03-17 (1 posts, en)
451daf4 — post: build logs 2026-03-16 (4 posts, en)
ce037d0 — post: build logs 2026-03-16 (4 posts, en)
1ec519e — chore: update published articles [skip ci]
c822f68 — chore: update published articles [skip ci]
b179be0 — post: build logs 2026-03-16 (4 posts, en)
adfb941 — chore: add Blogger URLs [skip ci]
b255ecb — chore: add Blogger URLs [skip ci]
78371ee — post: build logs 2026-03-16 (4 posts, en)
d153687 — chore: update published articles [skip ci]
b8bb05c — chore: add Blogger URLs [skip ci]
5541356 — chore: add Hashnode URLs [skip ci]
8ae8059 — post: build log series (6 posts, en) + unpublish script
1634cb2 — chore: add Blogger URLs [skip ci]
a6fbd48 — chore: add Hashnode URLs [skip ci]
e7ea767 — chore: set published: true for remaining English posts
520f6bd — chore: update published articles [skip ci]
a7eecd1 — chore: remove blogger metadata from Korean posts
6a4f63d — feat: Blogger 영어 글만 발행 + 트렌디 인라인 CSS 적용
b4c1005 — chore: add Blogger URLs [skip ci]
a365f54 — feat: Blogger 워크플로우 OAuth refresh token 방식으로 업데이트
7036543 — chore: add Hashnode URLs [skip ci]
765902d — feat: Medium → Hashnode 워크플로우 교체 (영어 글 자동 발행)
cf8a33f — feat: Medium + Blogger 자동 발행 워크플로우 추가
5320e38 — chore: update published articles [skip ci]
03159a0 — chore: update published dates [skip ci]
928e424 — chore: add publish-drafts workflow
97a8c51 — chore: update published articles [skip ci]
6e951d4 — post: English versions for 8 Korean blog posts
8573bcf — fix: add debug output for DEV.to API response and improve published check
8b7caf0 — chore: update cleanup workflow to unpublish outdated Korean news articles
622d79f — chore: update published articles [skip ci]
6f58931 — chore: update published articles [skip ci]
f68751a — chore: cleanup workflow — delete all unpublished articles
570ed33 — fix: add User-Agent header to cleanup workflow
f2fc77e — chore: cleanup workflow — unpublish low-view news + build logs
23166c5 — chore: update published articles [skip ci]
910e21d — chore: remove chatbot legislation post + add cleanup workflow
20a53c6 — chore: add cleanup workflow for unpublishing jidonglab/build-log articles
ccd5947 — chore: update published articles [skip ci]
4583fec — post: AI news 2026-03-14 (4 posts, ko)
c4fc0f0 — chore: update published articles [skip ci]
5b899f4 — fix: exclude build-log posts from DEV.to publishing
20d37f0 — chore: update published articles [skip ci]
2db63c6 — post: llmtrio-build-log (en/ko)
4ef5a44 — chore: update published articles [skip ci]
c627849 — chore: update published articles [skip ci]
32ffcfb — chore: update published articles [skip ci]
0c8f0fe — chore: update published articles [skip ci]

</details>