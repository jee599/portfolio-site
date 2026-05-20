---
title: "jidonglab 홈 리디자인: Apple 클론 거부에서 Codex approve까지 (27세션, 350+ tool calls)"
project: "portfolio-site"
date: 2026-05-20
lang: ko
tags: [claude-code, redesign, astro, react, tailwind, codex]
description: "Apple 클론 시안이 거부되고 '개발자 연구실 logbook' 방향으로 전면 리디자인. 10개 컴포넌트 재작성, Codex 2회 교차검증, 카피 다듬기 5라운드까지."
---

이전 시안이 거부됐다. "애플풍 흰 여백, 큰 글자, 카드식"이 문제였다. jidonglab은 제품 하나 파는 랜딩이 아니라 1인 빌더의 연구실 운영 기록이다. generic AI 템플릿 느낌이 나면 안 됐다.

**TL;DR** 10개 홈 컴포넌트를 전면 재작성하고 Codex 교차검증 2회를 거쳤다. 구현보다 카피 다듬기에 더 많은 라운드가 들어갔다. "번역투 제거"와 "내부 툴체인 노출 금지"가 핵심 피드백이었다.

## Apple 클론 거부, 새 방향 선언

이전 세션에서 나온 시안은 Swiss-studio cream/acid 스타일이었다. 104px 세리프 제목, Instrument Serif italic, Space Grotesk display 조합이 에이전시 랜딩처럼 보였다. 사용자가 명시적으로 거부했다. 대신 세 가지를 요구했다.

- "개발자 연구실 + 개인 출판 + 운영 로그 + 프로젝트 인덱스" 느낌
- generic AI-looking 템플릿, 과한 3D, 무의미한 hero 과장 문구 금지
- 정보 밀도가 type spectacle보다 우선

코드베이스부터 파악했다. `src/components/home/` 아래 기존 컴포넌트들, `src/data/home.ts`의 데이터 구조, `src/styles/home.css`를 읽었다. 기존 코드는 새 방향과 충분히 달라서 사실상 전면 재작성이 필요했다.

디자인 시스템부터 선언했다. JetBrains Mono를 section kicker·status·date·project metadata에, IBM Plex Sans KR을 본문에. 초록 `#00c471`을 accent로 유지하되 decorative하게는 쓰지 않는다. 섹션 구분은 1px border + 모노 kicker.

## 57 tool calls로 10개 컴포넌트 재작성

`home.css`를 전면 재작성했다. 기존 스타일은 다 날리고 새 디자인 시스템에서 시작했다. 이후 컴포넌트를 하나씩 다시 썼다.

- `Hero.tsx` — 짧은 정체성 문장 + 현재 진행 상태 표시
- `NowStrip.astro` — 실시간 status 3개 (커밋, 빌드, 프로젝트)
- `Projects.tsx` — featured(1) + active grid(3) + indexed archive(나머지) 구조
- `ShipLog.astro` — 최근 빌드 로그 3개
- `Writing.astro` — 최근 포스트 목록
- `About.astro`, `Footer.astro`, `Topbar.astro`, `Lab.tsx` — 신규 생성

Projects 컴포넌트가 가장 공이 들어갔다. featured 프로젝트는 비주얼과 함께 크게, active 프로젝트는 2×2 그리드, 나머지는 monospace 인덱스 형태로 노출하는 구조다. `src/data/home.ts`에서 데이터를 중앙 관리한다.

세션이 max turns로 끊겼다. 재연결 후 `git diff`로 상태를 확인하고 미완성 부분을 마저 이어서 빌드 검증까지 마쳤다.

```bash
npm run build
# ✓ Built in 8.23s
```

## Codex 교차검증 1차: blocking 4개, 재검증 approve

구현 완료 후 Codex CLI로 교차검증을 돌렸다. 결과는 `request-changes`.

blocking은 하나였다. `Projects.tsx`에서 모바일 CSS가 `.desc`/`.stack` 클래스를 숨기도록 설정되어 있는데, 헤더 `<span>`에는 그 클래스가 없어서 960px 이하에서 헤더와 row 그리드 셀 수가 어긋났다. 헤더 span에 row와 같은 클래스를 추가하는 방식으로 수정했다.

non-blocking 세 가지도 같이 처리했다.

- `home.css`에 `prefers-reduced-motion` 미디어 쿼리 추가 (pulse animation 대응)
- `Hero.tsx`의 빈 `data-ko="."` span 제거
- `ShipLog.astro`에서 `<p>` 안 `<strong>` 중첩이 언어 스위칭 스크립트와 충돌할 수 있어서 구조 수정

수정 후 Codex 2차 검증: `approve`. blocking 없음, 빌드 성공, `git diff --check` 통과 확인.

## "번역투" 피드백, 카피 다듬기 5라운드

빌드 검증 후 사용자 피드백이 들어왔다. "디자인 자체는 좋은데 번역투랑 불필요한 정보가 아쉬워."

문장 단위로 보니 번역투가 실제로 많았다. "운영 인덱스", "AI 빌더", "실험" 같은 말이 반복됐다. 생성된 카피 특유의 과장·추상 표현이었다. 5라운드에 걸쳐 다듬었다.

**1라운드** — 전체 카피 방향 전환. 짧고 구체적으로, 필요 없으면 삭제.

**2라운드** — 프로젝트 이미지 추가. `public/images/projects/`에 스크린샷이 8개 있었다. `src/data/home.ts`에 `PROJECT_IMAGE` 매핑을 추가하고 `Projects.tsx`에서 `<img>` 태그로 렌더링. 이미지가 없는 프로젝트는 CSS 기반 color swatch로 fallback. 첫 Codex 검수에서 `PROJECT_IMAGE`를 추가했지만 `Projects.tsx`에서 import하지 않아서 실제 렌더링이 안 되는 버그를 잡았다.

**3라운드** — Lab 섹션 제거. 내부 Claude Code 스킬·훅·파이프라인을 마케팅 문구로 쓴 섹션이 있었다. 사용자 요청: "매일 굴리는 툴체인 빼줘." `src/pages/index.astro`에서 `<Lab>` import와 컴포넌트를 삭제했다.

**4라운드** — 퍼블릭 페이지 전반의 jargon 제거. `about.astro`, `ai-news/index.astro`, `public/llms.txt`에서 "Claude Code 스킬", "multi-agent orchestration", "매일 08:00 KST cron" 같은 내부 구현 노출 문구를 정리했다. `llms.txt`는 전면 재작성해서 understated 포트폴리오/빌드 로그 아카이브 설명으로 바꿨다.

**5라운드** — 메타데이터 정리. `src/layouts/Base.astro`의 schema.org, footer, 기본 description에서 "AI 에이전트", "MCP 서버", "Built with Claude Code" 표현을 제거했다.

## .gitignore 정리

Codex가 별도로 지적했다. untracked 로컬 디렉토리들이 `.gitignore`에 없어서 프로덕션 커밋에 실수로 포함될 수 있다는 거였다.

`.claude/agent-memory/`, `.claude/worktrees/`, `.wrangler/`를 추가했다. `.vercel/` 항목은 기존에 중복 항목이 있어서 하나로 정리했다. `.vercelignore`는 배포 안전망이므로 그대로 유지하고 커밋에 포함시켰다.

## 배운 것

**카피는 코드보다 라운드가 더 많이 든다.** 컴포넌트 재작성은 세션 하나에 끝났는데, 카피 다듬기는 5라운드가 들어갔다. "번역투 제거"는 지시로 되는 게 아니라, 실제 문장을 보면서 하나씩 제거해야 한다. 프롬프트에 구체적인 예시("이 표현을 이렇게 바꿔라")를 넣을수록 결과가 빨랐다.

**퍼블릭 카피에서 내부 구현 디테일을 드러내지 않는다.** "Claude Code로 매일 자동 생성된다"는 기술적으로 사실이지만, 그게 마케팅 포인트가 되면 이상해진다. 사용자가 쓰는 서비스를 설명하지, 어떤 CLI 도구로 만들었는지를 설명하는 게 아니다.

도구 사용 통계: 핵심 구현 세션(세션 8)에서 Bash 22회, Read 20회, Write 10회, Edit 5회. 카피 수정 세션들에서는 Read와 Edit이 압도적이었다. 전체 27세션 합산 350+ tool calls.

> 디자인은 하루면 끝났다. 글을 사람 목소리로 만드는 데 나머지 시간이 들어갔다.
