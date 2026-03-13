---
title: "3 rounds of QA before launch — compat overhaul, tarot payments, viral copy experiments"
project: "saju_global"
date: 2026-03-10
lang: en
pair: "2026-03-10-qa-tarot-compat-overhaul-ko"
tags: [qa, compatibility, tarot, i18n, paywall, share, viral]
---

Eight commits in a single day. That's what pre-launch QA looks like when you're building with Claude.

Three things happened in parallel: a full rewrite of the compatibility (궁합, Korean couple fortune reading based on birth dates/times) page, connecting tarot to the payment flow, and running viral copy experiments on the share feature.

---

## Compatibility page rewrite

The compat page had been cutting corners. Birth time input was missing — the calculation was just hardcoded to noon. The report only had 4 sections. I gave Claude a single directive:

> "Add birth time input (12 zodiac hour selection) to both people. Feed actual birth hour into the Four Pillars engine. Expand report to 6 sections. Bump KR pricing from ₩3,900 to ₩5,900."

One prompt, one clean response. Birth time UI, engine wiring, 3-way parallel LLM chunking, i18n keys — all in one shot. The diff was dense but readable because the scope was explicit.

<div class=change-summary>
<table>
<thead><tr><th>Item</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td class=label>Birth time</td><td class=before>Hardcoded noon</td><td class=after>12 zodiac hour selector</td></tr>
<tr><td class=label>Report sections</td><td class=before>4</td><td class=after>6 (added communication + timing)</td></tr>
<tr><td class=label>LLM chunks</td><td class=before>Sequential</td><td class=after>3 parallel → 3-4K chars target</td></tr>
<tr><td class=label>Price (KR)</td><td class=before>₩3,900</td><td class=after>₩5,900</td></tr>
<tr><td class=label>i18n engine</td><td class=before>Korean hardcoded results</td><td class=after>Locale-agnostic keys returned</td></tr>
</tbody>
</table>
</div>

---

## Three QA rounds

Right after the compat commit I had Claude do a full app audit — list every bug it could find. This approach consistently surfaces things I'd miss alone.

Round 1 (2fe4e2c) caught consistency issues. Header was mixing `sticky` and `fixed` across pages. `error.tsx` and `not-found.tsx` had no i18n at all. Some API error messages were Korean hardcoded strings leaking into the API layer.

Round 2 (123f515) hit harder. Tarot paywall was using `alert()` for validation errors. Internal API endpoints were open to header spoofing — added `x-internal-secret` header verification. Also added `useRef` double-submit guard on the home form.

Round 3 (121086b) found a critical payment routing bug. Toss (Korean payment gateway, not yet fully implemented) code was already in the codebase, and Korean users were being routed to it. Rerouted back to Paddle for now. Removed a hardcoded fallback in `INTERNAL_API_SECRET` — that one got fixed immediately.

<ul class=feature-list>
<li><span class=feat-title>Unified header</span><span class=feat-desc>Consistent fixed position across all pages</span></li>
<li><span class=feat-title>Internal API hardening</span><span class=feat-desc>x-internal-secret header spoofing protection</span></li>
<li><span class=feat-title>Email i18n</span><span class=feat-desc>Report emails: 8 locales × 5 products, unique subject/CTA per product</span></li>
<li><span class=feat-title>Palm image validation</span><span class=feat-desc>2MB size cap added at both checkout endpoints</span></li>
<li><span class=feat-title>CSP fix</span><span class=feat-desc>blob: added to img-src for palm camera preview</span></li>
<li><span class=feat-title>Analytics unblocked</span><span class=feat-desc>/api/events removed from rate-limited paths (was capping at 5/day)</span></li>
</ul>

---

## Tarot sharing + viral copy experiment

Tarot result sharing was missing. Saju (Four Pillars) results had a share button, tarot didn't. Added it, plus teaser content on the share landing page to drive conversion from viewer to paying customer.

The copy experiment was the most interesting part. First shortened the share text to one line, stripped out the personality traits. Theory: shorter = more viral. One commit later, reverted. The longer version with traits turned out to be more compelling to look at. No A/B test, just instinct — needs real data to validate.

Last catch: Hindi OG images were showing the tarot title in English. Small bug, big impression.

<div class=callout-stats>
<div class=stat-grid>
<div class=stat-item><span class=stat-value>8</span><span class=stat-label>commits in one day</span></div>
<div class=stat-item><span class=stat-value>43</span><span class=stat-label>files changed</span></div>
<div class=stat-item><span class=stat-value>640</span><span class=stat-label>lines added</span></div>
<div class=stat-item><span class=stat-value>8</span><span class=stat-label>locales</span></div>
<div class=stat-item><span class=stat-value>3</span><span class=stat-label>QA rounds</span></div>
<div class=stat-item><span class=stat-value>12</span><span class=stat-label>new tarot i18n keys</span></div>
</div>
</div>

---

## Commit log

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>4f9c985</span> <span class=msg>feat(compat): complete overhaul — birth time, 6 sections, i18n, pricing</span></div>
<div class=commit-row><span class=hash>2fe4e2c</span> <span class=msg>fix: QA fixes — unified header, i18n errors, shared constants, accessibility</span></div>
<div class=commit-row><span class=hash>123f515</span> <span class=msg>fix: HIGH QA fixes — tarot paywall rewrite, palm image, API security, form guard</span></div>
<div class=commit-row><span class=hash>e303218</span> <span class=msg>fix: add tarot to Paddle checkout, i18n report emails, fix retrieve labels</span></div>
<div class=commit-row><span class=hash>121086b</span> <span class=msg>fix: QA critical fixes — Korean Paddle migration, security, email i18n, palm validation</span></div>
<div class=commit-row><span class=hash>df7c2d9</span> <span class=msg>fix: report page Suspense, remove /api/events rate limit, CSP blob: for palm</span></div>
<div class=commit-row><span class=hash>9553df1</span> <span class=msg>feat(share): add tarot sharing, teaser content, and improve viral copy across 8 locales</span></div>
<div class=commit-row><span class=hash>cab0e53</span> <span class=msg>fix(share): shorten share text to 1 line, remove traits for better viral conversion</span></div>
<div class=commit-row><span class=hash>ca70ae0</span> <span class=msg>revert: restore longer share text with traits — better for engagement</span></div>
<div class=commit-row><span class=hash>560dc73</span> <span class=msg>fix(i18n): translate Hindi tarot title in OG route from English to Hindi</span></div>
</div>

---

Running 3 QA rounds in a single day is heavy but effective. Commit granularity gets messy — 8 commits for one day of work. The upside is the audit trail is clean. Every bug fix is isolated and traceable. I'll take that tradeoff for a pre-launch sprint.
