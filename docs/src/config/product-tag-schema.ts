/**
 * Extended Tag Schema for Product Documentation
 *
 * This demonstrates how to extend the base tag schema with custom fields
 * for product documentation use cases.
 */
import { z } from 'astro/zod';
import { tagDefinitionSchema } from 'starlight-tags/schemas/tags';

/**
 * Extended schema with product documentation fields.
 * Adds `product` and `planTier` to the base tag definition.
 */
export const productTagSchema = tagDefinitionSchema.extend({
  /** Product name this tag belongs to (e.g., "Platform", "Analytics") */
  product: z.string().optional(),
  /** Pricing tier required to access this feature */
  planTier: z.enum(['free', 'pro', 'enterprise']).optional(),
});

/** Tag definition with product documentation fields */
export type ProductTag = z.infer<typeof productTagSchema>;

/** Plan tier type for type-safe filtering */
export type PlanTier = 'free' | 'pro' | 'enterprise';
