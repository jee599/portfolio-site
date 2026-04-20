---
title: "텔레그램으로 Claude Code 원격 조종 — 120 tool calls, 68시간 세션"
project: "portfolio-site"
date: 2026-04-20
lang: ko
tags: [claude-code, telegram, automation, devtools]
description: "텔레그램에서 짧은 메시지 하나로 Claude Code를 원격 조종했다. dentalad 프로젝트 생성, 블로그 자동 발행, 행사 검색 알람까지 — 120번의 도구 호출 기록."
---

68시간 44분짜리 세션이었다. 직접 터미널 앞에 앉아 있던 시간은 거의 없었다. 텔레그램에서 짧은 메시지 몇 개만 쳤는데 Claude Code가 git 레포를 새로 파고, 블로그 글을 자동 발행하고, 행사 일정을 검색했다.

**TL;DR** 텔레그램 → Claude Code 원격 조종 파이프라인이 실전에서 어떻게 돌아가는지, MCP 연결이 끊겼을 때 어떻게 대응했는지 기록한다.

## "dentalad" — 텔레그램 한 줄로 레포 생성

메시지 원문:

```
프로젝트 uddental 말고 git 연동되는걸로 하나 더 파줘
치과광고 영어로한 프로젝트로
```

이 한 줄로 Claude Code가 해낸 것:

1. `~/dentalad/` 로컬 디렉토리 생성
2. `github.com/jee599/dentalad` private 레포 생성
3. 초기 스캐폴드 (`clinics/`, `ads-research/`, `site/`, `templates/`, `docs/`) 구성
4. `README.md`, `package.json`, `.gitignore` 작성 후 첫 커밋 + 푸시

프로젝트 이름은 4개 후보를 텔레그램으로 보냈고, "dentalad"로 픽했다. 메시지 왕복 2회, 실제 작업은 전부 에이전트가 처리했다.

## Telegram MCP가 끊겼을 때

세션 도중 MCP 서버가 disconnected됐다. 내 쪽에서 보이는 건 "서버 disconnected" 신호뿐이었고 정확한 원인은 로그를 봐야 알 수 있다.

흔한 원인은 세 가지다:

- 봇 토큰 만료 혹은 재발급
- Telegram API 타임아웃으로 인한 네트워크 단절
- 시스템 슬립/재개 후 세션 유실

재연결은 `/telegram:configure`로 토큰 상태를 확인하는 게 가장 빠르다. 이번에는 토큰은 살아있었고, 플러그인을 `/reload-plugins`로 재시작하니 복구됐다. 끊기기 전에 진행하던 dentalad 생성 작업은 이미 완료 상태였다.

Telegram MCP가 끊겨도 Claude Code 자체는 계속 돌아간다. 에이전트가 작업을 마치면 재연결 후 결과를 텔레그램으로 쏴주는 방식으로 손실 없이 이어갔다.

## 행사 검색 + 정기 알람 설정 시도

```
지금 한국 서울 판교 근처에서 등록가능한 클로드 관련 미팅이나
해커톤 모두 검색해서 알려줘
```

WebSearch 20회, WebFetch 16회를 돌렸다. 결과는 아쉬웠다 — 4/14·4/17 행사는 이미 끝났고, 당시 등록 가능한 공신력 있는 행사는 4건이었다(Snowflake, AI Co-Scientist Challenge, 교육공공데이터, Meta Llama Academy @ 판교).

"정기적으로 검색해서 나오면 알람줘" 요청도 들어왔다. 여기서 핵심 제약이 드러났다.

**원격 에이전트(CCR)는 Telegram MCP에 접근 불가다.** Anthropic 클라우드에서 실행되는 스케줄 에이전트는 로컬 텔레그램 플러그인을 못 쓴다. 대안을 두 가지 제시했다:

1. Telegram Bot API 직접 호출 (`curl`로 sendMessage) — 봇 토큰이 트리거 설정에 평문으로 들어가는 게 단점
2. Gmail로 이메일 (`jidongs45@gmail.com`으로 결과 전송)

어느 쪽도 최종 확정하지 않은 상태로 세션이 끝났다.

## Claude Design 업데이트 블로그 자동 발행

```
devto랑 spoonai.me에 이번에 클로드 디자인 업데이트된거 최신소식
```

`auto-publish` 스킬로 두 플랫폼 동시 발행했다. 결과물:

- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md` (DEV.to용 영어)
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md` (spoonai.me용 한국어)

소재 수집(WebSearch + WebFetch) → 초안 생성 → 플랫폼별 포맷 맞춤 → 발행까지 한 번에 처리됐다. 직접 손댄 건 없다. 멀티 플랫폼 발행 시 `canonical_url`은 `jidonglab.com` 기준으로 설정해서 SEO 중복 페널티를 방지한다.

## 아이폰 아이디어 수집 앱 브레인스토밍

```
아이폰에서 항상 플로팅되어 있거나 플로팅 아일랜드, 혹은 가장 쉬운 방법으로
스크린샷 링크 메모 공유 그냥 스케치 모든 아이디어를 모으는 앱을 만들어줘
```

`brainstorming` 스킬을 먼저 돌렸다. Dynamic Island 활용 방향과 Share Extension으로 외부 앱에서 바로 저장하는 방향 두 가지를 후보로 제시했고, "b" 한 글자로 두 번째 방향을 픽했다. 실제 구현은 이번 세션에서 시작하지 않았다.

## 도구 사용 현황

| 도구 | 횟수 |
|------|------|
| Bash | 42 |
| Telegram reply | 21 |
| WebSearch | 20 |
| WebFetch | 16 |
| Read | 7 |
| Write | 5 |
| 기타 | 9 |
| **합계** | **120** |

Bash 42회는 git 작업과 파일 시스템 조작이 대부분이다. WebSearch·WebFetch 합쳐서 36회 — 행사 검색과 Claude Design 소재 수집이 대부분을 차지한다.

## 텔레그램 원격 조종, 실전 느낌

텔레그램 메시지 길이는 대부분 1~2줄이었다. Claude Code가 맥락을 읽고 나머지를 채운다. dentalad처럼 모호한 요청도 후보를 제시하고 픽만 받는 방식으로 처리된다.

MCP 단절은 언제든 일어날 수 있다는 걸 이번에 확인했다. 연결이 끊겨도 에이전트는 계속 돌아가고, 재연결 후 결과를 받는 구조라 작업 손실은 없었다.

> 비동기 원격 지시는 편하다. 단, 알림 채널이 끊겨도 작업이 증명될 수 있어야 한다. git commit이 그 역할을 한다.

원격 스케줄 에이전트와 Telegram 연동은 아직 열린 문제다. 다음 세션에서 Telegram Bot API 직접 호출 방식으로 구현해볼 예정이다.
