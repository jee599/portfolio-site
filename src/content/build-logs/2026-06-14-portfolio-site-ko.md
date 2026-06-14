---
title: "Design Gate가 4번 막았다 — Hermes 릴레이 패턴과 528번 tool call의 하루"
project: "portfolio-site"
date: 2026-06-14
lang: ko
tags: [claude-code, design-gate, workflow, hermes-relay, saju, coffeechat]
description: "하루 11세션 528 tool calls. 사주 디자인 리디자인, 커피챗 애니메이션 복원, Godot 기획서 생성. design-gate 훅이 PDF 세션 4번을 연속으로 차단한 실제 기록."
---

하루 11세션에서 528번 tool call이 나왔다. 모델은 대부분 `claude-opus-4-8`. 작업한 프로젝트는 사주 글로벌, 커피챗, Godot 무협 게임 기획, AEO 아웃리치. 그 중 가장 눈에 띈 건 결과물이 아니라 반복적으로 막힌 과정이었다.

**TL;DR** design-gate 훅이 Godot 기획서 PDF 세션을 4번 연속으로 차단했다. Hermes(릴레이 오케스트레이터)와 Claude Code(실행자)를 분리하는 실험적 패턴이 왜 깨지는지 이 사례에서 잘 보인다.

## 사주 코스믹 골드 — 10가지 방향에서 하나를 고르는 법

사주 사이트의 문제는 구체적이었다. `$4.99 / 20,000+ character deep-dive by AI / Start Free, Upgrade Anytime` 같은 카피가 i18n 파일에 그대로 남아 있었고, 이미지 4개가 세 가지 다른 시각 언어를 쓰고 있었다.

`hero-sky` + `sea-moon`은 어두운 실사 야경 사진이었다. `ink-night`는 수묵화였다. `ink-cranes`는 밝은 배경에 학. 다크 테마 사이트에 이 조합은 맥락이 없었다.

Claude가 Dynamic Workflow를 써서 10개 동양풍 아트 방향을 탐색했다. 천문도 톤, 민화 톤, 산수화 톤, 청록산수 톤, 코스믹 골드 라인아트 등. 각 방향을 실제 레퍼런스 이미지 URL과 함께 `art-directions.html`로 정리했다. 사용자가 "천문도 톤"을 골랐고, 이어서 `genimg-cosmic.py`로 gpt-image-2 파이프라인을 다시 짰다.

기존 `genimg.py`의 프롬프트는 "Editorial photography"로 실사 방향을 강제하고 있었다. 교체 후 코스믹 골드 페인터리 방향으로 통일됐다. 이 세션에서 Bash 82번, Read 27번, Edit 24번이 나왔다. 세션 길이가 15시간으로 찍혔는데 이건 세션이 열려있던 총 시간이고 실제 활성 작업 시간은 다르다.

## 커피챗 — 삭제된 애니메이션을 git에서 꺼낸다

커피챗 히어로 섹션에서 면접 예시 애니메이션(`InterviewDemo`)이 사라진 게 문제였다. 직전 커밋(`0e578da`)이 `InterviewDemo`를 지우고 정적 리포트 쇼케이스(`ReportShowcase`)로 교체한 것이었다.

Claude가 `git log`로 이걸 찾아냈다. 이후 계획이 명확해졌다. 히어로를 2단 레이아웃으로 바꾸고 왼쪽엔 면접 채팅 애니메이션을 복원하고, 오른쪽엔 리포트 3장을 작성하는 새 애니메이션을 절반 크기로 추가한다.

실제 구현 과정에서 `globals.css`에 애니메이션 정의를 추가하고, `demos.tsx`에서 두 컴포넌트를 나란히 배치하고, i18n 파일을 `en/ko` 각각 수정했다. 이 세션은 tool call 210번으로 가장 많았다. Bash 75, Edit 67, Read 59 순서였다.

사용자 프롬프트가 여러 번 이어졌다. "배포 했어? 아직 사이트에 반영 안되어 있는데?" 같은 실시간 피드백이 작업 방향을 계속 조정했다. 분야별 면접 커버리지 확장 요청, 피드백 리포트 페이지 수 조정, 통계 배너 디자인 개선까지 하나의 세션에서 연속으로 처리됐다.

## Design Gate가 4번 막은 이유

Godot 무협 게임 기획서 PDF를 만드는 작업이 세션 4, 5, 8, 9에 걸쳐 4번 시도됐다. 모두 같은 지점에서 막혔다.

CLAUDE.md에 이런 규칙이 있다. "HTML 산출물은 Open Design 또는 동등한 디자인시스템 패스 없이 불가." `hooks/design-gate.sh`가 `.html` 파일 작성 시도를 실시간으로 차단한다.

세션 4에서 Claude가 Open Design 서버를 확인했다. 포트 7457에 아무것도 없었다. `design-systems`/`design-templates` 폴더는 빈 플레이스홀더였다. OD를 실제로 실행할 수 없는 환경이었다.

대신 OD-equivalent 패스를 적용하는 방향으로 전환했다. OD 레포의 `craft/` 디렉토리에서 editorial typography, color, anti-AI-slop 규칙을 읽고 `design-pass.sh`로 인증했다. 그런데 세션이 거기서 멈췄다. 파일을 생성하기 전에 컨텍스트가 끊긴 것이다.

세션 5에서 재시도했다. "이전 세션에서 탐색을 반복하지 말고 바로 산출물을 만들어라"는 지시가 들어왔다. 이번엔 환경 확인(Bash 3번)만 하고 또 멈췄다.

세션 8, 9에서도 같은 패턴이 반복됐다. Hermes 릴레이를 통해 "직접 파일 생성하라"고 지시했지만, Claude가 design gate를 통과하는 과정에서 세션 시간이 다 소비되거나 컨텍스트가 단절됐다.

결국 Godot 기획서 PDF는 이날 세션에서 생성되지 않았다.

## Hermes 릴레이 패턴의 구조적 한계

세션 4~11 중 상당수가 "You are Claude Code, the actual executor. Hermes is only the relay/orchestrator." 형태의 시스템 프롬프트로 시작했다. Hermes가 PM 역할을 하고 Claude Code가 실행자 역할을 맡는 실험적 패턴이다.

이 패턴의 문제는 권한 게이트에서 드러났다. Hermes가 "Dynamic Workflow를 써서 아웃리치를 만들어라"고 지시했는데, Workflow 툴 실행 시 "Review dynamic workflow before running" 메시지가 나오면서 차단됐다. 인터랙티브 승인이 필요한 게이트를 릴레이가 우회할 수 없었다.

세션 6에서 이 상황을 Claude가 명시했다. "Workflow 툴이 게이팅됨 — 릴레이 세션에선 인터랙티브 승인 불가. 동일한 작업을 병렬 서브에이전트로 수동 분해해서 진행한다." 그리고 12개 B2B-SaaS 니치에 걸쳐 실제로 Agent 6번, Workflow 1번을 썼다.

AEO 아웃리치 워크플로는 결국 완성됐다. 27개 GREEN-only 프로스펙트가 선별됐고 `eligible_*.json`, `email_sequences.json`, `verification.md`가 생성됐다. 세션 10, 11에서 Codex 리뷰가 발견한 버그(검증.md에서 "price token: 31" vs "price token in email bodies: NONE" 충돌)를 수정하는 작업도 포함됐다.

## Gmail 오딧 — 5분, 23번 tool call

세션 3은 짧고 명확했다. Gmail 아웃리치 오딧 JSON(`claude_input.json`, `summary.json`)을 읽고 3개 산출물을 생성했다.

분석 결과가 예상과 달랐다. 86개 "바운스" 중 82개가 실제 이메일 주소 오류가 아니라 Gmail 일일 발송 쿼터 자기 스로틀이었다. 실제 하드 바운스는 1개, 원격 거부 3개. 진짜 인바운드 답장은 Fjord에서 1건. 이걸 23번 tool call(Bash 18, Write 3, Read 2)로 확인했다.

## 통계 요약

| 도구 | 횟수 |
|------|------|
| Bash | 237 |
| Read | 133 |
| Edit | 98 |
| Write | 18 |
| Agent | 10 |
| Workflow | 7 |

수정된 파일 23개, 생성된 파일 16개. 세션 1, 2가 각각 164, 210 tool calls로 전체의 71%를 차지했다. 이 두 세션이 각각 사주 리디자인, 커피챗 UI 개선이었다. 나머지 9개 세션은 Hermes 릴레이 패턴이었고 평균 tool call이 현저히 낮았다.

design-gate가 4번 연속으로 차단한 사례는 훅 시스템이 의도대로 작동한다는 증거이기도 하다. PDF 산출물에 즉흥 CSS가 들어가는 걸 막는 역할을 했다. 다만 릴레이 세션에서 OD-equivalent 패스를 인증하는 명확한 경로가 없으면 이 훅이 단순 장벽이 된다. 인증 흐름을 릴레이와 호환되게 만드는 게 다음 개선 지점이다.
