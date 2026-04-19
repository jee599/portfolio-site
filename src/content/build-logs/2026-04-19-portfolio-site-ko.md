---
title: "Telegram으로 Claude Code 원격 제어, MCP 끊겼을 때 생기는 일 — 103 tool calls 해부"
project: "portfolio-site"
date: 2026-04-19
lang: ko
tags: [claude-code, telegram, mcp, automation, multi-platform]
description: "Telegram을 Claude Code 인터페이스로 쓰다가 MCP가 끊겼다. dentalad 레포 생성부터 멀티플랫폼 블로그 발행까지, 103번의 tool call 세션을 해부한다."
---

103번의 tool call 중 14번은 Telegram으로 메시지를 보내는 데 썼다. 코드를 짜거나 파일을 고치는 게 아니라, 결과를 사람에게 전달하는 데. Telegram을 Claude Code 제어판으로 쓰면 이런 비율이 나온다.

**TL;DR** Telegram MCP로 원격 지시 → `dentalad` GitHub 레포 생성 → MCP 연결 끊김 → 복구 → 판교 AI 행사 검색 → Claude 디자인 글 멀티플랫폼 발행. 41시간 16분 세션, 파일 5개 생성.

## Telegram이 Claude Code 인터페이스가 된 이유

이 세션의 모든 지시는 Telegram 메시지로 왔다. "치과광고 영어 프로젝트 하나 더 파줘", "dentalad ㅇㅇ", "클로드 디자인 블로그 글쓰고 포스팅해줘" — 전부 텔레그램 DM이다.

기존 방식은 터미널에 앉아서 Claude Code를 직접 쳤다. 이제는 폰으로 메시지 하나 보내면 된다. 이동 중에도, 다른 일을 하다가도. `claude-opus-4-7`이 Telegram MCP를 통해 메시지를 수신하고, 작업을 실행하고, 완료 알림을 다시 Telegram으로 쏜다.

도구 사용 통계를 보면 이 구조가 명확하게 보인다.

```
Bash(41) > WebSearch(17) > mcp_telegram_reply(14) > WebFetch(11) > Read(7) > Write(5)
```

Bash가 가장 많은 건 당연하다. 그런데 `mcp_telegram_reply`가 세 번째로 많다. 이건 단순 통지가 아니라, 매 작업 단계마다 Telegram으로 중간 보고를 했다는 뜻이다.

## dentalad 레포, 프롬프트 두 번으로 생성

"치과광고 영어로 한 프로젝트로 git 연동되는 거 하나 더 파줘" — 이게 전부였다.

이름 후보 4개를 Telegram으로 먼저 물어봤고, `dentalad`로 확정되자마자 실행했다.

```
~/dentalad/
├── clinics/
├── ads-research/
├── site/
├── templates/
├── docs/
├── README.md
├── package.json
└── .gitignore
```

`github.com/jee599/dentalad` private 레포를 생성하고, 로컬 스캐폴드를 만들고, 초기 커밋을 푸시하는 데까지. 디렉토리 구조 정의, `git init`, remote 연결, 첫 커밋 — 각각 별도 Bash 호출이다. 하나의 긴 스크립트로 묶는 것보다 단계별로 실행하고 결과를 확인하는 게 에러 추적에 훨씬 유리하다.

## MCP가 끊겼을 때

레포 생성을 완료하고 Telegram으로 알림을 보내는 도중, 연결이 끊겼다.

Claude Code 세션에서는 "서버 disconnected" 신호만 받았다. 왜 끊겼는지는 내 쪽에서 보이지 않는다. 흔한 원인은 네 가지다.

- 봇 토큰 만료 또는 재발급
- 네트워크 일시 끊김 (Telegram API timeout)
- 플러그인 프로세스 크래시
- 시스템 슬립/재개 후 세션 유실

사용자가 "왜 연결이 끊겼어?"라고 묻자, 진단 방법을 안내했다.

```bash
claude mcp list
tail ~/.claude/logs/*telegram* 2>/dev/null
```

재연결은 `/telegram:configure`로 토큰을 다시 확인하거나, Claude Code를 재시작하는 방식이다. 이 세션에서는 재시작 후 Telegram이 복구됐고, dentalad 완료 알림을 뒤늦게 전송했다.

중요한 건 MCP 끊김이 작업 자체를 중단시키지는 않는다는 것이다. Telegram 알림이 안 갔을 뿐, `dentalad` 레포는 이미 생성되어 있었다. 알림 채널과 실제 작업은 분리되어 있다.

## 원격 에이전트의 한계: Telegram MCP는 로컬 전용

판교/서울 Claude 행사를 정기 검색해달라는 요청이 왔을 때, 스케줄 에이전트 설정을 검토했다. 여기서 중요한 제약이 드러났다.

**원격 에이전트는 Telegram MCP에 접근할 수 없다.**

Remote Trigger로 실행되는 에이전트는 claude.ai에 연결된 Vercel/Gmail 커넥터만 사용 가능하다. 내가 쓰는 Telegram 플러그인은 로컬 전용이다. 원격 에이전트가 결과를 Telegram으로 보내려면 다른 방식이 필요하다.

선택지는 두 가지였다.

1. **Bot API 직접 호출** — 봇 토큰을 트리거 프롬프트에 심고 `curl`로 `sendMessage` 호출. 기능은 되지만 토큰이 트리거 설정에 평문으로 저장된다.
2. **Gmail로 우회** — 이메일로 결과 전달.

보안상 후자를 권했지만, 결국 행사 알림은 스케줄러 대신 필요할 때 수동 검색으로 결정됐다. 검색 결과에 등록 가능한 행사가 없었기도 하다 — 4/14, 4/17 행사는 이미 끝난 상태였고, 당시 열린 공신력 있는 AI 행사는 Snowflake Arctic Challenge, AI Co-Scientist Challenge 등 4건이었다.

## WebSearch 17번: 멀티플랫폼 블로그 발행 흐름

"Claude 디자인 업데이트된 거 spoonai랑 DEV.to에 발행해줘" 요청에서 WebSearch가 집중적으로 사용됐다.

`/auto-publish` 스킬이 실행됐다. 키워드를 받으면 WebSearch로 최신 자료를 수집하고, 플랫폼별로 최적화된 글을 생성해서 발행한다.

```
WebSearch → Anthropic 공식 블로그, GitHub 릴리즈노트, 기술 블로그
WebFetch  → 각 페이지 본문 추출
Write     → 한국어(spoonai.me) + 영어(DEV.to) 초안 생성
```

최종 생성된 파일은 두 개다.

- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md`
- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md`

소재 하나로 한국어/영어 각각 분리해서 뽑는 구조다. SEO canonical 설정은 `jidonglab.com` 기준으로 맞춘다.

흥미로운 부분은 WebFetch(11)의 비율이다. WebSearch로 URL을 찾고, WebFetch로 실제 본문을 긁는다. 17번 검색에 11번 본문 추출이면, 검색 결과 중 약 65%를 실제로 읽었다는 의미다. 표면적인 검색이 아니라 원문을 직접 파싱한다.

## 103번 중에서 실제로 코드를 건드린 건 몇 번인가

```
Bash(41):  shell 실행 (git, npm, curl 등)
Write(5):  새 파일 생성
Read(7):   파일 읽기
Edit(0):   기존 파일 수정 없음
```

Edit이 0이다. 이 세션에서는 기존 코드를 고치는 작업이 전혀 없었다. 새로운 레포를 스캐폴딩하고, 새 글을 생성하고, 외부 API를 호출했다. 수정 없이 생성만.

반면 Bash(41)이 압도적으로 많다. git 명령어, GitHub CLI, npm 스크립트, curl 호출. 대부분의 작업이 코드 편집이 아니라 시스템 명령 실행이었다.

> 이 세션에서 Claude Code는 에디터가 아니라 오퍼레이터였다. 코드를 쓰는 게 아니라 도구를 조작했다.

## 남은 것

41시간 16분 세션에서 실제 파일은 5개 생겼다. dentalad 스캐폴드 3개, 블로그 포스트 2개.

숫자만 보면 효율이 낮아 보일 수 있다. 하지만 이 세션의 대부분은 탐색과 판단이었다. 어떤 행사에 등록할지, 원격 에이전트를 어떻게 구성할지, 어떤 플랫폼에 어떤 각도로 글을 쓸지. 이 판단들은 파일로 남지 않는다.

Telegram 인터페이스가 만든 가장 큰 변화는 작업 밀도가 아니라 작업 타이밍이다. 이동 중에도, 다른 일을 하다가도, 생각이 날 때 바로 지시를 보낼 수 있다. 결과는 폰으로 온다.
