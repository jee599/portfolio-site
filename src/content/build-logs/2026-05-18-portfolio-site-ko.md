---
title: "Claude Code 18 세션 145 tool calls: 사진작가 사이트 클라이언트 폴리시 루프"
project: "portfolio-site"
date: 2026-05-18
lang: ko
tags: [claude-code, claude-opus-4-7, workflow, review-fix, static-site, claude-runner]
description: "사진작가 Daymoon 클라이언트 사이트를 Claude Code 18 세션, 145 tool calls로 정제. 러너 자동화 헬스체크 8 세션 + 리뷰-픽스 루프로 파일 8개를 새로 만들지 않고 다듬었다."
---

오늘 세션 기록을 열면 이상한 패턴이 보인다. 18개 세션 중 8개가 `CLAUDE_OK`, `CLAUDE_SKIP_OK`, `CLAUDE_STDIN_OK` 같은 단답만 주고받고 끝난다. tool calls 0, elapsed 0분. 실제 작업 세션이 아니라 Claude Code 러너 자동화를 검증하는 헬스체크 세션들이다.

**TL;DR** Claude Code 러너 자동화 셋업을 검증하면서, 동시에 사진작가 클라이언트 사이트(`daymoon-pic-site`)를 9 세션에 걸쳐 폴리시했다. 새 파일은 하나도 만들지 않았고, 8개 기존 파일을 Edit 39번으로 다듬었다.

## 8 세션의 "OK" — 러너 헬스체크의 실체

세션 3, 5, 6, 7, 8, 9, 10, 11이 전부 이런 형태다.

```
사용자: Return exactly: CLAUDE_OK
Claude: CLAUDE_OK

사용자: Return exactly: CLAUDE_STDIN_OK
Claude: CLAUDE_STDIN_OK
```

Claude Code를 새 프로젝트에 자동화 러너로 붙일 때, 파이프라인이 실제로 모델에 닿는지 먼저 검증한다. stdin 주입 방식(`CLAUDE_STDIN_OK`), 프로젝트 컨텍스트 로딩(`CLAUDE_PROJECT_OK`), 스킵 처리(`CLAUDE_SKIP_OK`) 케이스를 각각 별도 세션으로 확인했다. 이 검증 없이 실제 구현 세션을 보내면 파이프라인 오류인지 코드 오류인지 구분이 안 된다.

오버헤드는 없다. 세션당 0분, 0 tool calls. 그런데 이 단계를 생략했다가 나중에 "왜 내 수정이 안 들어갔지?"를 디버깅하는 시간이 더 크다.

## Daymoon 사이트: 9 세션에 걸친 클라이언트 폴리시

`daymoon-pic-site`는 사진작가 Daymoon의 정적 HTML 사이트다. React나 빌드 도구 없이 `about.html`, `product.html`, `notice.html`, `gallery.html`, `reservation.html`과 `styles.css` 하나로 구성된 구조다. 클라이언트 피드백이 여러 차례 들어오면서 세션이 나뉘었다.

**세션 2, 4 — 초기 구현**: 동일한 프롬프트를 두 번 실행했다. 세션 2가 파일 탐색(Read 7번, Bash 3번)만 하고 Edit에 도달하지 못해 세션 4에서 재실행했다. 클라이언트 요청 사항: 내비 순서 ABOUT / PRODUCT / NOTICE / GALLERY / RESERVATION, 상품 페이지 구조(상단 히어로 이미지 + 하단 구성/가격 상세), 갤러리 4열 고정 + ALL 탭 제거.

**세션 12 — read-only 리뷰**: 구현 후 별도 세션으로 클라이언트에게 보내기 전 상태를 점검했다. 프롬프트에 `Do not edit files`를 명시했다. 결과는 한국어 불릿 리스트였다: ✅ done / ⚠️ insufficient / 🚨 must-fix. Read 5번, Bash 4번.

**세션 13 — must-fix 처리**: 리뷰에서 나온 항목만 수정했다. `about.html`의 "대표 사진 영역 · 추후 교체" placeholder, `notice.html`의 더미 공지 텍스트, `reservation.html`의 미완성 폼 레이블, `styles.css` 정리. Edit 12번.

**세션 14 — 전체 폴리시**: 폰트 위계, 단락 간격, 한국어 카피, 중복 버튼. 클라이언트 요청이 그대로 살아있는지 재확인하면서 진행했다. Edit 11번, Read 5번, Bash 4번.

**세션 15 — 상품 페이지 디자인 패스**: "AI 템플릿처럼 보이지 않게"라는 피드백을 받았다. 그라디언트 카드, 이모지 아이콘, 과도한 그림자를 제거하고 Apple-like 미니멀 스타일로 정제했다. Read 7번, Edit 7번.

**세션 16, 17, 18 — 클라이언트 피드백 반영**: 세 세션이 각각 하나의 단위였다. 세션 16은 카카오 스크린샷 피드백으로 상품 패널의 `<dl class="product-meta">` 블록(추천 대상, 분위기, 구성 메타 레이블) 전부 제거. 세션 17은 카카오채널 URL(`https://pf.kakao.com/_TuhCn`)을 예약 CTA에 연결. 세션 18은 모바일 드로어에서 HOME 항목 제거 — `about.html`, `contact.html`, `gallery.html`, `index.html`, `notice.html`, `product.html`, `reservation.html` 7개 파일에서 동일 라인을 삭제했다.

## 리뷰를 구현과 분리한 이유

세션 12에서 9 tool calls를 써서 읽기 전용 검토를 먼저 했다. 같은 세션에서 구현하고 확인하면 만든 사람 눈에는 의도대로 보인다. 다른 세션, 새 컨텍스트로 읽으면 놓친 것이 보인다.

세션 12 프롬프트의 핵심은 결과 형식을 강제한 부분이다.

```
Return Korean bullet list: done, insufficient, must-fix before showing client.
```

"done / insufficient / must-fix" 세 카테고리를 명시하면 Claude가 "대체로 구현됐습니다"로 뭉개지 않는다. 각 항목이 어느 카테고리에 속하는지 판단해야 하기 때문이다. 그 결과물이 세션 13의 수정 범위를 정확히 정의했다.

## Read 63번이 말하는 것

전체 145 tool calls 중 Read가 63번(43%)으로 가장 많다. Edit 39번, Bash 32번, Grep 11번이 뒤를 잇는다.

정적 사이트라도 수정 전마다 현재 HTML 구조를 확인해야 한다. 특히 `styles.css` 하나에 모든 페이지 스타일이 들어있는 구조에서는 CSS 클래스 이름을 확인하지 않고 Edit을 보내면 이미 있는 선언을 덮거나 중복이 생긴다. 파일 5개짜리 사이트에서도 "읽기 우선" 패턴은 필요하다.

## 세션 1의 outlier — 의료광고 컴플라이언스 리뷰

첫 세션은 `daymoon-pic-site`와 무관했다. `dentalad` 프로젝트의 한국 의료광고 일일 리포트 파일을 read-only로 점검하는 세션이었다. 블로킹 이슈 없음(OK)으로 종료. Read 6번, 0분.

이것도 자동화 파이프라인의 일부다. 리포트 파일을 생성한 뒤 다음 단계로 넘기기 전에 Claude가 의료법 준수 여부를 확인한다. 금지된 효과 보장 문구, 미확인 수치 단정, 병원명/주소 노출 등을 체크하는 구조다.

## 통계 요약

| 항목 | 수치 |
|------|------|
| 총 세션 | 18 |
| 총 tool calls | 145 |
| Read | 63 (43%) |
| Edit | 39 (27%) |
| Bash | 32 (22%) |
| Grep | 11 (8%) |
| 수정 파일 | 8 |
| 생성 파일 | 0 |
| 코드 없는 세션 | 8 |
| 모델 | claude-opus-4-7 |

> 헬스체크 세션을 따로 빼두면, 실제 작업 세션에서 파이프라인 오류와 코드 오류를 구분할 수 있다.
