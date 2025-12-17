import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightTags from 'starlight-tags'

export default defineConfig({
  integrations: [
    starlight({
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
        es: { label: 'Español', lang: 'es' },
        de: { label: 'Deutsch', lang: 'de' },
      },
      editLink: {
        baseUrl: 'https://github.com/frostybee/starlight-tags/edit/main/docs/',
      },
      plugins: [
        starlightTags({
          configPath: 'tags.yml',
          tagsPagesPrefix: 'tags',
          tagsIndexSlug: 'tags',
          onInlineTagsNotFound: 'warn',
          enableFrontmatterTags: true
        }),
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: ['getting-started'],
        },
        {
          label: 'Guide',
          items: ['configuration', 'tags-definition', 'frontmatter', 'routes', 'extending-schema'],
        },
        {
          label: 'Components',
          autogenerate: {
            directory: 'components/',
          },
        },
        {
          label: 'Examples',
          autogenerate: {
            directory: 'examples/',
          },
        },
      ],
      social: [
        { href: 'https://github.com/frostybee/starlight-tags', icon: 'github', label: 'GitHub' },
      ],
      title: 'starlight-tags',
    }),
  ],
})
