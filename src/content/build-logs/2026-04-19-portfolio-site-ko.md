---
title: "텔레그램 한 마디로 GitHub 레포 만들기 — Claude Code 비서 실험 111 tool calls"
project: "portfolio-site"
date: 2026-04-19
lang: ko
tags: [claude-code, telegram, automation, github, claude-design]
description: "텔레그램 메시지 하나로 GitHub 레포 생성·스캐폴딩·푸시까지. 47시간 세션, 111번의 도구 호출로 뭘 만들었나."
---

텔레그램에 "치과광고 영어로 한 프로젝트 하나 더 파줘"라고 보냈다. 30분도 안 돼서 `~/dentalad/`가 로컬에 생기고 GitHub private 레포가 연동됐다. Claude Code를 비서처럼 쓰는 실험을 계속 밀고 있다.

**TL;DR** 텔레그램 → Claude Code 파이프라인으로 하루 종일 비동기 작업을 위임했다. 111번의 도구 호출 중 절반 가까이가 `Bash`(41)와 `WebSearch`(20)였다.

## 텔레그램에서 레포를 만드는 법

프롬프트는 단순했다.

> "프로젝트 uddental 말고 git 연동되는 걸로 하나 더 파줘 치과광고 영어로 한 프로젝트로"

이름을 4개 제안했고, 사용자가 "dentalad ㅇㅇ"라고 답했다. 그 다음에 일어난 일:

1. `~/dentalad/` 디렉토리 생성
2. `clinics/`, `ads-research/`, `site/`, `templates/`, `docs/` 구조 스캐폴딩
3. `README.md`, `package.json`, `.gitignore` 작성
4. `github.com/jee599/dentalad` private 레포 생성
5. 초기 커밋 + `git push`

Bash 호출 41번 중 상당수가 여기서 소비됐다. `gh repo create`, `git init`, `git remote add`, `git push -u origin main` 순서로.

사용자 개입은 이름 확인 한 번뿐이었다.

## MCP 끊김: 원인도 모른 채 재연결

작업 도중 Telegram MCP 서버가 끊겼다. 세션에서 "disconnected" 신호만 받고, 왜 끊겼는지는 알 수 없었다. 흔한 원인들:

- 봇 토큰 만료/재발급
- 네트워크 일시 끊김
- 플러그인 프로세스 크래시
- 시스템 슬립 후 세션 유실

`/telegram:configure`로 토큰 상태를 확인하고 재연결했다. dentalad 완료 알림은 재연결 후에 따로 쏴줬다.

이 과정에서 배운 점: 텔레그램 파이프라인은 편하지만 MCP 연결 상태에 종속된다. 장시간 세션에선 중간에 끊길 수 있다는 걸 감안해야 한다.

## 스케줄 에이전트의 한계

"판교 Claude 행사 정기적으로 검색해서 나오면 알람줘"라는 요청에서 막혔다.

원격 스케줄 에이전트(CCR)는 Telegram MCP에 접근 불가다. claude.ai에 연결된 커넥터는 Vercel/Gmail뿐이고, 텔레그램 플러그인은 로컬 전용이다.

선택지를 정리해서 사용자에게 넘겼다:

1. **Telegram Bot API 직접 호출** — 봇 토큰을 트리거 프롬프트에 심어서 `curl`로 `sendMessage`. 작동하지만 토큰이 평문으로 저장됨
2. **Gmail로 이메일** — claude.ai에 연결된 커넥터 활용

스케줄 에이전트가 강력하긴 하지만, 로컬 플러그인 생태계와 분리돼 있다는 게 실제로 부딪힌 제약이다.

## Claude Design 블로그 → auto-publish

"클로드 디자인 업데이트 블로그 글 쓰고 포스팅해줘"라는 요청에 `auto-publish` 스킬을 써서 두 파일을 동시 생성했다:

- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md` (DEV.to용)
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md` (spoonai.me용)

WebSearch 20번, WebFetch 14번이 여기서 대부분 소비됐다. 공식 문서, 릴리즈 노트, 기술 블로그를 긁어서 내용을 채웠다.

소재 하나를 플랫폼별로 분리해서 뽑는 흐름 자체는 잘 작동했다. 시간 대비 효율이 높다.

## 세션 통계

| 항목 | 수치 |
|------|------|
| 세션 시간 | 47h 11min |
| 총 tool calls | 111 |
| Bash | 41 |
| WebSearch | 20 |
| Telegram reply | 16 |
| WebFetch | 14 |
| 생성 파일 | 5개 |
| 수정 파일 | 0개 |

Bash가 가장 많은 건 예상했다. 놀라운 건 Telegram reply가 16번이라는 점 — 비동기 작업 위임이 얼마나 많이 오갔는지 보여준다.

## 다음 세션에서 할 것

- Telegram MCP 재연결 자동화 방안 탐색
- dentalad 프로젝트 실제 콘텐츠 채우기
- 스케줄 에이전트 + 알림 파이프라인 설계 (Telegram 우회 방법 결정)
