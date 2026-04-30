---
title: "서브에이전트 12개 병렬로 시장 분석, DEV.to 8편 자동 발행 — 3세션 335 tool calls"
project: "portfolio-site"
date: 2026-05-01
lang: ko
tags: [claude-code, automation, devto, subagent, auto-publish]
description: "3세션 335 tool calls. 서브에이전트 12개를 병렬로 돌려 치과 광고 시장을 분석하고, auto-publish 스킬로 DEV.to에 8편을 발행했다. Agent 도구를 66번 쓴 일주일의 기록."
---

4월 23일부터 30일까지 세 세션을 돌렸다. 총 335번의 tool call, 그중 Agent가 66번이다. 서브에이전트를 이만큼 적극적으로 쓴 건 처음이다.

**TL;DR** auto-publish 스킬로 DEV.to에 8편을 발행했고, 서브에이전트 12개를 병렬로 돌려 치과 광고 시장 분석 HTML 보고서 8개를 만들었다. git push 거절도 한 번 겪었다. Bash 119번, Agent 66번이 이번 사이클의 핵심 도구였다.

## AI GitHub 트렌딩 프로젝트를 DEV.to 시리즈로 묶다

첫 세션은 간단한 요청으로 시작했다. "ai git에서 유명한 프로젝트 한 4개 정도 최신거 분석 글 devto에 블로그 올려줘." 그런데 4개를 각각 올리면 맥락이 없다. 3편짜리 시리즈로 재구성하는 편이 DEV.to 알고리즘에도, 독자한테도 낫다.

`auto-publish` 스킬을 켜고 Phase 1부터 시작했다. 키워드 입력 모드로 `andrej-karpathy-skills`, `hermes-agent`, `OpenClaw`, `opencode` 네 개를 수집했다. Phase 2에서 시리즈 구조를 잡았다.

```
시리즈명: The 2026 AI GitHub Playbook
Part 1 — Skills: When a Markdown File Got 100K Stars
Part 2 — OpenClaw: The Local Gateway Nobody Asked For
Part 3 — opencode: When Your Terminal Becomes an Agent
```

Part 1은 즉시 발행, Parts 2-3은 드래프트로 올렸다. DEV.to API는 `published: false`로 올리면 직접 예약 없이 드래프트 상태를 유지한다. 이 패턴은 시리즈물에 유용하다. 편집 여유를 남겨두면서 발행 큐를 채울 수 있다.

이 세션에서 Agent를 11번 썼다. Bash 96번, TaskUpdate 23번. 발행 흐름 자체를 자동화하다 보면 실제 글쓰기보다 파이프라인 확인 작업이 많아진다.

## 서브에이전트 12개 병렬로 치과 광고 시장을 뜯다

두 번째 세션은 완전히 다른 도메인이었다. 치과·병원 AI 광고 대행사 시장 분석.

요청이 넓었다. "최근 5년 / 1년 / 3개월 트렌드 비교해줘, 네이버 알고리즘 변화도." 이런 경우 단일 에이전트로 직렬 검색하면 2시간이 걸린다. 서브에이전트 12개를 병렬로 디스패치했다. 각 에이전트가 다른 도메인을 맡는다.

- 에이전트 1-3: 5년·1년·3개월 트렌드 채널별 정리
- 에이전트 4-6: 한국 AI 의료 광고 업체 카테고리별 조사
- 에이전트 7-9: 네이버 알고리즘(C-Rank, D.I.A.+) 최신 변화
- 에이전트 10-12: 업체별 실제 산출물·포트폴리오 수집

12개가 동시에 돌면 결과가 뭉텅이로 돌아온다. 그걸 합쳐서 HTML 보고서로 구조화하는 게 핵심 작업이었다. `TREND-COMPARISON-REPORT.html`, `AI-AGENCIES-DEEP-REPORT.html`, `AI-AGENCIES-PRIMER.html` 등 총 8개 파일이 나왔다.

그중 입문서(`AI-AGENCIES-PRIMER.html`)가 가장 유용했다. 전문 용어를 사용자 언어로 바꾸는 작업이다. C-Rank를 "한 분야에 진심인가를 측정하는 점수"로, D.I.A.+를 "검색 의도에 맞는 콘텐츠인가"로 풀어냈다. 개념 정리가 끝나면 전략 제안이 따라온다.

이 세션에서 Agent를 47번 썼다. 전체 tool call 85회 중 절반이 넘는다. 서브에이전트가 메인 작업 단위였다는 뜻이다.

## git push가 거절됐다

세 번째 세션은 Codex·GPT Image 2 관련 DEV.to 포스트 5편이었다. 주제를 먼저 리서치하고, 5개 에이전트가 병렬로 각 편을 작성했다. 여기까지는 깔끔했다.

문제는 커밋 이후였다. `git push`를 실행했더니 거절됐다.

```
 ! [rejected] main -> main (fetch first)
error: failed to push some refs
```

GitHub Actions이 자동으로 CI 커밋을 쌓아놨고, 로컬이 뒤처진 상태였다. `git pull --rebase`로 당겨오고 다시 push하니 해결됐다. 자동화 파이프라인이 붙어있는 레포에서는 이 패턴이 자주 나온다. rebase가 merge commit 없이 히스토리를 깔끔하게 유지하는 방법이다.

또 하나 걸린 게 있었다. 에이전트 5개를 병렬로 돌렸는데 "실패"로 보였던 tool call들이 실제로는 성공해 파일을 만들어놨다. 중복 파일 8개가 생겼다. 스팟 체크로 5개를 추려내고 나머지를 정리했다.

중복 파일 문제는 병렬 에이전트를 쓸 때 반복적으로 나타난다. 에이전트마다 경로 네이밍 컨벤션을 명시적으로 박아야 한다. "파일명은 반드시 `YYYY-MM-DD-{slug}-en.md` 형식"처럼. 지정 안 하면 각자 판단한다.

## 66번의 Agent 호출이 말해주는 것

3세션을 통틀어 Bash 119번, Agent 66번이었다. Bash가 많을 때는 실행·확인·재실행 사이클이 많다는 뜻이다. Agent가 많을 때는 독립적으로 위임할 수 있는 단위가 많았다는 뜻이다.

이번 사이클은 Agent 비중이 높았다. 리서치 병렬화, 글쓰기 병렬화 — 둘 다 에이전트 없이는 시간이 2-3배 더 걸렸을 작업이다.

> 서브에이전트는 속도 도구가 아니다. 작업을 쪼갤 수 있는 경계가 있을 때만 효과가 나온다.

경계가 없는 작업, 예를 들어 방향 결정이나 품질 판단은 메인 컨텍스트에서 해야 한다. 에이전트한테 "좋은 글 써줘"라고 시키면 결과가 평범하다. "이 주제, 이 구조, 이 톤으로 써줘"가 있어야 결과가 쓸 만해진다.
