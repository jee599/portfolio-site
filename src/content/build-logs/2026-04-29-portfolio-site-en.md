---
title: "481 Files Scanned, Zero Errors — The Real Blocker Was a Missing Component"
project: "portfolio-site"
date: 2026-04-29
lang: en
pair: "2026-04-29-portfolio-site-ko"
tags: [claude-code, debugging, vercel, nextjs, build-failure]
description: "Vercel builds were CANCELED for 2 days. A YAMLException in the logs sent me on a 481-file audit. The real culprit: CountUp.tsx simply didn't exist. 2 sessions, 208 tool calls, 22 minutes."
---

Vercel threw a `YAMLException` in the build logs. Two days of canceled deployments, production frozen on a manual deploy from April 26th. The error pointed at a specific file on line 3, column 277. The file had no error on line 3, column 277. It had no error at all.

**TL;DR** — Scanned 481 Markdown files with `gray-matter`. Zero YAML errors. The actual build killer was `CountUp.tsx` not existing on disk, imported by `HomeContent.tsx`. Two sessions, 208 tool calls, 22 minutes of debugging a red herring.

## The Error Log That Lied

The Vercel build log read:

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

The file it pointed to: `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`. I read that file directly. Nothing wrong. Line 3 was 204 characters long — it couldn't physically reach column 277.

That file had already been cleaned up in a batch fix commit (`3095c96`) on April 14th. The build log was showing a stale error.

At this point, the right move would have been to run `npm run build` locally. Instead, session 1 went wide.

## The 481-File Audit

If the error file was clean, maybe the same class of corruption existed elsewhere. The session expanded scope to every Markdown file under `content/`:

```bash
node -e "
const matter = require('gray-matter');
const { globSync } = require('glob');
const files = globSync('content/**/*.md');
let broken = 0;
files.forEach(f => {
  try { matter.read(f); }
  catch(e) { console.log(f, e.message); broken++; }
});
console.log('Total', files.length, 'files, errors:', broken);
"
```

Result: **481 files, 0 errors.**

`gray-matter` parsed everything cleanly. YAML wasn't the problem. Somewhere in those 91 tool calls across 9 minutes, the session had eliminated the stated hypothesis entirely — but the commit message and next session prompt didn't reflect that.

## Building Locally Instead of Theorizing

Session 2 started with the same prompt the next day: "article publishing isn't working, fix it." It didn't know session 1 had already been through the YAML path. It started over.

Session 2 expanded into `validate-content.mjs` (559 lines), checked whether `matter.stringify` was silently mutating frontmatter, compared `js-yaml` parse output against `gray-matter` output. All matching.

Eventually, the most direct check:

```
npm run build
```

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx` imported `./CountUp`. `CountUp.tsx` didn't exist in the filesystem. Next.js 15+ with Turbopack as the default bundler doesn't warn on missing module imports — it hard-fails the build immediately.

The `YAMLException` in Vercel's logs was either from a completely different code path, or it was a cached log from a previous build iteration. The actual build never got far enough to encounter any YAML.

## The Fix

Created `CountUp.tsx`:

```typescript
// components/CountUp.tsx
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
}

export function CountUp({ end, duration = 2, suffix = '' }: CountUpProps) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}
```

Two additional daily files — `content/daily/2026-04-10-en.md` and `content/daily/2026-04-10.md` — had their entire body content embedded inline inside the YAML block, no frontmatter separator. Restructured both to standard format: short YAML frontmatter + `---` + body content below.

Local build passed. 480 static pages generated. Pushed commit `8aa059b` to `main`, Vercel auto-deploy triggered.

## Why Session 2 Existed

Session 1 completed the fix and deployed. Session 2 ran the following day with an almost identical prompt, no knowledge that session 1 had already resolved everything, and spent 13 minutes re-debugging a closed issue.

Claude Code sessions share no context with each other. Each session starts cold. A prompt that says "deployments were canceled on 4/28" looks like an open problem. The session has no way to know a prior session already shipped the fix.

The fix is simple and manual: when a session resolves something, the completion state needs to live somewhere the next session can read — a commit message, a note in the next prompt, a status file. If it isn't recorded, the same work runs again.

Session 2 also invoked `superpowers:systematic-debugging` and `superpowers:verification-before-completion` skills. The approach was more structured and methodical. It didn't change that it was redundant.

## Stats

| | Session 1 | Session 2 | Total |
|---|---|---|---|
| Duration | 9 min | 13 min | 22 min |
| Tool calls | 91 | 117 | 208 |
| Bash | 76 | 100 | 176 |
| Files created | 1 (`CountUp.tsx`) | 0 | 1 |
| Files modified | 1 | 0 | 1 |

## What This Changes

When a build log points at a specific file and line number, check that file first. If nothing is there, the log itself is the unreliable data — not the codebase.

The 481-file scan was thorough. It was also the wrong tool for the job. A single `npm run build` would have surfaced the missing module in under 30 seconds. Reproducing the actual failure is faster than constructing hypotheses about what might have caused it.

Build logs — especially on Vercel — can lag, cache, or surface errors from entirely different execution paths. The error message on screen and the error that stopped the build are not always the same thing.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
