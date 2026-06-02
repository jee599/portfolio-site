---
title: "Open Design을 Claude Code에 로컬 이식 — hook 1개로 claude.ai/design 완전 대체"
project: "portfolio-site"
date: 2026-06-02
lang: ko
tags: [claude-code, open-design, hook, skill, automation, design-system]
description: "claude.ai/design의 오픈소스 대안 Open Design을 Claude Code에 이식했다. 5개 세션, 104 tool calls. 결과물은 hook 1개 + skill 3파일 + HTML 리포트 2개."
---

claude.ai/design을 처음 봤을 때 느낌은 단순했다. "이거 왜 클라우드에서만 써야 하지?"

Open Design 프로젝트가 오픈소스로 공개돼 있고, 같은 루프를 Claude Code에서 돌릴 수 있다는 걸 확인하는 데 1시간 21분이 걸렸다. 세션 3 혼자 70 tool calls를 썼다.

**TL;DR** Open Design의 discovery → 5방향 → 디자인시스템 → 빌드 → 5차원 검토 루프를 Claude Code 스킬로 이식했다. `UserPromptSubmit` hook을 달아서 "디자인"이라는 단어 없이도 시각 요청이면 OD 루트가 자동으로 뜬다.

## "이게 claude.ai/design이랑 같은 효과야?"

사용자 프롬프트가 직접적이었다.

> "opendesign 좋아 모든 디자인에 대해서 저 루트를 타게 할 수 있어? 오픈소스니까 로컬에서 구현해서"

바로 이어서:

> "꼭 디자인이라고 안 외쳐도, 모든 디자인 관련에서 자동으로 저거 쓰게 해줘"

두 가지 작업이 생겼다. OD 실제 엔진 프롬프트를 그대로 이식하는 것, 그리고 "디자인이라고 안 외쳐도" 감지하는 hook을 만드는 것.

## OD 엔진 해부: RULE 1/2/3

Open Design 레포를 분석하니 세 계층으로 구성돼 있었다.

**RULE 1** — discovery. `AskUserQuestion`으로 산출물·플랫폼·브랜드·톤을 먼저 확인한다. 코드를 쓰기 전에 방향을 잡는다.

**RULE 2** — 5개 시각 방향 제시. 각 방향에 OKLch 팔레트 + 폰트 + 레이아웃 원칙이 구체적으로 붙는다. "감각 있게 해줘" 같은 모호한 요청이 여기서 구체화된다.

**RULE 3** — 디자인시스템 바인딩 → 빌드 → P0 체크리스트 + 5차원 자가검토. 시각 일관성, 접근성, 모바일, 인터랙션, 감성 다섯 축으로 결과물을 직접 검수한다.

OD 레포의 실제 프롬프트 파일을 읽고 추측 없이 그대로 이식했다. Bash로 레포 구조를 탐색한 다음, discovery 흐름과 5방향 팔레트 정의를 직접 읽어서 스킬로 옮겼다.

생성 파일:
- `~/.claude/skills/open-design/SKILL.md`
- `~/.claude/skills/open-design/reference/charter.md` — anti-slop 체크리스트 포함
- `~/.claude/skills/open-design/reference/directions.md`

`charter.md`는 OD의 금지 패턴을 담는다. 가짜 대시보드, AI스러운 카드 디자인, 복붙 그라디언트. 나열이 아니라 조건부 금지로 명시했다.

## Hook: "디자인" 없이도 감지

더 까다로운 쪽은 hook이었다. `UserPromptSubmit` 이벤트에서 실행되는 `design-router.sh`는 키워드 매칭으로 시각 작업을 잡는다.

`~/.claude/hooks/design-router.sh`가 "랜딩", "대시보드", "목업", "슬라이드", "시안", "프로토타입" 같은 단어를 감지하면 OD 루트 안내 메시지를 출력한다. 사용자가 명시적으로 "디자인"이라 부르지 않아도 된다.

`CLAUDE.md`에도 라우팅 규칙을 박았다:

> "Visual/UI design artifacts (landing, pitch deck, dashboard, prototype...)는 `open-design` 스킬. RULE 1→2→3 순서."

메모리가 아니라 설정 파일에 고정하면 세션이 바뀌어도 동작이 일관된다.

## 실전: 소상공인 진단 리포트

hook 설정 직후 첫 케이스가 들어왔다.

> "사장님이 모바일 PDF로 30초 안에 이해할 수 있는 무료 진단 리포트 / 유료 결과물 템플릿으로 재디자인해줘."
> "fake dashboard나 AI스러운 카드 디자인은 피하고."

OD 루트 첫 적용. RULE 1에서 `AskUserQuestion`으로 방향을 먼저 잡고, HTML/PDF 두 버전을 생성했다.

- `~/.hermes/work/redesign/free-diagnostic-report.html` — 문제 인식과 결제 전환 중심
- `~/.hermes/work/redesign/paid-deliverable.html` — 복붙 가능한 작업물 중심

콘텐츠는 같지만 정보 계층 방향이 반대다. 무료는 "무엇이 문제인가"로 시작하고, 유료는 "어떻게 고치는가"로 시작한다.

다음 날 세션 5에서 유료 리포트 CSS 미세 조정이 들어왔다. 강조 텍스트 시각 처리를 조금 더 강하게, 전체 여백을 살짝 늘리는 작업. 리디자인이 아니라 CSS 편집이라서 OD discovery는 건너뛰고 파일 직접 수정으로 처리했다. 이런 판단 분기를 명시적으로 남겨두는 게 포인트다.

## 세션별 도구 사용 분포

5개 세션, 104 total tool calls.

Bash 32회, Read 27회, Edit 21회, Write 10회, WebSearch 5회, AskUserQuestion 4회, WebFetch 2회, ToolSearch 2회.

AskUserQuestion이 4회 나온 게 OD 루트의 특징이다. 만들기 전에 방향을 확인하는 단계가 명시적으로 들어가 있어서다. 세션 3 혼자 70 tool calls, 소요 시간 1시간 21분이었다.

## Claude 자격증은 파트너 전용이었다

세션 4에서 Claude Certified Architect(CCA) 자격증을 조사했다. 2026년 3월 출시된 Anthropic 첫 공식 기술 자격증이다. 301레벨, 60문항, 120분, 720점 이상 합격.

응시가 막히는 이유: CCA는 **Claude Partner Network 회원사 직원** 한정이다. Skilljar에서 파트너사 인증 이메일이 확인돼야 결제 단계로 넘어간다. `claude.com/partners` 신청이 먼저다.

1인 개발자 기준으로는 닭-달걀 함정이 하나 있다. "클로드를 시장에 가져가는 조직"이라는 공식 요건은 느슨하지만, 실제로 파트너 트랙이 열리려면 기존 레퍼런스가 필요하다.

## 정리

Open Design 이식은 예상보다 빨랐다. 클라우드 서비스의 프롬프트 엔진을 직접 읽을 수 있으면 이식도 그만큼 정확하다. OD 레포가 엔진 프롬프트를 공개했기 때문에 가능했다.

남은 과제는 `design-router.sh`의 정밀도다. 지금 키워드 매칭은 "API 설계", "DB 스키마 설계" 같은 비시각 작업도 잡을 수 있다. 키워드 분류 로직을 더 좁혀야 한다.
