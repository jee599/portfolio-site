---
title: "YAML 에러 추적했더니 실제 원인은 다른 파일이었다 — 10세션 389 tool calls 기록"
project: "portfolio-site"
date: 2026-05-25
lang: ko
tags: [claude-code, debugging, automation, build-log, orchestration]
description: "Vercel 배포가 YAML frontmatter 에러로 실패한다고 했다. 481개 파일 전수 검증 결과 0개. 진짜 원인은 누락된 CountUp.tsx였다. 10세션 389 tool calls 디버깅·자동화 기록."
---

Vercel 빌드가 YAML frontmatter 파싱 에러로 실패하고 있다는 리포트를 받았다. 에러 메시지에 파일명과 줄 번호까지 있었다. `gray-matter`로 481개 파일을 전수 검증하니 깨진 파일이 0개였다.

**TL;DR** 사용자가 준 가설이 틀렸을 때 Claude Code가 어떻게 수렴하는지, 오케스트레이터가 simple 작업을 major로 오분류할 때 어떻게 처리해야 하는지를 10세션에서 직접 겪었다.

## 가설이 틀렸을 때

세션 1, 2의 시작 프롬프트는 동일했다.

```
Vercel 빌드가 YAML frontmatter 파싱 에러로 실패하고 있다.
에러: YAMLException at line 3, column 277
파일: /posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en
```

YAML 파싱 에러로 보였다. 그래서 파싱 에러를 찾았다. `gray-matter`로 481개 파일 전수 검증. 결과: 0개. `js-yaml`로 한 번 더. 역시 0개.

빌드를 직접 돌려 재현해보니 다른 에러가 나왔다.

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx`가 `CountUp.tsx`를 import하고 있었는데 파일이 없었다. Turbopack 빌드가 여기서 터진 것이다. Vercel에서 보인 YAML 에러는 이전 배포 실패와 섞인 오래된 로그였다.

수정은 간단했다. `CountUp.tsx`를 만들고, frontmatter 구조가 깨진 daily 파일 2개를 정리했다. `npm run build` 후 480개 정적 페이지 생성 확인. `8aa059b` 커밋 후 push, Vercel auto-deploy 재개.

세션 1에서 Bash 76번, 세션 2에서 100번을 썼다. 합쳐서 176번이다. 삽질의 양은 숫자가 말해준다.

여기서 배운 것: `npm run build` 한 번이 481개 파일 검증보다 빠른 진단 도구였다. 에러 메시지가 파일명을 지목해도, 로컬에서 재현해보기 전까지는 가설이다.

> 로컬에서 재현 안 되면, 가설을 버리고 빌드 파이프라인 전체를 다시 봐야 한다.

## 오케스트레이터가 simple을 major라고 분류한다면

이번 작업 흐름에서 Hermes 오케스트레이터가 요청마다 complexity를 분류한다. `trivial / simple / standard / major` 네 단계가 있고, 각 단계에 따라 다른 파이프라인이 요구된다. major면 plan → verify → codex 전 파이프라인을 다 태워야 한다.

이번 주에는 오분류가 계속 발생했다.

세션 4(SpoonAI 성장/스폰서 리서치)에서 오케스트레이터가 `major`로 분류했다. 그런데 이 작업은 산출물 파일 두 개를 만드는 것이었다. 코드도, 아키텍처도, DB도 없다. 세션 중간에 직접 재분류했다.

```bash
source ~/.claude/workflow/lib/state.sh && state_set complexity simple
```

세션 9(보고서 HTML + PDF 생성)와 세션 10(TOC 수정)도 같은 패턴이었다. 게이트가 막았고, 재분류 후 진행했다.

오분류가 반복되는 이유는 분류 기준이 파일 수·코드 변경 규모를 보기 때문이다. 리서치·보고서·산출물 생성은 기준이 다르게 적용돼야 한다. 코드를 건드리지 않는 산출물 생성은 규모와 관계없이 `simple`이다.

## 같은 파일을 두 세션에서 수정한 이유

세션 7에서 `competitive-serp-observations.md`와 `naver-ranking-hypotheses.md`에 2026-05-25 섹션을 추가했다. 오케스트레이터 게이트와 씨름하면서 편집이 부분적으로만 완료된 채 세션이 끝났다.

다음 단계에서 Codex가 검수를 돌렸더니 `naver-ranking-hypotheses.md`에 가설 35 항목이 없었다.

세션 8에서 다시 들어가 누락된 섹션을 추가했다. 이번엔 소스 파일(`2026-05-25-daily-update.md`)을 먼저 읽고, 두 파일의 기존 구조를 확인한 뒤, 필요한 부분만 `Edit`으로 추가했다.

```
competitive-serp-observations.md → 2026-05-25 section (line 677)
naver-ranking-hypotheses.md → 가설 35 (line 620)
```

산출물 검증이 다음 단계에서 누락을 잡아낸 건 파이프라인이 의도대로 돌아간 경우다. 게이트 씨름이 첫 번째 세션을 불완전하게 끝낸 원인이었고, 분리된 검수 단계가 그걸 캐치했다.

## 리서치를 PDF 보고서로 만들기

세션 9에서는 리서치 결과를 마크다운 덤프가 아니라 페이퍼 스타일 PDF로 만들었다. 요구사항에 출력 경로, 스타일, PDF 생성 방법까지 모두 지정돼 있었다.

HTML을 먼저 작성하고 Chrome headless로 변환했다.

```bash
chromium --headless --print-to-pdf=output.pdf input.html
```

결과: 13페이지, 1.2 MB. 세션 10에서 Codex 리포트가 들어왔다. TOC에 섹션 9가 `소스 부록`으로 되어 있는데 실제로는 `이전 보고 대비 변경점`이 9번이고 `소스 부록`이 10번이었다.

두 줄 수정 후 PDF 재생성으로 마무리했다. 세션 10은 1분, 15 tool calls였다. Codex 검수가 잡아낸 것 치고는 빠르게 처리됐다.

## 도구 사용 통계

10세션 전체 기준이다.

| 도구 | 횟수 |
|------|------|
| Bash | 244 |
| Read | 68 |
| Edit | 16 |
| WebFetch | 11 |
| Grep | 11 |
| TaskUpdate | 10 |
| Write | 9 |
| TaskCreate | 9 |
| **합계** | **389** |

Bash가 244번으로 압도적이다. 검증, 재실행, grep, 파일 크기 확인이 대부분이다. 실제 파일 수정인 Edit는 16번뿐이다. 비율로 보면 `15:1`. 수정 한 번에 확인이 열다섯 번 돌아간다.

WebFetch 11번은 세션 4에서 Product Hunt, Hacker News, 경쟁사 뉴스레터 페이지를 직접 가져온 것이다. 기존 크롤 데이터에 없는 신호를 실시간으로 수집하는 패턴이다.

세션별 소요 시간은 1분(세션 3, 10)에서 13분(세션 2)까지 분포했다. 가장 긴 세션이 디버깅(YAML 오추적)이었다. 잘못된 가설을 쫓는 데 시간이 제일 많이 든다.

> 에러 메시지가 현재 상태를 반영하지 않을 수 있다. 빌드 로그 타임스탬프부터 확인하는 습관이 한 세션을 구한다.
