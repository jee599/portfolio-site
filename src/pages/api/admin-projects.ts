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

  try {
    const token = getGitHubToken(locals);
    const projects = await getAllProjectsIncludingHidden();
    const buildLogs = await getCollection('build-logs');

    const projectsWithMeta = projects.map((p) => {
      const logs = buildLogs
        .filter((l) => l.data.project === p.slug && l.data.lang === 'ko')
        .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

      return {
        ...p,
        lastLogDate: logs.length > 0 ? logs[0].data.date.toISOString().split('T')[0] : null,
        logCount: logs.length,
        recentCommits: [],
      };
    });

    return json({ projects: projectsWithMeta });
  } catch (e) {
    return json({ error: String(e), projects: [] }, 500);
  }
};

async function updateProjectYaml(
  slug: string,
  field: string,
  value: string | boolean,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  const filePath = `src/content/projects/${slug}.yaml`;
  const repo = `${GITHUB_USERNAME}/portfolio-site`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${token}`,
  };

  try {
    // 현재 파일 내용 + SHA 가져오기
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, { headers });

    let content: string;
    let sha: string | undefined;

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const rawBytes = Uint8Array.from(atob(fileData.content.replace(/\n/g, '')), c => c.charCodeAt(0));
      content = new TextDecoder().decode(rawBytes);
    } else if (getRes.status === 404) {
      // YAML 파일이 없으면 새로 생성
      content = `title: "${slug}"\ngithub: "https://github.com/${GITHUB_USERNAME}/${slug}"\nstatus: "개발중"\nstack: []\none_liner: ""\norder: 99\n`;
      sha = undefined;
    } else {
      return { ok: false, error: `GitHub API error: ${getRes.status}` };
    }

    // 필드 업데이트
    const regex = new RegExp(`^${field}:.*$`, 'm');
    const yamlValue = typeof value === 'boolean' ? String(value) : `"${value}"`;
    if (regex.test(content)) {
      content = content.replace(regex, `${field}: ${yamlValue}`);
    } else {
      content = content.trimEnd() + `\n${field}: ${yamlValue}\n`;
    }

    // UTF-8 → base64 인코딩
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(content)));

    // GitHub API로 커밋 (create or update)
    const putBody: any = {
      message: `chore: ${slug} ${field} → ${value}`,
      content: encoded,
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      return { ok: false, error: `GitHub API error: ${err}` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();
  const { secret, action, slug } = body;

  const adminSecret = import.meta.env.ADMIN_SECRET || (locals as any).runtime?.env?.ADMIN_SECRET;
  if (!adminSecret || secret !== adminSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const token = body.github_token || getGitHubToken(locals);
  if (!token) {
    return json({ error: 'GITHUB_TOKEN 필요. Admin 설정에서 입력해라.', need_token: true }, 400);
  }

  if (action === 'toggle-visible') {
    const { visible } = body;
    const result = await updateProjectYaml(slug, 'visible', visible, token);
    if (!result.ok) return json(result);
    return json({ ok: true, message: `${slug} visible → ${visible}` });
  }

  if (action === 'change-status') {
    const { status } = body;
    const validStatuses = ['운영중', '개발중', '실험중', '중단'];
    if (!validStatuses.includes(status)) {
      return json({ error: `Invalid status: ${status}` }, 400);
    }
    const result = await updateProjectYaml(slug, 'status', status, token);
    if (!result.ok) return json(result);
    return json({ ok: true, message: `${slug} status → ${status}` });
  }

  if (action === 'change-url') {
    const { url } = body;
    const result = await updateProjectYaml(slug, 'url', url, token);
    if (!result.ok) return json(result);
    return json({ ok: true, message: `${slug} url → ${url}` });
  }

  return json({ error: 'Unknown action' }, 400);
};
