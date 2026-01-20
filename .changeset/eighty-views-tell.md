---
'starlight-tags': minor
---

Add automatic sidebar injection and i18n support for tag labels

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

  i18n Support for Tag Labels

2. Tags now support localized labels and descriptions in tags.yml:

```
  tags:
    components:
      label:
        en: "Components"
        fr: "Composants"
```

  Thanks to @trueberryless for the inspiration.

  ---
