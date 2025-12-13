import type { ProcessedTag } from '../schemas/tags.js';
import type { PluginConfig } from '../schemas/config.js';

export class TagValidationError extends Error {
  constructor(message: string, public tagId?: string, public pageId?: string) {
    super(message);
    this.name = 'TagValidationError';
  }
}

export function validateTags(
  tags: string[], 
  definedTags: Map<string, ProcessedTag>, 
  config: PluginConfig
): void {
  const undefinedTags = tags.filter(tag => !definedTags.has(tag));
  
  if (undefinedTags.length > 0) {
    const message = `Undefined tags found: ${undefinedTags.join(', ')}. Please define them in ${config.configPath}`;
    
    if (config.onInlineTagsNotFound === 'error') {
      throw new TagValidationError(message);
    }
  }
}

export function validateTagId(tagId: string): boolean {
  // Tag IDs should be alphanumeric with hyphens/underscores
  return /^[a-zA-Z0-9_-]+$/.test(tagId);
}

export function validateTagConfiguration(tagsConfig: any): string[] {
  const errors: string[] = [];
  
  if (!tagsConfig.tags || typeof tagsConfig.tags !== 'object') {
    errors.push('Tags configuration must have a "tags" object');
    return errors;
  }

  for (const [tagId, tagDef] of Object.entries(tagsConfig.tags)) {
    if (!validateTagId(tagId)) {
      errors.push(`Invalid tag ID "${tagId}": must contain only alphanumeric characters, hyphens, and underscores`);
    }
    
    if (!tagDef || typeof tagDef !== 'object') {
      errors.push(`Tag definition for "${tagId}" must be an object`);
      continue;
    }
    
    const definition = tagDef as any;
    if (!definition.label || typeof definition.label !== 'string') {
      errors.push(`Tag "${tagId}" must have a string "label" property`);
    }
    
    // Accept 3-digit (#f00) or 6-digit (#ff0000) hex colors
    if (definition.color && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(definition.color)) {
      errors.push(`Tag "${tagId}" color must be a valid hex color (e.g., #f00 or #ff0000)`);
    }
  }

  return errors;
}