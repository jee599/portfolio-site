---
title: "블로그 자동발행 파이프라인 + Vercel 배포 2시간 삽질기"
project: "portfolio-site"
date: 2026-03-22
lang: ko
pair: "2026-03-22-portfolio-site-en"
tags: [claude-code, automation, devto, vercel, blog]
description: "소재 하나를 spoonai·DEV.to·네이버에 동시 발행하는 파이프라인을 만들었다. 그리고 git 이메일 하나 때문에 Vercel 배포가 2시간 동안 막혔다."
---

하루에 Claude Code 세션을 6개 돌렸다. 프로젝트는 5개 — designmaker, agentcrow, saju_global, spoonai, portfolio-site.

**TL;DR** `auto-publish` 스킬로 블로그 3플랫폼 동시 발행 파이프라인을 만들었다. 그리고 git author 이메일 불일치로 Vercel 배포가 2시간 동안 Blocked 됐다. 원인은 이메일 한 줄이었다.

총 289 tool calls, Bash(127), Agent(38), Read(26), Edit(26).


## DEV.to에 글 4편을 한 번에 올리는 법

포트폴리오 레포 `src/content/`에 글이 4개 쌓여 있었다. Claude Code channels 아키텍처 2편, dispatch & cowork 2편. 발행을 안 하고 있었던 것뿐이다.

파일 경로 4개를 Claude Code에 던지고 "DEV.to에 발행해줘"라고 했다.

Claude가 한 일은 순서대로다. 파일을 읽고 → `dev_blog` 레포 구조에 맞게 md 파일을 배치하고 → git push하면 GitHub Actions가 DEV.to API를 호출한다. 4편이 draft로 올라갔다.

여기까지는 5분도 안 걸렸다.

문제는 그 다음에 발견됐다. 올라간 글들을 보니 SEO가 없었다. 외부에서 작성된 글이라 블로그 스킬의 후킹 로직이 전혀 안 들어가 있었던 것이다. "SEO랑 후킹, 조회수 높이는 기술 모두 적용해줘"라고 추가 요청했다.

Claude가 뭐가 빠졌는지 분석해서 보여줬다.

제목에 숫자나 결과가 없어서 클릭률이 낮다. description이 설명형이라 후킹이 없다. 불릿 포인트를 남발해서 스킬 금지 사항에 걸린다. 개인 경험 톤이 없어서 교과서 느낌이 난다. 섹션 제목이 평이해서 질문·행동형이 아니다.

병렬 에이전트 4개를 붙였다. 파일마다 하나씩 동시에 리라이팅.


## auto-publish 스킬을 만든 이유

"소재를 주면 여러 플랫폼에 자동 발행하게 하고 싶다"는 막연한 요청이었다.

Claude가 brainstorming 스킬을 먼저 돌렸다. 옵션을 펼쳐놓고 뭘 원하는지 좁혀나갔다. 텔레그램으로 받을지, 웹으로 받을지, CLI로 받을지. 플랫폼은 어디까지 자동화할지.

결론이 나왔다. URL/키워드/파일 하나를 던지면 spoonai.me(한국어) + DEV.to(영어) + 네이버(한국어 HTML)를 동시에 만들어서 발행한다.

플랫폼별 차이가 있다. DEV.to는 git push → GitHub Actions. spoonai.me도 git 기반. 네이버는 Cowork + Chrome 자동화로 하루에 한 편씩 `~/blog-factory/naver-queue/` 폴더를 보고 발행한다.

이미지 생성은 별도 스킬로 분리했다. `dental-blog-image-pipeline` 스킬이 Gemini로 일러스트를 만들고 Playwright로 캡처한다. `auto-publish`가 이 스킬을 호출하는 구조다.

writing-plans 스킬로 태스크를 분해하고 → subagent-driven-development로 실행했다. 에이전트 1개당 파일 1개를 맡아서 병렬로 구현했다.


## Vercel 배포가 2시간 동안 막혔다

spoonai.me에 기사가 올라가지 않았다. 404.

배포 로그를 열었다.

```
Deployment Blocked
Git author jidongs45@gmail.com must have access to the team
jee599's projects on Vercel to create deployments.
```

git 커밋의 author 이메일이 `jidongs45@gmail.com`인데, Vercel 프로젝트 오너는 `jee599` 계정이었다.

처음엔 원인을 몰라서 그냥 다시 push했다. 여전히 Blocked.

Redeploy 버튼을 눌렀다. "This deployment can not be redeployed." Vercel 설정에서 멤버를 추가했다. `jidonggg` 계정으로 push했다. 전부 Blocked.

한참 돌아서 해결책을 찾았다. 맥에 설정된 git global config 이메일이 문제였다.

```bash
git config --global user.email "jee599-account-email@gmail.com"
```

이 한 줄이 2시간짜리 삽질의 정답이었다.

메모리 파일 `feedback_vercel_deploy.md`에 기록해뒀다. 앞으로 새 레포를 Vercel에 연결할 때는 `git config user.email`부터 확인한다.


## 여러 세션을 동시에 돌릴 때 생기는 일

이날 세션 6개의 총 규모를 보면, Bash 호출이 127번으로 가장 많았다. Agent 호출이 38번. 이 비율이 의미하는 건 Claude가 직접 하기보다 에이전트에 위임하는 일이 많았다는 뜻이다.

세션이 22시간 39분까지 늘어난 건 Vercel 삽질 + auto-publish 스킬 설계 + 즉석 수정들이 겹쳤기 때문이다. 단일 세션이 길어지면 컨텍스트 압축이 일어난다. 앞쪽 결정 사항이 날아가서 나중에 "이거 왜 이렇게 됐지?"가 생긴다. 중요한 결정은 메모리에 저장해두는 게 맞다.

이날 생긴 메모리 파일 3개: `project_auto_publish.md`, `project_spoonai_admin.md`, `feedback_vercel_deploy.md`.

스킬 없이 바로 "만들어줘"로 시작했다면 방향이 여러 번 바뀌었을 것이다. brainstorming 단계에서 "네이버 자동화는 Cowork로 처리한다"는 결정이 났고, 그게 전체 구조를 확정시켰다. 설계 먼저, 구현은 나중이 맞다.

> 파이프라인 하나가 완성되면, 다음 글은 더 이상 수동이 아니다.
