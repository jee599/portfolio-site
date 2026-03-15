---
title: "AI 뉴스 자동 생성 파이프라인을 만들며 배운 다국어 콘텐츠 전략"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [fix, feat, chore, astro, typescript]
---

포트폴리오 사이트에 AI 뉴스 섹션을 추가하고, 이를 완전히 자동화된 파이프라인으로 구축했다. 단순히 뉴스를 긁어오는 게 아니라 영어와 한국어로 각각 다른 톤의 콘텐츠를 생성하고, 플랫폼별로 배포까지 자동화하는 시스템을 만들었다. 이 과정에서 발견한 다국어 콘텐츠 생성의 핵심 패턴과 AI 활용법을 정리한다.

## 배경: 무엇을 만들고 있는가

개인 포트폴리오 사이트 `jidonglab.com`에 AI 관련 뉴스를 큐레이션하는 섹션을 추가하기로 했다. 하지만 수동으로 뉴스를 찾고 정리하는 건 지속 가능하지 않다. 목표는 이런 시스템이었다:

- 매일 AI 관련 주요 뉴스 4-5개를 자동 수집
- 영어판은 글로벌 독자용 (간결하고 팩트 중심)
- 한국어판은 DEV.to 커뮤니티용 (더 친근하고 해석 포함)
- GitHub Actions로 완전 자동화
- Cloudflare Pages 배포와 연동

여기서 핵심은 "같은 뉴스, 다른 관점"이다. 단순 번역이 아니라 타겟 독자에 맞는 콘텐츠를 생성해야 한다.

## 콘텐츠 생성 파이프라인 설계 — AI에게 일을 나눠주는 법

AI에게 "뉴스 써줘"라고 하면 안 된다. 작업을 명확히 나누고 각 단계별로 다른 프롬프팅 전략을 써야 한다.

### 1단계: 뉴스 수집과 필터링

먼저 raw data를 수집한다. RSS나 API로 가져온 뉴스 목록에서 AI가 중요도를 판단하게 한다.

```bash
# scripts/generate-ai-news.sh의 핵심 로직
curl -s "https://feeds.feedburner.com/venturebeat/SZYF" | \
  xmllint --format - | \
  # AI에게 전달할 구조화된 데이터로 변환
```

이때 프롬프트가 중요하다:

> "다음 AI 뉴스 목록에서 기술적 중요도가 높은 4개를 선별해줘. 우선순위: 1) 새로운 모델/제품 출시 2) 정책/규제 변화 3) 업계 동향 4) 투자/인수합병. 단순한 리포트나 인터뷰는 제외해."

이렇게 하면 안 된다:
> "중요한 뉴스 골라줘"

구체적인 선별 기준을 줘야 일관된 품질이 나온다.

### 2단계: 언어별 콘텐츠 생성

같은 뉴스라도 독자층이 다르면 완전히 다른 접근이 필요하다. `generate-ai-news.sh`에서 두 개의 별도 프롬프트를 사용한다:

**영어판 (글로벌 독자용):**
> "Write a concise tech news summary for international developers. Focus on: 1) What happened 2) Why it matters technically 3) Concrete impact on developers. Keep it under 200 words. Use active voice and avoid marketing speak."

**한국어판 (DEV.to 커뮤니티용):**
> "한국 개발자 커뮤니티를 위한 AI 뉴스를 작성해줘. 1) 팩트 전달 2) 한국 시장/개발 환경에 미칠 영향 해석 3) 개발자 관점에서의 의견 추가. 300자 내외로 친근한 톤으로 작성. 전문용어는 한글로 설명 병기."

핵심은 **같은 정보, 다른 포장**이다. 영어는 빠르게 스캔할 수 있게, 한국어는 맥락과 해석을 더 많이 넣는다.

### 3단계: 메타데이터와 SEO 최적화

AI에게 콘텐츠뿐만 아니라 SEO 메타데이터도 생성하게 한다:

> "Generate frontmatter for this AI news post. Include: title (65 chars max), description (155 chars max), tags (3-5 relevant), publishedAt (ISO format). Title should be clickable but not clickbait."

```yaml
---
title: "Anthropic Partner Network Hits 100M Users"
description: "New partnership program reaches major milestone with focus on enterprise AI safety and integration standards."
tags: ["anthropic", "partnerships", "enterprise-ai", "claude"]
publishedAt: 2026-03-14T09:00:00Z
---
```

## Claude Code 활용 — 멀티파일 작업의 컨텍스트 관리

이 프로젝트에서 가장 까다로운 부분은 여러 파일을 동시에 수정하면서 일관성을 유지하는 것이었다. Claude Code의 몇 가지 기능이 특히 유용했다.

### CLAUDE.md로 프로젝트 컨텍스트 설정

```markdown
# jidonglab.com - Personal Portfolio & Tech Blog

## Architecture
- Astro static site generator
- Multi-language (en/ko) with i18n
- Cloudflare Pages deployment
- Content collections for blog/ai-news

## AI News System
- Daily automated generation via GitHub Actions
- Dual-language content (different tone for each)
- DEV.to cross-posting for Korean content only

## Code Patterns
- TypeScript strict mode
- Component-first architecture  
- API routes for dynamic features
- Shell scripts for automation

When modifying:
1. Keep language consistency in file structure
2. Test both en/ko routes
3. Verify Cloudflare Pages compatibility (no Node.js specific APIs in client code)
```

이 설정으로 AI가 프로젝트 전체 구조를 이해하고, 파일을 수정할 때 다른 부분에 미칠 영향을 고려한다.

### Slash Commands 활용

`/commit` 명령어가 특히 유용했다. 여러 파일을 수정한 후:

```
/commit "feat: AI 뉴스 CLI 생성 스크립트 + 2026-03-14 뉴스 4건

- scripts/generate-ai-news.sh: 영어/한국어 이중 생성 로직 추가
- src/content/ai-news/: 4개 뉴스 파일 생성 (en)
- .github/workflows/: DEV.to 발행은 한국어만으로 제한"
```

AI가 변경사항을 분석해서 적절한 커밋 메시지를 제안한다. 단순히 파일 목록만 나열하는 게 아니라 의도를 파악해서 grouping한다.

### MCP 서버와 연동한 파일 시스템 작업

Claude의 MCP (Model Context Protocol)를 통해 파일 시스템에 직접 접근할 수 있다. 특히 반복적인 콘텐츠 생성 작업에서 효과적이다:

```javascript
// src/pages/api/generate-ai-news.ts에서
const newsItems = await generateNewsContent(sources);

// 각 뉴스 아이템을 별도 파일로 생성
for (const item of newsItems) {
  const filename = `src/content/ai-news/${item.date}-${item.slug}.md`;
  await writeFile(filename, formatMarkdown(item));
}
```

AI가 파일 경로 패턴을 학습하고, 새로운 콘텐츠를 일관된 구조로 생성한다.

## 다국어 사이트에서 상태 관리 — 언어 전환의 함정

이번 작업에서 가장 골치 아팠던 건 언어 전환이었다. 사용자가 영어에서 한국어로 전환할 때 글 목록이 사라지는 버그가 있었다.

### 문제: 클라이언트 상태와 서버 렌더링 불일치

Astro는 기본적으로 static site인데, 동적 언어 전환을 구현하려면 클라이언트 상태 관리가 필요하다. 하지만 이때 hydration mismatch가 발생할 수 있다.

AI에게 이 문제를 해결하라고 할 때 핵심은 **제약 조건을 명확히 주는 것**이다:

> "언어 전환 기능을 구현해줘. 제약사항: 1) Astro static build 호환 2) SEO 유지 (각 언어별 별도 URL) 3) 클라이언트에서 즉시 전환 가능 4) 새로고침해도 선택한 언어 유지. 현재 구조를 최대한 보존하면서 해결해."

이렇게 하면 안 된다:
> "언어 전환 버그 고쳐줘"

### 해결책: API 라우트와 로컬 스토리지 조합

```typescript
// src/pages/api/locale.ts
export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale');
  
  return new Response(JSON.stringify({ locale }), {
    headers: { 'content-type': 'application/json' }
  });
};
```

```javascript
// 클라이언트 사이드 언어 전환 로직
function switchLanguage(newLocale) {
  localStorage.setItem('preferred-locale', newLocale);
  window.location.href = `/${newLocale}${currentPath}`;
}
```

AI가 제안한 이 패턴의 장점은 SEO에 영향을 주지 않으면서도 사용자 선택을 기억한다는 것이다.

## Cloudflare Pages 배포 최적화 — 플랫폼별 제약사항 대응

로컬에서는 잘 돌아가던 코드가 Cloudflare Pages에서 빌드 실패하는 경우가 많았다. 특히 Node.js 전용 API를 사용할 때 문제가 된다.

### 빌드 실패 패턴 분석

```javascript
// 이렇게 하면 Cloudflare에서 실패한다
import fs from 'node:fs';

// API 라우트에서 파일 시스템 접근
const content = fs.readFileSync('./content/news.json');
```

AI에게 플랫폼 호환성 문제를 해결하라고 할 때는 **명시적으로 환경을 알려줘야** 한다:

> "Cloudflare Pages에서 빌드되는 Astro 프로젝트다. Node.js 전용 API (fs, path 등) 사용 불가. 대신 사용할 수 있는 것: Web APIs, Astro의 import.meta.glob(), Vite의 virtual modules. 현재 파일 시스템 접근 코드를 Cloudflare 호환으로 리팩토링해줘."

### 해결책: import.meta.glob() 활용

```javascript
// Cloudflare 호환 버전
const newsFiles = import.meta.glob('./content/ai-news/*.md');
const newsContent = await Promise.all(
  Object.entries(newsFiles).map(async ([path, loader]) => {
    const module = await loader();
    return { path, content: module.default };
  })
);
```

이 패턴은 빌드 타임에 모든 파일을 static import로 변환해서 런타임에 파일 시스템 접근이 필요 없다.

## 더 나은 방법은 없을까

이번 구현에서 아쉬웠던 부분과 개선 가능한 부분들이다.

### 1. RSS 파싱보다는 뉴스 API 활용

현재는 RSS 피드를 파싱해서 뉴스를 가져오는데, 이보다는 News API나 Google News API를 쓰는 게 더 안정적이다. RSS는 구조가 제각각이라 파싱 에러가 자주 난다.

```javascript
// 현재 방식 (불안정)
const rssResponse = await fetch('https://feeds.feedburner.com/venturebeat/SZYF');
const xmlData = await rssResponse.text();

// 더 나은 방식
const newsResponse = await fetch('https://newsapi.org/v2/everything?q=artificial+intelligence');
const { articles } = await newsResponse.json();
```

### 2. Anthropic의 새로운 Computer Use API 활용

2024년 10월에 공개된 Computer Use API를 쓰면 브라우저 자동화로 더 풍부한 콘텐츠를 수집할 수 있다. 단순히 RSS만 보는 게 아니라 실제 기사 페이지의 이미지, 차트, 코드 예제까지 가져올 수 있다.

```python
import anthropic

client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    tools=[{"type": "computer_20241022", "name": "computer"}],
    messages=[{
        "role": "user", 
        "content": "브라우저로 TechCrunch AI 섹션에 접속해서 오늘 올라온 기사 중 개발자에게 중요한 3개를 스크린샷과 함께 정리해줘"
    }]
)
```

### 3. Astro의 새로운 Content Collections v2 활용

현재는 Content Collections v1을 쓰고 있는데, v2에서는 더 강력한 타입 검증과 관계형 데이터 처리가 가능하다.

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { defineCollection, reference, z } from 'astro:content';

const aiNews = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    publishedAt: z.date(),
    tags: z.array(z.string()),
    relatedPosts: z.array(reference('blog')).optional(),
  }),
});
```

이렇게 하면 AI 뉴스와 블로그 포스트 간의 관계를 자동으로 연결하고, 관련 글 추천도 구현할 수 있다.

### 4. GitHub Actions 대신 Cloudflare Workers Cron 사용

현재는 GitHub Actions으로 스케줄링하는데, Cloudflare Workers의 Cron Triggers를 쓰면 더 빠르고 안정적이다. 특히 Cloudflare Pages와 같은 환경이라 배포 latency도 줄어든다.

```javascript
// wrangler.toml
[triggers]
crons = ["0 9 * * *"]  # 매일 오전 9시

// worker.js
export default {
  async scheduled(event, env, ctx) {
    const newsItems = await generateAINews();
    await deployToPages(newsItems);
  }
};
```

## 정리

- AI에게 콘텐츠 생성을 맡길 때는 작업을 명확히 나누고 각 단계별로 다른 프롬프팅 전략을 써야 한다
- 다국어 콘텐츠는 단순 번역이 아니라 타겟 독자에 맞는 톤과 관점으로 생성해야 효과적이다
- Claude Code의 CLAUDE.md와 slash commands를 활용하면 멀티파일 작업에서 컨텍스트를 잃지 않는다
- 플랫폼별 제약사항 (Cloudflare Pages, Vercel 등)을 AI에게 명시적으로 알려줘야 호환 가능한 코드를 생성한다

<details>
<summary>이번 작업의 커밋 로그</summary>

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