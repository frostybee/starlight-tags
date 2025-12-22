/**
 * URL utilities for building locale-aware URLs.
 * Based on the starlight-blog plugin's approach.
 * @see https://github.com/HiDeoo/starlight-blog/blob/main/packages/starlight-blog/libs/page.ts
 */

// Lazy-loaded config to avoid circular dependencies
let starlightLocales: Record<string, unknown> | undefined;

function getLocales(): Record<string, unknown> | undefined {
  if (starlightLocales === undefined) {
    try {
      // @ts-expect-error - virtual module
      const config = import.meta.env.STARLIGHT_LOCALES;
      starlightLocales = config ? JSON.parse(config) : undefined;
    } catch {
      starlightLocales = undefined;
    }
  }
  return starlightLocales;
}

/**
 * Get the base URL with trailing slash removed.
 */
export function getBase(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

/**
 * Extract locale from a URL path's first segment.
 * Returns undefined if no locale found (root locale).
 */
export function getLocaleFromPath(path: string): string | undefined {
  // Remove leading slash and get first segment
  const segments = path.replace(/^\//, '').split('/');
  const firstSegment = segments[0];

  if (!firstSegment) return undefined;

  // Check against configured locales if available
  const locales = getLocales();
  if (locales && firstSegment in locales) {
    return firstSegment;
  }

  // Fallback: check if it looks like a locale code (e.g., 'en', 'fr', 'en-us', 'pt-br')
  // This handles cases where we can't access the config
  // Pattern: 2-3 lowercase letters, optionally followed by hyphen and 2-4 lowercase letters/digits
  // Examples: en, fra, en-us, pt-br, zh-hans
  if (/^[a-z]{2,3}(-[a-z0-9]{2,4})?$/.test(firstSegment)) {
    return firstSegment;
  }

  return undefined;
}

/**
 * Extract locale from an Astro URL, accounting for base path.
 */
export function getLocaleFromUrl(url: URL): string | undefined {
  const base = getBase();
  const pathAfterBase = url.pathname.slice(base.length);
  return getLocaleFromPath(pathAfterBase);
}

/**
 * Build a localized URL from a relative path.
 *
 * @param path - Relative path (e.g., '/tags/auth/')
 * @param locale - Locale string or undefined for root locale
 * @returns Full URL with base and locale (e.g., '/docs/fr/tags/auth/')
 */
export function buildUrl(path: string, locale: string | undefined): string {
  const base = getBase();
  const localeSegment = locale ? `/${locale}` : '';

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${base}${localeSegment}${normalizedPath}`;
}

/**
 * Build a localized URL, extracting locale from the current page URL.
 * Use this when you don't have access to Astro.params.
 *
 * @param path - Relative path (e.g., '/tags/auth/')
 * @param currentUrl - The current page's URL (Astro.url)
 * @returns Full URL with base and locale
 */
export function buildUrlFromCurrentPage(path: string, currentUrl: URL): string {
  const locale = getLocaleFromUrl(currentUrl);
  return buildUrl(path, locale);
}
