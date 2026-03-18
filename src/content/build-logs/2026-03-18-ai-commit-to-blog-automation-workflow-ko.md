---
title: "일일 빌드 로그 자동 생성 워크플로우 — AI가 커밋을 블로그로 변환하는 법"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

개발 블로그를 운영하면서 매일 작업한 내용을 체계적으로 기록하고 싶었다. 하지만 손으로 하기엔 너무 번거롭고, 그렇다고 놔두면 며칠 뒤엔 뭘 했는지 기억도 안 난다. 이 글에서는 Git 커밋 데이터를 AI가 읽고 자동으로 빌드 로그 포스트를 생성하는 워크플로우를 어떻게 구축했는지 다룬다.

## 배경: 다중 플랫폼 블로그 자동화 시스템

현재 운영 중인 기술 블로그는 GitHub Pages를 기반으로 하고, DEV.to, Hashnode, Blogger에 자동으로 cross-post되는 구조다. 매일 여러 프로젝트를 작업하면서 빌드 로그를 수동으로 작성하기엔 시간이 부족했다.

목표는 간단했다:
- Git 커밋 데이터만으로 일일 빌드 로그 자동 생성
- 영어/한국어 동시 지원
- 외부 플랫폼 자동 발행
- SEO 최적화된 포맷

## AI에게 커밋 히스토리를 블로그로 변환시키기

### 프롬프팅 전략

커밋 메시지는 개발자가 쓴 것이라 문맥이 부족하고 불친절하다. 이걸 독자가 읽을 만한 글로 바꾸려면 구체적인 제약 조건이 필요하다.

효과적인 프롬프트:
> "다음 커밋 데이터를 바탕으로 일일 빌드 로그를 작성해줘. 독자는 이 프로젝트를 처음 보는 개발자다. 커밋 메시지를 나열하지 말고, 어떤 기능을 만들었는지, 어떤 문제를 해결했는지 스토리로 설명해. 기술 용어는 간단히 설명하고, 파일명과 함수명은 backtick으로 감싸. 분량은 800-1200자. 마크다운 형식."

이렇게 쓰면 안 된다:
> "커밋 로그를 정리해줘"

핵심은 **독자 설정**과 **출력 형식 제약**이다. AI에게 "누구를 위한 글인지"를 명확히 알려줘야 적절한 설명 수준을 선택한다.

### 구조화 전략

빌드 로그 생성을 3단계로 나눈다:

1. **커밋 분석**: 비슷한 작업끼리 그룹핑
2. **컨텍스트 생성**: 각 그룹의 기술적 배경 설명
3. **스토리텔링**: 시간순이 아닌 중요도순으로 재구성

GitHub Actions에서 이 과정을 자동화할 때는 각 단계마다 별도 프롬프트를 쓴다. 한 번에 다 시키면 품질이 떨어진다.

```yaml
- name: Generate build log
  run: |
    # 1. 커밋 데이터 추출
    git log --since="yesterday" --format="%h — %s" > commits.txt
    
    # 2. AI로 분석 + 생성
    curl -X POST "https://api.anthropic.com/v1/messages" \
      -H "Content-Type: application/json" \
      -d "@prompt.json" > post.md
    
    # 3. 메타데이터 추가
    ./add-frontmatter.sh post.md
```

### 멀티 플랫폼 발행 자동화

생성된 포스트는 여러 플랫폼에 동시 발행한다. 각 플랫폼마다 API 규격이 다르니까 변환 로직이 필요하다.

DEV.to는 마크다운 그대로 받지만, Blogger는 HTML로 변환해야 한다. Hashnode는 frontmatter 형식이 약간 다르고.

```javascript
// 플랫폼별 변환 함수
function convertForPlatform(content, platform) {
  switch (platform) {
    case 'devto':
      return addDevToTags(content);
    case 'blogger':
      return markdownToHtml(content);
    case 'hashnode':
      return convertFrontmatter(content);
  }
}
```

각 플랫폼의 rate limit도 고려해야 한다. DEV.to는 분당 30개, Hashnode는 시간당 100개 제한이 있다.

## 워크플로우 최적화와 에러 핸들링

### 발행 상태 추적

같은 포스트가 중복 발행되는 걸 막기 위해 `publish-log.txt`에 상태를 기록한다. 각 포스트마다 플랫폼별 URL을 저장해서 이미 발행된 건 스킵한다.

```
2026-03-18-portfolio-site-build-log-en.md:
  devto: https://dev.to/jidong/...
  hashnode: https://hashnode.com/@jidong/...
  blogger: https://blogger.com/...
```

이 방식의 장점은 부분 실패해도 복구가 쉽다는 것이다. DEV.to는 성공했는데 Hashnode에서 에러 나면, 다음 실행 때 Hashnode만 다시 시도한다.

### 콘텐츠 품질 검증

AI가 생성한 글이 항상 완벽하진 않다. 다음 검증 로직을 추가했다:

- 최소 길이 체크 (800자 미만은 재생성)
- 마크다운 문법 검증
- 중복 문장 제거
- 기술 용어 backtick 누락 체크

```bash
# 품질 검증 스크립트
if [ $(wc -c < "$POST_FILE") -lt 800 ]; then
  echo "Post too short, regenerating..."
  ./generate-post.sh --retry
fi
```

### 언어별 처리

영어와 한국어를 동시 지원하려면 프롬프트 자체를 언어별로 만드는 게 낫다. 번역보다는 처음부터 해당 언어로 생성하는 게 자연스럽다.

한국어 프롬프트:
> "개발 과정에서 겪은 시행착오와 해결 과정을 포함해서 써줘. 개발자들이 비슷한 상황에서 참고할 수 있도록."

영어 프롬프트:
> "Focus on technical decisions and implementation details. Include code snippets where relevant. Target audience: developers working on similar projects."

같은 커밋 데이터라도 언어별로 강조하는 포인트가 달라진다.

## 더 나은 방법은 없을까

이 워크플로우를 구축하면서 발견한 개선점들이다.

### MCP 서버 활용

현재는 REST API로 AI를 호출하는데, Claude의 MCP(Model Context Protocol)를 쓰면 더 효율적이다. 특히 Git 데이터를 실시간으로 읽어올 수 있는 MCP 서버를 만들면:

```typescript
// git-mcp-server
const server = new Server({
  name: "git-analyzer",
  version: "1.0.0"
}, {
  capabilities: {
    resources: {},
    tools: {
      "analyze_commits": {
        description: "Analyze Git commits and generate blog post",
        inputSchema: {
          type: "object",
          properties: {
            since: { type: "string" },
            format: { type: "string", enum: ["blog", "changelog"] }
          }
        }
      }
    }
  }
});
```

이렇게 하면 프롬프트마다 전체 커밋 데이터를 다시 보내지 않아도 된다. 토큰 사용량도 줄고 속도도 빨라진다.

### GitHub Copilot Workspace 통합

Microsoft가 발표한 Copilot Workspace는 이런 용도에 최적화되어 있다. 레포지토리 전체를 이해한 상태에서 커밋 분석을 할 수 있어서 더 정확한 컨텍스트를 제공한다.

### 비용 최적화

현재는 매일 Claude 3.5 Sonnet을 쓰는데, 빌드 로그 같은 단순한 작업은 Claude 3 Haiku로도 충분하다. 비용이 10분의 1이다.

복잡한 분석은 Sonnet, 단순 변환은 Haiku로 라우팅하는 로직을 추가하면 월 비용을 크게 줄일 수 있다.

### 플랫폼별 최적화

각 플랫폼의 알고리즘에 맞춰 콘텐츠를 최적화할 여지가 있다:
- DEV.to: 해시태그 최적화 (#webdev, #tutorial 등)
- Hashnode: 시리즈 기능 활용
- Blogger: SEO 메타태그 강화

이런 건 플랫폼 API documentation을 학습한 specialized agent를 만드는 게 낫다.

## 정리

- 커밋 데이터를 블로그로 변환할 때는 독자 설정과 출력 형식 제약이 핵심이다
- 단계별로 나눠서 처리하면 AI 생성 품질이 올라간다
- 멀티 플랫폼 발행은 상태 추적과 에러 복구 로직이 필수다
- MCP 서버나 specialized agent를 쓰면 더 효율적으로 만들 수 있다

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

</details>