---
title: "블로그 자동화 파이프라인을 AI로 구축하는 법 — 멀티 플랫폼 발행의 현실"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

블로그를 여러 플랫폼에 동시 발행하려다가 복잡한 자동화 파이프라인을 만들게 됐다. GitHub Actions, DEV.to API, Hashnode, Blogger까지 연동하면서 AI가 어떤 부분에서 빛을 발하고 어떤 부분에서 한계를 보이는지 확실히 알게 됐다. 이 글에서는 실제 운영 중인 블로그 자동화 시스템을 AI로 구축할 때 써먹을 수 있는 구체적인 패턴들을 다룬다.

## 배경: 무엇을 만들고 있는가

개인 기술 블로그를 운영하면서 콘텐츠를 여러 플랫폼에 배포해야 하는 상황이었다. DEV.to, Hashnode, Blogger, Medium까지 각각 다른 API와 인증 방식을 가지고 있고, 발행 상태 추적부터 중복 방지까지 신경 쓸 게 한두 개가 아니다.

목표는 단순했다. 마크다운 파일 하나를 커밋하면 모든 플랫폼에 자동으로 발행되고, 각 플랫폼의 URL을 다시 파일에 기록해서 추적할 수 있는 시스템을 만드는 것. 하지만 현실은 OAuth 토큰 갱신, API 응답 파싱, 에러 핸들링까지 복잡한 로직이 필요했다.

## AI에게 워크플로우 로직 설계시키기

### 문제 정의부터 구체화하기

처음에는 막연하게 "자동화 워크플로우 만들어줘"라고 시켰다가 쓸모없는 코드만 받았다. AI는 맥락이 없으면 generic한 답변만 한다.

이렇게 바꿨다:

> "GitHub Actions에서 마크다운 글을 여러 플랫폼에 자동 발행하는 워크플로우를 만들어줘. 요구사항:
> 1. DEV.to API로 영어 글만 발행 (`lang: en` frontmatter 체크)
> 2. 이미 발행된 글은 스킵 (`devto_id` 존재 여부로 판단)
> 3. 발행 후 파일에 `devto_id`와 `devto_url` 추가
> 4. 에러 발생 시 전체 워크플로우 중단하지 말고 다음 파일 계속 처리
> 
> 사용할 환경변수: `DEVTO_API_KEY`
> 파일 경로: `posts/*.md`"

이렇게 구체적으로 명시하자 실제로 동작하는 코드가 나왔다. AI는 "뭘 만들까?"보다 "어떻게 만들까?"에 훨씬 강하다.

### 프롬프트에 제약 조건 넣기

특히 중요한 건 에러 처리 방식이다. AI가 생성한 첫 번째 버전은 하나라도 실패하면 전체가 멈췄다. 

> "각 파일 처리를 독립적으로 만들어줘. 한 파일에서 API 에러가 나도 다른 파일들은 계속 처리되어야 한다. `continue-on-error`나 try-catch 블록으로 처리해."

이런 식으로 제약을 명시해야 production-ready한 코드가 나온다. AI는 happy path만 생각하는 경향이 있어서 edge case는 사람이 챙겨줘야 한다.

### 워크플로우 단계별로 쪼개기

한 번에 모든 플랫폼 연동을 시키려고 하면 AI도 헷갈린다. 이렇게 단계를 나눠서 각각 완성하고 조합했다:

1. "DEV.to 발행 워크플로우만 먼저 만들어줘"
2. "Hashnode API 연동 추가해줘"
3. "Blogger OAuth 처리 로직 추가해줘"
4. "세 플랫폼을 병렬로 처리하도록 수정해줘"

각 단계마다 테스트하고 다음으로 넘어가니까 디버깅도 쉽고 AI도 더 정확한 코드를 생성했다.

## OAuth 토큰 갱신을 AI로 처리하기

### Blogger API의 복잡함

Blogger API는 다른 플랫폼과 달리 단순한 API key가 아니라 OAuth 2.0 flow를 써야 한다. access token이 1시간마다 만료되고, refresh token으로 갱신해야 하는 구조다.

처음에는 이런 프롬프트를 썼다:

> "Blogger API OAuth 인증 처리해줘"

당연히 generic한 예제만 나왔다. 구체적으로 바꿨다:

> "GitHub Actions에서 Blogger API를 쓸 때 OAuth token 갱신 로직을 만들어줘.
> 환경변수: `BLOGGER_REFRESH_TOKEN`, `BLOGGER_CLIENT_ID`, `BLOGGER_CLIENT_SECRET`
> 
> 로직:
> 1. refresh token으로 새 access token 발급
> 2. 발급받은 token으로 API 호출
> 3. token 만료 에러(401) 발생 시 재갱신 시도
> 4. 최대 3번까지 retry
> 
> curl이나 node.js 중에 뭐가 더 간단한지 추천도 해줘"

AI가 두 방식 다 제안했는데, GitHub Actions에서는 `jq`를 쓸 수 있어서 bash + curl 조합이 더 간단했다. Node.js 환경 셋업할 필요 없이 바로 쓸 수 있었다.

### 토큰 갱신 로직 구조화

AI가 생성한 OAuth 갱신 로직에 한 가지 문제가 있었다. 매번 새 토큰을 발급받아서 API rate limit에 걸릴 위험이 있었다.

> "토큰 갱신을 최적화해줘. access token을 환경변수로 저장해두고, 401 에러가 날 때만 갱신하도록 수정해줘. GitHub Actions에서 step 간에 변수를 공유하는 방법도 알려줘"

`$GITHUB_OUTPUT`을 써서 step 간 변수 전달하는 패턴을 알려줬다. 이런 세부사항은 AI가 platform-specific한 지식을 잘 갖고 있어서 도움이 됐다.

## 멀티 플랫폼 컨텐츠 변환 자동화

### 플랫폼별 frontmatter 차이 처리

각 플랫폼마다 frontmatter 형식이 다르다. DEV.to는 `published: true`인데 Hashnode는 `publishedAt` 필드를 쓴다. 

이런 차이점들을 AI에게 학습시켜서 변환 로직을 만들어달라고 했다:

> "마크다운 frontmatter를 플랫폼별로 변환하는 함수를 만들어줘.
> 
> 입력 예시:
> ```yaml
> title: "AI 블로그 자동화"
> date: "2026-03-18"
> published: true
> tags: ["AI", "automation"]
> ```
> 
> 출력:
> - DEV.to: 그대로 사용
> - Hashnode: `published` → `publishedAt`, `tags` → `tag` 배열로 변환
> - Blogger: HTML title tag로 변환, 나머지는 무시
> 
> sed나 awk 같은 shell 도구로 만들어줘"

실제로는 `yq`라는 YAML 파서를 써서 더 안전하게 처리했다. AI가 여러 옵션을 제안해줘서 선택할 수 있었다.

### 컨텐츠 길이 제한 처리

Blogger는 본문 길이 제한이 있고, DEV.to는 특정 HTML 태그를 지원하지 않는다. 이런 제약사항들을 프롬프트에 넣어서 전처리 로직을 만들었다:

> "마크다운 컨텐츠를 플랫폼별로 전처리해줘.
> - Blogger: 10000자 초과 시 '...더보기' 링크 추가
> - DEV.to: `<details>` 태그를 markdown collapsible로 변환
> - 모든 플랫폼: 상대 경로 이미지를 절대 URL로 변환
> 
> 입력은 stdin, 출력은 stdout으로 처리하는 shell script로 만들어줘"

이런 식으로 구체적인 변환 규칙을 제시하면 AI가 꽤 정확한 전처리 스크립트를 만들어준다.

## GitHub Actions 워크플로우 최적화

### 병렬 처리 vs 순차 처리

처음에는 모든 플랫폼에 동시에 발행하려고 했다. AI에게 병렬 처리 워크플로우를 만들어달라고 했더니 `matrix` strategy를 써서 각 플랫폼을 독립적으로 처리하는 코드를 줬다.

하지만 실제로 돌려보니 문제가 있었다. 여러 job이 동시에 같은 파일을 수정하려고 해서 git conflict가 발생했다. 

> "각 플랫폼 발행 후 frontmatter에 URL을 추가하는 부분에서 conflict가 난다. 순차 처리로 바꿔줘. 하나씩 발행하고 파일을 업데이트한 다음 git commit하고 다음 플랫폼 처리하도록"

AI가 `needs` dependency를 써서 순차 실행하는 워크플로우로 바꿔줬다. 성능은 조금 느려졌지만 안정성이 훨씬 좋아졌다.

### 조건부 실행 최적화

모든 커밋마다 워크플로우가 돌면 API quota를 낭비한다. 실제로 마크다운 파일이 변경됐을 때만 실행하도록 최적화했다:

> "GitHub Actions에서 `posts/` 디렉토리의 `.md` 파일이 변경됐을 때만 실행하도록 해줘. 그리고 변경된 파일들만 처리하도록 최적화해줘"

`paths` 필터와 `git diff`를 조합해서 변경된 파일만 골라내는 로직을 만들어줬다. 이런 최적화는 AI가 꽤 잘한다.

## 에러 처리와 로깅 전략

### API 응답 파싱 실패 대응

각 플랭폼 API마다 응답 형식이 다르고, 때로는 예상치 못한 필드가 누락되거나 추가된다. AI에게 robust한 파싱 로직을 만들어달라고 했다:

> "DEV.to API 응답에서 article ID를 추출하는데, 가끔 `id` 필드가 없거나 null일 수 있다. fallback 로직을 추가해줘:
> 1. `id` 필드 확인
> 2. 없으면 `slug`에서 숫자 추출 시도  
> 3. 그것도 실패하면 에러 로그 남기고 다음 파일 처리
> 
> jq로 JSON 파싱하는 버전으로 만들어줘"

이런 edge case 처리는 AI가 놓치기 쉬운 부분인데, 명시적으로 요구하면 꽤 견고한 코드를 만들어준다.

### 로그 레벨 구조화

워크플로우가 복잡해지면서 디버깅이 어려워졌다. AI에게 로깅 표준을 만들어달라고 했다:

> "GitHub Actions에서 구조화된 로깅을 하고 싶다. 
> - INFO: 정상 처리 (파일 발행 성공 등)
> - WARN: 복구 가능한 에러 (토큰 갱신 등)  
> - ERROR: 처리 실패 (API 에러 등)
> - DEBUG: 상세 정보 (API 응답 내용 등)
> 
> echo로 색깔 코딩도 추가해줘. 그리고 GitHub Actions 로그에서 collapse 가능한 섹션으로 만드는 방법도 알려줘"

`::group::` annotation을 써서 섹션을 만드는 방법까지 알려줘서 로그 가독성이 훨씬 좋아졔다.

## 더 나은 방법은 없을까

### GitHub App 방식 고려

현재는 personal access token을 쓰고 있는데, GitHub App을 만들면 더 세밀한 권한 제어가 가능하다. Anthropic 공식 문서에서도 프로덕션 환경에서는 App 방식을 권장한다.

특히 multiple repository에서 같은 워크플로우를 쓴다면 GitHub App이 낫다. 각 repo마다 개별 토큰 관리할 필요 없이 중앙에서 관리할 수 있다.

### Webhook 기반 실시간 처리

현재는 git push 트리거를 쓰는데, 플랫폼에서 콘텐츠 상태 변경을 실시간으로 받으려면 webhook이 필요하다. 예를 들어 DEV.to에서 글이 featured되거나 조회수가 특정 threshold를 넘으면 자동으로 다른 플랫폼에도 홍보하는 식으로.

Vercel Edge Functions나 Cloudflare Workers로 webhook endpoint를 만들면 GitHub Actions보다 응답성이 좋다.

### MCP (Model Context Protocol) 활용

각 플랫폼 API를 MCP 서버로 만들면 Claude에서 직접 블로그 발행을 제어할 수 있다. 현재는 워크플로우 코드를 AI가 생성하고 사람이 실행하는 구조인데, MCP를 쓰면 AI가 직접 API를 호출할 수 있다.

Anthropic에서 공개한 MCP 예제 중에 GitHub integration이 있으니 참고해서 만들면 된다. 다만 production 환경에서는 인증과 권한 관리를 신중하게 해야 한다.

### 비용 최적화

GitHub Actions 무료 tier는 월 2000분 제한이 있다. 현재 워크플로우는 글 하나당 평균 3-4분 걸리는데, 많이 쓰면 유료 전환해야 한다.

자체 호스팅 runner를 쓰거나, 일부 작업을 serverless function으로 옮기는 게 비용 효율적일 수 있다. 특히 OAuth 토큰 갱신 같은 가벼운 작업은 Cloudflare Workers에서 처리하는 게 낫다.

## 정리

AI로 블로그 자동화 파이프라인을 구축하면서 배운 핵심 포인트들이다:

- 프롬프트에 구체적인 제약 조건과 에러 시나리오를 명시해야 production-ready한 코드가 나온다
- 복잡한 워크플로우는 단계별로 쪼개서 각각 완성하고 조합하는 게 효율적이다  
- AI는 API 통합과 데이터 변환에 강하지만 edge case 처리는 사람이 챙겨야 한다
- GitHub Actions 최적화나 OAuth 처리 같은 platform-specific 지식은 AI가 도움이 많이 된다

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