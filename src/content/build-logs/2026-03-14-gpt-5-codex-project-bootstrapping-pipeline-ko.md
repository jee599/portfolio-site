---
title: "gpt-5-codex로 5800라인 프로젝트 부트스트래핑 — 전체 파이프라인을 AI로 설계하는 법"
project: "shortsmaker"
date: 2026-03-14
lang: ko
tags: [python, typescript]
---

새로운 프로젝트를 처음부터 만들 때 가장 큰 벽은 "어디서 시작할까"다. 이번에 ShortsMaker라는 사주 숏츠 제작 도구를 gpt-5-codex로 완전히 부트스트래핑했다. 4개 커밋으로 5800라인 코드를 생성하면서 배운 AI 활용 패턴을 정리한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 자동으로 숏폼 영상을 생성하는 파이프라인이다. Python 백엔드에서 데이터를 처리하고, React + Remotion으로 영상을 렌더링한다. 목표는 간단하다. 사주 JSON 하나 넣으면 완성된 MP4가 나와야 한다.

문제는 이런 프로젝트를 혼자 만들려면 아키텍처 설계부터 CLI 구현, React 컴포넌트 제작까지 모든 걸 다 해야 한다는 거다. 예전에는 몇 주 걸릴 작업이다. gpt-5-codex를 써서 이걸 하루 만에 끝냈다.

## 프로젝트 스캐폴딩은 한 방에 끝낸다

전체 프로젝트 구조를 AI에게 맡기는 게 핵심이다. 하나씩 파일 만들지 말고 전체 뼈대를 한번에 생성한다.

### 효과적인 부트스트래핑 프롬프트 패턴

좋은 프롬프트는 이렇게 생겼다:

> "사주 데이터로 숏폼 영상을 자동 생성하는 Python 프로젝트를 부트스트래핑해줘. 요구사항:
> 
> 1. CLI로 `shortsmaker create profile.json` 실행하면 MP4 생성
> 2. Python 백엔드 + React/Remotion 렌더러 구조
> 3. pyproject.toml 기반, src layout 사용
> 4. hooks system으로 확장 가능하게
> 5. 다국어 지원 (한국어, 영어, 일본어, 중국어)
> 
> 디렉토리 구조, 핵심 모듈, 설정 파일, 예시 데이터까지 모두 포함해서 바로 실행 가능한 상태로 만들어줘."

이렇게 쓰면 안 된다:

> "파이썬 프로젝트 만들어줘"

차이점이 보이나. 첫 번째 프롬프트는:
- 구체적인 사용 시나리오 (`shortsmaker create profile.json`)
- 기술 스택 명시 (Python + React/Remotion)
- 아키텍처 패턴 지정 (hooks system, src layout)
- 완성 조건 명확화 (바로 실행 가능한 상태)

### 제약 조건이 품질을 결정한다

gpt-5-codex에게 자유도를 너무 주면 일관성 없는 코드가 나온다. 제약 조건을 명확히 줘야 한다.

```
CLAUDE.md에 이렇게 설정했다:

## Project Standards
- Python 3.11+, type hints 필수
- src layout 구조 고수
- CLI는 typer 기반
- 모든 모델은 pydantic으로
- hooks는 pluggy 패턴 사용
- 테스트는 pytest

## Code Style
- 함수명: snake_case
- 클래스명: PascalCase  
- 상수: UPPER_SNAKE_CASE
- docstring: Google style
```

이런 제약이 있으면 AI가 일관된 패턴으로 코드를 생성한다. 특히 `hooks.py`에서 256라인짜리 pluggy 시스템을 만들 때도 정해진 패턴을 따라간다.

## 멀티 언어 파이프라인 설계

이 프로젝트에서 가장 복잡한 부분이 다국어 지원이다. 사주 용어를 4개 언어로 번역하면서도 의미가 통해야 한다.

### 언어별 전문 도메인 처리

단순 번역이 아니라 각 언어권의 문화적 맥락을 고려해야 한다. 이런 프롬프트를 썼다:

> "`languages.py` 모듈을 만들어서 사주 전문 용어를 4개 언어로 매핑해줘. 요구사항:
> 
> - 천간, 지지, 오행, 십신 등 핵심 용어 포함
> - 한국어: 한자 병기 (甲子)  
> - 영어: 의미 중심 번역 (Wood Rat)
> - 일본어: 음독 우선 (きのえね)
> - 중국어: 번체자 사용 (甲子)
> 
> 각 언어별로 숏폼에 적합한 짧은 표현도 제공해줘. 예: '대운' → 'Major Luck Cycle' → 'Life Phase'"

결과로 223라인짜리 `languages.py`가 나왔다. 각 언어별로 전문 용어 매핑뿐만 아니라 숏폼용 축약 표현까지 포함된다.

### 타입 안전성이 핵심이다

다국어 처리에서 실수가 많이 나는 부분이 언어 코드 오타다. `models.py`에서 이렇게 처리했다:

```python
from enum import Enum
from typing import Literal

class Language(str, Enum):
    KOREAN = "ko"
    ENGLISH = "en" 
    JAPANESE = "ja"
    CHINESE = "zh"

SupportedLanguage = Literal["ko", "en", "ja", "zh"]
```

AI에게 "enum과 literal type을 동시에 써서 타입 안전성과 런타임 검증을 모두 확보해줘"라고 지시했다. 이러면 IDE에서 자동완성도 되고, 잘못된 언어 코드 입력시 바로 에러가 난다.

## React + Remotion 렌더러 구조화

백엔드는 그렇다 치고, 프론트엔드 코드까지 AI로 생성하는 건 까다롭다. 특히 Remotion 같은 특수한 라이브러리는 AI도 잘 모르는 경우가 많다.

### 컴포넌트 구조를 먼저 설계한다

바로 코드를 생성하지 말고 구조부터 정의한다.

> "Remotion으로 사주 숏츠를 만드는 React 컴포넌트 구조를 설계해줘. 요구사항:
> 
> 1. 9:16 세로 비율, 15초 길이
> 2. 인트로(3초) → 메인(9초) → 아웃트로(3초) 구성
> 3. 사주 데이터는 props로 받음
> 4. 애니메이션은 spring 기반
> 5. 폰트는 Noto Sans CJK 사용
> 
> 먼저 컴포넌트 트리를 보여주고, 그 다음에 코드를 작성해줘."

AI가 먼저 이런 구조를 제안했다:

```
ShortsComposition
├── IntroScene (0-45f)
├── MainScene (45-225f) 
│   ├── ProfileCard
│   ├── FortuneText
│   └── AnimatedBackground
└── OutroScene (225-270f)
```

구조가 맞다고 확인한 다음에 "이제 이 구조대로 코드를 작성해줘"라고 했다. 결과로 194라인짜리 `ShortsComposition.tsx`가 나왔다.

### 실제 데이터 연동을 고려한다

AI가 만든 컴포넌트는 대부분 하드코딩된 더미 데이터를 쓴다. 실제 프로젝트에서는 `types.ts`로 인터페이스를 먼저 정의하고, 컴포넌트가 이를 따라가게 해야 한다.

```typescript
export interface SajuProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: "male" | "female";
  heavenlyStems: string[];
  earthlyBranches: string[];
  // ... 더 많은 필드
}

export interface ShortsJob {
  profile: SajuProfile;
  language: "ko" | "en" | "ja" | "zh";
  template: string;
  outputPath: string;
}
```

이런 타입 정의가 있으면 AI가 더 정확한 컴포넌트를 만든다.

## CLI와 파이프라인 통합

마지막 단계는 모든 걸 하나의 CLI로 묶는 거다. `cli.py`에서 124라인이 추가된 걸 보면 얼마나 복잡한지 알 수 있다.

### 에러 처리를 포함한 프롬프팅

CLI 코드를 생성할 때는 해피 패스만 고려하면 안 된다. 에러 상황도 미리 정의해줘야 한다.

> "typer 기반 CLI를 만들어서 다음 명령어들을 지원해줘:
> 
> - `shortsmaker create profile.json`: 영상 생성
> - `shortsmaker validate profile.json`: 프로필 검증  
> - `shortsmaker render job.json`: 렌더링만 실행
> 
> 에러 처리 시나리오:
> - 파일이 없을 때
> - JSON 파싱 실패시
> - 필수 필드 누락시  
> - 렌더러 실행 실패시
> 
> 각 에러마다 사용자 친화적인 메시지와 해결 방법을 제시해줘."

결과로 나온 CLI는 단순히 기능만 동작하는 게 아니라 에러 메시지도 친절하다. 예를 들어 프로필 파일이 없으면 "profile.json을 찾을 수 없습니다. shortsmaker init으로 샘플 파일을 생성하세요"라고 안내한다.

### 파이프라인 검증은 필수다

AI가 만든 코드가 실제로 동작하는지 확인하는 게 중요하다. `tests/test_cli.py`에 25라인 테스트 코드를 추가했다. 

```python
def test_create_command_with_valid_profile():
    result = runner.invoke(app, ["create", "input/profiles/sample_saju.json"])
    assert result.exit_code == 0
    assert "영상 생성 완료" in result.stdout
```

이런 테스트가 있으면 파이프라인이 제대로 연결됐는지 바로 확인할 수 있다.

## 더 나은 방법은 없을까

이번 작업에서 잘한 부분도 있지만 개선할 점도 많다.

### MCP 서버를 쓰면 더 효율적이다

지금은 각 파일을 개별적으로 생성했는데, MCP 서버를 쓰면 전체 프로젝트를 하나의 컨텍스트로 관리할 수 있다. Anthropic에서 제공하는 `filesystem` MCP 서버를 연동하면:

- 파일 간 의존성을 AI가 자동으로 파악한다
- import 경로나 타입 정의가 일관되게 유지된다  
- 코드 중복을 피할 수 있다

### GitHub Copilot Workspace가 더 적합할 수 있다

프로젝트 전체를 부트스트래핑하는 작업에는 GitHub Copilot Workspace가 더 나을 수도 있다. 특히:

- Repository context를 자동으로 파악한다
- PR 기반 워크플로우로 코드 리뷰가 쉽다
- 기존 프로젝트 패턴을 학습해서 일관된 스타일을 유지한다

### 점진적 생성이 품질을 높인다

이번에는 한 번에 많은 코드를 생성했는데, 실제로는 단계별로 검증하면서 진행하는 게 낫다:

1. 아키텍처 설계 → 검토
2. 핵심 모델 정의 → 검토  
3. CLI 기본 구조 → 테스트
4. 렌더러 컴포넌트 → 테스트
5. 통합 및 최적화

각 단계에서 AI 생성 코드를 검토하고 수정하면 최종 품질이 훨씬 높아진다.

### 템플릿 시스템을 활용한다

비슷한 프로젝트를 자주 만든다면 Cookiecutter나 Yeoman 템플릿을 만드는 게 낫다. AI에게 "이 프로젝트를 템플릿화해서 다른 도메인에도 적용할 수 있게 만들어줘"라고 시키면 재사용 가능한 구조를 만들어준다.

## 정리

- 프로젝트 부트스트래핑은 제약 조건을 명확히 주고 한 방에 끝내는 게 효율적이다
- 다국어/전문 도메인 처리시 문화적 맥락과 타입 안전성을 동시에 고려해야 한다  
- React + 백엔드 통합 프로젝트는 인터페이스부터 설계하고 컴포넌트를 생성한다
- CLI 파이프라인은 에러 처리와 검증 로직을 포함해서 프롬프팅한다

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
6cc0e4f — gpt-5-codex: log sample short validation

</details>