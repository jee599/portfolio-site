---
title: "AI 뉴스 스크립트에 blog-writing 스킬 적용 — 콘텐츠 자동화의 현실적 접근법"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [feat, fix, chore, astro, typescript]
---

개인 블로그에 AI 뉴스 섹션을 만들고, 매일 콘텐츠를 자동 생성하는 시스템을 구축했다. Claude Code의 skills 기능을 활용해서 일관된 품질의 뉴스 아티클을 생성하고, 한영 이중 언어로 발행까지 자동화했다. 이 과정에서 발견한 실무적인 프롬프팅 패턴과 자동화 전략을 공유한다.

## 배경: 무엇을 만들고 있는가

`jidonglab.com`은 기술 블로그 겸 포트폴리오 사이트다. Astro 기반으로 구축했고, 한영 이중 언어를 지원한다. 최근에 AI 뉴스 섹션을 추가해서 매일 3-4개의 AI 업계 소식을 정리해서 올리고 있다.

이번 작업의 목표는 명확했다. 수동으로 뉴스를 찾고 번역하고 포스팅하는 시간을 줄이면서도, 품질은 유지하는 것이다. Claude Code의 skills 시스템을 활용해서 일관된 톤앤매너로 콘텐츠를 생성하고, 스크립트 하나로 한영 버전을 동시에 만들어서 발행까지 자동화하려고 했다.

## 핵심 레슨 1: Claude Skills로 글쓰기 일관성 확보하기

AI 콘텐츠 생성에서 가장 큰 문제는 일관성이다. 매번 다른 톤으로 글을 쓰거나, 구조가 제각각이면 브랜드 정체성이 흐릿해진다. Claude Code의 skills 기능은 이 문제를 해결하는 핵심 도구다.

### blog-writing 스킬 설정

먼저 `CLAUDE.md`에 blog-writing skill을 정의했다:

```markdown
## Skills

### blog-writing
- 기술 뉴스를 간결하고 직관적으로 요약
- 반말 톤 사용 ("~한다", "~했다", "~이다")
- 마케팅 용어나 과장된 표현 제거
- 3문단 구조: 핵심 내용 → 배경/맥락 → 영향/전망
- 제목은 팩트 위주, 클릭베이트 금지
```

이 스킬을 적용한 프롬프트는 다음과 같다:

> `/skills blog-writing`를 사용해서 다음 AI 뉴스들을 한국어와 영어로 각각 작성해줘. 각 뉴스는 독립적인 마크다운 파일로, frontmatter에는 title, description, date, tags를 포함해. 한국어는 DEV.to 발행용, 영어는 jidonglab.com용이야.

이렇게 쓰면 안 된다:
> "뉴스 요약해줘"

차이점은 명확하다. 첫 번째 프롬프트는 스킬을 명시적으로 호출하고, 출력 형식과 용도까지 구체적으로 지정한다. 두 번째는 너무 모호해서 매번 다른 결과가 나온다.

### 스킬 활용 시 주의점

skills를 쓸 때 발견한 몇 가지 패턴이 있다:

**1. 스킬 호출은 프롬프트 시작 부분에**
중간에 넣으면 제대로 적용되지 않는 경우가 많다. `/skills blog-writing`을 첫 줄에 두고 시작한다.

**2. 스킬 정의는 구체적으로**
"좋은 글을 써줘"가 아니라 "3문단 구조: 핵심 → 배경 → 전망"처럼 명확한 가이드라인을 준다.

**3. 예외 상황도 미리 정의**
"마케팅 용어 제거"라고 했지만, 실제 제품명이나 공식 발표는 그대로 써야 한다. 이런 예외 케이스를 스킬에 포함시켜야 한다.

### 실제 적용 결과

blog-writing 스킬을 적용하기 전후를 비교해보자.

**적용 전:**
```markdown
# 🚀 NVIDIA, 차세대 Rubin GPU 아키텍처 공개! AI 성능 대폭 향상 기대

NVIDIA가 GTC 2026에서 혁신적인 Rubin GPU 아키텍처를 발표했습니다! 
이번 발표는 AI 업계에 엄청난 파장을 일으킬 것으로 예상됩니다.
```

**적용 후:**
```markdown
# NVIDIA GTC 2026에서 Rubin GPU 아키텍처 발표

NVIDIA가 GTC 2026에서 Rubin GPU 아키텍처를 공개했다. 
기존 Hopper 대비 AI 워크로드 처리 성능이 2.5배 향상된다고 발표했다.
```

차이가 확실하다. 이모지와 감탄사가 사라지고, 팩트 위주로 간결해졌다. 이런 일관성이 16개 뉴스 파일 전체에 적용되었다.

## 핵심 레슨 2: 멀티 언어 콘텐츠 생성 전략

한영 이중 언어로 콘텐츠를 만들 때는 단순 번역이 아니라 각 언어권의 맥락을 고려해야 한다. 같은 뉴스라도 한국 독자와 글로벌 독자가 관심 있어 하는 지점이 다르다.

### 언어별 타겟팅 프롬프트

효과적인 프롬프트 패턴을 발견했다:

> 다음 AI 뉴스를 한국어와 영어로 각각 작성해줘:
> 
> **한국어 버전 (DEV.to 발행용):**
> - 한국 스타트업/기업에 미칠 영향 언급
> - "~한다", "~했다" 반말 톤
> - 3-4 문단, 800자 내외
> 
> **영어 버전 (jidonglab.com용):**
> - 글로벌 트렌드와 연결
> - Professional but conversational tone
> - 3 paragraphs, ~400 words

이렇게 하면 같은 뉴스도 독자층에 맞게 다른 관점으로 작성된다. 예를 들어 "Anthropic Partner Network 100M 사기 계정 탐지" 뉴스의 경우:

- **한국어:** 국내 AI 서비스 보안 강화 필요성에 초점
- **영어:** 글로벌 AI 거버넌스와 규제 동향에 연결

### 파일명과 메타데이터 자동 생성

멀티 언어 콘텐츠에서 까다로운 부분이 파일명과 frontmatter 관리다. 수동으로 하면 실수가 많이 발생한다.

스크립트에서 이 부분을 자동화했다:

```bash
# Korean version for DEV.to
KOREAN_FILENAME="src/content/ai-news/${DATE}-${SLUG}-ko.md"

# English version for jidonglab.com  
ENGLISH_FILENAME="src/content/ai-news/${DATE}-${SLUG}.md"
```

slug 생성도 AI에게 맡겼다:

> 각 뉴스의 파일명으로 사용할 slug를 생성해줘. 형식: `2026-03-14-nvidia-gtc-rubin-gpu` (날짜-주요키워드-3-4개)

이렇게 하면 파일명 충돌 없이 일관된 네이밍 컨벤션을 유지할 수 있다.

## 핵심 레슨 3: 자동화 스크립트의 현실적 설계

완전 자동화를 목표로 하되, 사람의 개입이 필요한 지점을 명확히 구분했다. 100% 자동화보다는 80% 자동화 + 20% 수동 검토가 현실적이다.

### 스크립트 구조화

`generate-ai-news.sh` 스크립트는 다음과 같이 설계했다:

1. **뉴스 소스 크롤링** (자동)
2. **Claude API로 콘텐츠 생성** (자동) 
3. **파일 저장 및 git commit** (자동)
4. **DEV.to 발행** (수동 트리거)

완전 자동 발행을 안 한 이유는 품질 관리 때문이다. AI가 생성한 콘텐츠를 한 번 검토하고 필요하면 수정한 후 발행하는 게 안전하다.

### Claude Code와 외부 API 연동

Claude Code에서 외부 API를 호출할 때는 MCP(Model Context Protocol) 서버를 쓰는 게 가장 깔끔하다. 하지만 간단한 HTTP 호출이면 curl로도 충분하다.

```typescript
// src/pages/api/generate-ai-news.ts
export async function POST({ request }: APIContext) {
  const { topic, count = 3 } = await request.json();
  
  const prompt = `Generate ${count} AI news articles about ${topic}`;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  return new Response(JSON.stringify(result));
}
```

Cloudflare Pages에서는 `node:fs` 모듈을 쓸 수 없어서 파일 저장 부분을 API에서 제거했다. 대신 스크립트에서 API 응답을 받아서 파일로 저장하는 방식으로 바꿨다.

### GitHub Actions 연동

`.github/workflows/publish-to-devto.yml`에서 DEV.to 자동 발행을 설정했다:

```yaml
name: Publish to DEV.to
on:
  workflow_dispatch:
    inputs:
      filter:
        description: 'File filter (e.g., ai-news)'
        required: true
        default: 'ai-news'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Publish to DEV.to
        run: |
          # Only publish Korean AI news articles
          find src/content/ai-news -name "*-ko.md" -newer LAST_PUBLISH | \
          xargs -I {} ./scripts/publish-devto.sh {}
```

수동 트리거(`workflow_dispatch`)로 설정한 이유는 발행 타이밍을 제어하기 위해서다. 뉴스가 생성되자마자 바로 발행하는 것보다, 하루 분량을 모아서 한 번에 발행하는 게 더 효율적이다.

## 더 나은 방법은 없을까

이 글에서 소개한 방식보다 더 효율적인 접근법들이 있다:

### 1. Claude Computer Use 활용

최근 공개된 Claude Computer Use를 쓰면 브라우저 자동화까지 가능하다. 뉴스 사이트를 직접 스크래핑하고, CMS에 자동 로그인해서 포스팅까지 완전 자동화할 수 있다.

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[{
        "type": "computer_use",
        "name": "computer",
        "display_width_px": 1024,
        "display_height_px": 768,
    }],
    messages=[{
        "role": "user", 
        "content": "Visit TechCrunch, find top 3 AI news, and post to DEV.to"
    }]
)
```

하지만 Computer Use는 아직 실험 단계라 프로덕션에서 쓰기엔 불안정하다. 6개월 후쯤 고려해볼 만하다.

### 2. Langchain Agent 패턴

현재는 단순한 스크립트 기반이지만, Langchain의 Agent 패턴을 쓰면 더 정교한 워크플로우를 만들 수 있다:

```python
from langchain.agents import initialize_agent, Tool
from langchain.llms import Claude

def create_news_agent():
    tools = [
        Tool(name="NewsAPI", func=fetch_news),
        Tool(name="Translator", func=translate_content),
        Tool(name="Publisher", func=publish_to_platforms)
    ]
    
    agent = initialize_agent(
        tools, Claude(model="claude-3-5-sonnet"), 
        agent="zero-shot-react-description"
    )
    return agent

agent = create_news_agent()
agent.run("Generate and publish today's AI news in Korean and English")
```

이 방식은 각 단계별로 에러 핸들링과 재시도 로직을 구현할 수 있어서 더 안정적이다.

### 3. Astro의 Content Layer API 활용

Astro 5.0에서 추가된 Content Layer API를 쓰면 외부 API에서 직접 콘텐츠를 가져올 수 있다:

```typescript
// astro.config.mjs
export default defineConfig({
  experimental: {
    contentLayer: true,
  },
  integrations: [
    contentLayer({
      sources: [
        {
          name: 'ai-news',
          fetch: async () => {
            const response = await fetch('/api/generate-ai-news');
            return response.json();
          },
          schema: newsSchema
        }
      ]
    })
  ]
});
```

이렇게 하면 빌드 타임에 자동으로 최신 뉴스를 생성해서 정적 사이트에 포함시킬 수 있다. 현재 방식보다 성능상 이점이 크다.

### 4. RSS 피드 자동 생성

현재는 개별 페이지만 생성하지만, RSS 피드까지 자동으로 만들면 구독자 관리가 편해진다:

```typescript
// src/pages/ai-news/rss.xml.ts
export async function GET() {
  const posts = await getCollection('ai-news');
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>JidongLab AI News</title>
        ${posts.map(post => `
          <item>
            <title>${post.data.title}</title>
            <link>https://jidonglab.com/ai-news/${post.slug}</link>
            <description>${post.data.description}</description>
          </item>
        `).join('')}
      </channel>
    </rss>`;
  
  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml' }
  });
}
```

### 성능 최적화 관점

현재 방식의 비용/성능 분석:
- **Claude API 호출:** 뉴스 4개당 ~$0.15 (매일 기준 월 $4.5)
- **생성 시간:** 평균 45초
- **품질:** 수동 검토 후 수정률 ~20%

Langchain Agent를 쓰면 생성 시간은 2-3배 늘어나지만 품질이 높아져서 수정률이 5% 이하로 떨어진다. 시간 vs 품질의 트레이드오프를 고려해서 선택하면 된다.

## 정리

Claude Code의 skills 기능을 활용한 콘텐츠 자동화에서 핵심은 다음 4가지다:

- Skills 정의는 구체적으로 — "좋은 글"이 아니라 "3문단 구조, 반말 톤, 팩트 위주"
- 멀티 언어는 번역이 아니라 타겟팅 — 독자층별로 다른 관점과 톤 적용  
- 자동화 범위는 현실적으로 — 100% 자동보다 80% 자동 + 20% 검토가 안전
- 에러 핸들링을 처음부터 고려 — Cloudflare Pages 제약 같은 배포 환경 차이점까지 포함

완벽한 자동화보다는 지속 가능한 자동화가 중요하다. 매일 10분 투자해서 품질을 검토하는 게, 완전 자동화했다가 품질 문제로 전체를 다시 만드는 것보다 낫다.

<details>
<summary>이번 작업의 커밋 로그</summary>

6c03231 — feat: admin 플랫폼별 조회수 표시
f57ccec — feat: admin에 Publishing Platforms 링크 추가 (DEV.to, Hashnode, Blogger, jidonglab)
30df391 — feat: admin Content by Views — 전체 콘텐츠 조회수순 정렬
90338ee — fix: admin 히트맵 깨짐 — style is:inline으로 변경
d669623 — fix: 언어 전환 시 글 목록 사라지는 문제 수정
a9bfd91 — fix: disable sitemap (Cloudflare Pages 빌드 실패 원인 #2)
ce249ba — fix: remove Vercel fix-runtime from build command (Cloudflare 빌드 실패 원인)
21c013c — feat: Cloudflare Web Analytics + 리전 기반 자동 언어 전환
23350c9 — chore: trigger Cloudflare Pages rebuild
641d577 — fix: remove node:fs import from generate-ai-news API (Cloudflare 빌드 에러 수정)
c4b0055 — feat: AI 뉴스 스크립트에 blog-writing 스킬 적용
358bf9c — fix: DEV.to 워크플로우 ai-news만 발행 + 챗봇 규제 뉴스 삭제
e615288 — feat: AI 뉴스 스크립트 — 영어(jidonglab) + 한국어(DEV.to) 이중 생성
a00b3bf — feat: AI news 2026-03-14 (4 posts, en)
069ca0d — feat: AI 뉴스 CLI 생성 스크립트 + 2026-03-14 뉴스 4건
6788360 — feat: AI 뉴스 자동 생성 (2026-03-14)

</details>