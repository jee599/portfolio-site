---
title: "7일 연속 무음 장애: Claude Code로 원인 파악, AgentCrow로 복구까지"
project: "portfolio-site"
date: 2026-03-24
lang: ko
tags: [claude-code, debugging, agentcrow, automation, spoonai]
description: "spoonai 이메일 파이프라인이 7일간 조용히 실패하고 있었다. Claude Code 29번의 tool call로 원인을 찾고, AgentCrow 3-agent 병렬 실행으로 수동 복구했다."
---

3/24 아침, "오늘 이메일 왜 또 안됐어"라는 메시지 한 줄이 왔다. '또'라는 단어에 주목했다. 이미 반복된 문제라는 뜻이다.

**TL;DR** Claude CLI 로그아웃이 3/17부터 7일 연속 뉴스 생성 파이프라인을 조용히 죽이고 있었다. Claude Code로 원인을 추적하고, AgentCrow 3-agent로 당일 복구까지 완료했다.

## "오늘도" 아니라 "7일 연속"이었다

첫 번째 세션(21 tool calls)에서 한 일은 단순한 오늘 로그 확인이 아니었다.

`~/spoonai/data/logs/`를 뒤지다 보니 `generate-ai-news.sh`가 매일 실패했다는 기록이 쌓여 있었다. 종료 코드 1. 에러 메시지: **"Not logged in · Please run /login"**.

```bash
# 크론 스케줄
3 9 * * *  # 매일 KST 09:03
```

크론 자체는 정상 실행됐다. 스케줄러 로그(`lastRunAt: 2026-03-23T23:52:15.896Z`)에도 태스크 실행 기록이 남아 있었다. 문제는 실행 자체가 아니라, 실행된 스크립트가 Claude CLI를 호출하는 순간 로그아웃 상태로 즉시 종료됐다는 것.

연쇄 결과가 정확했다. Claude CLI 로그아웃 → 뉴스 기사 생성 0개 → 이메일 HTML 생성 스킵 → 발송 건너뜀 → 사용자: "이메일 또 왜 안 왔어?"

이 흐름을 21번의 tool call로 추적했다. Bash 15회, Glob 3회, Read 1회. 특히 `~/spoonai/crawl/` 디렉토리에 `2026-03-17.json`부터 `2026-03-24.json`까지 파일이 없다는 사실을 Glob으로 확인한 게 결정적이었다. 크롤링 파일이 없으면 그날 파이프라인 전체가 실패한 것이다.

## AgentCrow로 파이프라인 수동 복구

두 번째 세션(8 tool calls)에서는 로그인 완료 후 당일 파이프라인을 통째로 수동 실행했다.

파이프라인 순서는 명확했다. 크롤링 → 사이트 발행 → 이메일 HTML 생성. 2단계는 1단계 결과물이 필요하지만, 사이트 발행과 이메일 생성은 독립적이다. AgentCrow에게 이 의존성 구조를 그대로 넘겼다:

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 3 agents (2-phase sequential):

Phase 1:
🔄 @data_pipeline_engineer → 뉴스 크롤링 → ~/spoonai/crawl/2026-03-24.json

Phase 2 (Phase 1 완료 후 병렬):
🖥️ @senior_developer → 사이트 발행 (MD 생성 + git push + Vercel 배포)
📝 @content_writer → 이메일 HTML 생성 (ko/en)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

단계별로 명령하는 것보다 의존성 구조만 설명하고 위임하는 방식이 훨씬 깔끔하다. Phase 1 완료 여부를 확인하고 Phase 2를 트리거하는 로직도 AgentCrow가 알아서 처리했다.

## 이번 세션에서 배운 것

**도구 사용 통계 (전체 2세션)**
총 29 tool calls. Bash 19회(디버깅), Read 3회, Glob 3회, Agent 1회, Skill 1회.

자동화의 가장 조용한 실패 방식은 에러를 뱉지 않고 그냥 아무것도 안 하는 것이다. Claude CLI 로그아웃 상태에서 크론이 실행되면, 크론 자체는 성공으로 기록된다. `cron_logs`에는 "실행됨"이라고 남는다. 하지만 실제 산출물은 없다. 파이프라인 어딘가에 **"생성된 파일이 0개면 알림"** 같은 헬스체크가 없으면 며칠이고 무음으로 죽어 있을 수 있다.

> 자동화가 실패해도 아무 소리가 없다면, 실패 자체를 감지하는 레이어가 없다는 뜻이다.

Claude Code로 디버깅한 게 빠른 이유는 Bash, Glob, Read를 순서대로 조합하면서 증거를 쌓아가는 방식 때문이다. "이메일 왜 안됐어?"라는 질문 하나로 로그 탐색 → 원인 추적 → 연쇄 영향 분석까지 한 세션에 끝났다. 수동으로 SSH 들어가서 하나하나 확인하는 것보다 체계적이고 빠르다.
