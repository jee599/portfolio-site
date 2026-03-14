---
title: "GPT-5를 코딩 파트너로 만드는 프롬프트 패턴 — ShortsMaker 프로젝트 구축기"
project: "shortsmaker"
date: 2026-03-14
lang: ko
tags: [python, typescript]
---

ShortsMaker라는 숏폼 콘텐츠 생성 도구를 처음부터 만들면서 GPT-5 Codex를 본격적으로 코딩 파트너로 활용했다. 5800줄의 코드와 34개 파일을 4번의 커밋으로 만들어낸 과정에서 발견한 AI 활용 패턴과 프롬프팅 전략을 공유한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 분석 데이터를 받아서 TikTok/YouTube Shorts용 영상을 자동으로 생성하는 도구다. Python으로 작성된 CLI 도구가 메인이고, Remotion을 사용한 React 렌더러가 실제 영상을 만든다.

이번 작업의 목표는 프로젝트 초기 구조를 잡고 핵심 파이프라인을 구현하는 것이었다. 처음부터 끝까지 GPT-5 Codex와 협업하면서 프롬프팅 전략을 실험했다.

## 프로젝트 부트스트랩: 구조화가 모든 것을 결정한다

AI에게 새 프로젝트를 맡길 때 가장 중요한 것은 **명확한 제약 조건**이다. 막연하게 "프로젝트 만들어줘"라고 하면 AI가 추측으로 채운 부분들 때문에 나중에 리팩토링 지옥에 빠진다.

### 효과적인 부트스트랩 프롬프트

> Python CLI 도구와 React 렌더러로 구성된 숏폼 영상 생성 파이프라인을 만들어줘.
> 
> **요구사항:**
> - Python 3.11+, poetry 대신 pip-tools 사용
> - CLI는 `typer`, 비동기 처리는 `asyncio`
> - React 렌더러는 Remotion 4.0+, TypeScript
> - 입력: JSON 프로필 → 출력: MP4 영상
> - 프로젝트 루트에 `src/shortsmaker/`, `renderer/`, `tests/` 구조
> - hook 시스템으로 확장 가능해야 함
> 
> **금지사항:**
> - Docker 설정 포함하지 마
> - 데이터베이스 의존성 없이
> - 외부 API 호출 하드코딩 금지

이렇게 쓰면 안 된다:

> 숏폼 영상 만드는 도구 만들어줘

첫 번째 프롬프트는 AI가 추측할 여지를 최소화한다. 기술 스택, 프로젝트 구조, 제약사항을 명시적으로 제공해서 내가 원하는 방향으로 프로젝트가 시작되도록 한다.

### CLAUDE.md를 활용한 컨텍스트 관리

프로젝트가 복잡해질수록 AI에게 전체 구조를 이해시키는 게 어렞다. `CLAUDE.md` 파일을 프로젝트 루트에 만들어서 컨텍스트를 관리했다:

```markdown
# ShortsMaker Project Context

## Architecture
- CLI: Python 3.11 + typer + asyncio
- Renderer: React + Remotion + TypeScript  
- Pipeline: profile.json → job.py → render-job.ts → output.mp4

## Key Patterns
- Hook system: `/src/shortsmaker/hooks.py`에서 확장점 제공
- Config management: 환경변수 + 타입 체크 강제
- Error handling: 모든 async 함수에 retry 로직

## Current Focus
렌더러 컴포넌트 구현 중. ShortsComposition.tsx가 메인 컴포넌트.
```

Claude Code에서 이 파일을 읽고 프로젝트 전체 맥락을 유지할 수 있다. 특히 멀티 파일 작업에서 AI가 일관된 코딩 스타일과 아키텍처 패턴을 유지하는 데 효과적이다.

## 파이프라인 설계: AI에게 시스템 아키텍처 맡기기

두 번째 커밋에서는 핵심 파이프라인을 구현했다. 이때 중요한 것은 AI에게 **전체 흐름**을 이해시키고 각 모듈의 **책임과 경계**를 명확히 하는 것이다.

### 시스템 설계 프롬프트 패턴

> 사주 데이터 → 숏폼 영상 파이프라인을 설계해줘.
> 
> **데이터 흐름:**
> 1. `input/profiles/sample_saju.json` 읽기
> 2. Job 객체로 변환 (validation 포함)
> 3. React 렌더러에 전달
> 4. MP4 파일 생성
> 
> **각 단계별 요구사항:**
> - Job: pydantic 모델로 타입 안전성 확보
> - Language: 다국어 지원 인프라 (한국어부터)  
> - Hooks: 각 단계에 커스텀 로직 삽입 가능
> - Render: Remotion 컴포넌트, 9:16 세로 영상
> 
> **에러 처리:**
> - 파일 없음, JSON 파싱 실패, 렌더링 실패 각각 구분
> - 사용자에게 명확한 에러 메시지

이 프롬프트의 핵심은 **데이터 흐름을 순서대로 명시**한 것이다. AI가 각 단계별로 필요한 모듈을 설계하고, 모듈 간 인터페이스를 일관되게 유지할 수 있다.

### Hook 시스템으로 확장성 확보

AI에게 hook 시스템을 설계하게 할 때는 **구체적인 사용 사례**를 제시하는 것이 중요하다:

> `/src/shortsmaker/hooks.py`에 이벤트 기반 hook 시스템을 만들어줘.
> 
> **Hook 포인트:**
> - `before_job_validation`: 원본 데이터 전처리
> - `after_job_creation`: Job 객체 수정 
> - `before_render`: 렌더링 전 최종 검증
> - `after_render`: 후처리 (썸네일, 메타데이터 등)
> 
> **사용 예시:**
> ```python
> @hook('after_job_creation')  
> def add_branding(job: Job) -> Job:
>     job.overlay_logo = True
>     return job
> ```
> 
> async/await 지원하고, 예외 발생 시 다음 hook은 건너뛰기

이렇게 구체적인 사용 예시를 주면 AI가 실제로 쓸모있는 API를 설계한다. 추상적으로 "확장 가능하게 만들어줘"라고 하면 over-engineering된 복잡한 시스템을 만들 가능성이 높다.

## 다국어 인프라: LLM을 언어학자로 활용하기

`languages.py` 파일에서 다국어 지원 인프라를 구축할 때 GPT-5의 언어 지식을 적극 활용했다.

### 언어별 특성을 반영한 프롬프팅

> 숏폼 영상에서 텍스트 렌더링을 위한 언어별 설정을 만들어줘.
> 
> **언어 목록:** 한국어, 영어, 일본어, 중국어(간체), 스페인어
> 
> **각 언어별 필요 정보:**
> - 폰트 패밀리 (sans-serif 계열, 모바일 최적화)
> - 텍스트 방향 (LTR/RTL)  
> - 줄간격, 자간 조정값
> - 숫자 표기법 (아라비아/로마/한자)
> - 날짜 형식
> - 짧은 텍스트에서 자연스러운 줄바꿈 규칙
> 
> **출력 형식:** TypeScript enum과 config 객체

GPT-5가 각 언어의 타이포그래피 특성을 정확히 파악해서 실용적인 설정값들을 제공했다. 특히 CJK 언어들의 줄간격 조정값과 서구 언어들의 자간 설정이 실제 디자인에서 바로 쓸 수 있는 수준이었다.

이런 작업에서 AI의 장점은 **다양한 언어에 대한 일관된 지식**을 가지고 있다는 것이다. 사람이라면 각 언어별로 리서치해야 할 내용들을 한 번에 처리할 수 있다.

## Remotion 컴포넌트: 선언적 UI를 AI와 함께 설계하기

React 렌더러 구현에서 가장 중요한 부분은 `ShortsComposition.tsx` 컴포넌트였다. 194줄의 코드를 한 번에 생성할 수 있었던 이유는 **명확한 UI 명세**를 프롬프트에 포함했기 때문이다.

### UI 명세를 포함한 컴포넌트 생성 프롬프트

> Remotion으로 숏폼 영상 컴포넌트를 만들어줘.
> 
> **영상 스펙:**
> - 해상도: 1080x1920 (9:16)
> - 길이: 15초 (450 frames at 30fps)
> - 배경: 그라데이션 (상단 어두운 보라 → 하단 짙은 파란)
> 
> **레이아웃 구조:**
> ```
> [0-90px]    빈 공간
> [90-200px]  제목 텍스트 (40px, 굵게, 중앙정렬)
> [200-300px] 빈 공간  
> [300-800px] 메인 콘텐츠 영역
> [800-900px] 결론/CTA 텍스트
> [900px-]    빈 공간
> ```
> 
> **애니메이션:**
> - 제목: 0초에 fadeIn + slideUp
> - 콘텐츠: 2초부터 순차적으로 나타남
> - 결론: 12초에 강조 애니메이션
> 
> **Props 인터페이스:**
> ```typescript
> interface ShortsProps {
>   profile: SajuProfile;
>   language: LanguageConfig;
>   theme: ThemeConfig;
> }
> ```

이 프롬프트의 핵심은 **픽셀 단위의 구체적 명세**다. AI가 추측할 부분을 없애고, 정확한 좌표와 타이밍을 제공했다. 그 결과 수정 없이 바로 쓸 수 있는 컴포넌트가 나왔다.

### Remotion 특화 프롬프팅 팁

Remotion은 일반적인 React와 다른 개념들이 있어서 AI에게 명확히 알려줘야 한다:

> **Remotion 전용 규칙:**
> - `useCurrentFrame()`, `useVideoConfig()` 활용
> - `interpolate()`로 애니메이션 값 계산
> - `Sequence` 컴포넌트로 타이밍 제어
> - `staticFile()`로 리소스 경로 처리
> - 절대 `useState`, `useEffect` 사용하지 마 (렌더링 방식이 다름)

이런 제약사항을 명시하지 않으면 AI가 일반적인 React 패턴으로 코드를 작성해서 Remotion에서 동작하지 않는다.

## CLI 도구 개발: 사용자 경험까지 고려한 프롬프팅

마지막 커밋에서 CLI 인터페이스를 완성했다. 단순히 기능만 구현하는 게 아니라 **사용자 경험**까지 고려한 프롬프트를 작성했다.

### UX를 고려한 CLI 설계 프롬프트

> typer로 직관적인 CLI 인터페이스를 만들어줘.
> 
> **명령어 구조:**
> ```bash
> shortsmaker generate input/profiles/sample.json
> shortsmaker validate input/profiles/sample.json  
> shortsmaker list-languages
> shortsmaker config --show
> ```
> 
> **사용자 경험 요구사항:**
> - 진행 상황을 rich 라이브러리로 시각화
> - 에러 메시지는 해결 방법 포함
> - `--verbose` 플래그로 디버깅 정보 제공
> - `--dry-run`으로 실제 실행 전 검증 가능
> - 색상 코딩: 성공(녹색), 경고(노란색), 에러(빨간색)
> 
> **에러 처리 예시:**
> ```
> ❌ 파일을 찾을 수 없습니다: input/missing.json
> 💡 해결 방법: 
>    1. 파일 경로를 확인하세요
>    2. sample 파일 생성: shortsmaker init-sample
> ```

이 프롬프트는 단순한 기능 구현을 넘어서 **실제 사용자가 겪을 수 있는 문제 상황**을 미리 고려한다. AI가 더 친화적이고 실용적인 CLI 도구를 만들 수 있다.

### 비동기 작업과 진행 상황 표시

영상 렌더링은 시간이 오래 걸리는 작업이라서 사용자에게 진행 상황을 보여줘야 한다:

> 렌더링 작업의 진행 상황을 실시간으로 표시해줘.
> 
> **진행 단계:**
> 1. 프로필 validation (1초)
> 2. Job 객체 생성 (0.5초)  
> 3. 렌더링 준비 (2초)
> 4. 실제 렌더링 (10-30초, Remotion 진행률 기반)
> 5. 후처리 (1초)
> 
> **표시 방식:**
> - rich.Progress 바 사용
> - 현재 단계명과 예상 소요시간 표시
> - Remotion 렌더링 중에는 프레임 진행률 표시
> - 완료 시 최종 파일 경로와 크기 출력

AI가 각 단계별로 적절한 진행률 계산 로직을 구현하고, 사용자가 언제든 Ctrl+C로 안전하게 취소할 수 있는 구조를 만들었다.

## 더 나은 방법은 없을까

이번 작업에서 사용한 패턴들보다 더 효율적인 대안들을 살펴보자.

### MCP (Model Context Protocol) 서버 활용

현재는 `CLAUDE.md`로 컨텍스트를 관리했지만, Anthropic의 MCP 서버를 사용하면 더 동적으로 프로젝트 상태를 AI에게 전달할 수 있다:

```typescript
// mcp-server.ts
import { MCPServer } from '@anthropic-ai/mcp-sdk';

const server = new MCPServer({
  name: 'shortsmaker-context',
  tools: [
    {
      name: 'get_project_status',
      description: '현재 프로젝트 상태와 최근 변경사항',
      handler: async () => {
        return {
          currentPhase: 'renderer-implementation', 
          recentFiles: getRecentChanges(),
          testStatus: runQuickTests()
        };
      }
    }
  ]
});
```

이렇게 하면 AI가 실시간으로 프로젝트 상태를 파악하고, 더 적절한 코드를 생성할 수 있다.

### GitHub Copilot Workspace와의 비교

GitHub에서 발표한 Copilot Workspace는 전체 프로젝트를 이해하고 여러 파일을 동시에 수정하는 데 특화되어 있다. 대규모 리팩토링이나 아키텍처 변경에서는 Claude Code보다 더 효과적일 수 있다.

하지만 현재까지의 경험으로는 **정밀한 제어**와 **프롬프트 커스터마이징**에서는 Claude가 더 유리하다. 특히 도메인 특화 로직(사주 분석, Remotion 컴포넌트 등)에서는 상세한 프롬프트를 작성할 수 있는 환경이 더 좋은 결과를 낸다.

### 테스트 주도 개발과 AI

이번 프로젝트에서는 구현 후 테스트를 작성했지만, **테스트를 먼저 작성**하고 AI에게 구현하게 하는 방식이 더 효과적일 수 있다:

> 다음 테스트를 통과하는 `Job` 클래스를 구현해줘:
> 
> ```python
> def test_job_validation():
>     valid_data = {"name": "홍길동", "birth": "1990-01-01"}
>     job = Job.from_dict(valid_data)
>     assert job.name == "홍길동"
> 
> def test_job_validation_failure():
>     invalid_data = {"name": ""}  # 빈 이름
>     with pytest.raises(ValidationError):
>         Job.from_dict(invalid_data)
> ```

테스트가 명확한 스펙 역할을 해서 AI가 더 정확한 구현을 만들어낼 수 있다.

## 정리

GPT-5를 효과적인 코딩 파트너로 만드는 핵심 포인트들:

- **구체적인 제약 조건과 요구사항**을 명시해서 AI의 추측 여지를 없앤다
- **CLAUDE.md 같은 컨텍스트 파일**로 프로젝트 전체 구조를 AI가 이해하도록 한다  
- **사용자 경험과 에러 처리**까지 고려한 프롬프트를 작성한다
- **도메인 특화 지식**(Remotion, typer 등)은 프롬프트에 명확히 포함시킨다

5800줄의 코드를 4번의 커밋으로 완성할 수 있었던 이유는 각 단계에서 AI에게 **정확히 무엇을 원하는지** 명시했기 때문이다. 막연한 요청 대신 구체적인 명세와 예시를 제공하는 것이 AI와 협업하는 핵심이다.

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
65f233a — gpt-5-codex: bootstrap project workspace

</details>