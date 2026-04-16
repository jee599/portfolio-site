---
title: "병렬 에이전트 10개로 디자인 변형 만들기: spoonai 리디자인 브레인스토밍"
project: "portfolio-site"
date: 2026-04-16
lang: ko
tags: [claude-code, brainstorming, parallel-agents, ui-design, spoonai]
description: "Claude Code의 brainstorming 스킬과 병렬 에이전트 10개를 동시 실행해 spoonai 디자인 변형을 1시간 만에 생성한 과정. Visual Companion 로컬 서버로 실시간 비교까지."
---

2번의 세션, 139번의 tool call, 10개의 디자인 변형. 코드를 한 줄도 안 건드리고 디자인 방향을 결정하는 데 대부분의 시간을 썼다.

**TL;DR** brainstorming 스킬 + 병렬 에이전트 패턴으로 디자인 브레인스토밍을 자동화했다. 10개 HTML 목업을 병렬로 생성하고, 로컬 서버에서 실시간 비교해 방향을 결정했다.

## 첫 번째 세션: 문제 파악

세션 1은 총 61 tool calls, 주로 `Read(12)` + `Bash(9)` + `Edit(16)`으로 구성됐다. 프롬프트는 단순했다.

```
디자인 전체적으로 수정해주고 모바일에서 제대로 안 보여
```

Claude는 바로 작업에 뛰어들지 않고 먼저 진단했다. `lib/content.ts`와 `lib/types.ts`를 읽어보니 아카이브 이미지 버그의 원인이 나왔다. `ArchiveEntry` 타입에 `image` 필드 자체가 없었고, `getArchiveEntries()`는 `meta.image`를 아예 버리고 있었다. "사진이 안 보이는" 게 아니라 렌더링 코드가 없었던 것이다.

이 진단 없이 바로 "디자인 고쳐줘"로 뛰어들었다면 이미지 버그는 놓쳤을 거다.

`lib/types.ts` 수정 → `lib/content.ts` 수정 → `ArchiveList.tsx` 리디자인 → `globals.css` warm neutrals 토큰 추가까지 순서대로 진행했다. 디자인 방향은 "Editorial Tech Magazine"으로 합의했고, warm gray 팔레트 + Tailwind `slate`/`zinc` 계열로 교체했다.

## 두 번째 세션: brainstorming 스킬 + Visual Companion

세션 2는 78 tool calls. 흥미로운 건 `TaskCreate(11)` + `Agent(10)`의 비중이다. 이게 핵심이었다.

프롬프트:

```
spoonai 디자인 리팩토링해 모바일 웹 둘 다
```

Claude가 `brainstorming` 스킬을 로드하고 **Visual Companion**을 제안했다. 로컬 서버(`http://localhost:54423`)를 띄우고 목업을 브라우저에서 실시간으로 보여주는 방식이다. 처음에는 3가지 무드 옵션을 HTML로 렌더링해 비교했다.

문제는 첫 두 라운드 옵션이 "다 별로야"였다는 거다.

```
다 별로야 디자인 스킬 찾아
```

Claude가 `ui-ux-pro-max` 스킬을 로드했다. 50개 이상의 스타일, 161개 색상 팔레트가 담긴 스킬이다. 여기서 방향이 바뀌었다.

```
다른 디자인 아예 다른걸로 10개 정도 찾아서 작업해 사진 보이게 기사마다
```

## 병렬 에이전트 10개 동시 실행

이게 이번 세션의 핵심이다. Claude는 하나씩 만들지 않고 에이전트를 병렬로 뿌렸다.

각 에이전트는 독립된 디자인 컨셉을 맡았다. Bento grid(소프트 `#f5f5f7`, 애플 스타일), Masonry pinterest(warm cream `#faf7ee` + 오렌지 악센트), Neo-brutalism(hot pink `#ff5470` + 전기 노랑), Swiss tabular(pure white + ink `#0a0a0a`), Japanese kinfolk(paper `#f7f4ee`), Netflix shelf cinema(near-black `#0b0b10`), Y2K chrome retro, Dashboard ticker(phosphor green `#22ff88`).

각 에이전트가 `.superpowers/brainstorm/` 하위에 HTML 파일로 결과물을 생성했다. 로컬 서버에서 네비게이션 버튼 하나로 순서대로 볼 수 있었다.

병렬 실행이라 8개 목업 생성에 걸린 실제 시간은 순차 처리 대비 크게 단축됐다. `TaskCreate(11)`이 이 과정을 보여준다.

## 삽질: "어떻게 다른 디자인 봐?"

병렬로 생성된 HTML 파일들은 각자 독립된 파일이었다. 브라우저에서 파일 탐색기로 열어야 했다.

```
어떻게 다른 디자인봐?
버튼 하나 만들어서 다음 디자인으로가게 해줘 상단에 테스트용 임시버튼
```

Claude가 `/tmp/__nav-inject.html`을 만들어 로컬 서버에 주입했다. 상단 고정 네비게이션 버튼으로 10개 목업을 순서대로 탐색하는 방식이다. 간단한 해결이었지만 이걸 직접 생각하고 구현하려면 귀찮았을 작업이다.

## 도구 사용 통계

전체 139 tool calls 중 실제 코드 수정(`Edit`)은 16번, 11.5%에 불과하다. 나머지는 이해, 계획, 목업 생성에 썼다. `TaskUpdate(27)` + `TaskCreate(17)` 합쳐 44번, 전체의 32%가 에이전트 오케스트레이션이었다.

| 도구 | 횟수 | 용도 |
|------|------|------|
| TaskUpdate | 27 | 진행 상태 추적 |
| Bash | 24 | 로컬 서버, git, 파일 확인 |
| Read | 24 | 코드 이해 및 타입 파악 |
| TaskCreate | 17 | 병렬 에이전트 디스패치 |
| Edit | 16 | 실제 코드 수정 |
| Agent | 10 | 독립 디자인 에이전트 |
| Write | 8 | HTML 목업 생성 |
| ToolSearch | 5 | 스킬 탐색 |

## 핵심 패턴

**진단 먼저, 수정 나중.** 이미지 버그는 코드를 읽기 전까지 원인을 몰랐다. 바로 "고쳐줘"로 시작했다면 엉뚱한 곳을 수정했을 거다. `ArchiveEntry` 타입을 확인하지 않았다면 `ArchiveList.tsx`만 건드리고 버그를 못 잡았을 가능성이 높다.

**병렬 에이전트는 탐색 단계에 쓴다.** 디자인처럼 "여러 방향 중 하나를 고르는" 작업에서 병렬 에이전트는 시간을 비선형으로 단축시킨다. 구현이 확정된 후에는 쓸 이유가 없다.

**스킬은 찾아서 써야 한다.** `ui-ux-pro-max` 스킬 없이 진행했다면 Claude의 "기본 디자인 감각"에 의존했을 거다. 스킬을 로드한 후 제안의 구체성이 달라졌다. "다 별로야 디자인 스킬 찾아"라는 프롬프트 한 줄이 결과물의 질을 바꿨다.
