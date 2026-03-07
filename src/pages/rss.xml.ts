import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: any) {
  const buildLogs = (await getCollection('build-logs'))
    .filter((p) => p.data.lang === 'ko')
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const tips = (await getCollection('tips'))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const items = [
    ...buildLogs.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      link: `/posts/${p.slug}`,
    })),
    ...tips.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      link: `/posts/${p.slug}`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'JiDong Lab',
    description: 'AI로 프로덕트를 만들고 수익화하는 기록',
    site: context.site,
    items,
  });
}
