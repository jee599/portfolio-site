---
title: "AI 에이전트로 프로젝트 전체를 부트스트랩하는 프롬프팅 전략"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

5800줄의 코드를 4번의 커밋으로 만들었다. ShortsMaker라는 사주 기반 쇼츠 생성기를 GPT-5-Codex와 함께 빌드하면서 알아낸 대규모 프로젝트 부트스트랩 패턴을 정리한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 정보를 입력받아 짧은 동영상 콘텐츠를 자동 생성하는 Python 기반 도구다. Remotion을 렌더링 엔진으로 쓰고, CLI를 통해 배치 작업을 돌리는 구조다.

이번 작업의 목표는 빈 레포지토리에서 MVP까지 한번에 만드는 것이었다. 기획 문서는 있었지만 코드는 없는 상태에서 시작했다.

## 전체 아키텍처를 먼저 설계하게 하는 프롬프트 패턴

대부분 사람들이 AI에게 "이런 앱 만들어줘"라고 하면서 바로 코딩을 시키는데, 이건 망하는 지름길이다. 5000줄 넘는 프로젝트를 일관성 있게 만들려면 아키텍처부터 세워야 한다.

> "Python CLI 도구로 사주 분석 쇼츠를 생성하는 시스템을 설계해줘. 다음 제약 조건을 지켜라:
> 1. `src/shortsmaker/` 패키지 구조로 모듈화
> 2. Remotion TypeScript 렌더러와 Python 백엔드 분리
> 3. 사주 데이터는 JSON으로 standardize
> 4. CLI는 단일 명령어로 end-to-end 실행 가능
> 5. 설정은 환경변수와 config 파일로 관리
> 
> 먼저 디렉터리 구조와 주요 모듈의 역할을 정의하고, 그 다음에 데이터 플로우를 설명해라."

이렇게 쓰면 안 된다:

> "사주 앱 코드 짜줘"

첫 번째 프롬프트에서 AI가 `ARCHITECTURE.md` 파일을 만들게 했다. 여기에 모듈별 책임, 데이터 플로우, 의존성 관계가 명확히 정의되었다. 이 문서가 이후 모든 개발의 north star가 된다.

핵심은 **제약 조건을 구체적으로 주는 것**이다. "모듈화해라"가 아니라 정확히 어떤 패키지 구조를 원하는지, 어떤 기술 스택을 쓸지, 어떤 인터페이스를 지킬지를 명시한다.

## 큰 작업을 논리적 단위로 쪼개는 구조화 전략

아키텍처가 정해지면 구현을 단계별로 나눈다. 내가 쓴 방식은 이렇다:

**1단계: 프로젝트 스캐폴딩**
- `pyproject.toml`, 디렉터리 구조, `.gitignore`
- 기본 CLI 진입점과 설정 로딩

**2단계: 코어 모델 정의**  
- 사주 데이터 스키마 (`models.py`)
- Job 상태 관리 (`job.py`)
- 다국어 처리 (`languages.py`)

**3단계: Remotion 렌더러**
- TypeScript 컴포넌트
- Node.js 렌더링 스크립트  
- Python-Node 인터페이스

**4단계: Hooks와 통합**
- LLM API 호출 (`hooks.py`)
- CLI 명령어 구현
- 테스트 케이스

각 단계마다 별도 커밋을 만들고, 다음 단계로 넘어가기 전에 현재 단계가 완전히 동작하는지 검증했다.

여기서 중요한 건 **의존성 순서**다. 상위 모듈이 하위 모듈에 의존하도록 bottom-up으로 빌드한다. `models.py` → `job.py` → `cli.py` → `hooks.py` 순서로 만들면 각 단계에서 이전 단계의 타입과 인터페이스를 그대로 쓸 수 있다.

## Claude Code의 멀티 파일 컨텍스트 관리법

5000줄 규모의 프로젝트에서는 여러 파일을 동시에 수정해야 하는 경우가 많다. Claude Code의 강점은 여러 파일을 한번에 열어서 일관된 수정을 할 수 있다는 점이다.

내가 효과적이었던 패턴:

**1. `CLAUDE.md`에 프로젝트 컨텍스트 저장**
```markdown
# ShortsMaker Project Context

## Architecture
- Python package: `src/shortsmaker/`
- Remotion renderer: `renderer/`
- CLI entry: `shortsmaker` command

## Key Constraints
- All saju data must use SajuProfile schema
- Rendering jobs use async/await pattern
- Multi-language support via languages.py
```

**2. 관련 파일들을 동시에 열기**
새로운 기능을 추가할 때 관련된 모든 파일을 미리 연다:
- `models.py` (타입 정의)
- `job.py` (비즈니스 로직)  
- `cli.py` (인터페이스)
- `test_*.py` (테스트)

이렇게 하면 AI가 파일 간 일관성을 유지하면서 수정한다.

**3. `/commit` 명령어 활용**
각 논리적 변경 단위가 끝나면 바로 `/commit`을 써서 커밋 메시지를 생성한다. 이때 변경 사항을 요약해서 다음 작업의 컨텍스트로 쓴다.

**4. 타입 힌트 기반 검증**
Python 타입 힌트를 적극 활용해서 AI가 타입 불일치를 미리 잡을 수 있게 한다:

```python
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class SajuProfile:
    name: str
    birth_date: str
    pillars: Dict[str, str]
```

타입이 명확하면 AI가 다른 파일에서 이 타입을 쓸 때 실수하지 않는다.

## 렌더링 파이프라인에서 언어별 처리 패턴

사주 앱은 한국어, 영어, 일본어 등 여러 언어를 지원해야 한다. AI에게 다국어 처리를 시킬 때 효과적인 패턴을 찾았다.

> "다국어 사주 해석을 위한 언어 처리 모듈을 만들어라. 다음 구조를 지켜라:
> 1. 각 언어별로 prompt template 분리
> 2. 사주 용어 번역은 일관성 있게 관리 (정해진 용어집 사용)
> 3. 문화적 맥락이 다른 해석은 언어별로 다르게 처리
> 4. 폰트, 레이아웃도 언어별 최적화
> 
> Korean: 전통 사주 용어 그대로, 세로 읽기 고려
> English: 명확한 설명 추가, 문화적 배경 보완  
> Japanese: 한자 사용, 일본식 해석 스타일
> 
> `languages.py` 파일에 `LanguageHandler` 클래스로 구현해라."

결과적으로 223줄의 `languages.py`가 만들어졌다. 각 언어별 특성을 고려한 prompt template, 용어 매핑, 폰트 설정이 모두 들어있다.

중요한 건 **문화적 맥락**까지 고려하라고 지시한 것이다. 단순 번역이 아니라 각 문화권에서 받아들이기 좋은 방식으로 해석을 조정한다.

## Remotion과 Python 간 데이터 흐름 설계

Remotion은 React 기반 동영상 렌더링 라이브러리다. Python 백엔드에서 사주 분석 결과를 Remotion 컴포넌트로 넘겨서 동영상을 만들어야 한다.

이 부분에서 AI에게 중요한 제약을 줬다:

> "Python job 데이터를 Remotion TypeScript 컴포넌트에 넘기는 인터페이스를 설계해라. 다음을 지켜라:
> 1. Python에서 JSON 파일로 job 데이터 출력
> 2. TypeScript에서 JSON을 import해서 props로 사용
> 3. 타입 안정성을 위해 TypeScript interface 정의
> 4. 렌더링 스크립트는 CLI에서 호출 가능
> 
> Python 쪽 `job.save_render_data()`와 TypeScript 쪽 `RenderJobData` 인터페이스가 1:1 매치되도록 해라."

결과물을 보면:

**Python 쪽 (`job.py`)**:
```python
def save_render_data(self, output_path: str) -> None:
    render_data = {
        "profile": self.profile.__dict__,
        "analysis": self.analysis,
        "language": self.language,
        "theme": self.theme_config
    }
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(render_data, f, ensure_ascii=False, indent=2)
```

**TypeScript 쪽 (`types.ts`)**:
```typescript
export interface RenderJobData {
  profile: SajuProfile;
  analysis: AnalysisResult;
  language: string;
  theme: ThemeConfig;
}
```

두 언어 사이의 타입 일관성을 유지하는 게 핵심이다. AI에게 "1:1 매치"라고 명시적으로 요구했더니 정확히 그렇게 만들어줬다.

## hooks.py에서 LLM 호출 최적화

사주 분석을 위해 LLM을 호출하는 부분이 `hooks.py`에 들어있다. 256줄이나 되는 이유는 여러 최적화 패턴을 적용했기 때문이다.

**1. 배치 처리로 API 호출 최소화**
사주의 연주, 월주, 일주, 시주를 따로따로 분석하지 않고 한번에 묶어서 분석한다.

**2. 언어별 prompt 최적화**  
`languages.py`의 template을 써서 언어별로 다른 prompt를 보낸다.

**3. 에러 핸들링과 재시도**
LLM API는 가끔 실패하니까 exponential backoff로 재시도한다.

**4. 결과 캐싱**
같은 사주 데이터에 대해서는 결과를 캐싱해서 중복 호출을 피한다.

AI에게 이런 최적화를 시킬 때 쓴 프롬프트:

> "LLM API 호출을 최적화한 사주 분석 함수를 만들어라:
> 1. 사주 4주를 한번의 API 호출로 분석
> 2. 언어별 다른 prompt (languages.py 활용)
> 3. API 실패시 3회 재시도 (exponential backoff)
> 4. 응답을 JSON으로 파싱해서 구조화
> 5. 동일한 입력에 대해 결과 캐싱
> 
> `async/await` 패턴 사용하고, 에러는 구체적인 exception으로 구분해라."

## 더 나은 방법은 없을까

이번에 쓴 방식보다 더 효율적인 접근법이 몇 가지 있다:

**1. MCP 서버 활용**
현재는 Claude Code에서 직접 파일을 수정했는데, 프로젝트가 더 커지면 custom MCP 서버를 만드는 게 낫다. 사주 도메인 지식을 MCP 서버에 넣어서 더 정확한 분석을 할 수 있다.

**2. Agent 모드 vs Interactive 모드 구분**
지금은 모든 작업을 interactive하게 했는데, 반복적인 작업(테스트 파일 생성, 문서화 등)은 agent 모드로 자동화할 수 있다.

**3. 타입 체크 자동화**
`mypy`나 `pyright`를 pre-commit hook에 넣어서 타입 불일치를 자동으로 잡을 수 있다. AI가 만든 코드도 휴먼 에러는 있으니까 체크 도구가 필요하다.

**4. Incremental development with validation**
각 단계마다 실제로 실행해서 동작하는지 검증했는데, GitHub Actions나 로컬 CI를 써서 이 과정을 자동화하는 게 좋겠다.

**5. 도메인 특화 프롬프트 라이브러리**
사주 해석, 다국어 처리, Remotion 컴포넌트 같은 도메인 특화 작업을 위한 프롬프트를 미리 만들어서 재사용하면 더 일관된 결과를 얻을 수 있다.

## 정리

- 큰 프로젝트는 아키텍처 설계부터 시작한다. 코딩 전에 구조를 잡아라
- 제약 조건을 구체적으로 명시하면 AI가 일관된 코드를 만든다  
- 멀티 파일 작업에서는 타입 힌트와 인터페이스로 일관성을 유지한다
- 언어/문화적 맥락이 중요한 도메인에서는 각 케이스별 처리 로직을 명시적으로 구분한다

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline
65f233a — gpt-5-codex: bootstrap project workspace

</details>