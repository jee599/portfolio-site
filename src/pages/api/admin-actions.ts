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

function getEnv(key: string, locals: any): string | undefined {
  return import.meta.env[key] || (locals as any).runtime?.env?.[key];
}

export const POST: APIRoute = async ({ request, locals }) => {
  const adminSecret = getEnv('ADMIN_SECRET', locals);
  let body: { secret?: string; action?: string; slug?: string; commentIndex?: number };

  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid JSON' }, 400);
  }

  if (!adminSecret || body.secret !== adminSecret) {
    return json({ error: 'unauthorized' }, 401);
  }

  const { action } = body;

  // Trigger AI news generation
  if (action === 'generate-ai-news') {
    const cronSecret = getEnv('CRON_SECRET', locals);
    if (!cronSecret) return json({ error: 'CRON_SECRET not configured' }, 500);

    try {
      const origin = new URL(request.url).origin;
      const res = await fetch(`${origin}/api/generate-ai-news`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cronSecret}` },
      });
      const data = await res.json();
      return json({ ok: res.ok, ...data });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }

  // Trigger site rebuild
  if (action === 'revalidate') {
    const hookUrl = getEnv('CF_DEPLOY_HOOK', locals);
    if (!hookUrl) return json({ error: 'CF_DEPLOY_HOOK not configured' }, 500);

    try {
      const res = await fetch(hookUrl, { method: 'POST' });
      return json({ ok: res.ok, message: res.ok ? 'Rebuild triggered' : 'Deploy hook failed' });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }

  // Delete a comment
  if (action === 'delete-comment') {
    const { slug, commentIndex } = body;
    if (!slug || commentIndex === undefined) {
      return json({ error: 'slug and commentIndex required' }, 400);
    }

    const runtimeEnv = (locals as any).runtime?.env;
    const redis = getRedis(runtimeEnv);
    if (!redis) return json({ error: 'Redis not configured' }, 500);

    try {
      const key = `post:comments:${slug}`;
      const comments = await redis.lrange(key, 0, -1);
      if (commentIndex < 0 || commentIndex >= comments.length) {
        return json({ error: 'invalid index' }, 400);
      }

      // Use placeholder-and-remove pattern for list item deletion
      const placeholder = `__DELETE_${Date.now()}__`;
      await redis.lset(key, commentIndex, placeholder);
      await redis.lrem(key, 1, placeholder);

      return json({ ok: true });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }

  // Fetch all comments for admin
  if (action === 'list-comments') {
    const runtimeEnv = (locals as any).runtime?.env;
    const redis = getRedis(runtimeEnv);
    if (!redis) return json({ comments: [] });

    try {
      // Get comments for specific slug or scan all known slugs
      if (body.slug) {
        const raw = await redis.lrange(`post:comments:${body.slug}`, 0, -1);
        const comments = raw.map((c: unknown, i: number) => {
          const parsed = typeof c === 'string' ? JSON.parse(c) : c;
          return { ...parsed, slug: body.slug, index: i };
        });
        return json({ comments });
      }
      return json({ comments: [] });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }

  return json({ error: 'unknown action' }, 400);
};
