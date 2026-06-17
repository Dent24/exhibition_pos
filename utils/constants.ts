// 全域常數（Nuxt 會自動 import）

/** 匿名訂單預設電話（顧客未留電話時使用） */
export const ANONYMOUS_PHONE = "0900000000";

/** POS 離線結帳佇列的 localStorage key */
export const QUEUE_STORAGE_KEY = "pos-checkout-queue";

/** 使用者 profile 持久化的 localStorage key（對應 stores/main.ts persist key） */
export const USER_STORE_KEY = "pos-user-store";
