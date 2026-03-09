import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis/cloudflare';

export const prerender = false;

function getRedis(runtimeEnv?: Record<string, string>): Redis | null {
  const url = runtimeEnv?.UPSTASH_REDIS_REST_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
  const token = runtimeEnv?.UPSTASH_REDIS_REST_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/engagement?slug=/posts/xxx
export const GET: APIRoute = async ({ url, locals }) => {
  const slug = url.searchParams.get('slug');
  if (!slug) return json({ error: 'slug required' }, 400);

  const runtimeEnv = (locals as any).runtime?.env;
  const redis = getRedis(runtimeEnv);
  if (!redis) return json({ views: 0, likes: 0, comments: [] });

  try {
    const [views, likes, commentsRaw] = await Promise.all([
      redis.get<number>(`post:views:${slug}`),
      redis.get<number>(`post:likes:${slug}`),
      redis.lrange(`post:comments:${slug}`, 0, -1),
    ]);

    const comments = (commentsRaw || []).map((c: unknown) => {
      if (typeof c === 'string') {
        try { return JSON.parse(c); } catch { return null; }
      }
      return c;
    }).filter(Boolean);

    return json({
      views: views || 0,
      likes: likes || 0,
      comments,
    });
  } catch {
    return json({ views: 0, likes: 0, comments: [] });
  }
};

// POST /api/engagement
// body: { slug, action: 'view' | 'like' | 'unlike' | 'comment', name?, text? }
export const POST: APIRoute = async ({ request, locals }) => {
  let body: { slug?: string; action?: string; name?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid JSON' }, 400);
  }

  const { slug, action } = body;
  if (!slug || !action) return json({ error: 'slug and action required' }, 400);

  const runtimeEnv = (locals as any).runtime?.env;
  const redis = getRedis(runtimeEnv);
  if (!redis) return json({ success: false });

  try {
    if (action === 'view') {
      const views = await redis.incr(`post:views:${slug}`);
      return json({ views });
    }

    if (action === 'like') {
      const likes = await redis.incr(`post:likes:${slug}`);
      return json({ likes });
    }

    if (action === 'unlike') {
      const current = await redis.get<number>(`post:likes:${slug}`) || 0;
      const newVal = Math.max(0, current - 1);
      await redis.set(`post:likes:${slug}`, newVal);
      return json({ likes: newVal });
    }

    if (action === 'comment') {
      const name = (body.name || '').trim().slice(0, 50);
      const text = (body.text || '').trim().slice(0, 1000);
      if (!name || !text) return json({ error: 'name and text required' }, 400);

      const comment = {
        name,
        text,
        date: new Date().toISOString(),
      };

      await redis.lpush(`post:comments:${slug}`, JSON.stringify(comment));
      return json({ success: true, comment });
    }

    return json({ error: 'unknown action' }, 400);
  } catch {
    return json({ success: false }, 500);
  }
};
