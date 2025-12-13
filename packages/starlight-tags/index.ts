import type { StarlightPlugin, StarlightUserConfig } from '@astrojs/starlight/types';
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
  /** Custom tag URL pattern */
  tagUrlPattern?: string;
  /** Enable tags in frontmatter */
  enableFrontmatterTags?: boolean;
  /** Tags to exclude from pages */
  excludeTags?: string[];
}

const defaultConfig: Required<StarlightTagsConfig> = {
  configPath: 'tags.yml',
  tagsPagesPrefix: 'tags',
  tagsIndexSlug: 'tags',
  onInlineTagsNotFound: 'warn',
  tagUrlPattern: '/tags/[tag]',
  enableFrontmatterTags: true,
  excludeTags: []
};

export default function starlightTagsPlugin(
  userConfig: StarlightTagsConfig = {}
): StarlightPlugin {
  const config = { ...defaultConfig, ...userConfig };

  // Validate configuration
  const validatedConfig = pluginConfigSchema.parse(config);

  return {
    name: 'starlight-plugin-tags',
    hooks: {
      'config:setup': async ({
        config: starlightConfig,
        updateConfig,
        addIntegration,
        logger
      }: {
        config: any;
        updateConfig: any;
        addIntegration: any;
        logger: any;
      }) => {
        logger.info('Setting up Starlight Tags plugin...');

        try {
          // Update Starlight configuration
          updateConfig({
            // Custom CSS will be handled by the components themselves
          } as StarlightUserConfig);

          // Add Astro integration for virtual routes
          addIntegration(createTagsIntegration(validatedConfig, logger));

        } catch (error) {
          logger.error(`Failed to initialize tags plugin: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
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
