import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://naoya5.github.io',
  base: '/agentic-design-loop',
  integrations: [
    starlight({
      title: 'Agentic Design Loop',
      description: 'GAN-inspired multi-agent design & development loop',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/naoya5/agentic-design-loop' },
      ],
      sidebar: [
        {
          label: 'ガイド',
          autogenerate: { directory: 'guide' },
        },
        {
          label: 'リファレンス',
          autogenerate: { directory: 'reference' },
        },
        {
          label: 'ブログ',
          autogenerate: { directory: 'blog' },
        },
      ],
    }),
  ],
});
