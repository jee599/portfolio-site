---
title: "AI 에이전트로 포트폴리오 사이트 운영하기 — 성능 최적화부터 콘텐츠 업데이트까지"
project: "portfolio-site"
date: 2026-03-11
lang: ko
tags: [chore, feat, fix, astro, typescript]
---

개인 포트폴리오 사이트에 AI 뉴스 생성 기능을 만들어 놨는데, Cloudflare 524 timeout이 터지고 있었다. 이번에 Claude로 병렬 처리 구조로 리팩토링하고, 불필요한 UI 요소들도 정리했다. AI 에이전트에게 성능 최적화와 사이트 관리를 맡기는 구체적인 방법을 정리한다.

## 배경: 무엇을 만들고 있는가

jidonglab.com은 내 개인 포트폴리오 사이트다. Astro로 만들어져 있고, 여러 사이드 프로젝트들의 상태와 AI 뉴스 생성 기능이 들어있다. 최근에 HackerNews, Reddit, X, GitHub에서 AI 관련 핫 토픽을 크롤링해서 뉴스를 생성하는 API를 추가했는데, 문제가 생겼다.

API 호출 시간이 너무 길어서 Cloudflare의 100초 제한에 걸리는 것이다. 각 플랫폼에서 순차적으로 데이터를 가져오다 보니 전체 응답 시간이 2분을 넘어가고 있었다. 동시에 메인 페이지가 너무 복잡해져서 핵심 정보가 묻히는 문제도 있었다.

이번 작업의 목표는 두 가지였다:
1. AI 뉴스 생성 API를 병렬 처리로 최적화해서 timeout 해결
2. 포트폴리오 사이트의 UI를 정리해서 집중도 높이기

## Claude로 비동기 병렬 처리 리팩토링하기

가장 큰 문제부터 해결했다. 기존 `generate-ai-news.ts` API는 HackerNews → Reddit → X → GitHub 순서로 하나씩 처리하고 있었다.

### 프롬프팅 전략: 성능 문제 진단부터

Claude에게 단순히 "빠르게 해줘"라고 하면 안 된다. 문제의 근본 원인을 먼저 파악하게 해야 한다.

> "이 API 코드에서 Cloudflare 524 timeout이 발생하고 있다. 각 플랫폼별 데이터 fetch 시간을 분석하고, 어떤 부분이 병목인지 찾아줘. 그 다음에 병렬 처리로 최적화하되, 전체 응답 시간이 60초 이내가 되도록 해줘."

이렇게 쓰면 안 된다:
> "API 빠르게 만들어줘"

Claude는 먼저 코드를 분석해서 각 fetch 구간의 예상 시간을 계산했다. HackerNews API가 가장 느리고(20-30초), GitHub search가 그 다음(15-20초)이라는 걸 파악했다. 그리고 `Promise.all()`을 써서 4개 플랫폼을 동시에 처리하는 구조를 제안했다.

### 구조화 전략: 에러 핸들링까지 고려

병렬 처리에서 중요한 건 하나가 실패해도 전체가 멈추면 안 된다는 점이다. Claude에게 이런 제약 조건을 명확히 줬다.

> "각 플랫폼별 fetch를 독립적으로 처리해서, 하나가 실패해도 나머지는 계속 진행되게 해줘. timeout은 각 플랫폼별로 20초씩 설정하고, 실패한 플랫폼은 빈 배열로 처리해줘."

결과적으로 이런 구조가 나왔다:

```typescript
const fetchPromises = [
  fetchHackerNewsStories().catch(() => []),
  fetchRedditPosts().catch(() => []),
  fetchTwitterPosts().catch(() => []),
  fetchGitHubTrending().catch(() => [])
];

const [hnStories, redditPosts, twitterPosts, githubRepos] = 
  await Promise.all(fetchPromises);
```

각 fetch 함수에는 20초 timeout을 걸고, 실패 시에는 빈 배열을 반환하게 했다. 이렇게 하면 전체 API 호출 시간이 최악의 경우에도 20초를 넘지 않는다.

### Claude Code 활용: slash command로 성능 테스트

변경사항을 배포하기 전에 `/test` 명령어로 성능을 확인했다.

```bash
# 기존 API 응답 시간 측정
time curl "https://jidonglab.com/api/generate-ai-news"

# 병렬 처리 후 응답 시간 재측정
```

실제로 평균 응답 시간이 120초에서 25초로 줄어들었다. Cloudflare timeout 문제가 완전히 해결됐다.

## 포트폴리오 사이트 UI 정리: 집중도 높이기

성능 문제를 해결하고 나서 사이트 전체를 정리했다. 메인 페이지에 너무 많은 정보가 들어있어서 핵심 메시지가 묻히고 있었다.

### 프롬프팅 전략: UX 관점에서 판단하게 하기

Claude에게 단순히 "UI 정리해줘"라고 하면 자의적으로 제거한다. UX 원칙을 기준으로 판단하게 해야 한다.

> "포트폴리오 사이트 방문자의 목적은 내가 누구고 뭘 할 수 있는지 파악하는 것이다. 현재 메인 페이지에서 이 목적과 관련 없는 요소들을 찾아서 제거해줘. 방문자 카운터, AI 뉴스 CTA 같은 건 admin 페이지로 옮기거나 아예 제거하는 게 좋겠다."

Claude는 다음 요소들을 제거 대상으로 식별했다:
- 메인 사이드바의 LLM News, AI News CTA 섹션 (91줄 삭제)
- 방문자 카운터 (admin에서만 보이게 이동, 77줄 삭제)
- 실험적인 기능들의 과도한 설명

### MCP 서버 연동: 프로젝트 상태 자동 업데이트

포트폴리오에 있는 프로젝트들의 상태도 함께 업데이트했다. 이 부분에서 Claude의 MCP(Model Context Protocol) 서버 연동이 유용했다.

프로젝트 상태를 YAML 파일로 관리하고 있는데:

```yaml
# coffee-chat.yaml
status: "운영중"
description: "매주 새로운 사람들과 커피챗 진행"

# trading-bot.yaml  
status: "실험중"
description: "알고리즘 트레이딩 전략 백테스팅"
```

Claude에게 현재 실제 상황을 알려주고 상태를 업데이트하게 했다:

> "커피챗은 현재 활발히 운영중이고, 트레이딩봇은 여러 전략을 실험하는 단계다. 각 프로젝트의 status와 description을 현실에 맞게 업데이트해줘."

### 구조화 전략: 변경사항의 영향도 분석

UI 요소를 제거할 때는 다른 페이지나 컴포넌트에 미치는 영향을 확인해야 한다. Claude에게 의존성 분석을 시켰다.

> "사이드바에서 AI News 섹션을 제거하기 전에, 이 컴포넌트를 참조하는 다른 파일이 있는지 확인해줘. 있다면 함께 수정해야 할 부분도 알려줘."

Claude는 `grep`으로 코드베이스를 검색해서 해당 컴포넌트가 다른 곳에서 쓰이지 않는다는 걸 확인한 후 안전하게 제거했다.

## Claude Code의 commit message 패턴 활용

이번 작업에서 Claude가 생성한 commit message들을 보면 패턴이 있다:

- `chore:` - UI 정리, 설정 변경 등 비즈니스 로직과 무관한 작업
- `feat:` - 새 기능 추가 (병렬 처리 확장)
- `fix:` - 버그 수정 (timeout 문제 해결)

Claude Code에서는 `/commit` 명령어로 자동으로 conventional commits 형식을 맞춰준다. 다만 한글 메시지를 쓸 때는 추가 설정이 필요하다.

`CLAUDE.md`에 이런 규칙을 명시해두면 도움이 된다:

```markdown
## Commit Message Guidelines
- 한글로 작성하되 conventional commits 형식 유지
- UI/UX 관련 변경사항은 사용자 관점에서 설명
- 성능 최적화는 구체적인 수치나 방법 포함
```

## 더 나은 방법은 없을까

이번 작업에서 사용한 방식들을 돌아보면 몇 가지 개선 여지가 있다.

### 성능 모니터링 자동화

병렬 처리로 최적화했지만, 장기적으로는 성능 모니터링이 자동화되어야 한다. Cloudflare Analytics나 Sentry 같은 도구를 연동해서 API 응답 시간을 지속적으로 추적하는 게 좋겠다.

현재는 수동으로 `curl`로 테스트했지만, GitHub Actions에서 정기적으로 성능 테스트를 돌리고 임계값을 넘으면 알림을 받는 구조가 더 안정적이다.

### 더 정교한 에러 핸들링

`Promise.all()`에서 개별 실패를 처리하긴 했지만, 어떤 플랫폼이 얼마나 자주 실패하는지 로깅이 없다. Anthropic의 공식 문서에서는 이런 경우 structured logging을 권장한다:

```typescript
const results = await Promise.allSettled(fetchPromises);
results.forEach((result, index) => {
  if (result.status === 'rejected') {
    logger.warn(`Platform ${platforms[index]} failed: ${result.reason}`);
  }
});
```

### MCP 서버 활용도 확대

현재는 파일 수정 정도만 MCP로 처리하고 있는데, 프로젝트 상태 업데이트를 더 체계화할 수 있다. 예를 들어:

- GitHub API와 연동해서 커밋 활성도 기반으로 프로젝트 상태 자동 판단
- Google Analytics 데이터로 각 프로젝트 페이지의 방문자 수 추적
- 트레이딩봇 같은 실험적 프로젝트의 성과 지표 자동 수집

### 더 스마트한 콘텐츠 큐레이션

AI 뉴스 생성에서 단순히 4개 플랫폼에서 데이터를 가져오는 것보다, 중복 제거나 품질 필터링을 추가하면 좋겠다. OpenAI의 embedding API를 써서 유사한 뉴스를 클러스터링하거나, 트렌딩 점수를 계산해서 정말 중요한 뉴스만 선별하는 방식을 고려할 수 있다.

## 정리

- 성능 문제 해결 시 Claude에게 병목 지점 분석부터 시키고, 구체적인 제약 조건을 줘라
- 병렬 처리 최적화할 때는 개별 실패 처리와 timeout 설정을 반드시 포함해라
- 포트폴리오 사이트 정리는 방문자 목적 기준으로 불필요한 요소를 제거하는 게 핵심이다
- MCP 서버 연동으로 프로젝트 상태 관리 같은 반복 작업을 자동화할 수 있다

<details>
<summary>이번 작업의 커밋 로그</summary>

d846c25 — chore: 메인 페이지에서 방문자 카운터 제거 (admin에서만 표시)
ca61e0c — chore: 프로젝트 상태 업데이트 (커피챗 운영중, 트레이딩봇 실험중)
888e557 — feat: parallelize HN/Reddit/X/GitHub searches + expand hot news collection
20e9915 — fix: parallelize AI news generation to prevent Cloudflare 524 timeout
534844f — fix: 메인 사이드바에서 LLM News, AI News CTA 섹션 제거

</details>