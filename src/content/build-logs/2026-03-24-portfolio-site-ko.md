---
title: "HTTP 200인데 이메일이 안 왔어 — 7일 묵은 버그부터 구독자 11명 전송까지"
project: "portfolio-site"
date: 2026-03-24
lang: ko
tags: [claude-code, agentcrow, email-pipeline, debugging, spoonai]
description: "Claude CLI 로그아웃이 7일간 뉴스 파이프라인을 죽이고 있었다. 발견, 복구, 디자인 수정, 전체 발송까지 8개 세션 153 tool calls 하루치 기록."
---

오늘 하루 8개 세션, 153 tool calls를 썼다. 코드는 별로 안 짰다. 죽어있던 파이프라인을 찾아내고, 복구하고, 이메일을 11명에게 보냈다.

**TL;DR** Claude CLI 로그아웃이 3/17부터 7일 연속 크롤링을 죽이고 있었다. AgentCrow 3개 에이전트로 복구하고, HTTP 200 받았는데 이메일이 안 온다는 리포트를 두 번 받고, 결국 전체 구독자 발송까지 완료했다.

## 7일 된 버그를 Claude가 찾아냈다

"오늘 이메일 왜 안 왔어 또"로 시작한 첫 번째 세션(1min, 21 tool calls).

`~/spoonai/` 디렉토리를 훑었다. 로그를 보니 크론이 매일 09:03 KST에 `generate-ai-news.sh`를 실행하는데, 내부에서 Claude CLI를 호출할 때 다음 에러로 종료 코드 1이 반환되고 있었다.

```
Not logged in · Please run /login
```

여기까지는 흔한 오류다. 문제는 기간이었다. 로그 날짜를 보니 **3월 17일부터 오늘(3/24)까지 7일 연속** 같은 에러였다.

연쇄 결과가 명확했다. Claude CLI 로그아웃 → 뉴스 생성 0개 → 빈 crawl JSON → 이메일 HTML 생성 불가 → 발송 0건. 파이프라인의 첫 단계가 7일 동안 조용히 죽어있었는데, 표면에서는 "오늘도 이메일이 없네"로만 보인 거다.

진단에 21 tool calls가 걸렸다. Bash 15회로 로그 파일을 뒤졌고, Glob 3회로 crawl JSON 존재 여부를 확인했다.

## AgentCrow 2-phase 파이프라인 복구

로그인 완료 후 수동 복구 세션이 시작됐다(14min, 13 tool calls).

파이프라인 순서가 있다. 크롤링이 끝나야 사이트 발행과 이메일 생성이 가능하다. 그래서 순차+병렬 혼합 구조로 AgentCrow를 배치했다.

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 3 agents (2-phase sequential):

Phase 1:
🔄 @data_pipeline_engineer → 크롤링 → ~/spoonai/crawl/2026-03-24.json

Phase 2 (Phase 1 완료 후 병렬):
🖥️ @senior_developer → 기사 MD 생성 + 이미지 다운로드 + git push
📝 @writer            → 이메일 HTML 생성 (ko/en)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Phase 1이 끝나고 52건 수집 → 28건 선별(TOP5, BUZZ3, PAPER1, QUICK17, GITHUB3). 이 JSON을 넘겨 Phase 2를 병렬로 실행했다.

결과: 기사 MD 6개(NVIDIA GTC, Anthropic Marketplace, Meta Llama 4 × ko/en), OG 이미지 실패한 3건은 Wikimedia CC로 대체, 사이트 배포 완료.

## HTTP 200인데 이메일이 안 왔어

테스트 발송 세션(2min, 9 tool calls). `send-email.js`로 `jidongs45@gmail.com`에 테스트 발송을 완료했다. Resend API 응답 200, ID `ebf3a2a5-...`.

"안왔는데?"

두 번째 발송 세션(2min, 8 tool calls)이 시작됐다. 파일 위치 재확인, 다른 경로(`~/spoonai-site/data/output/`) 체크, `send-email.js` 사용법 재확인. 이번엔 HTML 파일과 스크립트를 명시적으로 지정해서 다시 발송했다. 두 번째 ID `ad836686-...`, 응답 200.

"스팸함도 체크해봐"를 추가했다. 사실 첫 번째 발송도 정상 처리됐을 가능성이 높다. Resend delivery status를 먼저 확인했어야 했는데, 바로 재발송부터 했다. 그래서 오늘 테스트 이메일이 2통 갔다.

## 이메일 디자인 수정: 48 tool calls

이메일이 도착한 걸 확인한 후 피드백이 왔다. "이전에 요청했던 디자인이 적용 안 돼 있다"는 내용이었다. 세션 5가 시작됐다(9min, 48 tool calls).

수정 항목 4가지: 키워드 태그 더 작게 + 팝한 색상, 링크 버튼 크기 축소, 피드백 섹션 디자인 개선, 전체적으로 확정된 TLDR 스타일 가이드 적용.

`email-2026-03-21-ko.html`을 레퍼런스로 읽어서 CSS 패턴을 비교했다. Edit 14회로 ko/en HTML 양쪽에 적용하고, 피드백 섹션 HTML을 업데이트했다. TodoWrite 7회는 4가지 수정 항목을 트래킹하는 데 썼다.

수정 완료 후 ko/en 이메일 템플릿 파일 2개를 새로 생성했다(`email-template-ko.html`, `email-template-en.html`). 다음부터 기본 구조를 다시 만들 필요가 없어진다.

## 전체 구독자 11명, 성공 11 / 실패 0

디자인 수정 확인 후 "저걸로 전체 발행해" 한 마디로 전체 발송 세션이 시작됐다(4min, 18 tool calls).

`subscribers.txt` 구조는 `ko,email@example.com` 형식이다. 구독자 수를 확인했다: **ko 10명, en 1명**. 개별 API 호출로 1통씩 보내는 방식으로 처리했다.

| 언어 | 제목 | 수신자 |
|------|------|--------|
| ko | `[spoonai] 3/24 Mon — 젠슨 황이 터뜨린 1조 달러 AI 수주` | 10명 |
| en | `[spoonai] 3/24 Mon — Jensen Huang's $1T AI Order Bombshell` | 1명 |

성공 11, 실패 0. Bash 9회로 발송 스크립트를 작성하고 실행했다.

## 당일 결정: 피드백 섹션 완전 제거

발송 완료 후 바로 다음 요청이 왔다. "내일부턴 브리핑 어땠어 기능 빼 스킬 업뎃하고".

피드백 섹션 제거 작업이 두 번 실행됐다(세션 7: 9min 26 tool calls, 세션 8: 0min 10 tool calls). 세션 7에서 SKILL.md 2개와 HTML 템플릿 2개를 수정했고, 세션 8에서 잔존하는 CSS 클래스 레퍼런스를 `grep`으로 찾아서 제거했다.

같은 작업을 두 번 한 건 세션 7이 완전하지 않았기 때문이다. CSS 클래스 설명이 SKILL.md에 인라인으로 남아있었는데 처음엔 놓쳤다. Grep 4회로 `feedback`, `피드백`, `어땠어`, `survey` 키워드를 전수 검색해서 정리했다.

> 스킬 파일은 코드가 아니라 Claude에게 주는 지시서다. 여기에 오래된 내용이 남아있으면 다음 세션에서 Claude가 제거한 기능을 다시 생성한다.

## 도구 사용 통계

오늘 8개 세션, 총 153 tool calls. Bash 51회(로그 확인, 발송 스크립트 실행), Read 34회(파일 내용 파악), Edit 28회(CSS/HTML/스킬 파일 수정), Glob 10회(파일 위치 확인), TodoWrite 7회(수정 항목 트래킹), Grep 6회(키워드 검색).

생성 파일 2개(`email-template-ko.html`, `email-template-en.html`), 수정 파일 6개. 코드 한 줄 안 짜고 파이프라인 복구, 디자인 수정, 구독자 전체 발송까지 완료했다.
