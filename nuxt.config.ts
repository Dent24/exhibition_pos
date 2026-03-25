export default defineNuxtConfig({
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
