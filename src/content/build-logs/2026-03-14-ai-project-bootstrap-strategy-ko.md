---
title: "5800줄 코드를 한번에 생성하는 AI 프로젝트 부트스트랩 전략"
project: "shortsmaker"
date: 2026-03-14
lang: ko
tags: [python, typescript]
---

ShortsMaker라는 숏폼 비디오 생성 도구를 처음부터 끝까지 AI로 설계하고 구현했다. 단 4번의 커밋으로 5800줄의 코드를 생성하고 Python+TypeScript 하이브리드 파이프라인을 완성했다. 이 글에서는 대규모 프로젝트를 AI로 부트스트랩할 때 반드시 알아야 할 구조화 전략과 프롬프팅 패턴을 다룬다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 분석 결과를 숏폼 비디오로 자동 생성하는 도구다. Python으로 데이터 처리와 작업 관리를 하고, Remotion으로 React 컴포넌트를 비디오로 렌더링한다. CLI에서 명령 하나로 JSON 프로필을 받아서 MP4를 뱉어내는 완전 자동화 파이프라인이 목표였다.

이번 작업의 핵심은 "아무것도 없는 상태에서 완동하는 파이프라인까지" 한 번에 가는 것이었다. 보통은 작은 단위로 쪼개서 점진적으로 만들지만, AI의 컨텍스트 윈도우가 충분히 크다면 전체 아키텍처를 한번에 설계하고 구현할 수 있다.

## 전체 아키텍처를 한번에 설계하는 프롬프팅

대부분 개발자가 AI에게 "로그인 기능 만들어줘"처럼 기능 단위로 요청한다. 하지만 복잡한 시스템은 전체 구조가 먼저 잡혀야 한다. 각 모듈이 어떻게 연결되는지, 데이터가 어떻게 흐르는지, 의존성은 어떻게 관리할지를 처음부터 결정해야 한다.

> "사주 분석 데이터를 숏폼 비디오로 변환하는 Python 패키지를 설계해줘. CLI에서 JSON 프로필을 입력받아서 MP4 파일을 출력한다. Python으로 작업 관리와 데이터 처리를 하고, TypeScript/Remotion으로 실제 렌더링을 한다. 프로젝트 구조, 의존성 관리, 타입 정의, 에러 핸들링, 로깅까지 포함해서 production-ready 수준으로 만들어줘."

이런 프롬프트는 안 된다:
> "파이썬으로 비디오 만드는 앱 코딩해줘"

차이점을 보면:
- **구체적인 기술 스택**: Python + TypeScript/Remotion
- **명확한 입출력**: JSON → MP4
- **아키텍처 제약 조건**: CLI 인터페이스, 모듈 간 책임 분리
- **품질 요구사항**: production-ready, 에러 핸들링, 로깅

Claude는 이런 프롬프트를 받으면 전체 폴더 구조부터 잡는다. `src/shortsmaker/`에 핵심 로직, `renderer/`에 Remotion 코드, `input/`에 샘플 데이터까지 한번에 생성한다.

### 단계적 구체화로 컨텍스트 누적

전체 구조가 나오면 각 모듈을 구체화한다. 이때 핵심은 **이전 컨텍스트를 계속 참조**하게 하는 것이다.

> "방금 설계한 ShortsMaker 아키텍처에서 `job.py` 모듈을 구현해줘. Job 클래스는 입력 JSON을 파싱하고, 다국어 텍스트 생성하고, Remotion 스크립트 호출해서 MP4 출력까지 담당한다. 각 단계별로 상태 추적하고, 실패 시 명확한 에러 메시지 출력해야 한다. 이전에 정의한 타입과 설정 구조 그대로 사용해."

"방금 설계한"이라는 표현이 중요하다. Claude가 이전 응답의 아키텍처 결정을 기억하고 일관성을 유지한다.

### 크로스 플랫폼 연동 지점 명확화

Python과 TypeScript가 만나는 지점이 가장 복잡하다. 두 환경 간 데이터 교환, 프로세스 관리, 에러 전파를 어떻게 할지 명확히 지시해야 한다.

> "`shortsmaker render` CLI 명령어가 실행되면: 1) Python에서 JSON 데이터 검증하고 임시 폴더에 저장 2) `npm run render` 스크립트 호출해서 Remotion 렌더링 시작 3) TypeScript에서 Python이 준비한 JSON 읽어서 React 컴포넌트 props로 전달 4) 렌더링 완료되면 MP4 파일 경로를 Python으로 반환. 각 단계에서 프로세스 간 통신과 에러 핸들링 어떻게 할지 구체적으로 보여줘."

결과적으로 Python `subprocess.run()`으로 npm 스크립트를 호출하고, 임시 JSON 파일로 데이터를 전달하고, 표준 출력으로 결과 경로를 받는 깔끔한 파이프라인이 나온다.

## Claude Code의 프로젝트 컨텍스트 관리

대규모 코드 생성에서 가장 중요한 건 **일관성**이다. 한 파일에서 정의한 타입이나 함수명이 다른 파일에서도 정확히 맞아야 한다. Claude Code의 몇 가지 기능이 이걸 해결한다.

### CLAUDE.md로 프로젝트 컨벤션 고정

```markdown
# ShortsMaker Development Guide

## Architecture
- Python (>=3.8) for job management and CLI
- TypeScript/Remotion for video rendering  
- Pydantic for data validation
- Click for CLI interface

## Naming Conventions
- Python: snake_case for functions/variables
- TypeScript: camelCase for variables, PascalCase for components
- File names: kebab-case

## Error Handling
- Use custom exceptions with clear messages
- Log all operations with structured logging
- Return exit codes: 0=success, 1=validation error, 2=render error

## Type Safety
- All Python models use Pydantic BaseModel
- TypeScript interfaces match Python model structure
- JSON schema validation at input/output boundaries
```

이 파일을 만들어두면 Claude가 새 파일을 생성할 때마다 이 규칙을 따른다. 특히 Python과 TypeScript 간 타입 매핑이 중요한 프로젝트에서 필수다.

### /commit으로 논리적 단위 묶기

각 커밋이 하나의 완결된 기능을 담도록 `/commit` 명령어를 활용했다:

- `bootstrap project workspace`: 기본 폴더 구조와 설정 파일
- `build saju shorts pipeline`: 핵심 비즈니스 로직과 데이터 모델
- `fix repo-relative cli paths`: CLI 명령어와 파일 경로 처리
- `log sample short validation`: 테스트와 검증 로직

각 커밋마다 "이 단위가 독립적으로 동작하는가?"를 확인했다. 덕분에 나중에 특정 기능만 롤백하거나 다른 브랜치에 체리픽할 수 있다.

### 의존성 충돌 방지 패턴

Python과 Node.js 의존성이 섞인 프로젝트에서 자주 발생하는 문제가 버전 충돌이다. 이를 방지하기 위해 명확한 분리 전략을 썼다:

> "Python 의존성은 `pyproject.toml`에서만 관리하고, Node.js는 `renderer/package.json`에서만 관리해. Python 코드에서 npm 스크립트를 호출할 때는 `cwd` 매개변수로 `renderer/` 디렉토리를 지정해. 두 환경이 공유하는 건 JSON 데이터 파일뿐이야."

결과적으로 Python 환경과 Node.js 환경이 완전히 독립적으로 동작하면서도 필요할 때만 데이터를 주고받는 구조가 나왔다.

## 복잡한 데이터 플로우를 AI에게 위임하는 법

ShortsMaker에서 가장 복잡한 부분은 사주 데이터를 시각적 요소로 변환하는 로직이다. 오행, 십간십지, 궁합 등 도메인 지식이 많이 필요하고, 이를 React 컴포넌트의 props로 매핑해야 한다.

### 도메인 지식과 구현 로직 분리

처음에는 사주 해석 로직까지 AI에게 맡기려 했지만, 도메인 전문성이 부족한 결과가 나왔다. 대신 **데이터 변환**에만 집중하게 했다.

> "사주 해석은 하지 마. 입력으로 받은 사주 데이터를 그대로 시각적 요소로 매핑하는 것만 해줘. 예를 들어 '甲木'이 입력되면 녹색 계열 색상과 나무 아이콘을 할당하고, '정관격'이면 특정 레이아웃 패턴을 적용하는 식으로. 해석이나 판단은 이미 완료된 데이터라고 가정하고 렌더링만 담당해."

이렇게 하니 AI가 색상, 폰트, 애니메이션, 레이아웃 등 시각적 매핑에 집중할 수 있었다. `languages.py`에 223줄의 다국어 텍스트 매핑 코드가 생성되고, `ShortsComposition.tsx`에 194줄의 React 컴포넌트가 나왔다.

### 타입 안전성으로 경계 명확화

Python과 TypeScript 간 데이터 교환에서 가장 중요한 건 **타입 안전성**이다. 한쪽에서 필드명을 바꾸면 다른 쪽에서 런타임 에러가 난다.

> "Python `SajuProfile` 모델과 TypeScript `SajuData` 인터페이스가 완전히 일치해야 한다. Python에서 Pydantic으로 검증한 JSON이 TypeScript에서 타입 에러 없이 사용되어야 한다. 필드명, 중첩 구조, 옵셔널 여부까지 동일하게 만들어줘."

결과적으로 37줄의 TypeScript 타입 정의가 Python 모델과 정확히 매치된다. 덕분에 JSON 직렬화/역직렬화 과정에서 타입 에러가 발생하지 않는다.

## 더 나은 방법은 없을까

이 프로젝트에서 사용한 접근법은 "빠른 프로토타입"에 최적화되어 있다. 하지만 더 큰 규모나 팀 개발을 고려하면 개선할 점이 있다.

### 스키마 우선 설계 (Schema-First Development)

현재는 AI가 Python과 TypeScript 타입을 각각 생성해서 수동으로 맞췄다. 더 나은 방법은 **JSON Schema를 먼저 정의**하고 양쪽 타입을 자동 생성하는 것이다.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SajuProfile",
  "type": "object", 
  "properties": {
    "name": {"type": "string"},
    "birthdate": {"type": "string", "format": "date"},
    "elements": {
      "type": "array",
      "items": {"type": "string", "enum": ["木", "火", "土", "金", "水"]}
    }
  }
}
```

이 스키마에서 `datamodel-codegen`으로 Python 모델을, `json-schema-to-typescript`로 TypeScript 타입을 생성하면 완벽한 동기화가 보장된다.

### MCP 서버로 도메인 지식 외부화

사주 관련 도메인 지식을 AI 프롬프트에 매번 포함하는 대신, **MCP 서버**로 분리할 수 있다. 

```python
# mcp_saju_server.py
@mcp.tool()
def get_element_color(element: str) -> str:
    """오행 요소에 대응하는 색상 코드를 반환한다"""
    mapping = {"木": "#2D5A27", "火": "#8B0000", ...}
    return mapping.get(element, "#000000")

@mcp.tool()  
def format_saju_text(profile: dict, lang: str) -> str:
    """사주 프로필을 지정 언어로 포맷팅한다"""
    # 복잡한 도메인 로직
```

Claude가 이 MCP 서버에 접근해서 도메인 특화 함수를 호출할 수 있다. AI 프롬프트는 깔끔해지고, 도메인 지식은 별도 서버에서 관리된다.

### GitHub Actions로 타입 동기화 자동화

현재는 Python 모델을 수정하면 수동으로 TypeScript 타입을 업데이트해야 한다. CI/CD 파이프라인에서 이를 자동화할 수 있다:

```yaml
name: Sync Types
on:
  push:
    paths: ['src/shortsmaker/models.py']
    
jobs:
  sync-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate TypeScript types
        run: |
          datamodel-codegen --input src/shortsmaker/models.py --output renderer/src/types.generated.ts
      - name: Create PR if changes
        uses: peter-evans/create-pull-request@v5
```

이렇게 하면 Python 모델 변경 시 자동으로 PR이 생성되고, 타입 불일치를 사전에 방지할 수 있다.

## 정리

- **전체 아키텍처부터**: 기능 단위가 아닌 시스템 전체를 한번에 설계하고 점진적으로 구체화한다
- **CLAUDE.md로 일관성 확보**: 프로젝트 컨벤션을 문서화해서 모든 생성 코드가 동일한 패턴을 따르게 한다  
- **타입 안전성이 핵심**: 크로스 플랫폼 연동에서는 타입 정의를 먼저 맞추고 구현한다
- **도메인 지식과 구현 분리**: AI에게는 데이터 변환과 매핑만 맡기고, 비즈니스 로직은 명확히 분리한다

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace

07e6f61 — gpt-5-codex: build saju shorts pipeline

d6e1582 — gpt-5-codex: fix repo-relative cli paths  

6cc0e4f — gpt-5-codex: log sample short validation

</details>