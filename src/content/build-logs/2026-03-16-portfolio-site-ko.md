---
title: "Claude Code 949번의 tool call로 포트폴리오 사이트 + 2개 신규 프로젝트를 하루 만에 만든 방법"
project: "portfolio-site"
date: 2026-03-16
lang: ko
tags: [claude-code, astro, portfolio, automation, admin]
description: "하루 3세션, 949번의 tool call로 치과 사이트 리뉴얼, LLM 라우터 앱 0→1, 포트폴리오 허브 전환을 동시에 진행했다. Claude Opus 4.6이 어떻게 세 프로젝트를 병렬로 소화했는지 투명하게 공개한다."
---

하루에 세 프로젝트, 총 10시간 49분, 949번의 tool call. 혼자서 이걸 처음부터 짰다면 최소 2주는 걸렸을 작업량이다.

**TL;DR** Claude Opus 4.6 3세션으로 치과 홈페이지 리뉴얼, LLM 믹서 앱 프로토타입, 포트폴리오 사이트 허브 전환을 동시에 완료했다. 핵심은 "큰 spec을 먼저 주고 Phase별로 쪼개서 받는" 프롬프트 전략이다.

## 하루에 세 프로젝트를 동시에 돌린다는 게 가능한가

2026-03-15 하루 동안 진행한 세션은 세 개다.

- **세션 1** (4h 52min, 309 tool calls): `uddental` — 치과 홈페이지 UI 리뉴얼
- **세션 2** (2h 35min, 368 tool calls): `llmmixer_claude` — LLM 라우팅 앱 0→1
- **세션 3** (3h 20min, 272 tool calls): `portfolio-site` — 포트폴리오 허브 전환

도구 사용 분포는 `Bash(417)`, `Edit(200)`, `Read(180)`, `Write(123)`, `Grep(13)`, `Agent(9)`. `Bash`가 절반에 가깝다는 게 특이한데, dev 서버 구동/재시작, git push, npm install 같은 반복 작업이 많았기 때문이다.

## "이걸 구현해줘" 한 줄로 spec 넘기기

세션 2에서 쓴 프롬프트가 인상적이다.

```
/Users/jidong/Downloads/SPEC.md 이거 구현해줘.
구현계획을 조금 촘촘하게 일단 세워서 구현계획 md를 만들어줘
```

그 다음:

```
각 phase 구현하고 구현사항에 대해 피드백 객관적으로하고,
수정하는 과정을 완벽해질때까지 최대 3번 수행해줘,
그리고 다음 Phase로 넘어가면서 구현해줘
```

두 번의 프롬프트로 Claude가 `IMPLEMENTATION_PLAN.md`를 직접 작성하고, Phase 0부터 순차적으로 구현 → 셀프 리뷰 → 수정 사이클을 돌렸다. 직접 Phase를 지시하지 않아도 된다. 계획서를 먼저 만들게 하면 Claude가 스스로 맥락을 유지한다.

결과: 빈 레포에서 Next.js + TypeScript 대시보드, CLI 엔트리포인트, SSE 로그 스트리밍, Claude/Codex/Gemini 어댑터까지 2시간 35분에 생성 파일 81개.

## "롤백해줘" — 버전 관리를 Claude에게 위임할 때의 한계

세션 1에서 가장 시간을 많이 쓴 구간이다. 치과 히어로 섹션의 UI 방향을 바꾸면서 롤백 요청이 반복됐다.

```
아니 방금 작업 내용 롤백해줘
```

```
아니 그소리가아니라 그냥 ... 이거 요청하기 전으로 돌려줘
```

Claude는 `git` 커밋 단위로 롤백할 수 있지만, 커밋 없이 수정이 쌓인 상태에서 "이전으로" 돌리는 건 맥락을 추적하는 방식이라 정확도가 떨어진다. 이번 세션에서 학습한 점: UI 방향이 확정되지 않은 상태에서 반복 수정할 때는 각 변형을 feature 브랜치로 분리하거나, 수정 전에 `git stash`를 명시적으로 요청하는 게 낫다.

## Hydration 에러는 Claude도 못 피한다

두 세션에서 동일한 에러가 반복됐다.

```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
This won't be patched up. This can happen if a SSR-ed Client Component used:
- Variable input such as Date.now() or Math.random() which changes each time it's called.
```

치과 사이트의 "현재 요일 기준 운영 여부 표시" 기능이 원인이었다. 서버에서 렌더링한 시간과 클라이언트에서 hydrate되는 시간이 달라서 생기는 문제다. Claude가 처음에 `Date.now()`를 서버/클라이언트 양쪽에 그냥 쓰다가 에러가 났고, `useEffect` + 클라이언트 전용 상태로 분리해서 해결했다.

이런 Next.js/React 특유의 SSR 이슈는 Claude가 패턴을 알고 있어서 수정 자체는 빠르다. 문제는 처음부터 이 이슈를 피하는 코드를 생성하지 않는다는 것. 실시간 데이터를 쓰는 컴포넌트를 요청할 때 "클라이언트 전용 렌더링으로 처리해줘"를 명시하면 처음부터 깔끔하게 나온다.

## 포트폴리오를 허브로 바꾸는 구조 설계

세션 3이 `portfolio-site`의 핵심이다. 기존 사이트는 AI 뉴스/블로그 중심이었고, 프로젝트 섹션은 7개만 수동으로 등록되어 있었다. 목표는 두 가지였다.

첫째, 프로젝트 레지스트리를 `scripts/project-registry.yaml`로 분리해서 로컬 git 경로와 포트폴리오 slug를 매핑한다. 둘째, 빌드 로그 생성을 자동화한다. `.claude/projects/` 디렉토리에 저장되는 JSONL 대화 로그를 파싱해서 세션 요약을 뽑고, Claude CLI로 빌드 로그 초안을 생성하는 파이프라인이다.

세션 3 프롬프트 중 핵심:

```
Implement the following plan:
# jidonglab 포트폴리오 허브 리뉴얼
...
이제 이거 claude code schedule로 프로젝트별로 6시간마다 업데이트하고,
블로그 글 써서 jidonglab에 올리게 해줘
```

자동화까지 요청했다. 결과로 `scripts/parse-sessions.py`, `scripts/generate-build-log.sh`, admin 페이지에 Projects + Build Logs 탭이 추가됐다.

## Admin에서 YAML을 직접 수정하면 생기는 에러

세션 3에서 마지막 삽질이 여기 있었다.

```
admin에서 링크나 project 상태 붙이면yaml 어쩌고 에러메세지 나와
```

admin에서 프로젝트 상태를 변경할 때 GitHub API를 통해 YAML 파일을 직접 커밋하는 방식이었는데, `403` 에러가 발생했다. 원인은 GitHub token을 클라이언트 사이드에서 직접 노출하지 않도록 처리하는 과정에서 권한 스코프가 빠진 것. `src/pages/api/admin-projects.ts` API 엔드포인트를 수정해서 해결했다.

```
github api error 403
이거 테스트해서 완벽하게 돌아갈때까지 수정해
```

이 한 줄 프롬프트로 Claude가 원인을 파악하고 수정 → 테스트 → 재수정 사이클을 자동으로 돌렸다. 직접 GitHub API 문서 뒤질 필요가 없었다.

## JSONL 대화 로그 → 빌드 로그 파이프라인

이 글 자체가 그 파이프라인의 첫 결과물이다. Claude Code는 대화 내용을 `~/.claude/projects/` 아래 JSONL 파일로 로컬에 저장한다. `scripts/parse-sessions.py`가 이 파일을 읽어 세션별로 사용자 프롬프트, tool call 횟수, 변경된 파일 목록을 추출한다. 추출된 요약을 Claude CLI에 넘기면 빌드 로그 초안이 나온다.

Before: 빌드 로그를 손으로 썼다. 매 세션마다 뭘 했는지 기억해내야 했고, 쓰는 데 30~60분이 걸렸다.

After: `generate-build-log.sh` 실행 한 번으로 세션 요약이 자동 추출되고, 로그 초안이 생성된다. 수정은 10~15분이면 끝난다.

## 이 방식으로 작업할 때 실제로 달라지는 것

코드 작성 시간이 줄어드는 게 아니다. 의사결정 횟수가 줄어든다. 세션 3에서 생성된 파일만 27개, 수정 파일 10개인데 내가 직접 작성한 코드는 없다. 내가 한 일은 방향을 정하고 프롬프트를 구성하는 것뿐이다.

반대로 Claude가 못 하는 것도 명확하다. UI 방향이 아직 확정되지 않은 상태에서 계속 "조금 더 트렌디하게" 같은 주관적 요청을 반복하면 tool call 낭비가 크다. 세션 1이 309 tool calls를 쓴 이유다. 레퍼런스 스크린샷 하나가 30번의 반복 수정보다 낫다.

도구 사용 기준으로 보면, `Edit(200)`이 `Write(123)`보다 많다. 처음부터 새로 쓰는 것보다 기존 파일을 수정하는 방향이 더 효율적이라는 걸 Claude 자체적으로 선호하고 있다.

> spec을 먼저 만들게 하면 Claude는 스스로 맥락을 유지한다. "어떻게"가 아니라 "무엇을"에 집중해서 프롬프트를 쓰면 더 좋은 결과가 나온다.
