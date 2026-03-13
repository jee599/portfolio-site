---
title: "[사주 분석 앱] 2026-03-13 — 작업 정리 외 28건"
project: "saju_global"
date: 2026-03-13
lang: ko
tags: [fix, feat, typescript, css]
---

## 새로 추가한 것

- add coming-soon confirmation email, fix checkout test
- add Toss webhook, payment receipt email (8-locale i18n)
- add Toss Payments integration and business info footer
- viral quality-up — animations, native share, hooking share text
- add compat invite link & enhanced share cards

## 고친 것

- QA audit — i18n, orphan route, product names, JSON-LD, inline styles
- use Toss v1 payment script instead of SDK v2 for individual API keys
- switch toss payment from widget SDK to individual API key
- restore Korean paymentProvider to toss (critical)
- fallback to Toss when Paddle API key not configured
- report page Suspense, remove /api/events rate limit, CSP blob: for palm
- QA critical fixes — Korean Paddle migration, security, email i18n, palm validation

## 기타

- Merge branch 'main' of github.com:jee599/saju
- Claude/check status planning ipml m (#16)
- Claude/check status planning ipml m (#15)
- Claude/check status planning ipml m (#14)
- Claude/check status planning ipml m (#13)
- auto: build log
- auto: build log
- debug: expose checkout error message for diagnosing DB connection issue
- Claude/check status planning ipml m (#12)
- 디자인 시스템 통일 및 이메일 업데이트
- fix(i18n): translate Hindi tarot title in OG route from English to Hindi
- revert: restore longer share text with traits — better for engagement
- fix(share): shorten share text to 1 line, remove traits for better viral conversion
- feat(share): add tarot sharing, teaser content, and improve viral copy across 8 locales
- improve share: richer text, LINE URL fix, mobile compat, score validation
- fix(ci): resolve NODE_ENV readonly TypeScript error in checkout tests

## 숫자로 보는 오늘

- 커밋: 28건
- 변경 파일: 94개
- 추가: +5,221줄 / 삭제: -1,137줄

---

*이 작업 로그는 커밋이 3건 이상 쌓이면 자동으로 생성된다.*
