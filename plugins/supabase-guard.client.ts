// 攔截 Supabase 回應：資料/RPC 請求若回傳 400，
// 視為登入資訊失效 → 清除登入狀態並導向登入頁。
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const supabaseUrl: string =
    (config.public.supabase as any)?.url ?? "";

  if (!supabaseUrl || typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);
  let loggingOut = false;

  const resolveUrl = (input: RequestInfo | URL): string => {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    if (input instanceof Request) return input.url;
    return String(input ?? "");
  };

  const forceLogout = async () => {
    if (loggingOut) return;
    loggingOut = true;
    await nuxtApp.runWithContext(async () => {
      try {
        const supabase = useSupabaseClient();
        const mainStore = useMainStore();
        const router = useRouter();

        await supabase.auth.signOut();
        mainStore.clearProfile();

        if (router.currentRoute.value.path !== "/login") {
          await router.push("/login");
        }
      } catch (err) {
        console.error("自動登出失敗:", err);
      } finally {
        // 導向後重置旗標，避免下次登入再次失效時無法觸發
        loggingOut = false;
      }
    });
  };

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input as any, init);

    try {
      const url = resolveUrl(input);
      const isSupabase = url.startsWith(supabaseUrl);
      // 只攔截資料 / RPC 請求，排除 /auth/v1/（登入、登出本身也可能回 400）
      const isAuthEndpoint = url.includes("/auth/v1/");

      if (response.status === 400 && isSupabase && !isAuthEndpoint) {
        await forceLogout();
      }
    } catch {
      // 攔截判斷失敗時不影響原始回應
    }

    return response;
  };
});
