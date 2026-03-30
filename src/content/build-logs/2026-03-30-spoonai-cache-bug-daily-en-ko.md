---
title: "immutable 캐시가 이미지 수정을 1년 동안 막는다 — Vercel 배포 취소까지"
project: "spoonai"
date: 2026-03-30
lang: ko
tags: [claude-code, vercel, cache, debugging, i18n]
description: "vercel.json의 immutable 캐시 설정이 이미지 수정을 브라우저 수준에서 차단했다. 이름 변경으로 캐시를 우회하고, git push 배포가 연속 취소되자 vercel deploy --prod로 직접 해결했다."
---

spoonai.me에 올라간 Harvey AI, Mistral Voxtral TTS 기사 2개의 이미지가 배포 후에도 계속 깨져 있었다. 파일은 이미 교체한 상태였다. 브라우저가 캐시된 버전을 계속 보여주고 있었던 것이다.

**TL;DR** `vercel.json`의 `/images/*` 경로에 `immutable` 캐시가 걸려 있었다. 파일을 아무리 덮어써도 브라우저는 1년 동안 캐시된 버전을 쓴다. 파일 이름 변경으로 우회했다. 같은 날 git push 배포가 3번 연속 취소되면서 `npx vercel deploy --prod` 직접 배포로 전환했다. 세션 사이 30분 안에 두 버그를 모두 닫았다.

## immutable이 뭔지는 알았는데, 여기에 걸려있을 줄은 몰랐다

이미지 파일 자체는 이미 유효한 JPEG로 교체되어 있었다. 그런데 사이트에서 계속 깨진다. 빌드 로그에도 에러 없음.

원인은 `vercel.json`이었다.

```json
{
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

`immutable`은 "이 파일은 절대 바뀌지 않는다"는 선언이다. 브라우저는 이 헤더를 받으면 이후 같은 URL에 대해 서버에 요청을 보내지 않는다. 1년 동안. 처음에 HTML이 JPEG로 잘못 저장됐을 때 그 깨진 파일이 `immutable`로 캐시됐고, 그 이후로는 어떤 수정도 브라우저에 도달하지 못했다.

해결 방법: 파일 이름을 바꿔서 URL 자체를 바꾼다. `-01.jpg`를 `-02.jpg`로 rename하고 frontmatter를 업데이트했다.

```markdown
# Before
image: /images/posts/2026-03-30/harvey-ai-11b-valuation-01.jpg

# After
image: /images/posts/2026-03-30/harvey-ai-11b-valuation-02.jpg
```

4개 아티클(`harvey-ai-11b-valuation-ko.md`, `-en.md`, `mistral-voxtral-tts-ko.md`, `-en.md`) 모두 frontmatter 교체. 기존 `-01.jpg` 파일은 삭제. 빌드 확인 후 배포.

세션 7분, 49 tool calls. Bash 31회, Read 12회, Edit 4회.

이 버그가 성가신 이유는 에러 메시지가 없다는 점이다. 빌드는 성공하고, 서버 로그도 정상이다. 오직 브라우저의 Network 탭에서 304 Not Modified를 보거나, 캐시를 직접 클리어해봐야 알 수 있다. 디버깅 단서가 전혀 없는 채로 "수정했는데 왜 안 바뀌지?"를 반복하게 된다.

## git push 배포가 3번 연속 취소됐다

이미지 버그를 수정하고 `git push origin main`을 했다. Vercel 대시보드에서 빌드가 시작되더니 곧바로 CANCELED. 빌드 로그 없이. 두 번째도 취소, 세 번째도 취소.

production은 이전 커밋에 고정된 채로.

원인은 확인하지 못했다. Vercel 쪽 트리거 이슈이거나, 브랜치 히스토리 충돌일 수 있다. 워크트리에서 작업 후 main에 merge하는 패턴이 영향을 준 것으로 보인다.

해결은 단순하게 갔다.

```bash
npx vercel deploy --prod
```

git webhook 경로를 우회하고 CLI에서 직접 빌드를 트리거한다. 55초 만에 빌드 완료. 164개 static page. production alias `https://spoonai.me` 적용.

세션 1분, 5 tool calls. Bash 5회.

"git push 이후 자동 배포"가 편리하긴 한데 실패할 때 디버깅이 어렵다는 걸 다시 확인했다. 배포가 취소되면 이유가 로그에 안 남는 경우가 있다. 그럴 때는 CLI 직접 배포가 가장 빠르다.

## 데일리 브리핑에 영어 탭을 추가했다

같은 날, `content/daily/` 경로에 한국어 파일(`YYYY-MM-DD.md`)만 있고 영어 버전이 없었다. 홈페이지는 이미 Korean/English 탭이 있는데, 데일리 브리핑만 한국어만 보이는 상태였다.

변경 범위는 세 곳이었다.

**`lib/content.ts`** — `getDailyDates()`에서 `-en.md` 파일을 날짜 목록에서 제외하는 필터 추가. `hasDailyEnVersion(date)` 함수 신규 추가. `getDailyBriefing(date, lang?)` — `lang="en"`이면 `YYYY-MM-DD-en.md`를 읽도록 분기.

```typescript
export function getDailyDates(): string[] {
  return fs.readdirSync(dailyDir)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))  // -en.md 제외
    .map(f => f.replace('.md', ''))
    .sort().reverse()
}

export function getDailyBriefing(date: string, lang: 'ko' | 'en' = 'ko') {
  const filename = lang === 'en' ? `${date}-en.md` : `${date}.md`
  // ...
}
```

**`app/daily/[date]/page.tsx`** — ko/en 두 버전을 모두 fetch한 다음 `DailyBriefingView`에 넘긴다.

**`components/DailyBriefing.tsx`** — ko/en 탭 UI 추가. `activeMeta`/`activeContent`로 선택된 언어의 내용을 렌더링.

마지막으로 `content/daily/2026-03-30-en.md`를 직접 생성해서 첫 영어 데일리 확인.

세션 1시간 27분, 39 tool calls. Read 15회, TodoWrite 7회, Edit 7회.

이 작업에서 흥미로운 부분은 스킬 파일도 함께 업데이트한 것이다. `spoonai-daily-briefing/SKILL.md`와 `spoonai-site-publish/SKILL.md` 두 곳에 영어 데일리 생성 지침이 반영됐다. 코드만 수정하면 다음 자동화 실행 때 영어 파일이 생성되지 않는다. 스킬(=AI 작업 지침)도 같이 버전 관리해야 자동화가 제대로 돌아간다.

## 이번 세션 통계

3개 세션, 총 53 tool calls, 약 1시간 35분. Bash 41회, Read 27회, Edit 11회.

세션 1은 기능 추가, 세션 2는 캐시 버그 디버깅, 세션 3은 배포 인프라 트러블슈팅으로 성격이 달랐다. 버그 두 개 모두 코드 수정이 문제가 아니라 인프라 설정(캐시 정책, 배포 트리거)이 원인이었다. 이런 버그는 Claude에게 증상을 정확히 전달하는 게 핵심이다. "이미지가 깨진다"보다 "파일을 교체했는데도 브라우저에서 계속 이전 버전이 보인다"가 훨씬 빠르게 원인을 찾는다.
