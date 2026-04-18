---
title: "미커밋 83개 뒤섞인 레포에서 버그 수정 + Telegram 원격 작업, 174 tool calls"
project: "portfolio-site"
date: 2026-04-18
lang: ko
tags: [claude-code, debugging, spoonai, telegram, automation]
description: "spoonai.me 기사 카드에 원문 제목이 통째로 뜨는 버그 원인은 source.title 필드였다. MD 24개 일괄 수정, Vercel CANCELED 재트리거, Telegram MCP로 dentalad 신규 프로젝트 생성까지 2세션 174 tool calls."
---

spoonai.me 기사 카드 날짜 옆에 `Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong` 같은 기사 제목 전체가 출력되고 있었다. 퍼블리셔명(CNBC)이 있어야 할 자리에.

**TL;DR** `source.title`에 퍼블리셔명 대신 원문 기사 제목이 들어가 있었다. MD 24개 일괄 교체 + SKILL.md 스펙 수정으로 해결. 두 번째 세션은 Telegram MCP로 원격 지시 — dentalad 신규 프로젝트 생성, Claude 디자인 업데이트 블로그 발행까지.

## 원인은 컴포넌트가 아니라 데이터였다

`ArticleCard.tsx:148`에서 `post.source.title`을 날짜 옆에 렌더링한다. 컴포넌트 자체는 정상이었다.

`content/posts/2026-04-16-asml-q1-2026-ai-chip-guidance-raise-ko.md` 프론트매터:

```yaml
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
  url: "https://www.cnbc.com/..."
```

`source.title`에 `CNBC`가 아니라 기사 제목 전체가 들어가 있었다. 자동 생성 스크립트가 필드 의미를 모호하게 해석한 결과다. 2026-04-15부터 04-17 사이에 생성된 MD 전부가 같은 패턴이었다. 총 24개.

수정 범위: `~/spoonai-site/SKILL.md:527`과 `~/.claude/skills/spoonai-daily-briefing/SKILL.md:527` 두 곳에 "퍼블리셔명만 넣을 것(CNBC, The Verge, TechCrunch 등)" 명시. 기존 24개 MD는 `source.url` 도메인 기반으로 Bash `sed`로 일괄 교체했다.

```
cnbc.com      → CNBC
theverge.com  → The Verge
techcrunch.com → TechCrunch
reuters.com   → Reuters
```

## 미커밋 83개가 쌓여 있었다

`git status` 결과가 예상보다 훨씬 길었다. 내가 고친 26개 파일 외에 이전 세션들이 쌓아놓은 미커밋 변경 57개가 섞여 있었다.

구성을 뽑아보면:
- **홈 UI 대공사**: `HomeContent.tsx` +523줄, `ArticleCard.tsx` 293줄 재작성, `globals.css` +257줄
- **Header/Footer/Logo/About/Archive** 전부 리디자인
- **관리자 인증 로직** 신규
- **SNS 포스터 스크립트 3개** 신규
- **예전 기사 이미지 백필** 18개 MD

총 83개 파일, 약 1,700줄 차이. 이 상태에서 `git push`하면 내 수정과 선행 작업이 하나의 커밋에 섞인다.

내 26개 파일만 선택적으로 스테이징했다.

```bash
git add SKILL.md content/posts/2026-04-1*.md
git commit -m "fix: source.title을 퍼블리셔명으로 교체 (24개 MD)"
```

커밋 `703f6fc` — 25 files, +26 -26. 나머지 57개는 그대로 보존.

## Vercel CANCELED, 빈 커밋으로 재트리거

푸시 성공 후 Vercel 배포 상태가 `CANCELED`였다. 빌드 큐에서 취소된 것이다. 원인은 불명확하지만 해결책은 단순하다.

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

이번엔 정상 빌드됐다.

## 세션 2: Telegram으로 원격 지시

두 번째 세션은 Claude Code를 직접 열지 않고 Telegram MCP로 진행했다. 텔레그램 메시지 → Claude 실행 → 결과 알림 구조.

**첫 번째 요청:** "치과광고 영어로 한 프로젝트 git 연동되는 걸로 하나 더 파줘."

프로젝트 이름 확인 과정을 포함해 `~/dentalad/` 로컬 생성 + `github.com/jee599/dentalad` private 레포 연동 + 초기 스캐폴드 푸시까지 처리했다. 구조는 `clinics/`, `ads-research/`, `site/`, `templates/`, `docs/`. 도중에 Telegram MCP가 한 번 끊겼고 재연결 후 완료 알림을 다시 전송했다.

**두 번째 요청:** "판교/서울 근처 Claude 관련 미팅이나 해커톤 등록 가능한 거 검색해줘."

WebSearch 16회. 4월 14일·17일 행사는 이미 종료됐고 현재 열린 등록창이 없다는 결과. 대신 등록 가능한 공신력 있는 AI 해커톤 4건(Snowflake Summit, AI Co-Scientist Challenge, 교육공공데이터 해커톤, Meta Llama Academy @ 판교)을 정리해서 전달했다.

**세 번째 요청:** "Claude 디자인 업데이트 최신 소식 devto랑 spoonai.me에 블로그 글 써줘."

`auto-publish` 스킬로 두 플랫폼 동시 생성. 출력 파일:
- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md`
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md`

## 수치

| 항목 | 값 |
|------|-----|
| 세션 수 | 2 (1h + 19h) |
| 총 tool calls | 174 |
| Bash | 79 |
| Read | 17 |
| WebSearch | 16 |
| WebFetch | 11 |
| Grep | 8 |
| 수정 파일 | 2개 |
| 생성 파일 | 5개 |

Bash(79)가 압도적으로 높다. MD 24개 일괄 `sed`, `git status`/`log`/`diff` 반복, Vercel MCP 폴링, dentalad 레포 초기화 작업이 전부 셸 명령이다. WebSearch 16은 판교 행사 검색 때문.

## 교훈

자동 생성 콘텐츠는 스펙 필드 설명이 모호할수록 오염된다. `source.title`에 "(퍼블리셔명: CNBC, TechCrunch 등)"이라고 명시해두지 않았기 때문에 생성 스크립트가 더 구체적인 값인 기사 제목을 넣었다. 스펙은 예시까지 포함해야 오해가 없다.

미커밋이 쌓인 레포에서 작업할 때는 커밋 파일 목록을 명시적으로 좁히는 것이 핵심이다. "다 커밋해"가 아니라 파일명을 직접 지정해야 한다.

> 버그의 절반은 데이터 문제다. 컴포넌트 코드가 아니라 frontmatter 필드에 잘못된 값이 들어가 있었다.
