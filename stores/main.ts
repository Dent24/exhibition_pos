import { defineStore } from 'pinia'

// 定義資料庫中 Users 表的結構
interface UserProfile {
  nickname: string
  is_owner: boolean
  is_seller: boolean
}

export const useMainStore = defineStore('main', {
  state: () => ({
    profile: null as UserProfile | null,
    loading: false
  }),
  
  actions: {
    // 設定使用者資料
    setProfile(data: UserProfile | null) {
      this.profile = data
    },

    // 登出時清空資料
    clearProfile() {
      this.profile = null
    },

    // 從資料庫同步最新的使用者資料
    async fetchProfile() {
      const supabase = useSupabaseClient()
      const user = useSupabaseUser()

      if (!user.value) return

      this.loading = true
      try {
        const { data, error } = await supabase
          .from('Users')
          .select("nickname, is_owner, is_seller")
          .eq("Uid", user.value.sub)
          .single()

        if (error) throw error
        this.profile = data as UserProfile
      } catch (err) {
        console.error('Fetch profile error:', err)
      } finally {
        this.loading = false
      }
    }
  },

  getters: {
    isLoggedIn: (state) => !!state.profile,
    // 快速判斷權限的 Getter
    canManageBooth: (state) => state.profile?.is_owner || false,
    canSellProduct: (state) => state.profile?.is_seller || false
  }
})