#!/bin/bash
# AI 뉴스 생성 스크립트 — Claude Code CLI 사용 (구독 모델)
# 영어 → jidonglab.com + DEV.to (portfolio-site 워크플로우)
# 한국어 → DEV.to (dev_blog 워크플로우)
# Usage: ./scripts/generate-ai-news.sh

set -uo pipefail

# Claude CLI는 OAuth(구독) 인증 사용. 잘못된 API 키가 있으면 제거
unset ANTHROPIC_API_KEY 2>/dev/null || true

# cron 환경에서 PATH 설정
export PATH="/Users/jidong/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NEWS_DIR="$PROJECT_DIR/src/content/ai-news"
DEVTO_DIR="/Users/jidong/dev_blog/posts"
TODAY=$(date +%Y-%m-%d)
LOG_FILE="/tmp/ai-news-${TODAY}.log"

echo "[$TODAY] AI 뉴스 생성 시작" | tee "$LOG_FILE"

# 이미 오늘 생성된 뉴스가 있는지 확인
EXISTING=$(find "$NEWS_DIR" -name "${TODAY}-*.md" 2>/dev/null | wc -l | tr -d ' ')
if [ "$EXISTING" -gt "0" ]; then
  echo "오늘($TODAY) 이미 ${EXISTING}개 뉴스가 있다. 스킵." | tee -a "$LOG_FILE"
  exit 0
fi

# 프롬프트를 임시 파일로 생성
PROMPT_FILE=$(mktemp /tmp/ai-news-prompt-XXXXXX.txt)
cat > "$PROMPT_FILE" << 'ENDOFPROMPT'
오늘은 __TODAY__이다. AI/LLM 관련 최신 뉴스를 크롤링해서 두 가지 버전(영어 + 한국어)의 뉴스 포스트를 생성해라.

## 크롤링 소스 (WebSearch 도구 사용)

아래 쿼리로 각각 검색해서 최신 뉴스를 수집해라:

1. "AI news today __TODAY__" — 글로벌 AI 뉴스
2. "Claude Anthropic news __TODAY__" — Claude/Anthropic 소식
3. "OpenAI GPT news __TODAY__" — OpenAI 소식
4. "Google Gemini DeepMind news __TODAY__" — Google AI 소식
5. "LLM open source news __TODAY__" — 오픈소스 LLM (Llama, Mistral 등)
6. "AI startup funding __TODAY__" — AI 스타트업/투자 소식
7. "site:reddit.com AI news" — Reddit AI 커뮤니티
8. "site:x.com AI announcement" — X(Twitter) AI 관련

각 검색 결과에서 중요한 기사는 WebFetch로 본문을 읽어서 상세 내용을 파악해라.

## 뉴스 선별 기준

- 최근 48시간 이내 소식만
- 단순 루머나 의견이 아닌, 공식 발표/출시/연구 결과 위주
- 최소 3개, 최대 5개의 독립적인 주제를 선별

## 파일 생성 규칙 — 주제당 2개 파일 (영어 + 한국어)

각 주제별로 **2개 파일**을 Write 도구로 생성해라.

### 1. 영어 버전 → jidonglab.com + DEV.to

파일 경로: __NEWS_DIR__/__TODAY__-{slug}.md

Frontmatter:
```
---
title: "Key Keyword, One-Line Impact"
date: __TODAY__
model: claude 또는 gemini 또는 gpt 또는 etc
tags: [ai-news, related-tags]
summary: "120~155자 영어 description. 주요 키워드를 포함하고, 구체적 정보(숫자, 회사명, 제품명)를 넣는다."
sources: ["url1", "url2"]
auto_generated: true
---
```

영어 본문 스타일 (Stripe/Cloudflare 블로그 톤):
- 직역이 아니라 영어 독자 관점에서 다시 쓴다
- **SEO**: 제목과 첫 문단에 주요 키워드를 자연스럽게 포함한다. 보조 키워드는 H2와 본문에 분산 배치한다
- **제목**: "핵심 키워드, one-line impact" 패턴 (예: "Anthropic Partner Network, $100M Bet on Enterprise Channel")
- **훅 문단**: 놀라운 사실 또는 핵심 숫자로 바로 시작한다. 도입부에 메타 서술 넣지 않는다
- **H2 섹션**: 스토리텔링 헤딩 (## The $100M Question, ## Why This Matters). 서술적이고 호기심을 유발하는 제목
- **분량**: 2,000~4,000자 (영어 기준)
- **참고 링크**: 본문에 자연스럽게 녹이되, 글 하단에 ## References 섹션으로 모아서 정리한다
- **끝맺음**: 인용구(>) 형태로 핵심 메시지를 한 문장으로 압축한다
- **금지**: "In this blog post, we will explore" 같은 메타 서술, "Let's dive in!", "Without further ado" 같은 클리셰, 이모지, 불릿 포인트 남발

### DEV.to 영어 교차 게시 (canonical_url)

동일한 영어 콘텐츠를 DEV.to에도 게시할 경우, frontmatter에 canonical_url을 추가한다:
```
canonical_url: https://jidonglab.com/ai-news/{slug}
```

### 2. 한국어 버전 → DEV.to

파일 경로: __DEVTO_DIR__/__TODAY__-{slug}-ko.md

Frontmatter:
```
---
title: "핵심 키워드, 한 줄 임팩트"
published: true
description: "80~120자 한국어 설명. 주요 키워드를 포함하고, 구체적 정보(숫자, 회사명, 제품명)를 넣는다."
tags: ai, ainews, 관련태그1, 관련태그2
---
```

한국어 본문 스타일 (반말 해체 "~다/~이다"):
- "~습니다/~ㅂ니다" 절대 쓰지 않는다. "~다/~이다"로 통일
- **SEO**: 제목과 첫 문단에 주요 키워드를 자연스럽게 포함한다. 보조 키워드는 H2와 본문에 분산 배치한다
- **제목**: "핵심 키워드, 한 줄 임팩트" 패턴 (예: "Anthropic 파트너 네트워크, 엔터프라이즈 채널에 $100M 베팅")
- **훅 문단**: 놀라운 사실 또는 핵심 숫자로 바로 시작한다. 도입부에 메타 서술 넣지 않는다
- **H2 섹션**: 스토리텔링 헤딩 (## 두 가지 이상한 관찰에서 시작됐다, ## 숫자가 말해주는 것). 서술적이고 호기심을 유발하는 제목
- **분량**: 2,000~4,000자 (한국어 기준)
- **참고 링크**: 본문에 자연스럽게 녹이되, 글 하단에 ## 참고 링크 섹션으로 모아서 정리한다
- **끝맺음**: 인용구(>) 형태로 핵심 메시지를 한 문장으로 압축한다
- **금지**: "이 글에서는 ~에 대해 알아보겠습니다" 같은 교과서 도입, 이모지, 불릿 포인트 남발, "~습니다" 존댓말

### DEV.to 태그 규칙
- 최대 4개, 영문 소문자, 하이픈 없음 (ainews, claude, openai, gemini, llm, opensource 등)

반드시 Write 도구로 모든 파일을 생성해라. 파일을 생성하지 않으면 실패다.
ENDOFPROMPT

# 날짜와 경로 치환
sed -i '' "s|__TODAY__|${TODAY}|g" "$PROMPT_FILE"
sed -i '' "s|__NEWS_DIR__|${NEWS_DIR}|g" "$PROMPT_FILE"
sed -i '' "s|__DEVTO_DIR__|${DEVTO_DIR}|g" "$PROMPT_FILE"

PROMPT_CONTENT=$(cat "$PROMPT_FILE")
rm -f "$PROMPT_FILE"

echo "[$TODAY] Claude CLI 실행 중..." | tee -a "$LOG_FILE"

# Claude CLI 실행
claude -p \
  --model sonnet \
  --permission-mode bypassPermissions \
  --allowedTools "WebSearch WebFetch Write" \
  --max-budget-usd 2.0 \
  --no-session-persistence \
  "$PROMPT_CONTENT" 2>&1 | tee -a "$LOG_FILE"

CLAUDE_EXIT=$?
echo "" | tee -a "$LOG_FILE"
echo "[$TODAY] Claude CLI 종료 코드: ${CLAUDE_EXIT}" | tee -a "$LOG_FILE"

# 생성된 파일 확인
EN_COUNT=$(find "$NEWS_DIR" -name "${TODAY}-*.md" 2>/dev/null | wc -l | tr -d ' ')
KO_COUNT=$(find "$DEVTO_DIR" -name "${TODAY}-*-ko.md" 2>/dev/null | wc -l | tr -d ' ')
echo "[$TODAY] 영어(jidonglab): ${EN_COUNT}개, 한국어(DEV.to): ${KO_COUNT}개" | tee -a "$LOG_FILE"

if [ "$EN_COUNT" -eq "0" ] && [ "$KO_COUNT" -eq "0" ]; then
  echo "[$TODAY] ERROR: 뉴스가 생성되지 않았다" | tee -a "$LOG_FILE"
  exit 1
fi

# portfolio-site git push (영어 → jidonglab + DEV.to)
if [ "$EN_COUNT" -gt "0" ]; then
  echo "[$TODAY] portfolio-site push 중..." | tee -a "$LOG_FILE"
  cd "$PROJECT_DIR"
  git add src/content/ai-news/
  git commit -m "feat: AI news ${TODAY} (${EN_COUNT} posts, en)" || true
  git pull --rebase origin main 2>/dev/null || true
  git push origin main || echo "[$TODAY] WARNING: portfolio-site push 실패" | tee -a "$LOG_FILE"
fi

# dev_blog git push (한국어 → DEV.to)
if [ "$KO_COUNT" -gt "0" ]; then
  echo "[$TODAY] dev_blog push 중..." | tee -a "$LOG_FILE"
  cd "$DEVTO_DIR/.."
  git add posts/
  git commit -m "post: AI news ${TODAY} (${KO_COUNT} posts, ko)" || true
  git pull --rebase origin main 2>/dev/null || true
  git push origin main || echo "[$TODAY] WARNING: dev_blog push 실패" | tee -a "$LOG_FILE"
fi

echo "[$TODAY] 완료" | tee -a "$LOG_FILE"
