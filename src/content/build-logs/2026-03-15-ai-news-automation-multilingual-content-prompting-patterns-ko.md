---
title: "AI 뉴스 자동 생성 시스템 구축 — 다국어 콘텐츠를 한번에 처리하는 프롬프트 패턴"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [feat, fix, chore, astro, typescript]
---

AI로 콘텐츠를 대량 생성하고 여러 플랫폼에 동시 배포하는 시스템을 만들었다. 하나의 스크립트로 영어/한국어 뉴스를 생성하고, DEV.to와 자체 사이트에 자동 발행하는 과정에서 발견한 프롬프팅 패턴과 구조화 전략을 정리한다.

## 배경: 무엇을 만들고 있는가

`jidonglab.com`은 AI 개발 관련 블로그와 뉴스를 다루는 포트폴리오 사이트다. 매일 AI 업계 뉴스를 수집해서 분석 글을 쓰는데, 이 작업을 완전히 자동화하려고 한다.

이번 목표는 하나의 CLI 스크립트로 영어 버전은 자체 사이트에, 한국어 버전은 DEV.to에 발행하는 시스템을 구축하는 것이었다. 단순 번역이 아니라 각 언어권 독자에게 맞는 톤과 구성으로 만들어야 했다.

## Claude에게 뉴스 분석을 시키는 프롬프트 설계

AI 뉴스 생성에서 가장 중요한 부분은 "어떤 정보를 어떤 관점으로 분석하게 할 것인가"다. 처음엔 이렇게 단순하게 시켰다:

> "오늘 AI 뉴스를 요약해줘"

결과는 예상대로 엉망이었다. 뻔한 요약만 나오고, 독자가 "그래서 뭐?"라고 할 만한 내용들이었다.

효과적인 프롬프트는 이렇게 구조화했다:

> "AI 업계 뉴스 4건을 분석해서 독립적인 블로그 포스트로 만들어줘. 각 포스트는:
> 
> 1. 기술적 임팩트를 중심으로 분석 (단순 요약 금지)
> 2. 개발자 관점에서 '이게 내 일에 어떤 영향을 줄까' 언급
> 3. 제목은 클릭베이트 없이 핵심만 (한글 60자 이내)
> 4. 본문은 800-1200자, 구어체 반말 사용
> 
> frontmatter 형식:
> ```yaml
> title: "제목"
> description: "한줄 요약"
> category: "ai-news"
> tags: ["AI", "관련태그"]
> date: "2026-03-14"
> slug: "영문-slug"
> ```
> 
> 소스가 있으면 반드시 링크 포함. 추측성 내용은 명시."

이 프롬프트의 핵심은 **제약 조건을 구체적으로 준 것**이다. "요약해줘"가 아니라 "분석해줘", "개발자 관점", "구어체 반말" 같은 명확한 가이드라인이 품질을 크게 좌우한다.

### 다국어 처리에서 빠지는 함정

처음엔 영어 버전을 만들고 한국어로 번역하는 방식을 썼다. 결과는 어색했다. 번역투가 심하고, 각 언어권의 맥락을 무시한 내용이 나왔다.

해결책은 **동시 생성**이었다:

> "같은 뉴스 소스로 영어/한국어 버전을 동시에 만들되, 각각 다른 독자를 타겟한다:
> 
> **영어 버전**: 글로벌 tech community, 간결하고 팩트 위주
> **한국어 버전**: 한국 개발자, 친근한 톤에 맥락 설명 추가
> 
> 제목도 각 언어의 SEO 패턴에 맞게 다르게 만들어줘."

이렇게 하니 번역투가 사라지고, 각 언어권에 자연스러운 콘텐츠가 나왔다.

## 스크립트 자동화와 에러 핸들링

`generate-ai-news.sh` 스크립트는 단순해 보이지만 실제로는 여러 에러 케이스를 처리해야 한다. 특히 Claude API 호출 실패, 파일 생성 실패, GitHub Actions 연동 실패 등이 자주 발생한다.

핵심은 **각 단계를 독립적으로 만드는 것**이다:

```bash
# 1. 뉴스 수집
fetch_news_sources() {
  # RSS, API 호출 등
}

# 2. Claude에게 분석 요청
generate_content() {
  # 실패 시 재시도 3회
  for i in {1..3}; do
    if call_claude_api "$prompt"; then
      break
    fi
    sleep 5
  done
}

# 3. 파일 생성 및 검증
create_posts() {
  # frontmatter 형식 검증
  # slug 중복 체크
  # 파일명 sanitize
}
```

각 함수가 실패해도 다른 부분에 영향을 주지 않게 설계했다. 특히 Claude API 호출은 네트워크 이슈로 실패할 수 있어서 재시도 로직이 필수다.

### Cloudflare Pages 빌드 에러 해결

Vercel에서 Cloudflare Pages로 마이그레이션하면서 여러 빌드 에러가 발생했다. 가장 큰 문제는 `node:fs` 모듈을 Edge Runtime에서 사용할 수 없다는 것이었다.

해결 과정:

1. **에러 재현**: 로컬에서는 정상인데 Cloudflare에서만 실패
2. **로그 분석**: `node:fs import from generate-ai-news API` 에러 확인
3. **대안 탐색**: Edge Runtime 호환 방식으로 변경
4. **검증**: 빌드 커맨드에서 Vercel 전용 옵션 제거

```javascript
// 이전 (Vercel 전용)
import { readFileSync } from 'node:fs';

// 이후 (Edge Runtime 호환)
const response = await fetch('/api/news-sources');
const data = await response.json();
```

이런 플랫폼별 차이점은 AI가 잘 못 잡아내는 부분이다. 에러 메시지를 Claude에게 보여줘도 "Node.js 버전을 업데이트하세요" 같은 엉뚱한 답변이 나온다.

## Admin 대시보드에서 효율성 극대화

콘텐츠 관리를 위한 admin 페이지에 몇 가지 기능을 추가했다. 여기서 중요한 건 **AI에게 UI 작업을 시킬 때 구체적인 제약 조건을 주는 것**이다.

나쁜 프롬프트:
> "admin 페이지에 조회수 순 정렬 기능 추가해줘"

좋은 프롬프트:
> "admin 페이지에 전체 콘텐츠를 조회수 순으로 정렬하는 섹션을 추가해줘. 요구사항:
> 
> 1. 기존 Astro 컴포넌트 구조 유지
> 2. `getCollection()` 사용해서 모든 콘텐츠 가져오기
> 3. frontmatter의 `views` 필드 기준 정렬 (없으면 0으로 처리)
> 4. 테이블 형태로 제목, 카테고리, 조회수, 날짜 표시
> 5. 제목 클릭 시 해당 포스트로 이동
> 6. 반응형 대응 (모바일에서는 조회수만 표시)"

결과적으로 한 번에 원하는 대로 나왔다. AI에게 UI 작업을 시킬 때는 **데이터 구조, 스타일 가이드, 반응형 처리**를 모두 명시해야 한다.

### 히트맵 스타일링 이슈

CSS-in-JS와 Astro의 스타일 처리 방식 차이로 인해 히트맵이 깨지는 문제가 발생했다. 외부 라이브러리의 동적 스타일이 Astro의 스타일 스코핑과 충돌한 케이스다.

```astro
<!-- 문제: 스타일이 적용 안 됨 -->
<div class="heatmap-container">
  <HeatmapComponent />
</div>

<!-- 해결: is:inline 추가 -->
<div class="heatmap-container">
  <HeatmapComponent />
</div>
<style is:inline>
  .heatmap-container .cal-heatmap { /* 스타일 */ }
</style>
```

이런 프레임워크별 quirk들은 AI가 놓치기 쉬운 부분이다. 에러 메시지만으로는 근본 원인을 파악하기 어렵다.

## 더 나은 방법은 없을까

지금 방식의 한계점과 개선 방향을 정리해본다.

### 1. 콘텐츠 품질 일관성

현재는 매번 다른 품질의 글이 나온다. 같은 프롬프트를 써도 Claude의 응답이 일정하지 않다. 

**더 나은 방법**: 
- Custom instructions에 writing style guide 상세히 명시
- few-shot prompting으로 좋은 예시 3-4개 포함
- 생성 후 자동 품질 체크 (길이, 키워드 밀도, 가독성 점수)

### 2. 다국어 SEO 최적화

현재는 단순히 언어만 다르게 생성한다. 하지만 검색 키워드 트렌드는 언어권마다 다르다.

**더 나은 방법**:
- Google Trends API 연동으로 언어별 검색량 확인
- 각 언어권의 tech community 플랫폼 특성 반영 (Reddit vs 커뮤니티 사이트)
- 현지 개발자들이 쓰는 용어 우선 사용

### 3. 에러 복구 자동화

현재는 에러가 나면 수동으로 재실행해야 한다. 

**더 나은 방법**:
- GitHub Actions에서 실패 시 슬랙 알림
- 부분 실패 시 성공한 부분만 배포
- MCP 서버로 파일 시스템 작업 더 안정적으로 처리

### 4. 콘텐츠 개인화

모든 독자에게 같은 내용을 보여준다. 

**더 나은 방법**:
- Cloudflare Analytics 데이터 기반 관심사 파악
- 독자 세그먼트별 다른 앵글로 같은 뉴스 처리
- A/B 테스트로 제목과 구성 최적화

가장 큰 개선점은 **피드백 루프 구축**이다. 지금은 생성하고 끝이지만, 실제 독자 반응을 수집해서 프롬프트를 지속적으로 개선해야 한다.

## 정리

- **구체적 제약 조건**이 좋은 프롬프트의 핵심이다. "요약해줘"가 아니라 "누구를 위해, 어떤 관점으로, 몇 글자로"
- **다국어는 번역이 아닌 동시 생성**으로 처리해야 자연스럽다
- **플랫폼별 quirk**는 AI가 못 잡는 경우가 많다. 에러 메시지를 직접 분석하자
- **각 작업을 독립적으로 설계**하면 부분 실패 시에도 복구가 쉽다

<details>
<summary>이번 작업의 커밋 로그</summary>

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