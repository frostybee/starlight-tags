/**
 * Frontmatter Schema Extension for Starlight Pages
 *
 * This schema extends Starlight's default frontmatter to add tag-related fields.
 * Users can use these fields in their MDX/MD page frontmatter:
 *
 * @example
 * ```yaml
 * ---
 * title: My Guide
 * tags:
 *   - authentication
 *   - rest-api
 * featuredTags:
 *   - authentication
 * hideTags: false
 * tagsPosition: bottom
 * ---
 * ```
 *
 * To enable these fields, users must extend their content collection schema
 * in `src/content.config.ts`:
 *
 * @example
 * ```ts
 * import { defineCollection } from 'astro:content';
 * import { docsSchema } from '@astrojs/starlight/schema';
 * import { starlightTagsExtension } from 'starlight-tags/schemas';
 *
 * export const collections = {
 *   docs: defineCollection({
 *     schema: docsSchema({ extend: starlightTagsExtension })
 *   })
 * };
 * ```
 */
import { z } from 'astro/zod';

export const frontmatterSchema = z.object({
  /** Array of tag IDs to associate with this page */
  tags: z.array(z.string()).optional(),
  /** Tags to highlight/feature on this page */
  featuredTags: z.array(z.string()).optional(),
  /** Hide the automatic tag display on this page */
  hideTags: z.boolean().default(false),
  /** Where to display tags: 'top', 'bottom', or 'both' */
  tagsPosition: z.enum(['top', 'bottom', 'both']).default('bottom')
});

export type TagsFrontmatter = z.infer<typeof frontmatterSchema>;

/**
 * Export for use with Starlight's schema extension pattern.
 * @see https://starlight.astro.build/reference/frontmatter/
 */
export const starlightTagsExtension = frontmatterSchema;