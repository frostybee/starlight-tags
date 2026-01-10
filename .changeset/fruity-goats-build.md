---
'starlight-tags': minor
---

**Potential breaking change:** Now you need to pass the [current locale](https://starlight.astro.build/guides/i18n/#configure-i18n) to each component of `starlight-tags/components`.

- Here is an example in MDX:
  
  ```mdx
  <PageTags layout="inline" locale="en" />
  ```

- Here is an example in Astro which uses the [`locale`](https://starlight.astro.build/reference/route-data/#locale) from [Starlight's route data](https://starlight.astro.build/guides/route-data/):
  
  ```astro
  ---
  import { PageTags } from 'starlight-tags/components';
  const { locale } = Astro.locals.starlightRoute
  ---
  
  <PageTags layout="inline" {locale} />
  ```

Read more about this in the [Component guide](https://frostybee.github.io/starlight-tags/components/#common-props).
