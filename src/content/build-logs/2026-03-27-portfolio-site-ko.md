---
title: "336 tool calls로 사이트 언어 전환 + auto-publish 스킬 개편"
project: "portfolio-site"
date: 2026-03-27
lang: ko
tags: [claude-code, i18n, auto-publish, skill, vercel]
description: "3개 세션, 336 tool calls. 한국어 기본이던 사이트를 영어 기본으로 전환하고, auto-publish 스킬에서 네이버를 제거해 2-플랫폼 발행 파이프라인으로 정리했다."
---

3개 세션, 총 336 tool calls. 작업 내용을 보면 코드보다 "Claude Code를 어떻게 썼느냐"가 더 흥미롭다.

**TL;DR** 한 줄 프롬프트로 전체 사이트 언어 기본값을 뒤집었고, 스킬 파일을 직접 편집해서 발행 파이프라인을 재정의했다.

## "영어 기본으로 해줘" 한 줄이 만든 Read 13번

세션 1의 시작 프롬프트는 이렇다.

> "저기서 지금 번역버튼이 잘 안되는데, 일단 영어 사이트가 기본이여서 영어 번역이 모든 부분에 대해서 되어 있어야해. 일단 영어 기본으로 해주고, 한국어 번역버튼을 넣어줘."

Claude는 구현에 바로 뛰어들지 않았다. 먼저 `Read`를 13번 써서 현재 상태를 파악했다. 확인 결과:

- `Base.astro`에 `var lang = 'ko'`로 하드코딩
- `<html lang="ko">` 속성
- 버튼 기본 텍스트가 `EN` (영어 기본이면 `KO`가 보여야 함)
- 126개 빌드 로그에 영어 번역 없음

단순히 기본값 변수 하나 바꾸는 게 아니었다. `data-ko`/`data-en` 속성으로 뿌려진 모든 페이지의 기본 텍스트가 한국어로 되어 있어서, 네비게이션·홈·about·posts 전부 영어 텍스트로 바꿔야 했다. 변경 범위가 Read로 파악한 다음에야 보인다.

`Edit`은 12번. 파일은 `Base.astro`, `PostLayout.astro`, `[slug].astro` 3개다. 그 사이 `Agent` 8번은 번역 품질 검수와 배포를 위임했다.

## 스킬 파일을 직접 열어 네이버를 지웠다

세션 2는 auto-publish 스킬 개편이다. 발단은 이 질문이었다.

> "스킬 중에 특정 주제에 대해 jidonglab / devto에 글 쓰는거 있어?"

있었다. `auto-publish` 스킬이 3개 플랫폼(spoonai.me, DEV.to, 네이버)을 동시 발행한다. 근데 네이버 블로그를 쓰지 않기로 했으니 제거가 필요했다.

> "그 스킬에서 네이버꺼는 빼줘"

Claude는 `~/.claude/skills/auto-publish/SKILL.md`를 열어서 직접 편집했다. 제거한 것들: Agent 3(네이버 한국어 HTML), Phase 4 네이버 발행 섹션, Phase 5 네이버 큐 확인, 시리즈 처리 네이버 파트, `naver-seo-rules.md` 레퍼런스. 발행 대상이 3개에서 2개로 줄었다.

그 다음엔 canonical URL 전략 논의로 이어졌다. spoonai.me / DEV.to / Hashnode에 올릴 때 `canonical_url`을 `jidonglab.com` 기준으로 설정해야 중복 콘텐츠 패널티 없이 Google 검색이 된다. 스킬 파일에 이 규칙을 명시했다.

Hashnode 설정에서 삽질이 하나 있었다. API 토큰을 못 찾겠다고 하자 사용자가 직접 토큰을 채팅에 붙여넣었다. Claude는 이걸 받아서 설정 파일에 저장했다.

## Vercel 배포가 계속 CANCELED

세션 3에서 발견한 문제. git push로 자동 배포가 여러 번 CANCELED 상태였다. 마지막 성공 배포는 `fix: deploy as jee599 author` 커밋이었고, 그 이후 것들이 줄줄이 취소되고 있었다.

해결책은 수동 배포였다.

```bash
vercel build --prod && vercel deploy --prebuilt --prod
```

자동 배포 훅이 왜 작동 안 했는지는 끝내 명확히 밝혀지지 않았다. Vercel 프로젝트 설정 문제였을 가능성이 높다.

## 도구 사용 패턴

총 336 tool calls의 분포:

| 도구 | 횟수 | 비율 |
|------|------|------|
| Bash | 149 | 44% |
| Edit | 68 | 20% |
| Read | 54 | 16% |
| Agent | 25 | 7% |
| 기타 | 40 | 12% |

`Bash`가 절반 가까이를 차지하는 건 배포와 빌드 확인 때문이다. 코드 변경보다 "빌드 됐나?", "배포 됐나?" 확인이 더 많았다.

`Agent` 25번은 주로 검수와 독립 작업 위임에 썼다. 번역 품질 검수, 보안 이슈 점검, 래퍼런스 파일 정제 등 메인 컨텍스트를 소모하지 않아도 되는 작업들이다.

## 프롬프트 길이 vs 작업 범위

이번 세션에서 확인한 패턴 하나. 짧은 프롬프트가 가장 큰 범위의 작업을 만들어냈다.

- "영어 기본으로 해줘" → 3개 파일, 수십 개 텍스트 수정
- "그 스킬에서 네이버꺼는 빼줘" → 스킬 파일 전체 구조 변경
- "배포해" → Vercel CANCELED 이슈 발견 후 수동 배포

프롬프트 길이가 작업 복잡도를 결정하지 않는다. 중요한 건 Claude가 현재 상태를 얼마나 잘 파악하고 있느냐다. 그래서 Read가 항상 먼저 온다.
