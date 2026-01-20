import { z } from 'astro/zod';

/**
 * Sidebar injection configuration schema.
 * Controls automatic tag injection into Starlight's sidebar.
 */
const sidebarConfigSchema = z.object({
  /** Enable/disable automatic sidebar injection */
  enabled: z.boolean().default(true),
  /** Where to inject the tags group: 'top' or 'bottom' of the sidebar */
  position: z.enum(['top', 'bottom']).default('top'),
  /** Number of tags to show (0 = all tags) */
  limit: z.number().int().nonnegative().default(10),
  /** Sort order for displayed tags */
  sortBy: z.enum(['count', 'alphabetical', 'priority']).default('count'),
  /** Whether to show the page count badge next to each tag */
  showCount: z.boolean().default(true),
  /** Whether the tags group is collapsed by default */
  collapsed: z.boolean().default(false),
  /** Include a "View all tags" link at the bottom of the group */
  showViewAllLink: z.boolean().default(true),
});

export type SidebarConfig = z.infer<typeof sidebarConfigSchema>;

export const pluginConfigSchema = z.object({
  configPath: z.string().default('tags.yml'),
  tagsPagesPrefix: z.string().default('tags'),
  tagsIndexSlug: z.string().default('tags'),
  onInlineTagsNotFound: z.enum(['ignore', 'warn', 'error']).default('warn'),
  // Number of items per page on tag pages (pagination)
  itemsPerPage: z.number().int().positive().default(12),
  // Internal: Set by the integration from Astro config
  basePath: z.string().default(''),
  /**
   * Sidebar injection configuration.
   * Set to false to disable, or provide options to customize.
   * @default false
   */
  sidebar: z.union([
    z.literal(false),
    sidebarConfigSchema,
  ]).default(false),
});

export type PluginConfig = z.infer<typeof pluginConfigSchema>;