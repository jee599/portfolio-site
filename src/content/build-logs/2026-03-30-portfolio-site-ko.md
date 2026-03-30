---
title: "결제사 AUP 거절 3번 → 리브랜딩, 블로그 32개 자동발행, immutable 캐시 삽질"
project: "portfolio-site"
date: 2026-03-30
lang: ko
tags: [claude-code, agentcrow, auto-publish, rebranding, vercel, cache, parallel-agents]
description: "하루 5개 세션 338 tool calls. '사주' 키워드로 결제사 3곳 연속 거절 → 전체 리브랜딩. 블로그 32개 병렬 자동발행. Vercel immutable 캐시는 파일명 변경으로 우회했다."
---

하루에 결제사 3곳에서 연속으로 거절당하고, 블로그 32개를 자동 발행하고, Vercel 배포가 이유 없이 취소되는 상황을 모두 겪었다. 5개 세션, 338번의 tool call.

**TL;DR** "사주" 키워드 하나가 Lemon Squeezy → Polar 순서로 결제 거절을 불렀다. 결국 브랜드 전체를 AI 성격 분석 프레임으로 리브랜딩했다. 같은 날 Claude 관련 뉴스 10개를 3개 플랫폼에 병렬 발행했고, Vercel immutable 캐시 문제는 파일명 변경으로 우회했다.

## "사주" 두 글자가 결제사 3개를 막았다

세션 1 시작 프롬프트는 단 두 글자였다.

> "사주"

Lemon Squeezy에 상품 6개를 등록하려는 거였다. `standard`(사주 리포트), `compat`(궁합), `palm`(손금) 등. Claude가 각 상품의 Name/Description/Pricing을 정리해줬다. 문제는 첫 등록 시도에서 바로 터졌다. Lemon Squeezy 계정이 "identity verification: Rejected" 상태였다.

재시도, 신규 계정 생성, Polar 시도. 거절 메시지는 전부 같았다:

> "Your product appears to provide fortune-telling/astrology-style reports and insights, which aren't supported under our Acceptable Use Policy."

Stripe 인프라를 쓰는 곳이라면 다 동일하다. divination, fortune-telling, astrology — 이 범주 자체가 거절 대상이다.

해결책은 프레이밍 전환이었다. 던진 프롬프트:

> "내가 원하는 해결책은 점술이 아닌 생일기반 ai 성격분석? 이런느낌으로 가고 싶어"

"점술 서비스" → "AI 성격 분석 / 자기이해 리포트". 코드 전체에서 사주·fortune·divination 단어를 제거하고 personality insight / self-discovery / AI analysis로 교체한다.

## 5개 에이전트 병렬로 21개 i18n 파일 리브랜딩

리브랜딩 범위가 넓었다. `lib/productNames.ts`, `common.json`, `palm.json`, `seo.json` 등 i18n 파일 21개, 브랜드명 FortuneLab → InsightLab, URL 경로, 메타 태그까지.

AgentCrow가 독립 도메인 3개로 분리했다:

```
🤖 @코드-파일-리브랜딩  → lib/productNames.ts, API routes
🌐 @핵심-영문-i18n      → common.json, seo.json
📝 @기능별-영문-i18n    → palm.json, compat.json 등 18개 기능 파일
```

공유 파일이 없는 구조라 병렬이 안전했다. 각 에이전트가 맡은 범위가 명확하게 분리돼야 병렬 디스패치가 가능하다 — 파일이 겹치는 순간 충돌이 난다.

결과: `productNames.ts`에서 `full.en`이 "AI Four Pillars Analysis Report"로 교체됐고, `common.json`의 FortuneLab 참조 5곳이 InsightLab으로 바뀌었다. "Reading the heart line" 같이 오해 소지 없는 표현은 에이전트가 스스로 판단해서 유지했다.

세션 6시간 3분, 46 tool calls. Grep 12회, Read 8회, Glob 7회, Agent 7회, Bash 5회.

## 10개 키워드 → 32개 파일, 3개 레포 동시 배포

세션 2는 규모가 달랐다. 199 tool calls, 15시간 54분.

시작 프롬프트 두 줄:

> "블로그 글 쓰게 현재 웹상 / 커뮤니티에서 claude 관련 최신 소식 / 핫한 소식 키워드 10개 정도 찾아줘 가장 최근 기준으로"
> "10개로 블로그 글 하나씩 써줘. 배포까지"

`auto-publish` 스킬이 활성화됐다. 소재 1개 → spoonai(한/영) + DEV.to(영) + Hashnode(영) = 4파일. 10개 토픽이면 40파일이다.

먼저 기존 포스트와 중복 체크를 했다. Topics 4, 5가 `2026-03-25-claude-computer-use-mac-agent` 등 기존 포스트와 겹쳤다. 2개를 스킵하고 8개로 진행해서 최종 32파일.

5개 에이전트 병렬 디스패치, 각각 토픽 2개씩 담당. 에이전트 하나가 맡는 흐름: WebSearch로 실제 기사 수집 → 한국어 포스트(spoonai용) 작성 → 영어 포스트(DEV.to/Hashnode용) 작성 → 3개 레포에 파일 저장.

배포는 git push를 3개 레포에 했다. spoonai는 바로 성공, dev_blog와 hashnode는 리모트에 변경이 있어서 pull 후 재push. 자동화 루프 중에 다른 세션이 커밋을 넣었을 가능성이 있다.

같은 세션에서 `frontend-design` 스킬도 업데이트했다. v0, Lovable 같은 도구들이 내부적으로 어떤 프롬프트 구조를 쓰는지 유추하고, 그 패턴을 스킬에 반영했다. 요청은 "v0이나 lovable로 만든 사이트들 각각 레퍼런스로 말하는 것들 20개 분석해줘"였다. 공통 패턴 정리 후 `production-design-system.md`로 스킬에 추가됐다.

세션 도구 분포: Bash 103회, Read 24회, Agent 22회, WebFetch 18회, Grep 11회. Bash가 압도적 1위 — git 조작, 파일 이동, 빌드 확인이 집중됐다.

## 명확한 스펙의 위력 — 39 tool calls, 1시간 27분

세션 3은 반대 극단이었다. spoonai.me 데일리 브리핑에 영어 탭을 추가하는 작업.

스펙을 처음부터 정확하게 줬다:

> "`content/daily/`에는 YYYY-MM-DD.md 한국어만 있음 (문제). 해야 할 것: 1. `lib/content.ts` — `getDailyBriefing`에 언어 파라미터 추가. 2. `app/daily/[date]/page.tsx` — ko/en 탭 방식. 3. `components/DailyBriefing.tsx` — 탭 UI"

Claude가 TodoWrite로 6단계 체계를 잡고 순서대로 진행했다. 변경 파일 4개, 빌드 성공, `/daily/[date]` 10개 경로 정상 생성.

스케줄 스킬 파일 2개(`spoonai-site-publish/SKILL.md`, `spoonai-daily-briefing/SKILL.md`)도 동기화까지 포함해서 39 tool calls였다. Read 15회, TodoWrite 7회, Edit 7회 순.

같은 코드 변경량이라도 스펙의 명확도에 따라 tool call 수가 달라진다. 모호한 요청은 탐색에 tool call을 쓰고, 구체적인 요청은 바로 구현에 쓴다.

## 7분, 49 tool calls — immutable 캐시는 파일명을 바꿔야 한다

세션 4가 이날의 하이라이트였다. Harvey AI 기사와 Mistral Voxtral 기사의 이미지가 라이브 사이트에서 계속 깨져 보였다. 이미 파일을 교체했는데도 브라우저에서 여전히 broken image 상태.

49 tool calls 동안 파일 존재 여부, frontmatter 정확도, 빌드 정상 여부를 순서대로 확인했다. 전부 정상이었다.

원인은 `vercel.json`이었다:

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

`immutable`은 브라우저에게 "이 파일은 절대 바뀌지 않는다, 1년 동안 다시 요청하지 마라"고 알리는 디렉티브다. 처음에 올라갔던 파일이 HTML 내용이 `.jpg`로 저장된 corrupted 파일이었고, 브라우저가 그걸 1년치로 캐시했다. 파일을 교체해도 URL이 같으면 브라우저는 캐시에서 꺼낸다.

해결: `-01.jpg` → `-02.jpg`로 파일명 변경, frontmatter 업데이트, 기존 corrupted 파일 삭제. URL이 달라지면 브라우저가 새로 요청한다.

세션 7분. 49 tool calls 중 Bash가 31회 — 파일 검증과 빌드 확인에 집중됐다.

immutable 캐시는 CDN 성능을 위한 설정인데, corrupted 파일이 먼저 올라가면 이 설정이 독이 된다. 이미지 배포 파이프라인에서 파일 유효성 검증이 선행돼야 한다는 교훈이다.

## main push 3번 취소 — CLI로 강제 배포

세션 5. main에 3번 push했는데 Vercel 빌드가 계속 CANCELED 상태였다. 빌드 로그조차 없었다.

`npx vercel deploy --prod`를 프로젝트 루트에서 직접 실행했다. 55초 만에 빌드 완료, 164개 정적 페이지 생성, `https://spoonai.me`로 배포.

세션 1분, 5 tool calls. 전부 Bash.

git-triggered 빌드가 취소되는 건 Vercel 워크트리 관련 설정 충돌이거나 동일 커밋 중복 push 시 발생하는 deduplication 동작으로 추정된다. 원인을 완전히 파악하지는 못했다. CLI 직접 배포로 우회했다.

## 이번 세션 통계

| 세션 | 시간 | tool calls | 주요 도구 |
|------|------|-----------|-----------|
| 사주 리브랜딩 | 6h 3min | 46 | Grep, Read, Agent |
| 블로그 32개 발행 | 15h 54min | 199 | Bash, WebFetch, Agent |
| 데일리 영어 추가 | 1h 27min | 39 | Read, Edit, TodoWrite |
| 이미지 캐시 수정 | 7min | 49 | Bash, Read, Edit |
| 강제 배포 | 1min | 5 | Bash |

전체 338 tool calls. 도구별: Bash 149회, Read 59회, Agent 29회, Grep 24회, WebFetch 18회, Edit 17회.

결제사 거절이 사업 제약인데 기술 결정을 바꿨다. 21개 파일을 혼자 수정했으면 반나절이 걸렸을 작업을 병렬 에이전트 3개가 20분 안에 끝냈다. 스펙이 명확할 때와 모호할 때 tool call 수 차이도 확인됐다 — 세션 3(명확)은 39회, 세션 4(탐색 필요)는 49회였는데 변경량은 세션 3이 훨씬 많았다.
