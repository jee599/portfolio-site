---
title: "Claude Code 하루 789 tool calls — 사이트 재건·지원서·파이프라인 3종 동시 진행"
project: "portfolio-site"
date: 2026-06-10
lang: ko
tags: [claude-code, fable-5, dynamic-workflow, 자동화, 이메일-파이프라인]
description: "하루에 커피챗 사이트 재건(279 tool calls·3h19m), SparkClaw 지원서, JDLab 이메일 파이프라인 3세션 정비, 치과 에이전트 보고서 퀄업까지. Claude Fable 5, 11세션 789 tool calls 기록."
---

11개 세션, 789번의 tool call, 수정 30개 파일, 생성 38개 파일. 2026-06-10 하루다.

**TL;DR** 커피챗 사이트를 3시간 19분 만에 이력서 빌더+포트폴리오 체커+AI 모의면접 플랫폼으로 재건했다. 같은 날 스타트업 가속기 지원서를 Claude가 채우고, JDLab 이메일 파이프라인을 3세션 연속으로 정비했으며, `CLAUDE.md` 한 줄로 Dynamic Workflow 자율 실행을 열었다.

## 279 tool calls: 커피챗을 3시간 만에 뒤집다

커피챗은 원래 멘토-멘티 매칭 사이트였다. 요청은 세 기능으로 완전히 바꾸는 것이었다.

> "이력서 만들어주고, 포트폴리오 점검해주고, 에이전트 3명을 둬서 에이전트는 글로 쓰고 사람은 말로 하게 해서 모의면접을 하는 사이트를 만들고 싶어"

기존 코드 파악, API 라우트 설계, 컴포넌트 구현, 디자인 반복 피드백까지 한 세션에서 끝냈다. 디자인 피드백은 5라운드 이상이었다. "AI 티 나지 않게", "toss 톤으로", "주황색 갈색 별로 안 예뻐", "면접 진행 과정을 메인에 예시로 보여줘". 매 피드백마다 Bash로 브라우저 렌더를 직접 확인했다.

산출물: `~/coffeechat` Next.js 앱, API 라우트 5개(`/interview/setup`, `/interview/turn`, `/interview/report`, `/polish`, `/portfolio`), 컴포넌트 20여 개. GPT Image 2.0 API로 3D 에셋을 생성해서 파비콘부터 섹션 이미지까지 붙였다.

이력서 빌더는 5단계 위저드로 구성된다. 항목별 "AI 다듬기" 버튼이 성과 중심 문장 변환과 수치 코칭 팁을 같이 반환한다. 면접 에이전트는 포트폴리오나 채용 공고를 입력받아 꼬리를 무는 방식으로 진행한다. 잘 모르겠다는 답변이 나오면 방향을 바꿔서 다시 묻는다. 직군별 질문 분기(개발자·서버/게임/백엔드/프론트엔드)와 포트폴리오 기반·기본지식·전문지식 트랙도 세션 중에 추가됐다.

3시간 19분, Bash 132번, Edit 40번, Write 28번, browser_batch 33번. 코드 한 줄 직접 안 썼다.

## JDLab 이메일 파이프라인: 3세션 연속 정비

세션 4·5·6은 `local-commerce-agent`의 JDLab 아웃바운드 파이프라인을 연속으로 다뤘다.

**세션 4** — 이미 답장을 받아 resolved된 회사가 여전히 hot-lead 큐에 남아 있었다. `state/jdlab_resolved_replies.json`을 만들어서 resolved 상태를 분리했고, 인보이스 기본값에 하드코딩된 실제 이메일 주소 2개를 `paypal-hot-leads.example.json`으로 이동했다.

**세션 5** — 바운스 CSV가 특정 타임스탬프 파일명에 하드코딩돼 있었다. 새 감사 파일이 생겨도 자동으로 찾지 못하는 구조였다. `resolveBounceCsvSelection()`을 만들어서 `~/.hermes/document_cache/`에서 패턴 매칭으로 가장 최신 파일을 자동 선택한다. 기존 28개 + 신규 3개, 31개 테스트 통과. Bash 12번, Edit 9번.

**세션 6** — 전체 파이프라인 감사. 33분, 107 tool calls. 무료 메일 도메인 억제 수정, MX 레코드 프리플라이트 체크 추가, 드래프트 루프 원자 쓰기·run_id 교차 검증, 예외 포착 전면 보강. 감사 결과는 `outputs/reviews/claude_jdlab_codex_cron_audit.md`에 저장했다. Edit 43번, Bash 32번.

**세션 8** — 품질 업그레이드. 38분, 111 tool calls. 연락처 티어링(C-suite·VP·Director·Manager 가중치), 전송 윈도우 상한선 조정, 템플릿 반복 억제 캡. 테스트 파일 6개 신규 작성. `jdlab_contact_tier.test.js`, `jdlab_copy_calibration.test.js`, `jdlab_send_window_caps.test.js` 등.

4개 세션을 한 줄로 정리하면 "돌기는 하는데 믿을 수 없는" 상태에서 "감사 가능한" 상태로 바뀌었다.

## SparkClaw 지원서: Claude가 폼을 채웠다

세션 7은 2시간 31분, 71 tool calls. SparkClaw 스타트업 가속기 지원서 작성이다.

방식은 단순하다. 폼 텍스트를 그대로 프롬프트에 붙여넣으면 Claude가 메모리에서 프로젝트 정보와 치과 파일럿 실측 데이터를 꺼내 항목별로 채운다. 첫 버전은 AI 말투가 역력했다.

> "ai가 써준 톤 빼고, 설득력 + 전문성 있고 나의 경험과 지식을 많이 녹여줘. 파일럿 치과에서 받은 돈 없어. 그냥 지금 실제 내가 광고 돌리는게 진짜 도움이 되는지 확인 중"

두 번째 버전부터는 실측 숫자와 직접 겪은 상황이 본문에 들어갔다. "진단 점수가 틀리면 영업 자료와 실행 계획이 무너진다"처럼 가설 대신 실제 발견 사례를 썼다. "첫째/둘째" 나열형 구조와 불필요한 볼드도 걷어냈다.

같은 세션에서 회사 소개 one-pager PDF도 만들었다. open-design 루트, A4 1페이지, PDF 변환까지 완료. 지원사업·공모전·크레딧 리서치 워크플로우도 돌렸다 — 결과를 HTML 보고서로 렌더링해서 브라우저에 바로 띄웠다.

한 가지 확인한 것: SparkClaw가 제공하는 "Claude Tier 4 크레딧"이 뭔지 세션 중에 물었다. Claude API 고티어 프리 크레딧이다. 실제로 지원할 만한 프로그램인지, 대안으로 어떤 게 있는지도 서울 기준으로 서칭했다.

## CLAUDE.md 한 줄로 Dynamic Workflow 자율 실행

세션 10에서 `~/.claude/CLAUDE.md`를 수정했다.

```
Dynamic workflow (standing opt-in): Jidong grants standing authorization for the Workflow tool
— Claude decides on its own judgment when task size/efficiency warrants multi-agent orchestration.
Sizing guide: ① lookup/single-file edit → direct; ② multi-file work that fits one context
→ Agent subagents as needed; ③ broad fan-out work → launch a dynamic Workflow.
```

이전까지는 매번 "다이나믹 워크플로우로 해줘"라고 명시해야 했다. 이제 Claude가 작업 규모를 보고 직접 판단한다. fan-out으로 분류되는 기준은 여러 독립 단위에 걸친 감사·리뷰·마이그레이션·리서치, "전수/꼼꼼히/thorough/comprehensive" 키워드, 또는 독립 작업 10개 이상이다.

정책을 추가하고 바로 같은 세션에서 적용됐다. 치과 에이전트 보고서 퀄업 요청에 Claude가 자율 판단으로 Workflow 5단계·에이전트 11개를 띄웠다. Context 복원 → 병렬 재실측 3개 → 보고서 수정 → 검증 → 기록·커밋·푸시. 약 85분. 산출물은 `~/dental-promo/dongbaek-uddental/2026-06-10/`에 HTML+PDF 2종이 생성됐다.

설정 비용 7분, 효과는 이후 모든 세션에 적용된다.

## 서브에이전트와 Workflow는 같은 층이 아니다

세션 3에서 나온 질문이 결과적으로 중요한 개념 정리가 됐다.

> "서브에이전트 쓰면 dynamic workflow 못 써?"

둘은 배타적이지 않다. Workflow가 서브에이전트를 감싸는 구조다. 워크플로 스크립트 안의 `agent()` 호출 하나하나가 곧 서브에이전트고, `pipeline()`과 `parallel()`은 그 서브에이전트들의 실행 순서와 동시성을 정하는 틀이다. `agentType` 옵션으로 `dental-clinic`이나 `code-reviewer` 같은 커스텀 에이전트를 파이프라인 단계로 집어넣을 수 있다.

치과 에이전트 작업이 Workflow 대상이 아닌 이유도 같은 맥락이다. 동백유디 한 곳의 재실측→보고서→기록은 서로 의존하는 연속 작업이라 fan-out이 없다. 하나의 에이전트가 `clinic.json`·`history.json`·`cache`를 통째로 들고 있는 게 품질에 유리하다.

## 도구 사용 통계 (전체 11세션)

| 도구 | 사용 횟수 |
|---|---|
| Bash | 298 |
| Edit | 165 |
| Read | 105 |
| TaskUpdate | 62 |
| Write | 48 |
| TaskCreate | 33 |
| browser_batch | 33 |
| Agent | 13 |
| **합계** | **789** |

Bash가 38%다. 대부분 테스트 실행과 브라우저 렌더 확인이다. Edit이 21%로 두 번째 — 파일을 새로 쓰는 것보다 기존 파일을 수정하는 작업이 훨씬 많다. `browser_batch` 33회는 coffeechat 세션에서 UI 렌더를 직접 눈으로 확인할 때 썼다.

세션 11은 월 크레딧 한도 초과로 4번 만에 중단됐다. 세션 1·2도 같은 이유. 하루 총 가용 세션 중 3개가 한도 벽에 막혔다.
