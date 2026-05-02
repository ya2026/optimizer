// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'zh-CN'
      },
      title: 'STEP 三维处理工具',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        },
        {
          name: 'description',
          content: '基于 Nuxt 3、TypeScript 与 Three.js 构建的纯前端 STEP 三维模型处理、着色与导出工作台。'
        }
      ]
    }
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})
