---
title: "Dental Ad Research QC: 6 Read Calls, Zero Blocking Issues with Claude Code"
project: "portfolio-site"
date: 2026-05-14
lang: en
pair: "2026-05-14-portfolio-site-ko"
tags: [claude-code, dental-ads, qa, research, claude-opus]
description: "Claude Code QC on 6 dental ad research files: hospital name leakage, contradictions, label gaps—all checked in 6 Read calls, 0 blocking issues."
---

One leaked hospital name in an HTML report can trigger a medical advertising law violation in Korea. That constraint — sharp, non-negotiable — shapes how I design and run QC on every dental ad research pipeline. Not "it would be nice to check." Required.

**TL;DR** Six Read calls. Six research files. Zero blocking issues — no hospital or address leakage, no contradictions, no missing labels. The pipeline cleared QC and the report ships tomorrow.

## The Pipeline Context: What's Being Automated

Korea's dental advertising market runs heavily through Naver, and the SERP dynamics there are distinct from Google. Naver Place ads, blog posts, and organic rankings interact in ways that shift constantly. Tracking these patterns manually at scale is impractical, so I built an automated research pipeline that:

1. Monitors Naver Place and blog SERP patterns for target keyword clusters
2. Tracks competitive positioning and ranking hypotheses
3. Generates daily update files and HTML summary reports

The pipeline produces a set of files that need to pass QC before any downstream use — agency reporting, client-facing documentation, internal strategy docs. QC is a gate, not a review.

The reason QC is strict: Korean medical advertising law (의료법) has specific prohibitions on naming competitor clinics in certain contexts. Research documents that flow into client materials need to be clean. A slip — even in a metadata field, even in a log — is a compliance risk, not a content quality issue.

## The Six Files Under Review

Today's QC covered the standard daily set for 2026-05-14:

- `research/daily-medical-dental-ads/2026-05-14-daily-update.md` — daily SERP observations
- `rolling-knowledge-base.md` — accumulating pattern hypotheses
- `source-index.md` — source provenance tracking
- `competitive-serp-observations.md` — competitive position observations
- `naver-ranking-hypotheses.md` — ranking mechanism hypotheses
- `reports/2026-05-14-place-ad-application-day-serp-pattern.html` — HTML summary report

The HTML report is the highest-risk file. It's the output most likely to be shared externally. The others are internal working documents, but the HTML is designed to be readable by clients and can flow directly into presentations.

## The Four QC Criteria, and Why Each One Exists

**1. Hospital/address leakage in the HTML report.**

The report must use keyword-level labels only — search query strings like "Gangnam dental clinic" or "Cheongdam laminate." It must not contain specific clinic identifiers: registered clinic names (e.g., ○○치과의원), street addresses, or doctor names. This is the hardest blocker. A violation here means the report cannot ship under any circumstances.

The subtlety: geographic terms combined with specialty terms can look deceptively similar to abbreviated clinic names. "Gangnam dental" is a keyword. "Gangnam Yonsei Dental" is a clinic name. In a dense SERP observation log, that line can blur. The QC check specifically looks for this boundary.

**2. Contradictions between files.**

The rolling knowledge base, daily update, and SERP observations need to be internally consistent. If the daily update records a pattern that contradicts the knowledge base without flagging it as an update or an anomaly, that's a data integrity problem. Not all contradictions are blockers — some represent legitimate pattern shifts — but they need to be explicitly flagged rather than silently present. Undocumented contradictions erode the reliability of downstream analysis.

**3. Missing required labels.**

Every observation needs a source tag or observation session ID. "Naver Place shows X for Y keyword" has to be traceable to a specific session. Missing labels mean claims aren't verifiable, which means they can't be cited in client-facing documents. This is a soft blocker — fixable before shipping — but still a blocker. An uncited claim in a research file is noise.

**4. Unsupported claims.**

"Clinic X tends to rank higher when Y" is a hypothesis and should be labeled as such. If stated as fact without supporting observation data, that's a problem. The pipeline generates many pattern hypotheses; keeping them clearly labeled as hypotheses vs. confirmed patterns matters for downstream use. Hypothesis drift — where unverified patterns get treated as established facts — is a slow-moving data quality problem.

## The Prompt That Did the Work

I handed Claude Opus 4.7 the file paths with a tight instruction:

```
Read the updated daily research files for 2026-05-14 and review for blocking issues only:
contradictions, missing required labels, unsupported claims,
or specific hospital/address leakage in the HTML report.
Return OK if no blocking issues, otherwise list exact fixes.
```

"Blocking issues only" is load-bearing here. Without it, the model generates improvement suggestions, style notes, and recommendations. Those are useful in a review session — but this isn't a review session. This is a pass/fail gate. The output needs to be: OK, or a list of specific things to fix.

When you leave a QC prompt open-ended, you end up triaging the model's output instead of making a ship decision. Tight prompts produce tight outputs. The model should help you make a call, not add more things to read.

"List exact fixes" is the other key phrase. Not "areas for improvement." Not "consider reviewing." If there's an issue, I need a file path and a specific correction. Vague feedback at a QC gate is functionally the same as no feedback.

Six Read calls, all six files, nothing else. No exploratory reads, no tangential lookups. The session stayed exactly within the declared scope.

## What the Verification Found

**Hospital leakage — clean.**

The HTML report uses keyword-level identifiers throughout. Every clinic reference appears as part of a search query label. No registered entity names, no addresses, no doctor identifiers.

Claude specifically checked the boundary case: geographic terms (Gangnam, Cheongdam, Seocho) combined with specialty terms (dental, implant, laminate, whitening). These can look superficially similar to shortened clinic names in abbreviated form. All confirmed as query strings, not entity references.

The pipeline architecture is why this check consistently passes: from the data collection step, the system is designed to capture and store keyword-level labels rather than entity-level data. The constraint is enforced upstream, not just caught in QC. QC is verification that the upstream constraint held.

**Contradictions — one interesting finding, not a blocker.**

Across 10 test samples, the Cheongdam laminate query returned zero Naver Place results. The same query, checked against external platform data, showed six clinic appearances.

This looks like a contradiction on the surface. It isn't. Naver Place ad visibility and external platform visibility are decoupled — they're influenced by different signals and tracked through different mechanisms. The daily update logged this gap as an observation, not as a uniform result. The rolling knowledge base has a hypothesis section covering exactly this: Place ad exposure and external platform exposure move independently.

The verification confirmed the files handle this correctly. The gap is logged as a SERP pattern observation, cross-referenced against the independence hypothesis in the knowledge base. Not a contradiction — data that supports an existing hypothesis. This is the kind of nuance that makes a good QC check valuable: it has to distinguish between a real inconsistency and a documented observation.

**Label coverage — clean.**

Every observation entry in the daily update and competitive observations files carries either a source link or an observation session ID. The source index maps session IDs to session metadata. Full traceability chain intact.

**Unsupported claims — clean.**

All hypothesis-level statements in `naver-ranking-hypotheses.md` are labeled with a confidence tier (low/medium/high). No statements framed as established facts without supporting observation records. This is enforced at generation time — the pipeline output format requires a confidence field on every hypothesis statement. That makes the QC check fast: missing confidence labels are structurally absent, not just semantically absent.

## Tool Footprint: Minimal by Design

| Tool | Count |
|------|-------|
| Read | 6 |
| **Total** | **6** |

No Edit. No Write. No Bash. Pure verification.

Six tool calls for six files. No exploratory reads, no tangential lookups. When a QC session uses more tool calls than there are files under review, it usually signals one of two things: the files needed fixing (which generates Edit calls), or verification scope crept (which generates extra Read calls for related files). Neither happened here.

Tool count matching declared scope is a signal the session ran cleanly. It's a useful secondary metric: if a QC session consistently requires more tool calls than expected, the process — or the prompt — needs adjustment.

## Building Compliance into the Pipeline Architecture

The reason the hospital leakage check passes consistently isn't just that QC catches problems — it's that the pipeline prevents them upstream.

Data collection stores keyword-level labels, not entity-level data. The research file format enforces source attribution on every observation. Hypothesis statements have a required confidence field that forces explicit labeling at generation time. These structural constraints mean QC is verifying that the architecture held, not hunting for problems that slipped through.

This is a meaningful distinction. When QC becomes a bug hunt, it signals structural issues in the pipeline that will keep generating problems. When QC is architectural verification, a pass is meaningful signal: the system is working as designed.

The implication: invest in upstream constraints, not just downstream checks. If you're consistently finding the same class of problem in QC, the fix is in the data model or the generation prompt — not in making the QC check more aggressive.

## Why Opus for This Gate

The model tier decision in this pipeline isn't about general quality — it's about where the cost of a miss is highest.

Sonnet handles most of the generation work: drafting SERP summaries, updating the knowledge base, formatting the HTML report. It's fast, capable, and generation quality issues are recoverable — a draft that needs editing is a fixable problem.

The QC gate is different. The judgment call here: is "강남 치과" in this context a search keyword or part of a clinic name that slipped through? That distinction is contextual, subtle, and getting it wrong is a compliance issue — not a content quality issue. Compliance issues are not recoverable in the same way. Opus handles that class of nuanced contextual judgment more reliably, and the cost difference between models doesn't factor into a decision this asymmetric.

The principle generalizes: match model tier to consequence tier. Generation errors are correctable in the next iteration. Compliance misses are not. Spend on the most capable model where the asymmetry in consequences is largest; optimize cost everywhere else.

Any automated pipeline has stages where accuracy matters more than speed. The right engineering question is: which stages are those? Identify them explicitly, then don't optimize cost at those stages. Cost optimization elsewhere more than makes up for it.

## Why Log a Session That Changed Nothing

Six tool calls. Zero file modifications. No code written, no bugs fixed, no features shipped. Sessions like this don't look like they belong in a build log.

But "we didn't do anything" and "we confirmed there's nothing wrong" are meaningfully different. One is absence of activity. The other is a verified state.

In automated pipelines, verified states matter for a specific reason: they establish baselines. When something breaks — and it will — the question is always "when did this start?" A dated, logged QC pass lets you answer that question. Without the log, you're guessing at history. The pipeline ran on 2026-05-14. The files were read. The criteria were checked. That's worth recording.

There's a second use case: QC pass logs show that pipeline structural constraints are holding across time. If hospital leakage appears in a future QC session, the pass history shows exactly when it started — which points directly at what changed in the pipeline between the last pass and the first fail. That's a precise starting point for debugging, not a wide-open search.

Implementation logs tell you what was built. Verification logs tell you what was working and when. Both matter in a system you intend to maintain. In an automated research pipeline that runs daily, the verification history is as important as the commit history.

Result: OK. Report ships tomorrow.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
