---
title: "Claude Code, 939 Tool Calls Later: 37-Agent Security Audit, Payment Stack, and a Bot That Never Existed"
project: "portfolio-site"
date: 2026-06-19
lang: en
pair: "2026-06-19-portfolio-site-ko"
tags: [claude-code, multi-agent, security-audit, payments]
description: "9 sessions, 939 tool calls, 37 parallel agents. A Twitter bot that lived only in local memory, a full security audit, and a payment integration full of detours."
---

I thought I had shipped a Twitter bot. I hadn't committed a single line to git.

That's the kind of gap that only shows up when you ask Claude Code to actually run something in production. Over two days — 9 sessions, 939+ tool calls — three projects ran in parallel: the saju (Korean astrology) X bot, Preterview (an AI mock interview product), and a dental marketing side project. Each one surfaced something different about how Claude Code changes the shape of work.

**TL;DR**: The saju X bot "existed" only in local memory — no commits, no deploy, no API keys registered. Preterview went from a 37-agent parallel security audit to a full repository rename and a working payment system, all within one day.

## The Bot That Never Made It to Git

On June 17, I asked Claude Code to do a live post from the saju project's X auto-posting system. The response was disorienting.

```bash
git ls-files apps/web/lib/xbot/
# → (empty)
```

Production endpoint `/api/cron/x-post` returned **HTTP 404**. The bot had been built locally on June 15, but nothing had been committed. No deploy. No X API keys registered anywhere. The cron job was firing every 6 hours and producing exactly zero tweets.

One session fixed it: diagnose, commit, register Vercel environment variables (58 Bash calls, 9 Edit calls). Then the next session looked at the actual output — and the tweets read like AI wrote them. Phrases like "This tweet resonates deeply" leaked through. That's the kind of meta-commentary that makes real users cringe.

Fixed `voices.ts` and `cohorts.ts` to add a banned-word list and reset the persona to "a sharp friend who actually knows saju" — not a content marketing account. Republished.

The lesson here isn't a Claude Code limitation. It's that "local done" and "shipped" are completely different states, and AI tools are good at blurring that line if you don't verify with a real environment check.

## 37 Agents Audited the Codebase in One Session

The highlight of this two-day stretch was a parallel multi-agent security audit of the Preterview codebase. Seven dimensions ran as independent agents simultaneously:

- Security vulnerabilities
- Resume validation logic
- Portfolio assessment accuracy
- Interview realism
- Report accuracy
- Report design quality
- Token efficiency

37 agents total. One session. The raw numbers: Edit ×139, Read ×78, Bash ×66, totaling 357 tool calls in a single session.

What made this worth doing: **adversarial verification**. Two of the initial findings were rejected at the verify stage — a separate agent was prompted to actually refute each claim against the real code, not just accept the finding at face value. Without that pass, those false positives would have ended up in the fix queue.

The confirmed high-severity bugs went straight into fixes:

- **PayPal amount tampering** — client-controlled price was being trusted server-side without re-verification against the order record.
- **Admin IDOR** — an admin endpoint was accessible with a predictable user ID, no ownership check.
- **Rate limit DB migration** — `ratelimit-db.ts` created fresh to fix a schema mismatch that let burst requests through.
- **Interview state machine reset** — users who completed one interview couldn't start a second one. The client-side state machine never reset `completed` status. This one had been sitting unnoticed.

The multi-agent workflow pattern works particularly well for audits because each dimension is genuinely independent — there's no cross-dimension dependency that would require a barrier. Fan out, verify adversarially, synthesize confirmed findings, fix. The main context window stays light while the agents do the heavy lifting.

## coffeechat → preterview: When the CLI Doesn't Have the Command You Need

Session 8: "rename the repo and everything git-related to preterview."

Package names and branding were already updated. What remained was the repository identifier — GitHub repo name, Vercel project name, local git remote URL.

The GitHub rename was straightforward via `gh api`. The `.vercel/project.json` update was a one-liner. The problem: Vercel CLI has no `rename` command. So we hit the REST API directly:

```bash
curl -X PATCH "https://api.vercel.com/v9/projects/coffeechat" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"preterview"}'
```

The token lived only inside a subshell variable and never appeared in terminal output. After the rename, `git ls-remote` confirmed the new remote connection before anything else touched it.

This is one of those cases where the gap between "what the CLI exposes" and "what the API supports" matters. Claude Code found the API endpoint and called it correctly on the first try, which would have taken me a non-trivial amount of time to locate manually.

## Building a Payment Stack: Three Providers, Two Dead Ends

Payment integration had the most detours.

**First stop: KakaoPay.** Requires merchant verification before you can process payments. Applied for review — and the audit workflow immediately flagged that the app had none of the legally required pages: no refund policy, no terms of service, no privacy policy. 12 required items under Korean e-commerce law. Most were missing.

Three legal pages generated and wired in:

```
app/[locale]/terms/page.tsx
app/[locale]/refund/page.tsx
app/[locale]/privacy/page.tsx
```

Business registration number (2026-성남분당A-0452) added to the footer. This is the kind of compliance gap that's easy to miss when moving fast — and a security/workflow audit catches it before users do.

**Second stop: Toss Payments.** Fee structure was too high for the current stage. Moved on.

**Third stop: Payapp.** Created `lib/payments/payapp.ts`, wired it to the pricing page.

One clean addition: Korean users see KakaoPay and Naver Pay options, everyone else sees the standard flow. Cloudflare handles the geo-detection:

```typescript
// lib/geo.ts
export function getCountry(req: Request): string {
  return req.headers.get('cf-ipcountry') ?? 'US'
}
```

No IP geolocation library, no external service call. The header is already there from Cloudflare's edge.

## The Numbers

| Metric | Count |
|---|---|
| Sessions | 9 (June 17–18) |
| Total tool calls | 939+ |
| Workflow agents (security audit) | 37 |
| Workflow agents (GTM research) | 24 |
| Files modified | 50+ |
| Files created | 20+ |

Session 5 alone accounted for 357 tool calls — Edit ×139. At that scale, context pressure becomes real. The workflow fan-out pattern addresses this directly: the main context stays light while agents return only their results. For large-scale audit work, this is the right shape.

The saju bot incident is a useful reminder that AI-assisted development velocity can outpace your deployment hygiene. Ship velocity and verified-shipped velocity are different numbers. Claude Code is fast at the former; the latter still requires discipline about actually checking production state before declaring done.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
