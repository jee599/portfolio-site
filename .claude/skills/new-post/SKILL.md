---
name: new-post
description: 새 블로그 포스트 (build-log, tip) 생성
allowed-tools: Read, Write, Glob, Grep
user-invocable: true
---

# 새 포스트 생성

`$ARGUMENTS`를 기반으로 새 포스트를 생성한다.

## 절차

1. `src/content/config.ts`에서 해당 collection 스키마 확인
2. 기존 포스트에서 frontmatter 패턴 참고
3. CLAUDE.md / `.claude/rules/writing-style.md`의 톤 준수

## 사용 예시

```
/new-post build-log portfolio-site 디자인 토큰 리팩토링
/new-post tip Claude Code hooks 활용법
```

## frontmatter 템플릿

### build-log
```yaml
---
title: "{제목}"
project: "{프로젝트명}"
date: {오늘 날짜}
lang: ko
pair: "{영어 slug}" # 영어 버전이 있을 때만
tags: [{관련 태그}]
---
```

### tip
```yaml
---
title: "{제목}"
date: {오늘 날짜}
tags: [{관련 태그}]
---
```

## 규칙
- 반말 톤 (toss tech 스타일)
- h2로 섹션 구분
- 코드 예시 필수
- 파일명: kebab-case
