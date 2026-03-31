import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET() {
  const siteUrl = 'https://jidonglab.com';

  const buildLogs = await getCollection('build-logs');
  const tips = await getCollection('tips');
  const aiNews = await getCollection('ai-news');
  const blog = await getCollection('blog');

  const staticPages = [
    { url: '/', priority: '1.0', freq: 'daily' },
    { url: '/posts', priority: '0.8', freq: 'daily' },
    { url: '/projects', priority: '0.7', freq: 'weekly' },
    { url: '/about', priority: '0.5', freq: 'monthly' },
    { url: '/blog', priority: '0.8', freq: 'weekly' },
  ];

  const postEntries = [
    ...buildLogs.map((p) => ({
      url: `/posts/${p.slug}`,
      date: p.data.date.toISOString().split('T')[0],
      priority: '0.7',
      freq: 'monthly',
    })),
    ...tips.map((p) => ({
      url: `/posts/${p.slug}`,
      date: p.data.date.toISOString().split('T')[0],
      priority: '0.6',
      freq: 'monthly',
    })),
    ...aiNews.map((p) => ({
      url: `/ai-news/${p.slug}`,
      date: p.data.date.toISOString().split('T')[0],
      priority: '0.7',
      freq: 'weekly',
    })),
    ...blog.map((p) => ({
      url: `/blog/${p.slug}`,
      date: p.data.date.toISOString().split('T')[0],
      priority: '0.8',
      freq: 'monthly',
    })),
  ];

  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticPages
  .map(
    (p) => `  <url>
    <loc>${siteUrl}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
${postEntries
  .map(
    (p) => `  <url>
    <loc>${siteUrl}${p.url}</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
