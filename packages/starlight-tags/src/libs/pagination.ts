/**
 * Pagination utilities for tag pages.
 */

export interface PaginationInfo {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  itemsPerPage: number;
  /** Index of first item on current page (0-indexed) */
  startIndex: number;
  /** Index of last item on current page (0-indexed, exclusive) */
  endIndex: number;
  /** Whether there is a previous page */
  hasPrev: boolean;
  /** Whether there is a next page */
  hasNext: boolean;
}

/**
 * Calculate pagination information.
 */
export function calculatePagination(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): PaginationInfo {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage: safePage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages
  };
}

/**
 * Slice an array for the current page.
 */
export function paginateArray<T>(items: T[], pagination: PaginationInfo): T[] {
  return items.slice(pagination.startIndex, pagination.endIndex);
}

/**
 * Build the URL for a specific page of a tag.
 * Page 1 returns clean URL, page 2+ includes page number.
 *
 * @param tagSlug - The tag's URL slug
 * @param pageNumber - Page number (1-indexed)
 * @param tagsPagesPrefix - The tags pages prefix from config
 * @returns Relative URL path
 */
export function buildTagPageUrl(
  tagSlug: string,
  pageNumber: number,
  tagsPagesPrefix: string
): string {
  // Validate pageNumber is a positive integer
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new Error(
      `[starlight-tags] Invalid page number: ${pageNumber}. Must be a positive integer.`
    );
  }

  if (pageNumber === 1) {
    return `/${tagsPagesPrefix}/${tagSlug}/`;
  }
  return `/${tagsPagesPrefix}/${tagSlug}/${pageNumber}`;
}

/**
 * Generate page numbers for pagination UI.
 * Uses ellipsis for large page counts.
 *
 * @example
 * // For page 5 of 10:
 * getPageNumbers(5, 10) // [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const sidePages = Math.floor((maxVisible - 3) / 2); // Pages on each side of current

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  let rangeStart = Math.max(2, currentPage - sidePages);
  let rangeEnd = Math.min(totalPages - 1, currentPage + sidePages);

  // Adjust range if near edges
  if (currentPage <= sidePages + 2) {
    rangeEnd = Math.min(totalPages - 1, maxVisible - 2);
  } else if (currentPage >= totalPages - sidePages - 1) {
    rangeStart = Math.max(2, totalPages - maxVisible + 3);
  }

  // Add ellipsis before range if needed
  if (rangeStart > 2) {
    pages.push('ellipsis');
  }

  // Add range pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add ellipsis after range if needed
  if (rangeEnd < totalPages - 1) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
