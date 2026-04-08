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
          items: [
            { label: 'はじめに', slug: 'guide/getting-started' },
            { label: 'Design Loop', slug: 'guide/design-loop' },
            { label: 'Fullstack Loop', slug: 'guide/fullstack-loop' },
            { label: 'Continuous Loop', slug: 'guide/continuous-loop' },
          ],
        },
        {
          label: 'リファレンス',
          items: [
            { label: 'CLI', slug: 'reference/cli' },
            { label: '評価基準', slug: 'reference/evaluation-criteria' },
            { label: 'アーキテクチャ', slug: 'reference/architecture' },
            { label: 'モデル設定', slug: 'reference/config' },
          ],
        },
        {
          label: 'ブログ',
          items: [
            { label: '実装と実験', slug: 'blog/gan-design-loop' },
          ],
        },
      ],
      defaultLocale: 'ja',
      locales: { ja: { label: '日本語' } },
    }),
  ],
});
