const DEV_API = 'https://dev.to/api';
const USERNAME = import.meta.env.DEVTO_USERNAME || 'jee599';

export interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  slug: string;
  published_at: string;
  tag_list: string[];
  reading_time_minutes: number;
  cover_image: string | null;
  body_markdown: string;
  body_html: string;
}

export async function fetchArticles(): Promise<DevToArticle[]> {
  try {
    const res = await fetch(`${DEV_API}/articles?username=${USERNAME}&per_page=30`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchArticleBySlug(slug: string): Promise<DevToArticle | null> {
  try {
    const articles = await fetchArticles();
    const match = articles.find((a) => a.slug === slug);
    if (!match) return null;

    const res = await fetch(`${DEV_API}/articles/${match.id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function filterByTags(articles: DevToArticle[], tags: string[]): DevToArticle[] {
  return articles.filter((a) => a.tag_list.some((t) => tags.includes(t)));
}
