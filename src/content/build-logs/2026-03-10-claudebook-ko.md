---
title: "Claude Book — 공식문서 정리해서 책으로 출판하기"
project: "claudebook"
date: 2026-03-10
lang: ko
pair: "2026-03-10-claudebook-en"
tags: [claude, documentation, publishing, markdown]
---

Anthropic Claude 공식문서를 체계적으로 정리하고 요약해서 책으로 출판하는 프로젝트를 시작했다.

## 왜 이 프로젝트를 시작했나

Claude 공식문서는 양이 방대하고 업데이트가 빈번하다. API reference, prompt engineering guide, model card 등이 흩어져 있어서 한눈에 파악하기 어렵다. 이걸 한 권의 책으로 정리하면 가치가 있다고 판단했다.

> 좋은 문서는 흩어진 정보를 한 곳에 모아 구조화한 것이다.

## 구성 계획

1. **Claude 모델 개요** — 모델별 특성, 가격, 컨텍스트 윈도우
2. **API 사용법** — Messages API, Tool Use, Vision, Streaming
3. **프롬프트 엔지니어링** — 공식 가이드 요약 + 실전 예시
4. **Claude Code** — CLI 도구 사용법과 활용 패턴
5. **실전 레시피** — 자주 쓰는 패턴을 코드 예제와 함께 정리

## 작업 방식

- 공식문서를 Markdown으로 변환하면서 핵심만 추출
- 각 챕터를 독립적으로 읽을 수 있게 구성
- Astro로 웹 버전도 함께 제공할 예정

## 현재 진행 상황

- 문서 구조 설계 완료
- 모델 개요 챕터 초안 작성 중
- API reference 섹션 정리 시작
