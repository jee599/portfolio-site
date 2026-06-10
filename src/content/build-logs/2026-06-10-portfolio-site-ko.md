---
title: "CLAUDE.md 한 줄로 Dynamic Workflow 자율 실행 권한 열기"
project: "portfolio-site"
date: 2026-06-10
lang: ko
tags: [claude-code, dynamic-workflow, claude-md, orchestration, multi-agent]
description: "CLAUDE.md에 standing 승인 한 줄을 추가하면 Claude가 작업 규모를 스스로 판단해 멀티에이전트 workflow를 자율 실행한다. 5개 세션, 12회 tool call, 수정 파일 1개의 기록."
---

Claude Code가 멀티에이전트 오케스트레이션을 실행하려면 기본적으로 매번 사용자 승인이 필요하다. `CLAUDE.md`에 standing 승인 정책 한 줄을 추가하면 다음 세션부터 Claude가 작업 규모를 보고 알아서 Workflow를 띄운다. 정책 파일 하나가 동작 방식을 바꾸는 실험이었다.

**TL;DR** 글로벌 `~/.claude/CLAUDE.md`에 dynamic workflow standing 승인을 추가해 Claude가 작업 사이즈를 판단해 자율적으로 멀티에이전트 workflow를 실행할 수 있게 됐다. 수정한 파일은 1개, 소요 시간은 6분.

## 왜 매번 승인 요청이 문제인가

Claude Code는 기본적으로 Workflow 도구 실행 전 사용자 확인을 기다린다. 광범위한 감사나 다수 파일에 걸친 작업에서 이게 병목이다. 작업이 명확히 fan-out 성격임에도 매번 "workflow 써도 돼요?"를 묻는 구조다.

이번 세션의 출발점은 간단한 요청이었다.

> "판단에 따라 필요하면 작업 사이즈에 따라 dynamic workflow를 사용할 수 있게 하고 싶어. 작업의 효율에 맞게"

이걸 구현하는 가장 간단한 방법이 `CLAUDE.md`에 정책을 박아두는 것이다. 코드가 아니라 텍스트로 동작을 바꾸는 방식.

## CLAUDE.md 정책 추가: 3단계 사이즈 판단 기준

`~/.claude/CLAUDE.md`의 Routing 섹션에 사이즈 판단 기준을 추가했다. Edit 도구 2회, Read 도구 1회, Bash 4회로 완료됐다.

단계별 기준은 이렇다. 단순 조회나 단일 파일 수정은 Claude가 직접 처리한다. 멀티파일이지만 하나의 컨텍스트에 들어가는 작업은 필요한 만큼만 서브에이전트를 쓴다. 광범위한 fan-out 작업은 Workflow를 실행한다.

세 번째 조건의 기준이 핵심이다. 광범위 fan-out으로 분류되는 작업은 여러 독립 단위에 걸친 감사·리뷰·마이그레이션·리서치, "전수/싹/꼼꼼히/thorough/comprehensive" 같은 키워드가 들어간 요청, 또는 대략 10개 이상의 독립 작업 단위다.

추가로 에이전트 수를 최대로 쓰는 게 아니라 작업에 맞게 조정하는 원칙도 박았다. Fan-out 전에 한 줄로 무엇이 병렬화되는지, 대략 몇 개 규모인지 먼저 알려야 한다.

## 모델과 effort 레벨 변경

같은 세션에서 `/model` 커맨드로 기본 모델을 Fable 5로 전환했다. 이 시점 이후 세션들이 Fable 5 기반으로 돌아간다.

세션 5에서는 `/effort xhigh`로 추가 조정했다. Fable 5와 Opus 4.8/4.7 전용 설정으로 "high보다 깊은 추론, 최대치 바로 아래" 레벨이다. 설정 자체는 1분이면 끝나는 일이지만, 이후 세션의 출력 품질에 직접 영향을 준다.

## 서브에이전트와 Workflow는 배타적이지 않다

세션 5에서 나온 질문이 있었다.

> "서브에이전트 쓰면 dynamic workflow 못 써?"

결론부터: 둘은 배타적이지 않다. Workflow가 서브에이전트를 포함하는 구조다. 워크플로 스크립트 안의 `agent()` 호출 하나하나가 곧 서브에이전트다. `pipeline()`과 `parallel()`은 그 서브에이전트들을 어떤 순서와 동시성으로 실행할지 정하는 틀이다.

커스텀 에이전트 타입도 Workflow 안에서 쓸 수 있다. `agent(프롬프트, {agentType: 'dental-clinic'})` 형태로 치과 에이전트나 코드 리뷰어를 파이프라인 단계로 집어넣는 게 가능하다. Workflow가 단순한 병렬 실행 도구가 아니라 에이전트 타입별로 전문화된 역할을 묶는 오케스트레이션 레이어인 이유다.

## 치과 에이전트 현황 확인

세션 3에서 치과 에이전트(동백유디) 상태를 확인했다. 이번 세션에서 새로 돌린 건 없었고, 마지막 작업이 4일 전(6/6)이었다. 보고서 퀄리티 업 요청이 들어왔고, 이건 라우팅 규칙에 따라 `dental-clinic` 에이전트에 위임했다. Agent 도구 1회 사용.

메인 세션이 직접 하지 않는 이유는 명확하다. 치과 에이전트가 `clinic.json`, `history.json`, `cache` 전체를 읽어 컨텍스트를 복원한 뒤 작업하는 구조이기 때문에, 메인 세션에서 같은 파일들을 다시 읽고 처리하는 건 중복이다.

## 커피챗 사이트 리뉴얼 — 기획 단계

세션 4에서 완전히 다른 프로젝트 요청이 들어왔다.

> "커피챗 사이트를 리뉴얼해서 멘토-멘티 이어주는 플랫폼이 아니라, 이력서 생성, 포트폴리오 점검, 에이전트 3명으로 모의 면접 하는 사이트로 만들고 싶어"

기존 코드를 찾기 위해 Bash 4회로 디렉토리를 훑었고, 기획 확인 단계에서 세션이 끝났다. 구현은 다음 세션으로 넘어갔다.

세 기능 각각 결정이 필요한 부분이 다르다. 이력서 생성은 입력 형태(설문 vs 자유 입력), 포트폴리오 점검은 제출 방식(URL vs 파일 업로드), 모의 면접은 에이전트 3명의 역할 배분과 음성 입력 스택 선택이 핵심이다. 이 결정들이 구현 방향을 결정한다.

## 통계

<div class="change-summary">
<table>
<thead><tr><th>항목</th><th>값</th></tr></thead>
<tbody>
<tr><td class="label">총 세션 수</td><td class="after">5개</td></tr>
<tr><td class="label">실제 도구 사용 세션</td><td class="after">2개 (세션 3, 4)</td></tr>
<tr><td class="label">총 tool call</td><td class="after">12회</td></tr>
<tr><td class="label">도구별 (Bash / Edit / Read / Agent)</td><td class="after">8 / 2 / 1 / 1</td></tr>
<tr><td class="label">수정 파일</td><td class="after">1개 (~/.claude/CLAUDE.md)</td></tr>
<tr><td class="label">소요 시간 (유효 세션)</td><td class="after">약 7분</td></tr>
<tr><td class="label">기본 모델</td><td class="after">Fable 5로 변경</td></tr>
</tbody>
</table>
</div>

이번 세션에서 배운 핵심은 하나다. Claude의 동작 방식은 코드가 아니라 정책 파일로 바꿀 수 있다. `CLAUDE.md` 텍스트 한 단락이 이후 모든 세션에서 Workflow 자율 실행 여부를 결정한다. 설정 비용 6분, 효과는 이후 모든 세션에 적용된다.
