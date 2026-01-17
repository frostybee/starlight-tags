/**
 * i18n utilities for resolving localized tag labels and descriptions.
 *
 * These utilities handle the resolution of localized strings from either
 * simple string values or locale-keyed record objects.
 */

// Cached default locale from Starlight config
let cachedDefaultLocale: string | undefined;
let defaultLocaleResolved = false;

/**
 * Get the default locale from Starlight configuration.
 * Returns undefined if no default locale is configured (root locale).
 */
export function getDefaultLocale(): string | undefined {
  if (defaultLocaleResolved) {
    return cachedDefaultLocale;
  }

  try {
    const starlightConfig = import.meta.env.STARLIGHT_LOCALES;
    if (starlightConfig) {
      const locales = JSON.parse(starlightConfig) as Record<string, { lang?: string }>;
      // Find the default locale (the one marked as root or first non-root locale)
      for (const [key, value] of Object.entries(locales)) {
        if (key === 'root') {
          // Root locale - check if it has a lang defined
          cachedDefaultLocale = value.lang || 'en';
          break;
        }
      }
      // If no root, use 'en' as fallback
      if (!cachedDefaultLocale) {
        cachedDefaultLocale = 'en';
      }
    }
  } catch {
    // Fallback to 'en' if config not available
    cachedDefaultLocale = 'en';
  }

  defaultLocaleResolved = true;
  return cachedDefaultLocale;
}

/**
 * Type for values that can be either a simple string or a locale-keyed record.
 */
export type LocalizableString = string | Record<string, string>;

/**
 * Resolve a localizable string to its value for the given locale.
 *
 * Fallback chain:
 * 1. Exact locale match (e.g., 'fr')
 * 2. Default locale (e.g., 'en')
 * 3. First available value in the record
 * 4. undefined (for optional fields like description)
 *
 * @param value - The string or locale record to resolve
 * @param locale - The current locale (e.g., 'fr', 'de')
 * @param defaultLocale - The default locale to fall back to
 * @returns The resolved string value, or undefined if not available
 *
 * @example
 * ```typescript
 * // Simple string - returns as-is
 * resolveLocalizedString('Hello', 'fr', 'en') // => 'Hello'
 *
 * // Locale record - returns matching locale
 * resolveLocalizedString({ en: 'Hello', fr: 'Bonjour' }, 'fr', 'en') // => 'Bonjour'
 *
 * // Locale record with fallback
 * resolveLocalizedString({ en: 'Hello' }, 'de', 'en') // => 'Hello'
 * ```
 */
export function resolveLocalizedString(
  value: LocalizableString | undefined,
  locale: string | undefined,
  defaultLocale: string | undefined
): string | undefined {
  // Handle undefined/null
  if (value === undefined || value === null) {
    return undefined;
  }

  // Simple string - return as-is
  if (typeof value === 'string') {
    return value;
  }

  // Locale record - resolve based on locale
  const record = value as Record<string, string>;

  // 1. Try exact locale match
  if (locale && record[locale]) {
    return record[locale];
  }

  // 2. Try default locale
  if (defaultLocale && record[defaultLocale]) {
    return record[defaultLocale];
  }

  // 3. Try 'en' as universal fallback
  if (record['en']) {
    return record['en'];
  }

  // 4. Return first available value
  const values = Object.values(record);
  if (values.length > 0) {
    return values[0];
  }

  return undefined;
}

/**
 * Check if a value is a localizable record (not a simple string).
 */
export function isLocalizableRecord(value: LocalizableString | undefined): value is Record<string, string> {
  return value !== undefined && value !== null && typeof value === 'object';
}

/**
 * Reset cached default locale.
 * Used for testing and HMR.
 */
export function resetDefaultLocaleCache(): void {
  cachedDefaultLocale = undefined;
  defaultLocaleResolved = false;
}

// Handle Vite HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    resetDefaultLocaleCache();
  });
}
