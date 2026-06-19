---
title: "API 키 하나 때문에 세션 3번 날린 uddental 배관 테스트"
project: "uddental"
date: 2026-06-19
lang: ko
tags: [claude-code, automation, dental-promo, debugging, api-key]
description: "uddental 자동화 파이프라인 구축 중 invalid API key로 두 번 실패하고, 세 번째 세션에서야 plumbing test 통과. 삽질 과정과 원인 정리."
---

세션을 두 번 날렸다. 이유는 단 하나, API 키가 틀렸기 때문이다.

**TL;DR** uddental 치과 자동화 파이프라인의 배관 점검(plumbing test) 스크립트를 실행하려 했는데, 첫 두 세션이 `Invalid API key` 오류로 조기 종료됐다. 세 번째 세션에서야 `claude-opus-4-8`로 정상 실행되어 `plumbing OK`를 기록했다.

## 왜 "배관 테스트"부터 시작했나

uddental(동백 유디치과) 프로젝트는 `~/dental-promo/dongbaek-uddental/` 아래에 `clinic.json`, `history.json`, 캐시 디렉토리를 쌓아두는 구조다. 자동화 스크립트가 이 경로를 읽고, 결과를 `_cron/logs/`에 기록하고, 최종적으로 블로그 포스트나 광고 리포트를 뽑는 파이프라인이다.

이 파이프라인을 처음 짤 때 제일 먼저 확인해야 할 게 "기본 흐름이 막히지 않고 흘러가는가"다. 배관(plumbing)이 뚫렸는지 확인하는 것. 그래서 첫 작업은 단순했다.

```
Read /Users/jidong/dental-promo/dongbaek-uddental/clinic.json 읽고
/Users/jidong/dental-promo/_cron/logs/plumbing-test.txt에
'plumbing OK: <slug>' 한 줄 써라.
```

실제 프롬프트는 이것보다 더 짧고 구체적이었다. 불필요한 부연 없이 딱 세 가지만 지시했다: 읽을 파일, 쓸 내용, 쓸 경로.

## `<synthetic>` 모델이 두 번 연속으로 터졌다

세션 1과 2는 모델이 `<synthetic>`으로 기록됐다. 정상적인 Anthropic 모델 ID가 아니라는 뜻이다. 내부 설정에서 API 키가 잘못 연결된 상태였다.

두 세션 모두 실행 시간 0분, 도구 호출 0번으로 종료됐다. 아무것도 하지 못했다는 게 아니라, 아무것도 시작조차 못 했다는 거다. `Invalid API key` 오류가 세션 진입 단계에서 바로 걸렸다.

첫 번째 실패 후 프롬프트를 더 단순하게 줄였다.

```
Write exactly the line 'plumbing OK' to
/Users/jidong/dental-promo/_cron/logs/plumbing-test.txt.
Nothing else.
```

`clinic.json` 읽기조차 빼고, 그냥 한 줄만 써라. 그래도 두 번째도 같은 오류. 문제는 프롬프트가 아니었다.

## API 키 고치고 나서야 움직였다

외부 API 키를 수정한 뒤 세 번째 세션을 열었다. 이번에는 `claude-opus-4-8`로 정상 진입했다. 실행 결과는 간단하다.

- `Write` 도구 1번 호출
- `~/dental-promo/_cron/logs/plumbing-test.txt` 생성
- 내용: `plumbing OK`

총 tool call 수는 3개 세션 합산 1번이다. 나머지 2번은 진입도 못 했다.

## 이번 작업에서 배운 것

자동화 파이프라인에서 API 키 오류는 조용히 실패한다. 에러 메시지가 명확하게 뜨지 않으면 프롬프트 문제인지, 경로 문제인지, 설정 문제인지 구분이 안 된다. 첫 번째 실패 후 프롬프트를 단순화한 건 좋은 판단이었지만, 결국 문제는 키였다.

앞으로 새 프로젝트 파이프라인을 열 때는 API 키 유효성 확인을 첫 단계로 고정한다. 배관 테스트 전에 수도꼭지부터 열리는지 확인해야 한다.

## 도구 사용 통계

| 도구 | 횟수 |
|------|------|
| Write | 1 |
| **합계** | **1** |

세션 3개, 소요 시간 0분, 유효 tool call 1번. 가장 적은 작업량으로 가장 많은 삽질을 한 세션이기도 하다.

다음 단계는 `clinic.json`을 실제로 읽어서 클리닉 슬러그를 동적으로 확인하는 것, 그리고 크론 파이프라인이 이 배관을 통해 블로그 포스트까지 자동으로 뽑아내는 흐름을 붙이는 것이다.
