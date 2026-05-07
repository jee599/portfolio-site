---
title: "Claude Code 하루 16 세션, Codex가 SRI 해시 버그 잡고 치과 리포트까지 만든 날"
project: "portfolio-site"
date: 2026-05-07
lang: ko
tags: [claude-code, multi-agent, codex, design, parallel-agents, dental-ad, orchestration]
description: "하루 16 세션 416 tool calls. 커피챗 리디자인 5종 병렬 생성, Codex가 SRI 해시 버그 발견, spoonai 에디토리얼 이전, 치과 SEO/AEO 무료 진단 리포트 파이프라인 구축까지."
---

5월 7일 하루를 통으로 돌렸다. 커피챗 사이트 리디자인, spoonai 프로덕션 이전, 치과 광고 진단 리포트. 3개 프로젝트, 16 세션, 416 tool calls.

**TL;DR** 디자인 5종 병렬 생성 워크플로를 제대로 굴렸고, Codex 교차검증이 실제 배포 버그를 잡았다. 치과 리포트는 의료광고 컴플라이언스 때문에 공개정보와 추정치를 철저히 분리해야 했다.

## 5개 시안 병렬 생성, 그리고 "다 별로야"

커피챗 사이트 리디자인은 "최소 5가지 결과물을 내고 내가 고를 수 있게 해줘"로 시작했다. `coffeechat.it.kr`을 먼저 분석했다. 게임 업계 멘토링 플랫폼, 현직 게임 개발자·디자이너와 1:1 커피챗·이력서 리뷰·모의면접을 연결한다.

`plan-orchestrator`로 `plan.md`를 떨어뜨리고, `frontend-implementer` 5개를 동시 Agent 호출로 날렸다. V1 Editorial Magazine, V2 Soft Brutalist, V3 Floating Gradient, V4 Object-oriented UI, V5 Brief Format. 각 시안은 독립 컨텍스트에서 돌아가서 서로 영향이 없다. 결과물은 `/Users/jidong/coffee-chat-redesign/`에 쌓였다.

피드백: "다 별로야 하나도 전문성이 없어보여. 인프런이나 다른 교육기관 봐봐."

디자인 트렌드 변주만 했고 "전문 교육 서비스의 신뢰감"이 빠져있었다. 게임 인디 무드로만 접근했는데 인프런·클래스101·패스트캠퍼스 톤이 맞았다. 방향을 리셋하고 재분류했다. 병렬 생성의 병목은 속도가 아니라 방향이다. 첫 라운드 전에 서비스 카테고리를 정확히 읽어야 한다.

## Codex가 배포 전에 잡은 버그

design-reviewer가 V3의 floating gradient blobs 블로커를 리포트했다. 픽스 후 `diff.patch`를 저장하고 Codex 교차검증을 돌렸다.

Codex가 찾은 건 SRI(Subresource Integrity) 해시 불일치였다. V2·V3·V4·V5가 CDN에서 `react.production.min.js`를 로드하는데, integrity 해시 값이 `.development.js` 빌드 기준으로 잘못 작성돼 있었다.

```html
<!-- 잘못된 예 — production 파일에 development 해시 -->
<script src="react.production.min.js"
  integrity="sha384-development-hash-goes-here">
```

브라우저 보안 정책은 해시가 파일 내용과 다르면 스크립트 로드를 차단한다. 로컬 캐시 때문에 재현이 안 되고, 배포 후 실제 사용자 브라우저에서 `Integrity check failed`가 뜨는 종류의 버그다. 동일한 컨텍스트 안에서 작업한 모델은 본인이 쓴 코드를 그대로 통과시키는 경향이 있다. 외부 모델이 diff를 처음 보는 눈으로 검토하는 값어치가 여기에 있다.

각 시안의 CDN 링크를 `react.production.min.js` 해시로 교체해서 마무리했다. 세션 1: 78 tool calls, Agent 28회, Bash 25회.

## spoonai — 한글 박스 추적

세션 2는 spoonai 한글 폰트 깨짐으로 시작했다. 스크린샷에 `□□□□`가 가득했다. `총 규모`, `OpenAI 지분`, `구조` 라벨들이 글리프 없이 박스로만 렌더링됐다.

원인은 단순했다. `credit` 필드가 `"spoonai"`인 이미지가 직접 제작한 것인데, 그 이미지에 한글 폰트가 임베딩되지 않았다. `openai-deployment-company-tpg-10b-01.jpg` 58KB짜리 인포그래픽이었다.

```bash
grep -r 'credit.*spoonai' src/content/posts/
```

이 이미지를 참조하는 포스트 두 개(ko/en)에서 `image:` 블록을 제거하고 JPG를 삭제했다. 3 files, single commit, Vercel 자동 배포. 커밋 메시지는 `chore: remove self-generated infographic image with broken Korean fonts`.

spoonai 리디자인도 같은 세션에서 진행했다. 1라운드에서 5개를 뽑고, `05-brief.html` 방향이 마음에 든다고 해서 거기서 고도화 5개를 더 뽑았다. 총 10개 변주, 사용자 선택은 두 번. `05a-editorial-premium.html`로 최종 확정 후 spoonai-site 코드베이스에 적용. `feat/editorial-premium-redesign` 브랜치, 7개 파일, 442 insertions, 725 deletions.

세션 2: 130 tool calls, Bash 87회, Agent 22회.

## 치과 진단 리포트 — 공개정보와 추정치 사이

세션 3~16은 치과 광고 파이프라인이었다. 야탑NYU치과와 동백서울유치과의원 두 곳의 SEO/AEO 무료 진단 리포트를 만들었다.

의료광고 컴플라이언스 때문에 핵심 원칙이 하나 있었다. 관리자 권한 없이 알 수 없는 수치는 절대 임의로 산출하지 않는다. 네이버 플레이스 조회수, 전화클릭수, 실제 예약·내원 수, 월 검색량, CPC, CTR은 모두 "권한 필요 / 수치 미확인"으로 분리했다.

동백유치과는 명칭 혼동 문제가 있었다. 모두닥에서 찾은 `18273`은 "동백서울**치과**의원"(동백7로 83)이었고, 본 리포트 대상 "동백서울**유**치과의원"과 다른 병원이었다. 이걸 섞으면 잘못된 수치가 리포트에 들어간다. 모든 검색 결과는 "후보 / 확인 필요"로 라벨링하고, 사용자가 Naver Place 링크를 직접 확인해서 확정 기준을 줬다.

Codex 교차검증이 request-changes를 리턴해서 3개 HTML 파일을 수정했다. 비교 요약 테이블의 모바일 반응형 `data-label` 속성이 빠진 게 있었고, 성과보장성 표현 잔존 여부를 grep으로 점검했다. Edit 23회, Bash 9회.

마지막 세션에서는 "디자인이 너무 AI가 만든 것 같다"는 피드백이 왔다. 리포트 디자인 방향 8개를 레퍼런스 리서치 기반으로 정리한 선택용 HTML 보드를 따로 만들었다. 최종 리포트 수정 전에 사용자가 먼저 방향을 고르는 구조다.

## 하루 통계

| 지표 | 수치 |
|---|---|
| 세션 수 | 16 |
| 총 tool calls | 416 |
| 생성 파일 | 21개 |
| 수정 파일 | 7개 |
| Bash | 167회 |
| Agent | 50회 |
| WebSearch | 41회 |
| Edit | 27회 |

Bash가 전체의 40%를 차지한다. CDN URL 검증, git 작업, 빌드 확인, dev server 실행이 쌓인 결과다. Agent 50회는 시안 병렬 디스패치와 각 단계 교차검증 호출이다.

> 병렬 생성은 탐색 범위를 넓히고, 교차검증은 놓친 버그를 잡는다. 둘 다 속도가 아니라 품질 보험이다.
