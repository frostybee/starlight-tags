import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightTagging from 'starlight-tagging'

export default defineConfig({
  integrations: [
    starlight({
      editLink: {
        baseUrl: 'https://github.com/frostybee/starlight-tagging/edit/main/docs/',
      },
      plugins: [starlightTagging()],
      sidebar: [
        {
          label: 'Start Here',
          items: ['getting-started'],
        },
      ],
      social: [
        { href: 'https://github.com/frostybee/starlight-tagging', icon: 'github', label: 'GitHub' },
      ],
      title: 'starlight-tagging',
    }),
  ],
})
