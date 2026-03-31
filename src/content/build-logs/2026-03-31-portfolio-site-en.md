---
title: "The `immutable` Cache Flag That Locked My Images for a Year — Found by Claude Code"
project: "portfolio-site"
date: 2026-03-31
lang: en
pair: "2026-03-31-portfolio-site-ko"
tags: [claude-code, vercel, godot, devto, parallel-agents, debugging]
description: "A single `immutable` header in vercel.json held broken images hostage for a year. 9 sessions, 406 tool calls, and what Claude actually found."
---

9 sessions. 406 tool calls. 25 files changed. Here's what actually happened on March 31, 2026.

**TL;DR**: An `immutable` cache header in `vercel.json` was keeping broken images locked in browsers for a full year — not because the server file was wrong, but because the browser refused to ask for it again. Renaming the file bypassed the cache. Separately, Vercel's git-triggered builds kept getting silently canceled; `npx vercel deploy --prod` fixed it in 55 seconds.

## The Image That Refused to Heal

Right after a deploy, post thumbnails were broken. I replaced the file with a valid JPEG, pushed, redeployed — still broken in the browser. The server file was correct. The frontmatter was correct. The image rendered fine locally. But the live site kept showing a broken icon.

The prompt I gave Claude:

```
Previous fix replaced the image with a correct JPEG, but the live site still shows it as broken.
Check whether the actual file is valid and whether the frontmatter is correct.
```

49 tool calls later, Claude surfaced the actual cause. It wasn't in any application code.

```json
// vercel.json
{
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

The `immutable` directive was the culprit. Here's the sequence that caused it:

1. A corrupted or misnamed file got served at the image URL on the first request
2. The browser received a `Cache-Control: immutable` response and stored the (broken) file locally
3. `immutable` tells the browser: "this file will never change — don't ask again for the TTL duration"
4. TTL was 31,536,000 seconds — one year
5. Every subsequent server-side fix was invisible to any browser that had already cached the broken version

The `immutable` directive exists for a good reason. When paired with content-addressed filenames (like `image.a3f8c2.jpg` from a build tool), it's extremely effective — the filename changes when the content changes, so the cache never serves stale data. The problem is applying it to a static path like `/images/post-thumbnail.jpg` where you might need to update the content without changing the filename.

The fix was a file rename. Changing `-01.jpg` to `-02.jpg` creates a new URL, a new cache key, and forces every browser to fetch fresh from the server regardless of what was cached before. Four frontmatter edits, one old file deleted.

Tool breakdown for this session: Bash 31 calls, Read 12, Edit 4. The majority of Bash calls were file verification and git operations. Claude read the `vercel.json` configuration, identified the header pattern, cross-referenced it with the browser behavior, and connected the dots. That kind of multi-file reasoning across configuration and deployment behavior is where the tool-call density pays off.

Going forward: image paths for any content that might be updated should include a hash or version identifier. The pattern is safer by default, and it makes `immutable` actually correct rather than misleading.

## Why Vercel Kept Silently Canceling Builds

Three separate `git push` attempts over a short window. All three builds showed up in the Vercel dashboard as "CANCELED" before they even started — no build logs, no error messages, just a canceled status.

```
Pushed 3 times via git push, Vercel canceled all of them. Builds aren't starting at all.
Deploy the latest main to production.
```

Rather than spending time debugging the webhook, Claude went straight to the direct deployment path:

```bash
npx vercel deploy --prod
```

55 seconds. 164 static pages built and live. Five Bash calls total.

This is a pattern worth remembering: git-triggered CI/CD is convenient but adds a layer of indirection. When that layer fails silently, `vercel deploy --prod` is the escape hatch. It bypasses webhooks, branch rules, and any Vercel project configuration that might be interfering — you get a direct build from the current working directory.

If this cancellation pattern repeats, the right thing to investigate is the Vercel project's git integration settings and whether branch protection rules conflict with automatic deployments. But for a one-off case where you need production updated now, direct deployment is the move.

## The Automation Spec Problem: Daily Briefing English Version

The `content/daily/` directory on spoonai.me had a straightforward structure: one Korean file per day, named `YYYY-MM-DD.md`. The posts section already supported bilingual pairs (`-ko.md` and `-en.md`), but the daily briefing had never been extended to match.

This wasn't just a code change — it was a gap between the product and the automation that generates content for it.

1 hour 27 minutes, 39 tool calls, 4 files changed:

- `lib/content.ts` — updated `getDailyBriefing(date, lang?)` signature to accept a language parameter, added `hasDailyEnVersion()` helper
- `app/daily/[date]/page.tsx` — updated to fetch both ko/en versions simultaneously, handle missing English gracefully
- `components/DailyBriefing.tsx` — added tab UI for language switching, falls back to Korean-only if English isn't available
- `content/daily/2026-03-30-en.md` — first English daily briefing, written to validate the new structure

The code change was the smaller part of the work. The bigger update was to the automation specification itself.

Claude Code schedules run against SKILL.md files — structured documents that define what an automated session should do, step by step. The daily briefing automation lives in `~/Documents/Claude/Scheduled/spoonai-site-publish/SKILL.md`. STEP 3.6 was updated to include English daily generation logic. The corresponding `~/.claude/skills/spoonai-daily-briefing/SKILL.md` was synced to match.

This is the critical point: if the SKILL.md doesn't describe a step, the next automated session won't do it. The product code can support English dailies perfectly, but if the automation spec doesn't know to generate them, they won't appear. Code and spec have to stay in sync.

## 221 Tool Calls on a Godot 4 Game

The guild-master project is a guild management simulation built on Godot 4. The `feature_list.json` had 68 features marked as `failing`. The goal was to move all of them to `passing` in a single session.

The prompt was deliberately open-ended:

```
Implement all failing features in feature_list.json, starting from Phase 1, in order.
When one is done, move immediately to the next. Don't stop until every feature is passing.
```

2 hours 47 minutes. 221 tool calls. The Agent tool was invoked 21 times to parallelize work across independent subsystems.

**Phase 1** established the foundation: 12 data files (JSON configs for guilds, mercenaries, missions), 8 model classes, and 11 Autoload singletons for global state management. These are pure data and logic files with no UI dependencies or scene references, which made them safe to implement in parallel.

**Phase 2** split into two parallel tracks: the mercenary system's gameplay logic and the corresponding UI components. These are independent enough to work on simultaneously, but they share a data contract (the mercenary model), so the model from Phase 1 had to be finalized first.

After the session: the feature list showed all 68 features as `passing`. Then I actually ran the game.

Gray screen on launch. Nothing responded on the new game screen. The formation setup UI didn't advance. Three separate play-through issues surfaced in the first five minutes — none of which showed up in the automated feature checks.

This is the ceiling of bulk implementation with AI assistance. `feature_list.json` entries like "mercenary hire UI works" can be marked passing when the component renders and the button triggers the right function. Whether the full gameplay loop — hire → assign → send on mission → return → level up — feels correct is a different question that requires a human playing it.

The Godot-specific challenges compounded this. GDScript syntax errors don't surface without running the engine. Node reference issues in `.tscn` scene files only appear in the editor. Several of those 34 Bash calls were attempts to validate scene structure through the CLI — a partial solution at best.

**What worked**: getting a complete feature skeleton in place in under 3 hours for a 68-feature spec. The parallel agent approach was effective for the data layer and clearly separated subsystems.

**What didn't**: assuming feature-level passing equals gameplay quality. The follow-up debugging sessions on gray screens and broken flows were predictable and should be planned for after any bulk implementation session.

## The DEV.to API Key Hunt

Two English posts in `blog-factory/devto/` needed to be published to DEV.to. The process looked straightforward.

First, strip the `cover_image` R2 URLs and hero image tags from the post bodies — the image files weren't actually in R2 yet, so leaving the references would mean broken images on publish. Glob: 2 calls. Read: 2. Edit: 2. Clean.

Then the API key issue.

```
Check environment variables or config files for the API key.
~/.devto, ~/.config/devto, .env, somewhere in the project.
There were previous DEV.to posts, so the key must exist somewhere.
```

Claude ran 15 Bash calls across the filesystem: `~/.devto`, `~/.config/devto`, every `.env` variant, `wrangler.toml`, `package.json` scripts section. Nothing.

The likely explanation: previous posts were published manually through the DEV.to web editor, or the key was set ephemerally in a terminal session that's long since closed. There's also no GitHub Actions workflow (`.github/workflows/publish-devto.yml`) for automated publishing — the pipeline doesn't exist yet.

The immediate fix was to set the key manually as an environment variable. But the broader issue — no reproducible, documented publishing pipeline — is still open. Building a `publish-devto.yml` workflow would make this permanent: store the key in GitHub Secrets, trigger on push to `blog-factory/devto/`, call the DEV.to API. That's roughly 30 minutes of work that eliminates the manual step permanently.

## Reading the Tool Call Distribution

```
Total: 406 tool calls across 9 sessions
- Read:   148 (36%) — understanding existing code
- Bash:   117 (29%) — builds, deployments, filesystem operations
- Edit:    43 (11%) — actual code changes
- Agent:   21  (5%) — parallel task distribution
- Write:   16  (4%) — new file creation
- Other:   61 (15%) — Glob, Grep, misc
```

Read outpacing Bash is the most meaningful signal here. 36% of all tool calls were reading existing code — not searching for bugs, not writing new code, just building a mental model of what's already there.

The implication: AI-assisted development is primarily a comprehension task. The bottleneck isn't code generation speed — it's understanding enough context to generate the right code. Prompts that provide specific file paths and architectural context consistently outperform vague prompts that ask Claude to "figure it out."

43 edits across 25 files is an average of 1.7 edits per file. Most files got changed once or twice, not repeatedly — a sign that the initial edits were generally correct. When Claude has sufficient context before writing, the first attempt tends to be close.

The 21 Agent calls for the Godot session drove a large portion of the Bash count. Parallel agents multiply tool call volume, which is worth accounting for when estimating session complexity.

## What Sticks From This Cycle

**Cache strategy belongs in the pre-deployment checklist.** `immutable` is genuinely useful for CDN performance, but it requires content-addressed filenames to be safe. Applying it to static paths creates a debugging scenario that's hard to reproduce — the bug only manifests in browsers that cached the broken version, not in fresh sessions or incognito windows.

**"Implement everything" prompts are effective for scaffolding speed.** Turning 68 failing features into a working skeleton in under 3 hours is real value. But the session plan should include follow-up time for manual playtesting, because gameplay quality isn't something a feature list can measure.

**Automation specs are code.** When Claude Code runs scheduled sessions, the SKILL.md is what gets executed. If the spec is incomplete, the automation is incomplete — regardless of what the product code supports. Keeping SKILL.md files in sync with code changes is as important as the code change itself.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
