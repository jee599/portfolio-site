---
title: "YAML 에러 481개 전수조사 후 발견한 진짜 원인 — CountUp.tsx 누락"
project: "portfolio-site"
date: 2026-05-25
lang: ko
tags: [claude-code, debugging, spoonai, orchestration, build-failure]
description: "Vercel 빌드 YAML 에러를 의심해 481개 파일 전수조사를 돌렸다. 깨진 파일은 0개. 진짜 원인은 CountUp.tsx 컴포넌트 누락이었다. 11세션 399 tool calls에서 반복된 삽질 패턴을 정리한다."
---

Vercel 빌드가 YAML frontmatter 파싱 에러로 실패한다는 알림을 받았다. `YAMLException: incomplete explicit mapping pair; a key node is missed` — 에러 메시지는 구체적인 파일명과 줄 번호까지 제시했다. 명확해 보였다.

**TL;DR** — 에러 메시지가 틀렸다. 481개 마크다운 파일 전수조사 결과 YAML이 깨진 파일은 0개였고, 진짜 원인은 `HomeContent.tsx`가 import하는 `CountUp.tsx` 컴포넌트가 존재하지 않아서였다. 11세션 399 tool calls, 총 약 75분의 Claude Code 작업에서 이번 삽질이 가장 오래 걸렸다.

## 에러 메시지가 가리킨 파일은 멀쩡했다

사용자의 진단은 합리적이었다. 4/27, 4/28 연속 Vercel 배포 CANCELED. 에러 로그에 `2026-04-05-furiosa-ai-rngd-commercial-launch-en.md` line 3, column 277에서 파싱 에러. 그런데 해당 파일을 열어보면 line 3은 204자였다. 에러 메시지의 column 277은 현재 파일 내용과 맞지 않았다.

첫 번째 판단 분기점. 에러가 가리키는 파일을 직접 패치하는 대신, 전수조사를 먼저 했다.

```bash
node -e "
const matter = require('gray-matter');
// content/**/*.md 481개 순회
files.forEach(f => {
  try { matter.read(f); }
  catch(e) { console.error(f, e.message); errors++; }
});
console.log('Total:', files.length, 'Errors:', errors);
"
```

결과: **Total: 481, Errors: 0**

전부 통과했다. 4/14 배치 수정(`3095c96`)에서 YAML 문제들이 이미 정리돼 있었다. `js-yaml`로 한 번 더 돌려봐도 0개였다.

## 로컬 빌드를 돌리니 다른 에러가 나왔다

YAML이 원인이 아니라면 로컬에서 빌드를 직접 재현해야 했다.

```
Error: Cannot find module './CountUp'
  at HomeContent.tsx:3:1
```

`HomeContent.tsx`가 `CountUp`이라는 컴포넌트를 import하고 있었는데 파일이 없었다. Turbopack(Next.js 16 기본값) 빌드 파이프라인이 여기서 터진 것이다. Vercel에서 보인 YAML 에러는 이전 배포 실패 로그가 섞인 오래된 기록이었다.

수정은 두 파일이었다.

- `HomeContent.tsx`에서 `CountUp` 사용 방식 조정
- `CountUp.tsx` 신규 작성

`npm run build` 후 480 static pages 생성 확인. `8aa059b` 커밋 후 push, Vercel auto-deploy 재개.

세션 1에서 Bash 76번, 세션 2에서 100번 — 합계 176번이다. 삽질의 양은 숫자가 말해준다. `npm run build` 한 번이 481개 파일 전수조사보다 빠른 진단 도구였다.

> 에러 메시지가 파일명을 지목해도, 로컬에서 재현해보기 전까지는 가설이다.

## 같은 프롬프트를 두 번 보낸 이유

세션 1에서 문제를 해결하고 `git push`까지 완료했다. 그런데 세션 2에서 사용자가 동일 프롬프트를 다시 보냈다. 세션 1의 작업 경로를 보면 이유가 드러난다.

```
~/spoonai-site/.claude/worktrees/confident-bartik-976291/components/CountUp.tsx
```

워크트리 경로다. `worktrees/confident-bartik-976291/` 하위에서 작업이 이뤄졌고, 이게 `main` 브랜치에 실제로 병합됐는지 사용자 입장에서 확인이 어려웠다. `git worktree`는 격리된 작업 공간이라 push 결과가 어느 브랜치로, 어느 remote로 갔는지 바로 눈에 띄지 않는다.

세션 2는 다른 경로로 접근했다. `systematic-debugging` 스킬을 먼저 호출하고, `gray-matter` → `js-yaml` 순서로 YAML 파싱 레이어를 분리해서 검증했다. `validate-content.mjs` line 559에서 `matter.stringify`로 파일을 덮어쓰는 코드도 발견했고, `content/daily/2026-04-10-en.md`에 frontmatter 자체가 없다는 별개 문제도 찾아냈다.

같은 문제를 두 번 접근했지만 각 세션은 다른 경로로 다른 것을 발견했다. 첫 번째 세션이 진짜 원인을 빠르게 잡았다면, 두 번째 세션은 YAML 경로를 깊이 파면서 숨어있던 다른 문제들을 드러냈다.

## 오케스트레이터가 자꾸 틀렸다

이번 주 11세션에서 반복된 패턴이 있다. 오케스트레이터가 작업을 `major`로 분류하는데, Claude CLI가 직접 `simple`로 재분류하고 진행한 케이스가 4번이었다.

세션 4 (SpoonAI 성장 신호 리서치):

> "The orchestrator gate misclassified this as `major` requiring full plan/verify/codex pipeline. But this is just producing two artifact files per a well-defined spec — no code, no architecture, no migrations. Reclassifying to `simple`."

세션 9 (PDF 보고서 생성):

> "이미 제공된 리서치를 두 파일(HTML+PDF)로 포맷하는 작업은 `simple` 수준입니다."

오케스트레이터 분류 로직이 "파일 수"를 complexity의 주요 신호로 쓰는 듯하다. 파일 여러 개를 만든다고 `major`가 되지는 않는다. 이미 설계가 끝난 리서치 결과를 포맷만 바꿔 저장하거나, 기존 아티팩트에 섹션을 추가하는 작업은 파일 개수와 무관하게 `simple`이다.

complexity는 변경의 성격으로 판단해야 한다. 구조적 결정이 필요한지, 되돌리기 어려운 상태 변경이 있는지. 코드를 건드리지 않는 산출물 생성은 규모와 관계없이 `simple`이다.

## 하루 11세션, 도구별 통계

이번 주 Claude Code 세션이 다룬 도메인: spoonai 빌드 디버깅, SpoonAI 콘텐츠 인텔리전스 아티팩트 생성, 치과 의료광고 리서치 일일 업데이트, HTML/PDF 보고서 생성 2건.

총 399 tool calls 분포:

| 도구 | 횟수 | 비중 |
|---|---|---|
| `Bash` | 252 | 63% |
| `Read` | 68 | 17% |
| `Edit` | 17 | 4% |
| `WebFetch` | 11 | 3% |
| `Grep` | 11 | 3% |
| `Write` | 10 | 3% |
| `TaskUpdate`/`TaskCreate` | 19 | 5% |

`Bash`가 63%다. 로컬 빌드 실행, Python 스크립트로 YAML 전수조사, `chromium --headless` PDF 변환까지 쉘이 대부분의 검증을 담당했다. 실제 파일 수정인 `Edit`는 17번뿐이다. 비율로 보면 수정 한 번에 확인이 열다섯 번 돌아가는 셈이다.

HTML 보고서를 PDF로 바꾸는 것도 결국 `bash` 한 줄이었다.

```bash
chromium --headless --print-to-pdf=output.pdf --no-pdf-header-footer input.html
```

13페이지, 1.2MB. 별도 라이브러리 없이. 세션 9에서 만들고, 세션 10에서 Codex가 TOC 번호 불일치를 잡아내서 두 줄 수정 후 PDF를 재생성했다. 세션 10은 1분, 15 tool calls였다.

세션별 소요 시간은 1분(세션 3, 10)에서 13분(세션 2)까지 분포했다. 가장 긴 세션이 디버깅(YAML 오추적)이었다. 잘못된 가설을 쫓는 데 시간이 제일 많이 든다.

> 에러 메시지가 현재 상태를 반영하지 않을 수 있다. 빌드 로그 타임스탬프부터 확인하는 습관이 한 세션을 아낀다.
