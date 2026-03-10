---
title: "Browser Use — AI가 브라우저를 직접 조작하는 시대, 8만 스타의 구조를 파헤치다"
date: 2026-03-10
model: etc
tags: [ai-news, etc, github, open-source, browser-use, agent, browser-automation, playwright, python]
summary: "Browser Use는 AI 에이전트가 웹 브라우저를 직접 조작할 수 있게 해주는 오픈소스 프로젝트입니다. 8만 스타를 넘긴 이 프로젝트는 Playwright 위에 LLM 레이어를 얹어, DOM 파싱부터 클릭, 입력, 스크롤까지 자율적으로 수행합니다. 프로젝트 구조와 브라우저 에이전트의 핵심 기술을 분석합니다."
sources: ["https://github.com/browser-use/browser-use"]
auto_generated: false
---

## 무슨 일이 있었나

`browser-use/browser-use`가 2026년 3월 기준 **80,051 스타**를 기록했습니다. "AI가 브라우저를 쓴다"는 단순한 아이디어가 이 정도의 반향을 일으킨 것은, 그만큼 수요가 컸다는 뜻입니다.

기존 브라우저 자동화 도구(Selenium, Playwright, Puppeteer)는 **개발자가 정확한 셀렉터와 액션을 코드로 정의**해야 했습니다. 웹사이트 구조가 바뀌면 코드도 수정해야 합니다. Browser Use는 이 패러다임을 바꿉니다. **LLM이 화면을 "보고" 무엇을 클릭할지 스스로 판단**합니다.

<small>[browser-use/browser-use](https://github.com/browser-use/browser-use)</small>

## 프로젝트 구조

Browser Use는 Python으로 작성되어 있으며, 핵심은 놀라울 정도로 간결합니다.

```
browser-use/
├── browser_use/
│   ├── agent/              # 에이전트 코어
│   │   ├── agent.py        # 메인 에이전트 루프
│   │   ├── views.py        # 에이전트 상태/출력 정의
│   │   └── prompts.py      # 시스템 프롬프트
│   ├── browser/            # 브라우저 제어
│   │   ├── browser.py      # Playwright 브라우저 관리
│   │   ├── context.py      # 브라우저 컨텍스트 (탭, 쿠키 등)
│   │   └── views.py        # 브라우저 상태 표현
│   ├── controller/         # 액션 실행기
│   │   └── registry.py     # 사용 가능한 액션 등록
│   ├── dom/                # DOM 처리
│   │   ├── service.py      # DOM 트리 추출/정제
│   │   └── views.py        # DOM 요소 표현
│   └── telemetry/          # 사용 통계
├── examples/               # 사용 예시
└── tests/
```

전체 구조는 세 가지 핵심 컴포넌트로 나뉩니다.

**1. DOM 서비스** — `dom/service.py`가 현재 페이지의 DOM 트리를 추출하고, LLM이 이해할 수 있는 형태로 변환합니다. 모든 DOM 요소를 그대로 넘기면 토큰이 폭발하므로, **인터랙션 가능한 요소(클릭, 입력 가능한 것)**만 추출하고 각각에 고유 인덱스를 부여합니다.

```
[1] <button>로그인</button>
[2] <input type="text" placeholder="이메일">
[3] <a href="/signup">회원가입</a>
[4] <input type="password" placeholder="비밀번호">
```

**2. 에이전트** — `agent/agent.py`가 LLM과 대화하며 다음 액션을 결정합니다. DOM 상태를 LLM에 전달하고, LLM이 반환한 액션(클릭, 입력, 스크롤 등)을 파싱합니다.

**3. 컨트롤러** — `controller/registry.py`가 실제 브라우저 액션을 실행합니다. Playwright API를 호출해 클릭, 텍스트 입력, 페이지 이동 등을 수행합니다.

## 핵심 기술 스택

### Playwright — 브라우저 제어의 표준

Browser Use는 **Playwright**를 브라우저 제어 엔진으로 사용합니다. Microsoft가 만든 이 라이브러리는 Chromium, Firefox, WebKit을 모두 지원하며, 헤드리스(화면 없이) 실행도 가능합니다.

Playwright가 Selenium보다 나은 점:
- **자동 대기(auto-wait)**: 요소가 나타날 때까지 자동으로 기다림
- **네트워크 인터셉트**: 요청/응답을 가로채서 분석 가능
- **멀티 탭/컨텍스트**: 여러 탭을 동시에 제어
- **CDP(Chrome DevTools Protocol) 직접 접근**: 저수준 브라우저 제어 가능

### 에이전트 루프: Observe → Think → Act

Browser Use의 에이전트는 ReAct 패턴의 변형입니다.

```python
while not done:
    # 1. Observe: 현재 페이지 상태 수집
    dom_state = extract_dom_elements(page)
    screenshot = take_screenshot(page)  # 선택적

    # 2. Think: LLM에게 다음 액션 결정 요청
    action = llm.decide(
        system_prompt=BROWSER_AGENT_PROMPT,
        dom_state=dom_state,
        task=user_task,
        history=action_history
    )

    # 3. Act: 브라우저에서 액션 실행
    result = execute_action(page, action)

    # 4. 완료 조건 체크
    if action.type == "done":
        done = True
```

각 반복마다 LLM은 현재 DOM 상태를 받고, **"어떤 요소를 어떻게 조작할지"**를 결정합니다. 핵심은 DOM을 효율적으로 압축하는 것입니다. 일반적인 웹 페이지의 DOM 요소는 수천 개이지만, 인터랙션 가능한 요소는 수십~수백 개입니다. 이 필터링이 토큰 비용과 정확도를 모두 결정합니다.

### 액션 공간(Action Space)

에이전트가 수행할 수 있는 액션은 `controller/registry.py`에 정의되어 있습니다.

| 액션 | 설명 | 예시 |
|------|------|------|
| `click` | 요소 클릭 | `click(index=3)` |
| `input_text` | 텍스트 입력 | `input_text(index=2, text="hello")` |
| `scroll` | 페이지 스크롤 | `scroll(direction="down")` |
| `go_to_url` | URL 이동 | `go_to_url(url="https://...")` |
| `go_back` | 뒤로 가기 | `go_back()` |
| `extract_content` | 페이지 텍스트 추출 | `extract_content()` |
| `done` | 작업 완료 | `done(result="...")` |

액션 공간을 명확하게 정의한 것이 중요합니다. LLM은 자유 형식의 텍스트 대신 **구조화된 액션 객체**를 반환해야 합니다. 이를 위해 function calling 또는 JSON 모드를 사용합니다.

### 비전 모드 vs DOM 모드

Browser Use는 두 가지 관찰 모드를 지원합니다.

**DOM 모드**: DOM 트리를 텍스트로 변환해서 LLM에 전달합니다. 토큰 효율이 좋고 정확도가 높지만, 시각적 레이아웃 정보가 손실됩니다.

**비전 모드**: 스크린샷을 찍어서 멀티모달 LLM에 전달합니다. 시각적 레이아웃을 이해할 수 있지만, 토큰 비용이 높고 정확한 좌표 클릭이 어려울 수 있습니다.

실전에서는 **DOM 모드 + 비전 모드를 병행**하는 것이 가장 효과적입니다. DOM으로 인터랙션 요소를 파악하고, 스크린샷으로 레이아웃 컨텍스트를 보완합니다.

## 개념 정리

### Computer Use vs Browser Use

Anthropic이 2024년에 발표한 **Computer Use**는 AI가 마우스와 키보드를 직접 제어해서 컴퓨터 전체를 조작하는 기능입니다. 화면의 스크린샷을 보고 좌표를 클릭합니다. **모든 데스크톱 애플리케이션**을 사용할 수 있다는 장점이 있지만, 속도가 느리고 정확도가 제한적입니다.

**Browser Use**는 범위를 웹 브라우저로 한정하는 대신, **DOM 구조를 직접 접근**할 수 있어 훨씬 빠르고 정확합니다. CSS 셀렉터로 요소를 정확히 특정할 수 있고, JavaScript를 실행해서 페이지 상태를 조작할 수도 있습니다.

> 범위를 좁히면 정확도가 올라간다. Browser Use는 "할 수 있는 범위"를 제한해서 "할 수 있는 것"의 품질을 높인 사례입니다.

### 웹 자동화의 취약성 — 봇 감지

실전에서 Browser Use를 쓸 때 가장 큰 장벽은 **봇 감지(bot detection)**입니다. Cloudflare, reCAPTCHA, hCaptcha 등의 봇 방어 시스템이 자동화된 브라우저를 차단합니다.

Playwright 기본 설정으로는 `navigator.webdriver`가 `true`로 감지됩니다. Browser Use는 `playwright-stealth` 같은 방어 회피 기법을 일부 내장하고 있지만, 완벽한 해결책은 아닙니다. 이것은 브라우저 자동화 전체의 구조적 한계이기도 합니다.

## 정리

Browser Use는 **"AI가 사람처럼 웹을 쓴다"**는 비전의 가장 실용적인 구현체입니다. 코드를 쓰지 않아도 "이 사이트에서 이런 정보를 찾아줘"라고 하면 에이전트가 알아서 탐색합니다.

아키텍처적으로 인상적인 것은 프로젝트의 **간결함**입니다. 핵심 코드는 몇 개의 파일에 집중되어 있고, 각 컴포넌트의 역할이 명확합니다. DOM 서비스, 에이전트 루프, 컨트롤러 — 세 가지 레이어의 분리가 깔끔합니다.

8만 스타라는 숫자는 "반복적인 웹 작업을 AI에게 맡기고 싶다"는 보편적 욕구를 반영합니다. 아직 완벽하지는 않지만, 브라우저 에이전트 기술은 빠르게 발전하고 있습니다. 2026년 내에 일상적인 웹 작업의 상당 부분이 AI 에이전트에 의해 자동화될 가능성이 높습니다.

<small>[browser-use/browser-use](https://github.com/browser-use/browser-use)</small>
