/**
 * Core data module for starlight-tags.
 *
 * This module provides the primary data interface for accessing tag information
 * throughout your Starlight documentation site. It exports the `StarlightTagsData`
 * interface, the `getTagsData()` function, and commonly used types.
 *
 * ## Usage in Components
 *
 * Tag data is automatically available via `Astro.locals.starlightTags` on all pages
 * when using the starlight-tags middleware:
 *
 * ```astro
 * ---
 * const { tags, allTagsSorted, tagsByPage } = Astro.locals.starlightTags;
 *
 * // Get a specific tag by ID
 * const authTag = tags.get('authentication');
 *
 * // Get tags for the current page
 * const pageTags = tagsByPage.get(Astro.props.slug) ?? [];
 *
 * // Iterate all tags in display order
 * for (const tag of allTagsSorted) {
 *   console.log(tag.label, tag.count);
 * }
 * ---
 * ```
 *
 * ## Direct Import (Advanced)
 *
 * For use in `getStaticPaths()` or server-side code where middleware hasn't run:
 *
 * ```typescript
 * import { getTagsData } from 'starlight-tags/data';
 *
 * export async function getStaticPaths() {
 *   const { allTagsSorted } = await getTagsData();
 *   return allTagsSorted.map(tag => ({
 *     params: { tag: tag.slug }
 *   }));
 * }
 * ```
 *
 * ## Utility Functions
 *
 * For filtering, grouping, and other utilities, import from `starlight-tags/utils`:
 *
 * ```typescript
 * import { filterByDifficulty, getLearningPath } from 'starlight-tags/utils';
 * ```
 *
 * @module starlight-tags/data
 */
import { TagsProcessor, type MinimalLogger } from './tags-processor.js';
import type { PluginConfig } from '../schemas/config.js';
import type { ProcessedTag } from '../schemas/tags.js';

/**
 * Data structure injected into `Astro.locals.starlightTags` by the middleware.
 *
 * This is the primary interface for accessing tag data throughout your
 * Starlight documentation site. It provides multiple views of the same
 * tag data optimized for different use cases.
 *
 * @example
 * ```astro
 * ---
 * const { tags, allTagsSorted, tagsByPage, config } = Astro.locals.starlightTags;
 *
 * // Get a specific tag by ID
 * const authTag = tags.get('authentication');
 *
 * // Get all tags in display order
 * for (const tag of allTagsSorted) {
 *   console.log(tag.label, tag.count);
 * }
 *
 * // Get tags for the current page
 * const pageTags = tagsByPage.get(Astro.props.slug) ?? [];
 * ---
 * ```
 */
export interface StarlightTagsData {
  /**
   * All tags as a Map for O(1) lookup by tag ID.
   * Keys are tag IDs as defined in `tags.yml`.
   *
   * Use this when you need to:
   * - Look up a specific tag by its ID
   * - Check if a tag exists
   * - Iterate over all tags with their IDs
   *
   * @example
   * ```typescript
   * const { tags } = Astro.locals.starlightTags;
   *
   * // Get a specific tag
   * const tag = tags.get('authentication');
   * if (tag) {
   *   console.log(tag.label, tag.count, tag.url);
   * }
   *
   * // Check if tag exists
   * if (tags.has('deprecated-feature')) {
   *   // handle deprecated tag
   * }
   *
   * // Iterate all tags with IDs
   * for (const [id, tag] of tags) {
   *   console.log(`${id}: ${tag.label}`);
   * }
   * ```
   */
  tags: Map<string, ProcessedTag>;

  /**
   * All tags sorted by priority (descending), then count (descending), then label (ascending).
   *
   * Use this for displaying tag lists in a consistent, user-friendly order.
   * Higher priority tags appear first, then more popular tags, then alphabetically.
   *
   * @example
   * ```astro
   * ---
   * const { allTagsSorted } = Astro.locals.starlightTags;
   * ---
   * <nav class="tag-cloud">
   *   {allTagsSorted.map(tag => (
   *     <a href={tag.url} class="tag-link">
   *       {tag.label} ({tag.count})
   *     </a>
   *   ))}
   * </nav>
   * ```
   *
   * @example
   * ```typescript
   * // Filter to only visible tags (non-hidden)
   * const visibleTags = allTagsSorted.filter(tag => !tag.hidden);
   *
   * // Get top 10 most used tags
   * const popularTags = allTagsSorted
   *   .sort((a, b) => b.count - a.count)
   *   .slice(0, 10);
   * ```
   */
  allTagsSorted: ProcessedTag[];

  /**
   * Map of page slugs to their associated tags for O(1) lookup.
   *
   * Use this to efficiently get all tags for a specific page without
   * iterating through all tags. Page slugs match the format used in
   * Astro content collections (e.g., 'guides/authentication').
   *
   * @example
   * ```typescript
   * const { tagsByPage } = Astro.locals.starlightTags;
   *
   * // Get tags for current page
   * const currentPageSlug = Astro.props.slug; // e.g., 'guides/getting-started'
   * const pageTags = tagsByPage.get(currentPageSlug) ?? [];
   *
   * // Display tags for the page
   * for (const tag of pageTags) {
   *   console.log(tag.label, tag.url);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Using the utility function (recommended)
   * import { getTagsForPage } from 'starlight-tags/data';
   *
   * const { tagsByPage } = Astro.locals.starlightTags;
   * const pageTags = getTagsForPage(tagsByPage, Astro.props.slug);
   * ```
   */
  tagsByPage: Map<string, ProcessedTag[]>;

  /**
   * Plugin configuration as resolved from user options.
   * Includes defaults for any unspecified options.
   *
   * Useful for accessing configuration values like URL prefixes
   * or pagination settings in custom components.
   *
   * @example
   * ```typescript
   * const { config } = Astro.locals.starlightTags;
   *
   * console.log(config.tagsPagesPrefix); // 'tags' (default)
   * console.log(config.itemsPerPage);    // 12 (default)
   * console.log(config.tagsIndexSlug);   // 'tags' (default)
   * ```
   */
  config: PluginConfig;
}

// Per-locale cache to avoid reprocessing
const dataCache = new Map<string, StarlightTagsData>();

// Initialization promise per locale (prevents concurrent initialization)
const initPromises = new Map<string, Promise<StarlightTagsData>>();

// Per-locale processor cache (labels are resolved per locale)
const processorCache = new Map<string, TagsProcessor>();
let cachedConfig: PluginConfig | null = null;

// Silent logger for production use
const silentLogger: MinimalLogger = {
  info: () => {},
  warn: () => {},
  error: () => {}
};

// Build logger for development
const buildLogger: MinimalLogger = {
  info: (msg: string) => console.info(`[starlight-tags] ${msg}`),
  warn: (msg: string) => console.warn(`[starlight-tags] ${msg}`),
  error: (msg: string) => console.error(`[starlight-tags] ${msg}`)
};

/**
 * Initialize the processor for a specific locale if not already done.
 * Creates locale-specific processors to resolve localized tag labels.
 * Includes proper cleanup on error to prevent memory leaks.
 *
 * @param locale - Optional locale code for i18n label resolution
 */
async function ensureProcessor(locale?: string): Promise<TagsProcessor> {
  const cacheKey = locale ?? 'root';

  if (processorCache.has(cacheKey)) {
    return processorCache.get(cacheKey)!;
  }

  let processor: TagsProcessor | null = null;

  try {
    // Import config from virtual module (shared across locales)
    if (!cachedConfig) {
      // @ts-expect-error - virtual module only available at runtime
      const { config } = await import('virtual:starlight-tagging/config');
      cachedConfig = config;
    }

    const logger = import.meta.env.DEV ? buildLogger : silentLogger;

    // Import astro:content to get docs collection
    const { getCollection } = await import('astro:content');
    const docsEntries = await getCollection('docs');

    // Create and initialize the processor with locale for i18n label resolution
    processor = new TagsProcessor(cachedConfig!, logger, docsEntries, locale);
    await processor.initialize();

    processorCache.set(cacheKey, processor);

    if (import.meta.env.DEV) {
      logger.info(`Tags processor initialized for locale "${cacheKey}" with ${processor.getTags().size} tags`);
    }

    return processor;
  } catch (error) {
    // Clean up partially initialized state to prevent memory leaks
    if (processor) {
      processor.cleanup();
    }
    throw error;
  }
}

/**
 * Build a map of page slugs to their tags for O(1) lookup.
 */
function buildTagsByPageMap(processor: TagsProcessor): Map<string, ProcessedTag[]> {
  const map = new Map<string, ProcessedTag[]>();

  for (const tag of processor.getTags().values()) {
    for (const page of tag.pages) {
      const existing = map.get(page.slug) || [];
      existing.push(tag);
      map.set(page.slug, existing);
    }
  }

  return map;
}

/**
 * Get processed tags data, optionally for a specific locale.
 * This is the primary data access function for the middleware.
 *
 * Data is cached per-locale to avoid reprocessing on every request.
 * Concurrent calls for the same locale share the same initialization promise.
 *
 * @param locale - Optional locale code for i18n support
 * @returns Promise resolving to StarlightTagsData
 *
 * @example
 * ```typescript
 * // In middleware
 * const data = await getTagsData(locale);
 * context.locals.starlightTags = data;
 *
 * // In getStaticPaths (direct import)
 * import { getTagsData } from 'starlight-tags/data';
 * const { allTagsSorted } = await getTagsData();
 * ```
 */
export async function getTagsData(locale?: string): Promise<StarlightTagsData> {
  const cacheKey = locale ?? 'root';

  // Fast path: return cached data if available
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey)!;
  }

  // Check for in-flight initialization
  if (initPromises.has(cacheKey)) {
    return initPromises.get(cacheKey)!;
  }

  // Create the initialization promise
  // IMPORTANT: Set in map BEFORE any async work to prevent race conditions
  const initPromise = (async (): Promise<StarlightTagsData> => {
    try {
      const processor = await ensureProcessor(locale);

      // Build the data structure
      const data: StarlightTagsData = {
        tags: processor.getTags(),
        allTagsSorted: processor.getAllTagsSorted(),
        tagsByPage: buildTagsByPageMap(processor),
        config: cachedConfig!
      };

      // Cache the result
      dataCache.set(cacheKey, data);

      return data;
    } finally {
      // Clean up the promise reference
      initPromises.delete(cacheKey);
    }
  })();

  // Store the promise IMMEDIATELY to prevent concurrent initialization
  // This must happen synchronously before returning to prevent race conditions
  initPromises.set(cacheKey, initPromise);

  return initPromise;
}

/**
 * Reset the data cache.
 * Used for testing and HMR to clear cached data.
 */
export function resetDataCache(): void {
  dataCache.clear();
  initPromises.clear();
  // Cleanup all locale-specific processors
  for (const processor of processorCache.values()) {
    processor.cleanup();
  }
  processorCache.clear();
  cachedConfig = null;
}

// Handle Vite HMR to prevent memory leaks during development
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    resetDataCache();
  });
}

// =============================================================================
// Type re-exports
// =============================================================================

/**
 * Re-export types from starlight-tags/schemas/tags.
 * These can be imported directly from 'starlight-tags/data' for convenience.
 */
export type {
  ProcessedTag,
  PageReference,
  TagDefinition,
  Difficulty,
  ContentType,
} from '../schemas/tags.js';

/**
 * Re-export PluginConfig type.
 */
export type { PluginConfig } from '../schemas/config.js';
