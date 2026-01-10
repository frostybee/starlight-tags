---
'starlight-tags': minor
---

Allow passing multiple `label`s and `description`s for each locale in the tag configuration file.

Previously only simple `string`s were supported:

```yaml
tags:
  components:
    label: "Components"
    description: "UI components and their usage patterns"
    color: "#14b8a6"
    icon: "🧩"
    planTier: free
```

Now you can define `string`s for each locale:

```yaml
tags:
  components:
    label:
      en: "Components"
      fr: "Composants"
    description:
      en: "UI components and their usage patterns"
      fr: "Composants d'interface utilisateur et leurs modèles d'utilisation"
    color: "#14b8a6"
    icon: "🧩"
    planTier: free
```

Read more about this in the [Internationalization guide](https://frostybee.github.io/starlight-tags/guides/i18n/#translate-labels-and-descriptions).
