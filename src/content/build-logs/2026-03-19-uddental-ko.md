---
title: "프로덕션에 개발 버튼이 살아있었다: uddental UI 버그 3개, Claude Code로 5분 만에"
project: "uddental"
date: 2026-03-19
lang: ko
tags: [claude-code, debugging, ui, astro]
description: "치과 사이트 배포 후 🎨 개발 버튼이 프로덕션에 그대로 노출됐다. heading 계층 역전, 무한 바운스 애니메이션까지. Claude Code 3세션 41번 도구 호출로 전부 정리했다."
---

배포 후 사이트를 열어보니 오른쪽 하단에 🎨 버튼이 떠 있었다.

`HeroBgPicker` — 히어로 섹션 배경색을 개발 중에 빠르게 바꿔가며 확인하려고 만든 컴포넌트다. `z-60`으로 올려놔서 모든 콘텐츠 위에 떠 있었다. 클릭하면 색상 팔레트가 펼쳐진다. 개발 서버에서는 편했는데, 프로덕션에 그대로 올라가 있었다.

**TL;DR** 3세션, 5분, 41번의 도구 호출로 heading 계층 역전 버그, 프로덕션 개발 툴 노출, 무한 바운스 애니메이션을 한꺼번에 잡았다.

## 먼저 제목 계층이 뒤집혀 있었다

첫 번째로 잡은 건 시각적 heading 계층 문제였다. 홈페이지 섹션들을 보면 이런 패턴이 반복됐다:

```
진료과목        ← h2 (크게 표시)
어떤 치료가 필요하세요?  ← p (작게 표시)
```

눈으로 봤을 때 카테고리 이름이 설명 문구보다 크게 보이는 구조다. 반대여야 했다.

프롬프트는 이렇게 썼다:

> "inspect the deployed/UI heading hierarchy issue the user reported. Find every place where the visual sizes reversed / hierarchy wrong."

Claude가 파일을 읽고 5초 만에 문제를 집어냈다. FAQ 섹션과 서브페이지들은 이미 올바른 패턴으로 되어 있었는데, 홈페이지의 3개 섹션(진료 여정, 진료과목, 시설 안내)만 반대로 구현되어 있었다.

올바른 패턴은 이렇다:

```
진료과목  ← eyebrow label (text-sm, font-semibold, text-mint, uppercase)
어떤 치료가 필요하세요?  ← h2 (text-3xl, font-bold)
```

`app/page.tsx` 하나에서 6줄을 교체했다. Read 5번, Edit 3번, Bash 4번(빌드 확인 + 커밋). 세션 시간 2분.

## 프로덕션에서 개발 버튼 제거하기

세 번째 세션에서 배포 사이트를 점검했다. 프롬프트:

> "inspect the current UI/layout issues visible on the deployed site, especially mobile. Find and remove/fix all weird empty space at the top, broken-looking layout gaps, and awkward UI artifacts."

Claude가 코드를 읽으면서 찾아낸 문제는 세 가지였다.

`HeroBgPicker.tsx`에 개발용 UI가 그대로 살아있었다. 🎨 버튼 + 색상 팔레트 패널, `z-60`으로 화면 위에 고정. 배포 환경 분기 처리를 안 해놨다. 해결 방법은 간단했다. 개발 UI를 제거하고 배경색은 navy로 하드코딩했다. 모바일 패딩은 `py-6`에서 `py-10`으로 올렸다.

두 번째는 플로팅 CTA 버튼의 애니메이션. `globals.css`를 보니 `floatingPop`과 `floatingGlow`가 `infinite`로 설정되어 있었다. 버튼이 멈추지 않고 계속 튀어다녔다. `animation-iteration-count: 1`로 바꿔서 처음 한 번만 팝업되게 고쳤다.

세 번째는 `page.tsx`의 섹션 사이 이중 빈 줄. 렌더링에는 영향 없지만 코드가 지저분했다. 빈 줄 정리.

파일 3개 수정, 세션 시간 3분, 도구 호출 27번(Read 17, Edit 5, Bash 3, Agent 1, Write 1).

## 프롬프트 패턴이 달랐다

두 세션의 프롬프트를 비교해보면 방식이 조금 다르다.

세션 2는 **구체적 문제를 지정**했다. "heading hierarchy issue", "visual sizes reversed"라고 콕 집었다. Claude가 찾을 대상이 명확하니 Read 5번으로 문제를 바로 찾아냈다.

세션 3은 **증상만 설명**했다. "weird empty space", "broken-looking layout gaps", "awkward UI artifacts". 어디서 뭐가 문제인지 모른다는 뜻이다. 그래서 Read 17번으로 파일 전체를 훑었다. 시간이 더 걸렸지만 모르는 버그를 찾는 데 효과적이었다.

알고 있는 버그는 좁게 찍고, 모르는 버그는 넓게 푼다. 당연한 말이지만 프롬프트 레벨에서 실제로 구분해서 쓰게 된 게 이번 세션이었다.

## 수치로 보면

| 세션 | 시간 | tool calls | 변경 파일 |
|------|------|-----------|---------|
| 세션 1 | 0분 | 1 | 0 |
| 세션 2 | 2분 | 13 | 1 |
| 세션 3 | 3분 | 27 | 3 |
| 합계 | 5분 | 41 | 4 |

도구 사용 분포: Read 22회, Bash 8회, Edit 8회, Agent 2회, Write 1회. Read가 절반 이상이다. Claude가 고치기 전에 코드를 충분히 읽는다는 게 이 숫자에 나온다. 읽기 없이 수정하면 컨텍스트 부족으로 틀린 수정이 나온다.

> 개발 툴을 프로덕션에서 숨기는 가장 좋은 방법은, 처음부터 배포 환경 분기를 넣는 것이다. 아니면 삭제하는 것.
