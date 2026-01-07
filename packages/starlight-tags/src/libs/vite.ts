import type { Plugin } from 'vite';
import type { PluginConfig } from '../schemas/config.js';

const resolveVirtualModuleId = <T extends string>(id: T): `\0${T}` => `\0${id}`;

const moduleNames = [
  'virtual:starlight-tagging/config',
  'virtual:starlight-tagging/tags',
] as const;

type ModuleName = (typeof moduleNames)[number];

/**
 * Creates the Vite plugin for Starlight Tags virtual modules.
 */
export function vitePluginStarlightTags(
  config: PluginConfig,
  tagsStorePath: string,
  labelHelperPath: string
): Plugin {
  const resolvedModuleIds = Object.fromEntries(
    moduleNames.map((name) => [resolveVirtualModuleId(name), name])
  ) as Record<`\0${ModuleName}`, ModuleName>;

  const modules: Record<ModuleName, string> = {
    'virtual:starlight-tagging/config': `export const config = ${JSON.stringify(config)};`,
    'virtual:starlight-tagging/tags': getTagsVirtualModule(config, tagsStorePath, labelHelperPath),
  };

  return {
    name: 'vite-plugin-starlight-tagging',
    resolveId(id) {
      if (moduleNames.includes(id as ModuleName)) {
        return resolveVirtualModuleId(id as ModuleName);
      }
    },
    load(id) {
      const moduleName = resolvedModuleIds[id as keyof typeof resolvedModuleIds];
      if (moduleName) {
        return modules[moduleName];
      }
    },
  };
}

/**
 * Normalizes a file path for use in ES module imports.
 * Handles Windows backslashes, mixed separators, and ensures forward slashes.
 */
function normalizeImportPath(filePath: string): string {
  // Normalize all backslashes to forward slashes
  let normalized = filePath.replace(/\\/g, '/');

  // Resolve any .. or . segments manually for edge cases
  const parts = normalized.split('/');
  const result: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else if (part !== '.' && part !== '') {
      result.push(part);
    }
  }

  // Preserve leading slash or drive letter
  const prefix = normalized.startsWith('/') ? '/' : '';
  return prefix + result.join('/');
}

/**
 * Generates the virtual module content for starlight-tagging/tags.
 */
function getTagsVirtualModule(config: PluginConfig, tagsStorePath: string, labelHelperPath: string): string {
  // Normalize path for cross-platform compatibility (especially Windows)
  const normalizedTagsStorePath = normalizeImportPath(tagsStorePath);
  const normalizedLabelHelperPath = normalizeImportPath(tagsStorePath);

  return `
import {
  initializeTagsStore,
  getTag,
  getTags,
  getAllTagsSorted,
  getTagsForPage,
  getTagsByDifficulty,
  getTagsByContentType,
  validatePrerequisites,
  getLearningPath,
  isInitialized,
  resetTagsStore
} from '${normalizedTagsStorePath}';
import {
  getTagLabel,
  getTagDescription
} from '${normalizedLabelHelperPath}';

const config = ${JSON.stringify(config)};

/**
 * Initialize the tags store. Must be called once before using other functions.
 * This is memoized - subsequent calls are no-ops.
 *
 * @param {Object} options - Optional configuration
 * @param {boolean} options.verbose - Enable verbose logging
 * @returns {Promise<void>}
 * @throws {Error} If initialization fails (e.g., invalid tags.yml)
 */
export async function initTags(options) {
  return await initializeTagsStore(config, options);
}

// Re-export all helper functions
export {
  getTag,
  getTags,
  getAllTagsSorted,
  getTagsForPage,
  getTagsByDifficulty,
  getTagsByContentType,
  validatePrerequisites,
  getLearningPath,
  isInitialized,
  resetTagsStore,
  getTagLabel,
  getTagDescription  
};
`;
}
