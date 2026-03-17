---
title: "Claude vs Codex vs Hybrid — 치과 사이트 3개 구현 비교 프로젝트, 7번 만에 구조 파악"
project: "uddental"
date: 2026-03-18
lang: ko
tags: [claude-code, claude-opus, next-js, ai-comparison]
description: "같은 치과 웹사이트를 Claude, Codex, Hybrid로 각각 구현한 레포. claude-opus-4-6이 Read 4번, Bash 3번, 총 7 tool call로 전체 구조를 파악했다."
---

같은 프로젝트를 세 가지 AI로 각각 만들어 비교한 레포가 있다.

`uddental`. 치과 웹사이트 + 광고 전략 프로젝트다. 폴더 구조부터 비범하다.

```
implementations/
├── claude/
├── codex/
└── hybrid-claude-plan-co.../
```

Claude로 구현한 버전, Codex로 구현한 버전, 그리고 둘을 혼합한 하이브리드 버전. 같은 스펙, 세 가지 접근. 이런 레포는 처음 봤다.

**TL;DR** — claude-opus-4-6이 7번의 tool call(Read 4, Bash 3)로 프로젝트 전체 구조를 파악했다. AI 간 구현 비교 실험이라는 흥미로운 프로젝트를 발견했다.

## 탐색 프롬프트는 간단했다

프롬프트를 짧게 썼다.

```
Open this repository in Claude Code context and do a quick initial scan only:
1) confirm the repo is accessible
2) identify the stack/framework
3) list the most important top-level directories/files
4) report any obvious start/dev/build commands if present

Keep it concise and do not make changes.
```

목적이 명확하면 프롬프트도 짧아진다. "변경하지 마라"는 명시적 제약도 넣었다. Claude Code는 기본적으로 적극적으로 움직이기 때문에, 탐색만 하라는 가드레일이 필요하다.

## 7번으로 충분했다

claude-opus-4-6이 사용한 tool call은 총 7번이다. Read가 4번, Bash가 3번.

Read로는 `package.json`, `.vercel.json`, `next.config.ts` 같은 핵심 설정 파일을 읽었다. Bash로는 디렉토리 구조를 확인했다. 소요 시간은 체감상 1분 안팎.

결과로 나온 정보:

- **스택**: Next.js 15 + React 19 + TypeScript + Tailwind CSS v4
- **배포**: Vercel (`.vercel` 빌드 결과물 존재, Vercel 설정 파일 확인)
- **구조**: App Router 기반, `implementations/claude/`가 메인 앱
- **커맨드**: `npm run dev`, `npm run build` (Next.js 표준)

7번의 도구 호출로 낯선 레포의 전체 윤곽을 잡았다. 컨텍스트 없이 코드베이스에 처음 들어올 때, 이 방식이 효율적이다. 파일을 무작위로 열어보는 것보다 훨씬 빠르다.

## 세 가지 구현이 의미하는 것

`implementations/` 구조가 흥미롭다.

같은 스펙을 서로 다른 AI 도구로 구현하고 비교하는 실험이다. Claude만 쓴 버전, Codex만 쓴 버전, 두 도구를 조합한 하이브리드 버전. 이런 A/B 비교는 각 도구의 특성을 직접 드러낸다.

코드 품질, 컴포넌트 구조, 의사결정 방식이 AI마다 얼마나 다른지를 실증적으로 보여주는 프로젝트다. 단순한 "AI로 만든 사이트"가 아니라, AI 간 구현 차이를 측정하는 실험 레포다.

이 세션은 첫 탐색에서 끝났다. 세 구현 간의 실제 차이를 들여다보는 건 다음 단계다.

## 첫 탐색에서 배운 것

레포를 처음 열 때 Claude Code에 줄 프롬프트는 짧고 구체적이어야 한다. 무엇을 확인하고 싶은지, 무엇을 하지 않아야 하는지를 명시한다. 탐색 목적이면 "변경하지 마라"는 제약을 명시적으로 추가한다.

그리고 Opus를 쓰면 7번 만에 전체 구조가 나온다. 탐색 단계에서 모델을 아끼는 것보다, 한 번에 정확히 파악하는 게 더 효율적이다.

> 낯선 레포에 들어가는 가장 빠른 방법은 Claude에게 먼저 물어보는 것이다.
