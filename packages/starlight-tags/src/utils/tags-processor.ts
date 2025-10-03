import fs from 'fs/promises';
import yaml from 'js-yaml';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import { tagsConfigSchema, type TagsConfig, type ProcessedTag } from '../schemas/tags.js';
import { validateTags } from './validation.js';
import type { PluginConfig } from '../schemas/config.js';

export class TagsProcessor {
  private config: PluginConfig;
  private logger: AstroIntegrationLogger;
  private astroConfig?: AstroConfig;
  private tagsData?: TagsConfig;
  private processedTags?: Map<string, ProcessedTag>;
  private providedDocsEntries?: any[];

  constructor(config: PluginConfig, logger: AstroIntegrationLogger, docsEntries?: any[]) {
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
      this.logger.error(`Failed to initialize tags: ${error.message}`);
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
      if (error.code === 'ENOENT') {
        this.logger.warn(`Tags configuration file not found: ${this.config.configPath} (tried: ${error.path || 'unknown path'})`);
        this.tagsData = { tags: {} };
      } else {
        throw new Error(`Invalid tags configuration: ${error.message}`);
      }
    }
  }

  private async processTagsData(): Promise<void> {
    if (!this.tagsData) return;

    this.processedTags = new Map();

    // Get all docs entries to calculate tag usage
    let docsEntries: any[] = [];

    if (this.providedDocsEntries) {
      // Use provided docs entries if available
      docsEntries = this.providedDocsEntries;
      this.logger.info(`Using ${docsEntries.length} provided docs entries`);
    } else {
      // Otherwise, try to fetch them dynamically
      try {
        // Dynamically import astro:content only when needed
        const { getCollection } = await import('astro:content');
        docsEntries = await getCollection('docs');
        this.logger.info(`Fetched ${docsEntries.length} docs entries from astro:content`);
      } catch (error) {
        // If astro:content is not available (e.g., during config phase), use empty array
        this.logger.warn('astro:content not available, skipping content collection processing');
        docsEntries = [];
      }
    }

    const tagUsage = new Map<string, Array<any>>();

    // Process frontmatter tags from all pages
    let totalTagsFound = 0;
    for (const entry of docsEntries) {
      const entryTags = entry.data.tags || [];
      totalTagsFound += entryTags.length;
      for (const tagId of entryTags) {
        if (!tagUsage.has(tagId)) {
          tagUsage.set(tagId, []);
        }
        tagUsage.get(tagId)!.push({
          id: entry.id,
          slug: entry.slug,
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
        slug: this.generateTagSlug(tagId),
        url: this.generateTagUrl(tagId),
        label: tagDef.label,
        description: tagDef.description,
        color: tagDef.color || this.tagsData.defaults?.color,
        permalink: tagDef.permalink,
        // Educational metadata
        difficulty: tagDef.difficulty,
        contentType: tagDef.contentType,
        subject: tagDef.subject,
        prerequisites: tagDef.prerequisites || [],
        learningObjectives: tagDef.learningObjectives || [],
        estimatedTime: tagDef.estimatedTime,
        skillLevel: tagDef.skillLevel,
        count: pages.length,
        pages: pages.map(page => ({
          ...page,
          tags: docsEntries.find(entry => entry.id === page.id)?.data.tags || [],
          frontmatter: docsEntries.find(entry => entry.id === page.id)?.data
        }))
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

  private async validateInlineTags(tagUsage: Map<string, Array<any>>): Promise<void> {
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

  private generateTagSlug(tagId: string): string {
    return tagId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  private generateTagUrl(tagId: string): string {
    const slug = this.generateTagSlug(tagId);
    const basePath = this.astroConfig?.base || '';
    return `${basePath}/${this.config.tagsPagesPrefix}/${slug}/`;
  }

  setAstroConfig(config: AstroConfig): void {
    this.astroConfig = config;
  }

  setBasePath(basePath: string): void {
    // Create a minimal AstroConfig object with just the base path
    this.astroConfig = { base: basePath } as AstroConfig;
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
        // Recursively build chain for prerequisites
        const subChain = this.buildPrerequisiteChain(prereqId, new Set(visited));
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

      // Tags are related if they share subject or learning objectives
      if (currentTag.subject && currentTag.subject === otherTag.subject) {
        related.push(otherId);
      } else if (currentTag.learningObjectives?.some(obj => 
        otherTag.learningObjectives?.includes(obj)
      )) {
        related.push(otherId);
      }
    }

    return related.slice(0, 5); // Limit to 5 most related
  }

  private findNextSteps(tagId: string): string[] {
    const currentTag = this.processedTags?.get(tagId);
    if (!currentTag) return [];

    const nextSteps: string[] = [];
    const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
    const currentDifficultyIndex = currentTag.difficulty ? 
      difficultyOrder.indexOf(currentTag.difficulty) : -1;

    for (const [otherId, otherTag] of this.processedTags!) {
      if (otherId === tagId) continue;

      // Check if this tag lists current tag as prerequisite
      if (otherTag.prerequisites?.includes(tagId)) {
        nextSteps.push(otherId);
      }
      // Or if it's the next difficulty level in the same subject
      else if (currentTag.subject === otherTag.subject && 
               otherTag.difficulty && currentDifficultyIndex >= 0) {
        const otherDifficultyIndex = difficultyOrder.indexOf(otherTag.difficulty);
        if (otherDifficultyIndex === currentDifficultyIndex + 1) {
          nextSteps.push(otherId);
        }
      }
    }

    return nextSteps.slice(0, 5); // Limit to 5 suggestions
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
        const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
        const aDiff = tag.difficulty ? difficultyOrder.indexOf(a.difficulty) : 0;
        const bDiff = tag.difficulty ? difficultyOrder.indexOf(b.difficulty) : 0;
        return aDiff - bDiff;
      });
  }

  getTagsByContentType(contentType: 'lecture' | 'tutorial' | 'exercise' | 'reference' | 'assessment'): ProcessedTag[] {
    return Array.from(this.getTags().values())
      .filter(tag => tag.contentType === contentType)
      .sort((a, b) => b.count - a.count);
  }

  validatePrerequisites(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [tagId, tag] of this.processedTags!) {
      for (const prereqId of tag.prerequisites || []) {
        if (!this.processedTags!.has(prereqId)) {
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

    const path: string[] = [startTagId];
    const visited = new Set([startTagId]);

    // Simple BFS to find path
    const queue = [startTagId];
    const parent = new Map<string, string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === endTagId) {
        // Reconstruct path
        const fullPath = [];
        let node = endTagId;
        while (node && parent.has(node)) {
          fullPath.unshift(node);
          node = parent.get(node)!;
        }
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