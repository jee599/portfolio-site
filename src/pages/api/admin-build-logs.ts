import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ url, locals }) => {
  const secret = url.searchParams.get('secret');
  const adminSecret = import.meta.env.ADMIN_SECRET || (locals as any).runtime?.env?.ADMIN_SECRET;
  if (!adminSecret || secret !== adminSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const buildLogs = await getCollection('build-logs');

  const logs = buildLogs
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((log) => ({
      slug: log.slug,
      title: log.data.title,
      project: log.data.project,
      date: log.data.date.toISOString().split('T')[0],
      lang: log.data.lang,
      pair: log.data.pair,
      tags: log.data.tags,
      published_to: log.data.published_to || [],
    }));

  return json({ logs });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();
  const { secret, action, slug } = body;

  const adminSecret = import.meta.env.ADMIN_SECRET || (locals as any).runtime?.env?.ADMIN_SECRET;
  if (!adminSecret || secret !== adminSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (action === 'publish-devto') {
    const devtoApiKey = import.meta.env.DEVTO_API_KEY || (locals as any).runtime?.env?.DEVTO_API_KEY;
    if (!devtoApiKey) {
      return json({ error: 'DEVTO_API_KEY not configured' }, 500);
    }

    // 해당 빌드 로그 찾기
    const buildLogs = await getCollection('build-logs');
    const log = buildLogs.find((l) => l.slug === slug);
    if (!log) {
      return json({ error: `Build log not found: ${slug}` }, 404);
    }

    // DEV.to API로 발행
    try {
      const res = await fetch('https://dev.to/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': devtoApiKey,
        },
        body: JSON.stringify({
          article: {
            title: log.data.title,
            body_markdown: log.body,
            published: true,
            tags: log.data.tags.slice(0, 4),
            canonical_url: `https://jidonglab.com/posts/${log.slug}`,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return json({ error: `DEV.to API error: ${err}` }, res.status);
      }

      const article = await res.json();
      return json({
        ok: true,
        message: `DEV.to에 발행 완료: ${article.url}`,
        devto_url: article.url,
        devto_id: article.id,
      });
    } catch (e) {
      return json({ error: `DEV.to 발행 실패: ${e}` }, 500);
    }
  }

  if (action === 'get-markdown') {
    const buildLogs = await getCollection('build-logs');
    const log = buildLogs.find((l) => l.slug === slug);
    if (!log) {
      return json({ error: `Build log not found: ${slug}` }, 404);
    }

    return json({
      ok: true,
      title: log.data.title,
      markdown: log.body,
      tags: log.data.tags,
    });
  }

  return json({ error: 'Unknown action' }, 400);
};
