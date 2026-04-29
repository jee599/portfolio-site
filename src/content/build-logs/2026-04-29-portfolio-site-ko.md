---
title: "Vercel 배포 막힌 원인, YAML이 아니었다 — 2세션 208 tool calls 디버깅"
project: "portfolio-site"
date: 2026-04-29
lang: ko
tags: [claude-code, debugging, vercel, yaml, nextjs]
description: "YAML frontmatter 파싱 에러로 Vercel 배포가 막혔다는 가정에서 시작했다. 481개 MD 파일 전수 검사 결과는 에러 0개. 진짜 블로커는 CountUp.tsx 컴포넌트 누락이었다. 2세션 208 tool calls 디버깅 기록."
---

YAML 에러가 원인이라고 생각했다. Vercel 빌드 로그에 `YAMLException: incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line at line 3, column 277`가 찍혀 있었고, 4/27~4/28 배포는 전부 CANCELED 상태였다. 프로덕션은 4/26 수동 배포 버전에서 멈춰 있었다.

**TL;DR** 481개 MD 파일을 `gray-matter`로 전수 검사했더니 YAML 에러는 0개. 진짜 블로커는 `HomeContent.tsx`가 import하는 `CountUp.tsx`가 파일시스템에 존재하지 않았던 것이다. 두 세션, 208 tool calls, 22분.

## 같은 프롬프트, 이틀 연속

4/28에 두 세션이 돌아갔다. 프롬프트는 거의 동일했다:

> spoonai 웹 기사 발행이 안 되고 있다. 수정해줘.

세션 1은 9분, 91 tool calls (Bash 76, Read 13, Write 1, Edit 1). 세션 2는 13분, 117 tool calls (Bash 100, Read 9, TodoWrite 5, Skill 2, ToolSearch 1). 합산 208 tool calls, Bash만 176번.

Bash 176번은 가설을 그만큼 많이 세우고 검증했다는 뜻이다. 대부분은 "이 파일들 YAML이 깨진 거 아냐?"를 확인하는 스크립트였다.

## Phase 1: YAML 전수 검사

사용자가 제시한 에러 파일은 `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`이었다. 해당 파일을 직접 읽었다. 이상이 없었다. `line 3, column 277`을 계산해보니 현재 line 3은 204자였다. 에러 조건에 해당하지 않는다.

4/14 배치 수정 커밋(`3095c96`)에서 이미 정리된 파일을 가리키고 있었다.

범위를 넓혔다. `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/` 전체를 `gray-matter`로 일괄 파싱했다:

```bash
node -e "
const matter = require('gray-matter');
const { globSync } = require('glob');
const files = globSync('content/**/*.md');
let broken = 0;
files.forEach(f => {
  try { matter.read(f); }
  catch(e) { console.log(f, e.message); broken++; }
});
console.log('총', files.length, '파일, 에러', broken, '개');
"
```

결과: **481개 파일, 에러 0개.** `gray-matter` 기준으론 전부 정상이었다.

## Phase 2: 빌드 파이프라인 직접 재현

파일이 다 통과한다면 빌드 파이프라인이 다른 이유로 죽는다는 뜻이다. 세션 2에서는 최근 커밋 `feat(validate-content): integrate 5요소 quality-checks`를 의심해 `validate-content.mjs`를 열었다. 559번째 줄에서 `matter.stringify`로 파일을 다시 쓰는 코드가 있었다. self-critique 로직이 frontmatter를 변형하는 건 아닌지 추적했다. `js-yaml`로 직접 파싱해 `gray-matter`와 결과가 다른지도 비교했다. 달라지지 않았다.

가장 빠른 검증은 로컬에서 빌드를 직접 돌리는 것이었다:

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx`가 `./CountUp`을 import하는데 `CountUp.tsx` 파일이 없었다. Next.js 16은 기본값으로 Turbopack을 사용하고, Turbopack은 존재하지 않는 모듈 import에서 빌드를 즉사시킨다.

Vercel 빌드 로그에 찍혔던 `YAMLException`은 다른 경로의 에러였거나 이전 빌드의 캐시 로그였다.

## 수정

`CountUp.tsx`를 새로 작성했다:

```typescript
// components/CountUp.tsx
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
}

export function CountUp({ end, duration = 2, suffix = '' }: CountUpProps) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}
```

추가로, `content/daily/2026-04-10-en.md`와 `content/daily/2026-04-10.md` 두 파일이 frontmatter 없이 전체 콘텐츠가 YAML 안에 인라인으로 박혀 있었다. 올바른 구조로 변환했다: 짧은 YAML frontmatter + 본문 분리.

로컬 빌드 통과, 480개 정적 페이지 생성 확인. 커밋 `8aa059b`를 `main`에 push해 Vercel 자동 배포를 트리거했다.

## 세션 2가 있었던 이유

세션 1이 수정과 배포까지 완료했다. 세션 2는 같은 프롬프트로 새로 시작해서 이미 해결된 문제를 처음부터 다시 디버깅했다.

Claude Code는 세션 간 컨텍스트를 공유하지 않는다. 이전 세션이 무엇을 했는지 모르는 상태로 시작한다. "4/28 배포가 CANCELED"라는 프롬프트 정보만 보고 문제가 아직 열려 있다고 판단한다.

해결책은 단순하다. 세션이 끝날 때 완료 상태를 커밋 메시지에 명시적으로 남기거나, 다음 세션 프롬프트에 "세션 1에서 이미 CountUp.tsx를 생성하고 배포 완료"를 넣어야 한다. 세션 완료 상태를 어딘가에 기록하지 않으면 같은 작업이 반복된다.

세션 2에서 `superpowers:systematic-debugging`과 `superpowers:verification-before-completion` 스킬을 실행한 것도 이 맥락이다. 더 체계적으로 접근했지만 방향은 맞았어도 중복이었다.

## 교훈

에러 메시지가 가리키는 파일에 에러가 없다면, 에러 메시지 자체를 의심해야 한다. Vercel 빌드 로그는 실시간이 아닐 수 있고, 캐시된 이전 에러를 표시할 수 있다.

481개 파일 전수 검사보다 `npm run build` 한 번이 더 빠른 진단이었다. 빌드 프로세스가 실제로 멈추는 곳을 직접 재현하는 게 가설로 추적하는 것보다 항상 정확하다.

| | 세션 1 | 세션 2 | 합계 |
|---|---|---|---|
| 소요 시간 | 9분 | 13분 | 22분 |
| tool calls | 91 | 117 | 208 |
| Bash | 76 | 100 | 176 |
| 생성 파일 | 1 (`CountUp.tsx`) | 0 | 1 |
| 수정 파일 | 1 | 0 | 1 |
