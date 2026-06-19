---
title: "API 키 오류 2번, 도구 호출 1번: uddental 크론 배관 테스트 통과"
project: "uddental"
date: 2026-06-20
lang: ko
tags: [claude-code, automation, cron, debugging, dental-promo]
description: "uddental 크론 파이프라인 배관 테스트를 세 번 만에 통과했다. API 키 실패 2회, 성공 1회 — 도구 호출은 딱 1번. 자동화 파이프라인 검증에서 배운 것."
---

세 번 시도 중 두 번이 API 키 오류로 죽었다. 마지막 세 번째 세션에서 `claude-opus-4-8`이 Write 도구를 한 번 호출해 `plumbing OK`를 파일에 썼고, 배관 테스트는 그걸로 끝났다.

**TL;DR** uddental 크론 자동화 파이프라인의 엔드-투-엔드 연결을 검증하는 배관 테스트. API 키 문제로 두 세션이 날아가고, 세 번째 시도에 1 tool call로 통과했다.

## 배관 테스트가 뭔지부터

소프트웨어 엔지니어링에서 "plumbing test"는 실제 로직을 검증하기 전에 시스템의 연결이 살아있는지 확인하는 최소 단위 테스트다. "파이프에 물이 흐르는가?"를 보는 것이지, 수압이나 수질은 나중 문제다.

uddental 크론 파이프라인은 `~/dental-promo/dongbaek-uddental/` 아래에 치과 데이터를 두고, 에이전트가 주기적으로 이를 읽어 블로그 초안·플레이스 보강·광고 분석을 자동화하는 구조다. 이 파이프라인이 실제로 작동하는지 검증하기 전에, 가장 먼저 해야 할 일은 간단했다.

> `clinic.json`을 읽고 로그 파일에 한 줄 쓸 수 있는가?

프롬프트는 이랬다.

```
Read /Users/jidong/dental-promo/dongbaek-uddental/clinic.json and
write exactly one line 'plumbing OK: <slug>' to
/Users/jidong/dental-promo/_cron/logs/plumbing-test.txt.
Do nothing else, no sync, no commits.
```

의도는 명확하다. 파일 읽기, 파일 쓰기, 그 외 아무것도 하지 말 것. 결과를 확인하면 파이프라인 기반 연결이 살아있다는 뜻이 된다.

## API 키가 두 번 막았다

첫 번째 세션은 `<synthetic>` 모델로 실행됐고, `Invalid API key`로 즉시 사망했다. 0 tool calls. 세션 자체가 시작도 못 한 것이다.

두 번째 시도도 똑같았다. 프롬프트를 단순화했다. `clinic.json` 읽기도 없애고 그냥 `plumbing OK` 한 줄만 쓰라고 했다.

```
Write exactly the line 'plumbing OK' to
/Users/jidong/dental-promo/_cron/logs/plumbing-test.txt.
Nothing else.
```

결과는 동일했다. `Invalid API key`, 0 tool calls, 0분.

외부 API 키 문제였다. 크론 자동화 맥락에서 에이전트를 띄울 때 키가 제대로 전달되지 않았다. 이 두 실패는 "배관 테스트"가 왜 필요한지를 역설적으로 증명했다. 실제 로직을 돌리기도 전에 인프라 연결부터 죽을 수 있다.

## 세 번째 시도: claude-opus-4-8, 1 tool call

API 키 문제를 수정하고 세 번째 세션을 열었다. 이번엔 `claude-opus-4-8`이 실행됐다.

프롬프트는 두 번째 시도와 동일했다.

```
Write exactly the line 'plumbing OK' to
/Users/jidong/dental-promo/_cron/logs/plumbing-test.txt.
Nothing else, no sync, no commit.
```

에이전트 응답:

> I'll write that exact line to the file.

Write 도구 한 번. 끝.

`~/dental-promo/_cron/logs/plumbing-test.txt` 파일이 생성됐고 `plumbing OK`가 들어있었다. 세션 3개, 도구 호출 총 1번, 생성 파일 1개.

## 왜 이걸 로그로 남기나

이 작업 자체는 아무것도 아니다. 파일 하나 쓴 게 전부다. 하지만 이 배관 테스트가 통과했다는 건 몇 가지를 확인해준다.

첫째, 크론 환경에서 에이전트가 파일 시스템에 쓸 수 있다. `~/dental-promo/` 경로가 에이전트에게 열려있다.

둘째, API 키 전달 경로가 수정됐다. 같은 프롬프트가 두 번 실패하고 세 번째에 성공했다는 건, 첫 두 시도에서 키가 없었고 세 번째에서야 제대로 전달됐다는 뜻이다.

셋째, 에이전트가 "nothing else"를 지킨다. 프롬프트에서 명시적으로 sync, commit, 기타 작업을 금지했고, 에이전트는 Write 한 번만 했다. 자동화 파이프라인에서 에이전트가 지시 범위를 벗어나면 예상치 못한 부작용이 생긴다.

## 다음 단계

배관이 뚫렸으니 이제 실제 내용을 흘릴 수 있다. `clinic.json`을 읽고 블로그 초안을 생성하거나, 플레이스 데이터를 갱신하거나, 광고 성과를 분석하는 세션이 다음이다.

크론 자동화는 항상 배관 테스트부터다. 화려한 로직 전에 파이프에 물이 흐르는지 먼저 확인한다.

---

**세션 통계**
- 세션 수: 3
- 성공 세션: 1 (`claude-opus-4-8`)
- 실패 원인: Invalid API key × 2
- 총 tool calls: 1 (Write × 1)
- 생성 파일: 1개 (`plumbing-test.txt`)
