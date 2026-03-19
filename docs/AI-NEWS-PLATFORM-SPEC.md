# AI News Platform 기획서

> jidonglab.com의 AI 뉴스 시스템을 이메일 뉴스레터 + 모바일 앱으로 확장한다.
> 핵심 원칙: **내가 개입하지 않는 완전 자동화**.

---

## 현재 상태

```
소스 (Google, HN, Reddit, GitHub)
  → Claude API가 뉴스 작성 (1일 2회, 9AM/9PM KST)
  → portfolio-site/src/content/ai-news/ 에 마크다운 저장
  → Cloudflare Pages 자동 빌드 → jidonglab.com/ai-news
  → DEV.to 자동 교차 게시 (GitHub Actions)
```

**빠진 것:** 구독자 관리, 이메일 발송, 모바일 앱, 실시간 알림 — 전부 없다.

---

## Phase 1: 이메일 뉴스레터 (1-2일)

### 목표
이메일 입력하면 매일 9AM KST에 전날의 AI 뉴스를 이메일로 받는다. 내 개입 0.

### 아키텍처

```
jidonglab.com/ai-news 하단
  └─ 이메일 입력 폼
      └─ POST /api/subscribe
          └─ Upstash Redis에 저장 (SADD newsletter:subscribers email)
          └─ Resend API로 확인 이메일 발송 (double opt-in)

매일 0:00 UTC (= 9AM KST)
  └─ Cloudflare Worker Cron Trigger
      └─ 전날 ai-news 글 목록 fetch (jidonglab.com RSS or GitHub API)
      └─ HTML 이메일 템플릿 렌더링
      └─ Resend API로 구독자 전원에게 발송
      └─ 이메일 하단: unsubscribe 링크 (GET /api/unsubscribe?token=xxx)
```

### 기술 선택

| 컴포넌트 | 선택 | 이유 |
|---------|------|------|
| 이메일 발송 | **Resend** | 무료 3,000통/월. React Email 호환. API가 깔끔. |
| 구독자 저장 | **Upstash Redis** | 이미 쓰는 중. `SADD`, `SMEMBERS`, `SREM`으로 충분. |
| 스케줄러 | **Cloudflare Worker Cron** | Pages와 같은 생태계. 무료. 1분 단위. |
| 이메일 템플릿 | **Plain HTML + inline CSS** | 뉴스 다이제스트는 단순 목록. 과한 프레임워크 불필요. |

### 구현 범위

**새 파일 4개:**

1. `src/pages/api/subscribe.ts`
   - POST: 이메일 유효성 검증 → Redis에 저장 → 확인 이메일 발송
   - 중복 체크, rate limiting (IP당 분당 3회)

2. `src/pages/api/unsubscribe.ts`
   - GET: token 검증 → Redis에서 이메일 삭제
   - "구독 해제됨" 페이지 렌더링

3. `workers/daily-newsletter.ts` (Cloudflare Worker, 별도 배포)
   - Cron trigger: `0 0 * * *` (UTC 0:00 = KST 9AM)
   - 전날 ai-news RSS에서 글 목록 fetch
   - 각 글의 title, summary, link 추출
   - HTML 이메일 템플릿 생성
   - Resend API로 구독자 전원 발송
   - 발송 결과 로깅 (Upstash Redis에 `newsletter:log:{date}`)

4. `src/components/NewsletterForm.astro`
   - 이메일 입력 + 구독 버튼
   - ai-news 인덱스 페이지 하단에 삽입

**수정 파일 1개:**

- `src/pages/ai-news/index.astro` — NewsletterForm 컴포넌트 추가

### 이메일 템플릿 구조

```
┌─────────────────────────────────────┐
│  jidonglab AI News Daily            │
│  2026-03-16                         │
├─────────────────────────────────────┤
│                                     │
│  📰 Claude 4.5 Sonnet 출시         │
│  요약 텍스트 2-3줄...               │
│  → 읽기: jidonglab.com/ai-news/...  │
│                                     │
│  ─────────────────────────          │
│                                     │
│  📰 OpenAI, o3 모델 공개           │
│  요약 텍스트 2-3줄...               │
│  → 읽기: jidonglab.com/ai-news/...  │
│                                     │
│  ─────────────────────────          │
│  (전날 생성된 뉴스 전부)             │
│                                     │
├─────────────────────────────────────┤
│  구독 해제: [unsubscribe link]      │
│  jidonglab.com                      │
└─────────────────────────────────────┘
```

### 법적 요구사항 체크리스트

- [ ] 모든 이메일에 unsubscribe 링크 포함 (CAN-SPAM)
- [ ] Double opt-in 구현 (GDPR 대응)
- [ ] Unsubscribe는 즉시 처리 (클릭 1번)
- [ ] 무료 구독 해제 (로그인 불필요)

### 비용

| 항목 | 월 비용 |
|------|--------|
| Resend (3,000통 무료) | $0 |
| Upstash Redis (이미 사용중) | $0 |
| Cloudflare Worker | $0 (무료 티어) |
| **합계** | **$0/월** (구독자 100명 이하) |

1,000명 초과 시: Resend $20/월.

---

## Phase 2: 실시간 크롤링 엔진 (1주)

### 목표
AI 뉴스를 1일 2회가 아니라 **15분마다** 수집. 중요한 뉴스는 즉시 감지.

### 아키텍처

```
Cloudflare Worker Cron (15분 간격)
  └─ RSS 피드 20개 fetch (OpenAI, Anthropic, Google AI, TechCrunch, ArXiv...)
  └─ HN Algolia API (최근 15분)
  └─ Reddit API (r/LocalLLaMA, r/MachineLearning)
  │
  └─ 중복 제거 (URL 해시 + 제목 유사도)
  └─ Upstash Redis에 저장 (Sorted Set, score = timestamp)
  │
  └─ 중요도 판정 (Claude Haiku)
      ├─ score 8+ → "breaking" 플래그
      ├─ score 5-7 → "normal"
      └─ score 1-4 → 스킵
  │
  └─ breaking 뉴스 → Phase 3의 push notification 트리거
  └─ 모든 뉴스 → Phase 1의 이메일 다이제스트 소스
```

### 크롤링 소스 (우선순위)

**Tier 1 — 공식 블로그 RSS (무료, 제한 없음)**
- `https://openai.com/blog/rss.xml`
- `https://www.anthropic.com/blog/feed`
- `https://blog.google/technology/ai/rss/`
- `https://deepmind.google/blog/rss.xml`
- `https://huggingface.co/blog/feed.xml`

**Tier 2 — 미디어 RSS (무료)**
- TechCrunch AI, The Verge AI, Ars Technica AI
- MIT Technology Review AI
- Techmeme (aggregated)

**Tier 3 — 커뮤니티 API (무료)**
- HackerNews Algolia API (rate limit 없음)
- Reddit JSON API (100 req/min)

**Tier 4 — 학술 (무료)**
- ArXiv cs.AI, cs.LG, cs.CL RSS

**스킵:** Twitter/X ($100/월, 가성비 나쁨)

### 중복 제거 전략

1단계 (즉시, 비용 $0): URL 해시로 정확한 중복 제거
2단계 (즉시, 비용 $0): 제목 정규화 후 유사도 비교 (lowercase, 특수문자 제거, 70% 이상 일치하면 중복)
3단계 (향후): 임베딩 기반 시맨틱 중복 제거 (OpenAI text-embedding-3-small, $0.02/1M 토큰)

### 중요도 판정 프롬프트

```
아래 뉴스 항목의 AI 업계 중요도를 1-10으로 평가해라.
8 이상 = breaking (새 모델 출시, 대형 인수합병, 정책 변화)
5-7 = normal (업데이트, 연구 결과)
1-4 = skip (의견, 루머, 반복)

제목: {title}
소스: {source}
요약: {snippet}

JSON으로 답해라: {"score": 8, "reason": "새 모델 출시"}
```

모델: Claude Haiku ($0.25/1M input, $1.25/1M output)
하루 500개 기사 × 평균 200 토큰 = 100K 토큰/일 ≈ **$0.03/일**

### 데이터 구조 (Upstash Redis)

```
# 뉴스 아이템
ZADD news:items {timestamp} {json_string}
  → {"url": "...", "title": "...", "source": "openai", "score": 8, "summary": "...", "breaking": true}

# URL 중복 체크
SADD news:urls:2026-03-16 {url_hash}
  → TTL 7일

# 크롤링 상태
SET news:last_crawl {timestamp}

# 통계
INCR news:stats:crawled:2026-03-16
INCR news:stats:breaking:2026-03-16
```

### 비용

| 항목 | 월 비용 |
|------|--------|
| Cloudflare Worker (paid plan) | $5 |
| Claude Haiku (중요도 판정) | $1-3 |
| Upstash Redis (free tier) | $0 |
| **합계** | **$6-8/월** |

---

## Phase 3: 모바일 앱 (2-3주)

### 목표
SAVE 앱처럼 AI 뉴스를 실시간으로 보고, breaking news는 push 알림으로 받는다.

### 기술 스택

| 컴포넌트 | 선택 | 이유 |
|---------|------|------|
| 프레임워크 | **Expo (React Native)** | TypeScript + React 이미 쓰는 중. 클라우드 빌드. |
| 푸시 알림 | **Expo Notifications** | 무료, 무제한, 빌트인. |
| 백엔드 API | **Cloudflare Workers** | Phase 2 크롤러와 같은 인프라. |
| 데이터 | **Upstash Redis** | Phase 2에서 이미 뉴스 저장. |
| 빌드/배포 | **EAS Build** | 무료 30빌드/월. Xcode 없이 iOS 빌드. |

### 앱 화면 구성

```
┌─────────────────────┐
│ AI News             │
│ ┌─────────────────┐ │
│ │ 🔴 BREAKING     │ │
│ │ Claude 5 출시    │ │
│ │ 2분 전           │ │
│ └─────────────────┘ │
│                     │
│ ── 오늘 ──          │
│                     │
│ OpenAI o3 업데이트   │
│ 45분 전 · score 7   │
│                     │
│ Google Gemini 2.5... │
│ 2시간 전 · score 6  │
│                     │
│ ArXiv: Attention... │
│ 3시간 전 · score 5  │
│                     │
│ ── 어제 ──          │
│ ...                 │
│                     │
│ [설정] [북마크]      │
└─────────────────────┘
```

### 핵심 기능

1. **뉴스 피드**
   - 시간순 정렬, 중요도 score 표시
   - breaking 뉴스 상단 고정 (빨간 라벨)
   - 소스별 필터 (OpenAI, Anthropic, Google, Community)
   - 당겨서 새로고침

2. **Push 알림**
   - Phase 2에서 score 8+ 뉴스 감지 시 즉시 발송
   - 알림 탭하면 앱 내 상세 페이지로 이동
   - 알림 설정: 전체 ON/OFF, breaking만, 조용한 시간대

3. **북마크**
   - 로컬 저장 (AsyncStorage)
   - 나중에 읽기 목록

4. **설정**
   - 관심 키워드 (Claude, OpenAI, 오픈소스 등)
   - 알림 시간대 설정
   - 이메일 뉴스레터 구독 연동

### Push 알림 흐름

```
Phase 2 크롤러 (15분마다)
  └─ breaking 뉴스 감지 (score 8+)
  └─ POST /api/push-notification
      └─ Expo Push API 호출
          └─ 등록된 모든 디바이스에 push 발송
          └─ 알림 내용: "🔴 {title} — {source}"

앱 첫 실행 시
  └─ Expo.Notifications.getExpoPushTokenAsync()
  └─ POST /api/register-device {token, platform}
  └─ Upstash Redis: SADD push:tokens {expo_push_token}
```

### 비용 (Phase 3 추가분)

| 항목 | 월 비용 |
|------|--------|
| Expo (무료 티어) | $0 |
| Expo Notifications (무료, 무제한) | $0 |
| EAS Build (30빌드/월 무료) | $0 |
| Apple Developer Account | $99/년 ($8.25/월) |
| Google Play Console | $25 일회성 |
| **합계** | **$8/월** (Apple 연회비 기준) |

---

## 전체 로드맵

### Week 1: Phase 1 (이메일 뉴스레터)

| 일 | 작업 |
|---|------|
| Day 1 | Resend 계정 생성, API 키 발급, 도메인 인증 (jidonglab.com SPF/DKIM) |
| Day 1 | `/api/subscribe`, `/api/unsubscribe` 구현 |
| Day 1 | `NewsletterForm.astro` 컴포넌트 + ai-news 페이지에 삽입 |
| Day 2 | `workers/daily-newsletter.ts` Cloudflare Worker 작성 + cron 설정 |
| Day 2 | 이메일 HTML 템플릿 작성 + 테스트 발송 |
| Day 2 | 배포 + 실제 구독 테스트 |

### Week 2: Phase 2 (실시간 크롤링)

| 일 | 작업 |
|---|------|
| Day 3-4 | RSS 크롤러 Worker 작성 (20개 피드 + HN + Reddit) |
| Day 4 | 중복 제거 로직 + Redis 저장 |
| Day 5 | Claude Haiku 중요도 판정 연동 |
| Day 5 | Breaking 뉴스 감지 → 로그 기록 (push는 Phase 3에서) |
| Day 6 | `/api/news-feed` 엔드포인트 (앱 + 웹 공용) |
| Day 7 | jidonglab.com/ai-news를 크롤러 데이터 소스로 전환 |

### Week 3-4: Phase 3 (모바일 앱)

| 일 | 작업 |
|---|------|
| Day 8-9 | Expo 프로젝트 셋업 + 뉴스 피드 화면 |
| Day 10 | Push notification 등록 + `/api/register-device` |
| Day 11 | Breaking 뉴스 → Expo Push API 연동 |
| Day 12 | 북마크 + 설정 화면 |
| Day 13 | UI 폴리싱 + 다크 모드 |
| Day 14 | EAS Build (iOS + Android) + TestFlight/Internal Testing |

---

## 자동화 수준 목표

| 파이프라인 | 현재 | Phase 1 후 | Phase 2 후 | Phase 3 후 |
|-----------|------|-----------|-----------|-----------|
| 뉴스 수집 | 수동 트리거 가능 | 동일 | **15분 자동** | 동일 |
| 뉴스 작성 | 1일 2회 자동 | 동일 | 동일 | 동일 |
| 사이트 게시 | 자동 (Cloudflare) | 동일 | 동일 | 동일 |
| DEV.to 교차 게시 | 자동 (GitHub Actions) | 동일 | 동일 | 동일 |
| **이메일 발송** | ❌ 없음 | **매일 9AM 자동** | 동일 | 동일 |
| **Breaking 감지** | ❌ 없음 | ❌ | **15분 자동** | 동일 |
| **Push 알림** | ❌ 없음 | ❌ | ❌ | **즉시 자동** |
| 내 개입 | 가끔 확인 | **0** | **0** | **0** |

---

## 리스크 + 대응

| 리스크 | 확률 | 대응 |
|--------|------|------|
| Resend 무료 한도 초과 | 구독자 100명 이상 시 | $20/월 유료 전환 또는 Buttondown으로 마이그레이션 |
| RSS 피드 URL 변경 | 낮음 | 크롤러에 피드 검증 로직 + 실패 시 Slack/email 알림 |
| Claude Haiku API 비용 급증 | 뉴스 폭증 시 | score 판정 전에 키워드 필터로 pre-screening |
| Apple 앱 리뷰 거절 | 중간 | 컨텐츠 앱은 리뷰 가이드라인 통과 쉬움. 최소 기능으로 제출. |
| 크롤러 rate limit | 중간 | 소스별 fetch 간격 조절 + 실패 시 exponential backoff |

---

## 우선순위 정리

**지금 바로 시작할 것: Phase 1 (이메일 뉴스레터)**
- 가장 적은 노력 (1-2일)
- 비용 $0
- 즉시 구독자 확보 시작
- Phase 2, 3의 기반이 됨

**Phase 1이 검증되면: Phase 2 (실시간 크롤링)**
- 이메일 다이제스트의 소스 품질 향상
- Breaking 뉴스 감지 인프라 구축
- 앱 없이도 이메일로 breaking alert 가능

**사용자가 모이면: Phase 3 (모바일 앱)**
- Phase 2의 데이터 + API가 이미 준비된 상태
- push 알림으로 engagement 극대화
