import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { PluginConfig } from '../schemas/config.js';
import { vitePluginStarlightTags } from './vite.js';

/**
 * Creates the Astro integration for Starlight Tags plugin.
 * Handles route injection, config resolution, and validation.
 */
export function createTagsIntegration(
  config: PluginConfig,
  logger: AstroIntegrationLogger
): AstroIntegration {
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

        // Get base path from Astro config (remove trailing slash for consistency)
        const basePath = (astroConfig.base || '').replace(/\/$/, '');

        // Create resolved config with absolute path and base path
        resolvedConfig = {
          ...config,
          configPath: absoluteConfigPath,
          basePath
        };

        logger.info(`Resolved tags config path: ${absoluteConfigPath}`);

        // Watch tags configuration file
        addWatchFile(absoluteConfigPath);

        // Inject virtual routes for tags
        const tagsIndexPath = fileURLToPath(new URL('../pages/tags-index.astro', import.meta.url));
        const tagPagePath = fileURLToPath(new URL('../pages/tag-page.astro', import.meta.url));

        // Inject routes with optional locale prefix for i18n support
        // Using [...locale] rest parameter handles both localized (/en/tags/...)
        // and non-localized (/tags/...) paths in a single route
        injectRoute({
          pattern: `/[...locale]/${config.tagsIndexSlug}`,
          entrypoint: tagsIndexPath
        });

        injectRoute({
          pattern: `/[...locale]/${config.tagsPagesPrefix}/[tag]`,
          entrypoint: tagPagePath
        });

        // Get path to tags-store for virtual module
        const tagsStorePath = fileURLToPath(new URL('./tags-store.js', import.meta.url));

        // Inject virtual modules via Vite plugin
        updateConfig({
          vite: {
            plugins: [vitePluginStarlightTags(resolvedConfig, tagsStorePath)]
          }
        });
      },

      'astro:config:done': () => {
        logger.info('Tags plugin routes configured successfully');
      }
    }
  };
}
