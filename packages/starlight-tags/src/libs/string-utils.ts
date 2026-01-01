/**
 * String utility functions for tag validation.
 */

/**
 * Calculate Levenshtein distance between two strings.
 * Used to find similar strings (e.g., typo detection).
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find strings similar to the given name from a list.
 * Returns matches sorted by similarity (closest first).
 *
 * @param name - The string to find matches for
 * @param candidates - List of candidate strings to compare against
 * @param maxDistanceRatio - Maximum allowed distance as ratio of name length (default: 0.4 = 40%)
 * @returns Array of similar strings with their distances
 */
export function findSimilarStrings(
  name: string,
  candidates: string[],
  maxDistanceRatio = 0.4
): Array<{ name: string; distance: number }> {
  const maxDistance = Math.max(2, Math.floor(name.length * maxDistanceRatio));
  const similar: Array<{ name: string; distance: number }> = [];

  for (const other of candidates) {
    if (other === name) continue;

    const distance = levenshteinDistance(
      name.toLowerCase(),
      other.toLowerCase()
    );

    if (distance <= maxDistance) {
      similar.push({ name: other, distance });
    }
  }

  return similar.sort((a, b) => a.distance - b.distance);
}
