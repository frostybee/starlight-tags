import { describe, it, expect } from 'vitest';
import { levenshteinDistance, findSimilarStrings } from './string-utils.js';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
    expect(levenshteinDistance('Features', 'Features')).toBe(0);
  });

  it('returns length of other string when one is empty', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
    expect(levenshteinDistance('hello', '')).toBe(5);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('calculates distance for single character changes', () => {
    // Substitution
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
    // Insertion
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
    // Deletion
    expect(levenshteinDistance('cats', 'cat')).toBe(1);
  });

  it('calculates distance for typos', () => {
    // Common typo: transposition
    expect(levenshteinDistance('Features', 'Feautres')).toBe(2);
    // Missing letter
    expect(levenshteinDistance('Features', 'Featurs')).toBe(1);
    // Extra letter
    expect(levenshteinDistance('Features', 'Featuress')).toBe(1);
    // Wrong letter
    expect(levenshteinDistance('Features', 'Featurez')).toBe(1);
  });

  it('calculates distance for completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
    // Features -> Platforms requires 5 edits (substitutions + length diff)
    expect(levenshteinDistance('Features', 'Platforms')).toBe(5);
  });

  it('is case-sensitive', () => {
    expect(levenshteinDistance('Hello', 'hello')).toBe(1);
    expect(levenshteinDistance('FEATURES', 'features')).toBe(8);
  });
});

describe('findSimilarStrings', () => {
  const candidates = ['Features', 'Platforms', 'Status', 'SDKs'];

  it('finds similar strings with typos', () => {
    const result = findSimilarStrings('Feautres', candidates);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe('Features');
  });

  it('finds similar strings with missing letters', () => {
    const result = findSimilarStrings('Featurs', candidates);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe('Features');
  });

  it('excludes exact matches', () => {
    const result = findSimilarStrings('Features', candidates);
    expect(result.find(r => r.name === 'Features')).toBeUndefined();
  });

  it('returns empty array when no similar strings found', () => {
    const result = findSimilarStrings('CompletelyDifferent', candidates);
    expect(result).toEqual([]);
  });

  it('sorts results by distance (closest first)', () => {
    // Add more similar variations
    const moreCandidates = ['Features', 'Featurez', 'Featuresss', 'Other'];
    const result = findSimilarStrings('Feature', moreCandidates);

    // Should be sorted by distance
    for (let i = 1; i < result.length; i++) {
      expect(result[i].distance).toBeGreaterThanOrEqual(result[i - 1].distance);
    }
  });

  it('respects case-insensitivity in comparison', () => {
    const result = findSimilarStrings('features', candidates);
    expect(result.length).toBeGreaterThan(0);
    // Should find 'Features' even though case differs
    expect(result[0].name).toBe('Features');
  });

  it('respects maxDistanceRatio parameter', () => {
    // maxDistance = max(2, floor(name.length * ratio))
    // The minimum is always 2, so we need a case where:
    // - strict: distance > max(2, floor(len * ratio))
    // - lenient: distance <= max(2, floor(len * ratio))

    // "Fxxtures" (8 chars) -> "Features" has distance 2 (xx -> ea)
    // With 0.1 ratio: max(2, floor(8*0.1)) = max(2, 0) = 2, should match
    // With 0.01 ratio: max(2, floor(8*0.01)) = max(2, 0) = 2, should still match (minimum is 2)

    // To properly test, we need a string that's very different
    // "Fxxtxrxs" -> "Features" has distance 4
    // With 0.1 ratio: max(2, 0) = 2, should NOT match (4 > 2)
    const strictResult = findSimilarStrings('Fxxtxrxs', candidates, 0.1);
    expect(strictResult.length).toBe(0);

    // With 0.6 ratio: max(2, floor(8*0.6)) = max(2, 4) = 4, should match (4 <= 4)
    const lenientResult = findSimilarStrings('Fxxtxrxs', candidates, 0.6);
    expect(lenientResult.length).toBeGreaterThan(0);
  });

  it('handles empty candidates array', () => {
    const result = findSimilarStrings('Features', []);
    expect(result).toEqual([]);
  });

  it('handles single candidate', () => {
    const result = findSimilarStrings('Featurez', ['Features']);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Features');
    expect(result[0].distance).toBe(1);
  });
});
