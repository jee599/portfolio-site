import type { APIRoute } from 'astro';

export const prerender = false;

interface PlatformStats {
  devto: { views: number; articles: number; followers: number } | null;
  hashnode: { views: number; posts: number; followers: number } | null;
  blogger: { views: number } | null;
}

export const GET: APIRoute = async ({ url, locals }) => {
  const secret = url.searchParams.get('secret');
  const runtimeEnv = (locals as any).runtime?.env;
  const getEnv = (key: string) => runtimeEnv?.[key] || (import.meta.env as any)[key] || undefined;

  const adminSecret = getEnv('ADMIN_SECRET');
  if (!adminSecret || secret !== adminSecret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stats: PlatformStats = { devto: null, hashnode: null, blogger: null };

  // DEV.to
  const devtoKey = getEnv('DEVTO_API_KEY');
  if (devtoKey) {
    try {
      let totalViews = 0;
      let totalArticles = 0;
      let page = 1;
      while (true) {
        const res = await fetch(`https://dev.to/api/articles/me?per_page=100&page=${page}`, {
          headers: {
            'api-key': devtoKey,
            'User-Agent': 'jidonglab-admin/1.0',
            'Accept': 'application/vnd.forem.api-v1+json',
          },
        });
        if (!res.ok) break;
        const articles = await res.json();
        if (!articles.length) break;
        for (const a of articles) {
          totalViews += a.page_views_count || 0;
          totalArticles++;
        }
        if (articles.length < 100) break;
        page++;
      }

      // Followers
      let followers = 0;
      try {
        const fRes = await fetch('https://dev.to/api/followers/users?per_page=1', {
          headers: {
            'api-key': devtoKey,
            'User-Agent': 'jidonglab-admin/1.0',
            'Accept': 'application/vnd.forem.api-v1+json',
          },
        });
        if (fRes.ok) {
          // DEV.to doesn't return total count directly, approximate from list
          const fData = await fRes.json();
          followers = fData.length || 0;
        }
      } catch {}

      stats.devto = { views: totalViews, articles: totalArticles, followers };
    } catch {}
  }

  // Hashnode
  const hashnodeToken = getEnv('HASHNODE_TOKEN');
  const hashnodePubId = getEnv('HASHNODE_PUB_ID');
  if (hashnodeToken && hashnodePubId) {
    try {
      const query = `{
        publication(id: "${hashnodePubId}") {
          posts(first: 50) {
            totalDocuments
            edges {
              node {
                views
              }
            }
          }
          followersCount
        }
      }`;
      const res = await fetch('https://gql.hashnode.com/', {
        method: 'POST',
        headers: {
          'Authorization': hashnodeToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        const pub = data.data?.publication;
        const posts = pub?.posts;
        let totalViews = 0;
        for (const edge of posts?.edges || []) {
          totalViews += edge.node?.views || 0;
        }
        stats.hashnode = {
          views: totalViews,
          posts: posts?.totalDocuments || 0,
          followers: pub?.followersCount || 0,
        };
      }
    } catch {}
  }

  // Blogger
  const bloggerBlogId = getEnv('BLOGGER_BLOG_ID');
  const googleClientId = getEnv('GOOGLE_CLIENT_ID');
  const googleClientSecret = getEnv('GOOGLE_CLIENT_SECRET');
  const googleRefreshToken = getEnv('GOOGLE_REFRESH_TOKEN');
  if (bloggerBlogId && googleClientId && googleClientSecret && googleRefreshToken) {
    try {
      // Refresh access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          refresh_token: googleRefreshToken,
          grant_type: 'refresh_token',
        }),
      });
      if (tokenRes.ok) {
        const tokens = await tokenRes.json();
        const accessToken = tokens.access_token;

        const pvRes = await fetch(
          `https://www.googleapis.com/blogger/v3/blogs/${bloggerBlogId}/pageviews?range=all`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (pvRes.ok) {
          const pvData = await pvRes.json();
          const allTimeCount = pvData.counts?.find((c: any) => c.timeRange === 'ALL_TIME');
          stats.blogger = { views: parseInt(allTimeCount?.count || '0', 10) };
        }
      }
    } catch {}
  }

  return new Response(JSON.stringify(stats), {
    headers: { 'Content-Type': 'application/json' },
  });
};
