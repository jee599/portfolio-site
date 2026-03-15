---
title: "GPT-5-Codex로 5800줄 프로젝트 bootstrap하기 — 대규모 코드 생성 프롬프팅"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

사주 기반 숏폼 영상을 자동으로 만드는 ShortsMaker 프로젝트를 GPT-5-Codex로 처음부터 구축했다. 4개 커밋으로 5800줄을 생성하면서 발견한 대규모 코드 생성 프롬프팅 패턴과 함정들을 공유한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 매력적인 숏폼 영상을 자동 생성하는 Python 패키지다. Python CLI로 job을 관리하고, TypeScript + Remotion으로 실제 영상을 렌더링한다.

이번 작업의 목표는 빈 리포지토리에서 시작해서 완전히 동작하는 파이프라인까지 한 번에 구축하는 것이었다. 단순한 hello world가 아니라 실제 production에서 쓸 수 있는 수준의 아키텍처와 코드 품질을 유지하면서 말이다.

## 대규모 코드 생성을 위한 계층적 프롬프팅

### 1단계: 프로젝트 구조부터 잡는다

GPT-5-Codex에게 5000줄짜리 프로젝트를 만들어달라고 하면 망한다. 대신 이렇게 접근했다:

> "Python package + TypeScript renderer 조합으로 video pipeline을 만들어야 한다. 프로젝트 구조와 핵심 파일들의 skeleton만 먼저 생성해줘. 각 모듈의 책임과 인터페이스를 명확히 정의하되, 구현체는 placeholder로 두고."

이렇게 쓰면 안 된다:
> "사주 영상 만드는 앱 만들어줘"

첫 번째 프롬프트에서는 **구조**에만 집중한다. 파일 트리, 모듈 분리, 의존성 관계. 구현 디테일은 나중 문제다.

### 2단계: 도메인 모델을 먼저 확정한다

코드를 생성하기 전에 데이터 구조를 명확히 해야 한다:

> "`SajuProfile`, `ShortJob`, `RenderConfig` 모델을 pydantic으로 정의해줘. 사주 프로필은 천간지지, 대운, 성격 분석 결과를 포함한다. ShortJob은 입력 프로필, 렌더링 옵션, 출력 경로를 관리한다. 각 필드에 validation rule과 example 값을 넣어줘."

데이터 모델이 확정되면 나머지 코드 생성이 훨씬 일관성 있게 나온다. 모든 함수의 입력/출력 타입이 명확해지기 때문이다.

### 3단계: 인터페이스 우선 구현

각 모듈의 public API부터 정의했다:

> "CLI는 `create`, `render`, `validate` 3개 command를 제공한다. click으로 구현하되, 각 command의 signature와 help text를 먼저 정의해줘. 실제 구현은 별도 모듈로 분리하고, CLI는 thin wrapper 역할만 한다."

이 접근법의 핵심은 **사용자 경험을 먼저 설계**하는 것이다. CLI 사용법이 확정되면 내부 구현은 그에 맞춰 따라온다.

## Python-TypeScript 멀티 언어 프로젝트 관리법

### 컨텍스트 분할 전략

Python 패키지와 TypeScript renderer를 한 프롬프트에서 처리하려고 하면 context window가 터진다. 대신 이렇게 분할했다:

> "먼저 Python 부분만 완성하자. `src/shortsmaker/` 디렉토리 구조로 CLI, job management, 데이터 검증 기능을 구현해줘. TypeScript 부분은 interface만 정의하고 나중에 따로 구현한다."

언어별로 context를 분리하되, **interface contract**는 미리 합의한다. Python의 `RenderJob` 클래스가 생성하는 JSON 스키마와 TypeScript의 `JobData` 인터페이스가 일치해야 한다.

### 의존성 관리 프롬프팅

`pyproject.toml`과 `package.json`을 따로 생성하면 버전 충돌이 생긴다:

> "`pyproject.toml`에는 pydantic 2.x, click 8.x를 넣어줘. `renderer/package.json`에는 remotion 4.x, typescript 5.x를 넣되, 두 환경이 공유하는 데이터 타입은 JSON schema로 관리할 거니까 type generation tool도 추가해줘."

특정 버전을 명시하고, 버전 선택 근거도 설명하게 한다. "최신 버전"이라고 하면 호환성 문제가 생길 수 있다.

## 도메인 특화 로직 생성하기

### 사주 데이터 처리 프롬프팅

사주라는 전문 도메인을 다룰 때는 context를 충분히 제공해야 한다:

> "사주학에서 천간 10개(갑을병정무기경신임계), 지지 12개(자축인묘진사오미신유술해)를 조합해서 60갑자를 만든다. `languages.py`에서 각 간지의 한글/영문/한자 표기와 오행 속성, 음양 구분을 담은 enum을 만들어줘. 
>
> 대운 계산은 성별과 년주 음양에 따라 순행/역행이 결정된다. 남자+양년생 또는 여자+음년생은 순행, 그 반대는 역행이다. 10년 주기로 간지가 바뀌고, 각 대운마다 길흉을 판단할 수 있어야 한다."

도메인 지식을 상세히 설명하면서 구현을 요청한다. GPT는 사주학 기초 지식이 있지만, 프로젝트에 특화된 해석이나 계산 로직은 명확히 지시해야 한다.

### UI 컴포넌트 생성 패턴

Remotion으로 영상을 만들 때는 시간축 고려가 중요하다:

> "`ShortsComposition.tsx`에서 9:16 세로 영상을 만든다. 총 15초 길이로, 0-3초는 title card, 3-12초는 사주 해석 텍스트가 typewriter 효과로 나타나고, 12-15초는 call-to-action 화면이다.
>
> 각 구간은 별도 컴포넌트로 분리하고, timing은 props로 받는다. 텍스트는 `SajuProfile`에서 추출한 데이터를 기반으로 하되, 글자 수가 너무 많으면 automatic truncation한다."

시간 기반 애니메이션을 만들 때는 **구체적인 타이밍**을 제시한다. "적절히"라고 하면 일관성 없는 결과가 나온다.

## CLI 기반 개발 워크플로우 구축

### 개발자 경험 최적화

CLI tool을 만들 때는 개발 과정에서의 디버깅도 고려해야 한다:

> "`shortsmaker validate` 명령어는 입력 데이터의 유효성을 검사하고 상세한 에러 메시지를 제공한다. JSON schema validation 실패 시 어느 필드에서 문제가 생겼는지, 사주 데이터 자체의 논리적 오류(존재하지 않는 날짜 등)는 별도로 표시한다.
>
> `--verbose` 플래그를 추가해서 처리 과정을 단계별로 출력하게 하고, `--dry-run` 옵션으로 실제 파일 생성 없이 테스트할 수 있게 해줘."

좋은 CLI는 사용법을 배우기 쉽고 문제 해결이 빠르다. 에러 메시지와 debugging 옵션을 미리 설계한다.

### 테스트 가능한 구조 만들기

대규모 코드 생성 시 테스트 작성도 함께 요청한다:

> "`tests/test_cli.py`에서 각 CLI command를 unit test한다. mock 데이터로 전체 파이프라인을 실행해보고, 예상되는 output이 나오는지 검증한다. 실제 Remotion rendering은 시간이 오래 걸리니까 mock으로 대체하되, JSON 스키마 compliance는 실제로 체크해야 한다."

테스트를 나중에 추가하려고 하면 코드 구조를 다시 바꿔야 할 수 있다. 처음부터 testable한 구조로 생성하는 게 효율적이다.

## 더 나은 방법은 없을까

### Cursor Composer vs 단일 프롬프트

이 작업을 지금 한다면 Cursor Composer를 쓸 것 같다. 여러 파일을 동시에 편집하면서 일관성을 유지하는 데 더 유리하다. 특히 Python-TypeScript 인터페이스 동기화 작업에서 Composer의 multi-file editing이 빛을 발한다.

### v0.dev for UI Components

Remotion 컴포넌트 생성 부분은 v0.dev에서 먼저 프로토타이핑하고 Remotion 문법으로 변환하는 게 더 빠를 수 있다. 시각적 결과를 바로 확인하면서 반복 개선할 수 있기 때문이다.

### GitHub Copilot Workspace

대규모 프로젝트 bootstrap에는 Copilot Workspace도 고려해볼 만하다. issue description에서 시작해서 PR까지 자동 생성하는 workflow가 이런 작업에 최적화되어 있다.

### MCP Server 활용

사주학 도메인 지식이 필요한 부분은 전용 MCP server를 만들어서 Claude에 연결하는 방법도 있다. 천간지지 계산, 대운 해석 같은 복잡한 로직을 더 정확하게 처리할 수 있다.

## 정리

- 대규모 코드 생성은 구조 → 모델 → 인터페이스 → 구현 순서로 계층화한다
- 멀티 언어 프로젝트는 context를 분할하되 interface contract를 먼저 합의한다  
- 도메인 특화 로직은 충분한 배경 지식을 context로 제공한다
- CLI tool은 사용자 경험과 디버깅 편의성을 함께 설계한다

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
65f233a — gpt-5-codex: bootstrap project workspace

</details>