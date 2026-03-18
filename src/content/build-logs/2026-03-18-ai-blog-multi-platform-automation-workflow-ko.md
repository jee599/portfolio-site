---
title: "GitHub Actions로 AI 블로그를 멀티 플랫폼에 자동 배포하는 워크플로우 설계법"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

블로그 포스팅을 여러 플랫폼에 동시 배포하는 것은 번거로운 일이다. 하지만 AI를 활용해 이 과정을 완전 자동화할 수 있다. 이번 글에서는 GitHub Actions로 DEV.to, Medium, Hashnode, Blogger에 자동 배포하는 워크플로우를 구축하면서 어떻게 AI를 활용했는지, 어떤 프롬프팅 패턴이 효과적인지 다룬다.

## 배경: 무엇을 만들고 있는가

기술 블로그를 운영하면서 여러 플랫폼에 콘텐츠를 배포해야 했다. 한국어 글은 자체 블로그에, 영어 글은 DEV.to, Hashnode, Blogger에 자동으로 올라가야 한다. 수동으로 하기엔 너무 번거롭고, 실수도 많이 생긴다.

목표는 단순했다. markdown 파일을 git push하면 자동으로 모든 플랫폼에 배포되는 시스템을 만드는 것. 그리고 이 과정에서 AI를 최대한 활용해 코드 작성, 디버깅, 최적화까지 모두 자동화하는 것이었다.

## AI로 멀티 플랫폼 API 통합 코드 생성하기

각 플랫폼마다 API 스펙이 다르다. DEV.to는 REST API, Medium은 OAuth 인증, Hashnode는 GraphQL, Blogger는 Google API를 쓴다. 이런 복잡한 통합 코드를 AI에게 한번에 생성시키려면 구체적인 제약 조건이 필요하다.

**효과적인 프롬프트 패턴:**

> "GitHub Actions workflow를 작성해줘. 요구사항:
> 1. `posts/` 폴더의 markdown 파일 중 `published: true`이고 언어가 `en`인 것만 처리
> 2. DEV.to API로 발행, 이미 발행된 글은 업데이트
> 3. frontmatter에서 title, tags, canonical_url 추출
> 4. API 응답으로 받은 URL을 다시 markdown 파일에 저장
> 5. 에러 발생시 전체 중단하지 말고 로그만 남기고 계속 진행
> 
> 환경변수: `DEV_TO_API_KEY`, 레포지토리: public
> 
> 기존 workflow 파일이 있으면 기능 추가하지 말고 완전히 새로 작성해."

이렇게 쓰면 안 된다:
> "DEV.to에 자동 배포하는 GitHub Actions 만들어줘"

**핵심은 제약 조건의 구체성이다.** "이미 발행된 글은 업데이트"라는 조건을 주면 AI가 중복 발행 방지 로직을 알아서 넣는다. "에러 발생시 계속 진행"이라고 하면 `continue-on-error: true`나 try-catch로 감싸는 코드를 생성한다.

**Claude Code에서 slash commands 활용법:**

```
/commit "feat: DEV.to 자동 발행 워크플로우 추가"
```

commit 메시지도 패턴이 있다. `feat:`, `chore:`, `fix:` 접두사를 일관성 있게 쓰면 나중에 changelog 생성할 때 유용하다. AI에게 이런 컨벤션을 학습시키려면 `CLAUDE.md`에 명시해둔다:

```markdown
## Git Commit Conventions
- feat: 새 기능 추가
- fix: 버그 수정  
- chore: 빌드/배포 관련
- refactor: 코드 구조 개선
```

## 플랫폼별 API 차이점을 AI가 처리하게 하는 법

각 플랫폼의 API 스펙을 AI에게 학습시키는 가장 좋은 방법은 **실제 API 응답 예시를 주는 것**이다. 문서 링크만 주면 AI가 잘못 이해할 수 있다.

**Medium API 통합 프롬프트:**

> "Medium API 통합 추가해줘. 기존 DEV.to workflow에 step 하나 더 넣으면 된다.
> 
> Medium API 특징:
> - OAuth 토큰 방식: `Authorization: Bearer {TOKEN}`  
> - 먼저 `/v1/me` 호출해서 userId 받아야 함
> - 발행: `POST /v1/users/{userId}/posts`
> - 응답 예시: `{"data": {"id": "abc123", "url": "https://medium.com/@user/title-abc123"}}`
> 
> 환경변수: `MEDIUM_TOKEN`
> frontmatter에 `medium_url` 필드 추가해서 URL 저장
> 
> 이미 `medium_url`이 있으면 skip (중복 방지)"

**Hashnode GraphQL 쿼리 생성:**

> "Hashnode API는 GraphQL이다. mutation 예시:
> 
> ```graphql
> mutation CreatePost($input: CreatePostInput!) {
>   createPost(input: $input) {
>     post {
>       id
>       url
>     }
>   }
> }
> ```
> 
> variables에 title, content, tags 넣어야 함. content는 markdown을 그대로 보내면 됨.
> GitHub Actions에서 curl로 GraphQL 호출하는 코드 작성해줘."

AI가 GraphQL을 처음 다룰 때 자주 하는 실수는 variables를 JSON string으로 escape하지 않는 것이다. 이런 부분을 미리 지적해주면 정확한 코드를 생성한다.

## 대규모 워크플로우 디버깅을 AI에게 맡기는 전략

60개 커밋이 쌓이는 과정에서 수많은 에러가 발생했다. API rate limit, OAuth token 만료, JSON parsing 실패 등. 이런 에러들을 사람이 일일이 고치려면 시간이 너무 오래 걸린다.

**에러 로그 기반 디버깅 프롬프트:**

> "GitHub Actions 실행 실패했다. 로그:
> 
> ```
> Error: Request failed with status code 401
>   at makeRequest (publish.js:45)
>   Response: {"error": "unauthorized", "error_description": "The access token expired"}
> ```
> 
> 문제점 분석하고 수정 코드 제공해줘. 
> OAuth refresh token 방식으로 바꿔야 하면 전체 flow 다시 설계해도 된다."

**AI의 장점은 에러 패턴을 빠르게 인식한다는 것이다.** 401 에러를 보면 인증 문제인지, rate limit인지, token 형식 문제인지 바로 구분한다. 그리고 해결책도 구체적으로 제시한다.

**배치 처리 에러 핸들링:**

> "현재 workflow가 하나 실패하면 전체가 멈춘다. 각 플랫폼별로 독립적으로 처리하고, 실패한 것만 로그에 남기고 나머지는 계속 진행하게 수정해줘.
> 
> 최종 step에서 성공/실패 개수 요약해서 출력하면 좋겠다."

이런 요구사항을 주면 AI가 `Promise.allSettled()`나 try-catch로 감싸는 패턴을 자동으로 적용한다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식은 각 플랫폼별로 별도 workflow step을 만드는 방식이었다. 하지만 더 효율적인 대안들이 있다.

**1. MCP Server를 활용한 통합 관리**

Anthropic의 Model Context Protocol을 쓰면 각 플랫폼 API를 하나의 MCP server로 추상화할 수 있다. Claude가 직접 API 호출을 하면서 실시간으로 에러를 수정한다.

```json
{
  "mcpServers": {
    "blog-publisher": {
      "command": "node",
      "args": ["blog-publisher-mcp/server.js"],
      "env": {
        "DEV_TO_API_KEY": "${DEV_TO_API_KEY}",
        "MEDIUM_TOKEN": "${MEDIUM_TOKEN}"
      }
    }
  }
}
```

**2. GitHub Apps로 더 세밀한 제어**

GitHub Actions 대신 GitHub Apps를 만들면 webhook으로 실시간 처리가 가능하다. 특정 파일이 변경됐을 때만 트리거되고, commit status도 더 상세하게 업데이트할 수 있다.

**3. Anthropic의 Computer Use API**

Claude가 직접 브라우저를 조작해서 각 플랫폼에 로그인하고 포스팅하는 방식도 가능하다. API 제한이 있는 플랫폼에서 유용하다.

**4. 비용 최적화 관점**

현재 방식은 매번 모든 파일을 체크한다. 하지만 git diff를 활용하면 변경된 파일만 처리할 수 있다. 대용량 블로그에서는 비용 차이가 크다.

```yaml
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v35
  with:
    files: posts/*.md
```

## 정리

AI를 활용한 블로그 자동화에서 핵심은 **구체적인 제약 조건과 에러 케이스를 미리 명시하는 것**이다. "자동 배포 만들어줘"가 아니라 중복 방지, 에러 핸들링, 데이터 형식까지 구체적으로 지정해야 한다.

GitHub Actions 디버깅은 **에러 로그를 그대로 AI에게 주는 것**이 가장 효과적이다. 추상적으로 설명하지 말고 raw log를 복붙한다.

MCP Server나 Computer Use API 같은 **최신 도구를 활용하면 더 간단한 구조**로 같은 결과를 얻을 수 있다.

각 플랫폼의 API 스펙 차이는 **실제 응답 예시를 주면** AI가 정확하게 처리한다.

<details>
<summary>이번 작업의 커밋 로그</summary>

05e904e — post: build logs 2026-03-18 (2 posts, en)
4de9884 — post: build logs 2026-03-18 (2 posts, en)  
2bb1330 — post: build logs 2026-03-18 (2 posts, en)
d455bdf — chore: update published articles [skip ci]
765902d — feat: Medium → Hashnode 워크플로우 교체 (영어 글 자동 발행)
cf8a33f — feat: Medium + Blogger 자동 발행 워크플로우 추가
a365f54 — feat: Blogger 워크플로우 OAuth refresh token 방식으로 업데이트
6a4f63d — feat: Blogger 영어 글만 발행 + 트렌디 인라인 CSS 적용
6e951d4 — post: English versions for 8 Korean blog posts
f2fc77e — chore: cleanup workflow — unpublish low-view news + build logs
910e21d — chore: remove chatbot legislation post + add cleanup workflow

</details>