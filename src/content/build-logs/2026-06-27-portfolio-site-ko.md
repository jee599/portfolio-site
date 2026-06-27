---
title: "Paddle 두 번 거부 → Polar 피벗: 결제사 심사가 이렇게 복잡할 줄"
project: "portfolio-site"
date: 2026-06-27
lang: ko
tags: [claude-code, preterview, paddle, polar, payment, ultracode, workflow, dental-clinic]
description: "preterview.com에 Paddle MoR 붙이려다 두 계정 연속 거부. ultracode로 결제사 11개 병렬 리서치 후 Polar로 방향 틀었다. 광고 리서치 24에이전트·880k 토큰, 치과 블로그 순위 결과까지 — 7세션 448+ tool calls"
---

Paddle 심사 결과 이메일 두 통이 각각 "Action required(만료)"와 "Not able to enable checkouts"로 돌아왔다. 36시간 동안 KYC 양식 채우고 도메인 검수를 기다렸는데 결과가 이거다.

**TL;DR** preterview.com에 Paddle을 두 계정으로 시도했다가 연속 거부. ultracode로 결제사 6개를 병렬 리서치해 Polar로 피벗했다. 같은 기간 광고 전략 리서치(24 에이전트), 치과 블로그 2편 순위 상위 진입, 결제사 스팸 메일 판별까지 7세션에서 처리했다.

## 첫 번째 Paddle: KYC 만료

첫 계정은 이전에 FortuneeLab으로 신청했다가 심사가 만료된 상태였다. 대시보드를 열었더니:

```
Verification status: Action required
We're unable to verify your identity as the 
verification process has expired.
```

재신청은 Customer Support를 거쳐야 했다. 곧바로 새 계정을 만들기로 결정. 211 tool calls 세션에서 product catalog 3개(Starter 800cr/$7.99, Standard 5,000cr/$39, Pro 12,000cr/$79), client-side token, webhook까지 세팅했다. `feat/paddle-checkout` 브랜치(23커밋, 47개 파일, +4,960줄)도 main에 클린하게 머지했다.

## 두 번째 Paddle: 도메인 거부

새 계정으로 `preterview.com`을 등록하고 이틀 기다렸다. 돌아온 이메일:

> We identified the following product categories on this domain:
> **Resume/CV Builders**, Human Services/Consulting or Advisory Services.
> These categories fall outside what Paddle is able to support.

AI 모의면접 서비스인데 "이력서 빌더 + Human Services"로 분류됐다. Appeal 폼에 "완전 자동화 AI, 사람 코치·컨설턴트 0명, 순수 소프트웨어 제품"이라고 명시해서 재심사를 넣었다.

## ultracode: 6개 리서치 에이전트, 28분

두 번째 거부 직후 ultracode 모드를 켰다. 프롬프트 하나:

```
preterview 결제 붙일 수 있는거 뭐가 있어?
paddle은 심사중이야 얼마나 걸려?
lemon squeezy나 polar는 어떄? 크레딧 때문에 안돼? 한국꺼는?
```

Workflow가 6개 리서치 에이전트를 병렬로 돌렸다.

- Paddle 심사 실제 소요 기간 — 공식 "48시간"은 마케팅, 실제 2~4주
- Lemon Squeezy의 Stripe 인수 후 신규 가입 안정성
- Polar의 한국 개인 셀러 KYC 범위
- Stripe 한국 셀러 직접 가입 가능 여부
- 한국 PG사 해외 결제 커버리지
- AI usage-credit의 "stored value" 규제 해당 여부

4개 핵심 주장은 적대적 교차검증 에이전트를 별도로 돌렸다. 12 tool calls, 28분 만에 결론이 나왔다.

| 결제사 | 판정 | 이유 |
|-------|------|------|
| Paddle | 보류 | 도메인 거부, Appeal 결과 미정 |
| Lemon Squeezy | 비추 | Stripe 인수 후 신규 SaaS 불안정 |
| Stripe | 불가 | 한국 셀러 직접 가입 없음 |
| 한국 PG | 후순위 | 개인사업자 등록 후 검토 |
| **Polar** | ✅ 즉시 가능 | Individual KYC, usage-based 지원 |

## Polar 온보딩: Individual vs Business

"개인사업자 있어도 Individual 맞아?"라는 질문에서 Claude Code가 핵심을 짚었다. 해외 플랫폼의 Business 선택지는 법인(incorporated entity) 전제다. 한국 개인사업자는 자연인이라 W-8BEN(개인)이 맞고 W-8BEN-E(법인)가 아니다. Business로 가면 서류 불일치로 막히는 구조.

실제 온보딩 선택:
- Using Polar as: **Individual**
- What are you selling: **Software / SaaS**
- Pricing model: **Usage-based** (AI credit 충전형)

## 광고 리서치: 24 에이전트, 880k 토큰

결제와 별개로 광고 채널 결정이 필요했다. ultracode로 Workflow를 띄웠다.

```
preterview 광고 태우려고 하는데 인스타가 나아?
얼마를 어떤 타겟에 태우는게 가장 효과적인지
객관적인 수치랑 근거로 서칭해줘. 국내/글로벌 모두
```

24개 에이전트가 병렬로 돌았다. 약 880k 토큰, 245 웹 tool-uses. 13개 핵심 수치를 적대적 검증 에이전트가 교차 확인해서 수정했다 — 검증 전 숫자를 그대로 쓰지 않는 게 여기서 빛을 발했다.

결론: 50만원 예산이면 **네이버 파워링크** 단일 집중. 가성비 상위 키워드는 `면접말버릇`, `면접습관교정` — 검색량 중간, CPC 70~120원, 전환 의도 높음. 게임 업계 키워드(`게임회사면접`)는 검색량이 너무 작아서 후순위. 네이버 파워링크 카피와 구글 RSA 카피도 세션 안에서 뽑았다.

GA4(`G-ES6SENFGM2`)와 네이버 전환 추적 픽셀을 `app/layout.tsx`에 추가하고 main에 머지했다. `components/marketing/analytics-scripts.tsx`, `lib/marketing/conversions.ts`, `lib/marketing/track.ts` 신규 생성. 네이버 비즈채널 검수 당일 통과.

## dental-clinic 서브에이전트: 측정 결과

동백유디치과 정기 측정을 전담 에이전트에 위임했다. 메인 세션 tool call은 `Agent(1)` 하나.

에이전트가 `~/dental-promo/dongbaek-uddental/` 아래 `clinic.json`, `cache`, `history.json`을 읽어 컨텍스트를 복원하고, `_kb/blog_probe.py`로 7개 키워드 SERP를 실측했다. 결과:

- 1편 '동백 임플란트' → 블로그탭 **3위 복귀** (경쟁사 도배 후 12위 밖으로 밀렸다가)
- 2편 '용인 소아치과' → `동백 소아치과` 키워드 **1위**, `용인 소아치과` 아직 미진입(EXP-004 1차 판정 07-23)

두 글 모두 post 모드 생존 확인. 다이제스트 `digests/measure-2026-06-27.md`(9.1KB) 생성, sync 배포까지 완료(28 files 커밋).

1편 순위가 3위와 12위 밖을 오실레이션하는 이유는 경쟁사 도배 타이밍 의존이다. 글 볼륨이 늘어나야 해결된다.

## 굿컴퍼니대상 메일: 5분 만에 스팸 판별

머니투데이 중기·벤처팀 명의로 "AI 모의면접 서비스 부문 굿-스타트업대상 수상 추천" 메일이 왔다. 내용 중 눈에 걸리는 문구들:

> "취재 지원(멤버십 자격)", "조간지면 5단 광고", "수상을 고사하시면 다른 기업을 추천해야"

WebSearch 4번, 5분. 결론: **"돈 받고 주는 상(유료 수상)"을 광고·멤버십 영업으로 포장한 전형적 패턴**. 진짜 머니투데이가 보낸 메일이라도 상은 미끼이고 실제 상품은 PR 계약이다. 패스.

## 지금 상태

- Paddle Appeal: 결과 대기 중
- Polar: 온보딩 진행 중
- preterview 결제: PayPal(글로벌 USD) 라이브 상태 유지
- 광고: 네이버 파워링크 세팅 완료, 도메인 승인 후 집행 예정

국내 개인사업자가 해외 MoR을 붙이는 건 체크박스 채우는 게 아니다. 서비스 카테고리 분류, KYC 만료, 도메인 심사까지 실제로 두 번 거부당하는 과정이 있다는 걸 이번에 몸으로 확인했다.

도구 통계 (7세션 합산): Bash 230회, Edit 50회, Read 51회, Workflow 12회, Agent 1회.
