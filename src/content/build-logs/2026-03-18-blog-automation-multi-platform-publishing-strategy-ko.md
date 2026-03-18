---
title: "기술 블로그 자동화 파이프라인 — 60개 커밋으로 보는 멀티 플랫폼 발행 전략"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

기술 블로그를 운영하다 보면 글 쓰기보다 발행 과정이 더 번거로워진다. 이번에 DEV.to, Hashnode, Blogger를 연결한 자동 발행 파이프라인을 구축했다. 60개 커밋에서 AI 활용 패턴과 워크플로우 자동화 전략을 정리한다.

## 배경: 무엇을 만들고 있는가

기술 블로그 플랫폼마다 독자층이 다르다. DEV.to는 개발자, Hashnode는 영어권 기술 커뮤니티, Blogger는 SEO에 강하다. 하나의 마크다운 파일로 여러 플랫폼에 동시 발행하는 시스템을 만들었다.

현재 상황은 이랬다:
- 한국어/영어 혼재된 200여개 포스트
- 수동 복붙으로 각 플랫폼 발행
- 메타데이터 관리 복잡
- build log 같은 임시 글들이 공개 플랫폼에 노출

목표는 GitHub Actions 기반 완전 자동화였다.

## GitHub Actions로 멀티 플랫폼 워크플로우 구축하기

### 프롬프팅 전략: 워크플로우 생성

AI에게 GitHub Actions 워크플로우를 만들게 할 때는 **제약 조건을 명시**해야 한다. 

> "DEV.to API를 사용해서 마크다운 파일을 자동 발행하는 GitHub Action을 만들어줘. 조건:
> 1. `published: true`인 영어 글만 발행
> 2. `build-log` slug 포함된 글은 제외 
> 3. 이미 발행된 글은 업데이트만 (중복 방지)
> 4. frontmatter에서 `devto_id` 추출해서 기존 글 확인
> 5. API 실패 시 상세 에러 로그 출력"

이렇게 하면 안 된다:
> "DEV.to에 글 올리는 워크플로우 만들어줘"

### Claude Code 활용법: 멀티 파일 워크플로우

여러 플랫폼 워크플로우를 동시에 작업할 때 `CLAUDE.md`에 이런 컨텍스트를 설정했다:

```markdown
# Blog Automation Project Context

## Current Workflow Files
- `.github/workflows/publish-devto.yml` - DEV.to 자동 발행
- `.github/workflows/publish-hashnode.yml` - Hashnode 자동 발행  
- `.github/workflows/publish-blogger.yml` - Blogger 자동 발행
- `.github/workflows/cleanup.yml` - 저품질 글 정리

## Content Rules
- English posts only for external platforms
- Korean posts stay internal
- build-log posts are temporary (exclude from publishing)
- News posts with low engagement get unpublished after 30 days

## API Patterns
- Always check if article exists before creating
- Update existing articles instead of duplicating
- Handle rate limits with exponential backoff
- Log all API responses for debugging
```

이렇게 설정하니까 AI가 각 워크플로우 파일을 수정할 때 일관된 패턴을 유지했다.

### 구조화 전략: 플랫폼별 특성 반영

각 플랫폼은 API 구조가 다르다. 하나씩 차근차근 접근했다:

1. **DEV.to 먼저 구현** (API 문서가 가장 깔끔)
2. **Hashnode로 확장** (GraphQL이라 복잡하지만 기능 풍부)  
3. **Blogger 추가** (OAuth 인증 복잡함)
4. **공통 패턴 추출해서 리팩토링**

AI에게 각 단계를 별도 프롬프트로 처리했다. 한 번에 3개 플랫폼을 다 만들라고 하면 섞여서 망한다.

### 관련 기술 개념: API 인증 패턴

- **DEV.to**: API Key 기반 (간단)
- **Hashnode**: API Key + GraphQL (중간) 
- **Blogger**: OAuth 2.0 + refresh token (복잡)

Blogger가 가장 까다로웠다. refresh token을 GitHub Secrets에 저장하고, 만료 시 자동 갱신하는 로직이 필요했다.

## 콘텐츠 필터링과 품질 관리 자동화

### 프롬프팅 전략: 정리 규칙 정의

저품질 콘텐츠를 자동으로 정리하는 워크플로우를 만들 때:

> "DEV.to API로 내 글들의 조회수를 확인해서, 다음 조건에 맞는 글을 unpublish 처리해줘:
> 1. `build-log`, `news` 태그가 있는 글
> 2. 발행한 지 30일 이상 지남
> 3. 조회수 50 이하
> 4. 처리 전에 해당 글 목록을 로그로 출력
> 5. 실제 unpublish 전에 30초 대기 (실수 방지)"

이런 **안전 장치**를 프롬프트에 명시하는 게 중요하다. AI가 만든 스크립트가 실제 데이터를 건드리기 때문이다.

### Claude Code의 slash commands 활용

워크플로우 디버깅할 때 이런 패턴을 썼다:

- `/commit "fix: add debug output for API responses"` - 작은 수정사항 즉시 커밋
- `/review .github/workflows/` - 전체 워크플로우 파일 검토
- `/test` - 워크플로우 YAML 문법 검증

특히 `/review` 명령어로 여러 워크플로우 파일의 일관성을 체크하는 게 유용했다.

### 구조화 전략: 점진적 롤아웃

처음부터 모든 글을 자동 발행하지 않았다:

1. **테스트 글 1개**로 워크플로우 검증
2. **영어 글 10개**만 선별해서 발행
3. **build-log 제외 규칙** 추가
4. **전체 영어 글** 자동 발행 활성화
5. **정리 워크플로우** 마지막에 추가

각 단계에서 문제가 생기면 즉시 중단하고 수정했다. AI가 만든 코드라도 **단계별 검증**은 필수다.

### 관련 기술 개념: frontmatter 메타데이터 관리

각 플랫폼의 글 ID를 frontmatter에 저장하는 패턴:

```yaml
---
title: "제목"
published: true
devto_id: 12345
hashnode_id: "abc-def-ghi"  
blogger_id: "9876543210"
---
```

이렇게 하면 재발행할 때 기존 글을 업데이트할지, 새 글을 만들지 판단할 수 있다.

## 영어 콘텐츠 확장 전략

### 프롬프팅 전략: 번역 vs 현지화

한국어 글을 영어로 확장할 때 단순 번역이 아니라 **현지화**를 했다:

> "이 한국어 기술 블로그 글을 영어권 개발자들이 읽기 좋게 다시 써줘. 조건:
> 1. 한국 특화 내용 (네이버, 카카오 등)은 글로벌 대안으로 교체
> 2. 문체는 Medium/DEV.to 스타일로 (존댓말 → 직설법)
> 3. 코드 예시의 변수명도 영어로
> 4. slug는 영문으로 새로 생성
> 5. 원문 링크를 하단에 추가"

이렇게 하니까 단순 번역보다 훨씬 자연스러운 영어 글이 나왔다.

### Claude Code의 배치 처리 활용

8개 글을 한 번에 번역할 때 이런 방식을 썼다:

1. **파일 목록 생성**: `ls posts/*-ko.md | head -8`
2. **일괄 처리 프롬프트**: "이 8개 파일을 각각 영어로 현지화해줘"
3. **검토 후 커밋**: 생성된 파일들을 하나씩 검토 후 커밋

AI에게 한 번에 너무 많은 파일을 주면 품질이 떨어진다. **8개 정도가 적당**했다.

### 구조화 전략: 콘텐츠 등급 분류

모든 한국어 글을 영어로 만들 필요는 없다. 이런 기준으로 분류했다:

- **Tier 1**: 기술 방법론, 프롬프팅 전략 → 영어 번역 우선
- **Tier 2**: 프로젝트 빌드 로그 → 영어 버전 고려
- **Tier 3**: 국내 뉴스, 임시 메모 → 한국어만 유지

AI에게 이 분류 기준을 알려주고 어떤 글을 영어로 만들지 추천받았다.

## 더 나은 방법은 없을까

지금 만든 파이프라인보다 개선할 수 있는 부분들:

### 1. Notion API + Database 기반 관리

현재는 frontmatter로 메타데이터를 관리하는데, Notion Database를 CMS로 쓰면 더 체계적이다:
- 발행 상태를 GUI로 관리
- 플랫폼별 성과 지표 추적  
- 콘텐츠 캘린더 시각화
- 태그/카테고리 일괄 관리

### 2. OpenAI Batch API로 번역 비용 최적화

현재는 실시간 API로 번역하는데, Batch API를 쓰면 50% 저렴하다:
- 여러 글을 하나의 배치로 묶어서 처리
- 24시간 지연은 있지만 비용 효율적
- 긴 글일수록 효과 큰다

### 3. MCP 서버로 플랫폼 연동 강화

Model Context Protocol로 각 플랫폼을 연결하면:
- Claude가 직접 API 호출 가능
- 워크플로우 없이도 실시간 발행
- 댓글, 조회수 등 피드백도 실시간 확인

### 4. 성능 지표 기반 콘텐츠 최적화

현재는 조회수만 보는데, 더 정교한 지표들:
- 플랫폼별 engagement rate
- 키워드별 검색 유입
- 시간대별 발행 효과
- A/B 테스트로 제목 최적화

Google Analytics API나 각 플랫폼의 상세 API를 연동하면 데이터 드리븐 최적화가 가능하다.

## 정리

- GitHub Actions로 멀티 플랫폼 자동 발행이 가능하다. 제약 조건을 명확히 해야 AI가 정확한 워크플로우를 만든다
- 콘텐츠 필터링 규칙을 자동화하면 플랫폼별 품질 관리가 쉬워진다. 안전 장치는 필수다  
- 번역보다는 현지화 관점에서 영어 콘텐츠를 만들어야 해외 독자에게 어필한다
- 단계별 롤아웃과 지속적인 모니터링으로 시스템을 안정화한다

<details>
<summary>이번 작업의 커밋 로그</summary>

05e904e — post: build logs 2026-03-18 (2 posts, en)
4de9884 — post: build logs 2026-03-18 (2 posts, en)  
2bb1330 — post: build logs 2026-03-18 (2 posts, en)
d455bdf — chore: update published articles [skip ci]
2ac70e2 — chore: update published articles [skip ci]
1a019c3 — post: build logs 2026-03-18 (2 posts, en)
7f105fb — chore: update published articles [skip ci]
0665de4 — post: build logs 2026-03-17 (2 posts, en)
90f8079 — chore: update published articles [skip ci]
d307780 — post: build logs 2026-03-17 (1 posts, en)
2d578e1 — chore: update published articles [skip ci]
d023b82 — post: build logs 2026-03-17 (1 posts, en)
451daf4 — post: build logs 2026-03-16 (4 posts, en)
ce037d0 — post: build logs 2026-03-16 (4 posts, en)
1ec519e — chore: update published articles [skip ci]
c822f68 — chore: update published articles [skip ci]
b179be0 — post: build logs 2026-03-16 (4 posts, en)
adfb941 — chore: add Blogger URLs [skip ci]
b255ecb — chore: add Blogger URLs [skip ci]
78371ee — post: build logs 2026-03-16 (4 posts, en)
d153687 — chore: update published articles [skip ci]
b8bb05c — chore: add Blogger URLs [skip ci]
5541356 — chore: add Hashnode URLs [skip ci]
8ae8059 — post: build log series (6 posts, en) + unpublish script
1634cb2 — chore: add Blogger URLs [skip ci]
a6fbd48 — chore: add Hashnode URLs [skip ci]
e7ea767 — chore: set published: true for remaining English posts
520f6bd — chore: update published articles [skip ci]
a7eecd1 — chore: remove blogger metadata from Korean posts
6a4f63d — feat: Blogger 영어 글만 발행 + 트렌디 인라인 CSS 적용
b4c1005 — chore: add Blogger URLs [skip ci]
a365f54 — feat: Blogger 워크플로우 OAuth refresh token 방식으로 업데이트
7036543 — chore: add Hashnode URLs [skip ci]
765902d — feat: Medium → Hashnode 워크플로우 교체 (영어 글 자동 발행)
cf8a33f — feat: Medium + Blogger 자동 발행 워크플로우 추가
5320e38 — chore: update published articles [skip ci]
03159a0 — chore: update published dates [skip ci]
928e424 — chore: add publish-drafts workflow
97a8c51 — chore: update published articles [skip ci]
6e951d4 — post: English versions for 8 Korean blog posts
8573bcf — fix: add debug output for DEV.to API response and improve published check
8b7caf0 — chore: update cleanup workflow to unpublish outdated Korean news articles
622d79f — chore: update published articles [skip ci]
6f58931 — chore: update published articles [skip ci]
f68751a — chore: cleanup workflow — delete all unpublished articles
570ed33 — fix: add User-Agent header to cleanup workflow
f2fc77e — chore: cleanup workflow — unpublish low-view news + build logs
23166c5 — chore: update published articles [skip ci]
910e21d — chore: remove chatbot legislation post + add cleanup workflow
20a53c6 — chore: add cleanup workflow for unpublishing jidonglab/build-log articles
ccd5947 — chore: update published articles [skip ci]
4583fec — post: AI news 2026-03-14 (4 posts, ko)
c4fc0f0 — chore: update published articles [skip ci]
5b899f4 — fix: exclude build-log posts from DEV.to publishing
20d37f0 — chore: update published articles [skip ci]
2db63c6 — post: llmtrio-build-log (en/ko)
4ef5a44 — chore: update published articles [skip ci]
c627849 — chore: update published articles [skip ci]
32ffcfb — chore: update published articles [skip ci]
0c8f0fe — chore: update published articles [skip ci]

</details>