---
title: "AI 에이전트에게 i18n + 타로 + 궁합 기능을 한번에 시키는 법 — 제약 조건 설계가 핵심이다"
project: "saju_global"
date: 2026-03-09
lang: ko
tags: [claude-code, prompting, i18n, tarot, architecture]
---

사주 분석 앱에 타로, 궁합 분석, 8개 언어 번역을 하루 만에 넣었다. 커밋 20개, 변경 파일 139개. 이걸 가능하게 한 건 코드 실력이 아니라 **프롬프트 설계**다.

## 무엇을 만들고 있는가

만세력 엔진 + LLM 해석을 결합한 사주 분석 서비스다. Next.js + Supabase + OpenAI API 스택. 현재 운영 중이고, 이번 작업에서 3가지를 추가했다:

1. AI 타로 리딩 (78장 카드 덱)
2. 궁합 분석 전면 개편 (출생 시간, 6개 섹션, 가격 정책)
3. 8개 locale 번역 일괄 수정

하루에 이 세 가지를 다 넣는 건, 수동으로는 불가능하다.

## Claude에게 타로 기능을 통째로 시켰다

타로 리딩 기능은 78장 카드 덱 데이터, UI 컴포넌트, LLM 프롬프트, i18n까지 필요하다. 이걸 Claude에게 한번에 맡기면 **반드시 실패한다**.

핵심은 **작업을 쪼개는 것**이다.

> 1단계: "78장 타로 카드의 JSON 데이터를 만들어줘. Major Arcana 22장, Minor Arcana 56장. 각 카드에 name, number, suit, keywords, upright_meaning, reversed_meaning 필드를 넣어."

> 2단계: "이 카드 데이터를 import해서 3장을 랜덤으로 뽑는 TarotReading 컴포넌트를 만들어줘. 카드 뒤집기 애니메이션은 CSS flip으로."

> 3단계: "뽑힌 3장 카드의 의미를 종합해서 해석하는 LLM 프롬프트를 작성해줘. 사용자의 질문과 카드 조합을 입력으로 받아서 3문단 해석을 출력."

이렇게 쓰면 안 된다:

> "타로 리딩 기능 만들어줘"

한 문장 프롬프트는 LLM이 임의로 결정하는 부분이 너무 많다. 카드 데이터 구조, UI 패턴, 해석 방식 모두 LLM 재량이 된다. **결과가 매번 달라지고, 수정 비용이 급증한다.**

### CLAUDE.md로 컨텍스트 고정하기

프로젝트 루트에 `CLAUDE.md`를 두면 Claude Code가 세션마다 읽는다. 여기에 프로젝트 구조, 기술 스택, 코딩 컨벤션을 명시하면 매번 설명할 필요가 없다.

```markdown
# 프로젝트 구조
- apps/web/ — Next.js 프론트엔드
- packages/engine/ — 만세력 + LLM 프롬프트 엔진
- 8개 locale: ko, en, ja, zh, hi, th, id, vi

# 규칙
- 새 컴포넌트는 apps/web/app/[locale]/ 아래에
- i18n은 next-intl 사용, messages/ 디렉토리에 JSON
- LLM 프롬프트는 packages/engine/prompts/ 에 분리
```

이렇게 해두면 "타로 컴포넌트 만들어줘"라고만 해도 올바른 디렉토리에, 올바른 i18n 패턴으로 생성한다.

## i18n 8개 언어 — 번역은 쉽고 검증이 어렵다

`feat(i18n): comprehensive translation overhaul across all 8 locales`라는 커밋이 있다. 8개 언어를 한번에 수정한 것이다.

Claude에게 번역을 시키는 건 쉽다. 문제는 **오역 검증**이다.

### 프롬프트 패턴: 번역 + 제약 조건

> "8개 locale JSON 파일에서 key가 누락된 항목을 찾아서, `en.json` 기준으로 번역해줘. 다음 규칙을 지켜:
> 1. 고유명사(사주, 만세력, 타로)는 번역하지 마
> 2. 기존 번역의 톤을 유지해 (formal/informal 확인)
> 3. 수정한 key만 diff 형태로 보여줘"

"번역해줘"만 쓰면 이런 일이 생긴다:
- 한국어 "사주"를 "Four Pillars"로 번역 (브랜드명인데)
- 기존에 informal이던 태국어를 갑자기 formal로 변경
- 누락이 아닌 기존 번역까지 멋대로 수정

`fix(i18n): fix mistranslations across en, hi, th, id locales` 커밋이 바로 이 문제를 고친 것이다. **1차 번역 후 반드시 검증 라운드를 돌려야 한다.**

### 검증 프롬프트

> "방금 수정한 번역에서 다음을 체크해줘:
> 1. 원문과 의미가 달라진 항목
> 2. 고유명사가 번역된 항목
> 3. placeholder({name}, {count} 등)가 깨진 항목"

이 검증 프롬프트를 돌리는 것만으로 오역률이 크게 줄어든다.

## LLM 프롬프트 엔진 4라운드 QA

커밋 로그를 보면 `engine round 1`, `round 2`, `round 3`, `round 4`가 있다. LLM 프롬프트를 4번 반복 개선한 것이다.

이건 의도적인 패턴이다. **LLM 프롬프트는 코드와 다르게 한번에 완성되지 않는다.**

### 라운드별 전략

- **Round 1**: 기본 프롬프트 작성. 출력 형식과 톤을 지정
- **Round 2**: QA — 프롬프트 일관성 검증, validation 규칙 추가
- **Round 3**: 중복 제거, 궁합 분석 threshold 조정
- **Round 4**: locale별 문화적 차이 반영, 손금 분석 깊이 조절

각 라운드에서 Claude Code에게 이렇게 시켰다:

> "현재 프롬프트를 실행하면 이런 결과가 나온다 [결과 붙여넣기]. 다음 문제를 수정해줘: 1) 한국어와 영어 결과의 톤이 다르다 2) 궁합 점수가 항상 70~80 사이로 나온다 3) 손금 해석이 너무 짧다"

핵심: **현재 결과를 보여주고 구체적 문제를 지적한다**. "프롬프트 개선해줘"는 효과가 없다.

## 네비게이션 구조 — AI에게 맡기면 안 되는 것

`fix(nav)` 커밋이 4개 연속이다. 메뉴에 뭘 보여주고 뭘 숨길지를 4번 수정한 것이다.

이건 AI에게 맡기면 안 되는 대표적인 작업이다. **제품 의사결정**이기 때문이다:
- 타로는 아직 베타니까 메뉴에서 숨긴다
- 작명은 완성됐지만 cross-sell에서만 노출한다
- 데스크톱과 모바일에서 보여줄 메뉴가 다르다

이런 결정은 사람이 해야 한다. AI는 "이 메뉴 항목을 `topNav` 배열에서 제거해줘"처럼 **구현만 시키는 것**이 맞다.

> 원칙: AI는 "how"를 담당하고, 사람은 "what"과 "why"를 담당한다.

## 더 나은 방법은 없을까

### 1. i18n 자동화: Crowdin + AI 하이브리드

현재는 Claude에게 직접 JSON 번역을 시키고 있다. 더 나은 방법은 **Crowdin** 같은 i18n 플랫폼과 AI를 결합하는 것이다. Crowdin의 AI Translation 기능은 Translation Memory를 참조하면서 번역하기 때문에 일관성이 훨씬 높다. 수동 Claude 번역 대비 검증 비용이 줄어든다.

### 2. 프롬프트 버전 관리

프롬프트를 4라운드 돌리면서 매번 수동으로 비교했다. **Anthropic의 prompt caching**을 활용하면 긴 시스템 프롬프트의 비용을 90%까지 줄일 수 있다. 또한 프롬프트를 git으로 버전 관리하면 어떤 변경이 품질을 올렸는지 추적할 수 있다.

### 3. Claude Code hooks로 자동 검증

`CLAUDE.md` 외에 Claude Code의 **hooks** 기능을 쓸 수 있다. pre-commit hook에서 "i18n JSON의 key 개수가 locale별로 동일한지 체크"를 자동 실행하면 누락을 빌드 전에 잡는다.

```json
{
  "hooks": {
    "pre-commit": ["node scripts/check-i18n-keys.js"]
  }
}
```

### 4. MCP 서버로 외부 데이터 연동

타로 카드 데이터처럼 정형화된 외부 데이터가 필요한 경우, **MCP (Model Context Protocol) 서버**를 만들어서 Claude가 직접 참조하게 할 수 있다. 매번 프롬프트에 데이터를 붙여넣는 것보다 효율적이다.

## 정리

- **큰 기능은 3단계 이상으로 쪼개서 시킨다.** 한 문장 프롬프트는 결과 편차가 크다.
- **번역은 2패스 — 생성 + 검증.** 검증 프롬프트가 없으면 오역이 반드시 생긴다.
- **LLM 프롬프트는 라운드 방식으로 개선한다.** 현재 결과를 보여주고 구체적 문제를 지적한다.
- **제품 의사결정은 AI에게 맡기지 않는다.** "what"은 사람이, "how"는 AI가.

<details>
<summary>이번 작업의 커밋 로그</summary>

`4f9c985` — feat(compat): complete overhaul — birth time, 6 sections, i18n, pricing
`a4384ed` — feat(admin): add data export (JSON/MD) and comprehensive event tracking
`0224e25` — feat(i18n): comprehensive translation overhaul across all 8 locales
`2350272` — fix(i18n): fix mistranslations across en, hi, th, id locales
`2812f4a` — fix(nav): add compatibility and palm to desktop topNav
`c01625e` — fix(nav): show daily, saju, compatibility, palm in menu
`342af78` — fix(nav): show only daily/saju in menu, restrict language selector to home
`e9dc18d` — fix(nav): remove tarot from nav (not public yet), add name/작명
`2ecb14f` — feat(tarot): add AI tarot reading product with 78-card deck
`af4f359` — feat: comprehensive platform improvements
`fc6c90a` — fix: add missing useEffect deps in ShareButtons
`dd0500e` — feat(share): add viral sharing for palm and compat reports
`3dfa113` — fix: engine round 4 - locale-specific thresholds, cultural fixes, palmistry depth
`4ee1cfc` — fix: engine round 3 - eliminate prompt redundancy, raise compat threshold
`eaa04ca` — fix: engine round 2 - QA fixes for prompt coherence and validation
`fe82dc3` — feat: engine upgrade round 1 - palm prompt overhaul + compat data
`dfd4911` — fix: 7 quick wins - compat SVG ring, daily streak, mobile TOC, i18n
`4247fd0` — fix: comprehensive QA fixes across design, validation, UX, code
`895b004` — feat(paywall): redesign each paywall with distinct visual identity
`d129ed6` — fix: remove fake social proof, fix broken CTAs, add visual report

</details>
