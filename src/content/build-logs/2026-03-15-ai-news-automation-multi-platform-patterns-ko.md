---
title: "AI 뉴스 생성기를 만들며 배운 멀티 플랫폼 자동화 패턴"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [feat, fix, chore, astro, typescript]
---

AI로 매일 뉴스를 생성해서 여러 플랫폼에 동시 배포하는 시스템을 만들었다. Claude에게 기사 작성부터 GitHub Actions로 DEV.to 자동 발행까지, 전체 파이프라인을 구축하는 과정에서 발견한 프롬프팅 패턴과 자동화 전략을 정리한다.

## 배경: 무엇을 만들고 있는가

개인 포트폴리오 사이트(jidonglab.com)에 AI 뉴스 섹션을 추가했다. 매일 AI 업계 주요 소식 4건을 선별해서 영어로 작성하고, 한국어 버전은 DEV.to에 크로스 포스팅하는 구조다. 

목표는 단순했다. 수동 작업 없이 `npm run ai-news`만 실행하면 콘텐츠 생성부터 배포까지 모든 과정이 자동으로 돌아가는 시스템. 하지만 실제로 구현하면서 여러 함정을 만났다.

## AI 뉴스 생성 — 구조화된 프롬프팅이 핵심이다

첫 번째 도전은 "일관된 품질의 뉴스 기사를 매일 생성하기"였다. Claude에게 그냥 "AI 뉴스 써줘"라고 하면 매번 다른 톤과 구조로 나온다. 

### 효과적인 뉴스 생성 프롬프트

가장 효과적이었던 패턴은 **역할-제약-예시-검증** 구조다:

> AI 기술 트렌드를 다루는 테크 블로거로서, 오늘(2026-03-14) AI 업계 핵심 뉴스 4건을 선별해서 각각 독립적인 마크다운 포스트로 작성해줘.
>
> 제약 조건:
> - 제목: 50자 이내, SEO 친화적
> - 본문: 300-500단어, 기술적 배경 설명 포함
> - 소스: 신뢰할 수 있는 출처만 (TechCrunch, Ars Technica, The Verge 등)
> - 톤: 객관적이지만 인사이트 포함
> - 중복 방지: OpenAI, Google, Anthropic 등 빅테크 뉴스 위주
>
> 각 포스트 구조:
> 1. 핵심 사실 1-2문장 요약
> 2. 기술적 배경과 맥락
> 3. 업계에 미치는 영향
> 4. 향후 전망

이렇게 구체적으로 지시하면 일관된 퀄리티가 나온다. 반면 이런 프롬프트는 실패한다:

> 오늘 AI 뉴스 좀 써줘

너무 추상적이라 매번 다른 결과가 나온다.

### Claude Code의 skills 활용

`CLAUDE.md`에 `blog-writing` 스킬을 추가해서 일관성을 더 높였다:

```markdown
# Blog Writing Guidelines

## Tone
- Professional but accessible
- Data-driven insights
- Avoid hype, focus on practical implications

## Structure  
- Hook in first paragraph
- Subheadings for scanability
- Concrete examples over abstract concepts
```

이 스킬을 적용한 후 생성 품질이 눈에 띄게 개선됐다. Claude가 매번 이 가이드라인을 참조해서 일관된 스타일을 유지한다.

## 멀티 플랫폼 자동화 — 환경별 제약 조건 관리

두 번째 도전은 "같은 콘텐츠를 여러 플랫폼에 맞게 변환하기"였다. jidonglab.com은 영어, DEV.to는 한국어로 발행해야 하고, 각 플랫폼마다 frontmatter 형식도 다르다.

### Bash 스크립트로 워크플로우 통합

`scripts/generate-ai-news.sh`에 전체 파이프라인을 구현했다:

```bash
#!/bin/bash

# 1. Claude API로 영어 뉴스 4건 생성
curl -X POST "https://api.anthropic.com/v1/messages" \
  -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$NEWS_GENERATION_PAYLOAD"

# 2. 각 기사를 한국어로 번역 + DEV.to frontmatter 추가
for file in src/content/ai-news/*.md; do
  claude_translate "$file" > "devto-posts/${basename}.md"
done

# 3. GitHub Actions 트리거로 DEV.to 자동 발행
git add . && git commit -m "feat: AI news $(date +%Y-%m-%d)"
git push origin main
```

여기서 핵심은 **각 단계별로 명확한 입출력 정의**다. Claude에게 번역을 시킬 때도 단순히 "번역해줘"가 아니라:

> 이 영어 AI 뉴스 기사를 한국어로 번역하되, 다음 조건을 지켜줘:
> 1. 기술 용어는 원문 그대로 유지 (예: LLM, GPU, API)
> 2. 한국 독자에게 생소한 회사는 간단한 설명 추가
> 3. DEV.to 플랫폼에 맞게 frontmatter 수정
> 4. 원문의 구조와 톤 유지

### Cloudflare Pages 빌드 에러 대응

배포 과정에서 예상치 못한 함정이 있었다. Vercel용 설정(`node --max-old-space-size=4096`)이 Cloudflare Pages에서는 에러를 발생시켰다. 

AI에게 디버깅을 도움받을 때 효과적인 패턴:

> Cloudflare Pages 빌드 로그:
> ```
> Error: Unknown option '--max-old-space-size'
> Build failed with exit code 1
> ```
> 
> 현재 `package.json` build 스크립트:
> ```json
> "build": "node --max-old-space-size=4096 astro build"
> ```
> 
> 이 옵션을 제거하면 메모리 부족 에러가 날 가능성이 있다. Cloudflare Pages에서 Astro 빌드 시 메모리 최적화 방법을 제안해줘.

단순히 "에러 고쳐줘"보다 **현재 설정, 에러 로그, 우려사항**을 모두 제공하면 정확한 해결책을 얻는다.

## 자동화된 콘텐츠 배포 — GitHub Actions 최적화

세 번째 도전은 "휴먼 인터벤션 없는 완전 자동 배포"였다. DEV.to API 연동에서 여러 시행착오를 겪었다.

### 워크플로우 최적화 패턴

기존 GitHub Actions는 모든 마크다운 파일을 스캔해서 DEV.to에 발행했다. 하지만 AI 뉴스만 자동 발행하고 싶었다.

Claude에게 워크플로우 최적화를 요청할 때 사용한 프롬프트:

> 현재 GitHub Actions 워크플로우는 `src/content/blog/` 전체를 스캔해서 DEV.to에 발행한다. 하지만 `src/content/ai-news/` 디렉터리의 파일만 자동 발행하고 싶다.
> 
> 요구사항:
> 1. `ai-news/` 디렉터리 변경 시에만 워크플로우 실행
> 2. 해당 디렉터리 내 신규/수정 파일만 처리
> 3. 기존 블로그 포스트는 수동 발행 유지
> 4. API 레이트 리밋 고려한 배치 처리
> 
> 현재 `.github/workflows/publish-to-devto.yml` 파일:
> ```yaml
> [기존 워크플로우 내용]
> ```

결과적으로 53줄에서 2줄로 대폭 간소화된 워크플로우를 얻었다:

```yaml
name: Publish AI News to DEV.to
on:
  push:
    paths: ['src/content/ai-news/**']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: node scripts/publish-ai-news.js
```

### sitemap 비활성화와 트레이드오프

Cloudflare Pages 빌드 안정성을 위해 sitemap 생성을 비활성화했다. 이런 결정을 내릴 때 AI에게 트레이드오프 분석을 요청하는 것이 유용하다:

> Astro 사이트에서 sitemap 비활성화를 고려 중이다. 빌드 안정성을 얻는 대신 SEO에 미치는 영향과 대안책을 분석해줘.
> 
> 현재 상황:
> - 포트폴리오 사이트 (10-20개 페이지)
> - 정적 페이지 위주, 콘텐츠 변경 빈도 낮음
> - Cloudflare Pages 호스팅

AI가 제시한 대안:

1. 수동 sitemap 관리 (정적 XML 파일)
2. Google Search Console 직접 제출
3. 네비게이션 구조 최적화로 크롤링 개선

결국 현재 규모에서는 빌드 안정성이 더 중요하다고 판단했다.

## 더 나은 방법은 없을까

이번 작업을 마치고 나서 더 효율적인 접근법을 찾아봤다.

### MCP 서버 활용 가능성

현재는 Bash 스크립트와 API 호출을 조합했지만, Anthropic의 MCP(Model Context Protocol)를 활용하면 더 깔끔해질 수 있다. 특히 GitHub MCP 서버를 사용하면:

```javascript
// 현재 방식: API 호출 + 파일 조작
const response = await fetch('/api/generate-ai-news');
const files = await processMarkdown(response);
await commitAndPush(files);

// MCP 활용 시: 컨텍스트 내에서 통합 처리
// Claude가 직접 GitHub 레포지토리 조작 가능
```

### 더 정교한 콘텐츠 생성 전략

현재는 일괄 생성 후 수동 검토하는 방식이다. 하지만 retrieval-augmented generation(RAG) 패턴을 적용하면:

1. 실시간 뉴스 피드에서 소스 수집
2. 중요도 점수 기반 자동 필터링  
3. 기존 발행 콘텐츠와 중복도 체크
4. A/B 테스트를 통한 제목 최적화

이런 고도화된 파이프라인을 구축할 수 있다.

### GitHub Actions 대신 Cloudflare Workers

현재 GitHub Actions로 DEV.to 발행을 처리하지만, Cloudflare Workers Cron Triggers를 사용하면 더 빠르고 안정적이다. 특히 API 레이트 리밋 처리나 에러 복구에서 더 세밀한 제어가 가능하다.

## 정리

- **구조화된 프롬프팅**: 역할-제약-예시-검증 패턴으로 일관된 콘텐츠 품질 확보
- **환경별 제약 관리**: 플랫폼마다 다른 요구사항을 명시적으로 프롬프트에 반영
- **워크플로우 최적화**: 전체 파이프라인을 작은 단위로 쪼개서 각각 명확한 입출력 정의
- **트레이드오프 분석**: 기술적 결정을 내릴 때 AI에게 장단점 분석 요청

완전 자동화는 매력적이지만, 각 단계에서 발생할 수 있는 엣지 케이스를 미리 고려해야 한다. AI에게 작업을 시킬 때는 "무엇을 하지 말아야 하는가"도 함께 명시하는 것이 핵심이다.

<details>
<summary>이번 작업의 커밋 로그</summary>

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