import { z } from 'astro/zod';

export const frontmatterSchema = z.object({
  tags: z.array(z.string()).optional(),
  featuredTags: z.array(z.string()).optional(),
  hideTags: z.boolean().default(false),
  tagsPosition: z.enum(['top', 'bottom', 'both']).default('bottom')
});

export type TagsFrontmatter = z.infer<typeof frontmatterSchema>;

// For use in Starlight content collections
export const starlightTagsExtension = frontmatterSchema;