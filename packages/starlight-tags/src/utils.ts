/**
 * Standalone utility functions for starlight-tags.
 *
 * These functions accept data as arguments rather than accessing global state,
 * making them usable both with middleware data and direct imports.
 *
 * @example
 * ```astro
 * ---
 * import { getLearningPath, validatePrerequisites } from 'starlight-tags/utils';
 *
 * const { tags } = Astro.locals.starlightTags;
 * const path = getLearningPath(tags, 'js-basics', 'js-async');
 * const { isValid, errors } = validatePrerequisites(tags);
 * ---
 * ```
 */
import type { ProcessedTag } from './schemas/tags.js';

/**
 * Get learning path between two tags using BFS.
 *
 * @param tags - Tags map from StarlightTagsData
 * @param startTagId - Starting tag ID
 * @param endTagId - Optional ending tag ID. If not provided, returns immediate next steps.
 * @returns Array of tag IDs representing the learning path
 *
 * @example
 * ```typescript
 * const { tags } = Astro.locals.starlightTags;
 *
 * // Get immediate next steps from a tag
 * const nextSteps = getLearningPath(tags, 'js-basics');
 *
 * // Get full path between two tags
 * const path = getLearningPath(tags, 'js-basics', 'js-async');
 * // Returns: ['js-basics', 'js-functions', 'js-promises', 'js-async']
 * ```
 */
export function getLearningPath(
  tags: Map<string, ProcessedTag>,
  startTagId: string,
  endTagId?: string
): string[] {
  const startTag = tags.get(startTagId);
  if (!startTag) return [];

  // If no end tag specified, return immediate next steps
  if (!endTagId) {
    return startTag.nextSteps || [];
  }

  const endTag = tags.get(endTagId);
  if (!endTag) return [];

  // BFS to find shortest path
  const visited = new Set([startTagId]);
  const queue = [startTagId];
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === endTagId) {
      // Reconstruct path from end to start
      const path: string[] = [];
      let node: string | undefined = endTagId;
      while (node && parent.has(node)) {
        path.unshift(node);
        node = parent.get(node);
      }
      path.unshift(startTagId);
      return path;
    }

    const currentTag = tags.get(current);
    for (const nextStep of currentTag?.nextSteps || []) {
      if (!visited.has(nextStep)) {
        visited.add(nextStep);
        parent.set(nextStep, current);
        queue.push(nextStep);
      }
    }
  }

  return [];
}

/**
 * Validate that all prerequisite references are valid.
 *
 * @param tags - Tags map from StarlightTagsData
 * @returns Validation result with isValid boolean and errors array
 *
 * @example
 * ```typescript
 * const { tags } = Astro.locals.starlightTags;
 * const { isValid, errors } = validatePrerequisites(tags);
 *
 * if (!isValid) {
 *   console.error('Invalid prerequisites:', errors);
 * }
 * ```
 */
export function validatePrerequisites(
  tags: Map<string, ProcessedTag>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [tagId, tag] of tags) {
    for (const prereqId of tag.prerequisites || []) {
      if (!tags.has(prereqId)) {
        errors.push(`Tag "${tagId}" has invalid prerequisite "${prereqId}"`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Filter tags by difficulty level.
 *
 * @param tags - Array of ProcessedTag (typically allTagsSorted)
 * @param difficulty - Difficulty level to filter by
 * @returns Filtered array of tags with the specified difficulty
 *
 * @example
 * ```typescript
 * const { allTagsSorted } = Astro.locals.starlightTags;
 * const beginnerTags = filterByDifficulty(allTagsSorted, 'beginner');
 * ```
 */
export function filterByDifficulty(
  tags: ProcessedTag[],
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): ProcessedTag[] {
  return tags.filter(tag => tag.difficulty === difficulty);
}

/**
 * Filter tags by content type.
 *
 * @param tags - Array of ProcessedTag (typically allTagsSorted)
 * @param contentType - Content type to filter by
 * @returns Filtered array of tags with the specified content type
 *
 * @example
 * ```typescript
 * const { allTagsSorted } = Astro.locals.starlightTags;
 * const tutorials = filterByContentType(allTagsSorted, 'tutorial');
 * ```
 */
export function filterByContentType(
  tags: ProcessedTag[],
  contentType: 'lecture' | 'lab' | 'assignment' | 'project' | 'reference' | 'tutorial' | 'assessment'
): ProcessedTag[] {
  return tags.filter(tag => tag.contentType === contentType);
}

/**
 * Get tags for a specific page from the tags map.
 *
 * @param tagsByPage - Map from StarlightTagsData.tagsByPage
 * @param pageSlug - The page slug to look up
 * @returns Array of tags for the page, or empty array if none found
 *
 * @example
 * ```typescript
 * const { tagsByPage } = Astro.locals.starlightTags;
 * const pageTags = getTagsForPage(tagsByPage, Astro.props.slug);
 * ```
 */
export function getTagsForPage(
  tagsByPage: Map<string, ProcessedTag[]>,
  pageSlug: string
): ProcessedTag[] {
  return tagsByPage.get(pageSlug) ?? [];
}

/**
 * Group tags by their first letter for alphabetical display.
 *
 * @param tags - Array of ProcessedTag
 * @returns Map of first letter -> array of tags
 *
 * @example
 * ```typescript
 * const { allTagsSorted } = Astro.locals.starlightTags;
 * const grouped = groupTagsByLetter(allTagsSorted);
 * // { A: [...], B: [...], ... }
 * ```
 */
export function groupTagsByLetter(
  tags: ProcessedTag[]
): Map<string, ProcessedTag[]> {
  const groups = new Map<string, ProcessedTag[]>();

  for (const tag of tags) {
    const letter = tag.label.charAt(0).toUpperCase();
    const existing = groups.get(letter) || [];
    existing.push(tag);
    groups.set(letter, existing);
  }

  return groups;
}

/**
 * Calculate popularity tier for a tag based on its count relative to max.
 *
 * @param count - The tag's page count
 * @param maxCount - The maximum count among all tags
 * @returns Popularity tier from 1 (least popular) to 5 (most popular)
 *
 * @example
 * ```typescript
 * const { allTagsSorted } = Astro.locals.starlightTags;
 * const maxCount = Math.max(...allTagsSorted.map(t => t.count));
 *
 * for (const tag of allTagsSorted) {
 *   const tier = getPopularityTier(tag.count, maxCount);
 *   // Use tier for font size, color intensity, etc.
 * }
 * ```
 */
export function getPopularityTier(count: number, maxCount: number): 1 | 2 | 3 | 4 | 5 {
  if (maxCount === 0) return 1;
  const ratio = count / maxCount;

  if (ratio >= 0.8) return 5;
  if (ratio >= 0.6) return 4;
  if (ratio >= 0.4) return 3;
  if (ratio >= 0.2) return 2;
  return 1;
}
