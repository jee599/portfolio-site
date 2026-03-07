---
title: "1인 개발자를 위한 AI 자동화 스택 구성법"
date: 2026-03-07
tags: [automation, ci-cd, claude-code, vercel]
---

## 코드만 짜면 나머지는 자동으로

1인 개발에서 가장 시간을 잡아먹는 건 코드가 아니라 **반복 작업**이다. 블로그 쓰기, 배포, PR 관리... 이걸 자동화하면 코딩에만 집중할 수 있다.

## 추천 자동화 스택

### 빌드 로그 자동 생성
```
git push → husky pre-push hook → Claude CLI → 빌드 로그 마크다운 생성
```
커밋 diff를 Claude에게 넘기면 한/영 빌드 로그를 자동으로 생성한다. 개발하면서 동시에 블로그 콘텐츠가 쌓인다.

### 자동 PR + 머지
```yaml
# .github/workflows/auto-merge-claude.yml
on:
  push:
    branches: ['claude/**']
# → 자동 PR 생성 → squash 머지 → 브랜치 삭제
```
Claude Code가 만든 브랜치는 자동으로 main에 머지된다.

### 매일 자동 재빌드
```json
// vercel.json
{ "crons": [{ "path": "/api/revalidate", "schedule": "0 6 * * *" }] }
```
dev.to에 글을 올리면 다음 날 자동으로 포트폴리오 사이트에 반영된다.

## 핵심 원칙

> **수동으로 2번 이상 반복한 작업은 자동화하라.**

자동화에 투자한 시간은 며칠 안에 회수된다. 특히 AI 도구와 결합하면 자동화 자체도 빠르게 만들 수 있다.
