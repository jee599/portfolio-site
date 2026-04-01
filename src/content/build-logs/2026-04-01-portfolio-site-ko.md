---
title: "Claude Code로 네이버 블로그 330개 분석해서 치과 마케팅 자동화 파이프라인 만든 기록"
project: "portfolio-site"
date: 2026-04-01
lang: ko
tags: [claude-code, automation, seo, naver, dental, gemini]
description: "3세션 604 tool calls. 네이버 상위 블로그 330개 구조 분석, S등급 패턴 추출, Gemini 이미지 캐싱까지. 13시간짜리 세션에서 Claude가 어떻게 움직였는지 기록한다."
---

3월 31일 하루에 3개 세션, 총 604번의 tool call이 발생했다. 가장 긴 세션은 13시간 13분, 422 tool calls. 네이버 치과 블로그 330개를 긁어서 분석하고, S등급 패턴을 추출하고, HTML 카드 템플릿 8종을 만들고, Gemini로 실사 이미지를 생성하고, 캐싱 전략까지 구현했다.

**TL;DR** 치과 블로그 상위노출 자동화 파이프라인을 Claude Code 하루 만에 구축했다. 핵심은 데이터 수집 → 패턴 분석 → 템플릿화 → 이미지 캐싱의 4단계 흐름이다.

## 409 Conflict: 텔레그램 봇이 두 곳에서 돌고 있었다

첫 세션(15분, 14 tool calls)은 텔레그램 디버깅으로 시작했다. 프롬프트는 단순했다.

```
텔래그램 설정 다시 해줘 지금 메세지가 안돼
```

`fakechat` 플러그인을 설치한 직후라 혼선이 있었지만, 진짜 문제는 다른 곳이었다. Claude가 MCP 서버 로그를 읽어보니 `409 Conflict`가 찍혀 있었다. 같은 봇 토큰으로 폴링이 두 곳에서 동시에 돌고 있었던 것이다. 해결은 폴링 잠금 해제 후 다른 세션 종료. 14 tool calls(Bash 10, Read 3, Skill 1)로 끝났다.

유용했던 건 Claude가 `~/.claude/channels/telegram/.env`를 직접 읽어서 토큰 상태, DM 정책, 허용 목록까지 한 번에 정리해준 것이다. 문제를 재현하지 않아도 설정 파일만으로 원인을 찾아냈다.

## spoonai 이미지 깨짐 + SEO 전면 강화 (42분, 168 tool calls)

두 번째 세션의 프롬프트.

```
spoonai 이미지 다 깨져서 올라가 있고, 중복되는 기사들도 있어
```

이미지 깨짐 원인: HTML 파일이 `.jpg`로 저장돼 있었다. 5개 중 4개가 그랬다. `anthropic-mythos-01.jpg`가 919바이트짜리 HTML이었다. 이미지 생성 스크립트가 실패해도 에러를 무시하고 HTTP 응답 본문 그대로 저장한 탓이다. 수정 방향은 SKILL.md에 응답 검증 로직 추가였다.

중복 기사 4건(harvey가 3번 등장)은 frontmatter에서 `image` 필드만 제거하는 방식으로 처리했다. 8개 파일 동일 패턴이라 Edit 도구로 일괄 수정.

이어서 "AI 검색결과 / 구글검색결과에 자주 노출될 수 있는 모든 효과적인 전략 적용해줘"라는 프롬프트가 들어왔다. Claude가 수행한 작업을 나열하면 `robots.txt` 개선, `sitemap.xml.ts` 생성, `Base.astro`에 JSON-LD 구조화 데이터 삽입, spoonai에 `feed.xml`·`llms-full.txt`·`opensearch.xml` 추가, `next.config.ts` canonical URL 설정까지였다.

168 tool calls 중 Read가 37번이다. 수정 전에 반드시 현재 파일 내용을 확인하는 패턴이 유지됐다.

## 13시간의 세션: 네이버 블로그 330개 분석 (422 tool calls)

세 번째 세션이 본론이다. 시작은 네이버 블로그 URL 하나였다.

```
https://blog.naver.com/choijc07/224228016203
```

"분당 임플란트 상위 10건 비교표 만들어줘"로 이어졌고, 결국 16개 지역 × 7개 시술의 상위 3건, 336건을 수집·분석하는 파이프라인이 됐다.

### contextzip과의 충돌

네이버 API 키를 받은 후 스크립트를 실행했는데 결과가 보이지 않았다. `contextzip`이 API 응답을 토큰 절약 목적으로 압축해버렸기 때문이다. 우회 방법은 결과를 파일로 저장해서 Read 도구로 읽는 것이었다.

```bash
# contextzip이 압축하면 결과가 사라진다
# 파일로 저장해서 우회
curl "https://openapi.naver.com/..." > /tmp/naver_results.json
```

이후 대용량 HTML 파싱도 동일한 방식으로 처리했다. Python 스크립트가 결과를 파일에 쓰고, Claude가 Read로 읽는 흐름이다.

### Background Task로 병렬 수집

330개 블로그를 순차 수집하면 시간이 너무 걸린다. Claude가 백그라운드 태스크로 전환했다.

```
<task-notification>
<summary>Background command "Run full dental blog collection pipeline" completed (exit code 0)</summary>
</task-notification>
```

수집이 돌아가는 동안 다른 작업을 병렬로 진행할 수 있었다. TaskUpdate가 33번 사용된 이유가 여기 있다.

### /compact로 컨텍스트 위기 탈출

세션이 길어지자 컨텍스트가 한계에 도달했다. `/compact`를 실행했고, 요약본에 핵심 맥락(S등급 패턴, 분석 상태, 다음 할 일)이 담긴 채로 이어갔다.

```
This session is being continued from a previous conversation that ran out of context.
The summary covers: 330+ posts collected across 16 regions × 7 treatments...
```

13시간 세션에서 `/compact`는 한 번이었다. 요약 품질이 좋으면 흐름이 끊기지 않는다.

### S등급 패턴 추출

분당 임플란트 1위 블로그는 컴포넌트 27개, 이미지 36장, 슬라이드 26장이었다. Claude는 HTML을 파싱해서 구성 패턴을 추출했다.

```
OTHER→TEXT→QUOTE→(TEXT↔IMAGE)×7→MORE_SLIDE...
```

330개 블로그를 같은 방식으로 분석해서 상위 20%에 해당하는 S등급의 공통 패턴을 도출했다. Read가 170번 사용된 이유가 여기 있다. HTML 파싱 결과를 직접 읽어서 확인하는 과정이 반복됐다.

### 이미지 캐싱 전략

"매번 API를 호출해서 그림을 그리는 게 아니라, 처음에 수십 가지의 그림을 그려놓고 HTML로 다른 텍스트를 넣어서 재사용하는 식으로"라는 요구가 들어왔다.

Claude가 설계한 구조는 세 단계다. 첫째, Gemini API로 30~50개 기본 이미지를 사전 생성한다(`generate_illustrations.py`). 둘째, `assets/manifest.json`에 이미지 목록을 캐싱한다. 셋째, 블로그 카드 생성 시 cache-first로 조회하고, 없으면 신규 생성한다.

```python
# generate_illustrations.py — cache-first 전략
def get_or_generate(prompt_key, output_path):
    if output_path.exists():
        return output_path  # 캐시 히트
    return generate_with_gemini(prompt_key, output_path)
```

백그라운드 태스크로 실행해서 30~50개 이미지가 생성되는 동안 HTML 템플릿 작업을 병렬로 진행했다.

### 퀄리티 피드백 루프

블로그 카드 초안이 나온 뒤 피드백이 계속 들어왔다.

```
폰트 / 다크네이비 톤 / 로고이미지 제대로 안 써져 있고 / 그림생성한것도 다 별로야
```

```
로직 처음부터 다시 짜.
```

이 피드백을 Claude가 점진적 개선이 아닌 로직 재작성으로 처리했다. Edit 75번이 이 과정에서 집중됐다. 폰트 교체, 색상 대비 조정, 로고 위치, 이미지 캡션 추가. 최종 산출물은 임플란트 포스트 기준 카드 8종이다 — 타이틀, 체크리스트, 시술 과정, 정보+이미지 3종(bone graft, digital guide, aftercare), 의료진 소개, 법적고지, CTA.

## 도구 사용 통계

| 도구 | 횟수 | 주요 용도 |
|------|------|-----------|
| Read | 210 | HTML 파싱 결과 확인, 설정 파일 |
| Bash | 164 | Python 스크립트, curl, 파일 조작 |
| Edit | 101 | HTML 카드 수정, SKILL.md 갱신 |
| Write | 53 | 신규 파일 생성 |
| TaskUpdate | 33 | 백그라운드 태스크 상태 관리 |

Read가 압도적으로 많다. "수정 전에 읽는다"는 원칙이 통계에 그대로 나온다. 실제 파일 변경(Edit + Write)은 154번, 탐색(Read + Bash)은 374번이다. 구현보다 탐색이 2.4배 많았다.

## 이번 세션에서 확인한 것

긴 탐색형 작업에서 Claude Code가 강하다. 330개 블로그를 분석하고 패턴을 추출하는 건 명확한 스펙 없이도 된다. 프롬프트 하나에서 시작해서 데이터를 보면서 방향이 정해졌다.

비주얼 품질 피드백은 여전히 사람이 해야 한다. "다 별로야"와 "로직 처음부터 다시 짜"는 코드로 표현할 수 없는 판단이다. Claude가 빠르게 고쳐주는 건 피드백이 구체적으로 들어올 때다. 13시간이 걸린 건 그 루프를 여러 번 돌았기 때문이다.
