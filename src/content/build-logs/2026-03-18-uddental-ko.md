---
title: "타이포 계층 역전 버그, Claude가 2분·14 tool calls로 잡다"
project: "uddental"
date: 2026-03-18
lang: ko
tags: [claude-code, debugging, typography, nextjs]
description: "uddental 홈페이지 3개 섹션에서 카테고리명이 h2로, 설명 문구가 p로 잘못 배치된 계층 역전 버그. Claude Code가 Read 5회·Edit 3회로 2분 안에 진단하고 수정했다."
---

"진료과목"이 크고, "어떤 치료가 필요하세요?"가 작게 보인다.

사용자 리포트는 이게 전부였다. 어느 파일, 어느 컴포넌트인지 단서가 없었다. "시각적으로 크기가 반전되어 보인다"는 것만.

**TL;DR** 홈페이지 3개 섹션에서만 발생하는 계층 역전 버그였다. FAQ와 서브페이지는 올바른 패턴을 쓰고 있었는데, 홈 섹션들만 카테고리명을 `h2`로, 설명 문구를 `p`로 배치해 시각 계층이 뒤집혔다. Claude가 14 tool calls, 2분 만에 전수조사·수정·빌드 검증까지 마쳤다.

## 어디서 터진지 모를 때 프롬프트를 쓰는 방법

Claude에게 넘긴 프롬프트는 이렇게 생겼다.

```
[Wed 2026-03-18 09:42 GMT+9] In /Users/jidong/uddental/implementations/claude,
inspect the deployed/UI heading hierarchy issue the user reported.

Problem statement:
On pages, combinations like:
- small heading: "진료과목"
- larger subheading: "어떤 치료가 필요하세요?"
appear with the visual sizes reversed / hierarchy wrong.

Please do the following:
1) Inspect all relevant pages/components in this implementation
   for section eyebrow/title/subtitle typography hierarchy issues.
2) Find every place where the visual order is inverted.
3) Fix all instances to match the correct pattern.
```

핵심은 두 가지다. 문제 증상을 구체적으로 묘사했고, 전수조사를 지시했다. "어디가 문제인지 알아서 찾아라"라고 맡긴 거다. 특정 파일을 지목하지 않았다.

## Claude가 버그를 찾는 방식

Claude는 `app/page.tsx`를 먼저 열었다. Read 도구 5회. 홈페이지, 서브페이지들, 컴포넌트 파일들을 차례로 훑었다.

진단 결과는 명확했다. 홈페이지에 세 개의 섹션이 있었다: 진료 여정, 진료과목, 시설 안내. 세 섹션 모두 같은 패턴이었다.

```tsx
// Before — 잘못된 계층
<h2 className="text-2xl font-bold">진료과목</h2>
<p className="text-sm text-gray-500">어떤 치료가 필요하세요?</p>
```

카테고리명이 `h2`, 설명 문구가 `p`. 시각적으로 카테고리가 더 크게 보인다. FAQ 섹션과 모든 서브페이지는 이미 반대 패턴을 쓰고 있었다.

```tsx
// After — 올바른 계층
<p className="text-sm font-semibold text-mint-600 uppercase tracking-wider">
  진료과목
</p>
<h2 className="text-3xl font-bold text-gray-900">
  어떤 치료가 필요하세요?
</h2>
```

카테고리명은 eyebrow label(작고 강조 색상), 설명 문구는 큰 `h2`. 이게 올바른 계층이다.

왜 홈 섹션만 틀렸을까. 홈페이지와 서브페이지를 다른 시점에 작성했을 가능성이 높다. 서브페이지 디자인이 나중에 확정됐고, 홈은 업데이트가 빠졌을 것이다. 실무에서 자주 보이는 패턴이다.

## 수정은 Edit 3회

진단이 끝나자 Claude는 `app/page.tsx`를 Edit 도구로 3회 수정했다. 세 섹션 각각 한 번씩.

빌드는 Bash로 바로 돌렸다. `next build` 성공. 에러 없음. 커밋까지 자동으로 마쳤다.

총 도구 사용: Read 5, Bash 4, Edit 3, Agent 1. 합계 14회. 세션 시간 2분.

변경된 파일은 `app/page.tsx` 하나. 6줄 삭제, 6줄 추가.

## 이 세션에서 배운 것

탐색 범위를 프롬프트에 명시하는 게 중요하다. "이 파일 고쳐줘"가 아니라 "전체 구현에서 이 패턴의 오용을 모두 찾아줘"라고 지시하면, Claude가 스스로 Read를 돌리면서 전수조사를 한다.

이번 케이스처럼 어디가 문제인지 불분명할 때 탐색을 좁히는 것보다 넓게 탐색을 지시하는 게 맞다. FAQ와 서브페이지가 이미 올바른 패턴을 쓰고 있다는 사실도 Claude가 직접 확인했다. 비교 기준을 따로 알려주지 않았는데도 코드베이스 안에서 스스로 찾아냈다.

> 어디가 잘못됐는지 모를 때일수록 탐색 범위를 좁히지 않는다.
