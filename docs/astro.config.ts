import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'
import starlightTags from 'starlight-tags'
import starlightThemeGalaxy from 'starlight-theme-galaxy'

export default defineConfig({
  site: 'https://frostybee.github.io',
  base: '/starlight-tags',  
  integrations: [
    starlight({
      title: 'Starlight Tags',
      favicon: '/images/tag-icon.svg',
      components: {
        Sidebar: './src/components/Sidebar.astro',
      },
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
        starlightLinksValidator({
          exclude: ['/starlight-tags/tags/', '/starlight-tags/tags/**'],
        }),
        starlightTags({
          configPath: 'tags.yml',
          tagsPagesPrefix: 'tags',
          tagsIndexSlug: 'tags',
          onInlineTagsNotFound: 'warn',
          enableFrontmatterTags: true,
          itemsPerPage: 2,
        }),
        //starlightThemeGalaxy()
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: ['getting-started'],
        },
        {
          label: 'Guides',
          items: ['guides/configuration', 'guides/tags-definition', 'guides/frontmatter', 'guides/routes', 'guides/extending-schema', 'guides/virtual-tags-module', 'guides/i18n', 'guides/architecture'],
        },
        {
          label: 'Plugin Components',
          autogenerate: {
            directory: 'components/',
          },
        },
        {
          label: 'Demos: Plugin Components',
          autogenerate: {
            directory: 'demos/',
          },
        },
        {
          label: 'Examples: Tagged Pages',
          autogenerate: {
            directory: 'examples/',
          },
        },
        {
          label: 'JavaScript Tutorial',
          autogenerate: {
            directory: 'educational/',
          },
        },
      ],
      social: [
        { href: 'https://github.com/frostybee/starlight-tags', icon: 'github', label: 'GitHub' },
      ],

    }),
  ],
})
