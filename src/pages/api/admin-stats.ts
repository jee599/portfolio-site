import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis/cloudflare';
import { getCollection } from 'astro:content';

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

function getKSTDate(daysAgo = 0): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setDate(kst.getDate() - daysAgo);
  return kst.toISOString().split('T')[0];
}

export const GET: APIRoute = async ({ url, locals }) => {
  const secret = url.searchParams.get('secret');
  const adminSecret = import.meta.env.ADMIN_SECRET || (locals as any).runtime?.env?.ADMIN_SECRET;

  if (!adminSecret || secret !== adminSecret) {
    return json({ error: 'unauthorized' }, 401);
  }

  const runtimeEnv = (locals as any).runtime?.env;
  const redis = getRedis(runtimeEnv);

  // Collect all content slugs
  const [buildLogs, tips, aiNews, blogPosts] = await Promise.all([
    getCollection('build-logs'),
    getCollection('tips'),
    getCollection('ai-news'),
    getCollection('blog'),
  ]);

  const allContent = [
    ...buildLogs.map(p => ({ slug: `/posts/${p.slug}`, title: p.data.title, type: 'build-log', date: p.data.date.toISOString().split('T')[0], project: p.data.project, lang: p.data.lang })),
    ...tips.map(p => ({ slug: `/posts/${p.slug}`, title: p.data.title, type: 'tip', date: p.data.date.toISOString().split('T')[0] })),
    ...aiNews.map(p => ({ slug: `/ai-news/${p.slug}`, title: p.data.title, type: 'ai-news', date: p.data.date.toISOString().split('T')[0] })),
    ...blogPosts.map(p => ({ slug: `/blog/${p.slug}`, title: p.data.title, type: 'blog', date: p.data.date.toISOString().split('T')[0] })),
  ];

  if (!redis) {
    return json({
      visitors: { today: 0, total: 0, daily: [] },
      content: allContent.map(c => ({ ...c, views: 0, likes: 0, comments: 0 })),
    });
  }

  try {
    // Fetch daily visitor counts for last 90 days
    const dailyKeys = Array.from({ length: 90 }, (_, i) => `visitors:${getKSTDate(i)}`);
    const dailyDates = Array.from({ length: 90 }, (_, i) => getKSTDate(i));

    const pipeline = redis.pipeline();
    // visitor counts
    pipeline.get<number>('visitors:total');
    pipeline.get<number>(`visitors:${getKSTDate(0)}`);
    for (const key of dailyKeys) {
      pipeline.get<number>(key);
    }
    // per-content engagement
    for (const c of allContent) {
      pipeline.get<number>(`post:views:${c.slug}`);
      pipeline.get<number>(`post:likes:${c.slug}`);
      pipeline.llen(`post:comments:${c.slug}`);
    }

    const results = await pipeline.exec();

    const total = (results[0] as number) || 0;
    const today = (results[1] as number) || 0;

    const daily = dailyDates.map((date, i) => ({
      date,
      count: (results[2 + i] as number) || 0,
    })).reverse();

    const contentOffset = 2 + dailyKeys.length;
    const contentStats = allContent.map((c, i) => ({
      ...c,
      views: (results[contentOffset + i * 3] as number) || 0,
      likes: (results[contentOffset + i * 3 + 1] as number) || 0,
      comments: (results[contentOffset + i * 3 + 2] as number) || 0,
    }));

    // Sort by views desc
    contentStats.sort((a, b) => b.views - a.views);

    return json({
      visitors: { today, total, daily },
      content: contentStats,
      summary: {
        totalPosts: allContent.length,
        totalViews: contentStats.reduce((s, c) => s + c.views, 0),
        totalLikes: contentStats.reduce((s, c) => s + c.likes, 0),
        totalComments: contentStats.reduce((s, c) => s + c.comments, 0),
        byType: {
          'build-log': allContent.filter(c => c.type === 'build-log').length,
          'tip': allContent.filter(c => c.type === 'tip').length,
          'ai-news': allContent.filter(c => c.type === 'ai-news').length,
          'blog': allContent.filter(c => c.type === 'blog').length,
        },
      },
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};
