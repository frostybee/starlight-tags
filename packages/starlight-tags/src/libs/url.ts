/**
 * URL utilities for building locale-aware URLs.
 * Based on the starlight-blog plugin's approach.
 * @see https://github.com/HiDeoo/starlight-blog/blob/main/packages/starlight-blog/libs/page.ts
 */

import starlightConfig from 'virtual:starlight/user-config';

function getLocales(): Record<string, unknown> | undefined {
  return (starlightConfig as { locales?: Record<string, unknown> }).locales;
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
  const firstSegment = path.replace(/^\//, '').split('/')[0];
  if (!firstSegment || firstSegment === 'root') return undefined;

  // Only configured locale keys are prefixes; without `locales` every page is root
  const locales = getLocales();
  return locales && firstSegment in locales ? firstSegment : undefined;
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
