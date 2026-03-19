---
title: "기술 블로그 자동화 파이프라인 구축하기 — GitHub Actions로 멀티 플랫폼 발행"
project: "dev_blog"
date: 2026-03-19
lang: ko
tags: [chore, fix, feat]
---

기술 블로그를 운영하면서 가장 귀찮은 건 여러 플랫폼에 똑같은 글을 계속 올리는 일이다. 이번에 GitHub Actions를 활용해서 한 번 작성하면 DEV.to, Hashnode, Blogger에 자동으로 발행되는 시스템을 만들어봤다. AI를 어떻게 활용해서 이런 자동화 파이프라인을 구축했는지, 어떤 프롬프팅 패턴이 효과적이었는지 정리해본다.

## 배경: 무엇을 만들고 있는가

개발 블로그 자동화 시스템을 구축하고 있다. 마크다운으로 글을 쓰면 여러 플랫폼에 자동으로 발행되는 워크플로우가 목표다. 현재 상태는 다음과 같다:

- GitHub 저장소에 마크다운 파일로 블로그 포스트 관리
- GitHub Actions로 DEV.to, Hashnode, Blogger 자동 발행  
- 한국어/영어 버전 분리 관리
- 발행 상태 추적 및 로그 관리
- 저조한 조회수 글 자동 삭제 기능

이번 작업의 목표는 워크플로우 안정화와 발행 로직 개선이었다.

## 워크플로우 설계를 위한 구조화 프롬프팅

GitHub Actions 워크플로우를 설계할 때 가장 중요한 건 전체 플로우를 단계별로 쪼개서 AI에게 설명하는 것이다.

> "기술 블로그 자동 발행 GitHub Actions 워크플로우를 설계해줘. 요구사항:
> 1. 마크다운 frontmatter에서 메타데이터 파싱
> 2. DEV.to API로 글 발행 (한국어 제외)
> 3. Hashnode GraphQL API로 영어 글만 발행
> 4. Blogger API OAuth 방식으로 영어 글만 발행
> 5. 각 플랫폼별 발행 URL을 원본 마크다운에 기록
> 6. 실패 시 에러 로그 남기기
>
> 워크플로우는 모듈화해서 각 플랫폼을 독립적인 job으로 처리하되, 순서 보장해줘."

이렇게 쓰면 안 된다:

> "블로그 자동 발행 워크플로우 만들어줘"

구체적인 API 스펙과 제약 조건을 명시해야 실제로 사용할 수 있는 코드가 나온다. 특히 각 플랫폼별로 다른 인증 방식과 데이터 형식을 정확히 전달하는 게 핵심이다.

## Claude Code로 API 인증 로직 처리하기

OAuth나 API 키 처리같은 보안 관련 코드는 Claude Code의 agent 모드가 특히 유용하다. 

`/commit` 명령으로 전체 컨텍스트를 전달한 후 다음과 같이 요청한다:

> "Blogger API OAuth 2.0 refresh token 방식으로 인증 구현해줘. GitHub Secrets에서 CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN 읽어와서 access token 갱신하고, 블로그 포스트 발행까지 처리. 에러 핸들링과 rate limiting 고려해서 작성해줘."

Claude Code의 장점은 기존 워크플로우 구조를 파악하고 일관된 패턴으로 코드를 생성한다는 것이다. 특히 `CLAUDE.md`에 다음과 같이 설정해두면 더 정확한 결과를 얻을 수 있다:

```markdown
# Project Context
- Tech blog automation system using GitHub Actions
- Multiple platform publishing: DEV.to, Hashnode, Blogger
- Markdown frontmatter for metadata management
- Korean/English content separation

# Code Style
- Use Node.js for GitHub Actions
- Async/await pattern for API calls
- Proper error handling with try-catch
- Rate limiting with delays
- Comprehensive logging
```

## 멀티 플랫폼 API 처리의 핵심 패턴

각 플랫폼마다 API 형식이 다르기 때문에 변환 로직이 필요하다. 이 부분을 AI에게 시킬 때는 **입력/출력 예시**를 구체적으로 제시하는 게 효과적이다.

> "마크다운 frontmatter를 각 플랫폼 API 형식으로 변환하는 함수 만들어줘.
>
> 입력 예시:
> ```yaml
> title: "GitHub Actions로 멀티 플랫폼 블로그 자동화"
> description: "기술 블로그 자동 발행 시스템 구축기"
> tags: ["github-actions", "automation", "blog"]
> published: true
> ```
>
> 출력 형식:
> - DEV.to: title, description, tags, body_markdown, published
> - Hashnode: title, subtitle, contentMarkdown, tags, publishedAt
> - Blogger: title, content (HTML 변환), labels
>
> 각 플랫폼별 태그 제한과 HTML/마크다운 요구사항 고려해서 작성해줘."

이렇게 구체적인 스펙을 제시하면 실제 API 문서를 참고해서 정확한 변환 로직을 생성한다.

## 에러 핸들링과 재시도 로직 자동화

API 호출이 실패할 경우를 대비한 재시도 로직도 AI가 잘 처리할 수 있는 영역이다. 하지만 단순히 "재시도 로직 넣어줘"가 아니라 **비즈니스 로직**을 명확히 해야 한다.

> "API 호출 실패 시 재시도 전략 구현해줘:
> 1. HTTP 429 (rate limit): exponential backoff로 최대 3회 재시도
> 2. HTTP 401/403 (인증 실패): 즉시 실패, 토큰 갱신 로직 호출
> 3. HTTP 5xx (서버 에러): 1초 간격으로 최대 5회 재시도  
> 4. 네트워크 타임아웃: 3초 후 재시도, 최대 3회
> 5. 모든 재시도 실패 시: 에러 로그 저장하고 다음 플랫폼 진행
>
> 각 재시도마다 상세한 로그 남기고, GitHub Actions 환경에서 보기 좋게 출력해줘."

이런 세밀한 요구사항을 제시하면 production-ready 수준의 에러 핸들링 코드를 생성한다.

## 발행 상태 추적을 위한 데이터 구조 설계

블로그 자동화에서 중요한 부분 중 하나가 발행 상태 추적이다. 어떤 글이 어느 플랫폼에 발행됐는지, URL은 뭔지 관리해야 한다.

이 부분을 AI에게 맡길 때는 **데이터 구조부터 정의**하고 시작한다:

> "`publish-log.txt` 파일로 발행 상태를 관리하는 시스템 설계해줘.
>
> 데이터 구조:
> ```
> filename|platform|status|url|published_at
> 2026-03-19-portfolio-site-build-log-en.md|devto|success|https://dev.to/jidong/...|2026-03-19T10:30:00Z
> ```
>
> 요구사항:
> 1. 발행 성공 시 URL과 timestamp 기록
> 2. 실패 시 status를 'failed', url을 error message로 저장
> 3. 중복 발행 방지를 위한 체크 로직
> 4. 로그 파일 자동 백업 (100줄 초과 시)
> 5. GitHub Actions에서 git commit으로 로그 업데이트
>
> Node.js로 구현하고, 파일 I/O 에러 핸들링 포함해줘."

이렇게 데이터 구조와 비즈니스 로직을 명확히 정의하면 일관성 있는 코드를 얻을 수 있다.

## 컨텐츠 품질 관리 자동화

단순 발행뿐만 아니라 컨텐츠 품질 관리도 자동화했다. 조회수가 낮은 글을 자동으로 unpublish하는 기능이다.

> "DEV.to API로 게시글 조회수 확인해서 cleanup 워크플로우 만들어줘:
> 1. 발행된 지 7일 이상된 글 중에서
> 2. 조회수 50 미만인 글을 찾아서
> 3. 카테고리가 'build-log'나 'news'인 글만 unpublish
> 4. unpublish 전에 백업용 JSON 파일로 저장
> 5. 작업 결과를 Slack 웹훅으로 알림
>
> API rate limit 고려해서 요청 간격 조절하고, dry-run 모드도 지원해줘."

이런 복합적인 로직도 AI가 잘 처리한다. 핵심은 **단계별로 쪼개서** 각 단계의 요구사항을 명확히 하는 것이다.

## 더 나은 방법은 없을까

현재 구현한 방식보다 더 효율적인 대안들이 있다:

**1. Zapier나 IFTTT 활용**
- GitHub webhook으로 트리거하면 코딩 없이 멀티 플랫폼 발행 가능
- 하지만 비용이 들고, 복잡한 로직 처리에 한계가 있다

**2. GitHub Apps 방식**
- 현재는 Personal Access Token 사용 중인데, GitHub Apps로 바꾸면 더 안전하다
- 세밀한 권한 제어와 audit log를 얻을 수 있다

**3. Serverless Functions 활용**  
- Vercel Functions나 Netlify Functions로 API endpoint 만들면 webhook 방식으로 더 유연하게 처리 가능
- GitHub Actions의 실행 시간 제약에서 벗어날 수 있다

**4. Content Management System 도입**
- Strapi나 Ghost 같은 Headless CMS를 중간에 두면 컨텐츠 관리가 더 체계적이다
- 하지만 인프라 비용과 복잡도가 증가한다

**5. RSS 기반 자동화**
- 각 플랫폼이 RSS를 지원한다면 가장 간단한 방법이다
- 하지만 플랫폼별 커스터마이징이 어렵다

현재 방식의 장점은 **완전한 통제권**과 **비용 제로**다. 복잡한 로직도 자유롭게 구현할 수 있고, GitHub의 무료 tier 내에서 충분히 운영 가능하다.

## 정리

- **구조화된 프롬프팅**으로 복잡한 워크플로우도 단계별로 구현할 수 있다
- **Claude Code의 agent 모드**는 기존 코드 컨텍스트를 파악해서 일관된 패턴으로 코드를 생성한다  
- **입출력 예시**를 구체적으로 제시하면 API 연동 코드의 정확도가 높아진다
- **비즈니스 로직을 명확히 정의**하면 production-ready 수준의 에러 핸들링을 얻을 수 있다

<details>
<summary>이번 작업의 커밋 로그</summary>

ece75e5 — post: build logs 2026-03-19 (2 posts, en)
244fbcf — post: build logs 2026-03-19 (2 posts, en)  
3ffefc9 — fix: DEV.to에 한국어(-ko.md) 파일 발행 스킵
6a4f63d — feat: Blogger 영어 글만 발행 + 트렌디 인라인 CSS 적용
a365f54 — feat: Blogger 워크플로우 OAuth refresh token 방식으로 업데이트
765902d — feat: Medium → Hashnode 워크플로우 교체 (영어 글 자동 발행)
cf8a33f — feat: Medium + Blogger 자동 발행 워크플로우 추가
5b899f4 — fix: exclude build-log posts from DEV.to publishing
910e21d — chore: remove chatbot legislation post + add cleanup workflow
f2fc77e — chore: cleanup workflow — unpublish low-view news + build logs

</details>