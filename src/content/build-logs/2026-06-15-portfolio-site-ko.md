---
title: "Claude가 설계하고 Codex가 실행한다 — 14세션, 1,100+ tool call 기록"
project: "portfolio-site"
date: 2026-06-15
lang: ko
tags: [claude-code, next-js, codex, cron-architecture, pokeprice, godot, security]
description: "포켓몬 카드 시세 사이트 0→1, Claude-Codex 분업 크론 아키텍처 8세션 반복 개선, gitleaks 보안 감사까지. 14세션 1,100+ tool call의 실제 과정."
---

14개 세션, 약 1,100번의 도구 호출. 그 중 포켓몬 카드 시세 사이트 하나에만 342번이 집중됐다. 나머지는 `local-commerce-agent` Codex 크론 아키텍처를 8세션에 걸쳐 반복 개선하는 데 쓰였다.

**TL;DR** 일본 포켓몬 카드 시세 추적 사이트를 데이터 소스 검증부터 95개 파일까지 단일 세션으로 완성했다. 그 주변에서는 Claude가 정책을 설계하고 Codex가 실행하는 분업 구조를 반복 개선하는 작업이 조용히 진행됐다.

## /tmp 스크립트 6개로 먼저 검증하고 코드를 짰다

세션 2는 이 기간 가장 무거운 작업이었다. Edit 96회, Bash 92회, Write 84회, 총 342 tool call. 소요 시간 약 20시간.

시작 프롬프트: "일본 포켓몬 카드 시세 사이트 만들고 싶어. 현재 시세, 이전 시세, 희귀도, 전망, 상자·팩별 분석, JPY+KRW 이중 통화."

첫 번째로 한 일은 코드를 짜는 게 아니었다. 일본판 포켓몬 카드 데이터 소스부터 검증했다. `pokemontcg.io`는 영문 중심이라 일본판 커버가 안 된다. 실제로 `/tmp/tcgdex-ja.mjs`, `/tmp/probe-yuyutei.mjs` 같은 임시 스크립트 6개를 만들어 API 응답 구조를 먼저 확인했다.

결과:
- **TCGdex** — 무료, 키 불필요. 일본어 포함 10개 언어, 카드 카탈로그·이미지·희귀도·USD/EUR 시세 전부 제공
- **유유테이(遊々亭)** — 일본 최대 싱글 카드 마켓, 엔화 실거래가 제공
- **PriceCharting** — 과거 시세 히스토리 보완

소스가 확정되자 `src/lib/providers/` 추상화 레이어를 먼저 설계했다. `tcgdex.ts`, `yuyutei.ts`, `tcgcsv.ts`를 각각 독립된 provider로 만들어, 나중에 유료 API 키로 전환하거나 소스를 바꿔도 나머지 코드를 건드릴 필요가 없는 구조다.

스택: Next.js 15 + React 19 + Tailwind v4 / Neon Postgres + Drizzle / Vercel Cron. "하루 1번 갱신, 나머지는 DB에" 요구사항이 DB 선택을 결정했다. 설계 후 DB 스키마, provider 어댑터, 시세 예측 신호(`signals.ts`), UI 컴포넌트 전부를 한 세션에서 완성했다. 최종 파일 수 95개.

## 70KB heredoc 밖으로 — Claude 설계, Codex 실행

세션 6부터 14까지 8개 세션이 `local-commerce-agent` 프로젝트에 집중됐다. Tool call 합산 약 575회.

원래 구조의 문제는 하나였다. 70KB bash 워커의 heredoc 안에 모든 로직이 하드코딩돼 있었다. 정책을 바꾸려면 bash 파일 전체를 수정해야 했다.

세션 6(74 tool call)에서 아키텍처를 재설계했다. **Claude가 정책과 계약 파일을 설계하고, Codex가 매 크론 틱마다 그 파일을 읽어 실행하는 분업 구조.** 로직을 `jdlab-codex-cron-policy.json`과 `jdlab-codex-lanes.json`으로 외부화했다. 운영 계약은 `docs/jdlab_codex_cron_operating_contract.md`에 별도로 문서화.

세션 7(122 tool call)은 Codex 4명의 독립 리뷰 결과를 받아 블로커를 수정하는 작업이었다. 리뷰어 4명이 모두 `request-changes`를 냈다. 공통 블로커: country-gate가 후처리였다(상류에서 `priority_experiment_sendable`을 할당한 뒤 하류에서 국가 필터를 적용해 "8 priority, 2 green" 누수 발생). `jdlab-country-gate.mjs` 모듈을 신규 생성해 상류에서 차단하는 구조로 교체했다.

이후 세션들은 누적이었다. `min_per_lane` 12→30으로 처리량 상향(세션 8), sendable-first 발견 로직으로 전환(세션 10), 로컬 크롤러 핸드오프 — Codex 샌드박스의 DNS/HTTPS 신뢰성 문제를 우회해 크롤링을 Hermes 로컬 스크립트로 이관(세션 12~14).

반복 구조가 패턴이 됐다: Claude 구현 → Codex 독립 리뷰 → 블로커 수정 → 재검증. 세션이 쌓일수록 시스템의 계약이 코드보다 명확해졌다.

## gitleaks가 히스토리까지 스캔하는 이유

세션 11(34 tool call)은 보안 감사였다. `jee599` 계정 public 레포 전수 점검.

`gitleaks 8.30.1`을 설치하고 현재 파일이 아닌 git 히스토리 전체를 대상으로 스캔했다. 이유: 파일을 삭제해도 커밋 히스토리에 시크릿이 남아있으면 public 레포에서 그대로 노출된다. 전용 스캐너 없이 grep으로만 확인하면 히스토리를 놓친다.

데이문 레포는 이 세션에서 로컬 3 커밋을 origin에 푸시했다. 워킹 트리는 깨끗했고, 히스토리 정리 방향은 확인 후 결정했다.

## Godot + GPT Image 2 스프라이트

세션 5(141 tool call)는 게임 기획서 리뷰 + 스프라이트 생성 실험이었다.

Guild Master(판타지 용병단 경영 시뮬)와 무협 3안, 총 4개 기획서를 병렬 에이전트로 정독했다. OSS 스프라이트 생성 도구를 리서치하면서 `gpt-image-2` API로 walk 애니메이션 스프라이트를 직접 생성했다. `gen_rows_gpt_image.py` 스크립트로 5단계 동작 픽셀아트 시트를 뽑아내고 alpha channel 처리까지 확인했다.

"walk가 조금 어색한데?"라는 피드백이 왔다. 프롬프트 튜닝 후 재생성. 매번 양질의 결과를 뽑으려면 일관성 기법이 필요하다는 걸 확인했다 — 같은 character description seed + negative prompt 고정이 핵심이었다.

## 숫자의 분포

14세션의 tool call 분포를 보면 작업 성격이 보인다:

- 세션 2(pokeprice): Bash 92, Edit 96, Write 84 — 탐색·구현·생성이 균형 있게 분포
- 세션 7(Codex 크론 final fix): Edit 36, Bash 35, Read 32 — 기존 코드 수정 중심
- 세션 5(Godot): Bash 72, Read 21, Write 16 — 파일 탐색과 실행이 주도

`Bash`가 많은 세션은 검증과 탐색, `Edit`가 많은 세션은 기존 코드 수정, `Write`가 많은 세션은 새 파일 생성이 주였다. 이 분포 자체가 세션의 성격을 숫자로 드러낸다.
