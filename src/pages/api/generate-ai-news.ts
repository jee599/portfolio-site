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

const MODEL_SEARCH_QUERIES: Record<string, string[]> = {
  claude: ['Anthropic Claude AI news', 'Claude model update announcement'],
  gemini: ['Google Gemini AI news', 'Gemini model update announcement'],
  gpt: ['OpenAI GPT news', 'ChatGPT update announcement'],
  etc: ['LLM AI model news', 'open source AI model release'],
};

// ─── Google Custom Search ───
async function searchGoogle(query: string): Promise<NewsItem[]> {
  const apiKey = import.meta.env.SERPAPI_KEY || import.meta.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = import.meta.env.GOOGLE_SEARCH_ENGINE_ID;
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

// ─── Reddit (무료, 키 불필요) ───
async function searchReddit(subreddits: string[], keywords: string[]): Promise<NewsItem[]> {
  try {
    const results: NewsItem[] = [];
    for (const sub of subreddits) {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/new.json?limit=10&t=day`,
        { headers: { 'User-Agent': 'jidonglab-ai-news/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const yesterday = Date.now() / 1000 - 86400;

      for (const post of data.data?.children || []) {
        const d = post.data;
        if (d.created_utc < yesterday) continue;
        const titleLower = d.title.toLowerCase();
        const matches = keywords.some(k => titleLower.includes(k.toLowerCase()));
        if (!matches) continue;
        results.push({
          title: d.title,
          url: `https://reddit.com${d.permalink}`,
          source: `r/${sub}`,
          snippet: `${d.score} upvotes · ${d.num_comments} comments`,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ─── GitHub Trending AI Repos (전날 별 급상승, 무료) ───
async function fetchGitHubTrending(): Promise<TrendingRepo[]> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    // GitHub Search API: AI/LLM 관련 레포 중 전날 생성되거나 업데이트된 인기 레포
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
      const githubToken = import.meta.env.GITHUB_TOKEN;
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
          todayStars: 0, // GitHub API doesn't provide daily stars directly
          language: repo.language || 'Unknown',
        });
      }
    }

    // Deduplicate by full name, sort by stars desc
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

// ─── Markdown Generation ───
function generateMarkdown(
  model: string,
  news: NewsItem[],
  trendingRepos: TrendingRepo[],
  date: string,
): string {
  const modelNames: Record<string, string> = {
    claude: 'Claude (Anthropic)',
    gemini: 'Gemini (Google)',
    gpt: 'GPT (OpenAI)',
    etc: 'AI / LLM',
  };

  const modelName = modelNames[model] || model;
  const title = `${modelName} 소식 - ${date}`;
  const allUrls = [
    ...news.map(n => `"${n.url}"`),
    ...trendingRepos.map(r => `"${r.url}"`),
  ];

  const frontmatter = [
    '---',
    `title: "${title}"`,
    `date: ${date}`,
    `model: ${model}`,
    `tags: [ai-news, ${model}, daily]`,
    `summary: "${date} ${modelName} 관련 주요 소식 및 GitHub 트렌딩 정리"`,
    `sources: [${allUrls.join(', ')}]`,
    `auto_generated: true`,
    '---',
  ].join('\n');

  let body = '';

  // News section
  body += `## ${modelName} 오늘의 소식\n\n`;
  if (news.length === 0) {
    body += `오늘은 ${modelName} 관련 주요 소식이 없었다.\n\n`;
  } else {
    news.forEach((item, i) => {
      body += `### ${i + 1}. ${item.title}\n\n`;
      body += `${item.snippet}\n\n`;
      body += `> 출처: [${item.source}](${item.url})\n\n`;
    });
  }

  // GitHub trending section (only for etc model to avoid duplication)
  if (model === 'etc' && trendingRepos.length > 0) {
    body += `## GitHub 트렌딩 AI 프로젝트\n\n`;
    body += `전날 별(star)을 많이 받은 AI/LLM 관련 프로젝트다.\n\n`;
    trendingRepos.forEach((repo, i) => {
      body += `### ${i + 1}. ${repo.fullName}\n\n`;
      body += `${repo.description}\n\n`;
      body += `- ⭐ **${repo.stars.toLocaleString()}** stars`;
      if (repo.language) body += ` · \`${repo.language}\``;
      body += `\n`;
      body += `- [GitHub](${repo.url})\n\n`;
    });
  }

  body += `---\n\n`;
  body += `*이 포스트는 매일 아침 9시에 자동으로 생성된다.*\n`;
  body += `*소스: Google Search, Hacker News, Reddit, GitHub Trending*\n`;

  return `${frontmatter}\n\n${body}`;
}

// ─── Model-specific keywords for HN/Reddit filtering ───
const MODEL_KEYWORDS: Record<string, string[]> = {
  claude: ['claude', 'anthropic'],
  gemini: ['gemini', 'google ai', 'deepmind'],
  gpt: ['openai', 'gpt', 'chatgpt', 'gpt-4', 'gpt-5'],
  etc: ['llm', 'llama', 'mistral', 'ai model', 'hugging face', 'open source ai', 'transformer'],
};

const REDDIT_SUBREDDITS = ['LocalLLaMA', 'MachineLearning', 'artificial'];

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = import.meta.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const results: Record<string, { news: NewsItem[]; filename: string }> = {};

  try {
    // Fetch GitHub trending AI repos (shared across all models)
    const trendingRepos = await fetchGitHubTrending();

    // Fetch HN and Reddit once, then filter per model
    const allHnNews = await searchHackerNews(['AI', 'LLM', 'Claude', 'GPT', 'Gemini', 'Anthropic', 'OpenAI']);
    const allRedditNews = await searchReddit(
      REDDIT_SUBREDDITS,
      ['claude', 'anthropic', 'gemini', 'gpt', 'openai', 'llm', 'llama', 'mistral', 'ai model'],
    );

    for (const [model, queries] of Object.entries(MODEL_SEARCH_QUERIES)) {
      const allNews: NewsItem[] = [];

      // 1. Google Custom Search
      for (const query of queries) {
        const news = await searchGoogle(query);
        allNews.push(...news);
      }

      // 2. Hacker News (filter by model keywords)
      const keywords = MODEL_KEYWORDS[model] || [];
      const hnFiltered = allHnNews.filter(item =>
        keywords.some(k => item.title.toLowerCase().includes(k))
      );
      allNews.push(...hnFiltered);

      // 3. Reddit (filter by model keywords)
      const redditFiltered = allRedditNews.filter(item =>
        keywords.some(k => item.title.toLowerCase().includes(k))
      );
      allNews.push(...redditFiltered);

      // Deduplicate by URL
      const uniqueNews = allNews.filter(
        (item, index, self) => index === self.findIndex(n => n.url === item.url)
      ).slice(0, 8);

      if (uniqueNews.length > 0 || (model === 'etc' && trendingRepos.length > 0)) {
        const filename = `${dateStr}-${model}`;
        const markdown = generateMarkdown(
          model,
          uniqueNews,
          model === 'etc' ? trendingRepos : [],
          dateStr,
        );

        results[model] = { news: uniqueNews, filename };

        // Commit to GitHub
        const githubToken = import.meta.env.GITHUB_TOKEN;
        const githubRepo = import.meta.env.GITHUB_REPO || 'jee599/portfolio-site';

        if (githubToken) {
          const filePath = `src/content/ai-news/${filename}.md`;
          const content = Buffer.from(markdown).toString('base64');

          // Check if file already exists to get its sha (required for updates)
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
            // File doesn't exist, that's fine
          }

          const res = await fetch(
            `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${githubToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/vnd.github.v3+json',
              },
              body: JSON.stringify({
                message: `feat: auto-generate AI news for ${model} on ${dateStr} [skip-log]`,
                content,
                branch: 'main',
                ...(existingSha ? { sha: existingSha } : {}),
              }),
            }
          );

          if (!res.ok) {
            const error = await res.text();
            console.error(`Failed to create ${filePath}: ${error}`);
          }
        }
      }
    }

    // Trigger rebuild
    const createdModels = Object.keys(results);
    if (createdModels.length > 0) {
      const hookUrl = import.meta.env.VERCEL_DEPLOY_HOOK;
      if (hookUrl) {
        await fetch(hookUrl, { method: 'POST' });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        date: dateStr,
        generated: createdModels,
        trendingRepos: trendingRepos.length,
        counts: Object.fromEntries(
          Object.entries(results).map(([model, data]) => [model, data.news.length])
        ),
      }),
      {
        status: 200,
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

// Also support GET for Vercel Cron (cron jobs use GET)
export const GET: APIRoute = async (context) => {
  return POST(context);
};
