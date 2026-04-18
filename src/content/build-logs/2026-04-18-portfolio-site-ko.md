---
title: "source.title 버그 추적: 기사 카드 24개 일괄 교체 + Vercel CANCELED 탈출기"
project: "portfolio-site"
date: 2026-04-18
lang: ko
tags: [claude-code, debugging, spoonai, deployment, vercel]
description: "spoonai.me 기사 카드에 퍼블리셔명 대신 원문 제목 전체가 노출되는 버그. 원인 찾는 데 2분, MD 24개 일괄 수정 후 Vercel 배포가 CANCELED 뜨는 두 번째 삽질까지 77 tool calls 기록."
---

spoonai.me 기사 카드 날짜 옆에 `Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong` 같은 긴 문장이 노출되고 있었다. 퍼블리셔명이 있어야 할 자리에 원문 기사 제목이 통째로 들어간 것이다.

**TL;DR** `source.title` 필드가 퍼블리셔명이 아닌 원문 기사 전체 제목으로 세팅돼 있었다. MD 24개 일괄 교체 + SKILL.md 2곳 수정으로 해결했지만, Vercel 배포가 CANCELED 상태에 빠지는 두 번째 문제가 기다리고 있었다.

## 원인은 컴포넌트가 아니라 데이터였다

첫 반응은 `ArticleCard.tsx`를 확인하는 것이었다. `:148` 라인에서 `post.source.title`을 날짜 옆에 렌더링하는 코드를 찾았다. 컴포넌트 로직 자체는 정상이었다. 문제는 상위에 있었다.

`content/posts/2026-04-16-asml-q1-2026-ai-chip-guidance-raise-ko.md` 프론트매터를 열어보면:

```yaml
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
  url: "https://www.cnbc.com/..."
```

`source.title`에 `CNBC`가 아니라 기사 제목 전체가 들어가 있었다. 자동 생성 스크립트가 이 필드를 퍼블리셔명이 아닌 원문 제목으로 채운 것이다. 2026-04-15부터 04-17 사이에 생성된 MD 전부가 같은 패턴이었다.

수정 범위가 확정됐다. `~/spoonai-site/SKILL.md`와 `~/.claude/skills/spoonai-daily-briefing/SKILL.md` 2곳을 수정해 앞으로 생성될 기사 스펙을 고치고, `content/posts/` 24개는 `source.url` 도메인 기반으로 퍼블리셔명을 매핑해 일괄 교체했다.

도메인 → 퍼블리셔 매핑은 단순했다. `cnbc.com` → `CNBC`, `theverge.com` → `The Verge`, `techcrunch.com` → `TechCrunch`. Bash로 24개 파일을 순회하면서 `sed`로 처리했다.

## 83개 미커밋 변경이 섞여 있었다

`git status`를 치면 내가 고친 26개 파일 외에 **57개가 더** 올라와 있었다. 이전 세션들이 쌓아놓은 미커밋 변경들이었다.

홈 UI 리디자인 (`HomeContent.tsx` +523줄, `ArticleCard.tsx` 293줄 재작성), `globals.css` +257줄, Header/Footer/Logo 전부, 관리자 인증 로직, SNS 포스터 스크립트 3개. 총 83개 파일, 약 1,700줄 차이.

이 상태에서 `git push`를 하면 내 수정과 선행 작업이 섞인다. 나중에 "어떤 커밋 때문에 무엇이 바뀌었는지" 추적이 불가능해진다. 그래서 내 26개 파일만 선택적으로 스테이징하고 나머지는 보존했다.

```bash
git add SKILL.md content/posts/2026-04-1*.md
git commit -m "fix: source.title을 퍼블리셔명으로 교체 (24개 MD)"
```

커밋 `703f6fc` — 25 files, +26 -26.

## Vercel이 CANCELED를 반환했다

푸시 직후 확인했더니 배포 상태가 `CANCELED`였다. `list_deployments` MCP 툴로 확인해보니 빌드가 시작도 못 하고 취소된 상태였다.

원인은 Vercel 쪽 빌드 큐 이슈로 추정됐다. 해결책은 단순했다. 빈 커밋으로 배포를 다시 트리거하는 것이다.

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

이번엔 정상적으로 빌드가 시작됐고 spoonai.me에 반영됐다.

## 세션 통계

1시간, 77 tool calls. Bash 40회가 압도적으로 많은 건 `git status`, `git log`, `git diff`, 도메인→퍼블리셔 매핑 `sed`, Vercel MCP 폴링이 쌓였기 때문이다. 실제 코드 수정(Edit)은 3번뿐이었다.

도구별: Bash(40), Read(10), Grep(7), TaskUpdate(6), Edit(3), ToolSearch(4). 수정 파일 26개, 생성 파일 0개.

## 배운 것

자동 생성 콘텐츠는 필드 의미가 모호할수록 오염된다. `source.title`이 "원문 제목"인지 "퍼블리셔명"인지 SKILL.md에 명시되지 않았기 때문에 생성 스크립트가 더 구체적인 값(기사 제목)을 넣었다. 스펙에 `퍼블리셔명만 (CNBC, The Verge, TechCrunch 등)`을 명시해두면 다음 자동 생성부터는 재발하지 않는다.

배포 CANCELED는 재현이 어렵고 원인도 불명확하다. 빈 커밋 재트리거가 가장 빠른 탈출구다.
