---
title: "블로그 자동화 파이프라인을 AI로 구축하는 법 — 60개 커밋의 교훈"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

블로그를 운영하다 보면 반복 작업이 많다. 포스트를 여러 플랫폼에 발행하고, 메타데이터를 관리하고, 번역하고, 성과가 안 좋은 글을 정리하는 일들. 이번에 60개 커밋으로 블로그 자동화 파이프라인을 만들면서 AI를 어떻게 활용했는지, 어떤 프롬프팅 패턴이 효과적인지 정리한다.

## 배경: 무엇을 만들고 있는가

현재 기술 블로그를 GitHub Pages + Jekyll로 운영하고 있다. 글을 쓰면 DEV.to, Hashnode, Blogger에도 자동으로 발행되고, 성과가 안 좋은 글은 자동으로 unpublish하는 시스템을 만들고 있었다. 영어/한국어 이중 언어 지원도 필요했다.

이번 작업의 목표는 크게 세 가지였다:
- 멀티 플랫폼 자동 발행 시스템 구축
- 영어 번역 자동화
- 성과 기반 컨텐츠 정리 자동화

## GitHub Actions 워크플로우를 AI로 설계하는 법

워크플로우 작성은 AI가 가장 잘하는 영역 중 하나다. 하지만 좋은 결과를 얻으려면 제약 조건을 명확하게 줘야 한다.

**효과적인 프롬프트 패턴:**

> "GitHub Actions 워크플로우를 만들어줘. 요구사항:
> 1. 매일 09:00 KST에 실행 (cron)
> 2. `posts/` 디렉토리에서 `published: true`인 영어 포스트만 찾기
> 3. DEV.to API로 발행할 때 기존 글은 업데이트, 새 글은 생성
> 4. API 실패시 에러 로그 출력하고 계속 진행
> 5. 결과를 `publish-log.txt`에 기록
> 6. secrets: `DEVTO_API_KEY`"

이렇게 구체적으로 쓰면 한 번에 동작하는 워크플로우를 받을 수 있다.

이렇게 쓰면 안 된다:
> "블로그 자동 발행 워크플로우 만들어줘"

**Claude Code의 `/commit` 활용:**

Claude Code에서 워크플로우 파일을 만든 후 `/commit` 명령어를 쓰면 적절한 커밋 메시지까지 자동으로 생성해준다. "feat: DEV.to 자동 발행 워크플로우 추가" 같은 conventional commit 형태로 나온다.

**멀티 API 에러 핸들링 패턴:**

```yaml
- name: Publish to DEV.to
  continue-on-error: true
  run: |
    if ! python scripts/publish-devto.py; then
      echo "DEV.to 발행 실패, 다음 플랫폼 진행" >> publish-log.txt
    fi
```

`continue-on-error: true`를 각 step에 주면 하나가 실패해도 전체 워크플로우가 멈추지 않는다. 이런 패턴을 AI에게 요청할 때도 "실패시 로그만 남기고 계속 진행"이라고 명시해야 한다.

## 번역 자동화에서 톤앤매너 유지하기

8개 포스트를 한국어에서 영어로 번역하는 작업이 있었다. 기술 블로그는 일관된 톤앤매너가 중요한데, AI에게 이걸 학습시키는 방법이 핵심이다.

**효과적인 번역 프롬프트:**

> "다음 기술 블로그 포스트를 영어로 번역해줘. 스타일 가이드:
> 
> 1. 톤: 캐주얼하지만 전문적. 반말 → informal but professional
> 2. 기술 용어: commit, deploy, refactor 등은 번역하지 않음
> 3. 코드/파일명: 백틱 유지
> 4. 구조: 한국어 제목 구조 그대로 유지
> 5. 예시: "이렇게 하면 안 된다" → "This doesn't work"
> 
> 기존 영어 포스트 샘플: [이미 번역된 글 1-2개 첨부]
> 
> 번역할 글: [원본 마크다운]"

**샘플 기반 학습이 핵심:**

이미 번역된 글 2-3개를 샘플로 주면 AI가 패턴을 학습한다. "~한다", "~했다" 같은 반말 톤을 어떻게 영어로 옮길지, 기술적인 설명을 어떤 수준으로 할지 감을 잡는다.

**일관성 검증 패턴:**

번역이 끝나면 다시 AI에게 검토를 시킨다:

> "방금 번역한 글과 기존 영어 포스트 3개를 비교해서 톤앤매너가 일치하는지 확인해줘. 다른 부분이 있으면 수정 제안해줘."

이 과정을 거치면 브랜드 일관성이 크게 올라간다.

## 성과 기반 컨텐츠 정리 자동화

블로그를 오래 운영하면 성과가 안 좋은 글들이 쌓인다. 이걸 수동으로 정리하는 건 비효율적이다. AI로 판단 기준을 만들고 자동화하는 방법을 찾았다.

**데이터 기반 판단 로직:**

```python
def should_unpublish(article):
    # AI가 작성한 판단 로직
    if article['page_views'] < 50 and article['days_since_publish'] > 30:
        if 'build-log' in article['tags'] or 'news' in article['tags']:
            return True
    return False
```

이런 로직을 AI에게 만들게 할 때는 비즈니스 룰을 명확하게 줘야 한다:

> "컨텐츠 정리 기준을 만들어줘:
> 1. 발행 후 30일 지났고 조회수 50 미만
> 2. 태그에 'build-log' 또는 'news' 포함
> 3. 단, 'tutorial'이나 'guide' 태그는 제외
> 4. 한국어 글만 대상 (영어는 유지)
> 
> Python 함수로 구현해줘."

**API 통합 자동화:**

DEV.to API로 글을 unpublish하는 스크립트도 AI가 작성했다. API 문서를 함께 주면 더 정확한 코드를 받을 수 있다:

> "DEV.to API 문서: [API docs 링크]
> 
> 위 판단 로직에 따라 해당하는 글들을 unpublish하는 스크립트 만들어줘. 실행 전에 대상 글 목록을 출력하고 확인받는 기능도 넣어줘."

**MCP를 활용한 실시간 데이터 연동:**

Model Context Protocol(MCP) 서버를 만들어서 Claude가 실시간으로 블로그 통계에 접근할 수 있게 했다. 이렇게 하면 AI가 현재 상황을 보고 더 정확한 판단을 할 수 있다.

```python
# MCP 서버 설정
@mcp.tool("get_blog_stats")
def get_blog_stats(days: int = 30):
    """최근 N일간 블로그 통계 조회"""
    return fetch_analytics_data(days)
```

Claude가 이 도구에 접근해서 "최근 30일간 조회수가 낮은 글은 뭐가 있어?"라고 물어볼 수 있다.

## 더 나은 방법은 없을까

이번 작업을 하면서 발견한 개선점들이 있다.

**Anthropic Computer Use 활용:**

현재는 각 플랫폼별로 API를 직접 호출하고 있는데, Claude의 Computer Use 기능을 쓰면 브라우저 자동화로 더 안정적으로 발행할 수 있다. Blogger처럼 API가 복잡한 플랫폼에서 특히 유용하다.

**Structured Output으로 메타데이터 관리:**

OpenAI의 Structured Output이나 Anthropic의 Tool Use를 써서 frontmatter를 더 체계적으로 생성할 수 있다:

```python
# Pydantic 스키마 정의
class BlogPost(BaseModel):
    title: str
    slug: str
    tags: List[str]
    published: bool
    platforms: List[str]

# AI가 이 구조에 맞춰 메타데이터 생성
```

**GitHub Copilot Workspace 통합:**

반복적인 블로그 관리 작업들을 Copilot Workspace에서 한 번에 처리할 수 있다. "이번 주 발행할 글 5개 준비해줘"라고 하면 번역, 메타데이터 생성, 플랫폼별 최적화까지 한 번에 된다.

**더 정교한 성과 지표:**

현재는 단순 조회수만 보고 있는데, 체류 시간, 공유 횟수, 백링크 등을 종합해서 판단하는 AI 모델을 만들 수 있다. Vercel Analytics API나 Google Analytics를 MCP로 연동하면 된다.

## 정리

이번 블로그 자동화 작업에서 배운 핵심은 네 가지다:

- 워크플로우 설계할 때는 제약 조건과 에러 핸들링을 명확하게 정의한다
- 번역 작업에서는 기존 샘플을 활용한 톤앤매너 학습이 필수다
- 반복 작업은 비즈니스 룰을 명확하게 정의하면 AI가 잘 자동화한다
- MCP나 Structured Output 같은 최신 기능을 적극 활용하면 더 정교한 자동화가 가능하다

AI를 단순한 코드 생성기로 쓰지 말고, 명확한 요구사항과 제약 조건을 주는 파트너로 활용하는 게 핵심이다.

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

</details>