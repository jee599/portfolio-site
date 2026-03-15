---
title: "AI 에이전트로 다국어 뉴스 생성 자동화 — 스크립트 하나로 영어+한국어 동시 배포"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [fix, feat, chore, astro, typescript]
---

포트폴리오 사이트에 AI 뉴스 자동 생성 기능을 만들면서, 하나의 스크립트로 영어와 한국어 콘텐츠를 동시에 만들어 각각 다른 플랫폼에 배포하는 시스템을 구축했다. Claude를 활용한 콘텐츠 자동화에서 가장 중요한 건 **프롬프트 체인과 에러 핸들링**이었다.

## 배경: 무엇을 만들고 있는가

개인 포트폴리오 사이트 `jidonglab.com`에서 AI 관련 최신 뉴스를 매일 자동으로 생성해서 발행하는 시스템을 만들고 있었다. 요구사항은 명확했다:

- 영어 콘텐츠는 메인 사이트(`jidonglab.com`)에 게시
- 한국어 콘텐츠는 DEV.to 커뮤니티에 크로스포스팅
- 하루에 3-4개 뉴스 아이템을 처리
- 실제 뉴스 소스를 기반으로 한 팩트 기반 글쓰기

기존에는 수동으로 뉴스를 찾아서 쓰고 있었는데, 이걸 완전 자동화하면서도 품질을 유지하는 게 목표였다. 특히 다국어 처리와 플랫폼별 포맷팅이 핵심 과제였다.

## 프롬프트 체인으로 콘텐츠 품질 보장하기

AI에게 "뉴스 써줘"라고 하면 당연히 망한다. 콘텐츠 생성을 단계별로 쪼개서 각 단계마다 검증 로직을 넣어야 한다.

### 단계별 프롬프트 설계

첫 번째 단계에서는 뉴스 수집과 필터링:

> "2026-03-14 AI 관련 주요 뉴스 3-4개를 찾아라. 조건: 1) 실제 기업 발표나 제품 출시 2) 규제나 정책 변화 3) 기술적 혁신이나 연구 결과. 루머나 추측성 기사 제외. 각 뉴스마다 원본 소스 URL 필수."

이 단계에서 중요한 건 **제약 조건을 명확히 주는 것**이다. "주요 뉴스"라고 하면 AI가 판단하기 어렵다. 구체적인 카테고리와 배제 조건을 줘야 한다.

두 번째 단계에서는 언어별 콘텐츠 생성:

> "위 뉴스를 기반으로 영어 블로그 포스트를 작성해라. 조건: 1) 제목 50자 이내 2) 본문 300-500단어 3) 팩트만 포함, 추측 금지 4) SEO 친화적 구조 5) 기술 용어는 설명 추가. frontmatter는 title, description, tags, publishedAt 포함."

같은 뉴스로 한국어 버전도 생성:

> "같은 내용으로 한국어 블로그 포스트 작성. 추가 조건: 1) DEV.to 한국 커뮤니티 독자 대상 2) 개발자 관점에서 해석 추가 3) 국내 상황과 연결점 언급 4) 반말 문체 사용 5) 태그는 한영 혼용."

### 검증과 피드백 루프

생성된 콘텐츠를 바로 발행하지 않고 검증 단계를 거친다:

```bash
# generate-ai-news.sh의 일부
validate_content() {
    local file=$1
    local min_words=200
    local word_count=$(wc -w < "$file")
    
    if [ $word_count -lt $min_words ]; then
        echo "WARNING: $file has only $word_count words (minimum: $min_words)"
        return 1
    fi
    
    # frontmatter 검증
    if ! grep -q "title:" "$file"; then
        echo "ERROR: $file missing title in frontmatter"
        return 1
    fi
    
    return 0
}
```

AI가 생성한 파일이 최소 기준을 만족하지 않으면 다시 생성하도록 한다. 이런 검증 로직 없이는 빈 파일이나 깨진 frontmatter를 가진 글이 발행될 수 있다.

## Astro + Cloudflare Pages 환경에서 AI 스크립트 통합

정적 사이트 생성기인 Astro에서 AI 콘텐츠 생성을 어떻게 통합할지가 관건이었다. 특히 Cloudflare Pages 환경에서는 Node.js 런타임 제약이 있어서 조심스럽게 접근해야 했다.

### 빌드타임 vs 런타임 전략

처음에는 API 엔드포인트(`/api/generate-ai-news`)로 만들어서 런타임에 생성하려고 했다:

```typescript
// src/pages/api/generate-ai-news.ts (초기 버전)
export async function POST({ request }) {
    const { date } = await request.json();
    
    // Claude API 호출
    const news = await generateAINews(date);
    
    // 파일 시스템 쓰기 (여기서 문제!)
    await writeNewsFiles(news);
    
    return new Response(JSON.stringify({ success: true }));
}
```

하지만 Cloudflare Pages에서는 `node:fs` 모듈을 쓸 수 없다. 파일 시스템 접근이 제한되어 있어서 콘텐츠 파일을 직접 생성할 수 없었다.

해결책은 **빌드타임 생성으로 전환**하는 것이었다:

```bash
# scripts/generate-ai-news.sh
generate_news() {
    local target_date=$1
    local lang=$2
    
    # Claude CLI로 뉴스 생성
    claude chat --model claude-3-5-sonnet-20241022 \
        --system-prompt "$(cat prompts/news-${lang}.txt)" \
        --message "Generate AI news for ${target_date}" \
        > "temp_news_${lang}.json"
    
    # JSON 파싱해서 마크다운 파일 생성
    parse_and_create_files "temp_news_${lang}.json" "$lang"
}
```

GitHub Actions에서 이 스크립트를 실행해서 콘텐츠를 생성하고, 생성된 파일을 커밋해서 다시 빌드를 트리거하는 방식으로 바꿨다.

### MCP 서버 활용한 콘텐츠 관리

Claude Desktop의 MCP(Model Context Protocol) 기능을 활용해서 로컬 개발 환경을 최적화했다. `claude_desktop_config.json`에 파일시스템 MCP 서버를 연결:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/path/to/jidonglab.com"],
      "env": {}
    }
  }
}
```

이렇게 하면 Claude가 프로젝트 폴더 구조를 이해하고, 기존 뉴스 글의 패턴을 학습해서 일관성 있는 콘텐츠를 생성할 수 있다. 특히 frontmatter 포맷이나 태그 컨벤션을 자동으로 맞춰준다.

### 에러 핸들링과 복구 전략

AI 콘텐츠 생성에서 가장 중요한 건 **언제든 실패할 수 있다는 전제**다. API 호출 실패, 파싱 에러, 품질 기준 미달 등 다양한 실패 시나리오에 대비해야 한다.

```bash
# 재시도 로직
retry_generation() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt/$max_attempts"
        
        if generate_news "$1" "$2"; then
            echo "Success on attempt $attempt"
            return 0
        fi
        
        echo "Attempt $attempt failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    echo "All attempts failed"
    return 1
}
```

또한 부분 실패 상황에 대한 대응도 중요하다. 4개 뉴스 중 2개만 성공했다면, 실패한 2개는 건너뛰고 성공한 2개라도 발행하는 게 낫다:

```bash
# 부분 성공 허용
successful_files=0
for news_item in "${news_items[@]}"; do
    if generate_single_news "$news_item"; then
        ((successful_files++))
    else
        echo "Skipping failed news: $news_item"
    fi
done

if [ $successful_files -gt 0 ]; then
    echo "Publishing $successful_files news items"
    commit_and_deploy
else
    echo "No successful news items, aborting"
    exit 1
fi
```

## 다국어 콘텐츠의 품질 일관성 유지

영어와 한국어 콘텐츠를 동시에 생성할 때 가장 어려운 부분은 **톤앤매너 일관성**이다. 같은 뉴스라도 언어별로 독자층이 다르고, 플랫폼 특성도 다르다.

### 언어별 프롬프트 전략

영어 콘텐츠는 국제적 맥락과 기술적 정확성에 집중:

> "Write for international developer audience. Focus on technical implications and global market impact. Use formal but accessible tone. Include relevant technical terms with brief explanations. Structure: headline, key points, technical details, industry impact."

한국어 콘텐츠는 국내 상황 연결과 실용적 관점 강조:

> "한국 개발자 커뮤니티 대상으로 작성. 국내 관련 기업이나 정책과 연결점 찾아서 언급. 반말 사용하되 전문성 유지. 실제 개발 현장에서 어떤 의미인지 해석 추가. 구조: 핵심 내용, 국내 상황 연결, 개발자 관점 분석."

### 콘텐츠 검증 체크리스트

AI가 생성한 콘텐츠가 기준을 만족하는지 체크하는 자동 검증:

```bash
validate_english_content() {
    local file=$1
    
    # 기본 구조 검증
    if ! grep -q "^# " "$file"; then
        echo "Missing main heading"
        return 1
    fi
    
    # 영어 콘텐츠 특화 검증
    if ! grep -qE "(impact|development|technology|innovation)" "$file"; then
        echo "Missing key technical terms"
        return 1
    fi
    
    # 단어 수 검증 (영어는 300-500 단어)
    word_count=$(wc -w < "$file")
    if [ $word_count -lt 300 ] || [ $word_count -gt 500 ]; then
        echo "Word count out of range: $word_count"
        return 1
    fi
    
    return 0
}

validate_korean_content() {
    local file=$1
    
    # 한국어 특화 검증
    if ! grep -qE "(개발자|기술|국내)" "$file"; then
        echo "Missing Korean context keywords"
        return 1
    fi
    
    # 반말 체크 (간단한 휴리스틱)
    formal_endings=$(grep -oE "[다요]\\." "$file" | wc -l)
    informal_endings=$(grep -oE "[다]\\." "$file" | wc -l)
    
    if [ $formal_endings -gt $informal_endings ]; then
        echo "Too much formal language detected"
        return 1
    fi
    
    return 0
}
```

### 크로스 플랫폼 포맷팅

같은 콘텐츠라도 플랫폼별로 다른 포맷팅이 필요하다. 메인 사이트는 Astro의 콘텐츠 컬렉션 형식, DEV.to는 그들만의 frontmatter 규칙이 있다.

```bash
# Astro 포맷 (영어)
generate_astro_format() {
    cat << EOF
---
title: "$title"
description: "$description"
publishedAt: $date
tags: ["AI", "Technology", "News"]
---

$content
EOF
}

# DEV.to 포맷 (한국어)  
generate_devto_format() {
    cat << EOF
---
title: "$title"
published: false
description: "$description"
tags: ai, 개발, 뉴스, 기술
cover_image: ""
canonical_url: ""
---

$content

---

> 이 글은 AI를 활용해 작성된 기술 뉴스입니다. [jidonglab.com](https://jidonglab.com)에서 더 많은 콘텐츠를 확인하세요.
EOF
}
```

## 더 나은 방법은 없을까

현재 방식은 동작하지만, 더 효율적인 대안들이 있다.

**Anthropic의 새로운 Batch API 활용**: 현재는 뉴스 아이템마다 개별 API 호출을 하는데, Batch API를 쓰면 비용을 50% 절약하고 rate limit 걱정도 덜 수 있다. 다만 응답 시간이 24시간까지 걸릴 수 있어서 실시간성이 필요한 뉴스에는 부적합할 수 있다.

**MCP의 새로운 툴들 조합**: `@modelcontextprotocol/server-brave-search`로 실시간 뉴스 검색하고, `@modelcontextprotocol/server-github`로 직접 커밋까지 하는 완전 자동화 파이프라인을 만들 수 있다. 현재보다 훨씬 깔끔한 워크플로우가 가능하다.

**Claude Computer Use 베타 활용**: 웹 브라우징으로 실제 뉴스 사이트를 읽고 스크린샷까지 찍어서 더 풍부한 콘텐츠를 만들 수 있다. 단, 아직 베타라서 프로덕션 환경에는 위험하다.

**GitHub Actions 대신 Cloudflare Workers Cron**: 현재는 GitHub Actions에서 스크립트 실행하는데, Cloudflare Workers의 cron triggers를 쓰면 더 안정적이고 빠르다. 특히 Cloudflare Pages와의 통합이 네이티브라서 빌드 트리거도 더 효율적이다.

**벡터 DB 활용한 중복 제거**: 현재는 날짜별로만 구분하는데, Pinecone이나 Supabase Vector로 콘텐츠 임베딩을 저장해서 유사한 뉴스는 자동으로 필터링할 수 있다. 특히 AI 뉴스는 같은 소재로 여러 매체가 다루는 경우가 많아서 유용하다.

## 정리

- **프롬프트 체인**: 단일 프롬프트로 전체 뉴스 생성하지 말고, 수집→검증→생성→포맷팅으로 단계를 나눠라
- **에러 핸들링**: AI는 언제든 실패할 수 있다는 전제로 재시도 로직과 부분 성공 처리를 반드시 구현해라
- **플랫폼별 최적화**: 런타임 제약이 있는 환경(Cloudflare Pages)에서는 빌드타임 생성으로 우회해라
- **MCP 활용**: 로컬 개발에서는 MCP 서버로 Claude가 프로젝트 구조를 이해하게 해서 일관성 높여라

<details>
<summary>이번 작업의 커밋 로그</summary>

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