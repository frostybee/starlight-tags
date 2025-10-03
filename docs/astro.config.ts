import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightTags from 'starlight-tags'

export default defineConfig({
  integrations: [
    starlight({
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
          label: 'Tagged Pages',
          autogenerate: {
            directory: 'php/',
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
