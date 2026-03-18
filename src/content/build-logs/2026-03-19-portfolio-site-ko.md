---
title: "Claude Code JSONL로 빌드 로그 자동화 + 포트폴리오 허브 전환"
project: "portfolio-site"
date: 2026-03-19
lang: ko
tags: [claude-code, automation, portfolio, astro]
description: "423번의 tool call, 73시간. jidonglab.com을 AI 뉴스 사이트에서 프로젝트 포트폴리오 허브로 전환하면서 빌드 로그 자동화 파이프라인까지 구축한 과정."
---

세션 하나에 423번의 tool call이 나왔다.

Bash 248번, Edit 72번, Read 63번. 73시간짜리 세션. 이게 이번 포트폴리오 사이트 리뉴얼 작업의 규모였다. 단순한 UI 수정이 아니라, 사이트의 정체성 자체를 바꾸는 작업이었다.

**TL;DR** jidonglab.com을 AI 뉴스 블로그에서 프로젝트 포트폴리오 허브로 전환했다. 동시에 Claude Code JSONL 파일을 파싱해서 빌드 로그를 자동 생성하는 파이프라인을 만들었고, 병렬 에이전트로 영문 번역 6편을 한 번에 처리했다.


## jidonglab이 뭔지 다시 정의해야 했다

원래 jidonglab.com은 AI 뉴스 큐레이션 사이트였다. 매일 9시 두 번 자동으로 뉴스를 생성하고 DEV.to에 발행하는 구조. 그런데 시간이 지나면서 문제가 생겼다.

로컬에는 11개 프로젝트가 있는데, 포트폴리오에는 7개만 등록되어 있었다. 빌드 로그는 수동으로 썼다. 사이트를 봐도 "이 사람이 뭘 만드는 사람인지"가 전혀 안 보였다. AI 뉴스만 잔뜩 올라가 있는 사이트.

그래서 방향을 바꾸기로 했다. jidonglab.com의 핵심은 뉴스가 아니라 프로젝트여야 한다.

구현 계획은 네 줄로 요약된다. `project-registry.yaml`로 프로젝트를 중앙 관리하고, GitHub API로 레포를 긁어오고, Admin 페이지에서 `visible` 토글로 노출 여부를 결정하고, 빌드 로그는 Claude Code JSONL에서 자동 생성한다.


## JSONL이 뭐고 왜 거기서 빌드 로그를 뽑으려 했나

Claude Code는 `.claude/projects/` 안에 모든 대화를 JSONL 형식으로 저장한다. 로컬에만 남는 파일이다. 클라우드에 올라가지 않는다.

이 파일 안에는 내가 Claude한테 보낸 프롬프트, Claude가 쓴 tool call, 각 tool의 결과, 그리고 최종 응답이 모두 들어 있다. 세션 단위로 기록되고, 타임스탬프도 붙어 있다.

빌드 로그를 수동으로 쓰는 게 비효율적이라는 건 오래전부터 알고 있었다. 이미 JSONL에 모든 정보가 있는데, 왜 다시 글로 정리해야 하나.

그래서 만든 게 `scripts/parse-sessions.py`다. JSONL을 파싱해서 세션별로 사용자 프롬프트, 작업 요약, 변경 파일 목록, tool 사용 통계를 뽑아낸다. 그 결과를 `generate-build-log.sh`가 받아서 Claude에게 넘기고, 블로그 형식으로 정리하게 한다.

실제로 이번 빌드 로그도 이 파이프라인으로 생성된 원본에서 시작됐다.

파싱 로직의 핵심은 간단하다.

```python
# 세션 경계: 타임스탬프 기준으로 30분 이상 gap이 있으면 새 세션
# tool call 통계: type별로 count
# 변경 파일: ToolResult에서 file_path 추출
```

완벽하진 않다. 30분 gap 기준이 너무 러프해서 실제 세션과 맞지 않을 때가 있고, 파일 경로 추출이 tool 유형마다 포맷이 달라서 오탐이 생긴다. 그래도 수동으로 쓰는 것보다는 훨씬 빠르다. 80%를 자동으로 뽑아주면 나머지 20%만 수작업으로 다듬으면 된다.


## GitHub 연동에서 403이 두 번 났다

프로젝트 관리의 핵심은 GitHub API였다. 로컬에서 `git remote -v`로 레포를 파악하는 것도 고려했는데, 포트폴리오 사이트는 Cloudflare Pages에서 돌아가고 있어서 로컬 파일 시스템에 접근할 수가 없다. Admin 페이지가 서버에서 실행되는 API route라, 결국 GitHub API를 써야 했다.

문제는 권한이었다. 처음에 Personal Access Token을 `public_repo` 권한으로만 발급했더니 비공개 레포가 안 보였다. 403. 다시 `repo` 권한으로 재발급하고 나서야 28개 레포가 전부 보이기 시작했다.

그 다음에 또 403이 났다. 이번엔 rate limit이었다. Admin 페이지에서 레포 목록을 로드할 때마다 API를 때리고 있었으니 당연한 결과였다. 응답을 캐싱하는 로직을 추가하고 나서 해결됐다.

Admin 화면에서 보이는 숫자가 `(9 registered, 28 on GitHub)`로 바뀌는 걸 봤을 때, 뭔가 제대로 연결됐다는 느낌이 들었다.


## 병렬 에이전트로 영문 번역 6편 동시 처리

빌드 로그를 한국어로만 올리는 건 반쪽짜리였다. DEV.to는 영어권 독자가 대부분이고, 이미 올라가 있던 한국어 포스트들이 있었다.

그래서 기존 6개 빌드 로그를 영어로 번역하는 작업을 병렬 에이전트로 돌렸다. `Agent "Translate 6 build logs to English"` 하나를 dispatch했고, 이 에이전트가 내부적으로 6개를 동시에 처리해서 한국어 원본 + 영어 번역본, 총 12개 파일을 생성했다.

결과는 `All 12 files created successfully`.

번역은 직역이 아니라 리라이팅이다. 한국어 원본에서 한국 로컬 맥락(네이버 블로그, 카카오, 국내 서비스 비교)은 비중을 줄이고, 기술적 내용과 Claude Code 활용 방식은 영어 독자에게 더 자세히 풀어주는 방식으로. 이 부분을 에이전트에게 명시적으로 지시했다.


## Projects 탭 리디자인 — 세 번 다시 만들었다

Admin에서 프로젝트 상태를 바꾸면 `yaml error`가 났다. Content Collection 스키마와 실제 파일 포맷이 맞지 않는 문제였다. `visible` 필드를 `config.ts` 스키마에 추가하고, 기존 yaml 파일들도 전부 업데이트했다.

Projects 탭 자체도 두 번 다시 짰다. 처음 버전은 텍스트 테이블 형태였는데 카드 경계선이 너무 흐릿하고 상태가 눈에 안 들어왔다. "어떤 프로젝트 진행 중인지 바로 알 수 있게"라는 요구사항을 만족시키려면 단순 테이블로는 부족했다.

두 번째 버전에서 `ProjectCard.astro` 컴포넌트를 새로 만들었다. 프로젝트 상태(Live / WIP / Paused)를 색깔 배지로 강조하고, 마지막 빌드 로그 날짜를 바로 보이게 했다. `[slug].astro` 상세 페이지도 함께 만들었다.

배포하고 나서 보니 "projects에서 모두 다 안 보여"였다. `visible: true`인 것만 보여야 하는데 전체를 보여주고 있었다. `src/lib/projects.ts`에서 필터 조건을 수정했다.


## DEV.to 한국어 포스트 정리

사용자 질문이 날카로웠다. "devto에 한글로 된 거 누가 올렸어?"

GitHub Actions로 jidonglab에 포스트가 올라갈 때 DEV.to에도 자동 sync하는 구조였는데, 한국어 포스트가 필터링 없이 올라가고 있었다. DEV.to 독자는 영어권이 대부분이니 한국어 글은 내려야 했다.

`.github/workflows/publish.yml`을 수정해서 `lang: ko`인 포스트는 DEV.to sync에서 제외했다. 그리고 이미 올라가 있던 한국어 글들은 API로 내렸다.

동시에 기존 영문 포스트들의 SEO도 손봤다. 제목에 숫자와 결과를 넣고, `description`에 키워드를 박고, 태그를 `ai`, `webdev` 같은 트래픽 높은 것 위주로 재정비했다.

Before: `Building a Portfolio Site with Astro`
After: `How I Auto-Generate Build Logs from Claude Code JSONL`

제목 하나가 검색 노출을 결정한다.


## 지금 상태

포트폴리오 사이트의 구조가 바뀌었다. 단순 블로그에서 프로젝트 허브로. GitHub 28개 레포가 Admin에 보이고, `visible` 토글로 노출 여부를 결정할 수 있다. 빌드 로그는 JSONL에서 자동으로 뽑힌다.

완성은 아니다. JSONL 파싱 정확도를 높여야 하고, 프로젝트 상세 페이지 디자인도 아직 기초 수준이다. Admin에서 변경한 내용이 즉시 반영되게 하려면 revalidation 로직도 더 손봐야 한다.

근데 방향은 맞다. jidonglab.com이 뭔지, 내가 뭘 만드는 사람인지가 이제는 사이트에서 보인다.

> 자동화에 투자한 시간은 며칠 안에 회수된다. 빌드 로그도 마찬가지다.
