---
title: "Vercel Said CANCELED for 2 Days — 481 Files Scanned, One Missing Component Found"
project: "portfolio-site"
date: 2026-04-30
lang: en
pair: "2026-04-30-portfolio-site-ko"
tags: [claude-code, debugging, vercel, yaml, next-js]
description: "Vercel CANCELED two days straight. YAML was the suspect, 481 files were scanned — zero errors. The real blocker: a missing CountUp.tsx. Fixed in 2 sessions, 208 tool calls."
---

Two days. Same error message. Same CANCELED status in Vercel. The log was very specific about the culprit: `YAMLException: incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line at line 3, column 277` — pointing at `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`.

**TL;DR** The YAML was fine. `HomeContent.tsx` was importing `CountUp.tsx`, which didn't exist. Turbopack caught it at build time. The error log pointed at the wrong thing the entire time.

## The Log Named a File. The File Was Already Fixed.

First instinct: open the file the error named. Line 3 was 204 characters. Normal. A batch fix on April 14th (commit `3095c96`) had already handled it. Nothing to see here.

So the next step was a full content scan using `gray-matter`:

```js
const files = glob.sync('content/**/*.md');
let errors = [];
files.forEach(f => {
  try { matter(fs.readFileSync(f, 'utf8')); }
  catch(e) { errors.push({ file: f, error: e.message }); }
});
console.log('errors:', errors.length); // → 0
```

481 files across `content/posts/`, `content/daily/`, `content/blog/`, and `content/weekly/`. Zero errors. Ran it again with `js-yaml` directly. Still zero. The YAML parsing hypothesis was dead.

## "CANCELED" Was Covering for "BUILD FAILED"

This is where a Vercel pipeline configuration caused confusion. The dashboard showed CANCELED, which reads as "the deploy was aborted" — not "the build crashed." In practice, it was a build failure dressed up as a cancellation.

Running `npm run build` locally surfaced the actual error immediately:

```
Error: Cannot find module './CountUp'
  at HomeContent.tsx:3:1
```

`HomeContent.tsx` imported `CountUp.tsx`. `CountUp.tsx` didn't exist. Next.js 16 defaults to Turbopack, which resolves module references at build time and fails hard on missing imports. The YAML exception had nothing to do with it.

## Creating the Missing Component

Reading `HomeContent.tsx` made the expected interface clear. `CountUp.tsx` needed to be a simple animated number counter:

```tsx
// components/CountUp.tsx
interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
}

export default function CountUp({ end, duration = 2000, suffix = '' }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const step = end / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, end);
      setCount(Math.floor(current));
      if (current >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}
```

Two files in `content/daily/` were also fixed during the same pass — both had missing closing `---` in their frontmatter. The YAML parser hadn't flagged them as errors, but the structure was malformed, so they got cleaned up anyway.

## Build Passed

```bash
npm run build
# ✓ 480 static pages generated
```

All 480 static pages generated. Pushed to `main`, Vercel triggered an automatic deploy, and production caught up to where it should have been since April 26th.

## Two Sessions, 208 Tool Calls

Session 1: 91 tool calls over 9 minutes. Session 2: 117 tool calls over 13 minutes. Tool breakdown: Bash 176, Read 22, TodoWrite 5, Skill 2, Write 1, Edit 1, ToolSearch 1.

Both sessions followed the same initial path: the error log named a specific file, so the investigation started there. That's the natural move. But the named file was already clean, and the full content scan confirmed nothing was broken. The step that actually mattered — reproducing the build locally — came later than it should have.

The takeaway: when a build fails, reproduce it locally before trusting what the error log says. Status labels ("CANCELED" vs "BUILD FAILED") and error messages that point at specific files can both mislead. Local reproduction doesn't lie.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
