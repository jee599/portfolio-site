---
title: "Python CLI와 React 렌더러를 한번에 구축하는 AI 에이전트 활용법"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

5800줄의 코드를 4번의 커밋으로 완성했다. Python CLI 도구와 React 기반 비디오 렌더러를 처음부터 끝까지 AI에게 맡겨서 만든 과정을 정리한다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 숏폼 비디오로 렌더링하는 도구다. Python으로 작성된 CLI가 사주 프로필을 분석하고, React + Remotion으로 만든 렌더러가 실제 비디오를 생성한다.

이번 작업의 목표는 단순했다. 완전히 빈 상태에서 시작해서 `shortsmaker create-job sample_saju.json`을 실행하면 비디오가 나오는 파이프라인을 만드는 것이다. 문제는 Python CLI 개발 경험이 부족했고, Remotion 설정도 처음이라는 점이었다.

그래서 GPT-5-codex를 활용한 코드 생성 에이전트에게 전체 구조를 맡기기로 했다.

## 에이전트에게 전체 아키텍처 설계 맡기기

가장 중요한 건 첫 번째 프롬프트다. 모호하게 시키면 쓸모없는 boilerplate만 나온다.

나쁜 프롬프트:
> "Python CLI 도구를 만들어줘"

효과적인 프롬프트:

> Python CLI 도구와 React 렌더러로 구성된 비디오 생성 파이프라인을 설계해라.
> 
> **요구사항:**
> - CLI는 `shortsmaker create-job profile.json`으로 작업 생성
> - job.json 파일을 생성해서 React 렌더러에 전달
> - 렌더러는 Remotion 기반, TypeScript 사용
> - 사주 데이터 구조: 십성, 오행, 운세 분석 포함
> - 9:16 비율 숏폼 비디오 출력
> 
> **파일 구조:**
> - `src/shortsmaker/`: Python 패키지
> - `renderer/`: React + Remotion 프로젝트
> - CLI 명령어는 pyproject.toml entry-points로 등록
> 
> **제약사항:**
> - pydantic으로 데이터 검증 필수
> - CLI 에러 처리 robust하게
> - 렌더러 타입 안전성 보장
> 
> 전체 프로젝트 구조를 먼저 설명하고, 핵심 파일들을 순서대로 구현해라.

핵심은 **구체적인 요구사항 + 제약사항 + 원하는 결과물**을 명확하게 제시하는 것이다. "좋은 코드를 써달라"는 추상적 요청 대신 "pydantic 검증", "entry-points 등록" 같은 구체적 기술 요구사항을 준다.

결과적으로 에이전트는 `models.py`, `cli.py`, `job.py`, `hooks.py` 등 체계적인 모듈 구조를 제안했고, 각 파일의 역할과 인터페이스를 먼저 설명한 후 구현에 들어갔다.

## 점진적 구현과 검증 패턴

5800줄을 한 번에 만들지 않았다. 4단계로 나누어서 각 단계마다 검증했다:

**1단계: 프로젝트 스켈레톤** (`65f233a`)
- `pyproject.toml` 설정
- 기본 모듈 구조
- CLI entry point 등록

> 프로젝트 뼈대만 만들고 `pip install -e .`으로 설치 테스트부터 해라. CLI 명령어가 등록되는지 확인하고 다음 단계로 넘어간다.

**2단계: 핵심 파이프라인** (`07e6f61`)
- 사주 데이터 모델링 (`models.py`)
- job 생성 로직 (`job.py`)
- CLI 명령어 구현 (`cli.py`)
- React 렌더러 기본 구조

> 이제 `shortsmaker create-job sample.json` 명령어가 작동해야 한다. job.json이 생성되고 렌더러 프로젝트가 설치되는지 확인해라.

**3단계: 경로 수정과 안정화** (`d6e1582`)
- repo-relative path 처리
- CLI 에러 핸들링 강화

**4단계: 검증과 로깅** (`6cc0e4f`)
- 샘플 데이터로 전체 플로우 테스트
- 로그 출력 개선

각 단계마다 에이전트에게 "실제로 실행해보고 에러가 나면 수정해라"라고 지시했다. 이게 핵심이다. 코드를 쓰고 끝이 아니라 동작 검증까지 포함해서 작업을 정의한다.

## React + Python 혼합 프로젝트 다루는 법

가장 까다로운 부분은 Python CLI와 React 렌더러 간의 인터페이스였다. 두 개의 완전히 다른 실행 환경이 데이터를 주고받아야 한다.

해결책은 **타입 정의를 양쪽에서 공유**하는 것이었다:

> Python의 pydantic 모델을 기준으로 TypeScript 타입 정의를 생성해라. 
> 
> ```python
> class SajuProfile(BaseModel):
>     name: str
>     birth_year: int
>     elements: Dict[str, int]
>     fortune_analysis: List[str]
> ```
> 
> 이거를 TypeScript 인터페이스로 변환하되, 필드명과 타입이 정확히 일치해야 한다. JSON 직렬화/역직렬화에서 타입 불일치가 없도록 주의해라.

에이전트는 `src/shortsmaker/models.py`의 pydantic 모델을 분석해서 `renderer/src/types.ts`의 TypeScript 인터페이스를 자동 생성했다:

```python
# Python
class SajuAnalysis(BaseModel):
    profile: SajuProfile
    zodiac_reading: str
    element_balance: Dict[str, float]
    fortune_predictions: List[str]
```

```typescript
// TypeScript
interface SajuAnalysis {
  profile: SajuProfile;
  zodiac_reading: string;
  element_balance: Record<string, number>;
  fortune_predictions: string[];
}
```

이 패턴의 장점은 **컴파일 타임에 인터페이스 불일치를 잡을 수 있다**는 것이다. Python에서 JSON을 생성할 때와 TypeScript에서 파싱할 때 구조가 다르면 즉시 에러가 난다.

## Remotion 설정 자동화의 함정과 해결책

Remotion은 설정이 까다롭다. 특히 TypeScript 설정과 dependency 관리에서 자주 에러가 난다.

처음에는 이렇게 시켰다:

> "Remotion 프로젝트를 설정해줘"

결과는 참담했다. 버전 충돌, 타입 에러, 빌드 실패가 연달아 터졌다.

더 구체적으로 접근했다:

> Remotion 3.4 기준으로 React + TypeScript 프로젝트를 설정해라.
> 
> **필수 패키지:**
> - @remotion/cli, @remotion/renderer (정확한 버전 명시)
> - React 18.x와 호환되는 타입 정의
> - 사주 데이터 시각화용 추가 패키지 (chart.js 등)
> 
> **설정 요구사항:**
> - 9:16 비율 (1080x1920)
> - 30fps, 15초 길이
> - 한글 폰트 지원 필수
> 
> **파일 구조:**
> ```
> renderer/
> ├── package.json
> ├── tsconfig.json
> ├── src/
> │   ├── Root.tsx (Remotion 루트)
> │   ├── ShortsComposition.tsx (메인 컴포지션)
> │   └── types.ts (Python과 공유할 타입)
> └── scripts/
>     └── render-job.ts (CLI에서 호출할 렌더링 스크립트)
> ```
> 
> package.json을 먼저 생성하고, `npm install` 성공 여부를 확인한 후 다음 파일들을 만들어라.

이렇게 하니까 한 번에 성공했다. 핵심은 **버전 호환성과 파일 구조를 미리 명시**하는 것이다.

특히 `scripts/render-job.ts`를 별도로 만든 게 중요했다. Python CLI에서 `node renderer/scripts/render-job.ts job.json output.mp4`로 직접 호출할 수 있게 한 것이다:

```typescript
// render-job.ts
import { bundle } from "@remotion/bundler";
import { renderMedia } from "@remotion/renderer";
import { SajuAnalysis } from "../src/types";

const [jobPath, outputPath] = process.argv.slice(2);
const jobData: SajuAnalysis = JSON.parse(fs.readFileSync(jobPath, 'utf-8'));

// 렌더링 로직...
```

## CLI 도구의 사용성 개선 패턴

Python CLI는 만들기 쉽지만 사용하기 어려운 경우가 많다. 특히 에러 메시지가 불친절하고 진행 상황을 알 수 없는 문제가 있다.

에이전트에게 이런 요구사항을 줬다:

> CLI 도구의 UX를 개선해라.
> 
> **에러 처리:**
> - 파일 없음: 구체적인 경로와 해결책 제시
> - JSON 파싱 에러: 어느 라인에서 문제인지 표시
> - 렌더러 실행 실패: 로그 파일 위치 안내
> 
> **진행 상황 표시:**
> - 각 단계별 상태 출력 (parsing → validation → rendering)
> - 렌더링 시간 예상치 표시
> - 완료 시 출력 파일 경로 표시
> 
> **도움말:**
> - `--help`에서 실제 사용 예시 포함
> - 샘플 파일 경로 안내

결과적으로 `cli.py`에서 다음과 같은 패턴들이 나왔다:

```python
# 구체적인 에러 메시지
if not input_path.exists():
    click.echo(f"❌ 입력 파일을 찾을 수 없습니다: {input_path}")
    click.echo(f"💡 샘플 파일: input/profiles/sample_saju.json")
    raise click.Abort()

# 진행 상황 표시
click.echo("📊 사주 데이터 분석 중...")
analysis = create_saju_analysis(profile)

click.echo("🎬 비디오 렌더링 시작 (약 2-3분 소요)")
render_result = render_job(job_path, output_path)

click.echo(f"✅ 완료! 출력: {output_path}")
```

이모지와 진행 단계를 명시하니까 사용자 경험이 크게 개선됐다. 특히 "약 2-3분 소요" 같은 시간 안내가 중요했다. 사용자가 기다려야 하는 시간을 미리 알면 불안감이 줄어든다.

## 더 나은 방법은 없을까

이 작업을 지금 다시 한다면 몇 가지를 다르게 할 것이다.

**MCP 서버 활용**: Anthropic의 Model Context Protocol을 쓰면 Python 환경과 Node.js 환경을 더 자연스럽게 연결할 수 있다. 특히 파일 시스템 작업과 프로세스 실행을 MCP 서버에서 처리하면 에이전트가 실시간으로 결과를 확인하면서 작업할 수 있다.

**타입 정의 자동 동기화**: pydantic 모델에서 TypeScript 인터페이스를 자동 생성하는 도구들이 있다. `pydantic-to-typescript` 같은 라이브러리를 쓰면 수동으로 타입을 맞출 필요가 없다.

**Remotion 대신 다른 옵션**: Remotion은 강력하지만 설정이 복잡하다. 간단한 숏폼 비디오라면 `manim`이나 `moviepy` 같은 Python 네이티브 도구가 더 나을 수 있다. 특히 AI 에이전트가 Python에 더 익숙하므로 디버깅도 쉽다.

**단계별 테스트 자동화**: 각 커밋마다 수동으로 검증했는데, GitHub Actions로 자동화했으면 더 좋았을 것이다. 특히 샘플 데이터로 전체 파이프라인을 실행하는 integration test를 추가하면 회귀 버그를 방지할 수 있다.

## 정리

- **구체적 요구사항과 제약조건**이 명시된 프롬프트가 boilerplate보다 실용적인 코드를 만든다
- **점진적 구현 + 각 단계별 검증** 패턴으로 대규모 코드베이스도 안정적으로 생성할 수 있다
- **타입 정의 공유**로 Python-JavaScript 간 인터페이스 불일치를 컴파일 타임에 방지한다
- **CLI UX 개선**은 에러 메시지, 진행 상황, 예상 시간 안내가 핵심이다

<details>
<summary>이번 작업의 커밋 로그</summary>

65f233a — gpt-5-codex: bootstrap project workspace  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
6cc0e4f — gpt-5-codex: log sample short validation

</details>