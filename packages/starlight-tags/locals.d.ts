/**
 * TypeScript declarations for Astro.locals.starlightTags
 *
 * Include this file in your project's tsconfig.json to get type support:
 *
 * ```json
 * {
 *   "include": ["node_modules/starlight-tags/locals.d.ts"]
 * }
 * ```
 *
 * Or reference it directly in a .d.ts file:
 *
 * ```typescript
 * /// <reference types="starlight-tags/locals.d.ts" />
 * ```
 */
import type { StarlightTagsData } from './src/libs/data.js';

declare global {
  namespace App {
    interface Locals {
      /**
       * Tag data injected by starlight-tags middleware.
       * Available on all Starlight pages.
       *
       * @example
       * ```astro
       * ---
       * const { tags, allTagsSorted, tagsByPage, config } = Astro.locals.starlightTags;
       *
       * // Get a specific tag by ID
       * const tag = tags.get('authentication');
       *
       * // Get all tags sorted by priority, count, and label
       * for (const tag of allTagsSorted) {
       *   console.log(tag.label, tag.count);
       * }
       *
       * // Get tags for a specific page
       * const pageTags = tagsByPage.get(pageSlug) ?? [];
       * ---
       * ```
       */
      starlightTags: StarlightTagsData;
    }
  }
}

export type { StarlightTagsData };
