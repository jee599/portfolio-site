import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    url: z.string().url().optional(),
    github: z.string().url(),
    status: z.enum(['운영중', '개발중', '실험중', '중단']),
    stack: z.array(z.string()),
    one_liner: z.string(),
    order: z.number().optional(),
  }),
});

const buildLogs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    project: z.string(),
    date: z.coerce.date(),
    lang: z.enum(['ko', 'en']),
    pair: z.string().optional(),
    tags: z.array(z.string()),
  }),
});

const tips = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
  }),
});

export const collections = { projects, 'build-logs': buildLogs, tips };
