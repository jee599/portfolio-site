import type { APIRoute } from 'astro';

export const prerender = false;

const DEV_API = 'https://dev.to/api';

interface DevToArticle {
  id: number;
  title: string;
  description: string;
  slug: string;
  url: string;
  published_at: string;
  tag_list: string[];
  body_markdown: string;
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

  const username = import.meta.env.DEVTO_USERNAME || 'ji_ai';
  const githubToken = import.meta.env.GITHUB_TOKEN;
  const githubRepo = import.meta.env.GITHUB_REPO || 'jee599/portfolio-site';

  if (!githubToken) {
    return new Response(
      JSON.stringify({ error: 'GITHUB_TOKEN is required for sync' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Fetch articles from Dev.to
    const res = await fetch(`${DEV_API}/articles?username=${username}&per_page=30`);
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Dev.to API failed: ${res.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const articles: DevToArticle[] = await res.json();
    if (articles.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, synced: 0, message: 'No articles found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let synced = 0;
    let skipped = 0;

    for (const article of articles) {
      // Fetch full article with body_markdown
      const fullRes = await fetch(`${DEV_API}/articles/${article.id}`);
      if (!fullRes.ok) continue;
      const full: DevToArticle = await fullRes.json();

      const dateStr = full.published_at.split('T')[0];
      const filePath = `src/content/blog/${dateStr}-${full.slug}.md`;

      // Check if file already exists
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
          // Already synced, skip
          skipped++;
          continue;
        }
      } catch {
        // File doesn't exist, will create
      }

      // Build frontmatter + content
      const tags = full.tag_list?.length > 0 ? full.tag_list.join(', ') : 'blog';
      const markdown = [
        '---',
        `title: "${full.title.replace(/"/g, '\\"')}"`,
        `date: ${dateStr}`,
        `description: "${(full.description || '').replace(/"/g, '\\"')}"`,
        `tags: [${tags}]`,
        `source_url: "${full.url}"`,
        `source: devto`,
        `devto_id: ${full.id}`,
        '---',
        '',
        full.body_markdown || '',
      ].join('\n');

      // Commit to GitHub
      const content = Buffer.from(markdown).toString('base64');
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
            message: `docs: sync Dev.to article "${full.title}" [skip-log]`,
            content,
            branch: 'main',
          }),
        }
      );

      if (commitRes.ok) {
        synced++;
        console.log(`Synced: ${full.title}`);
      } else {
        const error = await commitRes.text();
        console.error(`Failed to sync "${full.title}": ${error}`);
      }
    }

    // Trigger rebuild if new articles were synced
    if (synced > 0) {
      const hookUrl = import.meta.env.VERCEL_DEPLOY_HOOK;
      if (hookUrl) {
        await fetch(hookUrl, { method: 'POST' });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, synced, skipped, total: articles.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to sync Dev.to articles', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async (context) => {
  return POST(context);
};
