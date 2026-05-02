const appManifestPath = './.nuxt/manifest/meta/dev.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  experimental: {
    // This project does not rely on Nuxt app manifest features.
    // Disabling it avoids unstable internal manifest resolution in Windows dev mode.
    appManifest: false
  },
  alias: {
    '#app-manifest': appManifestPath
  },
  vite: {
    server: {
      hmr: {
        port: 24679
      }
    }
  },
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
