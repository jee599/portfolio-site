---
title: "AI로 복잡한 파이프라인 구축하기 — gpt-5-codex와 구조화 프롬프팅의 힘"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

ShortsMaker라는 쇼츠 영상 생성 파이프라인을 AI와 함께 만들었다. Python CLI부터 React 렌더러까지, 5800줄이 넘는 코드를 4번의 커밋으로 완성한 과정에서 얻은 프롬프팅 노하우와 AI 활용 전략을 공유한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 분석 데이터를 받아 세로형 쇼츠 영상을 자동 생성하는 파이프라인이다. Python으로 된 CLI가 사주 데이터를 파싱하고, TypeScript + React로 만든 렌더러가 Remotion을 통해 영상을 만들어낸다.

이번 작업의 목표는 명확했다. 완전히 동작하는 MVP를 만드는 것. 설계 단계에서 구현까지 AI를 최대한 활용해서 빠르게 프로토타입을 완성하고 싶었다.

## 전체 아키텍처를 한 번에 설계하는 프롬프트 전략

복잡한 프로젝트를 AI에게 맡길 때 가장 중요한 건 **전체 그림을 먼저 그리게 하는 것**이다. 개별 파일을 하나씩 만들어달라고 하면 일관성이 깨진다.

### 효과적인 아키텍처 설계 프롬프트

> "사주 데이터를 받아 쇼츠 영상을 생성하는 파이프라인을 만들어줘. Python CLI가 입력을 받고, TypeScript 렌더러가 Remotion으로 영상을 만든다. 
> 
> 요구사항:
> - CLI는 `shortsmaker generate profile.json` 형태로 동작
> - 중간 데이터는 JSON으로 전달
> - 렌더러는 독립적으로 실행 가능해야 함
> - 각 컴포넌트의 인터페이스를 먼저 정의하고 구현해줘
> - 프로젝트 구조를 먼저 보여주고, 각 파일의 역할을 설명해줘"

이렇게 하면 안 된다:
> "Python으로 CLI 만들어줘"

첫 번째 프롬프트가 더 나은 이유는 **전체 시스템의 경계와 인터페이스를 명확히 정의**하기 때문이다. AI가 개별 컴포넌트를 만들 때도 전체 맥락을 유지할 수 있다.

### gpt-5-codex의 workspace bootstrapping 활용

커밋 메시지에 `gpt-5-codex`가 등장하는 걸 보면, 이 작업에서 Claude의 코드 에이전트 모드를 적극 활용했다는 걸 알 수 있다. workspace bootstrapping은 특히 유용했다.

`CLAUDE.md`에 이런 설정을 넣어뒀다:

```markdown
# Project Context

This is ShortsMaker - a pipeline for generating vertical shorts videos from saju (Korean fortune telling) data.

## Tech Stack
- Backend: Python 3.11+ with Click CLI
- Frontend: TypeScript + React + Remotion
- Data flow: JSON between components

## Code Style
- Python: Black formatter, type hints mandatory
- TypeScript: Prettier, strict mode
- Error handling: comprehensive with proper logging
- Testing: pytest for Python, vitest for TypeScript

## File Organization
- `/src/shortsmaker/`: Python package
- `/renderer/`: TypeScript rendering engine  
- `/input/`: Sample data and profiles
- `/tests/`: Test files matching source structure
```

이 설정 덕분에 AI가 34개 파일을 만들 때도 일관된 스타일과 구조를 유지했다.

## 점진적 복잡성 증가 패턴

5800줄의 코드를 한 번에 만들어달라고 하면 실패한다. 대신 **기능별로 레이어를 나누어 단계적으로 구축**했다.

### 1단계: 핵심 모델과 인터페이스

> "먼저 데이터 모델부터 정의해줘. 사주 입력 데이터의 구조, 중간 처리 결과, 렌더러로 전달할 최종 포맷을 Pydantic과 TypeScript 타입으로 만들어줘."

이 단계에서 `models.py`와 `types.ts`가 만들어졌다. 데이터 구조가 확실해야 나머지 컴포넌트들이 올바르게 연결된다.

### 2단계: CLI 껍데기와 job 처리 로직

> "Click 기반으로 CLI를 만들되, 실제 로직은 별도 모듈로 분리해줘. `shortsmaker generate`, `shortsmaker validate` 명령어를 지원하고, 각각 job 객체를 통해 처리해줘."

여기서 중요한 건 **관심사 분리**다. CLI는 인터페이스 역할만 하고, 실제 비즈니스 로직은 `job.py`에 위임했다.

### 3단계: 렌더링 파이프라인

> "Remotion 기반으로 React 컴포넌트를 만들어줘. 사주 데이터를 받아서 9:16 세로 영상을 만든다. 텍스트 애니메이션과 배경 그라데이션을 포함해줘."

React 컴포넌트는 AI가 가장 잘 만드는 영역 중 하나다. `ShortsComposition.tsx`가 194줄로 가장 큰 단일 파일이 되었는데, 애니메이션 로직까지 포함해서 한 번에 완성됐다.

### 단계별 검증이 핵심

각 단계마다 실제로 실행해보고 에러를 수정했다. `tests/test_cli.py`에서 볼 수 있듯이 테스트 코드도 함께 만들어서 각 레이어가 올바르게 동작하는지 확인했다.

## 파일 경로와 상대 참조 처리하기

`d6e1582` 커밋 메시지를 보면 "fix repo-relative cli paths"라는 내용이 있다. 이런 문제는 AI로 개발할 때 자주 발생한다.

### 경로 문제를 미리 방지하는 프롬프트

> "모든 파일 경로는 프로젝트 루트 기준으로 처리해줘. CLI에서 렌더러를 호출할 때는 `subprocess`를 사용하되, 현재 작업 디렉토리에 의존하지 않게 만들어줘."

AI는 종종 하드코딩된 경로나 상대 경로를 잘못 사용한다. 이를 방지하려면:

1. **프로젝트 루트 기준 경로 사용 강제**
2. **환경 변수나 설정 파일로 경로 관리**
3. **Path 객체 사용 권장** (`pathlib` 모듈)

실제로 `config.py`에서 경로 관리를 중앙화했고, 이후 경로 관련 버그가 크게 줄었다.

## 멀티 언어 처리와 hooks 패턴

`languages.py`와 `hooks.py` 파일을 보면 꽤 정교한 구조가 만들어져 있다. 이는 **확장 가능한 아키텍처**를 염두에 둔 설계다.

### hooks 패턴을 AI에게 설명하는 방법

> "WordPress의 action/filter hook 패턴처럼, 파이프라인의 각 단계에서 외부 로직을 끼워넣을 수 있게 해줘. `before_render`, `after_process` 같은 hook point를 만들고, 함수를 등록할 수 있게 해줘."

AI는 패턴의 **구체적인 예시**를 들어주면 훨씬 잘 이해한다. "확장 가능하게 만들어줘"보다는 "WordPress hook처럼"이나 "Express.js 미들웨어처럼" 같은 비유가 효과적이다.

실제로 256줄에 달하는 `hooks.py`가 만들어졌고, 여기에는 다양한 hook point와 등록/실행 메커니즘이 구현되어 있다.

## 샘플 데이터로 검증하는 TDD 접근

`input/profiles/sample_saju.json`이 추가된 걸 보면, 개발 과정에서 **실제 데이터로 테스트**를 계속 진행했다는 걸 알 수 있다.

### 샘플 데이터 생성 프롬프트

> "사주 분석 결과의 실제 예시를 JSON으로 만들어줘. 생년월일, 사주팔자, 성격 분석, 올해 운세를 포함하되, 개인정보는 가상으로 생성해줘. 이 데이터로 전체 파이프라인을 테스트할 거다."

AI가 만든 샘플 데이터:

```json
{
  "profile": {
    "name": "김○○",
    "birthDate": "1990-03-15",
    "birthTime": "14:30"
  },
  "saju": {
    "year": "경오",
    "month": "기묘", 
    "day": "정해",
    "time": "정미"
  },
  "analysis": {
    "personality": "창의적이고 도전정신이 강한 타입...",
    "fortune2024": "새로운 기회가 많이 올 해..."
  }
}
```

이런 샘플 데이터가 있으면 각 컴포넌트를 독립적으로 테스트할 수 있다. 렌더러도 Python CLI 없이 단독으로 실행해서 결과를 확인할 수 있었다.

## 더 나은 방법은 없을까

이 프로젝트에서 사용한 방식들을 돌아보면서, 더 효율적인 대안들을 살펴보자.

### MCP 서버 활용의 아쉬움

현재는 Claude Code의 기본 기능만 활용했지만, **MCP(Model Context Protocol) 서버**를 직접 구성했다면 더 강력했을 것이다. 특히:

- **Remotion MCP 서버**: 렌더링 결과를 실시간으로 미리볼 수 있었을 텐데
- **Pytest MCP 서버**: 테스트 결과를 바로 피드백받아서 코드를 개선할 수 있었을 텐데
- **Git MCP 서버**: 커밋 메시지와 변경 사항을 더 체계적으로 관리할 수 있었을 텐데

### 더 나은 프롬프트 구조화

Anthropic의 최신 가이드를 보면 **Chain of Thought와 역할 기반 프롬프팅**을 조합하는 패턴이 권장된다:

> "당신은 풀스택 개발자입니다. 다음 단계로 생각해주세요:
> 1. 요구사항 분석: 무엇을 만들어야 하나?
> 2. 아키텍처 설계: 컴포넌트들이 어떻게 연결되나?  
> 3. 인터페이스 정의: 데이터가 어떻게 흘러가나?
> 4. 구현: 각 컴포넌트를 어떻게 만들 것인가?
> 
> 각 단계의 결과를 명시하고, 다음 단계로 넘어가세요."

이런 구조화된 프롬프트를 쓰면 AI의 추론 과정이 더 체계적이 된다.

### Cursor vs Claude Code 트레이드오프

이 프로젝트는 Claude Code로 진행했지만, **Cursor**를 썼다면 어땠을까?

**Claude Code의 장점:**
- 전체 프로젝트 맥락 이해가 우수
- 문서 생성과 구조 설계에 강함
- 복잡한 로직의 일관성 유지

**Cursor의 장점:**
- IDE 통합으로 더 자연스러운 코딩 플로우
- 실시간 오류 검출과 수정
- Git 통합과 diff 기능

결론적으로 **초기 구조 설계는 Claude Code**, **세부 구현과 디버깅은 Cursor**로 나누어 쓰는 게 최적일 것 같다.

### 테스트 커버리지 자동화

현재는 수동으로 테스트를 작성했지만, AI에게 **테스트 우선 개발**을 시킬 수도 있었다:

> "각 모듈을 구현하기 전에 pytest 테스트를 먼저 만들어줘. 함수 시그니처와 예상 동작을 테스트 코드로 정의하고, 그 다음에 실제 구현을 만들어줘."

이렇게 하면 AI가 만든 코드의 품질을 사전에 보장할 수 있다.

## 정리

이번 ShortsMaker 파이프라인 개발에서 얻은 핵심 인사이트들:

- **전체 아키텍처를 먼저 설계**하게 하고, 단계별로 구현을 진행한다
- **구체적인 예시와 제약 조건**을 프롬프트에 포함시켜 AI의 추론을 가이드한다  
- **샘플 데이터 기반 TDD 접근**으로 각 컴포넌트를 독립적으로 검증한다
- **hooks 패턴 같은 확장 가능한 구조**를 미리 설계해서 유지보수성을 확보한다

AI와 함께 개발할 때는 단순히 코드를 만들어달라고 하는 게 아니라, **어떻게 생각하고 접근해야 하는지**를 명확히 지시하는 게 핵심이다.

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline
65f233a — gpt-5-codex: bootstrap project workspace

</details>