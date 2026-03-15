---
title: "Python-Node 혼합 프로젝트에서 Claude Code로 전체 파이프라인 구축하는 프롬프팅 패턴"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

5800줄 코드를 하루 만에 생성했다. Python CLI부터 React 렌더링까지, 완전히 다른 기술 스택을 엮어서 숏폼 비디오 생성 파이프라인을 만드는 작업이었다. Claude Code로 이런 규모의 멀티 언어 프로젝트를 구축할 때 어떤 프롬프팅 전략이 효과적인지 정리했다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 분석 데이터를 받아서 TikTok/YouTube Shorts용 세로형 비디오를 자동 생성하는 파이프라인이다. Python으로 데이터 처리와 CLI를 만들고, Node.js + React로 실제 비디오 렌더링을 하는 구조다.

이번 작업의 목표는 프로젝트 전체 골격을 만드는 것이었다. 빈 저장소에서 시작해서 Python 패키지 구조, CLI 인터페이스, React 컴포넌트, 렌더링 스크립트까지 모든 레이어를 연결해야 했다. 각 언어별로 다른 관습과 패턴이 있는데, 이걸 AI에게 일관되게 시키는 게 핵심이었다.

## 전체 아키텍처를 먼저 합의하기

멀티 언어 프로젝트에서 가장 중요한 건 AI와 전체 구조에 대해 먼저 합의하는 것이다. 각 기술별로 따로 작업하면 나중에 연결할 때 무조건 문제가 생긴다.

내가 쓴 첫 번째 프롬프트는 이렇다:

> "Python CLI → JSON 데이터 → Node.js 스크립트 → React 컴포넌트 → 비디오 파일"의 전체 플로우를 설계해줘. 각 단계의 입출력 형식과 파일 구조를 명확히 정의하고, `pyproject.toml`, `package.json`, 그리고 TypeScript 타입까지 일관된 스키마로 만들어.

이렇게 하면 안 된다:

> "Python CLI 만들어줘"

첫 번째 프롬프트에서 전체 데이터 플로우를 정의하지 않으면, AI가 Python에서는 snake_case를 쓰고 TypeScript에서는 camelCase를 쓰는 식으로 일관성이 깨진다. `SajuProfile` 타입을 Python에서는 `dict`로 정의하고 TypeScript에서는 `interface`로 따로 만들면서 필드명이 미묘하게 달라지는 문제도 생긴다.

CLAUDE.md에 이런 제약 조건을 박아넣었다:

```markdown
# 데이터 스키마 일관성 규칙
- 모든 JSON 필드는 camelCase 사용 (Python도 예외 없음)
- 타입 정의는 TypeScript를 기준으로, Python은 TypedDict로 매핑
- 파일 경로는 프로젝트 루트 기준 상대경로로 통일
- CLI 명령어와 React prop명은 동일한 네이밍 사용
```

이렇게 하니까 `sample_saju.json`의 스키마와 `ShortsComposition.tsx`의 props가 완벽하게 일치했다. AI가 중간에 혼동하지 않는다.

## 점진적 복잡도 증가 패턴

5800줄을 한 번에 생성하라고 하면 무조건 실패한다. 대신 이런 순서로 점진적으로 복잡도를 늘렸다:

**1단계: 스켈레톤 코드**
> "Python CLI 기본 구조만 만들어. `click` 기반으로 `process`, `render` 서브커맨드만 있고, 각각 "TODO" 출력하는 수준"

**2단계: 데이터 모델 추가**
> "이제 `models.py`에 TypedDict로 사주 데이터 스키마 정의하고, `sample_saju.json` 파일도 만들어. CLI에서 JSON 읽어서 validation 하는 기능까지"

**3단계: React 렌더링 레이어**
> "`sample_saju.json` 데이터를 받아서 세로형 비디오 레이아웃으로 표시하는 React 컴포넌트 만들어. Remotion 없이 순수 React로, 나중에 headless 렌더링할 예정"

**4단계: 파이프라인 연결**
> "Python CLI에서 Node.js 스크립트를 subprocess로 호출해서 렌더링 트리거하는 부분 완성해. 에러 핸들링과 로깅도 제대로"

각 단계마다 이전 단계의 출력물을 검증하고 문제가 없을 때만 다음으로 넘어갔다. 특히 Python과 TypeScript 사이의 타입 호환성은 매 단계마다 확인했다.

Claude Code의 `/test` slash command가 여기서 엄청 유용했다. 각 단계 완료 후에 `/test src/shortsmaker/cli.py` 이런 식으로 즉시 검증할 수 있다.

## 경로와 환경 설정을 명확히 하기

멀티 언어 프로젝트에서 가장 자주 터지는 부분이 경로와 환경 설정이다. Python 스크립트에서 Node.js를 호출할 때 상대경로가 꼬이거나, 환경변수가 전달되지 않는 문제가 생긴다.

이런 프롬프트로 해결했다:

> "Python CLI와 Node.js 스크립트가 모두 프로젝트 루트에서 실행된다고 가정하고 경로 처리해. Python에서 `renderer/scripts/render-job.ts`를 호출할 때 `cwd=Path(__file__).parent.parent`로 루트 디렉토리 보장하고, 모든 상대경로는 이 기준으로 계산해"

그리고 환경 설정은 `.env.example` 파일을 먼저 만들고, Python과 Node.js가 같은 환경변수를 참조하도록 했다:

```
OPENAI_API_KEY=your_openai_api_key_here
OUTPUT_DIR=output
```

Python `config.py`와 TypeScript `types.ts`에서 같은 키를 사용하도록 강제했다. 이렇게 안 하면 Python에서는 `OUTPUT_PATH`로 쓰고 Node.js에서는 `outputDir`로 쓰는 식으로 일관성이 깨진다.

## React 컴포넌트 생성 시 제약 조건 설정

React 컴포넌트를 AI에게 맡길 때는 디자인 시스템과 레이아웃 제약을 명확히 줘야 한다. 특히 세로형 비디오 렌더링이라는 특수한 용도였기 때문에 일반적인 웹 컴포넌트와 다른 접근이 필요했다.

> "9:16 비율 세로형 레이아웃으로 React 컴포넌트 만들어. 1080x1920px 고정 크기, Flexbox로 상단 제목/중단 메인콘텐츠/하단 액션으로 3분할, 모든 텍스트는 모바일에서 가독성 좋게 최소 18px 이상, 애니메이션 없이 정적 렌더링만"

여기서 핵심은 "애니메이션 없이 정적 렌더링만"이라는 제약이다. 이걸 안 주면 AI가 Framer Motion이나 CSS 애니메이션을 넣는데, 나중에 headless 렌더링할 때 타이밍 문제가 생긴다.

색상과 폰트도 미리 정의했다:

> "색상은 다크테마 기준으로 배경 #1a1a1a, 주요 텍스트 #ffffff, 보조 텍스트 #cccccc, 포인트 컬러 #ff6b35만 사용. 폰트는 시스템 폰트 스택 `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`만"

이렇게 하니까 `ShortsComposition.tsx`가 194줄로 생성됐는데, 디자인 일관성이 완벽했다. AI가 중간에 다른 색상이나 폰트를 섞어 쓰지 않는다.

## 에러 핸들링과 로깅을 처음부터 포함시키기

프로토타입 단계에서도 에러 핸들링과 로깅을 빼먹으면 나중에 디버깅이 지옥이 된다. 특히 Python-Node.js 파이프라인에서는 어느 단계에서 실패했는지 추적이 어렵다.

이런 프롬프트로 로깅을 강제했다:

> "모든 함수에 입력 파라미터와 실행 결과를 DEBUG 레벨로 로깅하고, 외부 프로세스 호출 시에는 명령어와 반환코드를 INFO 레벨로 남겨. subprocess 실패 시 stderr 내용도 포함해서 예외 발생시켜"

그 결과 `job.py`에서 Node.js 스크립트 호출 부분이 이렇게 나왔다:

```python
logger.info(f"Executing render command: {' '.join(cmd)}")
result = subprocess.run(cmd, capture_output=True, text=True, cwd=project_root)

if result.returncode != 0:
    logger.error(f"Render command failed with code {result.returncode}")
    logger.error(f"stderr: {result.stderr}")
    raise RuntimeError(f"Rendering failed: {result.stderr}")

logger.info("Render command completed successfully")
```

이런 로깅이 있으면 나중에 파이프라인이 어디서 터졌는지 바로 안다. AI가 try-catch 블록도 적절히 추가해서 각 단계별 실패 지점을 명확히 구분한다.

## 테스트 코드도 함께 생성하기

프롬프트에 "테스트 코드도 만들어줘"라고 추가하는 것만으로 전체 코드 품질이 크게 올라간다. AI가 edge case를 고려하면서 코드를 작성하기 때문이다.

> "CLI 각 서브커맨드마다 정상 케이스와 실패 케이스 테스트 만들어. 파일 없음, JSON 스키마 오류, Node.js 프로세스 실패 상황 포함. `pytest` 기반으로"

그 결과 `test_cli.py`에 25줄 테스트가 추가됐는데, 실제로 JSON validation 로직에서 버그를 찾아냈다. AI가 테스트를 먼저 만들고 그에 맞춰서 실제 코드를 수정하는 패턴이다.

## 더 나은 방법은 없을까

이 프로젝트를 다시 만든다면 몇 가지 개선점이 있다:

**MCP 서버 활용**: Claude Code 대신 `mcp-server-filesystem`과 `mcp-server-git`을 조합하면 더 정교한 파일 관리가 가능하다. 특히 Python과 TypeScript 파일을 동시에 수정할 때 컨텍스트 유지가 더 잘 된다.

**타입 스키마 중앙화**: JSON Schema를 먼저 정의하고, 여기서 Python TypedDict와 TypeScript interface를 자동 생성하는 방식이 더 안전하다. `dataclasses-json`이나 `quicktype` 같은 도구를 활용할 수 있다.

**Docker Compose 활용**: Python과 Node.js 환경을 Docker로 격리하면 경로와 환경변수 문제가 깔끔하게 해결된다. AI에게 `docker-compose.yml`부터 만들라고 시키는 게 좋다.

**Monorepo 도구 사용**: `nx`나 `lerna` 같은 monorepo 도구를 쓰면 Python과 Node.js 프로젝트를 더 체계적으로 관리할 수 있다. 특히 공유 타입 정의나 스크립트 실행이 편하다.

**GitHub Copilot Workspace 비교**: 최근 GitHub Copilot Workspace가 멀티파일 편집 기능을 강화했는데, 이런 대규모 초기 설정 작업에는 Claude Code보다 더 적합할 수 있다. 특히 git 통합과 PR 생성 기능이 강점이다.

## 정리

- 멀티 언어 프로젝트에서는 데이터 스키마 일관성이 첫 번째 우선순위다
- 점진적 복잡도 증가로 5000줄 이상도 안정적으로 생성할 수 있다
- 경로와 환경 설정은 프롬프트에서 명시적으로 제약해야 한다
- 에러 핸들링과 테스트를 처음부터 포함시키면 전체 품질이 올라간다

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation

d6e1582 — gpt-5-codex: fix repo-relative cli paths  

07e6f61 — gpt-5-codex: build saju shorts pipeline

65f233a — gpt-5-codex: bootstrap project workspace

</details>