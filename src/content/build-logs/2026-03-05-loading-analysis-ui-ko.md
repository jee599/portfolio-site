---
title: "로딩 화면 UI 개선: Three.js 배경 투과, 슬라이드 화살표, 스마트 예상 시간"
project: "saju_global"
date: 2026-03-05
lang: ko
pair: "2026-03-05-loading-analysis-ui-en"
tags: [ui, three.js, loading, ux]
---

"Three.js 배경이 왜 로딩 페이지에서만 안 보이냐"라는 단순한 질문으로 시작했다.


## 불투명 배경이 범인이었다

`globals.css`의 `.loadingAnalysis`, `.loadingAurora`, `.loadingParticles`에 불투명 배경색이 하드코딩돼 있었다.

Three.js 캔버스가 `z-index: -2`에 있는데, 위에서 덮어버리고 있었던 것.

배경을 `transparent`로 바꾸자 즉시 해결.

관련 CSS 18줄이 3줄로 줄었다.


## 슬라이드가 상태 바랑 겹쳤다

`.eduSlide.in`의 `translateY(-6vh)`가 상단 상태 바를 침범하고 있었다.

`translateY(0)`으로 수정하면서 슬라이드 레이아웃 전체를 손봤다.

추가로 두 가지를 더 넣었다.

- **화살표 버튼** — 데스크탑에서 슬라이드를 수동으로 넘길 수 있게 했다. `@media (hover: hover)` 조건부로 모바일에선 숨긴다.

- **스마트 예상 시간** — `localStorage`에 최근 3회 LLM 응답 시간을 저장하고 평균을 계산한다. "예상 약 N초" 문구가 실제 데이터 기반으로 나온다.


## 프롬프트 전략

한 번에 다 요청하면 Claude가 과도하게 리팩토링하는 경향이 있다.

그래서 커밋 단위로 스코프를 나눴다.

첫 번째는 "배경 투명화", 두 번째는 "슬라이드 UX + 예상 시간".

> "eduSlide가 상태 바와 겹친다. translateY(-6vh) 문제. 데스크탑에서 슬라이드를 수동 조작할 수 있는 화살표 버튼도 추가해. LLM 평균 응답 시간을 localStorage에 저장해서 예상 시간 계산에 쓰게 해줘."

<div class="callout-stats">
<div class="stat-grid">
<div class="stat-item">
<span class="stat-value">-18줄</span>
<span class="stat-label">CSS 삭제</span>
</div>
<div class="stat-item">
<span class="stat-value">+54줄</span>
<span class="stat-label">CSS 추가 (화살표+타이머)</span>
</div>
<div class="stat-item">
<span class="stat-value">+49줄</span>
<span class="stat-label">page.tsx (상태관리)</span>
</div>
<div class="stat-item">
<span class="stat-value">2</span>
<span class="stat-label">커밋</span>
</div>
</div>
</div>

---

<div class="commit-log">
<div><span class="hash">5d100bc</span> fix(ui): make loading page backgrounds transparent</div>
<div><span class="hash">88ef23f</span> feat(loading): fix UI overlap, add slide arrows, smart estimated time</div>
</div>

작업을 쪼개면 각 커밋의 목적이 명확해진다.

Claude도 더 정확하게 동작한다.
