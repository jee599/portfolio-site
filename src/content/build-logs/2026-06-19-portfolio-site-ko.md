---
title: "Claude Code 939번: 사주봇 실가동 삽질, 37에이전트 보안 감사, 결제 스택 이틀 구축"
project: "portfolio-site"
date: 2026-06-19
lang: ko
tags: [claude-code, workflow, preterview, 사주, 결제, 보안감사]
description: "이틀 9세션 939번 도구 호출. 사주 X봇이 git에 없었던 삽질부터 37개 에이전트 Preterview 보안 감사, coffeechat→preterview 리네임, Payapp 결제 연동까지."
---

이틀간 9개 세션, 939번의 도구 호출. 사주 프로젝트, Preterview, 치과 마케팅 세 프로젝트가 동시에 굴러갔다. 그 과정에서 Claude Code가 어떻게 쓰였는지 기록한다.

**TL;DR** 사주 X봇은 "만들었다"고 믿었는데 git에 커밋조차 없었다. Preterview는 37개 에이전트 병렬 감사로 시작해 전체 리네임과 결제 시스템까지 하루 만에 달렸다.

## "봇 만들었잖아"가 완전히 틀린 이유

6/17 세션에서 사주 프로젝트 X 자동 포스팅을 "실발행해줘"라고 했다. 돌아온 결과가 당황스러웠다.

```bash
git ls-files apps/web/lib/xbot/
# → (아무 출력 없음)
```

프로덕션 `/api/cron/x-post` → **HTTP 404**. 봇은 6/15에 로컬에서 만들었지만 커밋도, 배포도, X API 키 등록도 하나도 안 됐다. cron은 6시간마다 돌고 있었고 실제 트윗은 0건이었다.

진단→커밋→Vercel 키 등록까지 한 세션에서 끝냈다 (Bash 58번, Edit 9번). 이후 세션에서 실제 생성물을 보니 AI 티가 났다 — "This tweet resonates deeply"처럼 메타 표현이 섞였다. `voices.ts`와 `cohorts.ts`를 손봐서 banned 단어 리스트를 박고, "sharp friend who knows saju" 톤으로 재설정해 재발행했다.

## 37개 에이전트가 하루 만에 보안 감사를 끝냈다

이 기간의 하이라이트는 Preterview 코드베이스 7개 차원 동시 감사다. 보안·이력서 점검·포트폴리오·면접 리얼함·보고서 정확성·보고서 디자인·토큰 효율을 각각 독립 에이전트로 팬아웃했다.

37개 에이전트, Edit 139번, Read 78번, Bash 66번 — 총 357 tool calls가 세션 하나에서 나왔다.

주요 발견 중 두 가지는 적대적 검증(adversarial verify) 단계에서 기각됐다. 발견 에이전트가 올린 주장을 반박 에이전트가 실제 코드에 대조해 뒤집은 것이다. 이 단계 없이 나온 감사 결과였으면 거짓 양성이 섞였을 거다.

실제로 확인된 고위험 버그들은 바로 수정에 들어갔다: PayPal 금액 위변조 방어, 관리자 IDOR 패치, `ratelimit-db.ts` 신규 생성으로 rate-limit DB 마이그레이션. 한 번 면접 보고 보고서 받으면 두 번째 면접을 못 시작하는 버그도 이 세션에서 잡혔다 — 클라이언트 상태 머신이 `completed` 상태를 리셋하지 않는 문제였다.

## coffeechat → preterview: GitHub, Vercel, 폴더 한 번에

세션 8에서 "래포랑 깃 관련해서 프리터뷰로 다 바꿔줘" 한 줄이 생각보다 큰 작업이었다.

패키지명·브랜드 표시는 이미 preterview로 돼 있고, 저장소 식별자만 남아있었다. `gh api`로 GitHub 레포명 변경, `.vercel/project.json` 수정, origin URL 갱신. 문제가 있었는데 Vercel CLI에 `rename` 명령이 없었다. 그래서 REST API를 직접 쳤다.

```bash
curl -X PATCH "https://api.vercel.com/v9/projects/coffeechat" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"preterview"}'
```

토큰은 서브셸 변수 안에서만 살았고 출력엔 노출하지 않았다. 이후 `git ls-remote`로 새 원격 연결을 검증하고 완료.

## 결제 스택 구축: 카카오페이 → 토스 → Payapp

결제 연동이 가장 우회가 많았다.

카카오페이를 붙이려 했는데 **가맹점 심사**가 필요했다. 심사를 신청하고 나서야 필요한 법적 페이지들(환불 정책, 이용약관, 개인정보처리방침)이 아예 없다는 게 워크플로우 감사에서 잡혔다 — 12개 전자상거래법 필수 항목 중 대부분이 누락됐다.

법적 페이지 3종 생성(`app/[locale]/terms/page.tsx`, `/refund/page.tsx`, `/privacy/page.tsx`)과 footer 사업자 정보 표시까지 처리했다. 통신판매업 신고번호(2026-성남분당A-0452)도 넣었다.

토스페이먼츠는 수수료가 부담스러워 결국 **Payapp**을 선택했다. `lib/payments/payapp.ts` 신규 생성 후 pricing 페이지에 연결했다.

한국 사용자에게만 카카오·네이버 페이를 보여주는 건 Cloudflare의 `cf-ipcountry` 헤더로 해결했다.

```typescript
// lib/geo.ts
export function getCountry(req: Request): string {
  return req.headers.get('cf-ipcountry') ?? 'US'
}
```

## 숫자로

| 항목 | 수치 |
|---|---|
| 세션 수 | 9개 (6/17~6/18) |
| 총 tool calls | 939+ |
| 워크플로우 에이전트 | 37개 (보안 감사) + 24개 (GTM 리서치) |
| 수정 파일 수 | 50개+ |
| 신규 생성 파일 | 20개+ |

세션 5 혼자 357 tool calls, Edit 139번이다. 이 정도면 컨텍스트 압박이 온다. 워크플로우로 팬아웃하면 메인 컨텍스트는 가볍게 유지하면서 에이전트들이 각자 결과만 돌려준다 — 대규모 감사 작업에 이 패턴이 맞다.
