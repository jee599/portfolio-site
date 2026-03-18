---
title: "Claude Code로 uddental UI 버그 3개 잡기 — 계층 반전, 개발툴 유출, 무한 애니메이션"
project: "uddental"
date: 2026-03-18
lang: ko
tags: [claude-code, ui, debugging, astro]
description: "5분, 41번의 tool call. Claude Opus가 uddental 홈페이지에서 heading 계층 반전, 프로덕션에 남은 개발툴, 무한 bounce 애니메이션 3개를 순서대로 잡았다."
---

개발 중에 만든 🎨 색상 선택 버튼이 프로덕션 사이트에 떠 있었다. `z-60`으로 float된 채.

**TL;DR** — 3개 세션, 5분, 41번의 tool call. Claude Opus가 uddental 홈페이지의 UI 버그 3개를 차례로 잡았다. heading 계층 반전, 개발툴 노출, 무한 bounce 애니메이션.


## heading이 뒤집혀 있었다

세션 2의 프롬프트는 이랬다.

```
On pages, combinations like:
- small heading: "진료과목"
- larger subheading: "어떤 치료가 필요하세요?"
appear with the visual sizes reversed / hierarchy wrong.
```

Claude는 먼저 `Read` 도구를 5번 돌렸다. `app/page.tsx`의 홈페이지 구조, 서브페이지들, FAQ 섹션을 순서대로 읽으면서 패턴을 파악한다.

결론은 명확했다. FAQ 섹션과 모든 서브페이지에서는 올바른 패턴을 쓰고 있었다. 카테고리명은 작은 eyebrow label, 설명 문구는 큰 h2. 그런데 홈페이지 3개 섹션(진료 여정, 진료과목, 시설 안내)만 반대였다. 카테고리명이 `h2`(크고)고, 설명이 `p`(작고).

파일을 읽으면서 기준이 되는 패턴을 찾고, 그 패턴과 어긋나는 곳을 특정하는 방식이었다. `Edit` 3번으로 `app/page.tsx` 1개 파일만 수정하고 끝냈다.

도구 사용: `Read(5)` `Edit(3)` `Bash(4)` `Agent(1)` — 총 13번.


## 개발툴이 프로덕션에 살아 있었다

세션 3 프롬프트:

```
Find and remove/fix all weird empty space at the top, broken-looking layout gaps,
and awkward UI artifacts. This includes unexpected blank areas, mispositioned overlays,
inconsistent spacing, and any obviously wrong mobile layout behavior.
```

의도적으로 구체적인 버그 이름을 말하지 않고 "이상한 것 다 찾아서 고쳐라"로 던졌다.

Claude는 `Read`를 17번 돌렸다. `app/components/` 디렉토리의 파일들, `globals.css`, `app/page.tsx`, 각 서브페이지까지 순서대로 읽는다. 코드베이스 전체를 훑은 뒤 세 가지를 짚었다.

첫째, `HeroBgPicker.tsx`. 개발 중에 히어로 배경색을 테스트하려고 만든 🎨 버튼과 색상 패널이 `z-60`으로 float된 채 남아 있었다. 프로덕션 배포 후에도 사이트 오른쪽 상단에 떠 있는 상태. 개발툴이 유출된 가장 클래식한 케이스다.

둘째, `globals.css`의 `floatingPop`과 `floatingGlow` 애니메이션. 하단 플로팅 CTA 버튼에 붙어 있었는데, 둘 다 `infinite`로 돌아가고 있었다. 사이트를 열면 계속 튀어오르고 빛나는 버튼.

셋째, `page.tsx`에 빈 줄이 이중으로 들어가 있는 곳들. 섹션 사이에 불필요한 공백을 만들고 있었다.

수정은 간단했다. `HeroBgPicker.tsx`를 서버 컴포넌트로 교체해서 dev UI를 제거하고 배경색만 고정. `globals.css`에서 `infinite`를 `1`로 변경. `page.tsx`에서 이중 빈 줄 제거.

이 세션에서 `Write(1)`이 눈에 띈다. `HeroBgPicker.tsx`를 고치는 것보다 단순한 서버 컴포넌트로 통째로 교체하는 게 낫다고 판단해서 파일을 새로 썼다.

도구 사용: `Read(17)` `Edit(5)` `Bash(3)` `Agent(1)` `Write(1)` — 총 27번.


## Opus가 과하다는 느낌이 들었다가

세 세션 모두 `claude-opus-4-6`을 썼다. 솔직히 UI 버그 수정에 Opus가 필요한가 싶었다.

근데 세션 3 패턴을 보면 납득이 된다. `Read(17)`. 명시적인 버그 리포트 없이 "이상한 거 다 찾아라"는 지시를 받고, 17개 파일을 읽어서 스스로 문제를 발굴했다. 파일을 충분히 읽지 않았으면 `HeroBgPicker`의 dev 코드가 뭔지, `floatingPop`이 의도된 애니메이션인지 판단하기 어렵다.

Sonnet이었으면 파일을 덜 읽고 추측에 기댔을 가능성이 있다.

전체 통계: 3 세션, 총 tool call 41번(`Read 22` `Bash 8` `Edit 8` `Agent 2` `Write 1`), 수정 파일 3개, 소요 시간 약 5분.

> 문제를 구체적으로 말하지 않아도, 코드를 충분히 읽으면 스스로 찾는다.
