---
title: "블로그 자동화 파이프라인: 105개 세션 로그를 빌드로그로 바꾸는 Claude Code 자동화"
project: "portfolio-site"
date: 2026-03-15
lang: ko
tags: [automation, claude-code, build-log, admin, devto]
description: "Claude Code 자동화 파이프라인으로 세션 로그 105개를 파싱해 빌드로그를 자동 생성한다. 세션 파싱, CLI 호출, git push까지 전 과정을 기록한다."
---

105개의 Claude Code 세션 기록이 `.jsonl`로 쌓여 있었다. 빌드로그를 쓰려면 이 기록을 하나하나 열어보고 정리해야 하는데, 매번 손이 안 갔다. 그래서 블로그 자동화 파이프라인을 만들었다. 세션 파싱부터 빌드로그 생성, git push, Cloudflare 배포까지 한 번에 돌아간다.

**TL;DR**: Claude Code 세션 `.jsonl`을 파싱하고 Claude CLI로 빌드로그를 자동 생성하는 파이프라인을 구축했다. 작업 기록은 이미 다 있었다 — 안 쓴 이유는 귀찮아서였지, 재료가 없어서가 아니었다.

## 세션 `.jsonl`에 빌드로그 재료가 전부 있었다

Claude Code는 `~/.claude/projects/` 아래에 프로젝트별로 세션 파일을 `.jsonl` 형태로 저장한다. 각 줄에 메시지 하나가 JSON으로 들어 있다. 사용자 프롬프트, Claude의 응답, 도구 호출 결과, 타임스탬프까지 전부다.

이 파일을 파싱하면 "누가 뭘 물었고, Claude가 어떤 도구를 몇 번 썼고, 무슨 파일을 건드렸는지"가 다 나온다. 빌드로그에 필요한 재료가 이미 거기 있었던 셈이다.

## Claude Code 자동화 파이프라인의 구조

`scripts/parse-sessions.py`가 `.jsonl` 세션을 파싱해서 작업 요약 마크다운을 만든다. 프로젝트 slug와 날짜를 넘기면, 해당 기간의 세션을 찾아서 프롬프트·도구 사용 통계·변경 파일 목록을 정리한다.

```python
python3 scripts/parse-sessions.py --project portfolio-site --since 2026-03-10 --output summary.md
```

`scripts/generate-build-log.sh`는 이 요약을 Claude CLI에 넘긴다. 프롬프트는 이렇게 생겼다:

```
프로젝트 "portfolio-site"의 빌드 로그를 작성해라.
아래는 Claude Code 세션 기록에서 추출한 작업 요약이다.
...
반드시 Write 도구로 파일을 생성해라.
```

Claude CLI가 `--allowedTools "Write Read"`로 실행되면서 `src/content/build-logs/` 아래에 파일을 직접 생성한다. 생성 완료 후 자동으로 git commit + push → Cloudflare Pages 빌드가 트리거된다.

`scripts/project-registry.yaml`에는 어떤 프로젝트가 어떤 `.claude/projects` 디렉토리에 매핑되는지 정의해뒀다. `portfolio-site`, `saju_global`, `LLMTrio` 등 6개 프로젝트가 등록되어 있다.

도구 사용은 세션 전체에서 총 Read 19회, Write 17회, Bash 30회, Agent 4회다.

## 빌드가 아예 깨진 상태에서 시작해야 했다

파이프라인 작업을 시작하기 전에 먼저 빌드를 살려야 했다. 포트폴리오 사이트가 배포 중에 깨진 채로 방치되어 있었다.

에러 메시지는 이랬다:

```
src/content/blog/huggingface-ai-teureiding-arenaeseo-1wi-jeonryageul-humcyeowassda-37oc.md:3:7
"a multiline key may not be an implicit key"
```

원인은 frontmatter의 `title` 필드에 콜론(`:`)이 포함된 채로 따옴표로 감싸지지 않은 것. Astro의 YAML 파서가 콜론을 키-값 구분자로 해석해서 멀티라인 키 오류를 낸다. dev.to에서 자동 생성된 AI 뉴스 파일들에서 이 패턴이 반복되고 있었다.

수정은 간단했다. 파일을 열고 title을 따옴표로 감싸면 된다. 문제는 같은 패턴으로 깨진 파일이 여러 개였다는 것이다. Claude에게 `src/content/blog/` 전체를 스캔하게 하고, 콜론이 들어간 title을 일괄 수정했다.

그다음은 `src/lib/devto.ts`였다. DEV.to API 동기화가 중단되어 있었는데, API 응답 처리 로직에서 타입 불일치가 있었다. `src/pages/api/sync-devto.ts`도 함께 수정했다.

빌드 에러를 잡는 데 Bash 30회 중 절반 가까이를 썼다. `npx astro check`로 타입 에러를 확인하고, 빌드 실패 로그를 분석하고, 파일을 수정하는 사이클을 반복했다.

## Admin 페이지에 플랫폼별 조회수 카드를 붙였다

빌드를 살린 뒤에는 admin 기능을 붙였다. `src/pages/admin.astro`에 플랫폼별 조회수 표시 기능을 추가하고, `src/pages/api/admin-build-logs.ts`와 `src/pages/api/admin-projects.ts` 두 개의 API 엔드포인트를 만들었다.

Overview 섹션에는 플랫폼별 조회수 카드가 생겼다. DEV.to, Medium, 네이버 각각의 조회수가 카드 형태로 보인다. 숫자가 한눈에 들어오니 어느 플랫폼에서 트래픽이 오는지 바로 알 수 있다.

`src/lib/projects.ts`와 `src/content/config.ts`도 수정되었다. 프로젝트 스키마에 플랫폼 조회수 필드를 추가하고, `src/pages/projects/[slug].astro`에서 표시하는 구조다.

## Claude CLI를 Claude Code 안에서 호출하는 재귀 구조

파이프라인에서 가장 재미있는 부분은 `generate-build-log.sh` 내부에서 `claude -p` CLI를 호출하는 것이다.

```bash
claude -p \
  --model sonnet \
  --permission-mode bypassPermissions \
  --allowedTools "Write Read" \
  --max-budget-usd 1.0 \
  --no-session-persistence \
  "$PROMPT_CONTENT"
```

`--no-session-persistence` 플래그로 각 빌드로그 생성이 독립적인 세션으로 실행된다. `--allowedTools "Write Read"`로 파일 접근만 허용해서 예상치 못한 동작을 막는다. `--max-budget-usd 1.0`으로 비용 상한을 걸어뒀다.

세션 요약이 50KB를 넘으면 `head -c 50000`으로 잘라낸다. Claude의 컨텍스트 제한을 고려한 처리다.

## cron 한 줄로 6개 프로젝트 빌드로그가 생성된다

cron 모드로 실행하면 전체 과정이 자동이다. 각 프로젝트의 마지막 빌드로그 날짜를 확인하고, 그 이후에 세션이 있으면 후보 목록에 올린다. 선택 없이 전체 처리 후, `git commit` + `git push`까지 한 번에 실행된다. push가 완료되면 Cloudflare Pages가 자동으로 빌드를 트리거한다.

`--interactive` 플래그를 쓰면 프로젝트 목록이 표시되고 선택할 수 있다. 지금 읽고 있는 이 글도 그 파이프라인으로 생성된 것이다.

> 작업 기록이 이미 다 남아있다. 안 쓴 이유는 귀찮아서였지, 재료가 없어서가 아니었다.

---

## 관련 글

- [Claude Code 멀티에이전트 오케스트레이터: 3개 LLM 병렬 실행, 86세션의 삽질 기록](/posts/2026-03-15-LLMTrio-ko)
- [Claude Code로 Claude Code 책 쓰기 — PostToolUse 훅이 25번 루프한 이야기](/posts/2026-03-15-claudebook-ko)
- [에이전트 10명 고용해서 멘토링 플랫폼 만든 기록: 6세션, 1289 tool calls](/posts/2026-03-15-coffee-chat-ko)
