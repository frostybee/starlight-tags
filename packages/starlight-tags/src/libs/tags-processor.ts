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
    try {
      await this.loadTagsConfig();
      await this.processTagsData();
      this.logger.info(`Loaded ${this.processedTags?.size || 0} tags from configuration`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize tags: ${message}`);
      throw error;
    }
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
      // Check for file not found error
      const errnoError = error as { code?: string; path?: string };
      if (error instanceof Error && errnoError.code === 'ENOENT') {
        this.logger.warn(`Tags configuration file not found: ${this.config.configPath} (tried: ${errnoError.path || 'unknown path'})`);
        this.tagsData = { tags: {} };
      } else {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid tags configuration: ${message}`);
      }
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
        id: tagId,
        slug: this.generateTagSlug(tagId, tagDef.permalink),
        url: this.generateTagUrl(tagId, tagDef.permalink),
        label: tagDef.label,
        description: tagDef.description,
        color: tagDef.color || this.tagsData.defaults?.color,
        icon: tagDef.icon,
        permalink: tagDef.permalink,
        hidden: tagDef.hidden,
        // Educational metadata
        difficulty: tagDef.difficulty,
        contentType: tagDef.contentType,
        subject: tagDef.subject,
        prerequisites: tagDef.prerequisites || [],
        learningObjectives: tagDef.learningObjectives || [],
        estimatedTime: tagDef.estimatedTime,
        skillLevel: tagDef.skillLevel,
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

    // Calculate educational relationships
    this.calculateEducationalRelationships();

    // Validate inline tags if configured
    if (this.config.onInlineTagsNotFound !== 'ignore') {
      await this.validateInlineTags(tagUsage);
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
    if (permalink) return permalink;
    return tagId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  private generateTagUrl(tagId: string, permalink?: string): string {
    const slug = this.generateTagSlug(tagId, permalink);
    const basePath = this.config.basePath || '';
    return `${basePath}/${this.config.tagsPagesPrefix}/${slug}/`;
  }

  getTags(): Map<string, ProcessedTag> {
    return this.processedTags || new Map();
  }

  getTag(tagId: string): ProcessedTag | undefined {
    return this.processedTags?.get(tagId);
  }

  getAllTagsSorted(): ProcessedTag[] {
    return Array.from(this.getTags().values())
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
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

  private buildPrerequisiteChain(tagId: string, visited = new Set<string>()): string[] {
    if (visited.has(tagId)) {
      this.logger.warn(`Circular prerequisite dependency detected for tag: ${tagId}`);
      return [];
    }

    const tag = this.processedTags?.get(tagId);
    if (!tag || !tag.prerequisites?.length) return [];

    visited.add(tagId);
    const chain: string[] = [];

    for (const prereqId of tag.prerequisites) {
      if (this.processedTags?.has(prereqId)) {
        chain.push(prereqId);
        // Recursively build chain for prerequisites - pass same visited Set to detect cycles
        const subChain = this.buildPrerequisiteChain(prereqId, visited);
        chain.push(...subChain);
      }
    }

    return Array.from(new Set(chain)); // Remove duplicates
  }

  private findRelatedTags(tagId: string): string[] {
    const currentTag = this.processedTags?.get(tagId);
    if (!currentTag) return [];

    const related: string[] = [];

    for (const [otherId, otherTag] of this.processedTags!) {
      if (otherId === tagId) continue;
      if (related.length >= MAX_RELATED_TAGS) break; // Early termination

      // Tags are related if they share subject or learning objectives
      if (currentTag.subject && currentTag.subject === otherTag.subject) {
        related.push(otherId);
      } else if (currentTag.learningObjectives?.some(obj =>
        otherTag.learningObjectives?.includes(obj)
      )) {
        related.push(otherId);
      }
    }

    return related;
  }

  private findNextSteps(tagId: string): string[] {
    const currentTag = this.processedTags?.get(tagId);
    if (!currentTag) return [];

    const nextSteps: string[] = [];
    const currentDifficultyIndex = currentTag.difficulty ?
      DIFFICULTY_ORDER.indexOf(currentTag.difficulty) : -1;

    for (const [otherId, otherTag] of this.processedTags!) {
      if (otherId === tagId) continue;

      // Check if this tag lists current tag as prerequisite
      if (otherTag.prerequisites?.includes(tagId)) {
        nextSteps.push(otherId);
      }
      // Or if it's the next difficulty level in the same subject
      else if (currentTag.subject === otherTag.subject &&
               otherTag.difficulty && currentDifficultyIndex >= 0) {
        const otherDifficultyIndex = DIFFICULTY_ORDER.indexOf(otherTag.difficulty);
        if (otherDifficultyIndex === currentDifficultyIndex + 1) {
          nextSteps.push(otherId);
        }
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

  getTagsBySubject(subject: string): ProcessedTag[] {
    return Array.from(this.getTags().values())
      .filter(tag => tag.subject === subject)
      .sort((a, b) => {
        const aDiff = a.difficulty ? DIFFICULTY_ORDER.indexOf(a.difficulty) : 0;
        const bDiff = b.difficulty ? DIFFICULTY_ORDER.indexOf(b.difficulty) : 0;
        return aDiff - bDiff;
      });
  }

  getTagsByContentType(contentType: 'lecture' | 'tutorial' | 'exercise' | 'reference' | 'assessment'): ProcessedTag[] {
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