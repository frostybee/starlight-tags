import type { StarlightPlugin, HookParameters } from '@astrojs/starlight/types';
import { pluginConfigSchema, type PluginConfig, type SidebarConfig } from './src/schemas/config.js';
import { createTagsIntegration } from './src/libs/integration.js';
import { translations } from './src/translations.js';

/**
 * Sidebar injection configuration.
 */
export interface StarlightTagsSidebarConfig {
  /** Enable/disable automatic sidebar injection. @default true */
  enabled?: boolean;
  /** Where to inject the tags group: 'top' or 'bottom' of the sidebar. @default 'top' */
  position?: 'top' | 'bottom';
  /** Number of tags to show (0 = all tags). @default 10 */
  limit?: number;
  /** Sort order for displayed tags. @default 'count' */
  sortBy?: 'count' | 'alphabetical' | 'priority';
  /** Whether to show the page count badge next to each tag. @default true */
  showCount?: boolean;
  /** Whether the tags group is collapsed by default. @default false */
  collapsed?: boolean;
  /** Include a "View all tags" link at the bottom of the group. @default true */
  showViewAllLink?: boolean;
}

export interface StarlightTagsConfig {
  /** Path to tags.yml configuration file. @default 'tags.yml' */
  configPath?: string;
  /** Base path for tag pages. @default 'tags' */
  tagsPagesPrefix?: string;
  /** Name of the tags index page. @default 'tags' */
  tagsIndexSlug?: string;
  /** Validation behavior for inline tags. @default 'warn' */
  onInlineTagsNotFound?: 'ignore' | 'warn' | 'error';
  /** Number of items per page on tag pages. @default 12 */
  itemsPerPage?: number;
  /**
   * Sidebar injection configuration.
   * Set to false to disable, or provide options to customize.
   * @default false
   */
  sidebar?: false | StarlightTagsSidebarConfig;
}

export default function starlightTagsPlugin(
  userConfig?: StarlightTagsConfig
): StarlightPlugin {
  // Validate configuration - Zod schema handles defaults.
  const result = pluginConfigSchema.safeParse(userConfig ?? {});

  if (!result.success) {
    const issues = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Invalid starlight-tags configuration: ${issues}`);
  }

  const validatedConfig = result.data;

  return {
    name: 'starlight-tags',
    hooks: {
      'i18n:setup': ({ injectTranslations }: HookParameters<'i18n:setup'>) => {
        injectTranslations(translations);
      },
      'config:setup': async ({
        addIntegration,
        addRouteMiddleware,
        logger
      }: HookParameters<'config:setup'>) => {
        logger.info('Setting up Starlight Tags plugin...');

        // Register route middleware to inject tags data into Astro.locals
        addRouteMiddleware({
          entrypoint: 'starlight-tags/middleware',
          order: 'pre'
        });

        addIntegration(createTagsIntegration(validatedConfig, logger));
      }
    }
  };
}

// Export types and schemas for user convenience.
export type { PluginConfig, SidebarConfig };
export { pluginConfigSchema } from './src/schemas/config.js';
export { tagsConfigSchema, tagDefinitionSchema, type ProcessedTag, type TagDefinition, type TagsConfig } from './src/schemas/tags.js';
export { frontmatterSchema, starlightTagsExtension } from './src/schemas/frontmatter.js';
