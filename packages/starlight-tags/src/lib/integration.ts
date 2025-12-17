import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { PluginConfig } from '../schemas/config.js';

/**
 * Creates the Astro integration for Starlight Tags plugin.
 * Handles route injection, config resolution, and validation.
 */
export function createTagsIntegration(
  config: PluginConfig,
  logger: AstroIntegrationLogger
): AstroIntegration {
  // Store resolved config path for later use
  let resolvedConfig: PluginConfig = config;

  return {
    name: 'starlight-tags-routes',
    hooks: {
      'astro:config:setup': ({ injectRoute, addWatchFile, updateConfig, config: astroConfig }) => {
        // Resolve configPath relative to Astro root directory
        const astroRoot = fileURLToPath(astroConfig.root);
        const absoluteConfigPath = path.isAbsolute(config.configPath)
          ? config.configPath
          : path.resolve(astroRoot, config.configPath);

        // Create resolved config with absolute path
        resolvedConfig = {
          ...config,
          configPath: absoluteConfigPath
        };

        logger.info(`Resolved tags config path: ${absoluteConfigPath}`);

        // Watch tags configuration file
        addWatchFile(absoluteConfigPath);

        // Inject virtual routes for tags using absolute paths
        const tagsIndexPath = fileURLToPath(new URL('../pages/tags-index.astro', import.meta.url));
        const tagPagePath = fileURLToPath(new URL('../pages/tag-page.astro', import.meta.url));

        // Inject routes with optional locale prefix for i18n support
        injectRoute({
          pattern: `/${config.tagsIndexSlug}`,
          entrypoint: tagsIndexPath
        });

        injectRoute({
          pattern: `/[...locale]/${config.tagsIndexSlug}`,
          entrypoint: tagsIndexPath
        });

        injectRoute({
          pattern: `/${config.tagsPagesPrefix}/[tag]`,
          entrypoint: tagPagePath
        });

        injectRoute({
          pattern: `/[...locale]/${config.tagsPagesPrefix}/[tag]`,
          entrypoint: tagPagePath
        });

        // Inject virtual module for config with resolved absolute path
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'vite-plugin-starlight-tagging-config',
                resolveId(id) {
                  if (id === 'virtual:starlight-tagging/config') {
                    return '\0' + id;
                  }
                },
                load(id) {
                  if (id === '\0virtual:starlight-tagging/config') {
                    return `export const config = ${JSON.stringify(resolvedConfig)};`;
                  }
                }
              }
            ]
          }
        });
      },

      'astro:config:done': () => {
        logger.info('Tags plugin routes configured successfully');
      }
    }
  };
}
