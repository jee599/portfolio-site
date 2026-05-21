---
title: "jidonglab.com 리디자인: URL 하나로 설명되는 포트폴리오 + Capabilities 섹션 신설"
project: "portfolio-site"
date: 2026-05-21
lang: ko
tags: [claude-code, astro, redesign, copywriting, codex-review]
description: "14세션 194번의 tool call로 jidonglab.com을 명함형 포트폴리오로 재설계했다. Capabilities 컴포넌트 신설, Codex 2라운드 검수, 사실이 아닌 copy 표현 수정 과정 기록."
---

URL 하나만 받은 사람이 "이 사람 뭐하는 사람인지" 3초 안에 파악할 수 있어야 한다. 이번 리디자인의 유일한 기준이었다.

**TL;DR** — `Capabilities.astro` 컴포넌트를 새로 만들고 Hero/Projects/About 전반의 포지셔닝 copy를 정리했다. Codex 교차검증이 사실과 다른 문장을 두 차례 잡아냈고, max_turns 초과로 세션이 여러 번 쪼개졌다.

## 왜 리디자인했나

기존 홈페이지는 빌드 로그, 프로젝트, About이 있는 일반적인 개발자 포트폴리오였다. 방문자가 5개 섹션을 훑어야 이 사람이 뭘 하는지 짐작할 수 있는 구조다.

목표는 단순했다.

> URL만 받아도 즉시 이해되는 명함 같은 포트폴리오.

Hero copy를 포지셔닝 문장으로 날카롭게 다듬고, "내가 하는 일"을 카드 형태로 보여주는 `Capabilities.astro` 섹션을 새로 추가했다.

## 세션이 14개나 된 이유

이번 작업은 claude-opus-4-7 기반 세션 14개, 총 194번의 tool call이 소비됐다. 도구별 분포는 Read(91), Bash(61), Edit(30), Grep(8), Write(4)다.

세션이 많아진 이유는 두 가지다.

첫째, **max_turns 초과**다. 세션 3~4가 동일한 작업을 두 번 수행한 기록으로 남아 있다. 30번의 tool call 이후 max_turns에 걸려 중단됐고, 오케스트레이터(Hermes)가 "Continue the previous task"로 재시작을 지시했다. 세션 5~6도 같은 패턴으로 중복 실행됐다.

둘째, **Codex 교차검증 루프**다. 구현 후 Codex CLI가 diff를 검토하고 수정을 요청하는 사이클이 세 차례 돌았다. 세션 7~10이 그 흔적이다.

## Capabilities 섹션 — "내가 하는 일" 4카드

가장 핵심 변경이다. `src/components/home/Capabilities.astro`를 새로 만들었다.

카드 4개로 구성했다. **자동화**, **제품 운영**, **AI 활용**, **글쓰기**. 각 카드는 번호(`01`~`04`), 영문 제목, 한국어 설명으로 이루어진다. CSS 클래스는 `.do-grid`, `.do-card`, `.do-no`, `.do-title`, `.do-desc`로 namespace를 잡았다.

```astro
---
const items = [
  {
    no: '01',
    title: 'Automation',
    desc: '반복되는 운영 작업을 스크립트와 AI 에이전트로 대체한다.',
  },
  // ...
];
---
<section class="do-section">
  <div class="do-grid">
    {items.map(item => (
      <div class="do-card">
        <span class="do-no">{item.no}</span>
        <h3 class="do-title">{item.title}</h3>
        <p class="do-desc">{item.desc}</p>
      </div>
    ))}
  </div>
</section>
```

CSS에서 `--accent-soft`와 `--paper` 변수를 사용하는데, `home.css`에 이미 정의돼 있던 것들이다. `Capabilities`를 `index.astro`에 import하고 NowStrip 아래에 삽입했다.

`home.css`에는 `.masthead-eyebrow`와 `.do-*` 계열 클래스도 새로 추가했다. 모바일 대응을 위해 `.do-grid`는 1열 fallback을 추가했다.

## Codex가 거짓말 문장을 잡아냈다

세션 9가 흥미롭다. Codex 두 번째 리뷰에서 `Capabilities.astro`의 writing/build-log 카드 copy를 blocking issue로 올렸다.

문제가 된 원문:

```
EN: Every commit diff becomes a Korean/English build log.
KO: 커밋 diff를 한국어·영어 빌드 로그로 매일 쌓는다.
```

Codex의 지적: "모든 커밋이 이중언어 빌드 로그가 된다는 건 사실이 아니다."

맞는 말이다. 수동으로 쓰는 빌드 로그도 있고, 커밋마다 로그가 생기지는 않는다. 수정 후:

```
KO: 진행 중인 작업을 한국어·영어 빌드 로그로 꾸준히 남긴다.
EN: Work-in-progress captured as Korean and English build logs.
```

절대값 표현("every", "매일")을 방향성 표현("꾸준히", "captured as")으로 바꿨다. copy 검증에 외부 모델을 활용하는 이유가 이것이다. 구현 자체를 검토하는 것과 달리, **표현이 사실과 부합하는지**를 다른 모델이 판단하면 더 날카롭게 잡힌다.

## Hero와 Projects copy 정리

`Hero.tsx`에서 "매일" 중복 표현을 제거했다. 원래 두 문장에서 "매일"이 반복됐는데, Codex 1차 리뷰에서 지적받았다.

`Projects.tsx`는 섹션 제목 "지금 운영 중인 것들"과 실제 프로젝트 목록이 맞지 않는 문제가 있었다. 목록에 개발 중인 프로젝트도 포함돼 있어서 제목을 운영 중 + 개발 중 양쪽을 아우르는 표현으로 교체했다.

이번 작업에서 수정된 파일 전체 목록:

- `src/components/home/Capabilities.astro` — 신규 생성, copy 2회 수정
- `src/components/home/Hero.tsx` — Hero copy 정리, 중복 표현 제거
- `src/components/home/Projects.tsx` — 섹션 제목 수정
- `src/components/home/About.astro` — ongoing 톤으로 수정
- `src/components/home/Topbar.astro` — nav 정리
- `src/components/home/ShipLog.astro` — NowStrip 데이터 갱신
- `src/data/home.ts` — 데이터 정리
- `src/pages/index.astro` — Capabilities import 및 배치
- `src/styles/home.css` — `.masthead-eyebrow`, `.do-*` 클래스 추가

## 한국어 copy 톤 이슈 — 미완료

세션 11~14에서 사용자가 "한글 맨트 톤이 이상하다"는 피드백을 줬다. 홈페이지 `data-ko`/`data-en` 속성과 언어 스위칭 스크립트 간 불일치도 발견됐다.

`index.astro`는 `Base.astro`를 사용하지 않아서 언어 toggle 스크립트가 로드되지 않는 구조였다. 세션 13~14가 파일을 읽다가 max_turns에 걸려 실제 수정 없이 종료됐다. 이 부분은 다음 세션에서 이어서 수정해야 한다.

## 정리

- **Capabilities 섹션** — "내가 하는 일" 4카드로 첫 인상 포지셔닝을 정리했다.
- **Codex 교차검증** — copy의 사실 여부까지 잡아내는 데 유효했다. "every commit"처럼 과장된 절대값 표현은 구현자 혼자서는 놓치기 쉽다.
- **max_turns 분산** — 30-turn 한도에 걸려 동일 작업이 중복 실행됐다. 대형 리디자인 작업은 처음부터 단계를 쪼개서 세션별 범위를 좁게 잡는 게 낫다.
- **홈 i18n** — `Base.astro` 밖에서 동작하는 홈페이지의 언어 스위칭은 별도 스크립트 주입이 필요하다. 미완료 상태.
