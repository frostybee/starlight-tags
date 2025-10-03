import { z } from 'astro/zod';

export const tagDefinitionSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  permalink: z.string().optional(),
  // Educational metadata
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  contentType: z.enum(['lecture', 'tutorial', 'exercise', 'reference', 'assessment']).optional(),
  subject: z.string().optional(),
  prerequisites: z.array(z.string()).default([]),
  learningObjectives: z.array(z.enum(['conceptual', 'practical', 'problem-solving', 'analytical'])).default([]),
  estimatedTime: z.number().optional(), // in minutes
  skillLevel: z.number().min(1).max(10).optional(),
});

export const tagsConfigSchema = z.object({
  tags: z.record(z.string(), tagDefinitionSchema),
  defaults: z.object({
    color: z.string().optional(),
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