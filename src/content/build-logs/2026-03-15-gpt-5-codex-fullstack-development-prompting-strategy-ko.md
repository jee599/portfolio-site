---
title: "GPT-5-Codex로 Python-TypeScript 풀스택을 처음부터 끝까지 만드는 프롬프트 전략"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

며칠 전 GPT-5-Codex 얼리액세스를 받았다. 이번에 shorts 자동 제작 파이프라인을 밑바닥부터 만들면서 어떤 프롬프팅 패턴이 효과적인지 실험했다. 특히 Python CLI + TypeScript React 조합에서 멀티 파일 생성과 일관성 유지를 어떻게 해결했는지 정리한다.

## 배경: ShortsMaker 파이프라인 구축

사주 데이터를 받아서 숏폼 영상을 자동으로 만드는 파이프라인을 구축하는 중이다. Python으로 데이터 처리와 CLI를 담당하고, TypeScript + Remotion으로 렌더링을 한다. 한 번의 작업으로 34개 파일에 5800줄을 추가했는데, 대부분 AI가 생성한 코드다.

이번 작업의 목표는 명확했다:
- 전체 프로젝트 구조를 잡고 핵심 모듈들 구현
- Python과 TypeScript 간 데이터 인터페이스 설계
- 실제 동작하는 파이프라인 완성

## 코드 품질을 결정하는 컨텍스트 설계

GPT-5-Codex와 작업할 때 가장 중요한 건 프로젝트 전체 맥락을 일관성 있게 전달하는 것이다. 개별 파일만 보고 코드를 생성하면 절대 안 된다.

### ARCHITECTURE.md 기반 구조화

첫 번째로 한 일은 `ARCHITECTURE.md` 작성이다. 이게 모든 프롬프트의 베이스가 된다:

```markdown
# ShortsMaker Architecture

## Data Flow
input/profiles/*.json → Python CLI → renderer/src → Remotion → output/*.mp4

## Module Structure
- src/shortsmaker/models.py: Pydantic models
- src/shortsmaker/hooks.py: Processing logic
- renderer/src/types.ts: TypeScript interfaces
```

이런 식으로 정의하면 AI가 새 파일을 만들 때마다 전체 그림을 고려하게 된다.

### 타입 시스템 우선 설계 프롬프트

Python-TypeScript 간 데이터 교환에서 가장 자주 터지는 부분이 타입 불일치다. 이걸 방지하는 프롬프트 패턴:

> "`models.py`의 Pydantic 모델과 `types.ts`의 TypeScript 인터페이스가 정확히 일치해야 한다. JSON 직렬화 시 snake_case(Python)를 camelCase(TypeScript)로 변환하는 규칙을 적용해. 새 필드 추가할 때마다 양쪽 모두 업데이트해."

이렇게 제약 조건을 명시하면 AI가 한쪽만 수정하고 끝내는 실수를 방지할 수 있다.

## 멀티 파일 생성에서 일관성 유지하기

34개 파일을 한 번에 만들면서 가장 어려웠던 부분이 파일 간 의존성 관리였다. 각 파일이 다른 파일의 인터페이스를 정확히 참조해야 하는데, AI는 종종 존재하지 않는 함수를 호출하거나 잘못된 import를 만든다.

### 의존성 그래프 명시 전략

이런 프롬프트가 효과적이다:

> "다음 순서로 파일을 생성해:
> 1. `models.py` (의존성 없음)
> 2. `config.py` (models만 import)
> 3. `hooks.py` (models, config import)
> 4. `job.py` (위 3개 모두 import)
> 
> 각 단계에서 이전 단계 파일들의 public API만 사용해. 존재하지 않는 함수나 클래스를 참조하지 마."

순서를 명시하면 AI가 아직 만들지 않은 모듈을 참조하는 실수를 줄일 수 있다.

### 인터페이스 계약 우선 정의

특히 Python CLI와 TypeScript 렌더러 간 통신에서는 JSON 스키마를 먼저 고정하고 시작했다:

> "`sample_saju.json` 파일을 먼저 만들어. 이게 두 시스템 간 계약이다. Python의 `SajuProfile` 모델과 TypeScript의 `SajuProfile` 인터페이스는 모두 이 JSON과 정확히 일치해야 해."

실제 데이터 샘플을 먼저 만들고, 거기서 타입 정의를 역산하는 방식이 훨씬 안전하다.

## CLI 설계에서 빠지는 함정들

Python CLI를 만들 때 AI가 자주 하는 실수들과 해결책을 정리했다.

### 경로 처리의 복잡성

AI는 보통 하드코딩된 경로를 쓰거나, 상대경로 처리를 잘못한다. 이런 프롬프트로 해결:

> "모든 파일 경로는 `config.py`의 `ProjectPaths` 클래스로 중앙 관리해. 상대경로는 프로젝트 루트 기준으로 하고, `Path.resolve()`로 절대경로 변환해. CLI에서 실행할 때와 테스트에서 실행할 때 모두 동작해야 해."

특히 `tests/test_cli.py`를 먼저 만들게 하면 경로 처리가 제대로 되는지 검증할 수 있다.

### 에러 처리와 로깅

AI가 만든 CLI는 대부분 happy path만 고려한다. production ready하게 만들려면:

> "CLI 각 단계마다 상세한 로깅을 추가해. 파일을 읽지 못하면 구체적인 에러 메시지를, 성공하면 진행 상황을 보여줘. `--verbose` 플래그로 디버그 정보도 출력할 수 있게 해."

단순하지만 이런 요구사항을 명시하지 않으면 AI는 절대 넣지 않는다.

## React + Remotion 컴포넌트 생성 패턴

TypeScript React 컴포넌트를 AI로 만들 때는 CSS-in-JS 스타일링과 props 타이핑이 핵심이다.

### 스타일링 제약 조건 명시

> "`ShortsComposition.tsx`를 만들 때 다음 규칙을 지켜:
> - 모든 스타일은 인라인 객체로 정의
> - 9:16 세로 비율 (1080x1920) 기준으로 레이아웃
> - 텍스트 크기는 모바일에서 가독성 고려
> - 애니메이션은 Remotion의 `spring()` 사용
> - 색상은 사주 요소별 색상 매핑 테이블 참조"

Remotion은 일반 React와 다른 제약이 있어서 이런 부분을 명시해야 한다.

### 타입 안전성 확보

TypeScript 컴포넌트에서는 props 타입 정의가 중요하다:

> "모든 컴포넌트는 `types.ts`에서 인터페이스를 import해서 사용해. props가 없어도 `React.FC<{}>` 명시해. 선택적 props는 기본값을 제공해."

이렇게 하면 나중에 props 구조가 바뀌어도 컴파일 에러로 잡을 수 있다.

## 검증 중심 개발 패턴

AI 생성 코드의 가장 큰 문제는 문법은 맞지만 실제로 실행하면 터진다는 점이다. 이걸 방지하는 검증 패턴들:

### 단계별 실행 검증

> "코드를 만든 후 다음 명령어들이 모두 성공하는지 확인해:
> - `python -m shortsmaker --help`
> - `python -m shortsmaker process input/profiles/sample_saju.json`
> - `cd renderer && npm run render`"

실제 실행 명령어를 프롬프트에 포함시키면 AI가 실행 가능한 코드를 만들 확률이 높아진다.

### 샘플 데이터 기반 테스트

`sample_saju.json` 같은 realistic한 테스트 데이터를 먼저 만들고, 그걸로 전체 파이프라인을 검증하는 방식이 효과적이다. AI에게 엣지 케이스까지 고려한 샘플을 만들게 하면 더 견고한 코드가 나온다.

## 더 나은 방법은 없을까

이번에 쓴 방법들도 완전하지 않다. GPT-5-Codex 공식 가이드를 보면 몇 가지 개선점이 보인다.

### Workspace 설정 활용

GPT-5-Codex는 `.gptcodex/workspace.json` 설정으로 프로젝트 컨텍스트를 더 체계적으로 관리할 수 있다. 타입 정의나 컨벤션을 여기 명시하면 매번 프롬프트에 반복 입력할 필요가 없어진다.

### 점진적 복잡도 증가

34개 파일을 한 번에 만들기보다는, 핵심 모듈부터 시작해서 점진적으로 확장하는 게 더 안전하다. MVP부터 만들고 검증한 후 기능을 추가하는 방식이다.

### 타입 스키마 자동 동기화

Python Pydantic과 TypeScript 간 타입 동기화는 `pydantic-to-typescript` 같은 도구로 자동화할 수 있다. 수동 동기화보다 훨씬 안전하다.

### 더 강력한 검증 파이프라인

단순한 실행 테스트 외에도 `mypy`, `eslint`, `prettier` 같은 정적 분석 도구를 CI에 연결하면 AI 생성 코드의 품질을 더 보장할 수 있다.

## 정리

- 멀티 파일 프로젝트에서는 아키텍처 문서와 타입 계약을 먼저 정의한다
- 의존성 순서를 명시하면 AI가 존재하지 않는 모듈을 참조하는 실수를 줄인다  
- 실제 샘플 데이터와 실행 명령어를 프롬프트에 포함시켜 검증 가능한 코드를 만든다
- Python-TypeScript 간 데이터 교환에서는 JSON 스키마를 중심으로 타입을 설계한다

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
65f233a — gpt-5-codex: bootstrap project workspace

</details>