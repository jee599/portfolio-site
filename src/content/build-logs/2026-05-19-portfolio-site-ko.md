---
title: "Claude Code로 의료광고 컴플라이언스 리뷰: 날짜 오귀속 블로킹 이슈 1건 자동 검출"
project: "portfolio-site"
date: 2026-05-19
lang: ko
tags: [claude-code, compliance-review, dental-ad, blocking-issue, medical-law]
description: "Claude Code를 의료광고 법적 컴플라이언스 리뷰어로 활용해 날짜 오귀속 블로킹 이슈 1건을 자동 검출했다. Read 4회, 2세션, 수정 파일 0개로 배포 전 리스크를 제거했다."
---

네이버 공지 날짜 하나가 문서 안에서 두 가지 의미로 혼용되고 있었다. 리뷰어가 없었으면 그냥 배포됐을 내용이다.

**TL;DR** `blocking-issues-only` 프롬프트 패턴으로 Claude에게 의료광고 컴플라이언스 리뷰를 맡겼다. 1차 리뷰에서 날짜 오귀속 이슈 1건을 잡고, 수정 후 2차 리뷰에서 OK를 받았다. tool calls 4회, 수정 파일 0개.

## 리뷰어를 고용하는 프롬프트 패턴

의료광고 일일 리포트를 작성하면 매번 체크해야 하는 항목이 있다. 특정 병원명·주소 누출 여부, 금지된 보장 표현 사용 여부, 날짜·출처 일관성, 필수 면책 문구 포함 여부 같은 것들이다.

이걸 매번 사람이 하는 대신, 다음 프롬프트로 Claude에게 넘겼다:

```
Read these files and perform a blocking-issues-only review for
scheduled Korean medical/dental ads daily report.
Check contradictions, missing required labels/caveats,
named hospital/address leakage, prohibited guarantees, stale notes.
Answer OK if no blocking issues; otherwise list exact fixes.
Files: [MD 파일 경로] [HTML 보고서 경로]
```

핵심은 `blocking-issues-only`다. "개선점을 찾아줘"가 아니라 "배포를 막아야 할 이슈만 리포트해라"다. 이렇게 하면 결과가 `OK` 또는 `정확한 수정 지시` 둘 중 하나로만 나온다. 애매한 제안이 끼어들 여지가 없다.

## 1차 리뷰: 블로킹 이슈 1건 발견

첫 번째 세션에서 Claude는 OK를 주지 않았다. `2026-05-19-daily-update.md:27`에서 모순을 발견했다.

파일 전반부를 보면 두 공지의 내용이 명확하게 구분돼 있다:

- **5번, 12번 라인**: 2026-05-07 공지 = 플레이스광고 노출 개수 상향
- **5번, 12번 라인**: 2026-05-14 공지 = PC 지도 플레이스광고 지면 확대 테스트 (음식점 업종)

그런데 **27번 라인**은 이렇게 되어 있었다: "5/14 플레이스광고 노출 개수 상향 이후에는…"

5/14 공지는 지면 확대 테스트인데, 27번 라인에서 '노출 개수 상향'으로 잘못 귀속시키고 있었다. 두 공지를 혼동한 것이다.

이런 오귀속은 의료광고 문서에서 실제로 문제가 된다. 정책 변경 시점을 잘못 서술하면 광고주에게 잘못된 전략 판단 근거를 제공하게 되고, 최악의 경우 법적 책임 소지가 생긴다.

## 수정 후 2차 리뷰: OK

5/07 귀속 수정 후 동일한 프롬프트로 재리뷰를 요청했다:

```
Blocking-issues-only re-review after the 5/07 attribution fix.
Check these two files for contradictions, missing labels/caveats,
named hospital/address leakage, or prohibited guarantees.
Answer OK if none.
Files: [동일 파일 경로]
```

2차 리뷰 결과는 OK였다. Claude가 확인한 항목은 네 가지다.

날짜 일관성 — 플레이스광고 노출 개수 상향(5/07)과 신규 전환지표(5/08)가 `daily-update.md`·HTML 보고서 양쪽에서 동일하게 표기됨. 병원명·주소 누출 — 모든 예시가 "강남 임플란트" 같은 일반 지역+진료 키워드로만 표현됨, 특정 병원명·주소 없음. 금지 보장 표현 — "순위·예약·내원·매출 상승을 보장하지 않는다"는 면책 문구가 양쪽 파일에 모두 포함됨. 위험 표현 — 무통, 100%, 최저가, 보장, 1위, 후기형 표현이 회피·검수 대상으로만 다뤄짐.

## 세션 통계

| 항목 | 값 |
|------|-----|
| 세션 수 | 2 |
| 총 tool calls | 4 |
| 도구 | Read × 4 |
| 수정 파일 | 0개 |
| 생성 파일 | 0개 |
| 발견된 블로킹 이슈 | 1건 |

Read만 4회 썼다. 수정 파일은 0개다. Claude가 리뷰어 역할만 했고, 실제 파일 수정은 별도로 진행됐다.

## 왜 이 패턴이 잘 작동하는가

종합 리뷰("전체적으로 검토해줘")는 결과가 길고 우선순위가 없다. 반면 `blocking-issues-only` 패턴은 두 가지를 강제한다: 배포 가능 여부에 대한 명확한 판정, 그리고 수정이 필요하면 정확한 위치와 수정 내용.

의료광고 컴플라이언스처럼 체크리스트가 고정돼 있고 판단 기준이 명확한 영역은 이 패턴이 잘 맞는다. 프롬프트에 체크 항목을 박아두면 매번 같은 기준으로 리뷰된다. 사람이 피곤할 때 놓치는 것도 Claude는 놓치지 않는다.

재리뷰 패턴도 중요하다. 수정 후 OK를 받는 구조로 만들어두면, 수정이 올바르게 반영됐는지 확인하는 단계가 자연스럽게 파이프라인 안에 포함된다. "수정했으니까 됐겠지"가 아니라 실제로 확인한다.
