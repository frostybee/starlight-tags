import type { Plugin } from 'vite';
import type { PluginConfig } from '../schemas/config.js';

const CONFIG_MODULE_ID = 'virtual:starlight-tagging/config';
const RESOLVED_CONFIG_MODULE_ID = `\0${CONFIG_MODULE_ID}`;

/**
 * Creates the Vite plugin for Starlight Tags config virtual module.
 *
 * This module provides the plugin configuration to runtime code (data.ts).
 */
export function vitePluginStarlightTags(config: PluginConfig): Plugin {
  return {
    name: 'vite-plugin-starlight-tagging',
    resolveId(id) {
      if (id === CONFIG_MODULE_ID) {
        return RESOLVED_CONFIG_MODULE_ID;
      }
    },
    load(id) {
      if (id === RESOLVED_CONFIG_MODULE_ID) {
        return `export const config = ${JSON.stringify(config)};`;
      }
    },
  };
}
