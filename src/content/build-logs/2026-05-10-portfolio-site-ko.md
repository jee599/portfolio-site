---
title: "커피챗 사이트 5개 시안 병렬 리디자인: Codex가 SRI 해시 버그를 잡은 날"
project: "portfolio-site"
date: 2026-05-10
lang: ko
tags: [claude-code, frontend, design, multi-agent, codex, bug-fix]
description: "게임 업계 멘토링 플랫폼 커피챗 사이트를 5개 디자인 시안으로 병렬 리디자인. Codex 교차검증이 SRI 해시 불일치 버그를 발견한 과정. 85시간, 79 tool calls."
---

"다 별로야. 하나도 전문성이 없어보여." 5개 시안이 나온 직후 돌아온 피드백이다.

**TL;DR** 커피챗 사이트 리디자인을 `frontend-implementer` 5개를 병렬 디스패치해서 처리했다. Codex 교차검증이 SRI 해시 불일치 버그를 발견해서 production 배포 전에 수정했다. 총 79 tool calls.

## 사이트 분석부터 시작한 이유

`coffeechat.it.kr` URL을 받자마자 `WebFetch`로 사이트를 분석했다. 단순 커피챗 매칭 플랫폼이 아니라 **게임 업계 현직자 멘토링 서비스**였다 — 게임회사 재직자와 1:1 커피챗, 이력서 리뷰, 모의면접이 핵심이다.

이 컨텍스트가 없으면 generic 디자인 템플릿이 나온다. 분석 완료 후 `plan.md`를 `general-purpose`에 위임해서 먼저 만들었고, 5개 변주를 `frontend-implementer` 서브에이전트에 병렬 디스패치했다.

| 시안 | 무드 | 핵심 요소 |
|---|---|---|
| V1 Editorial Magazine | 한국 인디 잡지 | Instrument Serif, 크림 #f4eee4 |
| V2 Soft Brutalist | 굵은 보더, 라임·핑크 컬러 블록 | 강한 타이포 대비 |
| V3 Motion Dark | 애니메이션 중심 | floating gradient blobs |
| V4 Minimal Pro | 인프런 톤 | 화이트 베이스, 정보 밀도 |
| V5 Korean Editorial | 한국형 에디토리얼 | 세로 타이포 강조 |

## "다 별로야"가 돌아왔을 때

5개가 나왔을 때 피드백은 "다 별로야. 인프런이나 다른 교육기관 봐봐"였다.

문제는 명확했다. 디자인 트렌드 변주만 했지 **전문 교육 서비스의 신뢰감**이 없었다. V1~V5 전부 일반적인 시각적 매력을 노렸고, 인프런·클래스101·패스트캠퍼스가 주는 신뢰 무게감이 없었다. 교육 플랫폼 특유의 신호 — 수강생 수, 수료율, 현직자 프로필 카드 — 를 UI에 녹이지 않았다.

재분류하고 방향을 틀었다. 두 번째 라운드는 인프런 사이트 분석을 베이스로 잡았다.

## Codex가 버그를 잡아냈다

구현 후 `code-verifier`를 돌리고, 이어서 Codex 교차검증을 걸었다. Codex가 찾아낸 건 예상 밖의 버그였다.

V2, V3, V4, V5가 `react.production.min.js`를 로드하면서 SRI 해시는 `.development.js` 파일 기준으로 설정되어 있었다.

```html
<!-- 잘못된 예 -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"
  integrity="sha384-[development.js 해시]"
  crossorigin="anonymous"></script>
```

브라우저가 해시 검증에서 차단한다. 디자인 리뷰나 lint로는 잡히지 않는다 — Codex가 `diff.patch`를 읽고 크로스체크하면서 발견했다. 4개 파일을 수정해서 올바른 production 해시로 교체했다. 그대로 배포했으면 리액트가 아예 로드되지 않았을 거다.

## 병렬 디스패치가 빠른 조건

5개 시안을 순차로 만들면 5배 걸린다. 병렬 디스패치는 가장 느린 에이전트 하나만큼만 걸린다. 단, 조건이 있다.

`plan.md`가 구체적이어야 한다. 각 에이전트가 어떤 파일을 만들고 어떤 스타일을 따르는지 명확히 적혀 있어야 독립 실행된다. "V3은 motion dark, floating gradient blobs, 배경 `#0a0a0f`, 애니메이션 `@keyframes drift`로" 수준이어야 에이전트가 혼자 결정한다. "멋지게 만들어"는 안 된다.

이번 세션에서 `plan.md`를 먼저 별도 에이전트에 위임한 게 맞는 선택이었다.

## 도구 사용 통계 (세션 2)

- `Agent` 28회 — 서브에이전트 디스패치 (5개 시안 병렬 + verifier + codex)
- `Bash` 26회 — diff 생성, 파일 이동, 서버 확인
- `TaskUpdate` / `TaskCreate` 13회 — 진행 상태 추적
- `ToolSearch` 5회 — 스키마 로드
- `WebFetch` 5회 — 사이트 분석

세션 1은 치과 광고 크론 작업이었다. `dentalad` 리서치 베이스 5개 파일 업데이트 + HTML 리포트 생성을 `claude-opus-4-7`이 7분, 23 tool calls로 처리했다. 작은 작업은 서브에이전트 없이 메인이 직접 처리했다.

## 최종 결과물

비교 캔버스를 `/Users/jidong/coffee-chat-redesign/` 아래에 HTML로 만들었다. 5개 시안 카드에서 "보기 →" 클릭하면 각 시안이 새 탭으로 열린다. 사용자가 브라우저에서 직접 비교해서 고를 수 있는 구조다.

두 번째 라운드("전문적이고 트렌디하게")는 다음 세션에서 이어간다.
