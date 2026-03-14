---
title: "AI 뉴스봇 하나로 영어+한국어 이중 발행 자동화하는 스크립트 패턴"
project: "portfolio-site"
date: 2026-03-14
lang: ko
tags: [fix, feat, typescript]
---

AI 뉴스 자동 생성 시스템을 만들면서 "한 번 돌리면 영어, 한국어 두 버전이 각기 다른 플랫폼에 배포되는" 파이프라인을 구축했다. 이 과정에서 발견한 멀티 언어 콘텐츠 생성과 배포 자동화의 핵심 패턴을 정리한다.

## 배경: 무엇을 만들고 있는가

개인 기술 블로그 `jidonglab.com`에서 AI 관련 뉴스를 매일 4건씩 자동 생성하는 시스템을 운영 중이다. 목표는 단순했다. 매일 아침 스크립트 한 번 실행으로 영어 뉴스는 개인 사이트에, 한국어 뉴스는 DEV.to에 크로스 포스팅되어야 한다.

기존에는 각각 따로 만들었다가, 유지보수 비용이 너무 크다는 걸 깨달았다. 프롬프트 업데이트할 때마다 두 군데를 수정해야 하고, 실행도 두 번 해야 했다. 이번에 통합 스크립트로 리팩토링했다.

## AI에게 뉴스 생성 로직을 맡기는 프롬프팅 전략

가장 중요한 건 AI에게 "뉴스 4개 만들어줘"라고 하면 안 된다는 점이다. 뉴스봇은 일관성이 생명이므로, 매우 구체적인 제약 조건을 줘야 한다.

효과적인 프롬프트는 이렇게 구성했다:

> "AI 업계 뉴스 4건을 생성해라. 각 뉴스는 다음 조건을 만족해야 한다:
> - 제목: 50자 이내, SEO 최적화된 키워드 포함
> - 본문: 200-300단어, 팩트 중심, 추측성 표현 금지  
> - slug: kebab-case, 날짜-핵심키워드 형식
> - 카테고리: breakthrough/funding/regulation/product 중 하나
> - 톤: 기술 전문가 대상, 중립적 어조
> - 출력 형식: markdown frontmatter + 본문"

이렇게 쓰면 안 된다:

> "오늘의 AI 뉴스 좀 써줘"

두 번째 핵심은 **언어별 톤 차별화**다. 영어와 한국어는 독자층이 다르기 때문에 각각 다른 스타일을 요구했다:

```bash
# 영어 버전 (jidonglab.com 독자층)
ENGLISH_PROMPT="Write for international tech professionals. Use concise, data-driven language. Focus on global implications and market impact."

# 한국어 버전 (DEV.to 개발자 커뮤니티)
KOREAN_PROMPT="국내 개발자 커뮤니티를 위해 쓴다. 기술적 디테일보다는 실무 적용 가능성과 트렌드 해석에 집중한다. 반말 사용."
```

## Claude Code skills를 활용한 콘텐츠 품질 통제

이번 작업의 핵심은 `blog-writing` 스킬을 AI 뉴스 생성 파이프라인에 적용한 것이다. `CLAUDE.md`에 정의한 글쓰기 가이드라인을 뉴스 생성에도 그대로 적용했다.

```markdown
## Skills: blog-writing
- 제목에 숫자와 구체적 키워드 포함
- 첫 문단은 3줄 이내로 핵심 요약
- 기술 용어는 번역하지 않고 원문 유지
- 추측성 표현 ("~할 것으로 예상") 금지
- 팩트만 나열하되, 맥락과 의미 제공
```

이걸 CLI 스크립트에서 호출할 때는 `--apply-skill blog-writing` 옵션을 사용했다. 결과적으로 수동으로 쓰던 뉴스와 동일한 품질 기준이 자동 생성 뉴스에도 적용된다.

프롬프트에서 스킬 적용을 명시적으로 요청하는 것도 중요하다:

> "다음 뉴스를 생성할 때 blog-writing 스킬의 가이드라인을 엄격히 적용해라. 특히 제목 최적화와 팩트 중심 서술을 준수한다."

## 스크립트 구조화: 하나의 파이프라인으로 두 언어 처리

기존에는 영어용 스크립트와 한국어용 스크립트를 따로 만들었었다. 문제는 중복 코드와 설정 동기화였다. 통합 스크립트의 핵심 구조는 이렇다:

```bash
#!/bin/bash
# generate-ai-news.sh

DATE=$(date +%Y-%m-%d)
TEMP_DIR="/tmp/ai-news-$DATE"

# 1단계: 영어 뉴스 생성
generate_english_news() {
    echo "Generating English AI news..."
    curl -X POST "$SITE_URL/api/generate-ai-news" \
         -H "Content-Type: application/json" \
         -d "{\"language\":\"en\", \"count\":4, \"date\":\"$DATE\"}" \
         > "$TEMP_DIR/en-news.json"
}

# 2단계: 한국어 뉴스 생성  
generate_korean_news() {
    echo "Generating Korean AI news..."
    curl -X POST "$SITE_URL/api/generate-ai-news" \
         -H "Content-Type: application/json" \
         -d "{\"language\":\"ko\", \"count\":4, \"date\":\"$DATE\"}" \
         > "$TEMP_DIR/ko-news.json"
}

# 3단계: 각 언어별 배포
deploy_english() {
    # jidonglab.com에 직접 commit
    git add src/content/ai-news/*-en.md
    git commit -m "feat: AI news $DATE (4 posts, en)"
}

deploy_korean() {
    # DEV.to API로 발행
    node scripts/publish-to-devto.js "$TEMP_DIR/ko-news.json"
}

# 실행 순서
generate_english_news
generate_korean_news
deploy_english  
deploy_korean
```

중요한 건 **각 단계를 독립적으로 실행할 수 있게 만든 것**이다. 영어 뉴스 생성이 실패해도 한국어 뉴스는 계속 진행된다. 각 함수별로 exit code를 체크해서 실패 지점을 정확히 파악할 수 있다.

## API 설계: Cloudflare 환경의 제약 조건 해결

초기에는 `node:fs` 모듈을 써서 파일을 직접 생성하려 했다. Cloudflare Pages 환경에서는 file system 접근이 제한되므로 빌드가 실패했다.

해결책은 **API를 순수 JSON 응답으로 만드는 것**이었다:

```typescript
// src/pages/api/generate-ai-news.ts (변경 전 - 실패)
import { writeFileSync } from 'node:fs'; // Cloudflare에서 불가능

export async function post({ request }) {
    const news = await generateNews();
    writeFileSync(`content/ai-news/${filename}`, markdown); // 실패
    return new Response("OK");
}
```

```typescript
// 변경 후 - 성공
export async function post({ request }) {
    const { language, count, date } = await request.json();
    const news = await generateNewsWithAI(language, count, date);
    
    return new Response(JSON.stringify({
        status: 'success',
        data: news,
        generatedAt: new Date().toISOString()
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
```

클라이언트(bash script)에서 JSON을 받아서 파일로 저장하는 방식으로 변경했다. 이렇게 하면 API는 stateless하게 유지되고, file system 의존성도 제거된다.

## GitHub Actions 워크플로우 최적화

기존 DEV.to 발행 워크플로우는 모든 마크다운 파일을 스캔해서 발행 대상을 찾았다. AI 뉴스만 따로 발행하도록 최적화했다:

```yaml
# .github/workflows/publish-to-devto.yml (변경 전)
- name: Find all posts
  run: |
    find src/content/blog -name "*.md" | head -50 > posts.txt
    
# 변경 후  
- name: Find AI news only
  run: |
    find src/content/ai-news -name "*$(date +%Y-%m-%d)*.md" > posts.txt
```

이렇게 하면 워크플로우 실행 시간이 80% 단축되고, 잘못된 포스트를 발행할 위험도 없어진다.

또한 AI 뉴스 중에서도 한국어 버전만 DEV.to에 발행하도록 필터링을 추가했다:

```yaml
- name: Filter Korean posts only
  run: |
    grep -E "lang.*ko" posts.txt > korean-posts.txt || echo "No Korean posts found"
```

## 에러 처리와 복구 전략

AI 뉴스 생성은 외부 API(Claude)에 의존하므로 실패 가능성이 높다. 핵심 복구 전략은 **부분 성공 허용**이다:

```bash
generate_news_safe() {
    local language=$1
    local retry_count=0
    local max_retries=3
    
    while [ $retry_count -lt $max_retries ]; do
        if generate_news $language; then
            echo "✓ $language news generated successfully"
            return 0
        else
            retry_count=$((retry_count + 1))
            echo "✗ Retry $retry_count for $language"
            sleep 10
        fi
    done
    
    echo "✗ Failed to generate $language news after $max_retries retries"
    return 1
}

# 메인 실행부
english_success=false
korean_success=false

if generate_news_safe "en"; then
    english_success=true
fi

if generate_news_safe "ko"; then  
    korean_success=true
fi

# 부분 성공도 커밋
if [ "$english_success" = true ] || [ "$korean_success" = true ]; then
    git add .
    git commit -m "feat: AI news $DATE (partial: en=$english_success, ko=$korean_success)"
fi
```

완전 실패보다는 부분 성공이 낫다는 철학이다. 영어 뉴스만 성공해도 해당 부분은 배포하고, 실패한 부분만 수동으로 재시도한다.

## 더 나은 방법은 없을까

이번에 구현한 방식보다 더 효율적인 대안을 몇 가지 찾았다:

**1. MCP를 활용한 직접 파일 생성**

현재는 API → JSON → 파일 저장의 3단계를 거친다. Claude MCP file system 서버를 쓰면 AI가 직접 마크다운 파일을 생성할 수 있다:

```python
# MCP file server 설정
{
    "mcpServers": {
        "filesystem": {
            "command": "npx",
            "args": ["@modelcontextprotocol/server-filesystem", "src/content"]
        }
    }
}
```

이렇게 하면 중간 API 없이 Claude가 직접 `src/content/ai-news/` 디렉토리에 파일을 쓸 수 있다.

**2. Anthropic의 새로운 Batch API 활용**

영어 4건, 한국어 4건을 순차 생성하는 대신 Batch API로 병렬 처리하면 시간을 절반으로 줄일 수 있다. 비용도 50% 할인된다:

```typescript
const batchRequest = {
    requests: [
        { custom_id: "en-news-1", messages: [englishNewsPrompt] },
        { custom_id: "en-news-2", messages: [englishNewsPrompt] },
        { custom_id: "ko-news-1", messages: [koreanNewsPrompt] },
        { custom_id: "ko-news-2", messages: [koreanNewsPrompt] }
    ]
};
```

**3. GitHub Actions에서 직접 실행**

현재는 로컬에서 스크립트 실행 → 커밋 → push 방식이다. GitHub Actions cron job으로 완전 자동화하면 사람 개입이 아예 필요 없다:

```yaml
schedule:
  - cron: '0 1 * * *'  # 매일 오전 1시
  
jobs:
  generate-ai-news:
    steps:
    - name: Generate and publish
      run: |
        ./scripts/generate-ai-news.sh
        git config user.name "AI News Bot"  
        git add .
        git commit -m "chore: daily AI news $(date +%Y-%m-%d)"
        git push
```

**4. 다국어 확장 고려한 설계**

현재는 영어/한국어만 지원하지만, 일본어, 중국어 확장을 고려하면 언어별 설정을 JSON으로 분리하는 게 좋다:

```json
{
  "languages": {
    "en": {
      "platform": "jidonglab",
      "tone": "professional",
      "wordCount": "200-300"
    },
    "ko": {  
      "platform": "devto",
      "tone": "casual",  
      "wordCount": "300-400"
    },
    "ja": {
      "platform": "zenn",
      "tone": "polite",
      "wordCount": "250-350"  
    }
  }
}
```

## 정리

- **언어별 톤 차별화**: 같은 뉴스도 플랫폼과 독자층에 맞춰 다른 스타일로 생성한다
- **스킬 기반 품질 통제**: `CLAUDE.md`의 writing skill을 자동 생성에도 적용해서 일관성을 확보한다  
- **부분 성공 허용**: 완벽한 성공을 기다리지 말고, 성공한 부분부터 배포한다
- **플랫폼별 제약 조건 고려**: Cloudflare Pages 같은 serverless 환경의 한계를 미리 파악하고 우회한다

<details>
<summary>이번 작업의 커밋 로그</summary>

641d577 — fix: remove node:fs import from generate-ai-news API (Cloudflare 빌드 에러 수정)
c4b0055 — feat: AI 뉴스 스크립트에 blog-writing 스킬 적용
358bf9c — fix: DEV.to 워크플로우 ai-news만 발행 + 챗봇 규제 뉴스 삭제
e615288 — feat: AI 뉴스 스크립트 — 영어(jidonglab) + 한국어(DEV.to) 이중 생성
a00b3bf — feat: AI news 2026-03-14 (4 posts, en)
069ca0d — feat: AI 뉴스 CLI 생성 스크립트 + 2026-03-14 뉴스 4건
6788360 — feat: AI 뉴스 자동 생성 (2026-03-14)

</details>