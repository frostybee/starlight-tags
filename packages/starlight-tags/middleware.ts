/**
 * Starlight Tags Route Middleware
 *
 * This middleware injects tag data into `Astro.locals.starlightTags`,
 * making it available to all Starlight pages and components.
 *
 * It also optionally injects tag links into Starlight's sidebar
 * when the `sidebar` plugin option is configured.
 *
 * @example
 * ```astro
 * ---
 * // In any Astro component on a Starlight page:
 * const { tags, allTagsSorted, tagsByPage } = Astro.locals.starlightTags;
 *
 * // Get a specific tag
 * const tag = tags.get('authentication');
 *
 * // Get tags for current page
 * const pageTags = tagsByPage.get(Astro.props.slug) ?? [];
 * ---
 * ```
 */
import type { StarlightRouteData } from '@astrojs/starlight/route-data';
import { getTagsData } from './src/libs/data.js';
import { injectSidebarTags } from './src/libs/sidebar.js';
import type { SidebarConfig } from './src/schemas/config.js';

/**
 * Route middleware that injects starlight-tags data into Astro.locals.
 *
 * This runs before page rendering, ensuring tag data is available
 * to all components without explicit initialization.
 *
 * When the `sidebar` plugin option is enabled, this middleware also
 * injects tag links into Starlight's sidebar.
 */
export async function onRequest(
  context: {
    locals: App.Locals & {
      starlightRoute?: StarlightRouteData;
      t?: (key: string) => string;
    };
    url: URL;
  },
  next: () => Promise<Response>
): Promise<Response> {
  const { starlightRoute, t } = context.locals;

  // Extract locale from Starlight's route data if available
  const locale = starlightRoute?.locale;

  // Inject tags data into locals
  const tagsData = await getTagsData(locale);
  context.locals.starlightTags = tagsData;

  // Inject sidebar tags if enabled
  const sidebarConfig = tagsData.config.sidebar;
  if (
    sidebarConfig !== false &&
    sidebarConfig.enabled &&
    starlightRoute?.sidebar &&
    t
  ) {
    const { basePath, tagsIndexSlug } = tagsData.config;

    // Build the tags index URL
    const localePrefix = locale ? `/${locale}` : '';
    const viewAllUrl = `${basePath}${localePrefix}/${tagsIndexSlug}`;

    // Get translated labels
    const groupLabel = t('starlightTags.popularTags');
    const viewAllLabel = t('starlightTags.viewAllTags');

    // Get current path for highlighting active links
    const currentPath = context.url.pathname;

    // Inject tags into sidebar
    injectSidebarTags(
      starlightRoute.sidebar,
      tagsData.allTagsSorted,
      sidebarConfig as SidebarConfig,
      groupLabel,
      viewAllLabel,
      viewAllUrl,
      currentPath,
      locale
    );
  }

  return next();
}
