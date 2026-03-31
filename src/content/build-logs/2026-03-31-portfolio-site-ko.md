---
title: "GitHub Actions 워크플로우가 처음부터 죽어있었다 — SyntaxError, 텔레그램 좀비 프로세스, 그리고 700번의 도구 호출"
project: "portfolio-site"
date: 2026-03-31
lang: ko
tags: [claude-code, github-actions, devto, debugging, automation, telegram, mcp]
description: "DEV.to 자동 발행 const lang SyntaxError, 텔레그램 MCP 409 Conflict 좀비 프로세스, immutable 캐시에 갇힌 이미지. 18세션, 700번 도구 호출의 기록."
---

18세션, 700번의 도구 호출. 오늘 작업의 핵심은 "처음부터 망가진 것들을 발견하는 날"이었다. DEV.to 자동 발행 워크플로우는 만들어진 순간부터 `SyntaxError`로 죽어있었고, 텔레그램 봇은 좀비 프로세스 4개가 서로 충돌하고 있었다.

**TL;DR** `const lang` 이중 선언과 파일 경로 불일치 두 가지를 고치자 DEV.to 자동 발행이 살아났다. 텔레그램 409 Conflict는 좀비 프로세스 정리로 해결했다.

## 1년짜리 캐시에 갇힌 이미지

spoonai.me 배포 직후 Harvey AI, Mistral Voxtral 기사 썸네일이 깨졌다. 올바른 JPEG로 교체했는데도 브라우저에는 여전히 깨진 이미지가 보였다. Bash 31번 끝에 찾은 원인은 `vercel.json`이었다.

```json
{
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

최초 요청 때 깨진 HTML 파일이 `.jpg`로 저장됐고, 브라우저가 그걸 1년 TTL의 `immutable` 응답으로 캐시했다. `immutable`은 "이 파일은 절대 바뀌지 않는다"는 선언이다. 서버에서 파일을 교체해도 브라우저는 캐시에서 꺼낸다.

해결은 파일명 변경이었다. `-01.jpg`에서 `-02.jpg`로 rename하면 URL이 달라지고, 캐시 키가 바뀌니 브라우저가 서버에서 새로 받는다.

> `immutable` 캐시는 콘텐츠 해시가 포함된 경로에만 쓴다. `/images/` 같은 일반 경로에 붙이면 파일 교체가 불가능해진다.

## Vercel 빌드 취소 우회

`git push`를 3번 해도 Vercel 빌드가 시작조차 안 됐다. "CANCELED" 상태가 반복됐고 빌드 로그도 없었다. Claude가 선택한 방법은 단순했다.

```bash
npx vercel deploy --prod
```

55초 만에 164개 정적 페이지가 빌드됐다. Bash 5번. git 연동 자동 배포가 실패할 때 `vercel deploy --prod`는 빠른 우회 수단이다.

## 처음부터 망가진 DEV.to 파이프라인

영어 포스트 2개를 DEV.to에 올리려 했다. API 키를 로컬에서 찾을 수 없어 GitHub Actions 워크플로우로 방향을 바꿨다.

`.github/workflows/publish-to-devto.yml`을 확인했다. 트리거 조건은 `src/content/blog/` 경로에 파일이 push될 때였다. EN 파일들은 `blog-factory/devto/`에만 있었다. 트리거 자체가 안 됐다.

더 심각한 문제가 있었다. 워크플로우 스크립트 안에 `const lang`이 같은 스코프에 두 번 선언되어 있었다.

```javascript
// publish-to-devto.yml 내부 Node.js 스크립트
const lang = file.includes('-en.') ? 'en' : 'ko'
// ... 수십 줄 후 ...
const lang = frontmatter.lang || 'ko'  // SyntaxError!
```

`SyntaxError: Identifier 'lang' has already been declared`. 워크플로우가 생성된 순간부터 이 에러가 있었다. 한 번도 성공한 적이 없었다.

수정은 간단했다.

```bash
# 1. SyntaxError 수정 — Edit 1번
const lang = file.includes('-en.') ? 'en' : 'ko'
const effectiveLang = frontmatter.lang || lang  # 변경

# 2. 파일을 올바른 위치로 이동
cp blog-factory/devto/claude-agent-sdk-deep-dive-en.md \
   src/content/blog/claude-agent-sdk-deep-dive-en.md

# 3. main push → 워크플로우 자동 트리거
git push origin main
```

Claude Agent SDK 포스트는 즉시 발행됐다. Harness CI/CD는 429 rate limit으로 실패해서 `gh workflow run`으로 수동 재실행했다.

API 키를 찾으려고 Bash를 21번 돌리는 삽질이 없었다면, GitHub Actions로 방향을 바꾸지 않았을 것이고, `SyntaxError`를 얼마나 더 모른 채로 뒀을지 모른다. 삽질이 오히려 숨겨진 버그를 드러냈다.

## 텔레그램 MCP 409 Conflict — 좀비 프로세스 4마리

텔레그램 봇에 메시지를 보내도 답장이 없었다. 세션 12에서 16까지 이 문제만 파고들었다.

처음엔 설정 문제인 줄 알았다. 토큰, DM 정책, allowlist 전부 정상이었다. `getUpdates` API도 정상 응답했다. 그런데 메시지가 안 왔다.

원인은 서버 로그에 있었다.

```
409 Conflict: Terminated by other getUpdates request;
make sure that only one bot instance is running
```

Claude Code 세션을 재시작할 때마다 텔레그램 MCP 서버가 새로 뜨는데, 이전 프로세스가 제대로 종료되지 않았다. `ps aux | grep "bun server.ts"`를 돌려보니 프로세스가 4개였다. Telegram Bot API는 동시에 하나의 `getUpdates` 연결만 허용하기 때문에 4개가 서로 충돌하면 메시지가 분산되거나 아무도 못 받는다.

```bash
# 좀비 프로세스 전부 종료
kill -9 20895 21043 21156 21289
```

정리 후 `/reload-plugins`로 플러그인을 재로드하니 봇이 정상 동작했다. 6세션, Bash 46번, Read 20번.

> Claude Code 세션을 자주 재시작하는 환경에서는 MCP 서버 좀비 프로세스가 누적된다. 봇 연결이 안 되면 먼저 `ps aux | grep`으로 중복 프로세스를 확인한다.

## 도구 사용 통계

```
전체: ~700 tool calls
- Bash:   ~230 (33%) — 배포, 탐색, 프로세스 관리
- Read:   ~180 (26%) — 코드 파악
- Edit:    ~50 (7%)  — 실제 코드 변경
- WebFetch: ~53 (8%) — 네이버 블로그 파싱
- Write:   ~16 (2%)  — 새 파일 생성
- Agent:   ~21 (3%)  — 서브에이전트 분산
```

Bash와 Read가 59%다. 구현보다 탐색과 검증에 더 많은 시간이 들었다. Edit이 50번인데 수정 파일은 26개. 파일당 평균 약 2회 수정.

## 이번 사이클에서 배운 것

GitHub Actions 워크플로우는 만들고 나서 반드시 `gh run list`로 실제 성공 여부를 확인한다. SyntaxError로 처음부터 망가진 워크플로우가 아무 알림 없이 조용히 실패하고 있었다.

MCP 플러그인이 응답 없을 때 프로세스 중복부터 의심한다. 설정이 정상이고 API가 응답해도 봇이 먹통이면 `ps aux`가 먼저다.

`immutable` 캐시는 콘텐츠 해시 포함 경로에만 쓴다. 일반 `/images/` 경로에 붙이면 파일 교체가 사실상 불가능해진다.
