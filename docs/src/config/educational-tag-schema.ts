/**
 * Extended Tag Schema for Educational Properties
 *
 * This demonstrates how to extend the base tag schema with custom fields
 * for educational and difficulty-based documentation.
 */
import { z } from 'astro/zod';
import { tagDefinitionSchema } from 'starlight-tags/schemas/tags';

/**
 * Extended schema with educational properties.
 * Adds `difficulty` and `contentType` to the base tag definition.
 */
export const educationalTagSchema = tagDefinitionSchema.extend({
  /** Difficulty level of the content */
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  /** Type of educational content */
  contentType: z.enum(['lecture', 'lab', 'assignment', 'project', 'reference', 'tutorial', 'assessment']).optional(),
  /** Tags that should be understood first */
  prerequisites: z.array(z.string()).optional(),
});

/** Tag definition with educational properties */
export type EducationalTag = z.infer<typeof educationalTagSchema>;

/** Difficulty level type for type-safe filtering */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
