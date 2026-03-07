import yaml from 'js-yaml';

const GITHUB_USERNAME = import.meta.env.GITHUB_USERNAME || 'jee599';
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN || '';

export interface GitHubProject {
  slug: string;
  title: string;
  url?: string;
  github: string;
  status: string;
  stack: string[];
  one_liner: string;
  order?: number;
}

interface PortfolioYaml {
  title: string;
  url?: string;
  status?: string;
  stack?: string[];
  one_liner?: string;
  order?: number;
}

const headers: Record<string, string> = {
  Accept: 'application/vnd.github.v3+json',
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};

async function fetchRepos(): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
      { headers },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchPortfolioYaml(repo: string): Promise<PortfolioYaml | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repo}/contents/.portfolio.yaml`,
      { headers },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return yaml.load(content) as PortfolioYaml;
  } catch {
    return null;
  }
}

export async function fetchGitHubProjects(): Promise<GitHubProject[]> {
  const repos = await fetchRepos();
  if (repos.length === 0) return [];

  const results = await Promise.all(
    repos
      .filter((r: any) => !r.fork && !r.archived)
      .map(async (repo: any): Promise<GitHubProject | null> => {
        const config = await fetchPortfolioYaml(repo.name);
        if (!config) return null;

        return {
          slug: repo.name,
          title: config.title || repo.name,
          url: config.url,
          github: repo.html_url,
          status: config.status || '개발중',
          stack: config.stack || [],
          one_liner: config.one_liner || repo.description || '',
          order: config.order,
        };
      }),
  );

  return results.filter((p): p is GitHubProject => p !== null);
}
