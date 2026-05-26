---
title: "Claude Code 병렬 에이전트로 하루 6개 도메인 — 18세션, 302 tool calls 오케스트레이션"
project: "portfolio-site"
date: 2026-05-27
lang: ko
tags: [claude-code, parallel-agents, automation, orchestration, build-log]
description: "하루 18세션, 302 tool calls. 골프앱 딥 리서치에서 에이전트 4개를 병렬로 띄워 41분에 끝냈다. 병렬 dispatch 패턴, Chrome headless PDF 파이프라인, Codex 교차검증 루프 실전 후기."
---

하루에 18세션이 찍혔다. tool call 302번, 생성 파일 15개, 수정 파일 9개. 창업지원 전략, 치과광고 SERP 분석, 공모전 전략, 골프앱 딥 리서치, P1 제품 일일보고서까지 6개 도메인을 같은 날 돌렸다.

**TL;DR** 가장 임팩트 있던 패턴은 골프앱 리서치 세션의 병렬 에이전트 dispatch였다. 리서치 도메인 4개를 에이전트 4개에 나눠 동시에 실행하고 41분 만에 전체 리서치를 완료했다. 순차 처리였다면 2~3시간 걸릴 작업이다.

## 병렬 에이전트 4개를 동시에 — 세션 15의 41분

세션 15가 이날의 핵심이었다. 골프앱 딥 리서치 brief를 Claude에 넘기면서 시작됐다.

지시는 단순했다. "한국 시장과 글로벌 시장 나눠서, 매칭앱과 스윙분석앱 각각 리서치해줘." 이걸 하나의 프롬프트로 던지고 기다렸다.

Claude는 독립적인 에이전트 4개를 동시에 dispatch했다.

- Agent "Korea golf matching apps" → `research_kr_matching.md`
- Agent "Global swing analysis" → `research_swing.md`
- Agent "Global golf matching" → `research_global_matching.md`
- Agent "Solo-founder monetization GTM legal" → `research_monetization.md`

각 에이전트는 웹 검색으로 소스를 수집하고, 독립적인 컨텍스트에서 실행됐다. 결과물이 차례로 들어왔다.

```
[완료] Global matching dossier — 4,769 단어, 80+ 출처 URL
[완료] Swing analysis dossier — 5,140 단어, confirmed/estimated/unverified 레이블 포함
[완료] KR matching dossier — 저장 완료
[완료] Monetization/legal dossier — 4,199 단어
```

4개 파일이 모두 들어오면 Claude가 이를 읽고 최종 리포트를 합성했다. 전체 소요 시간 41분, tool calls 51회.

이전 세션(12, 14)에서는 같은 구조의 에이전트를 dispatch했다가 중간에 agent가 kill됐다. 결국 세션 15에서 다시 시도해 성공했다. 실패 원인은 에이전트에 컨텍스트를 충분히 주지 않은 것이었다. 재시도 때는 brief를 파일 경로로 전달하고, 각 에이전트가 써야 할 출력 파일 경로를 명시했다.

## Chrome headless로 PDF 5개를 찍다

이날 생성된 PDF 리포트만 5개다. 모두 같은 파이프라인을 썼다.

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless --disable-gpu \
  --print-to-pdf=output.pdf input.html
```

wkhtmltopdf, pandoc, weasyprint 같은 별도 도구 없이 시스템 Chrome 하나로 해결한다. 세션 15에서 pandoc 설치를 시도했다가 실패했고, 골프앱 리서치 결과물은 결국 markdown으로만 남겼다. 그 경험이 "Chrome headless가 가장 안정적이다"는 확신을 줬다.

CSS를 잘 쓰면 A4 레이아웃, 페이지 브레이크, 폰트까지 정밀하게 맞출 수 있다.

```css
@media print {
  header, nav { display: none; }
  body { margin: 0; padding: 0; }
  @page { size: A4; margin: 20mm; }
}
```

창업지원 전략 리포트(10페이지, 2.5MB), 공모전 전략 리포트(13페이지, 2.9MB)가 이 방식으로 나왔다. P1 일일보고서는 4페이지, 522KB.

## 워크플로 분류 오분류 삽질

이날 반복적으로 나온 문제가 있었다. 오케스트레이터 훅이 작업 크기를 잘못 분류해서 Claude가 멈추는 것.

훅은 요청을 `trivial/simple/standard/major`로 분류하고, 분류에 따라 허용 도구와 단계를 제한한다. Hermes를 통해 들어온 요청들이 종종 과대 분류됐다.

세션 13에서는 `smoke.txt` 파일 하나를 쓰는 작업이 `major`로 분류됐다. Claude가 직접 "trivial로 재분류합니다"하고 넘어갔다. 세션 8에서는 보고서 생성 작업이 `major`로 분류돼서 verifier/codex 아티팩트 없이는 마무리가 안 되는 상황이 됐다. 여기서도 Claude가 `simple`로 내리고 직접 처리했다.

기준은 명확하다. 코드 변경이 없으면 `trivial`, 단일 파일 30줄 이하면 `simple`. 보고서 생성은 HTML 파일 하나를 쓰는 것이기 때문에 `simple`이 맞다. 분류 휴리스틱이 "리서치" 키워드에 반응해 `major`로 올려버리는 게 문제였다.

## Codex 리뷰 → 수정 루프 (세션 17-18)

세션 17에서 P1 제품 일일보고서 HTML을 만들었다. 세션 18에서 Codex read-only 리뷰가 blocker 2개를 잡아냈다.

**Blocker 1**: `오늘 버릴 것` 섹션에 제외 제품명(Daymoon, 골프앱, 담배 카운터, 펫 위젯, Open Design, 매매봇)이 그대로 노출됨. P1 보고서인데 non-P1 제품명이 본문에 들어가면 안 됐다.

**Blocker 2**: 날짜가 `(월)`로 표기됐는데 2026-05-26은 화요일.

수정은 단순했다. HTML `line 365`에서 제품명 목록을 `비-P1 제품 / 검증 대기 아이디어 / 별도 채널 작업`으로 교체. `line 229`에서 `(월)` → `(화)`. `Edit` 2회로 끝났다.

이후 Chrome headless로 PDF를 재생성하고 `pdftotext`로 제품명이 PDF에 남았는지 검증했다. tool calls 19회, 소요 1분.

Codex가 목록 형태로 blocker를 정리해주면 Claude가 그걸 순서대로 처리하는 구조다. 검토 비용이 낮고, 잡히는 문제의 질이 높다.

## 도구 사용 통계

| 도구 | 횟수 |
|------|------|
| Bash | 118 |
| Read | 59 |
| TaskUpdate | 28 |
| TaskCreate | 26 |
| Edit | 20 |
| Write | 18 |
| Agent | 14 |
| Grep | 10 |

Bash가 118회로 압도적이다. PDF 생성, `pdftotext` 검증, 파일 존재 확인이 반복됐기 때문이다. Agent 14회는 세션 15에서 4개를 동시에 dispatch한 영향이 크다.

주목할 비율은 Bash 대 Edit 비율이 118:20으로 약 6:1이다. 코드를 수정하는 것보다 실행·확인·재실행 사이클이 훨씬 더 자주 돌았다는 뜻이다. 이날 세션들이 구현 작업이 아니라 리서치·보고서 생성·데이터 정리 중심이었기 때문이다.

18세션 중 코딩이 목적인 세션은 없었다. 모두 리서치, 보고서 생성, 문서 정리였다.

> 302번의 tool call 중 방향 결정은 내가 했다. 나머지는 Claude가 판단하고 실행했다.
