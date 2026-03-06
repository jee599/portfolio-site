---
title: "로딩 화면 UI 개선: Three.js 배경 투과, 슬라이드 화살표, 스마트 예상 시간"
project: "saju_global"
date: 2026-03-05
lang: ko
pair: "2026-03-05-loading-analysis-ui-en"
tags: [ui, three.js, loading, ux]
---

## 뭘 했나

로딩 분석 페이지의 UI를 두 커밋으로 다듬었다.

- Three.js CosmicBackground가 로딩 화면에서도 보이도록 **불투명 배경 제거**
- 데스크탑에서 교육 슬라이드를 수동으로 넘길 수 있는 **화살표 버튼 추가**
- LLM 응답 시간을 localStorage에 누적해 **"예상 약 N초" 동적 계산**

## 어떻게 구현했나

### 배경 투명화

"Three.js 배경이 왜 로딩 페이지에서만 안 보이냐"는 질문으로 시작했다.

원인은 `globals.css`의 `.loadingAnalysis`, `.loadingAurora`, `.loadingParticles`에 불투명 배경색이 하드코딩돼 있어서 Three.js 캔버스(`z-index: -2`)를 덮고 있었던 것. 배경을 `transparent`로 바꾸자 즉시 해결.

### 슬라이드 UX + 예상 시간

- `.eduSlide.in`의 `translateY(-6vh)`가 상단 상태 바와 겹치는 버그 → `translateY(0)`으로 수정
- 화살표 버튼은 데스크탑 전용: `@media (hover: hover)` 조건부 표시
- 스마트 예상 시간: `localStorage`에 최근 3회 응답 시간 저장 → 평균 계산

### 프롬프트 전략

커밋 단위로 분리해서 넘겼다. 한 번에 다 요청하면 Claude가 과도하게 리팩토링하는 경향이 있어서 스코프를 나눔.

> "eduSlide가 상태 바와 겹친다. translateY(-6vh) 문제. 데스크탑에서 슬라이드를 수동 조작할 수 있는 화살표 버튼도 추가해. LLM 평균 응답 시간을 localStorage에 저장해서 예상 시간 계산에 쓰게 해줘."

## 커밋 로그

- `5d100bc` fix(ui): make loading page backgrounds transparent for 3D cosmic background
- `88ef23f` feat(loading): fix UI overlap, add slide arrows, smart estimated time

## 결과

- `loadingAnalysis` 관련 CSS: 18줄 → 3줄 (불투명 배경 제거)
- 슬라이드 화살표 + 타이머 레이아웃 추가로 전체 CSS 54줄 순증가
- `page.tsx` 49줄 순증가 (슬라이드 상태 관리 + localStorage 로직)
