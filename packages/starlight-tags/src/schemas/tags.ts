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
 * Schema for a single tag definition in tags.yml.
 *
 * @example
 * ```yaml
 * # tags.yml
 * tags:
 *   authentication:
 *     label: "Authentication"
 *     description: "User authentication and authorization"
 *     color: "#3b82f6"
 *     icon: "🔐"
 *     difficulty: beginner
 *     prerequisites:
 *       - rest-api
 *
 *   rest-api:
 *     label: "REST API"
 *     description: "RESTful API endpoints"
 *     color: "#10b981"
 * ```
 */
export const tagDefinitionSchema = z.object({
  /** Display name for the tag */
  label: z.string(),
  /** Short description shown in tooltips and tag pages */
  description: z.string().optional(),
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
 * Used internally to track which pages have which tags.
 */
export type PageReference = {
  /** Unique content collection entry ID */
  id: string;
  /** URL slug for the page */
  slug: string;
  /** Page title from frontmatter */
  title: string;
  /** Page description from frontmatter */
  description?: string;
  /** Tag IDs assigned to this page */
  tags?: string[];
  /** Full frontmatter data for advanced use */
  frontmatter?: Record<string, unknown>;
};

/**
 * Processed tag with computed properties.
 * This is what components receive - the raw TagDefinition plus
 * runtime-computed data like page counts and URLs.
 *
 * Custom fields from extended schemas are preserved via the index signature.
 * Cast to your extended type to access custom fields with type safety.
 */
export type ProcessedTag = TagDefinition & {
  /** Original tag ID from tags.yml */
  id: string;
  /** URL-safe slug (from permalink or generated from ID) */
  slug: string;
  /** Full URL to the tag's page (e.g., "/tags/authentication") */
  url: string;
  /** Number of pages using this tag */
  count: number;
  /** List of pages that have this tag */
  pages: PageReference[];

  // Computed educational properties
  /** IDs of tags that share pages or prerequisites with this tag */
  relatedTags?: string[];
  /** Ordered list of prerequisite tag IDs (resolved recursively) */
  prerequisiteChain?: string[];
  /** Suggested next topics based on this tag's prerequisites */
  nextSteps?: string[];

  /** Custom fields from extended schemas are preserved */
  [key: string]: unknown;
};