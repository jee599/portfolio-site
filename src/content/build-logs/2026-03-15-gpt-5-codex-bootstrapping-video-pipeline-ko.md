---
title: "GPT-5 Codex로 동영상 생성 파이프라인 부트스트래핑 — 큰 프로젝트 한번에 시키는 법"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

ShortsMaker라는 사주 분석 숏폼 자동 생성 도구를 만들면서 GPT-5 Codex를 활용해 전체 프로젝트를 처음부터 구축했다. 5,800라인 추가, 34개 파일 생성을 4번의 커밋으로 끝냈는데, 여기서 배운 대규모 프로젝트 부트스트래핑 전략을 정리한다.

## 배경: 무엇을 만들고 있는가

사주 프로필 데이터를 받아서 숏폼 영상을 자동으로 생성하는 파이프라인을 만들었다. Python CLI로 작업을 관리하고, React + Remotion으로 영상을 렌더링하는 구조다. 

목표는 단순하다. `input/profiles/sample_saju.json`에 사주 데이터를 넣으면, 맞춤형 사주 해석이 담긴 9:16 숏폼 영상이 나온다. 기획부터 코딩까지 전부 AI에게 시키고 싶었다.

## Codex에게 프로젝트를 통째로 시키는 프롬프팅

일반적인 AI 코딩은 "이 함수 좀 고쳐줘" 수준이다. 하지만 GPT-5 Codex는 프로젝트 전체를 한번에 생성할 수 있다. 핵심은 **계층적 명세**다.

먼저 이렇게 시작했다:

> "Python CLI 기반 숏폼 영상 생성 파이프라인을 만들어줘. 사주 프로필 JSON을 입력받아서 React + Remotion으로 9:16 영상을 렌더링한다. 
> 
> 요구사항:
> 1. `shortsmaker create-job <profile.json>` 명령어로 작업 생성
> 2. 사주 데이터 파싱 및 검증 로직
> 3. Remotion 프로젝트 부트스트래핑
> 4. TypeScript 타입 정의 자동 생성
> 5. 렌더링 스크립트 및 에러 핸들링
> 
> 프로젝트 구조를 먼저 제안하고, 승인받으면 전체 코드를 생성해."

이 프롬프트가 좋은 이유:
- **단계별 진행**: 구조 먼저, 코드는 나중에
- **구체적 CLI 인터페이스**: `shortsmaker create-job`처럼 정확한 명령어 형식
- **기술 스택 명시**: Python + React + Remotion + TypeScript
- **검증 단계 포함**: 파싱/검증 로직까지 요구

이렇게 쓰면 안 된다:

> "숏폼 만드는 프로그램 좀 만들어줘"

모호한 요구사항은 쓸모없는 코드를 만든다.

## 파일 구조 설계에서 AI 활용법

Codex가 제안한 구조는 이랬다:

```
src/shortsmaker/
├── cli.py          # 명령어 인터페이스
├── job.py          # 작업 관리
├── models.py       # 데이터 모델
├── hooks.py        # 생성 후크
├── languages.py    # 다국어 지원
└── render/         # 렌더링 모듈

renderer/
├── src/
│   ├── ShortsComposition.tsx  # Remotion 컴포지션
│   ├── Root.tsx              # 루트 컴포넌트
│   └── types.ts              # 타입 정의
└── scripts/render-job.ts     # 렌더링 실행
```

여기서 중요한 건 **AI에게 아키텍처 리뷰를 시킨 것**이다:

> "이 구조에서 potential issue는 뭐가 있을까? 특히 Python-TypeScript 간 타입 동기화와 멀티 렝귀지 지원 관점에서."

AI가 지적한 문제들:
1. `models.py`의 Pydantic 모델과 `types.ts`가 따로 논다
2. `languages.py`에서 locale 데이터 관리가 복잡할 수 있다
3. 렌더링 에러 핸들링이 CLI로 제대로 전파되지 않을 수 있다

이런 사전 검토로 **hooks.py**에 타입 동기화 로직을, **config.py**에 글로벌 설정을 추가했다.

## 대규모 코드 생성시 컨텍스트 관리

5,800라인을 한번에 생성할 때 가장 어려운 건 **컨텍스트 일관성**이다. 파일마다 import path가 다르고, 타입 정의가 맞지 않고, 함수 시그니처가 달라진다.

해결책은 **점진적 생성 + 의존성 순서**다:

1단계: 코어 모델부터
> "`models.py`부터 생성해줘. SajuProfile, JobConfig, RenderOptions 모델을 Pydantic으로. 이후 파일들이 이 모델을 import할 거야."

2단계: CLI 인터페이스
> "`cli.py`에서 `models.py`의 클래스들을 사용해서 `create-job`, `render-job`, `list-jobs` 명령어를 만들어줘."

3단계: 비즈니스 로직
> "`job.py`에서 실제 작업 생성/관리 로직을. CLI에서 호출하는 함수들이야."

4단계: TypeScript 부분
> "Python 모델 기반으로 `renderer/src/types.ts` 생성해줘. SajuProfile과 정확히 호환되게."

이 순서가 중요하다. 의존성 그래프를 거슬러 올라가면서 생성하면 import 에러가 없다.

## Remotion + Python 파이프라인 연동 전략

가장 까다로운 부분은 Python CLI에서 Node.js 기반 Remotion을 실행하는 것이었다. 

핵심 아이디어는 **JSON 브릿지**다:

```python
# job.py
def create_render_job(profile: SajuProfile) -> RenderJob:
    job_data = {
        "id": str(uuid4()),
        "profile": profile.dict(),
        "output_path": f"output/{profile.name}_{timestamp}.mp4"
    }
    
    # JSON 파일로 저장
    with open(f"jobs/{job_data['id']}.json", "w") as f:
        json.dump(job_data, f)
    
    return RenderJob(**job_data)
```

```typescript
// render-job.ts  
const jobData = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
const composition = await renderMedia({
  composition: 'SajuShorts',
  serveUrl: bundleLocation,
  codec: 'h264',
  inputProps: jobData.profile,
  outputLocation: jobData.output_path
});
```

이 패턴의 장점:
- Python과 TypeScript가 직접 통신할 필요 없다
- Job 상태를 파일시스템에서 추적할 수 있다
- 렌더링 실패시 재시도가 쉽다
- 스케일아웃할 때도 유리하다

Codex에게 이런 아키텍처를 제안받으려면:

> "Python CLI에서 Node.js Remotion을 실행해야 한다. subprocess로 직접 호출하지 말고, 더 robust한 방식으로 데이터를 전달하고 상태를 추적할 수 있게 해줘."

## 테스트 데이터 생성도 AI에게

실제 사주 데이터 없이 개발하려면 realistic한 샘플 데이터가 필요했다. 

> "`input/profiles/sample_saju.json` 파일을 만들어줘. 실제 사주명리학 기반으로 일주, 월주, 년주, 시주 정보와 오행 분석, 성격 분석이 들어가야 한다. 너무 복잡하지 않게 하되 realistic하게."

생성된 샘플:

```json
{
  "name": "김영수",
  "birth_date": "1990-05-15",
  "birth_time": "14:30",
  "pillars": {
    "year": "경오",
    "month": "신사", 
    "day": "기축",
    "hour": "신미"
  },
  "elements": {
    "wood": 1,
    "fire": 3,
    "earth": 2,
    "metal": 3,
    "water": 1
  },
  "personality_analysis": "화의 기운이 강한 활발한 성격...",
  "fortune_2024": "올해는 토의 해로 안정감이 증가..."
}
```

이런 디테일한 샘플 데이터가 있어야 React 컴포넌트에서 실제 UI를 그릴 수 있다.

## CLI path 처리의 함정

개발 과정에서 `d6e1582` 커밋처럼 path 관련 버그가 나왔다. Python CLI를 프로젝트 루트에서 실행하느냐, 서브디렉토리에서 실행하느냐에 따라 상대 경로가 달라진다.

해결한 패턴:

```python
# config.py
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent
RENDERER_DIR = PROJECT_ROOT / "renderer" 
INPUT_DIR = PROJECT_ROOT / "input"
OUTPUT_DIR = PROJECT_ROOT / "output"
```

이렇게 하면 `shortsmaker` CLI를 어디서 실행하든 절대 경로로 동작한다.

Codex에게 이런 robust한 path 처리를 요청하려면:

> "CLI 명령어를 프로젝트 어느 위치에서 실행해도 동작하게 해줘. 상대 경로 대신 프로젝트 루트 기준 절대 경로를 사용해."

## 더 나은 방법은 없을까

지금까지 소개한 방식도 괜찮지만, 2024년 말 기준으로 더 나은 대안들이 있다:

**1. Cursor Composer 활용**
Codex 대신 Cursor의 Composer를 쓰면 프로젝트 전체 컨텍스트를 더 잘 유지한다. 특히 `@codebase` 기능으로 기존 코드와의 일관성을 보장할 수 있다.

**2. MCP 서버로 Python-TypeScript 동기화**
JSON 브릿지보다는 Model Context Protocol 서버를 만들어서 실시간으로 타입을 동기화하는 게 더 깔끔하다. Anthropic에서 공식 지원하는 패턴이기도 하다.

**3. Windsurf Cascade로 멀티 파일 작업**  
5,800라인을 한번에 생성하기보다는, Windsurf의 Cascade 모드로 파일별로 점진적 생성하면서 컨텍스트를 누적하는 게 더 안정적이다.

**4. 최신 Remotion Lambda 활용**
로컬에서 Node.js 실행하지 말고 Remotion Lambda로 클라우드 렌더링하면 Python CLI가 훨씬 단순해진다. subprocess 관리할 필요도 없고 스케일도 쉽다.

**5. v0.dev로 React 컴포넌트 프로토타이핑**
`ShortsComposition.tsx` 같은 복잡한 UI 컴포넌트는 Vercel v0.dev로 먼저 프로토타입 만들고, 그걸 Remotion 형태로 변환하는 게 더 효율적이다.

## 정리

- **계층적 명세**: 구조 먼저, 코드는 나중에. AI도 단계별로 생각한다
- **의존성 순서**: 코어 모델부터 생성해서 import 에러를 방지한다  
- **JSON 브릿지**: 서로 다른 런타임 간 데이터 교환은 파일이 가장 안전하다
- **절대 경로**: CLI 도구는 실행 위치에 독립적이어야 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
65f233a — gpt-5-codex: bootstrap project workspace

</details>