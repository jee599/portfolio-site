---
title: "AI로 영상 제작 파이프라인 구축하기 — Python과 React 멀티모달 설계"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

전자책 사주 분석 서비스에서 짧은 영상 콘텐츠를 자동 생성하는 시스템을 만들었다. Python 백엔드에서 사주 데이터를 처리하고, React로 영상을 렌더링하는 파이프라인인데, 처음부터 끝까지 AI를 활용해서 구축한 과정과 효과적인 프롬프팅 기법을 공유한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 분석 데이터를 받아서 소셜 미디어용 짧은 영상을 자동 생성하는 도구다. 기존에는 텍스트 기반 사주 분석만 제공했는데, 시각적 콘텐츠 수요가 늘면서 영상 제작 자동화가 필요해졌다.

아키텍처는 간단하다. Python CLI가 사주 데이터를 받아서 job을 생성하고, React 기반 renderer가 그걸 받아서 영상으로 만든다. 하지만 이런 멀티 언어 프로젝트를 처음부터 구축하는 건 복잡하다. 특히 데이터 모델링, 파일 구조, 의존성 관리까지 고려하면 더욱 그렇다.

이번 작업의 목표는 MVP를 빠르게 만드는 것이었다. 완벽한 코드보다는 작동하는 파이프라인을 우선시했고, AI를 최대한 활용해서 개발 속도를 높였다.

## AI에게 전체 시스템을 설계하게 하는 법

전체 프로젝트 구조를 AI에게 맡길 때는 **제약 조건을 명확히** 주는 게 핵심이다. 막연하게 "영상 제작 도구 만들어줘"라고 하면 쓸모없는 결과가 나온다.

효과적인 프롬프트는 이렇다:

> Python CLI로 사주 데이터를 받아서 job JSON을 생성하고, 별도의 React 프로젝트에서 그 JSON을 읽어서 영상을 렌더링하는 시스템을 만들어줘.
> 
> 제약 조건:
> - Python은 `pyproject.toml` 사용, CLI는 Click 기반
> - React는 TypeScript, Remotion 없이 canvas 기반 렌더링
> - 두 프로젝트는 파일 시스템으로만 통신 (API 서버 없음)
> - 사주 데이터 구조: 본명, 생년월일, 사주 해석, 운세 키워드
> - 영상 길이는 15-30초, 세로형 9:16 비율

이렇게 구체적으로 주면 AI가 전체 아키텍처를 일관성 있게 설계한다. `ARCHITECTURE.md`와 프로젝트 구조까지 한 번에 생성해준다.

잘못된 접근은 이런 식이다:

> "사주 영상 만드는 앱 만들어줘"

이러면 AI가 추측해서 만드는데, 대부분 내가 원하는 것과 다르다. 특히 기술 스택 선택에서 엉뚱한 방향으로 간다.

Claude Code에서는 `@project` 컨텍스트를 활용한다. 전체 파일 구조를 인덱싱해놓고, 새로운 파일을 추가할 때 기존 패턴을 유지하게 한다. `/architect` slash command로 전체 구조를 검토하고 수정할 수 있다.

핵심은 **점진적 구체화**다. 먼저 큰 틀을 잡고, 그 다음에 세부 구현을 요청한다. 한 번에 모든 걸 완벽하게 만들려고 하지 않는다.

## 멀티 언어 프로젝트에서 타입 일관성 유지하기

Python과 TypeScript를 함께 쓸 때 가장 까다로운 부분이 데이터 모델 동기화다. 같은 구조를 두 언어로 정의해야 하는데, 수동으로 하면 실수가 생긴다.

내가 사용한 패턴은 **Python을 single source of truth**로 두는 것이다. Pydantic 모델을 먼저 정의하고, 그걸 기준으로 TypeScript 타입을 생성한다.

```python
# src/shortsmaker/models.py
from pydantic import BaseModel
from typing import List, Optional

class SajuData(BaseModel):
    name: str
    birth_date: str
    analysis: str
    keywords: List[str]
    fortune_score: int

class RenderJob(BaseModel):
    id: str
    saju_data: SajuData
    output_path: str
    created_at: str
```

이걸 TypeScript로 변환할 때 AI에게 이렇게 요청한다:

> 위 Pydantic 모델을 TypeScript interface로 변환해줘. 필드명과 타입을 정확히 매칭하고, Python의 `List[str]`은 `string[]`로, `Optional[T]`는 `T | undefined`로 변환해.

```typescript
// renderer/src/types.ts
export interface SajuData {
  name: string;
  birth_date: string;
  analysis: string;
  keywords: string[];
  fortune_score: number;
}

export interface RenderJob {
  id: string;
  saju_data: SajuData;
  output_path: string;
  created_at: string;
}
```

중요한 건 **변환 규칙을 명시**하는 것이다. AI가 추측하지 않게 한다. 특히 날짜/시간 포맷, enum 처리, nested object 구조는 명확히 지정한다.

Claude Code의 MCP filesystem 서버를 활용하면 두 파일을 동시에 수정할 수 있다. Python 모델을 변경하면 "/sync types to typescript"로 자동 동기화한다.

더 나아가서는 JSON Schema를 중간 포맷으로 사용하는 방법도 있다. Pydantic에서 스키마를 추출하고, 그걸로 TypeScript 타입을 생성하면 더 정확하다. 하지만 MVP 단계에서는 오버엔지니어링이다.

## CLI 도구 개발에서 AI 활용 패턴

CLI 개발할 때 AI를 제대로 활용하려면 **사용자 시나리오를 구체적으로** 제시해야 한다. 단순히 "CLI 만들어줘"가 아니라, 실제 사용 패턴을 보여준다.

> Click 기반 CLI를 만들어줘. 사용 패턴은 이렇다:
> 
> ```bash
> # 기본 job 생성
> shortsmaker create --profile input/profiles/sample_saju.json
> 
> # 특정 출력 경로 지정
> shortsmaker create --profile data.json --output /tmp/video.mp4
> 
> # job 상태 확인
> shortsmaker status <job_id>
> 
> # 렌더링 실행
> shortsmaker render <job_id>
> ```
> 
> 에러 처리는 사용자 친화적으로 하고, progress bar도 넣어줘.

이렇게 하면 AI가 실제 UX를 고려한 CLI를 만든다. argument validation, help text, error message까지 신경 써서 작성한다.

특히 파일 경로 처리에서 AI가 자주 실수한다. 상대 경로를 절대 경로로 변환하지 않거나, 프로젝트 루트를 잘못 인식하는 경우가 많다. 이런 부분은 **구체적인 예시**로 명확히 한다:

> 파일 경로는 항상 프로젝트 루트 기준으로 처리해줘. 예를 들어 `input/profiles/sample.json`을 받으면 `Path.cwd() / "input" / "profiles" / "sample.json"`로 변환한다.

CLI 테스트도 AI에게 맡길 수 있다. pytest에서 `click.testing.CliRunner`를 사용한 테스트 코드를 생성하게 한다. 성공 케이스뿐만 아니라 에러 케이스도 다뤄야 한다고 명시한다.

```python
def test_create_command_with_invalid_profile():
    runner = CliRunner()
    result = runner.invoke(create, ['--profile', 'nonexistent.json'])
    assert result.exit_code != 0
    assert 'File not found' in result.output
```

Claude Code에서는 `/test` slash command로 특정 함수나 모듈에 대한 테스트를 자동 생성할 수 있다. 하지만 edge case는 직접 추가해야 한다.

## React 컴포넌트 생성에서 효과적인 제약 조건

React로 영상 렌더링 컴포넌트를 만들 때는 **시각적 요구사항을 최대한 구체적으로** 전달한다. "예쁘게 만들어줘"는 의미가 없다.

> 사주 데이터를 받아서 15초 애니메이션을 만드는 React 컴포넌트를 작성해줘.
> 
> 레이아웃:
> - 9:16 세로 비율 (1080x1920)
> - 상단: 이름과 생년월일 (3초 표시)
> - 중단: 사주 해석 텍스트 (8초, 타이핑 효과)
> - 하단: 운세 키워드들 (4초, fade-in 순서)
> 
> 스타일:
> - 배경은 그라데이션 (보라에서 파란색)
> - 텍스트는 나눔고딕, 흰색
> - 애니메이션은 easing function 사용
> 
> 기술 요구사항:
> - canvas 기반 (DOM 아님)
> - 60fps 렌더링
> - requestAnimationFrame 사용

이런 식으로 요청하면 AI가 실제로 사용할 수 있는 컴포넌트를 만든다. 애니메이션 타이밍, 스타일링, 성능까지 고려한다.

중요한 건 **단계별 검증**이다. 전체 컴포넌트를 한 번에 만들지 말고, 먼저 정적 레이아웃부터 확인한다. 그 다음에 애니메이션을 추가한다.

```typescript
// 1단계: 정적 레이아웃만
const StaticLayout = ({ sajuData }: { sajuData: SajuData }) => (
  <div style={{ width: 1080, height: 1920, background: 'linear-gradient(...)' }}>
    <div>{sajuData.name}</div>
    <div>{sajuData.analysis}</div>
  </div>
);

// 2단계: 애니메이션 추가
const AnimatedShorts = ({ sajuData }: { sajuData: SajuData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  // ...
};
```

CSS-in-JS vs styled-components vs emotion 같은 선택지도 미리 명시한다. AI가 혼재해서 사용하면 일관성이 깨진다.

## 더 나은 방법은 없을까

이번 작업에서 사용한 방식들 중에서 개선할 여지가 있는 부분들을 살펴본다.

**데이터 모델 동기화** 부분에서는 JSON Schema Generator를 사용하는 게 더 정확하다. Pydantic 2.0부터는 `model.model_json_schema()`로 스키마를 추출할 수 있고, 이걸 TypeScript 코드 생성기에 넣으면 실수할 여지가 없다. quicktype이나 json-schema-to-typescript 같은 도구를 파이프라인에 넣는 걸 고려해볼 만하다.

**Claude Code MCP 서버** 연동에서는 custom skills를 더 적극적으로 활용할 수 있다. 프로젝트별로 자주 쓰는 패턴들을 skill로 등록해두면 일관성이 높아진다. 예를 들어 "Python 모델 → TypeScript 인터페이스 변환" 같은 걸 스킬로 만들어두면 된다.

**영상 렌더링** 부분에서는 Remotion을 쓰는 게 더 나을 수도 있다. canvas 기반 커스텀 렌더러를 만드는 것보다 Remotion의 생태계를 활용하는 게 장기적으로는 유리하다. 특히 복잡한 애니메이션이나 미디어 처리가 필요할 때 그렇다.

**CLI 설계**에서는 명령어 구조를 더 RESTful하게 만들 수 있다. 현재는 `create`, `render`, `status`로 나뉘어있는데, `jobs` 리소스 중심으로 `jobs create`, `jobs list`, `jobs render <id>` 같이 구조화하면 확장성이 좋다.

**테스트 전략**도 아쉬운 부분이다. 현재는 유닛 테스트만 있는데, 전체 파이프라인을 검증하는 integration test가 필요하다. 특히 Python에서 생성한 job JSON이 React 렌더러에서 제대로 처리되는지 확인하는 end-to-end 테스트가 중요하다.

## 정리

AI를 활용한 멀티모달 프로젝트 개발에서 핵심은 명확한 제약 조건과 단계별 검증이다. 전체 시스템 설계부터 세부 구현까지 AI에게 맡길 수 있지만, 사람이 방향을 제시하고 품질을 검증해야 한다. 특히 서로 다른 언어/기술 스택을 연결하는 부분에서는 데이터 계약을 명확히 하고, 일관성을 유지하는 게 중요하다. MVP 단계에서는 완벽함보다 작동하는 파이프라인을 우선시하되, 확장 가능한 구조는 미리 고려해둔다.

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline
65f233a — gpt-5-codex: bootstrap project workspace

</details>