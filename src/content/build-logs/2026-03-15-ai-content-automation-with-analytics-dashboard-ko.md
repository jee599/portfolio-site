---
title: "AI로 콘텐츠 자동화 + 배포 플랫폼 분석 대시보드 만들기"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [feat, fix, chore, astro, typescript]
---

개인 포트폴리오 사이트에 AI 뉴스 자동 생성 시스템과 플랫폼별 성과 분석 대시보드를 구축했다. AI에게 콘텐츠 생성을 완전히 맡기면서도 품질을 유지하는 프롬프팅 전략과, 복잡한 멀티플랫폼 워크플로우를 단계별로 구조화하는 방법을 다룬다.

## 배경: 무엇을 만들고 있는가

jidonglab.com은 AI/개발 관련 콘텐츠를 다국어로 발행하는 포트폴리오 사이트다. 현재 블로그 포스트를 DEV.to, Hashnode, Blogger 등 여러 플랫폼에 수동으로 배포하고 있었고, AI 뉴스 섹션을 새로 추가하려던 상황이었다.

이번 작업의 목표는 두 가지였다:
1. AI가 매일 뉴스를 수집→분석→글 작성→배포까지 완전 자동화
2. 각 플랫폼의 성과 데이터를 한눈에 보는 관리자 대시보드 구축

## AI 뉴스 자동 생성: 제약 조건이 품질을 결정한다

AI에게 "뉴스 써줘"라고 하면 뻔한 요약글만 나온다. 핵심은 **명확한 제약 조건**과 **출력 형식 고정**이다.

### 프롬프팅 전략

```bash
# scripts/generate-ai-news.sh 핵심 프롬프트
generate_news() {
  claude_prompt="
AI 업계 주요 뉴스 3-4개를 선정해서 각각 독립된 블로그 포스트로 작성해줘.

제약 조건:
- 2026-03-14 기준 최신 뉴스만
- 기술적 깊이 있는 분석 포함 (단순 요약 금지)
- 개발자 관점에서 왜 중요한지 설명
- 각 글은 800-1200자 분량
- 제목은 클릭베이트 없이 팩트 중심
- frontmatter 형식: title, description, pubDate, category, lang

출력 형식:
파일명: YYYY-MM-DD-slug.md
각 파일은 완전히 독립적인 마크다운 문서
"
}
```

이렇게 쓰면 안 된다:
> "AI 뉴스 몇 개 써줘"

이유: 분량, 톤, 형식이 매번 달라진다. AI는 **구체적 제약**을 줄수록 일관된 품질을 낸다.

### 이중 언어 생성 전략

```bash
# 영어 버전 (jidonglab.com용)
generate_english_posts() {
  claude --skill blog-writing "
Generate 4 AI news posts in English for tech audience.
Focus on: technical implications, developer impact, business strategy.
Tone: professional but accessible, no hype.
Length: 400-600 words each.
"
}

# 한국어 버전 (DEV.to용)
generate_korean_posts() {
  claude --skill blog-writing "
같은 뉴스를 한국어로 재작성. 번역이 아니라 한국 개발자 맥락에 맞게 새로 작성.
국내 AI 생태계와 연관지어 설명.
존댓말 사용, 기술 용어는 영어 병기.
"
}
```

**핵심**: 번역이 아니라 **타겟 독자에 맞는 재작성**이다. 같은 뉴스라도 미국 독자와 한국 독자가 관심 있어하는 포인트가 다르다.

### Claude Skills 활용

```markdown
# .claude/skills/blog-writing.md
## Role
기술 블로그 전문 에디터

## Guidelines
- 개발자가 읽기 쉬운 구조 (문제→해결→임팩트)
- 코드나 API 언급 시 구체적 예시 포함
- 트렌드 분석보다는 실무 적용 가능성 중심
- 제목에 숫자나 감탄사 없이 팩트만

## Output Format
항상 frontmatter + 마크다운 본문
카테고리는 ai-news 고정
slug는 날짜-키워드 형식
```

Skills를 만들어두면 매번 긴 프롬프트를 반복하지 않아도 된다. `claude --skill blog-writing` 한 줄로 컨텍스트가 로드된다.

## 멀티플랫폼 배포 워크플로우 구조화

AI 생성 콘텐츠를 여러 플랫폼에 배포할 때 가장 큰 문제는 **각 플랫폼의 요구사항이 다르다**는 것이다.

### GitHub Actions 최적화 전략

```yaml
# .github/workflows/publish-to-devto.yml (기존)
- name: Publish all markdown files
  run: |
    for file in src/content/**/*.md; do
      # 모든 파일을 DEV.to에 발행
    done
```

이렇게 하면 블로그 포스트까지 ai-news 태그로 발행된다. 

```yaml
# 개선된 버전
- name: Publish AI news only
  run: |
    for file in src/content/ai-news/*.md; do
      if grep -q "lang: ko" "$file"; then
        # 한국어 AI 뉴스만 DEV.to 발행
      fi
    done
```

**구조화 원칙**: 
1. 각 플랫폼마다 별도 워크플로우
2. 언어별 필터링 로직 분리
3. 실패해도 다른 플랫폼 배포는 계속 진행

### 플랫폼별 콘텐츠 최적화

```typescript
// src/pages/api/platform-stats.ts
const PLATFORM_CONFIGS = {
  'devto': {
    apiEndpoint: 'https://dev.to/api/articles',
    contentType: 'korean',
    categories: ['ai-news'],
    maxLength: 1200
  },
  'jidonglab': {
    contentType: 'english', 
    categories: ['ai-news', 'blog-posts'],
    maxLength: 2000
  },
  'hashnode': {
    contentType: 'both',
    requiresCanonicalUrl: true
  }
}
```

AI에게 각 플랫폼 특성을 알려주면 최적화된 콘텐츠를 생성할 수 있다:

> "DEV.to용 한국어 포스트 작성. 1200자 이내, 코드 예시 포함, 해시태그 5개 추천해줘."

## 실시간 성과 분석 대시보드 설계

콘텐츠를 자동화했으면 성과도 자동으로 추적해야 한다. 각 플랫폼의 API를 통합하는 대시보드를 구축했다.

### API 통합 전략

```typescript
// src/pages/api/platform-stats.ts
async function fetchPlatformStats() {
  const platforms = ['devto', 'hashnode', 'blogger'];
  
  return await Promise.allSettled(
    platforms.map(async (platform) => {
      const stats = await fetchStatsForPlatform(platform);
      return { platform, ...stats };
    })
  );
}
```

`Promise.allSettled` 사용 이유: 한 플랫폼 API가 실패해도 나머지는 정상 표시된다.

### 조회수 히트맵 구현

```astro
<!-- src/pages/admin.astro -->
<div class="heatmap-container">
  {posts.map(post => (
    <div 
      class="heatmap-cell"
      data-views={post.views}
      style={`opacity: ${Math.min(post.views / 1000, 1)}`}
    >
      {post.title}
    </div>
  ))}
</div>

<style>
  .heatmap-cell {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    /* style을 is:inline으로 변경해서 Astro 빌드 오류 해결 */
  }
</style>
```

**함정**: Astro에서 동적 스타일을 `style={}` 속성으로 넣으면 빌드 시 오류가 날 수 있다. `is:inline` directive를 사용하거나 CSS 변수를 활용한다.

### 콘텐츠 성과 순위 자동화

```javascript
// 전체 콘텐츠를 조회수순으로 정렬
const sortedContent = allContent
  .map(item => ({
    ...item,
    totalViews: platforms.reduce((sum, p) => sum + (item.views[p] || 0), 0)
  }))
  .sort((a, b) => b.totalViews - a.totalViews);
```

AI에게 이런 데이터 가공 로직을 시킬 때는 **예시 데이터**를 함께 제공한다:

> "이 배열 구조에서 조회수 합계를 계산해서 내림차순 정렬해줘.
> 
> 예시 입력:
> ```json
> [{"title": "AI 뉴스", "views": {"devto": 150, "jidonglab": 89}}]
> ```
> 
> 예상 출력: totalViews 필드 추가된 정렬 배열"

## Cloudflare Pages 배포 최적화

로컬에서는 잘 되던 빌드가 Cloudflare Pages에서 실패하는 경우가 많다. 주요 원인들과 해결법:

### Node.js Runtime 이슈

```json
// package.json (문제)
{
  "scripts": {
    "build": "astro build && vercel-fix-runtime"
  }
}
```

Cloudflare Pages는 Vercel runtime fix가 필요 없다. 오히려 빌드 실패 원인이 된다.

```json
// 수정된 버전
{
  "scripts": {
    "build": "astro build"
  }
}
```

### 서버리스 함수에서 Node.js API 사용

```typescript
// 문제: Cloudflare Workers에서 node:fs 사용 불가
import { readFileSync } from 'node:fs';

export async function GET() {
  const data = readFileSync('./data.json'); // 런타임 에러
}
```

```typescript  
// 해결: 정적 import 또는 fetch 사용
import data from './data.json';

export async function GET() {
  return new Response(JSON.stringify(data));
}
```

### Sitemap 생성 실패

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://jidonglab.com',
  integrations: [
    // sitemap(), // Cloudflare 빌드 실패 원인
  ]
});
```

Astro sitemap 플러그인이 특정 조건에서 Cloudflare Pages 빌드를 실패시킨다. 당장 필요하지 않다면 비활성화하고, 나중에 커스텀 sitemap API로 대체한다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식들보다 더 효율적인 대안들을 살펴본다.

### AI 뉴스 생성 개선안

현재 방식: bash script + Claude CLI
더 나은 방법: **MCP Server** 활용

```typescript
// mcp-server-news/src/index.ts
class NewsGeneratorServer {
  async generateNews(date: string, lang: string) {
    const sources = await this.fetchNewsSources();
    const analyzed = await this.analyzeWithClaude(sources);
    return this.formatForPlatform(analyzed, lang);
  }
}
```

MCP를 쓰면:
- 뉴스 소스 API 연동이 더 안정적
- 생성된 콘텐츠 품질 검증 로직 추가 가능  
- 다른 프로젝트에서도 재사용 가능

### 플랫폼 통계 수집 개선안

현재: 각 플랫폼 API를 직접 호출
더 나은 방법: **Zapier/Make.com 웹훅** 또는 **Supabase Edge Functions**

```sql
-- Supabase에서 통계 데이터 중앙 관리
CREATE TABLE platform_stats (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50),
  content_id VARCHAR(255),  
  views INTEGER,
  likes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

이점:
- API 레이트 리밋 걱정 없음
- 히스토리 데이터 축적 가능
- 실시간 알림 설정 가능 (조회수 급증 시)

### GitHub Actions 최적화

현재: 플랫폼별 별도 워크플로우
더 나은 방법: **Matrix Strategy** 활용

```yaml
strategy:
  matrix:
    platform: [devto, hashnode, blogger]
    lang: [ko, en]
    exclude:
      - platform: devto
        lang: en  # DEV.to는 한국어만

steps:
  - name: Deploy to ${{ matrix.platform }}
    run: ./deploy.sh ${{ matrix.platform }} ${{ matrix.lang }}
```

코드 중복이 줄어들고, 새 플랫폼 추가가 쉬워진다.

### Astro Island Architecture 활용

현재: 전체 admin 페이지가 클라이언트 렌더링
더 나은 방법: **선택적 하이드레이션**

```astro
<!-- 정적 부분은 서버 렌더링 -->
<section>
  <h2>플랫폼 링크</h2>
  <ul>
    {platforms.map(p => <li><a href={p.url}>{p.name}</a></li>)}
  </ul>
</section>

<!-- 동적 부분만 클라이언트 렌더링 -->  
<StatsChart client:load data={stats} />
<Heatmap client:visible data={heatmapData} />
```

초기 로딩 속도가 빨라지고 SEO도 개선된다.

## 정리

- **AI 콘텐츠 자동화**에는 명확한 제약 조건과 출력 형식 고정이 핵심이다
- **멀티플랫폼 배포**는 각 플랫폼별 특성을 고려한 별도 최적화가 필요하다  
- **실시간 대시보드**는 Promise.allSettled로 안정성을 확보하고 시각화에 집중한다
- **Cloudflare Pages 배포** 시 Node.js API 사용과 runtime 차이점을 미리 체크한다

<details>
<summary>이번 작업의 커밋 로그</summary>

68eabc0 — feat: Overview에 플랫폼 조회수 카드 추가
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