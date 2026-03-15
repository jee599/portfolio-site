---
title: "GPT-5 Codex로 프로젝트 한번에 부트스트래핑하는 에이전트 활용법"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

5800줄 코드를 4개 커밋으로 생성한 프로젝트가 있다. ShortsMaker라는 사주 분석 숏폼 영상 생성기를 GPT-5 Codex와 함께 만든 이야기다. 이 글에서는 AI 에이전트에게 전체 프로젝트를 맡기는 효과적인 패턴과 프롬프팅 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 숏폼 영상을 자동 생성하는 파이프라인이다. Python CLI로 작업을 관리하고, TypeScript + Remotion으로 영상을 렌더링한다. 복잡한 멀티 언어 워크플로우가 필요한 프로젝트다.

목표는 명확했다. 프로젝트 구조부터 CI/CD 설정, 실제 렌더링 코드까지 한번에 만들어야 했다. 하지만 중요한 건 "한번에"가 아니라 "제대로"였다. AI에게 큰 프로젝트를 맡길 때는 구조화된 접근이 필수다.

## 에이전트 모드로 전체 아키텍처 설계하기

GPT-5 Codex의 에이전트 모드는 단순한 코드 생성과 다르다. 프로젝트 전체를 이해하고 일관된 구조를 만들어낼 수 있다. 하지만 올바른 설정이 전제되어야 한다.

### CLAUDE.md 프로젝트 컨텍스트 설정

먼저 프로젝트 루트에 `CLAUDE.md`를 만든다. 이게 AI 에이전트의 두뇌 역할을 한다:

```markdown
# ShortsMaker Project Context

## Tech Stack
- Python 3.11+ (CLI, job management)
- TypeScript + Remotion (video rendering)
- Pydantic (data validation)
- Click (CLI framework)

## Architecture Principles
- Job-based workflow (input → processing → render → output)
- Type-safe data models across Python/TS boundary
- Configurable rendering pipelines
- Multi-language support (Korean primary)

## File Organization
- `src/shortsmaker/` - Python package
- `renderer/` - Remotion TypeScript project  
- `input/profiles/` - Sample data
- `tests/` - Python tests only (TS testing later)

## Critical Constraints
- All data exchange via JSON files
- No shared runtime between Python and Node.js
- CLI must work from any repo subdirectory
- Type definitions must be consistent across languages
```

이런 컨텍스트를 주면 AI가 개별 파일을 만들 때도 전체 그림을 놓치지 않는다. 특히 `Critical Constraints` 섹션이 중요하다. 여기서 절대 타협할 수 없는 제약 조건을 명시한다.

### 프롬프팅 전략: 레이어별 구조화

전체 프로젝트를 한번에 요청하면 안 된다. 대신 아키텍처 레이어별로 나눠서 순차적으로 진행한다:

> "Python package 구조부터 시작하자. `src/shortsmaker/` 디렉토리에 다음 모듈들을 만들어줘:
> 
> 1. `models.py` - Pydantic 데이터 모델 (사주 프로필, 렌더링 job 설정)
> 2. `job.py` - Job 라이프사이클 관리 클래스
> 3. `cli.py` - Click 기반 CLI 인터페이스
> 4. `config.py` - 설정 관리
> 
> 각 모듈은 단독으로 import 가능해야 하고, 순환 의존성 없어야 한다. TypeScript와 데이터 교환할 JSON 스키마도 고려해서 만들어줘."

이렇게 하면 안 된다:
> "프로젝트 만들어줘"

구체적인 제약 조건과 우선순위가 있어야 AI가 올바른 판단을 내린다.

### 멀티 파일 작업에서 컨텍스트 유지

큰 프로젝트에서 가장 어려운 부분이 파일 간 일관성이다. GPT-5 Codex는 컨텍스트 윈도우가 크지만 그래도 한계가 있다. 해결책은 **타입 정의를 먼저 확정하는 것**이다:

> "먼저 `src/shortsmaker/models.py`와 `renderer/src/types.ts`를 만들어줘. 이 둘이 완전히 호환되는 데이터 구조를 정의해야 한다. 
>
> 사주 프로필 구조:
> - 기본 정보 (이름, 생년월일, 성별)
> - 사주 분석 결과 (천간, 지지, 운세 등)
> - 렌더링 옵션 (언어, 템플릿, 출력 형식)
>
> Job 설정 구조:
> - 입력 파일 경로
> - 렌더링 파라미터 
> - 출력 디렉토리
> - 상태 추적 정보
>
> Python은 Pydantic BaseModel, TypeScript는 interface로 정의해줘."

타입 정의가 확정되면 나머지 구현에서 일관성 문제가 크게 줄어든다.

## CLI 중심 워크플로우 설계 패턴

CLI 애플리케이션을 AI에게 맡길 때는 **사용자 관점에서 먼저 정의**하는 게 효과적이다. 구현보다 인터페이스를 먼저 확정한다.

### 명령어 설계를 통한 역방향 설계

> "다음 CLI 명령어들이 모두 작동하도록 구현해줘:
>
> ```bash
> shortsmaker init --profile input/profiles/sample.json
> shortsmaker render --job-id abc123 --output output/
> shortsmaker status --job-id abc123
> shortsmaker list-jobs
> ```
>
> 각 명령어는 다음 동작을 해야 한다:
> - `init`: 프로필 파일을 검증하고 렌더링 job 생성
> - `render`: job을 실행하고 진행 상황 출력
> - `status`: job 상태와 로그 확인
> - `list-jobs`: 활성 job 목록 표시
>
> Click 프레임워크 쓰고, 모든 명령어는 repo 어느 디렉토리에서든 실행 가능해야 한다."

이런 식으로 인터페이스를 먼저 정의하면 AI가 구현할 때 더 일관된 구조를 만든다. 사용자 경험을 먼저 생각하게 되기 때문이다.

### 경로 처리와 설정 관리 위임

CLI 도구에서 가장 까다로운 부분이 경로 처리다. 특히 monorepo 구조에서 Python CLI가 TypeScript 렌더러를 호출하는 상황이라면 더욱 복잡하다:

> "CLI가 repo 어느 위치에서든 실행되려면 다음 문제들을 해결해야 한다:
>
> 1. 프로젝트 루트 자동 감지 (git root 또는 pyproject.toml 위치)
> 2. 상대 경로를 절대 경로로 정규화
> 3. renderer/ 디렉토리의 Node.js 스크립트 호출
> 4. 임시 파일과 출력 파일의 일관된 경로 관리
>
> `src/shortsmaker/config.py`에 ProjectConfig 클래스를 만들어서 이 모든 걸 처리하게 해줘. 싱글톤 패턴으로 한번 초기화하면 어디서든 사용할 수 있게."

구체적인 요구사항을 주면 AI가 edge case까지 고려한 견고한 구현을 만들어낸다.

## TypeScript + Remotion 멀티미디어 파이프라인

동영상 생성 코드는 특히 까다롭다. Remotion의 컴포넌트 구조와 애니메이션 로직을 AI가 제대로 이해할 수 있도록 도와야 한다.

### 컴포넌트 구조 설계 프롬프트

> "Remotion으로 사주 분석 숏폼을 만드는 컴포넌트 구조를 설계해줘:
>
> **ShortsComposition** (메인 컴포지션, 9:16 세로 1080x1920)
> - 인트로 씬 (2초): 이름과 생년월일 표시
> - 메인 씬 (5초): 사주 분석 결과, 텍스트 애니메이션
> - 아웃트로 씬 (1초): 채널명 또는 CTA
>
> **애니메이션 요구사항:**
> - 텍스트는 typewriter 효과로 등장
> - 배경은 gradient 또는 subtle pattern
> - 한국어 텍스트 최적화 (Noto Sans KR)
> - 모바일에서 읽기 좋은 폰트 크기
>
> **입력 데이터:**
> `renderer/public/job-data.json`에서 사주 프로필 로드
> Python에서 생성한 JSON과 동일한 구조 사용
>
> src/ShortsComposition.tsx로 만들어줘."

Remotion 같은 특수한 라이브러리는 프레임워크별 컨벤션을 명시하는 게 중요하다. 컴포지션 크기, 프레임레이트, 데이터 로딩 방식까지 구체적으로 지정한다.

### 렌더링 스크립트 자동화

> "Python CLI에서 TypeScript 렌더러를 호출하는 스크립트를 만들어줘:
>
> `renderer/scripts/render-job.ts`
> - job ID와 출력 경로를 CLI 인자로 받음
> - `public/job-{id}.json`에서 데이터 로드
> - Remotion CLI를 programmatic하게 호출
> - 진행 상황을 stdout으로 출력 (Python에서 파싱 가능하게)
> - 에러 시 적절한 exit code 반환
>
> TypeScript에서 child_process 쓰지 말고 Remotion API 직접 사용해줘."

AI에게 시스템 통합 코드를 맡길 때는 에러 처리와 로깅을 강조해야 한다. 특히 서로 다른 런타임 간 통신에서는 디버깅이 어렵기 때문이다.

## 더 나은 방법은 없을까

이 프로젝트에서 사용한 패턴들은 효과적이었지만 개선할 수 있는 부분들이 있다.

### MCP 서버로 도구 통합하기

현재는 AI에게 매번 컨텍스트를 설명해야 한다. 하지만 Model Context Protocol을 쓰면 프로젝트별 도구를 AI에게 직접 제공할 수 있다:

```python
# mcp_shortsmaker.py
@mcp_tool
def validate_saju_profile(profile_path: str) -> dict:
    """사주 프로필 JSON 파일을 검증하고 누락된 필드 반환"""
    # 실제 검증 로직
    
@mcp_tool  
def get_render_progress(job_id: str) -> dict:
    """렌더링 진행 상황을 실시간 조회"""
    # job 상태 확인
```

이렇게 하면 AI가 프로젝트 상태를 실시간으로 파악하고 더 정확한 제안을 할 수 있다.

### GitHub Copilot Workspace 활용

큰 프로젝트를 부트스트래핑할 때는 Copilot Workspace가 더 적합할 수 있다. 특히 이슈 기반으로 작업을 관리하고 PR 리뷰까지 자동화하려면:

1. 프로젝트 요구사항을 GitHub Issue로 작성
2. Copilot Workspace가 전체 구현 계획 생성  
3. 각 기능별로 별도 브랜치에서 구현
4. AI 리뷰어가 코드 품질과 일관성 검증

다만 Copilot Workspace는 아직 제한적인 언어만 지원하므로 Python + TypeScript 혼합 프로젝트에서는 GPT-5 Codex가 더 유연하다.

### Cursor의 Multi-file Edit 기능

Cursor IDE의 multi-file edit 모드를 쓰면 여러 파일을 동시에 수정하면서 타입 일관성을 유지할 수 있다. 특히 모델 정의를 변경할 때 Python과 TypeScript 양쪽을 한번에 업데이트하는 데 유용하다.

### 테스트 우선 개발로 품질 보장

이번 프로젝트에서는 구현을 먼저 하고 테스트를 나중에 추가했다. 하지만 AI 생성 코드의 품질을 높이려면 테스트를 먼저 작성하는 게 낫다:

> "먼저 `tests/test_job_lifecycle.py`를 만들어줘. 다음 시나리오들을 테스트하는 코드:
> - 유효한 프로필로 job 생성
> - 잘못된 프로필로 job 생성 시 적절한 에러
> - job 상태 변화 추적
> - 렌더링 완료 후 파일 존재 확인
>
> pytest와 임시 디렉토리 사용해서 격리된 테스트 환경 만들어줘."

테스트가 있으면 AI가 리팩토링할 때도 기능이 깨지는 걸 미리 잡을 수 있다.

## 정리

- **CLAUDE.md로 프로젝트 컨텍스트를 구조화**하면 AI가 일관된 코드를 생성한다
- **타입 정의를 먼저 확정**하고 구현하면 멀티 언어 프로젝트에서 호환성 문제가 줄어든다  
- **CLI 인터페이스부터 설계**하면 사용자 관점에서 더 나은 아키텍처가 나온다
- **제약 조건을 명확히 명시**하면 AI가 edge case까지 고려한 견고한 코드를 만든다

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace
07e6f61 — gpt-5-codex: build saju shorts pipeline  
d6e1582 — gpt-5-codex: fix repo-relative cli paths
6cc0e4f — gpt-5-codex: log sample short validation

</details>