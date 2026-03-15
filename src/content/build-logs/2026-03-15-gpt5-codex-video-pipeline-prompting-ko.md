---
title: "GPT-5 Codex로 영상 제작 파이프라인 한번에 뽑아내는 프롬프팅 전략"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

Python CLI와 React 렌더러로 구성된 영상 제작 파이프라인을 GPT-5 Codex로 4번의 커밋만에 완성했다. 단순히 "영상 만들어줘"라고 하면 절대 나올 수 없는 결과물이었다. AI에게 복잡한 시스템을 설계하게 할 때 필요한 구조화 전략과 프롬프팅 패턴을 정리한다.

## 배경: 무엇을 만들고 있는가

사주 분석 결과를 15초 숏폼 영상으로 자동 변환하는 `ShortsMaker` 시스템을 구축하고 있었다. Python으로 데이터를 처리하고, Remotion으로 React 컴포넌트를 렌더링해서 최종 MP4를 뽑는 구조다.

이전까지는 기본 골격만 있었는데, 이번에 실제로 동작하는 전체 파이프라인을 완성해야 했다. Python CLI부터 TypeScript 렌더러, 다국어 지원까지 포함해서 총 30개 파일이 추가/수정됐다.

핵심은 AI에게 "이 정도 규모의 시스템을 한번에 만들어줘"라고 시킬 때 어떻게 접근하느냐다.

## AI에게 아키텍처부터 설계시키기

처음부터 코드를 요청하면 안 된다. GPT-5 Codex든 Claude든 전체 그림 없이 코드부터 짜면 중간에 꼬인다.

먼저 시스템 설계 문서를 만들게 했다:

> "Python CLI + React 렌더러로 구성된 영상 제작 파이프라인을 설계해줘. 입력은 JSON 프로필, 출력은 MP4 영상이다. 
> 
> 요구사항:
> - Python에서 데이터 전처리 후 React 컴포넌트에 props 전달  
> - Remotion 기반 렌더링
> - 다국어 지원 (한국어/영어/일본어)
> - CLI 명령어로 전체 프로세스 실행
> 
> 먼저 아키텍처 다이어그램과 모듈 구조를 보여줘. 코드는 나중에."

이렇게 하지 않았다면:
> "사주 영상 만드는 코드 짜줘"

AI는 아키텍처 설계에서 훨씬 강력하다. 구현 디테일보다는 시스템 전체 구조를 먼저 잡게 하면 일관성 있는 설계가 나온다.

결과적으로 `ARCHITECTURE.md`와 `PROJECT_BRIEF.md`가 먼저 업데이트됐고, 이 문서를 기반으로 코드 생성을 진행했다.

## 점진적 구현 전략 — workspace bootstrapping

전체 시스템을 한번에 구현하라고 하면 AI도 헷갈린다. 대신 단계별로 쪼개서 요청했다.

**1단계: 프로젝트 뼈대 생성**

> "방금 설계한 아키텍처를 기반으로 프로젝트 workspace를 bootstrap해줘.
> 
> - `pyproject.toml` 업데이트 (dependencies 추가)
> - Python 모듈 구조 생성 (`models.py`, `job.py`, `cli.py` 등)  
> - React renderer 초기 setup (`package.json`, `tsconfig.json`)
> - 각 파일에는 TODO 주석과 기본 타입 정의만
> 
> 실제 로직 구현은 다음 단계에서 할 예정. 지금은 구조만."

이 프롬프트의 핵심은 **"실제 로직 구현은 다음 단계에서"** 부분이다. AI에게 명시적으로 scope를 제한해주지 않으면 모든 걸 다 하려고 한다.

**2단계: 핵심 파이프라인 구현**

> "이제 실제 동작 로직을 구현해줢. 우선순위:
> 
> 1. `Job` 클래스 - 영상 제작 작업 단위 관리
> 2. CLI 명령어 - `create-job`, `render` 구현  
> 3. React 컴포넌트 - 사주 데이터를 받아서 시각화
> 4. 다국어 처리 - 언어별 텍스트 매핑
> 
> 한 번에 모든 기능을 완벽하게 만들지 말고, 최소 동작 버전부터."

**3단계: validation과 테스트**

> "샘플 데이터로 전체 파이프라인이 동작하는지 검증해줘. `sample_saju.json` 만들고, 실제로 CLI 실행했을 때 오류 없이 렌더링 파일까지 생성되는지 확인."

각 단계마다 AI의 출력을 검토하고 다음 단계로 넘어갔다. 이렇게 하면 중간에 문제가 생겨도 롤백하기 쉽다.

## 멀티 언어 처리에서 빠지는 함정

다국어 지원을 AI에게 맡길 때 가장 흔한 실수가 "번역해줘"라고만 하는 것이다. 이러면 일관성 없는 번역과 하드코딩된 문자열이 곳곳에 박힌다.

대신 이렇게 접근했다:

> "`languages.py` 모듈을 만들어서 다국어 처리를 중앙화해줘.
> 
> 구조:
> - `Language` enum (KO, EN, JA)
> - `get_text(key: str, lang: Language)` 함수
> - 각 언어별 사주 용어 매핑 (천간, 지지, 오행 등)
> 
> 번역 원칙:
> - 사주 전문 용어는 한국어 원본 유지 후 괄호 안에 설명
> - UI 텍스트만 번역
> - 톤앤매너는 전문적이지만 친근하게
> 
> React 컴포넌트에서는 props로 `language`를 받아서 사용."

결과적으로 `languages.py`에 220줄의 구조화된 다국어 매핑이 생성됐다. 하드코딩 없이 깔끔한 abstraction layer가 만들어진 것이다.

AI에게 번역을 시킬 때는 **용어 일관성**과 **구조화**를 먼저 요구해야 한다.

## CLI 인터페이스 설계의 핵심

CLI 도구를 AI에게 만들게 할 때는 사용자 경험을 구체적으로 명시해야 한다. 기능 목록만 주면 엉성한 argparser 코드가 나온다.

대신 이렇게 접근했다:

> "CLI 사용 플로우를 정의해줘:
> 
> ```bash
> # 1. 새 작업 생성
> shortsmaker create-job input/profiles/sample.json --language ko --output-dir ./output
> 
> # 2. 렌더링 실행  
> shortsmaker render job-123 --preview
> 
> # 3. 상태 확인
> shortsmaker status
> ```
> 
> 각 명령어별 옵션과 오류 처리를 명시하고, help 메시지도 친절하게."

이 프롬프트의 장점은 **구체적인 사용 예시**를 보여준다는 점이다. AI가 사용자 관점에서 인터페이스를 설계할 수 있다.

결과적으로 `cli.py`에 124줄의 체계적인 명령어 처리 로직이 생성됐다. `click` 라이브러리 활용, 적절한 오류 메시지, progress bar까지 포함해서.

## React + Remotion 컴포넌트 생성 전략

Remotion은 특수한 라이브러리라서 AI가 잘못된 패턴을 쓸 가능성이 높다. 명시적으로 제약 조건을 줘야 한다.

> "Remotion 기반 React 컴포넌트를 만들어줘. 
> 
> 제약사항:
> - `useCurrentFrame()`, `useVideoConfig()` 훅 필수 사용
> - 애니메이션은 `interpolate()` 함수로만 처리  
> - 외부 이미지/폰트 로딩 금지 (렌더링 안정성)
> - 15초 (450 프레임, 30fps) 기준으로 설계
> 
> 컴포넌트 구조:
> - 메인 타이틀 (0-2초)
> - 사주 정보 표시 (2-10초) 
> - 운세 해석 (10-13초)
> - 엔딩 (13-15초)
> 
> props 타입은 Python에서 전달하는 JSON 구조와 일치시켜줘."

이렇게 구체적인 제약을 주니까 `ShortsComposition.tsx`에 194줄의 완성도 높은 컴포넌트가 나왔다. Remotion 베스트 프랙티스도 잘 지켰다.

## 통합 테스트까지 AI로 처리하기

마지막 단계에서 전체 파이프라인이 실제로 동작하는지 검증해야 했다. 이것도 AI에게 시켰다.

> "지금까지 만든 시스템이 end-to-end로 동작하는지 검증해줘.
> 
> 1. 현실적인 `sample_saju.json` 데이터 생성
> 2. CLI 명령어 실행 시 발생할 수 있는 오류 예측하고 수정
> 3. 파일 경로, 모듈 import 오류 체크
> 4. 테스트 케이스 추가 (`tests/test_cli.py`)
> 
> 실제로 렌더링까지 성공하지 않더라도, 에러 메시지가 명확하게 나와야 함."

AI가 `sample_saju.json`을 생성하고, CLI 실행 과정에서 발생할 수 있는 repo-relative path 문제를 미리 찾아서 수정했다. 테스트 코드도 25줄 추가됐다.

이런 "통합 검증" 프롬프트는 AI가 개발자 관점에서 코드를 한번 더 리뷰하게 만든다.

## 더 나은 방법은 없을까

지금까지의 방식도 효과적이었지만, 몇 가지 개선점이 있다.

**MCP 서버 활용**
Remotion이나 Python 프로젝트용 MCP 서버를 연동하면 AI가 실시간으로 문서를 참조할 수 있다. 특히 Remotion 같은 특수한 라이브러리는 최신 API 변경사항을 놓치기 쉬운데, MCP로 해결 가능하다.

**Agent 모드와 Interactive 모드 병용**
이번에는 전부 Interactive 모드로 진행했는데, bootstrap 단계는 Agent 모드가 더 적합했을 것 같다. Agent 모드에서 프로젝트 구조를 잡고, 핵심 로직 구현은 Interactive 모드로 세밀하게 조정하는 방식.

**CLAUDE.md 기반 컨텍스트 관리**
프로젝트 루트에 `CLAUDE.md` 파일을 두고 아키텍처 정보, 코딩 스타일, 제약사항을 정리해두면 매번 프롬프트에 반복 설명할 필요가 없다. 특히 다국어 번역 원칙 같은 건 `CLAUDE.md`에 박아두는 게 효율적이다.

**타입 안정성 개선**
Python과 TypeScript 간 데이터 전달에서 타입 불일치가 생길 수 있다. Pydantic 모델과 TypeScript interface를 자동 동기화하는 도구를 쓰거나, AI에게 JSON Schema 기반으로 양쪽 타입을 생성하게 하는 방법이 있다.

## 정리

- AI에게 복잡한 시스템을 만들게 할 때는 아키텍처 설계부터 시작한다
- 전체 작업을 단계별로 쪼개고, 각 단계마다 명확한 scope 제한을 준다  
- 다국어 처리는 번역 요청이 아니라 구조화 요청으로 접근한다
- CLI나 특수 라이브러리를 쓸 때는 구체적인 사용 예시와 제약사항을 명시한다

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
65f233a — gpt-5-codex: bootstrap project workspace

</details>