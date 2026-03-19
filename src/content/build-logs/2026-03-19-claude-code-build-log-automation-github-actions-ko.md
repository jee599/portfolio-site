---
title: "Claude Code로 매일 빌드 로그 자동화하는 GitHub Actions 패턴"
project: "dev_blog"
date: 2026-03-19
lang: ko
tags: [chore, fix, feat]
---

매일 2개 프로젝트의 빌드 로그를 영어로 번역해서 DEV.to, Hashnode, Blogger에 동시 발행하는 워크플로우를 완전 자동화했다. 이 글에서는 Claude Code와 GitHub Actions를 활용해 반복적인 콘텐츠 워크플로우를 어떻게 구조화하고 자동화했는지 다룬다.

## 배경: 무엇을 만들고 있는가

기술 블로그를 여러 플랫폼에 동시 발행하는 시스템을 운영하고 있다. 매일 포트폴리오 사이트와 치과 서비스 2개 프로젝트의 개발 진행 상황을 빌드 로그 형태로 기록하고, 이를 영어로 번역해서 3개 플랫폼에 자동 발행한다.

문제는 단순 반복 작업이 너무 많았다는 것이다. 커밋 데이터 정리, 영어 번역, frontmatter 생성, 플랫폼별 메타데이터 관리까지 수동으로 하면 하루에 2시간씩 날아간다. 이번 작업의 목표는 이 전체 과정을 Claude Code와 GitHub Actions로 완전 자동화하는 것이었다.

## 구조화된 프롬프팅으로 일관성 확보

빌드 로그 자동화에서 가장 중요한 건 **일관성**이다. 매일 생성되는 콘텐츠의 톤, 구조, 품질이 들쭉날쭉하면 안 된다.

### 효과적인 빌드 로그 프롬프트

기존에는 이렇게 대충 시켰다:

> "이 커밋 데이터로 빌드 로그 써줘"

결과는 매번 달랐다. 어떨 때는 너무 기술적이고, 어떨 때는 너무 뻔한 얘기만 늘어놓았다.

지금은 이런 구조화된 프롬프트를 쓴다:

> "다음 커밋 데이터로 개발 빌드 로그를 작성해줘.
> 
> **제약조건:**
> - 기술 블로거가 쓰는 톤으로 (전문적이지만 접근하기 쉽게)
> - 주요 기능 변경사항 3-4개만 선별해서 다룬다
> - 각 변경사항마다 '왜 이렇게 했는지' 맥락 포함
> - 코드 파일명, 함수명은 backtick으로 감싼다
> - 1500-2000자 분량
> 
> **구조:**
> 1. 오늘 작업 요약 (2-3줄)
> 2. 주요 변경사항별 섹션 (h2)
> 3. 다음 계획 (간단히)
> 
> 커밋 데이터: [데이터]"

이렇게 하니까 매일 생성되는 빌드 로그의 품질과 구조가 일관성을 갖게 됐다.

### 번역 품질 향상 프롬프트

한국어 빌드 로그를 영어로 번역할 때도 단순히 "번역해줘"라고 하면 안 된다. 기술 블로그의 맥락을 이해하고 번역해야 한다.

> "이 한국어 빌드 로그를 영어로 번역해줘.
> 
> **번역 가이드라인:**
> - 기술 용어는 원어 유지 (commit, deploy, refactor, workflow 등)
> - 한국 특유의 표현은 영어권 개발자가 이해할 수 있게 의역
> - 파일명, 변수명, CLI 명령어는 그대로 유지
> - frontmatter의 slug는 영문으로 변경하되 내용 반영
> - 'today' 대신 구체적인 날짜 사용
> 
> **톤:**
> - 개발 블로그 글처럼 자연스럽게
> - 너무 직역하지 말고 영어 네이티브가 쓸 법한 표현으로
> 
> 원문: [한국어 텍스트]"

결과적으로 번역 품질이 눈에 띄게 좋아졌다. 특히 한국어의 "오늘은 이런저런 작업을 했다" 식 표현이 "Focused on improving user authentication flow and optimizing database queries"처럼 자연스러운 영어로 번역된다.

## Claude Code Skills로 워크플로우 자동화

### custom skills 설정

`.claude/skills/build-log.md`를 만들어서 빌드 로그 생성 로직을 skill로 등록했다:

```markdown
# Build Log Generator

## Purpose
Generate consistent daily build logs from commit data

## Input Format
- Project name
- Date (YYYY-MM-DD)
- Commit array with sha, message, author
- Changed files list

## Output Structure
1. Brief summary (2-3 sentences)
2. Major changes (H2 sections)
3. Next steps (brief)

## Constraints
- 1500-2000 characters
- Technical but accessible tone
- Focus on 3-4 significant changes only
- Include context for decisions
```

이제 Claude Code에서 `/build-log portfolio 2026-03-19 [commit-data]`라고 치면 일관된 포맷으로 빌드 로그가 생성된다.

### 번역 skill 분리

번역도 별도 skill로 만들었다:

```markdown
# Korean to English Technical Translation

## Guidelines
- Keep technical terms in English
- Localize Korean expressions for English audience  
- Maintain code snippets and file names
- Convert slug to English reflecting content
- Replace relative dates with absolute dates

## Quality Check
- Natural English flow
- Appropriate technical blog tone
- Consistent terminology
```

이렇게 skill을 분리하니까 작업을 단계별로 쪼갤 수 있고, 각 단계의 품질을 개별적으로 관리할 수 있다.

## GitHub Actions 멀티플랫폼 발행 자동화

### 플랫폼별 제약 조건 처리

각 플랫폼마다 요구사항이 다르다:

- **DEV.to**: markdown 그대로 지원, 한국어 글 스킵 필요
- **Hashnode**: 영어 글만 발행, GraphQL API 사용
- **Blogger**: HTML 변환 필요, OAuth refresh token 관리

이런 복잡한 조건을 Claude에게 한 번에 처리하라고 하면 실수한다. 대신 각 플랫폼별로 별도 workflow step을 만들고, 각각에 명확한 역할을 부여했다.

```yaml
- name: Publish to DEV.to
  if: ${{ !contains(github.event.head_commit.message, 'ko)') }}
  run: |
    # 한국어 파일 스킵 로직
    if [[ "$file" == *"-ko.md" ]]; then
      echo "Skipping Korean file: $file"
      continue
    fi
```

### 에러 핸들링과 재시도 로직

API 호출이 실패할 수 있으니 재시도 로직도 추가했다. 특히 Blogger API는 가끔 OAuth token이 만료돼서 실패한다.

> "GitHub Actions workflow에서 API 호출 실패 시 3번까지 재시도하는 로직을 만들어줘. 각 플랫폼별로 다른 에러 코드를 처리해야 하고, 실패 시 Slack으로 알림도 보내야 한다."

Claude가 생성한 retry 로직:

```yaml
- name: Retry API calls
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 5
    max_attempts: 3
    command: |
      if ! publish_to_platform "$platform" "$file"; then
        echo "Failed to publish to $platform"
        exit 1
      fi
```

## 메타데이터 자동 관리 시스템

### 발행 상태 추적

여러 플랫폼에 동시 발행하다 보면 어떤 글이 어디에 발행됐는지 추적하기 어렵다. `publish-log.txt` 파일을 만들어서 발행 상태를 자동으로 기록한다.

```
2026-03-19-portfolio-site-build-log-en.md:
  dev_to: https://dev.to/jidong/...
  hashnode: https://blog.jidong.dev/...
  blogger: https://jidonglab.blogspot.com/...
```

Claude Code에서 이런 로그 파싱 로직도 자동 생성했다:

> "publish-log.txt 파일을 파싱해서 특정 글이 어떤 플랫폼에 발행됐는지 확인하는 bash 함수를 만들어줘. 이미 발행된 글은 스킵하고, 새 글만 발행하도록 해야 한다."

### frontmatter 동적 생성

각 플랫폼마다 필요한 frontmatter 필드가 다르다. DEV.to는 `canonical_url`이 필요하고, Hashnode는 `tags` 배열 형식이 달랐다.

이것도 Claude에게 시켰다:

> "마크다운 파일의 frontmatter를 플랫폼별로 변환하는 함수를 만들어줘.
> 
> - DEV.to: canonical_url, series 필드 추가
> - Hashnode: tags를 배열에서 문자열로 변환
> - Blogger: HTML title, labels 형식 변환
> 
> 기존 frontmatter는 유지하되 플랫폼 특화 필드만 추가/변경한다."

결과적으로 하나의 마크다운 파일로 3개 플랫폼의 요구사항을 모두 만족하는 시스템이 완성됐다.

## 더 나은 방법은 없을까

지금 방식도 잘 작동하지만, 몇 가지 개선점이 있다.

### Claude Projects 활용

현재는 individual skills를 쓰고 있는데, Claude Projects를 쓰면 더 체계적으로 관리할 수 있다. Project 단위로 context와 instructions를 관리하면 일관성이 더 높아진다.

특히 빌드 로그 생성할 때 과거 로그들을 참고해서 스타일을 학습하게 할 수 있다. 현재는 매번 새로운 컨텍스트에서 시작하지만, Project를 쓰면 누적 학습이 가능하다.

### MCP Server 연동

GitHub API를 직접 호출하는 MCP 서버를 만들면 더 효율적이다. 지금은 커밋 데이터를 수동으로 복사-붙여넣기하는데, MCP 서버가 있으면 Claude가 직접 GitHub API를 호출해서 커밋 정보를 가져올 수 있다.

```javascript
// MCP Server 예시
async function getCommits(repo, since, until) {
  const response = await octokit.rest.repos.listCommits({
    owner,
    repo,
    since,
    until
  });
  return response.data;
}
```

### Anthropic의 Computer Use 활용

최신 Claude 3.5 Sonnet의 Computer Use 기능을 쓰면 웹 브라우저를 통한 발행 과정도 자동화할 수 있다. API가 없는 플랫폼이나 복잡한 UI 조작이 필요한 경우에 유용하다.

다만 Computer Use는 아직 실험적 기능이라 production 환경보다는 개발/테스트 단계에서 먼저 시도해볼 만하다.

### 콘텐츠 품질 모니터링

현재는 발행만 자동화했는데, 발행된 글의 성과도 자동으로 추적하면 좋겠다. 각 플랫폼의 analytics API를 연동해서 조회수, 반응 등을 모니터링하고, 성과가 낮은 글의 패턴을 분석할 수 있다.

이것도 Claude에게 시키면 될 것 같다:

> "DEV.to, Hashnode, Blogger API를 사용해서 지난 30일간 발행된 글들의 조회수, 좋아요, 댓글 수를 수집하고 CSV로 정리하는 스크립트를 만들어줘."

## 정리

- **구조화된 프롬프팅**으로 일관된 품질의 콘텐츠를 자동 생성할 수 있다
- **Claude Code Skills**를 활용하면 복잡한 워크플로우를 재사용 가능한 단위로 쪼갤 수 있다  
- **GitHub Actions + 멀티플랫폼 API**를 조합하면 콘텐츠 발행을 완전 자동화할 수 있다
- **메타데이터 관리**를 체계화하면 복잡한 워크플로우도 안정적으로 운영할 수 있다

<details>
<summary>이번 작업의 커밋 로그</summary>

ece75e5 — post: build logs 2026-03-19 (2 posts, en)
244fbcf — post: build logs 2026-03-19 (2 posts, en)
e4c1443 — chore: update published articles [skip ci]
3067d14 — chore: update published articles [skip ci]
e14fd1b — post: build logs 2026-03-19 (2 posts, en)
be69eca — chore: update published articles [skip ci]
b872ce0 — post: build logs 2026-03-19 (2 posts, en)
be9979b — chore: update published articles [skip ci]
3ffefc9 — fix: DEV.to에 한국어(-ko.md) 파일 발행 스킵
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

</details>