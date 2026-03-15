---
title: "gpt-5-codex로 Python-React 멀티모듈 프로젝트 부트스트랩하는 프롬프팅 전략"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

며칠 동안 GPT-5 Codex를 써서 ShortsMaker라는 프로젝트 전체를 부트스트랩했다. Python CLI + React 렌더러 + 사주 데이터 처리까지 포함한 복잡한 멀티모듈 구조다. 이 과정에서 터득한 대규모 프로젝트 생성 프롬프팅 패턴과 코드 에이전트 활용법을 정리한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 분석 결과를 바탕으로 숏폼 비디오를 자동 생성하는 도구다. Python으로 만든 CLI가 사주 데이터를 처리하고, React/Remotion 기반 렌더러가 실제 비디오를 만든다. 

목표는 단순했다. 아이디어만 있는 상태에서 GPT-5 Codex를 써서 전체 프로젝트 구조를 빠르게 만들어내는 것. 하지만 5,800줄이 넘는 코드가 생성되면서 예상보다 복잡한 프롬프팅 전략이 필요했다.

## 프로젝트 전체 구조를 AI에게 설계시키는 법

첫 번째 커밋 `gpt-5-codex: bootstrap project workspace`에서 가장 중요한 건 **전체 그림을 그리는 프롬프트**다. 막연하게 "프로젝트 만들어줘"라고 하면 AI는 어디서부터 시작해야 할지 모른다.

내가 실제로 쓴 프롬프트는 이랬다:

> "Python CLI 도구와 React 렌더러가 분리된 프로젝트를 설계해줘. CLI는 JSON 데이터를 받아서 사주 분석하고, 렌더러는 그 결과로 세로형 비디오를 만든다. 프로젝트 루트에는 Python 패키지가, `renderer/` 디렉터리에는 Node.js 프로젝트가 있어야 한다. 각각 독립적으로 설치하고 실행할 수 있되, 데이터는 JSON으로 주고받는다."

핵심은 **명확한 제약 조건**이다. "분리된", "독립적으로 설치", "JSON으로 주고받는다" 같은 구체적 요구사항이 AI의 설계 방향을 정해준다.

이렇게 쓰면 안 된다:

> "사주 앱 만들어줘"

너무 막연하다. AI는 웹앱을 만들지, 모바일 앱을 만들지, CLI 도구를 만들지 알 수 없다.

### 아키텍처 문서부터 생성시키기

프로젝트 부트스트랩에서 놓치기 쉬운 부분이 문서 우선 접근법이다. 코드를 바로 생성하지 말고 `ARCHITECTURE.md`부터 만들게 했다.

> "`ARCHITECTURE.md`를 작성해줘. Python CLI 패키지 구조, React 렌더러 구조, 둘 사이의 데이터 플로우, 주요 모듈별 책임을 명시해야 한다. 향후 개발자가 이 문서만 보고 전체 구조를 파악할 수 있게."

이렇게 하면 AI가 일관된 설계 철학을 가지고 후속 코드를 생성한다. 아키텍처 문서가 일종의 **컨텍스트 가이드** 역할을 한다.

### 멀티 언어 프로젝트에서 의존성 관리

Python과 Node.js가 섞인 프로젝트에서 까다로운 부분이 의존성과 스크립트 관리다. 각 언어별로 패키지 매니저가 다르고, 빌드 프로세스도 다르다.

> "`pyproject.toml`에 Python 의존성을 정의하되, 개발용 의존성과 런타임 의존성을 구분해줘. `renderer/package.json`은 별도로 관리하고, 루트 `README.md`에는 두 프로젝트를 순서대로 설치하는 방법을 적어줘."

AI가 생성한 `pyproject.toml`을 보면:

```toml
[project.optional-dependencies]
dev = ["pytest>=7.0", "black", "isort", "mypy"]
```

개발 의존성을 분리해서 프로덕션 배포 시 불필요한 패키지가 설치되지 않게 했다. 이런 best practice를 프롬프트에 명시하지 않으면 AI는 모든 의존성을 하나로 뭉뚱그린다.

## 도메인별 모듈 분리 전략

두 번째 커밋 `gpt-5-codex: build saju shorts pipeline`에서는 실제 비즈니스 로직을 구현했다. 여기서 중요한 건 **도메인별로 모듈을 나누는 프롬프팅**이다.

### 명확한 모듈 책임 정의

> "`models.py`는 사주 데이터 구조만, `languages.py`는 다국어 처리만, `hooks.py`는 외부 시스템 연동만 담당하게 해줘. 각 모듈은 다른 모듈에 직접 의존하지 않고, `job.py`에서 조합해서 사용한다."

이렇게 하면 AI가 single responsibility principle을 지킨 코드를 만든다. 실제로 생성된 `languages.py`는 223줄짜리 순수한 언어 처리 로직만 담고 있다.

### 타입 힌트 강제하기

Python에서 AI가 생성한 코드의 품질을 올리는 확실한 방법이 타입 힌트 강제다.

> "모든 함수와 클래스에 타입 힌트를 붙여줘. `from __future__ import annotations`를 써서 forward reference 문제를 해결하고, `typing` 모듈의 `List`, `Dict`, `Optional`을 적극 활용해줘."

결과적으로 생성된 코드는:

```python
def process_saju_data(profile: SajuProfile) -> ProcessedData:
    """사주 프로필을 분석해서 비디오 생성용 데이터로 변환"""
    pass
```

이런 식으로 명확한 입출력 타입을 가진다. AI는 타입 힌트가 있으면 더 정확한 코드를 생성한다.

## React 컴포넌트 생성에서 제약 조건의 힘

`renderer/src/ShortsComposition.tsx` 파일이 194줄이나 되는데, 이걸 한 번에 생성할 때 쓴 프롬프트 패턴이 흥미롭다.

### 구체적인 디자인 명세

> "9:16 비율의 세로형 비디오 컴포넌트를 만들어줘. 상단에는 사주 요소(오행, 십간십지), 중단에는 핵심 분석 텍스트, 하단에는 브랜딩 요소를 배치한다. 각 섹션은 props로 받은 데이터를 렌더링하되, 데이터가 없으면 기본값을 표시한다. 애니메이션은 나중에 추가할 수 있게 구조만 잡아둬."

이런 명세가 없으면 AI는 가로형 비디오를 만들거나, 레이아웃을 대충 잡는다. **구체적인 수치와 조건**이 핵심이다.

### Props 인터페이스 우선 정의

React 컴포넌트를 만들 때 AI에게 props 타입부터 정의하게 했다.

> "`types.ts`에 `ShortsData` 인터페이스를 정의하고, 컴포넌트는 이 타입을 import해서 써줘. 사주 분석 결과, 개인 정보, 렌더링 옵션을 구분해서 nested object로 만들어줘."

결과:

```typescript
export interface ShortsData {
  profile: PersonalInfo;
  analysis: SajuAnalysis;
  renderOptions: RenderConfig;
}
```

타입을 먼저 정의하면 AI가 일관된 데이터 구조로 컴포넌트를 만든다.

## CLI 명령어 설계에서 UX 고려하기

`src/shortsmaker/cli.py`가 124줄 추가된 걸 보면 꽤 복잡한 CLI 인터페이스가 생성됐다. 여기서 쓴 프롬프팅 기법은:

### 사용자 시나리오 기반 프롬프트

> "사용자가 `shortsmaker create profile.json`을 실행하면 비디오가 생성되고, `shortsmaker validate profile.json`을 실행하면 데이터 검증만 한다. 각 명령어는 `--output` 옵션으로 결과물 경로를 지정할 수 있고, `--verbose` 플래그로 상세 로그를 볼 수 있다."

AI는 이런 시나리오를 받으면 `argparse`나 `click` 같은 라이브러리를 적절히 써서 깔끔한 CLI를 만든다.

### 에러 처리 패턴 명시

> "파일이 없거나, JSON 형식이 잘못되거나, 필수 필드가 누락된 경우에는 친절한 에러 메시지를 출력하고 exit code 1로 종료해줘. 성공 시에는 생성된 파일 경로를 출력하고 exit code 0으로 종료한다."

이런 명세가 없으면 AI는 기본적인 try-catch만 넣고 끝낸다.

## 더 나은 방법은 없을까

이번에 GPT-5 Codex를 써서 프로젝트를 부트스트랩했지만, 더 효과적인 방법들이 있다.

### 템플릿 기반 접근법

Cookiecutter나 Yeoman 같은 템플릿 도구와 AI를 조합하면 더 일관된 프로젝트 구조를 만들 수 있다. 먼저 AI에게 Cookiecutter 템플릿을 만들게 하고, 그 템플릿으로 프로젝트를 생성하는 방식이다.

### MCP 서버 활용

Anthropic의 Model Context Protocol 서버를 쓰면 파일 시스템 접근이나 Git 조작을 더 안정적으로 할 수 있다. 특히 대량의 파일을 생성할 때 파일 경로 오류나 권한 문제를 줄인다.

### 스테이징 기반 프롬프팅

한 번에 전체 프로젝트를 만들지 말고, 스테이지별로 나누는 게 낫다:
1. 아키텍처 설계 + 문서 생성
2. 기본 프로젝트 구조 + 의존성
3. 핵심 모듈 구현
4. 통합 테스트 + 문서 업데이트

각 스테이지마다 AI의 컨텍스트를 리셋하고 이전 결과물을 입력으로 넣는다.

### 코드 품질 검증 자동화

AI가 생성한 코드를 바로 커밋하지 말고 품질 검사를 거쳐야 한다. `pre-commit` 훅에 linter, formatter, 타입 체커를 넣어두면 AI 생성 코드의 일관성을 보장한다.

## 정리

멀티모듈 프로젝트를 AI로 부트스트랩할 때 핵심은 명확한 제약 조건과 단계적 접근이다.
아키텍처 문서부터 시작해서 AI에게 일관된 컨텍스트를 제공하는 것이 품질 높은 코드 생성의 열쇠다.
타입 힌트, 에러 처리, UX 시나리오 등 세부 명세를 프롬프트에 포함시키면 실제 사용 가능한 수준의 코드가 나온다.
하지만 AI 생성 코드는 반드시 품질 검증과 리팩토링을 거쳐야 한다.

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline
65f233a — gpt-5-codex: bootstrap project workspace

</details>