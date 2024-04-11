import { defineConfig } from 'vitepress'
import version11 from './siders/version11'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Laravel 中文文档',
  lang: 'zh-cn',
  titleTemplate: 'Laravel 中文文档 | Laravel 文档 | Laravel 非官方中文文档',
  description: 'Laravel 中文文档是由 CatchAdmin 开发团队通过 ChatGPT4 对原官方文档进行翻译，对翻译有误的地方做了一部分调整',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  rewrites: {
    '11/(.*)': 'docs/11/(.*)'
  },
  sitemap: {
    hostname: 'https://laravel-docs.catchadmin.com/'
  },
  cleanUrls: true,
  themeConfig: {
    logo: '/logomark.min.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: '11.x',
        items: [
          { text: '11.x', link: '/docs/11/prologue/release' }
          // 添加其他版本链接...
        ]
      }
    ],
    sidebar: {
      // laravel 11
      '/docs/11/': version11
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    editLink: {
      pattern: 'https://github.com/JaguarJack/laravel-chinese-document/edit/master/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    outline: {
      level: 'deep',
      label: '页面导航'
    },
    lastUpdated: {
      text: '最近更新'
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/JaguarJack/laravel-chinese-document' }],
    search: {
      provider: 'local'
    }
  }
})
