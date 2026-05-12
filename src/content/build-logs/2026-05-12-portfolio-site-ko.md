---
title: "daymoon 사진 포트폴리오 Apple 리디자인: 19 세션, 436 tool calls, 하루 완성"
project: "portfolio-site"
date: 2026-05-12
lang: ko
tags: [claude-code, redesign, css, animation, frontend]
description: "Claude Code 19 세션, 436 tool calls — git 없던 사진 포트폴리오를 Apple 스타일로 하루 만에 전환했다. 65KB CSS 재작성, 필기체 핸드라이팅 인트로, 3열 갤러리, Instagram DM 카드 구현까지."
---

322개 파일이 git 추적 없이 배포되고 있었다. 19 세션, 436 tool calls 뒤에는 Apple 느낌의 사진 포트폴리오 사이트가 완성되어 있었다.

**TL;DR** `daymoon-pic-site`를 하루 만에 전면 리디자인했다. git setup부터 65KB CSS 재작성, Sacramento 필기체 핸드라이팅 인트로, 갤러리 3열 그리드, Instagram DM 카드까지. Bash 202회, Read 113회, Edit 70회.

## git도 없는 사이트에서 시작

첫 요청은 단순했다. "정적 사이트 git 설정해줘." 디렉토리를 열어보니 `.vercel/` 폴더만 있고 `.git`이 없었다. 사진 포트폴리오 사이트가 322개 파일을 버전 추적 없이 운영 중이었다.

세션 4에서 처리한 순서:

1. `.gitignore` 생성 (`.vercel/`, `node_modules`, 크리덴셜 제외)
2. `WORKLOG.md` 작성 (이후 모든 변경 기록의 기준점)
3. `git init` → 첫 커밋 `5cb7701` → GitHub `jee599/daymoon-pic-site` private repo 생성 → push

여기서부터 모든 변경이 추적된다. `WORKLOG.md`는 세션 간 핸드오프의 핵심이 됐다. 다음 세션이 `git diff`와 WORKLOG를 읽어 상태를 파악하고 좁은 범위만 작업한다.

## 65KB CSS, !important 범벅을 전면 재작성한 이유

"Apple 느낌으로 리디자인"을 요청받고 `styles.css`를 열었다. 65KB에 수백 개의 `!important` 오버라이드였다. 기능이 추가될 때마다 기존 규칙 위에 덮어쓴 흔적이 쌓인 것이다.

부분 수정은 의미 없다는 판단이 나왔다. Apple 미니멀리즘으로 가려면 전면 재작성이 빠르다. 재작성 순서를 잡았다: CSS 토큰 → 리셋 → 타이포그래피 → 레이아웃 → 헤더 → 드로어 → 리빌 → 섹션별 → responsive. `!important`는 전면 제거했다. Apple segmented control 스타일의 `.apple-filter`로 갤러리 탭도 교체했다.

결과: 65KB → 1,373 lines. 구조가 명확해졌고 Google Fonts도 이 시점에 제거해 시스템 폰트로 전환했다.

이후 세션에서 Codex 교차검증이 한 가지를 추가로 지적했다. 헤더의 `.search-link` — 돋보기 아이콘인데 실제로는 갤러리 페이지로 이동하는 가짜 검색 어포던스였다. 사용자를 오도하는 UI 요소라서 4개 HTML 파일과 CSS에서 전부 제거했다.

## Vercel이 배포를 거부한 이유

리디자인 커밋 push 직후 Vercel에서 오류가 왔다:

```
Git author jidong@jidongui-iMac.local must have access
to the team jee599's projects on Vercel to create deployments.
```

커밋 author가 `jidong@jidongui-iMac.local` — 로컬 hostname이 박혀 있어서 Vercel이 jee599 계정과 매핑을 못 한 것이다. 코드는 건드리지 않고 author만 교체했다:

```bash
git config user.name "jee599"
git config user.email "31664958+jee599@users.noreply.github.com"
git commit --allow-empty -m "chore: fix git author for Vercel deployment"
git push origin main
```

GitHub user_id 기반 noreply 주소가 Vercel의 계정 매핑 기준이다. 빈 커밋 하나로 배포가 풀렸다.

## 인트로 애니메이션이 4 세션에 걸린 이유

인트로가 가장 많은 세션을 소비했다. 초기 요청은 "감성적인 첫 로딩 경험"이었는데 방향이 계속 진화했다.

**v1** (세션 8): 감성 문구가 나타났다 사라지고 → daymoon 워드마크 → 사진 stagger reveal.

**v2** (세션 17): "문구 빼고 필기체 로고 손글씨 쓰는 느낌으로, 로고 뒤 점 제거." CSS `mask-position` 애니메이션으로 손글씨 효과를 구현했다. 글자가 왼쪽에서 오른쪽으로 reveal되는 방식이다:

```css
.intro-mark-ink {
  -webkit-mask-image: linear-gradient(to right, black 50%, transparent 50%);
  -webkit-mask-size: 200%;
  -webkit-mask-position: 100%;
  animation: handwriting-reveal 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes handwriting-reveal {
  to { -webkit-mask-position: 0%; }
}
```

**v3** (세션 18): JS 버그 발견. `script.js`가 여전히 2-stage 스케줄을 참조하고 있었다. HTML에서 인트로 stage가 1개로 줄었는데 `stages[1]` 참조가 no-op이 됐고, 핸드라이팅 애니메이션이 2250ms에 잘렸다. 애니메이션은 300ms 오프셋 + 1.8s = 2100ms에 완료되는데 150ms 버퍼만 남은 것이다.

스케줄을 다시 잡았다:

```js
// 200ms: .is-in 추가 (핸드라이팅 시작)
// 2500ms: .is-out 추가 (워드마크 fade-out)
// 3400ms: intro-done (reveal 시작)
```

**v4** (세션 19): 검증 통과 후 최종 커밋 캐시버스트 `dm-script-20260512-4`.

## Sacramento 폰트, 갤러리·Contact 개선

"더 감성적인 폰트, 필기체 로고"를 요청받고 Google Fonts에서 Sacramento를 골랐다. 모노라인 서체라서 lowercase `daymoon`과 어울리고 CSS 손글씨 애니메이션에도 적합하다. `assets/daymoon-wordmark.svg`를 생성하고 헤더와 인트로 양쪽에 Sacramento 기반 워드마크를 썼다.

갤러리는 "3줄로" 한 마디였는데, CSS에 `.portfolio`, `.split-grid`, `.only-grid` 세 클래스가 섞여 있어서 각각에 `grid-template-columns: repeat(3, 1fr)` 적용이 필요했다. 모바일은 기존 레이아웃을 유지했다.

Contact 페이지는 긴 예약 폼에서 Instagram DM 카드로 단순화했다. `assets/logo-instagram.svg`를 활용해 탭 한 번에 `https://ig.me/m/daymoon_pic`으로 연결되게 했다. 기존 폼 관련 JS/CSS도 함께 정리했다.

Product 페이지는 "그냥 메뉴만 넣어" 요청에 맞게 설명 문구를 제거하고 촬영 메뉴(졸업스냅, 커플스냅, 우정/가족, 웨딩스냅)만 남겼다.

## 도구 사용 패턴

436 tool calls 분포:

| 도구 | 횟수 |
|------|------|
| Bash | 202 |
| Read | 113 |
| Edit | 70 |
| Grep | 31 |
| Write | 8 |
| Agent / TodoWrite / ToolSearch | 11 |

Bash가 절반 가까이다. 검증 (debug 잔존 코드 grep, `tidy -e`, `git diff --stat`), state 업데이트, push가 세션마다 반복됐다. Read와 Edit 비율이 비슷한 건 파일 전체를 읽고 필요한 부분만 수정하는 방식을 유지했기 때문이다.

## 세션을 쪼개는 이유

19 세션이 하루에 집중된 건 context 관리 때문이다. 인트로 애니메이션 하나만 해도 4 세션에 걸쳤다. 각 세션이 끝날 때마다 `WORKLOG.md`에 변경 내역을 남기고, 다음 세션이 `git diff`와 WORKLOG를 읽어 상태를 파악한 뒤 좁은 범위만 작업했다.

한 세션에 모든 걸 넣으면 context가 쌓여 후반 정확도가 떨어진다. 세션 분리가 각 단계의 품질을 올린다.

> commit-push 사이클이 세션 간 핸드오프를 안정적으로 만든다. `git diff`가 현재 상태 파악의 기준점이다.
