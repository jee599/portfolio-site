---
title: "Claude Code 하루 7세션 854 calls: jidonglab 포트폴리오 허브 전환기"
project: "portfolio-site"
date: 2026-03-18
lang: ko
tags: [claude-code, portfolio, automation, astro]
description: "하루 7세션 854번의 tool call로 4개 프로젝트를 동시에 운영했다. jidonglab을 AI 뉴스 사이트에서 포트폴리오 허브로 전환하고 JSONL 기반 빌드 로그 자동화 파이프라인을 구축한 과정."
---

하루에 854번. Bash 403번, Read 159번, Edit 124번, Write 117번. 7개 세션, 4개 프로젝트.

숫자만 보면 뭔가 대단한 일을 한 것 같다. 실제로는 그냥 평범한 하루였다. Claude Code로 여러 프로젝트를 동시에 굴리다 보면 이게 기본값이 된다.

**TL;DR** `jidonglab.com`을 AI 뉴스 사이트에서 프로젝트 포트폴리오 허브로 전환했다. `.jsonl` 세션 로그에서 빌드 로그를 자동 생성하는 파이프라인도 붙였다. 그리고 GitHub API 403이 터졌다.

## AI 뉴스 사이트를 포트폴리오로 바꾸기로 한 이유

`jidonglab.com`은 원래 AI 뉴스 자동 발행 사이트로 시작했다. 매일 오전 9시, 오후 9시에 Claude가 뉴스를 크롤링해서 포스트를 자동으로 올린다. 잘 돌아가긴 한다.

근데 문제가 있었다. 로컬에 11개 git 프로젝트가 있는데 포트폴리오에 등록된 건 7개뿐이었다. 빌드 로그는 수동으로 써야 했다. 가장 중요한 게 가장 방치된 상태였다.

판단을 내렸다. AI 뉴스는 사이드 기능으로 두고, 메인은 프로젝트 허브로 전환한다.

## 프롬프트 하나로 50시간치 작업 지시하기

전환 작업의 구현 계획은 마크다운 스펙으로 작성해서 Claude에 통째로 넘겼다.

```
Implement the following plan:
# jidonglab 포트폴리오 허브 리뉴얼
## Context
jidonglab.com을 AI 뉴스/블로그 사이트가 아니라
프로젝트 포트폴리오 허브로 전환한다...
```

이 프롬프트 하나가 세션 2 전체를 이끌었다. 331개 tool call. Bash 213번, Edit 44번, Read 41번.

Claude가 알아서 한 일들: `src/content/config.ts` 스키마에 `visible` 필드 추가, `scripts/project-registry.yaml` 생성, 어드민 페이지에 Projects + Build Logs 탭 신설, `src/pages/projects/index.astro`와 `[slug].astro` 라우팅 구성.

물론 중간에 여러 번 막혔다. 가장 골치 아팠던 건 GitHub API 403이다.

## GitHub API 403: 조용히 문제 키우기

어드민에서 프로젝트 상태를 변경했더니 에러가 났다. 메시지는 심플했다.

```
github api error 403
```

원인을 파고들었다. 어드민의 `admin-projects.ts` API 라우트가 프로젝트 정보를 읽을 때 GitHub API를 호출하고 있었다. 인증 없이. Rate limit에 걸린 것이다.

해결책은 단순했다. 프로젝트 정보는 로컬 YAML 파일에서 읽으면 된다. GitHub API를 굳이 거칠 이유가 없었다. 그냥 처음부터 없었어야 할 의존성이었다.

해당 커밋 메시지: `fix: admin projects GET — GitHub API 호출 제거, rate limit 방지`

Rate limit 관련 버그의 특성이 이렇다. 개발할 때는 안 터진다. 배포하고 나서 실제로 쓰다 보면 터진다. Claude가 구현할 때 일단 돌아가게 만드는 방식으로 코드를 쓰다 보면 이런 edge case가 생긴다. 프롬프트에 "외부 API 호출을 최소화해라"는 제약을 명시했어야 했다.

## `.jsonl`에서 빌드 로그를 뽑는다는 아이디어

세션 중에 흥미로운 질문이 나왔다.

> "빌드 로그 대신 프로젝트 `.jsonl`? 이렇게 남는 거 뭐야? `.claude`에 로컬"

Claude Code는 모든 세션 대화를 `~/.claude/projects/` 아래에 `.jsonl` 파일로 저장한다. 세션마다 하나씩. 대화 내용, 도구 사용 기록, 타임스탬프가 전부 들어있다.

이걸 파싱하면 빌드 로그 초안을 자동으로 만들 수 있다는 생각이 들었다.

```
그러면 어떻게 jsonl 기반으로 프로젝트별 로그,
프롬프트 내용, 작업 어떻게 했는지 정리해서 남길 수 있어?
```

Claude가 `scripts/parse-sessions.py`를 만들었다. `.jsonl` 파일을 읽어서 사용자 프롬프트, 도구 사용 통계, 생성/수정된 파일 목록을 뽑아내는 스크립트다.

이게 지금 이 빌드 로그를 생성하는 파이프라인의 기반이다. 세션이 끝나면 Python 스크립트가 `.jsonl`을 파싱하고, 그 결과를 Claude에 넘겨서 블로그 글을 쓰게 한다. `generate-build-log.sh`가 전체 과정을 오케스트레이션한다.

자동화에 투자한 시간은 며칠 안에 회수된다. 빌드 로그를 수동으로 쓰면 30분은 걸린다. 지금은 스크립트 실행 한 번이면 된다.

## 하루에 4개 프로젝트를 굴리는 방식

이날 건드린 프로젝트 목록: portfolio-site, LLMMixer(신규), uddental(치과), saju_global(사주 앱).

각 프로젝트에서 한 일의 크기가 다르다. LLMMixer는 새 프로젝트 전체 아키텍처를 잡는 50시간짜리 대형 작업이었다. uddental은 "홈페이지 제목 계층 반전됐다"를 2분 세션으로 처리했다. 사주 앱은 토스페이먼츠 계약 심사 요구사항(사업자정보 푸터, 상품 섹션 추가) 대응이었다.

이 조합이 Claude Code 없이는 불가능하다. 컨텍스트 전환 비용이 너무 크다. 치과 프로젝트에 들어가려면 그 코드베이스를 다시 파악해야 하고, 사주 앱에 들어가려면 또 새로 파악해야 한다. Claude Code는 그 비용을 흡수한다.

프롬프트 패턴이 핵심이다. 짧은 작업에는 "이 프로젝트 들어가서 XX 고쳐줘"가 전부다. Claude가 코드베이스를 읽고, 문제를 진단하고, 수정하고, 커밋까지 한다. 사람이 할 일은 결과를 확인하는 것뿐이다.

## 스킬 생태계를 구축하기 시작한 날

이날 세션에서 눈에 띄는 게 하나 더 있다. `superpowers`, `engineering-skills`, `product-skills`, `marketing-skills`를 잇달아 설치했다.

Claude Code의 스킬 시스템은 특정 작업 유형에 맞는 워크플로우를 미리 정의해두는 방식이다. TDD, 디버깅, 코드 리뷰, PRD 작성 등. 스킬이 있으면 "TDD로 구현해줘"라는 한 마디가 테스트 작성 → 구현 → 리팩토링 사이클 전체를 의미하게 된다.

설치 중 오타 하나로 삽질하기도 했다.

```bash
# 이렇게 한 줄에 붙여 보냈더니 URL 파싱 에러
/plugin marketplace add coreyhaines31/marketingskills
/plugin install marketing-skills

# 따로따로 실행해야 했다
```

사소하지만 이런 게 쌓이면 시간을 먹는다.

## 도구 사용 패턴에서 보이는 것

Bash 403번이 압도적 1위다. 두 번째가 Read 159번.

Bash가 많다는 건 `npm run build`, `git commit`, `python script.py` 같은 실행 작업이 많다는 뜻이다. Read가 Edit보다 많은 건 파악을 먼저 하고 수정에 들어가기 때문이다. 이 비율이 적절하다. 코드를 안 읽고 수정하면 사이드 이펙트가 생긴다.

Write가 117번이나 된 건 LLMMixer 신규 프로젝트 덕분이다. 새 파일 78개가 하루 만에 생겼다.

> 큰 작업을 쪼개면 각 단계의 품질이 올라간다. 쪼개지 않으면 Claude가 알아서 쪼개는데, 그 기준이 내 기준과 다를 때 문제가 생긴다.
