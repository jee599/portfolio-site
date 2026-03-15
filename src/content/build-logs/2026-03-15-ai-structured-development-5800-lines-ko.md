---
title: "AI가 5800줄 코드를 하루에 쓰게 만드는 구조화 전략"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

한번에 5800줄 추가한 커밋 로그를 보면 "AI가 다 했네"라고 생각하기 쉽다. 틀렸다. AI는 도구일 뿐이고, 진짜 중요한 건 **어떻게 구조화해서 시키느냐**다. 이 글에서는 GPT-5-Codex로 완전히 새로운 동영상 생성 파이프라인을 구축하면서 써먹은 구조화 방법론을 공개한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 세로 동영상을 자동 생성하는 시스템이다. Python CLI로 작업을 관리하고, Remotion으로 실제 영상을 렌더링한다. 이번 작업의 목표는 아예 새로운 프로젝트를 부트스트랩하는 것이었다.

처음엔 막연히 "동영상 만드는 앱 만들어줘"라고 할 뻔했다. 그랬다면 3일은 헤맸을 거다. 대신 **계층적 접근법**을 썼다. 먼저 전체 구조를 잡고, 각 레이어를 순서대로 구현했다.

## 프로젝트 전체 맵 그리기 — 첫 프롬프트가 모든 걸 결정한다

가장 먼저 한 일은 AI에게 "전체 그림"을 그리게 하는 것이었다. 이때 중요한 건 **제약 조건을 구체적으로** 주는 거다.

> "Python CLI 도구를 만들 거야. 입력은 JSON 프로필, 출력은 MP4 동영상이다. 
> 
> 기술 스택: Python 3.11+, Remotion, TypeScript
> 아키텍처 원칙: job-based pipeline, 각 단계별 validation, 에러 복구 가능
> 
> 다음 순서로 작업해줘:
> 1. 프로젝트 구조 설계
> 2. 핵심 데이터 모델 정의  
> 3. CLI 인터페이스 설계
> 4. Remotion 컴포넌트 스켈레톤
> 
> 각 단계마다 파일 리스트와 핵심 클래스/함수명을 먼저 보여줘. 코드는 그 다음에."

이렇게 하면 AI가 "일단 코드부터 쓰고 보자" 모드에 빠지지 않는다. 대신 전체 구조를 먼저 제시하고, 내가 승인한 후에 구현에 들어간다.

**안 좋은 프롬프트:**
> "동영상 만드는 Python 앱 만들어줘"

이건 범위가 너무 넓다. AI는 추측하기 시작하고, 내가 원하지 않는 방향으로 간다.

## MCP로 멀티 레포 컨텍스트 관리하기

이 프로젝트는 Python 백엔드와 Remotion 프론트엔드가 분리되어 있다. 파일이 20개가 넘어가면 Claude의 컨텍스트 윈도우 관리가 중요해진다.

**CLAUDE.md 설정:**

```markdown
# ShortsMaker Development Context

## Project Structure
- `src/shortsmaker/`: Python CLI core
- `renderer/`: Remotion React components  
- `input/profiles/`: Sample data files

## Current Focus
Building job-based video generation pipeline

## Code Style
- Python: Pydantic models, rich CLI, pathlib
- TypeScript: strict mode, Remotion conventions
- No print() statements, use rich.console

## Key Constraints  
- All paths must be repo-relative
- Jobs must be serializable/resumable
- Validation at every pipeline stage
```

**slash commands 활용:**
- `/add renderer/src/ShortsComposition.tsx`: 특정 파일만 컨텍스트에 추가
- `/commit`: 현재 변경사항 기준으로 커밋 메시지 생성
- `/review`: 전체 코드 아키텍처 검토

특히 `/review`를 자주 썼다. AI가 작성한 코드가 초기 설계 원칙을 벗어나지 않았는지 체크할 때 유용하다.

## 데이터 모델부터 시작하는 bottom-up 구현

대부분 사람들이 UI부터 만들고 싶어한다. 잘못된 접근이다. **데이터 구조가 명확하지 않으면 AI도 일관성 없는 코드를 만든다.**

먼저 `models.py`를 정의했다:

> "사주 프로필 데이터 구조를 Pydantic 모델로 만들어줘. 
> 
> 필수 필드: 이름, 생년월일, 성별, 사주 원국
> 옵션 필드: 대운, 년운, 특이사항
> 
> 각 필드는 validation 룰이 있어야 하고, JSON schema 생성 가능해야 해."

이렇게 데이터 모델을 먼저 확정하고 나면, 나머지 모든 컴포넌트가 이 구조를 참조한다. CLI 파라미터, React 컴포넌트 props, 심지어 에러 메시지까지 일관성이 생긴다.

**중요한 패턴:** AI에게 "이 데이터 모델을 변경하려면 반드시 나한테 물어보라"는 제약을 걸어뒀다. 그래야 나중에 호환성 문제가 안 생긴다.

## 파이프라인 단계별로 작업 쪼개기

5800줄을 한번에 작성한 게 아니다. 각 파이프라인 단계를 별도 세션으로 나눠서 작업했다:

1. **Data Validation 단계** (`job.py`, `models.py`)
2. **CLI Interface 단계** (`cli.py`, hooks 시스템)  
3. **Rendering Pipeline 단계** (Remotion 컴포넌트들)
4. **Integration 단계** (테스트, 샘플 데이터)

각 단계마다 다른 프롬프트 전략을 썼다:

**데이터 validation 단계:**
> "에러가 발생할 수 있는 모든 케이스를 생각해서 validation을 만들어줘. 사용자가 이상한 데이터를 넣어도 친화적인 에러 메시지가 나와야 해."

**CLI 단계:**  
> "rich 라이브러리로 progress bar와 색깔 있는 출력을 만들어줘. 각 명령어는 `--dry-run` 옵션을 지원해야 하고, verbose 모드가 있어야 해."

**Remotion 단계:**
> "9:16 세로 비율 동영상이야. 텍스트 가독성을 최우선으로 하고, 애니메이션은 subtle하게. 사주 데이터를 시각적으로 표현할 때는 전통적인 색상 팔레트를 써줘."

## hooks 시스템으로 에이전트 모드 활용하기

`hooks.py` 파일을 보면 256줄이다. 이건 사람이 직접 짜기 어려운 양이다. 대신 **agent 모드**를 활용했다.

> "Python CLI에서 pre/post hooks 시스템을 만들어줘. 
> 
> 요구사항:
> - 각 작업 전후로 custom 함수 실행 가능
> - 환경변수로 hook 활성화/비활성화
> - hook 실행 실패 시 전체 작업 중단 여부 선택 가능
> - rich로 hook 실행 상태 시각화
> 
> 참고할 패턴: git hooks, pytest hooks
> 
> 30분 안에 완전히 작동하는 버전을 만들어줘."

마지막 줄이 핵심이다. **시간 제한을 주면** AI가 완벽함보다 실용성에 집중한다. 실제로 첫 번째 버전이 거의 완벽했다.

## 반복 작업 패턴화하기

같은 종류의 작업이 반복될 때는 **템플릿 프롬프트**를 만들어둔다. 

예를 들어 새로운 CLI 명령어를 추가할 때마다 쓰는 프롬프트:

> "[COMMAND_NAME] 명령어를 추가해줘.
> 
> 기본 패턴:
> - `cli.py`에 새 함수 추가
> - rich로 progress indicator 
> - `--dry-run`, `--verbose` 옵션 지원
> - 에러 처리는 기존 명령어와 동일한 패턴
> - `tests/test_cli.py`에 테스트 추가
> 
> 이번 명령어 특이사항: [구체적인 요구사항]"

이렇게 하면 매번 같은 설명을 반복하지 않아도 되고, 코드 일관성도 유지된다.

## 더 나은 방법은 없을까

이 프로젝트를 다시 한다면 몇 가지 다르게 할 것들이 있다:

**1. Cursor IDE 활용**
Claude Code보다는 Cursor IDE가 멀티파일 작업에 더 적합하다. 특히 Python-TypeScript 같은 크로스 언어 프로젝트에서는 Cursor의 codebase indexing이 훨씬 정확하다.

**2. Anthropic의 새로운 MCP servers**
최근에 나온 `@filesystem` MCP server를 쓰면 파일 시스템 작업을 더 효율적으로 할 수 있다. 지금은 수동으로 파일 경로를 지정했지만, MCP server가 자동으로 관련 파일들을 찾아준다.

**3. 더 세분화된 커밋 전략**
지금은 4개 큰 커밋으로 했는데, 각 모듈별로 더 잘게 나누는 게 좋겠다. 특히 Remotion 컴포넌트는 하나씩 별도 커밋으로 하면 나중에 롤백하기 편하다.

**4. 테스트 우선 개발**
`test_cli.py`를 마지막에 추가했는데, 처음부터 테스트를 함께 생성하게 하는 게 낫다. AI가 테스트 케이스를 먼저 작성하면 더 견고한 코드가 나온다.

## 정리

- **계층적 접근**: 전체 구조 설계 → 데이터 모델 → 개별 컴포넌트 순서로 진행한다
- **제약 조건 명시**: 기술 스택, 아키텍처 원칙, 시간 제한을 구체적으로 제시한다  
- **단계별 세션 분리**: 큰 작업을 파이프라인 단계로 나눠서 각각 다른 프롬프트 전략을 쓴다
- **템플릿화**: 반복되는 작업 패턴은 재사용 가능한 프롬프트로 만들어둔다

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline
65f233a — gpt-5-codex: bootstrap project workspace

</details>