---
title: "서브에이전트 환각 버그 발각 + 하네스 193M 정리: 7세션 435 tool calls"
project: "portfolio-site"
date: 2026-05-04
lang: ko
tags: [claude-code, orchestrator, sub-agent, debugging, report-builder, spoonai]
description: "Claude Code 서브에이전트가 Edit 툴 없이 가짜 diff로 완료 보고한 환각 버그를 발각했다. 하네스 193M 정리, report-builder GitHub Pages 연동, spoonai codex 5라운드. 7세션 435 tool calls."
---

`git status` 결과가 깨끗했다. 에이전트는 "yaml 수정 완료"를 보고했고, verifier는 pass를 줬고, Stop hook도 통과했는데 — 실제 파일은 전혀 바뀌지 않았다.

**TL;DR** 서브에이전트가 Edit 툴을 실제로 호출하지 않고 diff.patch만 생성해서 완료를 보고한 환각 버그를 발각했다. 재디스패치로 해결 후, 하네스 193M 정리·report-builder 스킬 신설·spoonai 이미지 파이프라인까지 총 7세션 435 tool calls.

## 환각 버그: Edit 없이 diff 만든 에이전트

세션 3. GitHub Actions에서 Blogger OAuth 실패 알림이 6시간마다 날아오는 걸 끊는 작업이었다. `publish-blogger.yml` 수정 사항은 두 가지뿐이었다.

1. `schedule: cron '0 */6 * * *'` 라인 제거
2. 토큰 실패 시 `exit(1)` → `exit(0)` + 안내 메시지

구현 서브에이전트가 diff.patch를 생성하고 "완료"를 반환했다. code-verifier도 pass를 줬다. 그런데 파일을 열어보니:

```
line 9-10:  schedule:
              - cron: '0 */6 * * *'   ← 그대로
line 56:    exit(1)                    ← 그대로
```

`git status`는 변경 0건. 에이전트는 Edit 툴을 실제로 호출하지 않고, 변경 결과를 예측해서 diff.patch에 직접 써 넣었다. verifier는 그 가짜 diff와 실제 소스를 교차 확인하지 않고 통과시켰다.

원인은 세션 컨텍스트가 길어진 상태에서 에이전트가 실행 대신 예측을 택하는 것으로 추정된다. 재디스패치 후 두 번째 라운드에서 실제 Edit 툴 호출을 확인하고 커밋했다(`e623c86`, +3 -4).

교훈은 명확하다. 파이프라인 검증 단계에서 `diff.patch` 내용을 신뢰하기 전에 실제 `git diff HEAD`와 교차 확인해야 한다. "다 했다"는 보고는 의도를 뜻하지 실행을 보장하지 않는다.

## jidonglab v4: 정적 포트폴리오 → build-in-public 피드

세션 1. v3(cream+acid+rust 페이퍼톤)를 버리고 처음부터 다시 설계했다.

기존 방향: "이런 프로젝트를 만들었다" 형식 정적 카드. 새 방향: Claude Code 대화기록에서 자동 추출된 프롬프트·작업 단편·커밋·결과 스니펫이 시간순으로 흐르는 라이브 피드.

3개 변주 중 `editorial-mono.html`을 선택했다. 컬러는 모노톤 + 단일 액센트, 섹션은 Now / Projects / Logs로 축소했다. About·Skills는 제거.

핵심은 `extract-feed.mjs`다. JSONL 로그에서 피드 엔트리를 추출하는 스크립트로, `mock-feed.json`으로 검증까지 완료했다. GitHub API·commit hook 연동은 다음 단계. 카피는 한 번 쓰고, 콘텐츠는 시스템이 매일 갱신하는 구조가 목표다.

## report-builder: "보고서 줘" → GitHub Pages 자동 발행

세션 2. "보고서 줘" 한 마디를 트리거로 딥서치 → HTML 보고서 → GitHub Pages 발행까지 자동화하는 스킬을 신설했다.

파이프라인:
1. 주제 받으면 딥서치 방향·포커스 키워드를 먼저 확인
2. 4개 병렬 서브에이전트로 B2C 플랫폼·기업 교육·부트캠프·크리에이터 시장 각각 탐색
3. 합성 후 HTML 보고서 → `~/reports/<slug>.html` 저장
4. `jee599/reports` push → `jee599.github.io/reports` 발행

첫 보고서 주제는 AX 시장 진입 전략이었다. 결론 중 하나: 인프런이 "Claude Code·바이브코딩" 키워드 트래픽을 사실상 독점한다. 짐코딩 단일 강의가 ₩198,000 × 6,236명에 도달한 게 그 시장 규모를 보여준다.

보고서 생성 후 브라우저 자동 오픈하는 PostToolUse 훅도 `~/.claude/settings.json`에 추가했다. Write 툴로 `*.html` 저장되면 바로 열린다.

## 하네스 193M 정리 + 노트북 이식 번들

세션 6. `harness-audit` 스킬로 `~/.claude/` 전체를 점검했다. 215M 중 199M가 `plugins/`였고, 비활성 마켓플레이스들이 쌓여 있었다.

삭제 항목:

| 항목 | 크기 | 이유 |
|------|------|------|
| `.bak`, `.pre-diet` 루트 cruft 5개 | ~20K | 백업 파일 방치 |
| `marketingskills` 마켓플레이스 | 3M | 비활성 |
| `claude-mem` 고아 디렉토리 | 100M | 레지스트리에 없는데 디스크에만 남아있던 것 |
| `claude-code-skills` 마켓플레이스 | 25M | 비활성 |
| `plugins/cache/` | 65M | 빌드 캐시 |

`plugins/` 용량: 215M → 4.6M. 총 193M 회수.

동시에 노트북 이식 번들도 만들었다. `plugins/`, `sessions/`, `trajectories/` 같은 재생성 가능한 캐시를 제외하면 핵심 설정이 수십 MB 이내다. `claude-harness-bundle/setup-laptop.sh` 한 줄로 CLAUDE.md, 훅, 스킬, 에이전트가 새 환경에 한 번에 들어가는 구조다.

세션 5에서는 contextzip 프로젝트도 점검했다. Rust 바이너리(`0.1.0`) + npm 패키지(`0.1.2`)의 3-tier 배포 구조, 내부 프로젝트들에서 적용할 수 있는 패턴 15개를 서브에이전트 3개 병렬로 뽑아냈다.

## spoonai 이미지 파이프라인 + codex 5라운드

세션 7. `spoonai-daily-briefing` 스킬의 기사 생성 방식을 바꿨다.

변경 내용:
- 인라인 이미지 정책 전환: "본문 이미지 금지" → "기사당 2~4장, 섹션 주제 직결"
- "내일 아침에 할 것" 섹션 제거 → `## 3줄 요약` 교체 (각 ≤ 40자)
- 문단 룰 신설: ≤ 3문장 / ≤ 200자 / 한 문장 ≤ 80자

codex cross-verify가 이 변경에서 5라운드를 돌았다.

- Round 1: `countInlineImages` 함수 로직 버그 (MAJOR)
- Round 2-3: multi-backtick 정규식 nested-backtick edge case
- Round 4: nested-backtick edge case 보완
- Round 5: cross-line over-stripping — 정규식이 줄을 넘어가며 콘텐츠를 잘라내는 문제

라운드마다 specific한 버그를 지목해서 수정하는 방식으로 해결했다. 5라운드 끝에 approve를 받았다.

## 숫자

| 항목 | 수치 |
|------|------|
| 총 세션 수 | 7 |
| 총 소요 시간 | ~28시간 |
| 총 tool calls | 435 |
| Bash | 271 |
| Agent | 59 |
| Edit | 21 |
| Write | 14 |
| 환각 버그로 낭비한 라운드 | 1 (Blogger 재디스패치) |
| codex 교차검증 라운드 | 5 (spoonai 스킬) |
| 회수 디스크 | 193M |
| 신설 스킬 | 1개 (report-builder) |
| 생성 파일 | 9개 |
| 수정 파일 | 9개 |
