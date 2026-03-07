import { getCollection } from 'astro:content';
import { fetchGitHubProjects, type GitHubProject } from './github';

export interface Project {
  slug: string;
  title: string;
  url?: string;
  github: string;
  status: string;
  stack: string[];
  one_liner: string;
  order: number;
}

export async function getAllProjects(): Promise<Project[]> {
  const [localEntries, githubProjects] = await Promise.all([
    getCollection('projects'),
    fetchGitHubProjects(),
  ]);

  const localProjects: Project[] = localEntries.map((p) => ({
    slug: p.id.replace('.yaml', ''),
    title: p.data.title,
    url: p.data.url,
    github: p.data.github,
    status: p.data.status,
    stack: p.data.stack,
    one_liner: p.data.one_liner,
    order: p.data.order ?? 99,
  }));

  // Local YAML takes priority over GitHub (by slug match)
  const localSlugs = new Set(localProjects.map((p) => p.slug));

  const merged: Project[] = [
    ...localProjects,
    ...githubProjects
      .filter((p) => !localSlugs.has(p.slug))
      .map((p) => ({ ...p, order: p.order ?? 99 })),
  ];

  return merged.sort((a, b) => a.order - b.order);
}
