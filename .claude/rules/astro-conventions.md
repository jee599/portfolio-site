# Astro 프로젝트 규칙

## 디렉토리 구조
- `src/pages/` — 라우팅 (Astro/API)
- `src/layouts/` — 레이아웃 (Base.astro, PostLayout.astro)
- `src/components/` — 재사용 컴포넌트
- `src/content/` — Content Collections (build-logs, tips, ai-news, projects)
- `src/lib/` — 유틸리티 (devto.ts, projects.ts)

## Content Collections
- 스키마: `src/content/config.ts`
- build-logs: `lang` (ko/en), `pair` 필드로 다국어 지원
- ai-news: `model` (claude/gemini/gpt/etc), `auto_generated`

## i18n
- 클라이언트 사이드: `data-ko`, `data-en` 속성
- build-logs: `lang` 필드로 필터링
- localStorage `lang` 키로 상태 유지

## 배포
- Vercel (hybrid SSR/SSG)
- API routes: `export const prerender = false`
- Cron: `/api/revalidate` (6AM), `/api/generate-ai-news` (midnight UTC = 9AM KST)
