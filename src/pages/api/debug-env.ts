import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;
  const env = runtime?.env;

  return new Response(JSON.stringify({
    hasRuntime: !!runtime,
    hasEnv: !!env,
    runtimeKeys: runtime ? Object.keys(runtime) : [],
    envKeys: env ? Object.keys(env) : [],
    hasUpstashUrl: !!env?.UPSTASH_REDIS_REST_URL,
    hasUpstashToken: !!env?.UPSTASH_REDIS_REST_TOKEN,
    // Also check import.meta.env
    importMetaHasUrl: !!import.meta.env.UPSTASH_REDIS_REST_URL,
    importMetaHasToken: !!import.meta.env.UPSTASH_REDIS_REST_TOKEN,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
