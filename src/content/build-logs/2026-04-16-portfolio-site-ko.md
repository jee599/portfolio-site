---
title: "Claude Code 16 tool calls, 코드 변경 0줄: 진단만 하고 끝낸 세션"
project: "portfolio-site"
date: 2026-04-16
lang: ko
tags: [claude-code, debugging, diagnosis, spoonai, mobile]
description: "1시간 39분, 16번의 tool call, 수정 파일 0개. Claude Code로 spoonai 디자인 버그 원인을 추적한 진단 전용 세션. 코드 안 짜고 근본 원인만 찾는 게 더 빠를 때가 있다."
---

1시간 39분 세션, 16번의 tool call, 수정된 파일 0개.

**TL;DR** 코드를 안 짜고 근본 원인만 찾는 세션이 때로는 가장 효율적이다. spoonai 디자인 문제 진단에서 Claude Code는 라이브 사이트 + 코드 동시 분석으로 실제 버그 위치를 정확히 짚었다.

## "디자인 수정해줘"에서 근본 원인 추적까지

프롬프트는 단순했다.

```
디자인 전체적으로 수정해주고 모바일에서 제대로 안 보여
```

Claude는 바로 코드 수정을 시작하지 않았다. 대신 라이브 사이트와 코드베이스를 동시에 확인했다. `WebFetch`로 프로덕션 URL을 열고, `Read`로 아카이브 페이지 컴포넌트를 읽고, `Grep`으로 `ArchiveEntry` 타입 정의를 추적했다.

Bash 6회, Read 6회, WebFetch 2회, Grep 1회. 전부 조사에만 썼다.

결과로 나온 진단은 명확했다.

## 아카이브에 사진이 없었던 이유

"사진 아카이브에서 제대로 안 나오는 거" — 버그처럼 들리지만 실제로는 버그가 아니었다.

`lib/types.ts`의 `ArchiveEntry` 타입에 `image` 필드 자체가 없었다. `getArchiveEntries()`는 포스트에서 `date`, `title`, `summary`만 뽑고 `meta.image`는 버렸다. `ArchiveList.tsx`는 텍스트 카드만 렌더링하도록 만들어져 있었다.

즉 "사진이 안 나오는" 게 아니라 처음부터 이미지를 렌더링하지 않는 구조였다. 이 차이는 수정 방향을 완전히 바꾼다. 버그 픽스가 아니라 기능 추가다.

```ts
// 현재 ArchiveEntry — image 필드 없음
type ArchiveEntry = {
  date: string;
  title: string;
  summary: string;
  // image?: string  ← 없음
}
```

코드를 먼저 수정했다면 CSS나 레이아웃을 건드리며 엉뚱한 방향으로 삽질했을 가능성이 높다.

## 라이브 사이트 + 코드 동시 분석

이 세션에서 Claude Code가 유용했던 패턴은 `WebFetch`와 코드 분석을 교차한 것이다.

라이브 사이트에서 "뭐가 안 보이는지"를 확인하고, 그 다음 코드에서 왜 안 보이는지를 역추적했다. 단순히 코드만 읽었다면 `ArchiveEntry`에 이미지 필드가 없다는 걸 찾을 수도 있었지만, 라이브 사이트를 먼저 보면 실제 증상 → 코드 원인으로 흐름이 자연스러워진다.

모바일 이슈는 이 세션에서 완전히 확인되지 않았다. `WebFetch`는 HTML을 마크다운으로 변환할 뿐이라 실제 렌더링 레이아웃은 확인이 안 된다. 실제 모바일 버그 수정은 다음 세션으로 넘어갔다.

## 0줄 커밋, 그래도 시간 낭비가 아닌 이유

수정된 파일이 없으면 "아무것도 안 했다"처럼 보인다. 하지만 이 세션의 결과물은 구체적인 수정 목록이었다.

1. `ArchiveEntry` 타입에 `image` 추가
2. `getArchiveEntries()`에서 `meta.image` 포함
3. `ArchiveList.tsx`에 썸네일 렌더링 추가
4. 모바일 레이아웃 — 실제 디바이스 테스트 필요

진단 없이 코드를 바꾸기 시작했다면 아마 CSS를 건드리거나 레이아웃을 수정했을 것이다. 근본 원인이 타입 정의에 있었는데.

> 어디를 수정해야 하는지 모르는 상태에서 코드를 건드리면 작업량만 늘어난다.

Claude Code는 이 조사 과정을 1시간 39분 안에 끝냈다. 혼자 코드 읽고 라이브 사이트 열고 타입 추적하면 더 걸렸을 일이다.
