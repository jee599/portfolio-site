---
title: "GitHub Actions로 기술 블로그 배포 자동화하기 — 다중 플랫폼 크로스 포스팅 전략"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

기술 블로그를 여러 플랫폼에 배포하는 과정을 GitHub Actions로 완전히 자동화했다. DEV.to, Hashnode, Blogger까지 한 번의 commit으로 동시 배포하면서 SEO 최적화와 중복 관리까지 해결한 방법을 공유한다.

## 배경: 다중 플랫폼 블로그 운영의 딜레마

개발자라면 누구나 경험해봤을 상황이다. 좋은 글을 썼는데 여러 플랫폼에 올려야 도달률이 높아진다. 하지만 하나씩 복붙해서 올리자니 너무 번거롭다.

내 경우는 더 복잡했다. 영어와 한국어 글을 동시에 관리하면서, DEV.to, Hashnode, Blogger에 각각 다른 전략으로 배포해야 했다. 그리고 성과가 낮은 글은 자동으로 unpublish하는 로직까지 필요했다.

이번 작업의 목표는 단순했다. `git push` 한 번으로 모든 플랫폼에 적절한 글이 적절한 형태로 배포되게 만드는 것.

## 플랫폼별 API 활용 — 각자의 특성을 파악하라

각 플랫폼의 API는 완전히 다르다. 단순히 markdown을 던지면 되는 게 아니라, 각각의 제약사항과 최적화 포인트를 이해해야 한다.

### DEV.to API 전략

DEV.to는 개발자 커뮤니티다. 여기선 기술적 깊이가 중요하다. 내 프롬프팅 전략:

> "이 글을 DEV.to에 올릴 건데, frontmatter에서 `tags`는 최대 4개까지만 허용한다. 현재 tags를 보고 가장 핵심적인 4개로 줄여줘. `series`가 있으면 `series` 필드도 추가해줘. `published: true`는 영어 글에만 설정하고, 한국어 글은 `published: false`로 해줘."

핵심은 **제약 조건을 명확히 주는 것**이다. AI에게 "DEV.to 형식으로 변환해줘"라고 하면 안 된다. 정확한 스펙을 알려줘야 한다.

```yaml
# DEV.to 배포 워크플로우 핵심 부분
- name: Publish to DEV.to
  run: |
    # 영어 글만 필터링
    for file in posts/*-en.md; do
      if [ -f "$file" ]; then
        # frontmatter에서 published: true인지 확인
        if grep -q "published: true" "$file"; then
          node scripts/publish-devto.js "$file"
        fi
      fi
    done
```

### Hashnode API의 특이점

Hashnode는 GraphQL API를 쓴다. REST API와 접근 방식이 다르다. 여기서 배운 점:

> "Hashnode GraphQL mutation을 만들어줘. `publishPost` mutation이고, title, content, tags는 필수다. coverImageURL은 선택사항이고, publishedAt은 현재 시간으로 설정해줘. content는 markdown 형태 그대로 넣으면 된다."

GraphQL에서는 쿼리 구조가 중요하다. AI에게 시킬 때 정확한 mutation schema를 제공해야 한다.

```javascript
// Hashnode 배포 스크립트 핵심
const mutation = `
  mutation PublishPost($input: PublishPostInput!) {
    publishPost(input: $input) {
      post {
        id
        slug
        url
      }
    }
  }
`;
```

### Blogger API — OAuth의 복잡함

Blogger는 Google OAuth를 쓴다. 가장 까다로운 부분이었다. refresh token을 GitHub Secrets에 저장하고, 매번 새로운 access token을 받아와야 한다.

여기서 AI 활용법이 중요했다:

> "Google OAuth 2.0 refresh token flow를 구현해줘. `GOOGLE_REFRESH_TOKEN`을 환경변수에서 읽어서 새로운 access token을 받아오는 함수를 만들어줘. 그리고 이 token으로 Blogger API v3에 글을 올리는 코드도 함께."

핵심은 **전체 플로우를 한 번에 요청하는 것**이다. OAuth만 따로, API 호출만 따로 시키면 연결점에서 문제가 생긴다.

## CLAUDE.md 활용 — 프로젝트 컨텍스트를 AI에게 전달하라

이 정도 복잡한 자동화를 만들 때는 AI가 프로젝트 전체 구조를 이해해야 한다. `CLAUDE.md` 파일이 핵심이다.

```markdown
# Blog Automation Project

## Structure
- `posts/` — markdown files with frontmatter
- `scripts/` — publishing scripts for each platform
- `.github/workflows/` — automation workflows

## Frontmatter Rules
- English posts: `*-en.md`, `published: true` for auto-publish
- Korean posts: `*-ko.md`, `published: false` by default
- Tags: max 4 for DEV.to, unlimited for others

## Platform Priorities
- DEV.to: English only, technical depth
- Hashnode: English only, broader developer audience
- Blogger: English only, SEO optimized with inline CSS

## Constraints
- No duplicate publishing (check existing URLs)
- Auto-cleanup for low-performing content
- Maintain canonical URLs hierarchy
```

이렇게 설정하고 나면 AI가 훨씬 정확한 코드를 생성한다. 특히 `/commit` 명령어를 쓸 때 컨텍스트가 살아있어서 일관성 있는 commit 메시지를 만들어준다.

### Claude Code의 멀티파일 작업

워크플로우 파일 3개, 스크립트 파일 3개를 동시에 수정해야 할 때가 많았다. 이때 유용한 패턴:

> "현재 프로젝트에서 `publish-*.js` 파일들과 `.github/workflows/publish.yml`을 보고 있어. Blogger API 추가할 건데, 기존 DEV.to, Hashnode 패턴과 일관성을 맞춰서 3개 파일을 동시에 수정해줘. 에러 핸들링과 로그 형식도 기존과 동일하게."

Claude Code는 여러 파일을 한번에 수정할 때 강력하다. 하지만 **기존 패턴을 명시적으로 참조**해야 일관성이 유지된다.

## 자동화 워크플로우 설계 — 실패 지점을 미리 차단하라

GitHub Actions에서 가장 중요한 건 **실패했을 때 전체가 멈추지 않게 하는 것**이다. 한 플랫폼 API가 죽어도 나머지는 돌아가야 한다.

### 단계별 격리 전략

```yaml
# 각 플랫폼을 별도 job으로 분리
jobs:
  publish-devto:
    runs-on: ubuntu-latest
    continue-on-error: true  # 핵심: 실패해도 다음 job 실행
    
  publish-hashnode:
    runs-on: ubuntu-latest
    continue-on-error: true
    needs: publish-devto  # 순서는 유지하되 실패는 전파 안함
```

이 패턴을 AI에게 설명할 때:

> "GitHub Actions workflow에서 3개 플랫폼 배포를 순차적으로 실행하되, 하나가 실패해도 나머지는 계속 실행되게 해줘. `continue-on-error: true`를 각 job에 설정하고, `needs`로 순서는 보장해줘."

### 중복 배포 방지 로직

같은 글을 여러 번 올리면 안 된다. 이미 배포된 글인지 확인하는 로직이 필요하다:

```javascript
// 기존 글 체크 로직
async function checkExistingPost(platform, slug) {
  const logFile = fs.readFileSync('publish-log.txt', 'utf8');
  const pattern = new RegExp(`${platform}:.*${slug}`);
  return pattern.test(logFile);
}
```

AI에게 이런 로직을 만들게 할 때는 **구체적인 파일 형식을 제시**해야 한다:

> "`publish-log.txt` 파일에 `devto:https://dev.to/username/slug-123` 형태로 URL이 저장된다. 새 글을 올리기 전에 slug가 이미 있는지 정규식으로 체크하는 함수를 만들어줘."

## 성과 기반 자동 정리 — 데이터 드리븐 컨텐츠 관리

단순히 올리기만 하면 안 된다. 성과가 낮은 글은 자동으로 정리해야 한다. 여기서 각 플랫폼 Analytics API를 활용한다.

### DEV.to Analytics 활용

DEV.to는 API로 조회수, 좋아요, 댓글 수를 가져올 수 있다. 이를 기반으로 한 정리 전략:

> "DEV.to API로 내 글들의 조회수를 가져와서, 30일 이상 지났는데 조회수 50 이하인 글들을 찾아줘. 그리고 이런 글들을 unpublish하는 스크립트를 만들어줘. 단, `build-log` 카테고리는 제외하고."

핵심은 **명확한 기준**을 제시하는 것이다. "성과가 낮은" 같은 모호한 표현은 쓰면 안 된다.

```javascript
// 자동 정리 로직
const cleanupThreshold = {
  minDays: 30,
  minViews: 50,
  excludeCategories: ['build-log', 'news']
};

articles.filter(article => {
  const daysSincePublish = (Date.now() - new Date(article.published_at)) / (1000 * 60 * 60 * 24);
  return daysSincePublish > cleanupThreshold.minDays && 
         article.page_views_count < cleanupThreshold.minViews &&
         !cleanupThreshold.excludeCategories.some(cat => article.title.includes(cat));
});
```

## 더 나은 방법은 없을까

현재 구현에서 개선 가능한 부분들이 있다.

### Webhooks vs Polling

지금은 GitHub Actions trigger로 배포하지만, 각 플랫폼의 webhook을 활용하면 더 효율적이다. DEV.to나 Hashnode에서 댓글이 달렸을 때 자동으로 대응하는 로직을 추가할 수 있다.

### Content Optimization

현재는 같은 markdown을 여러 플랫폼에 그대로 올린다. 하지만 각 플랫폼별로 최적화된 형태로 변환하면 더 좋다:
- DEV.to: 코드 예시 중심
- Hashnode: 이미지 비중 높게
- Blogger: SEO 키워드 강화

### Analytics Integration

Google Analytics나 Mixpanel 같은 도구와 연동해서 더 정교한 성과 분석이 가능하다. 현재는 각 플랫폼 API에 의존하는데, 통합된 대시보드가 있으면 더 좋은 의사결정을 할 수 있다.

### AI 기반 Content Personalization

Claude나 GPT-4를 활용해서 같은 내용을 플랫폼별 특성에 맞게 자동 변환하는 것도 가능하다. 이미 실험 중인데, 꽤 promising한 결과가 나오고 있다.

## 정리

- GitHub Actions로 다중 플랫폼 자동 배포가 가능하다
- 각 플랫폼 API의 제약사항을 AI에게 명확히 전달하는 것이 핵심
- 실패 지점을 미리 격리해서 전체 시스템 안정성을 확보해야 한다
- 성과 기반 자동 정리로 컨텐츠 품질을 유지할 수 있다

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