---
title: "Claude Code 14세션 78 tool calls: 사진작가 사이트 클라이언트 납품 전 리뷰-픽스 루프"
project: "portfolio-site"
date: 2026-05-18
lang: ko
tags: [claude-code, claude-opus-4-7, workflow, review-fix, static-site]
description: "Claude Code 14세션 78 tool calls로 사진작가 클라이언트 사이트(daymoon-pic-site) 납품 준비. 러너 검증 6번 → 구현 → read-only 리뷰 → 픽스 → 폴리시, Read 36번이 전체의 46%를 차지했다."
---

14개 세션, 78번의 tool call. 오늘 작업의 주축은 `daymoon-pic-site` — 사진작가 클라이언트를 위한 정적 HTML/CSS 사이트였다. 구현보다 읽기가 더 많았고, 코드 한 줄 없는 세션이 6개였다.

**TL;DR** 새 프로젝트에 Claude Code를 붙일 때 러너 검증부터 시작하는 패턴이 안정적이다. 리뷰 세션을 구현과 분리하면 납품 전 픽스 범위가 명확해진다.

## 6번의 "OK" — 러너 검증의 실체

총 14개 세션 중 6개는 코드를 한 줄도 건드리지 않았다. 프롬프트는 이런 식이다.

```
Return exactly: CLAUDE_OK
Return exactly: CLAUDE_STDIN_OK
Return exactly: CLAUDE_PROJECT_OK
```

Claude Code를 새 프로젝트(`daymoon-pic-site`)에 처음 붙일 때, 자동화 파이프라인이 실제로 모델에 닿는지 확인하는 단계다. 세션을 열고, 모델이 응답하고, 종료 코드를 확인한다. 이 검증 없이 실제 구현 세션을 보내면 파이프라인 오류인지 코드 오류인지 구분이 안 된다.

6번 반복된 건 stdin, project context, skip 조건 등 각 케이스를 별도로 검증했기 때문이다. 모두 0분, 0 tool calls로 끝났다. 오버헤드가 없다.

## 구현 → 리뷰 → 픽스 → 폴리시

실제 작업 흐름은 4단계였다.

**구현 (세션 2, 4)**: 클라이언트 요청 사항을 한 번에 적용했다. 내비 순서 변경(ABOUT / PRODUCT / NOTICE / GALLERY / RESERVATION), Product 페이지 구조(상단 히어로 이미지 + 하단 구성/가격 상세), Gallery 최대 4컬럼에 ALL 탭 제거. 두 세션 합산 Read 16번, Bash 8번. `PROJECT.md`와 기존 스타일 규칙을 참조하면서 진행했다.

**리뷰 (세션 12)**: 구현이 끝난 뒤 별도 read-only 세션으로 클라이언트에게 보내기 전 상태를 점검했다. 프롬프트에 `Do not edit files`를 명시했다. 결과는 한국어 불릿 리스트였다: ✅ done, ⚠️ insufficient, 🚨 must-fix. Read 5번, Bash 4번.

**픽스 (세션 13)**: 리뷰에서 나온 must-fix 항목만 처리했다. `about.html`의 "대표 사진 영역 · 추후 교체" placeholder, `notice.html`의 더미 공지 텍스트, `reservation.html`의 미완성 폼 레이블. Edit 12번으로 `about.html`, `notice.html`, `reservation.html`, `styles.css` 4개 파일을 수정했다.

**폴리시 (세션 14)**: 폰트 위계, 단락 간격, 한국어 카피, 중복 버튼을 정리했다. 클라이언트 요청 사항이 그대로 살아있는지 재확인하면서 진행했다. Edit 11번, Read 5번, Bash 4번.

리뷰를 구현과 분리한 것이 핵심이다. 같은 세션에서 구현하고 확인하면 만든 사람 눈에는 의도대로 보인다. 다른 세션, 프롬프트, 컨텍스트로 읽으면 놓친 것이 보인다.

## Read 36번이 말하는 것

전체 78 tool calls 중 Read가 36번(46%)으로 가장 많다. Edit 23번, Bash 17번이 뒤를 잇는다.

사진작가 사이트는 단순한 정적 HTML/CSS/JS 구조지만, `about.html`, `product.html`, `notice.html`, `gallery.html`, `reservation.html` 다섯 페이지와 `styles.css` 하나가 서로 물려있다. 한 파일을 고치면 다른 페이지의 스타일에 영향이 가기 때문에 수정 전마다 현재 상태를 읽어야 한다.

특히 세션 14(폴리시 패스)에서 Read → Edit 패턴이 반복됐다. CSS 클래스 이름이나 HTML 구조를 확인하지 않고 Edit을 보내면 이미 있는 스타일을 덮거나 중복 선언이 생긴다. 파일이 5개뿐인 정적 사이트에서도 "읽기 우선" 패턴이 필요하다.

## 세션 1의 outlier — 의료광고 리뷰

첫 세션은 `daymoon-pic-site`와 무관했다. `dentalad` 프로젝트의 한국 의료광고 일일 리포트 HTML 파일을 read-only로 검토하는 세션이었다. Read 6번, 약 0분.

블로킹 이슈 없음(OK)으로 종료. 이 패턴도 러너 검증처럼 자동화 파이프라인의 일부다. 파일을 생성한 뒤 다음 단계로 넘기기 전에 Claude가 의료법 준수 여부(금지된 효과 보장 문구, 미확인 수치 단정, 병원명 노출 등)를 확인하는 구조다.

## 통계 요약

| 항목 | 수치 |
|------|------|
| 총 세션 | 14 |
| 총 tool calls | 78 |
| Read | 36 (46%) |
| Edit | 23 (29%) |
| Bash | 17 (22%) |
| Grep | 2 (3%) |
| 수정 파일 | 5 |
| 코드 없는 세션 | 6 |
| 모델 | claude-opus-4-7 |
