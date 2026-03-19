---
title: "GitHub Actions로 블로그 자동화하는 AI 프롬프팅 — 멀티플랫폼 발행 전략"
project: "dev_blog"
date: 2026-03-19
lang: ko
tags: [chore, fix, feat]
---

GitHub Actions로 기술 블로그를 완전 자동화했다. 글 쓰기부터 여러 플랫폼 배포까지 AI가 다 한다. 이 과정에서 발견한 프롬프팅 패턴과 워크플로우 설계 원칙을 공유한다.

## 배경: 무엇을 만들고 있는가

기술 블로그를 운영하면서 반복되는 작업들이 많았다. 매일 작업 로그를 정리하고, 여러 언어로 번역하고, DEV.to, Hashnode, Blogger에 동시 발행하는 일. 수작업으로 하면 시간만 잡아먹는다.

목표는 명확했다. commit 데이터만 있으면 AI가 알아서 블로그 포스트를 생성하고, 품질을 검증하고, 적절한 플랫폼에 발행하는 시스템을 만드는 것이다.

## 구조화된 컨텐츠 생성 프롬프팅

블로그 자동화에서 가장 중요한 건 일관된 품질이다. 매번 다른 스타일로 글이 나오면 안 된다. 해결책은 극도로 구체적인 프롬프트였다.

### 효과적인 메타 프롬프트 패턴

> "당신은 AI 에이전트와 LLM을 활용한 개발 방법론을 연구하고 공유하는 기술 블로거다. 아래 커밋 데이터는 맥락일 뿐이다. 커밋을 나열하는 글이 아니라, 이 작업을 하면서 어떻게 AI를 활용했는지, 어떤 프롬프팅 기법을 썼는지, 어떤 도구와 패턴이 효과적인지를 깊이 있게 다루는 교육적 블로그 포스트를 작성한다."

이 프롬프트의 핵심은 **역할 정의 + 제약 조건 + 교육적 목표**를 명확히 한 것이다. "커밋 데이터는 맥락일 뿐"이라는 문장으로 AI가 단순 나열에 빠지지 않게 했다.

나쁜 프롬프트는 이렇다:
> "커밋 로그로 블로그 글 써줘"

이러면 AI가 기계적으로 commit 메시지만 정리한 의미 없는 글을 만든다.

### 문체 통일 전략

> "건조한 반말 사용: '~한다', '~했다', '~이다' (존댓말 절대 금지). 짧고 직관적인 문장. 불필요한 수식어 없이 핵심만. 기술 용어는 번역하지 않는다. 변수명, 파일명, CSS값, CLI 명령어는 반드시 backtick으로 감싼다."

문체 규칙을 이렇게 상세히 정의한 이유가 있다. AI는 context에 따라 문체가 흔들린다. 특히 기술 블로그에서 존댓말과 반말이 섞이거나, 번역투 문장이 나오면 읽기 어렵다.

**핵심은 부정 명령어**다. "존댓말 절대 금지", "감탄사, 이모지 사용 금지"처럼 하지 말아야 할 것을 명시했다. AI는 긍정 명령어보다 부정 명령어를 더 정확히 따른다.

### 구조 강제하기

```
### 1. 도입부 (h2 없이 바로 시작, 2~3줄)
### 2. 배경: 무엇을 만들고 있는가 (h2)
### 3. 핵심 섹션 2~3개 (h2) — 각 섹션이 하나의 "레슨"
### 4. 더 나은 방법은 없을까 (h2)
### 5. 정리 (h2)
### 6. 참고한 커밋들 (접기)
```

구조를 미리 정의해두면 AI가 일관된 형태로 글을 작성한다. 특히 "더 나은 방법은 없을까" 섹션을 강제한 건 의도적이다. 현재 방법의 한계를 인정하고 대안을 제시하게 하면 글의 깊이가 달라진다.

## GitHub Actions 워크플로우 설계 원칙

블로그 자동화의 핵심은 GitHub Actions 설계에 있다. 단순히 스크립트를 돌리는 게 아니라, 에러 처리와 조건부 실행을 고려해야 한다.

### 플랫폼별 조건부 발행

```yaml
- name: Check if Korean post
  run: |
    if [[ "${{ matrix.file }}" == *-ko.md ]]; then
      echo "skip_dev_to=true" >> $GITHUB_ENV
    fi

- name: Publish to DEV.to
  if: env.skip_dev_to != 'true'
  run: |
    # DEV.to API call
```

한국어 글은 DEV.to에 발행하지 않고, 영어 글만 발행하는 로직이다. 이런 조건부 처리가 없으면 모든 글이 모든 플랫폼에 올라가서 관리가 어려워진다.

AI에게 이런 워크플로우를 만들게 할 때 프롬프트는 이렇다:

> "GitHub Actions 워크플로우에서 파일명이 `-ko.md`로 끝나면 DEV.to 발행을 스킵하게 해줘. matrix strategy 사용 중이고, 환경변수로 조건 체크해야 한다."

구체적인 제약 조건(matrix strategy, 환경변수)을 명시하는 게 핵심이다.

### 에러 복구 패턴

```yaml
- name: Update published articles
  run: |
    # API 호출 후 결과 파싱
    if [ $? -eq 0 ]; then
      git add publish-log.txt
      git commit -m "chore: update published articles [skip ci]"
      git push
    else
      echo "Publishing failed, skipping commit"
    fi
```

API 호출이 실패해도 워크플로우가 중단되지 않게 했다. `[skip ci]` 태그로 무한 루프도 방지한다.

AI에게 에러 처리를 만들게 할 때는:

> "API 호출 실패시에도 워크플로우가 계속 실행되게 하고, 성공한 경우에만 git commit 하게 해줘. 무한 루프 방지도 필요해."

### 토큰 관리 전략

OAuth refresh token을 사용해서 액세스 토큰을 자동 갱신하게 했다. GitHub Secrets에 저장된 refresh token으로 새 액세스 토큰을 발급받는 방식이다.

```bash
ACCESS_TOKEN=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "grant_type=refresh_token" | jq -r .access_token)
```

이 부분을 AI에게 시킬 때 중요한 건 보안 관점을 명시하는 것이다:

> "Blogger API 인증을 OAuth refresh token 방식으로 구현해줘. 액세스 토큰은 GitHub Secrets에서 가져오고, 토큰 만료시 자동 갱신되게 해야 한다. 토큰이 로그에 노출되면 안 된다."

## 멀티플랫폼 컨텐츠 최적화

각 플랫폼마다 선호하는 컨텐츠 형태가 다르다. DEV.to는 기술 튜토리얼을, Hashnode는 심화 분석을, Blogger는 SEO 친화적 글을 선호한다.

### 플랫폼별 메타데이터 관리

```yaml
# DEV.to용
tags: ["ai", "github-actions", "automation", "devops"]
series: "AI Development Workflow"

# Hashnode용  
subtitle: "Complete guide to automating blog publishing with AI agents"
coverImage: "https://example.com/cover.png"

# Blogger용
labels: ["AI", "Automation", "GitHub Actions", "DevOps", "Programming"]
```

같은 글이라도 플랫폼별로 다른 메타데이터를 붙인다. AI에게 이런 최적화를 시키는 프롬프트:

> "DEV.to, Hashnode, Blogger에 동시 발행할 글이야. 각 플랫폼의 알고리즘에 맞게 tags, series, labels를 다르게 설정해줘. DEV.to는 실용적 키워드, Hashnode는 트렌디한 키워드, Blogger는 SEO 친화적 키워드로."

### 컨텐츠 길이 최적화

```javascript
// 플랫폼별 최적 길이 체크
const platformLimits = {
  'dev.to': { min: 1500, max: 8000 },
  'hashnode': { min: 2000, max: 10000 }, 
  'blogger': { min: 1000, max: 6000 }
};
```

너무 짧으면 알고리즘에서 불이익을 받고, 너무 길면 이탈률이 높아진다. 각 플랫폼의 최적 길이를 AI가 고려하게 했다.

## 더 나은 방법은 없을까

현재 방식보다 개선할 수 있는 부분들이 있다.

**Content Management API 활용**: 각 플랫폼의 공식 API를 더 적극적으로 활용할 수 있다. 현재는 단순 발행만 하는데, 성과 추적이나 A/B 테스트도 자동화할 수 있다.

**AI Agent 고도화**: 단순히 글을 생성하는 것을 넘어서, 독자 반응을 분석하고 다음 글 주제를 제안하는 에이전트를 만들 수 있다. OpenAI의 Assistants API나 Anthropic의 Claude Computer Use를 활용하면 가능하다.

**Semantic Release 패턴**: conventional commit 메시지를 파싱해서 글의 우선순위를 자동으로 결정하는 방식을 도입할 수 있다. `feat:`, `fix:`, `docs:` 같은 prefix로 컨텐츠 유형을 분류하는 것이다.

**Multi-Modal Content**: 코드 스크린샷이나 아키텍처 다이어그램을 자동 생성하는 기능을 추가할 수 있다. GitHub Copilot workspace나 Cursor의 이미지 생성 기능을 활용하면 된다.

## 정리

- **극도로 구체적인 프롬프트**가 일관된 품질을 보장한다
- **부정 명령어**로 AI의 잘못된 행동을 방지할 수 있다  
- **조건부 워크플로우**로 플랫폼별 최적화를 자동화한다
- **에러 복구 패턴**으로 안정적인 자동화를 구현한다

<details>
<summary>이번 작업의 커밋 로그</summary>

ece75e5 — post: build logs 2026-03-19 (2 posts, en)
244fbcf — post: build logs 2026-03-19 (2 posts, en)  
e4c1443 — chore: update published articles [skip ci]
3ffefc9 — fix: DEV.to에 한국어(-ko.md) 파일 발행 스킵
6a4f63d — feat: Blogger 영어 글만 발행 + 트렌디 인라인 CSS 적용
a365f54 — feat: Blogger 워크플로우 OAuth refresh token 방식으로 업데이트
765902d — feat: Medium → Hashnode 워크플로우 교체 (영어 글 자동 발행)
cf8a33f — feat: Medium + Blogger 자동 발행 워크플로우 추가

</details>