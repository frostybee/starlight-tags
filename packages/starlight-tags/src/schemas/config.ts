import { z } from 'astro/zod';

export const pluginConfigSchema = z.object({
  configPath: z.string().default('tags.yml'),
  tagsPagesPrefix: z.string().default('tags'),
  tagsIndexSlug: z.string().default('tags'),
  onInlineTagsNotFound: z.enum(['ignore', 'warn', 'error']).default('warn'),
  tagUrlPattern: z.string().default('/tags/[tag]'),
  enableFrontmatterTags: z.boolean().default(true),
  excludeTags: z.array(z.string()).default([])
});

export type PluginConfig = z.infer<typeof pluginConfigSchema>;