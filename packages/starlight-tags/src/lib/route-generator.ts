import type { PluginConfig } from '../schemas/config.js';
import type { TagsProcessor } from './tags-processor.js';

export function generateTagRoutes(config: PluginConfig, processor: TagsProcessor) {
  const routes = [];
  
  // Generate routes for all tags
  const tags = processor.getAllTagsSorted();
  
  for (const tag of tags) {
    routes.push({
      pattern: `/${config.tagsPagesPrefix}/${tag.slug}`,
      entrypoint: 'starlight-plugin-tags/pages/tag-page.astro',
      params: { tag: tag.slug },
      props: { tag, pages: tag.pages }
    });
  }
  
  return routes;
}