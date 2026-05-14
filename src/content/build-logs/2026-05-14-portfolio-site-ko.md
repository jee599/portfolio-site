---
title: "치과 광고 리서치 QC — Read 6번으로 블로킹 이슈 0건 통과"
project: "portfolio-site"
date: 2026-05-14
lang: ko
tags: [claude-code, dental-ads, qa, research, claude-opus]
description: "치과 광고 리서치 파일 6개를 Claude Opus 4.7로 QC했다. 병원명·주소 유출, 모순, 라벨 누락, 미지원 주장을 Read 6번으로 전수 검증. 코드 수정 0줄, 블로킹 이슈 0건 클린 패스. 자동화 파이프라인의 컴플라이언스 게이트 기록."
---

병원 이름 한 글자라도 HTML 보고서에 노출되면 의료법 이슈가 된다. 치과 광고 리서치 자동화 파이프라인을 운영하면서 가장 신경 쓰는 지점이다.

**TL;DR** Read 도구 6번으로 리서치 파일 전체를 QC했다. 병원·주소 유출 없음, 모순 없음, 라벨 누락 없음 — 블로킹 이슈 0건으로 통과.

## 뭘 검증했나

매일 갱신되는 치과 광고 리서치 파일들이 있다. 네이버 플레이스·블로그·SERP 패턴을 추적하는 파이프라인이 자동으로 만들어내는 결과물이다. 오늘 검토 대상은 다음 6개 파일이었다.

- `research/daily-medical-dental-ads/2026-05-14-daily-update.md`
- `rolling-knowledge-base.md`
- `source-index.md`
- `competitive-serp-observations.md`
- `naver-ranking-hypotheses.md`
- `reports/2026-05-14-place-ad-application-day-serp-pattern.html`

QC 기준은 4가지였다. 서로 충돌하는 내용이 있는가, 필수 라벨이 빠진 항목이 있는가, 근거 없는 주장이 있는가, 그리고 가장 중요한 — HTML 보고서에 특정 병원명·주소가 노출됐는가.

## 프롬프트 하나로 전수 검증

Claude Opus 4.7에 파일 경로를 나열하고 "블로킹 이슈만 확인해라"는 지시를 넣었다.

```
Read the updated daily research files for 2026-05-14 and review for blocking issues only:
contradictions, missing required labels, unsupported claims,
or specific hospital/address leakage in the HTML report.
Return OK if no blocking issues, otherwise list exact fixes.
```

핵심은 "블로킹 이슈만"이다. 개선 제안, 스타일 코멘트, 권장 사항을 전부 배제했다. 이 QC의 목적은 배포 차단 여부 판단이지 리뷰가 아니다. 프롬프트가 좁을수록 결과가 날카롭다.

6번의 Read 호출로 파일을 모두 읽고 검증했다. tool call이 6번인 건 불필요한 탐색 없이 지정된 파일만 정확히 읽었다는 뜻이다.

## 실제로 뭘 확인했나

병원 유출 여부부터. HTML 보고서가 검색 쿼리 레이블(예: "강남 치과", "청담 라미네이트")만 사용하고 있음을 확인했다. `OO치과의원`, 주소, 원장명 같은 식별 정보는 없었다. 검색 키워드와 특정 병원명을 혼동할 여지가 있는 부분을 특히 살폈는데, 파이프라인이 처음부터 키워드 레이블만 쓰도록 설계돼 있어서 문제가 없었다.

모순 검증에서 흥미로운 데이터 포인트가 하나 나왔다. 10개 표본 중 청담 라미네이트 쿼리에서 네이버 플레이스가 검출되지 않았다. 반면 외부 플랫폼에서는 6개가 잡혔다. 이건 모순이 아니라 실제 SERP 패턴 차이로 기록됐다. 플레이스 광고 노출 여부와 외부 플랫폼 노출은 독립적으로 움직인다는 가설을 뒷받침하는 데이터다.

라벨 누락과 근거 없는 주장은 이슈 없음. 모두 소스 링크 또는 관측 기록이 붙어 있었다.

## 도구 사용 통계

| 도구 | 횟수 |
|------|------|
| Read | 6 |
| **합계** | **6** |

Edit, Write, Bash는 0번. 순수 검증 세션이었다.

세션 통계: 1세션, 6 tool calls. 이게 이 세션의 전부다.

## 왜 Opus였나

이 파이프라인의 QC 단계에 Opus를 쓰는 이유는 하나다. 의료법 관련 판단에서 엣지 케이스를 놓치면 안 된다. "강남 치과"는 키워드이고 "강남연세치과의원"은 병원명이다. 이 차이를 문맥 속에서 정확히 구분해야 한다. 속도보다 정확도가 우선인 지점이다.

Sonnet이나 Haiku로 대체할 수 있는 부분도 많지만, 최종 블로킹 이슈 판정은 Opus에 맡긴다. 한 번 놓치는 비용이 모델 비용 절감보다 훨씬 크다.

## 작은 세션이지만 남기는 이유

6 tool calls, 파일 수정 0건. 이런 세션은 빌드 로그로 남길 가치가 없어 보인다. 하지만 "아무것도 안 했다"와 "문제 없음을 확인했다"는 다르다. QC 통과 기록은 나중에 이슈가 생겼을 때 어느 시점까지 정상이었는지를 역추적하는 근거가 된다. 자동화 파이프라인에서 검증 기록은 구현 기록만큼 중요하다.

결과: OK. 내일 리포트 배포 가능.
