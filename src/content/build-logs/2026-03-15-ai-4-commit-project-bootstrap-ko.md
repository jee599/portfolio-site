---
title: "새 프로젝트를 4번의 커밋으로 완성하는 AI 코딩 패턴"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

5800줄 코드를 4번의 커밋으로 완성했다. Python 백엔드부터 React 렌더러까지, 전체 프로젝트 스택을 하루 만에 구축한 과정에서 발견한 AI 활용 패턴을 정리한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 YouTube Shorts용 동영상을 자동으로 생성하는 파이프라인이다. Python CLI로 job을 관리하고, Remotion 기반 React 컴포넌트로 동영상을 렌더링한다.

이번 작업의 목표는 MVP를 최대한 빠르게 만드는 것이었다. 기획부터 구현까지 모든 단계에서 GPT-5-Codex를 활용했고, 결과적으로 34개 파일, 5800줄 코드를 4번의 커밋으로 완성했다.

## 프로젝트 부트스트래핑에서 AI 코파일럿 역할 정의하기

새 프로젝트를 시작할 때 가장 어려운 건 "어디서부터 시작할까"다. 기술 스택 선택, 디렉토리 구조, 의존성 관리 — 결정해야 할 게 너무 많다.

여기서 AI의 역할을 명확히 정의하는 게 중요하다. 전체를 맡기면 방향성이 흐려지고, 너무 세분화하면 속도가 안 난다.

내가 사용한 역할 분담은 이렇다:

**사람 (나)이 하는 일:**
- 비즈니스 요구사항 정의
- 아키텍처 레벨 결정 (Python + Remotion 조합 선택)
- 전체 워크플로우 설계
- 코드 리뷰와 최종 품질 검증

**AI가 하는 일:**
- 보일러플레이트 코드 생성
- 의존성과 설정 파일 작성
- 반복적인 구조화 작업
- 타입 정의와 인터페이스 설계

이 경계선을 명확히 하고 나서 첫 프롬프트를 작성했다:

> Python CLI 도구와 Remotion 렌더러로 구성된 동영상 생성 파이프라인을 만들어줘.
> 
> 요구사항:
> - Python: Click CLI, Pydantic 모델, job queue 패턴
> - Remotion: TypeScript, 9:16 세로 동영상, 사주 데이터 시각화
> - 전체 워크플로우: Python이 JSON job을 생성 → Remotion이 렌더링
> 
> 먼저 프로젝트 구조를 제안하고, 핵심 파일들부터 만들어줘.

이런 프롬프트가 효과적인 이유:

1. **구체적인 기술 스택 명시** - "동영상 도구 만들어줘"가 아니라 정확한 라이브러리까지 지정
2. **워크플로우 설명** - 두 시스템이 어떻게 연동되는지 명확히 함
3. **단계적 요청** - 한 번에 모든 코드가 아니라 구조 → 핵심 파일 순서로 진행

결과적으로 첫 번째 커밋에서 전체 프로젝트 골격이 나왔다.

## 멀티 패키지 프로젝트에서 컨텍스트 관리하기

Python 패키지와 React 앱이 하나의 저장소에 있는 상황에서 AI에게 작업을 시킬 때 가장 어려운 부분이 컨텍스트 관리다.

**문제 상황:**
- `src/shortsmaker/` Python 패키지 수정할 때 `renderer/src/` React 코드가 영향 받음
- 의존성이 `pyproject.toml`과 `package.json` 두 곳에 걸쳐 있음
- 타입 정의가 Python Pydantic 모델과 TypeScript 인터페이스로 중복됨

**해결 전략:**

1. **작업 범위를 명시적으로 제한한다**

```
현재 작업: Python CLI 개선
영향 범위: src/shortsmaker/ 디렉토리만
제외할 것: renderer/ 폴더는 건드리지 마
```

2. **인터페이스 먼저 고정하고 구현을 나눈다**

```
Step 1: src/shortsmaker/models.py에서 SajuProfile, RenderJob 타입 정의
Step 2: 이 타입들을 기준으로 Python CLI 구현
Step 3: 별도 세션에서 TypeScript 타입 동기화
```

3. **현재 컨텍스트를 매번 명시한다**

매번 프롬프트 시작할 때:

> 현재 작업중인 파일: src/shortsmaker/cli.py
> 목표: render 커맨드 추가하기
> 관련 파일들: job.py, config.py (참고만 할 것)

이렇게 하니까 AI가 불필요한 파일을 수정하거나 일관성 없는 코드를 만드는 문제가 크게 줄었다.

## 타입 정의 중심 개발로 AI 효율성 극대화하기

AI가 가장 잘하는 일 중 하나가 타입 정의를 기반으로 한 코드 생성이다. 특히 Python의 Pydantic과 TypeScript처럼 명시적 타입 시스템을 쓸 때 효과가 크다.

이번 프로젝트에서 사용한 패턴:

**1단계: 도메인 모델링을 AI와 함께**

```python
# src/shortsmaker/models.py
class SajuProfile(BaseModel):
    name: str
    birth_date: datetime
    pillars: List[SajuPillar]
    personality_traits: List[str]
    fortune_summary: str
```

이런 기본 구조를 AI에게 제안받고, 비즈니스 로직에 맞게 다듬었다.

**2단계: 타입 기반 함수 시그니처 생성**

> SajuProfile 모델을 받아서 RenderJob을 생성하는 함수를 만들어줘.
> 함수명: create_saju_render_job
> 위치: src/shortsmaker/job.py

AI가 타입 힌트가 완벽한 함수 틀을 만들어주면, 비즈니스 로직만 채우면 된다.

**3단계: 타입 일관성 유지**

Python 타입을 TypeScript로 변환할 때:

> Python의 SajuProfile, RenderJob 클래스를 TypeScript interface로 변환해줘.
> 
> 제약사항:
> - datetime은 ISO string으로
> - Optional[T]는 T | undefined로  
> - 필드명과 구조는 정확히 일치해야 함

이 방식의 장점:

1. **AI가 헤맬 여지가 적다** - 명확한 타입 정보가 있으면 잘못된 코드 생성 확률이 낮음
2. **리팩토링이 쉽다** - 타입 변경하면 관련 코드를 AI가 일괄 수정해줌
3. **테스트 코드 자동 생성** - 타입 정보로 유효한 mock 데이터도 만들어줌

결과적으로 `models.py` 80줄로 전체 프로젝트의 타입 안정성을 확보했다.

## CLI 도구 개발에서 AI 활용 패턴

CLI 도구는 AI가 특히 잘 만드는 분야다. Click, argparse 같은 라이브러리의 보일러플레이트가 많고, 패턴이 정형화되어 있기 때문이다.

**효과적인 CLI 생성 프롬프트:**

> Click 기반 CLI를 만들어줘.
> 
> 커맨드 구조:
> - `shortsmaker create <profile_json>` : 사주 프로필에서 job 생성
> - `shortsmaker render <job_id>` : job을 동영상으로 렌더링  
> - `shortsmaker status <job_id>` : job 상태 확인
> 
> 요구사항:
> - 각 커맨드는 별도 함수로 분리
> - JSON 파일 validation 포함
> - 에러 케이스 처리 (파일 없음, 잘못된 JSON 등)
> - 진행상황 표시 (rich 라이브러리 사용)

이런 식으로 요청하면 AI가 완전히 동작하는 CLI를 만들어준다. 여기서 중요한 건 **에러 케이스도 함께 요청**하는 것이다.

나쁜 프롬프트 예시:
> CLI 도구 만들어줘

이렇게 하면 AI가 기본적인 hello world 수준만 만든다.

**CLI 개발에서 AI가 특히 잘하는 부분:**

1. **옵션과 플래그 처리** - `--verbose`, `--output-dir` 같은 표준적인 CLI 패턴
2. **도움말 텍스트 생성** - 사용법 예시와 설명을 자연스럽게 작성
3. **설정 파일 로딩** - YAML, JSON, TOML 파서 코드
4. **진행상황 표시** - progress bar, spinner 등의 UX 요소

**사람이 직접 해야 하는 부분:**

1. **커맨드 설계** - 사용자 워크플로우에 맞는 명령어 구조 
2. **에러 메시지 다듬기** - AI가 만든 에러 메시지는 너무 기술적임
3. **실제 비즈니스 로직** - job 생성, 렌더링 호출 등의 핵심 기능

결과적으로 `cli.py` 150줄로 완전한 CLI 도구가 나왔다.

## React 컴포넌트와 Remotion 통합 자동화

Remotion은 React로 동영상을 만드는 도구인데, 일반 React 개발과는 패턴이 조금 다르다. 시간축 개념이 있고, 애니메이션 API가 독특하다.

이런 전문 라이브러리를 AI에게 시킬 때는 **공식 문서의 패턴을 명시적으로 제공**하는 게 중요하다.

**효과적인 Remotion 컴포넌트 생성 프롬프트:**

> Remotion 기반 동영상 컴포넌트를 만들어줘.
> 
> 스펙:
> - 9:16 세로 비율 (1080x1920)
> - 15초 길이, 30fps
> - 사주 데이터를 시각적으로 표현
> 
> 구조:
> ```tsx
> import {Composition} from 'remotion';
> import {interpolate, useCurrentFrame} from 'remotion';
> 
> export const SajuShorts: React.FC<SajuData> = ({profile}) => {
>   const frame = useCurrentFrame();
>   // 여기서부터 구현해줘
> }
> ```
> 
> 애니메이션:
> - 0-3초: 제목 fade in
> - 3-12초: 사주 정보 순차 등장  
> - 12-15초: 결론 메시지

이렇게 하면 AI가 Remotion API를 제대로 활용한 코드를 만든다. 핵심은:

1. **프레임워크 특수성을 인식시키기** - 일반 React가 아님을 명시
2. **시간축 정보 제공** - 몇 초에 뭐가 일어날지 구체적으로 
3. **기본 뼈대 제공** - import문과 컴포넌트 시그니처 미리 작성

**Remotion에서 AI가 자주 실수하는 부분:**

1. **useCurrentFrame() 잘못 사용** - frame을 시간으로 변환할 때 fps 계산 실수
2. **interpolate() 범위 설정** - 애니메이션 구간을 잘못 계산
3. **CSS 속성 혼동** - 동영상 좌표계와 웹 좌표계를 헷갈림

이런 문제들은 첫 번째 구현 후 리뷰 단계에서 수정하면 된다:

> 위 코드에서 애니메이션 타이밍을 검토해줘. 15초 * 30fps = 450 프레임 기준으로 interpolate 범위가 맞는지 확인하고 수정해.

결과적으로 `ShortsComposition.tsx` 194줄로 완전히 동작하는 동영상 생성기가 나왔다.

## 더 나은 방법은 없을까

이번에 사용한 접근법보다 더 효율적인 방법들을 생각해보자.

**1. Claude Code의 codebase mode 활용**

지금은 커밋마다 새로운 ChatGPT 세션을 시작했는데, Claude Code의 codebase mode를 쓰면 전체 프로젝트 컨텍스트를 유지하면서 작업할 수 있다. 특히 타입 일관성 유지나 cross-file refactoring에서 더 정확한 결과를 얻을 수 있다.

**2. MCP 서버로 개발환경 통합**

현재는 AI가 코드를 생성하면 사람이 복사-붙여넣기해서 테스트했는데, MCP 서버를 설정하면 AI가 직접 파일을 수정하고 테스트까지 실행할 수 있다. 특히 CLI 도구같이 간단한 테스트가 가능한 프로젝트에서는 피드백 루프가 훨씬 빨라진다.

**3. 프로젝트 템플릿과 AI 조합**

Cookiecutter나 create-react-app 같은 프로젝트 템플릿을 먼저 실행하고, AI에게 비즈니스 로직만 채우게 하는 방식도 있다. 보일러플레이트는 검증된 템플릿을 쓰고, AI는 도메인 특화 부분에만 집중하게 하면 품질과 속도를 모두 잡을 수 있다.

**4. 타입 우선 개발의 자동화**

현재는 Python 타입을 TypeScript로 수동 변환했는데, `pydantic-to-typescript` 같은 도구를 쓰면 자동화할 수 있다. AI에게 변환 스크립트를 만들게 하고 CI에서 실행하면 타입 동기화 문제가 원천 차단된다.

**5. 점진적 복잡도 증가**

지금은 MVP를 한 번에 만들었는데, AI와 함께 개발할 때는 더 작은 단위로 쪼개는 게 좋다. 예를 들어:
- 1단계: 정적 JSON 입력받는 CLI
- 2단계: 간단한 텍스트 동영상 생성  
- 3단계: 사주 데이터 파싱 추가
- 4단계: 복잡한 애니메이션 구현

이렇게 하면 각 단계에서 AI의 실수를 빨리 발견하고 교정할 수 있다.

## 정리

- **AI 역할 정의가 속도를 결정한다** - 창조적 작업은 사람이, 반복 작업은 AI가
- **타입 우선 개발로 AI 정확도를 높인다** - 명확한 인터페이스가 있으면 AI가 헤매지 않음  
- **컨텍스트 관리가 멀티 패키지 프로젝트의 핵심이다** - 작업 범위를 명시적으로 제한하고 인터페이스를 먼저 고정
- **전문 라이브러리는 공식 패턴을 함께 제공한다** - Remotion 같은 도구는 예제 코드와 함께 요청

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace
07e6f61 — gpt-5-codex: build saju shorts pipeline  
d6e1582 — gpt-5-codex: fix repo-relative cli paths
6cc0e4f — gpt-5-codex: log sample short validation

</details>