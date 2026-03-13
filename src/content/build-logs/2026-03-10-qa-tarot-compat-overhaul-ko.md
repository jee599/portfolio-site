---
title: "런칭 전 QA 3라운드 — 궁합 전면 개편·타로 결제·공유 카피 실험"
project: "saju_global"
date: 2026-03-10
lang: ko
pair: "2026-03-10-qa-tarot-compat-overhaul-en"
tags: [qa, compatibility, tarot, i18n, paywall, share, viral]
---

하루에 커밋 8개. 런칭 직전 QA를 세 번 돌리면서 쌓였다.

크게 세 흐름이 있었다. 궁합 페이지 전면 개편, 타로 결제 연결과 paywall 리라이트, 그리고 공유 카피 바이럴 실험. 분리해서 커밋했지만 실제로는 거의 동시에 진행됐다.

---

## 궁합(四柱 궁합, 생년월일시 기반 커플 궁합 리포트) 전면 개편

궁합 페이지가 너무 가벼웠다. 출생 시간을 받지 않고 정오로 고정해서 계산했고, 리포트도 4개 섹션뿐이었다. Claude에 한 줄짜리 지시를 던졌다.

> "compat 페이지에 출생 시간(12지지 선택) 입력 추가. 사주 엔진에 실제 시간 반영. 리포트 6섹션으로 확장. 가격 ₩3,900→₩5,900."

응답이 한 번에 왔다. 출생 시간 입력 UI, 엔진 연결, LLM 청크 3개 병렬 실행, i18n 키 추가까지 묶어서. 차이가 나는 부분이 명확해서 검토가 빨랐다.

<div class=change-summary>
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td class=label>출생 시간</td><td class=before>하드코딩 정오(noon)</td><td class=after>12지지 선택 UI</td></tr>
<tr><td class=label>리포트 섹션</td><td class=before>4개</td><td class=after>6개 (communication, timing 추가)</td></tr>
<tr><td class=label>LLM 청크</td><td class=before>순차 처리</td><td class=after>3개 병렬 → 3-4K chars 목표</td></tr>
<tr><td class=label>가격(KR)</td><td class=before>₩3,900</td><td class=after>₩5,900</td></tr>
<tr><td class=label>i18n 엔진</td><td class=before>한국어 하드코딩 결과값</td><td class=after>locale-agnostic key 반환</td></tr>
</tbody>
</table>
</div>

---

## QA 3라운드

개편 커밋 직후 QA를 돌렸다. Claude에게 전체 앱을 훑으면서 버그 목록을 뽑아달라고 했다. 이 방식이 잘 맞는다. 나 혼자 보는 것보다 범위가 넓다.

1라운드(2fe4e2c)에서 나온 것들은 주로 일관성 문제였다. 헤더가 페이지마다 `sticky`와 `fixed`를 섞어 쓰고 있었고, `error.tsx`와 `not-found.tsx`에 i18n이 아예 없었다. API 에러 메시지 일부가 한국어 하드코딩이었던 것도 잡혔다.

2라운드(123f515)는 더 중요했다. 타로 paywall이 `alert()` 콜을 쓰고 있었고, Internal API 엔드포인트가 헤더 스푸핑에 열려 있었다. `x-internal-secret` 헤더 검증을 추가했다. 홈 폼의 `useRef` 이중 제출 방지도 이 라운드에서 들어갔다.

3라운드(121086b)에서 한국 결제 공급자 이슈가 나왔다. Toss 연동 코드가 들어가 있지만 아직 미구현 상태였는데, 한국 결제가 Toss로 라우팅되고 있었다. Paddle로 일단 다시 연결했다. `INTERNAL_API_SECRET` 환경변수에 하드코딩 fallback이 남아있던 것도 제거했다. 보안 이슈라 즉시 처리.

<ul class=feature-list>
<li><span class=feat-title>헤더 통일</span><span class=feat-desc>모든 페이지 fixed 포지션 일관화</span></li>
<li><span class=feat-title>Internal API 보안</span><span class=feat-desc>x-internal-secret 헤더 스푸핑 방어 추가</span></li>
<li><span class=feat-title>이메일 국제화</span><span class=feat-desc>리포트 이메일 8 로케일 × 5 상품 제목/CTA 분리</span></li>
<li><span class=feat-title>팜 이미지 제한</span><span class=feat-desc>2MB 사이즈 검증 checkout 2곳에 추가</span></li>
<li><span class=feat-title>CSP 수정</span><span class=feat-desc>palm 카메라 미리보기용 blob: img-src 허용</span></li>
<li><span class=feat-title>analytics 차단 해제</span><span class=feat-desc>/api/events 를 rate limit 경로에서 제거 (하루 5회 제한에 걸려 있었음)</span></li>
</ul>

---

## 타로 공유 + 바이럴 카피 실험

타로 결과 공유 기능이 없었다. 사주(四柱) 결과는 공유 버튼이 있는데 타로는 빠져 있었다. 추가하면서 share landing 페이지에 티저 콘텐츠도 넣었다.

카피 실험이 재밌었다. 처음에 공유 텍스트를 1줄로 줄이고 특성 목록을 뺐다. 바이럴 전환률을 높이려는 시도였다. 그런데 한 커밋 후에 되돌렸다. 특성이 포함된 긴 버전이 실제로 더 눈길을 끈다는 판단이 생겼다. A/B 테스트 없이 직관으로 결정한 거라 나중에 검증이 필요하다.

힌디(hi) OG 이미지에서 타로 제목이 영어로 나오는 버그가 마지막에 잡혔다.

<div class=callout-stats>
<div class=stat-grid>
<div class=stat-item><span class=stat-value>8</span><span class=stat-label>3월 10일 커밋 수</span></div>
<div class=stat-item><span class=stat-value>43</span><span class=stat-label>변경된 파일 수</span></div>
<div class=stat-item><span class=stat-value>640</span><span class=stat-label>추가된 줄</span></div>
<div class=stat-item><span class=stat-value>8</span><span class=stat-label>지원 로케일</span></div>
<div class=stat-item><span class=stat-value>3</span><span class=stat-label>QA 라운드</span></div>
<div class=stat-item><span class=stat-value>12</span><span class=stat-label>타로 신규 i18n 키</span></div>
</div>
</div>

---

## 커밋 로그

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>4f9c985</span> <span class=msg>feat(compat): complete overhaul — birth time, 6 sections, i18n, pricing</span></div>
<div class=commit-row><span class=hash>2fe4e2c</span> <span class=msg>fix: QA fixes — unified header, i18n errors, shared constants, accessibility</span></div>
<div class=commit-row><span class=hash>123f515</span> <span class=msg>fix: HIGH QA fixes — tarot paywall rewrite, palm image, API security, form guard</span></div>
<div class=commit-row><span class=hash>e303218</span> <span class=msg>fix: add tarot to Paddle checkout, i18n report emails, fix retrieve labels</span></div>
<div class=commit-row><span class=hash>121086b</span> <span class=msg>fix: QA critical fixes — Korean Paddle migration, security, email i18n, palm validation</span></div>
<div class=commit-row><span class=hash>df7c2d9</span> <span class=msg>fix: report page Suspense, remove /api/events rate limit, CSP blob: for palm</span></div>
<div class=commit-row><span class=hash>9553df1</span> <span class=msg>feat(share): add tarot sharing, teaser content, and improve viral copy across 8 locales</span></div>
<div class=commit-row><span class=hash>cab0e53</span> <span class=msg>fix(share): shorten share text to 1 line, remove traits for better viral conversion</span></div>
<div class=commit-row><span class=hash>ca70ae0</span> <span class=msg>revert: restore longer share text with traits — better for engagement</span></div>
<div class=commit-row><span class=hash>560dc73</span> <span class=msg>fix(i18n): translate Hindi tarot title in OG route from English to Hindi</span></div>
</div>

---

런칭 직전 이런 식으로 하루에 QA 3라운드를 돌리는 게 맞는 방식인지 모르겠다. 효율은 높은데 커밋이 너무 잘게 쪼개진다. 대신 어디서 무엇이 변했는지 추적은 쉽다. 트레이드오프다.
