---
title: "GPT-5-Codex로 5800라인을 한 번에 생성하는 프로젝트 부트스트래핑 전략"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

쇼츠 제작 파이프라인을 처음부터 구축하는 작업을 GPT-5-Codex에게 맡겼다. 4개 커밋으로 5800라인이 생성됐고, Python 백엔드와 React 렌더러가 완성됐다. 이 글에서는 AI로 대규모 프로젝트를 부트스트래핑할 때 반드시 알아야 할 프롬프팅 패턴과 구조화 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 세로형 영상을 자동 생성하는 파이프라인이다. Python으로 작업 스케줄링과 데이터 처리를 하고, React + Remotion으로 실제 영상을 렌더링한다. 기존에는 아무것도 없었고, 이번 작업으로 프로젝트 전체 골격을 만들어야 했다.

목표는 명확했다. 사주 JSON 파일을 input으로 받아서 mp4 파일을 output으로 내뱉는 CLI 도구를 완성하는 것이었다. 단순해 보이지만 실제로는 job 관리, hook 시스템, 다국어 지원, 렌더링 파이프라인까지 복잡한 아키텍처가 필요하다.

## AI에게 전체 아키텍처를 설계하게 하는 프롬프팅

대규모 프로젝트를 AI에게 맡길 때 가장 중요한 건 **제약 조건을 명확히 주는 것**이다. "쇼츠 만드는 도구 만들어줘"라고 하면 AI는 방향을 잃는다.

효과적인 프롬프트는 이렇다:

> ShortsMaker 프로젝트를 부트스트래핑한다. 
> 
> **요구사항:**
> - Python CLI 도구 (`shortsmaker generate input.json`)
> - React + Remotion 렌더러 (별도 `renderer/` 디렉토리)
> - Job 기반 비동기 처리 (상태 추적 필수)
> - Hook 시스템 (pre-render, post-render)
> - 다국어 지원 (ko, en, ja, zh)
> - 사주 데이터 validation
>
> **기술 스택:**
> - Backend: Python 3.11, Click, Pydantic
> - Frontend: React, TypeScript, Remotion 4.x
> - Package manager: Poetry (Python), npm (Node)
>
> **디렉토리 구조부터 시작해서 전체 파이프라인을 구현한다. 먼저 아키텍처 문서와 프로젝트 설정 파일들을 만들고, 그 다음에 핵심 모듈들을 구현한다.**

이 프롬프트가 효과적인 이유는:
1. **구체적인 명령어 형태**를 제시했다 (`shortsmaker generate input.json`)
2. **기술 스택을 버전까지** 명시했다
3. **구현 순서**를 지정했다 (설정 파일 먼저, 그 다음 핵심 모듈)
4. **비기능 요구사항**까지 포함했다 (상태 추적, hook 시스템)

반면 이런 프롬프트는 쓸모없다:

> "동영상 만드는 프로젝트 만들어줘. Python이랑 React 써서."

AI는 무엇을 만들어야 할지 모르고, 어디서부터 시작해야 할지도 모른다.

## GPT-5-Codex의 workspace 관리 패턴

GPT-5-Codex는 일반 ChatGPT와 다르게 **전체 프로젝트 컨텍스트**를 유지한다. 이 특성을 활용하려면 작업을 단계적으로 쪼개야 한다.

**1단계: 프로젝트 뼈대 생성**

첫 번째 커밋 `65f233a`에서는 디렉토리 구조와 설정 파일들만 만들었다. `pyproject.toml`, `package.json`, `.gitignore`, `README.md` 같은 기본 파일들이다.

이때 중요한 건 AI에게 **"아직 구현하지 마"**라고 명시하는 것이다:

> "먼저 프로젝트 설정만 완료한다. 실제 로직 구현은 다음 단계에서 한다. `pyproject.toml`에 dependencies 정의하고, 디렉토리 구조 만들고, 문서 파일들 작성한다."

**2단계: 핵심 모듈 구현**

두 번째 커밋 `07e6f61`에서 실제 Python 코드를 작성했다. `models.py`, `job.py`, `cli.py`, `hooks.py` 등 핵심 모듈들이 한 번에 생성됐다.

여기서 GPT-5-Codex의 장점이 드러난다. 1단계에서 만든 `pyproject.toml`의 dependencies를 참조해서 정확한 import 구문을 만든다. 또한 디렉토리 구조를 기억해서 상대 경로도 올바르게 처리한다.

**3단계: React 렌더러 구현**

세 번째 단계에서는 `renderer/` 디렉토리 전체를 만들었다. TypeScript, React 컴포넌트, Remotion 설정까지 포함해서 194라인짜리 `ShortsComposition.tsx`가 생성됐다.

AI에게 프론트엔드 코드를 맡길 때는 **데이터 인터페이스를 먼저 정의**하는 게 핵심이다:

> "`types.ts`에 Python 백엔드와 주고받을 데이터 인터페이스를 정의한다. 사주 데이터, 렌더링 옵션, job 상태 등이 포함되어야 한다. 그 다음에 이 타입들을 사용하는 React 컴포넌트를 만든다."

**4단계: 통합 테스트와 검증**

마지막 커밋들에서는 실제로 작동하는지 검증했다. `test_cli.py`에 테스트 케이스를 추가하고, sample 데이터로 전체 파이프라인을 돌려봤다.

## 멀티 스택 프로젝트에서 컨텍스트 관리하기

Python과 React를 동시에 다루는 프로젝트에서는 **언어별로 컨텍스트를 분리**해야 한다. GPT-5-Codex에게 이걸 명시적으로 알려준다:

> "지금부터 React/TypeScript 모드로 전환한다. Python 코드는 건드리지 않는다. `renderer/` 디렉토리에서만 작업한다. 백엔드와의 인터페이스는 `../src/shortsmaker/models.py`의 Pydantic 모델을 참조한다."

이런 식으로 **작업 범위를 제한**하면 AI가 실수로 다른 파일을 수정하는 걸 방지할 수 있다.

또 다른 효과적인 패턴은 **파일별 역할을 명시**하는 것이다:

- `models.py`: 데이터 스키마만 (비즈니스 로직 없음)
- `job.py`: 작업 상태 관리만 (렌더링 로직 없음)
- `cli.py`: 명령어 파싱만 (실제 처리는 다른 모듈 호출)
- `hooks.py`: 확장 포인트만 (기본 구현 없음)

각 파일의 책임을 명확히 하면 AI가 코드를 더 일관성 있게 작성한다.

## 복잡한 설정 파일을 AI에게 맡기는 노하우

이번 작업에서 가장 까다로웠던 부분은 `package.json`과 `tsconfig.json` 설정이었다. Remotion은 특별한 설정이 필요하고, TypeScript 경로 설정도 복잡하다.

AI에게 설정 파일을 맡길 때는 **레퍼런스를 제공**하는 게 핵심이다:

> "Remotion 4.x 공식 문서의 React + TypeScript 설정을 기준으로 한다. 다음 기능들이 필요하다:
> - Video rendering with custom composition
> - TypeScript strict mode
> - Path aliases for clean imports
> - Development server with hot reload
> 
> 최신 버전의 dependencies를 사용하되, Remotion과 호환되는 버전으로 맞춘다."

단순히 "package.json 만들어줘"라고 하면 AI는 기본적인 React 설정만 만든다. 구체적인 요구사항과 제약 조건을 줘야 실용적인 설정이 나온다.

## 데이터 파이프라인 설계에서 AI 활용하기

사주 데이터를 영상으로 변환하는 파이프라인은 복잡하다. JSON 스키마 정의부터 시작해서 validation, transformation, rendering까지 여러 단계가 있다.

AI에게 이런 파이프라인을 설계하게 할 때는 **데이터 플로우를 먼저 정의**한다:

> "데이터 흐름을 단계별로 정리한다:
> 1. JSON 파일 로드 및 스키마 validation
> 2. 사주 데이터를 렌더링용 구조로 변환
> 3. 다국어 텍스트 생성
> 4. React 컴포넌트에 props 전달
> 5. Remotion으로 영상 렌더링
> 6. 결과 파일 저장 및 후처리
>
> 각 단계마다 별도 함수로 분리하고, 중간 결과를 JSON으로 저장할 수 있게 한다. 오류 발생 시 어느 단계에서 실패했는지 추적 가능해야 한다."

이렇게 하면 AI가 각 단계를 독립적인 함수로 구현한다. 디버깅할 때도 훨씬 쉽다.

`sample_saju.json` 파일을 만들 때도 마찬가지다:

> "실제 사주 분석 결과와 유사한 sample 데이터를 생성한다. 다음 정보가 포함되어야 한다:
> - 기본 정보: 생년월일, 성별, 출생지
> - 사주 구성: 년주, 월주, 일주, 시주
> - 오행 분석: 각 원소별 강약
> - 운세: 전반적인 해석과 조언
>
> JSON 스키마는 `models.py`의 Pydantic 모델과 일치해야 한다. 한국어로 작성하되, 영어 필드명 사용한다."

구체적인 가이드라인을 주면 AI가 실제로 테스트에 사용할 수 있는 품질의 sample 데이터를 만든다.

## 더 나은 방법은 없을까

이번에 사용한 방식은 효과적이었지만, 더 개선할 수 있는 부분들이 있다.

**Cursor Composer 활용**

GPT-5-Codex 대신 Cursor의 Composer 모드를 쓰면 더 나은 결과를 얻을 수 있다. Composer는 멀티 파일 편집에 특화되어 있고, 실제 파일 시스템과 연동되기 때문이다. 특히 import 구문이나 상대 경로 처리에서 더 정확하다.

**CLAUDE.md 활용**

프로젝트 루트에 `CLAUDE.md` 파일을 만들어서 아키텍처 가이드라인을 문서화하는 방법도 있다:

```markdown
# ShortsMaker Development Guidelines

## Architecture Principles
- Separation of concerns: CLI, Job processing, Rendering
- Type safety: Pydantic for Python, TypeScript for React
- Error handling: Structured logging and status tracking

## Code Style
- Python: Black formatting, type hints required
- React: Functional components with hooks
- File naming: snake_case for Python, PascalCase for React components

## Testing Strategy
- Unit tests for data models and business logic
- Integration tests for CLI commands
- End-to-end tests with sample data
```

이런 가이드라인이 있으면 AI가 일관성 있는 코드를 작성한다.

**MCP 서버 연동**

Python과 React 개발에 특화된 MCP 서버를 연결하면 더 나은 결과를 얻을 수 있다. 예를 들어:
- `@python-dev/mcp-server`: Python 코드 분석, linting, 테스트 실행
- `@react-dev/mcp-server`: React 컴포넌트 최적화, bundle 분석
- `@remotion/mcp-server`: Remotion 특화 기능들

**점진적 개발 패턴**

이번에는 한 번에 전체를 만들었지만, 더 안전한 방법은 **MVP부터 시작**하는 것이다:
1. 기본 CLI + 단순 텍스트 출력
2. 사주 데이터 파싱 추가
3. 정적 이미지 생성
4. 애니메이션 및 영상 렌더링
5. 고급 기능 (다국어, hook 시스템)

각 단계마다 실제로 작동하는 상태를 유지하면서 점진적으로 확장하는 게 더 안정적이다.

**성능 최적화**

현재 구조는 모든 처리를 단일 프로세스에서 한다. 대량 처리가 필요하다면:
- Celery로 job queue 구현
- Redis로 상태 관리
- Docker로 렌더링 환경 격리
- S3로 결과 파일 저장

이런 확장성 고려사항을 초기 설계에 반영하면 나중에 리팩토링 비용을 줄일 수 있다.

## 정리

GPT-5-Codex로 대규모 프로젝트를 부트스트래핑할 때 핵심은 **단계적 접근**과 **명확한 제약 조건**이다. 전체를 한 번에 만들려고 하지 말고, 설정-핵심모듈-통합테스트 순서로 진행한다. 각 단계마다 AI에게 구체적인 요구사항과 기술적 제약을 제공한다. 멀티 스택 프로젝트에서는 언어별로 컨텍스트를 분리해서 작업하고, 데이터 파이프라인은 플로우부터 정의한 다음 구현한다. 마지막으로 sample 데이터와 테스트 케이스를 통해 전체 시스템이 의도대로 작동하는지 검증한다.

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace
07e6f61 — gpt-5-codex: build saju shorts pipeline  
d6e1582 — gpt-5-codex: fix repo-relative cli paths
6cc0e4f — gpt-5-codex: log sample short validation

</details>