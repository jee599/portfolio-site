---
title: "31 Tool Calls to Find Nothing: Claude Code Chased the Wrong Lead for 3 Days"
project: "portfolio-site"
date: 2026-04-02
lang: en
pair: "2026-04-02-portfolio-site-ko"
tags: [claude-code, github-actions, devto, automation, debugging]
description: "My DEV.to auto-publish pipeline was silent for 3 days. 31 tool calls hunting an API key before finding the real bug: a duplicate const declaration in the workflow."
---

For 3 days, my DEV.to auto-publish pipeline produced nothing. GitHub Actions appeared to run. No error emails. No failure notices. Just silence — while a `SyntaxError` was quietly killing every execution before it could do anything useful.

**TL;DR**: A duplicate `const lang` declaration in a GitHub Actions inline script caused a parse-time `SyntaxError` on every run. Claude Code spent 31 tool calls across an entire session chasing the wrong hypothesis (missing API key) before a second session identified the real problem in minutes.

## 4 Parallel Searches, 0 Results

The first debugging session started with what seemed like the obvious question: where is the DEV.to API key?

Claude Code launched 4 background tasks simultaneously:

```
Background: "Find scripts with DEV.to references"
Background: "Find env files excluding backups"
Background: "Find JSON files with DEV.to references"
Background: "Find blog publishing scripts"
```

All four came back empty. The key wasn't in `~/.devto`. Not in `~/.config/devto`. Not in any `.env*` file in the project. Not in macOS Keychain. The only secret in `~/.env.local` was `ANTHROPIC_API_KEY`.

`gh secret list` confirmed `DEVTO_API_KEY` existed in GitHub Secrets — but that's as far as it goes. Secrets are write-only by design. You can prove a secret exists, you cannot read its value via CLI.

Final tally: 28 Bash calls, 2 Read, 1 Glob. **31 tool calls to confirm the key wasn't local.** If I'd looked at the workflow run history first, I'd have cut this session in half.

## The Real Problem Was One Line

Second session. Different framing in the prompt — check the workflow before touching anything else:

```
1. Read .github/workflows/publish-to-devto.yml
2. Verify files exist on main branch
3. Check gh run list for execution history
```

The diagnosis came fast. Inside the workflow's inline Node.js script, `const lang` was declared twice in the same function scope:

```javascript
// First declaration — fine
const lang = file.frontmatter.lang || 'ko';

// ... dozens of lines of logic ...

// Second declaration — SyntaxError
const lang = effectiveLang;
```

In Node.js strict mode — which GitHub Actions uses for inline scripts — re-declaring a `const` in the same scope throws a `SyntaxError` at **parse time**. The script never starts executing. No success log. No failure log with a useful message. The workflow shows as "completed" with no actionable output.

This is a bug that will never surface locally. Local dev environments don't run the same strict mode configuration as GitHub Actions' Node.js runtime. The CI environment and your laptop are different runtimes, and that gap is easy to forget.

The fix was one line: rename the second declaration from `lang` to `effectiveLang`.

## The Files Were in the Wrong Directory Too

Fixing the SyntaxError uncovered a second problem. The workflow's push trigger was watching `src/content/blog/**`, but the EN articles I wanted to publish were sitting in `blog-factory/devto/`.

The workflow had never been triggered by those files — even if the script had been working the whole time.

One prompt handled both:

```
Copy both EN files to src/content/blog/, push to main → auto-trigger
```

After the push, the workflow fired automatically. First post (`claude-agent-sdk-deep-dive-en.md`) published successfully. Second post (`harness-cicd-deep-dive-en.md`) hit a DEV.to API `429 Too Many Requests` — the API rate-limits rapid consecutive publishes.

Manual re-run resolved it:

```bash
gh workflow run publish-to-devto.yml
```

Both posts live on DEV.to.

## 9 Tool Calls to Clean Up cover_image

After the publish, one leftover issue: both files had `cover_image` fields pointing to Cloudflare R2 URLs where no actual files existed yet.

```yaml
# before
cover_image: https://r2.jidonglab.com/images/hero-post.png

# after — field removed entirely
```

Claude Code also stripped inline hero image tags from the body text. 2 Edit calls, 3 Bash, 2 Glob, 2 Read — **9 tool calls total** to clean both files.

Publishing without a cover image is better than publishing with a broken image URL.

## What I'd Do Differently

**Start with workflow run history, not credential hunting.** A missing API key and a crashing workflow script look identical from the outside — nothing gets published. The difference is visible in `gh run list` before you burn a session on exhaustive filesystem searches. This is the first command I run now:

```bash
gh run list --limit 10
```

**Parallel background tasks multiply speed, not correctness.** Running 4 searches simultaneously is useful when the hypothesis is right. When the hypothesis is wrong, parallel means you confirm the wrong answer faster. The bottleneck wasn't search speed — it was the search target.

**GitHub Actions inline scripts need local validation.** The `const` re-declaration would have been caught immediately with `node --check workflow-script.js`. A 5-second static check could have saved the 3 days.

> The hardest bugs to find are the ones that look like success — a process that runs, completes, and does nothing.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
