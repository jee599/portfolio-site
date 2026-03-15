---
title: "GPT-5-Codex로 Python+React 풀스택 프로젝트를 0→1 빌드하는 에이전트 활용법"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

GPT-5-Codex 에이전트로 새 프로젝트를 처음부터 끝까지 빌드하는 과정을 기록했다. 단순히 코드 생성이 아니라, 프로젝트 구조 설계부터 CLI 구현, React 렌더링 파이프라인까지 일관된 아키텍처로 만들어내는 프롬프팅 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

ShortsMaker라는 도구를 만들고 있다. 사주 데이터를 입력받아서 TikTok/YouTube Shorts 형태의 동영상을 자동 생성하는 파이프라인이다. Python으로 CLI와 백엔드 로직을 처리하고, React + Remotion으로 동영상을 렌더링한다.

이번 작업의 목표는 완전히 빈 레포지토리에서 시작해서 동작하는 MVP를 만드는 것이었다. 커밋 메시지를 보면 모두 `gpt-5-codex:`로 시작한다. 전체 개발 과정을 에이전트에게 맡기고, 내가 직접 코딩한 라인은 거의 없다.

## 프로젝트 부트스트래핑: 구조부터 AI에게 맡겨라

첫 번째 커밋 `bootstrap project workspace`에서 5800줄 이상의 코드가 한번에 생성됐다. 이게 가능한 이유는 **구조화된 프롬프팅**이다.

### AI에게 전체 아키텍처를 그리게 하는 프롬프트

> "Python CLI + React 렌더러로 구성된 동영상 생성 파이프라인을 만들어줘. 다음 구조로:
> 
> 1. `src/shortsmaker/` - Python 패키지 (CLI, 모델, 훅 시스템)
> 2. `renderer/` - React + Remotion 프로젝트
> 3. `input/profiles/` - JSON 데이터 디렉토리
> 4. 프로젝트 루트에 `ARCHITECTURE.md`, `PROJECT_BRIEF.md`, `STATUS.md`
> 
> CLI는 `shortsmaker generate <profile>` 형태로 동작하고, Python에서 Node.js 렌더링 프로세스를 spawn한다. 타입 안전성을 위해 Python Pydantic 모델과 TypeScript 인터페이스가 일치해야 한다."

이렇게 쓰면 안 된다:
> "동영상 만드는 앱 만들어줘"

**핵심은 제약 조건**이다. 디렉토리 구조, 인터페이스 계약, 타입 안전성까지 미리 명시해야 AI가 일관된 코드베이스를 만든다.

### CLAUDE.md로 컨텍스트 유지하기

프로젝트 루트에 `CLAUDE.md` 파일을 만들어서 AI가 참고할 컨텍스트를 저장한다:

```markdown
# ShortsMaker Project Context

## Architecture
- Python CLI (src/shortsmaker/) + React Renderer (renderer/)
- Job-based pipeline: generate → render → output
- Type safety: Pydantic ↔ TypeScript interface matching

## Code Style
- Python: pydantic models, click CLI, pathlib
- React: functional components, TypeScript strict mode
- No class components, prefer composition

## Current Status
- [x] Project structure
- [ ] Saju content generation hooks
- [ ] Video rendering pipeline
```

이 파일이 있으면 AI가 새 기능을 추가할 때도 기존 패턴을 유지한다. 특히 멀티 파일 작업에서 일관성이 중요하다.

### 점진적 빌드 전략

한 번에 모든 기능을 구현하려고 하지 않았다. 대신 이런 순서로 진행했다:

1. **프로젝트 골격** - 디렉토리, 설정 파일, 기본 CLI
2. **타입 정의** - Python 모델과 TypeScript 인터페이스
3. **샘플 데이터** - 실제 동작 확인용 JSON
4. **파이프라인 연결** - CLI → 렌더러 → 출력

각 단계마다 AI에게 "이전 단계가 제대로 동작하는지 확인하는 테스트 코드도 같이 만들어줘"라고 주문했다.

## CLI 설계: 사용자 경험을 먼저 정의하고 역산하기

두 번째 커밋 `build saju shorts pipeline`에서 CLI 인터페이스를 구현했다. 여기서 핵심은 **사용자 관점에서 먼저 설계**하는 것이다.

### 사용자 경험부터 정의하는 프롬프트

> "다음과 같은 사용자 플로우를 구현해줘:
> 
> ```bash
> # 1. 프로필 생성
> shortsmaker init myprofile
> 
> # 2. 동영상 생성
> shortsmaker generate myprofile --lang ko --style modern
> 
> # 3. 결과 확인
> shortsmaker list
> shortsmaker status job-12345
> ```
> 
> CLI는 click 라이브러리를 쓰고, 각 명령어마다 적절한 help 메시지와 에러 핸들링을 포함해야 한다. 진행 상태는 rich 라이브러리로 프로그레스 바를 표시한다."

이 접근법의 장점은 **구현 디테일에 빠지지 않고 전체 플로우를 먼저 잡는** 것이다. AI가 사용자 경험을 이해하면 내부 로직도 자연스럽게 따라온다.

### 에러 케이스까지 미리 정의하기

> "다음 에러 상황들을 처리해줘:
> 1. 존재하지 않는 프로필 파일
> 2. renderer 디렉토리 없음
> 3. Node.js/npm 설치 안됨  
> 4. 렌더링 프로세스 실패
> 
> 각각에 대해 명확한 에러 메시지와 해결 방법을 제시한다."

이렇게 하면 AI가 방어적 프로그래밍까지 알아서 해준다. 특히 Python subprocess로 Node.js를 호출하는 부분에서 예외 처리가 중요했다.

### 타입 안전 파이프라인 구축하기

`src/shortsmaker/models.py`와 `renderer/src/types.ts`가 동기화되도록 했다:

```python
# Python 모델 
class SajuProfile(BaseModel):
    name: str
    birth_date: datetime
    elements: Dict[str, str]
```

```typescript
// TypeScript 인터페이스
interface SajuProfile {
  name: string;
  birth_date: string; // ISO format
  elements: Record<string, string>;
}
```

프롬프트에서 "Python과 TypeScript 타입이 일치하도록 하되, datetime은 ISO string으로 직렬화한다"고 명시했다. 이런 세부사항까지 미리 정해야 나중에 디버깅할 일이 없다.

## React 컴포넌트 생성: 제약이 많을수록 좋은 코드가 나온다

세 번째 단계에서 React + Remotion 렌더러를 구현했다. 194줄짜리 `ShortsComposition.tsx`가 한 번에 생성됐는데, 핵심은 **구체적인 제약 조건**이었다.

### 디자인 시스템을 프롬프트에 포함하기

> "9:16 세로형 동영상 (1080x1920)용 React 컴포넌트를 만들어줘. 다음 제약을 지켜라:
> 
> 1. **레이아웃**: 상단 제목 (20%), 중앙 콘텐츠 (60%), 하단 CTA (20%)
> 2. **타이포그래피**: 제목 48px bold, 본문 32px regular, 모바일 가독성 고려
> 3. **애니메이션**: Remotion의 spring() 사용, 부드러운 fade-in/slide-up
> 4. **컬러**: 그라데이션 배경, 대비율 4.5:1 이상
> 5. **콘텐츠**: 사주 요소를 시각적 아이콘과 함께 표시
> 
> 하드코딩 금지. 모든 값은 props로 받거나 상수로 분리한다."

이렇게 구체적으로 주문하면 AI가 일관성 있는 디자인을 만든다. 특히 "하드코딩 금지"라는 제약이 중요했다.

### Remotion 특화 프롬프팅

> "Remotion의 `useCurrentFrame()`, `useVideoConfig()`, `interpolate()` 함수를 적절히 활용해서 3초 동영상을 만들어줘:
> 
> - 0-30프레임: 제목 등장
> - 30-60프레임: 사주 요소들 순차 등장  
> - 60-90프레임: 결론 메시지와 CTA
> 
> 각 요소의 등장 타이밍을 `interpolate()`로 계산하고, spring 애니메이션을 적용한다."

일반적인 React 컴포넌트 프롬프트와 달리, **Remotion 특화 API들을 명시**했다. AI가 동영상 렌더링 라이브러리의 특성을 이해하고 적절한 코드를 생성한다.

### 컴포넌트 재사용성 고려하기

```typescript
interface ShortsCompositionProps {
  profile: SajuProfile;
  style: 'modern' | 'traditional' | 'minimal';
  language: 'ko' | 'en';
}
```

프롬프트에서 "나중에 다양한 스타일과 언어를 지원해야 하니까 props 구조를 확장 가능하게 만들어줘"라고 했다. 단순히 현재 요구사항만 구현하는 게 아니라 **미래 확장성**도 고려한다.

## 경로 처리와 검증: 디테일이 성공을 좌우한다

네 번째 커밋 `fix repo-relative cli paths`에서 상대 경로 문제를 해결했다. 이런 디테일한 버그 수정도 AI에게 맡길 수 있다.

### 디버깅 컨텍스트를 명확히 주는 프롬프트

> "CLI에서 `shortsmaker generate` 실행 시 다음 에러가 발생한다:
> ```
> FileNotFoundError: renderer/package.json not found
> ```
> 
> 현재 `pathlib.Path(__file__).parent`로 경로를 계산하는데, 패키지 설치 후에는 다른 위치에서 실행되니까 틀렸다. 
> 
> 다음 방식으로 수정해줘:
> 1. 프로젝트 루트를 찾는 로직 (`pyproject.toml` 기준)
> 2. 상대 경로 대신 절대 경로 사용
> 3. 경로 존재 여부 검증 후 명확한 에러 메시지"

단순히 "에러 고쳐줘"가 아니라 **원인 분석과 해결 방향**을 함께 제시했다. AI가 올바른 수정을 할 수 있다.

### 검증 로직까지 함께 구현하기

> "경로 문제 해결하면서 `validate_project_structure()` 함수도 만들어줘. CLI 실행 전에 다음을 체크:
> 1. renderer/ 디렉토리 존재
> 2. package.json 파일 존재  
> 3. Node.js 설치 여부
> 4. npm 패키지 설치 여부
> 
> 검증 실패 시 설치 가이드를 출력한다."

버그 수정만 하는 게 아니라 **미래의 같은 문제를 방지하는 로직**까지 함께 만든다. 이런 식으로 접근하면 코드 품질이 점진적으로 향상된다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식보다 더 효율적인 패턴들이 있다.

### MCP 서버 활용

현재는 프롬프트로 프로젝트 컨텍스트를 전달했지만, **Model Context Protocol**을 쓰면 더 체계적이다. 프로젝트 구조, 설정 파일, 컨벤션을 MCP 서버로 관리하고 AI가 자동으로 참조하게 할 수 있다.

### GitHub Copilot Workspace 통합

단일 파일 생성이 아니라 **전체 워크플로우**를 자동화할 수 있다. 이슈 생성 → 브랜치 → 코드 구현 → 테스트 → PR까지 일관된 파이프라인으로 만들면 더 효율적이다.

### 테스트 주도 프롬프팅

"구현해줘" 대신 **"이 테스트가 통과하도록 구현해줘"**라고 접근하는 방식이 더 정확하다. 특히 CLI 도구처럼 입출력이 명확한 경우에는 테스트 케이스를 먼저 작성하고 역산하는 게 좋다.

### 점진적 복잡성 증가

한 번에 모든 기능을 구현하지 말고 **MVP → 개선 → 확장** 단계로 나눠서 진행한다. 각 단계마다 AI에게 "지금까지 구현된 것을 기반으로 다음 기능을 추가해줘"라고 요청하면 일관성을 유지하면서도 복잡한 기능을 안정적으로 만들 수 있다.

## 정리

- **구조화된 프롬프트**: 제약 조건, 디렉토리 구조, 타입 안전성을 미리 정의하면 일관된 코드베이스가 나온다
- **사용자 경험 우선 설계**: 구현부터 시작하지 말고 CLI 인터페이스나 API 스펙을 먼저 정의한다  
- **컨텍스트 유지**: CLAUDE.md 파일이나 MCP 서버로 프로젝트 전체 맥락을 AI가 참고할 수 있게 한다
- **점진적 구축**: 한 번에 모든 걸 만들려 하지 말고 단계별로 검증하면서 확장한다

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline
65f233a — gpt-5-codex: bootstrap project workspace

</details>