---
title: "GPT-5로 프로젝트를 0에서 완성시키는 실전 에이전트 활용법"
project: "shortsmaker"
date: 2026-03-15
lang: ko
tags: [python, typescript]
---

Python CLI 도구와 React 컴포넌트를 GPT-5 에이전트 하나로 통째로 만들어봤다. 커밋 메시지를 보면 모든 작업이 `gpt-5-codex`로 시작한다. 사람이 한 건 프롬프트 작성과 검증뿐이다. 이 글에서는 AI 에이전트에게 복잡한 프로젝트를 맡기는 구체적인 방법을 다룬다.

## 배경: 무엇을 만들고 있는가

ShortsMaker는 사주 데이터를 받아서 세로형 숏폼 영상을 자동 생성하는 도구다. Python CLI로 데이터 처리와 작업 관리를 하고, Remotion 기반 React 컴포넌트로 영상을 렌더링한다. 

이번 작업의 목표는 빈 레포지토리에서 시작해서 완전히 작동하는 파이프라인을 구축하는 것이었다. 34개 파일을 건드리고 5800줄을 추가했지만, 실제 코딩 시간은 거의 제로다.

## 전체 프로젝트를 에이전트 모드로 진행하기

GPT-5 에이전트의 핵심은 **단계별로 생각하고 검증하는 능력**이다. 인터랙티브 모드에서 하나씩 물어가며 코드를 작성하는 게 아니라, 전체 그림을 보고 필요한 작업을 스스로 찾아낸다.

**효과적인 에이전트 시작 프롬프트:**

> "ShortsMaker 프로젝트를 처음부터 완성해달라. 사주 JSON 데이터를 받아서 세로형 숏폼 영상을 생성하는 파이프라인이다.
> 
> 요구사항:
> - Python CLI: job 생성, 상태 관리, 렌더링 트리거
> - React/Remotion: 영상 컴포넌트와 렌더링 스크립트  
> - Type safety 보장
> - 실제 샘플 데이터로 end-to-end 테스트 가능
> 
> 현재 상황을 파악한 뒤, 필요한 모든 파일을 만들고 통합해달라."

이렇게 쓰면 안 된다:
> "Python CLI 도구 만들어줘"

차이점은 **구체적인 도메인 컨텍스트**와 **완성 기준**을 명시했다는 점이다. 에이전트는 이 정보를 바탕으로 아키텍처를 설계하고, 필요한 모듈을 식별하고, 의존성까지 고려해서 작업 순서를 결정한다.

**에이전트가 실제로 한 일:**
1. `PROJECT_BRIEF.md`와 `ARCHITECTURE.md` 분석
2. Python 패키지 구조 설계 (`cli.py`, `job.py`, `models.py` 등)
3. React 컴포넌트 아키텍처 설계
4. 타입 정의와 인터페이스 통합
5. 샘플 데이터 생성 및 검증 로직 구현

## 멀티 언어 스택 작업을 한 번에 처리하는 법

이 프로젝트의 까다로운 점은 Python CLI와 React 렌더러가 JSON을 통해 통신해야 한다는 것이다. 일반적으로는 Python 작업 후 별도로 TypeScript 작업을 하겠지만, GPT-5는 전체 스택을 동시에 고려할 수 있다.

**타입 일관성 확보 프롬프트:**

> "Python의 `SajuProfile` 모델과 TypeScript의 인터페이스가 완전히 일치해야 한다. JSON 직렬화/역직렬화가 안전하도록 다음을 보장해달라:
> 
> 1. Python Pydantic 모델 → TypeScript interface 자동 매핑
> 2. optional fields 처리 방식 통일  
> 3. 날짜/시간 형식 통일
> 4. enum 값 동기화"

에이전트는 이 요구사항을 보고 `src/shortsmaker/models.py`에서 Pydantic 모델을 정의한 뒤, `renderer/src/types.ts`에서 정확히 매칭되는 TypeScript 인터페이스를 만들었다. 

```python
# Python
class SajuProfile(BaseModel):
    name: str
    birth_year: int
    four_pillars: Dict[str, str]
    personality_summary: str
    lucky_elements: List[str]
```

```typescript  
// TypeScript
export interface SajuProfile {
  name: string;
  birth_year: number;
  four_pillars: Record<string, string>;
  personality_summary: string;
  lucky_elements: string[];
}
```

**핵심 패턴:** 에이전트에게 "두 언어 간 일관성"을 명시적으로 요구하면, 단순히 각각 작업하는 게 아니라 **크로스 레퍼런스**를 하면서 작업한다.

## CLI 설계를 에이전트에게 맡기는 제약 조건

명령어 인터페이스는 사용자 경험에 직접 영향을 주기 때문에 에이전트에게 명확한 가이드라인을 줘야 한다.

**CLI UX 가이드 프롬프트:**

> "CLI는 다음 패턴을 따라야 한다:
> 
> - `shortsmaker create --profile path/to/saju.json` → job 생성
> - `shortsmaker status [job_id]` → 상태 확인  
> - `shortsmaker render job_id` → 영상 렌더링
> - `shortsmaker list` → 전체 job 목록
> 
> 에러 처리:
> - 파일 경로 검증 (상대/절대 경로 모두 지원)
> - job ID 형식 검증
> - 의존성 체크 (ffmpeg, node 등)
> 
> 출력 형식: 기본은 human-readable, `--json` 플래그로 machine-readable"

에이전트는 이 스펙을 바탕으로 `argparse` 설정, 서브커맨드 구조, 에러 메시지까지 완성했다. 특히 `fix repo-relative cli paths` 커밋을 보면, 상대 경로 처리에서 발생할 수 있는 edge case까지 스스로 찾아서 수정했다.

**에이전트가 추가로 구현한 것들:**
- Progress bar (tqdm 사용)
- 컬러 출력 (rich 라이브러리)  
- Configuration 파일 관리
- Validation hooks

사람이 일일이 "progress bar 추가해줘"라고 요청하지 않았는데도, CLI 도구에 필요한 UX 요소들을 스스로 판단해서 넣었다.

## 컴포넌트 기반 영상 렌더링 구조 설계

Remotion은 React 컴포넌트를 영상으로 변환하는 라이브러리다. 에이전트에게 단순히 "Remotion 컴포넌트 만들어줘"라고 하면 generic한 결과가 나온다. 도메인 특화된 결과를 얻으려면 **영상 구성 요소**를 구체적으로 명시해야 한다.

**영상 구성 명세 프롬프트:**

> "세로형 숏폼 영상 (9:16 비율, 30초)을 다음 구성으로 만들어달라:
> 
> Timeline:
> - 0-3초: 인트로 (이름 + 출생연도 애니메이션)
> - 3-15초: 사주 해석 텍스트 (타이핑 효과)  
> - 15-25초: 행운 요소 리스트 (하나씩 fade in)
> - 25-30초: 아웃트로 (브랜딩)
> 
> 디자인:
> - 배경: 그라데이션 (fortune theme)
> - 폰트: Noto Sans KR
> - 색상: 전통적인 사주 색감 (금, 목, 수, 화, 토)
> - 애니메이션: 부드러운 전환, 급작스러운 움직임 금지"

에이전트는 이 스펙을 바탕으로 `ShortsComposition.tsx`를 194줄로 구현했다. 각 시간대별로 컴포넌트를 분리하고, `Sequence`로 타이밍을 제어하고, `interpolate`로 애니메이션을 처리했다.

```tsx
<Sequence from={90} durationInFrames={450}>
  <AbsoluteFill style={{
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  }}>
    <div style={{
      fontSize: 48,
      color: '#FFD700',
      textAlign: 'center',
      transform: `scale(${spring({
        frame: frame - 90,
        config: { damping: 100, stiffness: 200, mass: 0.5 }
      })})`
    }}>
      {profile.name}
    </div>
  </AbsoluteFill>
</Sequence>
```

**핵심:** 에이전트가 Remotion의 `spring` 애니메이션, 타이밍 계산, 스타일링을 모두 통합해서 처리했다. 사람이 각각 따로 요청할 필요가 없었다.

## 검증 중심 개발 패턴 구축하기

에이전트 작업에서 가장 중요한 건 **검증 가능한 결과물**이다. 코드가 syntactically correct한 게 아니라 실제로 동작해야 한다. `log sample short validation` 커밋이 이 철학을 보여준다.

**검증 파이프라인 프롬프트:**

> "전체 파이프라인이 실제로 동작하는지 검증하는 시스템을 만들어달라:
> 
> 1. 샘플 사주 데이터로 job 생성  
> 2. CLI 명령어들이 정상 작동하는지 테스트
> 3. React 컴포넌트가 올바르게 렌더링되는지 확인
> 4. 최종 영상 파일이 생성되는지 검증
> 
> 각 단계에서 실패하면 구체적인 에러 메시지를 출력하고, 성공하면 다음 단계로 진행한다."

에이전트는 이 요구사항을 보고:

1. `input/profiles/sample_saju.json` 생성
2. `tests/test_cli.py`에 통합 테스트 추가
3. `renderer/scripts/render-job.ts`에 검증 로직 구현  
4. 각 모듈에 logging과 error handling 추가

**자동 생성된 샘플 데이터:**
```json
{
  "name": "김철수",
  "birth_year": 1990,
  "four_pillars": {
    "year": "경오년",
    "month": "무인월", 
    "day": "갑자일",
    "hour": "을축시"
  },
  "personality_summary": "창의적이고 적극적인 성격...",
  "lucky_elements": ["금", "수"]
}
```

이 데이터는 실제 사주 해석에 사용할 수 있는 수준이다. 에이전트가 도메인 지식까지 활용해서 realistic한 샘플을 만들었다.

## 더 나은 방법은 없을까

이번 작업에서 GPT-5 에이전트를 단일 모드로만 사용했는데, 더 효율적인 대안들이 있다:

**1. Multi-agent orchestration**  
Anthropic의 최신 MCP (Model Context Protocol) 서버를 사용하면 각 언어별로 전문화된 에이전트를 구성할 수 있다. Python agent + TypeScript agent + Integration agent로 나누면 각 영역에서 더 깊은 최적화가 가능하다.

**2. 단계별 컨텍스트 관리**  
5800줄을 한 번에 처리하면 후반부에서 초반 결정사항을 놓칠 수 있다. Claude Code의 project memory나 custom instructions를 사용해서 "아키텍처 결정사항", "타입 스키마", "네이밍 컨벤션"을 세션간에 유지하는 게 더 안전하다.

**3. Incremental validation**  
전체 파이프라인을 한 번에 검증하는 대신, 각 커밋 후에 automated testing을 실행하는 게 좋다. GitHub Actions나 pre-commit hooks를 설정해서 에이전트가 생성한 코드가 즉시 검증되도록 할 수 있다.

**4. 도메인별 프롬프트 라이브러리**  
사주, 영상 렌더링, CLI UX 같은 특화된 영역에 대해서는 미리 검증된 프롬프트 템플릿을 구축하는 게 낫다. OpenAI Cookbook의 "Domain-specific prompting patterns"를 참고해서 재사용 가능한 패턴을 만들면 일관성이 높아진다.

## 정리

- **전체 그림을 먼저 그려주면** 에이전트가 개별 작업간 일관성을 유지한다
- **구체적인 제약 조건이** 범용적 요청보다 훨씬 좋은 결과를 만든다  
- **멀티 언어 스택도** 타입 일관성을 명시하면 한 번에 처리 가능하다
- **검증 중심 접근이** 실제 동작하는 코드를 만드는 핵심이다

<details>
<summary>이번 작업의 커밋 로그</summary>

6cc0e4f — gpt-5-codex: log sample short validation  
d6e1582 — gpt-5-codex: fix repo-relative cli paths  
07e6f61 — gpt-5-codex: build saju shorts pipeline  
65f233a — gpt-5-codex: bootstrap project workspace

</details>