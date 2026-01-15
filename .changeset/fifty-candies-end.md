---
'starlight-tags': minor
---

 v0.2.0 - Middleware-Based Architecture

  ⚡ Breaking Change

  Replaced Vite virtual module with middleware-based data injection.

  - import { tags } from 'virtual:starlight-tags';
  + const { tags } = Astro.locals.starlightTags;

  What's New

  - Tag data now available via Astro.locals.starlightTags on all pages
  - New starlight-tags/data module with getTagsData() for getStaticPaths()
  - New starlight-tags/utils module with standalone utility functions
  - Per-locale caching with HMR support
  - Improved error handling and path validation
  - Fixed TypeScript errors in Astro components

  Migration

  See /guides/accessing-tag-data/ for the new API.
