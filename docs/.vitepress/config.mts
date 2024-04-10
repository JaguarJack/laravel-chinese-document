import { defineConfig } from 'vitepress'
import version11 from './siders/version11'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Laravel 中文文档',
  titleTemplate: 'Laravel 中文文档',

  description: 'Laravel 中文文档是由 CatchAdmin 开发团队通过 ChatGPT4 对原官方文档进行翻译，对翻译有误的地方做了一部分调整',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  rewrites: {
    '11/(.*)': 'docs/11/(.*)'
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
      provider: 'algolia',
      options: {
        appId: 'WRSQF53VLM',
        apiKey: '73077154043cf589b096bb8b13a886e3',
        indexName: 'laravel-catchadmin',
        locales: {
          zh: {
            placeholder: '搜索文档',
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                searchBox: {
                  resetButtonTitle: '清除查询条件',
                  resetButtonAriaLabel: '清除查询条件',
                  cancelButtonText: '取消',
                  cancelButtonAriaLabel: '取消'
                },
                startScreen: {
                  recentSearchesTitle: '搜索历史',
                  noRecentSearchesText: '没有搜索历史',
                  saveRecentSearchButtonTitle: '保存至搜索历史',
                  removeRecentSearchButtonTitle: '从搜索历史中移除',
                  favoriteSearchesTitle: '收藏',
                  removeFavoriteSearchButtonTitle: '从收藏中移除'
                },
                errorScreen: {
                  titleText: '无法获取结果',
                  helpText: '你可能需要检查你的网络连接'
                },
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                  searchByText: '搜索提供者'
                },
                noResultsScreen: {
                  noResultsText: '无法找到相关结果',
                  suggestedQueryText: '你可以尝试查询',
                  reportMissingResultsText: '你认为该查询应该有结果？',
                  reportMissingResultsLinkText: '点击反馈'
                }
              }
            }
          }
        }
      }
    }
  }
})
