---
title: "GPT-5 Codex로 5800줄 프로젝트를 4커밋에 만드는 AI 파이프라인 구축법"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

새 프로젝트를 처음부터 끝까지 AI로 만들어봤다. Python CLI + React 렌더러로 구성된 숏폼 비디오 생성기를 5800줄, 34개 파일로 bootstrap했는데 커밋은 단 4개다. 이 글에서는 대규모 프로젝트를 AI에게 맡길 때 효과적인 프롬프팅 패턴과 작업 분할 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 세로형 비디오를 생성하는 도구다. Python으로 작업 처리와 CLI를 만들고, React + Remotion으로 실제 비디오를 렌더링한다. 기존에는 아이디어만 있었고, 이번에 전체 skeleton을 AI로 구축했다.

목표는 단순했다. 프로젝트 구조부터 핵심 로직까지 모든 걸 AI에게 시키되, 나중에 수정할 일을 최소화하고 싶었다. 그래서 처음부터 명확한 아키텍처와 제약 조건을 AI에게 주는 데 집중했다.

## GPT-5 Codex에게 전체 프로젝트를 맡기는 프롬프팅 전략

일반적인 "프로젝트 만들어줘" 같은 프롬프트로는 절대 원하는 결과가 나오지 않는다. 대신 이런 구조로 접근했다.

### 컨텍스트 먼저, 코드는 나중에

가장 중요한 건 AI에게 **무엇을 만드는지**를 정확히 알려주는 것이다. 코드 요청 전에 반드시 이 순서를 지켰다:

> "ShortsMaker라는 Python CLI 도구를 만들 것이다. 사주 JSON을 입력받아서 세로형 숏폼 비디오를 생성한다. Python 백엔드는 작업 관리와 데이터 처리를 담당하고, React + Remotion 프론트엔드는 실제 렌더링을 한다.
>
> 아키텍처 제약:
> - CLI는 typer 기반
> - 작업은 Job 클래스로 상태 관리
> - 렌더러는 별도 디렉토리, npm workspace
> - 환경변수는 pydantic-settings
> - 모든 모델은 pydantic BaseModel
>
> 먼저 전체 프로젝트 구조와 핵심 컴포넌트를 설계해줘. 코드는 아직 말고."

이렇게 하면 AI가 코드를 쓰기 전에 아키텍처를 충분히 이해한다. 바로 코드 요청하면 AI 멘탈 모델이 중간중간 바뀌면서 일관성이 깨진다.

### 제약 조건을 구체적으로 명시하기

막연한 "좋은 코드로 만들어줘"가 아니라, 측정 가능한 제약을 준다:

> "Python 코드 제약:
> - 모든 함수에 type hint 필수
> - CLI 명령어는 `shorts create`, `shorts render` 패턴
> - 에러 핸들링은 try/except보다 Result 타입 선호
> - 파일 경로는 pathlib.Path만 사용
> - 로깅은 structlog
>
> React 코드 제약:
> - TypeScript strict 모드
> - Remotion 3.4+ API 사용
> - props는 interface로 정의
> - 스타일은 CSS-in-JS 말고 tailwind"

이런 제약이 있으면 AI가 일관된 패턴으로 코드를 만든다. 특히 대규모 프로젝트에서는 스타일 통일이 핵심이다.

### 샘플 데이터부터 역산하기

API나 데이터 구조를 설계할 때는 **결과물부터** 보여주고 역산하게 한다:

> "최종적으로 이런 JSON이 렌더러로 전달되어야 한다:
> ```json
> {
>   "profile": { "name": "김철수", "birth": "1990-01-01" },
>   "fortune": { "year": 2024, "predictions": [...] },
>   "theme": { "background": "#1a1a1a", "accent": "#ff6b35" }
> }
> ```
>
> 이 구조에 맞춰서 Python 모델과 CLI 인터페이스를 설계해줘."

이렇게 하면 AI가 데이터 플로우를 명확히 이해하고, 일관된 타입 정의를 만든다.

## 대규모 작업을 논리적 단위로 분할하는 법

5800줄을 한 번에 만들라고 하면 절대 안 된다. 하지만 너무 잘게 쪼개면 컨텍스트가 끊어진다. 적절한 단위가 필요하다.

### 수직 슬라이스로 나누기

기능별로 자르지 말고 **end-to-end 플로우**로 자른다. 첫 번째 커밋에서는:

> "가장 단순한 happy path를 완성하자. 샘플 JSON 하나를 받아서 기본 렌더러까지 연결되는 전체 파이프라인을 만들어줘. 에러 핸들링이나 복잡한 기능은 나중에 추가한다."

이렇게 하면 AI가 전체 아키텍처를 유지하면서도 동작하는 skeleton을 만든다. horizontal 슬라이스(모든 모델 먼저, 그 다음 모든 서비스...)보다 훨씬 효과적이다.

### 의존성 그래프를 명시하기

AI가 어떤 순서로 코드를 만들어야 할지 헷갈리지 않게 dependency를 명확히 한다:

> "이 순서로 만들어줘:
> 1. `models.py` - 모든 pydantic 모델
> 2. `config.py` - 환경 설정
> 3. `job.py` - 작업 상태 관리
> 4. `cli.py` - typer 명령어
> 5. `hooks.py` - 렌더러 연동
>
> 각 단계에서 이전 단계의 클래스를 import해서 써라."

이렇게 하면 AI가 circular import나 undefined reference 같은 문제를 만들지 않는다.

### 파일 생성 패턴 표준화하기

각 파일을 만들 때 일관된 구조를 요청한다:

> "새 Python 모듈을 만들 때 이 템플릿을 지켜줘:
> ```python
> \"\"\"모듈 설명 한 줄\"\"\"
>
> from __future__ import annotations
> 
> # 표준 라이브러리
> # 서드파티
> # 로컬 import
>
> __all__ = [...]
>
> # 코드
> ```
>
> 그리고 각 클래스/함수에 docstring 필수."

이런 표준화가 있으면 나중에 코드를 읽고 수정하기 훨씬 쉽다.

## Claude Code와 MCP로 멀티 파일 컨텍스트 관리하기

단일 파일 작업이라면 ChatGPT도 충분하지만, 34개 파일을 동시에 관리할 때는 Claude Code의 MCP(Model Context Protocol)가 빛난다.

### CLAUDE.md로 프로젝트 전역 규칙 설정

프로젝트 루트에 `CLAUDE.md`를 만들어서 모든 작업의 기준점으로 쓴다:

```markdown
# ShortsMaker Development Guidelines

## Architecture
- Python CLI (typer) + React renderer (Remotion)
- Jobs are stateful, stored in local filesystem
- All data models use pydantic
- CLI paths are repo-relative (use PROJECT_ROOT)

## Code Style
- Python: type hints mandatory, pathlib for paths
- TypeScript: strict mode, interface for props
- No magic strings, use enums/constants
- Error handling: Result types preferred over exceptions

## Project Structure
```
src/shortsmaker/          # Python package
renderer/                 # React + Remotion
input/profiles/           # Sample data
```
```

이렇게 하면 Claude가 여러 파일 작업할 때 일관된 컨벤션을 유지한다.

### 파일 간 의존성 추적

MCP filesystem server를 쓰면 Claude가 전체 프로젝트를 이해한 상태로 작업한다. 특히 이런 경우에 강력하다:

- `models.py`에 새 필드 추가할 때 관련된 모든 파일 자동 업데이트
- CLI 명령어 추가할 때 help text, 테스트, 문서 동시 생성
- TypeScript 인터페이스 변경할 때 Python 모델과 sync 유지

직접 파일을 수정하지 말고, Claude에게 "전체 프로젝트에서 이 변경의 영향을 받는 파일을 찾아서 모두 업데이트해줘"라고 요청한다.

### /commit과 /review 슬래시 명령 활용

큰 변경 후에는 반드시 `/review` 명령으로 전체 일관성을 점검한다:

> /review src/shortsmaker/ 디렉토리의 Python 모듈들이 CLAUDE.md의 아키텍처 규칙을 지키고 있는지 확인해줘. 특히 import 순서, type hint, 에러 핸들링 패턴을 중점적으로.

문제가 없으면 `/commit` 명령으로 의미있는 단위로 커밋한다. AI가 제안하는 커밋 메시지는 대개 너무 verbose하니까 간결하게 다시 쓴다.

## 더 나은 방법은 없을까

이번 작업을 돌아보면서 개선할 점들을 발견했다.

### Anthropic Computer Use를 써볼 수 있었다

현재는 파일 생성을 복사+붙여넣기로 했는데, Computer Use API를 쓰면 Claude가 직접 IDE에서 파일을 만들고 실행해볼 수 있다. 특히 `npm install`이나 `python -m pytest` 같은 검증 작업을 AI에게 맡길 수 있어서 더 안정적인 결과물을 만들 수 있다.

### GitHub Copilot Workspace와 비교

Copilot Workspace도 멀티 파일 편집을 지원하지만, 아직 전체 프로젝트 bootstrap에는 Claude Code가 더 강력하다. Copilot은 기존 코드 수정에 특화되어 있고, 처음부터 만드는 작업에서는 컨텍스트 유지가 아쉽다.

다만 GitHub Issues와 연동해서 작업하거나, 기존 레포지토리의 패턴을 학습하는 부분에서는 Copilot이 유리하다. 하이브리드 접근이 최선일 것 같다.

### Cursor의 Composer Mode 활용

Cursor의 Composer Mode는 VSCode 환경에서 멀티 파일 AI 편집을 지원한다. Claude Code처럼 전체 프로젝트를 이해하면서도 IDE 통합이 더 자연스럽다. 특히 실시간 디버깅이나 테스트 실행을 AI와 함께 할 수 있어서, bootstrap 후 검증 작업에서 효율적이다.

### 더 구조화된 프롬프트 패턴

Anthropic의 최신 문서를 보면 XML 태그를 이용한 구조화 프롬프팅을 권장한다:

```xml
<project>
  <name>ShortsMaker</name>
  <architecture>Python CLI + React renderer</architecture>
</project>

<constraints>
  <python>
    <type_hints>mandatory</type_hints>
    <error_handling>Result types preferred</error_handling>
  </python>
</constraints>

<task>
  <goal>Create complete project skeleton</goal>
  <deliverables>
    <deliverable>Working CLI with sample command</deliverable>
    <deliverable>React renderer with basic component</deliverable>
    <deliverable>End-to-end integration test</deliverable>
  </deliverables>
</task>
```

이렇게 하면 AI가 중간에 컨텍스트를 잃어버리지 않고 일관되게 작업한다.

## 정리

- **컨텍스트부터 코드 나중에**: AI에게 아키텍처를 충분히 이해시킨 후 구현 요청
- **제약 조건을 구체적으로**: 측정 가능한 규칙으로 일관성 확보  
- **수직 슬라이스로 분할**: end-to-end 플로우 단위로 작업 나누기
- **CLAUDE.md + MCP 활용**: 멀티 파일 컨텍스트 관리의 핵심

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline
65f233a — gpt-5-codex: bootstrap project workspace

</details>