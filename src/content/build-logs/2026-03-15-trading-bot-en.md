---
title: "Building an AI Trading Bot with Claude Code: 14 Sessions, 961 Tool Calls"
project: "trading-bot"
date: 2026-03-15
lang: en
pair: "2026-03-15-trading-bot-ko"
tags: [trading-bot, claude-code, python, bybit, automation]
description: "I built an XRP futures trading bot using Claude Code. One CLAUDE.md prompt generated 27 files, a 5-agent review scored 4.2/10, and parallel backtesting found one profitable strategy."
---

I wrote leverage ratios, stop-loss ranges, symbol lists, and timeframes into `CLAUDE.md` at specification level, then said "build the entire bot based on this CLAUDE.md." Two hours and 48 minutes later, 27 files appeared. Over 14 sessions and 961 tool calls, this is the full record of building an AI trading bot with Claude Code.

**TL;DR**: CLAUDE.md quality determines code quality. Bug fix prompts should include the error code, a hypothesis for the cause, and a numbered list of requirements -- that is what gets the right result in one shot. A 5-agent review panel discovered that a 60% win rate was hiding net losses due to structural risk/reward problems.

## One Prompt, 27 Files Generated

The first prompt in session 1:

```
Build the entire bot based on this CLAUDE.md
```

2 hours 48 minutes, 104 tool calls. Out came `bot.py`, `exchange.py`, `strategy.py`, `risk_manager.py`, `telegram_bot.py`, and 22 other files. This was possible because `CLAUDE.md` already defined strategy parameters, risk limits, and API integration details. Claude read the file and went straight into implementation.

The key to this approach is CLAUDE.md quality. Not "build me a trading bot," but a specification-grade document with leverage ratios, stop-loss ranges, symbol lists, and timeframes. The document determines the code.

## The Moment Claude Stopped Itself on Live Trading

After verifying on testnet, I requested the switch to production:

```
Switch to live and run it
```

Something interesting happened in session 5. Claude checked `.env`, found `BYBIT_TESTNET=false`, and stopped on its own:

> "BYBIT_TESTNET=false -- this is LIVE/mainnet. Per the hard rules, I will NOT trade or restart the bot without confirming this is safe."

This happened because `CLAUDE.md` explicitly stated "always confirm before live orders." Without this rule in a production bot context, a single restart command could open real positions. If you want Claude to exercise judgment proactively, the constraints must be written down in advance.

## Bybit ErrCode 10001: Error Codes in Prompts Get One-Shot Fixes

Sessions 3 through 5 focused on Bybit API error resolution. `ErrCode 10001 (position idx not match position mode)` kept recurring on short entries.

The cause: Bybit uses different `positionIdx` values for One-way mode versus Hedge mode, but the bot was always sending 0. In session 4, I wrote the prompt like this:

```
1) Add an exchange API call on startup to detect position mode
2) Store as enum in Config (ONE_WAY | HEDGE)
3) When creating orders, derive correct positionIdx from side + mode
4) Add ErrCode 10001 retry logic with mode re-detection
```

Numbering requirements and using precise technical terminology is what matters. Not "shorts aren't working" -- an error code, a causal hypothesis, and a solution direction all in one prompt is what produces the right code on the first try.

After deploying the fix in session 5 and restarting the bot, the log showed `POSITION_MODE: Hedge (bidirectional) detected`.

## 5-Agent Review: 60% Win Rate but -$39.20 Net Loss

Session 8 was the most revealing. I set up a virtual panel of five specialists for code quality diagnosis:

```
You are orchestrating a '5-agent' review for a crypto futures trading bot's
strategy/risk/execution quality improvement.
(Virtual panel: Strategy/Quant, Risk, Execution/Exchange API, Data/Backtest, Ops/Observability)
```

The result: after analyzing 10 trades, an overall score of 4.2 out of 10. Win rate was 60%, but net P&L was -$39.20. The reason was an inverted risk/reward structure -- small wins, large losses. Daily max-loss limits were missing from the code, and position sizing logic had a bug.

The strength of this pattern is forcing different perspectives on the same codebase. Asking a single Claude instance to "review the strategy" produces surface-level analysis. Assigning quant, risk manager, and API engineer roles separately surfaces problems that each domain expert would catch independently.

## Parallel Backtesting Five Strategies: Only One Was Profitable

Session 12 built the backtest infrastructure first, then launched five agents simultaneously:

```
Have 5 agents each design a strategy, find the most profitable one,
then hold a meeting with the results and refine it
```

Testing against 90 days of 26,000 five-minute candles:

| Strategy | Return | Win Rate | Profit Factor | Trades |
|----------|--------|----------|---------------|--------|
| EMA Momentum | +0.32% | 33.3% | 1.08 | 120 |
| Other 4 | Negative | - | <1.0 | 500-739 |

The only profitable strategy, EMA Momentum, also had the fewest trades. Higher trade frequency meant more exposure to fees and slippage. The conclusion: "add more filters to reduce trade frequency."

This process used `worktree` to create an isolated environment on the `claude/clever-blackburn` branch, keeping experiments separate from the main codebase.

## Context Ran Out 4 Times Across 14 Sessions

Context limits were hit 4 times across 14 sessions. Sessions 2 and 14 saw conversations interrupted, with the next prompt picking up via a context summary:

```
This session is being continued from a previous conversation that ran out of context.
The summary below covers the earlier portion of the conversation.
```

This approach worked well in practice. Claude read the summary and continued accurately. For long-running projects, continuously updating critical state (current running strategy, test results, next steps) in `docs/STATUS.md` is effective. Even when sessions break, reading STATUS.md provides fast context recovery.

## 961 Tool Calls by the Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 14 |
| Total duration | ~7 hours |
| Total tool calls | 961 |
| Bash | 293 |
| Read | 217 |
| Edit | 158 |
| Write | 67 |
| Files created | 59 |
| Files modified | 22 |

Read at 217 calls is striking. The agent always reads before modifying. It changes only the relevant section with Edit instead of rewriting entire files. This pattern prevents unnecessary changes.

## Three Lessons from Building an AI Trading Bot

A well-written CLAUDE.md lets you say "build it all" in one sentence and get a working project skeleton. But in a live trading environment, safety rules must be stated explicitly for Claude to apply its own brakes.

Bug fix prompts written as error code + causal hypothesis + numbered requirements produce the desired result in one attempt. Write them like an engineer filing a ticket, not like "why isn't this working?"

The 5-agent review pattern is effective for code review, strategy assessment, and any situation requiring multi-perspective analysis. Explicitly assigning domain expert roles makes each perspective surface different problems.

---

## Related Posts

- [Building a Multi-Agent LLM Orchestrator with Claude Code: 86 Sessions of Hard-Won Lessons](/posts/2026-03-15-LLMTrio-en)
- [Building a Mentoring Platform with 10 AI Agents: 6 Sessions, 1,289 Tool Calls](/posts/2026-03-15-coffee-chat-en)
- [Turning 105 Session Logs into Build Logs: A Claude Code Automation Pipeline](/posts/2026-03-15-portfolio-site-en)
