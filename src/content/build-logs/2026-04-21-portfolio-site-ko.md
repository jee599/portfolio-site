---
title: "서브에이전트 12개 병렬로 치과 광고 리서치 35,000자 완성 + 파이프라인 버그 2개 수정"
project: "portfolio-site"
date: 2026-04-21
lang: ko
tags: [claude-code, subagent, automation, dentalad, devto, spoonai]
description: "서브에이전트 12개를 동시에 붙이면 3시간 만에 35,000자 리서치가 나온다. publish.yml 하드코딩 버그, source.title 버그까지 4세션 493 tool call로 처리한 과정."
---

12개 에이전트를 동시에 붙이면 3시간 만에 35,000자 리서치 리포트가 나온다. 단일 컨텍스트 창 순차 처리로는 하루가 걸렸을 작업이다.

**TL;DR** `dentalad` 프로젝트 킥오프를 서브에이전트 12개 병렬로 처리했다. 동시에 `dev_blog`의 `publish.yml` 하드코딩 버그를 발견했고, spoonai.me 기사 카드의 source.title 버그도 잡았다.

## 텔레그램 한 줄이 서브에이전트 20개짜리 세션이 됐다

요청 원문:

> "현재 병원·치과 광고하는 모든 한국 기업 중에 수익을 내는 기업들을 모두 추려서... 서브에이전트 10개 이상 쓰고 각각 결과를 가공하고 리포트 형식으로 써서 깃에 올려줘"

12개 에이전트를 동시에 붙였다. 도메인별로 각자 맡았다.

- `01` 국내 상위 의료 광고 대행사 현황
- `02` 네이버 상위 노출 SEO 서비스 실태
- `03` 네이버 SA·파워콘텐츠 대행사
- `04` SNS 퍼포먼스 마케팅
- `05` 인플루언서·바이럴
- `06` 의료광고법 2026 최신판
- `07` 병원 CRM·예약 SaaS 시장
- `08` AI 콘텐츠 생성 도구 지형
- `09` 진료과목별 특화 전략 (임플란트·교정·심미 등)
- `10` 글로벌 AI 의료 마케팅 벤치마크
- `11` 수익 상위 5개사 심층 분석
- `12` 2026 치과 업계 최신 뉴스

각 리포트 2,500~4,500단어. `~/dentalad/ads-research/`에 전부 쌓였다. 완료까지 3시간.

다음 날 "검증·보완해줘"가 추가로 들어왔다. 이번엔 8개 에이전트로 v2 폴더를 만들어 fact-check + 법률 스트레스 테스트 + MVP 아키텍처 비용 산정을 추가했다. `A3-legal-stress-test.md`에서 나온 핵심: CPA·성과보수 과금 방식이 의료광고법 위반 리스크다. 사업 모델 설계 전에 파악해야 할 쇼스토퍼 3개 중 하나였다.

## `published: False` — 파이프라인이 항상 draft였다

Hermes 4 시리즈 4편을 "즉시 올려줘"라는 요청으로 발행하려다 발견한 버그다.

`dev_blog/.github/workflows/publish.yml:205`:

```yaml
"published": False
```

하드코딩이었다. frontmatter에 `published: true`를 넣어도 DEV.to에는 항상 draft로 올라갔다. 이미 올라간 포스트들이 전부 draft 상태로 저장되어 있었다는 뜻이다.

수정은 한 줄이었다. `should_publish` 변수는 이미 frontmatter에서 계산되고 있었다. `"published": False` → `should_publish` 참조로 바꾸는 게 전부였다.

이 버그를 발견한 건 "즉시 올려줘"라는 요청 덕분이었다. 6시간 간격 `launchd` 큐를 만들다가 실제 발행 여부를 확인하면서 잡았다. 요청이 없었으면 몰랐을 버그다.

이후 `~/Library/LaunchAgents/com.jidong.blog-queue.plist`와 `~/blog-factory/scripts/queue-publish.sh`를 만들어서 Hermes 4 시리즈 4편, contextzip 홍보글, spoonai.me 소개글, LLM 뉴스 5편을 6시간 간격으로 자동 발행했다.

## 날짜 옆에 기사 전체 제목이 붙어 있었다

spoonai.me에서 이런 피드백이 들어왔다.

> "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong — 이게 날짜 옆에 왜 나와?"

`components/ArticleCard.tsx:148`에서 `post.source.title`을 날짜 옆에 표시하고 있었다. 문제는 `source.title`에 퍼블리셔명 대신 원문 기사 전체 제목이 들어가 있었던 것이다.

Before:
```yaml
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
```

After:
```yaml
source:
  title: "CNBC"
```

수정은 두 방향 동시에 진행했다. `~/spoonai-site/SKILL.md`와 `~/.claude/skills/spoonai-daily-briefing/SKILL.md` 두 곳에 "퍼블리셔명만 넣는다"고 명시해서 앞으로 생성될 기사부터 막았다. 기존 MD 24개는 `source.url` 도메인 → 퍼블리셔 매핑으로 일괄 교체했다.

커밋(`703f6fc`) 푸시 후 Vercel 배포가 `CANCELED` 상태로 멈췄다. 동일 시간대에 다른 배포가 트리거되면 Vercel이 이전 배포를 취소하는 것이 원인이었다. 빈 커밋으로 재트리거해서 해결했다.

## "다 청소해줘" — 83개 파일의 운명

세션 중반에 "일단 그냥 다 청소해줘"가 들어왔다. 두 가지 해석이 가능했다.

**A.** `.claude/worktrees/*` 22개 임시 폴더 삭제 — 예전 세션들의 워크트리 복사본. 원본 무관.

**B.** `git reset --hard` + `git clean -fd` — `HomeContent.tsx` +523줄, `ArticleCard.tsx` 293줄 재작성, `globals.css` +257줄 포함 83개 파일 전부 폐기.

물어봤다. "1"이 돌아왔다. A로 처리했다.

답 하나로 +1,700줄짜리 UI 리디자인이 살아남았다. B로 조용히 처리했다면 복구 불가능이었다.

## 도구 사용 (4세션 합산)

총 493 tool call.

| 도구 | 횟수 | 주 용도 |
|---|---|---|
| Bash | 211 | 파일 실행, git, 배포 트리거 |
| Read | 46 | 기존 파일 구조 파악 |
| Agent | 40 | 리서치, 포스트 작성, 백필 |
| Telegram reply | 34 | 요청 수신·응답 |
| Edit | 30 | 파일 수정 |

Agent 40회 = 1차 리서치 12개 + V2 검증 8개 + 포스트 작성 5개 + 기사 백필 5개 + 기타. 반복 패턴이 있는 작업은 전부 에이전트로 위임했다. 직접 Edit/Write 비율이 낮은 이유다.

> 서브에이전트는 넓게 긁는다. 검증 에이전트는 좁게 파고든다. 두 패스를 함께 써야 신뢰할 수 있는 리서치가 나온다.
