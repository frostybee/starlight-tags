# starlight-tags

## 0.4.0

### Minor Changes

- fd972f8: feat: add 'create' mode for onInlineTagsNotFound (#5)
  - Auto-create tags from frontmatter without requiring tags.yml.
    Spaces in tag names are normalized to hyphens for the ID while
    preserving the original string as the display label.

## 0.3.0

### Minor Changes

- 278c3ad: Add automatic sidebar injection and i18n support for tag labels

  ### What's New
  1. Automatic Sidebar Injection

  Tags can now be automatically injected into Starlight's navigation sidebar without component overrides.

  ```
    starlightTags({
      sidebar: {
        enabled: true,
        position: 'top',
        limit: 8,
        sortBy: 'count',
        showCount: true,
      }
    })
  ```

  See the [sidebar integration](https://frostybee.github.io/starlight-tags/guides/sidebar-integration/) for details.

  i18n Support for Tag Labels 2. Tags now support localized labels and descriptions in tags.yml:

  ```
    tags:
      components:
        label:
          en: "Components"
          fr: "Composants"
  ```

  Thanks to @trueberryless for the inspiration.

  ***

## 0.2.0

### Minor Changes

- 23b322c: v0.2.0 - Middleware-Based Architecture

  ⚡ Breaking Change

  Replaced Vite virtual module with middleware-based data injection.
  - import { tags } from 'virtual:starlight-tags';
  * const { tags } = Astro.locals.starlightTags;

  What's New
  - Tag data now available via Astro.locals.starlightTags on all pages
  - New starlight-tags/data module with getTagsData() for getStaticPaths()
  - New starlight-tags/utils module with standalone utility functions
  - Per-locale caching with HMR support
  - Improved error handling and path validation
  - Fixed TypeScript errors in Astro components

  Migration

  See /guides/accessing-tag-data/ for the new API.

## 0.1.0

### Minor Changes

- 5c7e040: Initial public release
