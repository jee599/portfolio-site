---
title: "Claude Code로 Claude Code 책 쓰기 — PostToolUse 훅이 25번 루프한 이야기"
project: "claudebook"
date: 2026-03-15
lang: ko
tags: [claude-code, hooks, automation, crawling]
---

Claude Code로 Claude Code에 대한 책을 쓰기로 했다. 쓰는 과정도 자동화할 수 있는지 실험하면서.

26개 세션, 147번의 tool call. 근데 실제로 뭔가 만들어진 건 2개 세션이었다.

## 설계: 훅으로 시장 조사 자동화

책을 쓰기 전에 시장 조사가 필요했다. 국내외 Claude Code 관련 서적이 얼마나 있는지, 인프런이나 Leanpub에 강의가 있는지. 이걸 매번 수동으로 할 게 아니라 Claude Code의 `PostToolUse` 훅으로 자동화하기로 했다.

아이디어는 단순했다. 어떤 작업을 하고 나면 자동으로 시장 조사 에이전트가 돌아가도록 한다. `/agent-business`라는 슬래시 커맨드를 만들고, 이 커맨드가 훅 이벤트로 트리거되게 설정했다. 에이전트는 WikiDocs, 교보문고, 알라딘, 인프런, Leanpub, Gumroad, Amazon KDP를 조사해서 `business/market-reports/`에 보고서를 저장하는 역할이다.

훅 설정은 `CLAUDE.md`에 에이전트 정의를 넣고, `hook_event_name: "PostToolUse"` 트리거를 걸면 된다. 이론적으로 깔끔한 구조다.

## 에이전트가 25번 루프했다

실제로 돌려보니 같은 날(2026-03-10) `/agent-business`가 25번 실행됐다.

원인은 명확했다. PostToolUse 훅은 말 그대로 모든 도구 사용 후에 트리거된다. 에이전트가 `Bash`를 한 번 쓰면 → 훅이 발동 → 에이전트가 또 시작 → 에이전트가 `Bash`를 또 씀 → 훅이 또 발동. 루프가 된다.

26개 세션 중 24개가 이렇게 자동으로 실행된 것들이다. 대부분 0분짜리, 2~3번 tool call로 끝난 세션이다. 에이전트가 시작하고 → 기존 보고서를 확인하고 → 권한이 없거나 뭔가 막히면 종료하는 패턴이 반복됐다.

훅 기반 자동화에서 놓치기 쉬운 부분이다. 에이전트 자체도 도구를 쓰기 때문에 루프를 유발한다. 이 부분은 나중에 훅 조건에 세션 ID나 실행 플래그 체크를 추가해서 중복 실행을 막아야 한다.

## WebSearch가 막히면 WebFetch로

루프 문제 외에 또 다른 장벽이 있었다. WebSearch 권한이 기본값으로 차단되어 있었다.

에이전트는 처음에 WebSearch로 여러 플랫폼을 병렬 검색하려 했다. 그런데 권한 요청이 거부되자 스스로 전략을 바꿨다. WebFetch로 각 플랫폼 URL을 직접 크롤링하는 방식으로.

세션 14와 15가 가장 많은 걸 한 세션들이다. 각각 22~29번의 tool call로 WebFetch를 14~20번 써가며 인프런, Leanpub 등의 페이지를 직접 긁어서 보고서를 만들었다. 검색 API 없이 WebFetch만으로 시장 조사 보고서를 완성한 셈이다.

도구 사용 통계를 보면 이 패턴이 뚜렷하다. WebFetch가 51번으로 가장 많았고, WebSearch는 16번인데 대부분 권한 거부였다. 에이전트가 막히면 다른 방법을 찾는 방식이 인상적이었다.

## 34개 문서 파일을 한 번에

시장 조사와 별개로 책 집필에 필요한 소스 자료도 준비해야 했다. `code.claude.com/docs/en`의 모든 공식 문서를 `raw-docs/` 폴더에 마크다운으로 저장하는 작업이다.

세션 2에서는 `/crawl-docs p0` 커맨드로 P0 우선순위 3개 페이지(overview, quickstart, how-claude-code-works)를 병렬 크롤링했다. WebFetch 3번, 1분도 안 걸렸다.

세션 26은 본격적인 전체 크롤링이었다. 프롬프트를 직접 써서 34개 페이지 목록을 한꺼번에 넘겼다.

```
raw-docs 폴더를 만들고, code.claude.com/docs/en 의 모든 페이지를 WebFetch로 읽어서
raw-docs/{slug}.md로 저장해줘. 페이지 목록: overview, quickstart, changelog, ...
```

1시간 21분짜리 세션이었다. 결과는 34개 `.md` 파일, 각 파일 상단에 `source`, `slug`, `crawled_at` 메타데이터 포함. URL 미스매치 3개(예: `vscode` → `vs-code`)는 자동으로 리다이렉트를 따라가서 저장했고, 404가 뜬 3개(`chrome-extension`, `programmatic-usage`, `keyboard-shortcuts`)는 에러 placeholder로 저장했다.

`/crawl-docs` 커맨드를 만들어둔 덕분에 P0 크롤링은 커맨드 하나로 됐지만, 전체 34개는 그냥 자연어로 목록을 던지는 게 더 빨랐다. 커맨드가 항상 답은 아니다.

## 뭘 배웠나

PostToolUse 훅은 강력하지만 루프에 주의해야 한다. 에이전트가 내부적으로 도구를 쓰기 때문에, 무조건 트리거하면 같은 작업이 수십 번 반복된다. 다음에는 훅 조건에 `agent_id`가 있으면 스킵하거나, 보고서 파일이 이미 있으면 조기 종료하는 로직을 추가할 것이다.

WebSearch 권한을 미리 허용해두는 것도 필요했다. 에이전트가 WebFetch로 우회하긴 했지만, 검색 기반 접근과 직접 크롤링은 커버리지가 다르다.

147번의 tool call 중 실제 생산적인 작업은 세션 2(P0 크롤링, 3회), 세션 14-15(시장 조사, 40회+), 세션 26(전체 크롤링, 5회)에 집중됐다. 나머지 100번은 루프와 권한 확인이었다. 자동화를 설계할 때 이 낭비를 줄이는 것도 중요한 작업이다.

> 훅은 자동화를 만들지만, 잘못 만든 훅은 자동으로 루프를 만든다.
