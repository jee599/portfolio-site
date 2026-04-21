---
title: "25 Subagents at Once: Automating Korean Dental Ad Research and a 6-Hour Publish Pipeline"
project: "portfolio-site"
date: 2026-04-21
lang: en
pair: "2026-04-21-portfolio-site-ko"
tags: [claude-code, automation, multi-agent, devto, spoonai, dentalad, build-log]
description: "Deployed 25 Claude Code subagents in parallel to automate Korean dental market research, fixed a hardcoded draft bug, and wired a launchd-based 6-hour publish queue. 4 sessions, 493 tool calls."
---

25 subagents running in parallel. 12 market research reports on the Korean dental advertising industry, produced in a single day. 493 tool calls across 4 sessions total.

**TL;DR** Launched the `dentalad` project using multi-agent research automation to map the Korean dental ad market end-to-end. Fixed a hardcoded `published: False` that had been silently turning every dev.to post into a draft. Wired a launchd-based 6-hour auto-publish queue. Patched a `source.title` rendering bug on spoonai.me where full article headlines were appearing next to timestamps.

## One Telegram Message Became a 20-Agent Session

The request came in short.

> "Go through all Korean companies running hospital and dental ads, find the profitable ones, figure out what strategies they're using... use 10+ subagents, process each result, write it up in report format, push to git, and ping me when done."

Direction only. No spec, no format, no scoping. Claude dispatched 12 agents in parallel:

- `01` Korean medical ad agency landscape
- `02` Naver top-placement SEO strategy
- `03` Naver SA & Power Content agencies
- `04` SNS performance marketing agencies
- `05` Influencer & viral marketing
- `06` Medical advertising law — 2026 updates
- `07` Hospital CRM & booking SaaS market
- `08` AI content generation tooling landscape
- `09` Specialty-specific strategies (implants, orthodontics, cosmetic dentistry)
- `10` Global AI medical marketing benchmarks
- `11` Top 5 profitable dental clinics — deep dive
- `12` 2026 dental industry news digest

Each agent ran WebSearch independently, then produced a 2,500–4,500 word Markdown report into `~/dentalad/ads-research/reports/`. 11 Telegram completion pings arrived in sequence. Total wall-clock time: ~3 hours.

The decomposition is the core technique here. A single agent doing this sequentially would have been context-bound and shallow — each search window constrained by the previous one's framing. With 12 agents working independently, the `06` legal research agent had no reason to care what `09` was writing about dental specialties. That independence is what let both go deep.

The following day: "validate and supplement." Eight more agents ran a V2 pass, building out a `v2/` folder with fact-checking, legal stress testing, and MVP architecture cost modeling layered on top of the first-pass research.

The key output from `A3-legal-stress-test.md`: CPA and performance-based billing models carry Medical Advertising Law violation risk. This is a hard constraint — the kind that changes the entire business model calculus, not just a detail to handle later. It surfaced in pass 2, not pass 1. That's exactly what the validation pass is for.

Five more agents synthesized the full research into a final report. First pass: 12 agents. V2 validation: 8 agents. Synthesis: 5 agents. Total: 25 agents, 52 Bash calls, 22 WebSearch calls.

> Broad-sweep agents cast the net wide. Validation agents drill narrow. You need both passes to trust the output.

## `published: False` — The Pipeline Was Always in Draft Mode

Tried to publish 4 posts in the Hermes 4 series immediately. Everything landing on dev.to was sitting in draft state. Posts that were supposed to be live weren't.

Traced it to `dev_blog/.github/workflows/publish.yml:205`:

```yaml
"published": False  # hardcoded
```

Even when frontmatter had `published: true`, the workflow payload hardcoded `False`. The `should_publish` variable was already being computed correctly from frontmatter — it just wasn't being used at the API call site. One-line fix:

```python
# Before
payload = {
    "article": {
        "published": False,     # ignored frontmatter entirely
    }
}

# After
payload = {
    "article": {
        "published": should_publish,  # reads from frontmatter
    }
}
```

This is the category of bug that survives code review. `False` looks intentional — it reads like a safety default. The only way to catch it is to watch what actually ships.

After the fix, attached a 6-hour auto-publish queue. `RemoteTrigger` doesn't have access to local repos, so launchd was the right tool.

`~/Library/LaunchAgents/com.jidong.blog-queue.plist` runs `~/blog-factory/scripts/queue-publish.sh` every 6 hours:

```xml
<key>StartInterval</key>
<integer>21600</integer>
```

The script reads the queue directory in order, publishes one post per invocation via the dev.to API, then moves it to a processed folder. Simple filesystem-backed FIFO queue.

The 4 Hermes 4 posts went out at 6-hour intervals without any manual action. Five more LLM news posts went into the same queue. Agents write the content; launchd drains the queue on schedule. The two concerns stay fully separate.

## There Was a Full Article Headline Living Next to the Date

Feedback from spoonai.me:

> "Why is 'Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong' showing up next to the date?"

`components/ArticleCard.tsx:148` was rendering `post.source.title` next to the publication timestamp. The component was working correctly — the data was wrong. `source.title` was being populated with the full article headline instead of the publisher name.

Before:
```yaml
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
  url: "https://cnbc.com/..."
```

After:
```yaml
source:
  title: "CNBC"
  url: "https://cnbc.com/..."
```

Fixed in two directions simultaneously. Updated both `~/spoonai-site/SKILL.md` and `~/.claude/skills/spoonai-daily-briefing/SKILL.md` to explicitly document "publisher name only in `source.title`." That covers all future auto-generated articles. For the existing 24 Markdown files, ran a bulk replace mapping `source.url` domains to canonical publisher names: `cnbc.com` → `CNBC`, `theverge.com` → `The Verge`, `techcrunch.com` → `TechCrunch`, and so on.

After pushing commit `703f6fc`, the Vercel deployment hit `CANCELED`. Root cause: a concurrent deployment triggered at the same time and preempted the previous one. Resolved with an empty commit to retrigger. Worth knowing before assuming a `CANCELED` means a code failure.

The two-direction fix pattern matters. Fixing only the content leaves the skill instructions unchanged — next auto-generated article reproduces the bug. Fixing only the skill instructions leaves 24 existing files broken. Both directions are necessary.

## "Just Clean Everything" — 83 Files on the Line

Mid-session: "just clean everything up."

Two valid interpretations:

**A.** Delete the 22 temporary folders under `.claude/worktrees/*`. Leftover copies from previous worktree sessions. No impact on any source file.

**B.** `git reset --hard` + `git clean -fd`. Wipes `HomeContent.tsx` (+523 lines), `ArticleCard.tsx` (293 lines), `globals.css` (+257 lines) — 83 files in total. Completely unrecoverable.

Asked for clarification before doing anything. The answer came back: "1." Executed A.

The principle: when blast radius is irreversible and phrasing is ambiguous, the cost of confirming is near zero and the cost of getting it wrong is total. "Clean everything" doesn't resolve to a single intent from context alone. When the two interpretations differ by "temp files cleared" vs "full day of UI work permanently gone," asking is the right call regardless of how casual the request sounds.

## Stats — 4 Sessions Combined

493 total tool calls.

| Tool | Count | Primary Use |
|---|---|---|
| Bash | 211 | File execution, git, deploy triggers |
| Read | 46 | Understanding existing file structure |
| Agent | 40 | Research, post writing, backfill |
| Telegram reply | 34 | Receiving and confirming requests |
| Edit | 30 | File modifications |
| WebSearch | 22 | Data gathering |

The Agent count of 40 understates the actual work. Each dispatch internally generates dozens more tool calls — WebSearch, Read, Write — that don't appear in the top-level count. The low Edit/Write ratio reflects a deliberate choice: any task with a repeating structure gets delegated to agents rather than run inline.

The split: main session handles decisions and one-off edits; agents handle high-volume pattern work at scale. That's why 40 Agent calls can outweigh 211 Bash calls in actual throughput.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
