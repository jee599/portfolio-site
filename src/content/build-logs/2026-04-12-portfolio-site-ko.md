---
title: "Claude Code로 SEO 랜딩 288페이지 자동 생성 — 사람이 한 건 프롬프트 5줄"
project: "portfolio-site"
date: 2026-04-12
lang: ko
tags: [claude-code, seo, automation, subagent, saju_global]
description: "사주 앱에 SEO 궁합 랜딩 288페이지를 구현했다. writing-plans → subagent-driven-development 스킬 체인으로 171번의 tool call을 소화하면서 사람이 개입한 건 프롬프트 5줄이 전부였다."
---

`saju_global` 프로젝트에 SEO 궁합 랜딩 288페이지를 구현했다. 직접 코드를 쓴 시간은 0초다. 세션 전체를 통해 내가 입력한 프롬프트는 다섯 줄, tool call은 171번, 세션 시간은 67시간 26분이었다.

**TL;DR** writing-plans → subagent-driven-development 스킬 체인을 사용하면 대규모 콘텐츠 생성 작업을 백그라운드로 위임할 수 있다. 사람은 방향만 잡고 나머지는 에이전트가 돌린다.

## 스펙에서 플랜으로: writing-plans 스킬

작업 시작 프롬프트는 이게 전부였다.

```
saju_global 프로젝트에서 SEO 궁합 랜딩 288페이지를 구현해줘.
스펙: docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md
```

Claude는 먼저 writing-plans 스킬을 발동했다. 스펙 파일을 읽고, 기존 코드베이스 구조를 파악하고, 태스크를 bite-size 단위로 쪼갠 플랜을 `docs/superpowers/plans/` 경로에 저장했다. 이 과정에서 Read 20번, Glob 4번, Bash 수십 번을 썼다. 스펙이 있어도 기존 코드 패턴을 먼저 읽어야 플랜이 현실적이 된다는 걸 Claude가 스스로 실천했다.

플랜이 완성되자 Claude가 물었다: "Subagent-Driven(권장)으로 할까요, Inline으로 할까요?" 나는 `1`만 입력했다.

## 플랜에서 실행으로: subagent-driven-development

subagent-driven-development 스킬이 넘겨받았다. 먼저 main 브랜치 상태를 확인하고 `seo-compat-pages` 브랜치로 git worktree를 생성했다. 그 다음 태스크 트래커를 만들고 독립 태스크별로 fresh 서브에이전트를 디스패치하기 시작했다.

핵심은 콘텐츠 생성 스크립트였다. `scripts/generate-compat-content.ts`를 백그라운드로 실행해서 288개 궁합 조합의 JSON 데이터를 생성했다.

```bash
nohup npx tsx scripts/generate-compat-content.ts > /tmp/compat-gen.log 2>&1 &
echo "Started PID=$!"
sleep 3
head -20 /tmp/compat-gen.log
```

이걸 직접 실행하고 로그를 테일링하는 게 아니라, TaskCreate로 백그라운드 태스크로 등록하고 완료 알림을 기다렸다. 세션을 블로킹하지 않으면서 장시간 작업이 진행되는 구조다.

## 사람의 역할: "잘 되고 있어?" 세 번

이번 세션에서 내가 입력한 의미있는 프롬프트를 정리하면:

1. 초기 작업 지시 (스펙 경로 포함)
2. `1` — subagent-driven 선택
3. `머지 너가해 그리고 2번 해` — worktree 머지 + 스크립트 두 번째 실행
4. `잘되고 있어?` × 2회 — 진행 상황 확인
5. 도메인/이메일 관련 follow-up

tool call 171번 중 내가 직접 실행한 건 0번이다.

## 도구 사용 통계

Bash가 101번으로 전체의 59%를 차지했다. 대부분 백그라운드 스크립트 실행, 로그 확인, git 작업이다. Agent가 17번 찍혔다는 건 서브에이전트를 17번 디스패치했다는 뜻이다. 각 서브에이전트는 독립된 컨텍스트로 태스크를 수행하고 결과만 메인에 반환한다. 메인 컨텍스트가 깨끗하게 유지되는 이유다.

| 도구 | 횟수 | 비율 |
|------|------|------|
| Bash | 101 | 59% |
| Read | 20 | 12% |
| Agent | 17 | 10% |
| TaskUpdate | 14 | 8% |
| TaskCreate | 7 | 4% |
| Glob | 4 | 2% |
| Write | 3 | 2% |
| Skill | 2 | 1% |

## 스킬 체인의 실제 흐름

```
사용자 프롬프트 (1줄)
  └─ writing-plans 스킬
       └─ 코드베이스 탐색 (Read/Glob/Bash)
       └─ 플랜 파일 생성 (docs/superpowers/plans/)
            └─ subagent-driven-development 스킬
                 └─ git worktree 생성
                 └─ 태스크 트래커 생성
                 └─ 서브에이전트 디스패치 × 17
                      └─ 각 태스크 실행
                      └─ 스펙 컴플라이언스 리뷰
                      └─ 코드 퀄리티 리뷰
                 └─ worktree 머지
```

이 체인이 한 번 작동하면 사람은 체크포인트에서만 개입한다. 중간에 "잘되고 있어?"라고 물으면 태스크 트래커 상태를 요약해준다.

## 삽질: 컨텍스트를 섞으면 깨진다

세션 중간에 백그라운드 스크립트가 돌아가는 도중 도메인 이메일 알림("아침마다 결제 현황 이메일 보내라고 했잖아")이나 도메인 통합("fortunelab으로 통합") 같은 다른 주제를 끼워 넣었다. Claude가 두 번 `이해 못했어 뭘 하라고?`라고 응답했다.

원인은 명확하다. 백그라운드 태스크 진행 중에 관련 없는 컨텍스트가 끼어들면 Claude가 현재 작업과 새 요청 중 어디에 응답해야 하는지 모호해진다. 특히 짧고 맥락 없는 메시지(`가비아에서 관리해`, `coffeechat이랑 무슨 소리야?`)는 이전 대화를 참조해야 의미가 생기는데, 세션이 67시간 넘게 이어지면 컨텍스트 압축이 일어나면서 정보가 날아간다.

교훈: 백그라운드 작업 중에는 다른 스레드를 끼워 넣지 않는다. 새 토픽은 새 세션에서 시작한다.

## 결과

- `apps/web/data/zodiac-compat-content.json` — 288개 궁합 조합 데이터
- `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md` — 구현 플랜
- worktree `STATUS.md` — 태스크별 진행 상황 트래커

288페이지를 사람이 직접 썼다면 하나당 30분으로 잡아도 144시간이다. 스크립트 + Claude 자동화로 내가 쓴 시간은 모니터링 포함 30분 정도다.

## 정리

- writing-plans → subagent-driven 스킬 체인은 대규모 콘텐츠 생성 작업을 완전 위임하는 데 적합하다
- 백그라운드 스크립트 + TaskCreate 패턴은 장시간 작업을 세션 블로킹 없이 소화한다
- Bash 59% 비율은 "코드 작성"보다 "실행/확인" 작업이 지배적이었음을 보여준다
- 한 세션에서 여러 주제를 섞으면 컨텍스트가 깨진다. 특히 67시간 세션에서는 압축이 일어난다
