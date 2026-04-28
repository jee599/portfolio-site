---
title: "One Expired API Key Took Down All 8 Locales — saju_global Production Incident"
project: "saju_global"
date: 2026-04-28
lang: en
pair: "2026-04-28-saju_global-ko"
tags: [api, debugging, production, devops]
description: "A silently invalidated API key brought saju_global's full pipeline offline across 8 locales. Here's the diagnosis, the fix, and what to build next."
---

One API key expired. No warning. No email. No deprecation notice in the response body. Just a silent `401 Unauthorized` in the error logs — while users across 8 locales were waiting for their saju analysis results.

**TL;DR** An external service API key was quietly invalidated on the provider's side. saju_global's analysis pipeline went completely offline across all supported locales (`ko`, `en`, `ja`, `zh`, `hi`, `th`, `id`, `vi`). Fixed by identifying the offending key, issuing a new one, and force-redeploying with the updated environment variable.

## The Error Message That Doesn't Tell You Much

The error log entry was deceptively simple: `Invalid API key`.

Three words. But in the context of saju_global — a Korean fortune-telling service running across 8 simultaneous locales with multiple tightly coupled external dependencies — those three words meant a complete service outage.

The analysis pipeline depends on several external services running in sequence:

- **LLM interpretation engine** (OpenAI) for generating saju readings from birth data
- **Payment processing** (Toss Payments) for handling transactions
- **Third-party endpoints** for i18n translation validation across locales

When one of these fails with a hard error, the entire pipeline stops. Users don't get degraded service or partial results — they get nothing. The architecture doesn't currently have circuit breakers or fallback paths for these dependencies, which means the blast radius of any single external failure is 100% of the user-facing surface.

The first question wasn't "how do we fix this?" It was "which API is it?"

## Following the Stack Trace to the Source

Log files can be ambiguous. Multiple external API calls happen within a single user request, and when one fails, the error can surface from unexpected places in the call stack. An error in the LLM response parser, for example, might look structurally similar to an error from the payment client — depending on how the error is caught and re-thrown at each layer.

The debugging approach was methodical:

**Step 1: Find the originating module.** The stack trace pointed to the external API client wrapper — not the LLM module, not the payment module, but a specific third-party integration layer. That narrows the candidate pool from "any external dependency" to one specific service.

**Step 2: Confirm the HTTP response code.** `401 Unauthorized` vs `403 Forbidden` vs `429 Too Many Requests` each point to meaningfully different root causes. A `403` suggests the key is valid but lacks permissions. A `429` means the rate limit was hit. A `401` means the key itself is no longer recognized as valid. The error here was definitively `401`.

**Step 3: Cross-reference with the service's own dashboard.** External APIs have key management interfaces. The status of the key was visible there immediately: it had been invalidated on the provider's side.

Total diagnosis time: under 10 minutes. The bottleneck wasn't figuring out what happened — the stack trace made it clear. The bottleneck was confirming which of several possible keys was the culprit before touching anything in production.

## Why API Keys Fail Without Warning

This is the uncomfortable truth about external API keys: **they expire or get invalidated silently, and the failure only surfaces at call time**.

There's no push notification. No email warning (or if there is, it went to spam). No grace period where the key returns a deprecation warning before fully failing. One request succeeds, the next one doesn't.

The common causes:

- **Provider-side rotation**: The service rotates keys for security reasons, expecting customers to update their secrets promptly. Sometimes this is announced. Often it isn't.
- **Usage limit exceeded**: Free tier or quota limits get hit. The account doesn't get suspended, but the key stops working until the limit resets or the plan is upgraded.
- **Account-level suspension**: A failed payment, a TOS flag, or a security review can lock the account and invalidate all keys simultaneously.
- **Explicit expiration date**: Some keys are issued with a TTL. They expire at midnight on the expiry date, and no amount of traffic in the hours before will surface a warning.

In this case, the key had been invalidated on the provider's side. The service itself kept running — deployments were succeeding, the health check endpoint returned `200 OK`, infrastructure monitoring showed nothing unusual — because a key expiry doesn't surface until the specific code path that uses it executes.

saju_global runs 8 simultaneous locales: `ko`, `en`, `ja`, `zh`, `hi`, `th`, `id`, `vi`. These locales share the same backend pipeline and the same set of environment variables. When a shared external dependency fails, every locale goes down at the exact same moment. Eight distinct user populations, one expired key.

This is an infrastructure failure, not a code failure. The code was functioning correctly. It called the API with the key it was given, received a `401`, and surfaced the error as expected. The problem was in the environment — the external system changed state without any signal to the application.

No amount of clean code protects against an invalidated environment variable.

## The Fix

Once the expired key was confirmed, the remediation was a three-step process:

```bash
# Step 1: Verify the current production environment variable state
vercel env ls --environment=production

# Step 2: Issue a new key from the provider's dashboard
# (done via the external service's web UI)

# Step 3: Update the environment variable with the new key
vercel env add EXTERNAL_API_KEY production
```

There's a critical nuance with Vercel deployments (and Cloudflare Pages works the same way): **updating an environment variable in the dashboard does not immediately propagate to the currently running deployment**.

Environment variables are baked into the build at deployment time. The running deployment is still using the old — now expired — key. Changing the variable in the dashboard updates it for the next deployment. To get the new key into production, a fresh build must be triggered:

```bash
# Force a new production deployment with the updated environment variable
vercel --prod --force
```

After the redeploy, verification was the final step. Rather than waiting to see if user complaints stopped arriving, the specific API endpoint was called directly and the response code confirmed:

```bash
# Direct endpoint test — expecting 200 OK
curl -X POST https://[endpoint] \
  -H "Authorization: Bearer $NEW_KEY" \
  -d '{"test": true}'
# → 200 OK

# Check error log for any remaining 401s
# → none
```

Recovery complete. Total time from first alert to full service restoration: approximately 25 minutes.

## Before / After

| Item | Before | After |
|------|--------|-------|
| External API status | `401 Unauthorized` | `200 OK` |
| Service availability | Complete outage | Normal operation |
| Environment variable | Expired key | Freshly issued key |
| Affected locales | All 8 | 0 |

```
fix/api  Fix external API key — replace invalid key, force redeploy
```

## What Needs to Be Built Now

This was a zero-code-change fix. No bugs were corrected. No logic changed. Just an environment variable swap and a redeploy.

The underlying risk is still present. The same failure mode can recur with any of the other external API keys in the system. Two things need to be built to prevent the next occurrence from going undetected until users report it:

### 1. Active Monitoring for 401 Responses on External Calls

The current monitoring watches infrastructure — server health, deployment status, memory usage. It doesn't watch the health of external API integrations specifically.

A dedicated health check that exercises each external dependency and alerts on non-`200` responses would have caught this before the first affected user request. Even a simple cron-based check every 5 minutes is sufficient:

```typescript
// /api/health/external — check all external dependencies
export async function GET() {
  const checks = await Promise.allSettled([
    verifyOpenAIKey(),
    verifyTossPaymentsKey(),
    verifyExternalApiKey(),
  ]);

  const failures = checks
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason);

  if (failures.length > 0) {
    await sendAlert({
      title: 'External API health check failed',
      details: failures,
    });
    return Response.json({ status: 'degraded', failures }, { status: 503 });
  }

  return Response.json({ status: 'ok' });
}
```

The goal: **detect the failure before a user request hits it**. Discovering a production outage from user complaints is the worst possible detection path.

### 2. Key Expiration Tracking

Most external API keys don't have explicit expiry dates — they stay valid until something on the provider's side invalidates them. But for keys that do have TTLs, the expiration date should be tracked explicitly:

```markdown
## External API Key Inventory — saju_global

| Service         | Env Var              | Last Rotated | Expiry      | Next Review |
|-----------------|----------------------|--------------|-------------|-------------|
| OpenAI          | OPENAI_API_KEY       | 2026-01-15   | No TTL      | 2026-07-15  |
| Toss Payments   | TOSS_SECRET_KEY      | 2025-11-20   | No TTL      | 2026-05-20  |
| External API    | EXTERNAL_API_KEY     | 2026-04-28   | Check dash  | 2026-07-28  |
```

Quarterly reviews of every key — even ones without stated expiry dates — are worth the 20 minutes they take. Keys that haven't been touched in over a year should be proactively rotated.

### 3. Circuit Breakers for Core Pipeline Dependencies

Longer term: the analysis pipeline should degrade gracefully when an external service fails, rather than failing completely.

A circuit breaker pattern would allow the LLM interpretation step to fail with a user-visible "service temporarily unavailable" message, without taking down payment processing or i18n validation. Users at least get an honest error. The other locales stay up.

For a service running 8 simultaneous locales with tight external coupling, isolation between pipeline stages significantly reduces the blast radius of any single dependency failure.

## The Broader Pattern: Infrastructure State vs. Code State

This incident surfaces a distinction that's easy to overlook in normal development flow: **code state and infrastructure state are managed differently, and failures in each require different detection strategies**.

Code state is version-controlled. Every change is visible in the git history. Rollbacks are deterministic. CI catches regressions before they reach production.

Infrastructure state — environment variables, external API keys, DNS records, TLS certificates, cloud IAM permissions — lives outside the repository. It can change without a commit, without a deploy, and without any visible signal in code-level monitoring. A provider can invalidate a key, a certificate can expire, a DNS record can be misconfigured — and none of these events are visible in the application's own health metrics until a user request hits the affected code path.

For saju_global, which runs LLM inference, multi-currency payments, and i18n across 8 locales — all through external API calls — infrastructure state changes have outsized impact. The service has significant external surface area, and each piece of that surface area is a potential outage vector.

The implication: **infrastructure state needs first-class monitoring, not just infrastructure-level monitoring**. "Is the server responding?" isn't enough. "Is every external dependency responding with the expected status code?" is the question that would have caught this incident proactively.

## Conclusion

The code was correct. The infrastructure changed underneath it.

External API keys are a low-visibility, high-impact dependency. They work silently when valid, and fail silently when not. For saju_global — where LLM, payments, and i18n validation all flow through external APIs — a single expired key is a complete, multi-locale outage.

The fix itself is fast once you know what to look for: trace the error to the offending service, issue a new key, update the environment variable, force redeploy, verify. Under 30 minutes end-to-end.

The harder, ongoing work is building the monitoring layer that catches the failure before users do. That's what gets built next.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
