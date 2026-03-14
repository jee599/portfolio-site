#!/bin/bash
# AI 뉴스 생성 스크립트 — Claude Code CLI 사용 (구독 모델)
# 크롤링 소스: Google, X/Twitter, Reddit, Threads, 글로벌 뉴스
# Usage: ./scripts/generate-ai-news.sh

set -uo pipefail

# Claude CLI는 OAuth(구독) 인증 사용. 잘못된 API 키가 있으면 제거
unset ANTHROPIC_API_KEY 2>/dev/null || true

# cron 환경에서 PATH 설정
export PATH="/Users/jidong/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NEWS_DIR="$PROJECT_DIR/src/content/ai-news"
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
오늘은 __TODAY__이다. AI/LLM 관련 최신 뉴스를 크롤링해서 jidonglab.com용 뉴스 포스트를 생성해라.

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

## 포스트 생성 규칙

선별된 각 주제별로 별도의 마크다운 파일을 Write 도구로 생성해라.

파일 경로: __NEWS_DIR__/__TODAY__-{slug}.md
slug는 영문 kebab-case (예: claude-partner-network-100m)

### Frontmatter 형식 (YAML):
```
---
title: "구체적이고 명확한 제목"
date: __TODAY__
model: claude 또는 gemini 또는 gpt 또는 etc (가장 관련 깊은 모델, 범용이면 etc)
tags: [ai-news, 관련태그들]
summary: "2~3문장 요약 (존댓말)"
sources: ["url1", "url2"]
auto_generated: true
---
```

### 본문 규칙:
- **존댓말** 사용 ("~했습니다", "~입니다")
- 필수 섹션: ## 무슨 일이 있었나 → ## 관련 소식 → ## 개념 정리 또는 ## 수치로 보기 → ## 정리
- 각 섹션에 출처 링크: <small>[출처명](URL)</small>
- 최소 5,000자 (공백 포함)
- 불필요한 감탄사 없이 팩트 + 분석 위주
- 정리 섹션에서 시사점, 전망 등 분석적 의견 제시
- 관련 소식 섹션에서 해당 주제와 연관된 다른 뉴스, 기술 개념 설명 포함

반드시 Write 도구로 파일을 생성해라. 파일을 생성하지 않으면 실패다.
ENDOFPROMPT

# 날짜와 경로 치환
sed -i '' "s|__TODAY__|${TODAY}|g" "$PROMPT_FILE"
sed -i '' "s|__NEWS_DIR__|${NEWS_DIR}|g" "$PROMPT_FILE"

PROMPT_CONTENT=$(cat "$PROMPT_FILE")
rm -f "$PROMPT_FILE"

echo "[$TODAY] Claude CLI 실행 중..." | tee -a "$LOG_FILE"

# Claude CLI 실행
claude -p \
  --model sonnet \
  --permission-mode bypassPermissions \
  --allowedTools "WebSearch WebFetch Write" \
  --max-budget-usd 1.0 \
  --no-session-persistence \
  "$PROMPT_CONTENT" 2>&1 | tee -a "$LOG_FILE"

CLAUDE_EXIT=$?
echo "" | tee -a "$LOG_FILE"
echo "[$TODAY] Claude CLI 종료 코드: ${CLAUDE_EXIT}" | tee -a "$LOG_FILE"

# 생성된 파일 확인
GENERATED=$(find "$NEWS_DIR" -name "${TODAY}-*.md" 2>/dev/null | wc -l | tr -d ' ')
echo "[$TODAY] 생성 완료: ${GENERATED}개 포스트" | tee -a "$LOG_FILE"

if [ "$GENERATED" -eq "0" ]; then
  echo "[$TODAY] ERROR: 뉴스가 생성되지 않았다" | tee -a "$LOG_FILE"
  exit 1
fi

# 생성된 파일 목록
find "$NEWS_DIR" -name "${TODAY}-*.md" -exec ls -la {} \; | tee -a "$LOG_FILE"

# git commit & push
cd "$PROJECT_DIR"
git add src/content/ai-news/
git commit -m "feat: AI 뉴스 자동 생성 (${TODAY})" || true
git push origin main || echo "[$TODAY] WARNING: git push 실패" | tee -a "$LOG_FILE"

echo "[$TODAY] 완료" | tee -a "$LOG_FILE"
