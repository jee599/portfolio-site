---
title: "기술 블로그 자동화의 끝판왕 — 멀티 플랫폼 배포까지 AI로 처리하기"
project: "dev_blog"
date: 2026-03-18
lang: ko
tags: [chore, feat, fix]
---

기술 블로그를 운영하면서 가장 귀찮은 게 뭘까. 글 쓰기도 아니고, 편집도 아니다. 바로 **배포**다. DEV.to, Hashnode, Blogger, Medium까지 각각 다른 포맷으로 올리고, 메타데이터 관리하고, 발행 상태 추적하는 일. 이번에 이 모든 걸 AI와 GitHub Actions으로 완전 자동화했다.

이 글에서는 어떻게 AI를 활용해서 멀티 플랫폼 블로그 자동화 파이프라인을 구축했는지, 그 과정에서 어떤 프롬프팅 기법과 구조화 전략이 효과적이었는지 다룬다.

## 배경: 무엇을 만들고 있는가

현재 운영 중인 기술 블로그는 GitHub Pages를 메인으로, DEV.to, Hashnode, Blogger에 동시 배포한다. 한국어와 영어 글을 모두 쓰는데, 각 플랫폼마다 요구하는 메타데이터 포맷이 다르다. 수동으로 하면 하루 종일 걸리는 작업이다.

이번 작업의 목표는 명확했다:
- 마크다운 파일 하나만 커밋하면 모든 플랫폼에 자동 배포
- 플랫폼별 메타데이터 자동 생성 및 관리  
- 발행 상태와 URL 추적
- 저조한 조회수의 글은 자동으로 unpublish

## API 연동 워크플로우를 AI로 설계하기

### 프롬프팅 전략

각 플랫폼의 API가 다르니까 워크플로우를 하나씩 만들어달라고 하면 안 된다. 전체 구조를 먼저 설계하게 해야 한다.

> "GitHub Actions로 멀티 플랫폼 블로그 배포 시스템을 만들어야 해. DEV.to, Hashnode, Blogger API를 각각 연동하는데, 다음 제약 조건을 지켜줘:
> 
> 1. 각 플랫폼별로 별도 워크플로우 파일
> 2. 메타데이터는 frontmatter에서 추출
> 3. 발행 후 URL을 다시 frontmatter에 업데이트
> 4. 실패 시 상세한 로그 출력
> 5. rate limiting 고려한 retry 로직
> 
> 먼저 전체 아키텍처를 설명하고, 그 다음에 각 워크플로우 코드를 작성해줘."

이렇게 쓰면 안 된다:
> "블로그 자동 배포 만들어줘"

### GitHub Actions 워크플로우 구조화

AI가 제안한 구조는 이랬다:

1. **트리거 분리**: `published: true`로 변경된 파일만 감지
2. **플랫폼별 워크플로우**: DEV.to, Hashnode, Blogger 각각 독립적
3. **메타데이터 관리**: 발행 후 URL을 자동으로 frontmatter에 추가
4. **에러 핸들링**: API 실패 시 상세 로그와 retry

핵심은 **의존성을 최소화**하는 것이었다. 하나 플랫폼이 실패해도 다른 플랫폼 배포에는 영향 없게.

### OAuth 토큰 관리 패턴

Blogger API 연동에서 가장 까다로운 부분이었다. access token이 1시간마다 만료되는데, 이걸 어떻게 자동화할지 고민이었다.

> "Blogger API OAuth refresh token을 GitHub Actions에서 자동으로 갱신하는 워크플로우를 만들어줘. refresh_token은 GitHub Secrets에 저장하고, 새로운 access_token을 받아서 API 호출하는 방식으로. token 갱신 실패 시에는 워크플로우를 중단하고 명확한 에러 메시지를 출력해줘."

결과적으로 이런 패턴이 나왔다:

```yaml
- name: Get OAuth Token
  id: oauth
  run: |
    response=$(curl -s -X POST https://oauth2.googleapis.com/token \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "client_id=${{ secrets.BLOGGER_CLIENT_ID }}" \
      -d "client_secret=${{ secrets.BLOGGER_CLIENT_SECRET }}" \
      -d "refresh_token=${{ secrets.BLOGGER_REFRESH_TOKEN }}" \
      -d "grant_type=refresh_token")
    
    access_token=$(echo $response | jq -r '.access_token')
    if [ "$access_token" = "null" ]; then
      echo "Token refresh failed: $response"
      exit 1
    fi
    echo "::add-mask::$access_token"
    echo "token=$access_token" >> $GITHUB_OUTPUT
```

## 콘텐츠 필터링과 자동 정리

### 언어별 배포 전략

한국어 글은 국내 독자 대상이라 DEV.to에 올리면 의미가 없다. 영어 글만 해외 플랫폼에 배포하도록 필터링 로직을 넣었다.

> "frontmatter에서 `lang: en`인 파일만 DEV.to와 Hashnode에 배포하는 필터 조건을 추가해줘. 한국어 글(`lang: ko`)은 건너뛰되, 로그에 명확히 표시해줘."

```yaml
- name: Check language
  id: check-lang
  run: |
    lang=$(head -20 "${{ matrix.file }}" | grep "^lang:" | cut -d' ' -f2 | tr -d '"')
    echo "Language: $lang"
    if [ "$lang" != "en" ]; then
      echo "Skipping non-English post"
      echo "skip=true" >> $GITHUB_OUTPUT
    else
      echo "skip=false" >> $GITHUB_OUTPUT
    fi

- name: Publish to DEV.to
  if: steps.check-lang.outputs.skip == 'false'
```

### 자동 정리 워크플로우

build log처럼 임시성 글들이 쌓이면 블로그가 지저분해진다. 조회수가 낮은 글들을 자동으로 unpublish하는 워크플로우를 만들었다.

> "DEV.to API로 내 글 목록을 가져와서, 조회수가 50 이하이고 제목에 'build-log'가 포함된 글들을 unpublish하는 스크립트를 만들어줘. 각 글을 unpublish하기 전에 제목과 조회수를 로그에 출력해줘."

```bash
articles=$(curl -s "https://dev.to/api/articles/me/published" \
  -H "api-key: ${{ secrets.DEVTO_API_KEY }}")

echo "$articles" | jq -c '.[] | select(.page_views_count <= 50 and (.title | contains("build-log")))' | while read article; do
  id=$(echo "$article" | jq -r '.id')
  title=$(echo "$article" | jq -r '.title')
  views=$(echo "$article" | jq -r '.page_views_count')
  
  echo "Unpublishing: $title (Views: $views)"
  curl -X PUT "https://dev.to/api/articles/$id" \
    -H "api-key: ${{ secrets.DEVTO_API_KEY }}" \
    -H "Content-Type: application/json" \
    -d '{"article": {"published": false}}'
done
```

## 메타데이터 자동 업데이트 패턴

### 발행 URL 자동 추가

글이 각 플랫폼에 발행되면, 해당 URL을 frontmatter에 자동으로 추가해야 한다. 이게 생각보다 까다로웠다. 마크다운 파일을 파싱하고 수정하는 로직을 AI에게 맡겼다.

> "발행 성공 후 frontmatter에 플랫폼별 URL을 추가하는 로직을 만들어줘. 기존 frontmatter는 그대로 두고, devto_url, hashnode_url, blogger_url 필드만 추가하거나 업데이트해줘. sed나 awk 대신 더 안전한 방법으로."

결과물:

```bash
# frontmatter 끝 지점 찾기
line_num=$(sed -n '2,$ {/^---$/=; /^\.\.\.$/=;}' "$file" | head -1)

# URL 필드가 이미 있는지 확인
if grep -q "^${platform}_url:" "$file"; then
  # 기존 URL 업데이트
  sed -i "s|^${platform}_url:.*|${platform}_url: \"$url\"|" "$file"
else
  # 새 URL 추가 (frontmatter 끝나기 전에)
  sed -i "${line_num}i ${platform}_url: \"$url\"" "$file"
fi
```

### published 상태 관리

`published: false`인 글들을 주기적으로 `published: true`로 변경해서 배포 큐에 넣는 워크플로우도 필요했다.

> "posts/ 디렉토리에서 `published: false`인 마크다운 파일들을 찾아서 `published: true`로 변경하는 스크립트를 만들어줘. 변경된 파일 목록을 로그에 출력하고, git으로 자동 커밋까지 해줘."

```bash
find posts/ -name "*.md" -exec grep -l "published: false" {} \; | while read file; do
  echo "Publishing: $file"
  sed -i 's/published: false/published: true/' "$file"
  git add "$file"
done

if ! git diff --cached --quiet; then
  git commit -m "chore: update published articles [skip ci]"
  git push
fi
```

## 더 나은 방법은 없을까

### MCP 서버 활용

현재는 각 플랫폼별로 별도 워크플로우를 만들었는데, MCP(Model Context Protocol) 서버를 쓰면 더 깔끔할 수 있다. Claude가 직접 API를 호출하게 하는 방식이다.

```python
# MCP server example
@server.call_tool()
async def publish_to_devto(content: str, title: str, tags: list):
    response = await devto_client.create_article({
        "article": {
            "title": title,
            "body_markdown": content,
            "tags": tags,
            "published": True
        }
    })
    return response["url"]
```

### 배치 처리 최적화

현재는 파일 하나씩 처리하는데, 여러 글을 한 번에 배포하는 상황에서는 비효율적이다. matrix strategy를 쓰면 병렬 처리가 가능하다.

```yaml
strategy:
  matrix:
    file: ${{ fromJson(needs.detect-changes.outputs.files) }}
    platform: [devto, hashnode, blogger]
  max-parallel: 3
```

### 콘텐츠 품질 검증

발행 전에 AI로 콘텐츠 품질을 검증하는 단계를 추가할 수 있다. 오타, 문법, SEO 최적화까지.

> "마크다운 콘텐츠를 분석해서 다음 항목을 체크해줘: 1) 문법 오류, 2) 제목 길이 (SEO 최적화), 3) 메타 설명 존재 여부, 4) 이미지 alt 텍스트. 문제가 있으면 워크플로우를 실패시켜줘."

### 분석 데이터 활용

현재는 조회수만 보는데, engagement rate, 댓글 수, 좋아요 비율까지 종합적으로 판단해서 콘텐츠 전략을 최적화할 수 있다.

## 정리

- **전체 구조를 먼저 설계**하게 하고, 세부 구현은 그 다음에 요청한다
- **제약 조건을 명확히** 제시하면 AI가 더 실용적인 코드를 만든다  
- **에러 핸들링과 로깅**을 처음부터 고려해서 디버깅 시간을 줄인다
- **의존성을 최소화**해서 하나 실패해도 전체가 멈추지 않게 한다

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