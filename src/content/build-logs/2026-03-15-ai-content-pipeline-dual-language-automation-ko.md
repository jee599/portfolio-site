---
title: "AI로 뉴스 콘텐츠 자동 생성하는 파이프라인 — 이중 언어 배포까지"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [fix, feat, chore, astro, typescript]
---

포트폴리오 사이트에 AI 뉴스 자동 생성 시스템을 구축했다. 단순한 콘텐츠 생성이 아니라 영어/한국어 이중 배포, Cloudflare 환경 대응, 워크플로우 최적화까지 다뤘다. AI 에이전트로 콘텐츠 파이프라인을 만들 때 맞닥뜨리는 실제 문제들과 해결법을 정리한다.

## 배경: 무엇을 만들고 있는가

`jidonglab.com`은 기술 블로그와 AI 뉴스를 자동 생성하는 포트폴리오 사이트다. Astro 기반으로 구축했고, Cloudflare Pages에서 호스팅한다. 

이번 작업의 목표는 세 가지였다:
1. AI 뉴스 콘텐츠를 CLI로 자동 생성하는 시스템 구축
2. 영어는 메인 사이트에, 한국어는 DEV.to에 자동 배포하는 이중 배포 파이프라인
3. Cloudflare 환경에서 발생하는 빌드 에러들 해결

## AI 뉴스 생성: 구조화된 프롬프팅이 핵심이다

### 나쁜 프롬프트 vs 좋은 프롬프트

처음에는 단순하게 접근했다:

> "AI 뉴스 4개 써줘"

결과는 뻔했다. 제목이 중복되고, 톤이 일관되지 않았으며, 메타데이터 형식도 제각각이었다.

효과적인 프롬프트는 다음 구조를 따른다:

> 오늘 날짜(2026-03-14) AI 뉴스 4개를 생성한다. 각 뉴스는:
> 
> **제약 조건:**
> - 제목: 60자 이내, 클릭베이트 금지
> - 본문: 300-500단어, 팩트 중심
> - 태그: ai-news, industry, tech 중 2-3개 조합
> - slug: yyyy-mm-dd-키워드-키워드 형식
> 
> **톤앤매너:**
> - 중립적이고 분석적인 톤
> - 과장된 표현 금지
> - 데이터와 수치 중심으로 서술
> 
> **출력 형식:**
> - 마크다운 frontmatter 포함
> - 파일명과 내용을 명확히 구분
> - 각 뉴스 사이에 `---` 구분자 삽입

차이점이 보이나? 좋은 프롬프트는 **제약 조건**, **톤앤매너**, **출력 형식**을 명시적으로 정의한다.

### 스크립트 기반 자동화 패턴

AI 에이전트에게 콘텐츠 생성을 시킬 때 가장 중요한 건 **일관성**이다. 매번 다른 프롬프트를 쓰면 품질이 들쑥날쑥해진다.

`scripts/generate-ai-news.sh`에서 사용하는 패턴:

```bash
# 1단계: 구조화된 프롬프트 템플릿
PROMPT_TEMPLATE="Generate AI news for ${DATE} with following structure:
- 4 articles total
- Each article: title (max 60 chars), content (300-500 words), tags
- Output format: markdown with frontmatter
- Tone: neutral, analytical, fact-based"

# 2단계: 언어별 변형 생성
generate_english_content() {
  echo "$PROMPT_TEMPLATE. Language: English, audience: global tech professionals"
}

generate_korean_content() {
  echo "$PROMPT_TEMPLATE. Language: Korean, audience: Korean developers"
}
```

핵심은 **베이스 템플릿 + 언어별 변형**이다. 구조는 동일하게 유지하면서 언어와 타겟 오디언스만 바꾼다.

### Claude Code의 blog-writing 스킬 활용

Claude Code에는 `blog-writing` 스킬이 있다. 이걸 제대로 활용하려면 `CLAUDE.md`에 프로젝트 컨텍스트를 명확히 정의해야 한다:

```markdown
# AI 뉴스 생성 가이드라인

## 콘텐츠 구조
- 제목: SEO 최적화, 60자 이내
- 본문: 도입-전개-결론 구조
- 태그: ai-news 필수 + 주제별 태그 2개

## 금지사항
- 클릭베이트성 제목
- 추측성 내용
- 감정적 표현
```

`CLAUDE.md`는 단순한 설명서가 아니다. AI 에이전트의 **행동 규칙서**다. 여기에 명시된 내용은 모든 대화에서 일관되게 적용된다.

스킬을 활용할 때는 slash command를 쓴다:

```
/blog-writing AI 뉴스 4개 생성 (2026-03-14)
```

이렇게 하면 일반 대화보다 훨씬 구조화된 결과물이 나온다.

## Cloudflare 환경 대응: 제약을 미리 파악하고 우회하라

### Node.js API 제한 문제

Cloudflare Pages에서는 `node:fs` 같은 Node.js 내장 모듈을 쓸 수 없다. 처음에는 이걸 모르고 작성했다가 빌드 에러가 발생했다.

문제가 된 코드:

```javascript
import fs from 'node:fs';
import path from 'node:path';

export async function POST({ request }) {
  // 파일 시스템 조작
  fs.writeFileSync(path.join(process.cwd(), 'content', filename), content);
}
```

Cloudflare는 serverless 환경이라 파일 시스템에 직접 쓸 수 없다. 해결책은 두 가지다:

1. **API 역할 변경**: 파일 생성 대신 생성된 콘텐츠만 반환
2. **CLI 스크립트로 이동**: 실제 파일 생성은 로컬에서 처리

결국 API는 콘텐츠 생성만 담당하고, 파일 저장은 CLI 스크립트에서 처리하는 구조로 변경했다.

AI 에이전트에게 이런 리팩토링을 시킬 때 효과적인 프롬프트:

> `src/pages/api/generate-ai-news.ts`에서 `node:fs` 임포트를 제거하고, 파일 저장 로직을 빼라. API는 생성된 마크다운 콘텐츠만 JSON으로 반환해야 한다. Cloudflare Pages 환경 제약을 고려해서 리팩토링해줘.

제약 조건을 명시하는 게 중요하다. "리팩토링해줘"만 하면 AI는 왜 `node:fs`를 제거해야 하는지 모른다.

### 빌드 명령어 최적화

`package.json`에서 Vercel 관련 설정도 제거해야 했다:

```diff
{
  "scripts": {
-   "build": "npm run fix-runtime && astro build",
+   "build": "astro build",
-   "fix-runtime": "sed -i 's/node:path/path/g' node_modules/@astrojs/vercel/dist/serverless/adapter.js"
  }
}
```

`fix-runtime` 스크립트는 Vercel 전용이었는데, Cloudflare에서는 오히려 빌드를 망가뜨렸다.

## 이중 언어 배포 파이프라인: 하나의 소스, 두 개의 채널

### 콘텐츠 생성 전략

같은 뉴스를 영어와 한국어로 따로 쓰는 건 비효율적이다. 하지만 단순 번역으로는 각 언어권 독자의 니즈를 충족할 수 없다.

해결책은 **언어별 앵글 차별화**다:

```bash
# 영어: 글로벌 트렌드 중심
claude_prompt_en="Focus on global market impact and international implications"

# 한국어: 로컬 적용 가능성 중심  
claude_prompt_ko="한국 시장 영향과 국내 도입 가능성을 중심으로 작성"
```

같은 소재를 다루지만 **관점**을 바꾸는 것이다.

### GitHub Actions 워크플로우 최적화

처음에는 모든 블로그 포스트를 DEV.to에 발행했다. 하지만 AI 뉴스만 필요했기 때문에 워크플로우를 수정했다:

```yaml
# 기존: 모든 포스트 발행
- name: Filter and publish posts
  run: |
    for file in src/content/blog/*.md; do
      publish_to_devto "$file"
    done

# 개선: AI 뉴스만 선별 발행
- name: Filter and publish AI news only
  run: |
    for file in src/content/ai-news/*.md; do
      if grep -q "tags.*ai-news" "$file"; then
        publish_to_devto "$file"
      fi
    done
```

AI 에이전트에게 워크플로우 수정을 시킬 때는 **변경 이유**를 명확히 한다:

> `.github/workflows/publish-to-devto.yml`에서 `src/content/blog/` 대신 `src/content/ai-news/` 파일만 처리하도록 수정해줘. 블로그 포스트는 DEV.to에 발행하지 않고, AI 뉴스만 자동 발행해야 한다.

### 지역 기반 자동 언어 전환 구현

사용자 위치에 따라 자동으로 언어를 전환하는 기능을 추가했다. Cloudflare의 `CF-IPCountry` 헤더를 활용한다:

```typescript
// src/pages/api/locale.ts
export async function GET({ request }) {
  const country = request.headers.get('CF-IPCountry');
  const supportedKoreanCountries = ['KR', 'KP'];
  
  const locale = supportedKoreanCountries.includes(country) ? 'ko' : 'en';
  
  return new Response(JSON.stringify({ locale, country }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

이걸 프론트엔드에서 호출해서 언어를 자동 설정한다:

```astro
<!-- src/layouts/Base.astro -->
<script>
async function setAutoLocale() {
  try {
    const response = await fetch('/api/locale');
    const { locale } = await response.json();
    if (locale !== document.documentElement.lang) {
      // 언어 전환 로직
    }
  } catch (error) {
    // 기본값 유지
  }
}
</script>
```

AI에게 이런 기능을 요청할 때는 **제약 조건**을 명시한다:

> 사용자 지역 기반 자동 언어 전환 API를 만들어줘. Cloudflare의 `CF-IPCountry` 헤더를 사용하고, KR/KP는 한국어, 나머지는 영어로 설정. 에러 시에는 기본값(영어) 유지해야 한다.

## 더 나은 방법은 없을까

### MCP 서버를 활용한 콘텐츠 관리

현재는 bash 스크립트로 콘텐츠를 생성하지만, MCP(Model Context Protocol) 서버를 쓰면 더 정교한 제어가 가능하다.

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "content-generator": {
      "command": "node",
      "args": ["./mcp-servers/content-generator.js"],
      "env": {
        "PROJECT_ROOT": "/path/to/jidonglab.com"
      }
    }
  }
}
```

MCP 서버는 Claude가 파일 시스템에 직접 접근할 수 있게 해준다. 콘텐츠 생성부터 파일 저장, 메타데이터 관리까지 한 번에 처리할 수 있다.

### Anthropic의 Computer Use API 활용

최근 릴리스된 Computer Use API를 쓰면 브라우저 자동화도 가능하다. DEV.to 포스팅을 API가 아닌 브라우저 조작으로 처리할 수 있다:

```python
# Computer Use API로 DEV.to 자동 포스팅
from anthropic import Anthropic

client = Anthropic()
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    tools=[{"type": "computer_20241022"}],
    messages=[{
        "role": "user", 
        "content": "DEV.to에 로그인해서 이 마크다운을 포스팅해줘"
    }]
)
```

다만 Computer Use는 아직 베타 단계라 프로덕션에서는 신중하게 써야 한다.

### Astro의 Content Collections 활용도 개선

현재 AI 뉴스는 단순히 마크다운 파일로 관리한다. Astro의 Content Collections schema를 더 정교하게 정의하면 타입 안전성을 높일 수 있다:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const aiNewsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(60),
    publishDate: z.date(),
    tags: z.array(z.string()).min(2).max(5),
    language: z.enum(['en', 'ko']),
    source: z.string().url().optional(),
    summary: z.string().max(200)
  })
});
```

이렇게 하면 AI가 생성한 콘텐츠가 스키마에 맞는지 빌드 시점에 검증할 수 있다.

## 정리

- **구조화된 프롬프팅**: 제약 조건, 톤앤매너, 출력 형식을 명시하면 일관된 품질의 콘텐츠를 얻을 수 있다
- **환경별 제약 파악**: Cloudflare 같은 serverless 환경의 제한사항을 미리 파악하고 AI에게 명시해야 한다  
- **단계별 자동화**: 콘텐츠 생성-저장-배포를 분리해서 각 단계를 최적화하는 게 유지보수에 좋다
- **CLAUDE.md 활용**: 프로젝트별 컨텍스트를 문서화하면 AI 에이전트의 출력 품질이 크게 향상된다

<details>
<summary>이번 작업의 커밋 로그</summary>

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