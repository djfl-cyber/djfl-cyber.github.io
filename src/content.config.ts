import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern:'**/index.md', base:'./src/content/posts' }),
  schema: z.object({
    title:z.string().min(1), date:z.coerce.date(), updated:z.coerce.date().nullable().optional(), description:z.string().optional(),
    tags:z.array(z.string()).default([]), categories:z.array(z.string()).default([]), draft:z.boolean().default(false),
    permalink:z.string().refine(v=>/^\/(?:[^/?#\\]+\/)+$/.test(v) && !v.split('/').some(s=>s==='.'||s==='..'), 'Use an absolute path ending with /'),
    toc:z.boolean().default(true), cover:z.string().optional(),
  }),
});
export const collections = { posts };
