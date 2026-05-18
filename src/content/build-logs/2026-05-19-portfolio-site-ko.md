---
title: "Claude Code 클라이언트 납품 패턴: 18 세션, 145 tool calls, 하루 완결"
project: "portfolio-site"
date: 2026-05-19
lang: ko
tags: [claude-code, workflow, static-site, client-work, daymoon]
description: "하루 18 Claude Code 세션으로 Daymoon 사진작가 사이트를 납품 수준까지 완성했다. 145 tool calls, 8개 파일 수정 — 세션을 쪼개고 리뷰를 먼저 돌리는 패턴이 완성도를 만든다."
---

하루에 Claude Code 세션 18개를 돌렸다. 그 중 8개는 단 한 줄짜리 응답 핑이었다. 나머지 10개가 실제 작업이고, 총 145 tool calls, 8개 파일이 바뀌었다. Daymoon 사진작가 클라이언트 사이트를 클라이언트 앞에 내보낼 수 있는 상태로 만드는 데 걸린 시간이다.

**TL;DR** 리뷰 세션을 구현 세션보다 먼저 돌리고, 구현 범위를 작은 단위로 쪼개는 패턴이 하루 만에 납품 품질을 뽑아냈다. runner 검증용 핑 세션이 8개나 되는 게 이상해 보이지만, 그게 자동화 파이프라인의 정상 작동 신호다.

## 8개의 "OK" 세션 — 이게 왜 있나

세션 목록을 보면 눈에 띄는 것들이 있다.

```
세션 3:  "Say OK only"         → OK
세션 5:  "Return exactly: CLAUDE_OK"         → CLAUDE_OK
세션 6:  "In this repo ... return exactly CLAUDE_PROJECT_OK" → CLAUDE_PROJECT_OK
세션 7:  "Return exactly: CLAUDE_SKIP_OK"    → CLAUDE_SKIP_OK
세션 8:  "Return exactly: CLAUDE_STDIN_OK"   → CLAUDE_STDIN_OK
세션 9:  "Claude 러너가 Daymoon에서 정상 작동합니다."
세션 10: (동일)
세션 11: (동일)
```

이건 Claude Code 자동화 파이프라인의 runner 헬스 체크다. 실제 작업을 Claude에게 넘기기 전에 실행 환경이 정상인지 확인하는 단계다. 세션이 실패하거나 응답이 없으면 이후 구현 세션을 트리거하지 않는다. 8개나 된 이유는 환경 세팅과 연결 방식을 여러 번 바꿔가며 테스트했기 때문이다.

낭비처럼 보이지만 반대다. runner가 불안정한 상태에서 긴 구현 세션을 돌리면 중간에 끊기고, 파일이 반쯤 수정된 상태로 남는다. 그게 더 비싸다.

## 리뷰 세션을 먼저 돌린다

세션 12는 특이하다. 19개 tool call을 쓰면서도 파일을 하나도 수정하지 않았다.

```
세션 12: 프롬프트에 "Do not edit files. Review whether the client request was implemented."
         → Read(5), Bash(4) 사용
         → ✅/⚠️/🔴 3단계 분류로 리포트 반환
```

이 패턴은 의도적이다. 구현을 시작하기 전에 현재 상태를 읽기 전용으로 먼저 평가한다. 리뷰 결과를 보면 "공개 페이지에 placeholder/TODO 텍스트가 노출되어 있다"는 blocker가 딱 하나 잡혔다. 이게 없었으면 클라이언트가 직접 발견했을 것이다.

리뷰 세션의 프롬프트 구조:

> "Do not edit files. Review whether the client request was implemented: [체크리스트]. Return Korean bullet list: done, insufficient, must-fix before showing client."

`must-fix`와 `done`으로 분류하면 다음 구현 세션의 범위가 자동으로 정해진다. 전체를 다시 훑을 필요가 없다.

## 구현은 관심사 단위로 쪼갠다

실제 구현 세션은 6개였고, 각각 하나의 관심사만 담당했다.

**세션 13 — public-facing blocker 제거** (20 tool calls, Edit 12회)
- `about.html`: placeholder 캡션 제거
- `notice.html`: TODO 주석 제거, 실제 공지 내용 작성
- `reservation.html`: 미완성 폼 가이드 대체
- `styles.css`: 불필요한 fallback 스타일 정리

**세션 14 — 카피·타이포그래피 폴리시** (20 tool calls, Edit 11회)
- 헤딩 계층 정리, 단락 간격 통일
- 중복 버튼 제거
- 클라이언트 요청 반영 여부 재확인 후 진행

**세션 15 — Product 페이지 디자인 개선** (18 tool calls, Edit 7회)
- AI/템플릿 느낌을 제거하는 것이 목표
- `product.html`과 `styles.css`만 변경

이 세션에서 흥미로운 순간이 있었다. grep 결과가 깨져서 나왔고, Claude가 직접 판단해서 Read로 전환했다.

> "The grep output got mangled. Let me read the actual product CSS section."

도구 선택이 유연하다. grep이 안 되면 Read로 간다. 이게 자연스럽게 작동한다.

**세션 16 — product-meta 블록 제거** (12 tool calls)
- 카카오 스크린샷 피드백 기반
- `<dl class="product-meta">...</dl>` 전체 제거
- 연관된 CSS도 함께 정리

**세션 17 — 카카오채널 연동** (18 tool calls, Edit 2회)
- `reservation.html`에 카카오채널 링크 추가
- `https://pf.kakao.com/_TuhCn` URL을 확인 후 연결
- `target="_blank" rel="noreferrer"` 적용

**세션 18 — 모바일 드로어 HOME 버튼 제거** (19 tool calls, Edit 7회)
- 7개 HTML 파일 전체 동일 패턴 수정
- 브랜드 링크는 유지, 드로어 내 HOME row만 제거
- CSS/JS 쿼리 캐시 버스팅 포함

## 도구 사용 통계

| 도구 | 횟수 | 비중 |
|------|------|------|
| Read | 63 | 43% |
| Edit | 39 | 27% |
| Bash | 32 | 22% |
| Grep | 11 | 8% |

Read가 Edit보다 1.6배 많다. 구현 전에 현재 상태를 충분히 읽는 패턴이 반영된 수치다. 모르는 상태에서 Edit을 먼저 치면 기존 구조를 깨는 경우가 생긴다.

Bash 32회는 주로 커밋, 캐시 버스트 확인, 파일 존재 여부 확인에 쓰였다. 빌드를 돌리거나 서버를 띄우는 데는 거의 안 썼다 — 정적 HTML 사이트라 그 필요가 없었다.

## 프롬프트 설계에서 배운 것

18개 세션을 돌리면서 프롬프트 패턴이 수렴했다.

**제약을 명시한다.** "Do not edit files", "Do not commit/deploy", "Do not use Codex" 같은 부정 지시가 범위를 확정시킨다. 없으면 Claude가 알아서 넓게 해석하는 경우가 생긴다.

**이전 확인을 재확인하게 한다.** 세션 14 프롬프트에는 이런 줄이 있다:

> "Confirm the prior client request remains applied."

구현 세션이 반복될수록 이전에 잡아놓은 부분이 리그레션되는 경우가 있다. 매 세션 시작 시 이걸 체크하게 만들면 나중에 되돌리는 비용을 아낀다.

**완성 기준을 콘텐츠로 제시한다.** "클라이언트에게 보여줄 수 있는 상태" 같은 추상적인 기준보다, "공개 페이지에 placeholder 텍스트가 없어야 한다"처럼 구체적인 체크리스트가 더 정확한 결과를 만든다.

## 정리

하루 18 세션 중 실제 구현은 10개, 나머지 8개는 인프라 검증이었다. 규모가 작은 정적 사이트 폴리시 작업에서 145 tool calls는 많아 보이지만, 리뷰-구현-재확인 루프를 돌리면 이 정도가 자연스럽게 나온다.

핵심 패턴 세 가지:
- runner 검증 핑으로 실행 환경을 먼저 확인한다
- 구현 전 read-only 리뷰 세션으로 blocker를 먼저 잡는다
- 구현 범위는 관심사 단위로 세션을 분리한다
