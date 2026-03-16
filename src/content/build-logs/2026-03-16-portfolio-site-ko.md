---
title: "Claude Code JSONL 파싱으로 빌드 로그 자동화한 방법 (272 tool calls)"
project: "portfolio-site"
date: 2026-03-16
lang: ko
tags: [claude-code, automation, portfolio, build-log]
description: ".claude 폴더 JSONL로 Claude Code 세션을 파싱해 빌드 로그를 자동 생성하는 파이프라인 구축. 포트폴리오 허브 전환까지 272 tool calls로 해결한 과정."
---

빌드 로그를 수동으로 쓰고 있었다. 세션이 끝나면 뭘 했는지 기억을 더듬어 정리하는 게 귀찮았고, 어차피 대충 쓰게 됐다.

**TL;DR** Claude Code가 `.claude` 폴더에 모든 대화를 JSONL로 저장한다. 이걸 파싱해서 빌드 로그를 자동 생성하는 파이프라인을 만들었다. 포트폴리오도 AI 뉴스 사이트에서 프로젝트 허브로 전환했다.

## "JSONL이 뭐야?" 에서 파이프라인까지

세션 중에 물어봤다. "`.claude`에 로컬 대화가 저장된다던데, 이걸 어떻게 활용해?"

Claude가 설명해줬다. `.claude/projects/` 아래 디렉토리별로 JSONL 파일이 쌓인다. 각 줄이 하나의 메시지 이벤트다. 사용자 프롬프트, 어시스턴트 응답, 도구 호출 결과까지 전부 들어있다.

거기서 바로 연결이 됐다. "그럼 이걸 파싱하면 내가 뭘 물어봤고 Claude가 뭘 했는지 자동으로 정리할 수 있잖아?"

`scripts/parse-sessions.py`를 만들었다. JSONL에서 사용자 프롬프트만 뽑아내고, 도구 호출 횟수와 종류를 집계하고, 수정된 파일 목록을 추출하는 스크립트다. 그 결과를 Claude에게 다시 넘겨서 빌드 로그 초안을 생성한다.

`scripts/generate-build-log.sh`가 그 다음 단계다. `parse-sessions.py` 실행 → 파싱 결과를 Claude에게 전달 → 마크다운 빌드 로그 생성 → `src/content/build-logs/`에 저장까지 한 번에 돌아간다.

```bash
# 실제 사용법
./scripts/generate-build-log.sh portfolio-site 2026-03-16
```

수동 정리가 반자동이 됐다. 완전 자동은 아닌데, 파싱 결과를 Claude에게 넘길 때 프롬프트 컨텍스트를 사람이 한 번 봐야 하기 때문이다. 완전 자동화는 다음 단계다.

## 포트폴리오 허브 전환, 왜 지금?

jidonglab.com이 AI 뉴스 사이트처럼 보이기 시작했다. 매일 9시에 뉴스가 올라가고, 프로젝트 탭은 구석에 있었다. 이게 포트폴리오인지 뉴스레터인지 헷갈렸다.

로컬에 git 프로젝트가 11개 있는데 포트폴리오에는 7개만 등록되어 있었다. 빌드 로그는 수동 생성이라 정기적으로 쓰지 않았다. 이 상태로는 방문자가 내가 뭘 만드는 사람인지 파악하기 어려웠다.

전환 계획을 세웠다. 프로젝트 레지스트리로 로컬 git 경로를 관리하고, admin에서 프로젝트를 등록·수정할 수 있게 하고, 빌드 로그는 자동으로 생성해서 붙이는 구조다.

`scripts/project-registry.yaml`에 slug → 로컬 경로 + 브랜치 매핑을 정의했다. `src/content/projects/`에 YAML로 프로젝트 메타데이터를 관리하고, `visible` 필드로 노출 여부를 제어한다. admin에서 이 필드를 바꾸면 바로 적용되는 구조를 만들었는데, 여기서 첫 번째 삽질이 나왔다.

## GitHub API 403, 그리고 권한 문제

admin에서 project `status`를 바꾸면 에러가 났다. `github api error 403`.

원인은 단순했다. Content Collections의 YAML 파일을 API로 수정하려면 GitHub API를 통해 파일을 직접 커밋해야 하는데, 사용하던 토큰에 `contents: write` 권한이 없었다.

GitHub Personal Access Token 스코프 문제다. 기존 토큰은 읽기 전용이었다. 새 Fine-grained token을 만들면서 `Contents: Read and write`를 추가했다.

근데 거기서 끝이 아니었다. 토큰은 해결됐는데 실제로 파일이 업데이트되면 Cloudflare Pages 재배포가 트리거되어야 한다. 이 흐름을 완성하는 데 30분이 더 걸렸다. `api/admin-projects.ts`에서 GitHub API 호출 → 커밋 생성 → Cloudflare 웹훅 트리거까지 이어지는 체인을 구성했다.

결국 완성됐다. admin에서 status를 `active`로 바꾸면 YAML이 커밋되고, 5분 안에 프로덕션에 반영된다.

## Agent로 빌드 로그 6개 동시 번역

첫 번째 빌드 로그를 생성하고 DEV.to에 올리려고 보니 영어 버전이 없었다. 기존에 쌓인 6개 한국어 빌드 로그를 한꺼번에 처리해야 했다.

Agent 도구로 "Translate 6 build logs to English"라는 서브에이전트를 하나 던졌다. 12개 파일(ko/en 세트 6쌍)이 한 번에 생성됐다.

직역이 아니라 영어 독자 관점에서 리라이팅하는 프롬프트를 썼다. 한국 로컬 맥락은 한 문장 설명을 붙이고, 글로벌 독자에게 덜 관련된 부분은 비중을 줄이도록 지시했다. 결과물 품질은 충분했다.

병렬 Agent가 유용했던 이유는 컨텍스트 분리 때문이다. 6개 파일을 메인 스레드에서 순서대로 처리하면 긴 원문들이 컨텍스트를 채워서 후반부 번역 품질이 떨어질 수 있다. 서브에이전트로 나누면 각각 깨끗한 컨텍스트로 시작한다.

## 이 세션에서 배운 것

272 tool calls 중 Bash가 158회로 가장 많았다. `git` 상태 확인, YAML 파일 생성, Python 스크립트 실행, API 테스트까지 터미널 작업이 많았기 때문이다. Edit은 43회, Write는 19회였다.

Claude Code에게 계획을 먼저 문서로 받아서 승인하고 구현하는 방식이 효과적이었다. 이번 세션은 사용자가 직접 "Implement the following plan:"으로 시작하면서 상세 스펙을 붙여줬다. Claude가 뭘 만들어야 하는지 명확하게 알고 있으니 삽질이 줄었다.

반면 "이거 테스트해서 완벽하게 돌아갈 때까지 수정해"처럼 목표가 모호할 때는 반복 수정이 늘었다. GitHub API 403 이슈가 그 케이스였다. 에러 메시지와 기대 동작을 구체적으로 주는 게 빠르다.

> JSONL은 이미 거기 있었다. 활용하지 않고 있었을 뿐이다.
