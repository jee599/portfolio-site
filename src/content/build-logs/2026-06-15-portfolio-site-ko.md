---
title: "Claude Code + 11개 세션, 1,085 tool call로 하루에 뭘 만들었나"
project: "portfolio-site"
date: 2026-06-15
lang: ko
tags: [claude-code, next-js, godot, security-audit, mobile-ui, multi-agent]
description: "하루 11개 세션, 1,085 tool call. 포켓몬 카드 시세 사이트 신규 구축부터 사주 프로젝트 보안 감사, Godot 스프라이트 파이프라인까지 병렬 처리한 기록."
---

하루에 `Bash` 357번, `Edit` 240번, `Read` 191번, `Write` 131번. 11개 세션, 총 1,085 tool call이 2026-06-15 하루치 작업 로그다.

**TL;DR** Claude Code 멀티에이전트 팬아웃으로 포켓몬 카드 시세 사이트(파일 90개+)를 하루 만에 신규 구축했다. 그 사이 사주 프로젝트 감사, Godot 스프라이트 파이프라인, coffeechat 모바일 감사, Codex cron 아키텍처까지 5개 프로젝트를 동시 진행했다.

## yuyutei가 막혔다, 그래도 20시간 만에 90개 파일을 뽑았다

세션 2는 342 tool call, 약 20시간. 이번 주 가장 무거운 작업이었다. 요구사항이 처음부터 복잡했다. 일본 카드 시세, 이전 시세 비교, 희귀도 필터, 예측, 상자·팩별 분석, JPY+KRW 이중 통화 지원.

유유테이(yuyutei) 스크래핑을 시도했지만 막혔다. TCGdex가 무료에 일본어 지원, 이미지+희귀도+시세를 전부 제공한다는 걸 확인하고 TCGdex+TCGcsv 조합으로 전환했다. 스택은 Next.js+TypeScript / Vercel / Neon Postgres+Drizzle / Tailwind v4.

ultracode 모드로 데이터 소스 검증 에이전트를 병렬 팬아웃한 뒤, DB 스키마부터 provider 어댑터, signals 로직, 전체 UI 컴포넌트까지 한 세션에서 90개 이상의 파일을 생성했다. GitHub 레포도 이 세션에서 신규 생성했다.

단일 컨텍스트로 데이터 소스 검증과 스키마 설계를 순차 진행했으면 세션 시간의 절반을 소모했을 것이다.

## `STATUS.md`가 거짓말하고 있었다 — 사주 프로젝트 전수 감사

세션 5(142 tool call, 1시간 42분)는 `saju_global` 프로젝트 전수 감사였다. 결제 레일(Toss+PayPal), 웨이트리스트, Meta Pixel, OG/카드, 환불, 환율, 어드민 — 7개 에이전트를 병렬로 띄웠다.

`STATUS.md` 헤더가 "Toss+Lemon Squeezy"로 적혀 있었지만 실제 코드는 PayPal로 이미 전환된 상태였다. 문서와 코드가 따로 놀고 있었던 것.

더 심각한 건 EU 방문자 USD 결제 허용 문제였다. EU 방문자가 USD로 결제할 수 있으면 VAT 의무가 발생한다. 블로커로 분류하고 차단 시장은 웨이트리스트로 전환했다. AI 카피 제거, Meta Pixel 연동, PayPal 환불 핸들러 수정까지 한 세션에서 처리했다.

7개 영역을 순차 감사했으면 블로커 하나를 찾는 데 전체 흐름이 막혔을 것이다.

## `gitleaks 8.30.1` — 히스토리까지 스캔해야 하는 이유

세션 6(34 tool call, 25분)은 데이문 프로젝트 보안 감사였다. `jee599` 계정 public 레포 전수 스캔. `gitleaks 8.30.1`을 설치하고 현재 파일이 아닌 git 히스토리까지 스캔했다.

파일을 삭제해도 커밋 히스토리에 시크릿이 남아있으면 public 레포에서는 그대로 노출된다. 위험 확인 후 git 히스토리 정리 방향을 결정했다. 로컬 3 커밋은 이 세션에서 origin에 푸시했다.

## Godot + `gpt-image-2` — 스프라이트 파이프라인을 141 tool call로

세션 7(141 tool call)은 게임 프로젝트였다. Guild Master와 무협 3안, 총 4개 기획서를 에이전트 2개를 동시에 돌려 병렬 정독하고 OSS 스프라이트 도구를 리서치했다.

`gpt-image-2`로 walk 애니메이션 스프라이트를 생성하고 alpha channel 처리까지 확인했다. `game-concepts-preview` 레포를 신규 생성하고 에셋 파이프라인을 문서화했다. AI 이미지 생성 도구를 게임 개발 초기 프로토타이핑에 연결하는 파이프라인을 실험한 첫 케이스다.

## 8개 에이전트 + Chrome 실측 — coffeechat 모바일 감사

세션 8(161 tool call, 1시간 46분)은 coffeechat 프로젝트 모바일 UI 감사였다. 글로벌·내비, 랜딩, 이력서, 포트폴리오, 면접, 결제·어드민 — 8개 에이전트로 정적 감사를 먼저 돌렸다.

정적 감사로 끝내지 않고 Chrome을 모바일 390px로 실제로 띄워 실측 검증했다. `mcp__claude-in-chrome`을 13번 호출했다. 정적 코드 분석과 실제 렌더링 결과가 다른 케이스가 있었다.

수정 결과: nav 개선, resume preview 수정, signup route 신규 생성, disposable-email 필터링 추가. 정적 감사만 했으면 signup route 문제는 못 잡았을 것이다.

## 70KB heredoc을 외부 JSON으로 — Codex 4명이 전부 request-changes를 냈다

세션 9~11(59+122+59 tool call)은 `local-commerce-agent` Codex cron 아키텍처 작업이었다.

문제는 구조였다. 70KB bash 워커 heredoc에 로직이 하드코딩돼 있었다. Claude가 정책 설계자, Codex가 반복 실행자 역할을 맡는 분업 구조를 먼저 정립했다. 그런 다음 로직을 `jdlab-codex-cron-policy.json`과 `jdlab-codex-lanes.json` 외부 파일로 분리했다.

4명 Codex 리뷰어가 모두 request-changes를 냈다. 블로커를 수정한 뒤 PASS를 받았다. 처리량은 `min_per_lane` 12→30으로 올리고, 큐 사이즈를 확장하고, country-gate 모듈을 추가했다.

heredoc에 로직을 박아두면 정책을 바꿀 때마다 bash 파일 전체를 수정해야 한다. 외부 JSON으로 분리하면 Codex가 정책 파일만 읽고 실행하는 구조가 된다.

## 1,085 tool call이 말하는 것

숫자보다 패턴이 중요하다. 오늘 작업의 공통점은 전부 병렬 팬아웃이었다. 포켓몬 카드 시세 사이트 데이터 소스 검증, 사주 프로젝트 7개 영역 감사, coffeechat 8개 영역 정적 감사, Godot 도구 리서치.

순차 처리였으면 하루에 2~3개 세션이 한계였을 것이다. `Bash` 357번 중 상당수는 `gitleaks` 실행, 빌드 확인, git 상태 점검이다. `Edit` 240번은 기존 파일 수정, `Write` 131번은 신규 파일 생성, `Read` 191번은 감사와 검증 과정에서의 코드 확인. 숫자가 작업의 성격을 그대로 보여준다.
