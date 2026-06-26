---
title: "17 Emails Sent from the Wrong Address — Running 3 Side Projects with Claude Code"
project: "portfolio-site"
date: 2026-06-26
lang: en
pair: "2026-06-26-portfolio-site-ko"
tags: [claude-code, preterview, local-commerce, dental-marketing, funding-search, ultracode]
description: "13 sessions, 734 tool calls, and 17 accidentally sent emails. What running 3 side projects in parallel with Claude Code actually looks like."
---

17 emails went out from an address they were never supposed to come from.

`jd@jidonglab.com` is the main inbox for Preterview, my AI interview prep product. The JDLab local commerce email system isn't supposed to use it as a sender — that role belongs to `jd@tryjdlab.com`, a separate alias. But `jdlab_tryjdlab_live_send_launch.sh` had every safety gate baked in as hardcoded approvals: `DRY_RUN=0`, `DRAFT_CREATE_OK=approved`, `LIVE_SEND_OK=approved`. And it fired all 17.

13 sessions, 734 tool calls, three side projects running in parallel. Here's everything that happened.

**TL;DR:** Traced and patched a live email send incident with 3 confirmed root causes. A dental clinic blog post ranked #1 in its keyword category the day after publishing. And after 20+ prompt exchanges, confirmed that video in email simply doesn't work.

## The Send Incident: 79 Tool Calls to Confirm What Went Wrong

Session 4 opened with a full workflow audit. The request: read all actual execution logs, state files, queue artifacts, and send/bounce reconciliation outputs — find every bottleneck, unsafe piece of logic, and inflated bounce source.

The contradiction surfaced in the first diagnostic pass. The strategy document said "no sends, no cron." The last execution log said `classification=live_send`, `sent_count=17`.

79 tool calls later (Bash: 21, Read: 22, Edit: 14), three root causes confirmed:

**RC1 — The live-send launcher had all gates hardcoded.**

`JDLAB_DRY_RUN=0` and `LIVE_SEND_OK=approved` were written directly into the script. No check against an environment variable, no runtime flag, no external gate. The script granted its own permission to send live emails.

This is the classic mistake: putting both the key and the lock in the same file. Any invocation of the launcher would fire live emails, regardless of what the calling environment intended.

**RC2 — The forbidden-sender gate was checking the wrong identity.**

The guard looked for `--expect-profile` containing the alias `jd@tryjdlab.com`. But the authenticated Google profile was `jd@jidonglab.com`. String comparison on a flag value, not on the actual authenticated identity. The check was bypassed at the exact layer it was supposed to protect.

**RC3 — `done` status was semantically ambiguous in reconciliation output.**

In external-facing reports, `done` rendered as "processed." But `done` in the internal state machine meant the record had been handled by the queue — not necessarily sent. It could mean queued, deferred, or paused. Downstream readers saw "processed" and assumed sent. The semantic mismatch caused misreads across the stack.

Session 5 was a hardening pass. One-line prompt: "harden everything, fix the fixes." Four independent audits ran in parallel — Bash: 30, Edit: 18, Read: 16, 89 tool calls total. Found a hole in the never-send regex (`mailer_daemon` underscore variants weren't caught), missing placeholder/typo email detection, and no opt-out handling. All three patched and gated.

The structural fix for RC1: require explicit environment variables for live sends at the calling layer, never contain them in the script itself. RC2 required checking authentication identity, not a flag string. RC3 got a state rename — `done` became `queued_sent`, `deferred`, or `paused` based on actual disposition.

## Email HTML Is More Constrained Than You Think

Session 3 was 303 tool calls. The goal: cold email for Preterview, a product that demos well visually because it puts you in a live AI interview environment where you respond and get real-time feedback.

The first iteration included a "▶ 30-second demo — click to play the actual interview screen" call-to-action rendered as a play button. It didn't play in any email client. Email clients don't execute `<video>` tags. This is not an edge case — it's standard behavior across Gmail, Outlook, and Apple Mail.

Switched to an animated GIF. GIFs technically work in most clients, but file size made it impractical at any useful resolution. Switched to a static `<img>` thumbnail with a prominent external link. That worked, but the back-and-forth cost 20+ prompt exchanges before landing there.

The actual constraint list for email HTML:
- `<video>` and `<audio>` — ignored or stripped by all major clients
- `<script>` — blocked universally
- External font loading via `@font-face` or Google Fonts — partial, inconsistent
- CSS `position: fixed`, `display: grid` (in Outlook), most flex properties
- CSS animations — client-dependent partial support

If the session had opened with "email clients don't support video, we're building thumbnail + link," it resolves in 3-5 exchanges. The time cost was in validating a wrong premise rather than checking the constraint upfront.

Session 3 output:
- `preterview-email.html` — primary cold email
- `preterview-email-univ.html` — university career center variant
- `cold-emails.md` — target list: 72 domestic + 113 international IT education institutions
- `send_outreach.py` — sending script

`mcp__claude_ai_Gmail__create_draft` called 20 times to stage all drafts directly in Gmail. That part worked cleanly.

## Dental Blog SEO: Day-One #1 Ranking

Three sessions this week were for Dongbaek UDI Dental Clinic — a local dental practice in Yongin, South Korea (sessions 1, 6, 7). Scope: content strategy, blog publishing, and place analytics.

Session 7 used the `dental-clinic` sub-agent pattern. Single-sentence prompt: "check project status and draft the next blog post / flag any place profile info to update." The same agent instance resumed three times via `SendMessage`, carrying full project context without re-loading history each time.

Status entering the week: Post 1 (implant procedures) had been pushed out of the top-12 blog results by competitor mass-posting on 6/23-24, then recovered to #3. Post 2 — targeting pediatric dentistry keywords ("용인 소아치과 아이 첫 치과 언제 가나요" / "Yongin pediatric dentist — when should my child's first appointment be?") — was approved for same-day publishing.

Session 6 measurement, 6/26:
- "동백 소아치과" (Dongbaek pediatric dentist) blog tab: **#1**
- "용인 소아치과" (Yongin pediatric dentist): **#4** on day one

Cross-verified via `blog_probe.py` against logNo `224326926066`.

Why it ranked quickly: the post was built around a long-tail question query rather than a head keyword. Naver's blog search (the dominant search engine in Korea) responds fast to question-format titles that match actual user query patterns. The format matched the intent.

The place analytics from the same session confirmed a separate hypothesis. Traffic was down 23% week-over-week, but reservation conversion was up 50% and cancellations were up 125%. The top 5 inbound keyword categories were all brand + location variants — "UDI Dental" 37.9%, "Dongbaek UDI Dental" 20.9%, "dental clinic" 15.3%. Zero procedure-specific keywords in the top 5.

The data confirmed what had been a hypothesis: new patients weren't finding the clinic through procedure searches. They were already looking for this clinic by name, or using generic terms. Non-branded procedure queries (implants, orthodontics, pediatric) weren't driving traffic. The blog series is specifically built to change that.

## Government Funding Search: 8 Parallel Angles, 36 Live-Verified

Sessions 2 and 9 were grant searches — finding programs that fit two businesses: a dental marketing agency and an AI interview prep product.

A baseline of 42 programs had already been verified live on 6/22. Target for these sessions: re-verify against current open status as of 6/24, then sweep for anything missed.

Session 9 ran the broadest sweep:
1. 8 parallel search angles (by sector, region, deadline, funding type, tech focus, target company size, government body, and program history)
2. 38 candidates surfaced
3. Deduplicated to 36 unique programs
4. All 36 live-verified against current application status
5. 23 recommended with fit scoring

18 parallel agents, 211 tool calls. Output: `~/reports/funding-fit-2026-06-24.html`.

Constraints surfaced during live verification:
- Healthcare category exclusions in some programs (dental agencies classified as healthcare, not tech)
- Seoul AI Hub requires Seoul business registration address
- Pangyo Value-Up program scope doesn't fit dental marketing services
- Several programs had closed since the 6/22 baseline

These constraints were written back to memory and filter future searches automatically. The point of live verification isn't just confirming open/closed status — it's capturing the real exclusion logic buried in program fine print.

38 candidates. 23 survived live verification. That's a 39% false positive rate on initial search results, which is exactly why the verification layer exists.

## IR Deck vs. Codebase: Catching 6-Month Drift

Session 8 (92 tool calls) rebuilt the investor relations deck for Preterview.

Process: validate the existing deck against the actual codebase, critique across four lenses (VC / positioning / narrative / design), then rebuild 12 slides.

One specific catch: the deck said "3 competency axes." The actual product evaluates 5. Six months of gap between what the deck claimed and what the product did — the kind of drift that happens in solo projects where the same person is building and pitching simultaneously.

A verification agent reading the deck and codebase in parallel surfaces that cleanly. Human review catches it too, but it's easy to miss when you've been staring at both artifacts separately for months.

The rebuilt deck is verifiably accurate: every claim was checked against implementation before being kept. The positioning section was restructured to lead with differentiation rather than feature list.

## The Week in Numbers

| Metric | Count |
|--------|-------|
| Sessions | 13 |
| Work areas | 9 |
| Bash calls | 250+ |
| Read calls | 150+ |
| Edit calls | 150+ |
| Write calls | 25+ |
| `ultracode` workflow sessions | 3 |

Heaviest sessions: 3 (303 tool calls), 8 (92), 5 (89), 9 (~80).

Three sessions ran `ultracode` mode — multi-agent workflow orchestration via the `Workflow` tool. The grant search is the clearest example: 8 parallel search agents, verification pipeline, structured output. Work that would take several hours manually ran end-to-end in one session.

## Routing Logic for Multi-Project Parallel Work

Running multiple projects in the same Claude Code session is possible but carries costs. Context bleeds between problem spaces. Session 3 ran for 22+ hours — one conversation accumulating state across multiple unrelated tasks.

The routing that's settled in over several weeks:

**Single-file or single-domain work** → direct session, no sub-agents. The overhead of sub-agent communication isn't worth it for bounded tasks.

**Domain-specific work with persistent history** (dental clinic, ongoing campaigns) → `dental-clinic` sub-agent via the Agent tool, resumed with `SendMessage`. The sub-agent loads its own project history from `~/dental-promo/{slug}/` on startup, maintains its own context, and writes back to history files when done. The main session only handles intent and approval gates.

**Fan-out work** (audits, research, grant searches, IR validation) → `Workflow` with parallel agents. The grant search session is the template: define search angles, fan out, collect and deduplicate, verify in parallel, synthesize.

The send incident came from a script that controlled its own authorization. The dental blog ranking came from matching content format to actual search query patterns. The email video dead-end came from not validating a technical constraint before building against it.

Three different failure modes, three different projects, one week.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
