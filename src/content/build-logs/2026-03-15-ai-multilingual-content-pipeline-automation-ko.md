---
title: "AI로 다국어 콘텐츠 파이프라인 만들기 — 한 번의 스크립트로 영어+한국어 뉴스 생성"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [feat, chore, fix, astro, typescript]
---

포트폴리오 사이트에 AI 뉴스 자동 생성 시스템을 구축했다. 하나의 스크립트로 영어와 한국어 콘텐츠를 동시에 만들고, Cloudflare Pages와 DEV.to에 배포하는 전체 파이프라인을 다룬다. 특히 다국어 콘텐츠를 일관성 있게 생성하는 프롬프팅 전략과 배포 자동화 패턴을 중점적으로 설명한다.

## 배경: 무엇을 만들고 있는가

`jidonglab.com`은 AI 관련 기술을 실험하고 공유하는 개인 포트폴리오 사이트다. Astro로 구축되어 있고, Cloudflare Pages로 호스팅한다. 

이번에 추가한 기능은 AI 뉴스 자동 생성 시스템이다. 매일 AI 업계 동향을 수집해서 영어와 한국어로 각각 콘텐츠를 만들고, 영어 버전은 자체 사이트에, 한국어 버전은 DEV.to에 발행하는 것이 목표였다.

기존에는 수동으로 뉴스를 작성했는데, 일관성도 떨어지고 시간도 많이 걸렸다. 그래서 Claude를 활용한 완전 자동화 파이프라인을 구축했다.

## Claude에게 일관성 있는 뉴스 콘텐츠 만들게 하는 법

AI로 뉴스 콘텐츠를 생성할 때 가장 큰 문제는 일관성이다. 매번 다른 톤, 다른 구조, 다른 길이로 나오면 브랜드 정체성이 흔들린다.

### 효과적인 뉴스 생성 프롬프트 패턴

기존에는 이렇게 대충 시켰다:

> "AI 뉴스 4개 만들어줘"

결과는 예상할 수 있다. 길이도 제각각이고, 어떤 건 너무 기술적이고, 어떤 건 너무 가볍다.

이제는 구조화된 프롬프트를 쓴다:

> "2026-03-14 AI 업계 주요 뉴스 4건을 분석해서 각각 독립적인 블로그 포스트로 작성해줘.
> 
> **형식 요구사항:**
> - 제목: 40자 이내, 구체적인 숫자나 고유명사 포함
> - 서론: 2-3문장으로 핵심 요약
> - 본문: 3-4개 단락, 각 단락 3-5문장
> - 결론: 업계 영향이나 향후 전망 1-2문장
> - 총 길이: 500-800자
> 
> **톤앤매너:**
> - 기술 블로거 관점
> - 팩트 중심, 추측성 표현 금지
> - 전문 용어는 한 번 설명 후 사용
> 
> **콘텐츠 기준:**
> - 출처 명시 필수
> - 비즈니스 임팩트 중심으로 서술
> - 개발자 독자층 고려"

이렇게 하면 매번 비슷한 품질과 구조로 나온다. 중요한 건 **구체적인 제약 조건**이다. "좋게 써줘"가 아니라 "40자 이내 제목", "500-800자 본문"처럼 측정 가능한 기준을 준다.

### blog-writing 스킬 활용

Claude Code의 skills 기능을 활용했다. `scripts/generate-ai-news.sh`에서 이렇게 호출한다:

```bash
# English content generation
curl -X POST "$CLAUDE_API/generate" \
  -H "Authorization: Bearer $CLAUDE_TOKEN" \
  -d "{
    \"skill\": \"blog-writing\",
    \"language\": \"en\",
    \"topic\": \"$news_topic\",
    \"style\": \"tech-analysis\"
  }"
```

blog-writing 스킬에는 미리 정의된 구조와 톤이 들어있다. 매번 긴 프롬프트를 반복하지 않고도 일관된 결과를 얻는다.

스킬 정의는 `CLAUDE.md`에서 관리한다:

```markdown
# Blog Writing Skill

## Structure
1. Hook (1-2 sentences)
2. Context (2-3 sentences) 
3. Main content (3-4 paragraphs)
4. Key takeaway (1-2 sentences)

## Style Guidelines
- Active voice preferred
- Technical accuracy over accessibility
- Include specific numbers/dates
- Cite sources inline
```

## 다국어 콘텐츠를 위한 언어별 프롬프팅 전략

단순히 번역하면 안 된다. 각 언어권의 독자가 다르고, 플랫폼 특성도 다르다.

### 영어 vs 한국어 콘텐츠 차별화

영어 콘텐츠는 글로벌 독자를 대상으로 한다. 업계 전반적인 트렌드와 비즈니스 임팩트에 집중한다:

> "Write for international audience. Focus on:
> - Global market implications  
> - Cross-industry applications
> - Regulatory/policy angles
> - Startup/enterprise adoption patterns
> 
> Avoid: Korea-specific references, currency in KRW"

한국어 콘텐츠는 DEV.to의 한국 개발자 커뮤니티를 겨냥한다:

> "한국 개발자 커뮤니티를 위한 글쓰기:
> - 국내 적용 가능성 중심
> - 개발 실무에 미치는 영향
> - 학습/경력 관점에서의 시사점  
> - 구체적인 활용 사례
> 
> 피할 것: 서구 중심적 관점, 국내 상황 무시한 일반론"

### 플랫폼별 최적화

jidonglab.com과 DEV.to는 독자층과 콘텐츠 소비 패턴이 다르다.

jidonglab.com용 프롬프트:

> "Portfolio site audience - tech professionals and potential clients:
> - Demonstrate expertise and analytical thinking
> - Include market data and strategic insights  
> - Professional tone, avoid overly casual expressions
> - SEO-friendly structure with clear headings"

DEV.to용 프롬프트:

> "DEV.to 커뮤니티 특성에 맞춰:
> - 개발자 친화적 어투 (반말 OK)
> - 실무 적용 가능한 인사이트 중심
> - 토론을 유도하는 질문 포함
> - 코드나 기술 스택 언급 시 구체적으로"

## 배포 자동화와 환경별 설정 관리

콘텐츠 생성만으로는 부족하다. 각 플랫폼에 맞는 형식으로 변환하고 자동 배포까지 해야 한다.

### 스크립트 구조화 전략

`generate-ai-news.sh`는 단일 책임 원칙을 지킨다:

```bash
# 1. 뉴스 소스 수집
fetch_news_sources() {
    curl -s "$RSS_FEED_URL" | parse_xml
}

# 2. 언어별 콘텐츠 생성  
generate_english_content() {
    claude_api_call "skill:blog-writing" "lang:en" "$topic"
}

generate_korean_content() {
    claude_api_call "skill:blog-writing" "lang:ko" "$topic" 
}

# 3. 플랫폼별 형식 변환
format_for_astro() {
    add_frontmatter "$content" "ai-news"
}

format_for_devto() {
    add_devto_tags "$content" "ai,korean"
}
```

각 함수는 독립적으로 테스트 가능하다. AI 호출 부분만 모킹하면 전체 파이프라인을 검증할 수 있다.

### GitHub Actions 워크플로우 최적화

`.github/workflows/publish-to-devto.yml`에서 조건부 배포를 설정했다:

```yaml
name: Publish to DEV.to
on:
  push:
    paths: ['src/content/ai-news/*.md']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
    - name: Check if Korean content
      id: check-lang  
      run: |
        if grep -q "lang: ko" ${{ github.event.head_commit.modified }}; then
          echo "publish=true" >> $GITHUB_OUTPUT
        fi
    
    - name: Publish to DEV.to
      if: steps.check-lang.outputs.publish == 'true'
      run: |
        curl -X POST "https://dev.to/api/articles" \
          -H "api-key: ${{ secrets.DEVTO_API_KEY }}"
```

영어 콘텐츠가 push되면 DEV.to 배포를 건너뛴다. 불필요한 API 호출을 방지하고 배포 실수를 줄인다.

### 에러 처리와 롤백 전략

AI API 호출은 실패할 수 있다. 네트워크 이슈, rate limit, 모델 오류 등이다.

```bash
generate_content_with_retry() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if result=$(claude_api_call "$@"); then
            echo "$result"
            return 0
        fi
        
        echo "Attempt $attempt failed, retrying..." >&2
        sleep $((attempt * 5))  # exponential backoff
        ((attempt++))
    done
    
    echo "All attempts failed, using fallback content" >&2
    return 1
}
```

fallback content는 미리 준비된 템플릿이다. AI가 완전히 실패해도 빈 페이지는 나오지 않는다.

## Cloudflare 통합과 지역별 콘텐츠 최적화

사용자 위치에 따라 자동으로 언어를 전환하는 기능을 추가했다.

### 리전 기반 언어 감지

`src/pages/api/locale.ts`에서 Cloudflare의 `CF-IPCountry` 헤더를 활용한다:

```typescript
export async function GET({ request }) {
  const country = request.headers.get('CF-IPCountry');
  const acceptLanguage = request.headers.get('Accept-Language');
  
  // 한국/일본은 한국어, 나머지는 영어
  const locale = ['KR', 'JP'].includes(country) ? 'ko' : 'en';
  
  return new Response(JSON.stringify({ locale, country }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

이걸 프론트엔드에서 호출해서 동적으로 콘텐츠를 필터링한다:

```javascript
// Base.astro
const { locale } = await fetch('/api/locale').then(r => r.json());
const newsItems = locale === 'ko' 
  ? await getKoreanNews() 
  : await getEnglishNews();
```

### Cloudflare Web Analytics 연동

단순한 조회수만 보는 게 아니라, 언어별 사용자 행동을 분석한다:

```html
<!-- Base.astro -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "your-token"}'>
</script>

<script>
// 사용자 언어 선호도 추적
window.addEventListener('load', () => {
  if (typeof cloudflareInsights !== 'undefined') {
    cloudflareInsights.track('content-language', {
      detected: locale,
      preferred: navigator.language,
      content_type: 'ai-news'
    });
  }
});
</script>
```

이 데이터로 어떤 언어의 콘텐츠가 더 인기 있는지, 지역별 선호도가 어떻게 다른지 분석한다.

## 더 나은 방법은 없을까

현재 시스템도 잘 작동하지만, 더 효율적인 방법들이 있다.

### Anthropic의 새로운 Batch API 활용

여러 언어 콘텐츠를 순차적으로 생성하는 대신, Batch API로 병렬 처리할 수 있다:

```javascript
const batchRequest = {
  requests: [
    { custom_id: "en-news-1", method: "POST", body: { messages: [englishPrompt] }},
    { custom_id: "ko-news-1", method: "POST", body: { messages: [koreanPrompt] }},
    { custom_id: "en-news-2", method: "POST", body: { messages: [englishPrompt] }},
    { custom_id: "ko-news-2", method: "POST", body: { messages: [koreanPrompt] }}
  ]
};
```

비용은 50% 절약되고, 전체 처리 시간도 단축된다. 다만 결과를 받기까지 최대 24시간 걸릴 수 있어서 실시간성이 중요한 뉴스에는 적합하지 않다.

### MCP Server for Content Management

현재는 파일 시스템에 직접 쓰는데, MCP(Model Context Protocol) 서버를 두면 더 체계적으로 관리할 수 있다:

```typescript
// content-management-mcp-server
const server = new MCPServer({
  name: "content-manager",
  version: "1.0.0"
});

server.tool("create_news_post", async (args) => {
  const { title, content, language, platform } = args;
  
  // 중복 검사
  const exists = await checkDuplicate(title, language);
  if (exists) throw new Error("Similar content already exists");
  
  // 플랫폼별 최적화
  const optimized = await optimizeForPlatform(content, platform);
  
  // 메타데이터 자동 생성
  const metadata = await generateMetadata(optimized);
  
  return await saveContent(optimized, metadata);
});
```

이렇게 하면 Claude가 파일 시스템을 직접 건드리지 않고도 콘텐츠를 체계적으로 관리할 수 있다.

### Edge-side Includes로 성능 최적화

현재는 빌드 타임에 모든 언어 콘텐츠를 생성한다. 하지만 사용자 대부분은 한 언어만 본다. Cloudflare의 ESI(Edge-side Includes)를 쓰면:

```html
<!-- Base.astro -->
<esi:choose>
  <esi:when test="$(GEO{'country_code'}) == 'KR'">
    <esi:include src="/fragments/ko/ai-news"/>
  </esi:when>
  <esi:otherwise>
    <esi:include src="/fragments/en/ai-news"/>
  </esi:otherwise>
</esi:choose>
```

필요한 언어만 로드해서 초기 페이지 크기를 줄일 수 있다. 하지만 ESI는 Cloudflare Enterprise 플랜에서만 지원한다.

### Webhook 기반 실시간 배포

현재는 GitHub push 기반이라 배포까지 몇 분 걸린다. 중요한 뉴스는 더 빠르게 배포하고 싶다면:

```javascript
// Cloudflare Workers
addEventListener('fetch', event => {
  if (event.request.url.includes('/webhook/urgent-news')) {
    event.respondWith(handleUrgentNews(event.request));
  }
});

async function handleUrgentNews(request) {
  const newsData = await request.json();
  
  // AI로 즉시 콘텐츠 생성
  const content = await generateUrgentContent(newsData);
  
  // KV storage에 임시 저장
  await URGENT_NEWS.put(`news-${Date.now()}`, content);
  
  // 다음 정기 빌드 때 정식 콘텐츠로 이전
  scheduleContentMigration(content.id);
  
  return new Response('OK');
}
```

이렇게 하면 속보성 뉴스는 초단위로 배포하고, 일반 뉴스는 기존 파이프라인을 유지할 수 있다.

## 정리

AI 기반 다국어 콘텐츠 자동화에서 핵심은 구조화된 프롬프팅과 체계적인 에러 처리다. Claude에게 단순히 "번역해줘"가 아니라 언어별/플랫폼별 맥락을 명확히 주는 것이 중요하다. 배포 파이프라인은 각 단계별로 독립성을 유지해서 부분적 실패에도 전체 시스템이 멈추지 않게 설계했다. Cloudflare 생태계를 활용하면 글로벌 배포와 지역별 최적화를 동시에 해결할 수 있다. 앞으로는 Batch API와 MCP 서버 도입으로 비용 효율성과 콘텐츠 품질을 더 높일 계획이다.

<details>
<summary>이번 작업의 커밋 로그</summary>

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