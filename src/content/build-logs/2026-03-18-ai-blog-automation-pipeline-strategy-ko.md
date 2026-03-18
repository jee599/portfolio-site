---
title: "AI로 블로그 자동화 파이프라인 만들기 — 다중 플랫폼 발행 전략"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

블로그를 여러 플랫폼에 동시 발행하면서 품질 관리까지 자동화한 작업을 정리했다. 이 글에서는 GitHub Actions로 DEV.to, Hashnode, Blogger를 연동하고, AI로 콘텐츠 최적화하는 구체적인 방법을 다룬다.

## 배경: 무엇을 만들고 있는가

개발 블로그를 운영하면서 한국어 글은 로컬에, 영어 글은 해외 플랫폼에 자동 발행하는 시스템을 구축했다. DEV.to, Hashnode, Blogger 세 곳에 동시 배포하면서 각 플랫폼별 메타데이터 관리와 품질 기준 필터링까지 자동화했다.

핵심 목표는 이거였다:
- 한 번 작성하면 여러 플랫폼에 자동 발행
- 플랫폼별 특성에 맞는 메타데이터 자동 생성  
- 저품질 콘텐츠(빌드 로그, 뉴스 글) 필터링
- OAuth 토큰 관리와 API 에러 핸들링 자동화

## AI 프롬프팅으로 플랫폼별 콘텐츠 최적화하기

각 플랫폼마다 독자층과 선호하는 콘텐츠 형태가 다르다. 이걸 AI로 자동 처리하는 프롬프트를 설계했다.

### 플랫폼 특성 파악 프롬프팅

먼저 각 플랫폼의 특성을 AI에게 학습시키는 프롬프트다:

> "이 마크다운 글을 분석해서 어떤 플랫폼에 발행할지 판단해줘. 
> 
> **DEV.to**: 실무 개발 경험, 튜토리얼, 기술 깊이 있는 분석
> **Hashnode**: 개발자 성장, 커리어, 프로젝트 회고  
> **Blogger**: SEO 최적화된 긴 글, 초보자 대상 가이드
>
> 각 플랫폼별로 `tags`, `description`, `canonical_url` 최적화해서 frontmatter JSON으로 출력해줘."

단순히 "발행해줘"가 아니라 **플랫폼 특성과 최적화 기준을 명확히** 제시하는 게 핵심이다. AI가 단순 번역기가 아니라 콘텐츠 전략가 역할을 하도록 만든다.

### 메타데이터 자동 생성 패턴

각 플랫폼의 메타데이터를 일관성 있게 생성하는 프롬프트 패턴:

> "마크다운 글에서 다음 메타데이터 추출해줘:
> 
> 1. **DEV.to 태그**: 최대 4개, 소문자, 공백 없이 (`javascript`, `react`, `tutorial`)
> 2. **Hashnode 카테고리**: 하나만, 대문자로 (`PROGRAMMING`, `CAREER`, `STARTUP`) 
> 3. **description**: 150자 이내, SEO 키워드 포함, 행동 유도 문구 추가
> 4. **cover_image**: 글 내용과 매치되는 Unsplash URL 생성
>
> 기존 frontmatter는 유지하고 누락된 필드만 추가해줘."

이런 식으로 **구체적인 제약 조건**을 주면 플랫폼 정책에 맞는 메타데이터가 일관되게 나온다.

## GitHub Actions으로 다중 플랫폼 배포 자동화

핵심은 **워크플로우 체이닝**과 **조건부 실행**이다. 플랫폼별로 별도 워크플로우를 만들지 않고 하나의 파이프라인에서 순차 처리한다.

### 워크플로우 설계 패턴

```yaml
name: Multi-Platform Publishing
on:
  push:
    paths: ['posts/**/*.md']
  
jobs:
  detect-changes:
    # 변경된 포스트 파일만 추출
  
  optimize-content:
    needs: detect-changes
    # AI로 메타데이터 최적화
  
  publish-devto:
    needs: optimize-content
    if: contains(matrix.platform, 'devto')
    # DEV.to 발행
    
  publish-hashnode:
    needs: publish-devto
    # Hashnode 발행
    
  publish-blogger:
    needs: publish-hashnode  
    # Blogger 발행
```

여기서 중요한 건 **의존성 체인**이다. 한 플랫폼에서 에러가 나도 다른 플랫폼 발행은 계속되도록 `continue-on-error: true`를 적절히 활용한다.

### AI 활용 전략: 콘텐츠 품질 필터링

모든 글을 다 발행하면 안 된다. 빌드 로그나 임시 메모 같은 건 필터링해야 한다. 이것도 AI로 자동화했다:

> "이 마크다운 파일이 기술 블로그 포스트로 발행할 가치가 있는지 판단해줘.
>
> **발행 기준**:
> - 독자에게 배움이나 인사이트 제공
> - 3000자 이상의 충분한 분량  
> - 구체적인 예제나 코드 포함
> - 재현 가능한 튜토리얼이거나 경험 기반 분석
>
> **제외 기준**:
> - 빌드 로그, 에러 메시지만 나열
> - 단순 뉴스나 링크 모음
> - 개인적인 일기나 메모
> - 미완성이거나 draft 상태
>
> 결과를 `PUBLISH` 또는 `SKIP`으로만 답변해줘."

이걸 GitHub Actions에서 `if` 조건으로 활용한다:

```yaml
- name: Check publish eligibility
  id: check
  run: |
    result=$(echo "$content" | curl -X POST "https://api.anthropic.com/v1/messages" ...)
    echo "decision=$result" >> $GITHUB_OUTPUT

- name: Publish to DEV.to  
  if: steps.check.outputs.decision == 'PUBLISH'
```

### OAuth 토큰 관리 자동화

여러 플랫폼 API를 쓰다 보면 토큰 만료가 골치다. 특히 Blogger는 refresh token 방식이라 더 복잡하다.

AI에게 토큰 갱신 로직을 작성하게 할 때 이런 프롬프트를 썼다:

> "Google OAuth2 refresh token으로 access token 갱신하는 bash 스크립트 만들어줘.
>
> **요구사항**:
> 1. `GOOGLE_REFRESH_TOKEN` 환경변수에서 토큰 읽기
> 2. 갱신 실패시 Slack webhook으로 알림 전송  
> 3. 새 토큰을 GitHub Actions secret에 자동 업데이트
> 4. 토큰 만료 7일 전부터 매일 갱신 시도
> 5. 에러 로그는 `publish-log.txt`에 append
>
> Blogger API v3 스펙에 맞춰서 작성하고, `curl` 명령어만 사용해줘."

이렇게 **구체적인 에러 시나리오**와 **복구 절차**를 포함해서 프롬프트를 작성하면 실전에서 바로 쓸 수 있는 코드가 나온다.

## 구조화 전략: 대규모 자동화 시스템 설계

블로그 자동화는 단순히 API 호출하는 게 아니다. 콘텐츠 라이프사이클 전체를 관리하는 시스템이다.

### 작업 분해 패턴

큰 자동화 작업을 AI에게 시킬 때는 **단계별로 쪼개서** 각 단계마다 검증 포인트를 둔다:

1. **컨텐츠 파싱** → frontmatter 추출, 본문 분리
2. **품질 검증** → 최소 길이, 이미지 유무, 코드 블록 개수 체크  
3. **메타데이터 생성** → 플랫폼별 태그, 설명, 카테고리 최적화
4. **API 호출** → 각 플랫폼에 순차 발행, 에러 핸들링
5. **결과 추적** → 발행 로그 기록, 메트릭 수집

각 단계마다 AI에게 **명확한 입력/출력 포맷**을 지정한다:

> "1단계: 마크다운 파싱
> 
> 입력: `.md` 파일 경로
> 출력: JSON `{frontmatter: {}, body: "", wordCount: 0}`
> 에러: 파일 없음, 잘못된 frontmatter 형식
> 
> 이 단계만 구현해줘. 다른 단계는 신경 쓰지 마."

이렇게 하면 AI가 **한 가지 일에 집중**해서 더 정확한 코드를 만든다.

### 상태 관리와 롤백 전략

자동화 시스템에서 가장 중요한 건 **실패했을 때 복구**다. 발행 중간에 에러가 나면 어떤 플랫폼에는 올라가고 어떤 곳은 안 올라가는 불일치 상태가 된다.

이걸 AI로 해결하는 프롬프트:

> "다중 플랫폼 발행 시스템에서 트랜잭션 같은 롤백 메커니즘 만들어줘.
>
> **시나리오**:
> 1. DEV.to 발행 성공
> 2. Hashnode 발행 실패  
> 3. Blogger 발행 대기중
>
> **요구사항**:
> - 실패한 플랫폼만 재시도, 성공한 곳은 건드리지 않기
> - 상태를 `publish-log.txt`에 JSON 형태로 기록
> - 각 플랫폼별 고유 ID 추적 (post_id, article_id 등)
> - 24시간 후 자동 재시도, 3번 실패하면 Slack 알림
>
> bash 스크립트로 만들어줘."

AI가 만든 스크립트를 GitHub Actions에 적용하면 **자동 복구되는 견고한 시스템**이 된다.

### 메트릭 수집과 최적화

자동화 시스템은 데이터를 남겨야 한다. 어떤 글이 잘 되고 어떤 플랫폼에서 반응이 좋은지 추적해야 다음 전략을 세울 수 있다.

AI에게 메트릭 수집기를 만들게 하는 프롬프트:

> "블로그 자동 발행 시스템의 성과를 추적하는 대시보드 데이터 수집기 만들어줘.
>
> **수집 데이터**:
> - 플랫폼별 발행 성공률 (`devto_success_rate`, `hashnode_success_rate`)  
> - 글 길이별 조회수 상관관계 (`word_count` vs `view_count`)
> - 태그별 인기도 (`react: 1250 views avg`, `ai: 890 views avg`)
> - 발행 시간대별 성과 (`morning_posts` vs `evening_posts`)
>
> **출력**: JSON 형태로 `metrics.json`에 저장
> **주기**: 매일 오전 9시 GitHub Actions 크론으로 실행
> **API**: DEV.to, Hashnode REST API로 조회수 가져오기
>
> Node.js로 만들어줘."

이렇게 수집한 데이터로 **다음 콘텐츠 전략**을 AI에게 추천받을 수도 있다.

## 더 나은 방법은 없을까

현재 방식보다 개선할 수 있는 부분들을 살펴보자.

### Anthropic MCP 서버 활용

지금은 각 플랫폼 API를 개별적으로 호출하는데, MCP(Model Context Protocol) 서버를 만들면 더 효율적이다. Claude가 직접 블로그 플랫폼과 상호작용할 수 있게 된다.

```javascript
// blog-publisher-mcp-server.js
const server = new MCPServer({
  name: "blog-publisher",
  tools: [
    {
      name: "publish_to_devto",
      description: "Publish article to DEV.to with optimization",
      inputSchema: {
        type: "object", 
        properties: {
          content: { type: "string" },
          title: { type: "string" },
          tags: { type: "array" }
        }
      }
    }
  ]
});
```

이렇게 하면 AI가 **실시간으로 발행 결과를 보고 최적화**할 수 있다.

### Webhooks 기반 실시간 처리

현재는 `git push` 기반인데, 각 플랫폼의 webhook을 받아서 **양방향 동기화**하는 게 더 좋다. 예를 들어 DEV.to에서 글을 직접 수정하면 GitHub repo도 업데이트되도록 만들 수 있다.

### AI 에이전트 모드 적극 활용

Claude의 Computer Use나 새로운 agent 기능을 쓰면 **브라우저 자동화**까지 가능하다. API가 제한적인 플랫폼(LinkedIn, Instagram)에도 자동 발행할 수 있다.

### 비용 최적화 전략

현재는 모든 글마다 AI API를 호출하는데, **캐싱 레이어**를 두면 비용을 줄일 수 있다. 비슷한 글은 메타데이터 템플릿을 재사용하고, 진짜 새로운 콘텐츠에만 AI를 쓰는 식으로 말이다.

## 정리

- **플랫폼별 특성을 AI 프롬프트에 명시**해서 콘텐츠를 자동 최적화한다
- **워크플로우 체이닝**으로 여러 플랫폼 배포를 순차 처리하되 에러 격리한다  
- **품질 필터링을 AI로 자동화**해서 저품질 콘텐츠 발행을 방지한다
- **상태 관리와 롤백 메커니즘**으로 부분 실패 상황을 자동 복구한다

<details>
<summary>이번 작업의 커밋 로그</summary>

05e904e — post: build logs 2026-03-18 (2 posts, en)
4de9884 — post: build logs 2026-03-18 (2 posts, en)  
2bb1330 — post: build logs 2026-03-18 (2 posts, en)
d455bdf — chore: update published articles [skip ci]
765902d — feat: Medium → Hashnode 워크플로우 교체 (영어 글 자동 발행)
cf8a33f — feat: Medium + Blogger 자동 발행 워크플로우 추가
6e951d4 — post: English versions for 8 Korean blog posts
f2fc77e — chore: cleanup workflow — unpublish low-view news + build logs
20a53c6 — chore: add cleanup workflow for unpublishing jidonglab/build-log articles

</details>