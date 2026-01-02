import fs from 'fs/promises';
import yaml from 'js-yaml';
import type { AstroIntegrationLogger } from 'astro';
import { tagsConfigSchema, type TagsConfig, type ProcessedTag } from '../schemas/tags.js';
import type { PluginConfig } from '../schemas/config.js';

// Constants
const MAX_RELATED_TAGS = 5;
const MAX_NEXT_STEPS = 5;
const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced'] as const;

// Type for docs entries from Astro content collections
interface DocsEntry {
  id: string;
  slug?: string;
  data: {
    title: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

// Minimal logger interface for build-time usage
export interface MinimalLogger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

export class TagsProcessor {
  private config: PluginConfig;
  private logger: AstroIntegrationLogger | MinimalLogger;
  private tagsData?: TagsConfig;
  private processedTags?: Map<string, ProcessedTag>;
  private providedDocsEntries?: DocsEntry[];

  constructor(config: PluginConfig, logger: AstroIntegrationLogger | MinimalLogger, docsEntries?: DocsEntry[]) {
    this.config = config;
    this.logger = logger;
    this.providedDocsEntries = docsEntries;
  }

  async initialize(): Promise<void> {
    await this.loadTagsConfig();
    await this.processTagsData();
    this.logger.info(`Loaded ${this.processedTags?.size || 0} tags from configuration`);
  }

  private async loadTagsConfig(): Promise<void> {
    try {
      const configPath = this.config.configPath;
      this.logger.info(`Loading tags configuration from: ${configPath} (cwd: ${process.cwd()})`);
      const fileContent = await fs.readFile(configPath, 'utf-8');
      const rawData = yaml.load(fileContent);

      // Validate YAML structure
      this.tagsData = tagsConfigSchema.parse(rawData);

    } catch (error) {
      const errnoError = error as { code?: string; path?: string };
      if (error instanceof Error && errnoError.code === 'ENOENT') {
        throw new Error(`[starlight-tags] Tags configuration file not found: ${this.config.configPath}\nCreate a tags.yml file or update the configPath option.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`[starlight-tags] Invalid tags configuration: ${message}`);
    }
  }

  private async processTagsData(): Promise<void> {
    if (!this.tagsData) return;

    this.processedTags = new Map();

    // Get all docs entries to calculate tag usage
    let docsEntries: DocsEntry[] = [];

    if (this.providedDocsEntries) {
      // Use provided docs entries if available
      docsEntries = this.providedDocsEntries;
      this.logger.info(`Using ${docsEntries.length} provided docs entries`);
    } else {
      // Otherwise, try to fetch them dynamically
      try {
        // Dynamically import astro:content only when needed
        // @ts-expect-error - astro:content is a virtual module only available at runtime
        const { getCollection } = await import('astro:content');
        docsEntries = await getCollection('docs') as DocsEntry[];
        this.logger.info(`Fetched ${docsEntries.length} docs entries from astro:content`);
      } catch {
        // If astro:content is not available (e.g., during config phase), use empty array
        this.logger.warn('astro:content not available, skipping content collection processing');
        docsEntries = [];
      }
    }

    // Create a Map for O(1) lookups instead of O(n) find() calls
    const entriesById = new Map(docsEntries.map(e => [e.id, e]));

    interface PageReference {
      id: string;
      slug: string;
      title: string;
      description?: string;
    }

    const tagUsage = new Map<string, PageReference[]>();

    // Process frontmatter tags from all pages
    let totalTagsFound = 0;
    for (const entry of docsEntries) {
      const entryTags = entry.data.tags || [];
      totalTagsFound += entryTags.length;
      for (const tagId of entryTags) {
        if (!tagUsage.has(tagId)) {
          tagUsage.set(tagId, []);
        }
        // In Astro 5+ with Starlight's docsLoader, use entry.id as the slug
        // The id is the file path without extension (e.g., "php/basics/php-intro")
        tagUsage.get(tagId)!.push({
          id: entry.id,
          slug: entry.id,
          title: entry.data.title,
          description: entry.data.description
        });
      }
    }

    this.logger.info(`Found ${totalTagsFound} tag references across ${docsEntries.length} docs, covering ${tagUsage.size} unique tags`);

    // Process each defined tag
    for (const [tagId, tagDef] of Object.entries(this.tagsData.tags)) {
      const pages = tagUsage.get(tagId) || [];

      const processedTag: ProcessedTag = {
        // Spread all original fields first (including custom fields from extended schemas)
        ...tagDef,
        // Then add/override with computed properties
        id: tagId,
        slug: this.generateTagSlug(tagId, tagDef.permalink),
        url: this.generateTagUrl(tagId, tagDef.permalink),
        color: tagDef.color || this.tagsData.defaults?.color,
        prerequisites: tagDef.prerequisites || [],
        count: pages.length,
        pages: pages.map(page => {
          // Use Map for O(1) lookup instead of find()
          const entry = entriesById.get(page.id);
          return {
            ...page,
            slug: page.slug || page.id, // Ensure slug is always set
            tags: entry?.data.tags || [],
            frontmatter: entry?.data
          };
        })
      };

      this.processedTags.set(tagId, processedTag);
    }

    // Validate slug uniqueness to prevent URL collisions
    this.validateSlugUniqueness();

    // Calculate educational relationships
    this.calculateEducationalRelationships();

    // Validate inline tags if configured
    if (this.config.onInlineTagsNotFound !== 'ignore') {
      await this.validateInlineTags(tagUsage);
    }

  }

  /**
   * Validates that all tag slugs are unique to prevent URL collisions.
   * For example, "C#" and "C" might both generate slug "c".
   */
  private validateSlugUniqueness(): void {
    if (!this.processedTags) return;

    const slugToTags = new Map<string, string[]>();

    for (const [tagId, tag] of this.processedTags) {
      const slug = tag.slug;
      if (!slugToTags.has(slug)) {
        slugToTags.set(slug, []);
      }
      slugToTags.get(slug)!.push(tagId);
    }

    // Report any collisions
    for (const [slug, tagIds] of slugToTags) {
      if (tagIds.length > 1) {
        this.logger.warn(
          `Slug collision detected: tags [${tagIds.join(', ')}] all resolve to slug "${slug}". ` +
          `Use the "permalink" field in tags.yml to specify unique slugs.`
        );
      }
    }
  }

  private async validateInlineTags(tagUsage: Map<string, unknown[]>): Promise<void> {
    const undefinedTags = Array.from(tagUsage.keys()).filter(
      tagId => !this.tagsData?.tags[tagId]
    );

    if (undefinedTags.length > 0) {
      const message = `Found undefined tags in frontmatter: ${undefinedTags.join(', ')}`;

      if (this.config.onInlineTagsNotFound === 'error') {
        throw new Error(message);
      } else {
        this.logger.warn(message);
      }
    }
  }

  private generateTagSlug(tagId: string, permalink?: string): string {
    if (permalink) {
      // Ensure permalink is URL-safe
      return encodeURIComponent(permalink).replace(/%2F/g, '/');
    }
    // Convert to lowercase, replace non-alphanumeric chars with hyphens,
    // collapse multiple hyphens, then trim leading/trailing hyphens
    const slug = tagId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Return a fallback if slug is empty (e.g., tag was only special chars like "C#")
    return slug || encodeURIComponent(tagId.toLowerCase());
  }

  /**
   * Generates the relative URL path for a tag (without base path or locale).
   * The full URL is constructed at render time with locale and base path.
   */
  private generateTagUrl(tagId: string, permalink?: string): string {
    const slug = this.generateTagSlug(tagId, permalink);
    return `/${this.config.tagsPagesPrefix}/${slug}/`;
  }

  getTags(): Map<string, ProcessedTag> {
    return this.processedTags || new Map();
  }

  getTag(tagId: string): ProcessedTag | undefined {
    return this.processedTags?.get(tagId);
  }

  getAllTagsSorted(): ProcessedTag[] {
    return Array.from(this.getTags().values())
      .sort((a, b) => {
        // Sort by priority first (higher priority first)
        const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        // Then by count (more pages first)
        const countDiff = b.count - a.count;
        if (countDiff !== 0) return countDiff;
        // Finally alphabetically by label
        return a.label.localeCompare(b.label);
      });
  }

  getTagsForPage(pageSlug: string): ProcessedTag[] {
    return Array.from(this.getTags().values())
      .filter(tag => tag.pages.some(page => page.slug === pageSlug));
  }

  private calculateEducationalRelationships(): void {
    if (!this.processedTags) return;

    for (const [tagId, tag] of this.processedTags) {
      // Calculate prerequisite chain
      tag.prerequisiteChain = this.buildPrerequisiteChain(tagId);
      
      // Calculate related tags based on subject and learning objectives
      tag.relatedTags = this.findRelatedTags(tagId);
      
      // Calculate next steps based on difficulty progression
      tag.nextSteps = this.findNextSteps(tagId);
    }
  }

  private buildPrerequisiteChain(tagId: string, visited = new Set<string>(), path: string[] = []): string[] {
    if (visited.has(tagId)) {
      // Build the cycle path for a more informative error message
      const cycleStart = path.indexOf(tagId);
      const cyclePath = cycleStart >= 0
        ? [...path.slice(cycleStart), tagId].join(' → ')
        : `... → ${tagId}`;
      this.logger.warn(
        `Circular prerequisite dependency detected: ${cyclePath}. ` +
        `Check your tags.yml prerequisites configuration.`
      );
      return [];
    }

    const tag = this.processedTags?.get(tagId);
    if (!tag || !tag.prerequisites?.length) return [];

    const chain: string[] = [];
    const currentPath = [...path, tagId];

    for (const prereqId of tag.prerequisites) {
      if (this.processedTags?.has(prereqId)) {
        chain.push(prereqId);
        // Create a new Set for each branch to detect cycles within the path,
        // not across sibling branches. This allows shared dependencies like:
        // A -> B -> D and A -> C -> D (D can appear in both branches)
        const branchVisited = new Set(visited);
        branchVisited.add(tagId);
        const subChain = this.buildPrerequisiteChain(prereqId, branchVisited, currentPath);
        chain.push(...subChain);
      }
    }

    return Array.from(new Set(chain)); // Remove duplicates from multiple paths
  }

  private findRelatedTags(tagId: string): string[] {
    const currentTag = this.processedTags?.get(tagId);
    if (!currentTag) return [];

    const currentPageIds = new Set(currentTag.pages.map(p => p.id));
    const related: Array<{ id: string; score: number }> = [];

    for (const [otherId, otherTag] of this.processedTags!) {
      if (otherId === tagId) continue;

      // Calculate relationship score based on shared pages and prerequisites
      let score = 0;

      // Shared pages indicate related topics
      const sharedPages = otherTag.pages.filter(p => currentPageIds.has(p.id)).length;
      score += sharedPages * 2;

      // Prerequisite relationships
      if (currentTag.prerequisites?.includes(otherId)) score += 3;
      if (otherTag.prerequisites?.includes(tagId)) score += 3;

      if (score > 0) {
        related.push({ id: otherId, score });
      }
    }

    // Sort by score descending and return top results
    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RELATED_TAGS)
      .map(r => r.id);
  }

  private findNextSteps(tagId: string): string[] {
    const currentTag = this.processedTags?.get(tagId);
    if (!currentTag) return [];

    const nextSteps: string[] = [];

    for (const [otherId, otherTag] of this.processedTags!) {
      if (otherId === tagId) continue;

      // Check if this tag lists current tag as prerequisite
      if (otherTag.prerequisites?.includes(tagId)) {
        nextSteps.push(otherId);
      }
    }

    return nextSteps.slice(0, MAX_NEXT_STEPS);
  }

  // Educational utility methods
  getTagsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): ProcessedTag[] {
    return Array.from(this.getTags().values())
      .filter(tag => tag.difficulty === difficulty)
      .sort((a, b) => b.count - a.count);
  }

  getTagsByContentType(contentType: 'lecture' | 'lab' | 'assignment' | 'project' | 'reference' | 'tutorial' | 'assessment'): ProcessedTag[] {
    return Array.from(this.getTags().values())
      .filter(tag => tag.contentType === contentType)
      .sort((a, b) => b.count - a.count);
  }

  validatePrerequisites(): { isValid: boolean; errors: string[] } {
    if (!this.processedTags) {
      return { isValid: false, errors: ['Tags not initialized'] };
    }

    const errors: string[] = [];

    for (const [tagId, tag] of this.processedTags) {
      for (const prereqId of tag.prerequisites || []) {
        if (!this.processedTags.has(prereqId)) {
          errors.push(`Tag "${tagId}" has invalid prerequisite "${prereqId}"`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Cleanup internal data structures to help garbage collection.
   * Called during HMR to prevent memory leaks.
   */
  cleanup(): void {
    this.processedTags?.clear();
    this.processedTags = undefined;
    this.tagsData = undefined;
    this.providedDocsEntries = undefined;
  }

  getLearningPath(startTagId: string, endTagId?: string): string[] {
    // Simple implementation - could be enhanced with graph algorithms
    const startTag = this.processedTags?.get(startTagId);
    if (!startTag) return [];

    if (!endTagId) {
      // Return next steps from current tag
      return startTag.nextSteps || [];
    }

    // For now, return direct path through prerequisites
    const endTag = this.processedTags?.get(endTagId);
    if (!endTag) return [];

    const visited = new Set([startTagId]);

    // Simple BFS to find path
    const queue = [startTagId];
    const parent = new Map<string, string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === endTagId) {
        // Reconstruct path from end to start
        const fullPath: string[] = [];
        let node: string | undefined = endTagId;
        while (node && parent.has(node)) {
          fullPath.unshift(node);
          node = parent.get(node);
        }
        fullPath.unshift(startTagId); // Add start node
        return fullPath;
      }

      const currentTag = this.processedTags!.get(current);
      for (const nextStep of currentTag?.nextSteps || []) {
        if (!visited.has(nextStep)) {
          visited.add(nextStep);
          parent.set(nextStep, current);
          queue.push(nextStep);
        }
      }
    }

    return [];
  }
}