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

        // Validate that config path is within project root (defense-in-depth)
        const normalizedConfigPath = path.normalize(absoluteConfigPath);
        const normalizedRoot = path.normalize(astroRoot);

        // Reject Windows UNC paths (\\server\share) for security
        if (normalizedConfigPath.startsWith('\\\\')) {
          throw new Error(
            `[starlight-tags] UNC paths are not allowed for security reasons.\n` +
            `  Attempted path: ${normalizedConfigPath}`
          );
        }

        // Use path.relative() to detect path traversal attempts
        const relativePath = path.relative(normalizedRoot, normalizedConfigPath);

        // Check if path escapes project root (starts with '..' or is absolute)
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
          throw new Error(
            `[starlight-tags] Config path must be within project root.\n` +
            `  Resolved path: ${normalizedConfigPath}\n` +
            `  Project root: ${normalizedRoot}`
          );
        }

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

        // Route pattern supports pagination: /tags/[tag]/ and /tags/[tag]/2, /tags/[tag]/3, etc.
        // The [...page] rest param is empty for page 1, or contains page number for page 2+
        injectRoute({
          pattern: `/[...locale]/${config.tagsPagesPrefix}/[tag]/[...page]`,
          entrypoint: tagPagePath
        });

        // Inject config virtual module via Vite plugin
        updateConfig({
          vite: {
            plugins: [vitePluginStarlightTags(resolvedConfig)]
          }
        });
      },

      'astro:config:done': () => {
        logger.info('Tags plugin routes configured successfully');
      }
    }
  };
}
