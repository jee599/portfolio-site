---
title: "AI News 자동 포스팅 시스템 가동"
date: 2026-03-07
model: etc
tags: [ai-news, automation, launch]
summary: "매일 아침 9시, Claude/Gemini/GPT 등 주요 LLM 소식을 자동으로 수집하고 포스팅한다."
sources: []
auto_generated: false
---

## AI News 자동 포스팅 시작

이 사이트는 매일 아침 9시(KST)에 주요 LLM 모델들의 최신 소식을 자동으로 수집한다.

### 추적 대상

- **Claude** (Anthropic): 모델 업데이트, API 변경, 새로운 기능
- **Gemini** (Google): 모델 출시, 멀티모달 업데이트
- **GPT** (OpenAI): GPT 시리즈 업데이트, ChatGPT 기능
- **기타**: Llama, Mistral, 오픈소스 LLM 등

### 동작 방식

1. 매일 9시(KST) Vercel Cron이 API 엔드포인트를 호출한다
2. 전날 올라온 주요 LLM 관련 뉴스를 검색한다
3. 포스팅할만한 내용을 선별하고 블로그 포스트로 자동 생성한다
4. 다음 빌드 시 사이트에 반영된다
