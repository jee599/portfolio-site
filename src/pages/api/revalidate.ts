import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const hookUrl = import.meta.env.VERCEL_DEPLOY_HOOK;

  if (!hookUrl) {
    return new Response(JSON.stringify({ error: 'VERCEL_DEPLOY_HOOK not configured' }), {
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
