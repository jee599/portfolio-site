---
title: "Preterview 72시간 총공: Claude Code 676 tool call, 결제·아웃리치·광고 인프라 동시 구축"
project: "portfolio-site"
date: 2026-06-25
lang: ko
tags: [claude-code, preterview, paddle, marketing, google-ads, workflow]
description: "72시간 3개 세션·676 tool call로 Preterview 런칭 인프라를 구축했다. Paddle KYC 거절·도메인 리뷰 탈락이라는 삽질이 있었지만, GA4+네이버 전환 픽셀 설치, 192개 교육기관 콜드메일 초안, 네이버·구글 광고 카피까지 완성했다."
---

72시간 동안 Claude Code 3개 세션이 서로 다른 전선을 동시에 파고들었다. 세션3은 콜드메일 아웃리치(303 tool call), 세션4는 결제 통합(211 tool call), 세션6은 광고 인프라(162 tool call). 합산 676 tool call, 전부 Preterview 런칭 준비였다.

**TL;DR** 192개 교육기관 콜드메일 초안 완성, Paddle은 두 번 거절당하고 이의 제기 중, GA4+네이버 전환 픽셀 설치 완료. 결제만 빼면 광고 인프라는 갖춰졌다.

## 192개 교육기관 콜드메일을 어떻게 뽑았나

세션3의 시작은 단순했다. "판매하는 한 페이지나 이메일 양식 하나 만들어줘." 대화가 전개되면서 요청이 달라졌다.

"크롤링해서 국내/국외 모든 대학교 입학처나 학원/교육기관에 이메일 보내는 거야."

Dynamic Workflow를 두 번 돌렸다. 첫 번째는 95개 기관(실측 공개 이메일 92개), 두 번째에서 198개로 확장했다(국내 72, 국외 113). 추측 이메일은 아예 생성하지 않도록 프롬프트에 박아 넣었다.

기관별 개인화가 핵심이었다. 초안 검토 과정에서 "워크숍 연계" 같이 실현 불가능한 제안은 피드백 한 번에 전부 걷어냈다. 최종 카피에 들어간 구체적 수치는 "면접당 2달러 내외의 API 비용만 받는 프로모션 기간"이었다. "공짜로 줄 수는 없잖아"라는 피드백 그대로 반영했다.

결과물: `~/preterview/marketing/` 아래에 `preterview-sales.html`, `preterview-email-univ.html`, `cold-emails.md`, `send_outreach.py`(CSV 스로틀 발송 스크립트). Edit 70번, Bash 109번, Gmail 드래프트 생성 MCP 20번이 이 세션에서 쓰였다.

메일에 30초 데모 영상을 넣으려는 시도도 있었다. `<video>` 태그, GIF 임베드, 오버레이 HTML 등을 연달아 시도했는데 전부 이메일 클라이언트 보안 정책에 막혔다. "계속 안 되는데 해결 못 할 거면 그냥 빼"라는 한마디로 정리됐다. 정적 스크린샷에 링크를 다는 방식으로 교체.

## Paddle, 두 번 거절당한 과정

세션4는 `feat/paddle-checkout` 브랜치 검토로 시작했다. Paddle MoR 해외 결제를 통합한 23커밋짜리 브랜치가 미머지 상태였다.

첫 번째 문제: 기존 계정이 예전에 fortunelab으로 신청했다가 반려된 상태였다. KYC가 만료돼 재신청도 안 됐다. 새 계정을 처음부터 만들어 환경 변수를 세팅했다.

```
PADDLE_VENDOR_ID=...
PADDLE_API_KEY=pdl_live_apikey_...
PADDLE_WEBHOOK_SECRET=ntfset_...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_...
```

도메인 `preterview.com`을 등록하고 리뷰를 기다렸다. 결과는 거절이었다. 이유가 핵심이었다.

> "we identified the following product categories on this domain: Other/Resume/CV Builders, Human Services/Consulting or Advisory Services"

AI 모의면접을 이력서 빌더 또는 컨설팅 서비스로 분류했다. Paddle Acceptable Use Policy 범위 밖. Typeform 이의 제기 양식을 통해 반박 자료를 제출했다. 주장 요지는 "전부 AI 자동 생성, 사람 인터뷰어·코치·컨설턴트 0"이었다.

세션 종료 시점에는 한국 결제 대안(레몬스퀴지, 테크원)을 탐색했다. 크레딧 판매 방식이 특정 PG에서 지원 안 된다는 점도 함께 확인했다.

이 세션에서 파생된 부산물: terms, privacy, refund 법적 페이지 3개 신설(`app/[locale]/terms`, `privacy`, `refund`), 관리자 결제 환불 페이지, `lib/payments/packs.ts` 가격 팩 정리. Bash 104번, Chrome MCP 27번(Paddle 대시보드 브라우저 자동화), Edit 24번.

## 광고 전략: 네이버·구글 카피 + 픽셀 설치

세션6은 "인스타가 나아? 얼마를 어떤 타겟에 태우는 게 가장 효과적인지"로 시작했다. 예산 기준 50만원.

Dynamic Workflow 4개가 순차적으로 돌았다. 플랫폼별 CPC·도달·CTR 실측 수집 → 3개 실행 에셋 제작(네이버 파워링크, Reddit 크리에이티브, 픽셀+랜딩 체크리스트) → 채널별 예산·기대 효과 퍼널 모델 → 네이버 파워링크 최적 키워드 실측 조회 순서였다.

결론은 네이버 파워링크였다. "면접말버릇", "면접습관교정" 같이 CPC가 낮으면서 전환 의도가 명확한 고유 키워드를 S급으로 분류했다. 범용 키워드("AI 면접 연습")는 경쟁이 붙어서 가성비가 안 나왔다. 구글 검색도 병행해서 한국어·영어 RSA 카피를 함께 뽑았다.

픽셀 설치는 두 플랫폼을 동시에 진행했다.

GA4는 `.env.local`에 `NEXT_PUBLIC_GA_ID=G-ES6SENFGM2` 추가, `layout.tsx`에 Next.js `Script` 컴포넌트로 삽입했다. 네이버 전환 추적은 비즈채널 신청(검수 통과) → 전환 추적 자가설치 신청까지 마쳤고 안내 메일 대기 중이다.

GEO/AEO도 같은 세션에서 다뤘다. ChatGPT·Perplexity·Gemini·Google AIO에서 "모의면접" 쿼리 시 Preterview가 인용되도록 하는 전략 보고서가 Dynamic Workflow로 나왔다. 랜딩 페이지 CRO 오디트도 병행해서 `DEFAULT_SIGNUP_BONUS = 200`(크레딧 200개 무료 제공) 등 전환 요소를 점검하고 카피를 수정했다.

## 나머지 세션들

**동백유디치과 정기 측정** (세션1, tool call 2개): `dental-clinic` 서브에이전트 한 번 호출로 공개 데이터 실측 → inbox 판독 → 기록 → 대시보드 → 다이제스트까지 자동화됐다. '동백 임플란트' 블로그 순위가 경쟁사 도배로 12위 밖으로 밀렸다가 3위로 복귀한 걸 확인했다. 메인 세션에서 쓴 tool call은 단 2개.

**지원사업 서칭** (세션2, 67 tool call): 치과광고대행·AI모의면접·개인사업자 세 갈래에 맞는 정부·민간 지원사업을 재검증했다. 이틀 전(6/22) 42건 검증 자료 위에 6/24 기준 재실측을 얹었다. 이번 주 실제 액션 기준: 판교허브 밸류업(6/24 마감), K-Global 멘토링(6/30), NPU(6/29). Preterview IR 자료도 이 세션에서 만들었다.

**머니투데이 굿컴퍼니대상 메일** (세션5, 5 tool call): "2026 대한민국 굿컴퍼니대상 AI 모의면접 서비스 부문 수상" 초청 메일이 왔다. 웹 검색 4번으로 패턴 분석 완료. 유료 수상 스킴 — 상은 미끼고 실제 청구 항목은 "취재지원 멤버십"과 광고비다. 거절.

## 정리

10 세션, 750+ tool call, 3일. Preterview 기준으로 마케팅 에셋·광고 인프라·법적 페이지·GA4+네이버 픽셀이 동시에 진행됐다. 결제 통합은 Paddle 도메인 거절로 미완이고 이의 제기 진행 중이다.

이번에 배운 것: AI 서비스를 외부 PG에 등록할 때 "AI = 사람 대체 자동화"라는 점을 서면으로 명확히 해야 한다. 카테고리 분류를 PG 측에 맡기면 "이력서 빌더"나 "컨설팅"으로 잘못 읽혀서 거절당한다. 처음 제출 시 제품 설명에 이 구분을 박아 넣는 게 맞다.
