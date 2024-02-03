// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  content: {
    documentDriven: true
  },
  modules: [
    '@nuxt/content'
  ],
  devtools: { enabled: true },
  nitro: {
    plugins: ['plugins/content.ts']
  }
})
