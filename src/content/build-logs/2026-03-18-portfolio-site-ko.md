---
title: "Claude Code 6세션·827회 도구 호출로 포트폴리오 허브 전환 + 빌드 로그 자동화"
project: "portfolio-site"
date: 2026-03-18
lang: ko
tags: [claude-code, portfolio, automation, astro]
description: "jidonglab.com을 AI 뉴스 사이트에서 프로젝트 허브로 전환하면서 발견한 것: Claude Code JSONL 로그로 빌드 로그를 자동 생성할 수 있다. 6세션, 827 tool calls, 117개 파일."
---

6세션, 827번의 도구 호출, 117개 파일을 건드렸다.

이번 주 Claude Code로 한 작업을 숫자로 정리하면 이렇다. LLM 오케스트레이션 툴을 처음부터 만들고, jidonglab.com을 포트폴리오 허브로 개편하고, 치과 사이트와 사주 앱을 수정했다. 거의 모든 작업을 Claude Code에게 맡겼다.

그 과정에서 하나 흥미로운 걸 발견했다.

**TL;DR** Claude Code는 로컬에 모든 세션 기록을 JSONL로 쌓는다. 이 파일에서 프롬프트, 도구 사용 패턴, 파일 변경 내역을 뽑아내면 빌드 로그를 자동으로 생성할 수 있다.

## SPEC.md 한 장으로 monorepo를 만들었다

세션 1의 시작 프롬프트는 단순했다.

```
/Users/jidong/Downloads/SPEC.md 이거 구현해줘.
구현계획을 조금 촘촘하게 일단 세워서 구현계획 md를 만들어줘
```

빈 레포지토리였다. 커밋이 하나도 없었다. `git@github.com:jee599/llmmixer_claude.git`.

Claude가 먼저 `IMPLEMENTATION_PLAN.md`를 만들었다. Phase 0부터 3까지 나눠서 프로젝트 셋업, CLI + 대시보드, LLM Decomposer + Router, Codex/Gemini 어댑터 순으로 구조를 잡았다. 계획이 나오자 루프를 지시했다.

```
각 phase 구현하고 구현사항에 대해 피드백 객관적으로 하고,
수정하는 과정을 완벽해질 때까지 최대 3번 수행해줘,
그리고 다음 Phase로 넘어가면서 구현해줘
```

"구현 → 셀프 리뷰 → 수정 → 다음 Phase" 루프를 프롬프트 한 줄로 지정한 것이다. Phase 0 셀프 리뷰에서 Claude가 스스로 3가지 문제를 잡아냈다. `outputFileTracingRoot` 경고, dev 서버 프로세스 처리, `tsconfig.json` 모듈 호환성. 사람이 지적하기 전에 먼저 찾아냈다.

370 tool calls 뒤에 `packages/core/`와 `packages/dashboard/` 두 패키지, `bin/`, `config/templates/`까지 골격이 완성됐다. 신규 파일 69개.

중간에 npm이 한 번 걸렸다. `workspace:*` 프로토콜을 썼는데 npm이 지원하지 않는 형식이었다. 빌드가 깨졌다. Claude가 `package.json`을 바로 수정했다.

## 포트폴리오 허브 전환: AI 뉴스 사이트를 버리기로 했다

jidonglab.com은 원래 AI 뉴스 자동 발행 사이트로 시작했다. GPT, Claude, Gemini 관련 뉴스를 하루 두 번 자동으로 올리는 구조였다.

돌이켜보면 이건 내 블로그가 아니었다. 뉴스 모음집이었다.

나는 지금 LLM Mixer, 사주 앱, 치과 사이트, 트레이딩 봇 등 여러 프로젝트를 동시에 진행하고 있다. 이 프로젝트들을 보여줄 공간이 필요했다. "AI로 뭘 만들고 있는지"가 포트폴리오의 중심이어야 한다.

세션 2는 구현 플랜을 직접 붙여서 시작했다.

```
Implement the following plan:

# jidonglab 포트폴리오 허브 리뉴얼

jidonglab.com을 AI 뉴스/블로그 사이트가 아니라
프로젝트 포트폴리오 허브로 전환한다.
```

`admin.astro`가 58KB였다. 기존 코드를 파악한 다음, Projects 탭과 Build Logs 탭을 추가했다. `scripts/project-registry.yaml`로 로컬 git 경로를 매핑하고, `src/content/projects/`에 YAML을 두고, `visible` 필드로 공개 여부를 제어하는 구조를 만들었다.

중간에 `github api error 403`이 났다. Admin 프로젝트 GET 엔드포인트에서 GitHub API를 불필요하게 호출하고 있었다. 이미 로컬 YAML에 프로젝트 정보가 있는데 API rate limit을 쓸 이유가 없었다.

```typescript
// Before: GitHub API 호출 (rate limit 소모)
const repos = await fetch(`https://api.github.com/user/repos`, { ... });

// After: 로컬 YAML 직접 읽기
const registry = yaml.load(fs.readFileSync('scripts/project-registry.yaml'));
```

GitHub API 호출을 완전히 제거했다. `bccb9c9` 커밋으로 남아 있다.

## JSONL 기반 빌드 로그 자동화

세션 중에 이런 질문이 나왔다.

```
그러면 어떻게 jsonl 기반으로 프로젝트별 로그, 프롬프트 내용,
작업 어떻게 했는지 정리해서 남길 수 있어?
```

Claude Code는 `~/.claude/projects/` 아래에 각 세션을 JSONL 포맷으로 저장한다. 한 줄이 하나의 이벤트다.

```json
{"type":"user","message":"..."}
{"type":"tool_use","name":"Bash","input":{"command":"..."}}
{"type":"tool_result","content":"..."}
```

이 파일을 파싱하면 어떤 프롬프트를 날렸는지, 어떤 도구를 몇 번 썼는지, 어떤 파일이 생성/수정됐는지를 뽑을 수 있다. `scripts/parse-sessions.py`가 이 역할을 한다.

`generate-build-log.sh`는 파싱 결과를 Claude API에 넘겨서 빌드 로그 초안을 자동 생성한다. 지금 보고 있는 이 글도 그 파이프라인을 통해 나왔다.

완전 자동화는 아직 아니다. 생성된 초안을 검토하고 편집하는 시간이 필요하다. 하지만 "아무것도 없는 상태에서 빌드 로그를 직접 쓰는 것"보다는 훨씬 빠르다.

## 9분 만에 토스페이먼츠 심사 요구사항 처리

세션 4는 9분, 39 tool calls였다. 사주 앱 토스페이먼츠 계약 심사 요구사항 처리다.

토스페이먼츠 담당자 메일을 그대로 붙여넣었다.

```
1. 홈페이지에 결제 가능한 상품이나 서비스를 1개 이상 올려주세요.
2. 홈페이지 하단에 사업자정보를 기재해주세요.
```

4가지 요구사항 중 코드 작업이 필요한 건 2가지, 나머지는 코드 밖의 일이었다.

원인은 CSS였다. `.constellationPage`에 `overflow: hidden; height: 100vh`가 설정되어 있어서 사업자정보 푸터가 뷰포트 밖에 숨겨져 있었다. Claude가 CSS를 찾아내고 수정했다. pricing 섹션은 i18n 파일에 이미 8개 로케일 전부 준비되어 있었다. 코드에서 렌더링하지 않고 있었을 뿐이었다.

에러 메시지나 요구사항을 그대로 붙여넣는 게 빠른 이유가 여기 있다. Claude가 문맥을 정확히 파악한다. "이거 왜 안 돼?"보다 원문이 훨씬 빠르다.

## 827 tool calls의 분포

전체 도구 사용 통계다. Bash 400번, Read 142번, Edit 119번, Write 116번, Grep 15번, Agent 15번, Glob 10번.

Bash가 절반 가까이 차지한다. 빌드 확인, 서버 재시작, git 상태 체크, 프로세스 관리 같은 짧은 명령들이 쌓인 결과다. 실제 코드 생산과 직결되는 Edit + Write를 합쳐도 Bash의 절반 수준이다.

Agent 15번은 따로 볼 만하다. "6개 빌드 로그를 영어로 번역해" 같은 작업을 서브에이전트에 위임했다. 메인 컨텍스트를 오염시키지 않고 병렬로 처리된다. 세션이 길어질수록 이 패턴이 효과적이다.

두 가지 패턴이 반복적으로 효과를 냈다.

SPEC이나 플랜을 앞에 붙이면 탐색 비용이 줄어든다. Claude가 뭘 만들지 파악하는 단계를 건너뛴다. 세션 2가 그랬다.

반면 "다시 고치고 모든 기능이 의도대로 동작하도록"은 모호했다. 세션 1 후반부에서 반복 수정이 늘었다. 기대 동작을 구체적으로 주는 것과 아닌 것의 차이가 컸다.

> 더 나은 프롬프트를 쓰는 건 Claude를 위한 게 아니다. 내 시간을 아끼는 거다.
