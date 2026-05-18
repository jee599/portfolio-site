---
title: "Read 6번으로 의료광고 컴플라이언스 전수 검토: 차단 이슈 0건"
project: "portfolio-site"
date: 2026-05-18
lang: ko
tags: [claude-code, compliance, dental-ads, review, automation]
description: "파일 6개, Read 6번, 코드 수정 0줄. Claude Code로 한국 의료광고법 컴플라이언스를 자동 검토한 과정과, 차단 기준 명시가 결과 일관성에 어떤 영향을 주는지 정리한다."
---

파일 6개, Read 6번, 코드 한 줄 수정 없음. 오늘 세션의 전부다. 결과는 `OK`.

**TL;DR** 차단 항목을 프롬프트에 명시하고 출력 형식을 강제하면, Claude Code는 6개 파일을 훑고 의료광고 컴플라이언스 판정을 일관되게 내린다.

## 무엇을 검토했나

`dentalad` 프로젝트는 치과 광고 운영을 자동화한다. 매일 새벽 스크립트가 경쟁사 SERP를 수집하고, Claude가 분석 리포트를 생성한다. 이 리포트는 한국 의료광고법을 준수해야 한다.

오늘 검토 대상은 `2026-05-18` 날짜의 산출물 6개였다. `.md` 파일 5개와 HTML 리포트 1개다. 체크해야 할 항목은 다음과 같다.

필수 근거 레이블 누락 여부(`공식 확인`, `공개 SERP 관찰`, `운영 가설`, `수치 미확인`, `확인 필요`), 효과 보장성 문구 포함 여부(예: "반드시 효과 있음", "1등 병원"), CPC/CTR/CPA/ROAS 수치를 근거 없이 단정 서술했는지, HTML 리포트에 특정 병원명·주소 노출 여부, AI 생성 표시 및 출처 레이블 일관성, 필수 산출물이 모두 존재하는지.

수동으로 하면 파일 6개를 열어 항목마다 확인해야 한다. 10~15분짜리 반복 작업이다.

## 프롬프트 설계

Claude Code에 던진 프롬프트는 이 구조를 따랐다.

```
Read these files and perform a blocking-issues-only review for the
scheduled Korean medical/dental ads daily report.

Check for:
- missing required labels
- prohibited guarantees
- unstated CPC/CTR/CPA/ROAS/ad spend claims
- named hospital/address leakage in the HTML report
- contradictions about AI briefing/source labels
- whether required artifacts exist

Answer OK if no blocking issues, otherwise list only blockers.
Files: /Users/jidong/dentalad/research/daily-medical-dental-ads/2026-05-18-daily-...
```

세 가지를 의도적으로 설계했다.

**"blocking-issues-only"** — 범위를 제한했다. "개선할 점도 알려줘"를 붙이면 리포트가 두 배로 길어지고, 정작 중요한 차단 이슈가 묻힌다. 판단이 아니라 매칭이 되어야 한다.

**"Answer OK if no blocking issues"** — 출력 형식을 강제했다. 형식 없이 물으면 요약, 칭찬, 조건부 의견이 섞여 돌아온다. 결과를 파이프라인에 연결하려면 명확한 출력이 필요하다.

**파일 경로를 직접 나열** — 글로브 패턴 대신 절대 경로를 줬다. 리뷰 대상이 무엇인지 모호함이 없어야 한다.

## 결과: OK

세션 로그에는 `OK` 한 단어와 항목별 검증 요약이 남았다.

- **레이블**: `.md` 5개와 HTML 리포트 전체에서 증거 레이블이 일관되게 적용됨
- **보장성 문구**: 없음
- **수치 단정**: 없음. 수치는 전부 `수치 미확인` 또는 `확인 필요` 레이블로 처리됨
- **병원명·주소 노출**: 없음
- **AI 표시**: HTML §5에 AI 자동 생성 표시 존재, 출처 레이블 일관성 확인
- **산출물 존재 여부**: 6개 파일 모두 확인됨

도구 사용 패턴이 흥미롭다. `Read(6)`, Bash 없음. HTML 파일을 포함한 6개 전부를 쉘 명령어 없이 처리했다. HTML 태그를 걷어낼 필요 없이 Claude가 마크업을 통해 직접 내용을 파악한 덕분이다. 이전에 비슷한 작업을 `Bash 5번`으로 처리했던 것과 비교하면, 프롬프트 범위를 명확히 했을 때 tool call이 줄어드는 경향이 있다.

## 왜 일관성이 중요한가

기준이 모호하면 Claude는 날마다 다르게 판단한다. 어떤 날은 이슈로 잡고 어떤 날은 넘어간다. 자동화 파이프라인에서 이런 비일관성은 치명적이다.

차단 항목을 명시하면 체크리스트처럼 작동한다. "다음 항목 중 하나라도 해당하면 차단"이라는 구조는 주관적 판단을 없앤다. 자동화의 신뢰도는 기준의 명확함에서 나온다.

이 패턴은 치과 광고에만 국한되지 않는다. 법적 면책 문구 누락 확인, 개인정보 포함 여부 체크, API 응답에서 필드 누락 감지, 릴리즈 노트의 breaking change 표기 누락 등 "기준이 명확한 규칙 기반 검토"라면 동일하게 적용된다.

## 오늘 세션 통계

| 항목 | 값 |
|---|---|
| 세션 수 | 1 |
| 총 tool calls | 6 |
| Read | 6 |
| Bash / Edit / Write | 0 |
| 수정 파일 | 0 |
| 생성 파일 | 0 |
| 차단 이슈 | 0 |

수정·생성 파일이 0개인 건 이 작업의 성격이다. 검토는 읽기와 판단만 한다. 코드를 바꾸지 않는다. 사람의 시간은 판단이 애매한 예외 케이스에만 써야 한다.
