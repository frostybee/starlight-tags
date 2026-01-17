/**
 * Tag Schemas
 *
 * Zod schemas and TypeScript types for tag definitions and processed tags.
 * Used for validating tags.yml and typing component props.
 */
import { z } from 'astro/zod';

/**
 * Difficulty level constants for educational content.
 * Used for indicating prerequisite knowledge level.
 */
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

/** Type alias for valid difficulty level values */
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Content type constants for educational materials.
 * Used for categorizing documentation by format/purpose.
 */
export const CONTENT_TYPES = ['lecture', 'lab', 'assignment', 'project', 'reference', 'tutorial', 'assessment'] as const;

/** Type alias for valid content type values */
export type ContentType = (typeof CONTENT_TYPES)[number];

/**
 * Regex for valid CSS color values.
 * Supports: hex (#fff, #ffffff), named colors (blue), rgb/rgba, hsl/hsla
 */
const colorRegex = /^(#[0-9A-Fa-f]{3}|#[0-9A-Fa-f]{4}|#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i;

/** Regex for URL-safe permalinks (lowercase letters, numbers, hyphens, slashes) */
const permalinkRegex = /^[a-z0-9][a-z0-9-/]*[a-z0-9]$|^[a-z0-9]$/;

/**
 * Schema for localizable strings that support i18n.
 * Accepts either a simple string or a record of locale codes to strings.
 *
 * @example
 * ```yaml
 * # Simple string
 * label: "Authentication"
 *
 * # Localized object
 * label:
 *   en: "Authentication"
 *   fr: "Authentification"
 *   de: "Authentifizierung"
 * ```
 */
export const localizableStringSchema = z.union([
  z.string(),
  z.record(z.string(), z.string())
]);

/** Type for localizable string values */
export type LocalizableString = z.infer<typeof localizableStringSchema>;

/**
 * Schema for a single tag definition in tags.yml.
 *
 * @example
 * ```yaml
 * # tags.yml
 * tags:
 *   # Simple string labels (backwards compatible)
 *   authentication:
 *     label: "Authentication"
 *     description: "User authentication and authorization"
 *     color: "#3b82f6"
 *     icon: "🔐"
 *     difficulty: beginner
 *     prerequisites:
 *       - rest-api
 *
 *   # Localized labels for multilingual sites
 *   components:
 *     label:
 *       en: "Components"
 *       fr: "Composants"
 *       es: "Componentes"
 *     description:
 *       en: "UI components and usage patterns"
 *       fr: "Composants d'interface utilisateur"
 *     color: "#10b981"
 * ```
 */
export const tagDefinitionSchema = z.object({
  /** Display name for the tag (string or locale record for i18n) */
  label: localizableStringSchema,
  /** Short description shown in tooltips and tag pages (string or locale record for i18n) */
  description: localizableStringSchema.optional(),
  /** CSS color value for the tag badge (hex, named, rgb, hsl) */
  color: z.string().regex(colorRegex, 'Invalid color format. Use hex (#fff), named color (blue), or rgb/hsl').optional(),
  /** Emoji or short text displayed before the label */
  icon: z.string().optional(),
  /** Custom URL slug (defaults to tag ID) */
  permalink: z.string().regex(permalinkRegex, 'Permalink must be URL-safe (lowercase letters, numbers, hyphens)').optional(),
  /** Hide from tag index page but still functional on content pages */
  hidden: z.boolean().optional(),
  /** Sort priority (higher numbers appear first, default: 0) */
  priority: z.number().int().default(0),

  // Educational metadata (optional)
  /** Difficulty level: beginner, intermediate, or advanced */
  difficulty: z.enum(DIFFICULTIES).optional(),
  /** Type of content: lecture, lab, assignment, project, reference, tutorial, or assessment */
  contentType: z.enum(CONTENT_TYPES).optional(),
  /** Tag IDs that should be learned before this topic */
  prerequisites: z.array(z.string()).optional(),
}).passthrough(); // Allow custom fields to pass through for schema extension

/** Regex for valid tag IDs (lowercase alphanumeric with hyphens/underscores) */
const tagIdRegex = /^[a-z0-9_-]+$/;

/**
 * Schema for the entire tags.yml configuration file
 */
export const tagsConfigSchema = z.object({
  /** Map of tag ID to tag definition */
  tags: z.record(
    z.string().regex(tagIdRegex, 'Tag ID must contain only lowercase letters, numbers, hyphens, and underscores'),
    tagDefinitionSchema
  ),
  /** Default settings applied to all tags */
  defaults: z.object({
    /** Default color for tags without explicit color */
    color: z.string().regex(colorRegex, 'Invalid color format').optional()
  }).optional()
});

/** Raw tag definition as specified in tags.yml */
export type TagDefinition = z.infer<typeof tagDefinitionSchema>;

/** Complete tags.yml configuration */
export type TagsConfig = z.infer<typeof tagsConfigSchema>;

/**
 * Reference to a documentation page that uses a tag.
 * Used to track which pages have which tags and provide page metadata.
 *
 * @example
 * ```typescript
 * const { tags } = Astro.locals.starlightTags;
 * const authTag = tags.get('authentication');
 *
 * for (const page of authTag.pages) {
 *   console.log(page.title, page.slug);
 * }
 * ```
 */
export interface PageReference {
  /**
   * Unique content collection entry ID.
   * Format includes the file extension: `'guides/getting-started.mdx'`
   *
   * @example 'guides/authentication.mdx', 'reference/api.md'
   */
  id: string;

  /**
   * URL slug for the page (without file extension).
   * Used for routing and lookup in `tagsByPage`.
   *
   * @example 'guides/authentication', 'reference/api'
   */
  slug: string;

  /**
   * Page title from frontmatter.
   * This is the `title` field defined in the page's frontmatter.
   */
  title: string;

  /**
   * Page description from frontmatter, if provided.
   * This is the optional `description` field from the page's frontmatter.
   */
  description?: string;

  /**
   * Tag IDs assigned to this page via frontmatter.
   * These are the raw tag IDs as specified in the `tags` frontmatter field.
   *
   * @example ['authentication', 'security', 'rest-api']
   */
  tags?: string[];

  /**
   * Full frontmatter data for advanced use cases.
   * Contains all frontmatter fields from the page, useful for custom filtering or display.
   */
  frontmatter?: Record<string, unknown>;
}

/**
 * Processed tag with computed properties.
 *
 * This is the primary tag type used throughout starlight-tags. It combines
 * the raw `TagDefinition` from `tags.yml` with runtime-computed data like
 * page counts, URLs, and educational relationships.
 *
 * Note: The `label` and `description` fields are resolved to plain strings
 * based on the current locale. The raw localizable values from tags.yml
 * are not exposed in the processed tag.
 *
 * Custom fields from extended schemas are preserved via the index signature.
 * Cast to your extended type to access custom fields with type safety.
 *
 * @example
 * ```typescript
 * const { tags } = Astro.locals.starlightTags;
 * const tag = tags.get('authentication');
 *
 * if (tag) {
 *   console.log(tag.label);          // "Authentication" (resolved for current locale)
 *   console.log(tag.count);          // 5
 *   console.log(tag.url);            // "/tags/authentication"
 *   console.log(tag.pages.length);   // 5
 * }
 * ```
 *
 * @see TagDefinition for the base properties from tags.yml
 * @see PageReference for the structure of pages array items
 */
export type ProcessedTag = Omit<TagDefinition, 'label' | 'description'> & {
  /**
   * Display name for the tag, resolved for the current locale.
   * If the tag definition uses a locale record, this will be the
   * value for the current locale (or fallback to default locale).
   */
  label: string;

  /**
   * Short description for the tag, resolved for the current locale.
   * If the tag definition uses a locale record, this will be the
   * value for the current locale (or fallback to default locale).
   */
  description?: string;
  /**
   * The unique identifier for the tag as defined in `tags.yml`.
   * This is the key used in the tags configuration file.
   *
   * @example 'authentication', 'rest-api', 'getting-started'
   */
  id: string;

  /**
   * URL-safe slug used for routing to the tag's page.
   * Derived from `permalink` if specified in the tag definition,
   * otherwise generated from the tag `id`.
   *
   * @example 'authentication', 'rest-api'
   */
  slug: string;

  /**
   * Full URL path to the tag's dedicated page.
   * Includes the configured `tagsPagesPrefix` (default: 'tags').
   *
   * @example '/tags/authentication', '/docs/tags/rest-api'
   */
  url: string;

  /**
   * Number of documentation pages that have this tag assigned.
   * Used for popularity calculations, sorting, and display (e.g., "Authentication (5)").
   */
  count: number;

  /**
   * List of pages that have this tag assigned.
   * Each page includes its slug, title, description, and other metadata.
   *
   * @example
   * ```typescript
   * const tag = tags.get('authentication');
   * for (const page of tag.pages) {
   *   console.log(`${page.title}: ${page.slug}`);
   * }
   * ```
   *
   * @see PageReference
   */
  pages: PageReference[];

  // Computed educational properties

  /**
   * IDs of tags that are related to this tag.
   * Calculated based on shared pages and prerequisite relationships.
   * Tags that frequently appear together or have prerequisite links are considered related.
   *
   * @example ['security', 'jwt', 'oauth'] for an 'authentication' tag
   */
  relatedTags?: string[];

  /**
   * Ordered list of prerequisite tag IDs, resolved recursively.
   * Represents the full learning path leading to this tag, not just immediate prerequisites.
   *
   * @example
   * If 'advanced-auth' requires 'authentication' which requires 'http-basics':
   * ```typescript
   * const tag = tags.get('advanced-auth');
   * console.log(tag.prerequisiteChain);
   * // ['http-basics', 'authentication']
   * ```
   */
  prerequisiteChain?: string[];

  /**
   * Suggested next topics to learn after this tag.
   * These are tags that list the current tag as a prerequisite.
   *
   * @example
   * ```typescript
   * const tag = tags.get('authentication');
   * console.log(tag.nextSteps);
   * // ['oauth', 'jwt', 'session-management']
   * ```
   */
  nextSteps?: string[];

  /**
   * Index signature for custom fields from extended schemas.
   * When extending the tag schema, custom fields are preserved here.
   * Cast to your extended type to access custom fields with type safety.
   *
   * @example
   * ```typescript
   * // Extended tag type with custom 'product' field
   * type ExtendedTag = ProcessedTag & { product?: string };
   * const tag = tags.get('api') as ExtendedTag;
   * console.log(tag.product); // 'enterprise'
   * ```
   */
  [key: string]: unknown;
};