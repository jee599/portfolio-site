---
title: "AI로 뉴스 콘텐츠 자동 생성하는 완전한 워크플로우 — 스크립트부터 배포까지"
project: "portfolio-site"
date: 2026-03-14
lang: ko
tags: [feat, fix, typescript]
---

AI에게 콘텐츠를 만들게 하는 건 쉽다. 하지만 품질 있는 콘텐츠를 **지속적으로** 만들어내는 자동화 시스템을 구축하는 건 다른 문제다. 이번에 AI 뉴스 자동 생성 시스템을 만들면서 배운 프롬프트 엔지니어링과 워크플로우 설계법을 공유한다.

## 배경: 무엇을 만들고 있는가

`jidonglab.com`에서 AI 업계 뉴스를 매일 업데이트하려고 한다. 목표는 단순하다. AI가 뉴스를 찾아서 분석하고 글을 써서 자동으로 발행하는 것. 하지만 실제로 만들어보니 고려해야 할 게 많았다.

- 영어(jidonglab.com)와 한국어(DEV.to) 두 플랫폼에 각각 최적화된 버전 생성
- 같은 뉴스가 중복으로 올라가지 않게 중복 제거
- 블로그 스타일에 맞는 일관된 톤앤매너 유지
- GitHub Actions를 통한 완전 자동화 배포

핵심은 "한번 설정하면 계속 돌아가는" 시스템을 만드는 것이었다.

## Claude에게 뉴스 작성 스킬을 학습시키는 법

가장 중요한 건 AI에게 "좋은 뉴스 글"이 뭔지 정확히 알려주는 것이다. 단순히 "뉴스 써줘"라고 하면 안 된다. 

### blog-writing 스킬 적용

`scripts/generate-ai-news.sh`에서 Claude의 `blog-writing` 스킬을 활용했다. 이 스킬은 단순한 요약이 아니라 독자에게 유용한 인사이트를 제공하는 글쓰기 패턴이다.

```bash
# 스크립트에서 Claude에게 전달하는 컨텍스트
SKILL_CONTEXT="blog-writing 스킬을 활용해서 AI 업계 전문가가 쓰는 것 같은 뉴스 분석글을 작성한다"
```

여기서 핵심은 "뉴스 분석글"이라는 표현이다. 단순 번역이나 요약이 아니라 **분석과 인사이트**를 요구하는 것이다.

좋은 프롬프트:
> "blog-writing 스킬을 활용해서 AI 업계 뉴스를 분석하는 글을 써줘. 기술적 배경, 업계에 미치는 영향, 향후 전망을 포함해야 한다. 독자는 AI 개발자와 기술 창업자다."

나쁜 프롬프트:
> "이 뉴스 요약해줘"

### 언어별 톤앤매너 차별화

같은 뉴스라도 플랫폼에 따라 다른 스타일로 써야 한다. 영어 버전은 글로벌 독자를 위해 간결하고 팩트 중심으로, 한국어 버전은 더 자세한 맥락 설명과 분석을 넣는다.

```bash
if [[ "$lang" == "en" ]]; then
    TONE="concise, fact-focused for global tech audience"
    TARGET_WORDS="300-400"
else
    TONE="detailed analysis with context for Korean developers"  
    TARGET_WORDS="400-600"
fi
```

이렇게 하는 이유는 간단하다. jidonglab.com 독자들은 빠른 업데이트를 원하고, DEV.to 독자들은 더 깊은 이해를 원한다.

## 중복 제거와 파일명 표준화 전략

AI가 뉴스를 생성할 때 가장 큰 문제는 **중복**이다. 같은 뉴스가 제목만 살짝 다르게 여러 번 생성되는 경우가 많다.

### 파일명 기반 중복 제거

커밋 `358bf9c`에서 중복 뉴스를 삭제한 패턴을 보면, 파일명 표준화가 중요하다는 걸 알 수 있다.

```
삭제: 2026-03-14-ai-legislation-chatbot-safety.md
유지: 2026-03-14-ai-chatbot-safety-legislation.md
```

AI에게 파일명 생성 규칙을 명확히 줘야 한다:

> "파일명은 `YYYY-MM-DD-주요키워드-부가키워드.md` 형식으로 만든다. 주요키워드는 회사명 또는 기술명, 부가키워드는 핵심 내용이다. 예: `2026-03-14-anthropic-partner-network-100m.md`"

### 스크립트 레벨에서 중복 방지

```bash
# 기존 파일명 패턴 체크
existing_files=$(ls src/content/ai-news/${DATE}-*.md 2>/dev/null || true)

if echo "$existing_files" | grep -q "$base_filename"; then
    echo "Similar news already exists: $base_filename"
    continue
fi
```

이런 식으로 생성 전에 미리 체크하는 게 효과적이다. 생성 후에 삭제하는 것보다 비용도 절약되고 워크플로우도 깔끔하다.

## GitHub Actions 워크플로우 최적화

`.github/workflows/publish-to-devto.yml`에서 53줄이 삭제된 걸 보면, 초기에 과도하게 복잡했다는 뜻이다. 자동화에서 가장 중요한 건 **단순함**이다.

### ai-news만 선별적으로 발행

```yaml
# Before: 모든 블로그 포스트를 발행
- name: Publish all posts

# After: ai-news 디렉토리만 타겟팅  
- name: Publish AI news only
  run: |
    find src/content/ai-news -name "*.md" -newer .last-publish | \
    while read file; do
      publish_to_devto "$file"
    done
```

이렇게 하는 이유는 블로그 포스트와 뉴스는 발행 전략이 다르기 때문이다. 블로그는 수동 검토 후 발행하고, 뉴스는 생성 즉시 자동 발행한다.

### 워크플로우 트리거 최적화

```yaml
on:
  push:
    paths:
      - 'src/content/ai-news/**'
  schedule:
    - cron: '0 9 * * *'  # 매일 오전 9시
```

`paths` 필터를 쓰면 AI 뉴스가 추가됐을 때만 발행 워크플로우가 실행된다. 불필요한 빌드를 방지하고 비용을 절약할 수 있다.

## 멀티 언어 콘텐츠 생성의 프롬프트 패턴

같은 소스로 여러 언어의 콘텐츠를 만들 때 가장 중요한 건 **번역이 아닌 현지화**다.

### 컨텍스트 기반 현지화 프롬프트

```bash
# 영어 버전
claude_prompt="Write an AI industry news analysis for global tech professionals. 
Focus on: technical implications, market impact, competitive landscape.
Style: Professional, data-driven, concise.
Audience: CTOs, AI engineers, tech investors."

# 한국어 버전  
claude_prompt="한국 개발자와 기술 창업자를 위한 AI 업계 뉴스 분석을 작성한다.
포함사항: 기술적 배경 설명, 한국 시장에 미치는 영향, 실무 적용 방안.
스타일: 친근하지만 전문적, 실용적 인사이트 중심.
독자: 한국 개발자, 스타트업 창업자, 기술 기획자."
```

여기서 핵심은 단순히 언어만 바꾸는 게 아니라 **독자의 관심사와 맥락**을 다르게 설정하는 것이다.

### 메타데이터 일관성 유지

frontmatter도 언어별로 최적화해야 한다:

```markdown
# 영어 버전
title: "Anthropic Partner Network Reaches 100M Users"
tags: ["anthropic", "ai", "partnership", "growth"]

# 한국어 버전
title: "앤트로픽 파트너 네트워크 1억 사용자 돌파 — 한국 AI 시장에 미치는 영향"
tags: ["앤트로픽", "ai", "파트너십", "시장분석"]
```

제목에서부터 독자층이 다르다는 걸 반영한다. 영어는 팩트 중심, 한국어는 독자에게 미치는 영향까지 포함한다.

## Claude Code와 일반 스크립팅의 역할 분담

이번 작업에서 흥미로운 점은 Claude Code를 직접 쓰지 않고 bash 스크립트로 처리했다는 것이다. 언제 어떤 도구를 써야 하는지 판단 기준이 있다.

### Claude Code를 쓸 때
- 복잡한 로직이 필요한 코드 생성/리팩토링
- 멀티 파일 간의 의존성 분석  
- 코드 품질 검토와 최적화

### 일반 스크립팅을 쓸 때
- 반복적인 콘텐츠 생성 작업
- API 호출과 파일 시스템 조작
- 워크플로우 자동화

AI 뉴스 생성은 후자에 해당한다. 로직은 단순하지만 **일관성과 안정성**이 중요한 작업이다.

```bash
# 단순하지만 안정적인 패턴
for news_item in "${news_items[@]}"; do
    generate_content "$news_item" "$lang"
    validate_output "$output_file"
    if [[ $? -eq 0 ]]; then
        commit_and_push "$output_file"
    fi
done
```

이런 워크플로우는 Claude Code보다 bash가 더 적합하다.

## 더 나은 방법은 없을까

이번에 구축한 시스템도 개선할 여지가 많다. 더 효율적인 대안들을 살펴보자.

### RSS 피드 + Anthropic API 직접 호출

현재는 수동으로 뉴스 소스를 입력하지만, RSS 피드를 모니터링해서 자동으로 새 뉴스를 감지할 수 있다:

```bash
# RSS 파싱 + 자동 필터링
curl -s "$RSS_URL" | xmllint --format - | \
grep -E "(AI|artificial intelligence|machine learning)" | \
head -10 | while read item; do
    process_news_item "$item"
done
```

### MCP 서버로 뉴스 소스 통합

뉴스 API들(NewsAPI, Reddit, Hacker News)을 MCP 서버로 연결하면 더 다양한 소스에서 콘텐츠를 가져올 수 있다:

```json
{
  "mcpServers": {
    "news-aggregator": {
      "command": "node",
      "args": ["./mcp-servers/news-aggregator.js"],
      "env": {
        "NEWS_API_KEY": "${NEWS_API_KEY}",
        "REDDIT_CLIENT_ID": "${REDDIT_CLIENT_ID}"
      }
    }
  }
}
```

### 콘텐츠 품질 검증 자동화

현재는 생성된 콘텐츠를 그대로 발행하지만, 품질 검증 단계를 추가할 수 있다:

> "다음 기준으로 뉴스 글의 품질을 평가해줘: 1) 팩트 정확성 (0-10점), 2) 독자 유용성 (0-10점), 3) 문법/맞춤법 (0-10점). 총점 24점 미만이면 수정 제안을 해줘."

### 개인화된 뉴스 큐레이션

독자별 관심사에 따라 뉴스를 개인화할 수도 있다:

```yaml
# 독자 세그먼트별 태깅
segments:
  developers: ["api", "framework", "tools"]  
  executives: ["funding", "acquisition", "strategy"]
  researchers: ["paper", "breakthrough", "theory"]
```

각 세그먼트별로 다른 관점의 분석을 제공하는 것이다.

### 성능 최적화 관점

현재 시스템은 뉴스 4건을 순차적으로 생성한다. 병렬 처리로 속도를 높일 수 있다:

```bash
# 병렬 처리로 생성 시간 단축
echo "${news_items[@]}" | xargs -n1 -P4 -I{} \
    bash -c 'generate_news_article "{}"'
```

API 호출 비용은 늘어나지만 전체 실행 시간은 75% 단축된다.

## 정리

이번에 AI 뉴스 자동화 시스템을 구축하면서 배운 핵심 포인트들이다:

- AI에게 콘텐츠를 시킬 때는 단순 생성이 아닌 **스킬 기반 접근법**이 효과적이다
- 멀티 언어 콘텐츠는 번역이 아닌 **현지화 프롬프팅**으로 품질을 높인다  
- 자동화 워크플로우에서 가장 중요한 건 **중복 방지와 오류 처리**다
- Claude Code vs 일반 스크립팅은 작업의 **복잡성과 반복성**으로 판단한다

완전 자동화된 콘텐츠 생성 시스템을 만드는 건 단순히 AI에게 글쓰기를 시키는 것 이상이다. 전체 워크플로우를 설계하고 각 단계별로 적절한 도구와 프롬프트를 적용하는 시스템 엔지니어링이다.

<details>
<summary>이번 작업의 커밋 로그</summary>

c4b0055 — feat: AI 뉴스 스크립트에 blog-writing 스킬 적용  
358bf9c — fix: DEV.to 워크플로우 ai-news만 발행 + 챗봇 규제 뉴스 삭제  
e615288 — feat: AI 뉴스 스크립트 — 영어(jidonglab) + 한국어(DEV.to) 이중 생성  
a00b3bf — feat: AI news 2026-03-14 (4 posts, en)  
069ca0d — feat: AI 뉴스 CLI 생성 스크립트 + 2026-03-14 뉴스 4건  
6788360 — feat: AI 뉴스 자동 생성 (2026-03-14)

</details>