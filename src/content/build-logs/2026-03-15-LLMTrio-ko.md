---
title: "3개 LLM을 병렬로 돌리는 오케스트레이터 만들기 — LLMTrio 빌드 로그"
project: "LLMTrio"
date: 2026-03-15
lang: ko
tags: [LLM, orchestration, multi-agent, claude-code, automation]
---

Claude, Codex, Gemini를 동시에 돌려서 태스크를 모델 강점에 맞게 자동 분배하면 어떨까. 그 아이디어 하나로 시작한 게 LLMTrio다. 86세션 동안 뭘 만들었고, Claude Code를 어떻게 썼는지 기록한다.

## 프로젝트 구조

`npx llmtrio`를 실행하면 브라우저 대시보드가 열리고, 태스크를 입력하면 3개 LLM이 병렬로 처리한다. 내부는 2-phase 워크플로우다. 첫 번째 phase에서 plan을 세우고, 두 번째에서 execute한다. `scripts/octopus-core.js`가 오케스트레이션 엔진 역할을 하고, `scripts/dashboard-server.js`가 브라우저 UI를 서빙한다.

핵심 컴포넌트는 5개다. CLI 진입점(`trio` bash 스크립트, `bin/llmtrio.js`), 오케스트레이션 엔진(`octopus-core.js`), 대시보드 서버, i18n 지원(한/영), 브라우저 기반 인증. npm 패키지명 `llmtrio`, v0.1.1.

## Claude Code 활용 방식: 3단계 멀티에이전트

이 프로젝트에서 가장 흥미로웠던 건 Claude Code 자체를 LLMTrio의 오케스트레이션 대상으로 쓰면서, 동시에 Claude Code로 LLMTrio를 개발했다는 점이다.

개발 워크플로우는 3단계로 고정했다. 먼저 **architect agent**가 설계 계획을 출력한다(코드 없이 200자 이내). 그다음 scaffold agent가 뼈대 코드를 생성한다. 마지막으로 **code review agent**가 버그·보안·개선점을 최대 5개 리뷰한다. 각 단계는 이전 단계 결과를 `--- Previous phase results ---`로 전달받는다.

프롬프트 구조는 이렇다:

```
You are an architect. DO NOT write code. Output a short plan (under 200 words):
components, file structure, interactions.

User request: "..."
반드시 한국어로 응답하세요.
```

강제로 코드 작성을 막고 설계에만 집중시키는 방식이다. 이게 없으면 architect가 바로 코드를 쏟아낸다.

## 반복된 삽질 1: "claude book" 혼동

세션 기록을 보면 `claude book 프로젝트 현재 확인해줘` 라는 요청이 수십 번 등장한다. LLMTrio 컨텍스트에서 완전히 다른 프로젝트(`/Users/jidong/claude-code-book`)를 물어보는 거였다.

멀티에이전트 파이프라인은 컨텍스트를 직접 유지하지 않는다. 각 agent는 이전 phase 결과만 받는다. 그래서 "claude book이 LLMTrio를 말하는 건지, 별도 프로젝트인지" 매번 새로 추론해야 했다. 세션 22에서 code reviewer가 직접 물었다:

> "Wait — 'claude book'이 이 LLMTrio 프로젝트를 말하는 건가, 아니면 별도의 'claude book' 프로젝트가 있는 건가? 현재 작업 디렉토리는 LLMTrio이고, 수정된 파일 4개가 커밋되지 않은 상태다."

해결책은 단순했다. CLAUDE.md에 프로젝트 명칭과 경로를 명시하거나, 요청 시 경로를 직접 포함하면 된다. 컨텍스트 손실은 모델 문제가 아니라 프롬프트 설계 문제다.

## 반복된 삽질 2: TypeScript vs JavaScript

code reviewer가 86세션 내내 같은 이슈를 반복 지적했다. 설계(architect)는 `.ts`로 계획을 세우는데, scaffold는 `.js`로 구현하는 거다. 예시 하나:

세션 19 (Node.js HTTP 서버):
> "JavaScript instead of TypeScript. Plan says `server.ts`, scaffold wrote `server.js` with `require()`. Your global config says 'TypeScript 우선. JavaScript는 쓰지 않는다.' Should be `.ts` with `import http from 'http'`."

세션 28 (할일 목록 CLI):
> "설계는 TypeScript인데 구현은 JS — 아키텍처에서 `types.ts`, `store.ts` 등 TS 구조를 정했지만 scaffold는 단일 `todo.js` 파일이다."

scaffold agent 프롬프트에 `TypeScript only. Never use JavaScript.`를 추가하면 해결된다. 리뷰 단계에서 잡는 것보다 생성 단계에서 막는 게 맞다.

## 보안 이슈: Path Traversal이 3번 발견됐다

`dashboard-server.js`의 같은 코드에서 path traversal이 세션 3, 26, 59에서 각각 독립적으로 발견됐다.

```js
// 문제 코드 (dashboard-server.js:204)
const taskId = pathname.split('/api/result/')[1];
serveJson(res, path.join(RESULTS_DIR, `${taskId}.json`));
```

`taskId`에 `../../etc/passwd`를 넣으면 임의 파일을 읽을 수 있다. 수정은 한 줄이다:

```js
const taskId = path.basename(pathname.split('/api/result/')[1]);
```

같은 이슈가 3번 발견된 이유는 각 세션이 독립적이기 때문이다. 멀티에이전트 워크플로우에서 발견된 보안 이슈는 즉시 코드에 반영하고 커밋해야 다음 세션 리뷰에서 중복 검출이 안 된다. 발견 → 메모 → 나중에 수정 패턴은 에이전트 워크플로우에서 잘 동작하지 않는다.

## Credit 고갈 사건

세션 13~15에서 모델이 `<synthetic>`으로 표시되고, 모든 응답이 `Credit balance is too low`로 돌아왔다. 3개 agent를 병렬로 돌리면 API 비용이 빠르게 소진된다. 특히 architect + scaffold + reviewer를 한 태스크에 붙이면 토큰 사용량이 3배다.

이후 세션 16부터 `claude-opus-4-6`로 전환했고 크레딧을 충전했다. 모델 선택은 태스크 복잡도에 따라 조정하는 게 맞다. 설계와 리뷰는 Opus, scaffold는 Sonnet으로 분리하면 비용 대비 품질이 낫다.

## 크롤링 시도들

세션 44~61에서 Claude Code 공식 문서 크롤링을 여러 번 시도했다. 매번 비슷한 패턴으로 막혔다.

1. architect가 크롤러 설계를 출력한다 (`docs/crawler/fetcher.ts` 등)
2. scaffold가 코드를 생성하려 한다
3. WebFetch로 `docs.anthropic.com`을 요청하면 `code.claude.com`으로 리다이렉트된다
4. 파일이 생성되지 않은 상태에서 code reviewer가 "스크립트가 아직 없다"고 보고한다

세션 59에서 리뷰어가 직접 `WebFetch`로 문서를 받으려 했고 리다이렉트 문제를 발견했다. "문서가 `code.claude.com`으로 리다이렉트됐다. 새 URL로 다시 요청한다"는 기록이 남아 있다. 크롤링은 단순 fetch가 아니라 리다이렉트 처리와 robots.txt 체크가 선행돼야 한다.

## 도구 사용 통계

62개 세션 기준 집계다.

| 도구 | 호출 수 |
|------|---------|
| `Bash` | 약 70회 |
| `Read` | 약 55회 |
| `Agent` | 약 15회 |
| `Glob` | 약 12회 |
| `Write` | 4회 |
| `WebFetch` | 4회 |
| `ToolSearch` | 2회 |
| `AskUserQuestion` | 1회 |

`Read`와 `Bash`가 압도적으로 많다. 멀티에이전트 워크플로우에서 각 agent가 컨텍스트 파악을 위해 파일 탐색을 반복하기 때문이다. 이걸 줄이려면 architect 단계에서 충분한 프로젝트 컨텍스트를 주입하거나, `CLAUDE.md`에 프로젝트 구조를 명시해야 한다.

## 얻은 것

LLMTrio 자체보다 이 프로젝트에서 더 많이 배운 건 **멀티에이전트 워크플로우 설계**다.

컨텍스트는 명시적으로 주입해야 한다. agent끼리 암묵적 공유는 없다. 발견한 버그는 즉시 반영해야 다음 세션에서 중복 보고가 안 된다. 프롬프트에 제약을 강하게 걸수록(코드 금지, TypeScript 강제 등) 결과물 품질이 안정된다. 크레딧은 생각보다 빨리 소진된다 — 특히 Opus 3개를 병렬로 돌릴 때.

다음 단계는 path traversal 수정과 scaffold 프롬프트에 TypeScript 강제 조건 추가다.
