/**
 * Popularity tier utilities for tag visualization.
 */

export type PopularityTier = 'tier-1' | 'tier-2' | 'tier-3' | 'tier-4' | 'tier-5';

/**
 * Calculate the popularity tier for a tag based on its count relative to min/max.
 * Used for visual sizing in tag clouds and lists.
 *
 * @param count - The tag's page count
 * @param minCount - Minimum count across all tags
 * @param maxCount - Maximum count across all tags
 * @returns A tier from 'tier-1' (least popular) to 'tier-5' (most popular)
 */
export function getPopularityTier(
  count: number,
  minCount: number,
  maxCount: number
): PopularityTier {
  const range = maxCount - minCount;
  if (range === 0) return 'tier-3';

  const normalized = (count - minCount) / range;
  if (normalized >= 0.8) return 'tier-5';
  if (normalized >= 0.6) return 'tier-4';
  if (normalized >= 0.4) return 'tier-3';
  if (normalized >= 0.2) return 'tier-2';
  return 'tier-1';
}

/**
 * Create a popularity tier calculator with pre-bound min/max values.
 * Useful when calculating tiers for multiple tags.
 *
 * @param minCount - Minimum count across all tags
 * @param maxCount - Maximum count across all tags
 * @returns A function that takes a count and returns a tier
 */
export function createTierCalculator(
  minCount: number,
  maxCount: number
): (count: number) => PopularityTier {
  return (count: number) => getPopularityTier(count, minCount, maxCount);
}
