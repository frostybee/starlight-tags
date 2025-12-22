/**
 * Product Documentation Filter Utilities
 *
 * Demonstrates how to filter tags by custom extended fields.
 * Use these patterns to create your own filters for custom schema fields.
 */
import { getTags } from 'virtual:starlight-tagging/tags';
import type { ProcessedTag } from 'starlight-tags/schemas/tags';
import type { ProductTag, PlanTier } from '../config/product-tag-schema';

/** Extended tag type combining ProcessedTag with custom ProductTag fields */
type ExtendedTag = ProcessedTag & ProductTag;

/**
 * Get all tags with a specific plan tier.
 *
 * @example
 * ```typescript
 * const freeTags = getTagsByPlanTier('free');
 * const proTags = getTagsByPlanTier('pro');
 * ```
 */
export function getTagsByPlanTier(tier: PlanTier): ExtendedTag[] {
  return Array.from(getTags().values())
    .filter((tag): tag is ExtendedTag =>
      (tag as ExtendedTag).planTier === tier
    );
}

/**
 * Get all tags belonging to a specific product.
 *
 * @example
 * ```typescript
 * const platformTags = getTagsByProduct('Platform');
 * const sdkTags = getTagsByProduct('SDKs');
 * ```
 */
export function getTagsByProduct(product: string): ExtendedTag[] {
  return Array.from(getTags().values())
    .filter((tag): tag is ExtendedTag =>
      (tag as ExtendedTag).product === product
    );
}

/**
 * Get all unique product names from tags.
 *
 * @example
 * ```typescript
 * const products = getAllProducts(); // ['Platform', 'SDKs', ...]
 * ```
 */
export function getAllProducts(): string[] {
  const products = new Set<string>();

  for (const tag of getTags().values()) {
    const product = (tag as ExtendedTag).product;
    if (product) {
      products.add(product);
    }
  }

  return Array.from(products).sort();
}

/**
 * Group tags by their product.
 *
 * @example
 * ```typescript
 * const grouped = getTagsGroupedByProduct();
 * // { Platform: [...], SDKs: [...] }
 * ```
 */
export function getTagsGroupedByProduct(): Record<string, ExtendedTag[]> {
  const groups: Record<string, ExtendedTag[]> = {};

  for (const tag of getTags().values()) {
    const extendedTag = tag as ExtendedTag;
    const product = extendedTag.product || 'Other';

    if (!groups[product]) {
      groups[product] = [];
    }
    groups[product].push(extendedTag);
  }

  return groups;
}

/**
 * Group tags by their plan tier.
 *
 * @example
 * ```typescript
 * const grouped = getTagsGroupedByPlanTier();
 * // { free: [...], pro: [...], enterprise: [...] }
 * ```
 */
export function getTagsGroupedByPlanTier(): Record<PlanTier, ExtendedTag[]> {
  const groups: Record<PlanTier, ExtendedTag[]> = {
    free: [],
    pro: [],
    enterprise: []
  };

  for (const tag of getTags().values()) {
    const extendedTag = tag as ExtendedTag;
    const tier = extendedTag.planTier;

    if (tier && tier in groups) {
      groups[tier].push(extendedTag);
    }
  }

  return groups;
}
