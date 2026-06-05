---
title: "Claude Code Planned My Portfolio Redesign in 22 Tool Calls (And It Read My Projects First)"
project: "portfolio-site"
date: 2026-06-05
lang: en
pair: "2026-06-05-portfolio-site-ko"
tags: [claude-code, portfolio, open-design, redesign, seo]
description: "How Claude Code's ultraplan scanned my side projects, locked in a positioning, and rendered 4 design directions for jidonglab.com in 10 minutes."
---

22 tool calls. 10 minutes. One complete repositioning spec, four rendered design directions, a bilingual SEO architecture, and a page structure I'd been deferring for months.

**TL;DR** — `/ultraplan` crashed immediately because I ran it from the wrong directory. Fixed by moving into the `portfolio-site` repo. Claude then scanned my active side projects before asking a single question, surfaced three positioning options, and rendered Linear / Vercel / Stripe / Toss design directions against real copy. The session cost 22 tool calls and ended with a concrete spec ready to implement.

## The Error That Made Me Realize I Was Running From the Wrong Place

The error hit before I finished reading the prompt back:

```
ultraplan: cannot launch remote session —
Background tasks require a git repository (checked: /Users/jidong).
Initialize git or run from a git repository.
```

I'd launched from `~/`. The remote multi-agent orchestration that ultraplan uses depends on git worktrees to isolate parallel agents — no repo, immediate abort.

The fix was one directory change. `portfolio-site` is a git repo. Running ultraplan from there produced identical output without the error. The lesson is mundane but worth logging: if a tool fails with a cryptic environment error, check the working directory before debugging anything else.

## Claude Read My Codebase Before Asking What I Wanted to Do With It

The first move ultraplan made wasn't to ask me what I wanted — it was to scan what I'd already built. Two agents launched in parallel. One combed through project memory and archives. The other pulled 2026 SEO and AEO trend data.

The scan surfaced three active projects:

- **`dental-clinic` agent** — per-clinic marketing automation infrastructure: diagnostic reports, Naver Place ad management, blog pipeline. Running on real paying clients.
- **`saju_global`** — Next.js multilingual SaaS for Korean fortune-telling (saju). Three payment rails: Toss, Lemon Squeezy, PayPal. Live.
- **`local-commerce-agent`** — global small-business lead pipeline targeting 100 leads/day. As of that morning, 89 candidates already discovered.

This matters for the positioning step that came next. Claude wasn't working from a blank canvas; it had evidence about what I actually build and operate.

## Three Positioning Options, One That Actually Matched the Code

`AskUserQuestion` surfaced three directions:

1. **Builder/Developer** — side project showcase, tech portfolio. The "look at what I made" framing.
2. **Marketing/PR Specialist** — services-first, technical work as background context. The "hire me" framing.
3. **Specialist + Builder Hybrid** — *"a solo specialist who builds and operates their own marketing automation tools."* The "I sell the service and I wrote the tool that runs it" framing.

I picked option 3.

The reasoning was already visible in the codebase: I'm running dental ad automation that I built myself, a lead pipeline I wrote from scratch, a SaaS with payment processing I wired up. The framing that matches that reality is "services-led, with the code as the proof of credibility" — not "here are my projects" and not "hire me for generic marketing work."

The positioning statement that came out of this:

> A solo specialist who builds and operates marketing automation for Korean businesses — and ships the tools publicly as proof of method.

Language call: KO + EN simultaneous launch. `/ko` and `/en` subpaths, `x-default` hreflang, full content in both languages. Korean clients via direct search; global discovery via English SEO. Both audiences served from day one, not "we'll add English later."

## Why Cursor Got Cut (And Why Toss Made the Final Four)

Five design directions were evaluated. Cursor was removed.

Cursor's signature aesthetic is warm cream canvas — high readability, slightly analog feel. That's fine for a code editor but wrong for a "marketing automation specialist" brand where you want precision and technical credibility. Warm cream reads as approachable; the brief called for sharp.

The four that made the cut:

- **Linear** — dark base, tight grid, `--fg-1: #ECEDEE`, monospace accents. The "infrastructure" aesthetic.
- **Vercel** — black/white minimal, `--ds-background-100: #000`, Inter typography. Maximum contrast, no decoration.
- **Stripe** — `#635BFF` purple accent, clear CTA hierarchy. Enterprise-legible.
- **Toss** — `#3182F6` blue, Pretendard, Korean product sensibility.

Toss was added specifically for the Korean client segment. It's the most recognizable "modern Korean tech" palette — immediately legible as credible to domestic clients, while still reading as technical rather than generic. Fits "trendy and technical" without needing explanation.

All four directions were rendered against the same copy: actual homepage content, not placeholder text. The output is four complete HTML files you can open side by side and compare. No "imagine how it would look" — just render and choose.

## The Site Structure That Came Out of 10 Minutes of Planning

Page architecture was decided in the same session:

- **Home**: Hero (positioning in one line) → Services summary → Evidence (projects + results)
- **Services**: Marketing automation / Content production / Ad operations — things currently for sale
- **Projects**: dental-clinic / saju_global / local-commerce-agent — each as a proof case for the service above it
- **Contact**: jd@jidonglab.com direct, minimal intake form

The ordering is intentional. Services come before Projects because the site is services-led. Projects exist to substantiate the service claims, not to showcase technical breadth independently. A visitor from a dental clinic looking for ad automation should land on Services, get interested, then scroll to Projects to see that the tool is real and running.

SEO and AEO were specced at architecture level, not retrofitted:

- `alternates.languages` set for all pages from day one
- FAQ schema targeting search-intent queries ("마케팅 자동화 비용", "dental ad automation Korea")
- Separate landing paths per service/intent rather than one generic homepage

The design hook here is that AEO (answer engine optimization, for AI-powered search) requires structured content that answers specific questions directly. That's easier to build in than retrofit — it changes how you write headings and structure paragraphs.

## 809 Tool Calls Across 8 Sessions — and This Was the Last 22

To put the portfolio session in context: it ran at the end of a day that looked like this.

**Day totals**: 8 sessions, 809 tool calls. By tool: Bash (314), Edit (195), Read (161), Write (60). Files created: 51. Files modified: 34.

The heaviest single session was dental automation — 623 tool calls, 45 hours and 13 minutes of session time. That session built the full dental-promo infrastructure from scratch: diagnostic report pipeline, Naver blog automation, ad API integration, and a tracker site deployment. The entire thing in one session.

The portfolio redesign was 22 tool calls at the end of that day. The contrast is instructive. Ultraplan-style planning sessions are deliberately lightweight: they're meant to produce a spec, not implement it. The implementation is a separate session with a concrete plan in hand rather than figuring things out mid-build.

The 22-call session produced:

- A positioning statement
- Language and routing architecture
- Four rendered design directions (open in browser and pick)
- Page structure and content hierarchy
- SEO/AEO requirements baked into the spec

What it didn't produce: any implementation code. That's the next session.

## What Planning With Claude Code Actually Looks Like

The pattern worth documenting here is: **let the agent read what you've built before it asks what you want.**

In a standard planning conversation, you'd explain your situation, describe your projects, state your goals, and then get recommendations. That's fine, but it means you're the primary source of context — and you'll inevitably leave things out or frame them in ways that bias the output.

ultraplan's approach was different: scan the repository and side project archives first, build a picture of what exists, then surface options. The positioning options it generated were grounded in the actual codebase, not in whatever I happened to say about myself.

The dental-clinic agent exists. saju_global is live. The lead pipeline had 89 leads that morning. Those facts shaped the "hybrid specialist" recommendation in a way that a blank-canvas conversation wouldn't have reached.

The design direction process had the same structure. Rather than asking me to describe what I wanted and then generating options from the description, it rendered four concrete directions against real copy. The choice becomes "which of these four," not "which of these descriptions sounds right."

Both reduce the gap between planning and output. Less translation between intent and artifact. More choosing from real options.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
