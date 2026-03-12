import type { APIRoute } from 'astro';

export const prerender = false;

interface NewsItem {
  title: string;
  url: string;
  source: string;
  snippet: string;
}

interface TrendingRepo {
  name: string;
  fullName: string;
  url: string;
  description: string;
  stars: number;
  todayStars: number;
  language: string;
}

interface GeneratedPost {
  slug: string;
  title: string;
  tags: string[];
  summary: string;
  sources: string[];
  body: string;
}

interface TopicPost {
  slug: string;
  model: string;
  lang: 'ko' | 'en';
  markdown: string;
}

const MODEL_SEARCH_QUERIES: Record<string, string[]> = {
  claude: ['Anthropic Claude AI news', 'Claude model update announcement'],
  gemini: ['Google Gemini AI news', 'Gemini model update announcement'],
  gpt: ['OpenAI GPT news', 'ChatGPT update announcement'],
  etc: ['LLM AI model news', 'open source AI model release'],
};

// ─── 환경변수 헬퍼: Cloudflare runtime env 우선, import.meta.env 폴백 ───
function getEnv(key: string, runtimeEnv?: Record<string, string>): string | undefined {
  return runtimeEnv?.[key] || (import.meta.env as any)[key] || undefined;
}

// ─── Google Custom Search ───
async function searchGoogle(query: string, runtimeEnv?: Record<string, string>): Promise<NewsItem[]> {
  const apiKey = getEnv('SERPAPI_KEY', runtimeEnv) || getEnv('GOOGLE_SEARCH_API_KEY', runtimeEnv);
  const searchEngineId = getEnv('GOOGLE_SEARCH_ENGINE_ID', runtimeEnv);
  if (!apiKey || !searchEngineId) return [];

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      dateRestrict: 'd1',
      num: '5',
      lr: 'lang_en|lang_ko',
    });
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      source: item.displayLink,
      snippet: item.snippet || '',
    }));
  } catch {
    return [];
  }
}

// ─── Hacker News (무료, 키 불필요) — 병렬 검색 + 포인트 정렬 ───
async function searchHackerNews(keywords: string[]): Promise<NewsItem[]> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const timestamp = Math.floor(yesterday.getTime() / 1000);

    const seen = new Set<string>();

    const allResults = await Promise.all(
      keywords.map(async (keyword) => {
        const params = new URLSearchParams({
          query: keyword,
          tags: 'story',
          numericFilters: `created_at_i>${timestamp},points>10`,
          hitsPerPage: '10',
        });
        const res = await fetch(`https://hn.algolia.com/api/v1/search?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.hits || []).map((hit: any) => ({
          title: hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          source: 'Hacker News',
          snippet: `${hit.points || 0} points · ${hit.num_comments || 0} comments`,
          _points: hit.points || 0,
        }));
      })
    );

    return allResults
      .flat()
      .filter(item => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      })
      .sort((a, b) => b._points - a._points)
      .map(({ _points, ...item }) => item);
  } catch {
    return [];
  }
}

// ─── Reddit (무료, 키 불필요) — hot/top/new 병렬 수집 ───
async function searchReddit(subreddits: string[], keywords: string[]): Promise<NewsItem[]> {
  try {
    const seen = new Set<string>();
    const yesterday = Date.now() / 1000 - 86400;

    const fetches = subreddits.flatMap(sub =>
      (['hot', 'top', 'new'] as const).map(async (sort) => {
        const res = await fetch(
          `https://www.reddit.com/r/${sub}/${sort}.json?limit=20&t=day`,
          { headers: { 'User-Agent': 'jidonglab-ai-news/1.0' } }
        );
        if (!res.ok) return [];
        const data = await res.json();

        return (data.data?.children || [])
          .map((post: any) => post.data)
          .filter((d: any) => d.created_utc >= yesterday)
          .map((d: any) => ({
            title: d.title,
            url: `https://reddit.com${d.permalink}`,
            source: `r/${sub}`,
            snippet: `${d.score} upvotes · ${d.num_comments} comments`,
            _score: d.score || 0,
            _matchesKeyword: keywords.some(k => d.title.toLowerCase().includes(k.toLowerCase())),
          }));
      })
    );

    const allResults = (await Promise.all(fetches)).flat();

    return allResults
      .filter(item => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return item._matchesKeyword || item._score >= 50;
      })
      .sort((a, b) => b._score - a._score)
      .map(({ _score, _matchesKeyword, ...item }) => item);
  } catch {
    return [];
  }
}

// ─── X(Twitter) 인기 포스트 — Google 검색으로 병렬 수집 ───
async function searchXPosts(keywords: string[], runtimeEnv?: Record<string, string>): Promise<NewsItem[]> {
  const apiKey = getEnv('SERPAPI_KEY', runtimeEnv) || getEnv('GOOGLE_SEARCH_API_KEY', runtimeEnv);
  const searchEngineId = getEnv('GOOGLE_SEARCH_ENGINE_ID', runtimeEnv);
  if (!apiKey || !searchEngineId) return [];

  try {
    const seen = new Set<string>();

    const allResults = await Promise.all(
      keywords.map(async (keyword) => {
        const params = new URLSearchParams({
          key: apiKey,
          cx: searchEngineId,
          q: `site:x.com ${keyword}`,
          dateRestrict: 'd1',
          num: '5',
        });
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || [])
          .filter((item: any) => item.link.includes('x.com/') || item.link.includes('twitter.com/'))
          .map((item: any) => ({
            title: item.title,
            url: item.link,
            source: 'X (Twitter)',
            snippet: item.snippet || '',
          }));
      })
    );

    return allResults.flat().filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  } catch {
    return [];
  }
}

// ─── GitHub Trending AI Repos (전날 별 급상승, 무료) — 병렬 검색 ───
async function fetchGitHubTrending(runtimeEnv?: Record<string, string>): Promise<TrendingRepo[]> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const queries = [
      `topic:llm stars:>50 pushed:>${dateStr}`,
      `topic:ai stars:>100 pushed:>${dateStr}`,
      `topic:machine-learning stars:>100 pushed:>${dateStr}`,
      `topic:generative-ai stars:>50 pushed:>${dateStr}`,
      `topic:agent stars:>50 pushed:>${dateStr}`,
    ];

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'jidonglab-ai-news/1.0',
    };
    const githubToken = getEnv('GITHUB_TOKEN', runtimeEnv);
    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    }

    const allResults = await Promise.all(
      queries.map(async (q) => {
        const params = new URLSearchParams({ q, sort: 'stars', order: 'desc', per_page: '10' });
        const res = await fetch(`https://api.github.com/search/repositories?${params}`, { headers });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []).map((repo: any) => ({
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          description: repo.description || '',
          stars: repo.stargazers_count,
          todayStars: 0,
          language: repo.language || 'Unknown',
        }));
      })
    );

    const seen = new Set<string>();
    return allResults
      .flat()
      .filter((r: TrendingRepo) => {
        if (seen.has(r.fullName)) return false;
        seen.add(r.fullName);
        return true;
      })
      .sort((a: TrendingRepo, b: TrendingRepo) => b.stars - a.stars)
      .slice(0, 15);
  } catch {
    return [];
  }
}

// ─── Model-specific keywords for HN/Reddit filtering ───
const MODEL_KEYWORDS: Record<string, string[]> = {
  claude: ['claude', 'anthropic'],
  gemini: ['gemini', 'google ai', 'deepmind'],
  gpt: ['openai', 'gpt', 'chatgpt', 'gpt-4', 'gpt-5'],
  etc: ['llm', 'llama', 'mistral', 'ai model', 'hugging face', 'open source ai', 'transformer'],
};

const REDDIT_SUBREDDITS = ['LocalLLaMA', 'MachineLearning', 'artificial', 'singularity', 'ChatGPT', 'ClaudeAI'];

const X_SEARCH_KEYWORDS = ['Anthropic Claude AI', 'OpenAI GPT', 'Google Gemini AI', 'LLM AI news'];

// ─── YAML 안전 문자열 처리 ───
function yamlSafe(s: string): string {
  return s.replace(/\n/g, ' ').replace(/"/g, '\\"').trim();
}

// ─── 마크다운 frontmatter 생성 ───
function buildMarkdown(
  post: GeneratedPost,
  model: string,
  date: string,
  lang: 'ko' | 'en',
): string {
  const frontmatter = [
    '---',
    `title: "${yamlSafe(post.title)}"`,
    `date: ${date}`,
    `model: ${model}`,
    `tags: [${post.tags.map(t => `"${t}"`).join(', ')}]`,
    `summary: "${yamlSafe(post.summary)}"`,
    `sources: [${post.sources.map(s => `"${s}"`).join(', ')}]`,
    `auto_generated: true`,
    `lang: ${lang}`,
    '---',
  ].join('\n');

  return `${frontmatter}\n\n${post.body}`;
}

// ─── Claude API로 한국어 포스트 생성 ───
async function generateKoreanPosts(
  model: string,
  news: NewsItem[],
  trendingRepos: TrendingRepo[],
  date: string,
  anthropicApiKey: string,
): Promise<GeneratedPost[]> {
  if (news.length === 0 && trendingRepos.length === 0) return [];

  const modelNames: Record<string, string> = {
    claude: 'Claude (Anthropic)',
    gemini: 'Gemini (Google)',
    gpt: 'GPT (OpenAI)',
    etc: 'AI / LLM (오픈소스 및 기타)',
  };
  const modelName = modelNames[model] || model;

  const newsData = news.map(n => ({
    title: n.title,
    url: n.url,
    source: n.source,
    snippet: n.snippet,
  }));

  const trendingData = trendingRepos.map(r => ({
    name: r.fullName,
    url: r.url,
    description: r.description,
    stars: r.stars,
    language: r.language,
  }));

  const prompt = `당신은 AI 기술 전문 블로거입니다. 아래 뉴스 데이터를 분석해서 **주제별로 개별 블로그 포스트**를 작성해 주세요.

## 핵심 규칙

1. **주제별 분리**: 관련된 뉴스끼리 묶어서 하나의 주제로 만드세요. 서로 다른 주제는 별도 포스트로 나눕니다.
2. **제목**: 구체적이고 명확하게. "~소식" 같은 일반적 제목 금지. 예: "미 국방부, Anthropic을 'Supply Chain Risk'로 공식 지정 — AI 안전과 국가 안보의 첫 정면충돌"
3. **존댓말**: 본문은 존댓말(~합니다, ~입니다)로 작성합니다.
4. **최소 5,000자**: 각 포스트는 반드시 5,000자(공백 포함) 이상이어야 합니다. 이 기준을 절대로 어기지 마세요.

## 필수 섹션 구조 (4개 모두 반드시 포함)

### \`## 무슨 일이 있었나\`
- 핵심 사건을 상세하게 설명합니다
- 누가, 언제, 무엇을, 왜 했는지 구체적으로 서술합니다
- 관련 인용문이나 수치가 있다면 포함합니다
- 사건의 배경과 맥락을 충분히 제공합니다

### \`## 관련 소식\`
- 이 주제와 연관된 다른 뉴스, 업계 동향, 경쟁사 움직임을 **최소 3가지** 이상 다룹니다
- 단순 나열이 아니라 각 소식이 메인 주제와 어떻게 연결되는지 분석합니다
- 시간순 맥락(이전에 어떤 일이 있었고, 이번에 어떻게 발전했는지)을 제공합니다
- 다른 기업이나 프로젝트의 유사한 사례를 비교합니다

### \`## 개념 정리\` 또는 \`## 수치로 보기\`
- 기술 개념을 비전문가도 이해할 수 있게 설명합니다
- 비유나 예시를 활용해 이해를 돕습니다
- 또는 핵심 수치/통계를 마크다운 테이블로 정리합니다
- 해당 기술이 왜 중요한지, 어떤 문제를 해결하는지 설명합니다

### \`## 정리\`
- 단순 요약이 아닌 **분석적 코멘트**를 제시합니다
- 이 사건이 업계에 미칠 영향, 향후 전망을 구체적으로 논합니다
- "왜 중요한가", "앞으로 어떻게 될 것인가"에 대한 답을 제시합니다

## 소스 링크
- 각 섹션에서 관련 출처를 \`<small>[출처명](URL)</small>\` 형태로 자연스럽게 포함하세요
- 실제 뉴스 데이터에 있는 URL을 사용하세요

## 태그 규칙
- 첫 번째 태그: "ai-news"
- 두 번째 태그: "${model}" (모델 카테고리)
- 나머지: 영문 소문자, 하이픈 허용 (예: code-review, supply-chain)

## slug 규칙
- 영문 kebab-case (예: pentagon-anthropic, gpt-5-release)
- 짧고 명확하게

## 뉴스 데이터

**카테고리**: ${modelName}
**날짜**: ${date}

**뉴스 항목**:
${JSON.stringify(newsData, null, 2)}

${trendingData.length > 0 ? `**GitHub 트렌딩 AI 프로젝트**:\n${JSON.stringify(trendingData, null, 2)}` : ''}

## 출력 형식

반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 다른 텍스트는 절대 포함하지 마세요.

\`\`\`json
[
  {
    "slug": "topic-slug-here",
    "title": "구체적이고 명확한 제목",
    "tags": ["ai-news", "${model}", "추가태그"],
    "summary": "2~3문장 요약 (존댓말)",
    "sources": ["url1", "url2"],
    "body": "마크다운 본문 (## 섹션 4개 모두 포함, 5000자 이상, 존댓말)"
  }
]
\`\`\`

뉴스가 1~2개뿐이면 하나의 포스트로 통합해도 됩니다. 하지만 서로 무관한 뉴스 3개 이상이면 반드시 주제별로 분리하세요.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error (Korean): ${response.status} ${error}`);
  }

  const data = await response.json();
  const textContent = data.content?.find((c: any) => c.type === 'text');
  if (!textContent) return [];

  return parseGeneratedPosts(textContent.text);
}

// ─── Claude API로 영어 번역 ───
async function translateToEnglish(
  koreanPosts: GeneratedPost[],
  anthropicApiKey: string,
): Promise<GeneratedPost[]> {
  if (koreanPosts.length === 0) return [];

  const postsData = koreanPosts.map(p => ({
    slug: p.slug,
    title: p.title,
    tags: p.tags,
    summary: p.summary,
    sources: p.sources,
    body: p.body,
  }));

  const prompt = `Translate the following Korean AI news blog posts to English.

## Rules
- Produce natural, engaging English tech blog content — NOT a literal translation
- Keep all markdown formatting, section headers, and links intact
- Translate section headers:
  - "## 무슨 일이 있었나" → "## What Happened"
  - "## 관련 소식" → "## Related News"
  - "## 개념 정리" → "## Key Concepts"
  - "## 수치로 보기" → "## By the Numbers"
  - "## 정리" → "## Takeaway"
- Keep all source links (<small>[...](URL)</small>) as-is
- Each post should be at least 3,000 characters
- Title should be clear and engaging in English
- Keep the same slug (do not change it)
- Keep the same tags array (do not change it)

## Korean Posts
${JSON.stringify(postsData, null, 2)}

## Output Format
Respond with ONLY a JSON array. No other text.

\`\`\`json
[
  {
    "slug": "same-slug",
    "title": "English Title",
    "tags": ["same", "tags"],
    "summary": "English summary in 2-3 sentences",
    "sources": ["same-urls"],
    "body": "English markdown body with translated sections"
  }
]
\`\`\``;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error (English): ${response.status} ${error}`);
  }

  const data = await response.json();
  const textContent = data.content?.find((c: any) => c.type === 'text');
  if (!textContent) return [];

  return parseGeneratedPosts(textContent.text);
}

// ─── Claude 응답에서 JSON 파싱 ───
function parseGeneratedPosts(text: string): GeneratedPost[] {
  let jsonStr = text;

  // ```json ... ``` 블록 추출
  const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  } else {
    // JSON 배열만 있는 경우
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }
  }

  const posts: GeneratedPost[] = JSON.parse(jsonStr);
  return posts;
}

// ─── GitHub에 파일 커밋 ───
async function commitToGitHub(
  filePath: string,
  content: string,
  commitMessage: string,
  githubToken: string,
  githubRepo: string,
): Promise<{ ok: boolean; error?: string }> {
  const base64Content = Buffer.from(content).toString('base64');

  // 기존 파일 sha 확인
  let existingSha: string | undefined;
  try {
    const existing = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${filePath}?ref=main`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    if (existing.ok) {
      const data = await existing.json();
      existingSha = data.sha;
    }
  } catch {
    // 파일이 없으면 새로 생성
  }

  const commitRes = await fetch(
    `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch: 'main',
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    }
  );

  if (!commitRes.ok) {
    const error = await commitRes.text();
    return { ok: false, error };
  }
  return { ok: true };
}

export const POST: APIRoute = async ({ request, locals }) => {
  const runtimeEnv = (locals as any).runtime?.env as Record<string, string> | undefined;

  const authHeader = request.headers.get('authorization');
  const cronSecret = getEnv('CRON_SECRET', runtimeEnv);

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const anthropicApiKey = getEnv('ANTHROPIC_API_KEY', runtimeEnv);
  if (!anthropicApiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const allPosts: TopicPost[] = [];
  const errors: string[] = [];
  const logs: string[] = [];

  // X-Sync 헤더: GitHub Actions에서 호출 시 동기 실행 강제
  const forceSync = request.headers.get('x-sync') === 'true';

  const doWork = async () => {
    logs.push('Starting news collection...');

    // 1) 모든 뉴스 소스 + Google 검색을 병렬로 수집
    const allGoogleSearches = Object.entries(MODEL_SEARCH_QUERIES).flatMap(
      ([model, queries]) => queries.map(q => searchGoogle(q, runtimeEnv).then(news => ({ model, news })))
    );

    const [trendingRepos, allHnNews, allRedditNews, allXNews, ...googleResults] = await Promise.all([
      fetchGitHubTrending(runtimeEnv),
      searchHackerNews(['AI', 'LLM', 'Claude', 'GPT', 'Gemini', 'Anthropic', 'OpenAI']),
      searchReddit(
        REDDIT_SUBREDDITS,
        ['claude', 'anthropic', 'gemini', 'gpt', 'openai', 'llm', 'llama', 'mistral', 'ai model'],
      ),
      searchXPosts(X_SEARCH_KEYWORDS, runtimeEnv),
      ...allGoogleSearches,
    ]);

    logs.push(`Collected: Google=${googleResults.length} batches, HN=${allHnNews.length}, Reddit=${allRedditNews.length}, X=${allXNews.length}, GitHub=${trendingRepos.length}`);

    // 모델별 Google 검색 결과 그룹핑
    const googleByModel: Record<string, NewsItem[]> = {};
    for (const { model, news } of googleResults) {
      if (!googleByModel[model]) googleByModel[model] = [];
      googleByModel[model].push(...news);
    }

    // 2) 모델별 뉴스 취합 + 한국어 포스트 생성 (병렬)
    const modelEntries = Object.keys(MODEL_SEARCH_QUERIES);
    const koreanPostsByModel: Record<string, GeneratedPost[]> = {};

    const generatePromises = modelEntries.map(async (model) => {
      const allNews: NewsItem[] = [...(googleByModel[model] || [])];

      const keywords = MODEL_KEYWORDS[model] || [];
      allNews.push(
        ...allHnNews.filter(item => keywords.some(k => item.title.toLowerCase().includes(k))),
        ...allRedditNews.filter(item => keywords.some(k => item.title.toLowerCase().includes(k))),
        ...allXNews.filter(item =>
          keywords.some(k => item.title.toLowerCase().includes(k) || item.snippet.toLowerCase().includes(k))
        ),
      );

      // URL 기준 중복 제거
      const uniqueNews = allNews
        .filter((item, index, self) => index === self.findIndex(n => n.url === item.url))
        .slice(0, 10);

      if (uniqueNews.length === 0 && !(model === 'etc' && trendingRepos.length > 0)) {
        logs.push(`[${model}] No news found, skipping`);
        return { model, posts: [] as GeneratedPost[], error: undefined };
      }

      logs.push(`[${model}] Found ${uniqueNews.length} unique news items`);

      try {
        const posts = await generateKoreanPosts(
          model,
          uniqueNews,
          model === 'etc' ? trendingRepos : [],
          dateStr,
          anthropicApiKey!,
        );
        logs.push(`[${model}] Generated ${posts.length} Korean posts`);
        return { model, posts, error: undefined };
      } catch (err) {
        const errMsg = `[${model}] Korean generation failed: ${String(err)}`;
        console.error(errMsg);
        return { model, posts: [] as GeneratedPost[], error: errMsg };
      }
    });

    const koreanResults = await Promise.all(generatePromises);

    for (const r of koreanResults) {
      koreanPostsByModel[r.model] = r.posts;
      if (r.error) errors.push(r.error);
    }

    // 모든 한국어 포스트 취합
    const allKoreanPosts: { model: string; post: GeneratedPost }[] = [];
    for (const [model, posts] of Object.entries(koreanPostsByModel)) {
      for (const post of posts) {
        allKoreanPosts.push({ model, post });
      }
    }

    logs.push(`Total Korean posts: ${allKoreanPosts.length}`);

    if (allKoreanPosts.length === 0) {
      logs.push('No posts generated, stopping');
      return;
    }

    // 3) 한국어 → 영어 번역 (모델별 병렬)
    const translationPromises = modelEntries
      .filter(model => (koreanPostsByModel[model] || []).length > 0)
      .map(async (model) => {
        try {
          const englishPosts = await translateToEnglish(
            koreanPostsByModel[model],
            anthropicApiKey!,
          );
          logs.push(`[${model}] Translated ${englishPosts.length} posts to English`);
          return { model, posts: englishPosts, error: undefined };
        } catch (err) {
          const errMsg = `[${model}] English translation failed: ${String(err)}`;
          console.error(errMsg);
          return { model, posts: [] as GeneratedPost[], error: errMsg };
        }
      });

    const englishResults = await Promise.all(translationPromises);

    const allEnglishPosts: { model: string; post: GeneratedPost }[] = [];
    for (const r of englishResults) {
      for (const post of r.posts) {
        allEnglishPosts.push({ model: r.model, post });
      }
      if (r.error) errors.push(r.error);
    }

    logs.push(`Total English posts: ${allEnglishPosts.length}`);

    // 4) TopicPost 생성 (한국어 + 영어)
    for (const { model, post } of allKoreanPosts) {
      allPosts.push({
        slug: post.slug,
        model,
        lang: 'ko',
        markdown: buildMarkdown(post, model, dateStr, 'ko'),
      });
    }

    for (const { model, post } of allEnglishPosts) {
      allPosts.push({
        slug: post.slug,
        model,
        lang: 'en',
        markdown: buildMarkdown(post, model, dateStr, 'en'),
      });
    }

    // 5) GitHub 커밋 (병렬)
    const githubToken = getEnv('GITHUB_TOKEN', runtimeEnv);
    const githubRepo = getEnv('GITHUB_REPO', runtimeEnv) || 'jee599/portfolio-site';

    if (!githubToken) {
      errors.push('GITHUB_TOKEN not set');
      return;
    }

    const commitResults = await Promise.all(
      allPosts.map(async (post) => {
        // 영어 포스트는 slug 뒤에 -en 붙임
        const fileName = post.lang === 'en'
          ? `${dateStr}-${post.slug}-en`
          : `${dateStr}-${post.slug}`;
        const filePath = `src/content/ai-news/${fileName}.md`;

        const result = await commitToGitHub(
          filePath,
          post.markdown,
          `feat: auto-generate AI news — ${post.slug} (${dateStr}, ${post.lang}) [skip-log]`,
          githubToken,
          githubRepo,
        );
        return { filePath, lang: post.lang, ...result };
      })
    );

    const committed = commitResults.filter(r => r.ok);
    const failed = commitResults.filter(r => !r.ok);

    for (const r of failed) {
      errors.push(`GitHub commit failed: ${r.filePath} — ${r.error}`);
    }

    logs.push(`Committed: ${committed.length} files (${committed.filter(r => r.lang === 'ko').length} ko, ${committed.filter(r => r.lang === 'en').length} en)`);

    if (failed.length > 0) {
      logs.push(`Failed: ${failed.length} files`);
    }

    // 6) Cloudflare Pages 리빌드 트리거
    if (committed.length > 0) {
      const hookUrl = getEnv('CF_DEPLOY_HOOK', runtimeEnv);
      if (hookUrl) {
        try {
          const hookRes = await fetch(hookUrl, { method: 'POST' });
          logs.push(`Deploy hook: ${hookRes.ok ? 'triggered' : `failed (${hookRes.status})`}`);
        } catch (err) {
          logs.push(`Deploy hook error: ${String(err)}`);
        }
      } else {
        logs.push('CF_DEPLOY_HOOK not set, skipping deploy trigger');
      }
    }

    logs.push(`Done: ${committed.length} committed, ${errors.length} errors`);
  };

  const runtime = (locals as any).runtime;
  const ctx = runtime?.ctx;

  // forceSync 또는 waitUntil 없는 환경 → 동기 실행
  if (forceSync || !ctx?.waitUntil) {
    try {
      await doWork();
      const hasErrors = errors.length > 0;
      return new Response(
        JSON.stringify({
          ok: !hasErrors || allPosts.length > 0,
          date: dateStr,
          totalPosts: allPosts.length,
          koreanPosts: allPosts.filter(p => p.lang === 'ko').length,
          englishPosts: allPosts.filter(p => p.lang === 'en').length,
          logs,
          ...(hasErrors ? { errors } : {}),
        }),
        {
          status: hasErrors && allPosts.length === 0 ? 500 : 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to generate AI news',
          details: String(error),
          logs,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // waitUntil 백그라운드 실행 (Cloudflare, 비-Actions 호출)
  ctx.waitUntil(doWork());
  return new Response(
    JSON.stringify({ ok: true, message: 'AI news generation started in background', date: dateStr }),
    { status: 202, headers: { 'Content-Type': 'application/json' } }
  );
};

export const GET: APIRoute = async (context) => {
  return POST(context);
};
