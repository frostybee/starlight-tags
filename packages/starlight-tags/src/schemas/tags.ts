import { z } from 'astro/zod';

// Regex for valid CSS color values (hex, named colors, rgb/hsl)
const colorRegex = /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-z]+)$/i;
// Regex for URL-safe slugs
const permalinkRegex = /^[a-z0-9][a-z0-9-/]*[a-z0-9]$|^[a-z0-9]$/i;

export const tagDefinitionSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  color: z.string().regex(colorRegex, 'Invalid color format. Use hex (#fff), named color (blue), or rgb/hsl').optional(),
  icon: z.string().optional(), // emoji or short text
  permalink: z.string().regex(permalinkRegex, 'Permalink must be URL-safe (lowercase letters, numbers, hyphens)').optional(),
  hidden: z.boolean().optional(), // hide from tag index but still functional
  // Educational metadata
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  contentType: z.enum(['lecture', 'tutorial', 'exercise', 'reference', 'assessment']).optional(),
  subject: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.enum(['conceptual', 'practical', 'problem-solving', 'analytical'])).optional(),
  estimatedTime: z.number().optional(), // in minutes
  skillLevel: z.number().min(1).max(10).optional(),
});

export const tagsConfigSchema = z.object({
  tags: z.record(z.string(), tagDefinitionSchema),
  defaults: z.object({
    color: z.string().regex(colorRegex, 'Invalid color format').optional(),
    showInSidebar: z.boolean().default(true)
  }).optional()
});

export type TagDefinition = z.infer<typeof tagDefinitionSchema>;
export type TagsConfig = z.infer<typeof tagsConfigSchema>;

// Enhanced tag definition with computed properties
export interface ProcessedTag extends TagDefinition {
  id: string;
  slug: string;
  url: string;
  count: number;
  pages: Array<{
    id: string;
    slug: string;
    title: string;
    description?: string;
    tags?: string[];
    frontmatter?: Record<string, any>;
  }>;
  // Educational computed properties
  relatedTags?: string[];
  prerequisiteChain?: string[];
  nextSteps?: string[];
}