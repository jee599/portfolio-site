---
title: "AI 뉴스 자동 생성 파이프라인 — shell script와 Claude로 다국어 콘텐츠 생산하는 법"
project: "portfolio-site"
date: 2026-03-14
lang: ko
tags: [fix, feat, typescript]
---

AI로 매일 뉴스 4건씩 영어와 한국어로 자동 생성하는 시스템을 만들었다. shell script 하나로 Claude에게 번역과 파일 생성을 시키고, GitHub Actions로 DEV.to에 자동 발행까지 연결했다. 이 과정에서 발견한 멀티 locale 콘텐츠 생산의 핵심 패턴들을 정리한다.

## 배경: 무엇을 만들고 있는가

포트폴리오 사이트에서 AI 뉴스 섹션을 운영한다. 매일 4건의 뉴스를 영어로 작성하고, 한국어 버전은 DEV.to에 발행한다. 수동으로 하면 하루에 2시간은 걸리는 작업이었다. 

이번 작업의 목표는 명확했다. Claude에게 뉴스 생성부터 번역, 파일 생성, 워크플로우 설정까지 모든 과정을 자동화시키는 것이다. 핵심은 "사람이 개입할 지점을 최소화"하면서도 품질을 유지하는 것이었다.

## shell script로 Claude를 조종하는 프롬프팅 전략

가장 먼저 해결해야 할 문제는 "어떻게 Claude에게 일관된 형식으로 뉴스를 생성시킬 것인가"였다. 4건의 뉴스를 각각 별도 파일로 만들어야 하는데, 매번 프롬프트를 치기엔 비효율적이다.

### 구조화된 출력을 강제하는 프롬프트 패턴

효과적인 프롬프트를 만들기 위해 "제약 조건 먼저, 형식 명시, 예시 제공" 순서로 접근했다.

> "오늘의 AI 뉴스 4건을 markdown 형식으로 생성해줘. 각 뉴스는 다음 구조를 따라야 한다:
> 
> - 파일명: YYYY-MM-DD-slug.md (slug는 kebab-case)  
> - frontmatter: title, date, tags, description 포함
> - 본문: 300-400자 사이, 기술적 배경 설명 포함
> - 제목은 클릭베이트 금지, 팩트 기반으로
> 
> 출력 형식: 
> ```
> === FILE: src/content/ai-news/파일명 ===
> (내용)
> === END ===
> ```

이렇게 쓰면 안 된다:
> "AI 뉴스 4건 써줘"

차이점은 명확하다. 첫 번째 프롬프트는 Claude가 "어떤 형식으로, 어떤 제약 조건하에, 어디에 저장할지"를 정확히 알 수 있다. 두 번째는 해석의 여지가 너무 많다.

### 파일 분리를 자동화하는 shell script 패턴

Claude의 출력을 받아서 실제 파일로 분리하는 부분이 핵심이다. `generate-ai-news.sh`에서 사용한 패턴이다:

```bash
# Claude 출력에서 파일별로 분리
awk '
/^=== FILE:/ { 
    filename = $3; 
    getline; 
    next 
}
/^=== END ===/ { 
    close(filename); 
    next 
}
filename { 
    print > filename 
}
'
```

이 방식의 장점은 Claude가 여러 파일을 한 번에 출력해도 자동으로 분리된다는 점이다. 사람이 복사-붙여넣기를 4번 할 필요가 없다.

### 다국어 생성의 단계별 접근법

처음엔 "영어와 한국어를 한번에 생성해줘"라고 했다가 품질 문제가 발생했다. 번역 톤이 일관되지 않고, 고유명사 처리도 불안정했다.

해결책은 단계를 나누는 것이었다:

1. 영어 원본 4건을 먼저 생성
2. 각 파일을 읽어서 한국어로 번역
3. 한국어 버전은 별도 slug와 frontmatter로 저장

```bash
# 1단계: 영어 원본 생성
claude_prompt="Generate 4 AI news articles in English..."

# 2단계: 각 파일별 번역
for file in src/content/ai-news/2026-03-14-*.md; do
    korean_content=$(claude_prompt="Translate this to Korean, maintain technical terms: $(cat $file)")
    # slug 변경 및 저장
done
```

이렇게 분리하니까 번역 품질이 확실히 올라갔다. Claude가 "번역"에만 집중할 수 있어서다.

## Claude Code에서 멀티파일 작업 최적화하기

스크립트 작업할 때 Claude Code의 agent 모드를 적극 활용했다. 특히 `CLAUDE.md`에 프로젝트 구조와 AI 뉴스 생성 규칙을 명시해뒀다.

### CLAUDE.md 설정의 핵심

```markdown
# AI News Generation Rules

## File Structure
- English: `src/content/ai-news/YYYY-MM-DD-slug.md`
- Korean (DEV.to): Same slug pattern
- Max 4 articles per day

## Content Guidelines
- 300-400 words per article
- Technical background required
- No clickbait titles
- Include source links

## Automation
- Use `scripts/generate-ai-news.sh`
- GitHub Actions publishes Korean version to DEV.to
- English stays on main site
```

이 설정이 있으니까 Claude가 "아 이 프로젝트는 이런 규칙으로 뉴스를 만드는구나"를 즉시 파악한다. 매번 설명할 필요가 없어진다.

### MCP 서버 없이도 파일 조작하기

원래는 filesystem MCP 서버를 쓸까 했는데, 이 정도 작업엔 과도했다. 대신 shell script와 Claude Code의 조합이 더 효율적이었다.

Claude Code에서 `/edit` 명령으로 여러 파일을 동시에 수정할 수 있다. 예를 들어 모든 블로그 파일의 frontmatter 형식을 일괄 변경할 때:

```
/edit src/content/blog/*.md
```

그러면 Claude가 패턴을 파악하고 일관되게 수정한다. 36개 파일을 한번에 처리한 게 바로 이 방식이다.

### hooks로 품질 관리 자동화

`pre-commit` hook을 설정해서 AI 생성 콘텐츠의 품질을 자동으로 검사한다:

```bash
#!/bin/sh
# .git/hooks/pre-commit

# AI 뉴스 파일 검증
for file in $(git diff --cached --name-only | grep "ai-news"); do
    # frontmatter 필수 필드 체크
    if ! grep -q "title:" "$file"; then
        echo "Error: Missing title in $file"
        exit 1
    fi
    
    # 글자 수 체크 (300-400자)
    wordcount=$(wc -w < "$file")
    if [ "$wordcount" -lt 250 ] || [ "$wordcount" -gt 500 ]; then
        echo "Warning: Word count issue in $file ($wordcount words)"
    fi
done
```

이렇게 하면 Claude가 실수로 형식을 틀려도 commit 전에 잡을 수 있다.

## GitHub Actions 워크플로우 최적화 전략

처음엔 모든 콘텐츠를 DEV.to에 발행했는데, 영어 글은 반응이 별로였다. 한국어만 발행하도록 워크플로우를 수정했다.

### 조건부 발행 패턴

```yaml
# .github/workflows/publish-to-devto.yml
- name: Publish to DEV.to
  run: |
    # ai-news 디렉토리의 한국어 파일만 처리
    for file in src/content/ai-news/*-kr.md; do
      if [[ -f "$file" ]]; then
        # DEV.to API 호출
        curl -X POST "https://dev.to/api/articles" \
          -H "api-key: ${{ secrets.DEVTO_API_KEY }}" \
          -H "Content-Type: application/json" \
          -d @"$file"
      fi
    done
  if: contains(github.event.head_commit.message, 'ai-news')
```

핵심은 commit 메시지에 `ai-news`가 있을 때만 워크플로우를 실행하는 것이다. 불필요한 API 호출을 줄인다.

### 에러 핸들링과 재시도 로직

API 호출이 실패할 수 있으니 재시도 로직을 추가했다:

```bash
retry_count=0
max_retries=3

while [ $retry_count -lt $max_retries ]; do
    response=$(curl -s -w "%{http_code}" -X POST ...)
    
    if [[ "${response: -3}" == "201" ]]; then
        echo "Published successfully: $file"
        break
    else
        retry_count=$((retry_count + 1))
        echo "Retry $retry_count/$max_retries for $file"
        sleep 5
    fi
done
```

이런 디테일이 자동화 시스템의 안정성을 결정한다.

## 더 나은 방법은 없을까

현재 방식도 잘 동작하지만, 몇 가지 개선점이 있다.

### Anthropic의 새로운 Batch API 활용

Anthropic이 2024년 말에 출시한 Batch API를 쓰면 비용을 50% 절약할 수 있다. 4건의 뉴스를 각각 처리하는 대신, 배치로 묶어서 처리하는 방식이다:

```javascript
// batch-generate-news.js
const batch = {
  requests: [
    {
      custom_id: "news-1",
      params: {
        model: "claude-3-sonnet-20240229",
        messages: [...]
      }
    },
    // ... 3개 더
  ]
}

const batchResponse = await anthropic.batches.create(batch);
```

실시간성이 중요하지 않은 뉴스 생성에는 이 방식이 더 효율적이다.

### Vercel AI SDK의 streamText 활용

현재는 shell script로 하지만, Vercel AI SDK의 `streamText`를 쓰면 실시간 피드백을 받으면서 생성할 수 있다:

```javascript
import { streamText } from 'ai';

const { textStream } = await streamText({
  model: anthropic('claude-3-sonnet-20240229'),
  prompt: newsPrompt,
  onChunk: (chunk) => {
    // 실시간으로 진행상황 표시
    console.log(chunk);
  }
});
```

이 방식은 긴 콘텐츠 생성할 때 "얼마나 남았는지" 알 수 있어서 UX가 좋다.

### RSS 파싱으로 소스 다양화

지금은 Claude가 알고 있는 뉴스만 쓰는데, RSS 피드를 파싱해서 최신 뉴스를 입력으로 주면 더 시의적절한 콘텐츠를 만들 수 있다:

```bash
# tech-rss-sources.txt에서 RSS 읽어오기
curl -s "https://techcrunch.com/feed/" | \
  xml2json | \
  jq '.rss.channel.item[0:10]' > latest-news.json

# Claude에게 전달
claude_prompt="Based on these latest news: $(cat latest-news.json), generate..."
```

### GitHub Copilot Workspace 통합

Microsoft가 발표한 Copilot Workspace를 쓰면 이슈 생성부터 PR까지 완전 자동화할 수 있다. "AI 뉴스 생성" 이슈를 만들면 자동으로 코드 변경하고 PR까지 올리는 방식이다.

다만 아직 preview 단계라 production에서 쓰기엔 이르다.

## 정리

- shell script + Claude 조합으로 멀티파일 생성을 자동화할 수 있다. 핵심은 구조화된 출력 형식을 강제하는 프롬프트다
- 다국어 콘텐츠는 단계별로 생성하는 게 품질이 좋다. 원본 생성 → 번역 순서로 분리한다  
- CLAUDE.md에 프로젝트별 규칙을 명시하면 매번 설명할 필요가 없어진다
- GitHub Actions의 조건부 실행과 재시도 로직으로 안정적인 자동화 파이프라인을 만든다

<details>
<summary>이번 작업의 커밋 로그</summary>

358bf9c — fix: DEV.to 워크플로우 ai-news만 발행 + 챗봇 규제 뉴스 삭제  
e615288 — feat: AI 뉴스 스크립트 — 영어(jidonglab) + 한국어(DEV.to) 이중 생성  
a00b3bf — feat: AI news 2026-03-14 (4 posts, en)  
069ca0d — feat: AI 뉴스 CLI 생성 스크립트 + 2026-03-14 뉴스 4건  
6788360 — feat: AI 뉴스 자동 생성 (2026-03-14)

</details>