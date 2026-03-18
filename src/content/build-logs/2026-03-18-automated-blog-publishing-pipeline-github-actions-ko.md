---
title: "자동화된 블로그 발행 파이프라인 — GitHub Actions로 다중 플랫폼 콘텐츠 배포하기"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, fix, feat]
---

GitHub Actions로 블로그 포스트를 DEV.to, Hashnode, Blogger에 자동 발행하는 파이프라인을 구축했다. 이 과정에서 AI를 활용해 워크플로우 설계부터 에러 디버깅까지 모든 단계를 효율화했다. 실제 운영 중인 시스템의 설계 패턴과 AI 프롬프팅 전략을 공유한다.

## 배경: 무엇을 만들고 있는가

개발 블로그를 여러 플랫폼에 동시 배포하는 자동화 시스템을 만들고 있다. 현재 단계는 이미 markdown 파일들이 준비된 상태에서, 이를 각 플랫폼의 API 규격에 맞춰 자동 발행하는 것이다.

목표는 간단하다. 하나의 markdown 파일을 작성하면 GitHub Actions가 자동으로 여러 플랫폼에 발행한다. 한국어 글은 DEV.to에만, 영어 글은 DEV.to + Hashnode + Blogger에 발행한다.

## 워크플로우 설계에서 AI 활용 패턴

### 프롬프팅 전략: 명확한 제약 조건부터

자동화 워크플로우를 설계할 때는 예외 상황을 먼저 정의하는 게 핵심이다. AI에게 단순히 "GitHub Actions 워크플로우 만들어줘"라고 하면 안 된다.

> "GitHub Actions로 블로그 자동 발행 워크플로우를 만들어줘. 조건:
> 
> 1. 한국어 파일(`-ko.md`)은 DEV.to에만 발행, 영어는 3개 플랫폼
> 2. `build-log` 태그가 있는 글은 발행하지 않음
> 3. 이미 발행된 글은 스킵 (frontmatter의 `published: true` 체크)
> 4. API 실패 시 전체 워크플로우 중단하지 말고 로그만 남김
> 5. 각 플랫폼별로 다른 포맷팅 필요 (Blogger는 인라인 CSS)
> 
> 현재 프로젝트 구조: `posts/` 디렉토리에 `.md` 파일들"

이렇게 구체적인 비즈니스 로직을 먼저 전달하면 AI가 훨씬 정확한 코드를 생성한다.

### Claude Code의 멀티 파일 작업 활용

`CLAUDE.md` 파일에 프로젝트 컨텍스트를 정의해뒀다:

```markdown
# Dev Blog Automation

## 구조
- posts/: 블로그 포스트 (.md 파일)
- .github/workflows/: GitHub Actions 워크플로우
- publish-log.txt: 발행 상태 추적

## 발행 규칙
- 한국어(-ko.md): DEV.to만
- 영어(.md): DEV.to + Hashnode + Blogger
- build-log 태그: 발행 제외
```

이렇게 설정하고 `/ask @publish.yml 파일에서 한국어 글이 DEV.to에 발행되는 로직 수정해줘`라고 하면 Claude가 전체 컨텍스트를 이해하고 정확한 수정을 해준다.

### 구조화 전략: API 통합을 단계별로

큰 작업을 쪼개는 방식이 중요하다. 처음부터 3개 플랫폼을 동시에 구현하려고 하지 않았다.

1. **1단계**: DEV.to API만 구현해서 기본 파이프라인 검증
2. **2단계**: Hashnode API 추가 (Medium에서 전환)
3. **3단계**: Blogger API 추가 + OAuth 토큰 관리
4. **4단계**: 에러 처리와 로깅 강화

각 단계마다 AI에게 이전 단계의 성공 케이스를 보여주면서 "이 패턴을 유지하면서 Hashnode API도 추가해줘"라고 요청했다. 일관된 구조를 유지할 수 있다.

## API 통합과 에러 처리 자동화

### OAuth 토큰 관리 프롬프팅

Blogger API는 OAuth2 refresh token이 필요하다. 이런 복잡한 인증 플로우를 AI에게 맡길 때는 보안 원칙을 명확히 해야 한다.

> "Blogger API OAuth 구현해줘. 조건:
> 
> - refresh_token은 GitHub Secrets에 저장
> - access_token은 매번 새로 발급받아서 사용
> - 토큰 갱신 실패 시 워크플로우 중단하지 말고 스킵
> - API 응답에서 민감 정보 로깅 금지
> 
> 참고: 현재 DEV.to는 단순 API 키 방식으로 구현됨"

Claude가 생성한 코드:

```yaml
- name: Get Blogger access token
  run: |
    response=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "client_id=${{ secrets.BLOGGER_CLIENT_ID }}" \
      -d "client_secret=${{ secrets.BLOGGER_CLIENT_SECRET }}" \
      -d "refresh_token=${{ secrets.BLOGGER_REFRESH_TOKEN }}" \
      -d "grant_type=refresh_token")
    
    access_token=$(echo $response | jq -r '.access_token')
    if [ "$access_token" = "null" ]; then
      echo "Failed to get access token, skipping Blogger"
      echo "BLOGGER_SKIP=true" >> $GITHUB_ENV
    else
      echo "BLOGGER_ACCESS_TOKEN=$access_token" >> $GITHUB_ENV
    fi
```

토큰 갱신 실패를 graceful하게 처리하는 패턴을 정확히 구현했다.

### 플랫폼별 포맷팅 처리

각 플랫폼마다 다른 markdown 처리가 필요하다. 특히 Blogger는 HTML로 변환하면서 인라인 CSS를 적용해야 한다.

> "Blogger용 HTML 변환 스크립트 만들어줘:
> 
> 1. markdown을 HTML로 변환
> 2. code block에 syntax highlighting CSS 인라인으로 적용
> 3. 이미지는 상대 경로를 절대 경로로 변환
> 4. frontmatter는 제거하고 본문만 사용
> 
> 트렌디한 코드 하이라이팅 스타일 적용해줘 (다크 테마, 둥근 모서리)"

AI가 생성한 스크립트는 `highlight.js`와 `marked` 라이브러리를 사용해서 완전한 HTML 변환 파이프라인을 만들어줬다. 수동으로 하면 시간이 많이 걸리는 작업을 10분 만에 해결했다.

### 에러 디버깅에서 AI 활용

API 호출이 실패할 때 AI를 디버깅 파트너로 활용했다. 실제 로그를 그대로 붙여서 분석을 요청한다.

> "DEV.to API 호출이 422 에러를 반환한다. 로그:
> 
> ```
> {"error":"Validation failed","status":422,"messages":["Body can't be blank"]}
> ```
> 
> 현재 코드에서 body 필드를 어떻게 전달하고 있는지 확인하고 수정안 제시해줘"

Claude가 즉시 문제를 파악했다. DEV.to API는 `body_markdown` 필드를 사용하는데, 코드에서는 `body`로 전달하고 있었다. 이런 API 스펙 차이를 AI가 더 빠르게 찾아낸다.

## 콘텐츠 분류와 자동 태깅

### 스마트 필터링 로직

build log 같은 저품질 콘텐츠는 자동으로 발행에서 제외해야 한다. 단순히 파일명으로만 필터링하면 놓치는 케이스가 있다.

> "블로그 포스트 자동 분류 로직 만들어줘:
> 
> 1. `build-log` 태그가 있으면 발행 제외
> 2. 파일명에 `build-log`가 있어도 제외  
> 3. 제목이 "build logs"로 시작해도 제외
> 4. frontmatter에 `draft: true`면 제외
> 5. 한국어 파일(`-ko.md`)은 DEV.to만 발행
> 
> 필터링된 이유를 로그에 남겨줘"

AI가 정규식과 조건문을 조합해서 견고한 필터링 로직을 만들어줬다:

```bash
# 발행 제외 조건 체크
if [[ "$file" == *"-ko.md" ]] && [[ "$platform" != "devto" ]]; then
  echo "Skipping Korean post for $platform"
  continue
fi

if grep -q "build-log" "$file" || [[ "$title" == *"build logs"* ]]; then
  echo "Skipping build log: $file"
  continue
fi
```

### 콘텐츠 품질 관리

발행된 글 중에서 조회수가 낮은 글을 자동으로 unpublish하는 cleanup 워크플로우도 추가했다.

> "DEV.to API로 내 글들의 조회수를 가져와서, 특정 조건에 맞는 글을 unpublish하는 스크립트 만들어줘:
> 
> 1. `jidonglab/build-log` 태그가 있는 글
> 2. 발행된 지 7일 이상 된 글
> 3. 조회수 10 이하인 글
> 
> unpublish 전에 로그로 해당 글 제목과 조회수 출력해줘"

이런 방식으로 콘텐츠 품질을 자동으로 관리할 수 있다. 수동으로 하면 놓치기 쉬운 작업들이다.

## GitHub Actions 최적화 패턴

### 조건부 실행과 의존성 관리

워크플로우가 복잡해질수록 불필요한 실행을 줄이는 게 중요하다.

> "GitHub Actions 워크플로우 최적화해줘:
> 
> 1. posts/ 디렉토리에 변경이 있을 때만 실행
> 2. 각 플랫폼 API 호출을 병렬로 처리
> 3. 하나의 플랫폼이 실패해도 다른 플랫폼은 계속 진행
> 4. 성공/실패 결과를 summary에 출력
> 
> 현재는 순차적으로 처리해서 시간이 너무 오래 걸림"

AI가 `matrix` 전략과 `continue-on-error`를 활용한 최적화된 워크플로우를 설계해줬다:

```yaml
strategy:
  matrix:
    platform: [devto, hashnode, blogger]
  fail-fast: false

steps:
  - name: Publish to ${{ matrix.platform }}
    continue-on-error: true
    run: |
      ./scripts/publish-${{ matrix.platform }}.sh
```

### 상태 추적과 중복 발행 방지

`publish-log.txt` 파일로 발행 상태를 추적하는 방식도 AI가 제안했다. 처음에는 GitHub API로 commit history를 체크하려고 했는데, 파일 기반 추적이 더 간단하고 안정적이다.

> "발행 상태를 추적하는 가장 간단한 방법 추천해줘. 조건:
> 
> 1. 같은 글을 중복 발행하면 안 됨
> 2. GitHub Actions에서 쉽게 읽고 쓸 수 있어야 함  
> 3. 사람이 봐도 이해하기 쉬워야 함
> 4. git에 커밋해서 히스토리 남겨야 함"

AI가 제안한 형식:

```
2026-03-18-portfolio-site-build-log-en.md|devto|published|123456
2026-03-18-uddental-build-log-en.md|hashnode|published|789012
```

파일명|플랫폼|상태|article_id 형태로 저장한다. 간단하면서도 모든 요구사항을 만족한다.

## 더 나은 방법은 없을까

현재 구현에서 개선할 수 있는 부분들을 살펴보자.

### 1. 워크플로우 최적화

지금은 각 플랫폼을 별도 job으로 실행하지만, GitHub Actions의 `composite action`을 사용하면 더 깔끔하게 만들 수 있다. 각 플랫폼별 발행 로직을 재사용 가능한 action으로 분리하는 방식이다.

### 2. API 호출 최적화  

현재는 모든 글을 매번 체크하는데, git diff를 활용해서 변경된 파일만 처리하면 실행 시간을 크게 줄일 수 있다. `actions/changed-files` action이 이런 용도로 최적화되어 있다.

### 3. 에러 처리 강화

지금은 API 실패 시 단순히 스킵하는데, Slack이나 Discord로 알림을 보내는 게 좋겠다. `8398a7/action-slack` action을 사용하면 워크플로우 결과를 자동으로 알림받을 수 있다.

### 4. 콘텐츠 검증 자동화

발행 전에 markdown 문법 체크, 링크 유효성 검증, 이미지 최적화 등을 자동으로 처리하면 품질을 더 높일 수 있다. `remarkjs/remark-lint`나 `markdown-link-check` action들이 유용하다.

### 5. 메타데이터 관리

frontmatter의 태그, 카테고리 정보를 각 플랫폼에 맞게 자동 매핑하는 로직을 추가하면 좋겠다. 지금은 수동으로 관리하고 있다.

## 정리  

- AI에게 워크플로우 설계를 시킬 때는 예외 상황과 제약 조건을 먼저 명시한다
- 복잡한 API 통합은 단계적으로 구현하면서 AI에게 이전 패턴을 참조하게 한다  
- 에러 로그를 AI에게 그대로 보여주면 디버깅 속도가 훨씬 빠르다
- GitHub Actions 최적화는 조건부 실행과 병렬 처리가 핵심이다

<details>
<summary>이번 작업의 커밋 로그</summary>

be69eca — chore: update published articles [skip ci]
b872ce0 — post: build logs 2026-03-19 (2 posts, en)
3ffefc9 — fix: DEV.to에 한국어(-ko.md) 파일 발행 스킵
05e904e — post: build logs 2026-03-18 (2 posts, en)
8ae8059 — post: build log series (6 posts, en) + unpublish script
6a4f63d — feat: Blogger 영어 글만 발행 + 트렌디 인라인 CSS 적용
a365f54 — feat: Blogger 워크플로우 OAuth refresh token 방식으로 업데이트
765902d — feat: Medium → Hashnode 워크플로우 교체 (영어 글 자동 발행)
cf8a33f — feat: Medium + Blogger 자동 발행 워크플로우 추가
f2fc77e — chore: cleanup workflow — unpublish low-view news + build logs

</details>