// 全域路由守衛：集中處理登入導向與角色權限。
// 取代原本散落在 layouts/default.vue、clear.vue 的 watch 導向邏輯。

// 公開路由（免登入）
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// 攤主專屬路由
const OWNER_PATHS = [
  "/booth-settings",
  "/booth-products",
  "/sales-report",
  "/settlement-report",
];

// 賣家專屬路由
const SELLER_PATHS = [
  "/product-settings",
  "/seller-permissions",
  "/product-sales-report",
];

export default defineNuxtRouteMiddleware(async (to) => {
  // SPA 模式下僅在客戶端執行（避免 generate / prerender 期間呼叫 Supabase）
  if (import.meta.server) return;

  // 訂單查詢頁（顧客憑連結進入）與公開頁免驗證
  if (to.path.startsWith("/order/") || PUBLIC_PATHS.includes(to.path)) return;

  const supabase = useSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 未登入 → 導向登入頁
  if (!session) {
    return navigateTo("/login");
  }

  // 確保 profile 已載入（重新整理時 store 可能尚未同步）
  const store = useMainStore();
  if (!store.profile) {
    await store.fetchProfile();
  }
  const profile = store.profile;

  // 角色權限守衛：跨角色以 URL 直接存取時導回首頁
  const isOwnerRoute =
    OWNER_PATHS.includes(to.path) || to.path.startsWith("/pos");
  const isSellerRoute = SELLER_PATHS.includes(to.path);

  if (isOwnerRoute && !profile?.is_owner) {
    return navigateTo("/");
  }
  if (isSellerRoute && !profile?.is_seller) {
    return navigateTo("/");
  }
});
