import { z } from 'astro/zod';

export const pluginConfigSchema = z.object({
  configPath: z.string().default('tags.yml'),
  tagsPagesPrefix: z.string().default('tags'),
  tagsIndexSlug: z.string().default('tags'),
  onInlineTagsNotFound: z.enum(['ignore', 'warn', 'error']).default('warn'),
  enableFrontmatterTags: z.boolean().default(true)
});

export type PluginConfig = z.infer<typeof pluginConfigSchema>;