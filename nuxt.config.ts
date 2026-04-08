export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: '/exhibition_pos/', 
    buildAssetsDir: 'assets', // 避免 GitHub Pages 阻擋底線開頭的資料夾
  },
  modules: ['@pinia/nuxt', '@nuxtjs/supabase', 'pinia-plugin-persistedstate/nuxt'],
  build: {
    transpile: ['vuetify'],
  },
  css: ['@/assets/scss/base.scss', 'vuetify/lib/styles/main.css',
    '@mdi/font/css/materialdesignicons.css'],
  vite: {
    define: {
      'process.env.DEBUG': 'false',
    },
  },
  supabase: {
    redirect: false
  }
})
