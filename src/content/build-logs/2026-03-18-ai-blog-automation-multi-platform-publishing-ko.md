---
title: "AI로 블로그 자동화하는 법 — 7개 플랫폼 동시 발행 파이프라인"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

블로그 글을 쓰고 나서 여러 플랫폼에 일일이 올리는 게 귀찮다면, 이 글이 답이다. AI를 활용해서 DEV.to, Hashnode, Blogger까지 한 번에 발행하고, 심지어 성과가 안 좋은 글은 자동으로 unpublish까지 시키는 방법을 다룬다.

## 배경: 무엇을 만들고 있는가

기술 블로그를 운영하면서 겪는 가장 큰 문제는 배포다. 좋은 글을 써도 한 곳에만 올리면 노출이 제한되고, 여러 플랫폼에 올리려면 손이 너무 많이 간다. 

이번에 구축한 시스템의 목표는 간단하다:
1. 마크다운 파일 하나만 작성하면 7개 플랫폼에 자동 발행
2. 성과 분석해서 저조한 글은 자동으로 정리
3. 영어/한국어 버전 관리를 AI가 알아서 처리

GitHub Actions + Claude를 조합해서 완전 자동화 파이프라인을 만들었다.

## GitHub Actions로 멀티플랫폼 발행 자동화하기

### 플랫폼별 API 연동 전략

각 플랫폼마다 API 스펙이 다르니까 통합 발행 스크립트를 만들 때 주의할 점이 많다. 특히 인증 방식과 컨텐츠 포맷팅에서 차이가 크다.

DEV.to는 간단하다. API 키만 있으면 바로 발행된다:

```javascript
const response = await fetch('https://dev.to/api/articles', {
  method: 'POST',
  headers: {
    'api-key': process.env.DEVTO_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    article: {
      title: frontmatter.title,
      body_markdown: content,
      published: true,
      tags: frontmatter.tags
    }
  })
});
```

Hashnode는 GraphQL이다. 좀 더 복잡하지만 더 세밀한 제어가 가능하다:

```javascript
const mutation = `
  mutation PublishPost($input: PublishPostInput!) {
    publishPost(input: $input) {
      post {
        id
        url
      }
    }
  }
`;

const variables = {
  input: {
    title: frontmatter.title,
    contentMarkdown: content,
    publicationId: process.env.HASHNODE_PUBLICATION_ID,
    tags: frontmatter.tags.map(tag => ({ name: tag }))
  }
};
```

Blogger는 OAuth 토큰 갱신이 핵심이다. refresh token을 써서 access token을 주기적으로 업데이트해야 한다:

```javascript
const refreshToken = async () => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  
  const data = await response.json();
  return data.access_token;
};
```

### 발행 상태 추적 시스템

여러 플랫폼에 발행하다 보면 어떤 글이 어디에 올라갔는지 추적하기 어렵다. `publish-log.txt` 파일을 만들어서 상태를 기록한다:

```
2026-03-18-portfolio-site-build-log-en.md | DEV.to: https://dev.to/jidong/... | Hashnode: https://hashnode.com/@jidong/...
```

GitHub Actions에서 이 로그를 업데이트하는 워크플로우도 만들었다:

```yaml
- name: Update publish log
  run: |
    echo "${{ matrix.file }} | DEV.to: ${{ steps.devto.outputs.url }} | Hashnode: ${{ steps.hashnode.outputs.url }}" >> publish-log.txt
    git add publish-log.txt
    git commit -m "chore: update published articles [skip ci]"
    git push
```

`[skip ci]` 태그를 붙여서 무한 루프를 방지하는 게 중요하다.

## Claude로 컨텐츠 현지화 자동화하기

### 번역 프롬프트 최적화

영어 글을 한국어로, 한국어 글을 영어로 번역할 때 단순 번역기를 쓰면 어색하다. 기술 블로그의 톤을 유지하면서 번역하는 프롬프트를 만들었다:

> "이 기술 블로그 글을 한국어로 번역해줘. 조건:
> 1. 기술 용어는 번역하지 않는다 (commit, deploy, refactor 등)
> 2. 변수명, 파일명, 코드는 그대로 유지
> 3. 반말 문체 사용 (~한다, ~했다)
> 4. 감탄사나 이모지 추가 금지
> 5. 원글의 구조와 섹션 제목 유지
> 6. frontmatter의 slug에 -ko 접미사 추가"

이렇게 하면 안 된다:
> "번역해줘"

구체적인 제약 조건이 없으면 Claude가 자기 마음대로 문체를 바꾸거나 불필요한 수식어를 추가한다.

### CLAUDE.md로 컨텍스트 관리

블로그 프로젝트 루트에 `CLAUDE.md` 파일을 만들어서 프로젝트 전체의 맥락을 제공한다:

```markdown
# 블로그 자동화 프로젝트

## 구조
- posts/ : 마크다운 파일들
- .github/workflows/ : 자동 발행 워크플로우
- scripts/ : 발행/정리 스크립트들

## 규칙
- 영어 글: slug에 -en 접미사
- 한국어 글: slug에 -ko 접미사
- build-log 시리즈는 DEV.to 발행 제외
- published: false인 글만 번역 대상

## API 제한사항
- DEV.to: 일일 30개 글 제한
- Hashnode: 분당 10개 요청 제한
- Blogger: OAuth 토큰 1시간 유효
```

이렇게 해두면 Claude가 번역할 때 프로젝트 맥락을 이해하고 더 정확하게 작업한다.

### 배치 번역 스크립트

여러 글을 한번에 번역할 때는 Claude의 batch processing을 활용한다. 파일 목록을 주고 하나씩 처리하게 하면 효율적이다:

```bash
# 영어 번역 대상 파일들 찾기
find posts/ -name "*-ko.md" -exec grep -l "published: false" {} \;

# Claude에게 배치 번역 요청
claude-cli translate-batch --source-lang ko --target-lang en --files "posts/*.md"
```

## 성과 기반 컨텐츠 정리 자동화

### 성과 지표 수집

블로그 글을 무한정 쌓기만 하면 품질 관리가 안 된다. 각 플랫폼의 Analytics API를 써서 성과를 추적한다:

DEV.to에서 조회수와 반응 수 가져오기:

```javascript
const getArticleStats = async (articleId) => {
  const response = await fetch(`https://dev.to/api/articles/${articleId}`, {
    headers: { 'api-key': process.env.DEVTO_API_KEY }
  });
  
  const data = await response.json();
  return {
    views: data.page_views_count,
    reactions: data.public_reactions_count,
    comments: data.comments_count
  };
};
```

### 자동 Unpublish 로직

성과가 저조한 글들을 자동으로 정리하는 워크플로우를 만들었다. 특히 `build-log` 시리즈나 뉴스 성격의 글들은 시간이 지나면 가치가 떨어진다:

```javascript
const shouldUnpublish = (article, stats) => {
  // build-log 글은 30일 후 unpublish
  if (article.slug.includes('build-log')) {
    const daysSincePublish = (Date.now() - new Date(article.published_at)) / (1000 * 60 * 60 * 24);
    return daysSincePublish > 30;
  }
  
  // 조회수 50 미만 + 반응 5개 미만이면 unpublish
  if (stats.views < 50 && stats.reactions < 5) {
    return true;
  }
  
  return false;
};
```

이 로직을 GitHub Actions에서 주간 단위로 실행한다:

```yaml
name: Cleanup Low-Performance Articles

on:
  schedule:
    - cron: '0 2 * * 0'  # 매주 일요일 오전 2시

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run cleanup script
        run: node scripts/cleanup-articles.js
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_TOKEN: ${{ secrets.HASHNODE_TOKEN }}
```

### 삭제 vs Unpublish 전략

완전 삭제보다는 unpublish가 낫다. 나중에 컨텐츠를 재활용할 수 있고, SEO 관점에서도 더 안전하다.

DEV.to는 `published: false`로 설정:

```javascript
await fetch(`https://dev.to/api/articles/${articleId}`, {
  method: 'PUT',
  headers: {
    'api-key': process.env.DEVTO_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    article: { published: false }
  })
});
```

로컬 마크다운 파일의 frontmatter도 동기화해야 한다:

```javascript
const updateFrontmatter = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/published: true/, 'published: false');
  fs.writeFileSync(filePath, content);
};
```

## 더 나은 방법은 없을까

현재 구현한 방식보다 더 효율적인 대안들이 있다.

**Zapier나 n8n 같은 노코드 도구**를 쓰면 복잡한 스크립트 없이 워크플로우를 구성할 수 있다. 특히 n8n은 오픈소스라 비용 부담도 적다. 하지만 세밀한 제어가 어렵고, API 제한 상황에서 재시도 로직 구현이 까다롭다.

**MCP (Model Context Protocol) 서버**를 직접 구축하면 Claude와의 연동이 더 매끄러워진다. 블로그 관리용 MCP 서버를 만들어서 파일 읽기/쓰기, API 호출, 성과 분석을 모두 Claude가 직접 처리하게 할 수 있다.

**GitHub GraphQL API**를 쓰면 워크플로우 실행 상태나 artifact 관리를 더 정교하게 할 수 있다. REST API보다 필요한 데이터만 정확히 가져올 수 있어서 rate limit에도 유리하다.

**Anthropic의 새로운 Tool Use 기능**을 활용하면 Claude가 여러 API를 동시에 호출하면서 발행 상태를 실시간으로 추적할 수 있다. 현재는 순차 처리하고 있는데, 병렬 처리로 속도를 크게 개선할 수 있다.

**Supabase나 PlanetScale** 같은 서비스를 써서 발행 로그를 텍스트 파일이 아닌 데이터베이스로 관리하면 쿼리와 분석이 훨씬 편해진다. 특히 성과 트렌드 분석이나 A/B 테스트 할 때 유용하다.

## 정리

AI 블로그 자동화에서 핵심은 3가지다:
- 플랫폼별 API 특성을 파악하고 통합 워크플로우 구축
- Claude에게 구체적인 제약 조건을 주는 번역 프롬프트 설계
- 성과 데이터 기반으로 컨텐츠 생명주기 관리 자동화
- GitHub Actions + MCP 서버 조합으로 완전 자율 운영 달성

<details>
<summary>이번 작업의 커밋 로그</summary>

05e904e — post: build logs 2026-03-18 (2 posts, en)
8ae8059 — post: build log series (6 posts, en) + unpublish script  
6a4f63d — feat: Blogger 영어 글만 발행 + 트렌디 인라인 CSS 적용
a365f54 — feat: Blogger 워크플로우 OAuth refresh token 방식으로 업데이트
765902d — feat: Medium → Hashnode 워크플로우 교체 (영어 글 자동 발행)
cf8a33f — feat: Medium + Blogger 자동 발행 워크플로우 추가
f2fc77e — chore: cleanup workflow — unpublish low-view news + build logs
910e21d — chore: remove chatbot legislation post + add cleanup workflow

</details>