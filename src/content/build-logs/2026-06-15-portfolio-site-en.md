---
title: "1,085 Tool Calls in One Day: What Claude Code's Multi-Agent Mode Actually Built"
project: "portfolio-site"
date: 2026-06-15
lang: en
pair: "2026-06-15-portfolio-site-ko"
tags: [claude-code, nextjs, godot, security-audit, multi-agent]
description: "11 sessions, 1,085 tool calls, 5 parallel projects. How Claude Code multi-agent fan-out shipped a Pokemon card price tracker from zero to 90+ files in one day."
---

357 `Bash` calls. 240 `Edit` calls. 191 `Read` calls. 131 `Write` calls. 11 sessions. That's the raw tool call log for a single working day — June 15, 2026 — totaling 1,085 tool calls across five simultaneous projects.

The number that actually matters isn't the total. It's that a Pokemon card price tracking site went from zero to 90+ files in a single session, while a separate security audit caught a live VAT compliance blocker, a Godot sprite pipeline got its first AI-generated assets, a mobile UI audit ran 8 parallel agents followed by real Chrome verification, and a cron architecture refactor earned unanimous `request-changes` from four Codex reviewers before eventually getting PASS. All on the same day.

This is a breakdown of what Claude Code's multi-agent fan-out looks like in practice — not the pitch, the actual work log.

**TL;DR:** Claude Code multi-agent fan-out shipped a Pokemon card price site (90+ files) in one day. In parallel: a seven-domain compliance audit for a Korean astrology app, a Godot sprite pipeline experiment with `gpt-image-2`, an 8-agent mobile audit with real Chrome verification for a coffeechat platform, and a Codex cron architecture refactor that split a 70KB heredoc into external JSON policy files.

---

## When Your Scraping Target Blocks You: Pivoting a Data Source Mid-Build

Session 2 was the heaviest single session of the week: 342 tool calls, roughly 20 hours. The project was a Japanese Pokemon card price tracker — the kind of requirements list that looks reasonable until you start building it. Japanese card prices with historical comparison, rarity filtering, price prediction, box and pack-level analysis, dual-currency display in JPY and KRW.

The first data source on the list was yuyutei, a well-known Japanese card pricing site. The scraping attempt hit a wall immediately. Blocked.

At this point in a sequential workflow, you'd stop, research alternatives, pick one, validate it, then continue. That's probably two to four hours of overhead before writing a single schema line. Instead, data source validation agents ran in parallel — fan-out across candidates while initial schema thinking was already happening.

The pivot landed on TCGdex paired with TCGcsv. TCGdex is free, covers Japanese cards natively, provides card images, rarity metadata, and price data through a clean API. TCGcsv fills in the historical price gap. Combined, they cover the full requirements without scraping. Validation confirmed data quality before any database schema was committed.

The final stack: Next.js + TypeScript on Vercel, Neon Postgres with Drizzle ORM, Tailwind v4. Running in `ultracode` mode, a single session generated 90+ files — DB schema, provider adapters, signals logic, and the complete UI component tree. The GitHub repo was created and populated in the same session.

Sequential data source validation followed by schema design would have consumed half the session time on overhead alone. The fan-out approach made those two tracks run in parallel, which is the only reason a project this scope shipped in a single day from a cold start.

---

## Your Docs Are Lying: How a Parallel Audit Caught a Real VAT Compliance Blocker

Session 5 was a full audit of `saju_global`, a Korean astrology (사주) web app: 142 tool calls over 1 hour 42 minutes. The audit scope was broad — payment rails, waitlist logic, Meta Pixel integration, OG tags, refund handling, currency conversion, and admin functionality. Seven distinct domains.

Running seven domains sequentially creates a specific problem: you find blockers one at a time, and each one can derail the rest of the audit flow. The alternative is seven agents in parallel, each owning one domain, reporting findings independently.

The first finding was cosmetic but instructive. `STATUS.md` had "Toss+Lemon Squeezy" in the header. The actual code had been fully migrated to PayPal. Documentation and implementation had diverged, and nobody had updated the status file. This is a common failure mode — docs written once, never maintained.

The second finding was not cosmetic. EU visitors could complete purchases in USD. Under EU VAT regulations, if you accept payment from EU residents, you have VAT collection obligations — and the currency of transaction doesn't exempt you. This was classified as a blocker. The fix: block EU markets at checkout and redirect to a waitlist flow instead.

Within the same session, the audit also removed AI-generated marketing copy (a legal risk surface in several jurisdictions), wired in Meta Pixel event tracking, and corrected the PayPal refund handler. Seven domains, one session, no context switching between blocking issues.

If those seven domains had been audited sequentially, finding the VAT blocker in domain three would have required either pausing the remaining four domains or finishing them without having fixed the blocking issue first. Parallel fan-out means each domain's findings are independent — a blocker in one doesn't stall the others.

---

## Deleted Files Don't Delete Secrets: Git History Is the Attack Surface

Session 6 was a security audit of the daemun project across the `jee599` account's public repositories: 34 tool calls, 25 minutes. Compact session, specific mandate — check for exposed secrets.

The key tooling decision was to run `gitleaks 8.30.1` against git history rather than just the current working tree. This distinction matters more than it might seem.

When a developer commits a secret — an API key, a database URL, a webhook token — and then realizes the mistake, the natural response is to delete the file or remove the line and commit again. The secret disappears from the current state of the repository. It does not disappear from git history. Any public repository with a secret anywhere in its commit history has that secret visible to anyone who runs `git log -p` or clones the repo and examines the reflog.

`gitleaks` with `--source .git` scans commits, not files. That's the correct mode for a security audit of a public repository. Risks were confirmed, and the session concluded with a decision on git history cleanup strategy and a push of three local commits to origin.

Twenty-five minutes, 34 tool calls, a confirmed attack surface, and a remediation plan. The efficiency here isn't from AI automation — it's from having the right tool and running it in the right mode.

---

## AI-Generated Sprites in a Godot Pipeline: First Experiment

Session 7 was game development infrastructure: 141 tool calls. The project has two game concepts in active development — Guild Master and a wuxia title — totaling four design documents.

Reading four game design documents in sequence before starting technical work is slow, and the documents aren't interdependent in the ways that matter for the sprite pipeline question. Two agents ran in parallel, each assigned two documents, producing a unified technical brief about asset requirements across both titles.

Simultaneously, OSS sprite tooling research ran as a separate track — evaluating options for walk cycle animation generation, alpha channel handling, and spritesheet composition.

The pipeline experiment used `gpt-image-2` for generating walk animation sprites and verified alpha channel handling end-to-end. The `game-concepts-preview` repository was created, the asset pipeline was documented, and the generation parameters that produced usable walk cycles were recorded.

This is a first-of-kind data point for this project: what does `gpt-image-2` actually produce when asked for game sprite walk cycles, and how much post-processing does the alpha channel require? The answer is documented in the pipeline, not in someone's memory. Future sessions building on this can skip the exploration phase entirely.

The broader question this session was testing is whether AI image generation tools have a practical role in early-stage game prototyping. The answer appears to be yes, with constraints. Getting from concept art to animatable sprites still requires iteration, but the time from "character concept" to "something you can actually test in Godot" is meaningfully shorter.

---

## Static Analysis vs. Real Chrome: Why You Need Both

Session 8 was a mobile UI audit for the coffeechat platform: 161 tool calls over 1 hour 46 minutes. Coffeechat is a platform connecting job seekers with professionals for coffee chat sessions — it has multiple distinct functional areas: global navigation, landing pages, resume handling, portfolio display, interview prep, payment flows, and admin.

The audit structure was 8 agents in parallel, each owning one domain, running static code analysis. Global + nav, landing, resume, portfolio, interview, payment, admin, and auth. Static analysis covers the code that exists: CSS breakpoints, viewport meta tags, touch target sizes, flexbox and grid behaviors, font scaling.

Static analysis does not cover what the browser actually renders.

After the parallel agents completed their static audit, `mcp__claude-in-chrome` was called 13 times with the viewport set to 390px — standard mobile width. This is the actual Chrome browser, not a simulation. Real rendering, real layout engine, real paint.

The discrepancies between static analysis findings and real rendering were not minor. There were cases where the code looked correct — proper responsive classes, correct breakpoint logic — but the rendered output at 390px was broken. There were also cases where static analysis flagged potential issues that resolved correctly in the browser.

The concrete outputs: navigation improvements, resume preview fixes, a newly created signup route (the existing flow was broken in a way only visible with actual auth state), and disposable email filtering added to the registration flow.

That signup route problem was not findable through static analysis. Static analysis sees the code. It doesn't execute the auth flow and observe that the route doesn't exist. Real Chrome execution does.

The lesson isn't that static analysis is wrong. It's that static analysis and real execution answer different questions. A complete mobile audit needs both.

---

## When 4 Codex Reviewers All Request Changes: Extracting a 70KB Heredoc

Sessions 9 through 11 were the `local-commerce-agent` Codex cron architecture refactor: 59 + 122 + 59 tool calls, 240 total. Three sessions for what sounds like a simple refactor but required careful architecture thinking.

The problem was structural. The cron worker was a bash script containing a 70KB heredoc with logic hard-coded inside it. When policy needed to change — processing thresholds, queue sizes, country gates — you edited the bash file. The bash file owned both the execution logic and the policy configuration, with no separation between the two.

Before touching the code, the first session established the intended division of labor: Claude as policy designer, Codex as the recurring executor. This is the architecture that makes sense for a cron system where policy evolves but execution mechanics stay stable. The executor doesn't need to understand why `min_per_lane` is 30 instead of 12 — it needs to read that value reliably and act on it.

The extraction: policy logic moved to `jdlab-codex-cron-policy.json` and lane configuration moved to `jdlab-codex-lanes.json`. The bash worker became a reader and executor rather than a configuration store. The separation of concerns that should have existed from the start.

Then: four Codex reviewers, all `request-changes`.

This is the part of AI-assisted development that doesn't get talked about enough. Automated code review that actually reviews is useful precisely because it finds real problems. The blockers the Codex reviewers flagged were addressed. On the revised submission, all four returned PASS.

The final state: `min_per_lane` raised from 12 to 30, queue sizes expanded, and a `country-gate` module added to the architecture. The JSON policy files are the interface that the bash worker reads at runtime — change the policy files, the worker picks up the changes without touching the execution logic.

Keeping logic inside a heredoc means every policy change requires modifying the bash file. Separating it into external JSON means Codex only needs to read the policy files to execute correctly.

---

## What 1,085 Tool Calls Actually Mean

The tool call breakdown by type tells you something concrete about the day's work:

- **357 `Bash`**: A significant portion was `gitleaks` execution, build verification, and `git status` checks. Bash calls cluster around validation — confirming that what was written actually works.
- **240 `Edit`**: Modifications to existing files. The coffeechat nav fixes, the PayPal refund handler correction, the cron worker cleanup.
- **131 `Write`**: Net-new files. Ninety-plus of these came from the Pokemon card site session alone.
- **191 `Read`**: Code review during audits. The saju project audit, the security scan, the coffeechat static analysis.

The ratio of `Read` to `Write` (191:131) reflects a day that was more audit-heavy than build-heavy — which is accurate. Three of the five projects were primarily audit or refactor work. The single outlier was the Pokemon card site, which drove nearly all of the `Write` count.

The consistent pattern across all five projects was parallel fan-out. Not as an optimization technique applied after the fact, but as the default approach to any task with multiple independent sub-domains. Data source validation, compliance auditing, mobile UI checking, document analysis — every task that had independently answerable sub-questions got split and run in parallel.

Sequential execution of the same work would have capped the day at two or three completed sessions. The 11 sessions that actually ran — and the concrete shipped outputs across five projects — are the direct result of treating parallel fan-out as the standard approach rather than the exception.

The other consistent pattern: verification that went beyond the obvious. Static analysis confirmed by real Chrome. Security scan run against git history, not just current files. Codex review that found real blockers and forced real fixes. AI automation in this workflow isn't a shortcut around verification — it's what makes thorough verification fast enough to be worth doing on every project, not just the high-priority ones.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
