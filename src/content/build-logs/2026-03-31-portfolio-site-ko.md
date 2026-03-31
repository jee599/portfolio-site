---
title: "브라우저 캐시에 1년간 박힌 깨진 이미지, Claude가 찾아낸 방법"
project: "portfolio-site"
date: 2026-03-31
lang: ko
tags: [claude-code, vercel, godot, devto, parallel-agents, debugging]
description: "immutable 캐시가 이미지를 1년간 잠근 원인 분석부터, Vercel 빌드 취소 우회, 221 tool calls Godot 게임 개발까지. 9개 세션, 406번 도구 호출의 기록."
---

9개 세션, 406번의 도구 호출, 수정 파일 25개. 2026-03-31 기준으로 최근 작업 흐름을 정리한다.

**TL;DR** `vercel.json`의 `immutable` 캐시가 깨진 이미지를 브라우저에 1년째 가두고 있었다. 파일명 변경으로 캐시를 우회했고, Vercel 빌드 취소 문제는 `npx vercel deploy --prod`로 해결했다.

## 1년짜리 캐시에 갇힌 이미지

배포 직후 썸네일이 깨졌다. 파일을 올바른 JPEG로 교체했는데도 브라우저에는 여전히 깨진 이미지가 보였다.

Claude에게 던진 프롬프트는 이랬다.

```
이전 fix에서 이미지를 올바른 JPEG로 교체했는데 라이브 사이트에서 여전히 깨짐.
실제 파일이 유효한지, frontmatter가 맞는지 확인해줘.
```

49번의 도구 호출 후 Claude가 찾아낸 원인은 코드가 아니었다.

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

`immutable`이 문제였다. 최초 요청 때 깨진 HTML 파일이 `.jpg`로 저장됐고, 브라우저가 그걸 1년 TTL의 `immutable` 응답으로 캐시했다. 이후 서버에서 파일을 올바르게 교체해도 브라우저는 캐시된 파일을 그냥 쓴다. `immutable`이란 "이 파일은 절대 바뀌지 않는다"는 선언이기 때문이다.

해결책은 파일명 변경이었다. `-01.jpg`에서 `-02.jpg`로 rename하면 새 URL이 되고, 캐시 키가 달라지니 브라우저가 서버에서 새로 받는다. frontmatter 4개를 수정하고 구 파일을 삭제했다. Bash 31번, Read 12번, Edit 4번.

## Vercel 빌드가 계속 취소되는 문제

`git push`를 3번 해도 Vercel 빌드가 시작조차 안 됐다. 빌드 로그도 없이 "CANCELED" 상태가 반복됐다.

```
git push로 3번 푸시했는데 Vercel이 전부 취소함. 빌드가 아예 안 시작됨.
최신 main을 프로덕션에 올려줘.
```

Claude가 선택한 방법은 단순했다.

```bash
npx vercel deploy --prod
```

55초 만에 164개 정적 페이지가 빌드됐고 프로덕션에 올라갔다. git 트리거 방식이 아닌 직접 배포로 우회한 것이다. Bash 5번으로 끝났다.

git 연동 자동 배포가 실패할 때 `vercel deploy --prod`는 빠른 우회 수단이 된다. 단, 이게 반복되면 Vercel 프로젝트 설정이나 branch protection 규칙을 점검해야 한다.

## 데일리 브리핑 영어 버전 추가

spoonai.me의 `content/daily/` 디렉토리는 `YYYY-MM-DD.md` 한국어 단일 파일만 있었다. 포스트 쪽은 이미 `-ko.md`, `-en.md` 양쪽을 지원하는데 데일리 브리핑만 빠져있었다.

1시간 27분, 39번의 도구 호출이 들어갔다. 변경 범위는 4개 파일이었다.

- `lib/content.ts` — `getDailyBriefing(date, lang?)` 시그니처 변경, `hasDailyEnVersion()` 추가
- `app/daily/[date]/page.tsx` — ko/en 두 버전 동시 fetch
- `components/DailyBriefing.tsx` — 탭 UI 추가
- `content/daily/2026-03-30-en.md` — 첫 영어 데일리 생성

코드만 바꾼 게 아니다. `~/Documents/Claude/Scheduled/spoonai-site-publish/SKILL.md`의 STEP 3.6에 영어 데일리 생성 로직을 추가하고, `~/.claude/skills/spoonai-daily-briefing/SKILL.md`도 동기화했다. 코드와 자동화 명세를 함께 관리하는 패턴이다. Claude가 다음 자동화 세션에서 영어 데일리를 빠뜨리지 않으려면 SKILL.md가 업데이트되어 있어야 한다.

## 221번의 도구 호출: Godot 게임 개발

guild-master 프로젝트. Godot 4 기반 길드 경영 시뮬레이션이다. `feature_list.json`에 68개 기능이 `failing` 상태로 있었다.

프롬프트는 간결했다.

```
feature_list.json의 failing 기능을 Phase 1부터 순서대로 전부 구현해.
하나 끝나면 바로 다음 것 진행. 모든 기능이 passing이 될 때까지 멈추지 마.
```

2시간 47분, 221번 도구 호출. Agent 도구를 21번 호출해서 병렬로 작업을 분산했다.

- Phase 1: 데이터 파일 12개 + 모델 8개 + Autoload 싱글톤 11개
- Phase 2: 용병 시스템 로직 + UI 병렬 처리
- 씬 파일, GDScript, 테스트 업데이트

구현 후 실제 실행하면 버그들이 쏟아졌다. "회색 화면", "new game에서 아무것도 동작 안 해", "포메이션 셋업에서 진행 안 돼" 같은 피드백이 계속 이어졌다. 대규모 일괄 구현의 한계다. 기능 목록이 `passing`으로 바뀌어도 실제 게임 흐름은 따로 검증해야 한다.

Claude Code로 Godot 프로젝트를 다룰 때의 현실이다. GDScript 문법 오류는 빌드 없이 잡기 어렵고, 씬 파일(`.tscn`)의 노드 참조 문제는 에디터를 열어봐야 확인된다. Bash 34번 중 상당수가 Godot 에디터를 CLI로 검증하려는 시도였다.

## DEV.to 발행 파이프라인

`blog-factory/devto/`에 있는 영어 포스트 2개를 DEV.to에 올리는 작업이었다. 절차는 단순해 보였다.

먼저 `cover_image` R2 URL과 본문 내 히어로 이미지 태그를 제거했다. 이미지 파일이 R2에 없으므로 그냥 두면 깨진 이미지가 뜬다. Glob 2번 + Read 2번 + Edit 2번으로 끝났다.

문제는 API 발행이었다.

```
API key는 환경변수나 설정 파일에서 찾아봐.
~/.devto, ~/.config/devto, .env, 프로젝트 내 어딘가에 있을 거야.
이전 DEV.to 글이 있었으니 어딘가에 키가 있을 거야.
```

Claude가 Bash 15번으로 파일시스템 전체를 뒤졌지만 키를 찾지 못했다. `~/.devto`, `~/.config/devto`, `.env`, `wrangler.toml`, `package.json` scripts까지 뒤졌다. 이전에 수동으로 발행했거나 다른 시스템에서 관리했을 가능성이 높다. DEV.to API 키는 직접 환경변수로 설정해야 했다.

GitHub Actions 워크플로우(`.github/workflows/publish-devto.yml`)도 없었다. 자동 발행 파이프라인은 아직 없는 상태다.

## 도구 사용 패턴

```
전체 통계: 406 tool calls
- Read:       148 (36%) — 코드 파악이 작업 시간의 절반
- Bash:       117 (29%) — 빌드, 배포, 파일시스템 검색
- Edit:        43 (11%) — 실제 코드 변경
- Agent:       21 (5%)  — 병렬 작업 분산
- Write:       16 (4%)  — 새 파일 생성
```

Read가 Bash보다 많다. 코드를 이해하는 데 구현보다 더 많은 시간이 든다는 뜻이다. Edit이 43번인데 변경된 파일은 25개다. 파일당 평균 1.7번 수정했다는 의미이고, 한 번에 제대로 고치는 경우가 많았다는 뜻이기도 하다.

## 이번 사이클에서 배운 것

캐시 전략은 배포 전에 검토해야 한다. `immutable`은 CDN 성능을 위해 유용하지만, 파일 내용이 바뀔 가능성이 있는 경로에 적용하면 디버깅이 어려워진다. 이미지 경로에 해시나 버전을 포함하는 패턴이 더 안전하다.

"전부 구현해" 프롬프트는 뼈대를 빠르게 세울 때 유효하다. 하지만 게임 루프 품질은 개발자가 직접 플레이하며 검증해야 한다. 221번 도구 호출이 feature list를 passing으로 바꿔줘도, 실제 사용자 경험은 별개 문제다.
