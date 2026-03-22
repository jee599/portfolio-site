---
title: "289 tool calls로 블로그 자동 발행 파이프라인을 하루 만에 만들었다"
project: "portfolio-site"
date: 2026-03-23
lang: ko
pair: "2026-03-23-portfolio-site-en"
tags: [claude-code, automation, skills, agentcrow]
description: "소재 하나를 던지면 spoonai·DEV.to·네이버에 동시 발행하는 auto-publish 스킬을 22시간 39분, 289 tool calls 만에 구축했다. Vercel 배포 블록 삽질 포함."
---

22시간 39분, 289번의 tool call. 그리고 Vercel 배포가 두 시간 동안 막혔다.

**TL;DR** 소재(URL·키워드·파일)를 던지면 spoonai.me, DEV.to, 네이버 블로그 세 곳에 동시 발행하는 `auto-publish` 스킬을 만들었다. 중간에 git author 불일치로 Vercel 배포가 막히는 삽질이 있었다.

## 발단: "글 줄테니까 dev.to에 업데이트 해줘"

텔레그램으로 메시지가 왔다. "포트폴리오 사이트에 글 줄테니까 dev.to에 업데이트 해줘."

파일 4개를 던졌다. `channels-en-part1.md`, `channels-en-part2.md`, `dispatch-en-part1.md`, `dispatch-en-part2.md`. Claude Code Channels와 Dispatch에 관한 영어 글이었다.

Claude는 파일을 확인하고 push했다. GitHub Actions가 DEV.to API로 4편을 자동 발행했다. 여기까지는 15분이면 충분했다.

문제는 그 다음에 생겼다. "올라간 저 글들에 SEO나 후킹, 광고 기술이나 조회수 높이는 기술 모두 적용해줘."

외부 작성 글이라 blog-writing 스킬 기준이 적용되지 않은 상태였다. 제목에 숫자가 없고, description이 설명형이고, 불릿 포인트가 남발됐다. 4개 글을 모두 리라이팅하기로 했다. 병렬 에이전트 4개를 동시에 돌렸다. SEO 최적화 버전으로 재작성 후 다시 push.

그러다가 자연스럽게 다음 질문이 나왔다. "사이트를 하나 만들어서 내가 소스나 주제, 사이트나 문서를 주면 자동으로 발행하게 하고 싶어."

## auto-publish 스킬을 설계하다

브레인스토밍 스킬을 먼저 돌렸다. 요구사항은 명확했다.

- URL, 키워드, md 파일 중 어떤 걸 던져도 처리할 것
- spoonai.me(한국어), DEV.to(영어), 네이버 블로그(한국어 HTML) 동시 발행
- 나만 쓸 것 — 복잡한 UI 불필요, CLI로 충분
- 각 플랫폼 SEO·후킹 로직을 모두 녹일 것

웹/텔레그램/CLI 중에 CLI를 골랐다. 결국 Claude Code 스킬로 구현하는 게 가장 빠르다는 결론.

스킬 구조는 세 단계로 잡았다. Phase 1 Ingest — 소재를 받아서 타입을 판별한다. URL이면 WebFetch, 키워드면 WebSearch, 파일이면 Read. Phase 2 Generate — 각 플랫폼 규칙에 맞게 콘텐츠 생성. Phase 3 Publish — git push 또는 queue 폴더에 저장.

`auto-publish/SKILL.md`를 처음부터 작성했다. 스킬 파일은 단순한 설명서가 아니다. Claude가 실행 중에 참조하는 런타임 명세서다. 어떤 분기를 만나면 어떻게 처리하라는 것까지 써넣어야 Claude가 판단 없이 실행한다.

## Vercel 배포가 두 시간 동안 막혔다

글 발행 후 spoonai.me 확인. `404 — This page could not be found.`

Vercel 배포 로그를 열었다.

```
Deployment Blocked
Git author jidongs45@gmail.com must have access to the team
jee599's projects on Vercel to create deployments.
```

맥 git config의 `user.email`이 `jidongs45@gmail.com`으로 설정돼 있었다. spoonai-site 레포는 `jee599` Vercel 팀 소속인데, 커밋 author가 팀 멤버가 아닌 이메일로 잡혀 있었다.

해결 시도를 순서대로 적으면:

1. git config `user.email`을 `jee599` 계정 이메일로 변경
2. 빈 커밋 push → 여전히 Blocked
3. Vercel에서 `jidonggg` 계정을 팀 멤버로 추가 시도 → "delete가 없어"
4. jee599 계정으로 직접 빈 커밋 push → 이건 됐다
5. 기존 blocked 배포들은 redeploy 불가 — "This deployment can not be redeployed"
6. 결국 새 커밋을 jee599 계정으로 만들어서 해결

이 삽질에서 쓴 tool call이 이 세션 289개의 상당 부분을 차지한다. Bash만 127번. 같은 에러 메시지를 붙여넣고 다른 해결책을 시도하는 사이클이 반복됐다.

배포 문제는 Claude가 완전히 해결하지 못하는 영역이다. Vercel 대시보드 조작, 계정 권한 설정은 사람이 직접 해야 한다. Claude는 무엇을 해야 하는지는 알려주지만, 실제로 클릭하는 건 내 손이다.

## agentcrow를 npm에 올리고 홍보하다

세 번째 세션은 `agentcrow` 프로젝트였다. Claude Code 멀티에이전트 라우팅 도구. v3.3.0에서 테스트 3개가 실패 중이었다.

원인은 `hasSubmodule` 체크 로직이었다. `existsSync`가 빈 디렉토리에도 `true`를 반환하는 문제. `agents/external/agency-agents/` 서브모듈이 비어있는데, 내부 파일 존재 여부를 확인하지 않아서 `describe.skipIf`가 동작하지 않았다.

수정 목록 10개를 분석하고 "진짜 필요한 건지" 재검증했다. 결과는 4개만 진짜였다. 나머지 6개는 있으면 좋지만 당장 필요하지 않거나, 잘못된 진단이었다. Claude가 제안한 개선안을 모두 적용하는 것보다 걸러내는 과정이 더 중요했다.

수정 후 테스트.

```
6 passed, 0 failed, 2 skipped
```

빌드도 통과. npm publish로 올렸다.

그런데 처음에 `npm publish`를 홈 디렉토리에서 실행했다.

```
npm error code ENOENT
npm error path /Users/jidong/package.json
```

`/Users/jidong/agentcrow`로 이동해서 다시 실행해야 했다. 그 다음엔 npm 인증 토큰이 `.npmrc`에 저장되지 않은 상태였다. 토큰을 직접 붙여넣어서 해결했다.

발행 후 "이거 Hackernews나 어디에 홍보할 수 없어?"라는 질문이 나왔다. 먼저 데모 영상부터 다시 찍기로 했다. `asciinema`로 설치부터 에이전트 분기까지 녹화. AgentCrow 동작 부분은 색깔과 이모티콘으로 눈에 띄게 만들었다. 기존 DEV.to 홍보 글에 데모를 추가해서 업데이트했다.

## Claude Code 스킬 시스템으로 반복을 없애다

이번 세션들에서 가장 효과적이었던 건 스킬 파일을 런타임 명세서로 쓰는 방식이다.

일반적으로 "이렇게 해줘"를 매번 프롬프트로 넣는다. 그러면 세션마다 다시 설명해야 한다. 스킬 파일에 한 번 정의해두면 `/auto-publish`로 호출할 때마다 동일한 규칙이 적용된다.

예를 들어 `auto-publish` 스킬은 이렇게 동작한다.

```
/auto-publish claude code channels에 대해서 글 써줘
```

이 한 줄이면 키워드를 검색하고, spoonai용 한국어 글과 DEV.to용 영어 글을 생성하고, 네이버 HTML 큐에 저장까지 한다. 내가 할 일은 큐 폴더의 HTML을 cowork로 네이버에 올리는 것뿐.

스킬은 코드가 아니다. 마크다운 파일이다. 수정도 빠르고, 버전 관리도 된다. Claude Code 스킬 시스템이 강력한 이유는 복잡한 워크플로우를 한 줄 명령어로 추상화할 수 있기 때문이다.

## 도구 사용 통계

세션 2 기준: Bash 127회, Agent 38회, Read 26회, Edit 26회. Bash가 압도적으로 많다. 배포 확인, 빌드 로그 확인, git 조작이 반복됐기 때문이다.

세션 3 기준: Bash 68회, Edit 25회, Read 19회, Agent 7회. 코드 수정 비중이 상대적으로 높다. 테스트 실패 수정 → 재실행 사이클이 반복됐다.

Agent 도구를 적극적으로 쓴 점이 이번 세션의 특징이다. SEO 리라이팅에서 4개 파일을 병렬 에이전트로 처리하고, agentcrow 수정에서도 파일 충돌 없는 태스크를 3개 에이전트로 동시에 돌렸다. 순차 처리 대비 체감 속도가 2~3배 빠르다.

> 반복 작업은 스킬로 추상화하고, 병렬 가능한 작업은 에이전트로 쪼갠다. 그게 Claude Code를 효율적으로 쓰는 방법이다.
