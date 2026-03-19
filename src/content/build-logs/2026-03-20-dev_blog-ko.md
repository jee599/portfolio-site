---
title: "GitHub Actions DEV.to 자동 발행 — 7개 중 2개만 올라간 이유와 403 삽질기"
project: "dev_blog"
date: 2026-03-20
lang: ko
tags: [claude-code, github-actions, devto, automation]
description: "DEV.to 자동 발행 파이프라인 구축 중 7개 포스트 중 2개만 올라가는 문제, HTTP 403 에러, TL;DR 깨짐까지 연속으로 터졌다. 307번의 tool call 끝에 파이프라인이 동작하기 시작했다."
---

`git push` 하나로 DEV.to에 글이 올라가는 구조를 만들려고 했다. 생각보다 훨씬 복잡했다.

**TL;DR** GitHub Actions로 DEV.to 자동 발행 파이프라인을 구축하면서 307번의 tool call, 3시간 19분의 세션을 썼다. 핵심 문제는 403 에러와 누락된 헤더였다.

## 7개를 올렸는데 2개만 보였다

세션 1은 아예 시작도 못 했다. 사용자가 "첨부한 파일을 레포에 넣어줘"라고 했는데, 대화에 첨부된 파일이 없었다. `/Users/jidong/dev_blog/dev_blog/`를 확인했더니 `.git` 폴더만 있었다. 결국 첫 세션은 "파일이 어디 있나요?"로 끝났다.

세션 2에서 실제 작업이 시작됐다. 파일 7개(`publish.yml` 1개 + md 6개)를 받아서 구조를 잡았다:

```
.github/workflows/publish.yml
posts/ai-fortune-architecture-ko.md
posts/ai-fortune-architecture-en.md
posts/designing-saas-with-claude-ko.md
posts/designing-saas-with-claude-en.md
posts/llm-cost-optimization-ko.md
posts/llm-cost-optimization-en.md
```

커밋하고 푸시했다. 그런데 사용자의 첫 피드백이 왔다.

> "왜 2개만 올라갔어?"

GitHub 레포에는 분명히 7개 파일이 있었다. 문제는 GitHub Actions의 `publish.yml` 워크플로우였다. 파일을 커밋했다고 자동으로 발행되는 게 아니었다. 워크플로우가 조건을 가지고 있었고, 일부 파일만 트리거 조건을 만족했다.

여기서 세션 2가 길어지기 시작했다. 총 307번의 tool call 중 Bash 129번, Edit 75번, Read 62번을 이 세션에서 쏟아냈다.

## 파이프라인이 아니라 포맷 문제가 쌓였다

"블로그에 글 2개만 올라왔어"라는 피드백 이후, 사용자는 연속으로 요청을 던졌다.

"파일 수정할게. DEV.to에 올라간 내용 수정도 할 수 있어? 가독성 있게 꾸미고 싶어."

"시리즈 넣지 마라."

"TL;DR도 깨져 보여. 그냥 빼버려."

"가독성 좋게 해줘. 너무 딱딱해."

각 요청마다 md 파일을 수정하고, 워크플로우를 조정하고, 커밋하고, 푸시했다. 세션 도중 컨텍스트가 가득 차서 요약 기반으로 이어가야 하는 상황도 발생했다. `[Request interrupted by user]`가 두 번 나왔다.

GitHub Actions 인증 문제도 터졌다. 백그라운드로 "Login to GitHub via browser" 커맨드를 실행했는데 exit code 1로 실패했다. 결국 인증 방식을 바꿔서 우회했다.

결국 세션 2는 한 가지 문제를 해결하는 게 아니라, 파이프라인 + 포맷 + 인증 문제를 동시에 다루는 세션이 됐다. 도구 사용이 많아진 이유다.

## 403의 원인은 헤더였다

세션 3은 짧았다. 14번의 tool call, 2분. 하지만 핵심 문제를 잡았다.

사용자가 넘긴 `publish-log.txt`에는 3개 포스트가 HTTP 403으로 실패한 로그가 있었다. DEV.to API가 요청을 거부하는 상황이었다.

워크플로우를 분석한 결과 문제가 세 개 있었다.

첫째, `User-Agent`와 `Accept` 헤더가 없었다. DEV.to API는 이 헤더 없이 들어오는 요청을 간혹 차단한다. 둘째, 재시도 로직이 없었다. 일시적인 rate limit 403이 오면 그냥 실패로 끝났다. 셋째, 오류 응답 바디가 로그에 안 찍혔다. 뭘 보고 디버깅을 해야 할지 알 수가 없는 구조였다.

수정은 간단했다:

```bash
# Before
curl -X POST https://dev.to/api/articles \
  -H "api-key: $DEVTO_API_KEY" \
  -d @article.json

# After
curl -X POST https://dev.to/api/articles \
  -H "api-key: $DEVTO_API_KEY" \
  -H "User-Agent: dev_blog-publisher/1.0" \
  -H "Accept: application/vnd.forem.api-v1+json" \
  --retry 3 --retry-delay 5 \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d @article.json
```

헤더 두 줄 추가, 재시도 옵션, 응답 코드 출력. `publish.yml`과 `README.md`를 새로 생성하고 커밋했다. 세션 3은 그걸로 끝났다.

## Claude Code 관점에서 본 이 작업

이 프로젝트의 총 tool call은 325번이다. Bash 141번, Edit 75번, Read 65번, TodoWrite 16번, Write 16번 순이다.

세션 2가 307번으로 전체의 94%를 차지한다. 문제가 명확하지 않은 세션이 얼마나 도구를 많이 소비하는지 보여준다. 반면 세션 3은 14번으로 끝났다. 문제가 명확하게 정의된 세션은 효율이 다르다.

세션 2에서 배운 건 하나다. "다 올려줘"라는 프롬프트는 너무 넓다. 워크플로우 문제인지, 포맷 문제인지, 인증 문제인지 구분이 안 된 상태에서 Claude가 할 수 있는 건 모든 걸 시도해보는 것뿐이다. 그 결과가 307번이다.

세션 3의 프롬프트는 달랐다. "3개 포스트가 HTTP 403으로 실패한다. 원인 진단하고 재시도 로직, 헤더, 로깅을 추가해라." 범위가 명확하니 14번으로 끝났다.

> 프롬프트를 좁히는 게 Claude Code를 빠르게 만드는 가장 확실한 방법이다.
