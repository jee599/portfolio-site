---
title: "Claude Code 하루 일지: 3개 프로젝트 5세션 77 tool calls, 소켓 에러와 타임아웃 사이에서"
project: "portfolio-site"
date: 2026-05-22
lang: ko
tags: [claude-code, automation, spoonai, dental-ad, html-report, claude-opus]
description: "하루 5세션 77 tool calls로 SpoonAI 콘텐츠 수집, 치과광고 리서치, 성장신호 리포트까지 동시에 돌렸다. 소켓 에러 1번, 타임아웃 1번 — 복구 패턴이 더 흥미롭다."
---

하루에 3개 프로젝트를 동시에 돌리면 어떻게 되는가. SpoonAI 콘텐츠 인텔리전스, 치과광고 경쟁분석, 성장신호 리포트 편집 — 세 가지를 Claude Code 세션 5개로 처리했다. 총 77 tool calls, Bash 43회, Read 21회.

**TL;DR** 세션이 소켓 에러로 끊기거나 타임아웃으로 중단돼도 맥락을 파일로 저장해두면 다음 세션에서 이어 달린다. 네이버 통합검색 플레이스광고 슬롯 확대(2026-05-28)라는 실질적 인사이트도 이 과정에서 나왔다.

## SpoonAI 콘텐츠 인텔리전스, 그리고 소켓 에러

첫 세션은 SpoonAI 새 사이트용 AI 콘텐츠 후보를 수집하는 작업이었다. 원자료 `2026-05-22-daily-intel-raw.json`을 읽고 일반용 8~15개, 전문가용 10~20개 후보를 선별해 `.md`와 `.json` 두 파일로 저장하는 파이프라인이다.

Bash 14번, Read 1번으로 raw feed를 파악하고 JSON·Markdown 구조화까지 진행하다가 세션이 끊겼다.

```
API Error: The socket connection was closed unexpectedly.
```

소켓 에러는 예고 없이 온다. 다시 시작하면 raw 파일 파악은 이미 됐으니 구조화 단계부터 이어받는다. 이 세션에서 얻은 교훈: 중간 산출물을 파일로 떨어뜨리는 단계를 의도적으로 넣어야 재시작 비용이 줄어든다.

두 번째 세션은 스키마 컴플라이언스 검증 전용이었다. Read 2번, 1분도 안 걸렸다.

```
sponsor_leads: 17 (MD ↔ JSON match)
competitor_notes: 7
content_opportunities: 10
outreach_hooks: 5
```

PASS. 컴팩트하게 끝난 세션이었다.

## 네이버 광고 변화를 포착하는 과정

세 번째 세션이 가장 밀도 높았다. Bash 20회, Read 13회, Edit 6회, Write 2회. 9분.

치과광고 KB에 오늘자 SERP 표본을 누적하는 작업이다. 수집 스크립트 `collect_2026_05_22.py`를 작성해 실행하고, 네이버 공식 공지 5건을 확인하는 과정에서 중요한 항목이 나왔다.

**공지 31700 — 2026-05-28 통합검색 플레이스광고 노출 개수 상향, 병의원 포함.**

기존에 확인된 내용이 아니었다. 5월 28일부터 통합검색에 뜨는 플레이스광고 슬롯이 늘어난다. 병의원이 포함된다는 점이 핵심이다. 치과 클라이언트 입장에서 다음 주 예산 조정 근거가 되는 정보다.

이 발견이 rolling KB, source index, competitive observations, ranking hypotheses 네 파일 업데이트로 이어졌다. `2026-05-22-daily-update.md`도 별도 생성했다.

한 가지 아쉬움: 이 세션은 HTML 리포트 생성 직전에 타임아웃으로 끊겼다. `2026-05-22-daily-update.md` 안에 "HTML 리포트 참고"라는 언급이 있는데 실제 파일이 없는 상태가 됐다.

## 타임아웃 후 후속 세션으로 완성

네 번째 세션은 세 번째 세션이 중단된 자리를 이어받는 작업이었다. 프롬프트가 명시적이었다.

> "The previous Claude run updated the markdown files and sources but timed out before creating the HTML report."

기존 리포트 스타일을 참고해 동일한 포맷으로 작성했다. 모바일 친화 CSS, 한국어 타이포 기반, 자기완결형 단일 HTML 파일. 결과: 23.0K.

Bash 7번, Read 4번, Grep 3번, Write 1번으로 검증까지 완료했다.

```bash
# 의료광고 금지 문구 체크
grep -i "보장\|효과 보장\|치료 결과" *.html
# → 0 matches
```

의료광고 컴플라이언스 체크는 빌드 통과와 별개로 grep을 직접 돌린다. 자동화가 구조적으로 닿지 못하는 영역이다.

## HTML 리포트 재편집 — Markdown 표에서 구조화 리포트로

마지막 세션은 SpoonAI 성장/스폰서 신호 수집 보고서를 Telegram에서 읽기 좋은 HTML로 재편집하는 작업이었다. Bash 2번, Read 1번, Write 1번. 4분.

기존 Markdown은 표 중심이었다. 모바일에서 옆으로 스크롤해야 하는 형태다. HTML로 재구성하면서 Top 5, 실행 액션, 후보 상세, 콘텐츠 기회 섹션으로 나눴다. 원문 데이터만 사용하고 사실 추가는 금지했다.

`reports/` 디렉토리가 없어서 먼저 만들고 HTML을 작성했다. 실제 작업 4분.

## 전체 통계

| 항목 | 수치 |
|------|------|
| 세션 수 | 5 |
| 총 tool calls | 77 |
| Bash | 43 |
| Read | 21 |
| Edit | 6 |
| Write | 4 |
| Grep | 3 |
| 수정 파일 | 4 |
| 생성 파일 | 4 |

소켓 에러 1회, 타임아웃 1회. 두 경우 모두 중단 시점의 파일 상태가 복구 기준이 됐다. 다음 세션 프롬프트에 "어디까지 됐고 뭐가 없다"를 명시하면 이어 달리는 데 추가 비용이 거의 없다.

> 중단은 피할 수 없다. 재시작 비용을 낮추는 설계가 더 중요하다.
