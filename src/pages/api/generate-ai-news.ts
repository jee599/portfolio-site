import type { APIRoute } from 'astro';

export const prerender = false;

interface NewsItem {
  title: string;
  url: string;
  source: string;
  snippet: string;
}

const MODEL_SEARCH_QUERIES: Record<string, string[]> = {
  claude: ['Anthropic Claude AI news', 'Claude model update announcement'],
  gemini: ['Google Gemini AI news', 'Gemini model update announcement'],
  gpt: ['OpenAI GPT news', 'ChatGPT update announcement'],
  etc: ['LLM AI model news', 'open source AI model release'],
};

async function searchNews(query: string): Promise<NewsItem[]> {
  const apiKey = import.meta.env.SERPAPI_KEY || import.meta.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = import.meta.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey) {
    return [];
  }

  try {
    // Use Google Custom Search API
    if (searchEngineId) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const params = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: query,
        dateRestrict: 'd1', // last 1 day
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
    }

    return [];
  } catch {
    return [];
  }
}

function generateMarkdown(model: string, news: NewsItem[], date: string): string {
  const modelNames: Record<string, string> = {
    claude: 'Claude (Anthropic)',
    gemini: 'Gemini (Google)',
    gpt: 'GPT (OpenAI)',
    etc: 'AI / LLM',
  };

  const modelName = modelNames[model] || model;
  const title = `${modelName} 소식 - ${date}`;

  const frontmatter = [
    '---',
    `title: "${title}"`,
    `date: ${date}`,
    `model: ${model}`,
    `tags: [ai-news, ${model}, daily]`,
    `summary: "${date} ${modelName} 관련 주요 소식 정리"`,
    `sources: [${news.map(n => `"${n.url}"`).join(', ')}]`,
    `auto_generated: true`,
    '---',
  ].join('\n');

  let body = `## ${modelName} 오늘의 소식\n\n`;

  if (news.length === 0) {
    body += `오늘은 ${modelName} 관련 주요 소식이 없었습니다.\n`;
  } else {
    news.forEach((item, i) => {
      body += `### ${i + 1}. ${item.title}\n\n`;
      body += `${item.snippet}\n\n`;
      body += `> 출처: [${item.source}](${item.url})\n\n`;
    });

    body += `---\n\n`;
    body += `*이 포스트는 매일 아침 9시에 자동으로 생성됩니다.*\n`;
  }

  return `${frontmatter}\n\n${body}`;
}

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
    // Search news for each model
    for (const [model, queries] of Object.entries(MODEL_SEARCH_QUERIES)) {
      const allNews: NewsItem[] = [];
      for (const query of queries) {
        const news = await searchNews(query);
        allNews.push(...news);
      }

      // Deduplicate by URL
      const uniqueNews = allNews.filter(
        (item, index, self) => index === self.findIndex(n => n.url === item.url)
      ).slice(0, 5);

      if (uniqueNews.length > 0) {
        const filename = `${dateStr}-${model}`;
        const markdown = generateMarkdown(model, uniqueNews, dateStr);

        results[model] = { news: uniqueNews, filename };

        // Note: In production, this would write to the content directory
        // or use a CMS API / GitHub API to commit the file.
        // For Vercel serverless, we use GitHub API to create the file.
        const githubToken = import.meta.env.GITHUB_TOKEN;
        const githubRepo = import.meta.env.GITHUB_REPO || 'jee599/portfolio-site';

        if (githubToken) {
          const filePath = `src/content/ai-news/${filename}.md`;
          const content = Buffer.from(markdown).toString('base64');

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
                message: `feat: auto-generate AI news for ${model} on ${dateStr}`,
                content,
                branch: 'main',
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

    // Trigger rebuild if we created any content
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
