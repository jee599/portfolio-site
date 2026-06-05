---
title: "Claude Code ultraplan: jidonglab.com을 마케팅 AI 전문가 포트폴리오로 재정의"
project: "portfolio-site"
date: 2026-06-05
lang: ko
tags: [claude-code, portfolio, open-design, ultraplan, 리디자인, seo]
description: "jidonglab.com을 마케팅·홍보 AI 전문가 명함 사이트로 재포지셔닝. ultraplan 로컬 실행으로 사이드 프로젝트 스캔 후 포지셔닝 확정, Linear·Vercel·Stripe·Toss 4가지 디자인 방향 렌더까지 22 tool calls."
---

같은 날 치과 광고 자동화, PayPal 청구서 API, 글로벌 아웃리치 파이프라인을 돌리고 있었다. 포트폴리오 사이트를 그냥 "빌더 사이드 프로젝트 전시장"으로 두는 게 맞지 않다는 게 자명해졌다.

**TL;DR** `/ultraplan`이 git repo 없음으로 실패해 로컬로 우회했다. jidonglab.com을 "마케팅·홍보 자동화를 직접 만들어 운영하는 1인 전문가 명함 사이트"로 재포지셔닝했고, Linear·Vercel·Stripe·Toss 4가지 디자인 방향 렌더까지 22 tool calls, 10분.

## /ultraplan이 git repo 없다고 죽었다

프롬프트를 치자마자 에러가 떴다.

```
ultraplan: cannot launch remote session —
Background tasks require a git repository (checked: /Users/jidong).
Initialize git or run from a git repository.
```

홈 디렉토리(`~/`)에서 명령어를 쳤는데 git repo가 아니었다. ultraplan의 원격 multi-agent 오케스트레이션은 git worktree를 전제로 하기 때문에 즉시 실패했다.

해결책은 단순했다. `portfolio-site` 레포 디렉토리에서 로컬 ultraplan을 실행했다. 결과는 동일하게 나왔다. 에러가 나와도 당황하지 말고 실행 경로 먼저 확인하면 된다.

## Claude가 먼저 내 사이드 프로젝트를 스캔했다

ultraplan이 시작하자마자 한 첫 번째 작업은 내가 뭘 만들어두고 있는지 파악하는 것이었다. 에이전트 2개가 병렬로 떴다. 하나는 기존 사이드 프로젝트 메모리와 아카이브를, 다른 하나는 2026년 SEO/AEO 트렌드를 조사했다.

스캔 결과로 나온 목록:

- `dental-clinic` 에이전트: 치과별 광고·마케팅 자동화 인프라 (동백유디 진단 보고서, 네이버 플레이스 광고, 블로그 파이프라인)
- `saju_global`: Next.js + 다국어 사주 SaaS, Toss·Lemon Squeezy·PayPal 세 가지 결제 레일 연동
- `local-commerce-agent`: 글로벌 소형 비즈니스 100개/일 리드 파이프라인, 이날 이미 89개 후보 디스커버리 완료

이게 포지셔닝의 근거가 됐다. "AI로 마케팅한다"는 추상적인 주장이 아니라, 실제로 파는 서비스를 직접 만들어 운영한다는 증거가 이미 코드 레벨로 존재했다.

## 포지셔닝 결정: 서비스가 메인, 사이드 프로젝트는 증거

`AskUserQuestion`으로 세 가지 방향 중 하나를 선택해야 했다.

1. 빌더/개발자 — 사이드 프로젝트 전시 중심, 기술 포트폴리오
2. 마케팅/홍보 전문가 — 서비스 판매 중심, 기술은 부차적
3. 전문가/빌더 하이브리드 — *"마케팅·홍보 자동화를 직접 만들어 운영하는 1인 전문가"*

3번으로 확정했다. services-led지만 사이드 프로젝트가 그 서비스의 신뢰 근거가 되는 구조다. 치과 광고 자동화를 팔면서 동시에 그 자동화를 가능하게 하는 도구를 직접 빌드한다. 포지셔닝이 현실과 일치한다.

언어는 KO + EN 동시 론칭으로 잡았다. `/ko`·`/en` 서브패스, `x-default` hreflang, 두 언어 모두 full content. 한국 클라이언트 영업과 글로벌 검색 노출을 처음부터 같이 잡는다.

## Cursor를 뺀 이유

디자인 방향은 modern-tech로 좁혔다. "AI로 만든 티가 나면 안 된다"는 조건 때문에 제네릭 그라디언트·글로우 효과는 처음부터 제외했다.

후보 5개에서 Cursor를 제외했다. Cursor의 warm cream 캔버스가 modern-tech 방향과 충돌하기 때문이다. 나머지 4개를 최종 방향으로 확정했다.

- **Linear** — 다크 베이스, 정밀한 그리드, `--fg-1: #ECEDEE`, 모노스페이스 어센트
- **Vercel** — 흑백 미니멀, `--ds-background-100: #000`, Inter 타이포그래피
- **Stripe** — `#635BFF` 퍼플 어센트, 명확한 CTA 구조
- **Toss** — `#3182F6` 블루, Pretendard, 한국 제품 감성

Toss를 추가로 넣은 이유가 있다. 한국 클라이언트를 상대하는 서비스에서 즉각적인 신뢰를 주는 팔레트고, "트렌디하고 기술적으로"라는 조건에도 맞는다. 4개 방향 모두 같은 카피(실제 홈페이지 콘텐츠)로 렌더했다. 코드 설명이 아니라 눈으로 보고 고르는 방식.

## 사이트 구조 확정

페이지 구성도 이 단계에서 잡았다.

- **Home**: hero(포지셔닝 한 줄) → 서비스 요약 → 증거(프로젝트·실적)
- **Services**: 마케팅 자동화, 콘텐츠 제작, 광고 운영 — 실제로 파는 것
- **Projects**: dental-clinic, saju_global, local-commerce-agent — 서비스의 실증
- **Contact**: jd@jidonglab.com 직통, 간단한 인테이크

SEO/AEO는 설계 단계에서부터 박아뒀다. `alternates.languages`, FAQ schema, 검색 의도별 랜딩 구조. "나중에 추가"가 아니라 처음부터 구조에 넣어야 의미가 있다.

## 이날 전체 통계

세션 8개, 총 809 tool calls. 도구별로는 Bash 314, Edit 195, Read 161, Write 60. 생성 파일 51개, 수정 파일 34개. 포트폴리오 사이트 작업은 하루 마지막 22 tool calls였다.

가장 무거운 단일 세션은 치과 광고 자동화였다 — 623 tool calls, 45시간 13분 세션. dental-promo 인프라 전체(진단 보고서, 블로그 파이프라인, 광고 API 연동, 트래커 사이트 배포)를 그 세션 하나에서 구축했다. 그 결과물이 포트폴리오에 올라갈 증거다.
