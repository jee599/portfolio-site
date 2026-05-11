---
title: "폰트 깨짐의 범인이 Claude Code였다 — 리디자인 3연타, Agent 50회"
project: "portfolio-site"
date: 2026-05-12
lang: ko
tags: [claude-code, redesign, multi-agent, debugging, spoonai]
description: "spoonai 폰트 깨짐의 원인은 Claude Code가 직접 만든 이미지였다. 한 주 동안 3개 사이트를 리디자인하면서 Agent 50회 병렬 디스패치, Codex가 SRI 해시 불일치 버그까지 잡아낸 과정."
---

스크린샷을 보는 순간 바로 알았다. 한글이 □□□□로 깨져 있었다. spoonai.me OpenAI Deployment Company 기사 카드에서 `총 규모`, `OpenAI 지분`, `구조` 같은 라벨이 글리프 없이 박스로 떴다. 한글 폰트 문제처럼 보였지만, 원인은 전혀 다른 곳에 있었다.

**TL;DR** 폰트가 깨진 이미지의 출처는 Claude Code가 자체 생성한 인포그래픽이었다. 찾아서 삭제했고, 같은 주에 3개 사이트를 리디자인했다. Agent 50회 병렬 디스패치, Codex 교차검증이 SRI 해시 불일치 버그까지 추가로 잡아냈다.

## 폰트 깨짐의 범인이 Claude Code 자신이었다

프롬프트는 명확했다.

> "폰트 깨진거 모두 spoonai에서 이미지를 찾아온게 아니라 직접 제작한건데 제작한거 모두 지워"

Claude Code는 전체 `spoonai-site`를 스캔했다. 판단 기준은 포스트 frontmatter의 credit 메타데이터 — `"spoonai"` 또는 `"spoonai 정리"`는 자체 제작, `"CNBC"`, `"Anthropic"`, `"TechCrunch"` 등은 외부 소스.

전체 스캔 결과: 직접 제작 이미지 1장. `public/images/posts/2026-05-06/openai-deployment-company-tpg-10b-01.jpg` (58KB). 한국어·영어 두 포스트가 이 파일을 참조하고 있었다. `image:` 블록을 두 파일에서 제거하고 JPG를 삭제했다.

커밋 `8b55047` — 3 files changed, push → Vercel 자동 배포. OpenAI Deployment Company 포스트에서 글리프 없는 박스가 사라지고 hero가 그라디언트로 대체됐다.

여기서 얻은 교훈은 하나다. Claude Code가 생성한 콘텐츠는 나중에 추적이 어렵다. credit 필드 같은 메타데이터를 처음부터 붙여두지 않으면, 어떤 이미지가 직접 제작인지 나중에 구분할 방법이 없다. 자동화 파이프라인에서 생성 출처를 명시적으로 기록하는 게 필수다.

## Agent 50회: 5개 리디자인을 동시에

이번 주 두 개의 대형 리디자인 요청이 들어왔다.

**spoonai 리디자인**: 카드 뉴스 방향으로 재정의하고 5개 변주를 한 번에 뽑았다. Editorial Magazine, Quarterly Report, Masonry Feed, Object-Oriented, Brief/Minimal — `01-wire.html`부터 `05-brief.html`까지. 사용자가 `05-brief.html` 톤이 맞다고 선택했고, 이를 더 고도화한 `05a-editorial-premium.html` 방향으로 최종 결정됐다.

**coffeechat.it.kr 리디자인**: 게임 업계 멘토링 플랫폼. 디자인 트렌드 변주로 5개를 뽑았는데 "전문성이 없어 보인다"는 피드백이 왔다. 인프런·클래스101·패스트캠퍼스 톤으로 방향을 틀고 재작업. 재분류하면서 `plan.md`를 새로 만들고 다시 5개 병렬 디스패치.

**daymoon 포토그래퍼 사이트**: 예약 CTA 개선. 상단 nav Booking이 개편된 예약 섹션으로 연결되도록 하고, `예약 링크`, `카카오채널`, `네이버 공지`, `Instagram DM` 4개 채널을 카드 클러스터로 구성. `index.html`과 `styles.css` 2파일 수정으로 마무리.

병렬 디스패치의 실제 효과는 단순하다. 5개 HTML 시안을 순차 생성하면 라운드트립이 5번 필요하다. `frontend-implementer` Agent 5개를 동시에 띄우면 한 번의 응답에서 모두 생성된다. 2개 세션(spoonai + coffeechat)에서 Agent를 50회 호출했다. 전체 tool call 234회 중 21%.

## Codex가 인간도 못 잡은 버그를 잡아냈다

coffeechat 리디자인 5개 시안을 만들면서 React를 CDN에서 로드했다. V2/V3/V4/V5 모두 `react.production.min.js`를 사용했는데, SRI(Subresource Integrity) 해시가 `.development.js` 파일용으로 붙어있었다.

브라우저는 해시가 맞지 않으면 스크립트를 차단한다. 시안 4개에서 React가 실제로 로드되지 않은 상태였던 것이다.

`design-reviewer` 에이전트는 "렌더링 잘 되네요"라고 통과시켰다. 시각적으로는 문제없어 보였기 때문이다. Codex 교차검증 단계에서 이 버그가 명시적으로 지적됐다.

```
V2/V3/V4/V5 — react.production.min.js를 로드하면서
SRI 해시는 .development.js용. 브라우저가 차단함.
```

production CDN URL에 맞는 해시로 즉시 교체했다.

교차검증을 파이프라인에 붙이는 이유가 여기 있다. 같은 컨텍스트를 계속 보던 모델은 패턴 매칭에서 놓치는 게 생긴다. 외부 시선이 다른 걸 잡는다. 특히 SRI 같이 눈에 안 보이는 보안 속성은 시각 리뷰에서 빠지기 쉽다.

## 훅이 파일 읽기를 막은 날

세션 1에서 예상치 못한 삽질이 있었다. 의료/치과 광고 SERP 분석 파일 4개를 읽으려는 요청이었다.

```
Read(summary.json)           → 취소
Read(2026-05-10-daily-update.md)  → 취소
Read(rolling-knowledge-base.md)   → 취소
Read(source-index.md)        → 취소
```

원인은 오케스트레이션 훅이었다. `state.sh` Bash 호출을 먼저 실행하는데, 해당 세션의 workflow 경로가 맞지 않아 Bash가 실패했다. 같은 메시지에 묶인 Read 4개도 함께 취소됐다.

재시도도 같은 패턴으로 막혔다. 결국 "파일 내용 없이 요약 불가"로 응답했다.

배운 것: 오케스트레이션 훅이 켜진 환경에서 Bash와 Read를 같은 메시지에 묶으면 Bash 실패 시 Read도 함께 취소된다. Bash 결과를 먼저 확인하고, 성공 후 Read를 별도로 호출하는 게 더 안전하다.

## 이번 주 통계

- 총 세션: 4개, 총 tool calls: 234회
- Bash: 124회 (53%) — 상태 관리, 빌드 확인, git 작업
- Agent: 50회 (21%) — 리디자인 시안 병렬 생성, 검증
- Read: 17회, Write: 11회, Edit: 5회
- 생성 파일: 9개 (리디자인 HTML 시안 중심)
- 수정 파일: 5개

Bash가 절반 이상인 건 `state.sh`, 빌드 확인, git 커밋/푸시가 반복됐기 때문이다. Agent 21%는 이번 주 리디자인 작업이 많았던 탓이다. 시안 병렬 생성처럼 독립된 작업이 여러 개일 때 Agent 패턴의 효율이 제대로 나온다.

다음 단계: spoonai editorial-premium 방향이 확정됐으니 실제 프로덕션 코드베이스로 마이그레이션하는 작업이 남아있다.
