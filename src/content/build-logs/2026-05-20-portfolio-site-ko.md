---
title: "의료광고 컴플라이언스 QA: Claude가 16번의 tool call로 차단 이슈 1개 잡은 과정"
project: "portfolio-site"
date: 2026-05-20
lang: ko
tags: [claude-code, compliance, review, medical-ad, claude-opus]
description: "코드 한 줄 안 쓰고 Claude Code로 의료광고 컴플라이언스 리뷰를 자동화했다. 3세션, 16회 tool call 만에 차단 이슈 1개를 잡고 OK 판정까지 받은 과정."
---

의료광고 보고서 하나를 출력하기 전, claude-opus-4-7이 16번의 tool call로 차단 이슈를 스스로 찾아냈다.

**TL;DR** 코드가 아닌 컴플라이언스 QA에 Claude Code를 썼다. 첫 세션에서 "지원되지 않는 사실 주장"이라는 차단 이슈를 정확히 집어냈고, 두 번째 세션에서 수정 확인, 세 번째 세션에서 최종 OK. 총 소요 시간: 2분 남짓.

## 배경: 의료광고에는 틀리면 안 되는 문장이 있다

한국 의료광고 심의 기준은 까다롭다. 근거 없는 수치, 미지원 주장, 특정 병원명 노출, 심의번호 오용 — 이 중 하나만 걸려도 보고서 전체가 날아간다. 매일 생성되는 보고서를 사람이 일일이 검수하는 건 비효율적이다. 그래서 Claude Code를 리뷰어로 투입했다.

첫 번째 프롬프트는 이렇게 생겼다:

```
Read these files and do a blocking-issues-only final review for today's
scheduled Korean medical/dental ads report. Check: contradictions,
missing required labels/caveats, prohibited guarantees,
named hospital/address leakage, stale dates around 5/07 vs 5/14...
```

"blocking-issues-only"가 핵심이다. 전체 리뷰를 요청하면 노이즈가 많아진다. 실제로 막아야 할 이슈만 보고하도록 범위를 좁혔다.

## 세션 1: Read 6번, Bash 4번으로 6개 파일 전수 검토

claude-opus-4-7은 6개 파일을 읽었다: `2026-05-20-daily-update.md`, `rolling-knowledge-base.md`, `source-index.md`, 그리고 HTML 보고서 포함. 총 Read 6번, Bash 4번.

결과는 두 가지였다.

**차단 이슈 (blocking)**: `reports/2026-05-20-mobile-powerlink-layout-and-info-ai.html` 2번 섹션, 공지 30960 관련 bullet이 지원되지 않는 사실 주장을 포함하고 있었다. 의료광고 심의위원회 문의처가 본문에 포함된 형태였는데, 실제 심의 문서에서 근거를 찾을 수 없는 내용이었다.

**버그 (numbering)**: `rolling-knowledge-base.md`에 중복 헤더가 있었다. `### 5.7 2026-05-19`와 `### 5.8 2026-05-20`이 동시에 존재했다. 차단 수준은 아니지만 데이터 일관성 문제라 같이 플래그했다.

코드 변경은 0건. Claude는 읽고 보고만 했다. 수정은 사람 몫이었다.

## 세션 2: 수정 후 재검증

수정이 완료된 뒤 두 번째 세션을 열었다. 프롬프트는 훨씬 좁았다:

```
Re-check only the prior blocker after fixes.
Read reports/2026-05-20-mobile-powerlink-layout-and-info-ai.html
and rolling-knowledge-base.md.
Answer OK if the unsupported 30960 claim is gone
and the KB duplicate 5.7/5.8 issue is fixed;
otherwise list exact remaining issue.
```

두 파일만 읽었다. Bash 2번, Read 2번. 이전 세션의 컨텍스트를 넘기지 않고, 고쳤다는 사실만 전달하고 독립적으로 재검증시켰다. 이 세션에서는 아직 남은 이슈가 있었다.

## 세션 3: 최종 OK — tool call 2번

마지막 세션. 프롬프트를 더 정밀하게 좁혔다:

```
Blocking-only recheck. Read ONLY reports/2026-05-20-mobile-powerlink-layout-and-info-ai.html
and rolling-knowledge-base.md.
Confirm: (1) HTML no longer says '의료광고 심의위원회 문의처가 본문에 포함',
(2) KB no longer has duplicate headers '### 5.7 2026-05-19' and '### 5.8 2026-05-20'.
Answer exactly OK if fixed; otherwise list issue.
```

Read 2번. 응답: `OK`.

## 전체 통계

| 항목 | 수치 |
|------|------|
| 총 세션 | 3 |
| 총 tool calls | 16 |
| Read | 10 |
| Bash | 6 |
| 수정 파일 | 0개 |
| 생성 파일 | 0개 |
| 차단 이슈 발견 | 1건 |
| 소요 시간 | 약 2분 |

## 배운 것: 좁은 프롬프트가 정확한 결과를 만든다

이번 세션에서 얻은 가장 큰 인사이트는 프롬프트 설계다. "전체 리뷰해줘"가 아니라 "blocking 이슈만 보고해줘"로 범위를 잡았더니, 실제로 막아야 할 것만 올라왔다. 두 번째, 세 번째 세션에서는 읽어야 할 파일도 딱 2개로 제한했다. 컨텍스트가 좁을수록 답이 빠르고 정확했다.

의료광고 컴플라이언스는 "확인해야 할 항목 목록"이 명확하다. 그 목록을 프롬프트에 그대로 넣으면 Claude는 체크리스트 실행기가 된다. 코드 리뷰와 같은 논리다.

`answer exactly OK if fixed; otherwise list issue` — 이 패턴이 핵심이다. 애매한 답을 막고, 사람이 바로 다음 행동을 결정할 수 있는 응답을 강제한다.

## 다음

매일 아침 보고서가 자동 생성된다. 지금은 사람이 프롬프트를 직접 입력하고 있는데, 이걸 GitHub Actions 단계에 QA 스텝으로 붙이는 게 자연스러운 다음 단계다. 보고서 생성 → Claude 리뷰 → OK면 배포, FAIL이면 알림. 코드 변경 없이 Claude Code를 QA 게이트로 쓰는 구조다.
