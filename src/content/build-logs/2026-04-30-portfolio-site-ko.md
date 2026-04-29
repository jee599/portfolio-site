---
title: "Vercel 배포 2일 연속 CANCELED — YAML 에러처럼 보였지만 진짜 원인은 컴포넌트 누락"
project: "portfolio-site"
date: 2026-04-30
lang: ko
tags: [claude-code, debugging, vercel, yaml, next-js]
description: "4/27~4/28 Vercel 배포 2일 연속 CANCELED. YAML frontmatter 파싱 에러로 봤지만 481개 MD 파일 전수 검증 결과 이상 없음. 진짜 블로커는 HomeContent.tsx가 import한 CountUp.tsx 미존재. 2세션 208 tool calls로 복구."
---

4월 27일, 4월 28일 — 이틀 연속으로 Vercel 배포가 CANCELED됐다. 에러 메시지엔 `YAMLException: incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line at line 3, column 277`가 찍혀 있었다. 파일 경로도 특정됐다: `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`.

**TL;DR** YAML이 아니었다. `HomeContent.tsx`가 존재하지 않는 `CountUp.tsx`를 import하고 있었고, 그게 Turbopack 빌드를 죽이고 있었다. 에러 메시지가 잘못된 방향을 가리킨 케이스다.

## 481개 파일 전수 검증, 그런데 깨진 파일이 없다

에러 로그가 지목한 파일부터 열어봤다. `line 3`은 204자였다. 이미 정상. 4월 14일 배치 수정(`3095c96`)에서 처리됐고 지금은 문제없는 상태였다.

그래서 `gray-matter`로 전체 콘텐츠 디렉토리를 돌렸다. `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/` 모두 포함해서 481개 파일을 파싱했다.

```js
const files = glob.sync('content/**/*.md');
let errors = [];
files.forEach(f => {
  try { matter(fs.readFileSync(f, 'utf8')); }
  catch(e) { errors.push({ file: f, error: e.message }); }
});
console.log('errors:', errors.length); // → 0
```

`errors: 0`. `js-yaml`로 직접 파싱해도 마찬가지였다. 481개 파일 전부 통과. YAML 문제가 아니었다.

## CANCELED가 아니라 BUILD FAILED였다

"CANCELED" 상태가 오해를 불러일으켰다. Vercel 파이프라인 설정 때문에 빌드 실패가 CANCELED로 표시됐던 것이다. 실제로는 빌드가 중단된 게 아니라 실패한 거였다.

로컬에서 `npm run build`를 직접 돌렸을 때 진짜 에러가 나왔다:

```
Error: Cannot find module './CountUp'
  at HomeContent.tsx:3:1
```

`HomeContent.tsx`가 `CountUp.tsx`를 import하고 있었는데, 해당 파일이 없었다. Next.js 16 기본인 Turbopack은 이 모듈 누락을 빌드 시점에 잡아낸다. YAML과는 무관한 에러였다.

## 수정: CountUp.tsx 신규 생성

`HomeContent.tsx`의 사용 패턴을 분석해서 `CountUp.tsx`를 만들었다:

```tsx
// components/CountUp.tsx
interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
}

export default function CountUp({ end, duration = 2000, suffix = '' }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const step = end / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, end);
      setCount(Math.floor(current));
      if (current >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}
```

동시에 `content/daily/`에서 closing `---`가 누락된 파일 2개도 함께 수정했다. frontmatter 파싱 자체는 문제없었지만 구조가 잘못된 파일이었으므로 정리했다.

## 빌드 통과

```bash
npm run build
# ✓ 480 static pages generated
```

480개 정적 페이지 전부 포함해서 빌드 통과. `main`에 push하자 Vercel 자동 배포가 트리거됐다. 4월 26일 수동 배포 이후 멈춰 있던 프로덕션이 다시 업데이트됐다.

## 두 세션, 208 tool calls

같은 프롬프트로 두 세션을 소비했다. 세션 1은 91 tool calls(9분), 세션 2는 117 tool calls(13분). 도구별로는 Bash 176회, Read 22회, TodoWrite 5회, Skill 2회, Write 1회, Edit 1회, ToolSearch 1회.

두 세션 모두 YAML 쪽을 먼저 팠다. "에러 메시지가 특정 파일을 지목했다 → 해당 파일을 고친다"는 경로가 자연스러웠기 때문이다. 그런데 사용자가 언급한 파일은 이미 정상이었고, 전체 검증도 통과했다. 그 다음 단계인 "로컬에서 빌드를 직접 재현해라"로 넘어가는 데 시간이 걸렸다.

에러 로그가 특정 파일을 지목해도, 실제 빌드를 재현해보기 전까지는 그게 진짜 원인인지 알 수 없다. Vercel 상태 표시("CANCELED" vs "FAILED")가 다른 정보를 전달하는 환경에서는 더 그렇다. 다음엔 YAML 전수 검증보다 로컬 빌드 재현을 먼저 한다.
