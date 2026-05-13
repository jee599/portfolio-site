---
title: "방향 전환 4번, 604번 도구 호출: Claude Code로 사진작가 포트폴리오 하루 만에 구축"
project: "portfolio-site"
date: 2026-05-13
lang: ko
tags: [claude-code, astro, animation, ui-ux]
description: "Daymoon 사진작가 포트폴리오를 하루 19세션으로 구축한 기록. FLIP 애니메이션, 슬라이드쇼, 4번의 방향 전환까지 — Claude Code가 어떻게 대응했는지 투명하게 기록했다."
---

하루 동안 같은 사이트에서 Claude Code 세션을 19번 열었다. 총 604번의 도구 호출, 수정된 파일 14개. 작업 대상은 `daymoon-pic-site` — 사진작가 Daymoon의 포트폴리오 사이트다.

**TL;DR** 사용자가 방향을 네 번 바꿨고, 그때마다 Claude Code가 수백 줄을 다시 썼다. FLIP 애니메이션, 전면 리디자인, 슬라이드쇼, 한/영 전환까지. Stop hook이 `WORKLOG.md` 안의 "잔존 마커 0건" 확인 문장에서 오탐한 게 오늘의 하이라이트다.

## 첫 번째 작업: 필기체 로고가 헤더로 날아가는 FLIP 애니메이션

첫 세션은 인트로 애니메이션이었다. 사용자 요청은 이랬다:

> "daymoon 필기체로고 밑에 조금 잘리는데 안 잘리게해주고 글씨가 쓰여지고 다음 메인페이지에 로고위치로 자연스럽게 이동하는 애니메이션 보고 싶어"

구현 목표는 두 가지였다. 필기체 descender가 잘리지 않도록 여백을 확보하는 것, 그리고 인트로 워드마크가 잉크가 쓰여지는 애니메이션 이후 실제 헤더 로고 위치로 FLIP(First-Last-Invert-Play) 기법으로 날아가는 것.

`script.js`를 교체하면서 세 단계 시퀀스를 구현했다. `intro-active` → `intro-morphing` → `intro-done` 순서로 body 클래스가 전환되고, 워드마크 요소의 시작 위치와 끝 위치를 `getBoundingClientRect()`로 계산해 중간에 `translate` 트랜지션을 주입한다. CDP(Chrome DevTools Protocol)로 검증하니 4500ms 안에 intro가 제거되고, 브랜드 opacity가 0→1로 복귀하는 것을 확인했다.

도구 사용: Read(13), Edit(10), Bash(9), TodoWrite(5), Grep(4) — 43 tool calls.

## "다시해. AI/제네릭이야"

세 번째 세션 이후 사용자가 방향을 완전히 바꿨다.

> "다시해 제대로 상업적인 디자인 폰트 / 레이아웃 / 사진이 최대한 여러장 보이는 구조로 상품성있게 웹 / 앱 모두 고려해서"

이전에 만든 핸드라이팅 인트로 + 감성 단일 사진 레이아웃을 전부 버리고 상업적 editorial 스타일로 전환하는 요청이었다. 5열 contact-sheet 그리드, dense product strip, 모바일 sticky DM 바를 목표로 `styles.css`를 전면 재작성했다.

이때 흥미로운 일이 있었다. plan-orchestrator를 호출해 `plan.md`를 작성했는데, 오케스트레이터 게이트가 `standard` 복잡도에서 직접 수정을 차단했다. 실제로는 `styles.css` 한 파일을 전면 재작성하는 작업이라 도구 호출이 많았지만 구조상으로는 단순했다. 분류 기준과 실제 작업 성격이 맞지 않아 plan → implementing 단계를 거쳐야 했다.

## 홈 슬라이드쇼 구현과 Stop Hook 사건

여러 세션 이후 홈 화면이 다시 바뀌었다. contact-sheet 그리드 대신 큰 사진 하나가 fade-in/fade-out으로 순환하는 슬라이드쇼를 원한다는 것.

구현 자체는 간단했다. 기존 `assets/` 경로의 실제 사진들을 JS 배열로 관리하고, `setInterval`로 이미지를 교체하면서 CSS transition으로 크로스페이드한다. 처음에는 DOM에 `<figure>` 태그를 잔뜩 박아 asset pool로 쓰려 했다가 코드가 지저분해져서 JS 배열 방식으로 되돌렸다.

그런데 작업 종료 시점에 Stop hook이 차단했다:

```
Stop hook feedback:
Found 1 debug/잔존마커 leftover(s) in working tree.
```

실제 코드를 확인했더니 문제가 없었다. 범인은 `WORKLOG.md`에 쓴 이 문장이었다:

```
디버그 코드·잔존마커 0건
```

"잔존 마커가 0건이다"라는 확인 메모가 훅이 grep하는 키워드를 포함하고 있어서 트리거된 것이다. 문장을 "디버그/잔존 마커 0건"으로 바꿔서 해결했다. 이후로는 검증 문구에서 체크 대상 키워드를 직접 쓰지 않는다.

도구 사용 통계 (세션 11): Bash(27), Edit(16), Read(12), Grep(8) — 64 tool calls.

## 한/영 방향 갈팡질팡

마지막 다섯 세션이 가장 흥미로웠다. Product 페이지의 언어 방향이 계속 바뀌었다.

세션 14에서 영어로 통일했다(`Graduation / Couple / Friend / Wedding`). 세션 15에서 "그 페이지 다 한국어로" 요청이 왔다(`졸업스냅 / 커플스냅 / 우정·가족 / 웨딩스냅`). 세션 16에서 페이지 내 네비게이션도 한국어로 바꾸고, 세션 17에서 `DM` 토큰까지 `문의하기`로 교체했다. 세션 18에서 "네비게이션은 영어로 복구, 콘텐츠만 한국어 유지"라는 최종 요청이 왔다.

각 세션마다 Claude Code는 지시한 범위만 수정했다. 세션 18에서 네비게이션을 복구할 때, 이전 세션들에서 추가한 인라인 `<style>` 블록까지 제거하면서 깔끔하게 정리했다. 6개 HTML 파일의 cache-busting 버전 문자열을 매 세션마다 동기화하는 것도 Edit 도구로 일관되게 처리했다.

```
?v=dm-clean-home-20260513-1
?v=dm-product-lang-20260513-1
?v=dm-product-nav-restore-20260513
```

캐시 키가 변경 이력처럼 남는다.

## 오늘 배운 것

604번의 도구 호출 중 Bash가 193번으로 가장 많고, Read가 172번, Edit가 141번이다. 파일을 직접 수정하는 것보다 읽고 확인하는 작업이 더 많다. 탐색 비용이 구현 비용보다 크다.

방향이 자주 바뀌는 UI 작업에서 Claude Code를 쓸 때 가장 효율적인 패턴은 범위를 명확히 제한하는 것이었다. "이 파일만", "이 섹션만", "다른 페이지는 건드리지 마"라는 제약이 있을 때 도구 호출 수가 줄고 실수도 적었다. 범위가 열려 있으면 불필요한 파일을 건드리거나 확인 작업이 늘어난다.

Stop hook의 grep은 맥락을 모른다. 코드 안의 잔존 마커든 WORKLOG 문장 안의 확인 메모든 동일하게 반응한다. 검증 문구를 쓸 때는 훅이 grep하는 키워드를 직접 넣지 않는 게 낫다.
