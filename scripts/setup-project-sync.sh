#!/bin/bash
# ─────────────────────────────────────────────────
# 새 프로젝트에 포트폴리오 자동 sync 설정
# 사용법: bash scripts/setup-project-sync.sh <프로젝트_디렉토리>
# ─────────────────────────────────────────────────

set -e

PROJECT_DIR="${1:-.}"
PROJECT_NAME=$(basename "$(cd "$PROJECT_DIR" && pwd)")

if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "Error: $PROJECT_DIR is not a git repo"
  exit 1
fi

# Create .portfolio.yaml (프로젝트 자동 탐색용)
if [ ! -f "$PROJECT_DIR/.portfolio.yaml" ]; then
  cat > "$PROJECT_DIR/.portfolio.yaml" << EOF
title: "${PROJECT_NAME}"
status: "개발중"
stack: []
one_liner: ""
order: 99
EOF
  echo "Created .portfolio.yaml"
fi

# Create build-logs directory
mkdir -p "$PROJECT_DIR/build-logs"
touch "$PROJECT_DIR/build-logs/.gitkeep"
echo "Created build-logs/"

# Create post-push workflow
mkdir -p "$PROJECT_DIR/.github/workflows"
cat > "$PROJECT_DIR/.github/workflows/post-push.yml" << 'WORKFLOW'
name: Post Push Pipeline
on:
  push:
    branches: [main]
    paths-ignore: [".github/**"]

jobs:
  sync-build-logs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Sync to portfolio
        env:
          TOKEN: ${{ secrets.PORTFOLIO_SYNC_TOKEN }}
        run: |
          if [ -z "$TOKEN" ]; then
            echo "PORTFOLIO_SYNC_TOKEN not set, skipping"; exit 0
          fi
          if [ ! -d "build-logs" ] || [ -z "$(ls build-logs/ 2>/dev/null)" ]; then
            echo "No build logs to sync"; exit 0
          fi
          git clone https://x-access-token:${TOKEN}@github.com/jee599/portfolio-site.git /tmp/portfolio || { echo "Clone failed"; exit 0; }
          mkdir -p /tmp/portfolio/src/content/build-logs
          COPIED=0
          for f in build-logs/*; do
            [ "$(basename "$f")" = ".gitkeep" ] && continue
            BASENAME=$(basename "$f")
            if [ ! -f "/tmp/portfolio/src/content/build-logs/$BASENAME" ]; then
              cp "$f" "/tmp/portfolio/src/content/build-logs/$BASENAME"
              COPIED=1
            fi
          done
          if [ "$COPIED" -eq 0 ]; then
            echo "No new files to sync"; exit 0
          fi
          cd /tmp/portfolio
          git config user.name "Build Log Bot"
          git config user.email "bot@jidonglab.com"
          git add src/content/build-logs/
          git diff --cached --quiet || git commit -m "auto: sync from ${{ github.event.repository.name }} [skip-log]"
          git push
WORKFLOW

echo ""
echo "Setup complete for: $PROJECT_NAME"
echo ""
echo "Next steps:"
echo "1. Edit .portfolio.yaml with project details (title, stack, one_liner)"
echo "2. Add PORTFOLIO_SYNC_TOKEN secret in GitHub repo Settings → Secrets"
echo "3. Push to main"
