export const prerender = false;
import type { APIRoute } from 'astro';

// Build-time snapshot of `git log -n 6`. Updated periodically via build script or
// a scheduled GitHub Action. Cloudflare Pages runtime can't spawn `git`, so this
// is the source of truth in production.
const SNAPSHOT = {
  generated_at: '2026-04-23T19:57:09+09:00',
  items: [
    { hash: '721bb60', subject: 'chore: baseline before v2-pro design port', relative: 'just now', iso: '2026-04-23T19:57:09+09:00' },
    { hash: '72d6282', subject: 'feat: build logs 2026-04-23 (1 posts, auto)', relative: '41 minutes ago', iso: '2026-04-23T19:18:21+09:00' },
    { hash: 'e1a571c', subject: 'feat: build logs 2026-04-23 (1 posts, auto)', relative: '7 hours ago', iso: '2026-04-23T13:12:06+09:00' },
    { hash: '847fc34', subject: 'feat: build logs 2026-04-23 (1 posts, auto)', relative: '13 hours ago', iso: '2026-04-23T07:06:45+09:00' },
    { hash: '0176c48', subject: 'feat: build logs 2026-04-23 (1 posts, auto)', relative: '19 hours ago', iso: '2026-04-23T01:01:19+09:00' },
    { hash: '43bc6a0', subject: 'feat: build logs 2026-04-22 (1 posts, auto)', relative: '25 hours ago', iso: '2026-04-22T18:56:12+09:00' },
  ],
};

export const GET: APIRoute = async () => {
  const latest = SNAPSHOT.items[0];
  return new Response(JSON.stringify({ latest, items: SNAPSHOT.items, generated_at: SNAPSHOT.generated_at, source: 'snapshot' }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=300',
    },
  });
};
