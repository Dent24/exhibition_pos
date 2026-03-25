export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: '/exhibition_pos/', 
    buildAssetsDir: 'assets', // 避免 GitHub Pages 阻擋底線開頭的資料夾
  },
  modules: ['@pinia/nuxt', '@nuxtjs/supabase'],
  build: {
    transpile: ['vuetify'],
  },
  css: ['@/assets/scss/base.scss'],
  vite: {
    define: {
      'process.env.DEBUG': 'false',
    },
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/register'],
    }
  }
})
