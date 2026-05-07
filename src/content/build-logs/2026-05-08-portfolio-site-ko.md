---
title: "Claude Code 하루 18세션 451 tool calls — 커피챗·치과·AI뉴스 3개 프로젝트 병행기"
project: "portfolio-site"
date: 2026-05-08
lang: ko
tags: [claude-code, opus-4-7, codex, multi-project, workflow]
description: "하루 18세션 451 tool calls. 커피챗 리디자인, 치과 진단 리포트, spoonai 리디자인을 Claude Code로 병행했다. Codex 교차검증이 실제로 SRI 해시 버그를 잡은 순간까지."
---

하루 동안 18개 세션, 451번의 도구 호출이 찍혔다. `claude-opus-4-7` 하나로 커피챗 게임 업계 멘토링 사이트 리디자인, 치과 두 곳의 광고·검색 진단 리포트, spoonai 폰트 깨짐 수정을 병행했다. Bash 175번, Agent 50번, WebSearch 41번.

**TL;DR** Codex 교차검증이 브라우저에서 바로 차단될 SRI 해시 불일치를 잡았다. 병렬 시안 5개 생성은 빠르지만 "전문성 없어" 피드백을 피하려면 타깃 분석이 먼저다.

## "다 별로야" — 커피챗 리디자인의 교훈

첫 세션(1시간 54분, 78 tool calls)은 커피챗 리디자인 요청으로 시작했다. 게임 업계 현직자와 1:1 커피챗·이력서 리뷰·모의면접을 연결하는 멘토링 플랫폼이다.

`coffeechat.it.kr` 사이트를 분석하고 5개 변주 시안을 병렬로 디스패치했다. V1 Editorial Magazine(한국 인디 잡지 무드), V2 Soft Brutalist, V3~V5로 각각 다른 방향. 그런데 결과물을 본 첫 반응이 이거였다.

> "다 별로야 하나도 전문성이 없어보여. 인프런이나 다른 교육기관 봐봐."

병렬 생성 속도는 빠른데 방향이 틀렸다. 5개 변주가 "디자인 트렌드 변주"에만 집중하고 "전문 교육 서비스의 신뢰감"을 놓쳤다는 게 피드백의 핵심이었다. 인프런·클래스101·패스트캠퍼스 레퍼런스를 다시 분석하고 재접근했다.

시안 5개를 병렬로 만드는 건 쉽다. 타깃이 무엇을 신뢰하는지 먼저 파악하는 게 훨씬 어렵다.

## Codex가 SRI 해시 불일치를 잡은 순간

같은 세션에서 Codex 교차검증이 실제 버그를 하나 발견했다. V2/V3/V4/V5 HTML 시안이 `react.production.min.js`를 CDN에서 불러오는데, SRI(`integrity`) 해시값이 `.development.js`용으로 붙어 있었다.

브라우저는 SRI 해시 불일치를 차단한다. 시각적으로는 문제없어 보이지만 실제 사용자 환경에서 React가 로드되지 않는다. code-verifier는 이걸 통과시켰는데 Codex 리뷰에서 잡혔다.

즉시 4개 파일의 해시를 `.production.min.js` 기준으로 교체했다. 교차검증 없이 그냥 넘겼으면 5개 시안 중 4개가 실제로 동작하지 않는 채로 공유됐을 거다.

## 치과 리포트 — 공개 정보의 한계를 명시하는 구조

세션 2~17은 야탑NYU치과와 동백유치과 두 곳의 무료 광고·검색 진단 리포트 작업이었다. 이 작업의 핵심 제약이 흥미로웠다.

무료 리포트의 범위는 공개 웹 정보만이다. 네이버 플레이스 관리자 통계, 광고 계정, 전화·예약·내원 수치는 권한 없이 접근 불가다. 그래서 리포트의 모든 점수에 "확인 근거 → 감점 이유 → 개선 조건" 구조를 강제했다. 임의 숫자를 쓰지 않고, 권한 없이 알 수 없는 건 명확히 "수치 미확인"으로 표시한다.

동백유치과는 병원명 혼동 문제도 있었다. 검색 결과에 "동백 유디치과", "동백서울유치과의원", "동백서울치과의원"이 섞여 나왔다. 모두닥 18273번 리뷰가 붙은 "동백서울**치과**의원"(동백7로 83)은 완전히 다른 병원이다. 공개 정보를 확인 근거로만 쓰고, 불확실하면 반드시 "후보/확인 필요" 라벨링을 달았다.

사용자가 디자인을 보고 "AI가 만든 것 같다"고 피드백했다. 이건 콘텐츠보다 시각 디자인 문제였다. 8개 레퍼런스 방향(McKinsey 컨설팅 문서, Notion Knowledge Document, 학술 리포트, Figma 피그마 스타일 등)을 조사해서 선택 보드 HTML을 먼저 만들고, 사용자가 3번 Notion Knowledge Document를 선택했다. 그걸로 3개 리포트를 재작성했다.

## spoonai 폰트 깨짐 — 이미지 1장 추적

세션 18(21시간 45분 경과, 130 tool calls)은 가장 긴 세션이었다. 도중에 spoonai.me에서 한글 폰트가 깨진다는 이슈가 들어왔다.

스크린샷을 보면 "총 규모", "OpenAI 지분", "구조" 같은 라벨이 `□□□□`로 렌더링됐다. 외부 이미지가 아니라 직접 제작한 카드형 인포그래픽이었다.

codebase 전체에서 `credit: spoonai`로 마킹된 이미지를 검색했다. 딱 1장 — `openai-deployment-company-tpg-10b-01.jpg` (58KB). 두 포스트(ko/en)가 이걸 참조하고 있었다. JPG 삭제 + 두 마크다운 frontmatter의 `image:` 블록 제거 + 커밋 + 푸시.

```
commit 8b55047
chore: remove self-generated infographic image with broken Korean fonts
3 files changed
```

빌드 확인 후 Vercel 자동 배포까지 3 tool calls로 끝냈다.

같은 세션에서 spoonai 리디자인도 병행했다. 5개 초기 시안 → "심플하고 카드 뉴스 쪽으로" 피드백 → 카드뉴스 5개 재제작 → `05-brief.html` 톤이 좋다는 피드백 → `05a-editorial-premium.html`로 고도화 → 실제 spoonai-site에 병합까지 이어졌다. 7개 파일, 442 insertions / 725 deletions.

## 하루 작업 숫자

| 항목 | 수치 |
|------|------|
| 총 세션 수 | 18 |
| 총 tool calls | 451 |
| Bash | 175 |
| Read | 59 |
| Agent (서브에이전트) | 50 |
| WebSearch | 41 |
| Edit | 32 |
| Write | 26 |
| WebFetch | 16 |
| 수정 파일 | 9개 |
| 생성 파일 | 23개 |

Agent 50번은 plan-orchestrator, frontend-implementer, code-verifier, design-reviewer, codex-cross-verify 등을 병렬 디스패치한 수치다. major 작업에서 plan → 구현 → verifier → codex 흐름을 여러 번 돌렸다.

WebSearch 41번은 대부분 치과 세션에서 나왔다. 두 병원의 공개 정보를 교차 검증하면서 동명이원, 주소 충돌, 전화번호 후보를 정리하는 데 상당한 검색이 들어갔다.

Codex 교차검증은 major 파이프라인에서만 돌렸는데, SRI 해시 불일치 1건과 금지 표현 잔존 여부 확인 등 verifier가 놓친 것들을 실제로 잡았다. 작은 작업에 붙이는 건 overhead가 크지만, 사용자에게 직접 전달되는 HTML 문서 3개 이상을 한 번에 수정할 땐 비용을 낼 만했다.
