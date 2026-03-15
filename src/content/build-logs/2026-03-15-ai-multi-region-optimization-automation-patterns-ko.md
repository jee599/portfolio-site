---
title: "AI로 다국가 배포 최적화하기 — 리전 감지와 자동 생성 스크립트 패턴"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [fix, feat, chore, astro, typescript]
---

이번에는 포트폴리오 사이트를 다국가 환경에 맞게 최적화하는 작업을 했다. Cloudflare Pages 마이그레이션, 리전별 자동 언어 전환, AI 뉴스 생성 자동화까지 — AI를 어떻게 활용해서 복잡한 배포 환경을 단순화했는지 보여준다.

## 배경: 무엇을 만들고 있는가

개인 포트폴리오 사이트 `jidonglab.com`에서 AI 뉴스 콘텐츠를 영어와 한국어로 생성하고 있다. 기존에는 Vercel에서 호스팅했는데, 글로벌 사용자를 위해 Cloudflare Pages로 마이그레이션하면서 여러 문제가 터졌다.

목표는 이랬다:
- Cloudflare Pages 환경에서 안정적으로 빌드되게 하기
- 사용자 리전에 따라 자동으로 언어 전환
- AI 뉴스를 영어/한국어 버전으로 동시 생성해서 각각 다른 플랫폼에 배포
- 이 모든 과정을 스크립트로 자동화

## Cloudflare 환경 차이를 AI로 디버깅하기

플랫폼이 바뀌면 빌드 환경도 완전히 달라진다. Vercel에서 잘 되던 코드가 Cloudflare Pages에서는 에러가 난다.

**효과적인 디버깅 프롬프트:**

> Vercel에서 Cloudflare Pages로 마이그레이션 중이야. 아래 에러가 나는데, Cloudflare Workers/Pages 환경 제약사항과 비교해서 문제점을 찾아줘.
> 
> ```
> Error: Cannot resolve "node:fs" 
> ```
> 
> 현재 코드:
> ```javascript
> import fs from 'node:fs';
> ```
> 
> Astro 프로젝트이고, 이 코드는 API 라우트에서 파일을 읽는 용도다.

이런 식으로 쓰면 안 된다:

> 에러 났어. 고쳐줘.

차이가 뭐냐면, 첫 번째 프롬프트는 **환경 맥락**을 명확히 준다. AI가 Cloudflare Pages의 제약사항(Node.js API 제한, edge runtime 등)을 고려해서 대안을 제시할 수 있다.

**AI가 제시한 해결책:**
- `node:fs` 대신 Astro의 `import.meta.glob()` 사용
- API 라우트에서 파일 시스템 접근 최소화
- 정적 데이터는 빌드 타임에 처리

실제로 `src/pages/api/generate-ai-news.ts`에서 파일 시스템 접근을 제거하고, 생성 로직을 별도 스크립트로 분리했다.

## 리전 기반 자동 언어 전환 구현

글로벌 사이트에서 중요한 건 사용자 위치에 따른 자동 언어 전환이다. 하지만 이걸 제대로 구현하려면 여러 요소를 고려해야 한다.

**구조화된 요구사항 프롬프트:**

> Cloudflare Pages + Astro 환경에서 사용자 리전 기반 자동 언어 전환을 구현하려고 해. 요구사항은:
> 
> 1. 기본값: 영어 (en)
> 2. 한국/북한 IP → 한국어 (ko)  
> 3. 중국/대만/홍콩 IP → 중국어 (zh)
> 4. 일본 IP → 일본어 (ja)
> 5. 사용자가 수동으로 언어 변경하면 그걸 우선 (localStorage 저장)
> 6. SEO 고려해서 `hreflang` 태그도 자동 생성
> 
> Cloudflare의 `CF-IPCountry` 헤더 사용 가능하고, 클라이언트 사이드에서 처리해야 해.

**AI가 제안한 패턴:**
1. API 라우트 `/api/locale.ts`에서 `CF-IPCountry` 헤더 읽기
2. 클라이언트에서 페이지 로드 시 이 API 호출
3. localStorage 체크 → API 결과 → 기본값 순으로 우선순위 적용
4. Base layout에서 동적으로 `hreflang` 메타태그 생성

```javascript
// src/pages/api/locale.ts
export const GET = ({ request }) => {
  const country = request.headers.get('CF-IPCountry');
  const locale = getLocaleFromCountry(country);
  return new Response(JSON.stringify({ locale }));
};
```

핵심은 **우선순위를 명확히 정의**하는 거다. 사용자 선택 → 리전 감지 → 기본값 순으로 fallback 체인을 만들어야 한다.

## AI 뉴스 자동 생성 스크립트 설계

매일 AI 뉴스를 영어와 한국어로 생성해서, 영어는 내 사이트에, 한국어는 DEV.to에 올리는 워크플로우를 만들었다. 이런 반복 작업을 자동화할 때는 **단계별 검증**이 중요하다.

**스크립트 구조화 프롬프트:**

> AI 뉴스 생성 스크립트를 만들어야 해. 요구사항:
>
> 1. 최신 AI 뉴스 4개 수집 (Hacker News, TechCrunch 등)
> 2. 각 뉴스마다 영어/한국어 버전 생성 (총 8개 파일)
> 3. 영어 버전은 `src/content/ai-news/` 저장
> 4. 한국어 버전은 GitHub Actions로 DEV.to 자동 발행
> 5. 중복 체크, 품질 검증, 에러 복구 포함
>
> bash 스크립트로 만들고, 각 단계마다 실패 시 롤백 가능하게 해줘.

**AI가 제안한 패턴:**

```bash
#!/bin/bash

generate_ai_news() {
  local date=$(date +%Y-%m-%d)
  local temp_dir="/tmp/ai-news-${date}"
  
  # 1. 임시 디렉토리 생성
  mkdir -p "$temp_dir"
  
  # 2. 뉴스 수집 및 생성
  for i in {1..4}; do
    generate_single_news "$i" "$temp_dir" || {
      echo "뉴스 $i 생성 실패"
      cleanup_temp "$temp_dir"
      return 1
    }
  done
  
  # 3. 품질 검증
  validate_generated_content "$temp_dir" || {
    echo "품질 검증 실패"
    cleanup_temp "$temp_dir"
    return 1
  }
  
  # 4. 최종 배포
  deploy_content "$temp_dir"
}
```

핵심은 **원자적 작업**으로 쪼개는 거다. 각 단계가 실패하면 이전 상태로 롤백할 수 있게 임시 디렉토리를 쓰고, 모든 검증이 끝나면 한번에 배포한다.

**blog-writing skill 연동:**

Claude Code의 custom skill을 활용해서 AI 뉴스 생성 품질을 높였다. `c4b0055` 커밋에서 이 부분을 적용했다.

> AI 뉴스 생성 시 blog-writing skill 적용해서:
> - 제목은 클릭베이트 없이 팩트 중심
> - 본문은 5W1H 구조
> - 기술 용어 번역 일관성 유지  
> - 출처 링크 필수 포함
> - 한국어 버전은 DEV.to 스타일 가이드 준수

이렇게 하면 단순히 번역하는 게 아니라, 각 플랫폼의 톤앤매너에 맞게 콘텐츠가 생성된다.

## 멀티 플랫폼 배포 자동화

영어 콘텐츠와 한국어 콘텐츠를 다른 플랫폼에 배포하는 워크플로우를 GitHub Actions로 자동화했다. 여기서 중요한 건 **조건부 실행**이다.

**워크플로우 최적화 전략:**

기존에는 모든 블로그 포스트를 DEV.to에 올렸는데, AI 뉴스만 선별적으로 발행하도록 변경했다.

```yaml
# .github/workflows/publish-to-devto.yml
- name: Publish AI News to DEV.to
  run: |
    for file in src/content/ai-news/*.md; do
      if [[ $file == *"$(date +%Y-%m-%d)"* ]] && [[ $file == *"-ko.md" ]]; then
        publish_to_devto "$file"
      fi
    done
```

**AI에게 워크플로우 최적화 시키는 프롬프트:**

> 현재 GitHub Actions 워크플로우가 모든 마크다운 파일을 DEV.to에 발행하고 있어. 다음 조건으로 수정해줘:
>
> 1. `src/content/ai-news/` 폴더의 파일만 처리  
> 2. 파일명에 오늘 날짜 포함된 것만
> 3. 한국어 버전(`-ko.md`)만 DEV.to에 발행
> 4. 영어 버전은 내 사이트에만 남겨둠
> 5. API 호출 실패 시 3회 재시도
>
> 기존 53줄 워크플로우를 최대한 단순화해줘.

결과적으로 53줄이었던 워크플로우를 2줄로 줄였다. 불필요한 복잡성을 제거하고 핵심 로직만 남겼다.

## CLAUDE.md로 프로젝트 컨텍스트 관리

복잡한 멀티 플랫폼 프로젝트에서는 AI가 전체 맥락을 이해할 수 있게 `CLAUDE.md` 파일을 잘 작성하는 게 중요하다.

**효과적인 CLAUDE.md 구조:**

```markdown
# jidonglab.com

## 아키텍처
- Astro 4.0 + TypeScript
- 호스팅: Cloudflare Pages (Vercel에서 마이그레이션 완료)
- 분석: Cloudflare Web Analytics
- 배포: GitHub Actions

## 콘텐츠 전략  
- 블로그: 한국어, 개발 방법론 중심
- AI 뉴스: 영어/한국어 버전 동시 생성
  - 영어 → jidonglab.com
  - 한국어 → DEV.to 자동 발행

## 주요 제약사항
- Cloudflare Pages에서 Node.js API 사용 불가
- `node:fs`, `node:path` 등은 edge runtime에서 에러
- 정적 파일 접근은 `import.meta.glob()` 사용

## 배포 워크플로우
1. `scripts/generate-ai-news.sh` 실행
2. 영어/한국어 콘텐츠 동시 생성  
3. GitHub push 시 자동 배포
```

이렇게 하면 AI가 새로운 기능을 추가할 때 기존 아키텍처를 고려해서 코드를 생성한다. 예를 들어, `node:fs` 대신 Astro 방식을 자동으로 선택한다.

## 더 나은 방법은 없을까

이번 작업에서 쓴 방식보다 더 효율적인 대안들이 있다.

**Cloudflare KV 스토어 활용:**
현재는 리전 감지를 API 라우트로 처리하는데, Cloudflare KV에 국가별 설정을 캐싱하면 응답 속도가 더 빠르다. 특히 글로벌 사용자가 많은 사이트에서는 edge에서 바로 처리하는 게 유리하다.

**Anthropic의 새로운 Model Context Protocol:**
AI 뉴스 생성을 MCP 서버로 구현하면 더 안정적이다. 현재는 bash 스크립트 + API 호출이지만, MCP로 하면 상태 관리와 에러 복구가 더 체계적으로 된다.

**Astro 4.0의 새로운 Internationalization API:**
`src/pages/api/locale.ts` 같은 커스텀 구현 대신 Astro의 공식 i18n 기능을 쓰는 게 좋다. 최근 릴리스에서 동적 locale 감지 기능이 추가됐다.

**GitHub Actions Composite Actions:**
워크플로우를 더 모듈화할 수 있다. AI 뉴스 생성, 품질 검증, 배포를 각각 composite action으로 만들면 재사용성이 높아진다.

비용 관점에서는 Cloudflare Pages + KV 조합이 Vercel보다 월등히 저렴하다. 글로벌 트래픽이 많은 사이트라면 CDN 비용만으로도 차이가 크다.

## 정리

- **환경 차이 디버깅**: 플랫폼별 제약사항을 AI에게 명확히 전달하면 정확한 대안을 얻는다
- **리전 기반 기능**: 우선순위 체인을 설계하고 fallback 로직을 체계화한다  
- **반복 작업 자동화**: 원자적 단위로 쪼개고 각 단계마다 검증 포인트를 둔다
- **CLAUDE.md 활용**: 프로젝트 맥락과 제약사항을 문서화하면 AI가 일관된 코드를 생성한다

<details>
<summary>이번 작업의 커밋 로그</summary>

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