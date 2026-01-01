/**
 * Combined Extended Tag Schema
 *
 * Demonstrates how to extend the base tag schema with MULTIPLE custom field sets.
 * Combines educational properties (difficulty, prerequisites) with product
 * properties (planTier, product) in a single schema.
 */
import { z } from 'astro/zod';
import { tagDefinitionSchema } from 'starlight-tags/schemas/tags';

/**
 * Combined schema with both educational and product fields.
 * Tags can have either, both, or neither set of extended fields.
 */
export const extendedTagSchema = tagDefinitionSchema.extend({
  // ===== Educational Fields =====
  /** Difficulty level of the content */
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  /** Type of educational content */
  contentType: z
    .enum(['lecture', 'lab', 'assignment', 'project', 'reference', 'tutorial', 'assessment'])
    .optional(),
  /** Tags that should be understood first */
  prerequisites: z.array(z.string()).optional(),

  // ===== Product Fields =====
  /** Product name this tag belongs to (e.g., "Platform", "Analytics") */
  product: z.string().optional(),
  /** Pricing tier required to access this feature */
  planTier: z.enum(['free', 'pro', 'enterprise']).optional(),
});

/** Tag definition with all extended properties */
export type ExtendedTag = z.infer<typeof extendedTagSchema>;

/** Difficulty level type for type-safe filtering */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/** Plan tier type for type-safe filtering */
export type PlanTier = 'free' | 'pro' | 'enterprise';

/** Content type for educational materials */
export type ContentType =
  | 'lecture'
  | 'lab'
  | 'assignment'
  | 'project'
  | 'reference'
  | 'tutorial'
  | 'assessment';
