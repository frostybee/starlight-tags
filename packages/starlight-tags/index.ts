import type { StarlightPlugin, HookParameters } from '@astrojs/starlight/types';
import { pluginConfigSchema, type PluginConfig } from './src/schemas/config.js';
import { createTagsIntegration } from './src/libs/integration.js';
import { translations } from './src/translations.js';

export interface StarlightTagsConfig {
  // Path to tags.yml configuration file.
  configPath?: string;
  // Base path for tag pages.
  tagsPagesPrefix?: string;
  // Name of the tags index page.
  tagsIndexSlug?: string;
  // Validation behavior for inline tags.
  onInlineTagsNotFound?: 'ignore' | 'warn' | 'error';
  // Number of items per page on tag pages.
  itemsPerPage?: number;
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
      'config:setup': async ({ addIntegration, logger }: HookParameters<'config:setup'>) => {
        logger.info('Setting up Starlight Tags plugin...');
        addIntegration(createTagsIntegration(validatedConfig, logger));
      }
    }
  };
}

// Export types and schemas for user convenience.
export type { PluginConfig };
export { pluginConfigSchema } from './src/schemas/config.js';
export { tagsConfigSchema, tagDefinitionSchema, type ProcessedTag, type TagDefinition, type TagsConfig } from './src/schemas/tags.js';
export { frontmatterSchema, starlightTagsExtension } from './src/schemas/frontmatter.js';
