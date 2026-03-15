#!/bin/bash
# 빌드 로그 생성 — .jsonl 세션 기반
# Claude Code 대화 기록에서 프롬프트, 작업 과정, 삽질을 추출해서 빌드 로그를 만든다.
# Usage:
#   ./scripts/generate-build-log.sh --interactive
#   ./scripts/generate-build-log.sh --project saju_global
#   ./scripts/generate-build-log.sh --project saju_global --days 14

set -uo pipefail

unset ANTHROPIC_API_KEY 2>/dev/null || true
export PATH="/Users/jidong/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_LOGS_DIR="$PROJECT_DIR/src/content/build-logs"
PARSER="$SCRIPT_DIR/parse-sessions.py"
TODAY=$(date +%Y-%m-%d)
LOG_FILE="/tmp/build-log-${TODAY}.log"

INTERACTIVE=false
TARGET_PROJECT=""
DAYS=7

while [[ $# -gt 0 ]]; do
  case $1 in
    --interactive) INTERACTIVE=true; shift ;;
    --project) TARGET_PROJECT="$2"; shift 2 ;;
    --days) DAYS="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "[$TODAY] 빌드 로그 생성 시작 (jsonl 기반)" | tee "$LOG_FILE"

if [ ! -f "$PARSER" ]; then
  echo "ERROR: $PARSER 파일이 없다." | tee -a "$LOG_FILE"
  exit 1
fi

# 사용 가능 프로젝트 목록 가져오기
AVAILABLE=$(python3 "$PARSER" --list 2>&1 | grep '  ' | awk -F: '{print $1}' | tr -d ' ')

# 각 프로젝트의 마지막 빌드 로그 날짜
get_last_log_date() {
  local slug="$1"
  local latest=$(find "$BUILD_LOGS_DIR" -name "*-${slug}-ko.md" -o -name "*-${slug}-en.md" 2>/dev/null | sort -r | head -1)
  if [ -n "$latest" ]; then
    basename "$latest" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
  else
    echo "2024-01-01"
  fi
}

# 후보 프로젝트 수집
declare -a CANDIDATES=()
declare -a CANDIDATE_SLUGS=()
declare -a CANDIDATE_SINCE=()

echo "" | tee -a "$LOG_FILE"
echo "프로젝트 스캔 중..." | tee -a "$LOG_FILE"

while IFS= read -r slug; do
  [ -z "$slug" ] && continue
  if [ -n "$TARGET_PROJECT" ] && [ "$slug" != "$TARGET_PROJECT" ]; then
    continue
  fi

  last_date=$(get_last_log_date "$slug")

  # 세션 수 확인 (dry run: 임시 파일에 출력 후 크기 체크)
  TEMP_CHECK=$(mktemp /tmp/session-check-XXXXXX.md)
  session_info=$(python3 "$PARSER" --project "$slug" --since "$last_date" --output "$TEMP_CHECK" 2>&1 | head -1)
  session_count=$(echo "$session_info" | grep -oE '[0-9]+ sessions' | grep -oE '[0-9]+')
  rm -f "$TEMP_CHECK"

  if [ -z "$session_count" ] || [ "$session_count" -eq 0 ]; then
    echo "  $slug: 세션 없음 since $last_date" | tee -a "$LOG_FILE"
    continue
  fi

  echo "  $slug: $session_count sessions since $last_date" | tee -a "$LOG_FILE"
  CANDIDATES+=("$slug ($session_count sessions since $last_date)")
  CANDIDATE_SLUGS+=("$slug")
  CANDIDATE_SINCE+=("$last_date")
done <<< "$AVAILABLE"

if [ ${#CANDIDATES[@]} -eq 0 ]; then
  echo "" | tee -a "$LOG_FILE"
  echo "빌드 로그 생성할 프로젝트가 없다." | tee -a "$LOG_FILE"
  exit 0
fi

# Interactive: 프로젝트 선택
SELECTED_INDICES=()

if [ "$INTERACTIVE" = true ]; then
  echo "" | tee -a "$LOG_FILE"
  echo "빌드 로그 생성 가능 프로젝트:" | tee -a "$LOG_FILE"
  for i in "${!CANDIDATES[@]}"; do
    echo "  [$((i+1))] ${CANDIDATES[$i]}" | tee -a "$LOG_FILE"
  done
  echo "  [a] 전체  [q] 취소" | tee -a "$LOG_FILE"
  echo ""
  read -p "선택: " choice

  if [ "$choice" = "q" ]; then exit 0; fi
  if [ "$choice" = "a" ]; then
    for i in "${!CANDIDATES[@]}"; do SELECTED_INDICES+=("$i"); done
  else
    IFS=',' read -ra CHOICES <<< "$choice"
    for c in "${CHOICES[@]}"; do
      c=$(echo "$c" | tr -d ' ')
      idx=$((c - 1))
      if [ "$idx" -ge 0 ] && [ "$idx" -lt ${#CANDIDATES[@]} ]; then
        SELECTED_INDICES+=("$idx")
      fi
    done
  fi
else
  for i in "${!CANDIDATES[@]}"; do SELECTED_INDICES+=("$i"); done
fi

if [ ${#SELECTED_INDICES[@]} -eq 0 ]; then
  echo "선택된 프로젝트 없음." | tee -a "$LOG_FILE"
  exit 0
fi

# 각 프로젝트별 빌드 로그 생성
for idx in "${SELECTED_INDICES[@]}"; do
  slug="${CANDIDATE_SLUGS[$idx]}"
  since="${CANDIDATE_SINCE[$idx]}"

  echo "" | tee -a "$LOG_FILE"
  echo "━━━ $slug 빌드 로그 생성 ━━━" | tee -a "$LOG_FILE"

  # 1) .jsonl 세션 요약 추출
  SUMMARY_FILE=$(mktemp /tmp/session-summary-XXXXXX.md)
  echo "세션 파싱 중..." | tee -a "$LOG_FILE"
  python3 "$PARSER" --project "$slug" --since "$since" --output "$SUMMARY_FILE" 2>&1 | tee -a "$LOG_FILE"

  SUMMARY_SIZE=$(wc -c < "$SUMMARY_FILE" | tr -d ' ')
  if [ "$SUMMARY_SIZE" -lt 100 ]; then
    echo "WARNING: 세션 요약이 너무 짧다 (${SUMMARY_SIZE}B). 스킵." | tee -a "$LOG_FILE"
    rm -f "$SUMMARY_FILE"
    continue
  fi

  # 요약이 너무 크면 잘라내기 (Claude 입력 제한)
  if [ "$SUMMARY_SIZE" -gt 50000 ]; then
    head -c 50000 "$SUMMARY_FILE" > "${SUMMARY_FILE}.tmp"
    mv "${SUMMARY_FILE}.tmp" "$SUMMARY_FILE"
    echo "요약 50KB로 truncate" | tee -a "$LOG_FILE"
  fi

  SUMMARY_CONTENT=$(cat "$SUMMARY_FILE")
  rm -f "$SUMMARY_FILE"

  OUTPUT_FILE="$BUILD_LOGS_DIR/${TODAY}-${slug}-ko.md"

  # 2) Claude에게 빌드 로그 작성 요청
  PROMPT_FILE=$(mktemp /tmp/build-log-prompt-XXXXXX.txt)
  cat > "$PROMPT_FILE" << ENDOFPROMPT
프로젝트 "${slug}"의 빌드 로그를 작성해라.
아래는 Claude Code 세션 기록에서 추출한 작업 요약이다. 실제 프롬프트, 도구 사용, 삽질 과정이 포함되어 있다.

${SUMMARY_CONTENT}

## 출력 파일
Write 도구로 아래 경로에 파일을 생성해라:
${OUTPUT_FILE}

## Frontmatter
\`\`\`yaml
---
title: "구체적이고 핵심을 담은 제목"
project: "${slug}"
date: ${TODAY}
lang: ko
tags: [관련 태그들]
---
\`\`\`

## 글쓰기 규칙
- **코드 구현이 아니라 Claude Code 활용 방법에 초점**을 맞춘다
- 실제 프롬프트를 인용하고, 어떤 결과가 나왔는지 Before/After를 보여준다
- 삽질/에러가 있었으면 어떻게 해결했는지 과정을 투명하게 쓴다
- 도구 사용 통계를 넣는다 (Edit 몇 번, Bash 몇 번 등)
- 반말 해체 "~다/~이다" 톤. "~합니다" 절대 금지
- 불릿 포인트 남발 금지. 문장 속에 녹인다
- 구체적 숫자를 넣는다 (세션 수, 소요 시간, tool call 수)
- "이 글에서는 ~에 대해 알아보겠습니다" 같은 교과서 도입 금지
- h2로 섹션 구분
- 인라인 코드: 변수명, 파일명, 명령어는 반드시 backtick
- 분량: 2,000~4,000자

반드시 Write 도구로 파일을 생성해라.
ENDOFPROMPT

  PROMPT_CONTENT=$(cat "$PROMPT_FILE")
  rm -f "$PROMPT_FILE"

  echo "Claude CLI 실행 중..." | tee -a "$LOG_FILE"

  claude -p \
    --model sonnet \
    --permission-mode bypassPermissions \
    --allowedTools "Write Read" \
    --max-budget-usd 1.0 \
    --no-session-persistence \
    "$PROMPT_CONTENT" 2>&1 | tee -a "$LOG_FILE"

  CLAUDE_EXIT=$?
  echo "Claude CLI 종료 코드: ${CLAUDE_EXIT}" | tee -a "$LOG_FILE"

  if [ -f "$OUTPUT_FILE" ]; then
    echo "생성됨: $OUTPUT_FILE" | tee -a "$LOG_FILE"
  else
    echo "WARNING: 파일이 생성되지 않았다: $OUTPUT_FILE" | tee -a "$LOG_FILE"
  fi
done

# git commit + push → Cloudflare Pages 자동 빌드
cd "$PROJECT_DIR"
GENERATED=$(find "$BUILD_LOGS_DIR" -name "${TODAY}-*-ko.md" 2>/dev/null | wc -l | tr -d ' ')

if [ "$GENERATED" -gt 0 ]; then
  echo "" | tee -a "$LOG_FILE"
  echo "생성된 빌드 로그: ${GENERATED}개" | tee -a "$LOG_FILE"
  git add src/content/build-logs/${TODAY}-*.md

  if [ "$INTERACTIVE" = true ]; then
    echo "git add 완료. 리뷰 후 커밋해라:" | tee -a "$LOG_FILE"
    echo "  git diff --cached --stat" | tee -a "$LOG_FILE"
    echo "  git commit -m 'feat: build logs ${TODAY}'" | tee -a "$LOG_FILE"
  else
    # 비대화형 (cron): 자동 커밋 + push
    git commit -m "feat: build logs ${TODAY} (${GENERATED} posts, auto)" | tee -a "$LOG_FILE"
    git pull --rebase origin main 2>/dev/null || true
    git push origin main 2>&1 | tee -a "$LOG_FILE" || echo "WARNING: push 실패" | tee -a "$LOG_FILE"
    echo "push 완료 → Cloudflare Pages 자동 빌드 트리거됨" | tee -a "$LOG_FILE"
  fi
else
  echo "" | tee -a "$LOG_FILE"
  echo "생성된 빌드 로그 없음." | tee -a "$LOG_FILE"
fi

echo "[$TODAY] 완료" | tee -a "$LOG_FILE"
