---
title: "Claude Sonnet이 커밋 데이터를 블로그 포스트로 바꾸는 파이프라인 — generate-build-log 동작 원리"
project: "portfolio-site"
date: 2026-04-12
lang: ko
tags: [claude-code, claude-api, automation, github-actions, content-pipeline]
description: "커밋이 3개 쌓이면 Claude Sonnet이 자동으로 빌드 로그를 생성한다. GitHub Actions cron을 로컬 launchd로 이전한 이유와 파이프라인 전체 구조를 공개한다."
---

`git log`를 보면 `feat: build logs 2026-04-11 (2 posts, auto)`라는 커밋이 4개 연속으로 쌓여 있다. 같은 날 같은 내용으로 4번 실행됐다는 뜻이다. 파이프라인이 트리거를 제대로 제어하지 못하고 있다는 신호다. 이걸 계기로 `generate-build-log.yml` 전체를 다시 들여다봤다.

**TL;DR** 커밋 3개 이상이 쌓이면 Claude Sonnet이 커밋 데이터를 분석하고 빌드 로그를 자동 생성한다. GitHub Actions cron에서 로컬 launchd로 이전했고, `[skip-log]` 패턴으로 무한 루프를 막는다.

## 파이프라인이 하는 일

`generate-build-log.yml`은 `src/content/projects/*.yaml` 파일을 읽어서 등록된 프로젝트 목록을 얻는다. 각 프로젝트의 GitHub 저장소에서 마지막 빌드 로그 이후의 커밋을 가져온다. 커밋이 3개 미만이면 건너뛴다. 3개 이상이면 Claude Sonnet에게 커밋 데이터를 넘기고 마크다운 빌드 로그를 생성한다.

Claude에게 넘기는 데이터 구조는 이렇다:

```json
{
  "project": "사주 글로벌",
  "slug": "saju_global",
  "date": "2026-04-12",
  "commits": [
    { "sha": "abc1234", "message": "feat: add zodiac compatibility content", "author": "jidong" }
  ],
  "stats": { "totalCommits": 15, "filesChanged": 42, "additions": 1200, "deletions": 80 },
  "changedFiles": ["src/lib/compatibility.ts", "src/pages/compat/[pair].astro"]
}
```

커밋 해시, 메시지, 변경 파일, 추가/삭제 줄 수가 전부다. 코드 내용 자체는 넘기지 않는다. Claude가 커밋 메시지와 파일 패턴만 보고 "이 작업에서 AI를 어떻게 활용했는지"를 추론해서 블로그 포스트 형태로 작성한다.

## Claude에게 시키는 방식

단순히 "블로그 포스트 써줘"가 아니다. 시스템 프롬프트는 160줄짜리 상세 지침이다.

핵심 지시문 중 하나:

> "아래 커밋 데이터는 **맥락**일 뿐이다. 커밋을 나열하는 글이 아니라, 이 작업을 하면서 **어떻게 AI를 활용했는지, 어떤 프롬프팅 기법을 썼는지, 어떤 도구와 패턴이 효과적인지**를 깊이 있게 다루는 교육적 블로그 포스트를 작성한다."

나쁜 빌드 로그 제목 예시를 명시적으로 주었다:

```
❌ "[사주 분석 앱] 새 기능 추가 외 8건"
❌ "2026-03-09 사주앱 업데이트"
✅ "Claude Code로 i18n 8개 언어를 한번에 처리하는 프롬프트 패턴"
```

출력 형식도 강제한다. 첫 줄에 `<!-- META: {"title": "제목", "slug": "kebab-case"} -->`를 넣도록 해서 파이프라인이 파싱할 수 있게 한다. frontmatter는 파이프라인이 직접 조립한다.

모델은 `claude-sonnet-4-20250514`다. 빌드 로그는 단순 텍스트 생성이 아니라 커밋 패턴에서 인사이트를 추론하는 작업이라 Haiku로는 부족하다.

## 트리거 문제: 같은 날 4번 실행

`feat: build logs 2026-04-11 (2 posts, auto)` 커밋이 4번 연속으로 생긴 원인은 트리거 설계였다.

원래 구조는 `push` + `schedule`이 동시에 설정되어 있었다. 빌드 로그 자동 커밋이 `push` 이벤트를 발생시키면 워크플로우가 다시 트리거된다. `[skip-log]` 태그를 커밋 메시지에 붙여서 막으려 했지만, `skipPatterns` 필터가 파이프라인 내부에서만 적용되고 GitHub Actions 트리거 레벨에서는 작동하지 않는다.

해결책은 GitHub Actions cron 제거다. 현재 `generate-build-log.yml`의 주석이 이 결정을 보여준다:

```yaml
on:
  workflow_dispatch:
  # push 트리거 제거 — 로컬 launchd cron으로 관리
  # schedule도 제거 — GitHub Actions에서 빌드 로그 자동 생성 중단
```

로컬 `launchd`에서 `workflow_dispatch`를 트리거하는 방식으로 전환했다. GitHub Actions cron은 레포 활동이 없으면 비활성화되는 quirk도 있다. 로컬 cron이 더 신뢰할 수 있다.

## saju_global 빌드 로그가 생성되는 흐름

오늘(2026-04-12) 기준으로 `saju_global`에서는 2,357개의 Claude Haiku API 세션이 실행됐다. 세션마다 `0 tool calls`, 순수 텍스트 생성이다. 12지 궁합 144쌍 × 8개 언어 = 1,152개 콘텐츠 블록을 채우는 작업이다.

이 세션들이 `saju_global` 레포에 커밋으로 쌓이고, 일정 임계값을 넘으면 `generate-build-log.yml`이 해당 커밋 데이터를 가져와 Claude Sonnet에게 넘긴다. Sonnet이 "Haiku로 다국어 콘텐츠 대량 생성한 패턴"을 분석해서 오늘 생성된 `2026-04-12-saju_global-ko.md`를 만든다.

파이프라인이 스스로의 소재를 찾아서 포스트를 만드는 구조다.

## Claude API 실패 시 fallback

Claude API 키가 없거나 호출 실패 시 코드 기반 fallback이 있다.

```javascript
const typeLabels = {
  feat: '새 기능 추가', fix: '버그 수정',
  refactor: '코드 리팩토링', chore: '유지보수 작업',
};
logTitle = `[${title}] ${today} — ${typeLabels[dominantType]} 외 ${relevantCommits.length}건`;
```

커밋 타입별로 분류해서 단순 목록 형태로 생성한다. 읽을 만한 글은 아니지만 데이터는 보존된다. Claude API 기반 생성과 fallback의 품질 차이가 크기 때문에 API 키 설정은 사실상 필수다.

## 더 나은 방법은 없을까

### 1. Structured Outputs 활용

현재는 Claude에게 `<!-- META: {...} -->` 형태의 커스텀 포맷을 강제하고 regex로 파싱한다. Anthropic의 `tool_use`나 Structured Outputs를 쓰면 JSON을 직접 반환받을 수 있다. 파싱 실패 위험이 없어진다.

```json
{
  "title": "빌드 로그 제목",
  "slug": "build-log-slug",
  "body": "마크다운 본문..."
}
```

### 2. 임계값 조정

현재 3커밋 임계값은 너무 낮다. `saju_global`처럼 API 콜 기반 프로젝트는 하루에 수천 개의 "커밋 유사 이벤트"가 있지만 실제 코드 커밋은 적다. 임계값을 프로젝트별로 다르게 설정하는 게 맞다.

### 3. 영문 버전 자동 생성

현재는 한국어(`-ko.md`)만 자동 생성한다. DEV.to 발행을 위한 영문 버전은 수동이다. 같은 커밋 데이터로 영문 버전을 병렬 생성하면 된다. 모델 호출 2번, 비용은 2배지만 영문 독자에게 도달하는 콘텐츠가 생긴다.

## 정리

- **커밋 데이터만으로 교육적 블로그 포스트가 가능하다** — 코드 내용 없이 커밋 메시지와 파일 패턴만으로 Claude Sonnet이 "AI 활용 방법론" 포스트를 쓴다.
- **트리거 설계가 파이프라인 안정성을 결정한다** — GitHub Actions cron + push 조합은 루프를 유발한다. 로컬 launchd + workflow_dispatch가 더 안전하다.
- **3커밋 임계값은 프로젝트 성격에 맞춰야 한다** — API 콜 기반 프로젝트와 코드 커밋 기반 프로젝트는 커밋 패턴이 다르다.
- **fallback은 데이터 보존용이다** — Claude API 없이 생성된 포스트는 목록 형식에 불과하다. 실제 가치는 Sonnet 기반 생성에서 나온다.

<details>
<summary>관련 파일</summary>

`.github/workflows/generate-build-log.yml` — 빌드 로그 자동 생성 워크플로우
`src/content/projects/*.yaml` — 등록된 프로젝트 목록
`src/content/build-logs/` — 생성된 빌드 로그 마크다운 파일들

</details>
