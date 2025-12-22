declare module 'virtual:starlight-tagging/config' {
  import type { PluginConfig } from './src/schemas/config.js';

  export const config: PluginConfig;
}

declare module 'virtual:starlight-tagging/tags' {
  import type { ProcessedTag } from './src/schemas/tags.js';

  /**
   * Initialize the tags store. Must be called once before using other functions.
   * This is memoized - subsequent calls are no-ops.
   */
  export function initTags(options?: { verbose?: boolean }): Promise<void>;

  /**
   * Get a specific tag by its ID.
   */
  export function getTag(tagId: string): ProcessedTag | undefined;

  /**
   * Get all tags as a Map.
   */
  export function getTags(): Map<string, ProcessedTag>;

  /**
   * Get all tags sorted by count (descending) then label (ascending).
   */
  export function getAllTagsSorted(): ProcessedTag[];

  /**
   * Get tags for a specific page by its slug.
   */
  export function getTagsForPage(pageSlug: string): ProcessedTag[];

  /**
   * Get tags filtered by difficulty level.
   */
  export function getTagsByDifficulty(
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): ProcessedTag[];

  /**
   * Get tags filtered by content type.
   */
  export function getTagsByContentType(
    contentType: 'lecture' | 'lab' | 'assignment' | 'project' | 'reference' | 'tutorial' | 'assessment'
  ): ProcessedTag[];

  /**
   * Validate that all prerequisite references are valid.
   */
  export function validatePrerequisites(): { isValid: boolean; errors: string[] };

  /**
   * Get learning path between two tags.
   */
  export function getLearningPath(startTagId: string, endTagId?: string): string[];

  /**
   * Check if the tags store has been initialized.
   */
  export function isInitialized(): boolean;

  /**
   * Reset the tags store (mainly for testing purposes).
   */
  export function resetTagsStore(): void;
}
