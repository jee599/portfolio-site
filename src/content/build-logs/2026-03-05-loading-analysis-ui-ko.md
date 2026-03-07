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

Three.js 캔버스가 `z-index: -2`에 있는데, 위에서 불투명 배경이 전부 덮어버리고 있었다.

```css
/* Before — 불투명 배경이 캔버스를 가림 */
.loadingAnalysis { background: #0a0b2a; }

/* After — 투명으로 변경 */
.loadingAnalysis { background: transparent; }
```

배경을 `transparent`로 바꾸자 즉시 해결됐다.

CSS **18줄 → 3줄**로 줄었다.


## 슬라이드가 상태 바랑 겹쳤다

`.eduSlide.in`에 걸려 있던 `translateY(-6vh)`가 상단 상태 바 영역을 침범하고 있었다.

```css
/* 문제: 위로 올라가면서 상태 바와 겹침 */
.eduSlide.in { transform: translateY(-6vh); }

/* 수정: 기본 위치로 복원 */
.eduSlide.in { transform: translateY(0); }
```

`translateY(0)`으로 수정하면서 슬라이드 레이아웃 전체를 다시 잡았다.


## 추가 UX 개선 2가지

<ul class="feature-list">
<li>
<span class="feat-title">화살표 버튼</span>
<span class="feat-desc">데스크탑에서 슬라이드를 수동으로 넘길 수 있게 했다. <code>@media (hover: hover)</code> 조건부로 모바일에선 숨긴다.</span>
</li>
<li>
<span class="feat-title">스마트 예상 시간</span>
<span class="feat-desc"><code>localStorage</code>에 최근 3회 LLM 응답 시간을 저장하고 평균을 계산한다. "예상 약 N초" 문구가 실제 데이터 기반으로 표시된다.</span>
</li>
</ul>


## 프롬프트 전략

한 번에 다 요청하면 Claude가 과도하게 리팩토링하는 경향이 있다.

그래서 커밋 단위로 스코프를 나눴다.

첫 번째 프롬프트는 "배경 투명화"만.

두 번째 프롬프트에서 나머지를 묶었다:

> "eduSlide가 상태 바와 겹친다. translateY(-6vh) 문제. 데스크탑에서 슬라이드를 수동 조작할 수 있는 화살표 버튼도 추가해."

작업을 쪼개면 각 커밋의 목적이 명확해진다.

Claude도 더 정확하게 동작한다.


<hr class="section-break">

<div class="commit-log">
<div class="commit-row"><span class="hash">5d100bc</span> <span class="msg">fix(ui): make loading page backgrounds transparent</span></div>
<div class="commit-row"><span class="hash">88ef23f</span> <span class="msg">feat(loading): fix UI overlap, add slide arrows, smart estimated time</span></div>
</div>

<div class="change-summary">
<table>
<thead><tr><th>항목</th><th>변경</th></tr></thead>
<tbody>
<tr><td class="label">CSS 삭제</td><td class="after">-18줄</td></tr>
<tr><td class="label">CSS 추가 (화살표 + 타이머)</td><td class="after">+54줄</td></tr>
<tr><td class="label">page.tsx (상태관리)</td><td class="after">+49줄</td></tr>
</tbody>
</table>
</div>
