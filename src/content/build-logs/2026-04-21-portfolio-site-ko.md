---
title: "서브에이전트 25개 동시 고용 — 치과 광고 리서치 자동화부터 발행 파이프라인까지"
project: "portfolio-site"
date: 2026-04-21
lang: ko
tags: [claude-code, automation, multi-agent, devto, spoonai, dentalad, build-log]
description: "서브에이전트 25개를 동시에 고용해 한국 치과 광고 시장 리서치를 완전 자동화하고, Hermes 4 시리즈 4편을 6시간 간격으로 자동 발행하는 파이프라인을 구축했다. 총 4세션 493 tool calls."
---

이번 주 Claude Code 세션은 4개, 총 493 tool calls가 발생했다. 가장 컸던 단일 작업은 서브에이전트 25개를 동시에 고용해 한국 치과 광고 시장 리서치 보고서 12개를 하루 만에 뽑아낸 것이다.

**TL;DR** `dentalad` 프로젝트를 새로 만들고 멀티에이전트 리서치로 시장 조사를 완전 자동화했다. 동시에 `dev_blog` 발행 파이프라인의 하드코딩 버그를 잡아 6시간 간격 자동 발행 큐를 붙였다. spoonai.me에서 발견한 `source.title` 표시 버그도 수정했다.

## 텔레그램 한 줄이 서브에이전트 20개짜리 세션이 됐다

요청은 짧았다.

> "현재 병원, 치과 광고하는 모든 한국 기업 중에 수익을 내는 기업들을 모두 추려서 어떤 전략을 쓰는지... 서브에이전트 10개 이상 쓰고 각각 결과를 가공하고 리포트 형식으로 써서 깃에 올리고 나한테도 알려줘"

방향만 줬다. Claude는 12개 에이전트를 병렬로 디스패치했다.

- `01` 국내 의료 광고 대행사 현황 분석
- `02` 네이버 상위 노출 SEO 전략
- `03` 네이버 SA·파워콘텐츠 대행사
- `04` SNS 퍼포먼스 마케팅 에이전시
- `05` 인플루언서·바이럴 마케팅
- `06` 의료광고법 2026 최신 기준
- `07` 병원 CRM·예약 SaaS 시장
- `08` AI 콘텐츠 생성 도구 지형
- `09` 진료과목별 특화 전략 (임플란트·교정·심미 등)
- `10` 글로벌 AI 의료 마케팅 벤치마크
- `11` 수익 치과 TOP5 심층 분석
- `12` 2026 치과 업계 최신 뉴스

각 에이전트는 WebSearch로 소스를 긁고, 2,500~4,500단어 마크다운 보고서를 `~/dentalad/ads-research/reports/`에 저장했다. Telegram으로 완료 알림이 11개 연달아 왔다. 전체 소요는 약 3시간.

다음 날 "내용 검증·보완해줘"가 추가로 들어왔다. 이번엔 에이전트 8개를 더 투입해 v2 폴더를 만들고 팩트체크 + 법률 스트레스 테스트 + MVP 아키텍처 비용 산정을 추가했다. `A3-legal-stress-test.md`에서 나온 핵심은 CPA·성과보수 과금이 의료광고법 위반 리스크라는 점이었다. 사업 모델을 설계하기 전에 알아야 할 쇼스토퍼 3개 중 하나.

1차 리서치 12개 + V2 검증 8개 + 종합 리포트 에이전트 5개. 총 25개 에이전트, Bash 52회, WebSearch 22회.

## `published: false` — 파이프라인이 항상 draft였다

Hermes 4 시리즈 4편을 "즉시 올려줘"로 발행하려다 발견한 버그다. dev.to에 올라간 포스트가 전부 draft 상태였다.

`dev_blog/.github/workflows/publish.yml:205`를 봤더니 하드코딩이 박혀 있었다.

```yaml
"published": False  # 이게 문제였다
```

frontmatter에 `published: true`를 써도 항상 draft로 올라갔던 이유다. `should_publish` 변수는 이미 frontmatter에서 계산하고 있었다. 참조만 하면 됐는데 안 하고 있었다. 수정은 한 줄이었다.

그 다음 6시간 간격 자동 발행 큐를 붙였다. RemoteTrigger는 로컬 레포 접근이 안 되기 때문에 launchd로 갔다. `~/Library/LaunchAgents/com.jidong.blog-queue.plist`가 `~/blog-factory/scripts/queue-publish.sh`를 6시간마다 실행하고, 큐 디렉터리에서 순서대로 포스트를 꺼내 발행하는 구조다.

Hermes 4 글 4편이 6시간 간격으로 올라갔다. 이후 최신 LLM 뉴스 5편도 같은 큐에 넣었다. 에이전트 5개가 글을 쓰면 launchd가 하나씩 꺼내서 올린다. 내가 자는 사이에.

## 날짜 옆에 기사 전체 제목이 붙어 있었다

spoonai.me에서 이런 피드백이 들어왔다.

> "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong — 이게 날짜 옆에 왜 나와?"

`components/ArticleCard.tsx:148`이 `post.source.title`을 날짜 옆에 렌더링하고 있었다. 문제는 `source.title`에 퍼블리셔명 대신 원문 기사 제목 전체가 들어가 있었던 것이다.

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

두 방향으로 동시에 수정했다. `~/spoonai-site/SKILL.md`와 `~/.claude/skills/spoonai-daily-briefing/SKILL.md` 두 곳에 "퍼블리셔명만 넣는다"고 명시해서 앞으로 생성되는 기사부터 막았다. 기존 MD 24개는 `source.url` 도메인 → 퍼블리셔 매핑으로 일괄 교체했다. `cnbc.com` → `CNBC`, `theverge.com` → `The Verge` 식으로.

커밋(`703f6fc`) 푸시 후 Vercel 배포가 `CANCELED` 상태로 멈췄다. 같은 시간대 다른 배포가 트리거되면서 이전 배포를 취소하는 패턴이었다. 빈 커밋으로 재트리거해서 해결했다.

## "다 청소해줘" — 83개 파일의 운명

세션 중 "일단 그냥 다 청소해줘"가 들어왔다. 해석이 두 가지였다.

**A.** `.claude/worktrees/*` 22개 임시 폴더만 삭제. 원본에 영향 없음.

**B.** `git reset --hard` + `git clean -fd`. `HomeContent.tsx` +523줄, `ArticleCard.tsx` 293줄 재작성, `globals.css` +257줄 포함 83개 파일이 전부 날아간다.

확인을 먼저 했다. "1"이 돌아왔다. A로 처리했다.

B로 조용히 처리했다면 복구 불가능이었다. "다 청소"라는 말이 코드 폐기인지 임시 파일 정리인지는 맥락만으로 판단할 수 없다.

## 이번 주 수치 (4세션 합산)

총 tool call 493회.

| 도구 | 횟수 | 주 용도 |
|---|---|---|
| Bash | 211 | 파일 실행, git, 배포 트리거 |
| Read | 46 | 기존 파일 구조 파악 |
| Agent | 40 | 리서치, 포스트 작성, 백필 |
| Telegram reply | 34 | 요청 수신·응답 |
| Edit | 30 | 파일 수정 |
| WebSearch | 22 | 자료 수집 |

Agent 40회가 실질적으로 가장 큰 비중이다. 에이전트 하나당 내부에서 수십 번 이상의 tool call이 추가 발생한다. 직접 Edit·Write 비율이 낮은 건 반복 패턴 작업을 전부 에이전트에 위임했기 때문이다.

> 서브에이전트는 넓게 긁고, 검증 에이전트는 좁게 파고든다. 두 패스를 함께 써야 신뢰할 수 있는 결과가 나온다.
