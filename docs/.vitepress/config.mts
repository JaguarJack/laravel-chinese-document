import { defineConfig } from 'vitepress'
import version11 from './siders/version11'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Laravel 中文文档',
  description: 'Laravel 中文文档',
  rewrites: {
    '11/(.*)': 'docs/11/(.*)'
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: '版本',
        items: [
          { text: '11', link: '/docs/11/prologue/release' }
          // 添加其他版本链接...
        ]
      }
    ],
    sidebar: {
      // laravel 11
      '/docs/11/': version11
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }]
  }
})
