---
title: "GPT-5-Codex로 영상 제작 파이프라인 만들기 — 프롬프트 엔지니어링의 실전 패턴"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

이번에 ShortsMaker라는 사주 분석 숏폼 영상 자동 생성 파이프라인을 처음부터 만들었다. Python CLI부터 React 기반 렌더러까지, 5800줄 코드를 4번의 커밋으로 뚝딱 만들어냈다. 핵심은 GPT-5-Codex에게 어떻게 프롬프트를 날렸느냐다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 시각적인 숏폼 영상으로 변환하는 도구다. 사주 입력 → 스크립트 생성 → 시각 효과 렌더링 → 최종 영상 출력까지의 전체 파이프라인이 목표였다.

처음엔 빈 레포지토리였다. `bootstrap project workspace` 커밋부터 시작해서 Python CLI, React 렌더러, 타입 정의, 설정 파일까지 모든 걸 AI에게 시켰다. 중요한 건 이 과정에서 써먹은 프롬프팅 패턴들이다.

## 아키텍처부터 시키지 마라 — 컨텍스트 우선 전략

첫 번째 실수는 "사주 영상 만드는 앱 만들어줘"라고 던지는 거다. GPT-5-Codex가 아무리 똑똑해도 내 머릿속 요구사항을 읽을 순 없다.

대신 이렇게 시작했다:

> "다음 JSON 샘플을 보고, 이걸 처리할 수 있는 Python CLI 도구를 설계해줘. 사주 프로필 데이터가 입력이고, 최종적으로는 9:16 세로형 영상이 나와야 한다. 중간에 어떤 단계들이 필요한지 먼저 정리해."

실제 데이터부터 보여주는 게 핵심이다. `input/profiles/sample_saju.json`을 먼저 만들고, 이걸 기준으로 전체 구조를 역산하게 했다. "일해줘"가 아니라 "이 데이터로 뭘 할 건지 생각해봐"부터 시작한 거다.

GPT-5-Codex는 이런 bottom-up 접근을 좋아한다. 추상적인 요구사항보다는 구체적인 input/output 샘플이 있으면 훨씬 정확한 아키텍처를 제안한다.

결과적으로 `ARCHITECTURE.md`에서 Python 처리부와 React 렌더링부를 분리하는 깔끔한 구조가 나왔다. 이건 처음부터 "마이크로서비스로 만들어"라고 시켰어도 못 얻었을 설계다.

## 타입 정의가 프롬프트 품질을 결정한다

두 번째 패턴은 타입부터 만들라는 거다. `renderer/src/types.ts`를 보면 사주 데이터 구조가 모두 TypeScript interface로 정의되어 있다.

이게 왜 중요한가? 이후 모든 프롬프트에서 "이 타입에 맞춰서"라는 제약 조건을 걸 수 있기 때문이다.

React 컴포넌트를 생성할 때 쓴 프롬프트:

> "`SajuProfile` 타입을 받아서 9:16 비율의 숏폼 영상용 컴포넌트를 만들어줘. 천간지지는 한자로, 해석은 한글로 표시. 애니메이션은 `framer-motion` 사용. 색상은 오행(五行) 기반으로."

타입 정의가 없었으면 "사주 데이터를 표시하는 컴포넌트"라고 모호하게 시켰을 거다. 그럼 GPT는 자기 맘대로 데이터 구조를 가정하고 만든다. 나중에 실제 데이터와 안 맞으면 디버깅 지옥이다.

`renderer/src/ShortsComposition.tsx`를 보면 194줄 짜리 복잡한 컴포넌트가 한 번에 나왔다. 타입 제약이 있으니까 GPT가 실수할 여지가 없었던 거다.

## 프로젝트 컨텍스트 파일 — CLAUDE.md의 진화판

세 번째는 프로젝트 전체 맥락을 AI에게 어떻게 전달하느냐다. `PROJECT_BRIEF.md`와 `ARCHITECTURE.md`를 따로 만든 이유가 있다.

`PROJECT_BRIEF.md`:
- 뭘 만드는지 (사주 숏폼 제작기)
- 누가 쓸지 (콘텐츠 크리에이터)
- 어떤 플랫폼인지 (YouTube Shorts, TikTok)
- 핵심 차별점 (한국 전통 사주를 현대적 UI로)

`ARCHITECTURE.md`:
- 기술 스택 (Python + React + Remotion)
- 모듈 분리 전략
- 데이터 흐름
- 렌더링 파이프라인

이 두 파일을 매번 프롬프트 맨 앞에 붙인다. "이 프로젝트 컨텍스트에 맞게"라는 전제 조건이 깔리는 거다.

효과가 확실하다. `src/shortsmaker/languages.py`에서 223줄짜리 다국어 처리 모듈을 만들 때도, 사주 용어의 특수성을 고려한 번역 로직이 바로 나왔다. 일반적인 i18n이 아니라 "사주 앱의 다국어"로 이해한 거다.

## CLI 설계에서 써먹은 점진적 복잡화 전략

네 번째 패턴은 복잡한 CLI를 어떻게 점진적으로 만들어가느냐다. `src/shortsmaker/cli.py`를 보면 124줄인데, 한 번에 이걸 다 만들라고 하면 GPT도 헷갈린다.

대신 이런 순서로 쪼갰다:

1. 기본 명령어 구조만 (`shortsmaker --help`)
2. 단일 파일 처리 (`shortsmaker process input.json`)
3. 배치 처리 추가 (`shortsmaker batch --input-dir`)
4. 렌더링 옵션들 (`--format`, `--quality`, `--output`)
5. 훅 시스템 연동 (`--hooks`)

각 단계마다 "이전 코드를 기반으로 XX 기능을 추가해줘"라고 프롬프트를 날렸다. 전체를 갈아엎지 말고 incremental하게 확장하라는 지시가 핵심이다.

결과적으로 `argparse` 기반의 깔끔한 CLI가 나왔다. 서브커맨드, 옵션 validation, 에러 핸들링까지 모두 포함된 상태로.

## 훅 시스템 — AI에게 확장성을 가르치는 법

다섯 번째는 확장 가능한 아키텍처를 어떻게 AI에게 설명하느냐다. `src/shortsmaker/hooks.py`를 보면 256줄짜리 플러그인 시스템이 있다.

이걸 만들 때 쓴 프롬프트:

> "사주 데이터 처리 파이프라인에 훅 시스템을 추가하고 싶다. `pre_process`, `post_process`, `pre_render`, `post_render` 단계에서 커스텀 로직을 꽂을 수 있게. Python의 `importlib`를 써서 플러그인 방식으로. Django middleware 패턴 참고해."

핵심은 **기존 패턴을 레퍼런스로 주는 것**이다. "Django middleware 패턴 참고해"라는 한 줄이 있으니까 GPT가 정확히 어떤 구조를 원하는지 이해한다.

결과물을 보면 `HookRegistry` 클래스, decorator 기반 등록, 비동기 훅 지원까지 모두 Django스러운 패턴으로 나왔다. "확장 가능하게 만들어줘"라고 모호하게 시켰으면 절대 이런 퀄리티가 안 나왔을 거다.

## 테스트 주도 프롬프팅

여섯 번째는 테스트부터 만들게 하는 거다. `tests/test_cli.py`를 보면 CLI 동작을 검증하는 테스트들이 있다.

일반적으로는 "기능 만들고 테스트 추가해줘" 순서로 하는데, 이걸 뒤집었다:

> "사주 프로필 JSON을 받아서 영상 렌더링 job을 생성하는 CLI의 테스트 케이스부터 만들어줘. 성공 케이스, 파일 없음, 잘못된 JSON, 권한 오류 등을 커버해."

테스트가 먼저 나오면 GPT가 실제 구현할 때 이 테스트를 통과하는 방향으로 코드를 짠다. 일종의 specification 역할을 하는 거다.

`test_cli.py`에 25줄이 추가된 걸 보면 edge case 처리가 꼼꼼하다. `FileNotFoundError`, `JSONDecodeError`, `PermissionError`별로 다른 exit code를 반환하는 로직까지 들어가 있다.

## 더 나은 방법은 없을까

지금 보니 몇 가지 아쉬운 부분이 있다.

**MCP 서버를 활용하지 못한 점**이 첫 번째다. 현재는 매번 프롬프트에 컨텍스트 파일을 붙이는 방식인데, Model Context Protocol을 쓰면 프로젝트 구조를 persistent하게 유지할 수 있다. Anthropic의 공식 MCP 서버 중에 `filesystem`이나 `git` 서버를 쓰면 더 효율적일 것 같다.

**코드 리뷰 자동화**도 빠진 부분이다. GPT-5-Codex가 생성한 코드를 다른 AI 에이전트가 리뷰하는 파이프라인을 만들 수 있었을 텐데. Claude의 `/review` 명령어나 GitHub Copilot의 코드 스캔 기능을 연동하면 품질 검증이 더 탄탄해진다.

**프롬프트 버전 관리**도 아쉽다. 효과적인 프롬프트를 찾으면 이걸 템플릿화해서 재사용해야 하는데, 지금은 그때그때 즉흥적으로 썼다. OpenAI의 Prompt Engineering Guide에서 제안하는 few-shot prompting이나 chain-of-thought 패턴을 체계적으로 적용하면 더 좋았을 것 같다.

**타입 안전성** 측면에서도 개선 여지가 있다. 현재는 Python과 TypeScript 타입 정의가 따로 관리되는데, `pydantic`으로 Python 모델을 만들고 `pydantic-to-typescript` 같은 도구로 자동 변환하면 더 일관성 있게 갈 수 있다.

## 정리

- 추상적 요구사항보다 구체적인 input/output 샘플부터 보여주면 AI가 더 정확한 아키텍처를 제안한다
- 타입 정의를 먼저 만들고 이걸 모든 후속 프롬프트의 제약 조건으로 활용하면 일관성이 올라간다
- 프로젝트 컨텍스트 파일(BRIEF, ARCHITECTURE)을 만들어두고 매번 참조시키면 맥락 이해도가 높아진다
- 복잡한 기능은 점진적으로 확장하라고 지시하고, 기존 패턴(Django middleware 등)을 레퍼런스로 주면 품질이 올라간다

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace

07e6f61 — gpt-5-codex: build saju shorts pipeline

d6e1582 — gpt-5-codex: fix repo-relative cli paths

6cc0e4f — gpt-5-codex: log sample short validation

</details>