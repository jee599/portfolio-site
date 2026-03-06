#!/bin/sh
# =============================================================
# TEMPLATE: Husky pre-push hook for auto build log generation
#
# Setup in your source repo:
#   1. npx husky init
#   2. Copy this file to .husky/pre-push
#   3. chmod +x .husky/pre-push
#   4. Make sure build-logs/ directory exists
#
# This runs Claude CLI locally (uses your Pro/Max subscription)
# No API key needed!
# =============================================================

echo "🔨 Generating build log..."

# Create build-logs dir if missing
mkdir -p build-logs

# Gather recent commits
COMMITS=$(git log --oneline -10)
DATE=$(date +%Y-%m-%d)
SLUG=$(git log -1 --pretty=%s | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | head -c 50)
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")

EN_FILE="build-logs/${DATE}-${SLUG}-en.md"
KO_FILE="build-logs/${DATE}-${SLUG}-ko.md"

# Generate EN build log with Claude CLI (timeout 120s, graceful fail)
timeout 120 claude -p "You are a build log writer for a developer portfolio site.
Based on these recent commits, write a concise build log in markdown.
Start with a ## heading (no # h1). Focus on: what was built, key decisions, and results.
Do NOT include frontmatter.

Commits:
${COMMITS}" > /tmp/buildlog-en.md 2>/dev/null

if [ $? -ne 0 ] || [ ! -s /tmp/buildlog-en.md ]; then
  echo "⚠️  Claude CLI failed, skipping build log"
  exit 0
fi

# Generate KO build log
timeout 120 claude -p "You are a build log writer for a developer portfolio site.
Based on these recent commits, write the same build log in Korean markdown.
Start with a ## heading (no # h1). Focus on: what was built, key decisions, and results.
Do NOT include frontmatter.

Commits:
${COMMITS}" > /tmp/buildlog-ko.md 2>/dev/null || true

# Assemble EN file with frontmatter
TITLE_EN=$(head -1 /tmp/buildlog-en.md | sed 's/^#* *//')
cat > "${EN_FILE}" << FRONTMATTER
---
title: "${TITLE_EN}"
project: "${REPO_NAME}"
date: ${DATE}
lang: en
pair: "${DATE}-${SLUG}-ko"
tags: [auto-generated]
---

$(cat /tmp/buildlog-en.md)
FRONTMATTER

# Assemble KO file with frontmatter
if [ -s /tmp/buildlog-ko.md ]; then
  TITLE_KO=$(head -1 /tmp/buildlog-ko.md | sed 's/^#* *//')
  cat > "${KO_FILE}" << FRONTMATTER
---
title: "${TITLE_KO}"
project: "${REPO_NAME}"
date: ${DATE}
lang: ko
pair: "${DATE}-${SLUG}-en"
tags: [auto-generated]
---

$(cat /tmp/buildlog-ko.md)
FRONTMATTER
fi

# Stage and amend the build log files into the current commit
git add build-logs/
git commit --amend --no-edit

echo "✅ Build log generated and committed"
