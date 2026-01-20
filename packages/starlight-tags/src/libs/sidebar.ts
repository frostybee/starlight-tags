/**
 * Sidebar injection utilities for starlight-tags.
 *
 * This module provides helper functions for injecting tag links into
 * Starlight's sidebar without requiring component overrides.
 *
 * @module starlight-tags/libs/sidebar
 */
import type { StarlightRouteData } from '@astrojs/starlight/route-data';
import type { ProcessedTag } from '../schemas/tags.js';
import type { SidebarConfig } from '../schemas/config.js';
import { buildUrl } from './url.js';

/** Sidebar entry type from Starlight */
type SidebarEntry = StarlightRouteData['sidebar'][number];

/**
 * Creates a sidebar link entry.
 *
 * @param label - Display text for the link
 * @param href - URL to link to
 * @param isCurrent - Whether this link is the current page
 * @param badge - Optional badge to display (e.g., page count)
 * @returns A sidebar link entry
 */
export function makeSidebarLink(
  label: string,
  href: string,
  isCurrent: boolean,
  badge?: { text: string; class?: string }
): SidebarEntry {
  return {
    type: 'link',
    label,
    href,
    isCurrent,
    badge,
    attrs: {},
  } as SidebarEntry;
}

/**
 * Creates a sidebar group entry.
 *
 * @param label - Display text for the group header
 * @param entries - Child entries in the group
 * @param collapsed - Whether the group is collapsed by default
 * @returns A sidebar group entry
 */
export function makeSidebarGroup(
  label: string,
  entries: SidebarEntry[],
  collapsed: boolean = false
): SidebarEntry {
  return {
    type: 'group',
    label,
    entries,
    collapsed,
    badge: undefined,
  } as SidebarEntry;
}

/**
 * Sort tags based on the configured sort order.
 *
 * @param tags - Array of tags to sort
 * @param sortBy - Sort order: 'count', 'alphabetical', or 'priority'
 * @returns Sorted array of tags (new array, original not modified)
 */
export function sortTags(
  tags: ProcessedTag[],
  sortBy: 'count' | 'alphabetical' | 'priority'
): ProcessedTag[] {
  const sorted = [...tags];

  switch (sortBy) {
    case 'count':
      // Sort by count descending, then alphabetically
      sorted.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
      });
      break;

    case 'alphabetical':
      // Sort alphabetically by label
      sorted.sort((a, b) => a.label.localeCompare(b.label));
      break;

    case 'priority':
      // allTagsSorted is already sorted by priority, so just return as-is
      // (priority desc, count desc, label asc)
      break;
  }

  return sorted;
}

/**
 * Build sidebar entries for tags.
 *
 * @param tags - Array of processed tags
 * @param config - Sidebar configuration
 * @param currentPath - Current page path for highlighting active links
 * @param locale - Current locale for URL building
 * @returns Array of sidebar link entries for tags
 */
export function buildTagEntries(
  tags: ProcessedTag[],
  config: SidebarConfig,
  currentPath: string,
  locale: string | undefined
): SidebarEntry[] {
  // Filter out hidden tags
  let visibleTags = tags.filter(tag => !tag.hidden);

  // Sort based on configuration
  visibleTags = sortTags(visibleTags, config.sortBy);

  // Apply limit (0 means no limit)
  if (config.limit > 0) {
    visibleTags = visibleTags.slice(0, config.limit);
  }

  // Build link entries
  return visibleTags.map(tag => {
    const tagUrl = buildUrl(tag.url, locale);
    const isCurrent = currentPath === tagUrl || currentPath === `${tagUrl}/`;

    const badge = config.showCount
      ? { text: String(tag.count), class: 'sl-tag-count' }
      : undefined;

    return makeSidebarLink(tag.label, tagUrl, isCurrent, badge);
  });
}

/**
 * Inject tags into Starlight's sidebar.
 *
 * This function modifies the sidebar array in place, adding a tags group
 * at the configured position (top or bottom).
 *
 * @param sidebar - Starlight's sidebar array (modified in place)
 * @param tags - Array of processed tags
 * @param config - Sidebar configuration
 * @param groupLabel - Translated label for the tags group
 * @param viewAllLabel - Translated label for "View all tags" link
 * @param viewAllUrl - URL for the tags index page
 * @param currentPath - Current page path for highlighting active links
 * @param locale - Current locale for URL building
 */
export function injectSidebarTags(
  sidebar: StarlightRouteData['sidebar'],
  tags: ProcessedTag[],
  config: SidebarConfig,
  groupLabel: string,
  viewAllLabel: string,
  viewAllUrl: string,
  currentPath: string,
  locale: string | undefined
): void {
  // Build tag link entries
  const tagEntries = buildTagEntries(tags, config, currentPath, locale);

  // Add "View all tags" link if enabled
  if (config.showViewAllLink) {
    const isViewAllCurrent = currentPath === viewAllUrl || currentPath === `${viewAllUrl}/`;
    tagEntries.push(makeSidebarLink(viewAllLabel, viewAllUrl, isViewAllCurrent));
  }

  // Create the tags group
  const tagsGroup = makeSidebarGroup(groupLabel, tagEntries, config.collapsed);

  // Insert at configured position
  if (config.position === 'top') {
    sidebar.unshift(tagsGroup);
  } else {
    sidebar.push(tagsGroup);
  }
}
