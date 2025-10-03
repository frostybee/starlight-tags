import type { StarlightPlugin, StarlightUserConfig } from '@astrojs/starlight/types';
import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { TagsProcessor } from './src/utils/tags-processor.js';
import { generateTagRoutes } from './src/utils/route-generator.js';
import { pluginConfigSchema, type PluginConfig } from './src/schemas/config.js';

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

          // Add Astro integration for virtual routes (TagsProcessor will be created later)
          addIntegration(createTagsIntegration(validatedConfig, logger));
          
        } catch (error) {
          logger.error(`Failed to initialize tags plugin: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      }
    }
  };
}

function createTagsIntegration(
  config: PluginConfig,
  logger: any
): AstroIntegration {
  return {
    name: 'starlight-tags-routes',
    hooks: {
      'astro:config:setup': ({ injectRoute, addWatchFile }) => {
        // Watch tags configuration file
        addWatchFile(config.configPath);

        // Inject virtual routes for tags using absolute paths
        const tagsIndexPath = fileURLToPath(new URL('./src/pages/tags-index.astro', import.meta.url));
        const tagPagePath = fileURLToPath(new URL('./src/pages/tag-page.astro', import.meta.url));

        injectRoute({
          pattern: `/${config.tagsIndexSlug}`,
          entrypoint: tagsIndexPath
        });

        injectRoute({
          pattern: `/${config.tagsPagesPrefix}/[tag]`,
          entrypoint: tagPagePath
        });
      },
      
      'astro:config:done': async ({ config: astroConfig }) => {
        // Validate educational prerequisites during build
        try {
          const processor = new TagsProcessor(config, logger);
          await processor.initialize();
          processor.setAstroConfig(astroConfig);
          
          // Only validate prerequisites if we have tags data
          const tagsMap = processor.getTags();
          if (tagsMap.size > 0) {
            const validation = processor.validatePrerequisites();
            if (!validation.isValid) {
              validation.errors.forEach(error => logger.error(error));
              if (config.onInlineTagsNotFound === 'error') {
                throw new Error('Prerequisite validation failed');
              }
            }
            logger.info(`Processed ${tagsMap.size} tags with educational metadata`);
          } else {
            logger.info('No tags configuration found, skipping prerequisite validation');
          }
          
          logger.info('Tags plugin routes configured successfully');
        } catch (error) {
          logger.warn(`Tags plugin initialization warning: ${error instanceof Error ? error.message : String(error)}`);
          // Don't throw error to prevent build failure - just warn
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
export { TagsProcessor } from './src/utils/tags-processor.js';