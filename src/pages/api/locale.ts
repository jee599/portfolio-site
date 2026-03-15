import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const country = request.headers.get('cf-ipcountry') || 'US';
  const lang = country === 'KR' ? 'ko' : 'en';
  return new Response(JSON.stringify({ country, lang }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
