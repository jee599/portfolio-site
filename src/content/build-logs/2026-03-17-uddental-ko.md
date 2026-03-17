---
title: "Claude Code로 낯선 코드베이스 파악하는 법: uddental 첫 스캔, tool call 7번"
project: "uddental"
date: 2026-03-17
lang: ko
tags: [claude-code, nextjs, onboarding, claude-opus]
description: "새 프로젝트를 열었을 때 Claude Code를 어떻게 쓰느냐가 이후 작업 속도를 결정한다. uddental 첫 스캔, tool call 7번으로 전체 구조를 파악했다."
---

새 프로젝트 디렉토리를 처음 열면 뭐부터 해야 할지 막막하다. 파일이 수십 개고, 어디서부터 읽어야 하는지 감이 안 온다.

**TL;DR** Claude Code에 초기 스캔 프롬프트 하나를 넣으면 7번의 tool call로 프로젝트 전체 구조가 파악된다. 변경 없이, 읽기만 한다.

## 첫 스캔에 쓰는 프롬프트

`uddental`은 치과 웹사이트 + 광고 전략 프로젝트다. 처음 열었을 때 쓴 프롬프트가 이렇다.

```
Open this repository in Claude Code context and do a quick initial scan only:
1) confirm the repo is accessible
2) identify the stack/framework
3) list the most important top-level directories/files
4) report any obvious start/dev/build commands if present

Keep it concise and do not make changes.
```

핵심은 마지막 줄이다. `do not make changes`. 이게 없으면 Claude가 README를 만들거나 설정 파일을 건드릴 수 있다. 온보딩 단계에서 원하는 건 파악이지, 변경이 아니다.

모델은 `claude-opus-4-6`으로 설정했다. 처음 보는 코드베이스를 파악할 때는 Sonnet보다 Opus가 구조적 추론을 더 잘한다는 게 경험적 판단이다. 비용은 조금 더 나가지만, 잘못 파악하고 나중에 수정하는 것보다 낫다.

## 7번의 tool call이 알려준 것

`Read(4), Bash(3)`. 총 7번. 파일 수정 없이 읽기만 했다.

스캔 결과가 흥미로웠다. 단순한 치과 웹사이트가 아니었다.

```
implementations/
├── claude/          — 메인 Next.js 앱 (App Router, 빌드 완료, Vercel 설정 있음)
├── codex/           — codex 트랙 구현
└── hybrid-claude-plan-co...  — 세 번째 구현체
```

동일한 프로젝트를 3가지 AI 도구로 구현해서 비교하는 구조다. `claude/` 구현체가 메인이고, `.next` 빌드도 존재하며 Vercel 배포 설정까지 되어 있다. 반면 다른 두 트랙은 실험 단계처럼 보였다.

스택은 Next.js 15 + React 19 + TypeScript + Tailwind CSS v4. `implementations/claude/` 기준이다.

## 왜 초기 스캔을 별도 세션으로 하는가

처음부터 "이 파일 고쳐줘"로 시작하면 Claude가 맥락 없이 수정을 시작한다. 결과물이 기존 구조와 충돌하거나, 이미 있는 패턴을 무시하고 새로 만들기도 한다.

초기 스캔을 별도로 하면 두 가지를 얻는다.

하나는 Claude의 컨텍스트다. 구조를 파악한 Claude는 이후 지시에서 기존 패턴을 참고한다. `implementations/claude/`가 메인이라는 걸 알고 있으면 "치과 예약 폼 추가해줘"라고만 해도 어느 디렉토리에 넣어야 할지 스스로 판단한다.

다른 하나는 내 컨텍스트다. 지금 무엇이 있는지 알아야 무엇을 만들지 결정할 수 있다. 초기 스캔 없이 코딩 시작하면 나중에 "이거 이미 있었네"를 발견하게 된다.

## 다음 세션을 위한 세팅

이 스캔의 결과를 CLAUDE.md나 노트에 남겨두는 게 좋다. 다음 세션을 열 때 Claude가 처음부터 다시 읽지 않아도 되도록.

```markdown
# uddental 프로젝트 컨텍스트
- 메인 구현체: implementations/claude/ (Next.js 15 + React 19 + Tailwind v4)
- 3가지 AI 구현체 비교 프로젝트 (claude / codex / hybrid)
- Vercel 배포 설정 완료
```

7번의 읽기로 얻은 정보를 텍스트 몇 줄로 압축해두면, 다음 세션의 첫 번째 tool call 낭비가 없어진다.

> 새 코드베이스를 만났을 때 먼저 읽고 나중에 건드린다. Claude Code도 마찬가지다.
