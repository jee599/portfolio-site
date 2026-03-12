---
title: "GitHub Actions로 Dev.to 자동화하면서 배운 AI 에이전트 활용법"
project: "portfolio-site"
date: 2026-03-12
lang: ko
tags: [fix, feat, astro, typescript]
---

포트폴리오 사이트에 Dev.to 자동 발행 시스템을 만들면서 AI 에이전트와 함께 복잡한 워크플로우를 구축했다. 단순히 글만 발행하는 게 아니라 중복 글 정리, SEO 최적화, 다국어 번역까지 모두 자동화한 과정에서 얻은 프롬프팅 노하우와 구조화 전략을 공유한다.

## 배경: 무엇을 만들고 있는가

개인 기술 블로그 `jidonglab.com`을 운영하면서 Dev.to 플랫폼에도 콘텐츠를 배포하고 있었다. 하지만 수동으로 복사-붙여넣기하다 보니 여러 문제가 생겼다.

- Dev.to에 중복되거나 비슷한 글들이 쌓임
- SEO 메타데이터가 누락되거나 일관성 없음  
- 다국어 콘텐츠 관리가 복잡함
- 기존 글들에 브랜딩 푸터가 없어서 트래픽 유입이 안 됨

목표는 명확했다. GitHub Actions 기반으로 모든 걸 자동화하되, AI가 콘텐츠 품질까지 관리하게 만드는 것이다.

## GitHub Actions 워크플로우 설계 — 제약 조건부터 정하기

복잡한 자동화 시스템을 AI와 함께 만들 때 가장 중요한 건 **명확한 제약 조건**이다. 무작정 "GitHub Actions 만들어줘"라고 하면 범용적이고 쓸모없는 코드가 나온다.

내가 사용한 프롬프트 패턴은 이렇다:

> "Dev.to API 자동화 워크플로우를 만드는데, 다음 제약 조건을 지켜야 한다:
> 
> 1. 기존 글 중복 체크 — 제목 유사도 85% 이상이면 업데이트, 아니면 새 글 생성
> 2. 저품질 글 삭제 — 조회수 50 미만이고 6개월 이상 된 글 자동 삭제  
> 3. 브랜딩 푸터 강제 삽입 — 모든 글 끝에 jidonglab.com 링크 추가
> 4. 에러 시 Slack 알림, 성공률 90% 이하면 워크플로우 중단
> 
> GitHub Actions YAML 구조로 작성하고, Dev.to API rate limit도 고려해."

이렇게 쓰면 안 된다:

> "Dev.to에 자동으로 글 올리는 GitHub Actions 만들어줘"

차이가 보이나? 첫 번째 프롬프트는 **비즈니스 로직과 예외 상황까지 구체적**으로 명시했다. 이렇게 해야 AI가 실제로 쓸 수 있는 코드를 만든다.

실제로 생성된 워크플로우는 `.github/workflows/cleanup-devto.yml` 파일로 140줄 정도 되는데, 단순한 API 호출이 아니라 조건부 로직과 에러 핸들링이 모두 들어가 있다.

```yaml
- name: Delete low-quality articles
  run: |
    python -c "
    import requests
    import json
    from datetime import datetime, timedelta
    
    # 6개월 이상, 조회수 50 미만 글 삭제 로직
    cutoff_date = datetime.now() - timedelta(days=180)
    # ... 생략
    "
```

핵심은 **AI에게 예외 상황을 미리 알려주는 것**이다. "rate limit 걸리면 어떻게 해", "API 에러 나면 어떻게 해", "중복 판단 기준은 뭐야" 이런 걸 프롬프트에 명시해야 한다.

## Claude Code의 slash commands 활용 — 반복 작업 자동화

이번 작업에서 가장 유용했던 건 Claude Code의 `/commit` 커맨드다. 여러 파일을 동시에 수정할 때 일관성 있는 커밋 메시지를 만들어준다.

예를 들어 SEO 관련해서 `astro.config.mjs`, `src/layouts/Base.astro`, `src/pages/ai-news/[slug].astro` 이렇게 3개 파일을 동시에 수정했는데, `/commit`을 쓰면:

```
feat: SEO 전면 개선 — sitemap, robots.txt, JSON-LD, Dev.to series
```

이런 식으로 **작업의 전체 맥락**을 파악해서 의미 있는 커밋 메시지를 만든다. 단순히 "파일 수정"이 아니라 "왜 이 파일들을 함께 수정했는지"를 이해하는 것이다.

더 중요한 건 `/review` 커맨드다. 특히 GitHub Actions YAML 파일 같은 경우 문법 실수 하나로 전체 워크플로우가 망가질 수 있는데, `/review`를 쓰면 잠재적 문제점을 미리 찾아준다:

```yaml
# 문제가 될 수 있는 부분을 지적함
- name: Check rate limit
  run: |
    if [ "$RATE_LIMIT_REMAINING" -lt 10 ]; then
      echo "Rate limit too low, exiting"
      exit 1  # 여기서 전체 워크플로우가 중단됨
    fi
```

Claude가 지적한 부분: "exit 1 대신 sleep을 써서 rate limit 리셋을 기다리는 게 더 안정적이다."

이런 피드백을 받고 수정하면 훨씬 robust한 워크플로우가 만들어진다.

## 다국어 콘텐츠 번역 시스템 — 컨텍스트 관리가 핵심

AI 뉴스 시스템에서 가장 까다로운 부분이 다국어 번역이었다. 단순히 영어를 한국어로 번역하는 게 아니라, **기술 용어 일관성과 브랜드 톤앤매너**를 유지해야 했다.

먼저 `CLAUDE.md` 파일에 번역 가이드라인을 명시했다:

```markdown
# Translation Guidelines

## 기술 용어 번역 규칙
- API, SDK, CLI → 번역하지 않음
- deployment → "배포" (항상 한국어)
- refactoring → "리팩토링" (한국어 + 원어)
- prompt engineering → "프롬프트 엔지니어링"

## 톤앤매너
- 반말 사용 ("한다", "이다")
- 불필요한 수식어 제거
- 기술적 정확성 > 문학적 표현
```

그 다음 번역 프롬프트를 구조화했다:

> "다음 AI 뉴스 글을 한국어로 번역해. CLAUDE.md의 Translation Guidelines를 따르고, 기존 jidonglab 글들의 톤을 유지해.
> 
> 특히 주의할 점:
> 1. 회사명, 제품명은 번역하지 마 (OpenAI, Claude, GPT-4 등)
> 2. 기술 용어는 가이드라인 따라 일관성 유지
> 3. 반말 문체로, 한 문장은 25자 이내
> 4. 원문의 링크와 구조는 그대로 보존
> 
> 번역 완료 후 SEO를 위한 한국어 키워드 3개도 제안해."

이렇게 하면 단순 번역이 아니라 **브랜드에 맞는 로컬라이제이션**이 된다. 

중요한 건 컨텍스트 관리다. 긴 글을 번역할 때는 청크 단위로 나눠서 번역하되, 매번 "이전에 번역한 부분에서 사용한 용어 통일성을 유지해"라고 명시해야 한다.

```
이전 문단에서 "deployment"를 "배포"로 번역했으니, 이 문단에서도 동일하게 써.
```

## SEO와 메타데이터 자동화 — JSON-LD까지

SEO 최적화도 AI에게 맡겼는데, 여기서 핵심은 **구조화된 데이터까지 함께 생성**하게 하는 것이다.

프롬프트 예시:

> "이 블로그 글의 SEO를 최적화해. 다음 요소들을 모두 처리해:
> 
> 1. `<title>` 태그 — 55자 이내, 키워드 앞쪽 배치
> 2. meta description — 160자 이내, CTA 포함  
> 3. JSON-LD 스키마 — Article 타입으로 구조화
> 4. Open Graph 메타태그 — 소셜 공유 최적화
> 5. hreflang 태그 — 한/영 버전 연결
> 
> 결과를 Astro 컴포넌트 형태로 출력하고, JSON-LD는 별도 스크립트 태그로 분리해."

이렇게 요청하면 단순히 메타태그만 생성하는 게 아니라, 검색 엔진이 이해할 수 있는 **구조화된 데이터**까지 함께 만들어준다.

```javascript
// 생성된 JSON-LD 예시
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "GitHub Actions로 Dev.to 자동화하면서 배운 AI 에이전트 활용법",
  "author": {
    "@type": "Person",
    "name": "지동",
    "url": "https://jidonglab.com"
  },
  "datePublished": "2026-03-12",
  "publisher": {
    "@type": "Organization", 
    "name": "지동랩",
    "logo": "https://jidonglab.com/logo.png"
  }
}
```

특히 `hreflang` 태그 자동 생성이 유용했다. 한국어 글과 영어 글을 연결해서 검색 엔진이 언어별로 적절한 버전을 노출하게 만든다.

## 에러 핸들링과 모니터링 — AI가 놓치는 부분

AI가 만든 코드에서 가장 약한 부분이 **예외 상황 처리**다. 특히 외부 API를 사용하는 GitHub Actions에서는 더욱 그렇다.

Dev.to API는 rate limit이 1시간당 1000회인데, 처음 AI가 생성한 코드는 이걸 전혀 고려하지 않았다. 그래서 추가 프롬프트로 보완했다:

> "이 워크플로우에 robust한 에러 핸들링을 추가해:
> 
> 1. Dev.to API rate limit 체크 — 남은 횟수 100개 미만이면 대기
> 2. 네트워크 에러 시 3회 재시도, exponential backoff 적용  
> 3. 실패 시 Slack webhook으로 알림 발송
> 4. 성공률이 90% 미만이면 다음 실행 건너뛰기
> 5. 모든 API 응답을 로그로 남기되, 민감한 토큰은 마스킹"

결과적으로 이런 방어 코드가 추가됐다:

```yaml
- name: Check API health
  run: |
    response=$(curl -s -o /dev/null -w "%{http_code}" https://dev.to/api/articles)
    if [ $response -ne 200 ]; then
      echo "Dev.to API is down, skipping workflow"
      echo "skip_workflow=true" >> $GITHUB_ENV
    fi

- name: Wait for rate limit reset
  if: env.rate_limit_remaining < 100
  run: |
    reset_time=$(date -d @${{ env.rate_limit_reset }})
    echo "Rate limit low, waiting until $reset_time"
    sleep $((rate_limit_reset - $(date +%s)))
```

중요한 건 **실패했을 때의 복구 전략**도 함께 고려하는 것이다. 단순히 에러만 잡는 게 아니라 "실패하면 다음에 어떻게 다시 시도할 건지"까지 설계해야 한다.

## 더 나은 방법은 없을까

이번 작업을 하면서 몇 가지 아쉬운 부분이 있었다. 더 나은 대안들을 정리해본다.

**1. MCP 서버 활용**

현재는 Claude Code에서 직접 GitHub Actions YAML을 수정했는데, GitHub MCP 서버를 쓰면 더 효율적일 것 같다. repository 구조를 실시간으로 파악하고, 기존 워크플로우와의 충돌도 미리 체크할 수 있다.

**2. Anthropic의 Computer Use**

Dev.to 웹 인터페이스를 직접 조작해서 글 품질을 시각적으로 확인하는 작업도 자동화할 수 있을 것 같다. 특히 이미지나 코드 블록이 제대로 렌더링되는지 체크하는 용도로.

**3. 더 정교한 중복 판단 로직**

현재는 제목 유사도만 체크하는데, 임베딩 기반 의미 유사도 계산을 추가하면 더 정확할 것이다. OpenAI의 `text-embedding-3-small` 모델을 GitHub Actions에서 사용하는 것도 고려해볼 만하다.

**4. 점진적 배포 전략**

모든 글을 한번에 업데이트하는 대신, A/B 테스트 방식으로 일부 글만 먼저 적용해보고 성과를 측정하는 게 더 안전할 것 같다.

성능 측면에서도 개선 여지가 있다. 현재는 모든 Dev.to 글을 매번 다시 체크하는데, 변경된 글만 선별적으로 처리하면 API 호출을 50% 이상 줄일 수 있을 것이다.

## 정리

- **제약 조건부터 정하고** 프롬프팅하면 AI가 실용적인 코드를 만든다
- Claude Code의 `/commit`, `/review` 커맨드로 코드 품질과 일관성을 유지한다  
- 다국어 번역은 `CLAUDE.md`에 가이드라인을 명시하고 컨텍스트를 계속 유지한다
- SEO 최적화할 때는 메타태그뿐만 아니라 JSON-LD 구조화 데이터까지 함께 생성한다
- AI가 만든 코드의 에러 핸들링은 따로 보완 프롬프트로 강화해야 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

03b9bb9 — fix: cleanup-devto workflow 에러 처리 개선
e5c63ac — fix: @astrojs/sitemap 3.2.1로 다운그레이드 — hybrid 모드 빌드 에러 수정
fa12a97 — feat: Dev.to 중복/유사 글 스마트 정리 + 기존 글 푸터 자동 추가
3a06b5e — feat: 전체 콘텐츠 번역 시스템 개선 + hreflang SEO
27e2bc6 — feat: SEO 전면 개선 — sitemap, robots.txt, JSON-LD, Dev.to series
2e8cd7b — feat: Dev.to 글에 jidonglab 푸터 링크 강제 + 중복/저품질 정리 워크플로우
48d98cd — feat: AI 뉴스 시스템 전면 개선 — 영어 생성, 프롬프트 강화, Dev.to 태그 수정

</details>