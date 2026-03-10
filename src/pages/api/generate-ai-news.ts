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

interface TopicPost {
  slug: string;
  model: string;
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

// ─── Hacker News (무료, 키 불필요) ───
async function searchHackerNews(keywords: string[]): Promise<NewsItem[]> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const timestamp = Math.floor(yesterday.getTime() / 1000);

    const results: NewsItem[] = [];
    for (const keyword of keywords) {
      const params = new URLSearchParams({
        query: keyword,
        tags: 'story',
        numericFilters: `created_at_i>${timestamp}`,
        hitsPerPage: '5',
      });
      const res = await fetch(`https://hn.algolia.com/api/v1/search?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const hit of data.hits || []) {
        results.push({
          title: hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          source: 'Hacker News',
          snippet: `${hit.points || 0} points · ${hit.num_comments || 0} comments`,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ─── Reddit (무료, 키 불필요) — hot + new 모두 수집 ───
async function searchReddit(subreddits: string[], keywords: string[]): Promise<NewsItem[]> {
  try {
    const results: NewsItem[] = [];
    const seen = new Set<string>();
    const yesterday = Date.now() / 1000 - 86400;

    for (const sub of subreddits) {
      // hot (인기글) + new (최신글) 모두 수집
      for (const sort of ['hot', 'new']) {
        const res = await fetch(
          `https://www.reddit.com/r/${sub}/${sort}.json?limit=15&t=day`,
          { headers: { 'User-Agent': 'jidonglab-ai-news/1.0' } }
        );
        if (!res.ok) continue;
        const data = await res.json();

        for (const post of data.data?.children || []) {
          const d = post.data;
          if (d.created_utc < yesterday) continue;
          if (seen.has(d.permalink)) continue;

          const titleLower = d.title.toLowerCase();
          const matches = keywords.some(k => titleLower.includes(k.toLowerCase()));
          if (!matches) continue;

          seen.add(d.permalink);
          results.push({
            title: d.title,
            url: `https://reddit.com${d.permalink}`,
            source: `r/${sub} (${sort})`,
            snippet: `${d.score} upvotes · ${d.num_comments} comments`,
          });
        }
      }
    }

    // upvote 순으로 정렬 — 인기글 우선
    return results.sort((a, b) => {
      const scoreA = parseInt(a.snippet) || 0;
      const scoreB = parseInt(b.snippet) || 0;
      return scoreB - scoreA;
    });
  } catch {
    return [];
  }
}

// ─── X(Twitter) 인기 포스트 — Google 검색으로 수집 ───
async function searchXPosts(keywords: string[], runtimeEnv?: Record<string, string>): Promise<NewsItem[]> {
  const apiKey = getEnv('SERPAPI_KEY', runtimeEnv) || getEnv('GOOGLE_SEARCH_API_KEY', runtimeEnv);
  const searchEngineId = getEnv('GOOGLE_SEARCH_ENGINE_ID', runtimeEnv);
  if (!apiKey || !searchEngineId) return [];

  try {
    const results: NewsItem[] = [];
    const seen = new Set<string>();

    for (const keyword of keywords) {
      const params = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: `site:x.com ${keyword}`,
        dateRestrict: 'd1',
        num: '5',
      });
      const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
      if (!res.ok) continue;
      const data = await res.json();

      for (const item of data.items || []) {
        const url = item.link;
        if (seen.has(url)) continue;
        // x.com 또는 twitter.com 게시물만
        if (!url.includes('x.com/') && !url.includes('twitter.com/')) continue;
        seen.add(url);
        results.push({
          title: item.title,
          url,
          source: 'X (Twitter)',
          snippet: item.snippet || '',
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

// ─── GitHub Trending AI Repos (전날 별 급상승, 무료) ───
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
    ];

    const allRepos: TrendingRepo[] = [];

    for (const q of queries) {
      const params = new URLSearchParams({
        q,
        sort: 'stars',
        order: 'desc',
        per_page: '10',
      });

      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'jidonglab-ai-news/1.0',
      };
      const githubToken = getEnv('GITHUB_TOKEN', runtimeEnv);
      if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`;
      }

      const res = await fetch(`https://api.github.com/search/repositories?${params}`, { headers });
      if (!res.ok) continue;
      const data = await res.json();

      for (const repo of data.items || []) {
        allRepos.push({
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          description: repo.description || '',
          stars: repo.stargazers_count,
          todayStars: 0,
          language: repo.language || 'Unknown',
        });
      }
    }

    const seen = new Set<string>();
    return allRepos
      .filter(r => {
        if (seen.has(r.fullName)) return false;
        seen.add(r.fullName);
        return true;
      })
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 10);
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

// ─── Claude API로 주제별 풍부한 포스트 생성 ───
async function generateTopicPosts(
  model: string,
  news: NewsItem[],
  trendingRepos: TrendingRepo[],
  date: string,
  anthropicApiKey: string,
): Promise<TopicPost[]> {
  if (news.length === 0 && trendingRepos.length === 0) return [];

  const modelNames: Record<string, string> = {
    claude: 'Claude (Anthropic)',
    gemini: 'Gemini (Google)',
    gpt: 'GPT (OpenAI)',
    etc: 'AI / LLM (오픈소스 및 기타)',
  };
  const modelName = modelNames[model] || model;

  // 뉴스 원본 데이터를 JSON으로 전달
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

## 규칙

1. **주제별 분리**: 관련된 뉴스끼리 묶어서 하나의 주제로 만드세요. 서로 다른 주제는 별도 포스트로 나눕니다.
2. **제목**: 구체적이고 명확하게. "~소식" 같은 일반적 제목 금지. 예: "미 국방부, Anthropic을 'Supply Chain Risk'로 공식 지정 — AI 안전과 국가 안보의 첫 정면충돌"
3. **존댓말**: 본문은 존댓말(~합니다, ~입니다)로 작성합니다.
4. **5,000자 이상**: 각 포스트는 최소 5,000자(공백 포함) 이상이어야 합니다.
5. **구조**: 각 포스트에 반드시 아래 섹션을 포함하세요:
   - \`## 무슨 일이 있었나\` — 핵심 사건 설명
   - \`## 관련 소식\` — 관련 뉴스, 배경 정보, 다른 기업/기술 동향
   - \`## 개념 정리\` 또는 \`## 수치로 보기\` — 기술 개념 설명 또는 핵심 수치 테이블
   - \`## 정리\` — 분석적 코멘트, 시사점, 전망
6. **소스 링크**: 각 섹션에서 관련 출처를 \`<small>[출처명](URL)</small>\` 형태로 포함하세요.
7. **slug**: 각 포스트의 slug를 영문 kebab-case로 제안하세요 (예: pentagon-anthropic, gpt-5-4-release)

## 뉴스 데이터

**카테고리**: ${modelName}
**날짜**: ${date}

**뉴스 항목**:
${JSON.stringify(newsData, null, 2)}

${trendingData.length > 0 ? `**GitHub 트렌딩 AI 프로젝트**:\n${JSON.stringify(trendingData, null, 2)}` : ''}

## 출력 형식

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

\`\`\`json
[
  {
    "slug": "topic-slug-here",
    "title": "구체적이고 명확한 제목",
    "tags": ["ai-news", "${model}", "추가태그1", "추가태그2"],
    "summary": "2~3문장 요약 (존댓말)",
    "sources": ["url1", "url2"],
    "body": "마크다운 본문 (## 섹션 포함, 5000자 이상, 존댓말)"
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
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const textContent = data.content?.find((c: any) => c.type === 'text');
  if (!textContent) return [];

  let jsonStr = textContent.text;
  // JSON 블록 추출
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

  const posts: Array<{
    slug: string;
    title: string;
    tags: string[];
    summary: string;
    sources: string[];
    body: string;
  }> = JSON.parse(jsonStr);

  return posts.map(post => {
    const frontmatter = [
      '---',
      `title: "${post.title.replace(/"/g, '\\"')}"`,
      `date: ${date}`,
      `model: ${model}`,
      `tags: [${post.tags.join(', ')}]`,
      `summary: "${post.summary.replace(/"/g, '\\"')}"`,
      `sources: [${post.sources.map(s => `"${s}"`).join(', ')}]`,
      `auto_generated: true`,
      '---',
    ].join('\n');

    return {
      slug: post.slug,
      model,
      markdown: `${frontmatter}\n\n${post.body}`,
    };
  });
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

  try {
    // 전체 뉴스 소스에서 수집 (Google, HN, Reddit, X 병렬)
    const [trendingRepos, allHnNews, allRedditNews, allXNews] = await Promise.all([
      fetchGitHubTrending(runtimeEnv),
      searchHackerNews(['AI', 'LLM', 'Claude', 'GPT', 'Gemini', 'Anthropic', 'OpenAI']),
      searchReddit(
        REDDIT_SUBREDDITS,
        ['claude', 'anthropic', 'gemini', 'gpt', 'openai', 'llm', 'llama', 'mistral', 'ai model'],
      ),
      searchXPosts(X_SEARCH_KEYWORDS, runtimeEnv),
    ]);

    // 모델별 뉴스 수집 후 Claude API로 주제별 포스트 생성
    for (const [model, queries] of Object.entries(MODEL_SEARCH_QUERIES)) {
      const allNews: NewsItem[] = [];

      // Google Custom Search
      for (const query of queries) {
        const news = await searchGoogle(query, runtimeEnv);
        allNews.push(...news);
      }

      // Hacker News (모델별 필터링)
      const keywords = MODEL_KEYWORDS[model] || [];
      const hnFiltered = allHnNews.filter(item =>
        keywords.some(k => item.title.toLowerCase().includes(k))
      );
      allNews.push(...hnFiltered);

      // Reddit (모델별 필터링)
      const redditFiltered = allRedditNews.filter(item =>
        keywords.some(k => item.title.toLowerCase().includes(k))
      );
      allNews.push(...redditFiltered);

      // X/Twitter (모델별 필터링)
      const xFiltered = allXNews.filter(item =>
        keywords.some(k => item.title.toLowerCase().includes(k) || item.snippet.toLowerCase().includes(k))
      );
      allNews.push(...xFiltered);

      // URL 기준 중복 제거
      const uniqueNews = allNews.filter(
        (item, index, self) => index === self.findIndex(n => n.url === item.url)
      ).slice(0, 10);

      // 뉴스가 없으면 건너뛰기
      if (uniqueNews.length === 0 && !(model === 'etc' && trendingRepos.length > 0)) {
        console.log(`[${model}] No news found, skipping`);
        continue;
      }

      try {
        const posts = await generateTopicPosts(
          model,
          uniqueNews,
          model === 'etc' ? trendingRepos : [],
          dateStr,
          anthropicApiKey,
        );
        allPosts.push(...posts);
      } catch (err) {
        errors.push(`[${model}] Claude API error: ${String(err)}`);
        console.error(`[${model}] Failed to generate posts:`, err);
      }
    }

    // GitHub에 커밋
    const githubToken = getEnv('GITHUB_TOKEN', runtimeEnv);
    const githubRepo = getEnv('GITHUB_REPO', runtimeEnv) || 'jee599/portfolio-site';

    if (!githubToken) {
      return new Response(JSON.stringify({
        error: 'GITHUB_TOKEN not set',
        generated: allPosts.length,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const committed: string[] = [];
    for (const post of allPosts) {
      const filePath = `src/content/ai-news/${dateStr}-${post.slug}.md`;
      const result = await commitToGitHub(
        filePath,
        post.markdown,
        `feat: auto-generate AI news — ${post.slug} (${dateStr}) [skip-log]`,
        githubToken,
        githubRepo,
      );

      if (result.ok) {
        committed.push(filePath);
      } else {
        errors.push(`[${post.slug}] GitHub commit failed: ${result.error}`);
      }
    }

    // Cloudflare Pages 리빌드 트리거
    if (committed.length > 0) {
      const hookUrl = getEnv('CF_DEPLOY_HOOK', runtimeEnv);
      if (hookUrl) {
        await fetch(hookUrl, { method: 'POST' });
      }
    }

    const hasErrors = errors.length > 0;
    return new Response(
      JSON.stringify({
        ok: !hasErrors || committed.length > 0,
        date: dateStr,
        totalPosts: allPosts.length,
        committed: committed.length,
        files: committed,
        trendingRepos: trendingRepos.length,
        ...(hasErrors ? { errors } : {}),
      }),
      {
        status: hasErrors && committed.length === 0 ? 500 : 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate AI news', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const GET: APIRoute = async (context) => {
  return POST(context);
};
