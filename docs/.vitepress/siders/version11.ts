export default [
  {
    text: '序言',
    collapsed: false,
    items: [
      { text: '发布说明', link: '/docs/11/prologue/release' },
      { text: '升级指南', link: '/docs/11/prologue/upgrade' },
      { text: '贡献指南', link: '/docs/11/prologue/contribution' }
    ]
  },
  {
    text: '入门指南',
    items: [
      { text: '安装', link: '/docs/11/getting-started/installation' },
      { text: '配置', link: '/docs/11/getting-started/configuration' },
      { text: '目录结构', link: '/docs/11/getting-started/structure' },
      { text: '前端', link: '/docs/11/getting-started/frontend' },
      { text: '起始套件', link: '/docs/11/getting-started/starter-kits' },
      { text: '部署', link: '/docs/11/getting-started/deployment' }
    ],
    collapsed: true
  },
  {
    text: '架构概念',
    items: [
      { text: '请求生命周期', link: '/docs/11/architecture-concepts/lifecycle' },
      { text: '服务容器', link: '/docs/11/architecture-concepts/container' },
      { text: '服务提供者', link: '/docs/11/architecture-concepts/providers' },
      { text: '门面', link: '/docs/11/architecture-concepts/facades' }
    ],
    collapsed: true
  },
  {
    text: '基础知识',
    items: [
      { text: '路由', link: '/docs/11/basics/routing' },
      { text: '中间件', link: '/docs/11/basics/middleware' },
      { text: 'CSRF 保护', link: '/docs/11/basics/csrf' },
      { text: '控制器', link: '/docs/11/basics/controllers' },
      { text: '请求', link: '/docs/11/basics/requests' },
      { text: '响应', link: '/docs/11/basics/responses' },
      { text: '视图', link: '/docs/11/basics/views' },
      { text: 'Blade 模板', link: '/docs/11/basics/blade' },
      { text: '资源捆绑(Vite)', link: '/docs/11/basics/vite' },
      { text: 'URL 生成', link: '/docs/11/basics/urls' },
      { text: '会话', link: '/docs/11/basics/session' },
      { text: '验证', link: '/docs/11/basics/validation' },
      { text: '错误处理', link: '/docs/11/basics/errors' },
      { text: '日志记录', link: '/docs/11/basics/logging' }
    ],
    collapsed: true
  },
  {
    text: '深入了解',
    items: [
      { text: 'Artisan 控制台', link: '/docs/11/digging-deeper/artisan' },
      { text: '广播', link: '/docs/11/digging-deeper/broadcasting' },
      { text: '缓存', link: '/docs/11/digging-deeper/cache' },
      { text: '集合', link: '/docs/11/digging-deeper/collections' },
      { text: '上下文', link: '/docs/11/digging-deeper/context' },
      { text: '契约', link: '/docs/11/digging-deeper/contracts' },
      { text: '事件', link: '/docs/11/digging-deeper/events' },
      { text: '文件存储', link: '/docs/11/digging-deeper/filesystem' },
      { text: '辅助函数', link: '/docs/11/digging-deeper/helpers' },
      { text: 'HTTP 客户端', link: '/docs/11/digging-deeper/http-client' },
      { text: '本地化', link: '/docs/11/digging-deeper/localization' },
      { text: '邮件', link: '/docs/11/digging-deeper/mail' },
      { text: '通知', link: '/docs/11/digging-deeper/notifications' },
      { text: '包开发', link: '/docs/11/digging-deeper/packages' },
      { text: '进程', link: '/docs/11/digging-deeper/processes' },
      { text: '队列', link: '/docs/11/digging-deeper/queues' },
      { text: '速率限制', link: '/docs/11/digging-deeper/rate-limiting' },
      { text: '字符串', link: '/docs/11/digging-deeper/strings' },
      { text: '任务调度', link: '/docs/11/digging-deeper/scheduling' }
    ],
    collapsed: true
  },
  {
    text: '安全',
    items: [
      { text: '认证', link: '/docs/11/security/authentication' },
      { text: '授权', link: '/docs/11/security/authorization' },
      { text: '电子邮件验证', link: '/docs/11/security/verification' },
      { text: '加密', link: '/docs/11/security/encryption' },
      { text: '哈希', link: '/docs/11/security/hashing' },
      { text: '密码重置', link: '/docs/11/security/passwords' }
    ],
    collapsed: true
  },
  {
    text: '数据库',
    items: [
      { text: '入门', link: '/docs/11/database/database' },
      { text: '查询构建器', link: '/docs/11/database/queries' },
      { text: '分页', link: '/docs/11/database/pagination' },
      { text: '数据迁移', link: '/docs/11/database/migrations' },
      { text: '数据填充', link: '/docs/11/database/seeding' },
      { text: 'Redis', link: '/docs/11/database/redis' }
    ],
    collapsed: true
  },
  {
    text: 'Eloquent ORM',
    items: [
      { text: '入门', link: '/docs/11/eloquent/eloquent' },
      { text: '关联关系', link: '/docs/11/eloquent/eloquent-relationships' },
      { text: '集合', link: '/docs/11/eloquent/eloquent-collections' },
      { text: '修改器 / 转换器', link: '/docs/11/eloquent/eloquent-mutators' },
      { text: 'API 资源', link: '/docs/11/eloquent/eloquent-resources' },
      { text: '序列化', link: '/docs/11/eloquent/eloquent-serialization' },
      { text: '工厂', link: '/docs/11/eloquent/eloquent-factories' }
    ],
    collapsed: true
  },
  {
    text: '测试',
    items: [
      { text: '入门', link: '/docs/11/testing/testing' },
      { text: 'HTTP 测试', link: '/docs/11/testing/http-tests' },
      { text: '控制台测试', link: '/docs/11/testing/console-tests' },
      { text: '浏览器测试', link: '/docs/11/testing/dusk' },
      { text: '数据库', link: '/docs/11/testing/database-testing' },
      { text: '模拟', link: '/docs/11/testing/mocking' }
    ],
    collapsed: true
  },
  {
    text: '套件',
    items: [
      { text: 'Breeze', link: '/docs/11/packages/starter-kits' },
      { text: 'Cashier (Stripe)', link: '/docs/11/packages/billing' },
      { text: 'Cashier (Paddle)', link: '/docs/11/packages/cashier-paddle' },
      { text: 'Dusk', link: '/docs/11/packages/dusk' },
      { text: 'Envoy', link: '/docs/11/packages/envoy' },
      { text: 'Fortify', link: '/docs/11/packages/fortify' },
      { text: 'Folio', link: '/docs/11/packages/folio' },
      { text: 'Homestead', link: '/docs/11/packages/homestead' },
      { text: 'Horizon', link: '/docs/11/packages/horizon' },
      { text: 'Jetstream', link: '/docs/11/packages/jetstream' },
      { text: 'Mix', link: '/docs/11/packages/mix' },
      { text: 'Octane', link: '/docs/11/packages/octane' },
      { text: 'Passport', link: '/docs/11/packages/passport' },
      { text: 'Pennant', link: '/docs/11/packages/pennant' },
      { text: 'Pint', link: '/docs/11/packages/pint' },
      { text: 'Precognition', link: '/docs/11/packages/precognition' },
      { text: 'Prompts', link: '/docs/11/packages/prompts' },
      { text: 'Pulse', link: '/docs/11/packages/pulse' },
      { text: 'Reverb', link: '/docs/11/packages/reverb' },
      { text: 'Sail', link: '/docs/11/packages/sail' },
      { text: 'Sanctum', link: '/docs/11/packages/sanctum' },
      { text: 'Scout', link: '/docs/11/packages/scout' },
      { text: 'Socialite', link: '/docs/11/packages/socialite' }
    ],
    collapsed: true
  }
]
