---
title: "네이버 블로그 330개 분석 + SEO/AEO 전면 강화 — 3세션, 604번의 도구 호출"
project: "portfolio-site"
date: 2026-04-01
lang: ko
tags: [claude-code, seo, aeo, dental-blog, automation, naver-api, scraping]
description: "네이버 API로 330개 치과 블로그를 파싱해 S등급 패턴을 추출하고, jidonglab SEO/AEO를 전면 강화했다. 3세션, 604번 도구 호출, 13시간의 기록."
---

오늘 가장 긴 세션은 13시간 13분이었다. 422번의 도구 호출. 네이버 블로그 330개를 파싱하고 치과 블로그 자동 생성 파이프라인을 처음부터 설계했다. 그 사이에 jidonglab과 spoonai의 SEO/AEO도 전면 강화했다.

**TL;DR** 세션 2에서 `llms-full.txt`, sitemap, structured data로 검색 노출을 강화했고, 세션 3에서 네이버 블로그 330개 구조 분석을 기반으로 HTML 블로그 카드 8종 템플릿을 만들었다.

## 텔레그램 409, 다시 (15분, 14 tool calls)

세션 1은 15분이었다. 어제 같은 문제가 오늘 또 재발했다.

`fakechat` 플러그인을 방금 설치한 상태라 Claude가 처음엔 fakechat과 텔레그램을 연결해서 봤다. 둘은 완전히 별개였다. 실제 원인은 MCP 서버 로그에 있었다.

```
409 Conflict: Terminated by other getUpdates request;
make sure that only one bot instance is running
```

Claude Code 세션을 재시작할 때마다 텔레그램 MCP 서버가 새 인스턴스를 띄운다. 이전 프로세스가 살아있으면 Telegram Bot API가 충돌한다 — `getUpdates` 연결은 동시에 하나만 허용하기 때문이다. 폴링 잠금을 해제하고 `/reload-plugins`로 재시작하니 봇이 정상화됐다.

> 텔레그램 MCP가 먹통이 되면 설정보다 프로세스 중복을 먼저 확인한다. `ps aux | grep "bun server.ts"` 로 인스턴스가 몇 개인지 본다.

## SEO/AEO 전면 강화 (42분, 168 tool calls)

세션 2는 spoonai 이미지 깨짐 수정으로 시작해서 AI 검색 노출 전략 전면 적용으로 끝났다.

### 이미지 깨짐의 원인

4개 기사의 썸네일이 HTML 파일로 저장되어 있었다. `anthropic-mythos-01.jpg`가 919바이트였다 — `.jpg`인데 1KB 미만이면 HTML이다. 이미지 생성 스크립트가 Gemini API 에러를 무시하고 HTTP 응답 본문 그대로 저장했다.

수정은 두 곳이었다. 깨진 기사 8개의 frontmatter에서 `image` 필드를 제거했다. 이미지 없는 기사가 깨진 이미지를 보여주는 것보다 낫다. SKILL.md에는 응답 파일 크기 검증 로직을 추가했다.

중복 기사 4건(Harvey AI가 03-27, 03-29, 03-30에 3번 수집)은 중복 체크가 URL이 아닌 제목 기준이었기 때문이다. 제목이 조금씩 다르면 걸러지지 않는다.

### llms-full.txt와 AI 크롤러 허용

"AI 검색결과에 자주 노출될 수 있는 모든 효과적인 전략 적용해줘" 프롬프트 하나에 Claude가 14개 파일을 수정하고 7개 파일을 생성했다.

핵심 변경은 세 가지였다. `/llms-full.txt` 라우트를 새로 만들었다 — 마크다운 전체 콘텐츠를 LLM 크롤러가 읽을 수 있도록 구조화해서 내보내는 엔드포인트다. Perplexity, ChatGPT 등 AI 검색 엔진이 이 파일을 우선 인덱싱한다.

`robots.txt`에 AI 크롤러 허용 규칙을 추가했다.

```
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /
```

`Base.astro`와 `PostLayout.astro`에는 JSON-LD structured data를 추가했다. Article, BreadcrumbList, WebSite 스키마다. `sitemap.xml.ts`는 기존 Astro 자동 생성 sitemap을 대체한다 — 이제 각 포스트의 `date`가 `lastmod`로 들어간다.

## 치과 블로그 파이프라인 (13시간, 422 tool calls)

세션 3이 오늘의 메인이었다. Read 170, Bash 102, Edit 75, Write 48.

### 단일 URL에서 330개 수집으로

시작은 네이버 블로그 URL 하나였다. "분당 임플란트 상위 10건 비교표"로 이어졌고, 결국 16개 지역 × 7개 시술의 상위 3건, 336건 수집 파이프라인이 됐다.

네이버 블로그는 iframe 구조다. 메인 URL은 3KB짜리 래퍼고, 실제 본문은 `PostView` URL에 있다. Claude가 첫 Bash에서 292KB HTML을 가져왔다.

macOS `grep`에 `-P`(Perl regex) 옵션이 없어서 Python으로 즉시 전환했다. 별도 지시 없이 에러 메시지를 보고 판단했다.

```python
import re
from collections import Counter

with open('sample_postview.html') as f:
    html = f.read()

classes = re.findall(r'class="([^"]*)"', html)
counter = Counter()
for c in classes:
    for cls in c.split():
        counter[cls] += 1
print(counter.most_common(20))
```

`se-text-paragraph` 272회, `se-module-image` 84회. 네이버 SmartEditor 3 구조 패턴이 나왔다.

### contextzip 우회

네이버 API 응답이 보이지 않았다. `contextzip`이 토큰 절약 목적으로 응답을 압축했기 때문이다. 우회 방법은 파일로 먼저 저장하고 Read로 읽는 것이다.

```bash
# contextzip이 응답을 압축하면 결과가 사라진다
# 파일로 저장해서 우회
curl "https://openapi.naver.com/..." > /tmp/naver_results.json
# 이후 Read 도구로 읽기
```

이후 300개 HTML 파싱도 동일한 패턴으로 처리했다.

### Background Task + /compact

330개 블로그 수집은 Background Task로 돌렸다. 수집이 돌아가는 동안 다른 작업을 진행할 수 있었다. `TaskUpdate`가 33번 사용된 이유다.

세션이 길어지자 컨텍스트가 한계에 도달했다. `/compact`를 실행했고, 요약본에 핵심 맥락(S등급 패턴, 분석 상태, 다음 할 일)이 담긴 채로 이어갔다. 13시간 세션에서 `/compact`는 한 번이었다. 요약 품질이 좋으면 흐름이 끊기지 않는다.

### S등급 패턴과 이미지 캐싱 전략

분당 임플란트 1위 블로그는 컴포넌트 27개, 이미지 36장, 슬라이드 26장이었다. 330개를 같은 방식으로 분석해서 상위 20%의 공통 패턴을 `BLOG-DESIGN-GUIDELINE.md`로 정리하고, Claude Code 스킬로 전환했다. 이제 `/write-dental-blog` 커맨드 하나로 가이드라인 기반 블로그를 생성한다.

"매번 API를 호출해서 그림을 그리는 게 아니라, 처음에 수십 가지를 그려놓고 재사용"하는 구조로 설계했다. Gemini API로 30~50개 기본 이미지를 사전 생성해서 `assets/manifest.json`에 캐싱하고, 블로그 카드 생성 시 cache-first로 조회한다.

```python
def get_or_generate(prompt_key: str, output_path: Path) -> Path:
    if output_path.exists():
        return output_path  # 캐시 히트
    return generate_with_gemini(prompt_key, output_path)
```

### 퀄리티 피드백 루프

블로그 카드 초안이 나온 뒤 피드백이 여러 차례 들어왔다.

```
폰트 / 다크네이비 톤 / 로고이미지 제대로 안 써져 있고 / 그림생성한것도 다 별로야
```

```
로직 처음부터 다시 짜.
```

Edit 75번이 이 피드백 루프에서 집중됐다. 최종 산출물은 임플란트 포스트 기준 카드 8종이다 — 타이틀, 체크리스트, 시술 과정, 정보+이미지 3종(bone graft, digital guide, aftercare), 의료진 소개, 법적고지, CTA.

## 도구 사용 통계

```
총 604 tool calls (3세션 합산)
- Read:       210 (35%) — HTML 파싱 결과 확인, 설정 파일
- Bash:       164 (27%) — Python 스크립트, API 호출
- Edit:       101 (17%) — HTML 카드 수정, SKILL.md 갱신
- Write:       53 (9%)  — 신규 파일 생성
- TaskUpdate:  33 (5%)  — 백그라운드 태스크 상태 관리
- TaskCreate:  15 (2%)  — 백그라운드 태스크 스폰
- Agent:        6 (1%)  — 서브에이전트 병렬 처리
```

Read 35%, Bash 27%. 구현(Edit + Write)보다 탐색(Read + Bash)이 2.4배 많았다. 300개 HTML을 파싱하는 탐색 위주 작업이었으니 당연한 분포다.

## 이번 사이클에서 확인한 것

`contextzip`이 API 응답을 압축하는 환경에서는 대용량 결과를 파일로 먼저 저장하고 Read로 읽는 게 안전하다. 응답이 사라졌을 때 원인을 파악하는 데 시간이 걸린다.

비주얼 품질 판단은 사람이 해야 한다. "다 별로야"는 코드로 표현할 수 없다. 13시간이 걸린 건 이 피드백 루프를 여러 번 돌았기 때문이다. 다음엔 초안 단계에서 레퍼런스 이미지를 먼저 공유하는 게 낫다.

Background Task + `/compact` 조합이 긴 세션에서 유효하다. 수집이 돌아가는 동안 병렬로 작업하고, 컨텍스트가 찰 때 압축해서 이어간다. 13시간 세션을 단일 흐름으로 완주한 방법이다.
