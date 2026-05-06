---
title: "Claude Code 5개 시안 병렬 생성 + Codex가 SRI 버그 잡은 방법 (208 tool calls)"
project: "portfolio-site"
date: 2026-05-07
lang: ko
tags: [claude-code, design, redesign, debugging, parallel-agents, codex]
description: "coffeechat.it.kr 리디자인 5개 시안 병렬 생성, Codex가 SRI 해시 불일치 버그 발견, spoonai 한글 폰트 깨짐 추적·제거까지. 2세션 208 tool calls로 처리한 과정."
---

작업 두 개가 동시에 걸렸다. coffeechat.it.kr 리디자인 5개 시안과 spoonai 한글 폰트 깨짐 수정. 둘 다 하루 안에 끝냈다. 총 208 tool calls, 2세션, 약 4시간 40분.

**TL;DR** 5개 시안 병렬 생성 패턴은 디자인 작업 속도를 확실히 올린다. 단, "다 별로야"라는 피드백 한 마디가 1시간 작업을 리셋시킨다. Codex 교차검증은 `react.production.min.js`에 `.development.js`용 SRI 해시를 붙인 버그를 잡아냈다.

## "다 별로야" — 피드백 한 마디에 1시간이 사라진 순간

커피챗 리디자인 요청이 들어왔다. 조건은 간단했다. "최소 5가지 결과물을 내고 내가 고를 수 있게 해줘."

먼저 `coffeechat.it.kr`을 분석했다. 게임 업계 멘토링 플랫폼이다. 현직 게임 회사 개발자·디자이너와 1:1 커피챗, 이력서 리뷰, 모의면접을 연결해준다. 타겟이 명확하니 5개 변주를 빠르게 잡고 병렬로 돌렸다.

`frontend-implementer`를 5개 동시 디스패치했다. V1 Editorial Magazine (Instrument Serif + 크림 베이지), V2 Soft Brutalist (굵은 보더 + 라임·핑크), V3 Floating Gradient, V4 Object-oriented UI, V5 Brief Format. 각 시안이 독립된 컨텍스트로 돌아가서 서로 영향을 주지 않는다.

결과를 보여줬더니 피드백이 왔다. "다 별로야 하나도 전문성이 없어보여. 인프런이나 다른 교육기관 봐봐."

디자인 변주만 했고 "전문 교육 서비스의 신뢰감"이 빠져 있었다. 인프런, 클래스101, 패스트캠퍼스 톤을 기준으로 잡아야 했는데 게임 인디 무드만 뽑은 거다. 작업을 리셋하고 재분류했다.

브랜드/서비스 카테고리를 잘못 읽으면 변주를 아무리 많이 뽑아도 방향이 틀린다. "어떤 종류의 서비스인가"를 먼저 확정하지 않으면 첫 라운드 전체가 낭비된다.

## Codex가 발견한 SRI 해시 불일치

리셋 직전에 design-reviewer가 V3에서 floating gradient blobs 블로커를 리포트했다. 픽스하고 Codex 교차검증을 돌렸다.

Codex 리포트가 나왔다. V2·V3·V4·V5가 CDN에서 `react.production.min.js`를 로드하는데 SRI integrity 해시가 `.development.js` 빌드 기준으로 작성되어 있었다. 브라우저 보안 정책 상 해시가 파일 내용과 다르면 리소스를 차단한다. 로컬에서는 캐시 때문에 재현이 안 되는 버그다.

```html
<!-- 잘못된 예 — production 파일에 development 해시 -->
<script src="react.production.min.js"
  integrity="sha384-development-hash-goes-here">
```

각 시안의 CDN 링크와 integrity 해시를 `react.production.min.js` 기준으로 다시 맞췄다. 이런 버그는 Codex 같은 외부 모델이 diff를 처음 보는 눈으로 볼 때 잘 잡힌다. 동일한 컨텍스트 안에서 작업한 모델은 본인이 쓴 코드를 그대로 통과시키는 경향이 있다.

## spoonai 한글 폰트 깨짐 추적

두 번째 세션은 spoonai에서 시작됐다. 스크린샷에 `□□□□`가 잔뜩 보였다. `총 규모`, `OpenAI 지분`, `구조` 같은 라벨들이 글리프 없이 박스로만 렌더링됐다.

원인 추적부터 시작했다. spoonai 포스트 이미지는 `credit` 필드로 출처를 구분한다. credit이 `"spoonai"`이면 직접 제작, `"CNBC"`나 `"TechCrunch"`이면 외부 소스다.

```bash
grep -r 'credit.*spoonai' src/content/posts/
```

결과가 하나 나왔다. `openai-deployment-company-tpg-10b-01.jpg` — 58KB짜리 인포그래픽. 한글 라벨이 들어간 카드를 직접 제작했는데, 폰트가 임베딩되지 않아서 깨진 거다. 이 이미지를 참조하는 포스트가 ko/en 두 개였다.

제거 순서는 단순했다. 두 포스트의 `image:` frontmatter 블록 삭제 → JPG 파일 삭제 → 빌드 확인 → 커밋·푸시.

```bash
git commit -m "chore: remove self-generated infographic image with broken Korean fonts"
```

3 files 변경. Vercel 자동 배포가 트리거됐고 2분 후 프로덕션에 반영됐다.

## spoonai 리디자인 — 2라운드 탐색

버그 수정 후 spoonai 리디자인도 같은 세션에서 처리했다. 첫 라운드 5개를 뽑은 뒤 피드백이 왔다. "05-brief.html 톤 좋은 것 같아. 이거 근처로 더 고도화한거 5개."

이 패턴이 효율적이다. 처음엔 넓게 5개를 펼쳐서 방향을 잡고, 마음에 드는 것에서 고도화를 5개 더 뽑는다. 두 라운드 합치면 실질적으로 10개 변주를 탐색한 셈인데, 사용자 입장에서는 두 번의 선택만 하면 된다.

최종 방향은 `05a-editorial-premium.html`로 확정됐다. 이걸 기반으로 spoonai-site 실제 코드베이스에 적용했다. `feat/editorial-premium-redesign` 브랜치에서 7개 파일, 442 insertions, 725 deletions.

## 이 세션에서 배운 것

208 tool calls 중 Bash가 112회, Agent가 50회다. Bash가 절반을 넘는 건 CDN URL 검증, 해시 확인, git 작업, dev server 실행이 많았기 때문이다. Agent 50회는 시안 병렬 디스패치와 design-reviewer, codex-cross-verify 호출이다.

병렬 시안 생성의 병목은 속도가 아니라 방향이다. 5개를 빠르게 뽑는 건 이제 어렵지 않다. 어렵고 중요한 건 첫 라운드 전에 "이 서비스가 어떤 카테고리인가"를 정확히 읽는 것이다.

Codex 교차검증은 보험이다. SRI 해시 불일치는 배포 후에야 드러날 수 있었다. 사용자가 브라우저 콘솔에서 `Integrity check failed`를 보는 상황이 됐을 거다. 외부 모델이 diff를 처음 보는 눈으로 검토하는 값어치가 있다.

> 병렬 생성은 탐색 범위를 넓히고, 교차검증은 놓친 버그를 잡는다. 둘 다 속도가 아니라 품질 보험이다.
