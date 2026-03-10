import type { APIRoute } from 'astro';

export const prerender = false;

const handler: APIRoute = async ({ request, locals }) => {
  const runtimeEnv = (locals as any).runtime?.env as Record<string, string> | undefined;
  const getEnv = (key: string) => runtimeEnv?.[key] || (import.meta.env as any)[key] || undefined;

  const authHeader = request.headers.get('authorization');
  const cronSecret = getEnv('CRON_SECRET');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hookUrl = getEnv('CF_DEPLOY_HOOK');

  if (!hookUrl) {
    return new Response(JSON.stringify({ error: 'CF_DEPLOY_HOOK not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(hookUrl, { method: 'POST' });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Deploy hook failed', status: res.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, message: 'Rebuild triggered' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to call deploy hook' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET = handler;
export const POST = handler;
