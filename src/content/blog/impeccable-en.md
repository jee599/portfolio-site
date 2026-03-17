---
title: "impeccable: Why Every AI-Generated UI Looks the Same, and 17 Commands to Fix It"
date: 2026-03-17
description: "A skill pack that fights the 'generic trap' in LLM-generated frontends. Anti-patterns, 7 domain references, and 17 steering commands for Claude Code, Cursor, and Gemini CLI."
tags: ["ai", "webdev", "design", "frontend"]
lang: "en"
source: "original"
---

Build a landing page with Claude Code. Build a dashboard with Cursor. Build a SaaS homepage with Windsurf. They all look the same.

Inter font. Purple gradients. Cards nested inside cards. Gray text on colored backgrounds. Every LLM learned from the same training data, so without guidance they reproduce the same predictable mistakes. [impeccable](https://github.com/pbakaus/impeccable) fights that bias with explicit anti-patterns, 7 domain-specific reference files, and 17 steering commands.

<small>[Source: impeccable](https://github.com/pbakaus/impeccable) — Paul Bakaus (ex-Google Chrome DevRel)</small>

## "Don't Do This" Beats "Do This" for LLMs

The project's core insight. Telling an LLM "create good design" is weaker than telling it "never use Inter font." Anti-patterns force the model off its default path, which triggers more deliberate choices.

Explicit anti-patterns include: overused fonts (Inter, Arial, system defaults), gray text on colored backgrounds, pure black/gray without tinting, cards nested inside cards, and bounce/elastic easing (which reads as dated). Each anti-pattern comes with a "do this instead" — the `typography.md` reference provides font pairing guides, not just a list of banned fonts.

## One Skill, Seven Reference Files

The architecture extends Anthropic's official `frontend-design` skill. The original provides broad guidelines. impeccable adds depth through seven domain-specific references: typography (modular scales, OpenType features), color-and-contrast (OKLCH, tinted neutrals, dark mode, accessibility), spatial-design (8px grids, visual hierarchy), motion-design (easing curves, reduced motion), interaction-design (forms, focus states, skeleton loading), responsive-design (container queries, fluid design), and ux-writing (microcopy, error messages).

The Progressive Disclosure pattern is textbook: `SKILL.md` stays light (the LLM reads it every time), while reference files load only when a specific domain is relevant. Context efficiency at its finest.

## 17 Commands for Design Control

Diagnostic commands `/audit` and `/critique` assess the current state. Transformation commands `/normalize`, `/polish`, `/simplify`, `/clarify`, `/optimize`, `/harden` improve the code. Style commands `/animate`, `/colorize`, `/bolder`, `/quieter`, `/delight` adjust the tone. Most accept an optional argument to target specific components: `/audit header`, `/polish checkout-form`.

This differs from agency-agents' approach. Agency-agents set conversation-wide personas; impeccable's commands apply specific transformations to specific code. The two are complementary — activate a Frontend Developer agent, then run `/audit`.

## A Reference for Anyone Building Skills

The most transferable takeaway: domain depth beats breadth in skill design. Seven reference files focused on one field (frontend design) produce more consistent improvement than a single generic "write better code" instruction. The anti-pattern strategy — explicitly naming what the LLM should avoid — is directly portable to any domain.

> Every LLM learned from the same generic templates. Without guidance, you get the same predictable mistakes.

- [impeccable](https://github.com/pbakaus/impeccable)
- [impeccable.style](https://impeccable.style) — Case studies & downloads
- [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
