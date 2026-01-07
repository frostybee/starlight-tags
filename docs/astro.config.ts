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
        PageTitle: './src/components/PageTitleOverride.astro',
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
          configPath: 'src/config/tags.yml',
          tagsPagesPrefix: 'tags',
          tagsIndexSlug: 'tags',
          onInlineTagsNotFound: 'warn',
          enableFrontmatterTags: true,
          itemsPerPage: 4,
        }),
        // starlightThemeGalaxy()
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: ['getting-started', 'acknowledgements'],
        },
        {
          label: 'Guides',
          items: ['guides/configuration', 'guides/tags-definition', 'guides/frontmatter', 'guides/routes', 'guides/plugin-compatibility', 'guides/page-title-override', 'guides/extending-schema', 'guides/virtual-tags-module', 'guides/i18n', 'guides/architecture'],
        },
        {
          label: 'Plugin Components',
          collapsed:true,
          autogenerate: {
            directory: 'components/',
          },
        },
        {
          label: 'Demos: Plugin Components',
          collapsed:true,
          autogenerate: {
            directory: 'demos/',
          },
        },
        {
          label: 'Examples: Tagged Pages',
          collapsed:true,
          items: [
            {
              label: 'API Documentation',
              autogenerate: {
                directory: 'examples/',
              },
            },
            {
              label: 'Educational Content',
              autogenerate: {
                directory: 'educational/',
              },
            },
          ],
        },
      ],
      social: [
        { href: 'https://github.com/frostybee/starlight-tags', icon: 'github', label: 'GitHub' },
      ],

    }),
  ],
})
