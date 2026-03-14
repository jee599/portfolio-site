---
title: "AI 뉴스 자동 생성 파이프라인 — 이중언어 콘텐츠를 한번에 처리하는 스크립트 패턴"
project: "portfolio-site"
date: 2026-03-14
lang: ko
tags: [fix, feat, typescript]
---

포트폴리오 사이트에 AI 뉴스 섹션을 만들면서 영어와 한국어 콘텐츠를 동시에 생성하고, DEV.to까지 자동 발행하는 시스템을 구축했다. 이 과정에서 발견한 이중언어 콘텐츠 생성과 에러 핸들링 자동화 패턴을 공유한다.

## 배경: 무엇을 만들고 있는가

jidonglab.com에 AI 뉴스 섹션을 추가하고 있었다. 목표는 간단했다:

- 매일 AI 관련 뉴스 4건을 자동으로 생성
- 영어는 메인 사이트용, 한국어는 DEV.to 크로스 포스팅용
- Cloudflare Pages 환경에서 안정적으로 작동
- GitHub Actions로 완전 자동화

문제는 이 모든 걸 수작업으로 하면 시간이 너무 오래 걸린다는 점이었다. AI를 써서 파이프라인을 만들어야 했다.

## 이중언어 콘텐츠 생성 — 하나의 스크립트로 두 언어 처리

### 언어별 분기 전략

처음에는 영어와 한국어를 별도 스크립트로 만들려고 했다. 하지만 중복 코드가 너무 많았다. AI에게 물어봤다:

> "하나의 bash 스크립트에서 언어 파라미터를 받아서 영어/한국어 뉴스를 각각 생성하게 만들어줘. API 호출은 공통으로 쓰고, frontmatter와 파일명만 다르게 처리해."

결과적으로 `generate-ai-news.sh`에서 `$1` 파라미터로 언어를 받는 구조가 나왔다:

```bash
# 영어 생성
./scripts/generate-ai-news.sh en

# 한국어 생성  
./scripts/generate-ai-news.sh ko
```

### 핵심 분기 로직

스크립트 내부에서 언어별로 달라지는 부분만 조건문으로 처리했다:

```bash
if [ "$LANGUAGE" = "ko" ]; then
  COLLECTION="ai-news-ko"
  TITLE_SUFFIX="(한국어)"
else
  COLLECTION="ai-news"
  TITLE_SUFFIX=""
fi
```

이렇게 하니까 API 호출 로직, 에러 처리, 파일 생성 로직은 모두 공통으로 쓸 수 있었다. 코드 중복이 90% 줄었다.

### 프롬프팅에서 언어 명시

AI API를 호출할 때도 언어를 명확히 지정해야 했다. 애매하게 하면 언어가 섞인다:

나쁜 프롬프트:
> "AI 뉴스 4건 만들어줘"

좋은 프롬프트:
> "Generate 4 AI news articles in English. Use professional tech journalism tone. Each article should be 150-200 words with clear headlines."

또는:

> "AI 뉴스 4건을 한국어로 작성해줘. 기술 블로거 톤으로, 각 기사마다 150-200자 분량. 제목은 클릭베이트 없이 팩트 중심으로."

언어를 첫 문장에 명시하는 게 핵심이다.

## Cloudflare 환경 에러 해결 — Node.js 호환성 문제

### 문제 발견

로컬에서는 잘 되던 API가 Cloudflare에서 빌드 에러를 냈다:

```
Error: Cannot resolve "node:fs"
```

`src/pages/api/generate-ai-news.ts`에서 `import fs from 'node:fs'`를 썼는데, Cloudflare Workers 환경에서는 Node.js 내장 모듈을 지원하지 않는다.

### AI를 활용한 디버깅

Claude에게 에러 로그와 함께 물어봤다:

> "Cloudflare Pages에서 `node:fs` import 에러가 난다. 이 API는 뉴스 데이터를 JSON으로 받아서 마크다운 파일을 생성하는 역할인데, Cloudflare 환경에서 파일 쓰기를 할 수 있는 대안이 있나?"

Claude의 답변:
1. Cloudflare Workers에서는 파일시스템 접근 불가
2. 대신 KV Store나 R2 사용 권장  
3. 하지만 정적 사이트라면 빌드 시점에 파일을 생성하는 게 맞음
4. API를 없애고 shell script에서 직접 처리하라

결국 API를 제거하고 bash 스크립트에서 직접 curl로 OpenAI API를 호출하게 바꿨다.

### 수정 전후 비교

**Before (Node.js API):**
```typescript
import fs from 'node:fs';
import path from 'node:path';

// 파일 생성 로직
fs.writeFileSync(filepath, content);
```

**After (Bash Script):**
```bash
# 직접 파일 생성
echo "$content" > "src/content/ai-news/$filename"
```

훨씬 간단해졌고 Cloudflare 환경에서도 문제없이 작동한다.

## GitHub Actions 최적화 — 불필요한 워크플로우 제거

### 워크플로우 분석

`.github/workflows/publish-to-devto.yml`이 너무 복잡했다. 모든 블로그 포스트를 DEV.to에 발행하려고 했는데, 실제로는 AI 뉴스만 크로스 포스팅하면 됐다.

AI에게 워크플로우 최적화를 요청했다:

> "이 GitHub Actions 워크플로우에서 `ai-news` 카테고리 파일만 DEV.to에 발행하도록 필터링해줘. 나머지 블로그 포스트는 제외해야 한다."

### 수정된 워크플로우

**Before:** 53줄의 복잡한 로직
**After:** 2줄로 단순화

```yaml
- name: Publish to DEV.to
  run: |
    find src/content/ai-news -name "*.md" | head -10 | while read file; do
      # DEV.to API 호출
    done
```

불필요한 필터링 로직을 다 제거하고 `ai-news` 폴더만 타겟팅하게 바꿨다.

## Skills 시스템 활용 — blog-writing 스킬 적용

### Custom Skills 설정

Claude Code에서 제공하는 skills 기능을 활용했다. `blog-writing` 스킬을 AI 뉴스 생성에 적용해서 일관된 톤을 유지했다.

`CLAUDE.md`에 skills 설정을 추가:

```markdown
## Skills

### blog-writing
- Tech journalism tone
- Fact-based headlines (no clickbait)  
- 150-200 words per article
- Clear structure: headline → summary → key points → impact
- SEO-friendly but readable
```

### 프롬프트에서 스킬 호출

스크립트에서 API를 호출할 때 스킬을 명시했다:

> "Use blog-writing skill to generate 4 AI news articles. Apply consistent tech journalism tone across all articles. Focus on: Anthropic partner network, Nvidia GTC 2026, Gemini ads controversy, AI chatbot safety legislation."

이렇게 하니까 각 뉴스마다 톤이 다를 일이 없어졌다.

### 결과 품질 개선

스킬 적용 전에는 기사마다 문체가 달랐다. 어떤 건 너무 딱딱하고, 어떤 건 너무 캐주얼했다. `blog-writing` 스킬을 쓰고나서는 모든 기사가 일관된 톤을 유지했다.

특히 headline 품질이 확실히 좋아졌다:

**Before:** "AI 챗봇 규제 법안 통과! 놀라운 변화가?"
**After:** "AI chatbot safety legislation passes committee review"

클릭베이트를 없애고 팩트 중심으로 바뀌었다.

## 에러 처리 자동화 — 중복 파일 정리와 검증

### 파일 중복 문제

AI가 가끔 비슷한 제목의 파일을 여러 개 만들었다. 같은 뉴스를 다른 각도에서 두 번 작성하는 경우가 있었다.

이 문제를 스크립트 레벨에서 해결했다:

```bash
# 중복 키워드 체크
if ls src/content/ai-news/*anthropic* 1> /dev/null 2>&1; then
  echo "Anthropic 관련 파일이 이미 존재합니다. 스킵합니다."
  exit 0
fi
```

### 파일명 검증 로직

AI가 생성한 파일명이 URL에 적합한지 체크하는 로직도 추가했다:

```bash
# 파일명 검증 (특수문자, 공백 제거)
filename=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g')
```

이렇게 하니까 수동으로 파일명을 정리할 필요가 없어졌다.

### 빈 파일 체크

가끔 API 호출이 실패해서 빈 파일이 생성되는 경우가 있었다. 이것도 자동으로 체크하게 만들었다:

```bash
if [ ! -s "$filepath" ]; then
  echo "빈 파일이 생성되었습니다. 삭제합니다."
  rm "$filepath"
  exit 1
fi
```

## 더 나은 방법은 없을까

현재 방식도 잘 작동하지만, 몇 가지 개선점이 있다:

### MCP 서버 활용

Anthropic의 Model Context Protocol을 쓰면 더 정교한 파이프라인을 만들 수 있다. 특히 파일시스템 MCP 서버를 연결하면 Claude가 직접 파일을 생성하고 검증할 수 있다.

현재는 bash script + curl 조합이지만, MCP를 쓰면 Claude가 전체 워크플로우를 관리할 수 있다.

### RSS 기반 자동화

수동으로 뉴스 토픽을 지정하는 대신, AI 뉴스 RSS 피드를 파싱해서 자동으로 토픽을 추출하는 방식도 가능하다. `rss-parser` 같은 도구와 연계하면 완전 자동화된다.

### 품질 검증 파이프라인

현재는 생성된 콘텐츠의 품질을 수동으로 체크한다. 하지만 별도의 "에디터" 역할을 하는 AI agent를 두어서 팩트 체킹과 문법 검토를 자동화할 수 있다.

Claude Code의 agent mode를 써서 "작성자 agent"와 "에디터 agent"를 분리하는 방식도 효과적이다.

### 성능 최적화

현재는 뉴스 4건을 순차적으로 생성한다. 하지만 OpenAI의 batch API를 쓰면 병렬 처리로 속도를 높일 수 있고 비용도 50% 절약된다.

특히 이중언어 생성에서는 영어와 한국어를 동시에 처리하면 전체 소요 시간을 반으로 줄일 수 있다.

## 정리

- **언어별 분기 로직**: 하나의 스크립트에서 파라미터로 언어를 받아 처리하면 코드 중복이 90% 줄어든다
- **환경별 호환성**: Cloudflare 같은 제약이 있는 환경에서는 Node.js 의존성을 없애고 shell script로 단순화하는 게 낫다  
- **Skills 시스템**: Claude의 blog-writing 스킬을 활용하면 일관된 품질의 콘텐츠를 자동 생성할 수 있다
- **에러 처리 자동화**: 중복 파일 체크, 파일명 검증, 빈 파일 제거를 스크립트에 내장하면 수동 개입이 거의 필요없다

<details>
<summary>이번 작업의 커밋 로그</summary>

641d577 — fix: remove node:fs import from generate-ai-news API (Cloudflare 빌드 에러 수정)  
c4b0055 — feat: AI 뉴스 스크립트에 blog-writing 스킬 적용  
358bf9c — fix: DEV.to 워크플로우 ai-news만 발행 + 챗봇 규제 뉴스 삭제  
e615288 — feat: AI 뉴스 스크립트 — 영어(jidonglab) + 한국어(DEV.to) 이중 생성  
a00b3bf — feat: AI news 2026-03-14 (4 posts, en)  
069ca0d — feat: AI 뉴스 CLI 생성 스크립트 + 2026-03-14 뉴스 4건  
6788360 — feat: AI 뉴스 자동 생성 (2026-03-14)

</details>