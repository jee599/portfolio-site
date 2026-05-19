---
title: "의료광고 날짜 오귀속 자동 검출 + Daymoon 폰트 7페이지 교체: 4세션 52 tool calls"
project: "portfolio-site"
date: 2026-05-19
lang: ko
tags: [claude-code, compliance-review, typography, dental-ad, daymoon, prompting]
description: "Claude Code로 의료광고 날짜 오귀속 이슈를 자동 검출하고, Daymoon 사이트 폰트를 Outfit + Pretendard로 교체한 과정. 4세션, 52 tool calls, 8개 파일 수정."
---

네이버 공지 날짜 하나가 문서 안에서 두 가지 의미로 혼용되고 있었다. 리뷰어가 없었으면 그냥 배포됐을 내용이다. 같은 날, Daymoon 사진 스튜디오 사이트 폰트 교체 작업은 세션 도중에 끊겼고, 두 번째 세션에서 7개 HTML 페이지를 한 번에 처리했다.

**TL;DR** `blocking-issues-only` 프롬프트로 의료광고 컴플라이언스를 자동화하고, "Continue the previous run" 패턴으로 끊긴 타이포그래피 작업을 이어받아 완성했다. 4세션, 52 tool calls.

## 의료광고 컴플라이언스: blocking-issues-only 패턴

의료광고 일일 리포트를 작성하면 배포 전에 반드시 확인해야 하는 항목이 있다. 특정 병원명·주소 노출 여부, 금지된 보장 표현, 날짜·출처 일관성, 필수 면책 문구 포함 여부다.

이번에 쓴 프롬프트:

```
Read these files and perform a blocking-issues-only review for
scheduled Korean medical/dental ads daily report.
Check contradictions, missing required labels/caveats,
named hospital/address leakage, prohibited guarantees, stale notes.
Answer OK if no blocking issues; otherwise list exact fixes.
Files: [MD 파일 경로] [HTML 보고서 경로]
```

핵심은 `blocking-issues-only`다. "개선점을 찾아줘"가 아니라 "배포를 막아야 할 이슈만 리포트해라"다. 결과가 `OK` 또는 `정확한 수정 지시` 둘 중 하나로만 나온다.

세션 1에서 블로킹 이슈 1건이 나왔다. `2026-05-19-daily-update.md` 27번 라인에서 날짜 귀속 오류였다.

파일 5번·12번 라인 기준으로는 이렇게 명확히 구분돼 있었다. 2026-05-07 공지는 플레이스광고 노출 개수 상향, 2026-05-14 공지는 PC 지도 플레이스광고 지면 확대 테스트(음식점 업종). 그런데 27번 라인이 이렇게 되어 있었다: "5/14 플레이스광고 노출 개수 상향 이후에는…" 5/14 공지는 지면 확대 테스트인데, 노출 개수 상향으로 잘못 귀속한 것이다.

수정 후 동일한 프롬프트로 재검수. 2차 세션 결과는 OK였다. 날짜 일관성, 병원명 누출 없음, 금지 보장 표현 없음, 위험 표현 처리 방식까지 네 항목 모두 통과.

두 세션 합쳐서 tool calls 4번(Read × 4), 수정 파일 0개. Claude는 리뷰어 역할만 했다.

## Daymoon 타이포그래피: 세션이 끊겼을 때 이어받기

Daymoon은 사진작가 스튜디오 사이트다. 폰트 방향으로 "B · Quiet Minimal"을 선택했다. 영어·브랜드·네비게이션에는 `Outfit`, 한국어 본문에는 `Pretendard`를 쓰는 조합이다.

세션 3에서 작업을 시작했다. 저장소 구조 파악, 기존 폰트 로드 패턴 확인, `styles.css` 수정까지 진행됐는데 그 시점에서 세션이 종료됐다. 7개 HTML 페이지에 `Pretendard` 웹폰트 로드가 빠진 상태였다.

세션 4 시작 프롬프트:

```
Continue the Daymoon typography update. The previous run changed styles.css but stopped before completing.
Finish the task in /Users/jidong/daymoon-pic-site:
1. Ensure Pretendard actually loads on all real site pages.
   Current HTML pages load Google Fonts for Noto Sans KR + Outfit.
   Add a safe Pretendard webfont load consistently to real pages
   (index/about/product/gallery/contact/notice/reservation as applicable),
   or otherwise make Pretendard available. Keep Outfit too. Do NOT add serif fonts.
```

"The previous run changed X but stopped before completing"이 핵심 구조다. 뭘 했고 뭐가 남았는지 명시하면 Claude가 저장소를 재탐색하는 시간이 줄어든다. 7개 파일의 `<head>` 섹션이 동일한 구조여서 Read 7번, Edit 13번으로 처리됐다.

적용한 방식은 `Pretendard Variable` dynamic-subset이다. jsDelivr CDN에서 로드한다.

```html
<link rel="stylesheet" as="style" crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
```

고정 굵기를 여러 개 로드하는 것보다 variable font 하나로 전체 weight를 커버하는 쪽이 HTTP 요청도 줄고, dynamic-subset은 실제 사용 글자만 서브셋으로 처리해 초기 로드 용량도 낮다.

## 세션 통계

| 세션 | 작업 | tool calls | 주요 도구 |
|------|------|-----------|-----------|
| 1 | 의료광고 1차 검수 (이슈 발견) | 2 | Read × 2 |
| 2 | 재검수 (OK 확인) | 2 | Read × 2 |
| 3 | `styles.css` 수정 (미완) | 23 | Bash × 14, Read × 5, Edit × 4 |
| 4 | 7개 HTML 완성 | 25 | Edit × 13, Read × 7, Bash × 4 |

전체: 52 tool calls. Bash(18), Edit(17), Read(16), Grep(1). 수정 파일 8개, 생성 파일 0개.

세션 3에서 Bash가 14번으로 많은 건 저장소 구조 파악과 기존 폰트 로드 패턴 확인에 터미널을 많이 썼기 때문이다. 세션 4는 Edit 중심으로 수렴했다. 파악 단계가 끝나면 도구 분포가 바뀐다.

## 세션이 끊겨도 되는 이유

`styles.css` + 7개 HTML을 한 세션에서 동시에 바꾸는 것보다, 첫 단계에서 CSS를 정리하고 확인한 뒤 HTML 로드를 추가하는 쪽이 롤백 단위가 작다. "Continue the previous run" 패턴이 있으면 이어받는 데 1~2분도 안 걸린다.

> 세션 재시작 비용보다 중간 검증의 가치가 더 크다.
