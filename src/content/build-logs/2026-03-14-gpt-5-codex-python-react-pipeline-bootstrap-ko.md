---
title: "GPT-5-codex로 Python-React 파이프라인 구축하기 — 0→1 프로젝트의 AI 활용 패턴"
project: "shortsmaker"
date: 2026-03-14
lang: ko
tags: [python, typescript]
---

새 프로젝트를 시작할 때 가장 큰 허들은 빈 화면이다. ShortsMaker라는 숏폼 영상 생성 파이프라인을 GPT-5-codex로 부트스트래핑하면서 발견한 AI 활용 패턴을 정리했다. 프로젝트 구조 설계부터 Python-React 연동, 검증 로직까지 AI에게 맡기고 사람은 방향만 잡는 방법이다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 분석 데이터를 받아서 TikTok/Instagram용 숏폼 영상을 자동 생성하는 파이프라인이다. Python 백엔드에서 데이터 처리와 job scheduling을 하고, React + Remotion으로 영상을 렌더링한다.

이번 작업의 목표는 명확했다. 완전히 새로운 프로젝트의 뼈대를 만들고, 실제로 작동하는 end-to-end 파이프라인을 구축하는 것이다. 5,801줄의 코드가 추가되고 34개 파일이 생성되었는데, 대부분 GPT-5-codex가 작성했다.

## AI에게 아키텍처 설계를 맡기는 법

프로젝트 초기 단계에서 가장 중요한 건 구조다. 잘못 설계하면 나중에 전체를 뜯어고쳐야 한다. GPT-5-codex에게 아키텍처를 맡길 때 효과적인 프롬프트 패턴이 있다.

**좋은 프롬프트:**

> "Python-React 파이프라인 프로젝트를 설계해줘. 요구사항:
> 1. Python 백엔드: CLI로 job을 받아서 processing 후 React renderer에 전달
> 2. React frontend: Remotion으로 영상 렌더링
> 3. 데이터 플로우: JSON input → Python processing → React component → MP4 output
> 4. 개발 환경: pyproject.toml, TypeScript, 모던 스택
> 5. 확장성: 여러 영상 템플릿 추가 가능한 구조
> 
> 디렉토리 구조, 핵심 모듈, 데이터 타입을 정의하고 ARCHITECTURE.md로 문서화해줘."

**나쁜 프롬프트:**

> "숏폼 영상 만드는 앱 구조 잡아줘"

차이점이 보이는가? 좋은 프롬프트는 기술 스택, 제약 조건, 확장성 요구사항을 명시한다. GPT-5-codex는 이런 구체적인 조건들을 받으면 `ARCHITECTURE.md`, `PROJECT_BRIEF.md` 같은 문서를 먼저 작성하고, 그 기준에 맞춰 코드를 생성한다.

실제로 생성된 아키텍처는 다음과 같다:

```
src/shortsmaker/
├── cli.py          # 진입점
├── models.py       # 데이터 타입
├── job.py          # job processing 로직
├── hooks.py        # lifecycle hooks
└── render/         # React와의 연동

renderer/
├── src/
│   ├── types.ts    # Python과 공유하는 타입
│   ├── Root.tsx    # Remotion root
│   └── ShortsComposition.tsx  # 영상 컴포넌트
└── scripts/render-job.ts      # Python에서 호출
```

이 구조는 처음에 잡은 제약 조건들을 모두 반영하고 있다. Python에서 React를 subprocess로 호출하는 패턴, 타입 안전성을 위한 공통 스키마, 템플릿 확장 가능한 컴포지션 구조까지.

## Claude Code 설정과 멀티 언어 컨텍스트 관리

프로젝트 루트에 `CLAUDE.md`를 만들어서 AI에게 프로젝트 컨텍스트를 제공한다. Python-React 혼합 프로젝트에서는 이게 특히 중요하다.

```markdown
# ShortsMaker Development Context

## 프로젝트 구조
- Backend: Python 3.11+, pyproject.toml, Click CLI
- Frontend: React 18, Remotion 4.x, TypeScript
- 데이터 플로우: CLI → Job → Renderer → Video

## 코딩 컨벤션
- Python: dataclass + pydantic, 함수형 스타일
- React: functional components, hooks
- 타입: Python TypedDict ↔ TypeScript interface 동기화

## 중요한 제약사항
- renderer/는 standalone npm 패키지로 동작
- Python subprocess로 render-job.ts 실행
- 에러 처리는 exit code + stderr로 전달
```

이렇게 설정하면 GPT-5-codex가 Python 코드를 수정할 때 TypeScript 타입도 함께 업데이트하고, 에러 처리 패턴도 일관성 있게 유지한다.

멀티 파일 작업에서는 `/compose` 커맨드를 적극 활용한다. 특히 데이터 타입이 여러 파일에 걸쳐 있을 때:

```
/compose src/shortsmaker/models.py renderer/src/types.ts
```

이렇게 하면 AI가 Python의 `SajuProfile` dataclass와 TypeScript의 `SajuProfile` interface를 동시에 보면서 타입 호환성을 보장한다.

## 검증 로직과 에러 처리를 AI에게 체계화시키는 법

새 프로젝트에서 가장 놓치기 쉬운 부분이 validation과 error handling이다. 기능 구현에만 집중하다가 edge case에서 터지는 경우가 많다.

GPT-5-codex에게 이런 프롬프트로 체계적인 검증 로직을 만들게 했다:

> "sample_saju.json을 input으로 받아서 전체 파이프라인을 테스트하는 validation 로직을 만들어줘. 단계:
> 1. JSON schema validation (필수 필드, 타입 체크)
> 2. Business logic validation (날짜 범위, enum values 등)  
> 3. Python → React 데이터 전달 검증
> 4. Render 성공/실패 확인
> 5. 각 단계별 상세한 에러 메시지와 recovery suggestion
> 
> CLI에서 `shortsmaker validate` 명령어로 실행 가능하게 하고, 문제가 있으면 정확히 어느 단계에서 왜 실패했는지 보여줘."

결과적으로 `job.py`에 `validate_saju_input()`, `validate_render_output()` 같은 함수들이 생겼고, `cli.py`에 validate 서브커맨드가 추가됐다. 각 함수는 단순히 True/False를 리턴하는 게 아니라 `ValidationResult` dataclass를 통해 구체적인 에러 정보를 제공한다.

```python
@dataclass
class ValidationResult:
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]
```

이런 구조화된 에러 처리는 AI가 특히 잘하는 영역이다. 사람이라면 "이 정도면 되겠지" 하고 넘어갈 edge case들을 빠짐없이 커버한다.

## Python-React 프로세스 간 통신 패턴

Python에서 React 프로세스를 호출할 때 가장 까다로운 부분은 에러 전파다. subprocess가 실패했을 때 왜 실패했는지, 어떻게 recovery할지를 명확하게 해야 한다.

GPT-5-codex에게 이런 제약 조건을 줬다:

> "Python subprocess로 render-job.ts를 실행할 때 robust error handling 패턴을 구현해줘:
> 1. exit code 0: 성공, stdout에 생성된 파일 경로
> 2. exit code 1: validation error, stderr에 JSON formatted error
> 3. exit code 2: render error, stderr에 Remotion error details
> 4. timeout handling (30초)
> 5. resource cleanup (temp files, processes)
> 
> Python 쪽에서는 각 에러 타입별로 다른 exception을 raise하고, 적절한 retry 로직을 포함시켜줘."

결과:

```python
class RenderError(Exception):
    def __init__(self, exit_code: int, stderr: str, stdout: str = ""):
        self.exit_code = exit_code
        self.stderr = stderr
        self.stdout = stdout
        super().__init__(f"Render failed with exit code {exit_code}")

def execute_render_job(job_data: dict, output_path: str) -> str:
    try:
        result = subprocess.run([
            "node", "renderer/scripts/render-job.ts",
            "--input", json.dumps(job_data),
            "--output", output_path
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            raise RenderError(result.returncode, result.stderr, result.stdout)
            
    except subprocess.TimeoutExpired:
        raise RenderTimeoutError("Render process exceeded 30 second timeout")
```

이런 패턴은 AI가 일관성 있게 적용하기 좋다. 한번 패턴을 정의하면 비슷한 상황에서 같은 구조를 반복 사용한다.

## 더 나은 방법은 없을까

이 글에서 다룬 부트스트래핑 패턴에는 몇 가지 개선점이 있다.

**MCP 서버 활용**: Python-TypeScript 타입 동기화를 수동으로 하는 대신, `typescript-mcp-server`를 쓰면 AI가 두 언어의 타입을 실시간으로 동기화할 수 있다. 특히 복잡한 nested object들을 다룰 때 유용하다.

**Aider 병행 사용**: GPT-5-codex는 대화형 코딩에 좋지만, 대량의 boilerplate 생성에는 Aider가 더 효율적이다. 아키텍처 설계는 Claude로, 실제 파일 생성은 Aider로 역할을 분담하면 속도가 빨라진다.

**Template-driven 접근**: 프로젝트 초기화를 매번 AI로 하는 대신, cookiecutter template을 만들어두고 프로젝트별 customization만 AI에게 맡기는 방법도 있다. 반복되는 설정 작업을 줄일 수 있다.

**GitHub Copilot Workspace 활용**: 아직 preview지만 Copilot Workspace는 이슈 → 아키텍처 → 구현까지 end-to-end로 처리한다. 0→1 프로젝트에 특화되어 있어서 이런 작업에 더 적합할 수 있다.

비용 관점에서는 GPT-5-codex 대신 Claude 3.5 Sonnet으로도 충분히 같은 결과를 낼 수 있다. 코드 생성 품질은 비슷한데 가격은 훨씬 저렴하다.

## 정리

- AI에게 아키텍처를 맡길 때는 기술 스택, 제약 조건, 확장성을 구체적으로 명시한다
- `CLAUDE.md`로 프로젝트 컨텍스트를 관리하면 멀티 언어 일관성이 향상된다
- 검증과 에러 처리는 AI가 사람보다 체계적으로 처리한다
- 프로세스 간 통신에서는 명확한 에러 처리 패턴을 미리 정의한다

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
6cc0e4f — gpt-5-codex: log sample short validation  

</details>