---
title: "CLAUDE.md 하나로 팀 전체의 AI 품질을 통일한 방법"
description: "팀원 10명이 각자 다른 프롬프트를 쓰면 답변 품질이 들쭉날쭉하다. 한 파일로 해결했다"
date: "2026-03-09"
tags: ["ai", "productivity", "beginners", "webdev"]
source: "devto"
---

팀의 AI 품질 편차는 모델 문제가 아니라 컨텍스트 표준 부재에서 나온다. 같은 질문에 다른 답이 나오는 이유는 팀원이 각자 다른 프롬프트/규칙을 쓰기 때문이다.

우리는 4개 계층으로 해결했다.

1. Organization: 예산/모델 접근/커넥터 정책
2. Project: 공통 Instructions + Knowledge Base
3. CLAUDE.md: 프로젝트 메모리 표준
4. Usage Guidelines: 모델 선택, 대화 습관, KB 위생

## CLAUDE.md 운영 원칙

- 150줄 내외 유지
- 규칙이 길면 `.claude/rules/`로 분리
- paths 프론트매터로 조건부 로딩(Just-in-time)
- 생성은 Claude(/init), 큐레이션은 사람이 담당

## 결과

프로젝트 단위 컨텍스트를 표준화하면 신규 온보딩 속도와 응답 일관성이 동시에 개선된다.

> 좋은 AI 도입은 도구 구매가 아니라, 도구가 읽는 문서 표준화다.

---
- [Claude Team Plan](https://claude.com/pricing/team)
- [Claude Code Memory System](https://code.claude.com/docs/en/memory)
- [Claude Projects for Team Collaboration](https://amitkoth.com/claude-projects-team-collaboration/)
