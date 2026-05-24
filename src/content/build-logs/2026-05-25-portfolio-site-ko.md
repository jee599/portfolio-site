---
title: "Vercel 배포 4번 CANCELED — 481개 파일 검증 후 진짜 원인은 CountUp.tsx였다"
project: "portfolio-site"
date: 2026-05-25
lang: ko
tags: [claude-code, debugging, vercel, nextjs, yaml]
description: "Vercel 배포 4번 CANCELED. YAML frontmatter 에러로 추정해 481개 파일을 전부 파싱했지만 깨진 파일 0개. 진짜 원인은 누락된 CountUp.tsx 컴포넌트였다. 2세션 218 tool calls의 디버깅 기록."
---

4일 동안 Vercel 배포가 전부 CANCELED 상태였다. 프로덕션은 4/26 수동 배포 버전에서 멈춰 있었고, 그 이후 올린 기사는 하나도 반영되지 않았다.

**TL;DR** 진짜 원인은 YAML이 아니었다. `CountUp.tsx` 파일 하나가 빠져 있었고 Turbopack이 그걸 빌드 실패로 처리했다. YAML은 481개 파일 전부 이상 없음.

## 증상 — 에러 메시지가 YAML을 가리켰다

에러 메시지는 명확해 보였다.

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

파일도 지목됐다: `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`. 4/27, 4/28 GitHub push로 트리거된 Vercel 배포가 전부 CANCELED됐다. 사용자의 가설은 합리적이었다. 에러 메시지가 YAML을 가리켰고, 최근 콘텐츠 validation 로직을 추가한 커밋(`feat(validate-content): integrate 5요소 quality-checks`)도 의심 대상이었다.

## Session 1 — gray-matter로 481개 파일 전부 검증

첫 번째 접근: `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/` 전체 MD 파일을 `gray-matter`로 파싱. 481개 파일, 깨진 파일 0개.

지목된 furiosa 파일의 line 3은 204자였다. 4/14 배치 수정에서 이미 정리된 상태. 에러 메시지의 `column 277` 패턴과 맞지 않았다.

여기서 전환점이 왔다. YAML 검증이 통과했으니 빌드를 직접 돌려보자.

```bash
npm run build
```

다른 에러가 떴다.

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx`가 `CountUp.tsx`를 import하고 있는데 파일 자체가 없었다. Next.js 16 기본값인 Turbopack이 이 누락을 빌드 실패로 처리했다. Vercel에서 표시된 `YAMLException` 메시지는 이전 배포 실패와 뒤섞인 오래된 로그거나 misleading한 wrapper 에러였다.

## Session 2 — systematic-debugging 스킬 적용, 다시 같은 지점에서 시작

두 번째 세션은 독립적으로 같은 프롬프트로 시작됐다. 이번엔 `systematic-debugging` 스킬을 적용하고 더 체계적으로 접근했다.

`js-yaml`로 직접 파싱, `validate-content.mjs` 코드 분석(line 559의 `matter.stringify` 로직 확인), 최근 커밋 히스토리 탐색. 117 tool calls를 써서 481개 파일을 재검증했다.

과정에서 `content/daily/2026-04-10-en.md`와 `2026-04-10.md` 두 파일에 frontmatter가 아예 없는 걸 발견했다. 실제 문제이긴 했지만 배포를 CANCELED 상태로 만드는 직접 원인은 아니었다.

Session 2는 thoroughness 측면에선 맞는 접근이었지만, Session 1에서 이미 진짜 원인을 찾았기 때문에 중복 탐색이 됐다. 두 세션이 독립적으로 시작된 결과다.

## 수정 — CountUp.tsx 생성 + daily 파일 2개 복구

수정 내용은 단순했다. `CountUp.tsx` 컴포넌트를 생성하고, frontmatter가 누락된 두 daily 파일을 올바른 구조로 변환했다.

빌드 검증:

```bash
npm run build
# → 480 static pages generated
```

480개 정적 페이지 생성 확인. `8aa059b` 커밋 후 `origin/main` push. Vercel auto-deploy가 재개됐다.

## 세션 통계

| 항목 | 수치 |
|------|------|
| 세션 수 | 3 |
| 모델 | claude-opus-4-7 |
| 총 소요 시간 | 약 23분 |
| 총 tool calls | 218 |
| Bash | 178 |
| Read | 30 |
| TodoWrite | 5 |
| Write / Edit | 각 1 |
| 생성 파일 | `CountUp.tsx` |
| 수정 파일 | `HomeContent.tsx` + daily 2개 |

Bash가 178회로 압도적이다. 481개 파일 파싱, `validate-content.mjs` 분석, 빌드 실행, 커밋/push까지 전부 Bash였다.

## 회고 — 로컬 빌드 재현이 먼저다

증상과 원인이 다른 케이스의 전형이었다.

에러 메시지가 YAML을 지목해도, 실제 빌드를 재현해보기 전까지 확신할 수 없다. `gray-matter` 검증은 필요한 단계였지만, 그보다 먼저 로컬에서 같은 에러를 재현했다면 2세션 22분이 아니라 5분에 끝났을 것이다.

> 로컬에서 재현 안 되면, 가설을 버리고 빌드 파이프라인 전체를 다시 봐야 한다.

`npm run build` 한 번이 481개 파일 검증보다 빠른 진단 도구였다. `systematic-debugging` 스킬의 핵심은 증상 레이어가 아니라 실행 레이어에서 재현하는 것이다.
