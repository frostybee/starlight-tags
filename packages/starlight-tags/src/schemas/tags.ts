import { z } from 'astro/zod';

// Regex for valid CSS color values (hex, named colors, rgb/hsl functions)
// Matches:
// - Hex colors: #fff, #ffffff, #ffffffff (3, 4, 6, or 8 hex digits)
// - Named colors: blue, red, transparent, etc. (lowercase letters only)
// - RGB/RGBA: rgb(0, 0, 0), rgba(0, 0, 0, 0.5), rgb(0 0 0), rgb(0 0 0 / 50%)
// - HSL/HSLA: hsl(0, 0%, 0%), hsla(0, 0%, 0%, 0.5), hsl(0 0% 0%)
const colorRegex = /^(#[0-9A-Fa-f]{3}|#[0-9A-Fa-f]{4}|#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i;
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

// Regex for valid tag IDs (alphanumeric with hyphens/underscores)
const tagIdRegex = /^[a-zA-Z0-9_-]+$/;

export const tagsConfigSchema = z.object({
  tags: z.record(
    z.string().regex(tagIdRegex, 'Tag ID must contain only alphanumeric characters, hyphens, and underscores'),
    tagDefinitionSchema
  ),
  defaults: z.object({
    color: z.string().regex(colorRegex, 'Invalid color format').optional(),
    showInSidebar: z.boolean().default(true)
  }).optional()
});

export type TagDefinition = z.infer<typeof tagDefinitionSchema>;
export type TagsConfig = z.infer<typeof tagsConfigSchema>;

/** Reference to a page that uses a tag */
export type PageReference = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  frontmatter?: Record<string, unknown>;
};

// Enhanced tag definition with computed properties
export type ProcessedTag = TagDefinition & {
  id: string;
  slug: string;
  url: string;
  count: number;
  pages: PageReference[];
  // Educational computed properties
  relatedTags?: string[];
  prerequisiteChain?: string[];
  nextSteps?: string[];
};