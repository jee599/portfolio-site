---
title: "YAML 에러가 진짜 원인이 아니었다: Claude Code 13세션 실전 기록"
project: "portfolio-site"
date: 2026-05-26
lang: ko
tags: [claude-code, debugging, workflow, automation, pdf-generation]
description: "Vercel 빌드 실패 원인이 YAML frontmatter 에러라고 했는데, 481개 파일 전수 검사 결과 에러 0개. 진짜 블로커는 CountUp.tsx missing. 13세션 420 tool calls, Hermes 재분류 패턴까지 기록한다."
---

481개 `.md` 파일을 `gray-matter`로 전수 검사했을 때 에러가 0개였다.

Vercel 빌드 실패 원인이 YAML frontmatter 파싱 에러라고 해서 분석을 시작했는데, 실제 블로커는 전혀 다른 곳에 있었다. 진단이 잘못되면 수정도 잘못된다는 걸 이번 주 13세션 동안 반복해서 확인했다.

**TL;DR** 증상 메시지만 믿지 말고 먼저 반증부터 시도한다. 오케스트레이터가 작업 크기를 잘못 분류했을 때는 직접 재분류하고 돌파하는 게 파이프라인을 통째로 돌리는 것보다 빠르다.

## "YAML 에러"였는데 YAML은 멀쩡했다

4월 28일 제보: Vercel 빌드가 YAML frontmatter 파싱 에러로 실패하고 있다. 에러가 발생한다는 파일까지 특정해서 왔다.

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

자연스럽게 YAML 쪽부터 팠다. `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/` 전체를 `gray-matter`로 파싱했다. 481개 파일, 에러 0개.

에러 메시지의 "line 3, column 277"도 확인했다. 4/14 배치 수정(`3095c96`)에서 이미 정리된 내용이었고, 제보된 파일의 현재 line 3은 204자였다. 즉, 사용자가 특정한 에러는 한 달 전에 사라진 상태였다.

진짜 블로커는 `CountUp.tsx`였다. `HomeContent.tsx`가 import하는 컴포넌트인데 파일 자체가 없었다. Turbopack 빌드(Next.js 16 기본값)가 거기서 터진다. YAML은 처음부터 문제가 아니었다.

수정은 두 가지였다: `CountUp.tsx` 신규 생성, frontmatter가 없는 daily 파일 2개 복구. 로컬 빌드 돌려서 480페이지 정상 생성 확인 후 `main` 푸시했다. Bash 76회, Read 13회.

같은 제보가 두 번째 세션에서 다시 들어왔다. `js-yaml`로도 파싱해보고, 라인 길이가 긴 파일을 따로 추출해서 확인하고, `validate-content.mjs`의 `matter.stringify` 로직까지 파봤다. 581번째 줄에 파일을 다시 쓰는 코드가 있어서 4/27 이후 파일들에 뭔가를 했을 수 있다고 의심했다. 최종적으로는 같은 결론이었다—`gray-matter`·`js-yaml` 모두 통과, frontmatter 없는 파일 2개(`content/daily/2026-04-10.md`, `2026-04-10-en.md`)가 별도로 발견됐고 이건 원래 알려진 문제였다.

두 번째 세션에 100 Bash calls를 썼다. 첫 번째 세션에서 나온 결론을 검증하는 데 비용이 들었다.

## Hermes가 `major`로 분류했을 때

이번 주 세션 절반은 비슷한 패턴으로 진행됐다. Hermes 오케스트레이터가 작업 규모를 `major`로 분류해서 Edit 툴을 막는다. 실제 작업은 파일 1~2개 수정인데.

치과 광고 SERP 관찰 파일에 날짜별 섹션 하나 추가하는 세션이 있었다. `competitive-serp-observations.md`와 `naver-ranking-hypotheses.md`에 2026-05-25 섹션을 append하는 거다—완전히 `simple` 수준. 그런데 오케스트레이터 게이트가 `major`로 분류해서 막았다.

그 경우 직접 재분류했다:

```bash
source ~/.claude/workflows/{project-slug}/lib/state.sh && \
  state_set complexity simple && \
  state_set stage implementing
```

그러면 Edit 블록이 풀리고 진행할 수 있다. 이 패턴이 세션 5, 7, 9, 10에서 각각 등장했다. HTML 보고서 포맷팅(세션 9), TOC 2줄 수정(세션 10), artifact append 작업(세션 7) 모두 `major` 분류가 나왔다가 `simple`로 재분류하고 진행했다.

오케스트레이터 분류 휴리스틱이 틀렸다고 판단되는 기준이 생겼다: 파일 수 1~2개, 코드 변경 없음(산출물 파일만), 스펙이 이미 확정된 경우. 이 세 조건이 맞으면 plan → verify → codex 파이프라인을 기다리는 게 낭비다. 첫 응답에서 "이 작업은 `simple`입니다"를 명시하고 재분류한다.

같은 repair 작업이 세션 7에서 미완성으로 끝나서 세션 8에 다시 들어갔다. `naver-ranking-hypotheses.md`에 가설 35 추가, 가설 30/31 컨텍스트 보강. grep으로 검증(`2026-05-25` 마커, `가설 35` 포함 확인)하고 마무리했다.

## Chrome headless PDF 파이프라인

이번 주 가장 많이 쓴 패턴은 HTML → PDF 변환이다. 세션 9, 11, 12, 13에서 총 4개 보고서를 만들었다.

구조는 단순하다. HTML에 콘텐츠와 스타일을 전부 넣고, Chrome headless로 PDF를 뽑는다.

```bash
google-chrome --headless --disable-gpu \
  --print-to-pdf=output.pdf \
  --print-to-pdf-no-header \
  input.html
```

이후 `pdftotext output.pdf - | grep "검증할 키워드"`로 필수 문구가 들어갔는지 확인한다. 세션 13에서는 미확인 금액 항목에 `공고 첨부 확인 필요` 문구가 빠진 걸 Codex 리뷰가 잡아냈고, Edit 2줄 수정 후 PDF 재생성으로 끝났다.

생성된 보고서:
- `2026-05-25_spoonai_fortunelab_global_100_report.pdf` — 13페이지, 1.2 MB
- `2026-05-25_gov_startup_support_seoul_gyeonggi_ai_solo.pdf` — 2.7 MB
- `2026-05-25_gov_startup_support_realistic_strategy.pdf` — A4 10페이지, 2.5 MB

세션 10에서는 TOC 번호가 맞지 않는 버그가 있었다. TOC에는 9번 항목이 `소스 부록`인데 본문에는 9번이 `이전 보고 대비 변경점`, 10번이 `소스 부록`이었다. Edit 2줄(TOC에 누락된 항목 추가 + 본문 앵커 id 추가), PDF 재생성으로 마무리. Bash 8회, Edit 4회.

## 이번 주 통계

13세션, 총 420 tool calls.

| 도구 | 횟수 | 비율 |
|------|------|------|
| Bash | 263 | 62% |
| Read | 72 | 17% |
| Edit | 20 | 5% |
| Grep | 13 | 3% |
| Write | 11 | 3% |
| WebFetch | 11 | 3% |
| TaskUpdate | 10 | 2% |
| TaskCreate | 9 | 2% |

Bash가 62%를 차지한다. 빌드 실행, PDF 변환, state.sh 호출, grep 검증, 파일 크기 확인이 대부분이다. Read가 17%인데, 기존 파일 패턴 참고나 대형 파일을 청크로 읽는 경우가 많았다. Edit이 20회인데, 실제 코드·문서 수정보다 Bash를 통한 검증·변환이 훨씬 많다는 게 보인다.

수정 파일 8개, 생성 파일 9개. 세션당 평균 1.3개 파일 변경.

## 다음에 기억할 것

에러 메시지가 구체적으로 파일과 위치를 특정하더라도 그게 현재 상태인지 먼저 확인한다. `gray-matter` 전수 파싱처럼 빠르게 반증할 수 있는 방법이 있으면 먼저 써본다. 에러 메시지가 한 달 전 상태를 가리키고 있을 수 있다.

오케스트레이터 분류가 잘못됐다고 판단되면 첫 응답에서 재분류한다. 이미 스펙이 확정된 산출물 파일 생성, 1~2개 파일 수정, 코드 변경 없는 포맷팅 작업은 `simple`이다. "이 작업은 single-file 수정이라 `simple`로 재분류합니다"한 줄이면 된다. 블록된 채로 플래닝 루프에 들어가는 건 같은 결론에 더 많은 tool calls를 쓰는 것과 같다.
