---
title: "26 Silent CI Failures: How Claude Code Audited 56 Repos in 34 Minutes"
project: "portfolio-site"
date: 2026-06-03
lang: en
pair: "2026-06-03-portfolio-site-ko"
tags: [claude-code, github-actions, automation, devops, open-design]
description: "A GitHub Actions workflow failed 26 consecutive times with no alerts. One Claude Code prompt scanned 56 repos, found 4 broken workflows, and built a design enforcement gate the same day."
---

The `Generate AI News` workflow in portfolio-site had logged 26 consecutive failures. No email. No Slack ping. No red badge on a dashboard I was actively watching. I found out by manually opening the Actions tab.

**TL;DR:** One prompt — "clean up any broken or unnecessary GitHub Actions" — triggered a full scan of all 56 repositories under the `jee599` account. Claude Code identified 4 workflows running at 100% failure rates, disabled 3, fixed underlying code issues in 1 and re-enabled it. Done in 34 minutes: 35 Bash calls, 11 Reads, 12 Edits. The same day, a separate 14-hour session built a hard enforcement gate that blocks raw HTML output without an explicit design pass.

## "Clean Up Any Broken or Unnecessary GitHub Actions"

That's the entire prompt. No repo name. No workflow name. No list of suspects.

Claude Code's first move: verify auth with `gh auth status`, then pull the full repository list for the `jee599` GitHub account. 56 repositories. Not all of them have CI configured, so the next step was filtering for repos that contain `.github/workflows/` directories.

From there, it queried recent run history for each workflow-enabled repo:

```bash
gh run list --repo jee599/<name> --limit 20
```

For each repo, it classified runs by outcome and computed failure rate patterns. Most of the 35 Bash calls were this scan loop — one call per repo, pulling run results, identifying failure streaks, and collecting last-run timestamps. The scan took the bulk of the 34 minutes. The fixes were fast once the problem set was fully enumerated.

## What the Scan Found Across 56 Repos

Most repos were clean. No workflows at all, or workflows passing consistently. A handful had stale workflows that hadn't triggered in months. The interesting ones were the repos that had been running — and failing — on a schedule.

| Repo | Workflow | Failure Rate | Root Cause |
|---|---|---|---|
| `dev_blog` | Publish to Hashnode | 16/16 | Expired `HASHNODE_TOKEN` + redundant job |
| **`portfolio-site`** | **Generate AI News** | **26/26** | **Missing `ANTHROPIC_API_KEY` in Actions secrets** |
| `saju` | CI | Recent consecutive failures | Application code error |
| `contextzip` | CI | 8/8 | Rust compilation errors |

Four repos. All running cron-triggered or push-triggered workflows. All failing silently for varying lengths of time. The common thread: none of them had failure notifications configured in a way that created actionable signal.

GitHub does send failure notification emails — but cron-based workflows that fail consistently produce alert fatigue fast. The notification gets turned off, or the emails get filtered, or the repo just isn't watched closely. The result is identical: 26 quiet failures.

## Why portfolio-site's AI News Kept Failing 26 Times

The root cause is straightforward. The `Generate AI News` workflow — scheduled via cron to run twice daily — makes an HTTP call to the `/api/generate-ai-news` endpoint. That endpoint calls the Anthropic API to generate AI news posts, which requires `ANTHROPIC_API_KEY`. That secret wasn't in the repository's Actions secrets.

Every run: workflow triggers → HTTP request fires → API call fails with auth error → workflow exits non-zero → run logged as failed. Repeat 26 times.

The workflow was probably broken from the moment it was first wired up, or broke when the repo was reorganized and secrets weren't migrated over. Either way: no alert, no visibility, no intervention for 26 consecutive runs. The AI News generation feature appeared live in the codebase while silently producing nothing.

## dev_blog: Broken and Redundant

The `dev_blog` Hashnode publisher had a compound problem. The `HASHNODE_TOKEN` used to authenticate against the Hashnode API had expired — so every publish attempt was failing with an auth error. But additionally, the `hashnode_blog` repository was already handling Hashnode publishing successfully.

Two repos running the same job. One working, one broken with 16 consecutive failures. Fixing the token would solve the immediate error, but also restore a duplicate workflow. The right call: disable the `dev_blog` publisher entirely. The `hashnode_blog` repo handles publishing. Running a second workflow for the same job is unnecessary maintenance surface area.

## Disable, Not Delete — and Why the Difference Matters

For all four problematic workflows, the action was `gh workflow disable`, not deleting the workflow files.

```bash
gh workflow disable <workflow-id> --repo jee599/<name>
```

Deleting `.github/workflows/generate-ai-news.yml` means opening a PR to restore it when the underlying issue is resolved. Disabling keeps the file, the configuration, the schedule, and the run history intact — it just stops triggering.

For portfolio-site: when `ANTHROPIC_API_KEY` is added to Actions secrets, the workflow comes back with:

```bash
gh workflow enable generate-ai-news --repo jee599/portfolio-site
```

That's the entire recovery path. No file restoration, no PR, no config rewrite. After each disable, Claude Code verified with `gh workflow view`. All four showed `disabled_manually`. Clean state confirmed.

## contextzip: The One That Needed Code, Not Just Config

The contextzip CI failure couldn't be resolved with a disable alone. The root cause was Rust compilation errors in the codebase — not a missing secret or an expired token. Those errors weren't going away without a code fix.

Claude Code made 12 edits across 10 files:

```
src/cargo_cmd.rs
src/compact_cmd.rs
src/discover/mod.rs
src/discover/report.rs
src/hook_audit_cmd.rs
src/learn/detector.rs
src/lint_cmd.rs
src/mypy_cmd.rs
src/tsc_cmd.rs
.github/workflows/ci.yml
```

After the fixes, CI passed. The workflow was re-enabled, not left disabled. That's the decision tree: if it can be fixed now, fix it and verify. If it's waiting on an external dependency (like a missing secret that lives outside the repo), disable cleanly and document what's needed to re-enable. Don't leave broken things running.

The 12 Edits in the total count came entirely from contextzip. Everything else — the scanning, the disables, the verifications — was Bash and Read.

## The Same Day: A Hard Gate for HTML Output

A completely separate session ran the same day. 14 hours 20 minutes, 124 tool calls. Different problem domain: design quality enforcement for generated HTML artifacts.

The context: Claude Code had been generating HTML output — reports, dashboards, rendered pages — without going through a design pass. The output was functional but visually generic. Gradient text boxes. Off-system fonts. Layout that reads immediately as AI-generated. A soft recommendation to "use Open Design for HTML output" wasn't working in practice. When Claude Code is mid-task with a clear goal and a nearly-complete artifact, a style note in a system prompt doesn't compete well with task completion pressure.

The solution was `hooks/design-gate.sh`.

## How the Design Gate Works

The gate hooks into `PreToolUse: Edit|Write|MultiEdit` events. When Claude Code attempts to write a `.html` or `.htm` file, the gate intercepts and checks whether the current session has been approved as a design pass. If not, it exits with code 2 — the tool call fails, the write is blocked.

Session approval is a single command:

```bash
hooks/design-pass.sh "reason for design approval"
```

That sets a flag valid for the current session duration. A new session starts without approval; the gate resets. The approval is deliberate and explicit — not automatic, not inferred from context.

Certain paths are exempted: `dist/`, `/tmp/`, `node_modules/`, and other build/vendor directories. The gate applies only to authored HTML output — files that end up in the repository as deliverables, not intermediate build artifacts. Without these exemptions, Astro's build output and other generated files would require a design pass, breaking the normal development workflow.

The exit code distinction matters: `exit 1` lets the model retry; `exit 2` drops the tool call entirely. For a design gate, `exit 2` is the only meaningful choice.

## Seven Smoke Tests

Seven scenarios were tested manually to verify correct behavior in each case:

| Test | Expected | Result |
|---|---|---|
| Write `.html` with no session approval | Blocked | ✅ |
| Write `.html` after `design-pass.sh` | Passes | ✅ |
| Second write in same approved session | Passes | ✅ |
| New session (no approval) → write `.html` | Blocked | ✅ |
| Write non-HTML file in unapproved session | Exempt | ✅ |
| Write to `dist/output.html` | Exempt | ✅ |
| Audit log after blocked write | Entry recorded | ✅ |

All seven passed on the first run. The gate is live.

## What Hard Gates Do That Soft Recommendations Can't

The gap between a soft recommendation and a hard gate isn't about trust — it's about where attention goes during execution.

Claude Code mid-task is optimizing for task completion. A note in a system prompt about design quality gets weighed against the concrete goal in front of it. Context pressure and the path of least resistance usually win. The note gets skipped.

`exit 2` doesn't get skipped. The write fails. Claude Code must either run `design-pass.sh` to approve the session, or take an approach that doesn't produce raw HTML. The forcing function changes the default from "write HTML and move on" to "stop and decide whether this output needs design attention."

The friction cost is intentionally low: one command, once per session. For quick internal HTML that's genuinely not a design deliverable, the acknowledgment is trivial. For actual user-facing output, the stop is the point. Soft recommendations are aspirational. Hard gates are enforceable.

## CI Should Be Quiet, or It's Noise You Can't Trust

The meta-lesson from the GitHub Actions cleanup: when workflows are consistently failing, the CI system stops being a reliable signal. "Always failing" becomes the baseline. Real failures become invisible because the noise floor is already at maximum.

26 consecutive failures for portfolio-site's AI News. 16/16 for dev_blog's Hashnode publisher. 8/8 for contextzip. All of them silent. If CI is noisy enough long enough, you stop checking it. And once you stop checking it, you lose the thing CI is supposed to give you: confidence that what's broken is known.

The approach that makes CI trustworthy:

- **Broken and fixable now**: fix it, verify it, mark it done
- **Broken and waiting on external config**: disable with a documented next step
- **Broken and redundant**: disable permanently
- **Passing**: leave it alone

This session moved four workflows from "silently broken" to "cleanly disabled" or "verified passing." The CI state is now honest. portfolio-site's AI News workflow is disabled, waiting on one specific thing: `ANTHROPIC_API_KEY` added to Actions secrets. That's a documented, actionable next step — not an open-ended "fix this someday."

The same principle applies to the design gate. Before: HTML output sometimes went through Open Design, sometimes didn't. After: HTML output either has an explicit design pass or it doesn't get written. The quality bar is enforceable rather than aspirational.

## Numbers

**GitHub Actions cleanup:**
- Repos scanned: 56
- Broken workflows identified: 4
- Workflows disabled: 3 (portfolio-site, dev_blog, saju)
- Repos with code fixed + re-enabled: 1 (contextzip)
- Total time: 34 minutes
- Tool calls: Bash ×35, Read ×11, Edit ×12

**Design gate session:**
- New files: `hooks/design-gate.sh`, `hooks/design-pass.sh`
- Smoke tests: 7/7 passed
- Total time: 14 hours 20 minutes
- Tool calls: 124

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
