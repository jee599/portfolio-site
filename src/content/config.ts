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

const aiNews = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    model: z.enum(['claude', 'gemini', 'gpt', 'etc', 'daily']),
    tags: z.array(z.string()),
    summary: z.string().optional(),
    sources: z.array(z.string()).optional(),
    auto_generated: z.boolean().default(true),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    pubDate: z.coerce.date().optional(),
    description: z.string().optional(),
    tags: z.union([z.array(z.string()), z.string().transform(s => s.split(',').map(t => t.trim()))]).default([]),
    lang: z.string().optional(),
    source_url: z.string().url().optional(),
    source: z.enum(['devto', 'original', 'devto-migration']).default('original'),
    devto_id: z.number().optional(),
  }).transform(data => ({
    ...data,
    date: data.date || data.pubDate || new Date(),
  })),
});

export const collections = { projects, 'build-logs': buildLogs, tips, 'ai-news': aiNews, blog };
