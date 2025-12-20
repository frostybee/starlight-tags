/**
 * Tags Store - Provides memoized access to processed tags data.
 *
 * This module ensures that tags are processed only once per build,
 * regardless of how many components request tag data.
 */
import { TagsProcessor, type MinimalLogger } from './tags-processor.js';
import type { PluginConfig } from '../schemas/config.js';
import type { ProcessedTag } from '../schemas/tags.js';

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
 */
export async function initializeTagsStore(
  config: PluginConfig,
  options?: {
    /** Use verbose logging (defaults to false in production) */
    verbose?: boolean;
  }
): Promise<void> {
  // Return early if already initialized
  if (cachedProcessor) {
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    const logger = options?.verbose || import.meta.env.DEV ? buildLogger : silentLogger;

    try {
      // Dynamically import astro:content to get docs collection
      // @ts-expect-error - astro:content is a virtual module only available at runtime
      const { getCollection } = await import('astro:content');
      const docsEntries = await getCollection('docs');

      // Create and initialize the processor
      cachedProcessor = new TagsProcessor(config, logger, docsEntries);
      await cachedProcessor.initialize();

      if (options?.verbose || import.meta.env.DEV) {
        logger.info(`Tags store initialized with ${cachedProcessor.getTags().size} tags`);
      }
    } catch (error) {
      // Reset state on error so retry is possible
      cachedProcessor = null;
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
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
export function getAllTagsSorted(): ProcessedTag[] {
  return ensureInitialized().getAllTagsSorted();
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
 * Get tags filtered by subject.
 */
export function getTagsBySubject(subject: string): ProcessedTag[] {
  return ensureInitialized().getTagsBySubject(subject);
}

/**
 * Get tags filtered by content type.
 */
export function getTagsByContentType(
  contentType: 'lecture' | 'tutorial' | 'exercise' | 'reference' | 'assessment'
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
 * Reset the tags store (mainly for testing purposes).
 */
export function resetTagsStore(): void {
  cachedProcessor = null;
  initializationPromise = null;
}
