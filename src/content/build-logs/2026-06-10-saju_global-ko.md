---
title: "Hermes + Opus 워커 3개 병렬 — 사주 글로벌 리서치 73 tool calls, 합성 직전 크레딧 바닥"
project: "saju_global"
date: 2026-06-10
lang: ko
tags: [claude-code, multi-agent, research, astrology, saju]
description: "Hermes 오케스트레이터가 Claude Opus 워커 3개를 병렬 투입해 FateSaju 글로벌 시장·경쟁사·바이럴 리서치를 73 tool calls로 완료. 최종 합성 직전에 월 한도 소진."
---

Hermes가 `brief.md`를 건넨다. 워커는 그걸 읽고, 웹을 뒤지고, `outputs/` 경로에 파일을 쓴다. 이 단순한 계약으로 하루에 Opus 세션 5개, 73 tool calls가 돌아갔다. 최종 합성 직전에 월 사용량 한도가 터졌다.

**TL;DR** FateSaju 글로벌 진출을 위한 시장·경쟁사·바이럴 리서치를 멀티워커 패턴으로 진행했다. 리서치 파일 3개가 생성됐고 최종 합성 단계에서 크레딧이 소진됐다. PayPal 게이트웨이가 실질 수익화 가능 시장을 KR/US/JP/TH 네 개로 제한한다는 것이 핵심 발견이었다.

## Hermes 패턴 — brief.md 하나로 워커를 통제하다

오케스트레이터(Hermes)는 Claude Code 세션이다. 직접 리서치를 하지 않고 세 워커에게 역할을 분배한다. 각 워커는 별도의 Claude Code 세션으로 실행되고 임무는 단순하다: `brief.md`를 읽고, 지정된 output 경로에 마크다운을 쓰고, 완료를 보고한다.

워커별 분담:
- **Worker A**: 시장·국가·고객 수요 → `outputs/research_market_country.md`
- **Worker B**: 경쟁사·가격·퍼널·포지셔닝 → `outputs/research_competitor_pricing.md`
- **Worker C**: 바이럴·채널·콘텐츠 루프 → `outputs/research_viral_channels.md`

세 세션이 독립적으로 실행됐다. 서로의 컨텍스트를 공유하지 않는다. `brief.md`와 `outputs/` 경로 규약만 공유한다. 각 세션은 11~14분, 14~28 tool calls 수준이었다.

## Worker A — PayPal이 시장을 잘랐다

Worker A는 WebSearch 15회, WebFetch 2회를 돌렸다. 미국·인도·일본·한국·SEA 시장의 수치를 끌어왔다. 야노경제연구소 일본 점술 시장 데이터, Obrio/Nebula 매출 추정, Pew Research 점성술 소비자 인구통계까지 포함됐다.

리서치 중간에 소켓 오류로 파일 쓰기가 실패했다. 세션을 재시작해서 이미 모은 데이터를 기반으로 파일만 다시 썼다.

핵심 발견은 시장 규모가 아니었다. **FateSaju는 PayPal 미지원 국가에서 결제 자체가 차단된다.** VN, ID, IN은 수억 명의 잠재 사용자가 있어도 이미 `REGION_UNAVAILABLE`로 처리돼 있다. 이 필터 하나로 검토 대상 시장이 KR/US/JP/TH 네 개로 좁혀진다. 세계 시장 규모 분석이 아니라 결제 인프라가 전략을 결정하는 구조다.

## Worker B — 경쟁사 4개 클러스터, Agent 4회 병렬

Worker B는 경쟁사를 네 클러스터로 분류했다: 글로벌 AI 점성술 앱 (Nebula, Co-Star, CHANI, Pattern), 라이브 어드바이저 플랫폼 (Keen, Purple Garden, AstroTalk), 한국·일본 로컬 앱, 바이럴 리포트 판매자. 클러스터마다 Agent를 하나씩 디스패치해 리서치를 병렬로 실행했다.

기준점은 FortuneLab의 실제 가격 매트릭스였다. KR ₩5,900 / US $4.99 / JP ¥690 / TH ฿149, 리포트당 단건 결제. 구독 모델이 지배하는 글로벌 경쟁사들과 구조적으로 다르다. 이 차이가 포지셔닝의 출발점이 됐다.

Agent 4회, TaskCreate 5회, TaskUpdate 6회를 썼다. 서브에이전트 결과를 Task로 관리하면서 흘러가는 컨텍스트를 붙잡는 방식이었다. Bash로 결과를 취합하는 단계까지 포함해 총 28 tool calls.

## Worker C — 30개 콘셉트, 제품에 이미 있는 자산에 매핑

Worker C는 숏폼 비디오·메신저 공유 루프·SEO/pSEO·커뮤니티 UGC 네 영역에 에이전트를 병렬 투입했다. 돌아온 데이터를 `STATUS.md`의 실제 제품 기능 목록과 대조했다.

결과물의 핵심은 추상적 전략이 아니었다. **FateSaju에 이미 있는 기능에 바로 붙는 콘셉트들**을 만들어야 했다. 친구 궁합 강제 공유 루프, 사주 카드 이미지 스크린샷, 별자리 일일운세 스트릭, 무료 타로 리드 마그넷, 2,304개 pSEO 페이지 — 이미 전부 존재하는 자산이다. 30개 콘텐츠 콘셉트 모두 실제 기능에 직접 연결됐다.

## 세션 4·5 — 합성 직전에 크레딧이 바닥났다

Worker D의 임무는 세 워커 결과를 읽고 의사결정용 최종 리포트 `.md`와 HTML을 만드는 것이었다. 파일 읽기 4회, Bash 2회. 그리고:

```
You've hit your monthly spend limit · raise it at claude.ai/settings/usage
```

세션 5는 tool call 0개. 같은 메시지로 시작과 동시에 종료됐다.

리서치 파일 3개는 생성됐지만 최종 합성 파일은 만들어지지 않았다. Opus 세션 여러 개를 하루에 연속으로 돌리면 크레딧이 이렇게 빠지는 구조다.

## 도구 통계

| 도구 | 횟수 |
|---|---|
| Bash | 20 |
| WebSearch | 15 |
| Read | 10 |
| Agent | 8 |
| TaskUpdate | 6 |
| TaskCreate | 5 |
| ToolSearch | 4 |
| Write | 3 |

총 73 tool calls, 5개 세션, 실질 작업 시간 약 39분 (세션 1~3 합산).

## 정리

멀티워커 패턴은 독립적 리서치 태스크에 잘 맞는다. 워커 간 컨텍스트 공유 없이 `brief.md`와 `outputs/` 경로 규약만으로 병렬 진행이 가능하다. 브리프가 명확하면 각 워커가 역할 경계를 스스로 유지한다.

단점도 명확하다. Opus를 여러 세션에 동시에 쓰면 크레딧이 예상보다 빠르게 소진된다. 합성 단계까지 예산을 남겨두는 설계가 필요하다. 워커 수를 늘리면 그만큼 최종 합성을 위한 예산이 줄어드는 트레이드오프다.
