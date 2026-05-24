---
title: "4 Vercel Deployments CANCELED: 481 Files Scanned, One Missing Component Found"
project: "portfolio-site"
date: 2026-05-25
lang: en
pair: "2026-05-25-portfolio-site-ko"
tags: [claude-code, debugging, vercel, nextjs, yaml]
description: "4 Vercel builds CANCELED over 4 days. The error pointed to YAML — 481 files parsed, 0 broken. Real culprit: a single missing CountUp.tsx. 218 tool calls to find it."
---

Four days. Every Vercel deployment CANCELED. Production frozen at the April 26 manual deploy, every article written since then invisible to anyone visiting the site.

**TL;DR:** It wasn't YAML. `CountUp.tsx` was missing, and Turbopack flagged it as a build failure. All 481 markdown files parsed clean. One `npm run build` would have found this in 30 seconds.

## The Error Message That Led Nowhere

The error looked specific:

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

A file was named: `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`. Every Vercel deployment triggered by GitHub pushes on April 27 and 28 was CANCELED. The hypothesis was reasonable — the error pointed to YAML, and a recent commit (`feat(validate-content): integrate 5요소 quality-checks`) that added content validation logic was also under suspicion.

## Session 1: Parsing 481 Files with gray-matter

First approach: scan every MD file across `content/posts/`, `content/daily/`, `content/blog/`, and `content/weekly/` using `gray-matter`.

Result: 481 files, 0 broken.

The accused furiosa file had 204 characters on line 3 — already cleaned up in an April 14 batch edit. The `column 277` pattern in the error message didn't match anything in the file.

That's when the direction shifted. YAML validation passed, so run the actual build:

```bash
npm run build
```

Different error:

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx` imported `CountUp.tsx`. The file didn't exist. Turbopack — Next.js 16's default bundler — treats an unresolvable import as a hard build failure. The `YAMLException` surfaced in Vercel was either a stale log from a previous failure bleeding into the new deployment, or a misleading wrapper error shown before the real one.

## Session 2: Systematic Debugging, Same Starting Point

The second session started independently with the same prompt and applied the `systematic-debugging` skill for a more structured pass.

Direct parsing with `js-yaml`, analysis of `validate-content.mjs` (specifically the `matter.stringify` logic at line 559), and a crawl through recent commit history. 117 tool calls to re-verify 481 files.

Two files surfaced: `content/daily/2026-04-10-en.md` and `2026-04-10.md`, both completely missing frontmatter. Real issues — but not what was causing the CANCELED deployments.

Session 2 was thorough, but redundant: Session 1 had already found the actual cause. The two sessions ran independently, so neither knew the other had already reached the same diagnosis.

## The Fix: Create CountUp.tsx, Restore Two Daily Files

Simple:

1. Created `CountUp.tsx` component
2. Converted the two frontmatter-less daily files to valid structure

Build verification:

```bash
npm run build
# → 480 static pages generated
```

480 static pages. Committed as `8aa059b`, pushed to `origin/main`. Vercel auto-deploy resumed.

## Session Stats

| Metric | Value |
|--------|-------|
| Sessions | 3 |
| Model | claude-opus-4-7 |
| Total time | ~23 min |
| Total tool calls | 218 |
| Bash | 178 |
| Read | 30 |
| TodoWrite | 5 |
| Write / Edit | 1 each |
| Files created | `CountUp.tsx` |
| Files modified | `HomeContent.tsx` + 2 daily files |

Bash dominated at 178 calls — parsing 481 files, analyzing `validate-content.mjs`, running builds, committing, pushing. All of it shell commands.

## Reproduce Locally Before You Validate Anything

This is a textbook case of symptom and cause diverging.

Even when an error message names a specific culprit, you can't confirm it until you reproduce the failure locally. The `gray-matter` scan was a valid step — but running `npm run build` first would have surfaced the real error in under a minute. Two sessions, 23 minutes, 218 tool calls versus one command.

> If you can't reproduce it locally, discard the hypothesis and audit the full build pipeline.

`npm run build` was a faster diagnostic than validating 481 files. The core principle of `systematic-debugging` is reproducing the failure at the execution layer, not the symptom layer. The error message tells you where to look; the build tells you what actually broke.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
