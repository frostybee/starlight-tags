<h1 align="center">Starlight Tags</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/starlight-tags"><img src="https://img.shields.io/npm/v/starlight-tags.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="https://frostybee.github.io/starlight-tags/"><strong>Documentation</strong></a> ·
  <a href="https://frostybee.github.io/starlight-tags/configuration/">Configuration</a> ·
  <a href="https://github.com/frostybee/starlight-tags/releases">Releases</a>
</p>

A plugin for Starlight that adds tagging capabilities to your documentation pages, enabling content organization and discovery through tags.

## Features

- Define tags in a centralized `tags.yml` configuration file with descriptions and colors
- Display tags on documentation pages with customizable badge styling
- Auto-generated tag index page listing all available tags
- Individual tag pages showing all documents with a specific tag
- Pagination support for tag pages with configurable items per page
- Inline tag references in markdown content
- Sidebar component for tag navigation
- Full i18n support (English, French, Spanish, German)
- Accessible components with proper ARIA attributes

## Installation

Install the plugin using your preferred package manager:

```bash
npm install starlight-tags
```

## Quick Start

```js
// astro.config.mjs
import starlight from '@astrojs/starlight';
import { starlightTagsPlugin } from 'starlight-tags';

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightTagsPlugin()],
    }),
  ],
});
```

## Documentation

For comprehensive documentation, installation guides, configuration options, and examples, visit the [plugin documentation](https://frostybee.github.io/starlight-tags/).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

Licensed under the MIT License, Copyright © frostybee.

See [LICENSE](/LICENSE) for more information.

## Links

- [GitHub Repository](https://github.com/frostybee/starlight-tags)
- [npm Package](https://www.npmjs.com/package/starlight-tags)
- [Documentation](https://frostybee.github.io/starlight-tags/)
- [Issues](https://github.com/frostybee/starlight-tags/issues)
