---
title: "AI에게 5800라인 프로젝트를 한 번에 만들게 하는 프롬프트 아키텍처"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

2026년 3월 15일, 하루 만에 Python CLI 도구와 React 렌더러로 구성된 ShortsMaker 프로젝트를 AI와 함께 처음부터 완성했다. 5800라인 추가, 34개 파일 생성. 이 글에서는 대규모 프로젝트를 AI에게 맡길 때의 구조화 전략과 프롬프팅 패턴을 다룬다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 자동으로 YouTube Shorts용 영상을 생성하는 도구다. Python으로 CLI와 비즈니스 로직을 처리하고, React + Remotion으로 영상을 렌더링한다. 

기존에는 아이디어만 있었다. 하루 만에 완전히 동작하는 MVP를 만들어야 했다. 혼자서는 불가능한 작업량이었고, AI 없이는 절대 불가능했다.

## 프로젝트 아키텍처를 먼저 정의하게 하는 법

큰 프로젝트를 AI에게 맡길 때 가장 중요한 건 **전체 구조를 먼저 합의**하는 것이다. 바로 코드부터 짜달라고 하면 망한다.

### 효과적인 아키텍처 정의 프롬프트

> "사주 데이터로 YouTube Shorts를 자동 생성하는 시스템을 설계해줘. 요구사항은 다음과 같다:
> 
> 1. Python CLI 도구로 사주 프로필을 입력받는다
> 2. 프로필 기반으로 스토리를 생성한다  
> 3. React + Remotion으로 영상을 렌더링한다
> 4. 최종 MP4 파일을 출력한다
> 
> 먼저 전체 아키텍처를 문서로 작성하고, 디렉터리 구조와 핵심 모듈을 정의해라. 코드는 아직 쓰지 마라."

이렇게 하면 안 된다:

> "사주 앱 만들어줘"

AI가 `ARCHITECTURE.md`와 `PROJECT_BRIEF.md`를 먼저 생성하게 했다. 여기서 핵심은 **"코드는 아직 쓰지 마라"**라는 제약이다. AI는 성급하게 코드부터 짜려고 한다. 구조를 먼저 고민하게 강제해야 한다.

### 계층별 책임 분리 전략

AI에게 복잡한 시스템을 설계하게 할 때는 **계층을 명확히 구분**해서 설명한다.

```
Data Layer: 사주 프로필, Job 정의
Business Layer: 스토리 생성, 후킹 시스템  
Presentation Layer: CLI, React 컴포넌트
Infrastructure Layer: 파일 시스템, 렌더링
```

이렇게 나누고 각 계층별로 "이 레이어는 뭘 담당하고, 다른 레이어와 어떻게 소통하는가"를 정의하게 했다. 결과적으로 `models.py`, `job.py`, `hooks.py`, `cli.py`가 깔끔하게 분리됐다.

## 점진적 구현을 강제하는 프롬프팅

5800라인을 한 번에 짜달라고 하면 AI도 헷갈린다. 단계별로 쪼개서 각 단계마다 **검증 가능한 목표**를 줘야 한다.

### 1단계: 데이터 모델과 기본 구조

> "먼저 핵심 데이터 모델만 구현해라. `SajuProfile`, `Job`, `StorySegment` 클래스를 pydantic으로 만들고, 샘플 JSON 파일도 함께 생성해라. CLI는 아직 만들지 마라."

결과: `models.py` 124라인, `sample_saju.json` 41라인이 생성됐다. 이 단계에서 데이터 구조가 확정되니까 다음 단계에서 헤맬 일이 없다.

### 2단계: CLI 인터페이스 구현

> "`job create`, `job render`, `job status` 명령어를 가진 CLI를 만들어라. 비즈니스 로직은 빈 함수로 두고, 명령어 파싱과 옵션 처리에만 집중해라."

결과: `cli.py`에서 `click` 기반 인터페이스가 완성됐다. 실제 로직 없이도 `python -m shortsmaker job create --profile input/profiles/sample_saju.json` 같은 명령어가 동작한다.

### 3단계: 후킹 시스템 구현

> "Job이 상태별로 다른 동작을 할 수 있게 후킹 시스템을 만들어라. `pre_story`, `post_story`, `pre_render`, `post_render` 훅을 지원하고, 각 훅에서 Job 데이터를 조작할 수 있어야 한다."

결과: `hooks.py` 256라인. 이게 가장 복잡한 부분이었는데, AI가 훅 등록, 실행, 에러 처리까지 깔끔하게 구현했다.

### 핵심 패턴: 검증 스크립트를 함께 만들게 하기

각 단계마다 **"이게 제대로 동작하는지 확인할 수 있는 테스트나 예시를 함께 만들어라"**라고 했다. 

> "CLI 구현이 끝나면 `tests/test_cli.py`에서 모든 명령어가 올바른 옵션을 받는지 테스트하는 코드를 작성해라."

결과: 25라인의 테스트 코드가 추가됐다. AI가 만든 코드를 AI가 검증하는 셈이다. 버그를 초기에 잡을 수 있었다.

## React 컴포넌트 생성 시 제약 조건 설정

Remotion 기반 React 컴포넌트는 일반적인 웹 React와 다르다. AI에게 이런 도메인 특화 코드를 짜게 할 때는 **제약 조건을 명확히** 줘야 한다.

### Remotion 컴포넌트 프롬프트

> "Remotion 기반 React 컴포넌트를 만들어라. 조건:
> 
> 1. `useCurrentFrame()`, `useVideoConfig()` 훅을 적절히 활용
> 2. 9:16 세로 비율 (1080x1920)에 최적화
> 3. 총 길이 15초, 30fps 기준
> 4. 사주 데이터는 props로 받고, 애니메이션은 frame 기반으로 처리
> 5. YouTube Shorts 가이드라인 준수 (텍스트 크기, 대비 등)
> 
> 먼저 `ShortsComposition.tsx` 하나만 만들고, 실제 렌더링 테스트를 해볼 수 있는 스크립트도 함께 작성해라."

결과: 194라인의 `ShortsComposition.tsx`와 50라인의 `render-job.ts` 스크립트가 나왔다. 제약 조건을 구체적으로 줬더니 처음부터 YouTube Shorts 규격에 맞게 나왔다.

### 타입 안정성 강제하기

AI가 TypeScript 코드를 짤 때는 **타입 정의를 먼저** 하게 한다.

> "컴포넌트 코드를 짜기 전에 `types.ts`에서 모든 props와 데이터 구조를 interface로 정의해라. Python의 pydantic 모델과 호환되도록 필드명을 맞춰라."

결과: `types.ts` 37라인에서 `SajuProfile`, `StorySegment`, `JobData` 인터페이스가 Python 쪽과 정확히 일치하게 정의됐다. 나중에 직렬화/역직렬화할 때 문제가 없었다.

## 멀티 언어 프로젝트에서 컨텍스트 관리

Python CLI + React 렌더러 조합에서 가장 까다로운 건 **두 프로젝트 간 데이터 교환**이다. AI가 한쪽 코드만 보고 작업하면 호환성 문제가 생긴다.

### CLAUDE.md로 전체 맥락 유지

프로젝트 루트에 `CLAUDE.md` 파일을 만들어서 AI가 항상 참고하게 했다.

```markdown
# ShortsMaker Project Context

## Data Flow
Python CLI → JSON Job File → React Renderer → MP4 Output

## Key Interfaces  
- SajuProfile: 사주 기본 정보 (Python models.py ↔ React types.ts)
- Job: 작업 단위, 상태 관리 포함
- StorySegment: 영상의 개별 씬

## File Conventions
- Job files: `jobs/{job_id}.json`
- Output videos: `output/{job_id}.mp4`
- Profiles: `input/profiles/*.json`
```

새로운 작업을 시킬 때마다 "CLAUDE.md를 참고해서 기존 구조와 일관성을 유지해라"라고 했다. 특히 Python에서 JSON으로 내보낸 데이터를 React에서 그대로 읽을 수 있게 필드명 규칙이 유지됐다.

### slash command 활용

Claude Code에서 `/commit` 명령어를 적극 활용했다. 특히 큰 작업이 끝날 때마다:

```
/commit "gpt-5-codex: build saju shorts pipeline"
```

AI가 작업 내용을 요약해서 커밋 메시지를 만들어준다. "gpt-5-codex" 접두사를 넣어서 AI가 주도한 커밋임을 표시했다.

## 파일 경로 처리와 상대경로 문제 해결

멀티 모듈 프로젝트에서 AI가 자주 실수하는 부분이 **파일 경로 처리**다. Python CLI에서 React 렌더러를 호출할 때 상대경로가 꼬이는 경우가 많다.

### 경로 처리 프롬프트 패턴

> "모든 파일 경로는 프로젝트 루트 기준 절대경로로 처리해라. `pathlib.Path`를 쓰고, 실행 시점에 `__file__`을 기준으로 프로젝트 루트를 찾아서 설정해라. 하드코딩 금지."

결과: `utils.py`에서 `get_project_root()` 함수가 생성되고, 모든 모듈에서 이걸 참조하게 됐다. CLI를 어디서 실행하든 정확한 경로를 찾는다.

### 검증 로직 추가

AI가 경로 관련 코드를 짤 때는 **검증 로직을 함께** 만들게 한다.

> "파일을 읽기 전에 존재하는지 확인하고, 없으면 명확한 에러 메시지를 출력해라. 디버깅할 수 있게 실제 경로도 함께 보여줘라."

결과: `job.py`에서 Job 파일을 로드할 때 파일이 없으면 "Job file not found: /absolute/path/to/jobs/abc123.json" 같은 구체적인 에러가 나온다.

## 더 나은 방법은 없을까

이번 작업에서 쓴 방식보다 더 효율적인 대안들이 있다.

### MCP 서버 활용

Anthropic의 MCP(Model Context Protocol)를 쓰면 프로젝트 전체를 더 체계적으로 관리할 수 있다. 특히 파일 시스템 MCP 서버를 연결하면:

- 파일 변경 사항을 실시간 추적
- 디렉터리 구조를 자동으로 인식
- 의존성 그래프를 기반으로 영향도 분석

현재는 CLAUDE.md로 수동 관리했지만, MCP 서버가 있으면 더 정확한 컨텍스트를 제공할 수 있다.

### GitHub Copilot Workspace와의 비교

GitHub에서 최근 공개한 Copilot Workspace는 이런 종류의 프로젝트 부트스트래핑에 특화되어 있다. 이슈나 요구사항을 자연어로 입력하면 전체 프로젝트 구조를 제안하고 단계별로 구현한다.

하지만 Claude Code가 더 나은 점도 있다:
- 프롬프트 커스터마이징 자유도가 높다
- 도메인 특화 제약조건을 더 세밀하게 줄 수 있다  
- 중간 검증과 수정이 더 유연하다

### Cursor + Agentic Workflow

Cursor IDE의 Composer 기능을 쓰면 여러 파일을 동시에 편집하면서 일관성을 유지할 수 있다. 특히 Python ↔ TypeScript 간 인터페이스 동기화에서 더 안전하다.

하지만 비용 대비 효율성을 따지면 Claude Code가 여전히 낫다. Cursor는 토큰 사용량이 많고, 큰 프로젝트에서는 컨텍스트 윈도우 제한에 걸리기 쉽다.

## 정리

- **아키텍처를 먼저 정의**하고 코드는 나중에. AI는 성급하게 구현하려고 하니까 제약을 걸어야 한다
- **점진적 구현과 단계별 검증**이 핵심. 각 단계마다 테스트 가능한 목표를 설정한다
- **제약 조건을 구체적으로** 명시한다. 특히 도메인 특화 기술(Remotion 등)에서는 더욱 중요하다
- **CLAUDE.md로 전체 맥락을 관리**하고, 멀티 언어 프로젝트에서 인터페이스 일관성을 유지한다

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
6cc0e4f — gpt-5-codex: log sample short validation

</details>