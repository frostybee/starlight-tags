import type { StarlightPlugin, HookParameters } from '@astrojs/starlight/types';
import { z } from 'astro/zod';
import { pluginConfigSchema, type PluginConfig } from './src/schemas/config.js';
import { createTagsIntegration } from './src/lib/integration.js';

export interface StarlightTagsConfig {
  /** Path to tags.yml configuration file */
  configPath?: string;
  /** Base path for tag pages */
  tagsPagesPrefix?: string;
  /** Name of the tags index page */
  tagsIndexSlug?: string;
  /** Validation behavior for inline tags */
  onInlineTagsNotFound?: 'ignore' | 'warn' | 'error';
  /** Enable tags in frontmatter */
  enableFrontmatterTags?: boolean;
}

const defaultConfig: Required<StarlightTagsConfig> = {
  configPath: 'tags.yml',
  tagsPagesPrefix: 'tags',
  tagsIndexSlug: 'tags',
  onInlineTagsNotFound: 'warn',
  enableFrontmatterTags: true
};

export default function starlightTagsPlugin(
  userConfig: StarlightTagsConfig = {}
): StarlightPlugin {
  const config = { ...defaultConfig, ...userConfig };

  // Validate configuration with helpful error messages
  let validatedConfig: PluginConfig;
  try {
    validatedConfig = pluginConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Invalid starlight-tags configuration: ${issues}`);
    }
    throw error;
  }

  return {
    name: 'starlight-plugin-tags',
    hooks: {
      'config:setup': async ({ addIntegration, logger }: HookParameters<'config:setup'>) => {
        logger.info('Setting up Starlight Tags plugin...');
        addIntegration(createTagsIntegration(validatedConfig, logger));
      }
    }
  };
}

// Export types and schemas for user convenience
export type { PluginConfig };
export { pluginConfigSchema } from './src/schemas/config.js';
export { tagsConfigSchema } from './src/schemas/tags.js';
export { frontmatterSchema, starlightTagsExtension } from './src/schemas/frontmatter.js';

// Export TagsProcessor for direct use in pages
export { TagsProcessor } from './src/lib/tags-processor.js';
