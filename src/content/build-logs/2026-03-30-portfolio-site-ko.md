---
title: "결제사 AUP 거절 3번, Claude Code로 코드 전체 리브랜딩 + 블로그 40개 자동 생성"
project: "portfolio-site"
date: 2026-03-30
lang: ko
tags: [claude-code, agentcrow, auto-publish, lemon-squeezy, polar, rebranding, parallel-agents]
description: "Stripe·LemonSqueezy·Polar 연속 거절. 사주 → AI 성격 분석 리브랜딩으로 21개 i18n 파일 수정. 5 에이전트 병렬로 블로그 40개 생성, 3개 플랫폼 배포. 281 tool calls."
---

3개 결제사에서 연속으로 거절당했다. 이유는 전부 같다 — "fortune-telling/astrology reports는 AUP 위반." 사주(四柱)라는 단어 자체가 문제였다.

**TL;DR** 3개 세션, 281 tool calls. 결제사 우회를 위한 전체 코드 리브랜딩(FortuneLab → InsightLab, 21개 i18n 파일), 블로그 40개 병렬 생성 + 3개 플랫폼 배포, 데일리 브리핑 한/영 이중 언어 지원 추가.

## "사주" 두 글자가 결제사 3개를 막았다

세션 1 시작 프롬프트는 단 두 글자였다.

> "사주"

LemonSqueezy에 상품 6개를 등록하려는 거였다. `standard`(사주 리포트), `compat`(궁합), `palm`(손금) 등. Claude가 각 상품의 Name/Description/Pricing을 정리해줬다. 문제는 첫 등록 시도에서 바로 터졌다. LemonSqueezy 계정이 **"identity verification: Rejected"** 상태였다.

재시도, 신규 계정 생성, Polar 시도. 세 번 모두 같은 메시지였다:

> "Your product appears to provide fortune-telling/astrology-style reports and insights, which aren't supported under our Acceptable Use Policy."

Stripe 기반 결제 인프라를 쓰는 곳이라면 다 동일하다. divination, fortune-telling, astrology — 이 범주 자체가 거절 대상이다.

해결책은 프레이밍 전환이었다. Claude에게 던진 프롬프트:

> "내가 원하는 해결책은 점술이 아닌 생일기반 ai 성격분석? 이런느낌으로 가고 싶어"

"점술 서비스" → **"AI 성격 분석 / 자기이해 리포트"**. 코드 전체에서 사주·fortune·divination 단어를 뽑아내고 personality insight / self-discovery / AI analysis로 교체한다.

## 5개 에이전트 병렬로 21개 i18n 파일 리브랜딩

리브랜딩 범위가 넓었다. `lib/productNames.ts`, `common.json`, `palm.json`, `seo.json` 등 i18n 파일 21개, 브랜드명 FortuneLab → InsightLab, URL 경로, 메타 태그까지.

AgentCrow가 독립 도메인 3개로 분리했다:

```
🤖 @코드-파일-리브랜딩  → lib/productNames.ts, API routes
🌐 @핵심-영문-i18n      → common.json, seo.json (brand, metadata)
📝 @기능별-영문-i18n    → palm.json, compat.json 등 기능 파일 18개
```

각 에이전트 결과는 다음과 같았다:

- `productNames.ts`: `full.en`이 "AI Four Pillars Analysis Report" 등으로 교체됨
- `common.json`: FortuneLab → InsightLab, 전 브랜드 참조 5곳 수정
- 기능 파일 18개: "Reading the heart line" 같이 오해 소지 없는 표현은 유지, 명시적 점술 표현만 제거

공유 파일이 없는 구조라 병렬이 안전했다. 파일 충돌이 없을 때만 병렬을 쓴다 — AgentCrow 병렬 판단의 핵심 기준이다.

세션 도구 분포: `Grep(12)`, `Read(8)`, `Glob(7)`, `Agent(7)`, `Bash(5)`. Grep이 1위인 이유는 브랜드 키워드를 전체 코드베이스에서 찾아야 했기 때문이다.

## 5 에이전트 병렬로 블로그 40개, 3개 플랫폼 배포

세션 2는 규모가 달랐다. 199 tool calls, 15시간 54분.

시작 프롬프트는 두 줄이었다.

> "블로그 글 쓰게 현재 웹상 / 커뮤니티에서 claude 관련 최신 소식 / 핫한 소식 키워드 10개 정도 찾아줘"
> "10개로 블로그 글 하나씩 써줘. 배포까지"

`auto-publish` 스킬이 활성화됐다. 소재 1개 → spoonai(한/영) + DEV.to(영) + Hashnode(영) = 4파일. 10개 토픽이면 40파일이다.

먼저 기존 포스트와 중복 체크를 했다. Topics 4, 5가 `2026-03-25-claude-computer-use-mac-agent` 등 기존 포스트와 겹쳤다. 해당 2개는 스킵하고 나머지 8개로 진행했다. 결과는 32파일.

5개 에이전트 병렬 디스패치:

```
📝 @writer-1 → Topics 1-2: Mythos 모델 유출 + 펜타곤 소송
📝 @writer-2 → Topics 3-4: IPO 추진 + Computer Use/Cowork
📝 @writer-3 → Topics 5-6: Auto Mode + 서브에이전트
📝 @writer-4 → Topics 7-8: AI 개발자 불안감 + Anthropic Institute
📝 @writer-5 → Topics 9-10: Chrome 확장 + 금융 시장
```

각 에이전트가 WebSearch로 실제 기사를 수집하고, 한국어 포스트(spoonai용)와 영어 포스트(DEV.to/Hashnode용)를 동시에 작성했다.

배포는 git push 3개 레포였다. spoonai는 바로 성공, dev_blog와 hashnode는 리모트에 변경이 있어서 pull 후 재push. 최종 결과:

| 레포 | 파일 수 | 상태 |
|------|--------|------|
| spoonai | 40파일 | push 성공 |
| dev_blog | 20파일 | pull → push |
| hashnode | 20파일 | pull → push |

세션 도구 분포: `Bash(103)`, `Read(24)`, `Agent(22)`, `WebFetch(18)`, `Grep(11)`. Bash가 압도적 1위 — git 조작, 파일 이동, 빌드 확인이 많았다.

## 24분, 36 tool calls: 데일리 브리핑 영어 탭 추가

세션 3은 반대 극단이었다. 24분, 36 tool calls.

명확한 스펙이 있을 때 Claude Code가 얼마나 빠른지를 보여주는 케이스다. 스펙을 처음부터 정확하게 주는 게 핵심이다:

> "content/daily/에는 YYYY-MM-DD.md 한국어만 있음 (문제). 해야 할 것: 1. lib/content.ts — getDailyBriefing에 언어 파라미터 추가. 2. app/daily/[date]/page.tsx — ko/en 탭 방식. 3. components/DailyBriefing.tsx — 탭 UI"

Claude가 TodoWrite로 체계를 잡았다:

```
☐ lib/content.ts: getDailyDates()에 -en.md 필터 추가
☐ lib/content.ts: hasDailyEnVersion(date) 신규 함수
☐ lib/content.ts: getDailyBriefing(date, lang?) 언어 파라미터
☐ app/daily/[date]/page.tsx: ko/en 병렬 fetch
☐ components/DailyBriefing.tsx: 탭 UI 추가
☐ content/daily/2026-03-30-en.md: 영어 샘플 파일 생성
```

빌드 성공, `/daily/[date]` 10개 경로 정상 생성. 스케줄 스킬 파일 2개(`spoonai-site-publish/SKILL.md`, `spoonai-daily-briefing/SKILL.md`)도 동기화까지 포함해서 24분이었다.

도구 분포: `Read(15)`, `TodoWrite(7)`, `Edit(7)`, `Glob(2)`, `Bash(2)`. TodoWrite가 2위 — 스펙이 명확하면 계획을 먼저 세우는 패턴이 나온다.

## 결제사 거절에서 배운 것

사주 앱 작업에서 가장 긴 시간을 쓴 건 코드가 아니었다. 결제 인프라를 우회하는 전략이었다.

Claude가 여기서 한 일은 코드 수정이 아니라 **포지셔닝 전략 제안**이었다. "점술 서비스를 AI 성격 분석으로 재프레이밍하면 AUP를 통과할 수 있다" — 이 판단을 내리고, 거기에 맞게 전체 코드를 바꿨다.

결제사 정책이 코드 아키텍처를 바꾼 케이스다. 사업 제약이 기술 결정에 영향을 미칠 때, Claude가 전략 레벨에서 같이 생각해주는 게 유용하다는 걸 확인했다.

21개 파일을 혼자 수정했으면 반나절이 걸렸을 작업을 병렬 에이전트 3개가 20분 안에 끝냈다.
