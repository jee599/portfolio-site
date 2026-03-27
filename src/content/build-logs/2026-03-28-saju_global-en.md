---
title: "Two Reasons Lemon Squeezy Rejected My App: KRW Bug + Forbidden Keywords"
project: "saju_global"
date: 2026-03-28
lang: en
pair: "2026-03-28-saju_global-ko"
tags: [claude-code, lemon-squeezy, payment, bug-fix, saju]
description: "My saju app payment was rejected twice: a KRW zero-decimal bug charged 100x the price, and fortune/reading keywords triggered platform review rejection."
---

₩5,900 was showing up as ₩590,000 in the checkout flow. A 100x price difference, silently sitting in production code. And even after fixing that, the product listing kept getting rejected — because the word "fortune" was in the product name.

**TL;DR**: KRW is a zero-decimal currency. Multiplying by `* 100` when passing prices to Lemon Squeezy results in a 100x price inflation. Separately, product names containing "fortune," "reading," or "destiny" will fail Lemon Squeezy's content review.

## The Dashboard Form That Wouldn't Accept Anything

I was registering a product on the Lemon Squeezy dashboard when the submission got rejected. I dropped a screenshot into Claude Code and typed one line:

> "그 운세 이런거 있으면 안되잖아."
> ("You can't have fortune-telling stuff like that, right?")

Claude pulled up the form state and listed every problem it could identify: empty Name field, empty Description, invalid price format, missing image, missing file. The price flag caught my attention immediately.

> "Price ₩9.99 → KRW has no decimal places. This is an invalid amount."

At first it looked like a form input problem. But once I started reading the actual code, a deeper bug surfaced.

## The `* 100` Line That Made Everything 100x More Expensive

Opening `checkout/lemonsqueezy/create/route.ts` revealed this:

```ts
customPrice: customPriceKrw * 100
```

If you've worked with Stripe, this pattern is completely intuitive. USD charges $5.90 by passing `590` in cents. The SDK expects the smallest currency unit, so you multiply by 100. It's standard.

Except KRW doesn't work that way. Korean Won, like Japanese Yen, is a **zero-decimal currency**. ₩5,900 is passed as `5900` — the number as-is, no multiplication. Multiply by 100 and Lemon Squeezy's API reads it as ₩590,000.

The fix was one line:

```ts
// before
customPrice: customPriceKrw * 100

// after
customPrice: customPriceKrw
```

One character removed. But the impact is significant — any user who reached the checkout screen would have seen a price that's 100x what it should be and bounced immediately.

Zero-decimal currencies include KRW, JPY, VND, and a handful of others. Stripe, Lemon Squeezy, and most payment SDKs document this, but it's easy to miss if you're copying patterns from USD-first tutorials. The fix is always the same: check whether your currency is zero-decimal before deciding whether to multiply.

## Why "Fortune" Is a Forbidden Word on Payment Platforms

The price bug was the easier problem. The harder one was structural to the product itself.

A saju app — Korean four-pillars astrology — is going to have product names like "Fortune Report" and "Palm Reading" by nature. These are accurate descriptions of what the product does. They're also terms that trigger content review rejection on payment platforms.

I opened `productNames.ts` to see what was being passed to the LS checkout:

- `Palm Reading` — "reading" signals divination services
- `Tarot Reading` — same issue
- `Annual Fortune Report` — "fortune" used directly

These names land in `productOptions.name` at checkout and show up on the payment screen. A reviewer seeing these flags them immediately.

The fix wasn't to describe the product dishonestly — it was to shift the framing from mystical to analytical:

| Before | After |
|--------|-------|
| `Palm Reading` | `Palm Line Analysis` |
| `Tarot Reading` | `Tarot Insights` |
| `Annual Fortune Report` | `Annual Outlook` |

"Analysis" and "Insights" accurately describe what the product delivers. They just don't carry the same association with divination that causes platform rejection. The product itself didn't change — only the vocabulary used to describe it.

## The SEO Fields Nobody Thinks to Check

I assumed `productNames.ts` was the last file to touch. Claude disagreed.

It flagged `countries.ts` and pointed to the `seo.description` field:

> "The SEO description in countries.ts contains 'destiny readings.' This shows up in meta tags on your site — a reviewer can read it."

This was a detail I wouldn't have caught. When Lemon Squeezy reviews a product, they don't just look at the form you submitted — they look at the site itself. Meta tags are visible. A `<meta name="description">` containing "destiny readings" is readable to anyone inspecting the page source.

The LLM prompt fields — `framework`, `sensitivities`, and similar internal-use strings — are never exposed in markup, so those were safe to leave. But the SEO text got the same keyword-neutralizing treatment as the product names.

## What Claude Handled vs. What I Had to Decide

The session was 1 hour 25 minutes, 16 tool calls: 6 Edit, 5 Read, 2 Agent, 2 Grep, 1 WebSearch. Three files modified.

| File | Change |
|------|--------|
| `checkout/lemonsqueezy/create/route.ts` | Removed `* 100` from KRW price calculation |
| `productNames.ts` | Replaced divination keywords with neutral alternatives |
| `countries.ts` | Replaced SEO description keywords |

What made Claude useful here wasn't just finding the bugs — it was connecting the rejection to its root causes across multiple layers. The payment platform rejection led to a form audit, which surfaced the KRW bug, which led to reading the API contract for zero-decimal currencies. Separately, the content review rejection led from the product name, to the SEO metadata, to the distinction between what's visible in markup versus what's internal-only.

I typed one sentence in Korean. Claude traced it through three files and two different failure modes.

The zero-decimal currency issue is well-documented in every payment API's docs. The keyword rejection behavior is documented less formally — it's the kind of thing you find in community threads after getting burned. Having both surfaced in the same session saved what would have been a second round of rejections.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
