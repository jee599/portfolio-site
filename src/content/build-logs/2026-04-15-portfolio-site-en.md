---
title: "Claude Code for Business Admin, Not Just Coding: Payment Gateway Review in 27 Minutes"
project: "portfolio-site"
date: 2026-04-15
lang: en
pair: "2026-04-15-portfolio-site-ko"
tags: [claude-code, toss-payments, coffeechat, computer-use]
description: "Used Claude Code to draft a payment gateway contract review and update business info in the footer — 2 sessions, 80 tool calls, including one failed computer-use attempt."
---

A payment gateway compliance email arrived from Toss Payments. Not a coding problem — business registration details, refund policy URLs, service descriptions. The usual paperwork. I ran it through Claude Code anyway.

**TL;DR** Claude Code is genuinely useful outside of coding. It read the project codebase directly and drafted answers for the PG contract review in under 5 minutes. The caveat: computer-use is still unstable due to macOS permission issues.

## Dumping a Contract Review Email into Claude

Session 1 started by pointing Claude at `/Users/jidong/projects/coffeechat/` — a 1:1 mentoring platform connecting people to game industry professionals.

The first prompt was minimal:

```
커피챗 프로젝트 접근해줘
```
*(Access the coffeechat project)*

Then I pasted the full Toss Payments contract review email verbatim. Claude read the codebase directly — 16 `Read` calls, 6 `Glob` calls — and produced draft answers for every required field:

> "Service URL: https://coffeechat.it.kr  
> Refund policy URL: https://coffeechat.it.kr/refund-policy  
> Highest single transaction: ₩59,000 (60-min mock interview)"

Doing this manually means digging through planning docs, checking pricing tables, hunting down the refund policy. That's 30+ minutes of context switching. Claude pulled the same information from the codebase in under 5 minutes.

## One Line About a Missing Business License — Complete Analysis

```
통신판매업 안됐어. 187-57-01014 지동에이아이
```
*(Mail-order business registration wasn't approved. Company ID: 187-57-01014, Jidong AI)*

One line. Claude's response covered everything that mattered: KB Card would be excluded from the payment gateway approval, but all other card networks would proceed normally. Leaving the mail-order registration number blank in the footer risked rejection. For simplified tax filers, proceeding without KB Card was a viable path.

After I provided the business registration details, Claude moved directly into code changes. It updated `site-config.ts` with the business info and modified `Footer.tsx` to skip rendering the mail-order registration number when the field is empty. That whole session — 42 `Bash` calls, 5 `Edit` calls — ran for 27 minutes.

The point isn't that Claude wrote code. It's that Claude reasoned about a real business situation and then executed on it in the same session.

## computer-use Hit a Wall

Session 2 took a different direction.

```
spooon ai 모바일에서 디자인 제대로 봐줘
```
*(Review the mobile design for Spoon AI)*

I asked for a mobile responsive design review. Claude attempted computer-use and immediately hit macOS permission errors.

```
mcp__computer-use__request_access  →  failed
```

Without Accessibility and Screen Recording permissions granted in System Settings, computer-use doesn't work. Claude offered three alternatives: paste a screenshot directly, grant permissions through System Preferences, or use `WebFetch` to inspect the HTML/CSS structure. The session ended at 5 tool calls.

Lesson: check computer-use permissions before starting a session that depends on them. Getting blocked mid-session wastes context without any output.

## Tool Call Breakdown

80 tool calls across both sessions:

- `Bash` — 42 calls: project exploration, server startup, capture scripts
- `Read` — 16 calls: reading source files
- `Glob` — 6 calls: mapping file structure
- `Edit` — 5 calls: `Footer.tsx`, `site-config.ts`
- `Write` — 4 calls: screenshot utility scripts
- `ToolSearch` — 3 calls: locating computer-use tools
- `mcp__computer-use__request_access` — 2 calls: permission requests (both failed)

`Read` and `Glob` together account for 27% of all calls. Claude spends real tokens figuring out the codebase. The more context you provide upfront in the prompt, the lower that ratio gets.

## Beyond Coding

Three files changed across two sessions. The higher-value work was the contract review draft, the business registration analysis, and validating that the business details were consistent across the codebase.

Claude Code isn't a code generation tool. It's a tool for solving business problems with your codebase as live context. Contract paperwork and footer code changes happened in the same session, with the same tool.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
