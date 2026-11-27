/**
 * i18n utilities for resolving localized tag labels and descriptions.
 *
 * These utilities handle the resolution of localized strings from either
 * simple string values or locale-keyed record objects.
 */

/**
 * Type for values that can be either a simple string or a locale-keyed record.
 */
export type LocalizableString = string | Record<string, string>;

/**
 * The subset of Starlight's resolved config used to build locale lookup keys.
 */
export interface StarlightLocaleConfig {
  locales?: Record<string, { lang?: string } | undefined>;
  defaultLocale?: { locale?: string; lang?: string };
}

/**
 * Build the ordered list of keys to try when resolving a localized string.
 *
 * Order:
 * 1. The locale's URL key (e.g. 'de'), when on a prefixed locale
 * 2. The locale's `lang` (e.g. 'zh-TW' for a root locale)
 * 3. 'root', only on root-locale pages
 * 4. The default locale's key and `lang`
 * 5. 'en' as a universal fallback
 *
 * @param locale - The current locale key from the URL, or undefined for root
 * @param starlight - Starlight's resolved config (locales and defaultLocale)
 */
export function buildLocaleKeys(
  locale: string | undefined,
  starlight: StarlightLocaleConfig | undefined
): string[] {
  const locales = starlight?.locales;
  const defaultLocale = starlight?.defaultLocale;

  // Single-language sites have no `locales`; the default locale's lang applies.
  const lang = locales
    ? locales[locale ?? 'root']?.lang
    : defaultLocale?.lang;

  const keys = [
    locale,
    lang,
    locale === undefined ? 'root' : undefined,
    defaultLocale?.locale,
    defaultLocale?.lang,
    'en',
  ];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of keys) {
    if (!key) continue;
    const normalized = key.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(key);
  }
  return result;
}

/**
 * Resolve a localizable string to its value for the given lookup keys.
 *
 * Keys are tried in order and matched case-insensitively, so `zh-tw` in
 * tags.yml matches a `zh-TW` lang. If no key matches, the first value in
 * the record is returned.
 *
 * @param value - The string or locale record to resolve
 * @param keys - Ordered lookup keys, usually from `buildLocaleKeys()`
 * @returns The resolved string value, or undefined if not available
 *
 * @example
 * ```typescript
 * resolveLocalizedString('Hello', ['fr']) // => 'Hello'
 * resolveLocalizedString({ en: 'Hello', fr: 'Bonjour' }, ['fr', 'en']) // => 'Bonjour'
 * resolveLocalizedString({ 'zh-tw': '標籤' }, ['zh-TW', 'root', 'en']) // => '標籤'
 * ```
 */
export function resolveLocalizedString(
  value: LocalizableString | undefined,
  keys: readonly string[]
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  const byLowerKey = new Map<string, string>();
  for (const [key, text] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (text && !byLowerKey.has(normalized)) {
      byLowerKey.set(normalized, text);
    }
  }

  for (const key of keys) {
    const match = byLowerKey.get(key.toLowerCase());
    if (match) {
      return match;
    }
  }

  const values = Object.values(value);
  return values.length > 0 ? values[0] : undefined;
}

/**
 * Check if a value is a localizable record (not a simple string).
 */
export function isLocalizableRecord(value: LocalizableString | undefined): value is Record<string, string> {
  return value !== undefined && value !== null && typeof value === 'object';
}
