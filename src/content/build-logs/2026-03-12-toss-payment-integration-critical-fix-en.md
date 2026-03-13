---
title: "Full Toss Payments integration — then one line broke all Korean checkouts"
project: "saju_global"
date: 2026-03-12
lang: en
pair: "2026-03-12-toss-payment-integration-critical-fix-ko"
tags: [toss, payment, webhook, email, i18n, bugfix, debug]
---

Built the entire Korean payment flow in one session, shipped receipt emails for both Toss and Paddle, cleaned up a messy design system — then spotted that a single config value had been wrong the whole time, silently routing all Korean users to an unconfigured Paddle endpoint.

The fix was one line. The miss was embarrassing.

---

## Toss Payments: full integration

FateSaju is a Korean fortune-telling (사주, Four Pillars) app with a dual payment structure: Toss Payments for Korea, Paddle for the rest of the world. Toss is the dominant payment method in Korea — think Stripe but deeply embedded in the Korean banking and mobile ecosystem.

The previous QA session had temporarily routed Korean users to Paddle because Toss wasn't implemented yet. This session was about doing it properly.

The prompt given to Claude covered the entire surface area at once:

> "Add Toss payment widget page `/checkout/toss`, success/fail redirect pages, `/api/checkout/toss/confirm` for server-side verification, update `usePaywall` to route Korean users to Toss, add business registration info to the footer across all 8 locales."

It came back in one pass: SDK install, widget rendering, HMAC server verification, success/fail flow. Many files changed, but each individual delta was small and easy to review.

<ul class=feature-list>
<li><span class=feat-title>Payment widget</span><span class=feat-desc>`/checkout/toss` — receives amount + orderName params, renders Toss widget</span></li>
<li><span class=feat-title>Server verification</span><span class=feat-desc>`/api/checkout/toss/confirm` — double-checks paymentKey + amount server-side</span></li>
<li><span class=feat-title>Success/fail pages</span><span class=feat-desc>handles Toss redirect URLs, locale-specific error display on failure</span></li>
<li><span class=feat-title>Business footer</span><span class=feat-desc>8 locales — company name, representative, business registration number, address</span></li>
</ul>

---

## Toss webhook + receipt email

Payment confirmation needed two paths: the synchronous confirm API call the user triggers directly, and the async webhook Toss pushes server-to-server. Both need to fire the receipt email.

The webhook uses HMAC-SHA-256 signature verification with a `TOSS_WEBHOOK_SECRET` env var. Receipt email was wired into Toss confirm, Toss webhook, and Paddle webhook — all three paths covered.

`sendReceiptEmail.ts` is 326 lines. Eight locales, payment amount/order name/date table, branded HTML template, customer email, multilingual CTA. Claude generated it in one shot with no missing i18n keys.

`sendComingSoonEmail.ts` went in the same session — subscription confirmation for the early access list. Eight locales, early-bird discount promise, launch notification confirmation.

---

## Design system cleanup

The codebase had five font families in active use: Pretendard, Outfit, Sora, Manrope, Italiana — mixed inconsistently across `globals.css`. Consolidated to two: Pretendard for Korean body text, Outfit for display/headings. Removed the rest.

Along the way: unified button `border-radius` to 14px, defined a proper typography scale (h1–h3, body, button, input), cleaned up glassmorphism card styles.

<div class=change-summary>
<table>
<thead><tr><th>Item</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td class=label>Font families</td><td class=before>5 (Pretendard, Outfit, Sora, Manrope, Italiana)</td><td class=after>2 (Pretendard, Outfit)</td></tr>
<tr><td class=label>Button radius</td><td class=before>mixed</td><td class=after>14px across the board</td></tr>
<tr><td class=label>Typography scale</td><td class=before>ad-hoc values</td><td class=after>h1–h3, body, button, input defined</td></tr>
<tr><td class=label>Contact email</td><td class=before>inconsistent across 8 locale files</td><td class=after>dbswn428@gmail.com unified</td></tr>
</tbody>
</table>
</div>

---

## The one-line bug that killed Korean checkout

After shipping all of the above, English-locale browsers (`/en/`) were hitting 500 errors on checkout. Root cause: `/en/` routes to Paddle, but `PADDLE_API_KEY` wasn't set in the environment. Fixed with a fallback — if Paddle isn't configured, the endpoint delegates to the Toss create flow internally.

While debugging that, a worse problem surfaced.

In `packages/shared/src/config/countries.ts`, there's a per-country config object. Korea's entry:

```ts
// packages/shared/src/config/countries.ts
paymentProvider: "paddle",  // ← this was the problem
```

The previous QA session (2026-03-10) had a commit that deliberately set this to `"paddle"` — at the time, Toss wasn't implemented and Korean routing was going to Toss, which was broken. Correct fix for that moment. But this session implemented Toss end-to-end, and the `countries.ts` restoration got missed. So every Korean user was being routed to Paddle, which had no API key, and getting a 500.

The fix:

```ts
paymentProvider: "toss",  // ← restored
```

One character changed. Committed with `(critical)` in the message because it genuinely was.

<div class=callout-stats>
<div class=stat-grid>
<div class=stat-item><span class=stat-value>7</span><span class=stat-label>feature commits (excl. merges)</span></div>
<div class=stat-item><span class=stat-value>72</span><span class=stat-label>files changed</span></div>
<div class=stat-item><span class=stat-value>2,591</span><span class=stat-label>lines added</span></div>
<div class=stat-item><span class=stat-value>1</span><span class=stat-label>lines in the critical fix</span></div>
<div class=stat-item><span class=stat-value>2</span><span class=stat-label>new email templates</span></div>
<div class=stat-item><span class=stat-value>8</span><span class=stat-label>locales covered</span></div>
</div>
</div>

---

## Commit log

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>2c58ca3</span> <span class=msg>feat: add Toss Payments integration and business info footer</span></div>
<div class=commit-row><span class=hash>eb3b125</span> <span class=msg>feat: add Toss webhook, payment receipt email (8-locale i18n)</span></div>
<div class=commit-row><span class=hash>5f7ef27</span> <span class=msg>feat: add coming-soon confirmation email, fix checkout test</span></div>
<div class=commit-row><span class=hash>6646720</span> <span class=msg>디자인 시스템 통일 및 이메일 업데이트</span></div>
<div class=commit-row><span class=hash>9d5e4e9</span> <span class=msg>debug: expose checkout error message for diagnosing DB connection issue</span></div>
<div class=commit-row><span class=hash>099a202</span> <span class=msg>fix: fallback to Toss when Paddle API key not configured</span></div>
<div class=commit-row><span class=hash>8704207</span> <span class=msg>fix: restore Korean paymentProvider to toss (critical)</span></div>
</div>

---

Three debug commits at the end of a session is a pattern worth watching. Larger features touching more files create more surface area for "restoration" bugs — where a temporary config change from a previous session gets left behind after the full implementation lands. Next time a big feature branch merges, explicitly diff any config files that were touched across both sessions.
