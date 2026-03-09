---
title: "[jidonglab.com] 2026-03-09 — 버그 수정 외 4건"
project: "portfolio-site"
date: 2026-03-09
lang: ko
tags: [fix, feat, typescript, astro]
---

## 새로 추가한 것

- 4개 자동화 기능 전면 수정

## 고친 것

- /api/revalidate에 CRON_SECRET 인증 추가
- index.astro Dev.to 중복 방지 + RSS에 ai-news/blog 포함
- 빌드 로그 YAML 파싱 + blog 페이지 라우팅 수정

## 숫자로 보는 오늘

- 커밋: 4건
- 변경 파일: 11개
- 추가: +554줄 / 삭제: -226줄

## 주요 변경 파일

- `src/pages/api/revalidate.ts`
- `src/pages/index.astro`
- `src/pages/rss.xml.ts`
- `.github/workflows/generate-build-log.yml`
- `src/pages/blog/[slug].astro`
- `src/content/blog/.gitkeep`
- `src/content/config.ts`
- `src/pages/api/generate-ai-news.ts`

외 3개 파일

---

*이 작업 로그는 커밋이 3건 이상 쌓이면 자동으로 생성된다.*
