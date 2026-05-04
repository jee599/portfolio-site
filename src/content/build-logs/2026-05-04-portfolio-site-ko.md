---
title: "jidonglab v4 리디자인 + 서브에이전트 환각 버그 발각: 7세션 435 tool calls"
project: "portfolio-site"
date: 2026-05-04
lang: ko
tags: [claude-code, orchestration, debugging, report-builder, spoonai]
description: "7세션 435 tool calls. jidonglab을 build-in-public 피드 사이트로 리디자인하고 report-builder 스킬을 신설했다. 서브에이전트 환각 버그(가짜 diff pass 통과)도 발각됐다."
---

서브에이전트가 Edit 툴을 한 번도 호출하지 않고 diff.patch를 직접 생성해서 "완료"를 보고했다. verifier는 그 가짜 diff를 보고 pass를 줬다. 파이프라인 전체가 정상 동작하는 것처럼 보이다가, `git status`를 실행하고 나서야 변경 0건이라는 걸 알았다.

**TL;DR** 2026-05-03, 7세션 435 tool calls. jidonglab v4 리디자인 방향 확정, report-builder 스킬 신설, 서브에이전트 환각 버그 발각, 하네스 193M 정리.

---

## Edit 툴 미호출, 가짜 diff로 pass: 환각 버그 발각

`dev_blog` 저장소의 Blogger GitHub Actions 워크플로우에서 6시간마다 발송되는 실패 알림을 끊는 작업이었다. `publish-blogger.yml`에서 cron 스케줄 한 줄 빼고 `exit(1)`을 `exit(0)`으로 바꾸는 단순한 yaml 수정.

구현 서브에이전트가 diff.patch를 생성했다. verifier가 pass를 줬다. Stop hook도 통과했다. 그런데 실제 파일은 그대로였다.

```
line 9-10:  schedule:
              - cron: '0 */6 * * *'   ← 그대로 있음
line 56:    exit(1)                    ← 그대로 있음
```

`git status`는 변경 0건. 에이전트는 툴을 호출하는 대신 예상 결과를 예측해서 파일에 썼다. verifier는 그 가짜 diff와 실제 소스를 교차 확인하지 않고 pass를 줬다.

재현 조건으로 추정되는 건 세션 컨텍스트가 길어진 상태에서 구현 에이전트가 실행 대신 예측을 택하는 것이다. 단기 대책은 구현 후 `git diff HEAD`를 파이프라인에 명시하는 것. verifier도 diff.patch를 신뢰하기 전에 실제 git diff와 교차해야 한다. 재디스패치 후 두 번째에서 실제 변경이 적용됐고, 커밋 푸시까지 완료(`e623c86`).

---

## jidonglab v4: editorial-mono + build-in-public 피드로 전환

v3(cream+acid+rust 페이퍼톤)를 버리고 처음부터 다시 설계했다.

기존: "이런 프로젝트를 만들었습니다" 형식의 정적 카드 나열
새 방향: Claude Code 대화기록에서 자동 추출된 프롬프트·작업 단편·커밋·결과 스니펫이 시간순으로 흐르는 라이브 피드

3개 변주를 만들고 `editorial-mono.html`을 선택했다. 컬러는 모노톤 + 단일 액센트. 섹션 구조는 Now / Projects / Logs만 남긴다. 불필요한 About·Skills 섹션은 제거.

핵심 스크립트는 `extract-feed.mjs` — JSONL 로그에서 피드 엔트리를 뽑는다. `mock-feed.json`에 테스트 데이터를 넣고 검증까지는 됐다. GitHub API·commit hook 연동은 다음 단계다. 카피는 사람이 한 번 쓰고, 콘텐츠는 시스템이 매일 갱신한다. 사이트 정체성 = 활동 그 자체가 목표다.

---

## report-builder: 보고서 한 마디에 GitHub Pages 자동 발행

"보고서 줘" 한 마디에 딥서치 → HTML 보고서 생성 → `jee599/reports` GitHub Pages 자동 발행까지 돌아가는 스킬을 새로 만들었다.

파이프라인은 단순하다. 주제를 받으면 먼저 딥서치 방향과 포커스 키워드를 확인하고, 4개 각도로 병렬 리서치 에이전트를 디스패치한다. 결과를 합성해 HTML 보고서로 만들고 `~/reports/<slug>.html`에 저장 후 `jee599.github.io/reports`에 발행한다. 품질 기준은 최신·공식·실사례·해외 데이터·검증된 수치 우선, 1인 개발자 관점의 ROI 분석 포함.

이번 세션에서 생성된 첫 보고서는 AX 시장 진입 전략과 한국 AI 강의 플랫폼 분석이었다. 결론은 인프런이 "Claude Code·바이브코딩" 키워드 트래픽을 사실상 독점한다는 것. 짐코딩 단일 강의가 ₩198,000 × 6,236명에 도달한 게 이 시장 규모를 보여준다.

---

## ~/.claude 하네스 193M 정리 + 노트북 이식 번들

`harness-audit` 스킬로 전체 상태를 점검하고 불필요한 것들을 제거했다.

정리 목록:
- 루트 cruft 5개 (`.bak`, `.pre-diet` 등, ~20K)
- `marketingskills` 마켓플레이스 (3M, 비활성)
- `claude-mem` 고아 디렉토리 (100M — 레지스트리에 없는 채로 디스크에만 남아있던 것)
- `claude-code-skills` 마켓플레이스 (25M, 비활성)
- `plugins/cache/` 전체 (65M)

`~/.claude/plugins/`는 215M에서 4.6M으로 줄었다. 총 ~193M 회수.

동시에 전체 하네스를 다른 노트북에서 바로 구동할 수 있는 번들도 만들었다. `plugins/`, `sessions/`, `trajectories/` 같은 캐시를 제외하면 핵심 설정이 수십 MB 이내다. `claude-harness-bundle/setup-laptop.sh` 한 줄로 CLAUDE.md, 훅, 스킬, 설정이 모두 들어가는 구조다.

---

## spoonai 스킬 업그레이드: 섹션별 이미지 + 3줄 요약

`spoonai-daily-briefing` 스킬의 기사 생성 방식을 바꿨다.

변경한 것:
- 인라인 이미지 정책 뒤집기: "본문 이미지 금지" → "기사당 2~4장, 섹션 주제 직결 이미지"
- "내일 아침에 할 것" 섹션 제거 → 맨 마지막 `## 3줄 요약`으로 교체 (각 ≤ 40자)
- 문단 룰 신설: ≤ 3문장, ≤ 200자, 한 문장 ≤ 80자

codex cross-verify가 이 변경에서 5라운드를 돌았다. `countInlineImages` 로직 버그, multi-backtick 정규식의 nested-backtick edge case, cross-line over-stripping 문제가 연달아 나왔다. 라운드마다 specific한 버그를 지목해서 수정하는 방식으로 해결했다. 5라운드 끝에 approve를 받았다.

---

## 숫자

- 세션: 7개 (총 ~27시간)
- 총 tool calls: 435
- 도구별: Bash(271), Agent(59), Read(32), Edit(21), Write(14), TaskCreate(10)
- 환각 버그로 낭비한 라운드: 1 (Blogger 수정 재디스패치)
- codex cross-verify 라운드: 5 (spoonai 스킬 수정)
- 정리한 디스크: ~193M
- 신설 스킬: 1개 (report-builder)
- 생성한 파일: 9개 / 수정한 파일: 9개
