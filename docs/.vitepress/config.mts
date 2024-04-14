import { defineConfig } from 'vitepress'
import version11 from './siders/version11'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Laravel 中文文档',
  lang: 'zh-cn',
  titleTemplate: 'Laravel 中文文档 | Laravel 文档 | Laravel 非官方中文文档',
  description:
    'Laravel 中文文档是由 CatchAdmin 开发团队通过 ChatGPT4 对原官方文档进行翻译成 Laravel 中文，目前已翻译 Laravel 11 版本。Laravel 是一个极富表现力的 Web 开发框架，旨在为开发者提供优雅、高效的工具和功能，帮助开发者快速构建强大的 Web 应用程序。该框架采用了流行的 MVC（Model-View-Controller）架构模式，将应用程序的逻辑、数据和呈现层分离，使得代码更易于理解和维护。其核心功能包括数据库迁移和种子、强大的命令行工具 Artisan、优雅的 ORM 工具 Eloquent、灵活的路由系统等。其中，数据库迁移和种子功能使数据库管理更加简单和可控，而 Artisan 则提供了大量命令，用于执行常见任务，如创建控制器、模型等。Eloquent ORM 则允许开发者通过面向对象的方式来操作数据库，使得数据处理更加直观和方便。',
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
        text: 'Laravel开源后台',
        link: 'https://github.com/JaguarJack/catch-admin'
      },
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
