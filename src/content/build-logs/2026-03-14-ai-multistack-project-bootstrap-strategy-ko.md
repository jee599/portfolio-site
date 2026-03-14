---
title: "AI에게 복잡한 멀티스택 프로젝트 부트스트랩시키는 구조화 전략"
project: "shortsmaker"
date: 2026-03-14
lang: ko
tags: [python, typescript]
---

ShortsMaker라는 사주 기반 숏폼 비디오 생성 프로젝트를 처음부터 AI와 함께 만들었다. Python CLI + React/RemixJS 렌더러가 결합된 복잡한 멀티스택 프로젝트를 gpt-5-codex와 함께 4번의 커밋으로 완주한 과정에서 발견한 구조화 전략을 공유한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 TikTok/YouTube Shorts용 비디오를 자동 생성하는 도구다. Python으로 작성된 CLI가 데이터를 처리하고, RemixJS 기반 렌더러가 실제 비디오를 만드는 구조다.

이번 작업의 목표는 프로젝트를 완전히 처음부터 부트스트랩하는 것이었다. 단순히 코드만 만드는 게 아니라 프로젝트 구조 설계, 의존성 관리, 테스트 환경 구성까지 모든 것을 AI에게 맡겨보려 했다.

## 프로젝트 전체 아키텍처를 한번에 설계하게 하는 법

복잡한 멀티스택 프로젝트를 AI에게 맡길 때 가장 중요한 건 **전체 그림을 먼저 그리게 하는 것**이다. 코드부터 시작하면 100% 실패한다.

내가 사용한 부트스트랩 프롬프트 패턴:

> "사주 데이터를 받아서 숏폼 비디오를 생성하는 ShortsMaker 프로젝트를 설계해줘.
> 
> **기술 제약조건:**
> - Python CLI (typer 사용)로 데이터 처리 파이프라인
> - RemixJS로 비디오 렌더링 (remotion 사용)
> - 입력: JSON 형태 사주 데이터
> - 출력: 9:16 비율 mp4 파일
> 
> **먼저 만들어야 할 것:**
> 1. `PROJECT_BRIEF.md` - 프로젝트 개요와 요구사항
> 2. `ARCHITECTURE.md` - 기술 스택과 컴포넌트 다이어그램  
> 3. `README.md` - 설치와 사용법
> 4. 디렉토리 구조와 핵심 파일들
> 
> **절대 하지 말 것:**
> - 한번에 모든 코드 작성
> - 의존성 없이 독립적으로 동작 안 하는 코드
> - 테스트 불가능한 구조"

이렇게 쓰면 안 된다:
> "사주 비디오 만드는 앱 코딩해줘"

핵심은 **문서부터 만들게 하는 것**이다. `PROJECT_BRIEF.md`, `ARCHITECTURE.md` 같은 설계 문서를 먼저 작성하게 하면 AI가 전체적인 일관성을 유지하면서 작업한다.

## 단계별 검증 포인트로 품질 보장하기

프로젝트 부트스트랩에서 가장 위험한 건 **중간에 방향이 틀어지는 것**이다. 이를 막기 위해 각 단계마다 검증 포인트를 설정했다.

**1단계: 프로젝트 구조 검증**

첫 번째 커밋 후 즉시 검증 프롬프트를 던진다:

> "방금 생성한 프로젝트 구조를 검토해줘. 다음 관점에서:
> 
> 1. **빌드 가능성**: `pip install -e .`와 `npm install`이 실제로 작동하는가?
> 2. **의존성 순환**: Python과 Node.js 사이에 순환 의존성이 있는가?
> 3. **경로 문제**: 상대/절대 경로가 올바르게 설정됐는가?
> 4. **누락된 필수 파일**: `.gitignore`, `pyproject.toml`, `package.json` 설정이 완전한가?
> 
> 문제가 있으면 구체적인 수정 방안을 제시해."

**2단계: 샘플 데이터로 end-to-end 테스트**

두 번째 커밋에서는 실제 데이터 플로우를 검증한다:

> "샘플 사주 데이터(`sample_saju.json`)를 만들고, CLI에서 렌더러까지 전체 파이프라인이 동작하는지 테스트해줘.
> 
> **테스트 시나리오:**
> ```bash
> shortsmaker create-job input/profiles/sample_saju.json output/
> ```
> 
> **검증해야 할 것:**
> - JSON 스키마 validation
> - 파일 I/O 에러 핸들링
> - TypeScript 타입 호환성
> - 렌더링 파라미터 전달
> 
> 실패하는 부분이 있으면 구체적인 에러 메시지와 함께 수정해."

이 방식의 핵심은 **AI에게 자기 작업을 검증하게 하는 것**이다. 단순히 코드를 생성하는 게 아니라, 생성한 코드가 실제로 동작하는지까지 책임지게 만든다.

## 멀티스택 프로젝트에서 컨텍스트 관리 전략

Python과 Node.js가 혼재하는 프로젝트에서 가장 어려운 건 **AI가 컨텍스트를 잃어버리는 것**이다. gpt-5-codex를 사용할 때 효과적인 컨텍스트 관리 패턴을 찾았다.

**타입 정의를 먼저 공유하기**

AI가 Python과 TypeScript 사이를 오가며 작업할 때 타입 불일치가 가장 큰 문제다. 이를 해결하기 위해 `types.ts`와 `models.py`를 먼저 정의하고, 매번 프롬프트에 참조한다:

> "다음 타입 정의를 기준으로 작업해:
> 
> **Python 모델** (`src/shortsmaker/models.py`):
> ```python
> from pydantic import BaseModel
> 
> class SajuProfile(BaseModel):
>     name: str
>     birth_date: str
>     # ... 나머지 필드들
> ```
> 
> **TypeScript 타입** (`renderer/src/types.ts`):
> ```typescript
> export interface SajuProfile {
>   name: string;
>   birth_date: string;
>   // ... 나머지 필드들
> }
> ```
> 
> 이제 CLI 명령어 처리 로직을 작성해. 타입 안전성을 보장해야 함."

**파일 간 의존성을 명시적으로 설명하기**

복잡한 프로젝트에서는 파일 간 의존성을 AI가 놓치기 쉽다. 각 작업마다 의존성 다이어그램을 포함한다:

> "다음 의존성 구조를 유지하면서 렌더링 로직을 구현해:
> 
> ```
> cli.py → job.py → config.py
>    ↓
> render-job.ts → ShortsComposition.tsx → types.ts
> ```
> 
> - `job.py`는 Python 데이터를 JSON으로 직렬화
> - `render-job.ts`는 JSON을 읽어서 React 컴포넌트에 props로 전달
> - `ShortsComposition.tsx`는 실제 비디오 렌더링 담당
> 
> 각 단계에서 데이터 검증 로직도 추가해."

## 예상 가능한 함정을 미리 차단하는 프롬프팅

AI와 함께 멀티스택 프로젝트를 만들 때 반복적으로 발생하는 문제들이 있다. 이런 함정들을 프롬프트에서 미리 차단하는 게 효율적이다.

**경로 문제 미리 차단하기**

Python CLI에서 Node.js 스크립트를 호출할 때 경로 문제가 자주 발생한다:

> "CLI에서 렌더러 스크립트를 호출하는 로직을 작성해. 
> 
> **반드시 고려해야 할 것:**
> - 현재 working directory와 무관하게 동작해야 함
> - `pip install -e .`로 설치된 상황에서도 작동해야 함
> - Windows/macOS/Linux 모두 호환되어야 함
> 
> **절대 하지 말 것:**
> - 하드코딩된 절대 경로 사용
> - `../` 같은 상대 경로에 의존
> - `os.system()` 같은 불안전한 명령어 실행"

**의존성 버전 충돌 방지하기**

Node.js 프로젝트에서 의존성 버전 문제는 예측 가능하다:

> "`package.json`을 생성할 때 다음 규칙을 따라:
> 
> - 메이저 버전은 고정, 마이너/패치만 업데이트 허용 (`^` 사용)
> - peer dependencies 충돌 가능성이 있는 패키지는 정확한 버전 명시
> - `@types/*` 패키지는 메인 패키지와 호환되는 버전으로
> 
> **특히 주의할 패키지:**
> - `@remotion/cli`와 `remotion` 버전 동기화
> - React 18 기준으로 모든 React 관련 패키지 통일
> - TypeScript 5.0+ 기준으로 타입 정의"

## Claude Code 슬래시 명령어 활용 패턴

이번 작업에서는 Claude Code의 `/commit` 명령어를 적극 활용했다. 단순히 커밋 메시지만 생성하는 게 아니라, **작업의 논리적 단위를 구분하는 도구**로 사용했다.

**작업 단위를 명확히 하는 커밋 전략**

```bash
# 잘못된 방식: 모든 걸 한 커밋에
git add .
git commit -m "initial setup"

# 올바른 방식: 논리적 단위로 분할
git add pyproject.toml README.md ARCHITECTURE.md
/commit  # → "bootstrap project workspace"

git add src/shortsmaker/ renderer/package.json
/commit  # → "build saju shorts pipeline"

git add tests/ input/profiles/
/commit  # → "log sample short validation"
```

`/commit` 명령어를 사용할 때는 각 커밋이 **독립적으로 검증 가능한 단위**가 되도록 파일을 staging한다. AI가 변경사항을 보고 적절한 커밋 메시지를 생성해준다.

**코드 리뷰를 위한 `/review` 활용**

큰 변경사항을 커밋하기 전에 `/review` 명령어로 사전 검증을 받는다:

```bash
git add renderer/src/ShortsComposition.tsx
/review
```

이때 AI는 단순히 "좋다/나쁘다"가 아니라 구체적인 개선점을 제시한다:
- 타입 안전성 문제
- 성능상 문제가 될 수 있는 부분  
- 다른 파일과의 일관성
- 테스트하기 어려운 구조

## 더 나은 방법은 없을까

이번에 사용한 방식보다 더 효율적인 대안들이 있다:

**MCP 서버를 활용한 자동화**

현재는 수동으로 각 단계를 검증했지만, MCP (Model Context Protocol) 서버를 구성하면 더 자동화할 수 있다. 특히 `filesystem` MCP와 `git` MCP를 조합하면:

- 파일 변경 시 자동으로 의존성 검증
- 커밋 전 자동 테스트 실행
- 타입 호환성 자동 체크

**Agent 모드의 제한과 Interactive 모드 활용**

gpt-5-codex의 agent 모드는 긴 작업에서 컨텍스트를 잃어버리는 경향이 있다. 멀티스택 프로젝트처럼 복잡한 작업에서는 interactive 모드에서 단계별로 검증하는 게 더 안정적이다.

**공식 도구와의 조합**

Anthropic의 공식 문서에서는 큰 프로젝트를 위한 `CLAUDE.md` 설정을 권장한다. 프로젝트 루트에 다음과 같은 설정 파일을 두면 더 일관된 결과를 얻을 수 있다:

```markdown
# CLAUDE.md

## 프로젝트 구조
- Python CLI: typer + pydantic
- Renderer: RemixJS + @remotion
- 데이터 플로우: JSON 기반 통신

## 코딩 규칙
- 타입 안전성 우선
- 에러 핸들링 필수
- 테스트 가능한 구조
- 크로스 플랫폼 호환성

## 금지 사항
- 하드코딩된 경로
- 순환 의존성
- 타입 any 사용
```

**비용 최적화 관점**

gpt-5-codex는 비용이 높다. 비슷한 품질을 더 저렴하게 얻으려면:
- 설계 단계만 gpt-5 사용, 구현은 claude-3.5-sonnet
- 반복 작업(타입 정의, 보일러플레이트)은 gpt-4o
- 단순 변환 작업은 더 저렴한 모델 활용

## 정리

- **전체 아키텍처를 먼저 설계하게 하고, 코드는 나중에**: 문서부터 만들어야 일관성이 유지된다
- **각 단계마다 검증 포인트 설정**: AI가 자기 작업을 스스로 검증하게 만드는 게 핵심이다  
- **타입 정의와 의존성을 명시적으로 관리**: 멀티스택에서는 컨텍스트 관리가 성패를 좌우한다
- **예상 가능한 함정을 프롬프트에서 미리 차단**: 경로, 의존성, 호환성 문제는 반복적으로 발생한다

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace
07e6f61 — gpt-5-codex: build saju shorts pipeline  
d6e1582 — gpt-5-codex: fix repo-relative cli paths
6cc0e4f — gpt-5-codex: log sample short validation

</details>