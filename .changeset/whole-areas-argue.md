---
'starlight-tags': minor
---

feat: add 'create' mode for onInlineTagsNotFound (#5)

- Auto-create tags from frontmatter without requiring tags.yml.
Spaces in tag names are normalized to hyphens for the ID while
preserving the original string as the display label.