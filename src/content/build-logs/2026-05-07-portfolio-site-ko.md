---
title: "Claude Code 18세션 451 tool calls — 5개 병렬 리디자인, Codex SRI 버그 차단, 치과 파이프라인"
project: "portfolio-site"
date: 2026-05-07
lang: ko
tags: [claude-code, multi-agent, codex, design, parallel-agents, dental-ad, orchestration]
description: "하루 18세션 451 tool calls. 커피챗·spoonai 리디자인 5종 병렬, Codex가 SRI 해시 버그 배포 전에 차단, 치과 SEO/AEO 진단 리포트 멀티세션 파이프라인까지."
---

5월 7일, 18세션 451 tool calls. Bash 175회, Agent 서브에이전트 디스패치 50회, WebSearch 41회. 커피챗 플랫폼 리디자인, spoonai 마이그레이션, 치과 마케팅 진단 리포트 — 세 도메인을 하루에 처리했다.

**TL;DR** 디자인 변주는 에이전트 5개 병렬로 던지고 내가 고르는 패턴이 가장 빠르다. Codex 교차검증은 SRI 해시 버그를 브라우저가 차단하기 전에 잡았다. 치과 리포트는 공개 정보와 권한 필요 수치를 철저히 분리해야 컴플라이언스가 맞다.

## 에이전트 5개 병렬 리디자인, 그리고 "다 별로야"

커피챗 사이트 리디자인 요청 — "최소 5가지 결과물을 내고 내가 고를 수 있게 해줘." `coffeechat.it.kr`을 분석하니 게임 업계 현직자와 1:1 커피챗·이력서 리뷰·모의면접을 연결하는 멘토링 플랫폼이었다.

`plan-orchestrator`로 `plan.md`를 떨어뜨리고 `frontend-implementer` 서브에이전트 5개를 동시 호출로 날렸다. V1 Editorial Magazine, V2 Soft Brutalist, V3 Floating Gradient, V4 Object-oriented UI, V5 Brief Format. 각 에이전트는 독립 컨텍스트라 서로 영향이 없다. `index.html` 비교 캔버스에서 카드 클릭하면 새 탭으로 열리는 구조.

피드백: "다 별로야 하나도 전문성이 없어보여. 인프런이나 다른 교육기관 봐봐."

맞는 말이었다. 디자인 트렌드 변주만 했고 "전문 교육 서비스의 신뢰감"이 빠져있었다. 게임 인디 무드로만 접근했는데 인프런·클래스101·패스트캠퍼스 톤이 기준이었다. 레퍼런스 없이 "5개 만들어줘"는 generic이 나온다. 병렬 생성의 병목은 속도가 아니라 초기 방향 설정이다.

세션 1: 78 tool calls, Agent 28회, Bash 25회.

## Codex가 배포 전에 SRI 해시 버그를 잡다

spoonai 리디자인에서 `design-reviewer`가 V3 블로커를 리포트했다. 픽스 후 `diff.patch`를 저장하고 Codex 교차검증을 돌렸다.

Codex가 찾은 건 SRI(Subresource Integrity) 해시 불일치였다. V2·V3·V4·V5가 CDN에서 `react.production.min.js`를 로드하는데, `integrity` 해시 값이 `.development.js` 기준으로 잘못 작성돼 있었다.

```html
<!-- 잘못된 예 — production URL에 development 해시 -->
<script src="react.production.min.js"
  integrity="sha384-development-hash...">
```

브라우저는 해시와 파일 내용이 다르면 스크립트 로드를 차단한다. 로컬 캐시 때문에 로컬에선 재현이 안 되고, 프로덕션에서만 `Integrity check failed`가 터지는 종류다. 동일한 컨텍스트에서 코드를 쓴 모델은 본인 코드를 통과시키는 경향이 있다. 외부 모델이 diff를 처음 보는 눈으로 검토하는 값어치가 여기 있다. CDN 링크를 production 해시로 전부 교체해서 마무리했다.

## spoonai — 한글 박스 58KB 추적

세션 2는 스크린샷 한 장으로 시작했다. `□□□□` 박스가 가득한 OpenAI Deployment Company 기사. `총 규모`, `OpenAI 지분`, `구조` 라벨이 글리프 없이 렌더링됐다.

원인은 `credit` 필드가 `"spoonai"`인 직접 제작 인포그래픽 이미지였다. `openai-deployment-company-tpg-10b-01.jpg` 58KB — 한글 폰트가 임베딩되지 않았다. 해결은 삭제였다.

```bash
grep -r 'credit.*spoonai' src/content/posts/
```

이미지를 참조하는 포스트 두 개(ko/en)에서 `image:` 블록 제거, JPG 삭제. 3 files, single commit, Vercel 자동 배포.

같은 세션에서 spoonai 리디자인도 진행했다. 1라운드 5개에서 `05-brief.html` 방향 확정, 거기서 고도화 변주 5개 추가. `05a-editorial-premium.html`로 최종 선택 후 프로덕션 코드베이스 적용 — `feat/editorial-premium-redesign` 브랜치, 7개 파일, 442 insertions, 725 deletions.

세션 2: 130 tool calls, Bash 87회, Agent 22회.

## 치과 진단 리포트 — 병원명 혼동과 공개정보 분리

세션 9~18은 치과 광고 진단 파이프라인이었다. 야탑NYU치과와 동백서울유치과의원 두 곳의 SEO/AEO 무료 진단 HTML 리포트.

핵심 원칙은 하나였다. 관리자 권한 없이 알 수 없는 수치는 절대 임의 산출하지 않는다. 네이버 플레이스 조회수, 전화클릭수, 월 검색량, CPC, CTR — 이 항목들은 모두 "권한 필요 / 수치 미확인"으로 분리했다. 의료광고 과장/성과보장 표현 금지도 마찬가지다.

동백유치과는 명칭 혼동 문제가 있었다. 모두닥에서 찾은 병원은 "동백서울**치과**의원"(동백7로 83) — 리포트 대상 "동백서울**유**치과의원"과 다른 병원이었다. 이걸 섞으면 전혀 다른 병원 수치가 리포트에 들어간다. 모든 검색 결과는 "후보 / 확인 필요"로 라벨링했고, 사용자가 Naver Place 링크를 직접 제공해서 확정 기준을 박았다.

멀티세션 이어가는 방식은 파일 기반이었다. 각 세션은 fresh context로 시작하므로, `evidence.md`와 `plan.md`를 먼저 저장하고 다음 세션 프롬프트에 경로를 명시한다.

```
이어쓰기 작업. 웹검색 금지/불필요.
입력:
- .../research/yatap_nyu_public_evidence.md
- .../research/dongbaek_yu_public_evidence.md
```

"웹검색 금지/불필요"를 명시하면 이미 검증한 데이터를 다시 검색하는 낭비가 없다.

Codex 교차검증이 request-changes를 리턴해서 3개 HTML을 수정했다. 비교 요약 테이블 모바일 반응형 `data-label` 속성 누락, 성과보장성 표현 잔존 grep 점검. 마지막에 "디자인이 너무 AI가 만든 것 같다"는 피드백이 왔고, 8개 디자인 방향 레퍼런스 선택용 HTML 보드를 만들어서 수정 전에 방향을 먼저 고르게 했다.

## 오케스트레이션 정책 — 3세션으로 수렴

이날 메타 작업도 있었다. Hermes·Claude·Codex·OMX 멀티모델 운영 정책 문서화. 세션 5에서 초안, 세션 6에서 로컬 환경(`~/.codex/AGENTS.md`, openclaw) 확인 후 수정, 세션 8에서 Codex 리뷰 반영해 v2 최종 저장. 각 세션 산출물이 다음 세션 input이 되는 구조는 코드 작업과 동일하다.

핵심 정정 사항: OMX는 별도 바이너리가 아니다. `~/.codex/AGENTS.md` + 프로젝트 `AGENTS.md` + Codex prompt/skill 레이어로 작동하는 heavy-mode 패턴이다.

## 하루 통계

| 지표 | 수치 |
|---|---|
| 세션 수 | 18 |
| 총 tool calls | 451 |
| 생성 파일 | 23개 |
| 수정 파일 | 9개 |
| Bash | 175회 |
| Agent | 50회 |
| WebSearch | 41회 |
| Edit | 32회 |

Bash가 전체의 39%다. CDN URL 검증, git 작업, 빌드 확인, dev server 실행이 누적된 결과다. Agent 50회는 시안 병렬 디스패치와 교차검증 호출이다.

> 병렬 생성은 탐색 범위를 넓히고, 교차검증은 놓친 버그를 잡는다. 둘 다 속도가 아니라 품질 보험이다.
