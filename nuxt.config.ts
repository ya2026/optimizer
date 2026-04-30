// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'STEP 3D Web Tool',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        },
        {
          name: 'description',
          content: 'Front-end STEP 3D model coloring and export workspace built with Nuxt 3, TypeScript, and Three.js.'
        }
      ]
    }
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})
