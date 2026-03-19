---
title: "기술 블로그를 AI로 다국적화하는 자동 발행 파이프라인 구축기"
project: "dev_blog"
date: 2026-03-19
lang: ko
tags: [chore, fix, feat]
---

블로그를 영어로도 발행하려다 보니 번역과 발행 과정이 너무 번거로웠다. 그래서 AI와 GitHub Actions로 완전 자동화된 파이프라인을 만들었다. 이 글에서는 어떻게 Claude를 활용해서 콘텐츠를 다국화하고, 여러 플랫폼에 자동 발행하는 시스템을 구축했는지 다룬다.

## 배경: 무엇을 만들고 있는가

개발 관련 블로그를 한국어로 쓰고 있었는데, 해외 독자들에게도 도달하고 싶었다. 문제는 번역과 발행이 수작업이라는 점이었다. DEV.to, Hashnode, Medium 등 여러 플랫폼에 발행하려면 각각 다른 포맷에 맞춰서 올려야 했다.

이번 작업의 목표는 명확했다:
- 한국어 글을 영어로 자동 번역
- 여러 플랫폼에 자동 발행
- 저품질 콘텐츠는 자동으로 정리
- 모든 과정을 GitHub Actions로 자동화

## AI로 기술 블로그 번역하기 — 톤앤매너가 핵심이다

기술 블로그 번역에서 가장 중요한 건 단순한 언어 변환이 아니라 **독자층에 맞는 톤앤매너 변경**이다.

### 효과적인 번역 프롬프트 패턴

이렇게 프롬프트를 구성했다:

> "다음 한국어 기술 블로그 글을 영어로 번역해줘. 단순 번역이 아니라 해외 개발자 커뮤니티에 맞는 톤으로 다시 써줘. 
>
> 조건:
> - 반말을 자연스러운 영어 어투로 바꿔줘 (단정적이지만 친근한 느낌)
> - 한국 특유의 맥락은 글로벌 독자가 이해할 수 있게 설명 추가
> - 코드/CLI 명령어/파일명은 그대로 유지
> - 기술 용어는 번역하지 말고 원어 사용
> - frontmatter의 slug는 영어로, 나머지 메타데이터는 유지
>
> [원문 내용]"

이렇게 쓰면 안 된다:
> "영어로 번역해줘"

차이점은 명확하다. 첫 번째 프롬프트는 **번역의 목적과 제약 조건을 구체화**했다. 특히 기술 블로그의 특성상 코드와 메타데이터 처리 방식을 명시한 게 핵심이다.

### Claude Code의 배치 처리 활용

여러 글을 한번에 번역할 때는 Claude Code의 `codebase` 기능을 활용했다:

```bash
find posts -name "*-ko.md" | head -5 | xargs -I {} basename {} -ko.md
```

이렇게 파일 목록을 뽑은 다음, Claude에게 각 파일을 읽어서 번역하라고 지시했다. 중요한 건 **일관성 유지를 위한 제약 조건**을 매번 반복해서 제공한 것이다.

```markdown
각 파일마다 다음 규칙을 적용해:
1. 파일명에서 -ko 제거하고 -en 추가
2. frontmatter의 date는 그대로, slug만 영어로
3. 본문의 톤은 기존 영어 글들과 일치시켜
```

### 번역 품질 검증 자동화

번역된 글의 품질을 확인하기 위해 간단한 체크리스트를 만들었다:

> "번역된 글을 검토해줘. 다음 항목들을 체크해:
> - [ ] 코드 블록이 깨지지 않았는가
> - [ ] 링크가 여전히 유효한가  
> - [ ] frontmatter 형식이 올바른가
> - [ ] 전문 용어가 일관되게 사용되었는가
> - [ ] 한국어 특유의 표현이 자연스럽게 바뀌었는가"

이 패턴을 쓰니까 번역 후 수정 작업이 대폭 줄어들었다.

## GitHub Actions로 플랫폼별 자동 발행 구축하기

각 플랫폼마다 API 특성이 다르다. DEV.to는 간단하지만 Hashnode는 GraphQL이고, Medium은 OAuth 토큰 관리가 복잡하다.

### 플랫폼별 필터링 전략

모든 글을 모든 플랫폼에 올릴 필요는 없다. 이런 규칙을 적용했다:

```yaml
- name: Filter posts for platform
  run: |
    # DEV.to: 한국어 글과 build-log는 제외
    find posts -name "*.md" \
      ! -name "*-ko.md" \
      ! -name "*build-log*" \
      -exec echo {} \;
```

이렇게 필터링하는 이유:
- 한국어 글은 DEV.to의 주 독자층에 맞지 않음
- build-log 시리즈는 너무 개인적이어서 글로벌 플랫폼에는 부적절
- contextual relevance를 고려한 선별적 발행이 engagement 향상에 도움

### API 에러 핸들링 패턴

각 플랫폼의 API는 서로 다른 방식으로 에러를 낸다. 공통 패턴을 찾아서 처리 로직을 표준화했다:

```bash
publish_to_devto() {
  response=$(curl -s -w "%{http_code}" \
    -H "api-key: $DEVTO_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    https://dev.to/api/articles)
  
  http_code="${response: -3}"
  body="${response%???}"
  
  if [ "$http_code" -ge 400 ]; then
    echo "DEV.to API error: $body"
    return 1
  fi
}
```

중요한 건 **각 API의 rate limiting과 중복 체크 로직**을 이해하는 것이다. DEV.to는 같은 제목의 글이 있으면 업데이트하고, Hashnode는 새 글을 만든다.

### 메타데이터 동기화

발행된 글의 URL을 다시 원본 파일에 기록하는 로직이 필요했다:

```bash
# 발행 후 URL을 frontmatter에 추가
sed -i "/^published_urls:/d" "$file"
echo "published_urls:" >> "$file"
echo "  devto: $devto_url" >> "$file"  
echo "  hashnode: $hashnode_url" >> "$file"
```

이렇게 하면 나중에 어떤 글이 어디 발행됐는지 추적할 수 있다.

## 콘텐츠 품질 관리 — 데이터 기반 정리 전략

블로그가 늘어나면서 저품질 콘텐츠도 쌓인다. 이걸 수동으로 관리하기엔 너무 번거로워서 자동화했다.

### 성과 기반 콘텐츠 정리

DEV.to API로 글의 조회수와 반응을 가져와서 기준 이하 글들을 자동으로 unpublish한다:

```bash
cleanup_low_performance() {
  articles=$(curl -s -H "api-key: $DEVTO_API_KEY" \
    "https://dev.to/api/articles/me/published")
  
  echo "$articles" | jq -r '.[] | 
    select(.page_views_count < 50 and .positive_reactions_count < 5) | 
    select(.title | contains("build-log") or contains("news")) |
    .id' | while read id; do
      unpublish_article "$id"
  done
}
```

이 로직의 핵심은 **카테고리별 다른 기준 적용**이다. build-log나 news 글은 시의성이 중요해서 조회수가 낮으면 빨리 정리하고, 기술 튜토리얼은 롱테일 효과가 있어서 보존한다.

### AI로 콘텐츠 품질 평가

Claude에게 글의 품질을 평가하게 하는 프롬프트도 만들었다:

> "다음 기술 블로그 글을 평가해줘:
>
> 기준:
> - 기술적 정확성 (1-10)
> - 실용성 (1-10)  
> - 가독성 (1-10)
> - 시의성 (1-10)
>
> 7점 미만 항목이 2개 이상이면 'CLEANUP' 추천
> 그 외에는 'KEEP' 추천
>
> [글 내용]"

아직 완전 자동화하지는 않고 참고용으로만 쓰지만, 나중에는 이 평가도 자동 정리 기준에 포함할 계획이다.

## 더 나은 방법은 없을까

현재 파이프라인을 구축하면서 발견한 개선점들이 있다.

### 번역 품질 향상

Anthropic의 최신 문서를 보면 **few-shot prompting**이 번역 일관성에 더 좋다고 한다. 현재는 zero-shot으로 번역하는데, 좋은 번역 사례 2-3개를 프롬프트에 포함하면 품질이 올라갈 것 같다.

또한 **Claude의 Constitutional AI**를 활용해서 번역 과정에서 편향이나 부적절한 표현을 자동으로 걸러낼 수 있다:

```markdown
번역 시 다음 원칙을 지켜줘:
1. 성별/국가/문화에 대한 편향 없이
2. 포용적인 언어 사용
3. 접근성을 고려한 표현
```

### 플랫폼 API 최적화

현재는 각 플랫폼을 순차적으로 처리하는데, **parallel publishing**으로 시간을 단축할 수 있다. GitHub Actions의 matrix strategy를 쓰면 된다:

```yaml
strategy:
  matrix:
    platform: [devto, hashnode, medium]
```

다만 API rate limiting 때문에 너무 aggressive하게 하면 안 된다.

### MCP 서버 활용

Claude의 Model Context Protocol을 쓰면 더 정교한 콘텐츠 관리가 가능하다. 예를 들어 Git 히스토리를 분석해서 어떤 글이 자주 수정되는지 파악하고, 그런 글들을 우선적으로 번역하는 로직을 만들 수 있다.

### 성과 분석 고도화

현재는 단순한 조회수 기반이지만, Google Analytics나 각 플랫폼의 상세 메트릭을 종합해서 더 정교한 성과 평가를 할 수 있다. 특히 **conversion rate**(글 읽기 → 팔로우/구독)를 추적하면 콘텐츠 전략에 더 도움이 될 것이다.

## 정리

이번 작업에서 배운 핵심 포인트들:

- AI 번역은 단순 언어 변환이 아니라 톤앤매너 적응이 핵심이다
- GitHub Actions로 복잡한 multi-platform 발행도 충분히 자동화할 수 있다  
- 콘텐츠 품질 관리는 수동이 아닌 데이터 기반 자동화가 효율적이다
- 각 플랫폼의 API 특성을 이해하고 맞춤형 전략을 세워야 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

fab9e97 — chore: update published articles [skip ci]
a0152a7 — fix: 제목에 한국어 포함되면 DEV.to 발행 스킵
38d0fc8 — post: contextzip launch - Claude Code built its own tool
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

</details>