---
title: "GPT-5 Codex로 Shorts 생성 파이프라인 구축하기 — 프로젝트 부트스트랩 전략"
project: "shortsmaker"
date: 2026-03-14
lang: ko
tags: [python, typescript]
---

5,800줄의 새 코드를 GPT-5 Codex와 함께 4개 커밋으로 만들어냈다. 사주 기반 Shorts 생성 파이프라인을 처음부터 구축하면서 배운 AI 활용 전략을 정리한다.

## 배경: 무엇을 만들고 있는가

사주 데이터를 입력받아서 자동으로 Shorts 영상을 생성하는 파이프라인을 구축했다. Python 백엔드로 데이터를 처리하고, Remotion 기반 React 렌더러로 영상을 만드는 구조다.

커밋 로그를 보면 `gpt-5-codex:` 접두사가 모든 메시지에 붙어있다. 이건 우연이 아니다. 프로젝트 부트스트랩 단계에서 AI를 체계적으로 활용한 결과다.

## 프로젝트 부트스트랩을 AI에게 맡기는 법

### 첫 번째 원칙: 아키텍처 문서부터

`PROJECT_BRIEF.md`와 `ARCHITECTURE.md`를 먼저 만들었다. 이 파일들이 없으면 AI는 일관성 없는 코드를 뱉어낸다.

효과적인 아키텍처 문서 생성 프롬프트:

> "Python CLI 도구와 Remotion 렌더러로 구성된 Shorts 생성 파이프라인을 설계해줘. 
> 
> 요구사항:
> - 사주 JSON을 입력받아 영상 생성
> - CLI에서 `python -m shortsmaker generate profile.json` 실행
> - hooks 시스템으로 확장 가능
> - 다국어 지원 (한국어, 영어)
> - Remotion으로 React 컴포넌트 렌더링
> 
> 폴더 구조, 모듈 분리, 데이터 플로우를 명시해줘. 각 컴포넌트의 책임을 한 문장으로 설명해."

이렇게 쓰면 안 된다:

> "사주 앱 만들어줘"

구체적인 기술 스택과 제약 조건을 주지 않으면 GPT-5 Codex도 헤맨다. 특히 폴더 구조와 모듈 책임을 명시하라고 요구해야 한다.

### 워크스페이스 설정의 힘

`CLAUDE.md` 파일에 프로젝트 컨텍스트를 박아두는 것보다 더 중요한 건 **워크스페이스 일관성**이다.

```python
# pyproject.toml 설정을 AI에게 맡길 때
```

> "Python 3.11+ 프로젝트에 이 의존성들이 필요해:
> - typer (CLI)
> - pydantic (데이터 검증)
> - rich (터미널 출력)
> - pytest (테스트)
> 
> `src/shortsmaker` 구조로 installable package 만들어줘. 
> CLI 진입점은 `python -m shortsmaker`로 동작하게."

GPT-5 Codex는 `pyproject.toml` 작성을 완벽하게 처리한다. 하지만 진입점 설정은 명시적으로 요구해야 한다.

### 타입 시스템 먼저 정의하기

`src/shortsmaker/models.py`와 `renderer/src/types.ts`를 먼저 만들었다. 이게 핵심이다.

Python 모델 생성 프롬프트:

> "사주 분석 결과를 담는 Pydantic 모델들을 만들어줘.
> 
> 필드:
> - 기본 정보: 이름, 생년월일, 성별
> - 사주: 천간지지 8글자 
> - 분석 결과: 성격, 운세, 조언 (각각 다국어)
> 
> JSON serialization 가능하고, 필드 검증 포함. 
> TypeScript 타입도 같이 생성해줘."

이 프롬프트의 핵심은 **"TypeScript 타입도 같이 생성"** 부분이다. Python과 TypeScript 간 타입 동기화를 AI가 알아서 처리하게 만든다.

결과적으로 `models.py`의 Pydantic 모델과 `types.ts`의 인터페이스가 정확히 매칭된다. 수동으로 동기화할 필요가 없어진다.

## CLI와 Job 시스템 구축 전략

### 명령어 설계를 구조적으로 접근하기

`src/shortsmaker/cli.py`에서 Typer 기반 CLI를 만들 때, 단순히 "CLI 만들어줘"라고 하면 안 된다.

효과적인 CLI 생성 프롬프트:

> "Typer로 CLI를 만들어줘. 구조:
> 
> ```
> python -m shortsmaker generate input/profile.json
> python -m shortsmaker validate input/profile.json  
> python -m shortsmaker render job_123
> ```
> 
> 각 명령어는:
> - generate: JSON 검증 → Job 생성 → 렌더링 큐 추가
> - validate: JSON 스키마 검증만
> - render: 기존 Job ID로 렌더링 재시도
> 
> 에러는 Rich로 예쁘게 출력. 성공 시 Job ID와 output 경로 표시."

이 프롬프트가 좋은 이유:
1. **명령어 예시**가 있어서 인터페이스가 명확하다
2. **각 명령어의 책임**을 한 줄로 정의했다  
3. **출력 형식**까지 지정했다

GPT-5 Codex는 이런 구조적 요구사항을 매우 잘 처리한다.

### Job 시스템의 상태 관리

`src/shortsmaker/job.py`에서 Job 상태를 관리하는 로직도 AI가 만들었다. 하지만 여기서 중요한 건 **제약 조건을 명확히 주는 것**이다.

> "Job 클래스를 만들어줘. 요구사항:
> 
> - UUID 기반 job_id
> - 상태: pending → processing → completed → failed  
> - 입력: SajuProfile, 출력: 영상 파일 경로
> - JSON 직렬화 가능 (상태 저장용)
> - atomic 상태 변경 (race condition 방지)
> 
> `jobs/` 폴더에 개별 JSON 파일로 저장. 파일 이름은 `{job_id}.json`"

"atomic 상태 변경"이라는 제약을 주지 않으면 AI가 thread-safe 하지 않은 코드를 만든다. 특히 파일 기반 저장소를 쓸 때는 이런 디테일이 중요하다.

## React + Remotion 렌더러 구축하기

### 컴포넌트 구조를 먼저 설계

`renderer/src/ShortsComposition.tsx`가 194줄인데, 이걸 한 번에 생성했다. 비법은 **레이아웃부터 정의**하는 것이다.

> "9:16 세로 Shorts용 React 컴포넌트를 만들어줘.
> 
> 레이아웃:
> - 상단: 제목 + 부제목 (20% 높이)
> - 중간: 메인 콘텐츠 (60% 높이) 
> - 하단: 요약 + CTA (20% 높이)
> 
> 애니메이션:
> - 제목: 위에서 슬라이드인 (0-1초)
> - 콘텐츠: 페이드인 + 스케일 (1-2초)
> - 하단: 아래에서 슬라이드인 (2-3초)
> 
> 타입은 `types.ts`의 SajuProfile 사용. Remotion의 useCurrentFrame, interpolate 활용."

레이아웃 비율과 애니메이션 타이밍을 수치로 제시하는 게 핵심이다. "예쁘게 만들어줘"라고 하면 AI도 애매한 결과를 낸다.

### 렌더링 스크립트 자동화

`renderer/scripts/render-job.ts`도 AI가 만들었다. 이 스크립트는 Python CLI에서 호출되는 Node.js 스크립트다.

> "Remotion 렌더링 스크립트를 만들어줘.
> 
> 동작:
> 1. CLI args로 job JSON 파일 경로 받기
> 2. JSON 파싱해서 SajuProfile 추출  
> 3. Remotion renderMedia로 MP4 생성
> 4. 결과 경로를 stdout에 출력 (Python에서 파싱용)
> 
> 에러 처리: stderr로 에러 출력, exit code 설정
> 렌더링 옵션: 1080x1920, 30fps, 10초 길이"

이 프롬프트의 포인트는 **"stdout에 결과 경로 출력"** 부분이다. Python subprocess에서 결과를 파싱해야 하기 때문에 출력 형식을 명시했다.

## 테스트와 검증 자동화

### 샘플 데이터 생성 전략

`input/profiles/sample_saju.json`과 `tests/test_cli.py`를 만들 때도 AI를 활용했다.

샘플 데이터 생성 프롬프트:

> "사주 분석 샘플 JSON을 만들어줘. 실제 사주 계산 결과처럼 보여야 함.
> 
> 인물: 1990년 3월 15일 오전 10시 서울 출생 여성
> 포함할 내용:
> - 정확한 천간지지 (경오년 기묘월 신사일 계사시)
> - 성격 분석 (한국어/영어)
> - 2024년 운세 (한국어/영어) 
> - 조언 3개 (한국어/영어)
> 
> SajuProfile 타입에 맞는 valid JSON으로 생성."

GPT-5 Codex는 사주 지식도 어느 정도 알고 있다. 천간지지 계산까지 정확하게 해준다. 하지만 **"타입에 맞는 valid JSON"** 조건을 꼭 넣어야 한다.

### CLI 테스트 자동화

`tests/test_cli.py`에서 CLI 명령어들을 테스트하는데, subprocess 기반 테스트를 AI가 잘 만든다.

> "CLI 테스트를 pytest로 만들어줘.
> 
> 테스트할 명령어:
> - `python -m shortsmaker validate sample_saju.json` (성공 케이스)
> - `python -m shortsmaker validate invalid.json` (실패 케이스)
> - `python -m shortsmaker generate sample_saju.json` (Job 생성)
> 
> subprocess로 실행하고 exit code, stdout, stderr 검증.
> 임시 파일은 pytest fixture로 관리."

AI가 만든 테스트 코드는 edge case까지 잘 처리한다. 특히 파일 경로 처리나 임시 디렉토리 관리 같은 부분에서 놓치기 쉬운 디테일을 챙겨준다.

## 더 나은 방법은 없을까

### MCP 서버 활용 가능성

이번 작업은 순수 프롬프팅으로 했지만, Claude MCP 서버를 쓰면 더 효율적일 수 있다. 특히 파일 시스템 조작이 많은 프로젝트에서는 `filesystem` MCP 서버가 유용하다.

```bash
# MCP 서버로 프로젝트 구조 생성
mcp filesystem create-structure shortsmaker-project
```

### 커밋 메시지 자동화

현재는 수동으로 `gpt-5-codex:` 접두사를 붙였지만, pre-commit hook으로 자동화할 수 있다:

```python
# .git/hooks/prepare-commit-msg
import sys
if not sys.argv[2]:  # 새 커밋일 때만
    with open(sys.argv[1], 'r+') as f:
        content = f.read()
        f.seek(0)
        f.write(f'gpt-5-codex: {content}')
```

### 타입 동기화 자동화

Python과 TypeScript 타입을 수동 동기화했는데, `datamodel-code-generator` + `json-schema-to-typescript` 파이프라인으로 자동화할 수 있다:

```bash
# Pydantic → JSON Schema → TypeScript
pydantic-to-typescript src/shortsmaker/models.py renderer/src/types.ts
```

### 더 나은 프롬프팅 패턴

이번에 쓴 "요구사항 리스트" 패턴보다는 **"역할 + 제약 + 예시"** 패턴이 더 효과적이다:

> "당신은 Python/TypeScript fullstack 개발자입니다.
> 
> [제약 조건]
> - Python 3.11+, Pydantic v2 사용
> - 모든 함수에 타입 힌트 필수
> - 에러 처리는 Rich로 사용자 친화적으로
> 
> [작업]
> 사주 → Shorts 변환 CLI 만들기
> 
> [예시 출력]
> ```python
> from pydantic import BaseModel
> from typing import Dict, List
> 
> class SajuProfile(BaseModel):
>     # ...
> ```"

이 패턴이 더 일관된 코드 품질을 보장한다.

## 정리

이번 작업에서 배운 AI 활용 핵심은 다음과 같다:

- **아키텍처 문서부터 생성**해서 AI에게 맥락을 주고 시작한다
- **타입 시스템을 먼저 정의**하면 Python/TypeScript 간 동기화가 쉬워진다  
- **구체적인 제약 조건**을 주지 않으면 AI도 일관성 없는 코드를 만든다
- **샘플 데이터와 테스트**까지 AI가 만들 수 있지만 검증 조건을 명시해야 한다

5,800줄을 4개 커밋으로 만든 건 AI 덕분이지만, 그 AI를 제대로 활용하려면 **구조화된 사고**가 필요하다.

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace
07e6f61 — gpt-5-codex: build saju shorts pipeline  
d6e1582 — gpt-5-codex: fix repo-relative cli paths
6cc0e4f — gpt-5-codex: log sample short validation

</details>