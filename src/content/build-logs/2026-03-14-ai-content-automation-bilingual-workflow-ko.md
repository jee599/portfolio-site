---
title: "AI 콘텐츠 생성 완전자동화 — 스크립트부터 이중 언어 발행까지"
project: "portfolio-site"
date: 2026-03-14
lang: ko
tags: [feat, typescript]
---

AI로 블로그나 뉴스 콘텐츠를 생성하는 건 이제 기본이다. 하지만 여러 플랫폼에 동시에 발행하고, 각기 다른 언어와 톤으로 변환하는 걸 완전자동화한 경우는 많지 않다. 이번엔 하나의 스크립트로 AI 뉴스를 생성해서 영어는 `jidonglab.com`에, 한국어는 `DEV.to`에 동시 발행하는 워크플로우를 만들었다.

## 배경: 무엇을 만들고 있는가

`jidonglab.com`은 개인 포트폴리오 겸 기술 블로그다. AI 관련 최신 뉴스를 매일 4건씩 발행하는데, 영어권과 한국어권 독자를 동시에 타겟으로 해야 했다. 기존엔 수동으로 뉴스를 선별하고 번역해서 올렸는데, 이걸 완전히 자동화하는 게 목표였다.

핵심 요구사항:
- 매일 4건의 AI 뉴스를 자동 생성
- 영어와 한국어 버전을 동시에 생성
- 각 언어별로 다른 플랫폼에 맞는 frontmatter와 포맷 적용
- Claude API를 활용한 고품질 콘텐츠 생성

## AI 뉴스 자동 생성: 프롬프트 엔지니어링이 핵심이다

AI로 뉴스 콘텐츠를 생성할 때 가장 중요한 건 **일관성**과 **품질**이다. 매일 생성되는 콘텐츠가 들쭉날쭉하면 안 되고, SEO와 가독성을 모두 챙겨야 한다.

### 효과적인 뉴스 생성 프롬프트 패턴

일반적인 "뉴스 써줘" 프롬프트는 쓸모없다. 구체적인 제약조건과 출력 포맷을 명시해야 한다:

> "2026-03-14 AI 뉴스 4건을 생성해줘. 각 뉴스는:
> - 제목: SEO 최적화, 50자 이내, 핵심 키워드 포함
> - 본문: 300-500단어, 기술적 정확성 우선
> - 출처: 신뢰할 수 있는 tech 미디어만 (TechCrunch, The Verge, Wired 등)
> - 톤: 중립적, 과장 금지, 팩트 중심
> - 카테고리: AI/ML, Robotics, Enterprise AI 중 하나
> - frontmatter: title, date, category, tags 포함"

이렇게 쓰면 안 된다:
> "AI 뉴스 좀 써줘"

### 언어별 톤 차별화 전략

같은 뉴스라도 영어와 한국어 버전의 톤을 다르게 가져가야 한다. 타겟 독자층이 다르기 때문이다:

**영어 버전 (jidonglab.com 용)**
```bash
> "Generate AI news in professional English tone:
> - Target: Tech professionals, startup founders
> - Style: Concise, data-driven, business impact focused  
> - Avoid: Hype, speculation, marketing speak
> - Include: Specific numbers, company names, technical details"
```

**한국어 버전 (DEV.to 용)**
```bash  
> "한국어 AI 뉴스 생성, 개발자 커뮤니티 타겟:
> - 톤: 친근하지만 전문적, 반말 사용
> - 스타일: 실무 관점, 개발자가 알아야 할 내용 위주
> - 포함 요소: 기술 스택, 오픈소스 여부, 한국 시장 영향
> - 피할 것: 번역체, 과도한 존댓말, 마케팅 용어"
```

### 멀티파일 생성과 컨텍스트 관리

`generate-ai-news.sh` 스크립트는 한 번 실행으로 8개 파일을 생성한다 (뉴스 4건 x 언어 2개). 이때 Claude가 각 파일의 맥락을 잃지 않게 하는 게 중요하다.

**파일 생성 순서 최적화**
```bash
# 1. 영어 원본 4건 먼저 생성
generate_english_news() {
  echo "Generating 4 English AI news articles..."
  # Claude에게 전체 4건을 한번에 요청
}

# 2. 각 영어 글을 한국어로 번역+로컬라이징
translate_to_korean() {
  for file in $english_files; do
    # 원본 내용을 참조해서 한국어 버전 생성
    # 단순 번역이 아니라 한국 독자 맞춤형 재작성
  done
}
```

이 순서가 중요한 이유는 Claude가 전체 맥락을 유지하면서도 각 언어별 특성을 반영할 수 있기 때문이다.

## Claude Code 에이전트 모드 vs 스크립트 모드

이 작업에서 Claude Code의 에이전트 모드와 CLI 스크립트 모드를 모두 활용했다. 각각 언제 쓰는지가 중요하다.

### 에이전트 모드: 탐색과 프로토타이핑

초기 스크립트를 설계할 때는 에이전트 모드를 썼다:

```bash
/agent "AI 뉴스 자동 생성 스크립트를 만들어줘. 
요구사항: 
- Claude API 호출로 뉴스 4건 생성
- 영어/한국어 동시 생성  
- frontmatter 자동 설정
- 파일명 자동 생성 (날짜-제목 기반)"
```

에이전트 모드의 장점:
- 요구사항을 대화식으로 구체화할 수 있다
- 여러 파일을 동시에 수정하면서 전체 구조를 잡는다
- 예외 상황이나 엣지 케이스를 미리 발견할 수 있다

### 스크립트 모드: 반복 실행과 자동화

실제 운영에서는 bash 스크립트로 완전 자동화했다:

```bash
#!/bin/bash
# generate-ai-news.sh

DATE=$(date +%Y-%m-%d)
NEWS_DIR="src/content/ai-news"

# Claude API 호출 함수
generate_news() {
  local lang=$1
  local prompt_file="prompts/ai-news-${lang}.txt"
  
  claude-cli --prompt-file $prompt_file \
           --output-dir $NEWS_DIR \
           --date $DATE
}

# 메인 실행
generate_news "en"
generate_news "ko"

echo "✓ Generated 4 English + 4 Korean AI news articles"
```

### MCP 서버로 외부 데이터 연동

뉴스 생성의 품질을 높이려면 실시간 데이터가 필요하다. MCP(Model Context Protocol) 서버를 설정해서 RSS 피드와 API 데이터를 Claude에게 직접 제공했다:

```json
// .claude/mcp.json
{
  "servers": {
    "news-feeds": {
      "command": "node",
      "args": ["mcp-servers/news-rss.js"],
      "env": {
        "FEEDS": "techcrunch,theverge,wired,arstechnica"
      }
    },
    "company-data": {
      "command": "python", 
      "args": ["mcp-servers/company-api.py"],
      "env": {
        "API_KEYS": "crunchbase,pitchbook"
      }
    }
  }
}
```

이렇게 하면 Claude가 최신 뉴스와 회사 정보를 실시간으로 참조해서 더 정확한 콘텐츠를 생성한다.

### CLAUDE.md로 품질 일관성 확보

매일 생성되는 콘텐츠의 품질이 들쭉날쭉하지 않게 하려면 `CLAUDE.md`에 명확한 가이드라인을 설정해야 한다:

```markdown
# AI News Generation Guidelines

## Content Standards
- Fact-check all claims with multiple sources
- Include specific numbers and dates
- Avoid speculation unless clearly marked
- Link to original sources

## Writing Style
### English Version (jidonglab.com)
- Professional, concise tone
- Business impact focus
- 300-500 words per article

### Korean Version (DEV.to)  
- Developer-friendly tone
- Use 반말 consistently
- Include technical implementation details
- 400-600 words per article

## File Naming Convention
- Format: `YYYY-MM-DD-{key-topic}-{company/tech}.md`
- Use kebab-case for slugs
- Max 60 characters total
```

이런 가이드라인이 있으면 Claude가 매일 일관된 품질의 콘텐츠를 생성한다.

## 이중 언어 발행 파이프라인: GitHub Actions 자동화

단순히 파일을 생성하는 것만으론 부족하다. 각 플랫폼에 맞는 포맷으로 변환하고 자동 발행까지 해야 완전한 자동화다.

### 플랫폼별 frontmatter 차별화

같은 콘텐츠라도 플랫폼마다 요구하는 메타데이터가 다르다:

**jidonglab.com (Astro)**
```yaml
---
title: "Nvidia Announces Rubin GPU Architecture at GTC 2026"
date: 2026-03-14
category: "ai-hardware" 
tags: ["nvidia", "gpu", "gtc", "rubin"]
author: "AI News Bot"
---
```

**DEV.to (DEV Community)**
```yaml
---
title: "엔비디아 GTC 2026에서 루빈 GPU 아키텍처 공개"
published: true
tags: ai, gpu, nvidia, hardware
canonical_url: https://jidonglab.com/ai-news/2026-03-14-nvidia-gtc-rubin
series: "AI 뉴스"
---
```

이런 차이점을 처리하는 변환 함수:

```bash
convert_frontmatter() {
  local platform=$1
  local source_file=$2
  
  case $platform in
    "devto")
      # Astro frontmatter를 DEV.to 형식으로 변환
      sed 's/category:/tags:/' $source_file | \
      sed 's/author:/# author:/' | \
      sed 's/date:/published: true\ndate:/'
      ;;
    "medium") 
      # Medium 형식으로 변환
      ;;
  esac
}
```

### GitHub Actions 워크플로우

매일 오전 9시에 자동으로 뉴스를 생성하고 발행하는 워크플로우:

```yaml
# .github/workflows/ai-news.yml
name: Generate AI News
on:
  schedule:
    - cron: '0 9 * * *'  # 매일 오전 9시
  workflow_dispatch:     # 수동 실행 가능

jobs:
  generate-news:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate AI News
        run: |
          chmod +x scripts/generate-ai-news.sh
          ./scripts/generate-ai-news.sh
        env:
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
          
      - name: Publish to DEV.to
        run: |
          python scripts/publish-devto.py
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          
      - name: Commit and Push
        run: |
          git add src/content/ai-news/
          git commit -m "feat: AI news $(date +%Y-%m-%d)"
          git push
```

## 더 나은 방법은 없을까

현재 방식도 나쁘지 않지만, 더 개선할 수 있는 부분들이 있다:

### 1. Tool Use로 실시간 팩트 체크

Anthropic의 Tool Use 기능을 활용하면 생성된 뉴스의 팩트를 실시간으로 검증할 수 있다:

```javascript
// tools/fact-checker.js
const tools = [
  {
    name: "verify_company_info",
    description: "Verify company valuation, funding, employee count",
    input_schema: {
      type: "object", 
      properties: {
        company: { type: "string" },
        claim: { type: "string" }
      }
    }
  },
  {
    name: "check_news_source", 
    description: "Verify if news source and date are accurate",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string" },
        headline: { type: "string" }
      }
    }
  }
];
```

### 2. Vector DB로 중복 콘텐츠 방지

매일 생성하다 보면 비슷한 뉴스가 중복될 수 있다. Pinecone이나 Qdrant 같은 vector DB에 기존 뉴스를 저장하고, 새 콘텐츠 생성 전에 유사도를 체크하는 방법:

```python
# scripts/dedup-checker.py
import pinecone
from sentence_transformers import SentenceTransformer

def check_similarity(new_title, threshold=0.8):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    new_embedding = model.encode([new_title])
    
    results = index.query(
        vector=new_embedding[0].tolist(),
        top_k=5,
        include_metadata=True
    )
    
    for match in results['matches']:
        if match['score'] > threshold:
            return f"Similar content exists: {match['metadata']['title']}"
    
    return None
```

### 3. A/B 테스트로 최적 프롬프트 찾기

여러 프롬프트 패턴을 동시에 테스트해서 어떤 방식이 더 나은 결과를 내는지 측정할 수 있다:

```bash
# A/B 테스트 스크립트
PROMPTS=("concise" "detailed" "technical" "business")

for prompt in "${PROMPTS[@]}"; do
  generate_with_prompt $prompt
  measure_quality $prompt  # 가독성, SEO 점수, 참여율 등
done

select_best_prompt
```

### 4. 비용 최적화: 더 작은 모델 활용

매일 생성하다 보면 API 비용이 만만치 않다. Claude 3.5 Haiku나 GPT-4o mini 같은 저렴한 모델로 1차 생성하고, Claude 3.5 Sonnet으로 품질 검증하는 2단계 파이프라인:

```bash
# 비용 효율적 생성 파이프라인
generate_draft() {
  # Haiku로 초안 생성 (저렴함)
  claude-3-5-haiku --prompt "$news_prompt" > draft.md
}

refine_content() {  
  # Sonnet으로 품질 향상 (정확함)
  claude-3-5-sonnet --prompt "Refine this draft: $(cat draft.md)" > final.md
}
```

### 5. 공식 문서 기반 개선

Anthropic의 공식 Best Practices에 따르면 긴 콘텐츠 생성할 때는 `<thinking>` 태그를 활용하라고 한다:

```xml
<thinking>
이 뉴스의 핵심 포인트는:
1. 기술적 혁신 내용
2. 시장 영향도  
3. 개발자/기업에게 미치는 의미

독자가 가장 궁금해할 부분: 실제 성능 개선 수치와 출시 일정
</thinking>

# 실제 뉴스 내용...
```

이렇게 하면 Claude가 더 구조화된 사고 과정을 거쳐서 품질 높은 콘텐츠를 생성한다.

## 정리

- **프롬프트 엔지니어링이 품질을 좌우한다**: 구체적인 제약조건과 출력 포맷을 명시해야 일관성 있는 콘텐츠가 나온다
- **언어별 톤 차별화가 핵심이다**: 같은 뉴스라도 타겟 독자에 맞춰 톤과 관점을 다르게 가져가야 한다  
- **MCP 서버로 실시간 데이터를 연동하면**: Claude가 더 정확하고 최신의 정보를 기반으로 콘텐츠를 생성한다
- **완전자동화까지 가려면 파이프라인이 중요하다**: 생성-변환-발행까지 전체 워크플로우를 설계해야 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

e615288 — feat: AI 뉴스 스크립트 — 영어(jidonglab) + 한국어(DEV.to) 이중 생성

a00b3bf — feat: AI news 2026-03-14 (4 posts, en)

069ca0d — feat: AI 뉴스 CLI 생성 스크립트 + 2026-03-14 뉴스 4건

6788360 — feat: AI 뉴스 자동 생성 (2026-03-14)

</details>