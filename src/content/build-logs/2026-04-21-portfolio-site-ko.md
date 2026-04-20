---
title: "서브에이전트 20개 병렬 배포 — dentalad 런칭부터 DEV.to 자동화까지"
project: "portfolio-site"
date: 2026-04-21
lang: ko
tags: [claude-code, 서브에이전트, 자동화, dentalad, devto, spoonai]
description: "4세션 493 tool calls. 서브에이전트 20개 병렬로 치과 광고 리서치 12편 + DEV.to 9편 자동 발행 파이프라인까지 완성한 과정. publish.yml 버그, source.title 버그, Vercel CANCELED까지 전부 기록."
---

이번 주 Claude Code 세션을 4개 돌렸다. 총 493번의 tool call, 가장 긴 세션은 182번. 결과물: GitHub 레포 하나 새로 뚫었고, 치과 광고 리서치 리포트 12개, DEV.to 포스트 9편, `launchd` 기반 자동 발행 파이프라인, spoonai.me 반응형 개선까지 완성했다.

**TL;DR** dentalad 프로젝트를 서브에이전트 20개 병렬로 하루 만에 런칭했다. 동시에 DEV.to 자동화 파이프라인을 구축하고 spoonai.me 기사 품질을 전면 개선했다.

## dentalad: 서브에이전트 20개가 하루 만에 리포트 12개를 뽑았다

텔레그램 메시지 하나가 시작이었다.

```
일단 광고부터, 현재 병원, 치과 광고하는 모든 한국 기업 중에 수익을 내는 기업들을 모두 추려서
어떤 전략을 쓰는지 서칭해줘. 서브에이전트 10개 이상 쓰고 각각 결과를 가공하고 리포트 형식으로
써서 깃에 올리고 나한테도 알려줘
```

Claude는 `~/dentalad/` 디렉토리를 만들고 `github.com/jee599/dentalad` private 레포에 연동한 뒤, 12개 도메인을 병렬로 리서치했다. 에이전트별 역할: 01은 국내 상위 의료광고 대행사, 02는 네이버 SEO 서비스, 03은 파워컨텐츠, 04는 SNS/퍼포먼스, 05는 인플루언서/바이럴, 06은 의료광고법 2026, 07은 클리닉 CRM/예약 SaaS, 08은 콘텐츠 자동화 툴, 09는 진료과목별 특화 전략, 10은 글로벌 AI 의료 마케팅, 11은 수익 상위 5개사 딥다이브, 12는 2026년 최신 치과 뉴스.

각 리포트는 2,500~4,500 단어 분량이다. 네이버 스마트플레이스 알고리즘 변경 내역부터 의료법 위반 시 형사처벌 기준까지 다 들어가 있다.

리포트가 나온 뒤 "자료 검증/보완 서브에이전트 고용해"라고 했더니 8개를 더 뽑았다. A3는 의료광고법 스트레스 테스트 — CPA 성과보수 과금이 의료광고법 위반인지 여부를 분석했고, 쇼스토퍼 3개를 발견했다. A8은 MVP 아키텍처 비용 산정으로 Claude Sonnet 4.6 기준 API 단가를 실측했다. A7은 서울 8개 구 기준 치과 잠재 고객 Top 50 리스트를 만들었다.

`FINAL-REPORT.md`, `EXECUTIVE-SUMMARY.md`, `ACTION-ITEMS.md`가 `~/dentalad/ads-research/`에 쌓였다.

## DEV.to 파이프라인: publish.yml 한 줄 바꿔서 즉시 발행으로

Hermes 4 시리즈 4편을 작성하면서 파이프라인 버그를 발견했다. `~/dev_blog/.github/workflows/publish.yml:205`에 `"published": False`가 하드코딩되어 있었다. frontmatter에 `published: true`를 넣어도 무조건 드래프트로 올라가는 문제다.

`should_publish` 변수를 참조하도록 한 줄 수정하고, `~/blog-factory/scripts/queue-publish.sh`를 만들었다. `~/Library/LaunchAgents/com.jidong.blog-queue.plist`로 6시간마다 큐를 소모한다.

결과: Hermes 4 시리즈 4편, contextzip 홍보글 1편, spoonai.me 소개글 1편, 최신 LLM 뉴스 3편. 총 9편이 6시간 간격으로 자동 발행됐다.

Hermes 4 글의 구조에는 카피라이팅 전술을 전부 박았다. 후킹 타이틀, curiosity gap, TL;DR, 시리즈 내부 링크, 말미 CTA에 contextzip과 spoonai.me를 자연스럽게 녹였다. "모든 광고 기법 다 넣어줘"가 실제로 그렇게 반영됐다.

LLM 뉴스 5편도 동시 작업했다. 리서치 에이전트 하나가 `~/blog-factory/research/llm-news-2026-04-21.md`를 만들면, 5개 포스트 작성 에이전트가 병렬로 초안을 뽑는다. Claude Opus 4.7 SWE-bench 분석, Adobe CX Enterprise MCP 통합, Deezer AI 음악 44%, Stellantis-Microsoft AI, MIT Tech Review 10대 AI 리스트.

## spoonai.me: source.title 버그, 기사 백필, 반응형

`ArticleCard.tsx:148`에서 버그 하나를 잡았다. 날짜 옆에 원문 기사 전체 제목이 표시되는 문제였다.

```yaml
# 잘못된 상태
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"

# 올바른 상태
source:
  title: "CNBC"
```

수정은 두 방향으로 동시에 진행했다. `~/spoonai-site/SKILL.md`와 `~/.claude/skills/spoonai-daily-briefing/SKILL.md` 두 곳에 "퍼블리셔명만 넣는다"고 명시해서 앞으로 생성될 기사부터 막았다. 기존 MD 24개는 `source.url` 도메인 → 퍼블리셔 매핑으로 일괄 교체했다.

기사 백필도 병렬로 진행했다. 서브에이전트 5개가 type별로 나눠서 작업했다 — `model_release`, `product_launch`, `partnership`, `paper`, `default_news`. 스토리당 한국어/영어 각각, 이미지 최소 2장, 800px 이상 JPEG. 30여 개 스토리가 백필됐다.

반응형 개선도 이번 세션에 들어갔다. `HomeContent.tsx`, `ArticleCard.tsx`, `globals.css`를 수정해서 웹에서는 넓직하게, 모바일에서는 사이즈에 맞게 분기했다.

## Vercel 배포 CANCELED 그리고 미커밋 83개 관리

커밋(`703f6fc`)을 푸시했는데 Vercel 배포가 `CANCELED` 상태로 멈췄다. 원인: 동일 시간대에 다른 배포가 트리거되면 Vercel이 이전 배포를 취소한다. 빈 커밋으로 재트리거해서 해결했다.

미커밋 변경 83개를 정리하는 게 이번 세션의 가장 복잡한 부분이었다. `HomeContent.tsx` +523줄, `ArticleCard.tsx` 293줄 재작성, `globals.css` +257줄, `Header/Footer/Logo/About/Archive` 리디자인, `ThemeProvider.tsx` 삭제 — 전부 선행 작업과 내 수정이 섞여 있었다. 내가 건드린 26개 파일만 선별 커밋하고 나머지 57개는 그대로 보존했다.

GeekNews 홍보 문구도 이번 기간에 작성했다. 핵심 인사이트 하나 — GeekNews는 자기 프로젝트 반복 홍보에 민감하다. "선착순 50명 무료"는 한 번만 쓸 수 있는 카드다. 이후에는 기술 포스트/경험담 형식으로 접근해야 재등록 명분이 생긴다.

## 도구 사용 통계 (4세션 합산)

총 493 tool calls. Bash 211회, Read 46회, Agent 40회(서브에이전트 20개+), Telegram reply 34회, Edit 30회, TaskUpdate 23회, WebSearch 22회, WebFetch 16회.

Agent 40회 = 1차 리서치 12개 + V2 검증 8개 + DEV.to 포스트 작성 5개 + 기사 백필 5개 + 기타. 반복 패턴이 있는 작업은 거의 다 에이전트로 넘겼다. 세션에서 직접 Edit/Write한 비율이 낮은 이유다.

> 서브에이전트는 넓게 긁는다. 검증 에이전트는 좁게 파고든다. 두 패스를 함께 써야 신뢰할 수 있는 리서치가 나온다.

같은 목표를 단일 컨텍스트 창 안에서 순차 처리했다면 대부분 불가능한 분량이었다.
