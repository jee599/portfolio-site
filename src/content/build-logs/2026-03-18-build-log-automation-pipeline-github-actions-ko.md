---
title: "build log 자동화 파이프라인 구축기 — GitHub Actions로 기술 블로그를 멀티 플랫폼에 배포하는 법"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

개발 블로그를 운영하다 보면 같은 글을 여러 플랫폼에 올리는 일이 반복된다. 이번에 GitHub Actions와 AI를 활용해서 DEV.to, Hashnode, Blogger에 자동으로 글을 배포하는 파이프라인을 만들었다. 이 글에서는 어떻게 AI에게 반복 작업을 시키고, 워크플로우를 구조화했는지 다룬다.

## 배경: 무엇을 만들고 있는가

기술 블로그를 GitHub Pages로 운영하고 있다. 마크다운으로 글을 쓰면 자동으로 사이트에 올라가는 구조다. 문제는 도달률이다. GitHub Pages만으로는 독자가 제한적이다.

그래서 DEV.to, Hashnode, Blogger 같은 플랫폼에도 글을 올려야 한다. 하지만 매번 수동으로 복사-붙여넣기 하기엔 너무 귀찮다. 특히 build log 같은 짧은 글들이 매일 생성되는 상황에서는 더욱 그렇다.

목표는 명확했다:
- 마크다운 파일에 `published: true`만 설정하면 모든 플랫폼에 자동 배포
- 영어 글만 외부 플랫폼에 올리기 (한국어는 로컬 독자 대상)
- build log 같은 개발 일지는 플랫폼별로 필터링
- API 토큰 관리와 에러 처리

## Claude에게 GitHub Actions 워크플로우 만들게 하는 프롬프트 패턴

GitHub Actions YAML을 AI에게 시킬 때는 **제약 조건을 명확히** 줘야 한다. 그냥 "워크플로우 만들어줘"라고 하면 동작하지 않는 코드가 나온다.

효과적인 프롬프트는 이렇다:

> GitHub Actions 워크플로우를 만들어줘. 조건:
> 1. `posts/` 디렉토리의 `*-en.md` 파일만 처리
> 2. frontmatter에 `published: true`이고 `devto_id`가 없는 파일만 대상
> 3. DEV.to API 호출 시 429 에러 처리 (5초 대기 후 재시도)
> 4. 응답에서 `id`를 추출해서 frontmatter에 `devto_id: 123` 추가
> 5. secrets: `DEVTO_API_KEY`
> 6. User-Agent 헤더 필수

이렇게 하면 안 된다:
> DEV.to에 글 올리는 워크플로우 만들어줘

핵심은 **API 스펙과 에러 케이스**를 구체적으로 알려주는 것이다. DEV.to API는 rate limiting이 까다롭고, 응답 구조도 플랫폼마다 다르다. 이런 디테일을 프롬프트에 포함해야 한다.

```yaml
# AI가 생성한 워크플로우 예시
name: Publish to DEV.to
on:
  push:
    paths: ['posts/*-en.md']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Publish articles
        run: |
          for file in posts/*-en.md; do
            if grep -q "published: true" "$file" && ! grep -q "devto_id:" "$file"; then
              # API 호출 로직
            fi
          done
```

## 멀티 플랫폼 API 통합에서 AI 활용법

각 플랫폼마다 API 스펙이 다르다. DEV.to는 `article` 객체 안에 내용을 넣고, Hashnode는 GraphQL을 쓴다. Blogger는 OAuth 토큰을 갱신해야 한다.

이런 차이점을 AI에게 학습시키는 방법:

> 3개 플랫폼 API 비교표를 만들어줘:
> - DEV.to: REST API, `title`, `body_markdown`, `published` 필드
> - Hashnode: GraphQL mutation, `title`, `contentMarkdown`, `publishAs` 필드  
> - Blogger: REST API, OAuth refresh token 필요, HTML로 변환해야 함
> 
> 각각의 curl 예시와 응답 JSON 구조도 포함해줘.

AI는 이런 구조화된 요청을 좋아한다. 플랫폼별 차이점을 표로 정리해달라고 하면, 후속 작업에서 더 정확한 코드를 만든다.

실제로 생성된 스크립트:

```bash
# DEV.to 발행
devto_response=$(curl -s -X POST "https://dev.to/api/articles" \
  -H "api-key: $DEVTO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"article": {"title": "'$title'", "body_markdown": "'$content'", "published": true}}')

# Hashnode 발행  
hashnode_response=$(curl -s -X POST "https://gql.hashnode.com" \
  -H "Authorization: $HASHNODE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { publishPost(input: {title: \"'$title'\", contentMarkdown: \"'$content'\"}) { post { id } } }"}')
```

## 상태 관리와 에러 처리 구조화 전략

자동화 파이프라인에서 가장 까다로운 부분은 **부분 실패** 처리다. DEV.to에는 성공했는데 Hashnode에서 실패하면 어떻게 할 것인가?

이 문제를 AI에게 해결하게 하는 방법:

> 발행 상태를 frontmatter로 관리하는 전략을 설계해줘:
> - 각 플랫폼별로 `devto_id`, `hashnode_id`, `blogger_id` 필드
> - 실패한 플랫폼만 재시도하는 로직
> - 로그 파일에 타임스탬프와 함께 기록
> - 409 Conflict (이미 발행됨) 에러는 무시

AI가 제안한 해결책:

```yaml
# frontmatter 예시
---
title: "My Post"
published: true
devto_id: 12345      # 성공
hashnode_id: null    # 실패, 재시도 필요
blogger_id: 67890    # 성공
---
```

이런 식으로 각 플랫폼의 발행 상태를 독립적으로 관리한다. 워크플로우는 `null` 값인 플랫폼만 다시 시도한다.

```bash
# AI가 생성한 재시도 로직
if [ "$devto_id" = "null" ] || [ -z "$devto_id" ]; then
  echo "Publishing to DEV.to..."
  # API 호출
fi
```

## OAuth 토큰 갱신 자동화

Blogger API는 OAuth refresh token 방식이다. 액세스 토큰이 만료되면 새로 받아야 한다. 이런 복잡한 인증 플로우도 AI에게 맡길 수 있다.

> Google OAuth refresh token으로 새 액세스 토큰을 받는 bash 스크립트를 만들어줘. 조건:
> - `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 환경변수 사용
> - 토큰 만료 시 자동으로 갱신
> - 갱신 실패하면 에러 로그 출력 후 종료
> - 받은 액세스 토큰을 `$ACCESS_TOKEN` 변수에 저장

생성된 스크립트:

```bash
get_access_token() {
  local response=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=refresh_token" \
    -d "refresh_token=$GOOGLE_REFRESH_TOKEN" \
    -d "client_id=$GOOGLE_CLIENT_ID" \
    -d "client_secret=$GOOGLE_CLIENT_SECRET")
  
  ACCESS_TOKEN=$(echo $response | jq -r '.access_token')
  if [ "$ACCESS_TOKEN" = "null" ]; then
    echo "Failed to refresh token: $response"
    exit 1
  fi
}
```

## 콘텐츠 필터링과 변환 파이프라인

build log나 뉴스 정리 글은 모든 플랫폼에 올리면 안 된다. 독자들이 스팸으로 인식할 수 있기 때문이다. 

필터링 규칙을 AI에게 만들게 하는 프롬프트:

> 다음 조건으로 글을 필터링하는 bash 함수를 만들어줘:
> 1. 파일명에 `build-log`가 포함된 글은 DEV.to에서 제외
> 2. 태그에 `news`가 있고 조회수가 100 미만인 글은 자동으로 unpublish
> 3. 영어 글(`*-en.md`)만 외부 플랫폼에 발행
> 4. frontmatter의 `external_publish: false`가 있으면 모든 외부 플랫폼 제외

```bash
# 생성된 필터링 함수
should_publish_external() {
  local file=$1
  local platform=$2
  
  # 영어 글이 아니면 제외
  if [[ ! $file =~ -en\.md$ ]]; then
    return 1
  fi
  
  # external_publish: false 확인
  if grep -q "external_publish: false" "$file"; then
    return 1
  fi
  
  # build-log는 DEV.to 제외
  if [[ $platform = "devto" ]] && [[ $file =~ build-log ]]; then
    return 1
  fi
  
  return 0
}
```

## Blogger HTML 변환과 인라인 CSS

Blogger는 마크다운을 직접 지원하지 않는다. HTML로 변환해야 하고, 스타일링도 인라인 CSS로 해야 한다.

> 마크다운을 Blogger용 HTML로 변환하는 파이프라인을 만들어줘:
> 1. 코드 블록: `<pre style="background:#f6f8fa; padding:16px; border-radius:6px; overflow-x:auto;"><code>` 
> 2. 인라인 코드: `<code style="background:#f1f3f4; padding:2px 4px; border-radius:3px;">`
> 3. 블록쿼트: `<blockquote style="border-left:4px solid #ddd; margin:16px 0; padding-left:16px; color:#666;">`
> 4. pandoc 사용하되 커스텀 CSS 템플릿 적용

```bash
# AI가 생성한 변환 파이프라인
convert_to_blogger_html() {
  local markdown_file=$1
  
  # 커스텀 CSS 템플릿으로 HTML 변환
  pandoc "$markdown_file" \
    --from markdown \
    --to html \
    --template blogger-template.html \
    --highlight-style github \
    | sed 's/<pre>/<pre style="background:#f6f8fa;padding:16px;border-radius:6px;overflow-x:auto;">/g' \
    | sed 's/<code>/<code style="background:#f1f3f4;padding:2px 4px;border-radius:3px;">/g'
}
```

## 더 나은 방법은 없을까

현재 구현한 방식보다 더 효율적인 대안들이 있다:

**1. Zapier/Make.com 같은 no-code 플랫폼**
- GitHub webhook으로 트리거하면 GUI에서 플랫폼 연동 가능
- 비용: 월 $20-50, 복잡한 로직 구현 제한
- 현재 방식: 무료, 무제한 커스터마이징

**2. Buffer API나 Hootsuite API 활용**
- 소셜미디어 관리 도구의 블로그 발행 기능 사용
- 장점: 예약 발행, 분석 기능 제공
- 단점: 기술 블로그 플랫폼 지원 부족

**3. RSS 기반 자동화**
- GitHub Pages RSS 피드를 각 플랫폼이 구독하도록 설정
- 가장 간단하지만 플랫폼별 메타데이터 커스터마이징 불가

**4. GitHub Apps 개발**
- 더 정교한 권한 관리와 이벤트 처리 가능
- repository dispatch 이벤트로 선택적 발행
- 오버엔지니어링일 가능성 높음

현재 방식이 가장 균형잡힌 선택이다. 비용 없이 완전한 제어권을 가지면서도, 유지보수가 복잡하지 않다.

Anthropic의 공식 문서에 따르면 이런 반복 작업 자동화에서는 **명확한 제약 조건과 에러 케이스 정의**가 가장 중요하다. 프롬프트에서 예외 상황을 충분히 다뤄야 실제로 쓸 수 있는 코드가 나온다.

## 정리

- **구조화된 프롬프트**로 플랫폼별 API 차이점을 AI에게 학습시켜라
- **상태 관리를 frontmatter**로 하면 부분 실패 상황을 깔끔하게 처리할 수 있다
- **OAuth 같은 복잡한 인증**도 AI에게 맡기되, 에러 처리 조건을 명확히 줘라
- **필터링 규칙**을 함수로 분리하면 플랫폼별 정책 변경에 유연하게 대응된다

<details>
<summary>이번 작업의 커밋 로그</summary>

05e904e — post: build logs 2026-03-18 (2 posts, en)
4de9884 — post: build logs 2026-03-18 (2 posts, en)
2bb1330 — post: build logs 2026-03-18 (2 posts, en)
765902d — feat: Medium → Hashnode 워크플로우 교체 (영어 글 자동 발행)
cf8a33f — feat: Medium + Blogger 자동 발행 워크플로우 추가
6e951d4 — post: English versions for 8 Korean blog posts
8b7caf0 — chore: update cleanup workflow to unpublish outdated Korean news articles
f2fc77e — chore: cleanup workflow — unpublish low-view news + build logs
5b899f4 — fix: exclude build-log posts from DEV.to publishing

</details>