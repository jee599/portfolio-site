---
title: "텔레그램으로 원격 지시 → 47시간 세션, 111 tool calls"
project: "portfolio-site"
date: 2026-04-20
lang: ko
tags: [claude-code, telegram, automation, project-bootstrap, auto-publish]
description: "텔레그램 채널에서 비동기로 작업을 지시해 47시간 세션을 운용한 방법. dentalad 프로젝트 부트스트랩, 판교 AI 이벤트 탐색, Claude Design 블로그 멀티 플랫폼 자동 발행까지 111 tool calls."
---

텔레그램에서 "ㅎㅇ" 한 마디로 시작한 세션이 47시간, 111 tool calls로 끝났다.

**TL;DR** Telegram 채널을 Claude Code 원격 인터페이스로 쓰면 컴퓨터 앞에 없어도 작업을 큐에 쌓을 수 있다. dentalad 프로젝트 GitHub 연동, 판교 AI 이벤트 스케줄 탐색, Claude Design 블로그 멀티 플랫폼 자동 발행까지 비동기로 처리했다.

## 텔레그램으로 Claude Code를 원격 제어한다는 것

이번 세션의 모든 지시는 텔레그램 DM으로 들어왔다. "프로젝트 하나 더 파줘" → "이름은 dentalad" → "블로그 글 써줘" → "어떤 각도로?" 식의 짧은 메시지들이 시간차를 두고 들어왔다. 세션은 계속 열려 있고, 새 메시지가 들어오면 이어서 처리한다.

비동기 작업의 장점은 명확하다. 이동 중에도, 자다 일어나서도 한 줄 메시지로 작업을 큐에 올릴 수 있다. Claude가 처리하는 동안 다른 일을 한다. 하지만 세션 중간에 Telegram MCP가 끊기는 상황도 있었다.

```
# MCP 연결 끊김 원인 진단
claude mcp list
tail ~/.claude/logs/*telegram* 2>/dev/null
```

흔한 원인은 네트워크 일시 끊김, 봇 토큰 만료, 시스템 슬립 후 세션 유실이다. 이번엔 세션 중간에 끊겨서 알림을 텔레그램으로 못 보냈고, `/telegram:configure`로 토큰 재확인 후 재연결했다.

## dentalad 프로젝트 부트스트랩, 5분

"uddental 말고 치과광고 영어로 한 프로젝트로 git 연동되는 거 파줘."

이름 제안 4개 → "dentalad ㅇㅇ" → 완료.

`~/dentalad/` 로컬 디렉토리 생성 + `github.com/jee599/dentalad` private 레포 연동 + 초기 스캐폴드 푸시까지 한 세트로 처리했다.

```
dentalad/
├── clinics/          # 클리닉별 자료
├── ads-research/     # 광고 리서치
├── site/             # 웹사이트
├── templates/        # 광고 템플릿
├── docs/             # 문서
├── README.md
├── package.json
└── .gitignore
```

Bash 41회 중 상당 부분이 여기 들어갔다. `gh repo create`, `git init`, `git push`까지 체인이 짧아서 빠르게 끝난다.

## 판교 AI 이벤트 탐색, 그리고 스케줄 에이전트의 제약

"한국 서울 판교 근처 Claude 관련 미팅이나 해커톤 검색해서 알려줘."

WebSearch 20회로 긁어봤다. 결과는 기대 이하였다. 4/14, 4/17자 행사들은 이미 끝났고 열린 등록창이 없었다. 대신 등록 가능한 관련 행사 4건을 전달했다. Snowflake AI Hackathon, AI Co-Scientist Challenge, 교육공공데이터 해커톤, Meta Llama Academy @ 판교.

"응 정기적으로 검색해서 나오면 알람줘."

여기서 제약이 나왔다. **원격 에이전트는 Telegram MCP에 접근 불가다.** claude.ai에 연결된 커넥터는 Vercel/Gmail뿐이고, 내가 쓰는 텔레그램 플러그인은 로컬 전용이다. 스케줄 에이전트로 주기 검색을 설정해도 알림 전달 수단이 없다.

선택지를 정리해서 보냈다.

1. Telegram Bot API `curl sendMessage` — 봇 토큰을 트리거 프롬프트에 심는 방식. 기능은 되는데 토큰이 평문 저장됨
2. Gmail — jidongs45@gmail.com으로 이메일 발송. 안정적이지만 모바일 UX가 다름

결국 스케줄 설정보다 필요할 때 직접 검색하는 게 낫다는 결론이었다.

## Claude Design 블로그, auto-publish로 3 플랫폼 동시 발행

"클로드 디자인 관련 블로그 글 써줘."

`/auto-publish` 스킬을 썼다. 키워드 → WebSearch로 최신 자료 수집 → 각 플랫폼 포맷에 맞게 생성 → 발행까지 한 번에 돌아간다.

생성된 파일:
- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md` — DEV.to용 영어 포스트
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md` — spoonai.me 한국어 포스트

WebFetch 14회가 대부분 여기서 소비됐다. Anthropic 공식 발표, 테크 블로그 커버리지, GitHub 릴리즈 노트를 긁어서 교차 확인한다.

멀티 플랫폼 자동 발행의 핵심은 `canonical_url` 설정이다. DEV.to와 Hashnode에 올라가는 영어 포스트 모두 `canonical_url`을 `jidonglab.com` 기준으로 설정한다. 같은 콘텐츠를 여러 곳에 올려도 SEO 중복 페널티가 없다.

## 세션 통계

47시간 11분, 111 tool calls.

| 도구 | 횟수 |
|------|------|
| Bash | 41 |
| WebSearch | 20 |
| Telegram reply | 16 |
| WebFetch | 14 |
| Read | 7 |
| Write | 5 |
| ToolSearch | 3 |
| Skill | 2 |

Bash가 압도적으로 많은 건 git 작업, 스크립트 실행, 디렉토리 조작이 많아서다. WebSearch 20회는 이벤트 탐색과 Claude Design 자료 수집에 들어갔다.

생성 파일 5개. 수정 파일 0개. 이번 세션은 신규 생성에 집중했다.

## 이 세션에서 배운 것

텔레그램 원격 제어 방식의 실제 패턴이 보였다. 짧고 모호한 메시지로 시작 → Claude가 선택지 제시 → 한 단어로 선택 → 처리 완료 알림. 이 루프가 빠르게 돌아간다.

단, MCP 연결 안정성이 전제조건이다. 끊기면 알림이 안 가고 사용자는 작업이 완료됐는지 모른다. 중요한 작업이면 세션 상태를 텔레그램 대신 파일이나 git commit으로도 확인할 수 있도록 체크포인트를 남기는 게 낫다.

> 비동기 원격 지시는 편하다. 단, 알림 채널이 끊겨도 작업이 증명될 수 있어야 한다.
