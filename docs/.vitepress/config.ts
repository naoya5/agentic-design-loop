import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Agentic Design Loop',
  description: 'GAN-inspired multi-agent design & development loop',
  base: '/agentic-design-loop/',
  lang: 'ja',
  themeConfig: {
    nav: [
      { text: 'ガイド', link: '/guide/getting-started' },
      { text: 'リファレンス', link: '/reference/cli' },
      { text: 'ブログ', link: '/blog/gan-design-loop' },
    ],
    sidebar: [
      {
        text: 'ガイド',
        items: [
          { text: 'はじめに', link: '/guide/getting-started' },
          { text: 'Design Loop', link: '/guide/design-loop' },
          { text: 'Fullstack Loop', link: '/guide/fullstack-loop' },
          { text: 'Continuous Loop', link: '/guide/continuous-loop' },
        ],
      },
      {
        text: 'リファレンス',
        items: [
          { text: 'CLI', link: '/reference/cli' },
          { text: '評価基準', link: '/reference/evaluation-criteria' },
          { text: 'アーキテクチャ', link: '/reference/architecture' },
          { text: 'モデル設定', link: '/reference/config' },
        ],
      },
      {
        text: 'ブログ',
        items: [
          { text: '実装と実験', link: '/blog/gan-design-loop' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/naoya5/agentic-design-loop' },
    ],
    search: {
      provider: 'local',
    },
  },
})
