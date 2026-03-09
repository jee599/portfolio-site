import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis/cloudflare';

export const prerender = false;

function getTodayKey(): string {
  const now = new Date();
  // KST (UTC+9)
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `visitors:${kst.toISOString().split('T')[0]}`;
}

function getRedis(runtimeEnv?: Record<string, string>): Redis | null {
  const url = runtimeEnv?.UPSTASH_REDIS_REST_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
  const token = runtimeEnv?.UPSTASH_REDIS_REST_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export const GET: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;
  const runtimeEnv = runtime?.env;
  const redis = getRedis(runtimeEnv);

  if (!redis) {
    return new Response(JSON.stringify({
      today: 0, total: 0,
      debug: {
        hasRuntime: !!runtime,
        hasEnv: !!runtimeEnv,
        runtimeKeys: runtime ? Object.keys(runtime) : [],
        envKeys: runtimeEnv ? Object.keys(runtimeEnv).filter((k: string) => k.startsWith('UPSTASH')) : [],
        hasImportMetaUrl: !!import.meta.env.UPSTASH_REDIS_REST_URL,
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const todayKey = getTodayKey();
    const [today, total] = await Promise.all([
      redis.get<number>(todayKey),
      redis.get<number>('visitors:total'),
    ]);

    return new Response(JSON.stringify({
      today: today || 0,
      total: total || 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ today: 0, total: 0, error: String(e) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ locals }) => {
  const runtimeEnv = (locals as any).runtime?.env;
  const redis = getRedis(runtimeEnv);

  if (!redis) {
    return new Response(JSON.stringify({ today: 0, total: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const todayKey = getTodayKey();

    const [today, total] = await Promise.all([
      redis.incr(todayKey),
      redis.incr('visitors:total'),
    ]);

    // 오늘 키 48시간 후 자동 삭제 (KST 기준 다음날 넘어가도 여유)
    await redis.expire(todayKey, 48 * 60 * 60);

    return new Response(JSON.stringify({ today, total }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ today: 0, total: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
