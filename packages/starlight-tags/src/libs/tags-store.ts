/**
 * Tags Store - Provides memoized access to processed tags data.
 *
 * This module ensures that tags are processed only once per build,
 * regardless of how many components request tag data.
 */
import { TagsProcessor, type MinimalLogger } from './tags-processor.js';
import type { PluginConfig } from '../schemas/config.js';
import type { ProcessedTag } from '../schemas/tags.js';
import type { Locale } from './i18n.js';

// Module-level cache for the processor instance
let cachedProcessor: TagsProcessor | null = null;
let initializationPromise: Promise<void> | null = null;

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
 * Initialize the tags store with the given configuration.
 * This function is memoized - calling it multiple times will only
 * initialize once and return the cached result.
 *
 * Race condition handling:
 * - Uses atomic check-and-set pattern for the initialization promise
 * - All concurrent callers share the same promise
 * - On failure, the promise is cleared to allow retry attempts
 */
export async function initializeTagsStore(
  config: PluginConfig,
  options?: {
    /** Use verbose logging (defaults to false in production) */
    verbose?: boolean;
  }
): Promise<void> {
  // Fast path: already initialized
  if (cachedProcessor) {
    return;
  }

  // Atomic check-and-set: create the promise if not already in progress
  // This is safe because the check and assignment are synchronous (no await between them)
  if (!initializationPromise) {
    initializationPromise = performInitialization(config, options);
  }

  // All callers wait on the same shared promise
  return initializationPromise;
}

/**
 * Performs the actual initialization work.
 * Separated from initializeTagsStore to keep the atomic check-and-set pattern clean.
 */
async function performInitialization(
  config: PluginConfig,
  options?: { verbose?: boolean }
): Promise<void> {
  const logger = options?.verbose || import.meta.env.DEV ? buildLogger : silentLogger;

  try {
    // Dynamically import astro:content to get docs collection
    // @ts-expect-error - astro:content is a virtual module only available at runtime
    const { getCollection } = await import('astro:content');
    const docsEntries = await getCollection('docs');

    // Create and initialize the processor
    const processor = new TagsProcessor(config, logger, docsEntries);
    await processor.initialize();

    // Set cached processor
    cachedProcessor = processor;

    if (options?.verbose || import.meta.env.DEV) {
      logger.info(`Tags store initialized with ${processor.getTags().size} tags`);
    }
  } catch (error) {
    // Clear both promise and processor on failure to ensure consistent state
    initializationPromise = null;
    cachedProcessor = null;
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Ensures the store is initialized before accessing data.
 * Throws if called before initializeTagsStore().
 */
function ensureInitialized(): TagsProcessor {
  if (!cachedProcessor) {
    throw new Error(
      '[starlight-tags] Tags store not initialized. ' +
      'Call `await initializeTagsStore(config)` before accessing tags.'
    );
  }
  return cachedProcessor;
}

/**
 * Get a specific tag by its ID.
 */
export function getTag(tagId: string): ProcessedTag | undefined {
  return ensureInitialized().getTag(tagId);
}

/**
 * Get all tags as a Map.
 */
export function getTags(): Map<string, ProcessedTag> {
  return ensureInitialized().getTags();
}

/**
 * Get all tags sorted by count (descending) then label (ascending).
 */
export function getAllTagsSorted(locale: Locale): ProcessedTag[] {
  return ensureInitialized().getAllTagsSorted(locale);
}

/**
 * Get tags for a specific page by its slug.
 */
export function getTagsForPage(pageSlug: string): ProcessedTag[] {
  return ensureInitialized().getTagsForPage(pageSlug);
}

/**
 * Get tags filtered by difficulty level.
 */
export function getTagsByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): ProcessedTag[] {
  return ensureInitialized().getTagsByDifficulty(difficulty);
}

/**
 * Get tags filtered by content type.
 */
export function getTagsByContentType(
  contentType: 'lecture' | 'lab' | 'assignment' | 'project' | 'reference' | 'tutorial' | 'assessment'
): ProcessedTag[] {
  return ensureInitialized().getTagsByContentType(contentType);
}

/**
 * Validate that all prerequisite references are valid.
 */
export function validatePrerequisites(): { isValid: boolean; errors: string[] } {
  return ensureInitialized().validatePrerequisites();
}

/**
 * Get learning path between two tags.
 */
export function getLearningPath(startTagId: string, endTagId?: string): string[] {
  return ensureInitialized().getLearningPath(startTagId, endTagId);
}

/**
 * Check if the tags store has been initialized.
 */
export function isInitialized(): boolean {
  return cachedProcessor !== null;
}

/**
 * Reset the tags store (for testing and HMR purposes).
 * Explicitly cleans up processor data to prevent memory leaks during HMR.
 */
export function resetTagsStore(): void {
  // Cleanup processor's internal data structures before releasing reference
  cachedProcessor?.cleanup();
  cachedProcessor = null;
  initializationPromise = null;
}

// Handle Vite HMR to prevent memory leaks during development
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    resetTagsStore();
  });
}
