import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getAllProjectsIncludingHidden } from '../../lib/projects';

export const prerender = false;

const GITHUB_USERNAME = 'jee599';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getGitHubToken(locals: any): string {
  return import.meta.env.GITHUB_TOKEN || (locals as any).runtime?.env?.GITHUB_TOKEN || '';
}

async function fetchRecentCommits(repo: string, token: string, count = 5): Promise<any[]> {
  try {
    const repoName = repo.replace('https://github.com/', '').replace(/\/$/, '');
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(
      `https://api.github.com/repos/${repoName}/commits?per_page=${count}`,
      { headers },
    );
    if (!res.ok) return [];
    const commits = await res.json();
    return commits.map((c: any) => ({
      sha: c.sha?.slice(0, 7),
      message: c.commit?.message?.split('\n')[0] || '',
      date: c.commit?.author?.date || '',
      author: c.commit?.author?.name || '',
    }));
  } catch {
    return [];
  }
}

export const GET: APIRoute = async ({ url, locals }) => {
  const secret = url.searchParams.get('secret');
  const adminSecret = import.meta.env.ADMIN_SECRET || (locals as any).runtime?.env?.ADMIN_SECRET;
  if (!adminSecret || secret !== adminSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const token = getGitHubToken(locals);
  const projects = await getAllProjectsIncludingHidden();

  // 빌드 로그 수집
  const buildLogs = await getCollection('build-logs');

  const projectsWithMeta = await Promise.all(
    projects.map(async (p) => {
      const logs = buildLogs
        .filter((l) => l.data.project === p.slug && l.data.lang === 'ko')
        .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

      const lastLogDate = logs.length > 0 ? logs[0].data.date.toISOString().split('T')[0] : null;

      const recentCommits = await fetchRecentCommits(p.github, token, 5);

      return {
        ...p,
        lastLogDate,
        logCount: logs.length,
        recentCommits,
      };
    }),
  );

  return json({ projects: projectsWithMeta });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();
  const { secret, action, slug, visible } = body;

  const adminSecret = import.meta.env.ADMIN_SECRET || (locals as any).runtime?.env?.ADMIN_SECRET;
  if (!adminSecret || secret !== adminSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (action === 'toggle-visible') {
    // visible 토글은 로컬 dev 서버에서만 동작 (YAML 파일 직접 수정)
    // 프로덕션에서는 안내 메시지 반환
    const isDev = import.meta.env.DEV;
    if (!isDev) {
      return json({
        ok: false,
        error: 'visible 토글은 로컬 dev 서버에서만 동작한다. YAML 파일을 직접 수정해라.',
      });
    }

    // 로컬: fs 사용 불가 (Astro SSR) → CLI 명령어 안내
    return json({
      ok: true,
      message: `${slug}의 visible을 ${visible}로 변경하려면:\nsrc/content/projects/${slug}.yaml에 visible: ${visible} 추가`,
      command: `echo "visible: ${visible}" >> src/content/projects/${slug}.yaml`,
    });
  }

  return json({ error: 'Unknown action' }, 400);
};
