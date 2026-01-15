/**
 * Starlight Tags Route Middleware
 *
 * This middleware injects tag data into `Astro.locals.starlightTags`,
 * making it available to all Starlight pages and components.
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

/**
 * Route middleware that injects starlight-tags data into Astro.locals.
 *
 * This runs before page rendering, ensuring tag data is available
 * to all components without explicit initialization.
 */
export async function onRequest(
  context: { locals: App.Locals & { starlightRoute?: StarlightRouteData } },
  next: () => Promise<Response>
): Promise<Response> {
  // Extract locale from Starlight's route data if available
  const locale = context.locals.starlightRoute?.locale;

  // Inject tags data into locals
  context.locals.starlightTags = await getTagsData(locale);

  return next();
}
