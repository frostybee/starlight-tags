import { z } from 'astro/zod';

export const pluginConfigSchema = z.object({
  configPath: z.string().default('tags.yml'),
  tagsPagesPrefix: z.string().default('tags'),
  tagsIndexSlug: z.string().default('tags'),
  onInlineTagsNotFound: z.enum(['ignore', 'warn', 'error']).default('warn'),
  // Number of items per page on tag pages (pagination)
  itemsPerPage: z.number().int().positive().default(12),
  // Internal: Set by the integration from Astro config
  basePath: z.string().default('')
});

export type PluginConfig = z.infer<typeof pluginConfigSchema>;