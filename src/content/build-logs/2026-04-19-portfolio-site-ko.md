---
title: "Telegram 원격 지시로 3개 프로젝트 동시 운영 — source.title 버그 수정 + dentalad 신규 레포 생성"
project: "portfolio-site"
date: 2026-04-19
lang: ko
tags: [claude-code, debugging, telegram, automation, spoonai]
description: "spoonai.me 기사 카드에 원문 제목이 통째로 뜨는 버그를 MD 24개 일괄 수정으로 해결. 두 번째 세션은 Telegram MCP로 원격 지시만으로 dentalad 신규 레포 생성, 해커톤 검색, Claude 디자인 블로그 발행까지. 2세션 총 174 tool calls."
---

spoonai.me 기사 카드 날짜 옆에 `Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong`이 그대로 출력됐다. 퍼블리셔 이름이 있어야 할 자리에 기사 제목 전체가 들어가 있었다.

**TL;DR** `source.title` 필드에 퍼블리셔명 대신 원문 기사 제목이 들어가 있던 것이 원인. MD 24개 일괄 교체 + SKILL.md 스펙 보강으로 즉시 해결. 두 번째 세션은 Claude Code를 직접 열지 않고 Telegram 메시지만으로 dentalad 신규 레포 생성, 판교 해커톤 검색, 블로그 발행까지 처리했다.

## 버그는 컴포넌트가 아니라 데이터에 있었다

`ArticleCard.tsx:148`이 `post.source.title`을 날짜 옆에 렌더링한다. 컴포넌트 로직은 정상이었다.

```yaml
# content/posts/2026-04-16-asml-q1-2026-ai-chip-guidance-raise-ko.md
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
  url: "https://www.cnbc.com/..."
```

`source.title`에 `CNBC`가 있어야 했는데 기사 원문 제목이 통째로 들어가 있었다. 자동 생성 스크립트가 필드 의미를 잘못 해석한 결과다. 2026-04-15부터 04-17 사이에 생성된 MD 전부 같은 패턴이었다. 총 24개.

수정은 두 방향으로 했다. 먼저 SKILL.md 스펙에 퍼블리셔명만 넣도록 명시적 예시를 추가했다.

```
source.title: "CNBC"  # 퍼블리셔명만 (CNBC, The Verge, TechCrunch 등). 기사 제목 금지
```

그 다음 기존 24개 MD를 `source.url` 도메인 기반으로 일괄 교체했다.

```
cnbc.com       → CNBC
theverge.com   → The Verge
techcrunch.com → TechCrunch
reuters.com    → Reuters
```

커밋 `703f6fc` — 25 files, +26 -26.

## 미커밋 83개 레포에서 선택적 스테이징

`git status` 결과가 예상보다 훨씬 길었다. 내가 고친 26개 파일 외에 이전 세션들이 쌓아놓은 변경 57개가 섞여 있었다.

미커밋 구성:
- 홈 UI 대공사: `HomeContent.tsx` +523줄, `ArticleCard.tsx` 293줄 재작성, `globals.css` +257줄
- Header/Footer/Logo/About/Archive 리디자인
- 관리자 인증 로직 신규
- SNS 포스터 스크립트 3개 신규
- 예전 기사 이미지 백필 18개 MD

총 약 1,700줄 차이. 이 상태에서 `git push`하면 내 수정과 선행 작업이 하나의 커밋에 섞인다. 파일명을 직접 지정해 내 26개만 선택적으로 스테이징했다.

```bash
git add SKILL.md content/posts/2026-04-1*.md
git commit -m "fix: source.title을 퍼블리셔명으로 교체 (24개 MD)"
```

나머지 57개는 그대로 보존.

## Vercel CANCELED — 빈 커밋으로 재트리거

푸시 직후 Vercel 배포 상태가 `CANCELED`였다. 빌드 큐에서 취소된 것이다. 해결책은 단순하다.

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

이번엔 정상 빌드됐다. 배포 재트리거에 빈 커밋이 유용하다는 걸 다시 확인했다.

## Telegram으로 원격 지시 — 3개 요청 처리

두 번째 세션 전체를 Telegram MCP로 진행했다. Claude Code를 직접 열지 않았다. 텔레그램 메시지를 보내면 Claude가 실행하고 결과를 다시 메시지로 보내는 구조다.

**dentalad 신규 레포:** "치과광고 영어로 한 프로젝트 git 연동되는 걸로 하나 더 파줘." 프로젝트명 확인 과정을 거쳐 `~/dentalad/` 로컬 생성 + `github.com/jee599/dentalad` private 레포 연동 + 초기 스캐폴드 푸시까지 처리했다. 구조는 `clinics/`, `ads-research/`, `site/`, `templates/`, `docs/`. 도중에 Telegram MCP가 한 번 끊겼고 재연결 후 완료 알림을 재전송했다.

**판교 해커톤 검색:** WebSearch 16회. 4월 14일·17일 행사는 이미 종료됐고 현재 열린 등록창이 없다는 결과였다. 대신 등록 가능한 공신력 있는 AI 해커톤 4건을 정리해서 전달했다.

**Claude 디자인 블로그:** `auto-publish` 스킬로 spoonai.me(한국어) + DEV.to(영어) 동시 생성·발행. 생성 파일:
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md`
- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md`

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

Bash(79)가 전체의 45%를 차지한다. MD 24개 일괄 `sed`, `git` 명령 반복, Vercel MCP 폴링, dentalad 레포 초기화가 전부 셸이다. WebSearch 16은 판교 행사 검색 때문.

## 스펙은 예시까지 포함해야 한다

자동 생성 콘텐츠는 스펙 필드 설명이 모호할수록 오염된다. `source.title`에 예시 없이 "제목"이라고만 써두면 스크립트는 더 구체적인 값인 기사 원문 제목을 넣는다. 필드 설명에 `"CNBC, The Verge, TechCrunch 등 퍼블리셔명만"` 처럼 예시와 금지 사항을 같이 명시해야 오해가 없다.

미커밋이 쌓인 레포에서 작업할 때는 파일명을 직접 지정해 스테이징 범위를 좁히는 것이 핵심이다. `git add .`가 아니라 `git add SKILL.md content/posts/2026-04-1*.md`처럼.

> 버그의 절반은 데이터 문제다. 컴포넌트 코드가 아니라 frontmatter 필드에 잘못된 값이 들어가 있었다.
