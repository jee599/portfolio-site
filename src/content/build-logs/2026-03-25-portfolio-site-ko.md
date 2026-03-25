---
title: "영어 기본 전환 + 3플랫폼 발행 파이프라인: 3세션 336 tool calls 기록"
project: "portfolio-site"
date: 2026-03-25
lang: ko
tags: [claude-code, i18n, auto-publish, devto, hashnode, astro, security]
description: "기본 언어를 한국어에서 영어로 바꾸는 데 50번의 도구 호출이 들었다. 같은 날 auto-publish 스킬을 개편하고 Claude 최신 소식을 3개 플랫폼에 동시 발행했다. 3세션, 336 tool calls 하루치 기록."
---

`var lang = 'ko'` 한 줄이 문제였다. 번역 버튼이 이상하다는 말에 코드를 열어보니 영어 사이트인데 기본값이 한국어로 하드코딩되어 있었다. 고치는 데 50번의 도구 호출이 들었다.

**TL;DR** 3세션 336 tool calls. 기본 언어 전환 + 자동 발행 스킬 개편 + 보안 감사 + 3개 플랫폼 동시 발행까지 하루에 연결됐다.

## "번역이 잘 안 된다"는 말이 트리거였다

세션 1의 시작 프롬프트는 단 두 글자였다.

> "포트폴리오 사이트"

Claude Code가 brainstorming 스킬을 먼저 실행하며 현재 상태를 파악했다. Astro 4 + React + Tailwind, Cloudflare Pages, toss.tech 스타일. 이미 운영 중인 사이트. 그런데 두 번째 프롬프트에서 방향이 확정됐다.

> "저기서 지금 번역버튼이 잘 안 되는데, 일단 영어 사이트가 기본이어서 영어 번역이 모든 부분에 대해서 되어 있어야 해."

`Base.astro`를 열어보니 세 가지 문제가 동시에 보였다. `<html lang="ko">`로 선언되어 있고, JavaScript 초기값이 `var lang = 'ko'`였으며, 버튼 텍스트도 현재 모드를 반영하지 않고 있었다. 영어 사이트라면 기본이 영어여야 하고, 버튼은 전환할 언어인 "KO"를 표시해야 한다.

수정 자체는 단순했다. `<html lang="en">`, `var lang = 'en'`, 버튼 기본값 `KO`. 그런데 이걸 확인하려면 모든 `data-ko`/`data-en` 속성이 있는 요소의 기본 텍스트가 영어로 되어 있는지 전수 체크가 필요했다.

> "모든 영어 번역 잘 되는지, 번역 매끄러운지 오타 없는지 찾아봐"

이 프롬프트에서 Agent를 8번 호출했다. 사이트 전체를 크롤링하듯 `data-ko`/`data-en` 속성을 가진 요소를 검사하고 어색한 영어 텍스트를 정리했다. Read 13번, Edit 12번, Bash 12번. 수정 파일은 `Base.astro`, `PostLayout.astro`, `blog/[slug].astro` 세 개. 24분, 50 tool calls.

## auto-publish 스킬에서 네이버를 제거한 이유

세션 2는 스킬 수정으로 시작했다.

> "스킬 중에 특정 주제에 대해 jidonglab / devto에 글 쓰는 거 있어?"

`auto-publish` 스킬이 있었다. 그런데 당시 스킬이 spoonai.me + DEV.to + 네이버 3개 플랫폼 구조였고, 네이버는 더 이상 발행 대상이 아니었다.

> "그 스킬에서 네이버꺼는 빼줘"

`SKILL.md`를 열어보니 Agent 3이 "네이버 한국어 HTML 생성"이었다. 제거할 것들이 여러 곳에 퍼져 있었다. Phase 4 네이버 발행 섹션, Phase 5 네이버 큐 확인, 시리즈 처리의 네이버 파트별 저장 규칙, 레퍼런스 6개 중 `naver-seo-rules.md`. Edit 23번으로 섹션별로 잘라냈다.

그리고 발행 플랫폼을 재정의했다. `jidonglab.com`을 canonical URL 기준으로 삼고, spoonai.me + DEV.to + Hashnode로 고정했다.

> "jidonglab.com을 기준으로 spoonai.me / hashnode / dev.to"

슬래시로 구분한 세 플랫폼, canonical 기준이 되는 도메인. 스킬이 이 구조를 그대로 읽고 발행 파이프라인을 재구성했다. DEV.to와 Hashnode에 올라가는 모든 영어 글의 `canonical_url`을 jidonglab.com으로 잡으면 구글이 어느 플랫폼을 먼저 인덱싱하든 원본 출처는 jidonglab.com으로 귀속된다. 중복 콘텐츠 패널티 없이 두 플랫폼에 동시 발행하면서 도메인 권한도 원본 사이트로 집중시키는 방식이다.

Hashnode publication ID를 API로 찾으려다 권한 문제로 막혔다.

> "래포가 뭐야? 알아서해"

어떻게 할지 모르더라도 "알아서 해"라고 하면 Claude Code가 우회 방법을 스스로 찾는다. Hashnode 토큰은 대화에서 직접 받아 설정 파일에 저장하고 `publish-to-hashnode.mjs`도 수정했다. 이후 Claude 최신 업데이트 관련 키워드 3개로 아티클을 생성하고 3개 플랫폼에 동시 발행 완료. 45분, 90 tool calls.

## 보안 감사를 에이전트에 위임했다

세션 3에서 사이트 보안 점검 요청이 들어왔다.

> "지금 이 사이트에 보안 이슈나 API 공격이나 탈취될만한 부분이 있어?"

직접 코드를 훑는 대신 Agent를 호출했다. "Fix security issues" 에이전트가 돌아왔을 때 결과가 구체적이었다. CRITICAL 1건 수정. API 키 노출 경로, 입력값 검증 누락 지점들을 찾아서 패치했다. 이 작업을 직접 했다면 훨씬 오래 걸렸을 것이다.

세션 3 전체는 Bash 100번, Edit 33번, Read 32번으로 가장 규모가 컸다. Agent 13번 위임으로 보안 감사와 레퍼런스 고도화 작업을 병렬로 분산했다. 196 tool calls, 41시간.

## 도구 사용 패턴이 세션마다 달랐다

세션 1은 Read/Edit 비중이 높았다. 기존 코드를 충분히 읽고 나서 수정하는 방식. 세션 2는 Bash가 압도적이었다. Hashnode API 테스트, 발행 확인, 설정 파일 저장 등 쉘 실행이 많았고, WebSearch 7번으로 Claude 최신 소식을 수집했다. 세션 3은 전체 규모가 커지면서 Agent 위임으로 병렬 분산했다.

전체 336 tool calls 중 Bash가 149번(44%)으로 가장 많다. 코드 수정보다 실행과 확인에 더 많은 시간이 들었다는 의미다. Edit 68번, Read 54번, Agent 25번.

## 실제로 쓴 프롬프트 패턴

짧고 명확한 지시가 가장 효율적이었다.

```
번역버튼이 잘 안 되는데, 영어 기본으로 해주고 한국어 번역버튼을 넣어줘.
```

구현 방법을 붙이지 않았다. Claude Code가 코드를 읽고 문제를 파악해서 세 파일을 수정했다. 지시가 간결할수록 Claude Code가 판단할 공간이 생긴다.

```
jidonglab.com을 기준으로 spoonai.me / hashnode / dev.to
```

슬래시 구분, canonical 기준 도메인. 스킬이 이 구조를 그대로 읽고 파이프라인을 재구성했다. 구조를 한 줄로 전달하면 Claude Code가 나머지를 채운다.

## 결과

기본 언어 전환은 `Base.astro` 한 파일의 세 줄 수정이었다. 하지만 영향이 전체 사이트에 퍼져 있어서 검증에 시간이 더 걸렸다. auto-publish 스킬은 네이버를 빼고 Hashnode를 추가하면서 3개 플랫폼 파이프라인이 완성됐다. 보안 감사는 에이전트 1번 호출로 CRITICAL 이슈까지 잡아냈다.

수정 파일 12개, 생성 파일 0개. 새 파일 없이 기존 코드를 고쳐서 기능을 추가했다.
