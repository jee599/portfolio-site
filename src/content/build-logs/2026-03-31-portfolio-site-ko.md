---
title: "DEV.to 자동 발행 워크플로우, 처음부터 망가져 있었다 — const lang 버그 발견기"
project: "portfolio-site"
date: 2026-03-31
lang: ko
tags: [claude-code, github-actions, devto, debugging, automation, vercel]
description: "immutable 캐시가 깨진 이미지를 1년간 잠근 원인 분석부터, DEV.to 자동 발행 워크플로우의 const lang SyntaxError 발견까지. 11세션, 452번 도구 호출의 기록."
---

11세션, 452번의 도구 호출, 수정 파일 26개, 생성 파일 14개. 오늘 작업에서 가장 인상적인 발견은 DEV.to 자동 발행 워크플로우가 만들어진 순간부터 단 한 번도 성공한 적이 없었다는 사실이었다.

**TL;DR** `const lang` 이중 선언 `SyntaxError`로 GitHub Actions가 처음부터 죽어있었다. 변수 이름을 `effectiveLang`으로 바꾸고 EN 파일을 올바른 디렉토리에 옮기자 자동 발행 파이프라인이 살아났다.

## 1년짜리 캐시에 갇힌 이미지

spoonai.me 배포 직후 Harvey AI, Mistral Voxtral 기사 썸네일이 깨졌다. 올바른 JPEG로 교체했는데도 브라우저에는 여전히 깨진 이미지가 보였다.

```
이전 fix에서 이미지를 올바른 JPEG로 교체했는데 라이브 사이트에서 여전히 깨짐.
실제 파일이 유효한지, frontmatter가 맞는지 확인해줘.
```

49번의 도구 호출 끝에 찾아낸 원인은 코드가 아니었다.

```json
// vercel.json
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

해결은 파일명 변경이었다. `-01.jpg`에서 `-02.jpg`로 rename하면 URL이 달라지고, 캐시 키가 바뀌니 브라우저가 서버에서 새로 받는다. frontmatter 4개 수정 + 구 파일 삭제. Bash 31번, Read 12번, Edit 4번.

## Vercel 빌드 취소 우회

`git push`를 3번 해도 Vercel 빌드가 시작조차 안 됐다. "CANCELED" 상태가 반복됐고 빌드 로그도 없었다.

Claude가 선택한 방법은 단순했다.

```bash
npx vercel deploy --prod
```

55초 만에 164개 정적 페이지가 빌드됐고 프로덕션에 올라갔다. Bash 5번으로 끝났다. git 연동 자동 배포가 실패할 때 `vercel deploy --prod`는 빠른 우회 수단이다.

## 데일리 브리핑 영어 버전 추가

spoonai.me의 `content/daily/`는 한국어 단일 파일만 있었다. 포스트는 `-ko.md`, `-en.md`를 지원하는데 데일리만 빠져있었다.

1시간 27분, 39번의 도구 호출. 변경 범위는 4개 파일이었다.

`lib/content.ts`에서 `getDailyBriefing(date, lang?)`으로 시그니처를 바꾸고 `hasDailyEnVersion()` 함수를 추가했다. `app/daily/[date]/page.tsx`는 ko/en 두 버전을 동시에 fetch하고, `DailyBriefing.tsx`에 탭 UI를 붙였다.

코드만 바꾼 게 아니다. `~/Documents/Claude/Scheduled/spoonai-site-publish/SKILL.md`의 STEP 3.6에 영어 데일리 생성 로직을 추가하고, `~/.claude/skills/spoonai-daily-briefing/SKILL.md`도 동기화했다. 코드와 자동화 명세를 함께 관리하는 패턴이다. Claude가 다음 자동화 세션에서 영어 데일리를 빠뜨리지 않으려면 SKILL.md가 업데이트되어 있어야 한다.

## 처음부터 망가진 DEV.to 파이프라인

영어 포스트 2개(`claude-agent-sdk-deep-dive-en.md`, `harness-cicd-deep-dive-en.md`)를 DEV.to에 올리려 했다. 먼저 `cover_image` R2 URL과 히어로 이미지 태그를 제거했다. 이미지 파일이 R2에 없으니 그냥 두면 깨진다. Glob 2번 + Read 2번 + Edit 2번으로 끝.

문제는 발행이었다. API 키를 로컬에서 찾을 수 없었다.

```bash
# Claude가 뒤진 곳들 (Bash 21번)
~/.devto, ~/.config/devto, .env, .env.local,
.env.production, wrangler.toml, macOS 키체인...
# 전부 없음
```

GitHub 시크릿에 `DEVTO_API_KEY`가 있다는 건 알았지만, 시크릿은 쓰기 전용이라 값을 읽을 수 없다. 그래서 GitHub Actions 워크플로우로 방향을 바꿨다.

`.github/workflows/publish-to-devto.yml`을 확인했다. 트리거 조건은 `src/content/blog/` 경로에 파일이 push될 때였다. 근데 EN 파일들은 `blog-factory/devto/`에만 있었고 `src/content/blog/`에는 없었다. 그러니까 trigger 자체가 안 됐다.

더 심각한 문제가 있었다. 워크플로우 스크립트에서 `const lang`이 같은 스코프에 두 번 선언되어 있었다.

```javascript
// publish-to-devto.yml 내부 Node.js 스크립트
const lang = file.includes('-en.') ? 'en' : 'ko'
// ... 수십 줄 후 ...
const lang = frontmatter.lang || 'ko'  // SyntaxError!
```

`SyntaxError: Identifier 'lang' has already been declared`. 워크플로우가 생성된 순간부터 이 에러가 있었다. 이전에 수동으로 gh run list를 확인했다면 진작에 발견했을 것이다.

수정은 간단했다. 두 번째 선언을 `effectiveLang`으로 바꾸고, EN 파일 2개를 `src/content/blog/`에 복사했다.

```bash
# 1. SyntaxError 수정 — Edit 1번
const lang = file.includes('-en.') ? 'en' : 'ko'
const effectiveLang = frontmatter.lang || lang  # 변경

# 2. 파일을 올바른 위치로
cp blog-factory/devto/claude-agent-sdk-deep-dive-en.md \
   src/content/blog/claude-agent-sdk-deep-dive-en.md

# 3. main push → 워크플로우 자동 트리거
git push origin main
```

push하자 워크플로우가 트리거됐다. Claude Agent SDK 포스트는 발행 성공. Harness CI/CD는 429 rate limit으로 실패. `gh workflow run`으로 수동 재실행해서 최종 성공.

API 키를 찾으려고 Bash를 21번 돌리는 과정이 없었다면, GitHub Actions로 방향을 전환하지 않았을 것이고, 워크플로우의 `SyntaxError`를 얼마나 더 모른 채로 뒀을지 모른다. 삽질이 오히려 숨겨진 버그를 드러냈다.

## 도구 사용 통계

```
전체: 452 tool calls
- Bash:   157 (35%) — 빌드, 배포, 파일시스템 탐색
- Read:   152 (34%) — 코드 파악이 작업의 1/3
- Edit:    45 (10%) — 실제 코드 변경
- Agent:   21 (5%)  — 병렬 서브에이전트 분산
- Write:   16 (4%)  — 새 파일 생성
```

Read와 Bash가 전체의 69%다. 코드 파악과 검증이 구현보다 훨씬 더 많은 시간을 차지한다는 뜻이다. Edit이 45번인데 수정 파일은 26개다. 파일당 평균 1.7회 수정. 한 번에 제대로 고치는 경우가 많았다.

## 이번 사이클에서 배운 것

`immutable` 캐시는 배포 전에 검토해야 한다. CDN 성능엔 유용하지만, 파일 내용이 바뀔 수 있는 경로에 쓰면 디버깅이 어려워진다. 이미지 경로에 해시나 버전을 포함하는 패턴이 더 안전하다.

GitHub Actions 워크플로우는 `gh run list`로 주기적으로 확인해야 한다. SyntaxError로 처음부터 망가진 워크플로우가 아무 알림 없이 조용히 실패하고 있었다. CI 파이프라인은 만들고 나서 실제로 한 번은 실행됐는지 확인해야 한다.
