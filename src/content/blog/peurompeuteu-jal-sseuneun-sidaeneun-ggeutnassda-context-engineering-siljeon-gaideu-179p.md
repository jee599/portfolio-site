---
title: "프롬프트 잘 쓰는 시대는 끝났다 — Context Engineering 실전 가이드"
description: "집중된 300토큰이 113,000토큰보다 나은 성능을 보인다. 적게, 정확하게 넣는 기술"
pubDate: "2026-03-09"
tags: "ai, llm, productivity, beginners"
lang: "ko"
source: "devto-migration"
---

LLM이 나쁜 답을 낼 때 원인은 모델보다 컨텍스트 설계인 경우가 많다. 컨텍스트는 시스템 프롬프트, 도구 정의, RAG 문서, 메모리, 대화 이력, 사용자 메시지까지 포함한 전체 입력이다.

## 핵심 문제: context rot

정보를 많이 넣는다고 성능이 오르지 않는다. 길고 산만한 컨텍스트는 회상 정확도를 떨어뜨린다. 특히 중간 구간 정보를 놓치는 Lost in the Middle 현상이 자주 발생한다.

## 실전 기법

1. **RAG 조각화**: 전체 문서가 아니라 관련 청크만 삽입
2. **대화 이력 관리**: Sliding window / 요약 / 중요도 선별
3. **System Prompt 구조화**: role/rules/tool guidance를 명시적으로 분리
4. **Tool Definition 다이어트**: 항상 30개 로딩 금지, 작업별 동적 로딩
5. **Just-in-Time Loading**: 필요 시점에만 파일/규칙/문서 로드
6. **Prompt Caching**: 반복 호출 시 고정 프롬프트 비용 절감

## 실패 모드 2가지

- Context Poisoning: 과거 환각이 다음 턴에 사실처럼 재사용
- Context Distraction: 무관한 정보 과다로 핵심 신호 희석

결론은 단순하다. 많이 넣는 게 아니라 **정확히 넣는 것**이 성능과 비용을 동시에 개선한다.

> 가장 좋은 context는 가장 짧은 context다. 단, 빠진 게 없어야 한다.

---
- [Anthropic Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [A Survey of Context Engineering for LLMs](https://arxiv.org/abs/2507.13334)
- [O’Reilly Signals for 2026](https://www.oreilly.com/radar/signals-for-2026/)
