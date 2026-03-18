---
title: "GitHub Actions로 멀티플랫폼 블로그 발행 자동화하는 AI 워크플로우"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

기술 블로그 운영하면서 가장 귀찮은 게 여러 플랫폼에 글을 올리는 일이다. DEV.to, Hashnode, Blogger에 같은 글을 수동으로 발행하고, 메타데이터 관리하고, 링크 추적하는 건 시간 낭비다. 이번에 GitHub Actions와 AI를 조합해서 이 모든 과정을 완전 자동화했다. 이 글에서는 어떤 프롬프팅 전략으로 워크플로우를 설계하고, 어떤 함정을 피해야 하는지 실전 경험을 공유한다.

## 배경: 무엇을 만들고 있는가

개발 블로그 `dev_blog`를 운영 중이다. 한국어와 영어 콘텐츠를 동시에 작성하고, 여러 플랫폼에 배포한다. 문제는 수동 작업이 너무 많다는 거였다.

- 8개 영어 포스트를 각각 DEV.to, Hashnode, Blogger에 발행
- 발행 후 URL을 frontmatter에 추가
- 조회수 낮은 글들 정리
- 빌드 로그 같은 임시 글들 자동 삭제

이번 목표는 이 모든 과정을 GitHub Actions로 자동화하되, AI가 각 플랫폼별 최적화까지 처리하게 하는 것이었다.

## AI로 멀티플랫폼 API 워크플로우 설계하기

### 프롬프팅 전략: 제약 조건을 먼저 정의한다

플랫폼별 발행 로직을 AI에게 맡길 때 가장 중요한 건 **제약 조건을 명확히 정의**하는 것이다. 각 플랫폼마다 API 스펙, 메타데이터 형식, 에러 처리 방식이 다르기 때문이다.

> "DEV.to, Hashnode, Blogger API를 사용해서 마크다운 포스트를 자동 발행하는 GitHub Actions 워크플로우를 만들어줘. 
> 
> 제약 조건:
> 1. 영어 포스트만 발행 (`lang: en`)
> 2. `published: true`인 글만 대상
> 3. 이미 발행된 글은 스킵 (frontmatter의 `devto_url` 체크)
> 4. 발행 후 URL을 frontmatter에 자동 추가
> 5. 각 플랫폼별 메타데이터 최적화 (태그, 설명 등)
> 6. API 에러 시 다른 플랫폼 발행은 계속 진행"

이렇게 쓰면 안 된다:
> "블로그 자동 발행 워크플로우 만들어줘"

### Claude Code 활용: YAML 템플릿과 스크립트 분리

GitHub Actions 워크플로우는 YAML 파일과 실행 스크립트로 나뉜다. `CLAUDE.md`에서 이 구조를 명시해두면 AI가 일관된 패턴으로 코드를 생성한다.

```markdown
# CLAUDE.md

## Project Structure
- `.github/workflows/` - GitHub Actions workflows
- `scripts/` - Publishing and automation scripts
- `posts/` - Markdown posts with frontmatter

## Conventions
- Workflow files use kebab-case: `publish-to-platforms.yml`
- Scripts are in TypeScript/Node.js
- Environment variables for API keys: `DEVTO_API_KEY`, `HASHNODE_API_KEY`
```

이렇게 설정하면 AI가 파일들을 올바른 위치에 생성하고, 네이밍 컨벤션도 지킨다.

### 구조화 전략: 플랫폼별 모듈화

하나의 거대한 스크립트 대신 플랫폼별로 모듈을 분리했다. AI에게 이런 식으로 요청했다:

> "각 플랫폼별로 별도 함수를 만들어줘:
> - `publishToDevTo(post, apiKey)`
> - `publishToHashnode(post, apiKey)` 
> - `publishToBlogger(post, credentials)`
> 
> 각 함수는 독립적으로 동작해야 하고, 에러가 나도 다른 함수 실행에 영향 없어야 해. 발행 성공하면 URL을 반환하고, 실패하면 null 반환해."

이 접근법의 장점:
- 하나의 플랫폼에서 에러가 나도 다른 플랫폼 발행은 계속됨
- 각 플랫폼의 API 스펙 변경에 독립적으로 대응 가능
- 테스트하기 쉬움

## OAuth와 API 키 관리를 AI에게 맡기는 법

### 보안 설정 자동화

API 키와 OAuth 토큰 관리는 실수하기 쉬운 영역이다. AI에게 이 부분을 맡길 때는 **보안 모범 사례를 구체적으로 명시**해야 한다.

> "GitHub Secrets를 사용해서 API 키를 안전하게 관리하는 워크플로우를 만들어줘.
> 
> 요구사항:
> 1. DEV.to는 API 키 방식 (`DEVTO_API_KEY`)
> 2. Hashnode는 GraphQL + API 키 (`HASHNODE_API_KEY`) 
> 3. Blogger는 OAuth refresh token 방식 (`BLOGGER_REFRESH_TOKEN`, `BLOGGER_CLIENT_ID`, `BLOGGER_CLIENT_SECRET`)
> 4. 절대로 키를 로그에 출력하지 마
> 5. 키가 없으면 해당 플랫폼만 스킵, 전체 실패하지 마"

### Blogger OAuth 갱신 로직

Blogger API는 OAuth refresh token을 주기적으로 갱신해야 한다. 이 로직을 AI가 생성할 때 빠지기 쉬운 함정들:

```javascript
// AI가 생성한 코드에서 자주 누락되는 부분
const refreshAccessToken = async (refreshToken, clientId, clientSecret) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  
  // 이 부분을 빼먹고 생성하는 경우가 많음
  if (!response.ok) {
    console.error('Failed to refresh token:', await response.text());
    return null;
  }
  
  const data = await response.json();
  return data.access_token;
};
```

AI에게 이런 엣지 케이스 처리를 요청할 때는:

> "OAuth refresh token 로직에서 반드시 포함해야 할 것들:
> 1. HTTP 상태 코드 체크
> 2. 응답 본문 파싱 전 유효성 검증
> 3. 에러 발생 시 상세한 로그 출력 (토큰값 제외)
> 4. null 반환으로 graceful degradation"

## 메타데이터 자동 최적화 전략

### 플랫폼별 태그 변환

각 플랫폼마다 지원하는 태그 형식이 다르다. AI에게 이런 변환 로직을 맡길 때 효과적인 패턴:

> "frontmatter의 `tags` 배열을 각 플랫폼에 맞게 변환해줘:
> 
> DEV.to: 최대 4개, 소문자, 하이픈 허용
> Hashnode: 최대 5개, slug 형식 (kebab-case)
> Blogger: 라벨 형식, 공백 허용하지만 쉼표로 구분
> 
> 변환 예시:
> - 'Next.js' → devto: 'nextjs', hashnode: 'nextjs', blogger: 'Next.js'
> - 'AI Development' → devto: 'ai', hashnode: 'ai-development', blogger: 'AI Development'"

### 제목과 설명 최적화

AI가 플랫폼별로 제목을 최적화하게 할 수도 있다. 특히 Hashnode는 SEO에 최적화된 제목을, DEV.to는 커뮤니티 친화적인 톤을 선호한다.

```javascript
const optimizeForPlatform = (post, platform) => {
  switch (platform) {
    case 'devto':
      // 개발자 커뮤니티 톤으로 조정
      return {
        ...post,
        title: post.title.replace('를 ', ' ').replace('하는 ', ' '),
      };
    case 'hashnode':
      // SEO 최적화된 제목
      return {
        ...post,
        title: `${post.title} | Complete Guide`,
      };
  }
};
```

## 자동 정리와 품질 관리

### 저조회 콘텐츠 자동 정리

빌드 로그나 뉴스 포스트 같은 임시성 콘텐츠는 일정 기간 후 자동으로 정리해야 한다. 이런 로직을 AI가 생성할 때 중요한 조건들:

> "DEV.to API를 사용해서 조회수 낮은 글을 자동으로 unpublish하는 워크플로우 만들어줘.
> 
> 조건:
> 1. `build-log` 태그가 있는 글만 대상
> 2. 발행일로부터 7일 경과
> 3. 조회수 10회 미만
> 4. unpublish 후 로컬 frontmatter에서 `published: false`로 변경
> 5. 실행 결과를 커밋으로 남김 (`[skip ci]` 포함)"

### 에러 복구 전략

API 호출 실패나 네트워크 에러에 대한 복구 로직도 중요하다. AI가 이런 부분을 놓치지 않게 하려면:

> "각 API 호출에 대해 retry 로직 추가해줘:
> 1. 최대 3회 재시도
> 2. 지수 백오프 (1초, 2초, 4초)
> 3. HTTP 429 (rate limit)는 별도 처리
> 4. 최종 실패 시에도 워크플로우는 성공으로 처리 (다른 플랫폼 영향 방지)"

## 더 나은 방법은 없을까

현재 구현한 방식보다 개선할 수 있는 부분들이 있다.

**GitHub App 방식으로 권한 관리 개선**: 현재는 PAT(Personal Access Token)을 사용하지만, GitHub App을 만들면 더 세밀한 권한 제어가 가능하다. 특히 repository-scoped token으로 보안을 강화할 수 있다.

**Webhook 기반 실시간 발행**: 현재는 cron으로 주기적 실행하지만, push 이벤트에 webhook을 연결하면 글 작성 즉시 발행 가능하다. `workflow_dispatch`와 `push` 트리거를 조합하는 방식이 더 효율적이다.

**플랫폼별 A/B 테스트**: AI에게 같은 글의 여러 버전을 생성하게 하고, 플랫폼별로 다른 버전을 발행해서 성과를 비교하는 방식도 가능하다. Anthropic의 Claude API에서 `temperature` 값을 조정해 제목이나 설명의 변형을 만들 수 있다.

**메타데이터 스키마 검증**: 현재는 frontmatter 파싱에 에러 처리만 있지만, JSON Schema나 Zod 같은 라이브러리로 메타데이터 유효성을 미리 검증하면 런타임 에러를 줄일 수 있다.

**Analytics 연동**: Google Analytics나 각 플랫폼의 analytics API를 연동해서 성과 데이터를 자동으로 수집하고, 인기 없는 글을 자동으로 아카이브하는 로직도 추가할 수 있다.

## 정리

AI를 활용한 멀티플랫폼 블로그 자동화에서 핵심은 이런 것들이다:

- 제약 조건을 구체적으로 정의해야 AI가 정확한 코드를 생성한다
- 플랫폼별 모듈화로 에러 전파를 방지하고 유지보수성을 높인다  
- OAuth와 API 키 관리에서는 보안 모범 사례를 명시적으로 요청한다
- 에러 복구와 retry 로직을 빼먹지 않게 주의한다

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